import { useEffect } from 'react';

interface NewsPost {
  id: string;
  title: string;
  content?: string;
  author?: string;
  publishedAt?: Date;
  category?: string;
  coverImage?: string;
}

interface NewsSEOHeadProps {
  posts?: NewsPost[];
  singlePost?: NewsPost;
  isDetailPage?: boolean;
}

export function NewsSEOHead({ posts, singlePost, isDetailPage = false }: NewsSEOHeadProps) {
  useEffect(() => {
    // Update meta tags based on page type
    updateMetaTags(singlePost, isDetailPage);
    
    // Add schema markup
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.text = JSON.stringify(
      isDetailPage && singlePost 
        ? generateSinglePostSchema(singlePost)
        : generateSchemaMarkup(posts)
    );
    schemaScript.id = 'news-schema-markup';
    
    // Remove existing schema if present
    const existing = document.getElementById('news-schema-markup');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(schemaScript);

    return () => {
      // Cleanup on unmount
      const script = document.getElementById('news-schema-markup');
      if (script) {
        script.remove();
      }
    };
  }, [posts, singlePost, isDetailPage]);

  return null;
}

function updateMetaTags(singlePost?: NewsPost, isDetailPage: boolean = false) {
  // Clean up previous CarArth meta tags to avoid duplicates
  const previousMetas = document.querySelectorAll('meta[data-cararth-managed="true"]');
  previousMetas.forEach(meta => meta.remove());
  
  if (isDetailPage && singlePost) {
    // Individual post meta tags
    document.title = `${singlePost.title} | CarArth Throttle Talk`;
    
    const postUrl = `https://cararth.com/news/${singlePost.id}`;
    const postDescription = singlePost.content?.substring(0, 160) || `${singlePost.title} - Read on CarArth Throttle Talk`;
    const postImage = singlePost.coverImage || 'https://cararth.com/cararth-social-preview.png';
    
    const metaTags = [
      { name: 'description', content: postDescription },
      { property: 'og:title', content: `${singlePost.title} | CarArth` },
      { property: 'og:description', content: postDescription },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: postUrl },
      { property: 'og:image', content: postImage },
      { property: 'og:site_name', content: 'CarArth - India\'s Used Car Search Engine' },
      { property: 'article:published_time', content: singlePost.publishedAt?.toISOString() || new Date().toISOString() },
      { property: 'article:author', content: singlePost.author || 'CarArth Community' },
      { property: 'article:section', content: singlePost.category || 'Automotive News' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: singlePost.title },
      { name: 'twitter:description', content: postDescription },
      { name: 'twitter:image', content: postImage },
    ];
    
    metaTags.forEach(({ name, property, content }) => {
      const meta = document.createElement('meta');
      if (name) meta.setAttribute('name', name);
      if (property) meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      meta.setAttribute('data-cararth-managed', 'true');
      document.head.appendChild(meta);
    });
    
    return;
  }
  
  // Collection page meta tags
  document.title = "Throttle Talk - Automotive News & Insights | CarArth";

  // Update or create meta tags
  const metaTags = [
    { name: 'description', content: 'India\'s automotive community discussing used cars, market trends, and industry insights. Stay updated with real-time news from Team-BHP, CarAndBike, and expert analysis.' },
    { property: 'og:title', content: 'Throttle Talk - Automotive News & Community | CarArth' },
    { property: 'og:description', content: 'Join India\'s automotive community for used car insights, market trends, and expert discussions. Powered by AI analysis from SIAM data and industry sources.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://cararth.com/news' },
    { property: 'og:image', content: 'https://cararth.com/cararth-social-preview.png' },
    { property: 'og:site_name', content: 'CarArth - India\'s Used Car Search Engine' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Throttle Talk - Automotive News | CarArth' },
    { name: 'twitter:description', content: 'India\'s automotive community for used car insights and market trends' },
    { name: 'twitter:image', content: 'https://cararth.com/cararth-social-preview.png' },
  ];

  metaTags.forEach(({ name, property, content }) => {
    const meta = document.createElement('meta');
    if (name) meta.setAttribute('name', name);
    if (property) meta.setAttribute('property', property);
    meta.setAttribute('content', content);
    meta.setAttribute('data-cararth-managed', 'true');
    document.head.appendChild(meta);
  });
}

function generateSchemaMarkup(posts?: NewsPost[]) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Throttle Talk - Automotive News',
    description: 'India\'s automotive community discussing used cars, market trends, and industry insights',
    url: 'https://cararth.com/news',
    publisher: {
      '@type': 'Organization',
      name: 'CarArth',
      legalName: 'Aaro7 Fintech Private Limited',
      url: 'https://cararth.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cararth.com/cararth-logo.png',
      },
      sameAs: [
        'https://www.facebook.com/cararth',
        'https://www.instagram.com/cararth',
        'https://www.linkedin.com/company/cararth'
      ],
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://cararth.com/?query={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  // Add individual article schemas if posts are available
  if (posts && posts.length > 0) {
    const articleSchemas = posts.slice(0, 5).map(post => ({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.content?.substring(0, 200) || 'Automotive news and insights',
      url: `https://cararth.com/news/${post.id}`,
      datePublished: post.publishedAt?.toISOString() || new Date().toISOString(),
      dateModified: post.publishedAt?.toISOString() || new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: post.author || 'CarArth Community',
      },
      publisher: {
        '@type': 'Organization',
        name: 'CarArth',
        legalName: 'Aaro7 Fintech Private Limited',
        logo: {
          '@type': 'ImageObject',
          url: 'https://cararth.com/cararth-logo.png',
        }
      },
      image: post.coverImage || 'https://cararth.com/cararth-social-preview.png',
      articleSection: post.category || 'Automotive News',
      keywords: 'used cars, automotive news, car market trends, India automotive, car buying, car selling',
    }));

    return {
      '@context': 'https://schema.org',
      '@graph': [baseSchema, ...articleSchemas]
    };
  }

  return baseSchema;
}

function generateSinglePostSchema(post: NewsPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.content?.substring(0, 200) || 'Automotive news and insights',
    url: `https://cararth.com/news/${post.id}`,
    datePublished: post.publishedAt?.toISOString() || new Date().toISOString(),
    dateModified: post.publishedAt?.toISOString() || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: post.author || 'CarArth Community',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CarArth',
      legalName: 'Aaro7 Fintech Private Limited',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cararth.com/cararth-logo.png',
      }
    },
    image: post.coverImage || 'https://cararth.com/cararth-social-preview.png',
    articleSection: post.category || 'Automotive News',
    keywords: 'used cars, automotive news, car market trends, India automotive, car buying, car selling',
  };
}

// FAQ Schema Component for LLM discoverability
export function FAQSchemaMarkup() {
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Throttle Talk?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Throttle Talk is CarArth\'s automotive news and community platform, aggregating insights from Team-BHP, CarAndBike, and other trusted sources. It provides real-time market intelligence powered by AI analysis of SIAM data and industry trends.'
          }
        },
        {
          '@type': 'Question',
          name: 'How does CarArth source automotive news?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CarArth aggregates automotive news from verified RSS feeds including Team-BHP forums, AutocarIndia, and CarAndBike. All content includes proper attribution and source links. Market insights are generated using AI analysis of SIAM (Society of Indian Automobile Manufacturers) data and government automotive statistics.'
          }
        },
        {
          '@type': 'Question',
          name: 'What market insights does Throttle Talk provide?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Throttle Talk provides AI-powered market insights including new car sales data from SIAM, used car pricing trends, popular models and brands analysis, seasonal market patterns, EV adoption impact on resale values, and real-time Telangana RTA registration statistics.'
          }
        },
        {
          '@type': 'Question',
          name: 'How can I share Throttle Talk articles?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can share Throttle Talk articles on Facebook, LinkedIn, WhatsApp, and Twitter using the social sharing buttons. Each article includes backlinks to cararth.com for proper attribution. We also provide an RSS feed at https://cararth.com/feed/news.xml for automation tools.'
          }
        },
        {
          '@type': 'Question',
          name: 'Is CarArth news content reliable?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, all news content is sourced from reputable automotive publications and forums with proper attribution. Market insights are based on authoritative data from SIAM, government statistics, and industry reports. CarArth.com is a unit of Aaro7 Fintech Private Limited.'
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    script.id = 'faq-schema-markup';
    
    const existing = document.getElementById('faq-schema-markup');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const faqScript = document.getElementById('faq-schema-markup');
      if (faqScript) {
        faqScript.remove();
      }
    };
  }, []);

  return null;
}
