import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  IndianRupee, 
  ExternalLink,
  Building2,
  Shield,
  Clock,
  CheckCircle,
  Banknote
} from "lucide-react";
import { formatIndianCurrency, calculateLoanDetails } from "@/lib/loan";
import { IndicativeLoanDisclaimer } from "@/components/ui/indicative-loan-disclaimer";

interface LoanProvider {
  name: string;
  logo: string;
  rateRange: string;
  processingFee: string;
  approvalTime: string;
  minLoanAmount: string;
  maxLoanAmount: string;
  specialFeatures: string[];
  affiliateUrl: string;
  rating: number;
}

const loanProviders: LoanProvider[] = [
  {
    name: "HDFC Bank",
    logo: "🏦",
    rateRange: "7.05% - 10.20%",
    processingFee: "₹3,500 + GST",
    approvalTime: "2-3 days",
    minLoanAmount: "₹1,00,000",
    maxLoanAmount: "₹75,00,000",
    specialFeatures: ["Pre-approved offers", "Doorstep service", "Digital processing"],
    affiliateUrl: "https://www.hdfcbank.com/personal/borrow/popular-loans/auto-loan?ref=cararth",
    rating: 4.5
  },
  {
    name: "SBI Car Loan",
    logo: "🏛️",
    rateRange: "7.70% - 9.70%",
    processingFee: "₹2,000 + GST",
    approvalTime: "3-5 days",
    minLoanAmount: "₹50,000",
    maxLoanAmount: "₹80,00,000",
    specialFeatures: ["Lowest processing fee", "Flexible tenure", "Government backing"],
    affiliateUrl: "https://www.sbi.co.in/web/personal-banking/loans/auto-loans/car-loan?ref=cararth",
    rating: 4.2
  },
  {
    name: "Bajaj Finserv",
    logo: "💼",
    rateRange: "8.50% - 15.00%",
    processingFee: "₹999 onwards",
    approvalTime: "24 hours",
    minLoanAmount: "₹75,000",
    maxLoanAmount: "₹50,00,000",
    specialFeatures: ["Instant approval", "Minimal documentation", "Used car specialist"],
    affiliateUrl: "https://www.bajajfinserv.in/car-loan?ref=cararth",
    rating: 4.3
  },
  {
    name: "Tata Capital",
    logo: "🚗",
    rateRange: "8.75% - 14.00%",
    processingFee: "₹3,000 + GST",
    approvalTime: "1-2 days",
    minLoanAmount: "₹1,00,000",
    maxLoanAmount: "₹75,00,000",
    specialFeatures: ["Quick disbursement", "Competitive rates", "Flexible repayment"],
    affiliateUrl: "https://www.tatacapital.com/car-loan.htm?ref=cararth",
    rating: 4.1
  }
];

export default function FinancingPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  
  // Extract loan parameters from URL
  const carPrice = parseFloat(params.get('carPrice') || '500000');
  const downPayment = parseFloat(params.get('downPayment') || '100000');
  const tenure = parseFloat(params.get('tenure') || '5');
  const interestRate = parseFloat(params.get('interestRate') || '7.05');
  
  const principal = carPrice - downPayment;
  const loanDetails = calculateLoanDetails(principal, interestRate, tenure);

  const handleApplyLoan = (provider: LoanProvider) => {
    // Track the loan application click
    const trackingParams = new URLSearchParams({
      provider: provider.name,
      amount: principal.toString(),
      tenure: tenure.toString(),
      source: 'cararth'
    });
    
    window.open(`${provider.affiliateUrl}&${trackingParams.toString()}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4" data-testid="text-financing-title">
            Car Loan Offers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Compare the best car loan offers from India's top lenders. Get instant approval and competitive rates.
          </p>
        </div>

        {/* Loan Summary Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" data-testid="text-loan-summary">
              <Calculator className="w-6 h-6" />
              Your Loan Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm opacity-90">Car Price</div>
                <div className="text-xl font-bold">{formatIndianCurrency(carPrice)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-90">Loan Amount</div>
                <div className="text-xl font-bold">{formatIndianCurrency(principal)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-90">Monthly EMI</div>
                <div className="text-xl font-bold">{formatIndianCurrency(parseInt(loanDetails.monthlyEMI))}</div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-90">Tenure</div>
                <div className="text-xl font-bold">{tenure} years</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loan Providers */}
        <div className="grid gap-6 md:grid-cols-2">
          {loanProviders.map((provider, index) => (
            <Card key={provider.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.logo}</span>
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-provider-${index}`}>
                        {provider.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={i < Math.floor(provider.rating) ? 'text-yellow-500' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                        <span className="text-sm text-gray-600 ml-1">{provider.rating}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {provider.approvalTime}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rate and Fees */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Interest Rate</div>
                    <div className="text-blue-600 font-semibold">{provider.rateRange}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Processing Fee</div>
                    <div className="text-gray-600">{provider.processingFee}</div>
                  </div>
                </div>

                <Separator />

                {/* Loan Limits */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Min Amount</div>
                    <div className="text-gray-600">{provider.minLoanAmount}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Max Amount</div>
                    <div className="text-gray-600">{provider.maxLoanAmount}</div>
                  </div>
                </div>

                <Separator />

                {/* Special Features */}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">Special Features</div>
                  <div className="flex flex-wrap gap-1">
                    {provider.specialFeatures.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <Button 
                  onClick={() => handleApplyLoan(provider)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid={`button-apply-${index}`}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Apply with {provider.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              Why Choose Cararth for Car Loans?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Compare Multiple Offers</h3>
                <p className="text-sm text-gray-600">Compare rates, terms, and fees from India's top lenders in one place.</p>
              </div>
              <div className="text-center">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Quick Approval</h3>
                <p className="text-sm text-gray-600">Get loan approval in as little as 24 hours with minimal documentation.</p>
              </div>
              <div className="text-center">
                <Banknote className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Best Rates</h3>
                <p className="text-sm text-gray-600">Access exclusive rates and offers negotiated specifically for Cararth users.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Universal Disclaimer */}
        <div className="mt-8">
          <IndicativeLoanDisclaimer />
        </div>
      </div>
    </div>
  );
}