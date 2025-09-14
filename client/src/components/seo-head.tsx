/**
 * SEO Head Component for CarArth
 * Provides comprehensive meta tags, structured data, and Open Graph optimization
 */

import { useEffect } from 'react';
import cararthLogo from "@assets/cararth logo_1757827558983.png";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  structuredData?: any;
  canonical?: string;
  noIndex?: boolean;
}

export function SEOHead({
  title = "CarArth - India's First Used Car Search Engine",
  description = "India's first used car search engine. Compare cars across platforms, discover true value with AI intelligence. Buy & sell with confidence on CarArth.",
  keywords = "used cars India, car search engine, compare cars, authentic car listings, AI car recommendations, cross-platform car search, car marketplace India, used car price comparison",
  ogImage = cararthLogo,
  ogType = "website",
  structuredData,
  canonical,
  noIndex = false
}: SEOHeadProps) {

  useEffect(() => {
    // Update document title
    document.title = title;

    // Create or update meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', noIndex ? 'noindex,nofollow' : 'index,follow');
    updateMetaTag('author', 'CarArth');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:site_name', 'CarArth', true);
    updateMetaTag('og:url', canonical || window.location.href, true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', ogImage, true);
    
    // Automotive-specific meta tags
    updateMetaTag('geo.region', 'IN');
    updateMetaTag('geo.country', 'India');
    updateMetaTag('language', 'en-IN');
    updateMetaTag('coverage', 'Worldwide');
    updateMetaTag('target', 'all');
    updateMetaTag('HandheldFriendly', 'True');
    updateMetaTag('MobileOptimized', '320');
    
    // Canonical link
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    }

    // Structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData, null, 2);
    }

    // Google Analytics tracking
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      // Add Google Analytics script
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-B5GJ9X3GXZ';
      document.head.appendChild(gtagScript);

      // Add Google Analytics configuration
      const configScript = document.createElement('script');
      configScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-B5GJ9X3GXZ');
      `;
      document.head.appendChild(configScript);
    }

  }, [title, description, keywords, ogImage, ogType, structuredData, canonical, noIndex]);

  return null; // This component doesn't render anything visible
}

// Predefined structured data schemas for automotive content
export const createCarListingSchema = (car: any) => ({
  "@context": "https://schema.org",
  "@type": "Car",
  "name": `${car.brand} ${car.model}`,
  "brand": {
    "@type": "Brand",
    "name": car.brand
  },
  "model": car.model,
  "vehicleModelDate": car.year,
  "fuelType": car.fuelType,
  "vehicleTransmission": car.transmission,
  "mileageFromOdometer": {
    "@type": "QuantitativeValue",
    "value": car.mileage,
    "unitCode": "KMT"
  },
  "offers": {
    "@type": "Offer",
    "price": car.price,
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "AutoDealer",
      "name": "CarArth"
    }
  }
});

export const createWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "CarArth",
  "alternateName": "CarArth - India's First Used Car Search Engine",
  "url": "https://cararth.com",
  "description": "India's first comprehensive used car search engine that aggregates listings from multiple platforms with AI intelligence.",
  "keywords": "used cars, car marketplace, automotive search, India",
  "inLanguage": "en-IN",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://cararth.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "CarArth",
    "logo": {
      "@type": "ImageObject",
      "url": "https://cararth.com/logo.png"
    }
  }
});

export const createOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  "name": "CarArth",
  "description": "India's first used car search engine. Compare cars across platforms with AI intelligence.",
  "url": "https://cararth.com",
  "logo": "https://cararth.com/logo.png",
  "email": "connect@cararth.com",
  "areaServed": {
    "@type": "Country",
    "name": "India"
  },
  "serviceType": "Used Car Search Engine",
  "founder": {
    "@type": "Organization",
    "name": "CarArth Team"
  },
  "foundingDate": "2024",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Used Cars",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Car",
          "name": "Used Cars across India"
        }
      }
    ]
  }
});