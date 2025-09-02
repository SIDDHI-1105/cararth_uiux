import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, User, Mail, MessageSquare, Shield, 
  CheckCircle, AlertCircle, Send, ArrowRight 
} from 'lucide-react';

interface ContactSellerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: any;
}

export default function ContactSellerModal({ 
  open, 
  onOpenChange, 
  listing 
}: ContactSellerModalProps) {
  const [step, setStep] = useState<'contact' | 'verify' | 'success'>('contact');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  // Send contact request mutation
  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/marketplace/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          listingId: listing.id,
          listingTitle: listing.title
        })
      });
      if (!response.ok) throw new Error('Failed to send contact request');
      return response.json();
    },
    onSuccess: () => {
      setStep('verify');
      toast({
        title: "Verification Required",
        description: "We've sent an OTP to your phone number for verification.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send contact request. Please try again.",
        variant: "destructive",
      });
    }
  });

  // OTP verification mutation  
  const verifyMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      const response = await fetch('/api/marketplace/verify-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          otp: otpCode,
          listingId: listing.id
        })
      });
      if (!response.ok) throw new Error('Invalid OTP');
      return response.json();
    },
    onSuccess: () => {
      setStep('success');
      toast({
        title: "Contact Shared Successfully!",
        description: "The seller will contact you shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Invalid OTP",
        description: "Please check the code and try again.",
        variant: "destructive",
      });
    }
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    contactMutation.mutate(formData);
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate(otp);
  };

  const resetModal = () => {
    setStep('contact');
    setFormData({ name: '', phone: '', email: '', message: '' });
    setOtp('');
    setIsVerifying(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'contact' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Seller
              </DialogTitle>
              <DialogDescription>
                Get in touch with the seller for {listing.title}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    className="pl-9"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+91 98765 43210"
                    className="pl-9"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="pl-9"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Hi, I'm interested in your car. When can I schedule a test drive?"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  data-testid="textarea-message"
                />
              </div>

              <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Secure Contact</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll verify your phone number via OTP before sharing your contact details with the seller.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={contactMutation.isPending}
                data-testid="button-send-contact"
              >
                {contactMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Contact Request
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {step === 'verify' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Verify Your Phone
              </DialogTitle>
              <DialogDescription>
                Enter the 6-digit OTP sent to {formData.phone}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  data-testid="input-otp"
                />
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Why verify?</p>
                      <p className="text-muted-foreground">
                        Phone verification helps prevent spam and ensures genuine buyer-seller interactions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('contact')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleVerifyOTP}
                  disabled={verifyMutation.isPending || otp.length !== 6}
                  className="flex-1"
                  data-testid="button-verify-otp"
                >
                  {verifyMutation.isPending ? (
                    "Verifying..."
                  ) : (
                    <>
                      Verify
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="w-full text-xs">
                Didn't receive OTP? Resend in 30s
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Contact Shared Successfully!
              </DialogTitle>
              <DialogDescription>
                Your contact details have been shared with the seller
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">What happens next?</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        The seller will contact you on {formData.phone} within 24 hours to discuss the {listing.title}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 bg-muted/50 rounded text-center">
                  <MessageSquare className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-medium">SMS Updates</div>
                  <div className="text-xs text-muted-foreground">Get status updates</div>
                </div>
                <div className="p-3 bg-muted/50 rounded text-center">
                  <Shield className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-medium">Safe Buying</div>
                  <div className="text-xs text-muted-foreground">Verified contacts</div>
                </div>
              </div>

              <Button 
                onClick={() => handleClose(false)} 
                className="w-full"
                data-testid="button-close-success"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}