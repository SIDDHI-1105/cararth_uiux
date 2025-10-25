import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Sparkles } from "lucide-react";

const storySchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title too long"),
  content: z.string().min(100, "Story must be at least 100 characters").max(2000, "Story too long"),
  carBrand: z.string().optional(),
  carModel: z.string().optional(),
  city: z.string().optional(),
});

type StoryFormData = z.infer<typeof storySchema>;

interface StorySubmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StorySubmissionForm({ open, onOpenChange }: StorySubmissionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [moderationResult, setModerationResult] = useState<any>(null);

  const form = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: "",
      content: "",
      carBrand: "",
      carModel: "",
      city: "",
    },
  });

  // Reset moderation result when dialog closes to allow resubmission
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setModerationResult(null);
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const submitStoryMutation = useMutation({
    mutationFn: async (data: StoryFormData) => {
      return await apiRequest("POST", "/api/stories", data);
    },
    onSuccess: (response: any) => {
      setModerationResult(response.moderation);
      
      toast({
        title: response.moderation.status === 'approved' ? "Story Published!" : "Story Submitted",
        description: response.moderation.message,
      });

      if (response.moderation.status === 'approved') {
        queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stories/featured'] });
        // Close dialog after 3 seconds on success
        setTimeout(() => {
          handleOpenChange(false);
        }, 3000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit story",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StoryFormData) => {
    submitStoryMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Share Your Car Story
          </DialogTitle>
          <DialogDescription>
            Tell us about your car ownership experience! Your story will be reviewed by AI before publishing.
          </DialogDescription>
        </DialogHeader>

        {moderationResult ? (
          <div className="py-8 text-center">
            <div className={`text-6xl mb-4 ${
              moderationResult.status === 'approved' ? '🎉' : 
              moderationResult.status === 'flagged' ? '⏳' : '❌'
            }`}>
              {moderationResult.status === 'approved' ? '🎉' : 
               moderationResult.status === 'flagged' ? '⏳' : '❌'}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {moderationResult.status === 'approved' ? 'Story Published!' : 
               moderationResult.status === 'flagged' ? 'Under Review' : 'Story Rejected'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {moderationResult.message}
            </p>
            {moderationResult.qualityScore && (
              <p className="text-sm text-gray-500 mt-4">
                Quality Score: {moderationResult.qualityScore}/100
              </p>
            )}
            {moderationResult.status !== 'approved' && (
              <Button 
                onClick={() => setModerationResult(null)}
                className="mt-4"
                data-testid="button-edit-story"
              >
                Edit & Resubmit
              </Button>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., My Swift's 5-year ownership journey"
                        {...field}
                        data-testid="input-story-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Story *</FormLabel>
                    <FormDescription>
                      Minimum 100 characters. Share your buying experience, road trips, maintenance tips, or memorable moments.
                    </FormDescription>
                    <FormControl>
                      <Textarea 
                        placeholder="Share your car story..."
                        rows={6}
                        {...field}
                        data-testid="textarea-story-content"
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500">
                      {field.value.length}/2000 characters
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="carBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Brand</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Maruti Suzuki"
                          {...field}
                          data-testid="input-car-brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Model</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Swift VXi"
                          {...field}
                          data-testid="input-car-model"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Hyderabad"
                        {...field}
                        data-testid="input-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleOpenChange(false)}
                  data-testid="button-cancel-story"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitStoryMutation.isPending}
                  data-testid="button-submit-story"
                >
                  {submitStoryMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {submitStoryMutation.isPending ? "Submitting..." : "Submit Story"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
