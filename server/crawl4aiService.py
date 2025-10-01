#!/usr/bin/env python3
"""
Crawl4AI Service - LLM-powered web scraping for car listings
Uses Crawl4AI to extract structured data from car listing pages
"""

import asyncio
import json
import sys
import os
from typing import Dict, Any, Optional
from crawl4ai import AsyncWebCrawler
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from pydantic import BaseModel, Field

# Car listing extraction schema
class CarListing(BaseModel):
    """Canonical car listing schema for extraction"""
    title: str = Field(description="Full listing title")
    make: str = Field(description="Car manufacturer/brand")
    model: str = Field(description="Car model name")
    variant: Optional[str] = Field(None, description="Car variant/trim")
    year: int = Field(description="Manufacturing year")
    price_amount: float = Field(description="Price in local currency")
    price_currency: str = Field(default="INR", description="Currency code")
    kms: Optional[int] = Field(None, description="Kilometers driven")
    fuel: Optional[str] = Field(None, description="Fuel type")
    transmission: Optional[str] = Field(None, description="Transmission type")
    owner_count: Optional[int] = Field(None, description="Number of previous owners")
    city: str = Field(description="City where car is located")
    registration_state: Optional[str] = Field(None, description="State of registration")
    pincode: Optional[str] = Field(None, description="Area pincode")
    description: Optional[str] = Field(None, description="Listing description")
    images: list[str] = Field(default_factory=list, description="Image URLs")
    seller_name: Optional[str] = Field(None, description="Seller name")
    seller_phone: Optional[str] = Field(None, description="Seller contact phone")

async def scrape_car_listing(url: str, llm_provider: str = "openai", llm_model: str = "gpt-4o-mini") -> Dict[str, Any]:
    """
    Scrape a car listing page using Crawl4AI with LLM extraction
    
    Args:
        url: URL of the car listing page to scrape
        llm_provider: LLM provider to use (openai, gemini, anthropic)
        llm_model: Specific model to use
    
    Returns:
        Dict with success status and extracted data or error
    """
    try:
        # Configure LLM extraction strategy with direct parameters
        extraction_strategy = LLMExtractionStrategy(
            provider=llm_provider,
            api_token=os.getenv(f"{llm_provider.upper()}_API_KEY"),
            schema=CarListing.model_json_schema(),
            extraction_type="schema",
            instruction=(
                "Extract car listing information from this webpage. "
                "Focus on finding the car's make, model, year, price, mileage, "
                "location, and other vehicle details. "
                "If any field is not available, leave it as null."
            )
        )
        
        # Create crawler and scrape (verbose=False to avoid stdout corruption)
        async with AsyncWebCrawler(verbose=False) as crawler:
            result = await crawler.arun(
                url=url,
                extraction_strategy=extraction_strategy,
                bypass_cache=True,
                word_count_threshold=10,
                remove_overlay_elements=True
            )
            
            # Handle result (type: CrawlResult)
            if hasattr(result, 'success') and result.success:  # type: ignore
                # Parse extracted data
                extracted_data = json.loads(result.extracted_content)  # type: ignore
                
                metadata = result.metadata if hasattr(result, 'metadata') else {}  # type: ignore
                markdown = result.markdown if hasattr(result, 'markdown') else None  # type: ignore
                
                return {
                    "success": True,
                    "data": extracted_data,
                    "metadata": {
                        "url": url,
                        "title": metadata.get("title", "") if isinstance(metadata, dict) else "",
                        "description": metadata.get("description", "") if isinstance(metadata, dict) else "",
                        "llm_provider": llm_provider,
                        "llm_model": llm_model
                    },
                    "markdown": markdown[:1000] if markdown else None  # First 1000 chars
                }
            else:
                error_msg = result.error_message if hasattr(result, 'error_message') else "Unknown error"  # type: ignore
                return {
                    "success": False,
                    "error": f"Crawl failed: {error_msg}"
                }
                
    except Exception as e:
        return {
            "success": False,
            "error": f"Scraping error: {str(e)}"
        }

async def batch_scrape_listings(urls: list[str], llm_provider: str = "openai") -> Dict[str, Any]:
    """
    Scrape multiple car listing URLs in parallel
    
    Args:
        urls: List of URLs to scrape
        llm_provider: LLM provider to use
    
    Returns:
        Dict with results for each URL
    """
    tasks = [scrape_car_listing(url, llm_provider) for url in urls]
    results = await asyncio.gather(*tasks)
    
    return {
        "success": True,
        "results": results,
        "total": len(urls),
        "succeeded": sum(1 for r in results if r.get("success")),
        "failed": sum(1 for r in results if not r.get("success"))
    }

async def main():
    """CLI entry point for the service"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python crawl4aiService.py <command> <args>"
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "scrape":
        if len(sys.argv) < 3:
            print(json.dumps({
                "success": False,
                "error": "URL required for scrape command"
            }))
            sys.exit(1)
        
        url = sys.argv[2]
        llm_provider = sys.argv[3] if len(sys.argv) > 3 else "openai"
        llm_model = sys.argv[4] if len(sys.argv) > 4 else "gpt-4o-mini"
        
        result = await scrape_car_listing(url, llm_provider, llm_model)
        print(json.dumps(result, indent=2))
        
    elif command == "batch":
        if len(sys.argv) < 3:
            print(json.dumps({
                "success": False,
                "error": "URLs required for batch command"
            }))
            sys.exit(1)
        
        urls = json.loads(sys.argv[2])
        llm_provider = sys.argv[3] if len(sys.argv) > 3 else "openai"
        
        result = await batch_scrape_listings(urls, llm_provider)
        print(json.dumps(result, indent=2))
        
    else:
        print(json.dumps({
            "success": False,
            "error": f"Unknown command: {command}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
