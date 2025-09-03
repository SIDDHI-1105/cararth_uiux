import { useState } from "react";
import { 
  TrendingUp, 
  Calculator, 
  BarChart3, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Star,
  ArrowRight,
  Car,
  IndianRupee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Quick Tip Card Component
export function QuickTipCard({ title, tips, icon: Icon = Zap, variant = "default" }: {
  title: string;
  tips: string[];
  icon?: any;
  variant?: "default" | "warning" | "success" | "info";
}) {
  const variants = {
    default: "border-blue-200 bg-blue-50 text-blue-900",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
    success: "border-green-200 bg-green-50 text-green-900",
    info: "border-purple-200 bg-purple-50 text-purple-900"
  };

  return (
    <Card className={`${variants[variant]} transition-all duration-300 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Comparison Table Component
export function ComparisonTable({ title, items, categories }: {
  title: string;
  items: any[];
  categories: string[];
}) {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Model</th>
                {categories.map((category) => (
                  <th key={category} className="px-4 py-3 text-left font-semibold">
                    {category}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className={`border-t ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/30 transition-colors`}>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  {categories.map((category) => (
                    <td key={category} className="px-4 py-3">
                      {item[category.toLowerCase().replace(' ', '_')]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Price Calculator Component
export function PriceCalculator({ title, basePrices }: {
  title: string;
  basePrices: { [key: string]: number };
}) {
  const [selectedCar, setSelectedCar] = useState(Object.keys(basePrices)[0]);
  const [year, setYear] = useState(2020);
  const [mileage, setMileage] = useState(50000);
  const [condition, setCondition] = useState("good");

  const calculatePrice = () => {
    let basePrice = basePrices[selectedCar] || 0;
    
    // Year depreciation (10% per year)
    const currentYear = new Date().getFullYear();
    const ageDepreciation = (currentYear - year) * 0.1;
    basePrice *= (1 - Math.min(ageDepreciation, 0.7));
    
    // Mileage depreciation
    const mileageDepreciation = Math.min(mileage / 100000 * 0.3, 0.4);
    basePrice *= (1 - mileageDepreciation);
    
    // Condition adjustment
    const conditionMultipliers = { excellent: 1.1, good: 1.0, fair: 0.85, poor: 0.7 };
    basePrice *= conditionMultipliers[condition as keyof typeof conditionMultipliers];
    
    return Math.round(basePrice);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Car Model</label>
            <select 
              value={selectedCar}
              onChange={(e) => setSelectedCar(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            >
              {Object.keys(basePrices).map((car) => (
                <option key={car} value={car}>{car}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <input
              type="range"
              min="2015"
              max="2024"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">{year}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Mileage (km)</label>
            <input
              type="range"
              min="10000"
              max="200000"
              step="10000"
              value={mileage}
              onChange={(e) => setMileage(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">{mileage.toLocaleString()} km</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Condition</label>
            <select 
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Estimated Price:</span>
            <div className="flex items-center gap-1 text-2xl font-bold text-blue-600">
              <IndianRupee className="w-6 h-6" />
              {calculatePrice().toLocaleString()}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            *Estimate based on market trends and vehicle condition
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// News Brief Component
export function NewsBrief({ items }: { items: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Latest Automotive Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0">
                <Badge variant={item.type === 'price' ? 'default' : item.type === 'launch' ? 'secondary' : 'outline'}>
                  {item.type}
                </Badge>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.summary}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Market Data Visualization Component
export function MarketChart({ title, data }: { title: string; data: any[] }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-sm font-medium truncate">{item.label}</div>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
              <div className="w-16 text-sm font-semibold text-right">{item.value}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}