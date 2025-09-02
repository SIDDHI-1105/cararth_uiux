import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, MessageCircle, Shield, Star, Clock, 
  CheckCircle, Eye, Crown, Lock, AlertCircle 
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderType: 'buyer' | 'seller';
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
}

interface MessagingSystemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle: string;
  userType: 'buyer' | 'seller';
  isProUser?: boolean;
}

export default function MessagingSystem({ 
  open, 
  onOpenChange, 
  listingId, 
  listingTitle, 
  userType,
  isProUser = false 
}: MessagingSystemProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showContactDetails, setShowContactDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversation messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/conversations', listingId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${listingId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: open,
    refetchInterval: isProUser ? 5000 : 30000 // Pro users get real-time updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/conversations/${listingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          senderType: userType,
          listingTitle
        })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', listingId] });
      toast({
        title: "Message Sent",
        description: "Your message has been delivered securely.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Request contact details (Pro feature)
  const requestContactMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/conversations/${listingId}/request-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderType: userType })
      });
      if (!response.ok) throw new Error('Failed to request contact');
      return response.json();
    },
    onSuccess: () => {
      setShowContactDetails(true);
      toast({
        title: "Contact Details Shared",
        description: "Contact information is now available in the conversation.",
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOtherPartyType = () => userType === 'buyer' ? 'seller' : 'buyer';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[80vh] flex flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Secure Messaging
            {isProUser && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            )}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {listingTitle}
          </div>
        </DialogHeader>

        {/* Privacy Notice */}
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-green-700 mb-1">Privacy Protected</p>
                <p className="text-muted-foreground">
                  Your contact details are kept private. Messages are securely transmitted through our platform.
                  {isProUser ? ' Real-time messaging active.' : ' Pro users get real-time updates.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-muted-foreground">Loading conversation...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-1">Start the conversation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send your first message to the {getOtherPartyType()}
                </p>
                <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                  <p>💡 Keep messages professional and relevant to the car listing</p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message: Message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === userType ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.senderType === userType
                      ? 'bg-accent text-accent-foreground ml-4'
                      : 'bg-muted mr-4'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium capitalize">
                      {message.senderType === userType ? 'You' : `${message.senderType}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.isRead && message.senderType === userType && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <Separator className="my-3" />

        {/* Pro Features */}
        {isProUser && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestContactMutation.mutate()}
                disabled={requestContactMutation.isPending || showContactDetails}
                className="flex-1"
              >
                {showContactDetails ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Contact Shared
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Request Contact
                  </>
                )}
              </Button>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Real-time
              </Badge>
            </div>
            
            {showContactDetails && (
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs">
                    <div className="flex items-center gap-1 mb-2">
                      <Crown className="w-3 h-3 text-yellow-500" />
                      <span className="font-medium">Pro Feature - Contact Details</span>
                    </div>
                    <div className="space-y-1 text-muted-foreground">
                      <p>📱 Phone: +91 98765 43210</p>
                      <p>📧 Email: seller@example.com</p>
                      <p className="text-xs">Contact shared securely through Pro membership</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Free User Upgrade Prompt */}
        {!isProUser && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Crown className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-yellow-800 mb-1">Upgrade to Pro</p>
                  <p className="text-yellow-700 mb-2">
                    Get real-time messaging, contact details, and priority support
                  </p>
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                    <Crown className="w-3 h-3 mr-1" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
            data-testid="input-message"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        <div className="text-xs text-center text-muted-foreground mt-2">
          <Lock className="w-3 h-3 inline mr-1" />
          Messages are encrypted and your contact details remain private
        </div>
      </DialogContent>
    </Dialog>
  );
}