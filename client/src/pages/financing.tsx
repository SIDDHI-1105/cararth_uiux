import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Clock, 
  CheckCircle,
  ExternalLink,
  IndianRupee,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

interface LoanQuote {
  lender: string;
  rate: number;
  maxAmount: number;
  tenure: number;
  emi: number;
  processingFee: number;
  features: string[];
  logo: string;
  partnerId: string;
}

const LOAN_PARTNERS: LoanQuote[] = [
  {
    lender: "Kuwy (Top Choice)",
    rate: 8.5,
    maxAmount: 2500000,
    tenure: 84,
    emi: 0,
    processingFee: 2500,
    features: ["AI-powered instant approval", "Same-day disbursal", "650+ locations", "Digital documentation"],
    logo: "🚗",
    partnerId: "kuwy_partner"
  },
  {
    lender: "DialABank Network",
    rate: 7.05,
    maxAmount: 5000000,
    tenure: 84,
    emi: 0,
    processingFee: 5000,
    features: ["Lowest rates from 7.05%", "25+ bank network", "100% funding", "Doorstep service"],
    logo: "🏦",
    partnerId: "dialabank_affiliate"
  },
  {
    lender: "State Bank of India",
    rate: 8.40,
    maxAmount: 2000000,
    tenure: 84,
    emi: 0,
    processingFee: 3000,
    features: ["Trusted public sector", "Flexible EMI options", "Quick processing", "Competitive rates"],
    logo: "🏛️",
    partnerId: "sbi_partner"
  },
  {
    lender: "HDFC Bank",
    rate: 8.75,
    maxAmount: 7500000,
    tenure: 84,
    emi: 0,
    processingFee: 4000,
    features: ["Premium banking", "High loan amounts", "Digital experience", "Fast approvals"],
    logo: "🏢",
    partnerId: "hdfc_partner"
  }
];

function calculateEMI(principal: number, rate: number, tenure: number): number {
  const monthlyRate = rate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
              (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.round(emi);
}

export default function FinancingPage() {
  const [carPrice, setCarPrice] = useState<string>("800000");
  const [downPayment, setDownPayment] = useState<string>("200000");
  const [selectedTenure, setSelectedTenure] = useState<string>("60");
  const [monthlyIncome, setMonthlyIncome] = useState<string>("50000");
  const [employmentType, setEmploymentType] = useState<string>("");
  
  const loanAmount = parseInt(carPrice) - parseInt(downPayment);
  const tenure = parseInt(selectedTenure);

  const quotesWithEMI = LOAN_PARTNERS.map(partner => ({
    ...partner,
    emi: calculateEMI(loanAmount, partner.rate, tenure)
  })).sort((a, b) => a.emi - b.emi);

  const handleApplyLoan = (partnerId: string, lender: string) => {
    // Track affiliate click for commission
    window.open(`/api/affiliate/redirect/${partnerId}?amount=${loanAmount}&tenure=${tenure}&lender=${encodeURIComponent(lender)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-financing-title">
            Car Loan & Financing Solutions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get instant loan quotes from India's top lenders. Compare rates, calculate EMIs, 
            and secure financing for your dream car.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Instant Approval
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Shield className="w-3 h-3 mr-1" />
              Secure & Trusted
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <TrendingUp className="w-3 h-3 mr-1" />
              Best Rates
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Calculator */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-calculator-title">
                  <Calculator className="w-5 h-5" />
                  Loan Calculator
                </CardTitle>
                <CardDescription>
                  Enter your details to get personalized loan quotes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="carPrice">Car Price</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="carPrice"
                      type="number"
                      placeholder="800000"
                      value={carPrice}
                      onChange={(e) => setCarPrice(e.target.value)}
                      className="pl-9"
                      data-testid="input-car-price"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="downPayment">Down Payment</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="downPayment"
                      type="number"
                      placeholder="200000"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="pl-9"
                      data-testid="input-down-payment"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenure">Loan Tenure</Label>
                  <Select value={selectedTenure} onValueChange={setSelectedTenure}>
                    <SelectTrigger data-testid="select-tenure">
                      <SelectValue placeholder="Select tenure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="36">3 Years</SelectItem>
                      <SelectItem value="48">4 Years</SelectItem>
                      <SelectItem value="60">5 Years</SelectItem>
                      <SelectItem value="72">6 Years</SelectItem>
                      <SelectItem value="84">7 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome">Monthly Income</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="monthlyIncome"
                      type="number"
                      placeholder="50000"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="pl-9"
                      data-testid="input-monthly-income"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employment">Employment Type</Label>
                  <Select value={employmentType} onValueChange={setEmploymentType}>
                    <SelectTrigger data-testid="select-employment">
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salaried">Salaried</SelectItem>
                      <SelectItem value="self_employed">Self Employed</SelectItem>
                      <SelectItem value="business">Business Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm font-medium mb-2">Loan Summary</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Car Price:</span>
                      <span>₹{parseInt(carPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Down Payment:</span>
                      <span>₹{parseInt(downPayment).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Loan Amount:</span>
                      <span>₹{loanAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Loan Quotes */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold" data-testid="text-quotes-title">
                  Best Loan Quotes for You
                </h2>
                <Badge variant="secondary" className="px-3 py-1">
                  {quotesWithEMI.length} lenders available
                </Badge>
              </div>

              <div className="grid gap-4">
                {quotesWithEMI.map((quote, index) => (
                  <Card key={quote.partnerId} className={index === 0 ? "border-2 border-green-200 bg-green-50/50" : ""}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{quote.logo}</div>
                          <div>
                            <h3 className="font-semibold text-lg" data-testid={`text-lender-${index}`}>
                              {quote.lender}
                            </h3>
                            {index === 0 && (
                              <Badge variant="default" className="bg-green-600 text-white">
                                Best Offer
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600" data-testid={`text-emi-${index}`}>
                            ₹{quote.emi.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">EMI/month</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-background rounded-lg">
                          <div className="text-lg font-semibold">{quote.rate}%</div>
                          <div className="text-xs text-muted-foreground">Interest Rate</div>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg">
                          <div className="text-lg font-semibold">₹{(quote.maxAmount / 100000).toFixed(1)}L</div>
                          <div className="text-xs text-muted-foreground">Max Amount</div>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg">
                          <div className="text-lg font-semibold">{quote.tenure}</div>
                          <div className="text-xs text-muted-foreground">Max Tenure</div>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg">
                          <div className="text-lg font-semibold">₹{quote.processingFee.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Processing Fee</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {quote.features.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => handleApplyLoan(quote.partnerId, quote.lender)}
                        data-testid={`button-apply-${index}`}
                      >
                        Apply for Loan
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Additional Information */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Why Choose Our Financing Partners?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 mt-0.5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Quick Processing</h4>
                          <p className="text-sm text-muted-foreground">Get loan approval within 24 hours</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
                        <div>
                          <h4 className="font-medium">Competitive Rates</h4>
                          <p className="text-sm text-muted-foreground">Best rates from 7.05% onwards</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 mt-0.5 text-purple-600" />
                        <div>
                          <h4 className="font-medium">Flexible Terms</h4>
                          <p className="text-sm text-muted-foreground">Tenure up to 7 years available</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 mt-0.5 text-orange-600" />
                        <div>
                          <h4 className="font-medium">Doorstep Service</h4>
                          <p className="text-sm text-muted-foreground">Complete documentation at your location</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}