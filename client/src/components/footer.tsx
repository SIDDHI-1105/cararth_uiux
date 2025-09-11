import { Link } from "wouter";
import { Mail, MessageCircle } from "lucide-react";
import SocialMediaLinks from "@/components/social-media-links";
import logoImage from "@assets/Gemini_Generated_Image_pqn5v6pqn5v6pqn5_1757601233537.png";

export default function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      {/* Legal Disclaimer Banner */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center text-center">
            <div className="text-sm text-primary">
              <span className="font-medium">🔒 Legal Compliance:</span> All vehicle data is sourced exclusively through verified APIs and publicly available market listings. We comply with all applicable data protection and privacy laws.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <img 
                src={logoImage} 
                alt="CarArth" 
                className="h-12 w-12 mr-3"
              />
              <div>
                <h3 className="text-xl font-bold text-primary">CarArth</h3>
                <p className="text-sm text-muted-foreground">India's First Used Car Search Engine</p>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              Discover cars from across platforms, compare smarter, and buy or sell with confidence. More than a marketplace — your guide, your community, your car's true value (arth).
            </p>
            <div className="text-xs text-muted-foreground">
              🇮🇳 Proudly Made in India
            </div>
          </div>

          {/* Popular Brands */}
          <div>
            <h4 className="font-semibold mb-4">Popular Brands</h4>
            <div className="space-y-2 text-sm">
              <Link href="/?brand=Maruti Suzuki" className="block text-muted-foreground hover:text-accent transition-colors">
                Maruti Suzuki
              </Link>
              <Link href="/?brand=Hyundai" className="block text-muted-foreground hover:text-accent transition-colors">
                Hyundai
              </Link>
              <Link href="/?brand=Tata" className="block text-muted-foreground hover:text-accent transition-colors">
                Tata Motors
              </Link>
              <Link href="/?brand=Mahindra" className="block text-muted-foreground hover:text-accent transition-colors">
                Mahindra
              </Link>
              <Link href="/?brand=Honda" className="block text-muted-foreground hover:text-accent transition-colors">
                Honda
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href="mailto:connect@cararth.com" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                  data-testid="link-email"
                >
                  connect@cararth.com
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <a 
                  href="https://wa.me/919573424321" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent transition-colors"
                  data-testid="link-whatsapp"
                >
                  WhatsApp: +91 XXXXX XXX21
                </a>
              </div>
              
              {/* Social Media Links */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Follow Us:</p>
                <SocialMediaLinks size="md" variant="footer" />
              </div>
            </div>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="font-semibold mb-4">Legal & Support</h4>
            <div className="space-y-2 text-sm">
              <Link href="/data-sources-policy" className="block text-muted-foreground hover:text-accent transition-colors">
                Data Sources Policy
              </Link>
              <Link href="/api-compliance" className="block text-muted-foreground hover:text-accent transition-colors">
                API Compliance
              </Link>
              <Link href="/privacy-policy" className="block text-muted-foreground hover:text-accent transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="block text-muted-foreground hover:text-accent transition-colors">
                Terms of Service
              </Link>
              <a href="mailto:connect@cararth.com" className="block text-muted-foreground hover:text-accent transition-colors">
                Contact Support
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2025 CarArth. All rights reserved. | Compliant with Indian IT Act 2000 & Copyright Act 1957
              <br />
              <span className="text-xs">Contact: connect@cararth.com</span>
              <br />
              <span className="text-xs mt-1">
                * All listings subject to verification. Prices may vary. * CarArth aggregates data from multiple sources - verify independently.
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>🔒 Secure Platform</span>
              <span>🚗 Authentic Listings</span>
              <span>⚖️ Legal Compliance</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}