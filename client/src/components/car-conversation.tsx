import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, DollarSign, Check, X, Clock } from 'lucide-react';
import { ContactSeller } from './contact-seller';

interface Message {
  id: string;
  senderId: string;
  senderType: 'buyer' | 'seller';
  content: string;
  messageType: 'text' | 'offer';
  offerAmount?: number;
  offerStatus?: string;
  createdAt: string;
}

interface CarConversationProps {
  carId: string;
  carTitle: string;
  sellerId: string;
  sellerName: string;
  price: string;
  currentUserId?: string;
  userType?: 'buyer' | 'seller';
}

export function CarConversation({ 
  carId, 
  carTitle, 
  sellerId, 
  sellerName, 
  price,
  currentUserId = 'demo-buyer-123',
  userType = 'buyer'
}: CarConversationProps) {
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check for existing conversation
  const { data: existingConversation } = useQuery({
    queryKey: ['/api/conversations', { carId, userId: currentUserId }],
    queryFn: () => 
      fetch(`/api/conversations?userId=${currentUserId}&userType=${userType}`)
        .then(res => res.json())
        .then(conversations => conversations.find((conv: any) => conv.carId === carId)),
  });

  // Set conversation ID when found
  useEffect(() => {
    if (existingConversation?.id) {
      setConversationId(existingConversation.id);
    }
  }, [existingConversation]);

  // Fetch messages for this conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: () => conversationId ? 
      fetch(`/api/conversations/${conversationId}/messages?userId=${currentUserId}`)
        .then(res => res.json()) : 
      Promise.resolve([]),
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { content: string; senderId: string }) =>
      fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      setNewMessage('');
    },
  });

  // Make offer mutation
  const makeOfferMutation = useMutation({
    mutationFn: (offerData: { senderId: string; offerAmount: number }) =>
      fetch(`/api/conversations/${conversationId}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
    },
  });

  // Respond to offer mutation
  const respondToOfferMutation = useMutation({
    mutationFn: ({ messageId, response }: { messageId: string; response: string }) =>
      fetch(`/api/messages/${messageId}/offer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, response }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !conversationId) return;

    sendMessageMutation.mutate({
      content: newMessage,
      senderId: currentUserId,
    });
  };

  const handleMakeOffer = (amount: number) => {
    if (!conversationId) return;

    makeOfferMutation.mutate({
      senderId: currentUserId,
      offerAmount: amount,
    });
  };

  const handleOfferResponse = (messageId: string, response: string) => {
    respondToOfferMutation.mutate({ messageId, response });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // If no conversation exists, show contact seller component
  if (!conversationId) {
    return (
      <ContactSeller
        carId={carId}
        carTitle={carTitle}
        sellerId={sellerId}
        sellerName={sellerName}
        price={price}
        onConversationStarted={(id: string) => setConversationId(id)}
      />
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Conversation with {userType === 'buyer' ? sellerName : 'Buyer'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Secure Chat</Badge>
          <Badge variant="outline" className="text-green-600 border-green-600">
            Privacy Protected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-4" data-testid="messages-container">
          {messagesLoading ? (
            <div className="text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500">Start the conversation!</div>
          ) : (
            messages.map((message: Message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.id}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.senderId === currentUserId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {message.messageType === 'offer' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">
                          Offer: ₹{message.offerAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={
                          message.offerStatus === 'accepted' ? 'default' :
                          message.offerStatus === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {message.offerStatus}
                        </Badge>
                      </div>
                      {message.senderId !== currentUserId && message.offerStatus === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOfferResponse(message.id, 'accepted')}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            data-testid={`button-accept-offer-${message.id}`}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOfferResponse(message.id, 'rejected')}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            data-testid={`button-reject-offer-${message.id}`}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick offer buttons for buyers */}
        {userType === 'buyer' && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMakeOffer(500000)}
              disabled={makeOfferMutation.isPending}
              data-testid="button-quick-offer-5l"
            >
              Quick Offer: ₹5L
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMakeOffer(600000)}
              disabled={makeOfferMutation.isPending}
              data-testid="button-quick-offer-6l"
            >
              Quick Offer: ₹6L
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMakeOffer(700000)}
              disabled={makeOfferMutation.isPending}
              data-testid="button-quick-offer-7l"
            >
              Quick Offer: ₹7L
            </Button>
          </div>
        )}
        
        {/* Message input */}
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={sendMessageMutation.isPending}
            data-testid="input-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}