// Google Analytics 4 Tracking Utilities

interface GA4Event {
  event: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

// Send event to GA4
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
    
    // Only log in development to keep production console clean
    if (import.meta.env.DEV) {
      console.log(`📊 GA4 Event: ${eventName}`, parameters);
    }
  } else if (import.meta.env.DEV) {
    console.log(`📊 GA4 not loaded, would track: ${eventName}`, parameters);
  }
}

// Page view tracking
export function trackPageView(pagePath: string, pageTitle?: string) {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
}

// User engagement events
export const GA4Events = {
  // Newsletter
  newsletterSignup: (frequency: string, topics: string[]) => {
    trackEvent('newsletter_signup', {
      frequency,
      topics: topics.join(','),
      engagement_type: 'newsletter',
    });
  },

  // Polls
  pollVote: (pollId: string, optionId: string, question: string) => {
    trackEvent('poll_vote', {
      poll_id: pollId,
      option_id: optionId,
      question,
      engagement_type: 'poll',
    });
  },

  // User stories
  storySubmission: (status: 'submitted' | 'approved' | 'rejected') => {
    trackEvent('story_submission', {
      submission_status: status,
      content_type: 'user_story',
    });
  },

  storyView: (storyId: string, featured: boolean) => {
    trackEvent('story_view', {
      story_id: storyId,
      is_featured: featured,
      content_type: 'user_story',
    });
  },

  // Articles
  articleView: (articleId: string, category: string, source?: string) => {
    trackEvent('article_view', {
      article_id: articleId,
      category,
      source: source || 'cararth',
      content_type: 'article',
    });
  },

  articleShare: (articleId: string, platform: string) => {
    trackEvent('share', {
      method: platform,
      content_type: 'article',
      item_id: articleId,
    });
  },

  // Search & Discovery
  search: (searchTerm: string, resultCount?: number) => {
    trackEvent('search', {
      search_term: searchTerm,
      result_count: resultCount,
    });
  },

  carListingView: (carId: string, make: string, model: string, price?: number) => {
    trackEvent('view_item', {
      item_id: carId,
      item_name: `${make} ${model}`,
      item_category: 'car_listing',
      price,
    });
  },

  sellerContact: (carId: string, contactMethod: 'whatsapp' | 'email') => {
    trackEvent('generate_lead', {
      car_id: carId,
      method: contactMethod,
      currency: 'INR',
    });
  },

  // Dashboard & Analytics
  dashboardView: (dashboardType: 'dealer' | 'oem' | 'market_intelligence') => {
    trackEvent('dashboard_view', {
      dashboard_type: dashboardType,
    });
  },

  // Social sharing
  socialShare: (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp', contentType: string) => {
    trackEvent('share', {
      method: platform,
      content_type: contentType,
    });
  },

  // Engagement metrics
  timeOnPage: (pagePath: string, secondsSpent: number) => {
    trackEvent('engagement_time', {
      page_path: pagePath,
      engagement_time_msec: secondsSpent * 1000,
    });
  },

  scrollDepth: (depth: number) => {
    trackEvent('scroll', {
      percent_scrolled: depth,
    });
  },
};

// Initialize GA4
export function initGA4(measurementId: string) {
  if (typeof window === 'undefined') return;

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We'll send manually
  });

  if (import.meta.env.DEV) {
    console.log('📊 GA4 initialized with ID:', measurementId);
  }
}

// Type declarations
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
