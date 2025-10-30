import { Phone, MessageCircle, Mail } from "lucide-react";
import { useState } from "react";

interface ContactOptionsProps {
  listingId: string;
  sellerPhone?: string;
  onMessageClick: () => void;
}

export function ContactOptions({ listingId, sellerPhone = "+919999999999", onMessageClick }: ContactOptionsProps) {
  const handleContactClick = (type: "call" | "whatsapp" | "message") => {
    console.log("contact_click", { type, listingId });
    
    if (type === "message") {
      onMessageClick();
    }
  };

  const whatsappUrl = `https://wa.me/${sellerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    "Hi! I saw your car listing on CarArth and I'm interested. Can we discuss?"
  )}`;

  return (
    <section 
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800" 
      data-testid="section-contact-options"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Interested in this car?
      </h2>
      <div className="flex flex-col gap-3">
        <a
          href={`tel:${sellerPhone}`}
          onClick={() => handleContactClick("call")}
          className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-4 px-6 text-center font-medium text-lg flex items-center justify-center gap-2 transition-colors min-h-[48px]"
          data-testid="button-call-seller"
        >
          <Phone className="w-5 h-5" />
          Call Seller
        </a>
        
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleContactClick("whatsapp")}
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-4 px-6 text-center font-medium text-lg flex items-center justify-center gap-2 transition-colors min-h-[48px]"
          data-testid="button-whatsapp-seller"
        >
          <MessageCircle className="w-5 h-5" />
          Chat on WhatsApp
        </a>
        
        <button
          onClick={() => handleContactClick("message")}
          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl py-4 px-6 font-medium text-lg flex items-center justify-center gap-2 transition-colors min-h-[48px]"
          data-testid="button-send-message"
        >
          <Mail className="w-5 h-5" />
          Send Message
        </button>
      </div>
    </section>
  );
}
