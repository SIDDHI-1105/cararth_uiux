import { Facebook, X, Instagram, Youtube, Linkedin } from "lucide-react";

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
        href="https://www.facebook.com/profile.php?id=61580985187223"
        target="_blank"
        rel="noopener noreferrer"
        className={baseStyles}
        data-testid="social-facebook"
        title="Follow us on Facebook"
      >
        <Facebook className={iconSize} />
      </a>
      <span 
        className="text-muted-foreground/50 cursor-not-allowed opacity-60"
        data-testid="social-x"
        title="Coming Soon - Follow us on X"
      >
        <X className={iconSize} />
      </span>
      <a 
        href="https://www.instagram.com/cararthofficial"
        target="_blank"
        rel="noopener noreferrer"
        className={baseStyles}
        data-testid="social-instagram"
        title="Follow us on Instagram"
      >
        <Instagram className={iconSize} />
      </a>
      <span 
        className="text-muted-foreground/50 cursor-not-allowed opacity-60"
        data-testid="social-youtube"
        title="Coming Soon - Subscribe to our YouTube"
      >
        <Youtube className={iconSize} />
      </span>
      <span 
        className="text-muted-foreground/50 cursor-not-allowed opacity-60"
        data-testid="social-linkedin"
        title="Coming Soon - Connect on LinkedIn"
      >
        <Linkedin className={iconSize} />
      </span>
    </div>
  );
}