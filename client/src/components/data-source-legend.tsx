import React from "react";
import { Badge } from "@/components/ui/badge";
import { Info, Shield, Award, Building, Store } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataSourceLegendProps {
  className?: string;
  compact?: boolean;
}

export default function DataSourceLegend({ className = "", compact = false }: DataSourceLegendProps) {
  const sourceCategories = [
    {
      title: "OEM/Certified Sources",
      description: "Premium certified pre-owned programs with highest trust levels",
      icon: Award,
      sources: [
        { name: "Maruti True Value", color: "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 font-semibold" }
      ]
    },
    {
      title: "Government/SARFAESI Auctions", 
      description: "Official government portals and SARFAESI Act compliance",
      icon: Building,
      sources: [
        { name: "IBAPI - Official Government Portal", color: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 font-semibold" },
        { name: "SARFAESI Government Auctions", color: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 font-semibold" },
        { name: "SBI Bank Auction", color: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-medium" },
        { name: "HDFC Bank Auction", color: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-medium" }
      ]
    },
    {
      title: "Primary Marketplaces",
      description: "Major automotive platforms with extensive listings",
      icon: Store,
      sources: [
        { name: "CarDekho", color: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700" },
        { name: "Cars24", color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700" },
        { name: "OLX Autos", color: "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700" },
        { name: "CarWale", color: "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700" }
      ]
    },
    {
      title: "Secondary Sources",
      description: "Additional automotive platforms and specialized dealers",
      icon: Shield,
      sources: [
        { name: "AutoTrader", color: "bg-slate-100 dark:bg-slate-800/20 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600" },
        { name: "Spinny", color: "bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-600" },
        { name: "Droom", color: "bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-600" },
        { name: "CarTrade", color: "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-600" }
      ]
    }
  ];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help ${className}`}>
              <Info className="w-3 h-3" />
              <span>Data Sources</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Source Color Guide</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-xs">OEM</Badge>
                  <span className="text-xs">Certified Programs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs">SARFAESI</Badge>
                  <span className="text-xs">Government Auctions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-200 text-xs">Bank</Badge>
                  <span className="text-xs">Institutional Auctions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs">Primary</Badge>
                  <span className="text-xs">Major Marketplaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-xs">Secondary</Badge>
                  <span className="text-xs">Other Sources</span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4" />
          Data Source Guide
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Color-coded badges show where each listing originates for transparency and trust
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sourceCategories.map((category, index) => {
          const IconComponent = category.icon;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <IconComponent className="w-3 h-3 text-muted-foreground" />
                <h4 className="text-xs font-medium">{category.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground pl-5">{category.description}</p>
              <div className="flex flex-wrap gap-1 pl-5">
                {category.sources.map((source, sourceIndex) => (
                  <Badge 
                    key={sourceIndex}
                    className={`text-xs ${source.color}`}
                  >
                    {source.name}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Tap any source badge on listings for haptic feedback and source details
          </p>
        </div>
      </CardContent>
    </Card>
  );
}