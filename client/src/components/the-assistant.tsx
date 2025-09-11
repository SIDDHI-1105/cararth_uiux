import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Sparkles, Loader2, Bot, User, Lock, LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  suggestedFilters?: any;
  action?: string;
  timestamp: Date;
}

interface TheAssistantProps {
  // No filter integration - The Assistant works independently
  isAuthenticated?: boolean;
  userEmail?: string | null;
}

export default function TheAssistant({ isAuthenticated = false, userEmail }: TheAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi, I'm your Cararth Assistant. How may I help you find the perfect car today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Constants for chat limits
  const MAX_FREE_CHATS = 5;
  const isAtChatLimit = !isAuthenticated && chatCount >= MAX_FREE_CHATS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Check chat limits before making request
      if (isAtChatLimit) {
        throw new Error('Chat limit reached. Please log in to continue.');
      }
      
      const response = await apiRequest('POST', '/api/assistant/chat', {
        message,
        filters: {},
        context: messages.length > 1 ? 'Ongoing conversation' : 'First interaction'
      });

      return response.json();
    },
    onSuccess: (data) => {
      // Update chat count from server response
      if (data.chatInfo && !isAuthenticated) {
        setChatCount(data.chatInfo.currentCount || 0);
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: data.message,
        suggestedFilters: data.suggestedFilters,
        action: data.action,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // The Assistant now works independently - no filter updates to Advanced Search
      // Users see search results directly in the conversation or separate search page
    },
    onError: (error: any) => {
      
      // Handle specific error responses from backend
      let errorContent = "I'm sorry, I'm having trouble right now. Could you try asking your question again?";
      
      // Handle structured error responses properly
      if (error.status === 401 && error.data?.code === 'CHAT_LIMIT_REACHED') {
        // Chat limit reached - update count from server response
        setChatCount(error.data.currentCount || MAX_FREE_CHATS);
        errorContent = `🔒 You've used all ${error.data.maxChats || MAX_FREE_CHATS} free chats. Please log in to continue unlimited chatting!`;
      } else if (error.status === 401) {
        errorContent = "🔑 Authentication required. Please log in to use The Assistant.";
      } else if (error.status === 403) {
        errorContent = "📱 Phone verification required to use The Assistant.";
      } else if (error.status === 429) {
        errorContent = "⏰ Too many requests. Please wait a moment and try again.";
      } else if (error.status >= 500) {
        errorContent = "🔧 Server error. Our team is working on it. Please try again in a few minutes.";
      } else if (error.data?.error) {
        errorContent = error.data.error;
      } else {
        // Fallback for any unstructured errors
        errorContent = "I'm sorry, I'm having trouble right now. Could you try asking your question again?";
      }
      
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage.trim());
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQueries = [
    "I need a family SUV under 15 lakhs",
    "Show me automatic Maruti cars in Hyderabad",
    "What's the best sedan for a first-time buyer?",
    "Find me fuel-efficient cars with good resale value"
  ];

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 border-2 border-transparent bg-clip-border shadow-xl backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-blue-400/10 to-indigo-500/10 rounded-lg"></div>
      <CardHeader 
        className="cursor-pointer relative z-10" 
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="assistant-header"
      >
        <CardTitle className="flex items-center justify-between text-lg font-bold">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white animate-pulse" />
              </div>
            </div>
            <div>
              <div className="text-gray-800 dark:text-gray-200 font-bold">Assistant</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isAuthenticated 
                  ? `Welcome back, ${userEmail?.split('@')[0] || 'User'}!` 
                  : `${MAX_FREE_CHATS - chatCount} free chats left`
                }
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge 
              variant="secondary" 
              className={`text-xs px-2 py-1 ${
                isAuthenticated 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : isAtChatLimit
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              }`}
            >
              {isAuthenticated ? '✓ Premium' : isAtChatLimit ? 'Login Required' : 'Free Trial'}
            </Badge>
            <span className="text-xs text-gray-400">
              {isExpanded ? 'Tap to minimize' : 'Tap to chat'}
            </span>
          </div>
        </CardTitle>
        {!isExpanded && (
          <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              🚗 Find your perfect car with AI
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Natural language search • Instant results
            </p>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 relative z-10" data-testid="assistant-content">
          {/* Authentication Required Message */}
          {isAtChatLimit && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200">Chat Limit Reached</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">You've used all 5 free chats. Log in to continue chatting!</p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => window.location.href = '/login'}
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Login
                </Button>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea className="h-80 w-full border-2 border-purple-100 dark:border-purple-800 rounded-lg p-3 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[80%] ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      }`}
                    >
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-purple-100 dark:border-purple-700 shadow-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.suggestedFilters && Object.keys(message.suggestedFilters).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(message.suggestedFilters).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value as string}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 border border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Queries */}
          {messages.length <= 2 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQueries.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-auto p-2 text-left justify-start text-xs hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => {
                      setInputMessage(query);
                      handleSendMessage();
                    }}
                    data-testid={`suggested-query-${index}`}
                  >
                    <MessageSquare className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{query}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="space-y-3">
            <div className="flex gap-2 p-3 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-700/80 rounded-lg border border-purple-100 dark:border-purple-800 backdrop-blur-sm">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAtChatLimit ? "Login required to continue..." : "Ask me about cars..."}
                className="flex-1 text-sm border-0 bg-transparent focus:ring-2 focus:ring-purple-400 focus:ring-offset-0"
                disabled={chatMutation.isPending || isAtChatLimit}
                data-testid="assistant-input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending || isAtChatLimit}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md"
                data-testid="assistant-send-button"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                🤖 Powered by AI • Independent search
              </span>
              {!isAuthenticated && (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  {chatCount}/{MAX_FREE_CHATS} free chats used
                </span>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}