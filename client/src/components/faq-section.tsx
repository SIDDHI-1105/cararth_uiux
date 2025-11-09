import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is CarArth.com?",
    answer: "CarArth.com is India's first AI-powered used car search engine for both buyers and sellers, bringing listings from multiple sources into one smart, unified experience."
  },
  {
    question: "How does CarArth find cars from multiple platforms?",
    answer: "CarArth uses legally compliant web crawlers (Firecrawl and Apify) to fetch publicly available listings and organize them for easier discovery."
  },
  {
    question: "How is CarArth different from Cars24 or OLX Autos?",
    answer: "CarArth is a search engine, not a dealer. It aggregates verified listings from different platforms instead of selling directly."
  },
  {
    question: "Is CarArth data legal and verified?",
    answer: "Yes. CarArth only indexes publicly available information and complies with Indian data and intermediary laws."
  },
  {
    question: "How can sellers list their cars?",
    answer: "Sellers can list via CarArth's syndication form and have their car appear on multiple platforms simultaneously."
  },
  {
    question: "What are the benefits of using AI in CarArth?",
    answer: "AI helps match buyers to the most relevant listings, ensures zero duplication, and provides price insights using data from SIAM and market trends."
  },
  {
    question: "Does CarArth charge sellers or buyers?",
    answer: "Basic listing is free; premium syndication and featured listings are optional paid upgrades."
  },
  {
    question: "Where does CarArth operate?",
    answer: "The pilot phase is live in Telangana, with expansion plans across India."
  }
];

export function FAQSection() {
  return (
    <section id="faq" className="py-12 sm:py-16 bg-background dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Everything you need to know about CarArth
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="glass-card px-4 sm:px-6 hover:scale-102 transition-transform"
              data-testid={`faq-item-${index}`}
            >
              <AccordionTrigger className="text-left text-base sm:text-lg font-semibold hover:no-underline py-4 sm:py-5 text-gray-900 night:text-white">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 night:text-gray-200 text-sm sm:text-base pb-4 sm:pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-muted-foreground text-sm sm:text-base mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:connect@cararth.com"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
            data-testid="button-contact-faq"
          >
            📧 Contact us at connect@cararth.com
          </a>
        </div>
      </div>
    </section>
  );
}
