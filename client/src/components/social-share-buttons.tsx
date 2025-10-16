import { Facebook, Share2, Linkedin, Twitter } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export default function SocialShareButtons({ 
  url, 
  title, 
  description = "",
  className = "" 
}: SocialShareButtonsProps) {
  // Use actual current domain in development, cararth.com in production
  const actualUrl = url.startsWith('http') 
    ? url 
    : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
  
  const shareUrl = encodeURIComponent(actualUrl);
  
  // Tastefully add CarArth branding if not already present
  const brandedTitle = title.includes('CarArth') ? title : `${title} | CarArth`;
  const shareTitle = encodeURIComponent(brandedTitle);
  
  // WhatsApp: Include title, description, and URL with CarArth branding
  const whatsappText = description 
    ? encodeURIComponent(`${brandedTitle}\n\n${description}\n\n📱 Read more: ${actualUrl}`)
    : encodeURIComponent(`${brandedTitle}\n\n📱 Read more: ${actualUrl}`);
  
  // Twitter: Add "via @CarArth" if not already present
  const twitterText = title.toLowerCase().includes('cararth') 
    ? shareTitle 
    : encodeURIComponent(`${title} via CarArth`);

  const handleFacebookShare = () => {
    // Facebook uses Open Graph meta tags, so it will automatically show CarArth branding
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleWhatsAppShare = () => {
    window.open(
      `https://wa.me/?text=${whatsappText}`,
      '_blank'
    );
  };

  const handleLinkedInShare = () => {
    // LinkedIn uses Open Graph meta tags for branding
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${shareUrl}&text=${twitterText}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: brandedTitle,
          text: description,
          url: actualUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleFacebookShare}
        className="gap-2"
        data-testid="button-share-facebook"
      >
        <Facebook className="h-4 w-4" />
        Share on Facebook
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsAppShare}
        className="gap-2 text-green-600 hover:text-green-700 dark:text-green-500"
        data-testid="button-share-whatsapp"
      >
        <SiWhatsapp className="h-4 w-4" />
        Share on WhatsApp
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLinkedInShare}
        className="gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-500"
        data-testid="button-share-linkedin"
      >
        <Linkedin className="h-4 w-4" />
        Share on LinkedIn
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="gap-2 text-blue-400 hover:text-blue-500 dark:text-blue-400"
        data-testid="button-share-twitter"
      >
        <Twitter className="h-4 w-4" />
        Share on Twitter
      </Button>

      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="gap-2"
          data-testid="button-share-native"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      )}
    </div>
  );
}
