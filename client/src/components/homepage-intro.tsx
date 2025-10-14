export default function HomepageIntro() {
  return (
    <section className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800" data-testid="section-homepage-intro">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6" data-testid="text-intro-title">
            India's First AI-Powered Used Car Search Engine
          </h1>
          
          <div className="text-gray-700 dark:text-gray-300 space-y-4 text-base sm:text-lg leading-relaxed" data-testid="text-intro-content">
            <p>
              <strong>CarArth</strong> is revolutionizing India's used car marketplace by combining artificial intelligence with sustainable automotive practices. As an AI-first search engine, we aggregate verified listings from multiple platforms including <strong>OLX, Cars24, CarDekho, CarWale, and Facebook Marketplace</strong>, giving buyers unprecedented access to the nation's largest collection of pre-owned vehicles in one unified platform.
            </p>
            
            <p>
              Our <strong>one-upload syndication technology</strong> transforms the selling experience for dealers and individual sellers. Upload your car listing once, and our intelligent distribution system automatically syndicates it across major automotive marketplaces, maximizing your reach while saving countless hours of manual posting. This innovation has helped thousands of sellers connect with qualified buyers faster than ever before.
            </p>
            
            <p>
              <strong>Sustainability meets technology</strong> at CarArth. Every used car sale through our platform contributes to reducing carbon emissions by up to <strong>40% compared to manufacturing new vehicles</strong>. Our Carbon Savings Dashboard quantifies the environmental impact of choosing pre-owned, empowering conscious consumers to make eco-friendly decisions without compromising on quality or selection.
            </p>
            
            <p>
              Trust is paramount in automotive transactions. That's why we employ <strong>multi-LLM verification</strong> using advanced AI models like <strong>Gemini for OCR document verification</strong> and <strong>Claude for regulatory compliance checks</strong>. Every listing undergoes rigorous automated screening to ensure authenticity, protecting buyers from fraud and giving sellers credibility in a competitive market.
            </p>
            
            <p>
              Whether you're searching for your first car, upgrading your family vehicle, or selling to the right buyer, CarArth provides the intelligent tools, verified data, and sustainable practices that define the future of India's automotive marketplace. Join thousands of satisfied users who trust CarArth as their guide to smarter, greener car transactions.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
