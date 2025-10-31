// server/routes/seoRoutes.ts
// Server-side rendered routes for SEO-critical pages
// These routes serve HTML with meta tags and JSON-LD before client JavaScript loads

import { Router, Request, Response } from 'express';
import { renderShell } from '../lib/renderShell';

const router = Router();

// Organization JSON-LD (used across all pages)
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CarArth",
  "url": "https://www.cararth.com",
  "description": "CarArth — India's trust-first used car search platform. Aggregates verified listings from multiple sources. No paid listings. List once and syndicate across partner networks.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.cararth.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

// FAQ JSON-LD for homepage
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Does CarArth charge for listings?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. CarArth does not accept paid listing boosts. We prioritize verified listings and fair visibility for sellers."
      }
    },
    {
      "@type": "Question",
      "name": "How does syndication work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "List once on CarArth and opt into syndication. We distribute your verified listing to partner marketplaces and dealer networks for wider reach."
      }
    },
    {
      "@type": "Question",
      "name": "What role does AI play?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AI verifies registration details, estimates fair price ranges, and flags listing issues. AI supports trust and clarity — CarArth does not use AI to boost paid listings."
      }
    }
  ]
};

// Route: Homepage (/)
router.get('/', (req: Request, res: Response) => {
  const meta = {
    title: "CarArth — One Trusted Place for Every Verified Car",
    description: "Find verified used cars from multiple platforms in one trusted place. No paid listings. Sellers: list once and syndicate nationwide. Honest prices, verified sellers.",
    canonical: "https://www.cararth.com/",
    keywords: "used car search India, verified used cars, no paid listings, car syndication, AI price insights, Hyderabad cars"
  };

  // Minimal loading state HTML (React will hydrate this)
  const bodyHtml = `
    <div style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:Inter,sans-serif">
      <div style="text-align:center">
        <h1 style="font-size:24px;margin-bottom:12px">CarArth</h1>
        <p style="color:#666">Loading India's Very Own Used Car Search Engine...</p>
      </div>
    </div>
  `;

  const html = renderShell({
    meta,
    jsonLd: [ORG_JSON_LD, FAQ_JSON_LD],
    bodyHtml
  });

  res.send(html);
});

// Route: Sell page (/sell)
router.get('/sell', (req: Request, res: Response) => {
  const meta = {
    title: "Sell Your Car — List Once, Reach Everywhere | CarArth",
    description: "List your car on CarArth and syndicate it to partner platforms. No paid listings. Verified sellers get fair visibility. AI-assisted price guidance.",
    canonical: "https://www.cararth.com/sell",
    keywords: "sell used car India, car listing syndication, verified car sellers, AI price estimate"
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Used Car Listing & Syndication",
    "provider": {
      "@type": "Organization",
      "name": "CarArth",
      "url": "https://www.cararth.com"
    },
    "serviceType": "Used Car Listing and Syndication",
    "areaServed": "India",
    "description": "List your used car once on CarArth and syndicate it across partner marketplaces and dealer networks. AI verifies listing details for fair pricing."
  };

  const bodyHtml = `
    <div style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:Inter,sans-serif">
      <div style="text-align:center;max-width:600px;padding:20px">
        <h1 style="font-size:24px;margin-bottom:12px">Sell Your Car</h1>
        <p style="color:#666">List once. Reach everywhere. Loading seller dashboard...</p>
      </div>
    </div>
  `;

  const html = renderShell({
    meta,
    jsonLd: [ORG_JSON_LD, serviceJsonLd],
    bodyHtml
  });

  res.send(html);
});

// Route: Hyderabad city page (/used-cars-hyderabad)
router.get('/used-cars-hyderabad', (req: Request, res: Response) => {
  const meta = {
    title: "Used Cars in Hyderabad — Verified Listings | CarArth",
    description: "Find verified used cars in Hyderabad on CarArth. Aggregated from multiple platforms. No paid listings. List once and syndicate across partner networks.",
    canonical: "https://www.cararth.com/used-cars-hyderabad",
    keywords: "used cars Hyderabad, second hand cars Hyderabad, verified car dealers Hyderabad, Telangana used cars"
  };

  const cityJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Used Cars in Hyderabad - Verified Listings",
    "description": meta.description,
    "url": meta.canonical
  };

  const bodyHtml = `
    <div style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:Inter,sans-serif">
      <div style="text-align:center;max-width:600px;padding:20px">
        <h1 style="font-size:24px;margin-bottom:12px">Used Cars in Hyderabad</h1>
        <p style="color:#666">Loading verified listings from Hyderabad...</p>
      </div>
    </div>
  `;

  const html = renderShell({
    meta,
    jsonLd: [ORG_JSON_LD, cityJsonLd],
    bodyHtml
  });

  res.send(html);
});

export default router;
