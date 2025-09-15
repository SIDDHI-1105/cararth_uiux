import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Brain, Target, Zap, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AiTrainingDashboard() {
  const [trainingJobId, setTrainingJobId] = useState<string | null>("ftjob-cJVP58gwOuz7IBJ2DbGUvu7F");
  const { toast } = useToast();

  const startTrainingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/train/price-modeling');
      return await response.json();
    },
    onSuccess: (data) => {
      setTrainingJobId(data.jobId);
      toast({
        title: "Training Started!",
        description: `Price modeling training initiated with job ID: ${data.jobId}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Training Failed",
        description: error.message || "Failed to start training",
        variant: "destructive"
      });
    }
  });

  const generateDataMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await apiRequest('POST', '/api/ai/generate-training-data', { count });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Training Data Generated!",
        description: `Generated ${data.count} synthetic training examples`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate training data",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          AI Training Dashboard
        </h1>
        <p className="text-gray-600">
          Train and monitor AI models for price prediction, authenticity scoring, and fraud detection
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Price Modeling Training
            </CardTitle>
            <CardDescription>
              Start GPT fine-tuning for accurate price predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => startTrainingMutation.mutate()}
              disabled={startTrainingMutation.isPending}
              className="w-full"
              data-testid="button-start-price-training"
            >
              {startTrainingMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Price Modeling Training
            </Button>
            {trainingJobId && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Training Job ID: <code className="font-mono">{trainingJobId}</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Generate Training Data
            </CardTitle>
            <CardDescription>
              Create synthetic training examples for model training
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline"
              onClick={() => generateDataMutation.mutate(200)}
              disabled={generateDataMutation.isPending}
              className="w-full"
              data-testid="button-generate-data"
            >
              {generateDataMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Generate 200 Examples
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Model Training Strategy</CardTitle>
          <CardDescription>
            Optimized approach using different AI models for specialized tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-blue-600 mb-2">GPT-4o</h3>
              <p className="text-sm text-gray-600 mb-2">Decision Engine</p>
              <ul className="text-xs space-y-1">
                <li>• Price modeling</li>
                <li>• Final summaries</li>
                <li>• Trust scoring</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-green-600 mb-2">Gemini</h3>
              <p className="text-sm text-gray-600 mb-2">Market Intelligence</p>
              <ul className="text-xs space-y-1">
                <li>• Price bands</li>
                <li>• City patterns</li>
                <li>• Market reconciliation</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-purple-600 mb-2">Anthropic</h3>
              <p className="text-sm text-gray-600 mb-2">Safety Classification</p>
              <ul className="text-xs space-y-1">
                <li>• PII detection</li>
                <li>• Fraud classification</li>
                <li>• Content moderation</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-orange-600 mb-2">Perplexity</h3>
              <p className="text-sm text-gray-600 mb-2">Real-time Research</p>
              <ul className="text-xs space-y-1">
                <li>• Market verification</li>
                <li>• Anomaly detection</li>
                <li>• Price validation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}