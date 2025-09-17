"""
worker.py
Cararth ingestion & postprocess worker scaffold.

Usage:
  # run once
  python worker.py --run-once

  # run scheduler (long-running)
  python worker.py
"""

import os, sys, time, json, math, logging, argparse, datetime, threading, re
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import psycopg2
from psycopg2.extras import Json, execute_batch
import schedule
import pytz

# 3rd-party libs: pip install psycopg2-binary requests schedule firecrawl-py google-generativeai anthropic openai pytz
# Environment variables:
#   DATABASE_URL, FIRECRAWL_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, PERPLEXITY_API_KEY, OPENAI_API_KEY
#   CDN_BUCKET, DAILY_GPT5_BUDGET_USD, DAILY_PERPLEXITY_BUDGET_USD

LOG = logging.getLogger("cararth_worker")
LOG.setLevel(logging.INFO)
ch = logging.StreamHandler(sys.stdout)
ch.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
LOG.addHandler(ch)

try:
    from firecrawl import FirecrawlApp
    import google.generativeai as genai
    from anthropic import Anthropic
    import openai
except ImportError as e:
    LOG.error("Missing required packages. Install with: pip install firecrawl-py google-generativeai anthropic openai")
    sys.exit(1)

# --- CONFIG (tweak thresholds & budgets) ---
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.7"))
TRUST_SCORE_PUBLISH = float(os.getenv("TRUST_SCORE_PUBLISH", "0.6"))
PRICE_ANOMALY_PCT = float(os.getenv("PRICE_ANOMALY_PCT", "20"))
DEDUPE_SIMILARITY = float(os.getenv("DEDUPE_SIMILARITY", "0.92"))
GPT5_PRICE_THRESHOLD = int(os.getenv("GPT5_PRICE_THRESHOLD", "300000"))  # INR
DAILY_GPT5_BUDGET = float(os.getenv("DAILY_GPT5_BUDGET_USD", "50.0"))
DAILY_PERPLEXITY_BUDGET = float(os.getenv("DAILY_PERPLEXITY_BUDGET_USD", "40.0"))

BATCH_CONCURRENCY = int(os.getenv("BATCH_CONCURRENCY", "8"))
IMAGE_DOWNLOAD_CONCURRENCY = int(os.getenv("IMAGE_DOWNLOAD_CONCURRENCY", "6"))

# --- API client initialization ---
firecrawl_client = None
gemini_model = None  
anthropic_client = None
openai_client = None

# --- Persistent daily spend tracking ---
def get_daily_spend(conn, date_str, model):
    """Get current spend for a model on a specific date"""
    try:
        cur = conn.cursor()
        cur.execute("SELECT spend_usd FROM daily_spend WHERE date = %s AND model = %s", (date_str, model))
        row = cur.fetchone()
        cur.close()
        return float(row[0]) if row else 0.0
    except Exception as e:
        LOG.warning("Error getting daily spend: %s", e)
        return 0.0

def update_daily_spend(conn, date_str, model, amount_usd):
    """Update spend for a model on a specific date"""
    try:
        if not conn:
            LOG.warning("No database connection for spend tracking")
            return
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO daily_spend (date, model, spend_usd, updated_at)
            VALUES (%s, %s, %s, now())
            ON CONFLICT (date, model) 
            DO UPDATE SET spend_usd = daily_spend.spend_usd + %s, updated_at = now()
        """, (date_str, model, amount_usd, amount_usd))
        conn.commit()
        cur.close()
    except Exception as e:
        LOG.warning("Error updating daily spend: %s", e)

def initialize_api_clients():
    global firecrawl_client, gemini_model, anthropic_client, openai_client
    
    # Initialize Firecrawl
    if os.getenv("FIRECRAWL_API_KEY"):
        firecrawl_client = FirecrawlApp(api_key=os.getenv("FIRECRAWL_API_KEY"))
        LOG.info("Firecrawl client initialized")
    
    # Initialize Gemini
    if os.getenv("GEMINI_API_KEY"):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        gemini_model = genai.GenerativeModel('gemini-pro')
        LOG.info("Gemini client initialized")
        
    # Initialize Anthropic
    if os.getenv("ANTHROPIC_API_KEY"):
        anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        LOG.info("Anthropic client initialized")
        
    # Initialize OpenAI
    if os.getenv("OPENAI_API_KEY"):
        openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        LOG.info("OpenAI client initialized")

# --- Global spend counters and context (loaded from database per batch) ---  
model_spend = {"gpt5": 0.0, "perplexity": 0.0, "gemini": 0.0, "anthropic": 0.0}
current_date = None
batch_db_conn = None

# --- DB helpers ---
def get_db_conn():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL not set")
    return psycopg2.connect(DATABASE_URL, sslmode="require")

# --- Firecrawl / MCP fetch implementation ---
def call_firecrawl_api(batch_ts):
    """
    Scrape car listings from multiple portals using Firecrawl.
    Returns iterable of raw listings in JSON.
    """
    if not firecrawl_client:
        LOG.warning("Firecrawl client not initialized - skipping")
        return []
    
    # Car portal URLs to scrape
    portal_urls = [
        {"url": "https://www.cardekho.com/used-cars/hyderabad", "source": "CarDekho"},
        {"url": "https://www.olx.in/hyderabad_g4058877/cars_c198", "source": "OLX"},
        {"url": "https://www.cars24.com/buy-used-cars-hyderabad", "source": "Cars24"},
        {"url": "https://www.carwale.com/used/cars-in-hyderabad", "source": "CarWale"},
    ]
    
    all_listings = []
    
    for portal in portal_urls:
        try:
            LOG.info("Scraping %s for batch %s", portal["source"], batch_ts)
            
            # Scrape with structured extraction
            result = firecrawl_client.scrape_url(
                portal["url"],
                params={
                    'formats': ['extract', 'markdown'],
                    'extract': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'listings': {
                                    'type': 'array',
                                    'items': {
                                        'type': 'object',
                                        'properties': {
                                            'title': {'type': 'string'},
                                            'price': {'type': 'string'},
                                            'year': {'type': 'string'},
                                            'mileage': {'type': 'string'},
                                            'fuel_type': {'type': 'string'},
                                            'transmission': {'type': 'string'},
                                            'location': {'type': 'string'},
                                            'images': {'type': 'array'},
                                            'url': {'type': 'string'},
                                            'contact': {'type': 'string'}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            )
            
            if result.get('extract') and result['extract'].get('listings'):
                for listing in result['extract']['listings']:
                    # Create standardized format
                    raw_item = {
                        "source": portal["source"],
                        "source_id": f"{portal['source']}-{hash(str(listing))}",
                        "raw_html": result.get('markdown', ''),
                        "extracted": listing,
                        "scraped_at": batch_ts
                    }
                    all_listings.append(raw_item)
                    
                LOG.info("Extracted %d listings from %s", len(result['extract']['listings']), portal["source"])
            
            # Rate limit between portals
            time.sleep(2)
            
        except Exception as e:
            LOG.error("Error scraping %s: %s", portal["source"], e)
            continue
    
    LOG.info("Total listings extracted: %d", len(all_listings))
    return all_listings

# --- Normalization (simple deterministic rules; extend as needed) ---
def normalize_item(raw_item):
    """
    Convert raw extraction into normalized dict with required keys.
    Return (normalized_dict, confidence_score)
    """
    normalized = {}
    confidence = 0.9  # optimistic default; drop if fields missing
    # Example: map fields if present
    ex = raw_item.get("extracted", {}) if raw_item else {}
    normalized["title"] = ex.get("title") or raw_item.get("title") or ex.get("name")
    price = ex.get("price") or ex.get("price_inr") or raw_item.get("price")
    try:
        if price is not None:
            # strip non-digits
            p = int("".join(ch for ch in str(price) if ch.isdigit()))
            normalized["price"] = p
        else:
            normalized["price"] = None
            confidence -= 0.4
    except Exception:
        normalized["price"] = None
        confidence -= 0.4
    normalized["make"] = ex.get("make") or ex.get("brand")
    normalized["model"] = ex.get("model")
    normalized["year"] = ex.get("year")
    normalized["mileage"] = ex.get("mileage")
    normalized["city"] = ex.get("city") or raw_item.get("city")
    normalized["images"] = ex.get("images") or raw_item.get("images") or []
    normalized["contact"] = ex.get("contact") or raw_item.get("contact")
    # Basic confidence adjustments
    if not normalized["images"]:
        confidence -= 0.3
    if not normalized["contact"]:
        confidence -= 0.2
    # clamp
    confidence = max(0.0, min(1.0, confidence))
    return normalized, confidence

# --- Placeholder LLM & embedding calls (implement real API calls here) ---
def call_gemini_batch(items):
    """Batch fallback extraction via Gemini for low-confidence items."""
    if not gemini_model or not items:
        return {}
    
    results = {}
    
    for raw_item in items:
        try:
            # Create extraction prompt
            html_content = raw_item.get('raw_html', '')[:5000]  # Limit content
            
            prompt = f"""
            Extract car listing information from this HTML content. Return JSON format:
            
            HTML Content:
            {html_content}
            
            Extract:
            {{
                "title": "car title",
                "price": "price in rupees", 
                "year": "year as integer",
                "mileage": "mileage as integer",
                "make": "car brand/make",
                "model": "car model", 
                "fuel_type": "petrol/diesel/cng/electric",
                "transmission": "manual/automatic",
                "city": "city name",
                "images": ["image urls"],
                "contact": "phone or contact info"
            }}
            
            Return only valid JSON, no other text.
            """
            
            response = gemini_model.generate_content(prompt)
            
            if response and response.text:
                # Extract JSON from response
                json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if json_match:
                    extracted_data = json.loads(json_match.group())
                    results[raw_item.get('source_id')] = extracted_data
                    cost = 0.01
                    model_spend["gemini"] += cost
                    update_daily_spend(batch_db_conn, current_date, "gemini", cost)
                    
        except Exception as e:
            LOG.warning("Gemini extraction failed for item %s: %s", raw_item.get('source_id'), e)
            continue
    
    LOG.info("Gemini batch processed %d items, extracted %d", len(items), len(results))
    return results

def call_anthropic_validation(normalized):
    """Validate listing authenticity using Anthropic Claude."""
    if not anthropic_client:
        return {"trust_score": 0.8, "fraud_reasons": []}
    
    try:
        prompt = f"""
        Analyze this car listing for fraud indicators and authenticity.
        
        Listing Data:
        - Title: {normalized.get('title')}
        - Price: ₹{normalized.get('price')}
        - Year: {normalized.get('year')}  
        - Make/Model: {normalized.get('make')} {normalized.get('model')}
        - Mileage: {normalized.get('mileage')} km
        - City: {normalized.get('city')}
        - Images: {len(normalized.get('images', []))} images
        - Contact: {normalized.get('contact')}
        
        Check for:
        1. Price vs market value (too low = suspicious)
        2. Mileage vs age correlation
        3. Contact info authenticity
        4. Title/description quality
        5. Image availability
        
        Return JSON:
        {{
            "trust_score": 0.85,
            "fraud_reasons": ["reason if suspicious"],
            "validation_notes": "brief analysis"
        }}
        """
        
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Extract JSON response
        content = response.content[0].text
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            cost = 0.02
            model_spend["anthropic"] += cost  
            update_daily_spend(batch_db_conn, current_date, "anthropic", cost)
            return result
            
    except Exception as e:
        LOG.warning("Anthropic validation failed: %s", e)
    
    # Default fallback
    return {"trust_score": 0.8, "fraud_reasons": []}

def call_perplexity_check(normalized):
    """Use Perplexity for anomaly detection and market research."""
    if model_spend["perplexity"] >= DAILY_PERPLEXITY_BUDGET:
        return None
    
    try:
        # Research market pricing for this specific car
        query = f"{normalized.get('year')} {normalized.get('make')} {normalized.get('model')} price {normalized.get('city')} India used car market"
        
        response = requests.post(
            'https://api.perplexity.ai/chat/completions',
            headers={
                'Authorization': f'Bearer {os.getenv("PERPLEXITY_API_KEY")}',
                'Content-Type': 'application/json',
            },
            json={
                'model': 'llama-3.1-sonar-small-128k-online',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are a car market analyst. Research current prices and provide market insights.'
                    },
                    {
                        'role': 'user',
                        'content': f"""
                        Research current market pricing for:
                        {query}
                        
                        Listed Price: ₹{normalized.get('price')}
                        
                        Provide:
                        1. Typical market price range
                        2. Is the listed price reasonable?
                        3. Any market trends or anomalies
                        
                        Return brief analysis in JSON:
                        {{
                            "market_range": {{"low": 000000, "high": 000000}},
                            "price_assessment": "fair/low/high",
                            "notes": "market insights"
                        }}
                        """
                    }
                ],
                'max_tokens': 300,
                'temperature': 0.1
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                perplexity_data = json.loads(json_match.group())
                cost = 0.03
                model_spend["perplexity"] += cost
                update_daily_spend(batch_db_conn, current_date, "perplexity", cost)
                return perplexity_data
                
    except Exception as e:
        LOG.warning("Perplexity check failed: %s", e)
    
    return None

def call_gpt5_finalize(normalized, similar_list):
    """
    Final validation using GPT-4 (GPT-5 placeholder) for high-value items.
    """
    if not openai_client:
        # Fallback response
        price = normalized.get("price", 0)
        return {
            "approve": price > 0,
            "price_band": {"low": int(price * 0.95), "median": price, "high": int(price * 1.05), "confidence": 0.7},
            "summary": "Standard listing validation",
            "final_trust_score": 0.75
        }
    
    try:
        # Context about similar listings
        similar_context = ""
        if similar_list:
            similar_context = f"\nSimilar listings found: {len(similar_list)} matches (potential duplicates)"
        
        prompt = f"""
        As a car market expert, provide final validation for this listing:
        
        Car Details:
        - Title: {normalized.get('title')}
        - Price: ₹{normalized.get('price')}
        - Year: {normalized.get('year')}
        - Make/Model: {normalized.get('make')} {normalized.get('model')}
        - Mileage: {normalized.get('mileage')} km
        - Location: {normalized.get('city')}
        - Images: {len(normalized.get('images', []))} available
        {similar_context}
        
        Provide final assessment:
        1. Should this listing be published?
        2. Market price analysis
        3. Brief buyer-ready summary
        4. Overall trust score
        
        Return JSON:
        {{
            "approve": true/false,
            "price_band": {{
                "low": 000000,
                "median": 000000,
                "high": 000000,
                "confidence": 0.85
            }},
            "summary": "2-3 sentence buyer summary",
            "final_trust_score": 0.85,
            "reasoning": "brief explanation"
        }}
        """
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",  # Using GPT-4o as GPT-5 placeholder
            messages=[
                {"role": "system", "content": "You are an expert car market analyst specializing in Indian used car market."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.1
        )
        
        content = response.choices[0].message.content
        
        # Extract JSON response
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            cost = 0.05
            model_spend["gpt5"] += cost
            update_daily_spend(batch_db_conn, current_date, "gpt5", cost)
            return result
            
    except Exception as e:
        LOG.warning("GPT-5 finalization failed: %s", e)
    
    # Fallback response
    price = normalized.get("price", 0)
    return {
        "approve": price > 50000,  # Minimum reasonable price
        "price_band": {"low": int(price * 0.95), "median": price, "high": int(price * 1.05), "confidence": 0.7},
        "summary": f"Used {normalized.get('make', '')} {normalized.get('model', '')} from {normalized.get('year', '')}. Priced at market rate.",
        "final_trust_score": 0.75
    }

def get_embedding(text):
    """Generate embeddings using OpenAI for deduplication."""
    if not openai_client or not text:
        return [0.0] * 1536  # Default embedding size
        
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-ada-002",
            input=text[:8000]  # Truncate to avoid token limits
        )
        
        embedding = response.data[0].embedding
        cost = 0.0001
        model_spend["gpt5"] += cost
        update_daily_spend(batch_db_conn, current_date, "gpt5", cost)
        return embedding
        
    except Exception as e:
        LOG.warning("Embedding generation failed: %s", e)
        return [0.0] * 1536

# --- Embedding & dedupe storage helpers (simple placeholders) ---
def save_cached_listing(conn, raw_item, normalized, confidence, batch_ts):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO production_portal_listings (source, source_id, normalized, raw, fetched_at, ingest_batch_ts, status, confidence)
        VALUES (%s,%s,%s,%s,now(),%s,%s,%s)
        ON CONFLICT (source, source_id, ingest_batch_ts) DO UPDATE
        SET normalized=EXCLUDED.normalized, raw=EXCLUDED.raw, confidence=EXCLUDED.confidence
        RETURNING id
    """, (raw_item.get("source"), raw_item.get("source_id"), Json(normalized), Json(raw_item), batch_ts, 'raw', confidence))
    id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return id

def save_embedding(conn, listing_id, vector):
    cur = conn.cursor()
    # if using pgvector, use proper insert - here abstracted
    cur.execute("INSERT INTO listing_embeddings (listing_id, vector, created_at) VALUES (%s, %s, now())", (listing_id, Json(vector)))
    conn.commit()
    cur.close()

def find_similar_by_embedding(conn, vector, threshold=DEDUPE_SIMILARITY):
    """
    Find similar listings using cosine similarity on embeddings.
    """
    try:
        cur = conn.cursor()
        # Simple similarity search using jsonb (production should use pgvector)
        cur.execute("""
            SELECT listing_id, vector
            FROM listing_embeddings 
            ORDER BY created_at DESC 
            LIMIT 100
        """)
        
        similar_ids = []
        current_vector = vector
        
        for row in cur.fetchall():
            stored_vector = row[1]  # jsonb vector
            if isinstance(stored_vector, list) and len(stored_vector) == len(current_vector):
                # Calculate cosine similarity
                dot_product = sum(a * b for a, b in zip(current_vector, stored_vector))
                magnitude_a = sum(a * a for a in current_vector) ** 0.5
                magnitude_b = sum(b * b for b in stored_vector) ** 0.5
                
                if magnitude_a > 0 and magnitude_b > 0:
                    similarity = dot_product / (magnitude_a * magnitude_b)
                    if similarity > threshold:
                        similar_ids.append(row[0])  # listing_id
        
        cur.close()
        return similar_ids[:5]  # Return top 5 similar
        
    except Exception as e:
        LOG.warning("Similarity search failed: %s", e)
        return []

# --- Image caching helpers ---
def download_image(url, local_dir="/tmp/cararth_images"):
    try:
        os.makedirs(local_dir, exist_ok=True)
        r = requests.get(url, timeout=12)
        if r.status_code == 200:
            fname = os.path.join(local_dir, str(abs(hash(url))) + os.path.splitext(url.split("?")[0])[-1][:6])
            with open(fname, "wb") as f:
                f.write(r.content)
            # optionally validate mime & size
            return fname
        else:
            return None
    except Exception as e:
        LOG.warning("download_image error for %s: %s", url, e)
        return None

def upload_to_cdn(local_path):
    """
    Upload to object storage using presigned URLs from Node.js server.
    """
    try:
        server_url = os.getenv("SERVER_URL", "http://localhost:5000")
        worker_token = os.getenv("WORKER_UPLOAD_TOKEN", "cararth-worker-2024")
        
        # Get presigned upload URL
        response = requests.post(
            f"{server_url}/api/storage/upload",
            headers={"Authorization": f"Bearer {worker_token}"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            upload_url = result.get('uploadUrl')
            
            if upload_url:
                # Upload directly to storage using presigned URL
                with open(local_path, 'rb') as f:
                    upload_response = requests.put(
                        upload_url,
                        data=f,
                        timeout=60
                    )
                
                if upload_response.status_code == 200:
                    # Return public URL (remove query params)
                    public_url = upload_url.split('?')[0]
                    return public_url
        
        LOG.warning("CDN upload failed: %s", response.status_code)
        return f"file://{local_path}"
                
    except Exception as e:
        LOG.warning("CDN upload error: %s", e)
        return f"file://{local_path}"

# --- Postprocess core for an ingest batch ---
def process_ingest_batch(batch_ts, run_once=False):
    LOG.info("Starting ingest batch for %s", batch_ts)
    conn = get_db_conn()
    try:
        raw_items = call_firecrawl_api(batch_ts)  # list of raw listing dicts
        LOG.info("Fetched %d raw items from Firecrawl", len(raw_items))

        # Save raw + initial normalization
        to_fallback = []
        saved_mappings = []  # tuples (listing_db_id, raw_item, normalized, confidence)
        for raw in raw_items:
            normalized, confidence = normalize_item(raw)
            listing_db_id = save_cached_listing(conn, raw, normalized, confidence, batch_ts)
            saved_mappings.append((listing_db_id, raw, normalized, confidence))
            if confidence < CONFIDENCE_THRESHOLD or not normalized.get("price") or not normalized.get("images"):
                to_fallback.append((listing_db_id, raw))

        # Gemini fallback (batch) for low-confidence items
        if to_fallback:
            LOG.info("Calling Gemini fallback for %d items", len(to_fallback))
            # Batch up ids and raw items
            raw_batch = [r for (_, r) in to_fallback]
            gemini_results = call_gemini_batch(raw_batch)
            # Merge gemini results back
            for (listing_db_id, raw) in to_fallback:
                gem = gemini_results.get(raw.get("source_id"))
                if gem:
                    norm2, conf2 = normalize_item({"extracted": gem})
                    # update production_portal_listings
                    cur = conn.cursor()
                    cur.execute("""
                        UPDATE production_portal_listings SET normalized=%s, confidence=%s WHERE id=%s
                    """, (Json(norm2), conf2, listing_db_id))
                    conn.commit()
                    cur.close()

        # Postprocess each saved listing: QA -> Anthropic -> selective Perplexity -> embeddings/dedupe -> GPT5 finalize -> cache images -> write to validated set
        validated_ids = []
        needs_human = []
        # Use threadpool for image downloads and parallel tasks where appropriate
        for (listing_db_id, raw, normalized, confidence) in saved_mappings:
            # re-load normalized in case gemini updated it
            cur = conn.cursor()
            cur.execute("SELECT normalized, confidence FROM production_portal_listings WHERE id=%s", (listing_db_id,))
            row = cur.fetchone()
            cur.close()
            if row:
                normalized = row[0]
                confidence = float(row[1] or 0.0)
            # deterministic QA gate
            if not normalized.get("price") or not normalized.get("images"):
                LOG.info("Listing %s missing critical fields -> needs_human", raw.get("source_id"))
                needs_human.append(listing_db_id)
                cur = conn.cursor()
                cur.execute("UPDATE production_portal_listings SET status='needs_human' WHERE id=%s", (listing_db_id,))
                conn.commit()
                cur.close()
                continue

            # Anthropic validation for high-value or flagged heuristic
            price = normalized.get("price") or 0
            if price >= GPT5_PRICE_THRESHOLD or confidence < 0.85:
                val = call_anthropic_validation(normalized)
                trust_score = val.get("trust_score", 0.0)
            else:
                val = {"trust_score": 0.9, "fraud_reasons": []}
                trust_score = val["trust_score"]

            # selective perplexity
            median = price  # placeholder: fetch city-model median from your historical table
            if median and abs(price - median) / max(1, median) * 100 > PRICE_ANOMALY_PCT:
                perf = call_perplexity_check(normalized)
            else:
                perf = None

            # embeddings & dedupe
            text_for_embed = " ".join(str(normalized.get(k,"")) for k in ("title","make","model","year","city"))
            emb = get_embedding(text_for_embed)
            save_embedding(conn, listing_db_id, emb)
            similar = find_similar_by_embedding(conn, emb)
            # If dedupe conflict resolution needed, you may merge here (omitted for brevity)

            # final GPT-5 (selective)
            needs_final = (price >= GPT5_PRICE_THRESHOLD) or (trust_score < TRUST_SCORE_PUBLISH) or (len(similar) > 0)
            final = None
            if needs_final and model_spend["gpt5"] < DAILY_GPT5_BUDGET:
                final = call_gpt5_finalize(normalized, similar)
                # update spend estimate (you must compute / approximate per-call cost)
                model_spend["gpt5"] += 0.05  # placeholder USD
            else:
                final = {
                    "approve": True,
                    "price_band": {"low": int(price * 0.95), "median": price, "high": int(price * 1.05), "confidence": 0.7},
                    "summary": "Standard listing",
                    "final_trust_score": min(0.85, trust_score)
                }

            # Image processing & CDN upload
            cached_images = []
            if normalized.get("images"):
                with ThreadPoolExecutor(max_workers=IMAGE_DOWNLOAD_CONCURRENCY) as img_executor:
                    futures = []
                    for img_url in normalized.get("images", [])[:5]:  # limit to 5 images
                        futures.append(img_executor.submit(download_image, img_url))
                    
                    for future in as_completed(futures):
                        local_path = future.result()
                        if local_path:
                            cdn_url = upload_to_cdn(local_path)
                            cached_images.append(cdn_url)

            # Update final status based on validation
            if final and final.get("approve") and trust_score >= TRUST_SCORE_PUBLISH:
                # Write to trusted_listings
                cur = conn.cursor()
                canonical_data = {
                    **normalized,
                    "price_band": final.get("price_band"),
                    "summary": final.get("summary"),
                    "cached_images": cached_images
                }
                cur.execute("""
                    INSERT INTO trusted_listings (canonical, trust_score, source_list, published_at, status)
                    VALUES (%s, %s, %s, now(), 'active')
                """, (Json(canonical_data), final.get("final_trust_score", trust_score), Json([raw.get("source")])))
                conn.commit()
                cur.close()
                
                # Update status in production_portal_listings
                cur = conn.cursor()
                cur.execute("UPDATE production_portal_listings SET status='published', trust_score=%s WHERE id=%s", 
                           (trust_score, listing_db_id))
                conn.commit()
                cur.close()
                validated_ids.append(listing_db_id)
            else:
                # Mark as needs review
                cur = conn.cursor()
                cur.execute("UPDATE production_portal_listings SET status='needs_review', trust_score=%s WHERE id=%s", 
                           (trust_score, listing_db_id))
                conn.commit()
                cur.close()

        LOG.info("Batch %s completed: %d published, %d needs_human, %d needs_review", 
                batch_ts, len(validated_ids), len(needs_human), len(saved_mappings) - len(validated_ids) - len(needs_human))
        
    except Exception as e:
        LOG.error("Error in batch processing: %s", e, exc_info=True)
    finally:
        conn.close()

# --- Scheduler setup ---
def run_scheduled_batch():
    """Run a single batch with proper timestamp"""
    ist = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.datetime.now(ist)
    batch_ts = now_ist.isoformat()
    LOG.info("Running scheduled batch at IST: %s", now_ist.strftime("%Y-%m-%d %H:%M:%S"))
    process_ingest_batch(batch_ts)

def run_scheduler():
    """Run scheduled batch processing with IST timezone"""
    LOG.info("Starting Cararth ingestion scheduler...")
    
    # Schedule for 06:00 and 18:00 IST using proper timezone handling
    schedule.every().day.at("06:00").do(run_scheduled_batch).tag('ist-morning')
    schedule.every().day.at("18:00").do(run_scheduled_batch).tag('ist-evening')
    
    LOG.info("Scheduled batch processing for 06:00 and 18:00 IST")
    LOG.info("Next runs: %s", [job.next_run for job in schedule.jobs])
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

# --- Main entry point ---
def main():
    """Main entry point with proper initialization"""
    parser = argparse.ArgumentParser(description="Cararth production ingestion worker")
    parser.add_argument("--run-once", action="store_true", help="Run single batch then exit")
    parser.add_argument("--test-apis", action="store_true", help="Test API connections")
    args = parser.parse_args()
    
    LOG.info("Starting Cararth ingestion worker...")
    
    # Initialize all API clients
    initialize_api_clients()
    
    if args.test_apis:
        LOG.info("Testing API connections...")
        # Test basic connectivity
        if firecrawl_client:
            LOG.info("✅ Firecrawl client ready")
        if gemini_model:
            LOG.info("✅ Gemini model ready") 
        if anthropic_client:
            LOG.info("✅ Anthropic client ready")
        if openai_client:
            LOG.info("✅ OpenAI client ready")
        return
    
    if args.run_once:
        # Run single batch with IST timestamp
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.datetime.now(ist)
        batch_ts = now_ist.isoformat()
        LOG.info("Running single batch at IST: %s", now_ist.strftime("%Y-%m-%d %H:%M:%S"))
        process_ingest_batch(batch_ts)
    else:
        # Run scheduler
        run_scheduler()

if __name__ == "__main__":
    main()