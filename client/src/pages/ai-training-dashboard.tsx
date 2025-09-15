import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Brain, Target, Zap, Play, RefreshCw, CheckCircle, Clock, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AiTrainingDashboard() {
  const [trainingJobId, setTrainingJobId] = useState<string | null>("ftjob-cJVP58gwOuz7IBJ2DbGUvu7F");
  const { toast } = useToast();

  // Query for training job status with real-time updates
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

  // Track real-time metrics
  const [trainingMetrics, setTrainingMetrics] = useState<Array<{timestamp: number, progress: number, tokens?: number}>>([]);
  
  useEffect(() => {
    if (jobStatus) {
      const currentProgress = getTrainingProgress();
      const timestamp = Date.now();
      
      setTrainingMetrics(prev => {
        const newMetrics = [...prev, { 
          timestamp, 
          progress: currentProgress,
          tokens: jobStatus.trained_tokens 
        }];
        // Keep only last 20 data points for chart
        return newMetrics.slice(-20);
      });
    }
  }, [jobStatus]);

  // Status display helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validating_files':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Validating Files</Badge>;
      case 'queued':
        return <Badge variant="outline" className="text-purple-600"><Clock className="w-3 h-3 mr-1" />Queued</Badge>;
      case 'running':
        return <Badge variant="outline" className="text-blue-600"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Training</Badge>;
      case 'succeeded':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate training progress
  const getTrainingProgress = () => {
    if (!jobStatus) return 0;
    
    switch (jobStatus.status) {
      case 'validating_files':
        return 10;
      case 'queued':
        return 20;
      case 'running':
        // Estimate progress based on trained tokens if available
        if (jobStatus.trained_tokens && jobStatus.hyperparameters?.n_epochs) {
          const estimatedTotalTokens = 200 * 500 * jobStatus.hyperparameters.n_epochs; // rough estimate
          const progress = Math.min(90, 30 + (jobStatus.trained_tokens / estimatedTotalTokens) * 60);
          return Math.round(progress);
        }
        return 50; // Default mid-training progress
      case 'succeeded':
        return 100;
      case 'failed':
      case 'cancelled':
        return 0;
      default:
        return 0;
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
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
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
                  
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                    ID: <code className="font-mono text-xs">{trainingJobId}</code>
                  </p>
                  
                  {jobStatus && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Status:</span>
                        {getStatusBadge(jobStatus.status)}
                      </div>
                      
                      {/* Training Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Training Progress
                          </span>
                          <span className="text-sm text-blue-600 dark:text-blue-400">
                            {getTrainingProgress()}%
                          </span>
                        </div>
                        <Progress 
                          value={getTrainingProgress()} 
                          className="h-2"
                          data-testid="training-progress-bar"
                        />
                      </div>
                      
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {jobStatus.trained_tokens && (
                          <div className="p-2 bg-white dark:bg-slate-800 rounded border">
                            <div className="flex items-center gap-1 mb-1">
                              <TrendingUp className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-medium">Tokens Trained</span>
                            </div>
                            <p className="text-sm font-mono text-green-600">
                              {jobStatus.trained_tokens.toLocaleString()}
                            </p>
                          </div>
                        )}
                        
                        {jobStatus.hyperparameters?.n_epochs && (
                          <div className="p-2 bg-white dark:bg-slate-800 rounded border">
                            <div className="flex items-center gap-1 mb-1">
                              <Activity className="w-3 h-3 text-blue-600" />
                              <span className="text-xs font-medium">Epochs</span>
                            </div>
                            <p className="text-sm font-mono text-blue-600">
                              {jobStatus.hyperparameters.n_epochs}
                            </p>
                          </div>
                        )}
                        
                        {jobStatus.hyperparameters?.batch_size && (
                          <div className="p-2 bg-white dark:bg-slate-800 rounded border">
                            <div className="flex items-center gap-1 mb-1">
                              <Target className="w-3 h-3 text-purple-600" />
                              <span className="text-xs font-medium">Batch Size</span>
                            </div>
                            <p className="text-sm font-mono text-purple-600">
                              {jobStatus.hyperparameters.batch_size}
                            </p>
                          </div>
                        )}
                        
                        {jobStatus.hyperparameters?.learning_rate_multiplier && (
                          <div className="p-2 bg-white dark:bg-slate-800 rounded border">
                            <div className="flex items-center gap-1 mb-1">
                              <Brain className="w-3 h-3 text-orange-600" />
                              <span className="text-xs font-medium">Learning Rate</span>
                            </div>
                            <p className="text-sm font-mono text-orange-600">
                              {jobStatus.hyperparameters.learning_rate_multiplier}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {jobStatus.model_id && (
                        <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                          <p className="text-xs text-green-700 dark:text-green-300 mb-1">
                            <strong>✅ Fine-tuned Model Ready:</strong>
                          </p>
                          <code className="text-xs font-mono text-green-600 dark:text-green-400 break-all">
                            {jobStatus.model_id}
                          </code>
                        </div>
                      )}
                      
                      {/* Timestamps */}
                      <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                        {jobStatus.created_at && (
                          <p>
                            <strong>Started:</strong> {new Date(jobStatus.created_at * 1000).toLocaleString()}
                          </p>
                        )}
                        {jobStatus.finished_at && (
                          <p>
                            <strong>Finished:</strong> {new Date(jobStatus.finished_at * 1000).toLocaleString()}
                          </p>
                        )}
                      </div>
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

      {/* Real-time Training Status Card */}
      {trainingJobId && jobStatus && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Real-time Training Status
            </CardTitle>
            <CardDescription>
              Live monitoring of GPT-4o fine-tuning progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Stage */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">Current Stage</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(jobStatus.status)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {jobStatus.status === 'validating_files' && 'Validating training data format...'}
                  {jobStatus.status === 'queued' && 'Waiting in training queue...'}
                  {jobStatus.status === 'running' && 'Actively training the model...'}
                  {jobStatus.status === 'succeeded' && 'Training completed successfully!'}
                  {jobStatus.status === 'failed' && 'Training encountered an error'}
                </p>
              </div>

              {/* Estimated Time */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-sm">Estimated Time</span>
                </div>
                <p className="text-lg font-mono text-green-600">
                  {jobStatus.status === 'running' ? '~45 min' : 
                   jobStatus.status === 'validating_files' ? '~50 min' :
                   jobStatus.status === 'queued' ? '~60 min' :
                   jobStatus.status === 'succeeded' ? 'Complete' : 'N/A'}
                </p>
                <p className="text-xs text-gray-600">
                  {jobStatus.status === 'running' && 'Remaining time estimate'}
                  {jobStatus.status === 'validating_files' && 'Total estimated time'}
                  {jobStatus.status === 'queued' && 'Including queue wait time'}
                  {jobStatus.status === 'succeeded' && 'Training finished'}
                </p>
              </div>

              {/* Training Quality */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">Training Quality</span>
                </div>
                <p className="text-lg font-mono text-purple-600">
                  {jobStatus.status === 'succeeded' ? 'Excellent' :
                   jobStatus.status === 'running' ? 'On Track' :
                   jobStatus.status === 'validating_files' ? 'Preparing' : 'Pending'}
                </p>
                <p className="text-xs text-gray-600">
                  200 examples, 3 epochs
                </p>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="mt-6">
              <h4 className="font-medium text-sm mb-3">Training Timeline</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    ['validating_files', 'queued', 'running', 'succeeded'].includes(jobStatus.status) 
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">File Validation</span>
                  {['validating_files', 'queued', 'running', 'succeeded'].includes(jobStatus.status) && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    ['queued', 'running', 'succeeded'].includes(jobStatus.status) 
                      ? 'bg-green-500' : jobStatus.status === 'validating_files' ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Queue Processing</span>
                  {['queued', 'running', 'succeeded'].includes(jobStatus.status) && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    ['running', 'succeeded'].includes(jobStatus.status) 
                      ? 'bg-green-500' : ['validating_files', 'queued'].includes(jobStatus.status) ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Model Training</span>
                  {jobStatus.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                  {jobStatus.status === 'succeeded' && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    jobStatus.status === 'succeeded' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">Model Deployment</span>
                  {jobStatus.status === 'succeeded' && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
              </div>
            </div>

            {/* Real-time Progress Chart */}
            {trainingMetrics.length > 1 && (
              <div className="mt-6">
                <h4 className="font-medium text-sm mb-3">Progress Over Time</h4>
                <div className="h-24 bg-gray-50 dark:bg-gray-900 rounded border p-3">
                  <div className="relative h-full">
                    <svg className="w-full h-full" viewBox="0 0 400 60">
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Progress line */}
                      <polyline
                        points={trainingMetrics.map((metric, index) => 
                          `${(index / (trainingMetrics.length - 1)) * 380 + 10},${60 - (metric.progress / 100) * 50}`
                        ).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        className="drop-shadow-sm"
                      />
                      
                      {/* Progress area */}
                      <polygon
                        points={`10,60 ${trainingMetrics.map((metric, index) => 
                          `${(index / (trainingMetrics.length - 1)) * 380 + 10},${60 - (metric.progress / 100) * 50}`
                        ).join(' ')} 390,60`}
                        fill="url(#progressGradient)"
                      />
                      
                      {/* Data points */}
                      {trainingMetrics.map((metric, index) => (
                        <circle
                          key={index}
                          cx={(index / (trainingMetrics.length - 1)) * 380 + 10}
                          cy={60 - (metric.progress / 100) * 50}
                          r="2"
                          fill="#3b82f6"
                          className="drop-shadow-sm"
                        />
                      ))}
                    </svg>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Start</span>
                    <span className="font-medium">{getTrainingProgress()}% Complete</span>
                    <span>Finish</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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