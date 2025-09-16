import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { 
  Calculator, 
  IndianRupee, 
  ExternalLink,
  TrendingDown
} from "lucide-react";
import { calculateLoanDetails, formatIndianCurrency } from "@/lib/loan";
import { IndicativeLoanDisclaimer } from "@/components/ui/indicative-loan-disclaimer";

interface LoanWidgetProps {
  carPrice: number;
  carTitle?: string;
}

export default function LoanWidget({ carPrice, carTitle = "this car" }: LoanWidgetProps) {
  const [downPayment, setDownPayment] = useState<string>(Math.round(carPrice * 0.2).toString());
  const [selectedTenure, setSelectedTenure] = useState<string>("5");
  const [interestRate, setInterestRate] = useState<string>("7.05");
  
  // Calculate principal amount after down payment
  const principal = Math.max(0, carPrice - Number(downPayment || "0"));
  const tenure = Number(selectedTenure);
  const rate = Number(interestRate);
  
  // Use proven EMI calculation
  const result = calculateLoanDetails(principal, rate, tenure);
  
  const handleGetQuotes = () => {
    const params = new URLSearchParams({
      carPrice: carPrice.toString(),
      downPayment: downPayment,
      tenure: selectedTenure,
      interestRate: interestRate
    });
    window.open(`/financing?${params.toString()}`, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" data-testid="text-loan-widget-title">
          <Calculator className="w-5 h-5 text-blue-600" />
          Car Loan EMI Calculator
        </CardTitle>
        <CardDescription>
          Get instant loan estimates for {carTitle} using proven EMI formula
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Car Price Display */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground">Car Price</div>
          <div className="text-xl font-bold text-green-600">{formatIndianCurrency(carPrice)}</div>
        </div>

        {/* Down Payment Input */}
        <div className="space-y-2">
          <Label htmlFor="widget-down-payment" className="text-sm">Down Payment</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="widget-down-payment"
              type="number"
              placeholder="Down payment"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              className="pl-9"
              data-testid="input-widget-down-payment"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Loan amount: {formatInLakhs(principal)}
          </p>
        </div>

        {/* Interest Rate Input */}
        <div className="space-y-2">
          <Label htmlFor="widget-interest-rate" className="text-sm">Annual Interest Rate (%)</Label>
          <div className="relative">
            <Input
              id="widget-interest-rate"
              type="number"
              step="0.1"
              placeholder="Interest rate"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              data-testid="input-widget-interest-rate"
            />
          </div>
        </div>

        {/* Tenure Selection */}
        <div className="space-y-2">
          <Label htmlFor="widget-tenure" className="text-sm">Loan Tenure</Label>
          <Select value={selectedTenure} onValueChange={setSelectedTenure}>
            <SelectTrigger data-testid="select-widget-tenure">
              <SelectValue placeholder="Select tenure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Years</SelectItem>
              <SelectItem value="4">4 Years</SelectItem>
              <SelectItem value="5">5 Years</SelectItem>
              <SelectItem value="6">6 Years</SelectItem>
              <SelectItem value="7">7 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* EMI Results - Proven Formula */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 p-4 rounded-lg border space-y-3">
          {/* Main EMI Display */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">
              Monthly EMI
            </div>
            <div className="text-2xl font-bold text-green-600" data-testid="text-widget-emi">
              {formatInLakhs(result.monthlyEMI)}
            </div>
          </div>
          
          {/* Detailed Breakdown */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
              <div className="text-muted-foreground">Total Interest</div>
              <div className="font-semibold text-orange-600" data-testid="text-widget-interest">
                {formatInLakhs(result.totalInterest)}
              </div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
              <div className="text-muted-foreground">Total Payment</div>
              <div className="font-semibold" data-testid="text-widget-total">
                {formatInLakhs(result.totalAmount)}
              </div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
              <div className="text-muted-foreground">Principal</div>
              <div className="font-semibold text-blue-600" data-testid="text-widget-principal">
                {formatInLakhs(result.totalPrincipal)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-1">
            <TrendingDown className="w-3 h-3 text-green-600" />
            <span className="text-xs text-muted-foreground">
              {rate}% interest • {tenure} years • Proven EMI formula
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={handleGetQuotes}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-get-quotes"
          >
            Get Best Loan Quotes
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          
          <Link href="/financing" className="w-full">
            <Button 
              variant="outline" 
              className="w-full"
              data-testid="button-compare-lenders"
            >
              Compare All Lenders
            </Button>
          </Link>
        </div>

        {/* Trust Indicators - No Partnership Claims */}
        <div className="flex flex-wrap gap-1 justify-center">
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            Proven Formula
          </Badge>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Compare Options
          </Badge>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Transparent
          </Badge>
        </div>

        {/* Universal Indicative Loan Disclaimer - Curtain Mode */}
        <IndicativeLoanDisclaimer curtainMode />
      </CardContent>
    </Card>
  );
}