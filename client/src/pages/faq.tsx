import { FullWidthLayout } from "@/components/layout";
import { SEOHead } from "@/components/seo-head";
import { Link } from "wouter";
import { Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FAQPage() {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is CarArth.com?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An AI-first platform helping you sell used cars across India with one upload."
        }
      },
      {
        "@type": "Question",
        "name": "How does syndication save time?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "By distributing your listing to multiple platforms automatically."
        }
      },
      {
        "@type": "Question",
        "name": "Why choose green listings?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To reduce emissions by 40% through sustainable reselling."
        }
      }
    ]
  };

  return (
    <FullWidthLayout>
      <SEOHead 
        title="Frequently Asked Questions - CarArth"
        description="Find answers to common questions about CarArth's AI-first platform for selling used cars across India. Learn about syndication, green listings, and more."
        keywords="CarArth FAQ, used car selling, car syndication, green listings, AI platform, car marketplace India"
        structuredData={faqStructuredData}
        canonical="https://www.cararth.com/faq"
      />
      
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Everything you need to know about CarArth
            </p>
          </div>

          {/* FAQ Content */}
          <div className="space-y-8">
            {/* Question 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                What is CarArth.com?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                An AI-first platform helping you sell used cars across India with one upload.
              </p>
            </div>

            {/* Question 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                How does syndication save time?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                By distributing your listing to multiple platforms automatically.
              </p>
            </div>

            {/* Question 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Why choose green listings?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                To reduce emissions by 40% through sustainable reselling.
              </p>
            </div>
          </div>

          {/* Back to Home CTA */}
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="min-h-[44px]" data-testid="button-back-home">
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </FullWidthLayout>
  );
}
