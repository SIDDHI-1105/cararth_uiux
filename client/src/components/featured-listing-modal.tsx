import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star, TrendingUp, Eye, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeaturedListingModalProps {
  carId: string;
  carTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FeaturedListingModal({ carId, carTitle, isOpen, onClose }: FeaturedListingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"7" | "15" | "30">("15");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const featuredPlans = {
    "7": { days: 7, price: 500, savings: 0, popular: false },
    "15": { days: 15, price: 900, savings: 200, popular: true },
    "30": { days: 30, price: 1500, savings: 600, popular: false },
  };

  const createFeaturedMutation = useMutation({
    mutationFn: async (duration: string) => {
      const plan = featuredPlans[duration as keyof typeof featuredPlans];
      return await apiRequest(`/api/featured-listings`, "POST", {
        carId, 
        duration: plan.days,
        amount: plan.price 
      });
    },
    onSuccess: () => {
      toast({
        title: "Featured Listing Created!",
        description: "Your car is now featured and will get more visibility.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Featured Listing",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleCreateFeatured = () => {
    createFeaturedMutation.mutate(selectedPlan);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="steel-gradient max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            Make Your Listing Featured
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{carTitle}</h3>
            <p className="text-muted-foreground">
              Get 5x more visibility with a featured listing
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="space-y-1">
              <Eye className="w-6 h-6 mx-auto text-accent" />
              <p className="font-semibold">5x More Views</p>
              <p className="text-muted-foreground">Premium placement</p>
            </div>
            <div className="space-y-1">
              <TrendingUp className="w-6 h-6 mx-auto text-accent" />
              <p className="font-semibold">Higher Rankings</p>
              <p className="text-muted-foreground">Top search results</p>
            </div>
            <div className="space-y-1">
              <Clock className="w-6 h-6 mx-auto text-accent" />
              <p className="font-semibold">Faster Sales</p>
              <p className="text-muted-foreground">Sell 3x quicker</p>
            </div>
          </div>

          <RadioGroup 
            value={selectedPlan} 
            onValueChange={(value: "7" | "15" | "30") => setSelectedPlan(value)}
            className="space-y-3"
          >
            {Object.entries(featuredPlans).map(([duration, plan]) => (
              <div key={duration} className="space-y-2">
                <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPlan === duration 
                    ? "border-accent bg-accent/10" 
                    : "border-steel-primary/30 hover:border-accent/50"
                } ${plan.popular ? "relative" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={duration} id={duration} />
                    <Label htmlFor={duration} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{plan.days} Days Featured</p>
                          {plan.savings > 0 && (
                            <p className="text-sm text-green-400">Save ₹{plan.savings}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">₹{plan.price}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{Math.round(plan.price / plan.days)}/day
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="bg-accent/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">What you get with Featured Listing:</h4>
            <ul className="space-y-1 text-sm">
              <li>✓ Golden star badge on your listing</li>
              <li>✓ Priority placement in search results</li>
              <li>✓ Enhanced visibility with border highlight</li>
              <li>✓ Featured section placement</li>
              <li>✓ Mobile app priority display</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFeatured}
              disabled={createFeaturedMutation.isPending}
              className="flex-1 btn-metallic"
              data-testid="button-create-featured"
            >
              {createFeaturedMutation.isPending 
                ? "Processing..." 
                : `Make Featured - ₹${featuredPlans[selectedPlan].price}`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}