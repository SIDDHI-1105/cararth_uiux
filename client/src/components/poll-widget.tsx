import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BarChart3, CheckCircle } from "lucide-react";
import { GA4Events } from "@/hooks/use-ga4";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  category?: string;
  featured: boolean;
}

// Get or create visitor ID from localStorage
const getVisitorId = () => {
  let visitorId = localStorage.getItem('cararth_visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cararth_visitor_id', visitorId);
  }
  return visitorId;
};

// Track voted polls in localStorage
const getVotedPolls = (): string[] => {
  const voted = localStorage.getItem('cararth_voted_polls');
  return voted ? JSON.parse(voted) : [];
};

const markPollAsVoted = (pollId: string) => {
  const voted = getVotedPolls();
  voted.push(pollId);
  localStorage.setItem('cararth_voted_polls', JSON.stringify(voted));
};

export function PollWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [votedPolls, setVotedPolls] = useState<string[]>(getVotedPolls());

  const { data: pollsData, isLoading } = useQuery<{ success: boolean; polls: Poll[] }>({
    queryKey: ['/api/polls'],
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionId, question }: { pollId: string; optionId: string; question?: string }) => {
      const visitorId = getVisitorId();
      return await apiRequest("POST", `/api/polls/${pollId}/vote`, { optionId, visitorId });
    },
    onSuccess: (_, variables) => {
      markPollAsVoted(variables.pollId);
      setVotedPolls(getVotedPolls());
      queryClient.invalidateQueries({ queryKey: ['/api/polls'] });
      
      // Track poll vote
      if (variables.question) {
        GA4Events.pollVote(variables.pollId, variables.optionId, variables.question);
      }
      
      toast({
        title: "Vote Recorded!",
        description: "Thank you for participating in our poll.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Vote Failed",
        description: error.message || "You may have already voted on this poll.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const polls = pollsData?.polls || [];
  const featuredPoll = polls.find((p) => p.featured) || polls[0];

  if (!featuredPoll) {
    return null; // No active polls
  }

  const hasVoted = votedPolls.includes(featuredPoll.id);
  const totalVotes = featuredPoll.totalVotes || 0;

  return (
    <Card className="border-blue-200 dark:border-blue-800" data-testid="poll-widget">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Community Poll
          {featuredPoll.category && (
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              • {featuredPoll.category}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          {featuredPoll.question}
        </h3>

        <div className="space-y-3">
          {featuredPoll.options.map((option) => {
            const percentage = totalVotes > 0 
              ? Math.round((option.votes / totalVotes) * 100) 
              : 0;
            const isWinning = hasVoted && option.votes === Math.max(...featuredPoll.options.map(o => o.votes));

            if (hasVoted) {
              // Show results
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      {option.text}
                      {isWinning && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {percentage}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                  </div>
                </div>
              );
            }

            // Show voting buttons
            return (
              <Button
                key={option.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 hover:bg-blue-50 dark:hover:bg-blue-950"
                onClick={() => voteMutation.mutate({ 
                  pollId: featuredPoll.id, 
                  optionId: option.id,
                  question: featuredPoll.question 
                })}
                disabled={voteMutation.isPending}
                data-testid={`button-poll-option-${option.id}`}
              >
                {option.text}
              </Button>
            );
          })}
        </div>

        {hasVoted && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total votes: <span className="font-semibold">{totalVotes}</span>
            </p>
          </div>
        )}

        {!hasVoted && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            Vote to see results
          </p>
        )}
      </CardContent>
    </Card>
  );
}
