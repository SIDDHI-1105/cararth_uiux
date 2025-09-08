import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, Mail, Shield, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { TooltipWrapper } from '@/components/tooltip-wrapper';

interface ContactSellerProps {
  carId: string;
  carTitle: string;
  sellerId: string;
  sellerName: string;
  price: string;
  onConversationStarted?: (conversationId: string) => void;
}

export function ContactSeller({ carId, carTitle, sellerId, sellerName, price, onConversationStarted }: ContactSellerProps) {
  const [message, setMessage] = useState(`Hi! I'm interested in your ${carTitle}. Is it still available?`);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: (conversationData: any) =>
      fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData),
      }).then(res => res.json()),
    onSuccess: (conversation) => {
      // Send initial message
      sendMessageMutation.mutate({
        conversationId: conversation.id,
        content: message,
        senderId: 'demo-buyer-123', // In real app, get from auth context
      });
      // Notify parent component about new conversation
      onConversationStarted?.(conversation.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content, senderId }: any) =>
      fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, senderId }),
      }).then(res => res.json()),
    onSuccess: () => {
      setConversationStarted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Message Sent!",
        description: "Your message has been sent to the seller through our secure platform.",
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

  // Request contact details mutation (Premium feature)
  const requestContactMutation = useMutation({
    mutationFn: (conversationId: string) =>
      fetch(`/api/conversations/${conversationId}/request-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-buyer-123' }),
      }).then(res => res.json()),
    onSuccess: (response) => {
      if (response.contactShared) {
        toast({
          title: "Contact Details Shared",
          description: "Seller's contact information has been shared with you.",
        });
      }
    },
    onError: (error: any) => {
      if (error.message.includes('Premium subscription required')) {
        toast({
          title: "Premium Feature",
          description: "Upgrade to Premium to access direct contact details.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to get contact details.",
          variant: "destructive",
        });
      }
    },
  });

  const handleStartConversation = () => {
    if (!buyerName.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and message.",
        variant: "destructive",
      });
      return;
    }

    startConversationMutation.mutate({
      carId,
      buyerId: 'demo-buyer-123', // In real app, get from auth context
      sellerId,
      subject: carTitle,
      buyerDisplayName: `Buyer ${buyerName}`,
      sellerDisplayName: `Seller ${sellerName}`,
    });
  };

  if (conversationStarted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <MessageCircle className="h-5 w-5" />
            Message Sent Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Shield className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Privacy Protected</p>
              <p className="text-xs text-green-600">Your contact details are safe with us</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/messages'}
              data-testid="button-view-messages"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              View All Messages
            </Button>
            
            <TooltipWrapper trigger="button-get-contact-premium">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => requestContactMutation.mutate('demo-conversation-id')}
                disabled={requestContactMutation.isPending}
                data-testid="button-get-contact-premium"
              >
                <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                Get Direct Contact (Premium)
              </Button>
            </TooltipWrapper>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Contact Seller
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Secure Messaging</Badge>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Shield className="h-3 w-3 mr-1" />
            Privacy Protected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">{carTitle}</h4>
          <p className="text-lg font-bold text-blue-800">₹{price}</p>
          <p className="text-sm text-blue-600">Listed by: {sellerName}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Your Name</label>
            <Input
              placeholder="Enter your name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              data-testid="input-buyer-name"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Phone (Optional)</label>
            <Input
              placeholder="Your phone number"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              data-testid="input-buyer-phone"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Email (Optional)</label>
            <Input
              type="email"
              placeholder="Your email address"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              data-testid="input-buyer-email"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Message</label>
            <Textarea
              placeholder="Write your message to the seller... #themobilityhub.in"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              data-testid="textarea-message"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleStartConversation}
            disabled={startConversationMutation.isPending || sendMessageMutation.isPending}
            className="w-full"
            data-testid="button-send-message"
          >
            {startConversationMutation.isPending || sendMessageMutation.isPending ? (
              'Sending...'
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message Securely
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>✓ Your contact details are protected</p>
            <p>✓ Communicate safely through our platform</p>
            <p>✓ No spam or unwanted calls</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}