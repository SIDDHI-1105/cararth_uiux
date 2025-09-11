import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, Users, Zap } from "lucide-react";

interface SearchLimitPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
  onLogin: () => void;
  data?: {
    message: string;
    limit: number;
    window: string;
    searchesLeft: number;
    resetAt?: string;
  };
}

export default function SearchLimitPopup({ 
  isOpen, 
  onClose, 
  onSignUp, 
  onLogin, 
  data 
}: SearchLimitPopupProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleSignUp = () => {
    onSignUp();
    handleClose();
  };

  const handleLogin = () => {
    onLogin();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <Flame className="w-8 h-8 text-white" />
          </div>
          
          <DialogTitle className="text-xl font-bold">
            {data?.message || "🔥 You're on fire with searches! Ready to unlock unlimited car discoveries?"}
          </DialogTitle>
          
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {data?.limit || 10} searches per {data?.window || "30 days"}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Limit reached
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Unlock Premium Features
            </h3>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <li className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Unlimited searches across all platforms
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                Save and share car listings
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-3 h-3" />
                Price alerts and market insights
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleSignUp}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
              data-testid="button-signup-from-popup"
            >
              🚀 Sign Up Free - Unlimited Searches
            </Button>
            
            <Button 
              onClick={handleLogin}
              variant="outline"
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 py-3"
              data-testid="button-login-from-popup"
            >
              Already have an account? Log In
            </Button>
            
            <Button 
              onClick={handleClose}
              variant="ghost"
              className="w-full text-gray-500 hover:text-gray-700 py-2"
              data-testid="button-maybe-later"
            >
              Maybe Later
            </Button>
          </div>

          {/* Reset Information */}
          {data?.resetAt && (
            <div className="text-center text-xs text-gray-500 mt-4">
              Your search limit will reset on {new Date(data.resetAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}