import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  Shield, 
  CheckCircle2,
  ArrowRight,
  Globe
} from 'lucide-react';
import { Link } from 'wouter';
import cararthLogo from '@assets/cararth-logo.png';

interface HeroStats {
  totalListings: number;
  totalPlatforms: number;
  platforms: { name: string; count: number }[];
}

export default function SellYourCar() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    sellerType: 'individual' as 'individual' | 'dealer',
    message: ''
  });

  const { data: stats } = useQuery<HeroStats>({
    queryKey: ['/api/hero-stats'],
  });

  // SEO Metadata
  useEffect(() => {
    // Set page title
    document.title = 'Sell Your Car Online - Join Our Beta | Cararth';
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Join Cararth\'s beta for automated seller syndication. List once, reach buyers across multiple marketplaces. AI-powered insights with multi-marketplace distribution.'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Join Cararth\'s beta for automated seller syndication. List once, reach buyers across multiple marketplaces. AI-powered insights with multi-marketplace distribution.';
      document.head.appendChild(meta);
    }

    // Open Graph tags for social sharing
    const ogTags = [
      { property: 'og:title', content: 'Join Cararth Beta - Early Access Car Marketplace | Cararth' },
      { property: 'og:description', content: 'Beta access to automated seller syndication. List once, distribute across multiple marketplaces with AI-powered insights.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: window.location.href },
      { property: 'og:site_name', content: 'Cararth' },
    ];

    ogTags.forEach(tag => {
      let element = document.querySelector(`meta[property="${tag.property}"]`);
      if (element) {
        element.setAttribute('content', tag.content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', tag.property);
        meta.setAttribute('content', tag.content);
        document.head.appendChild(meta);
      }
    });

    // Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Join Cararth Beta - Early Access Car Marketplace | Cararth' },
      { name: 'twitter:description', content: 'Beta access to automated seller syndication. List once, distribute across multiple marketplaces with AI-powered insights.' },
    ];

    twitterTags.forEach(tag => {
      let element = document.querySelector(`meta[name="${tag.name}"]`);
      if (element) {
        element.setAttribute('content', tag.content);
      } else {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });

    // Cleanup function to reset title on unmount
    return () => {
      document.title = 'Cararth - India\'s Used Car Search Engine';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/seller-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit lead');
      }

      toast({
        title: "Thank you for your interest!",
        description: "Our team will contact you within 24 hours.",
      });
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        sellerType: 'individual',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or call us directly.",
        variant: "destructive",
      });
    }
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('seller-lead-form');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src={cararthLogo} alt="Cararth" className="h-10 md:h-12" />
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Search Cars
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Sell Your Car to <span className="text-primary">Lakhs of Buyers</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Join our beta to experience automated seller syndication. List once, reach buyers across multiple marketplaces with AI-powered insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="text-lg px-8 py-6" onClick={scrollToForm} data-testid="button-list-now">
                  List Your Car Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={scrollToForm} data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="border-2">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">BETA</div>
                  <div className="text-muted-foreground">Early Access Program</div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{stats?.totalListings || 300}+</div>
                  <div className="text-muted-foreground">Active Listings</div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">24hrs</div>
                  <div className="text-muted-foreground">Average Sale Time</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
              Why Choose Cararth?
            </h2>
            <p className="text-center text-muted-foreground text-lg mb-12">
              The smartest way to sell your car in India
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Automated Seller Syndication</h3>
                  <p className="text-muted-foreground">
                    List your car once and we automatically distribute it across multiple marketplaces. Beta testers get early access to this powerful feature.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">AI-Powered Pricing</h3>
                  <p className="text-muted-foreground">
                    Get real-time market intelligence and optimal pricing recommendations based on actual sales data and trends.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Verified Buyers Only</h3>
                  <p className="text-muted-foreground">
                    Connect with serious, verified buyers. No spam calls or fake inquiries. Your privacy is protected.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Instant Listing</h3>
                  <p className="text-muted-foreground">
                    List your car in under 5 minutes. Our smart form auto-fills details, you just upload photos and you're live.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Dealer Dashboard</h3>
                  <p className="text-muted-foreground">
                    For dealers: Manage unlimited inventory, bulk uploads, real-time analytics and automated compliance checks.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Best Price Guaranteed</h3>
                  <p className="text-muted-foreground">
                    Get the best market value for your car with our AI-powered price insights and wide buyer reach.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
              How It Works
            </h2>
            <p className="text-center text-muted-foreground text-lg mb-12">
              Sell your car in 3 simple steps
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Create Your Listing</h3>
                <p className="text-muted-foreground">
                  Fill in car details, upload photos, set your price. Our AI helps you price it right.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Multi-Marketplace Distribution</h3>
                <p className="text-muted-foreground">
                  Your listing automatically syndicates to multiple marketplaces. Beta sellers get priority placement and exclusive syndication features.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Get Verified Offers</h3>
                <p className="text-muted-foreground">
                  Receive calls and messages from real buyers. Close the deal on your terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seller Types - Dealers vs Individuals */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
              Built for Every Seller
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Individual Sellers */}
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-8">
                  <h3 className="text-2xl font-bold mb-4">Individual Sellers</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Simple 5-minute listing process</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Connect directly with serious buyers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Price guidance based on market data</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>No hidden fees or commissions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Safe and secure transactions</span>
                    </li>
                  </ul>
                  <Button className="w-full" size="lg" onClick={scrollToForm} data-testid="button-individual-seller">
                    List as Individual
                  </Button>
                </CardContent>
              </Card>

              {/* Dealers */}
              <Card className="border-2 border-primary/30 hover:border-primary/50 transition-colors bg-primary/5">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-2xl font-bold">Dealers & Showrooms</h3>
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">POPULAR</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Unlimited inventory management</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Bulk CSV upload for multiple listings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Advanced analytics dashboard</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Automated multi-marketplace syndication</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span>Priority support and training</span>
                    </li>
                  </ul>
                  <Button className="w-full" size="lg" variant="default" onClick={scrollToForm} data-testid="button-dealer">
                    Register as Dealer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form / Lead Capture */}
      <section id="seller-lead-form" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground text-lg">
                Fill in your details and we'll help you list your car in minutes
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                      data-testid="input-seller-name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone Number <span className="text-destructive">*</span>
                      </label>
                      <Input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        data-testid="input-seller-phone"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email Address <span className="text-destructive">*</span>
                      </label>
                      <Input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        data-testid="input-seller-email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      I am a <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={formData.sellerType === 'individual' ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, sellerType: 'individual' })}
                        className="flex-1"
                        data-testid="button-type-individual"
                      >
                        Individual Seller
                      </Button>
                      <Button
                        type="button"
                        variant={formData.sellerType === 'dealer' ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, sellerType: 'dealer' })}
                        className="flex-1"
                        data-testid="button-type-dealer"
                      >
                        Dealer/Showroom
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tell us about your car (optional)
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="E.g., 2018 Maruti Swift VXI, excellent condition..."
                      rows={4}
                      data-testid="input-seller-message"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" data-testid="button-submit-seller-form">
                    Get Started - List Your Car
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Beta Status */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-6 py-3 bg-primary/10 border-2 border-primary/20 rounded-full mb-6">
              <span className="text-primary font-bold text-lg">🚀 Beta: Multi-Marketplace Syndication</span>
            </div>
            <p className="text-muted-foreground text-lg">
              We're testing automated seller syndication with early adopters. List once, reach buyers everywhere. Join our beta for exclusive access to multi-marketplace distribution.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Join Thousands of Happy Sellers
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Experience automated seller syndication. List once, distribute across multiple marketplaces.
          </p>
          <div className="flex justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={scrollToForm} data-testid="button-footer-cta">
              List Your Car Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
