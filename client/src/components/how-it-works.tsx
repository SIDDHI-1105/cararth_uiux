import { Search, Filter, Phone } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Search,
    title: "Search Verified Cars",
    description: "Browse transparent listings from verified dealers, individual sellers, and trusted platforms nationwide",
    color: "text-blue-600 dark:text-blue-400"
  },
  {
    number: 2,
    icon: Filter,
    title: "Filter Instantly",
    description: "Compare prices, features, and sellers with our smart filtering tools",
    color: "text-green-600 dark:text-green-400"
  },
  {
    number: 3,
    icon: Phone,
    title: "Contact Directly",
    description: "Connect with verified sellers immediately. No intermediaries, no commissions",
    color: "text-purple-600 dark:text-purple-400"
  }
];

export function HowItWorks() {
  // Schema.org HowTo markup for SEO and LLM discoverability
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Find Your Perfect Used Car on CarArth",
    "description": "Search, compare, and buy verified used cars across India with CarArth's AI-powered platform",
    "step": steps.map((step) => ({
      "@type": "HowToStep",
      "position": step.number,
      "name": step.title,
      "text": step.description,
      "url": `https://www.cararth.com#step-${step.number}`
    }))
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <section className="py-16 relative" data-testid="section-how-it-works">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find your perfect car in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.number} 
                  className="glass-card relative overflow-hidden hover:scale-105 transition-all duration-300"
                  id={`step-${step.number}`}
                  data-testid={`card-step-${step.number}`}
                >
                  <div className="p-8 text-center">
                    <div className="mb-6 relative">
                      <div className={`w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center ${step.color}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Trust Badge with Glass */}
          <div className="mt-16 text-center">
            <div className="glass inline-flex items-center gap-2 px-6 py-3.5 border-green-200/30 dark:border-green-800/30 rounded-full">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-green-700 dark:text-green-300">
                No paid listings — unbiased results
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
