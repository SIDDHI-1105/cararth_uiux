import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Newspaper, 
  TrendingUp, 
  MessageSquare, 
  BarChart3,
  Users,
  Calendar,
  ArrowRight,
  Sparkles,
  BookOpen,
  LineChart,
  MapPin
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ThrottleTalkMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThrottleTalkMegaMenu({ isOpen, onClose }: ThrottleTalkMegaMenuProps) {
  const menuItems = [
    {
      icon: BookOpen,
      title: "Best Used Cars 2025",
      description: "Complete buyer's guide",
      href: "/guides/best-used-cars-india-2025",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
      isNew: true,
    },
    {
      icon: LineChart,
      title: "Market Analysis 2025",
      description: "Growth trends to 2030",
      href: "/guides/used-car-market-india-2025",
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/20",
      isNew: true,
    },
    {
      icon: MapPin,
      title: "Hyderabad Guide 2025",
      description: "6,500+ local listings",
      href: "/guides/used-cars-hyderabad-2025",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      isNew: true,
    },
    {
      icon: Sparkles,
      title: "AI Verification Guide",
      description: "Ultimate trust guide",
      href: "/guides/ai-verified-used-car-trust-india",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      icon: TrendingUp,
      title: "Market News",
      description: "Latest automotive insights",
      href: "/news?tab=intelligence",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: MessageSquare,
      title: "Community Stories",
      description: "Real owner experiences",
      href: "/news?tab=community",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="absolute left-0 w-screen top-full mt-2 z-[100]"
      style={{ left: '50%', transform: 'translateX(-50%)' }}
      onMouseLeave={onClose}
      data-testid="mega-menu-throttle-talk"
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        <Card className="overflow-hidden shadow-2xl border-2 bg-background backdrop-blur-sm">
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuItems.map((item) => (
                <Link 
                  key={item.title} 
                  href={item.href}
                  onClick={onClose}
                >
                  <Button
                    variant="ghost"
                    className="w-full h-auto min-h-[60px] p-4 justify-start hover:bg-accent/50 transition-all group"
                    data-testid={`mega-menu-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className={cn(
                      "p-2 rounded-lg mr-3 transition-transform group-hover:scale-110",
                      item.bgColor
                    )}>
                      <item.icon className={cn("h-5 w-5", item.color)} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="font-semibold text-sm">{item.title}</div>
                        {item.isNew && (
                          <Badge className="bg-green-500 dark:bg-green-600 text-white text-[10px] px-1.5 py-0">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                  </Button>
                </Link>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t text-center">
              <Link href="/news" onClick={onClose}>
                <Button variant="link" size="sm" data-testid="button-view-all">
                  View All Articles
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
