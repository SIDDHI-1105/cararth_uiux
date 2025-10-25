import { useEffect, useRef } from "react";
import { trackPageView, GA4Events } from "@/lib/ga4";

// Track page views on route changes
export function usePageTracking(pathname: string) {
  const lastPath = useRef<string>('');

  useEffect(() => {
    if (pathname !== lastPath.current) {
      trackPageView(pathname);
      lastPath.current = pathname;
    }
  }, [pathname]);
}

// Track time spent on page
export function useTimeOnPage(pagePath: string) {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      if (timeSpent > 5) { // Only track if spent more than 5 seconds
        GA4Events.timeOnPage(pagePath, timeSpent);
      }
    };
  }, [pagePath]);
}

// Track scroll depth
export function useScrollTracking() {
  useEffect(() => {
    let maxScrollDepth = 0;
    const scrollDepths = [25, 50, 75, 90, 100];
    const trackedDepths = new Set<number>();

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;

        // Track milestone depths
        scrollDepths.forEach((depth) => {
          if (scrollPercent >= depth && !trackedDepths.has(depth)) {
            trackedDepths.add(depth);
            GA4Events.scrollDepth(depth);
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
}

export { GA4Events };
