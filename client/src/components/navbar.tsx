import { Link, useLocation } from "wouter";
import { Car, Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import logoImage from "@/assets/logo.png";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="nav-carbon carbon-fiber sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0" data-testid="link-home">
              <div className="flex items-center group">
                <div className="relative">
                  <img 
                    src={logoImage} 
                    alt="The Mobility Hub" 
                    className="h-12 w-12 sm:h-14 sm:w-14 mr-3 transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-metallic-accent/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-primary font-heading tracking-tight">
                    The Mobility Hub
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">
                    Your Journey. Simplified.
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="hidden lg:block">
            <div className="ml-10 flex items-center space-x-1">
              <Link 
                href="/" 
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  location === "/" 
                    ? "text-accent-foreground bg-accent shadow-metallic" 
                    : "text-foreground hover:text-accent hover:bg-accent/10"
                }`}
                data-testid="link-buy-cars"
              >
                Buy Cars
              </Link>
              <Link 
                href="/sell" 
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  location === "/sell" 
                    ? "text-accent-foreground bg-accent shadow-metallic" 
                    : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                }`}
                data-testid="link-sell-car"
              >
                Sell Your Car
              </Link>
              <Link 
                href="/blog" 
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  location === "/blog" 
                    ? "text-accent-foreground bg-accent shadow-metallic" 
                    : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                }`}
                data-testid="link-blog"
              >
                Auto News
              </Link>
              <a href="#" className="text-muted-foreground hover:text-accent hover:bg-accent/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300">
                Analytics
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost" 
              size="sm"
              className="hidden sm:flex text-muted-foreground hover:text-accent hover:bg-accent/10 h-9 w-9 p-0"
              data-testid="button-favorites"
            >
              <Heart className="w-4 h-4" />
            </Button>
            
            <ThemeToggle />
            
            <Button 
              className="hidden sm:inline-flex btn-metallic px-6 py-2 text-sm font-semibold"
              data-testid="button-login"
            >
              Login
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-muted-foreground hover:text-accent hover:bg-accent/10 h-9 w-9 p-0"
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-card/95 backdrop-blur-sm">
              <Link 
                href="/" 
                className={`block px-3 py-2 rounded-lg text-base font-semibold transition-all duration-300 ${
                  location === "/" 
                    ? "text-accent-foreground bg-accent" 
                    : "text-foreground hover:text-accent hover:bg-accent/10"
                }`}
                data-testid="mobile-link-buy-cars"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Buy Cars
              </Link>
              <Link 
                href="/sell" 
                className={`block px-3 py-2 rounded-lg text-base font-semibold transition-all duration-300 ${
                  location === "/sell" 
                    ? "text-accent-foreground bg-accent" 
                    : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                }`}
                data-testid="mobile-link-sell-car"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sell Your Car
              </Link>
              <Link 
                href="/blog" 
                className={`block px-3 py-2 rounded-lg text-base font-semibold transition-all duration-300 ${
                  location === "/blog" 
                    ? "text-accent-foreground bg-accent" 
                    : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                }`}
                data-testid="mobile-link-blog"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Auto News
              </Link>
              <a 
                href="#" 
                className="block text-muted-foreground hover:text-accent hover:bg-accent/10 px-3 py-2 rounded-lg text-base font-semibold transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Analytics
              </a>
              <div className="pt-2 border-t border-border mt-2">
                <Button
                  className="w-full btn-metallic py-3 text-base font-semibold"
                  data-testid="mobile-button-login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
