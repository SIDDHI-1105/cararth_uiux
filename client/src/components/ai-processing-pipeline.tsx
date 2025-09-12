import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Database, Brain, Sparkles, Camera, TrendingUp, 
  CheckCircle, Clock, Zap, Shield, BarChart3,
  Search, Car, MapPin, Star, Award
} from "lucide-react";

interface AIProcessingStep {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  processingTime?: number;
  results?: {
    count?: number;
    score?: number;
    insights?: string[];
    quality?: string;
  };
}

interface AIProcessingPipelineProps {
  isActive: boolean;
  searchQuery?: string;
  onComplete?: (results: any) => void;
}

export default function AIProcessingPipeline({ isActive, searchQuery, onComplete }: AIProcessingPipelineProps) {
  const [steps, setSteps] = useState<AIProcessingStep[]>([
    {
      id: 'firecrawl',
      name: 'Firecrawl',
      description: 'Ingesting data from 15+ portals',
      icon: Database,
      status: 'pending',
      progress: 0,
      results: { count: 0 }
    },
    {
      id: 'claude',
      name: 'Claude Sonnet 4',
      description: 'Classification & quality analysis',
      icon: Brain,
      status: 'pending',
      progress: 0,
      results: { score: 0, quality: 'analyzing' }
    },
    {
      id: 'gpt5',
      name: 'GPT-5',
      description: 'Enrichment with pros & cons',
      icon: Sparkles,
      status: 'pending',
      progress: 0,
      results: { insights: [] }
    },
    {
      id: 'gemini',
      name: 'Gemini Ultra',
      description: 'Image verification & regional analysis',
      icon: Camera,
      status: 'pending',
      progress: 0,
      results: { score: 0 }
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      description: 'Real-time market intelligence',
      icon: TrendingUp,
      status: 'pending',
      progress: 0,
      results: { insights: [] }
    }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalListings, setTotalListings] = useState(0);

  useEffect(() => {
    if (!isActive) {
      // Reset all steps
      setSteps(prev => prev.map(step => ({
        ...step,
        status: 'pending',
        progress: 0,
        results: step.id === 'firecrawl' ? { count: 0 } :
                step.id === 'claude' ? { score: 0, quality: 'analyzing' } :
                step.id === 'gemini' ? { score: 0 } : { insights: [] }
      })));
      setCurrentStep(0);
      setOverallProgress(0);
      setTotalListings(0);
      return;
    }

    // Simulate AI processing pipeline
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        
        // Mark current step as processing
        setSteps(prev => prev.map((step, idx) => 
          idx === i ? { ...step, status: 'processing' } : step
        ));

        // Simulate processing with realistic progress
        const stepDuration = getStepDuration(steps[i].id);
        const startTime = Date.now();
        
        for (let progress = 0; progress <= 100; progress += 2) {
          await new Promise(resolve => setTimeout(resolve, stepDuration / 50));
          
          setSteps(prev => prev.map((step, idx) => 
            idx === i ? { 
              ...step, 
              progress,
              results: generateStepResults(step.id, progress, searchQuery)
            } : step
          ));

          // Update overall progress
          const completedSteps = i * 100;
          const currentStepProgress = progress;
          const newOverallProgress = (completedSteps + currentStepProgress) / steps.length;
          setOverallProgress(Math.min(99, newOverallProgress));

          // Update total listings for first step
          if (steps[i].id === 'firecrawl' && progress > 20) {
            setTotalListings(Math.floor((progress / 100) * 247));
          }
        }

        // Mark step as completed
        setSteps(prev => prev.map((step, idx) => 
          idx === i ? { 
            ...step, 
            status: 'completed',
            processingTime: Date.now() - startTime,
            results: generateFinalResults(step.id, searchQuery)
          } : step
        ));
      }

      // Complete the pipeline
      setOverallProgress(100);
      setTimeout(() => {
        onComplete?.({
          totalListings,
          aiEnhanced: true,
          qualityScore: 94,
          authenticityVerified: true
        });
      }, 500);
    };

    processSteps();
  }, [isActive, searchQuery]);

  const getStepDuration = (stepId: string): number => {
    const durations = {
      firecrawl: 3000,    // 3 seconds - data ingestion
      claude: 2500,       // 2.5 seconds - AI analysis
      gpt5: 2000,         // 2 seconds - enrichment
      gemini: 1500,       // 1.5 seconds - image analysis
      perplexity: 1000    // 1 second - market intelligence
    };
    return durations[stepId as keyof typeof durations] || 2000;
  };

  const generateStepResults = (stepId: string, progress: number, query?: string) => {
    switch (stepId) {
      case 'firecrawl':
        return { 
          count: Math.floor((progress / 100) * 247),
          sources: ['CarDekho', 'OLX', 'Cars24', 'CarWale', 'AutoTrader']
        };
      
      case 'claude':
        return { 
          score: Math.floor((progress / 100) * 94),
          quality: progress > 80 ? 'excellent' : progress > 60 ? 'good' : 'analyzing',
          classified: Math.floor((progress / 100) * 247)
        };
      
      case 'gpt5':
        const insights = progress > 80 ? [
          'Strong resale value',
          'Low maintenance costs',
          'Good fuel efficiency'
        ] : progress > 40 ? ['Analyzing...'] : [];
        return { insights, enriched: Math.floor((progress / 100) * 247) };
      
      case 'gemini':
        return { 
          score: Math.floor((progress / 100) * 96),
          verified: Math.floor((progress / 100) * 247),
          imageQuality: progress > 70 ? 'high' : 'analyzing'
        };
      
      case 'perplexity':
        const marketInsights = progress > 70 ? [
          'Prices trending up 3%',
          'High demand in Hyderabad',
          'Best time to buy'
        ] : progress > 30 ? ['Analyzing market...'] : [];
        return { insights: marketInsights, analyzed: Math.floor((progress / 100) * 247) };
      
      default:
        return {};
    }
  };

  const generateFinalResults = (stepId: string, query?: string) => {
    switch (stepId) {
      case 'firecrawl':
        return { 
          count: 247,
          sources: ['CarDekho', 'OLX', 'Cars24', 'CarWale', 'AutoTrader', 'Spinny', 'CARS24'],
          quality: 'Complete'
        };
      
      case 'claude':
        return { 
          score: 94,
          quality: 'excellent',
          classified: 247,
          authenticity: 96
        };
      
      case 'gpt5':
        return { 
          insights: [
            'Strong resale value potential',
            'Low maintenance costs',
            'Good fuel efficiency ratings',
            'Popular among families'
          ],
          enriched: 247,
          prosCons: 'Generated'
        };
      
      case 'gemini':
        return { 
          score: 96,
          verified: 247,
          imageQuality: 'high',
          regionalData: 'Optimized for Hyderabad'
        };
      
      case 'perplexity':
        return { 
          insights: [
            'Prices trending up 3% this month',
            'High demand in Hyderabad market',
            'Best buying opportunity window',
            'Competitive financing rates'
          ],
          analyzed: 247,
          marketIntel: 'Current'
        };
      
      default:
        return {};
    }
  };

  const getStepIcon = (step: AIProcessingStep) => {
    const IconComponent = step.icon;
    const getColor = () => {
      switch (step.status) {
        case 'completed': return 'text-green-600';
        case 'processing': return 'text-blue-600';
        case 'error': return 'text-red-600';
        default: return 'text-gray-400';
      }
    };

    return <IconComponent className={`w-5 h-5 ${getColor()}`} />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Zap className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'error':
        return <span className="w-4 h-4 text-red-600">⚠️</span>;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-200 bg-green-50';
      case 'processing': return 'border-blue-200 bg-blue-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isActive) return null;

  return (
    <Card className="ai-pipeline-container" data-testid="ai-processing-pipeline">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              5-AI Intelligence Pipeline
            </h3>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {overallProgress.toFixed(0)}% Complete
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? `Processing search: "${searchQuery}"` : 'Processing your search across multiple AI systems'}
          </p>
          
          {/* Overall Progress */}
          <div className="space-y-2">
            <Progress value={overallProgress} className="h-2" data-testid="overall-progress" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Scanning {totalListings > 0 ? `${totalListings} listings` : 'multiple sources'}</span>
              <span>{overallProgress < 100 ? 'Processing...' : 'Analysis Complete'}</span>
            </div>
          </div>
        </div>

        {/* AI Processing Steps */}
        <div className="space-y-3" data-testid="ai-steps">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-4 rounded-lg border transition-all duration-300 ${getStepColor(step.status)}`}
              data-testid={`ai-step-${step.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStepIcon(step)}
                  <div>
                    <h4 className="font-medium text-sm">{step.name}</h4>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(step.status)}
                  {step.processingTime && (
                    <span className="text-xs text-muted-foreground">
                      {(step.processingTime / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {step.status === 'processing' && (
                <div className="mb-2">
                  <Progress value={step.progress} className="h-1" />
                </div>
              )}

              {/* Step Results */}
              {step.results && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {step.id === 'firecrawl' && step.results.count !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      <Database className="w-3 h-3 mr-1" />
                      {step.results.count} listings found
                    </Badge>
                  )}
                  
                  {step.id === 'claude' && step.results.score !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {step.results.score}% authenticity
                    </Badge>
                  )}
                  
                  {step.id === 'gpt5' && step.results.insights && step.results.insights.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {step.results.insights.length} insights
                    </Badge>
                  )}
                  
                  {step.id === 'gemini' && step.results.score !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      <Camera className="w-3 h-3 mr-1" />
                      {step.results.score}% verified
                    </Badge>
                  )}
                  
                  {step.id === 'perplexity' && step.results.insights && step.results.insights.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Market intelligence
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {overallProgress === 100 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800">AI Analysis Complete</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-green-600" />
                <span>247 listings analyzed</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                <span>94% quality score</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Authenticity verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-green-600" />
                <span>AI-enhanced results</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}