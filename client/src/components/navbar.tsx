import { Link, useLocation } from "wouter";
import { Car, Heart, Menu, X, MessageCircle, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import SocialMediaLinks from "@/components/social-media-links";
import logoImage from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();

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
                    Used Cars. Verified Sources.
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
                Buy Used Cars
              </Link>
              <Link 
                href="/sell-car" 
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  location === "/sell-car" || location === "/sell"
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
          
          <div className="flex items-center space-x-4">
            {/* Social Media Links - Desktop */}
            <div className="hidden lg:flex">
              <SocialMediaLinks size="sm" variant="header" />
            </div>
            
            <Button
              variant="ghost" 
              size="sm"
              className="hidden sm:flex text-muted-foreground hover:text-accent hover:bg-accent/10 h-9 w-9 p-0"
              data-testid="button-favorites"
            >
              <Heart className="w-4 h-4" />
            </Button>
            
            <ThemeToggle />
            
            {/* Authentication Section - Desktop */}
            {isLoading ? (
              <div className="hidden sm:flex h-9 w-20 bg-muted animate-pulse rounded-lg"></div>
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="hidden sm:flex items-center space-x-2 hover:bg-accent/10"
                    data-testid="button-user-menu"
                  >
                    {user.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {user.firstName || user.email?.split('@')[0] || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="flex items-center">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                asChild
                className="hidden sm:inline-flex btn-metallic px-6 py-2 text-sm font-semibold"
                data-testid="button-login"
              >
                <a href="/api/login">Login</a>
              </Button>
            )}
            
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
                href="/sell-car" 
                className={`block px-3 py-2 rounded-lg text-base font-semibold transition-all duration-300 ${
                  location === "/sell-car" || location === "/sell"
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
              <div className="pt-2 border-t border-border mt-2 space-y-3">
                {/* Social Media Links - Mobile */}
                <div className="px-3">
                  <p className="text-xs text-muted-foreground mb-2">Follow Us:</p>
                  <SocialMediaLinks size="sm" variant="header" />
                </div>
                
                {/* Authentication Section - Mobile */}
                {isLoading ? (
                  <div className="w-full h-12 bg-muted animate-pulse rounded-lg"></div>
                ) : isAuthenticated && user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-accent/10">
                      {user.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/profile">View Profile</Link>
                    </Button>
                    <Button
                      asChild
                      variant="destructive"
                      className="w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid="mobile-button-logout"
                    >
                      <a href="/api/logout">Logout</a>
                    </Button>
                  </div>
                ) : (
                  <Button
                    asChild
                    className="w-full btn-metallic py-3 text-base font-semibold"
                    data-testid="mobile-button-login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <a href="/api/login">Login</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
