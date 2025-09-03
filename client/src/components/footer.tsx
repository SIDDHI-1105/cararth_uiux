import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, MessageCircle } from "lucide-react";
import logoImage from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <img 
                src={logoImage} 
                alt="The Mobility Hub" 
                className="h-12 w-12 mr-3"
              />
              <div>
                <h3 className="text-xl font-bold text-primary">The Mobility Hub</h3>
                <p className="text-sm text-muted-foreground">Your Journey. Simplified.</p>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              India's premier car marketplace aggregator. Find the best deals across all major portals with complete legal compliance and transparency.
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
                  href="mailto:kritarth@themobilityhub.in" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                  data-testid="link-email"
                >
                  kritarth@themobilityhub.in
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
                  WhatsApp: +91 9573424321
                </a>
              </div>
              
              {/* Social Media Links */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Follow Us:</p>
                <div className="flex space-x-3">
                  <a 
                    href="https://facebook.com/themobilityhub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-facebook"
                    title="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://twitter.com/mobilityhubin" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-twitter"
                    title="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://instagram.com/themobilityhub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-instagram"
                    title="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://youtube.com/@themobilityhub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-youtube"
                    title="YouTube"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://linkedin.com/company/themobilityhub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-linkedin"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-accent transition-colors">
                Help Center
              </a>
              <a href="mailto:kritarth@themobilityhub.in" className="block text-muted-foreground hover:text-accent transition-colors">
                Contact Us
              </a>
              <a href="#" className="block text-muted-foreground hover:text-accent transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="block text-muted-foreground hover:text-accent transition-colors">
                Terms of Service
              </a>
              <a href="#" className="block text-muted-foreground hover:text-accent transition-colors">
                Legal Compliance
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2025 The Mobility Hub. All rights reserved. | Compliant with Indian IT Act 2000 & Copyright Act 1957
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