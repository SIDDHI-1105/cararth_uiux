import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrandWordmark } from "@/components/brand-wordmark";
import {
  Home,
  Share2,
  Clock,
  BookOpen,
  ChevronRight,
  Shield,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export default function AIVerificationGuide() {
  useEffect(() => {
    // SEO meta tags
    document.title = "The Ultimate Guide to AI-Verified Used Car Trust in India | Cararth";
    
    const metaTags = {
      description: "Comprehensive 3000+ word guide on how AI verification is solving India's used car trust crisis. Learn about fraud detection, compliance standards, and the future of verified car buying.",
      keywords: "AI car verification India, used car fraud detection, odometer tampering, VAHAN verification, RTA compliance, car trust score, blockchain automotive, predictive car maintenance",
      "og:title": "The Ultimate Guide to AI-Verified Used Car Trust in India",
      "og:description": "How AI is transforming India's used car market from chaos to credibility with multi-layer verification, fraud detection, and trust scoring.",
      "og:type": "article",
      "article:published_time": "2025-10-26T00:00:00Z",
      "article:author": "Cararth Team",
      "article:section": "Automotive Technology"
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

    // Article Schema markup
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "The Ultimate Guide to AI-Verified Used Car Trust in India",
      "description": "Comprehensive guide on how artificial intelligence is solving India's used car trust crisis through fraud detection, compliance verification, and predictive analytics.",
      "author": {
        "@type": "Organization",
        "name": "Cararth",
        "url": "https://www.cararth.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cararth",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.cararth.com/cararth-logo-full.png"
        }
      },
      "datePublished": "2025-10-26",
      "dateModified": "2025-10-26",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.cararth.com/guides/ai-verified-used-car-trust-india"
      },
      "articleSection": "Automotive Technology",
      "keywords": "AI verification, used car fraud, trust scoring, VAHAN integration, blockchain automotive",
      "wordCount": 3000,
      "articleBody": "Guide covering AI verification technology, fraud patterns, compliance standards, and the future of car buying in India."
    };

    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(articleSchema, null, 2);

    // Scroll to top
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-950 dark:via-gray-900/30 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-home">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <BrandWordmark variant="header" showTagline={false} className="scale-75" />
          <Button variant="outline" size="sm" data-testid="button-share">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <BookOpen className="h-3 w-3 mr-1" />
              Pillar Content
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
              <Clock className="h-3 w-3 mr-1" />
              12 min read
            </Badge>
            <Badge variant="outline">Oct 26, 2025</Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            The Ultimate Guide to AI-Verified Used Car Trust in India
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            How artificial intelligence is solving India's car trust crisis — from decoding fraud patterns to predicting a vehicle's future reliability.
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>By Cararth Team</span>
            <span>•</span>
            <span>Automotive Technology</span>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Table of Contents
          </h2>
          <nav className="space-y-2">
            {[
              { id: "intro", title: "Introduction: The Trust Crisis in India's Used Car Market" },
              { id: "risks", title: "Section 1: Common Risks and Fraud Patterns" },
              { id: "how-it-works", title: "Section 2: How AI Verification Works" },
              { id: "standards", title: "Section 3: Standards and Regulations" },
              { id: "future", title: "Section 4: The Future of Car Buying" },
              { id: "checklist", title: "Section 5: AI-Era Verification Checklist" },
              { id: "conclusion", title: "Conclusion: From Marketplace to Trust Network" }
            ].map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                data-testid={`link-toc-${section.id}`}
              >
                <ChevronRight className="h-3 w-3" />
                {section.title}
              </a>
            ))}
          </nav>
        </Card>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 pb-16">
        <div className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-white max-w-none">
          
          <section id="intro">
            <h2>Introduction: The Trust Crisis in India's Used Car Market</h2>
            
            <p>
              If you've ever bought a used car in India, you know that uneasy feeling — the mix of excitement and suspicion.
            </p>
            
            <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200 italic border-l-4 border-blue-600 pl-4 my-6">
              "Am I getting a good deal, or am I getting played?"
            </p>
            
            <p>
              That single question defines India's used car ecosystem in 2025. It's a market that's booming — projected to surpass <strong>9 million transactions annually by 2027</strong> — yet still clouded by mistrust. Buyers worry about tampered odometers, forged RCs, and hidden accident histories. Sellers, on the other hand, fear lowball offers and fake payments.
            </p>
            
            <p>
              This trust deficit isn't because people don't love cars — it's because they don't trust how cars are verified. And that's where AI verification is quietly transforming the game.
            </p>
            
            <p>
              In this guide, we'll explore how artificial intelligence is solving India's car trust crisis — from decoding fraud patterns to predicting a vehicle's future reliability. Whether you're a buyer, dealer, or tech entrepreneur, you'll see why the future of car buying in India is no longer about negotiation — <strong>it's about verification</strong>.
            </p>
          </section>

          <Separator className="my-12" />

          <section id="risks">
            <h2 className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              Section 1: Common Risks and Fraud Patterns in the Used Car Ecosystem
            </h2>
            
            <p>
              Buying a used car in India can feel like stepping into a maze of uncertainty. Beneath the glossy exteriors and sales talk, three risk factors consistently erode consumer confidence.
            </p>
            
            <h3>1. Odometer Tampering — The Oldest Trick in the Book</h3>
            
            <p>
              Odometer tampering is to the used car market what phishing is to cybersecurity — the most common and the most damaging.
            </p>
            
            <p>
              A car that's run 90,000 km is rolled back to 35,000 km with a handheld tool costing less than ₹5,000. The result? A buyer overpays by <strong>20–30%</strong> and inherits higher maintenance costs.
            </p>
            
            <p>
              Traditional inspection methods — physical check-ups, service book entries — fail because odometers can now be digitally altered in seconds. AI-based verification systems, however, cross-check multiple data points (RTO service records, telematics data, sensor logs, and pattern deviations in ECU readings) to flag anomalies instantly.
            </p>
            
            <h3>2. Fake or Forged Documentation</h3>
            
            <p>
              From RC books to insurance papers, document forgery remains rampant. Unscrupulous sellers often reprint scanned RC copies, fake "No Objection Certificates," or even alter chassis numbers in PDFs.
            </p>
            
            <p>
              AI-powered Optical Character Recognition (OCR) and document comparison tools are solving this by:
            </p>
            
            <ul>
              <li>Extracting text and metadata from uploaded documents</li>
              <li>Matching registration details with VAHAN or RTA databases</li>
              <li>Identifying document inconsistencies using multi-layer anomaly detection</li>
            </ul>
            
            <p>
              The result is near-real-time authenticity verification — no more depending on "gut feel."
            </p>
            
            <h3>3. Hidden Accidents and Repair Histories</h3>
            
            <p>
              A car's bodywork can hide a thousand stories. Insurance claim histories, repair invoices, and workshop records often reveal major accidents — but these are rarely disclosed by sellers.
            </p>
            
            <p>
              AI now tracks vehicle identity through:
            </p>
            
            <ul>
              <li>Claim history APIs</li>
              <li>Workshop database matching</li>
              <li>Structural pattern recognition in inspection images (AI can spot panel repaints, weld irregularities, or frame misalignments invisible to the human eye)</li>
            </ul>
            
            <p>
              Together, these tools give a digital footprint of a car's journey — its true mileage, its accidents, and its maintenance honesty.
            </p>
          </section>

          <Separator className="my-12" />

          <section id="how-it-works">
            <h2 className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              Section 2: How AI Verification Works — From Data to Trust
            </h2>
            
            <p>
              AI-based car verification isn't just about scanning documents. It's about creating a <strong>chain of digital truth</strong>.
            </p>
            
            <p>Let's unpack how it works.</p>
            
            <p>
              For a detailed breakdown of how Cararth's 200-Point AI Verification compares to traditional manual inspections, read <Link href="/guides/ai-check-vs-manual-inspection.html" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">this guide</Link>.
            </p>
            
            <h3>Step 1: Multi-LLM (Large Language Model) Integration</h3>
            
            <p>
              Modern verification systems don't rely on one model — they use <strong>multi-LLM orchestration</strong>.
            </p>
            
            <ul>
              <li><strong>Model A</strong> focuses on text comprehension: reading RC details, insurance notes, and OCR data.</li>
              <li><strong>Model B</strong> focuses on image validation: checking chassis plates, license plates, and VIN images for manipulations.</li>
              <li><strong>Model C</strong> runs compliance and database cross-checks with RTO and insurance APIs.</li>
            </ul>
            
            <p>
              Together, they create a <strong>layered truth architecture</strong>, flagging inconsistencies that human auditors might miss.
            </p>
            
            <h3>Step 2: OCR & Computer Vision</h3>
            
            <p>
              OCR engines — powered by deep neural networks — can read and interpret documents even from low-quality images. They extract:
            </p>
            
            <ul>
              <li>Vehicle registration numbers</li>
              <li>Owner names</li>
              <li>Chassis & engine numbers</li>
              <li>Insurance policy details</li>
            </ul>
            
            <p>
              These are then auto-matched with government databases and Cararth's proprietary verification network, ensuring data alignment across sources.
            </p>
            
            <h3>Step 3: Compliance & Risk Scoring</h3>
            
            <p>
              Each verified car gets an <strong>AI Trust Score</strong> — a cumulative confidence metric based on:
            </p>
            
            <ul>
              <li>Document authenticity</li>
              <li>Service record consistency</li>
              <li>Accident probability</li>
              <li>Ownership pattern</li>
            </ul>
            
            <p>
              This score acts as a trust passport for buyers and sellers. On Cararth's backend, these scores help rank listings by authenticity, improving visibility for verified sellers and protecting buyers from potential fraud.
            </p>
            
            <h3>Step 4: Adaptive Learning</h3>
            
            <p>
              Every new transaction teaches the model something new.
            </p>
            
            <p>
              When a forged RC is caught or an odometer discrepancy is flagged, that data loops back into the training system. Over time, AI doesn't just detect fraud — <strong>it predicts it</strong>.
            </p>
            
            <p>
              That's how Cararth and other leading verification platforms are moving toward a zero-fraud future — one verified VIN at a time.
            </p>
          </section>

          <Separator className="my-12" />

          <section id="standards">
            <h2 className="flex items-center gap-3">
              <FileCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
              Section 3: Standards and Regulations — The Compliance Backbone
            </h2>
            
            <p>
              The strength of AI verification depends on how deeply it integrates with official databases and compliance frameworks.
            </p>
            
            <h3>1. The RTA & VAHAN Ecosystem</h3>
            
            <p>
              Every registered vehicle in India is logged in <strong>VAHAN</strong>, the Ministry of Road Transport and Highways' digital registry. It holds:
            </p>
            
            <ul>
              <li>Ownership history</li>
              <li>Registration details</li>
              <li>Fitness & emission certificates</li>
              <li>Hypothecation status</li>
            </ul>
            
            <p>
              AI verification tools like Cararth's systems use secure APIs to cross-verify uploaded documents against VAHAN. This ensures that RC copies, chassis numbers, and engine details match official records — instantly revealing forgeries.
            </p>
            
            <h3>2. Insurance & Service Data Integration</h3>
            
            <p>
              Most fraudulent listings hide total-loss or flood-damaged vehicles. AI mitigates this risk by integrating with:
            </p>
            
            <ul>
              <li>Insurance claim databases</li>
              <li>Authorized service center networks</li>
              <li>Third-party OBD & telematics providers</li>
            </ul>
            
            <p>
              This allows the system to see beyond paperwork — into real usage and repair history.
            </p>
            
            <h3>3. Emerging Regulatory Standards</h3>
            
            <p>
              India is slowly catching up to the global trend of AI governance in automotive transactions.
            </p>
            
            <p>
              Key developments include:
            </p>
            
            <ul>
              <li><strong>Digital India Motor Registry (DIMR)</strong>: expanding API access to legitimate verification platforms.</li>
              <li><strong>FAME 3.0 & green car policies</strong>: introducing digital identity standards for EVs.</li>
              <li><strong>RBI's digital transaction monitoring guidelines</strong>: ensuring payment transparency in used car purchases.</li>
            </ul>
            
            <p>
              Together, these initiatives are creating the regulatory foundation for a fully AI-verified automotive economy.
            </p>
          </section>

          <Separator className="my-12" />

          <section id="future">
            <h2 className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              Section 4: The Future of Car Buying — From Trust to Transparency
            </h2>
            
            <p>
              If the last decade was about digitization, the next one will be about <strong>verification</strong>.
            </p>
            
            <p>
              Here's how the future of India's used car market is shaping up.
            </p>
            
            <h3>1. Blockchain for Ownership Provenance</h3>
            
            <p>
              Imagine scanning a QR code on a car listing and instantly seeing its entire verified history — ownership transfers, accident repairs, insurance claims — all recorded on a tamper-proof blockchain ledger.
            </p>
            
            <p>
              This is where the industry is heading. Blockchain-based identity tokens for vehicles will soon become the "Aadhaar for cars," ensuring every transaction is traceable and fraud-proof.
            </p>
            
            <h3>2. Predictive Analytics for Maintenance & Value</h3>
            
            <p>
              AI won't just tell you if a car is genuine — it'll tell you <strong>how it will perform</strong>.
            </p>
            
            <p>
              By analyzing historical repair data, driving patterns, and sensor data, predictive models can forecast:
            </p>
            
            <ul>
              <li>When a component might fail</li>
              <li>The expected running cost over the next 12 months</li>
              <li>The car's fair market value trajectory</li>
            </ul>
            
            <p>
              For buyers, this means peace of mind. For dealers, it means smarter pricing.
            </p>
            
            <h3>3. Real-Time Verification and Smart Contracts</h3>
            
            <p>
              Soon, car ownership transfers could happen in real time.
            </p>
            
            <p>
              Smart contracts — powered by blockchain — will automatically trigger once verification conditions are met:
            </p>
            
            <ul>
              <li>All documents authenticated</li>
              <li>Payments verified</li>
              <li>Ownership digitally transferred through RTA integration</li>
            </ul>
            
            <p>
              The result? A transaction system where trust is built into the code itself.
            </p>
            
            <h3>4. AI-Generated Confidence Reports</h3>
            
            <p>
              Buyers of tomorrow won't ask, "Can I trust this car?" They'll ask, <strong>"What's its AI trust score?"</strong>
            </p>
            
            <p>
              Cararth and similar innovators are already prototyping AI-generated trust reports that combine:
            </p>
            
            <ul>
              <li>Verified ownership trail</li>
              <li>Maintenance predictions</li>
              <li>Sentiment analysis from user reviews</li>
              <li>Dealer credibility metrics</li>
            </ul>
            
            <p>
              This report becomes a digital certificate of confidence — visible on every verified listing.
            </p>
          </section>

          <Separator className="my-12" />

          <section id="checklist">
            <h2 className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              Section 5: How to Buy with Confidence — The AI-Era Verification Checklist
            </h2>
            
            <p>
              Technology is only useful if people know how to use it.
            </p>
            
            <p>
              Here's your AI-age car buying checklist for complete peace of mind.
            </p>
            
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 my-8">
              <h3 className="mt-0">🔍 Step 1: Verify Documents, Don't Just View Them</h3>
              <ul className="mb-0">
                <li>Ask for digital RC copies and check them against VAHAN (available through verification portals or Cararth's integrated systems).</li>
                <li>Avoid listings that provide only screenshots or images without QR-enabled verification.</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8">
              <h3 className="mt-0">🔧 Step 2: Inspect the Vehicle Digitally</h3>
              <ul className="mb-0">
                <li>AI-powered inspection tools analyze uploaded photos to detect repainting, part replacements, or damage inconsistencies.</li>
                <li>Even if you're buying offline, run the car's VIN through a verification platform before making an offer.</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6 my-8">
              <h3 className="mt-0">💰 Step 3: Trace the Transaction</h3>
              <ul className="mb-0">
                <li>Use platforms with RBI-compliant escrow systems to avoid fake payment receipts.</li>
                <li>Avoid peer-to-peer payments unless the seller is verified through a digital ID.</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-6 my-8">
              <h3 className="mt-0">🧠 Step 4: Assess the Seller's Digital Reputation</h3>
              <ul className="mb-0">
                <li>Dealers with verified profiles and higher AI Trust Scores indicate transparency.</li>
                <li>Cross-reference reviews, previous sales, and listings on Cararth's News or FAQ sections for credibility signals.</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-2 border-teal-200 dark:border-teal-800 rounded-lg p-6 my-8">
              <h3 className="mt-0">🛡️ Step 5: Compare Verification Platforms</h3>
              <p>Not all "verified" listings are created equal.</p>
              <p>When comparing, look for:</p>
              <ul className="mb-0">
                <li>API integration with VAHAN or insurance databases</li>
                <li>AI-based image and document analysis</li>
                <li>Transparent scoring methodology</li>
              </ul>
              <p className="mb-0">
                <strong>Cararth</strong>, for instance, applies multi-layer verification — combining document OCR, telematics data, and real-time compliance checks.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          <section id="conclusion">
            <h2>Conclusion: From Marketplace to Trust Network</h2>
            
            <p>
              The evolution of India's used car industry mirrors the evolution of the internet itself — from chaos to credibility.
            </p>
            
            <p>
              A decade ago, online listings were about volume. Today, the winners are about <strong>verification</strong>.
            </p>
            
            <p>
              AI verification doesn't just detect fraud; it redefines integrity. It allows a first-time buyer in Jaipur, a dealer in Coimbatore, and a platform in Mumbai to transact with the same confidence as a certified new-car showroom.
            </p>
            
            <p>
              <strong>Cararth is part of this transformation</strong> — not as a marketplace alone, but as a trust network where every car has a verified story.
            </p>
            
            <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200 italic border-l-4 border-purple-600 pl-4 my-8">
              In the near future, buyers won't choose between cheap and verified. They'll choose verified by default — because trust will be the new currency of mobility.
            </p>
          </section>

          <Separator className="my-12" />

          {/* Internal Links Section */}
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-8 my-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ExternalLink className="h-6 w-6" />
              Explore More on Cararth
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/">
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Search Verified Cars</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Browse AI-verified listings across India with real-time trust scores
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/dealer-portal">
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Dealer Portal</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        List verified inventory with multi-platform syndication
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/news">
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Throttle Talk</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Market insights, leadership news, and automotive community stories
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/faq">
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">FAQ & Support</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Get answers to common questions about AI verification
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

        </div>
      </article>

      {/* Footer CTA */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Experience AI-Verified Car Buying?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of buyers and sellers who trust Cararth's AI-powered verification platform
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" data-testid="button-cta-search">
                Start Searching Verified Cars
              </Button>
            </Link>
            <Link href="/dealer-portal">
              <Button size="lg" variant="outline" data-testid="button-cta-dealer">
                List Your Inventory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
