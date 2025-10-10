import { Facebook, Share2, Linkedin } from "lucide-react";
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
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);
  const shareText = encodeURIComponent(`${title}\n\n${description}\n\n${url}`);

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleWhatsAppShare = () => {
    window.open(
      `https://wa.me/?text=${shareText}`,
      '_blank'
    );
  };

  const handleLinkedInShare = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url,
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
