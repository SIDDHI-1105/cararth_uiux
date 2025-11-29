#!/usr/bin/env python3
"""
SEO and LLM Optimization Audit Tool for CarArth.com
Analyzes pages for Google SEO and AI assistant discoverability
"""

import json
import sys
from urllib.parse import urljoin, urlparse
from collections import Counter
import re

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "beautifulsoup4"])
    import requests
    from bs4 import BeautifulSoup


class SEOAuditor:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.results = {
            "timestamp": "",
            "base_url": base_url,
            "pages": {},
            "summary": {
                "total_issues": 0,
                "critical_issues": [],
                "warnings": [],
                "recommendations": []
            }
        }
    
    def fetch_page(self, path):
        """Fetch a page and return BeautifulSoup object"""
        url = urljoin(self.base_url, path)
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser'), response
        except Exception as e:
            return None, None
    
    def analyze_meta_tags(self, soup, page_name):
        """Analyze meta tags for SEO"""
        issues = []
        data = {}
        
        # Title tag
        title = soup.find('title')
        if not title:
            issues.append({"severity": "critical", "message": "Missing <title> tag"})
            data['title'] = None
        else:
            title_text = title.get_text().strip()
            data['title'] = title_text
            if len(title_text) < 30:
                issues.append({"severity": "warning", "message": f"Title too short ({len(title_text)} chars, recommend 50-60)"})
            elif len(title_text) > 60:
                issues.append({"severity": "warning", "message": f"Title too long ({len(title_text)} chars, recommend 50-60)"})
            if 'cararth' not in title_text.lower() and page_name != 'listing':
                issues.append({"severity": "warning", "message": "Title missing brand name 'CarArth'"})
        
        # Meta description
        description = soup.find('meta', attrs={'name': 'description'})
        if not description or not description.get('content'):
            issues.append({"severity": "critical", "message": "Missing meta description"})
            data['description'] = None
        else:
            desc_text = description.get('content', '').strip()
            data['description'] = desc_text
            if len(desc_text) < 120:
                issues.append({"severity": "warning", "message": f"Description too short ({len(desc_text)} chars, recommend 150-160)"})
            elif len(desc_text) > 160:
                issues.append({"severity": "info", "message": f"Description slightly long ({len(desc_text)} chars)"})
        
        # Viewport (mobile-friendly)
        viewport = soup.find('meta', attrs={'name': 'viewport'})
        if not viewport:
            issues.append({"severity": "critical", "message": "Missing viewport meta tag (not mobile-friendly)"})
        else:
            data['viewport'] = viewport.get('content', '')
        
        # Open Graph tags
        og_tags = {}
        for og in soup.find_all('meta', property=re.compile('^og:')):
            og_tags[og.get('property')] = og.get('content', '')
        
        data['open_graph'] = og_tags
        if not og_tags:
            issues.append({"severity": "warning", "message": "Missing Open Graph tags for social sharing"})
        elif 'og:title' not in og_tags or 'og:description' not in og_tags or 'og:image' not in og_tags:
            issues.append({"severity": "info", "message": "Incomplete Open Graph tags (missing title/description/image)"})
        
        # Twitter Card
        twitter_card = soup.find('meta', attrs={'name': 'twitter:card'})
        data['twitter_card'] = twitter_card.get('content') if twitter_card else None
        if not twitter_card:
            issues.append({"severity": "info", "message": "Missing Twitter Card tags"})
        
        # Canonical URL
        canonical = soup.find('link', rel='canonical')
        data['canonical'] = canonical.get('href') if canonical else None
        if not canonical:
            issues.append({"severity": "warning", "message": "Missing canonical URL"})
        
        return data, issues
    
    def analyze_schema_org(self, soup):
        """Check for Schema.org structured data"""
        issues = []
        schemas = []
        
        # Find JSON-LD scripts
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                schema_type = data.get('@type', 'Unknown')
                schemas.append(schema_type)
            except json.JSONDecodeError:
                issues.append({"severity": "error", "message": "Invalid JSON-LD schema found"})
        
        if not schemas:
            issues.append({"severity": "critical", "message": "No Schema.org structured data found"})
        
        return schemas, issues
    
    def analyze_headers(self, soup):
        """Analyze heading structure"""
        issues = []
        headers = {f'h{i}': [] for i in range(1, 7)}
        
        for i in range(1, 7):
            for h in soup.find_all(f'h{i}'):
                headers[f'h{i}'].append(h.get_text().strip())
        
        # Check H1
        if not headers['h1']:
            issues.append({"severity": "critical", "message": "Missing H1 tag"})
        elif len(headers['h1']) > 1:
            issues.append({"severity": "warning", "message": f"Multiple H1 tags found ({len(headers['h1'])})"})
        
        # Check hierarchy
        has_h1 = len(headers['h1']) > 0
        has_h3_without_h2 = len(headers['h3']) > 0 and len(headers['h2']) == 0
        
        if has_h3_without_h2 and has_h1:
            issues.append({"severity": "info", "message": "Heading hierarchy issue: H3 without H2"})
        
        return headers, issues
    
    def analyze_images(self, soup):
        """Check image optimization"""
        issues = []
        images = soup.find_all('img')
        
        total_images = len(images)
        missing_alt = 0
        empty_alt = 0
        
        for img in images:
            alt = img.get('alt', '')
            if not img.has_attr('alt'):
                missing_alt += 1
            elif not alt.strip():
                empty_alt += 1
        
        if missing_alt > 0:
            issues.append({"severity": "warning", "message": f"{missing_alt}/{total_images} images missing alt attribute"})
        if empty_alt > 0:
            issues.append({"severity": "info", "message": f"{empty_alt}/{total_images} images have empty alt text"})
        
        # Check for lazy loading
        lazy_images = len([img for img in images if img.get('loading') == 'lazy'])
        if lazy_images < total_images and total_images > 3:
            issues.append({"severity": "info", "message": f"Only {lazy_images}/{total_images} images use lazy loading"})
        
        return {
            "total": total_images,
            "missing_alt": missing_alt,
            "empty_alt": empty_alt,
            "lazy_loaded": lazy_images
        }, issues
    
    def analyze_content(self, soup, page_name):
        """Analyze content quality for SEO and LLM"""
        issues = []
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer"]):
            script.decompose()
        
        text = soup.get_text()
        words = text.split()
        word_count = len(words)
        
        # Word count check
        if word_count < 300 and page_name != 'listing':
            issues.append({"severity": "warning", "message": f"Low word count ({word_count} words, recommend 300+)"})
        
        # Keyword analysis (simple)
        text_lower = text.lower()
        target_keywords = ['used car', 'india', 'buy', 'sell', 'price', 'cararth']
        keyword_density = {}
        
        for keyword in target_keywords:
            count = text_lower.count(keyword)
            keyword_density[keyword] = count
        
        # Check for lists (LLM-friendly)
        lists = len(soup.find_all(['ul', 'ol']))
        
        # Check for tables (structured data)
        tables = len(soup.find_all('table'))
        
        return {
            "word_count": word_count,
            "keyword_density": keyword_density,
            "lists": lists,
            "tables": tables
        }, issues
    
    def analyze_links(self, soup):
        """Analyze internal and external links"""
        issues = []
        links = soup.find_all('a', href=True)
        
        internal_links = []
        external_links = []
        
        for link in links:
            href = link.get('href', '')
            if href.startswith('http'):
                if 'cararth.com' in href or 'localhost' in href:
                    internal_links.append(href)
                else:
                    external_links.append(href)
            elif href.startswith('/'):
                internal_links.append(href)
        
        if len(internal_links) < 3:
            issues.append({"severity": "info", "message": f"Limited internal linking ({len(internal_links)} links)"})
        
        return {
            "total": len(links),
            "internal": len(internal_links),
            "external": len(external_links)
        }, issues
    
    def analyze_page(self, path, page_name):
        """Comprehensive page analysis"""
        print(f"\n📄 Analyzing {page_name} ({path})...")
        
        soup, response = self.fetch_page(path)
        if not soup:
            return {
                "error": "Failed to fetch page",
                "all_issues": [{"severity": "critical", "message": "Page not accessible"}]
            }
        
        all_issues = []
        
        # Meta tags
        meta_data, meta_issues = self.analyze_meta_tags(soup, page_name)
        all_issues.extend(meta_issues)
        
        # Schema.org
        schemas, schema_issues = self.analyze_schema_org(soup)
        all_issues.extend(schema_issues)
        
        # Headers
        headers, header_issues = self.analyze_headers(soup)
        all_issues.extend(header_issues)
        
        # Images
        images, image_issues = self.analyze_images(soup)
        all_issues.extend(image_issues)
        
        # Content
        content, content_issues = self.analyze_content(soup, page_name)
        all_issues.extend(content_issues)
        
        # Links
        links, link_issues = self.analyze_links(soup)
        all_issues.extend(link_issues)
        
        return {
            "meta": meta_data,
            "schemas": schemas,
            "headers": headers,
            "images": images,
            "content": content,
            "links": links,
            "all_issues": all_issues,
            "status_code": response.status_code if response else None
        }
    
    def run_audit(self):
        """Run full SEO audit"""
        print("🔍 Starting SEO & LLM Optimization Audit for CarArth.com")
        print(f"Base URL: {self.base_url}\n")
        
        # Pages to audit
        pages = [
            ("/", "Homepage"),
            ("/sell-your-car", "Sell Your Car"),
            ("/community", "Community"),
        ]
        
        # Get a sample listing
        try:
            response = requests.get(urljoin(self.base_url, "/api/cars"), timeout=10)
            if response.status_code == 200:
                cars = response.json()
                if cars and len(cars) > 0:
                    sample_car_id = cars[0].get('id')
                    pages.append((f"/car/{sample_car_id}", "Sample Listing"))
        except:
            print("⚠️  Could not fetch sample listing")
        
        # Analyze each page
        for path, name in pages:
            self.results['pages'][name] = self.analyze_page(path, name.lower().replace(' ', '_'))
        
        # Generate summary
        self.generate_summary()
        
        return self.results
    
    def generate_summary(self):
        """Generate audit summary and recommendations"""
        critical_issues = []
        warnings = []
        
        for page_name, page_data in self.results['pages'].items():
            if 'error' in page_data:
                critical_issues.append(f"{page_name}: {page_data['error']}")
                continue
            
            for issue in page_data.get('all_issues', []):
                if issue['severity'] == 'critical':
                    critical_issues.append(f"{page_name}: {issue['message']}")
                elif issue['severity'] == 'warning':
                    warnings.append(f"{page_name}: {issue['message']}")
        
        self.results['summary']['critical_issues'] = critical_issues
        self.results['summary']['warnings'] = warnings
        self.results['summary']['total_issues'] = len(critical_issues) + len(warnings)
        
        # Generate recommendations
        recommendations = [
            "Add comprehensive meta tags (title, description) to all pages",
            "Implement Schema.org JSON-LD for Vehicle, AutoDealer, and FAQ",
            "Create dynamic sitemap.xml with all car listings",
            "Update robots.txt to allow LLM crawlers (GPTBot, Claude-Web, etc.)",
            "Add /api/ai-info endpoint for machine-readable data",
            "Optimize image alt texts with car details",
            "Add internal linking between related listings",
            "Create FAQ section with conversational content",
            "Add canonical URLs to prevent duplicate content",
            "Implement Open Graph and Twitter Card tags for social sharing"
        ]
        
        self.results['summary']['recommendations'] = recommendations
    
    def print_report(self):
        """Print human-readable audit report"""
        print("\n" + "="*80)
        print("📊 SEO AUDIT REPORT - CarArth.com")
        print("="*80 + "\n")
        
        # Summary
        summary = self.results['summary']
        print(f"Total Issues Found: {summary['total_issues']}")
        print(f"  - Critical: {len(summary['critical_issues'])}")
        print(f"  - Warnings: {len(summary['warnings'])}")
        print()
        
        # Critical issues
        if summary['critical_issues']:
            print("🚨 CRITICAL ISSUES:")
            for issue in summary['critical_issues'][:10]:
                print(f"  ❌ {issue}")
            print()
        
        # Warnings
        if summary['warnings']:
            print("⚠️  WARNINGS:")
            for warning in summary['warnings'][:10]:
                print(f"  ⚠️  {warning}")
            print()
        
        # Page-by-page details
        print("\n📄 PAGE ANALYSIS:\n")
        for page_name, data in self.results['pages'].items():
            if 'error' in data:
                print(f"❌ {page_name}: {data['error']}")
                continue
            
            print(f"✓ {page_name}")
            print(f"  Title: {data['meta'].get('title', 'Missing')[:60]}...")
            print(f"  Description: {data['meta'].get('description', 'Missing')[:60] if data['meta'].get('description') else 'Missing'}...")
            print(f"  Schema.org: {', '.join(data['schemas']) if data['schemas'] else 'None'}")
            print(f"  H1 Count: {len(data['headers']['h1'])}")
            print(f"  Images: {data['images']['total']} (Alt missing: {data['images']['missing_alt']})")
            print(f"  Word Count: {data['content']['word_count']}")
            print(f"  Internal Links: {data['links']['internal']}")
            print()
        
        # Recommendations
        print("\n💡 TOP RECOMMENDATIONS:\n")
        for i, rec in enumerate(summary['recommendations'][:10], 1):
            print(f"{i}. {rec}")
        
        print("\n" + "="*80)
        print(f"Full report saved to: seo_audit_report.json")
        print("="*80 + "\n")
    
    def save_report(self, filename="seo_audit_report.json"):
        """Save audit results to JSON file"""
        import datetime
        self.results['timestamp'] = datetime.datetime.now().isoformat()
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"✅ Report saved to {filename}")


def main():
    # Use production URL if available, otherwise localhost
    base_url = "https://cararth.com"  # Try production first
    
    # Test if production is accessible
    try:
        response = requests.get(base_url, timeout=5)
        print(f"✅ Using production URL: {base_url}")
    except:
        base_url = "http://localhost:5000"
        print(f"⚠️  Production not accessible, using local: {base_url}")
    
    auditor = SEOAuditor(base_url)
    auditor.run_audit()
    auditor.print_report()
    auditor.save_report()
    
    return auditor.results


if __name__ == "__main__":
    results = main()
