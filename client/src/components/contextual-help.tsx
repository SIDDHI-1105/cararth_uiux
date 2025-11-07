import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, SkipForward } from "lucide-react";

// Tooltip configuration for different UI elements
interface TooltipConfig {
  id: string;
  trigger: string; // data-testid or selector
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  page?: string;
  step?: number;
}

// First-time user onboarding tooltips
const ONBOARDING_TOOLTIPS: TooltipConfig[] = [
  {
    id: "hero-search",
    trigger: "hero-search-form",
    title: "Start Your Car Search",
    content: "Use our smart search to find cars from verified sellers across multiple platforms. Filter by brand, city, and price range.",
    placement: "bottom",
    page: "home",
    step: 1
  },
  {
    id: "advanced-filters",
    trigger: "button-toggle-filters",
    title: "Advanced Search Filters",
    content: "Access detailed filters for fuel type, transmission, year range, and more to find exactly what you're looking for.",
    placement: "bottom",
    page: "home",
    step: 2
  },
  {
    id: "subscription-info",
    trigger: "subscription-status",
    title: "Your Search Limits",
    content: "Free users get 5 searches per month. Upgrade to Pro for unlimited searches and premium features.",
    placement: "left",
    page: "home",
    step: 3
  },
  {
    id: "phone-verification",
    trigger: "phone-verify-button",
    title: "Verify Your Phone",
    content: "Phone verification is required for free accounts to access our authentic car listings.",
    placement: "bottom",
    page: "home",
    step: 4
  },
  {
    id: "contact-seller",
    trigger: "button-get-contact-premium",
    title: "Contact Sellers Directly",
    content: "Click here to message sellers privately. We protect both buyer and seller privacy during negotiations.",
    placement: "top",
    page: "car-detail",
    step: 5
  },
  {
    id: "price-insights",
    trigger: "price-comparison",
    title: "Market Price Analysis",
    content: "See how this car's price compares to similar vehicles in the market. Our AI analyzes thousands of listings.",
    placement: "right",
    page: "car-detail",
    step: 6
  },
  {
    id: "sell-car-link",
    trigger: "link-sell-car",
    title: "Sell Your Car",
    content: "Ready to sell? List your car with verified documentation and reach thousands of buyers.",
    placement: "bottom",
    page: "any",
    step: 7
  }
];

// Context for managing tooltip state
interface ContextualHelpContextType {
  isOnboardingActive: boolean;
  currentStep: number;
  totalSteps: number;
  showTooltip: (id: string) => void;
  hideTooltip: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  finishOnboarding: () => void;
  activeTooltip: string | null;
  isFirstTimeUser: boolean;
}

const ContextualHelpContext = createContext<ContextualHelpContextType | null>(null);

export function useContextualHelp() {
  const context = useContext(ContextualHelpContext);
  if (!context) {
    throw new Error("useContextualHelp must be used within ContextualHelpProvider");
  }
  return context;
}

interface ContextualHelpProviderProps {
  children: ReactNode;
}

export function ContextualHelpProvider({ children }: ContextualHelpProviderProps) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const totalSteps = ONBOARDING_TOOLTIPS.length;

  // Check if user is first-time visitor
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("mobility-hub-onboarding-complete");
    const isFirstTime = !hasSeenOnboarding;
    setIsFirstTimeUser(isFirstTime);
    
    if (isFirstTime) {
      // Start onboarding after a short delay
      setTimeout(() => {
        setIsOnboardingActive(true);
        showCurrentStepTooltip();
      }, 1500);
    }
  }, []);

  const showCurrentStepTooltip = () => {
    const tooltip = ONBOARDING_TOOLTIPS.find(t => t.step === currentStep);
    if (tooltip) {
      setActiveTooltip(tooltip.id);
    }
  };

  const showTooltip = (id: string) => {
    setActiveTooltip(id);
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setTimeout(showCurrentStepTooltip, 500);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setTimeout(showCurrentStepTooltip, 500);
    }
  };

  const skipOnboarding = () => {
    setIsOnboardingActive(false);
    setActiveTooltip(null);
    localStorage.setItem("mobility-hub-onboarding-complete", "true");
  };

  const finishOnboarding = () => {
    setIsOnboardingActive(false);
    setActiveTooltip(null);
    localStorage.setItem("mobility-hub-onboarding-complete", "true");
    
    // Show completion message
    setTimeout(() => {
      alert("🎉 Welcome to cararth.com! You're all set to find your perfect car.");
    }, 500);
  };

  const value = {
    isOnboardingActive,
    currentStep,
    totalSteps,
    showTooltip,
    hideTooltip,
    nextStep,
    prevStep,
    skipOnboarding,
    finishOnboarding,
    activeTooltip,
    isFirstTimeUser
  };

  return (
    <ContextualHelpContext.Provider value={value}>
      {children}
    </ContextualHelpContext.Provider>
  );
}

// Individual tooltip component
interface ContextualTooltipProps {
  config: TooltipConfig;
  children: ReactNode;
  className?: string;
}

export function ContextualTooltip({ config, children, className }: ContextualTooltipProps) {
  const { isOnboardingActive, activeTooltip, currentStep, totalSteps, nextStep, prevStep, skipOnboarding } = useContextualHelp();
  
  const isActive = isOnboardingActive && activeTooltip === config.id;

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <Tooltip open={isActive}>
      <TooltipTrigger asChild className={className}>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={config.placement || "bottom"} 
        className="max-w-sm p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              {config.title}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400"
              data-testid="tooltip-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            {config.content}
          </p>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Step {currentStep} of {totalSteps}
              </span>
              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      i + 1 <= currentStep
                        ? "bg-blue-500"
                        : "bg-blue-200 dark:bg-blue-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex space-x-1">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300"
                  data-testid="tooltip-prev"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={skipOnboarding}
                className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300"
                data-testid="tooltip-skip"
              >
                <SkipForward className="h-3 w-3 mr-1" />
                Skip
              </Button>
              
              <Button
                size="sm"
                onClick={nextStep}
                className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="tooltip-next"
              >
                {currentStep === totalSteps ? "Finish" : "Next"}
                {currentStep < totalSteps && <ChevronRight className="h-3 w-3 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Utility function to get tooltip config by trigger
export function getTooltipConfig(trigger: string): TooltipConfig | undefined {
  return ONBOARDING_TOOLTIPS.find(tooltip => tooltip.trigger === trigger);
}

// Hook to manually trigger tooltips for specific elements
export function useTooltipTrigger() {
  const { showTooltip, hideTooltip } = useContextualHelp();
  
  return {
    show: showTooltip,
    hide: hideTooltip
  };
}