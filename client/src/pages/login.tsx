// FILE: client/src/pages/login.tsx – Google OAuth Login Page (Spinny-inspired)

import { CenteredLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrandWordmark } from "@/components/brand-wordmark";
import { useTheme } from "@/contexts/ThemeContext";
import { ShieldCheck, Chrome } from "lucide-react";

export default function LoginPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = "/auth/google";
  };

  return (
    <CenteredLayout>
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <BrandWordmark variant="header" showTagline={true} />
        </div>

        {/* Login Card */}
        <Card className={`${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        } shadow-2xl`}>
          <CardHeader className="space-y-4 pb-8">
            <div className="mx-auto p-4 rounded-full bg-blue-500/10">
              <ShieldCheck className="w-12 h-12 text-blue-600" />
            </div>
            <CardTitle className={`text-3xl font-black text-center ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-base">
              Sign in to access your account and manage your listings
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleLogin}
              className={`w-full h-14 text-lg font-bold transition-all duration-300 hover:scale-105 ${
                isDark
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
              }`}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Separator className={isDark ? 'bg-white/10' : 'bg-gray-200'} />

            {/* Benefits */}
            <div className="space-y-3">
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Why sign in?
              </p>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Save your favorite listings and searches</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>List your car for sale in minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Get personalized car recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Track your listing performance and inquiries</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          By signing in, you agree to our{" "}
          <a href="/terms-of-service" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy-policy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </CenteredLayout>
  );
}
