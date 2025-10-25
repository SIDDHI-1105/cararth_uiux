import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Sparkles } from "lucide-react";
import { GA4Events } from "@/hooks/use-ga4";

const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
  topics: z.array(z.string()).default([]),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export function NewsletterSignup() {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
      name: "",
      frequency: "weekly",
      topics: [],
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: NewsletterFormData) => {
      return await apiRequest("POST", "/api/newsletter/subscribe", data);
    },
    onSuccess: (_, variables) => {
      setIsSubscribed(true);
      
      // Track newsletter signup
      GA4Events.newsletterSignup(variables.frequency || 'weekly', variables.topics || []);
      
      toast({
        title: "🎉 Subscribed!",
        description: "You'll receive our automotive insights in your inbox.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  if (isSubscribed) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">📬</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          You're All Set!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Check your inbox for our welcome email. We'll keep you updated with the latest automotive insights.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-blue-600 rounded-lg">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Subscribe to Throttle Talk
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Get curated automotive insights, market trends, and community stories delivered to your inbox
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => subscribeMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="your@email.com"
                      {...field}
                      data-testid="input-newsletter-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your name"
                      {...field}
                      data-testid="input-newsletter-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <div className="flex gap-4">
                  {["daily", "weekly", "monthly"].map((freq) => (
                    <label key={freq} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={freq}
                        checked={field.value === freq}
                        onChange={() => field.onChange(freq)}
                        className="text-blue-600"
                        data-testid={`radio-frequency-${freq}`}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{freq}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="topics"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interests (Optional)</FormLabel>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "market-insights", label: "Market Insights" },
                    { id: "new-articles", label: "Latest Articles" },
                    { id: "ugc-highlights", label: "Community Stories" },
                  ].map((topic) => (
                    <label key={topic.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={field.value?.includes(topic.id)}
                        onCheckedChange={(checked) => {
                          const updated = checked
                            ? [...(field.value || []), topic.id]
                            : field.value?.filter((t) => t !== topic.id) || [];
                          field.onChange(updated);
                        }}
                        data-testid={`checkbox-topic-${topic.id}`}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{topic.label}</span>
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={subscribeMutation.isPending}
            data-testid="button-subscribe-newsletter"
          >
            {subscribeMutation.isPending ? "Subscribing..." : "Subscribe Now"}
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By subscribing, you agree to receive emails from CarArth. Unsubscribe anytime.
          </p>
        </form>
      </Form>
    </div>
  );
}
