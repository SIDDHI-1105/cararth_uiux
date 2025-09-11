import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Sparkles, Loader2, Bot, User } from "lucide-react";
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
  onFiltersUpdate?: (filters: any) => void;
  onSearch?: (filters: any) => void;
  isLoading?: boolean;
}

export default function TheAssistant({ onFiltersUpdate, onSearch, isLoading }: TheAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm The Assistant 👋 I'm here to help you find the perfect car. Just tell me what you're looking for in plain English - like 'I need a family SUV under 15 lakhs' or 'Show me automatic Maruti cars'.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log('🤖 Sending message to The Assistant:', message);
      
      const response = await apiRequest('POST', '/api/assistant/chat', {
        message,
        filters: {},
        context: messages.length > 1 ? 'Ongoing conversation' : 'First interaction'
      });

      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ The Assistant response:', data);
      
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

      // If assistant suggested filters and wants to search, trigger search
      if (data.action === 'search' && data.suggestedFilters && Object.keys(data.suggestedFilters).length > 0) {
        console.log('🔍 The Assistant triggering search with filters:', data.suggestedFilters);
        onFiltersUpdate?.(data.suggestedFilters);
        onSearch?.(data.suggestedFilters);
      } else if (data.suggestedFilters && Object.keys(data.suggestedFilters).length > 0) {
        // Just update filters without searching
        onFiltersUpdate?.(data.suggestedFilters);
      }
    },
    onError: (error: any) => {
      console.error('❌ The Assistant error:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'assistant',
        content: "I'm sorry, I'm having trouble right now. Could you try asking your question again?",
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
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800">
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="assistant-header"
      >
        <CardTitle className="flex items-center justify-between text-lg font-bold">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Bot className="w-5 h-5" />
            <span>The Assistant</span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900">
            {isExpanded ? 'Click to minimize' : 'Click to chat'}
          </Badge>
        </CardTitle>
        {!isExpanded && (
          <p className="text-sm text-muted-foreground">
            Ask me anything about cars - I'll help you find the perfect match!
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4" data-testid="assistant-content">
          {/* Chat Messages */}
          <ScrollArea className="h-80 w-full border rounded-lg p-3 bg-white/50 dark:bg-gray-900/50">
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
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      }`}
                    >
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
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
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about cars..."
              className="flex-1 text-sm"
              disabled={chatMutation.isPending || isLoading}
              data-testid="assistant-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatMutation.isPending || isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="assistant-send-button"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            Powered by GPT • Ask me anything about cars
          </div>
        </CardContent>
      )}
    </Card>
  );
}