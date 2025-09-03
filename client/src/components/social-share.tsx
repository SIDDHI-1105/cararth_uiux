import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  MessageCircle, 
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { 
  SiLinkedin, 
  SiX, 
  SiFacebook, 
  SiWhatsapp 
} from "react-icons/si";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export default function SocialShare({ url, title, description, imageUrl }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
  const shareTitle = encodeURIComponent(title);
  const shareDescription = encodeURIComponent(description || title);
  const shareImage = imageUrl ? encodeURIComponent(imageUrl) : '';

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${shareTitle}&summary=${shareDescription}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&title=${shareTitle}&description=${shareDescription}`,
    whatsapp: `https://wa.me/?text=${shareTitle}%20${encodeURIComponent(shareUrl)}`
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Native share failed:', err);
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="flex items-center gap-2"
        data-testid="button-share"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-card border rounded-lg shadow-lg p-4 z-50 w-64">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm">Share this car</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
              data-testid="button-close-share"
            >
              ×
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-2 justify-start"
              data-testid="button-share-linkedin"
            >
              <SiLinkedin className="w-4 h-4 text-blue-600" />
              LinkedIn
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-2 justify-start"
              data-testid="button-share-twitter"
            >
              <SiX className="w-4 h-4 text-black dark:text-white" />
              X (Twitter)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="flex items-center gap-2 justify-start"
              data-testid="button-share-facebook"
            >
              <SiFacebook className="w-4 h-4 text-blue-500" />
              Facebook
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="flex items-center gap-2 justify-start"
              data-testid="button-share-whatsapp"
            >
              <SiWhatsapp className="w-4 h-4 text-green-500" />
              WhatsApp
            </Button>
          </div>

          <div className="border-t pt-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-2 py-1 text-xs bg-muted border rounded text-muted-foreground"
                data-testid="input-share-url"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 w-8 p-0"
                data-testid="button-copy-link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}