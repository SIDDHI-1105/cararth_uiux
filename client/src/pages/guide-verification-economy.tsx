import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrandWordmark } from "@/components/brand-wordmark";
import SocialShareButtons from "@/components/social-share-buttons";
import {
  Home,
  Clock,
  Shield,
  TrendingUp,
  CheckCircle2,
  Database,
  Zap
} from "lucide-react";

export default function VerificationEconomyGuide() {
  useEffect(() => {
    document.title = "The Verification Economy: How Data Integrity Will Redefine India's Used-Car Market | Cararth";
    
    const metaTags = {
      description: "Discover how India's used-car ecosystem will shift from listings to verification-driven trust. Cararth explains how data integrity becomes the foundation of the new mobility economy.",
      keywords: "verification economy, data integrity India, used car verification, AI mobility trust, Cararth trust infrastructure, verified car data India",
      "og:title": "The Verification Economy: How Data Integrity Will Redefine India's Used-Car Market",
      "og:description": "An in-depth blueprint by Cararth on why the future of India's mobility ecosystem will be built on verification, not visibility.",
      "og:type": "article",
      "article:published_time": "2025-11-23T00:00:00Z",
      "article:author": "Kritarth Pattnaik",
      "article:section": "Pillar Guides"
    };

    Object.entries(metaTags).forEach(([key, value]) => {
      const isProperty = key.startsWith('og:') || key.startsWith('article:');
      const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', key);
        } else {
          meta.setAttribute('name', key);
        }
        document.head.appendChild(meta);
      }
      meta.content = value;
    });

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "The Verification Economy: How Data Integrity Will Redefine India's Used-Car Market",
      "description": "How India's used-car ecosystem will shift from listings to verification-driven trust. Data integrity becomes the foundation of the new mobility economy.",
      "author": {
        "@type": "Person",
        "name": "Kritarth Pattnaik"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cararth",
        "url": "https://www.cararth.com"
      },
      "datePublished": "2025-11-23",
      "dateModified": "2025-11-23",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.cararth.com/guides/the-verification-economy-india-used-cars"
      },
      "articleSection": "Pillar Guides"
    };

    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(articleSchema, null, 2);

    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-950 dark:via-gray-900/30 dark:to-gray-950">
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-home">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <BrandWordmark variant="header" showTagline={false} className="scale-75" />
          <SocialShareButtons
            url="https://www.cararth.com/guides/the-verification-economy-india-used-cars"
            title="The Verification Economy: How Data Integrity Will Redefine India's Used-Car Market"
            description="How India's used-car ecosystem will shift from listings to verification-driven trust."
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
              <Shield className="h-3 w-3 mr-1" />
              Pillar Guide
            </Badge>
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <Clock className="h-3 w-3 mr-1" />
              Featured Content
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            The Verification Economy
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            How Data Integrity Will Redefine India's Used-Car Market
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>By Kritarth Pattnaik</span>
            <span>•</span>
            <span>Founder, Cararth</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <Card className="p-6 sm:p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-600 p-6 my-8">
              <p className="text-lg font-semibold mb-2">📋 Placeholder Status</p>
              <p>This pillar guide page has been created and is awaiting the full article content. Once the complete draft is provided by the Cararth editorial team, this placeholder will be replaced with the full article.</p>
            </div>

            <Separator className="my-8" />

            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Database className="h-7 w-7 text-blue-600" />
              Pillar Guide Overview
            </h2>

            <p>
              This guide explores how India's used-car marketplace is transitioning from a listing-driven economy to a verification-driven one. The core premise: <strong>data integrity becomes competitive advantage</strong>.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6">Key Concepts</h3>
            <ul>
              <li>Why verification matters more than visibility</li>
              <li>The role of AI in building trust infrastructure</li>
              <li>How data integrity creates sustainable markets</li>
              <li>Cararth's approach to trust-first platform design</li>
            </ul>

            <Separator className="my-8" />

            <h2 className="text-2xl font-bold mb-4">Related Reading</h2>
            <p>Explore related guides on trust and verification:</p>
            <ul>
              <li><Link href="/guides/ai-verified-used-car-trust-india" className="text-blue-600 hover:text-blue-700">AI Verification Guide</Link></li>
              <li><Link href="/guides/best-used-cars-india-2025" className="text-blue-600 hover:text-blue-700">Best Used Cars 2025</Link></li>
              <li><Link href="/guides/used-electric-cars-2025" className="text-blue-600 hover:text-blue-700">Used Electric Cars Guide</Link></li>
            </ul>

            <Separator className="my-8" />

            <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-600 p-6 my-6">
              <p className="font-semibold mb-2">✨ Coming Soon</p>
              <p>Full article content with comprehensive analysis on data integrity, market transformation, and Cararth's role in India's used-car verification economy will be added here.</p>
            </div>

            <Link href="/">
              <Button className="mt-6 px-8 py-3 text-lg">
                Back to Cararth Home
              </Button>
            </Link>
          </article>
        </Card>
      </div>
    </div>
  );
}
