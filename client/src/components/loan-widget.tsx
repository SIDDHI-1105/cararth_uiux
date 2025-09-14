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
  TrendingDown,
  TrendingUp,
  Info
} from "lucide-react";
import { calculateLoan, formatInLakhs, formatIndianCurrency } from "@/lib/loan";

interface LoanWidgetProps {
  carPrice: number;
  carTitle?: string;
}

export default function LoanWidget({ carPrice, carTitle = "this car" }: LoanWidgetProps) {
  const [downPayment, setDownPayment] = useState<string>(Math.round(carPrice * 0.2).toString());
  const [tradeInValue, setTradeInValue] = useState<string>("0");
  const [selectedTenure, setSelectedTenure] = useState<string>("60");
  
  const bestRate = 7.05; // DialABank's best rate
  
  // Use proper loan calculation utility
  const loanResult = calculateLoan({
    carPrice,
    downPayment: Number(downPayment || "0"),
    tradeInValue: Number(tradeInValue || "0"),
    annualInterestRate: bestRate,
    tenureMonths: Number(selectedTenure)
  });
  
  const handleGetQuotes = () => {
    const params = new URLSearchParams({
      carPrice: carPrice.toString(),
      downPayment: downPayment,
      tradeInValue: tradeInValue,
      tenure: selectedTenure
    });
    window.open(`/financing?${params.toString()}`, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" data-testid="text-loan-widget-title">
          <Calculator className="w-5 h-5 text-blue-600" />
          Car Loan Calculator
        </CardTitle>
        <CardDescription>
          Get instant loan quotes for {carTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Car Price Display */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground">Car Price</div>
          <div className="text-xl font-bold text-green-600">₹{carPrice.toLocaleString()}</div>
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
        </div>

        {/* Trade-In Value Input */}
        <div className="space-y-2">
          <Label htmlFor="widget-trade-in" className="text-sm">Trade-In Value (Optional)</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="widget-trade-in"
              type="number"
              placeholder="Current car value"
              value={tradeInValue}
              onChange={(e) => setTradeInValue(e.target.value)}
              className="pl-9"
              data-testid="input-widget-trade-in"
            />
          </div>
          <p className="text-xs text-muted-foreground">Value of your current car if trading in</p>
        </div>

        {/* Tenure Selection */}
        <div className="space-y-2">
          <Label htmlFor="widget-tenure" className="text-sm">Loan Tenure</Label>
          <Select value={selectedTenure} onValueChange={setSelectedTenure}>
            <SelectTrigger data-testid="select-widget-tenure">
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

        {/* Loan Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 p-4 rounded-lg border space-y-3">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">
              Monthly EMI
            </div>
            <div className="text-2xl font-bold text-green-600" data-testid="text-widget-emi">
              {formatInLakhs(loanResult.monthlyEMI)}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-muted-foreground">Loan Amount</div>
              <div className="font-semibold" data-testid="text-widget-principal">
                {formatInLakhs(loanResult.principalAmount)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Interest</div>
              <div className="font-semibold text-orange-600" data-testid="text-widget-interest">
                {formatInLakhs(loanResult.totalInterest)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Payment</div>
              <div className="font-semibold" data-testid="text-widget-total">
                {formatInLakhs(loanResult.totalPayment)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-1">
            <TrendingDown className="w-3 h-3 text-green-600" />
            <span className="text-xs text-muted-foreground">
              Starting from {bestRate}% interest • {Number(selectedTenure) / 12} years
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

        {/* Trust Indicators */}
        <div className="flex flex-wrap gap-1 justify-center">
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            Instant Approval
          </Badge>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            25+ Banks
          </Badge>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Best Rates
          </Badge>
        </div>

        {/* Fine Print */}
        <div className="text-xs text-muted-foreground text-center">
          *EMI calculated at {bestRate}% interest rate. Actual rates may vary based on profile.
        </div>
      </CardContent>
    </Card>
  );
}