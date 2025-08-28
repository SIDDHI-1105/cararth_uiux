import { Link, useLocation } from "wouter";
import { Car, Heart, Menu } from "lucide-react";
import logoImage from "@/assets/logo.png";

export default function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0" data-testid="link-home">
              <div className="flex items-center">
                <img 
                  src={logoImage} 
                  alt="The Mobility Hub" 
                  className="h-10 w-10 mr-3"
                />
                <h1 className="text-xl font-bold text-primary">
                  The Mobility Hub
                </h1>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === "/" 
                    ? "text-primary bg-primary/10" 
                    : "text-foreground hover:text-primary"
                }`}
                data-testid="link-buy-cars"
              >
                Buy Cars
              </Link>
              <Link 
                href="/sell" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === "/sell" 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="link-sell-car"
              >
                Sell Your Car
              </Link>
              <a href="#" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Compare
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Reviews
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-muted-foreground hover:text-primary" data-testid="button-favorites">
              <Heart className="w-5 h-5" />
            </button>
            <button 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-login"
            >
              Login
            </button>
            <button className="md:hidden text-muted-foreground" data-testid="button-mobile-menu">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
