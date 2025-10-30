import { MessageCircle } from "lucide-react";

interface FloatingCTAProps {
  onClick: () => void;
}

export function FloatingCTA({ onClick }: FloatingCTAProps) {
  const scrollToContact = () => {
    const contactSection = document.querySelector('[data-testid="section-contact-options"]');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    onClick();
  };

  return (
    <button
      onClick={scrollToContact}
      className="fixed bottom-6 right-6 md:hidden bg-blue-700 hover:bg-blue-800 text-white rounded-full px-6 py-4 font-semibold text-lg flex items-center gap-2 shadow-lg z-50 transition-all hover:scale-105"
      data-testid="button-floating-contact"
      aria-label="Contact Seller"
    >
      <MessageCircle className="w-5 h-5" />
      Contact Seller
    </button>
  );
}
