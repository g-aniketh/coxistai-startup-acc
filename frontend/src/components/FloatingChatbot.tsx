'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  Minimize2,
  Maximize2,
  X,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient, DashboardSummary } from '@/lib/api';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Parse markdown and return React elements
const parseMarkdown = (text: string) => {
  const parts: (string | React.ReactElement)[] = [];
  let key = 0;

  // Regex to match **bold** text
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  let lastIndex = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the bold text
    parts.push(
      <strong key={key++} className="font-bold">
        {match[1]}
      </strong>
    );
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no bold text was found, return the original text
  if (parts.length === 0) {
    return text;
  }

  return parts;
};

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI CFO assistant. How can I help you with your startup's finances today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch dashboard summary when chatbot opens
  useEffect(() => {
    if (isOpen && !summary && !isLoadingSummary) {
      setIsLoadingSummary(true);
      apiClient.dashboard.summary()
        .then((response) => {
          if (response.success && response.data) {
            setSummary(response.data);
          }
        })
        .catch((error) => {
          console.error('Failed to load dashboard summary:', error);
        })
        .finally(() => {
          setIsLoadingSummary(false);
        });
    }
  }, [isOpen, summary, isLoadingSummary]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current && isOpen && !isMinimized) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }
  }, [messages, isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Generate AI response based on the question
      const response = await generateAIResponse(inputValue.trim());
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, I encountered an error processing your request. Please try again or visit the full AI Assistant page.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (question: string): Promise<{ content: string }> => {
    try {
      // Use AI chat endpoint for conversational responses
      const response = await apiClient.ai.chat(question);
      
      if (response.success && response.data) {
        return {
          content: response.data.response
        };
      } else {
        throw new Error(response.message || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('AI chat error:', error);
      
      // Fallback: Try to provide basic answer using local data
      let data = summary;
      if (!data) {
        try {
          const summaryResponse = await apiClient.dashboard.summary();
          if (summaryResponse.success && summaryResponse.data) {
            data = summaryResponse.data;
            setSummary(summaryResponse.data);
          }
        } catch (fetchError) {
          console.error('Failed to fetch summary:', fetchError);
        }
      }

      // If we have data, provide a helpful response
      if (data) {
        const summaryText = `I'm having trouble connecting to the AI service right now, but here's a quick overview:\n\n• **Cash Balance:** ${currencyFormatter.format(data.financial.totalBalance || 0)}\n• **Monthly Revenue:** ${currencyFormatter.format(data.financial.monthlyRevenue || 0)}\n• **Monthly Burn Rate:** ${currencyFormatter.format(data.financial.monthlyBurn || 0)}\n• **Runway:** ${data.financial.runwayMonths ? `${data.financial.runwayMonths.toFixed(1)} months` : 'N/A'}\n\nPlease try your question again in a moment, or visit the full AI Assistant for comprehensive analysis.`;
        return {
          content: summaryText
        };
      }

      return {
        content: "I'm having trouble accessing the AI service right now. Please try again in a moment or visit the full AI Assistant page."
      };
    }
  };

  const handleOpenFullChat = () => {
    router.push('/ai-assistant');
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        >
          <div className="relative">
            <Sparkles className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <span className="font-medium text-base">How can I help you?</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px]">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI CFO Assistant</h3>
              <p className="text-xs text-blue-100">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMinimize}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={toggleOpen}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages - Only show when expanded */}
        {!isMinimized && (
          <>
            <div className="h-[400px] bg-white overflow-hidden">
              <ScrollArea ref={scrollAreaRef} className="h-full">
                <div className="p-4 space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-3",
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.type === 'ai' && (
                      <div className="shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-3",
                        message.type === 'user'
                          ? 'bg-[#607c47] text-white'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {parseMarkdown(message.content)}
                      </div>
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {message.type === 'user' && (
                      <div className="shrink-0 w-8 h-8 bg-[#607c47] rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-gray-50/50 rounded-b-xl">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask your AI CFO anything..."
                    className="pr-12 bg-white rounded-lg h-12 text-sm"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={isLoading || !inputValue.trim()}
                    className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 rounded-md bg-[#607c47] hover:bg-[#4a6129]"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={handleOpenFullChat}
                  variant="outline"
                  className="w-full text-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100"
                >
                  Open Full AI Assistant
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </form>
            </div>
          </>
        )}

        {/* Minimized State - Just show header */}
        {isMinimized && (
          <div className="p-4 bg-gray-50">
            <Button
              onClick={toggleMinimize}
              variant="ghost"
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              Click to expand chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

