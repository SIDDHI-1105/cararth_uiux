import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Phone, Mail, Car, Clock, DollarSign, Check, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Conversation {
  id: string;
  carId: string;
  subject: string;
  buyerDisplayName: string;
  sellerDisplayName: string;
  lastMessageAt: string;
  isRead: boolean;
  status: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'buyer' | 'seller';
  content: string;
  messageType: 'text' | 'system' | 'offer';
  offerAmount?: number;
  offerStatus?: string;
  isRead: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const [userId] = useState('demo-user-123'); // In real app, get from auth context
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations', { userId, userType }],
    queryFn: () => fetch(`/api/conversations?userId=${userId}&userType=${userType}`).then(res => res.json()),
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', activeConversation, 'messages'],
    queryFn: () => activeConversation ? 
      fetch(`/api/conversations/${activeConversation}/messages?userId=${userId}`).then(res => res.json()) :
      Promise.resolve([]),
    enabled: !!activeConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { content: string; senderId: string }) =>
      apiRequest(`/api/conversations/${activeConversation}/messages`, messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setNewMessage('');
    },
  });

  // Make offer mutation
  const makeOfferMutation = useMutation({
    mutationFn: (offerData: { senderId: string; offerAmount: number }) =>
      apiRequest(`/api/conversations/${activeConversation}/offers`, offerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversation, 'messages'] });
    },
  });

  // Respond to offer mutation
  const respondToOfferMutation = useMutation({
    mutationFn: ({ messageId, response }: { messageId: string; response: string }) =>
      fetch(`/api/messages/${messageId}/offer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, response }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversation, 'messages'] });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    sendMessageMutation.mutate({
      content: newMessage,
      senderId: userId,
    });
  };

  const handleMakeOffer = (amount: number) => {
    if (!activeConversation) return;

    makeOfferMutation.mutate({
      senderId: userId,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <div className="flex gap-2">
            <Button
              variant={userType === 'buyer' ? 'default' : 'outline'}
              onClick={() => setUserType('buyer')}
              data-testid="button-buyer-view"
            >
              Buyer View
            </Button>
            <Button
              variant={userType === 'seller' ? 'default' : 'outline'}
              onClick={() => setUserType('seller')}
              data-testid="button-seller-view"
            >
              Seller View
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[520px]">
              {conversationsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet. Start browsing cars to connect with sellers!
                </div>
              ) : (
                conversations.map((conversation: Conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      activeConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setActiveConversation(conversation.id)}
                    data-testid={`conversation-${conversation.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{conversation.subject}</h3>
                      {!conversation.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {userType === 'buyer' ? conversation.sellerDisplayName : conversation.buyerDisplayName}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                        {conversation.status}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Messages Thread */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {activeConversation ? 
                    conversations.find((c: Conversation) => c.id === activeConversation)?.subject || 'Conversation' :
                    'Select a conversation'
                  }
                </span>
                {activeConversation && (
                  <Button variant="outline" size="sm" data-testid="button-request-contact">
                    <Phone className="h-4 w-4 mr-2" />
                    Request Contact
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[520px]">
              {!activeConversation ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4" data-testid="messages-container">
                    {messagesLoading ? (
                      <div className="text-center text-gray-500">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500">No messages yet. Say hello!</div>
                    ) : (
                      messages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${message.id}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === userId
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
                                {message.senderId !== userId && message.offerStatus === 'pending' && (
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
                            <p className="text-xs opacity-70 mt-1">
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t pt-4">
                    <div className="flex gap-2 mb-3">
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
                        onClick={() => handleMakeOffer(750000)}
                        disabled={makeOfferMutation.isPending}
                        data-testid="button-quick-offer-7.5l"
                      >
                        Quick Offer: ₹7.5L
                      </Button>
                    </div>
                    
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
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}