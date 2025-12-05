import { Link } from "wouter";
import { Mail, MessageCircle } from "lucide-react";
import SocialMediaLinks from "@/components/social-media-links";
import { BrandWordmark } from "@/components/brand-wordmark";

export default function Footer() {
  return (
    <footer className="border-t backdrop-blur-md transition-all duration-300" style={{ backgroundColor: 'var(--glass-bg)', borderTopColor: 'var(--glass-border)' }}>
      {/* Legal Disclaimer Banner - Glassmorphic */}
      <div className="border-b backdrop-blur-sm" style={{ backgroundColor: 'rgba(11,29,83,0.06)', borderBottomColor: 'rgba(11,29,83,0.12)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center text-center">
            <div className="text-sm" style={{ color: 'var(--brand)' }}>
              <span className="font-bold">🔒 Legal Compliance:</span> All vehicle data is sourced exclusively through verified APIs and publicly available market listings. We comply with all applicable data protection and privacy laws.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-6">
              <BrandWordmark variant="footer" showTagline={true} className="transition-opacity duration-300 hover:opacity-90" />
            </Link>
            <p className="text-base mb-6 max-w-md leading-relaxed" style={{ color: 'var(--secondary-text)' }}>
              Discover cars from across platforms, compare smarter, and buy or sell with confidence. More than a marketplace — your guide, your community, your trusted car partner.
            </p>
            <div className="text-sm" style={{ color: 'var(--secondary-text)' }}>
              🇮🇳 Proudly Made in India
            </div>
          </div>

          {/* Popular Brands */}
          <div>
            <h4 className="font-bold text-lg mb-6" style={{ color: 'var(--foreground)' }}>Popular Brands</h4>
            <div className="space-y-3 text-base">
              <Link href="/?brand=Maruti Suzuki" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Maruti Suzuki
              </Link>
              <Link href="/?brand=Hyundai" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Hyundai
              </Link>
              <Link href="/?brand=Tata" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Tata Motors
              </Link>
              <Link href="/?brand=Mahindra" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Mahindra
              </Link>
              <Link href="/?brand=Honda" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Honda
              </Link>
            </div>
          </div>

          {/* Popular Cities */}
          <div>
            <h4 className="font-bold text-lg mb-6" style={{ color: 'var(--foreground)' }}>Popular Cities</h4>
            <div className="space-y-3 text-base">
              <Link href="/used-cars-hyderabad" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Hyderabad
              </Link>
              <Link href="/used-cars-delhi-ncr" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Delhi NCR
              </Link>
              <Link href="/used-cars-mumbai" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Mumbai
              </Link>
              <Link href="/used-cars-bangalore" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Bangalore
              </Link>
              <Link href="/used-cars-pune" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Pune
              </Link>
              <Link href="/used-cars-chennai" className="block transition-colors hover-brand" style={{ color: 'var(--secondary-text)' }}>
                Chennai
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-bold text-lg mb-6" style={{ color: 'var(--foreground)' }}>Contact Us</h4>
            <div className="space-y-4 text-base">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5" style={{ color: 'var(--secondary-text)' }} />
                <a 
                  href="mailto:connect@cararth.com" 
                  className="transition-colors hover-brand"
                  data-testid="link-email"
                  style={{ color: 'var(--secondary-text)' }}
                >
                  connect@cararth.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-5 w-5" style={{ color: 'var(--secondary-text)' }} />
                <a 
                  href="https://wa.me/919573424321" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-colors hover-brand"
                  data-testid="link-whatsapp"
                  style={{ color: 'var(--secondary-text)' }}
                >
                  WhatsApp: +91 XXXXX XXX21
                </a>
              </div>
              
              {/* Social Media Links */}
              <div className="pt-4">
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--secondary-text)' }}>Follow Us:</p>
                <SocialMediaLinks size="md" variant="footer" />
              </div>
            </div>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="font-bold text-lg mb-6" style={{ color: 'var(--foreground)' }}>Legal & Support</h4>
            <div className="space-y-3 text-base">
              <Link href="/faq" className="block transition-colors hover:text-[#0071E3]" data-testid="link-faq" style={{ color: 'var(--secondary-text)' }}>
                FAQ
              </Link>
              <Link href="/data-sources-policy" className="block transition-colors hover:text-[#0071E3]" style={{ color: 'var(--secondary-text)' }}>
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
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © {new Date().getFullYear()} CarArth.com — A unit of Aaro7 Fintech Pvt. Ltd.
              <br />
              <a href="mailto:connect@cararth.com" className="hover:text-accent transition-colors">connect@cararth.com</a> | Built on trust, powered by AI.
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