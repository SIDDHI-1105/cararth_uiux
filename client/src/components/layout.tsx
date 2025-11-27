import { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  className?: string;
  containerSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

/**
 * Unified layout wrapper component ensuring consistent structure across all pages.
 * 
 * Features:
 * - Consistent navbar and footer placement
 * - Responsive container sizing
 * - Theme-aware backgrounds
 * - Proper min-height for full viewport coverage
 * - Standardized padding and spacing
 */
export default function Layout({ 
  children, 
  showNavbar = true, 
  showFooter = true, 
  className = "",
  containerSize = "xl"
}: LayoutProps) {
  const containerClass = {
    sm: "max-w-2xl",
    md: "max-w-4xl", 
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-8xl",
    full: "max-w-full"
  }[containerSize];

  return (
    <div 
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        minHeight: '100vh',
      }}
      className="page-background transition-colors duration-300"
    >
      {showNavbar && <Navbar />}
      
      <main className="content-wrapper flex-1 pt-28">
        <div className={`container-responsive ${containerClass} ${className}`}>
          <div className="page-content">
            {children}
          </div>
        </div>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}

/**
 * Layout variant for pages that need full-width content (like hero sections)
 * but still want consistent navbar/footer
 */
export function FullWidthLayout({ 
  children, 
  showNavbar = true, 
  showFooter = true, 
  className = ""
}: Omit<LayoutProps, "containerSize">) {
  return (
    <div 
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        minHeight: '100vh',
      }}
      className="page-background transition-colors duration-300"
    >
      {showNavbar && <Navbar />}
      
      <main className="content-wrapper flex-1">
        <div className={className}>
          {children}
        </div>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}

/**
 * Layout variant for centered content (like forms, single articles)
 */
export function CenteredLayout({ 
  children, 
  showNavbar = true, 
  showFooter = true, 
  className = ""
}: Omit<LayoutProps, "containerSize">) {
  return (
    <div 
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        minHeight: '100vh',
      }}
      className="page-background transition-colors duration-300"
    >
      {showNavbar && <Navbar />}
      
      <main className="content-wrapper flex-1 flex items-center justify-center">
        <div className={`w-full max-w-2xl mx-auto px-4 py-8 ${className}`}>
          {children}
        </div>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}