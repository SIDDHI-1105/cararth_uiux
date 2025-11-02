import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Database, Play, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProductionSync() {
  const [scraperResult, setScraperResult] = useState<any>(null);

  const scraperMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/trigger-scrapers", {});
      return await response.json();
    },
    onSuccess: (data) => {
      setScraperResult(data);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Production Database Setup
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Simple one-click setup for your production database. No commands needed!
          </p>
        </div>

        <Card data-testid="card-run-scrapers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Run Scrapers to Populate Database
            </CardTitle>
            <CardDescription>
              Fetch fresh listings from CarDekho, OLX, and Facebook Marketplace. Takes 5-10 minutes to complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => scraperMutation.mutate()}
              disabled={scraperMutation.isPending}
              size="lg"
              className="w-full"
              variant="secondary"
              data-testid="button-run-scrapers"
            >
              {scraperMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Scraping In Progress...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Run Scrapers
                </>
              )}
            </Button>

            {scraperMutation.isError && (
              <Alert variant="destructive" data-testid="alert-scraper-error">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {(scraperMutation.error as any)?.message || "Failed to start scrapers"}
                </AlertDescription>
              </Alert>
            )}

            {scraperResult && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" data-testid="alert-scraper-success">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900 dark:text-green-100">Scrapers Started!</AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="mt-2">
                    ✅ {scraperResult.message}
                    <div className="mt-2 text-sm">Check back in 5-10 minutes to see fresh listings!</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700" data-testid="card-instructions">
          <CardHeader>
            <CardTitle className="text-lg">📋 Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <strong className="text-slate-900 dark:text-slate-100">1. Click "Run Scrapers"</strong>
              <p>Fetches fresh listings from CarDekho, OLX, and Facebook Marketplace.</p>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-slate-100">2. Wait 5-10 minutes</strong>
              <p>Scrapers run in the background. Check back to see listings populate.</p>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-slate-100">3. Done!</strong>
              <p>Visit <a href="https://cararth.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">cararth.com</a> to see your listings!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
