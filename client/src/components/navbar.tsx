import { Link, useLocation } from "wouter";
import { Car, Heart, Menu, X, MessageCircle, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import SocialMediaLinks from "@/components/social-media-links";
import { BrandWordmark } from "@/components/brand-wordmark";
import { useAuth } from "@/hooks/useAuth";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from "@/components/auth-dialog";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <>
      {/* Launch Status Banner */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 text-center text-base md:text-lg font-semibold border-b shadow-sm">
        🚀 <strong>Hyderabad – Live Now!</strong> Authentic listings available | 🔄 <strong>Delhi NCR – Coming Soon</strong> | Expanding across India
      </div>
      <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-[90px] md:min-h-[112px] py-4">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex-shrink-0" data-testid="link-home">
              <div className="flex items-center group">
                <BrandWordmark variant="header" showTagline={true} className="transition-transform duration-300 hover:scale-105" />
              </div>
            </Link>
          </div>
          
          <div className="hidden lg:block">
            <div className="ml-10 flex items-center space-x-1">
              <Link 
                href="/" 
                className={`px-4 py-2 rounded-lg text-base md:text-lg font-semibold transition-all duration-300 ${
                  location === "/" 
                    ? "text-accent-foreground bg-accent" 
                    : "text-foreground hover:text-accent hover:bg-accent/10"
                }`}
                data-testid="link-buy-cars"
              >
                Buy
              </Link>
              <TooltipWrapper trigger="sell-car-link">
                <Link 
                  href="/sell-car" 
                  className={`px-4 py-2 rounded-lg text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-lg ${
                    location === "/sell-car" || location === "/sell"
                      ? "text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md" 
                      : "text-foreground hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 hover:shadow-md border-2 border-green-500/20 hover:border-green-500"
                  }`}
                  data-testid="link-sell-car"
                >
                  💰 Sell
                </Link>
              </TooltipWrapper>
              <Link 
                href="/news" 
                className={`px-4 py-2 rounded-lg text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-lg ${
                  location === "/news" 
                    ? "text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md" 
                    : "text-foreground hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:shadow-md border-2 border-blue-500/20 hover:border-blue-500"
                }`}
                data-testid="link-throttle-talk"
              >
                🚗 Throttle Talk
              </Link>
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
                  {user.role === 'partner' && (
                    <DropdownMenuItem asChild>
                      <Link href="/partner/dashboard" className="flex items-center">
                        <Car className="w-4 h-4 mr-2" />
                        Partner Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="flex items-center">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:block">
                <AuthDialog />
              </div>
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
            <div className="px-2 pt-2 pb-3 space-y-2 bg-card">
              <Link 
                href="/" 
                className={`block px-4 py-4 rounded-lg text-lg font-semibold transition-all duration-300 min-h-[44px] flex items-center ${
                  location === "/" 
                    ? "text-accent-foreground bg-accent" 
                    : "text-foreground hover:text-accent hover:bg-accent/10"
                }`}
                data-testid="mobile-link-buy-cars"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Buy
              </Link>
              <Link 
                href="/sell-car" 
                className={`block px-4 py-4 rounded-lg text-lg font-semibold transition-all duration-300 min-h-[44px] flex items-center transform active:scale-95 ${
                  location === "/sell-car" || location === "/sell"
                    ? "text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md" 
                    : "text-foreground hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 hover:shadow-md border-2 border-green-500/20"
                }`}
                data-testid="mobile-link-sell-car"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                💰 Sell
              </Link>
              <Link 
                href="/news" 
                className={`block px-4 py-4 rounded-lg text-lg font-semibold transition-all duration-300 min-h-[44px] flex items-center transform active:scale-95 ${
                  location === "/news" 
                    ? "text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md" 
                    : "text-foreground hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:shadow-md border-2 border-blue-500/20"
                }`}
                data-testid="mobile-link-throttle-talk"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🚗 Throttle Talk
              </Link>
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
                    {user.role === 'partner' && (
                      <Button
                        asChild
                        variant="default"
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                        data-testid="mobile-button-partner-dashboard"
                      >
                        <Link href="/partner/dashboard" className="flex items-center justify-center">
                          <Car className="w-4 h-4 mr-2" />
                          Partner Dashboard
                        </Link>
                      </Button>
                    )}
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
                  <div className="px-4 py-2">
                    <AuthDialog />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
