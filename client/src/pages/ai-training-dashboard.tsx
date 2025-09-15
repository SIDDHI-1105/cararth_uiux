import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Brain, Target, Zap, Play, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AiTrainingDashboard() {
  const [trainingJobId, setTrainingJobId] = useState<string | null>("ftjob-cJVP58gwOuz7IBJ2DbGUvu7F");
  const { toast } = useToast();

  // Query for training job status
  const { data: jobStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/ai/train/status', trainingJobId],
    enabled: !!trainingJobId,
    refetchInterval: 5000, // Refetch every 5 seconds
    queryFn: async () => {
      if (!trainingJobId) return null;
      const response = await fetch(`/api/ai/train/status/${trainingJobId}`);
      return await response.json();
    }
  });

  // Status display helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validating_files':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Validating Files</Badge>;
      case 'running':
        return <Badge variant="outline" className="text-blue-600"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Training</Badge>;
      case 'succeeded':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
              disabled={startTrainingMutation.isPending || (jobStatus && jobStatus.status !== 'failed')}
              className="w-full mb-4"
              data-testid="button-start-price-training"
            >
              {startTrainingMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start New Training Job
            </Button>
            
            {trainingJobId && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Active Training Job
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => refetchStatus()}
                      data-testid="button-refresh-status"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    ID: <code className="font-mono">{trainingJobId}</code>
                  </p>
                  
                  {jobStatus && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Status:</span>
                        {getStatusBadge(jobStatus.status)}
                      </div>
                      
                      {jobStatus.model_id && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <strong>Model:</strong> <code>{jobStatus.model_id}</code>
                        </p>
                      )}
                      
                      {jobStatus.trained_tokens && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <strong>Tokens Trained:</strong> {jobStatus.trained_tokens.toLocaleString()}
                        </p>
                      )}
                      
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        <strong>Hyperparameters:</strong> {jobStatus.hyperparameters?.n_epochs} epochs, 
                        batch size {jobStatus.hyperparameters?.batch_size}, 
                        LR {jobStatus.hyperparameters?.learning_rate_multiplier}
                      </p>
                    </div>
                  )}
                </div>
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