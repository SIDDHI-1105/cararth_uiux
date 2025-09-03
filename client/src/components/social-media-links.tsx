import { Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";

interface SocialMediaLinksProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "header" | "footer";
}

export default function SocialMediaLinks({ 
  className = "", 
  size = "md",
  variant = "header" 
}: SocialMediaLinksProps) {
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };

  const iconSize = iconSizes[size];
  
  const baseStyles = variant === "header" 
    ? "text-muted-foreground hover:text-primary transition-colors duration-200"
    : "text-muted-foreground hover:text-accent transition-colors duration-200";

  return (
    <div className={`flex space-x-3 ${className}`}>
      <a 
        href="https://facebook.com/themobilityhub" 
        target="_blank" 
        rel="noopener noreferrer"
        className={baseStyles}
        data-testid="social-facebook"
        title="Follow us on Facebook"
      >
        <Facebook className={iconSize} />
      </a>
      <a 
        href="https://twitter.com/mobilityhubin" 
        target="_blank" 
        rel="noopener noreferrer"
        className={baseStyles}
        data-testid="social-twitter"
        title="Follow us on Twitter"
      >
        <Twitter className={iconSize} />
      </a>
      <a 
        href="https://instagram.com/themobilityhub" 
        target="_blank" 
        rel="noopener noreferrer"
        className={baseStyles}
        data-testid="social-instagram"
        title="Follow us on Instagram"
      >
        <Instagram className={iconSize} />
      </a>
      <a 
        href="https://youtube.com/@themobilityhub" 
        target="_blank" 
        rel="noopener noreferrer"
        className={baseStyles}
        data-testid="social-youtube"
        title="Subscribe to our YouTube"
      >
        <Youtube className={iconSize} />
      </a>
      <a 
        href="https://linkedin.com/company/themobilityhub" 
        target="_blank" 
        rel="noopener noreferrer"
        className={baseStyles}
        data-testid="social-linkedin"
        title="Connect on LinkedIn"
      >
        <Linkedin className={iconSize} />
      </a>
    </div>
  );
}