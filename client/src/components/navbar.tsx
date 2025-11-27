import { Link, useLocation } from "wouter";
import { Car, Heart, Menu, X, MessageCircle, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import SocialMediaLinks from "@/components/social-media-links";
import { BrandWordmark } from "@/components/brand-wordmark";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from "@/components/auth-dialog";
import { ThrottleTalkMegaMenu } from "@/components/throttle-talk-mega-menu";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <>
      {/* Launch Status Banner - VISIBLE */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, backgroundColor: '#16a34a', color: 'white', padding: '8px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid rgba(0,0,0,0.1)', width: '100%' }}>
        🚀 <strong>Hyderabad – Live Now!</strong> | <strong>Delhi NCR – Coming Soon</strong>
      </div>
      
      {/* Main Navigation - VISIBLE */}
      <nav style={{ position: 'fixed', top: '40px', left: 0, right: 0, zIndex: 9998, backgroundColor: 'white', color: 'black', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%', display: 'flex', alignItems: 'center', height: '64px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="flex-shrink-0" data-testid="link-home">
            <BrandWordmark variant="header" showTagline={false} />
          </Link>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link href="/" style={{ padding: '8px 16px', cursor: 'pointer', color: location === '/' ? '#0071E3' : 'black', fontWeight: '600' }} data-testid="link-buy-cars">
              Buy
            </Link>
            <Link href="/sell-car" style={{ padding: '8px 16px', cursor: 'pointer', color: location === '/sell-car' ? 'white' : 'black', backgroundColor: location === '/sell-car' ? '#16a34a' : 'transparent', borderRadius: '6px', fontWeight: '600' }} data-testid="link-sell-car">
              💰 Sell
            </Link>
            <Link href="/news" style={{ padding: '8px 16px', cursor: 'pointer', color: location === '/news' ? 'white' : 'black', backgroundColor: location === '/news' ? '#3b82f6' : 'transparent', borderRadius: '6px', fontWeight: '600' }} data-testid="link-throttle-talk">
              🚗 News
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
