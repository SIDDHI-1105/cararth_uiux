import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type InsertContact } from "@shared/schema";
import { X } from "lucide-react";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carTitle: string;
}

export default function ContactModal({ open, onOpenChange, carId, carTitle }: ContactModalProps) {
  const [formData, setFormData] = useState({
    buyerName: "",
    buyerPhone: "",
    buyerEmail: "",
    message: `I'm interested in ${carTitle}. Please share more details.`,
  });

  const { toast } = useToast();

  const contactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      return apiRequest("POST", "/api/contacts", data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Your inquiry has been sent to the seller. They will contact you soon.",
      });
      onOpenChange(false);
      setFormData({
        buyerName: "",
        buyerPhone: "",
        buyerEmail: "",
        message: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate({
      carId,
      ...formData,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-contact">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle data-testid="text-modal-title">Contact Seller</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={formData.buyerName}
              onChange={(e) => handleInputChange("buyerName", e.target.value)}
              required
              data-testid="input-name"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={formData.buyerPhone}
              onChange={(e) => handleInputChange("buyerPhone", e.target.value)}
              required
              data-testid="input-phone"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.buyerEmail}
              onChange={(e) => handleInputChange("buyerEmail", e.target.value)}
              required
              data-testid="input-email"
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="I'm interested in this car... #themobilityhub.in"
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              className="h-24"
              data-testid="textarea-message"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={contactMutation.isPending}
              data-testid="button-send"
            >
              {contactMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
