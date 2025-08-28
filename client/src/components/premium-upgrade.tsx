import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, TrendingUp, Bell, Heart, Filter, BarChart3 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PremiumUpgradeProps {
  currentPlan?: "free" | "premium_buyer";
  onUpgrade?: () => void;
}

export default function PremiumUpgrade({ currentPlan = "free", onUpgrade }: PremiumUpgradeProps) {
  const [selectedPlan, setSelectedPlan] = useState<"premium_buyer" | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const upgradeMutation = useMutation({
    mutationFn: async (plan: "premium_buyer") => {
      return await apiRequest(`/api/subscriptions`, "POST", {
        plan, 
        amount: plan === "premium_buyer" ? 299 : 0 
      });
    },
    onSuccess: () => {
      toast({
        title: "Upgrade Successful!",
        description: "Your premium features are now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onUpgrade?.();
    },
    onError: (error) => {
      toast({
        title: "Upgrade Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = () => {
    if (selectedPlan) {
      upgradeMutation.mutate(selectedPlan);
    }
  };

  const features = {
    free: [
      "Basic car search across portals",
      "Standard filtering options",
      "View car listings",
      "Contact sellers",
    ],
    premium_buyer: [
      "Advanced filtering (maintenance history, accident reports)",
      "Price history graphs & market trends",
      "Instant alerts for new matching cars",
      "Direct dealer contact (skip lead forms)",
      "Unlimited saved searches & favorites",
      "Car comparison tool (up to 5 cars)",
      "Priority customer support",
      "Market analysis reports",
    ],
  };

  if (currentPlan === "premium_buyer") {
    return (
      <Card className="steel-gradient border-accent">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            Premium Buyer Active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You're enjoying all premium buyer features!
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-accent" />
              Market Analytics
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-accent" />
              Price Alerts
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4 text-accent" />
              Advanced Filters
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-accent" />
              Comparison Tools
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Upgrade to Premium</h2>
        <p className="text-muted-foreground">
          Get advanced features to find your perfect car faster
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card className="steel-gradient border-steel-primary/30">
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <div className="text-3xl font-bold">₹0<span className="text-sm font-normal">/month</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button disabled className="w-full">
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Premium Buyer Plan */}
        <Card className={`steel-gradient border-2 ${selectedPlan === "premium_buyer" ? "border-accent shadow-lg" : "border-yellow-500"} relative`}>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-4 py-1 rounded-full text-xs font-bold">
              RECOMMENDED
            </span>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              Premium Buyer
            </CardTitle>
            <div className="text-3xl font-bold">₹299<span className="text-sm font-normal">/month</span></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.premium_buyer.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full btn-metallic"
              onClick={() => setSelectedPlan("premium_buyer")}
              data-testid="button-select-premium"
            >
              Select Premium
            </Button>
          </CardContent>
        </Card>
      </div>

      {selectedPlan && (
        <Card className="steel-gradient border-accent">
          <CardHeader>
            <CardTitle>Complete Your Upgrade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Premium Buyer Plan</span>
              <span className="font-bold">₹299/month</span>
            </div>
            <Button 
              onClick={handleUpgrade}
              disabled={upgradeMutation.isPending}
              className="w-full btn-metallic"
              data-testid="button-upgrade-now"
            >
              {upgradeMutation.isPending ? "Processing..." : "Upgrade Now"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Your premium features will be activated immediately after payment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}