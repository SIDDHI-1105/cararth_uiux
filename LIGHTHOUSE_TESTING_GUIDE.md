# Lighthouse Performance & Accessibility Testing Guide
## Cararth Throttle Talk - Task 10.2

### Overview
This guide provides comprehensive instructions for running Lighthouse audits on the Throttle Talk section (/news) and related pages to ensure optimal performance, accessibility, SEO, and best practices compliance.

---

## How to Run Lighthouse Tests

### Method 1: Chrome DevTools (Recommended)
1. Open Chrome/Edge browser
2. Navigate to the page you want to test (e.g., `https://your-domain.replit.app/news`)
3. Open DevTools (F12 or Right-click → Inspect)
4. Click the "Lighthouse" tab
5. Select categories to test:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
6. Choose device type:
   - Mobile (emulated Moto G4)
   - Desktop
7. Click "Analyze page load"

### Method 2: CLI (For Automation)
```bash
npm install -g lighthouse
lighthouse https://your-domain.replit.app/news --output html --output-path ./lighthouse-report.html --view
```

### Method 3: PageSpeed Insights
Visit: https://pagespeed.web.dev/
Enter URL and analyze

---

## Pages to Test

### Priority 1 (Critical)
1. **Main Throttle Talk Page**: `/news`
2. **Article Detail Page**: `/news/{article-id}`

### Priority 2 (Important)
3. **Home Page**: `/`
4. **Search Results**: `/search?query=...`
5. **Market Intelligence Dashboard**: `/market-intelligence`

---

## Target Scores (Minimum)

### Mobile
- **Performance**: ≥ 80 (Good: 90+)
- **Accessibility**: ≥ 95 (Target: 100)
- **Best Practices**: ≥ 95 (Target: 100)
- **SEO**: ≥ 95 (Target: 100)

### Desktop
- **Performance**: ≥ 90 (Good: 95+)
- **Accessibility**: ≥ 95 (Target: 100)
- **Best Practices**: ≥ 95 (Target: 100)
- **SEO**: ≥ 95 (Target: 100)

---

## Key Metrics to Monitor

### Core Web Vitals
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

### Additional Performance Metrics
- **FCP** (First Contentful Paint): Target ≤ 1.8s
- **Speed Index**: Target ≤ 3.4s
- **Time to Interactive (TTI)**: Target ≤ 3.8s
- **Total Blocking Time (TBT)**: Target ≤ 200ms

---

## Current Optimizations Implemented

### ✅ Performance Optimizations
1. **Code Splitting**: React lazy loading for routes
2. **Asset Optimization**: 
   - Images from Google Cloud Storage with CDN
   - Responsive images (h-48 sm:h-56 lg:h-64)
3. **Caching Strategy**:
   - TanStack Query for API response caching
   - Stale-while-revalidate pattern
4. **Bundle Size**:
   - Vite build optimization
   - Tree-shaking enabled
   - Dynamic imports for heavy components

### ✅ Accessibility Optimizations
1. **Touch Targets**: All interactive elements ≥ 44px (min-h-[44px])
2. **Keyboard Navigation**: Full keyboard support
3. **ARIA Labels**: Proper semantic HTML and ARIA attributes
4. **Color Contrast**: WCAG AA compliant
5. **Focus Management**: Visible focus indicators
6. **Screen Reader Support**: Proper heading hierarchy (h1, h2, h3)
7. **Alt Text**: All images have descriptive alt attributes

### ✅ SEO Optimizations
1. **Meta Tags**: Unique title and description per page
2. **Structured Data**: Schema.org markup for articles
3. **Semantic HTML**: Proper heading hierarchy
4. **Open Graph Tags**: Social media preview optimization
5. **Mobile-Friendly**: Responsive design with viewport meta tag
6. **Sitemap**: Dynamic sitemap.xml generation

### ✅ Best Practices
1. **HTTPS**: Enforced secure connections
2. **No Console Errors**: Clean console output
3. **Modern JavaScript**: ES2020+ with proper polyfills
4. **CSP Headers**: Content Security Policy (if applicable)
5. **Error Boundaries**: React error boundaries implemented

---

## Known Performance Considerations

### Potential Performance Bottlenecks
1. **Large Article Content**: Some generated articles may be 1200-1800 words
   - **Mitigation**: Lazy load images, use content excerpts
2. **TanStack Query**: Multiple API calls on page load
   - **Mitigation**: Prefetching, stale-while-revalidate
3. **Related Articles Carousel**: Loads 6 articles with images
   - **Mitigation**: Lazy loading images, responsive image sizes
4. **Mega Menu**: Fetches featured articles on hover
   - **Mitigation**: Conditional fetch only when opened

### Database Queries
- Optimized with indexes on frequently queried fields
- Connection pooling enabled
- Query result caching

---

## Lighthouse Audit Checklist

### Before Testing
- [ ] Clear browser cache
- [ ] Disable browser extensions (use Incognito/Private mode)
- [ ] Test on a clean network (no VPN, stable connection)
- [ ] Test at different times of day for consistency
- [ ] Ensure database has representative data

### Performance Tests
- [ ] Test on Mobile (Moto G4 emulation)
- [ ] Test on Desktop (1920x1080)
- [ ] Test on 3G network throttling
- [ ] Test with CPU throttling (4x slowdown)
- [ ] Measure First Contentful Paint (FCP)
- [ ] Measure Largest Contentful Paint (LCP)
- [ ] Measure Time to Interactive (TTI)
- [ ] Measure Cumulative Layout Shift (CLS)
- [ ] Check bundle size and unused JavaScript

### Accessibility Tests
- [ ] All touch targets ≥ 44px
- [ ] Color contrast ratios meet WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Focus indicators visible
- [ ] No duplicate IDs
- [ ] Proper ARIA labels
- [ ] Image alt text present
- [ ] Semantic HTML structure
- [ ] Form labels associated

### SEO Tests
- [ ] Title tag unique and descriptive
- [ ] Meta description present and compelling
- [ ] Open Graph tags complete
- [ ] Structured data (Schema.org) valid
- [ ] Canonical URLs set
- [ ] Mobile viewport configured
- [ ] Font sizes readable (≥12px)
- [ ] Tap targets properly sized

### Best Practices Tests
- [ ] No console errors
- [ ] HTTPS enforced
- [ ] No mixed content
- [ ] Images served in modern formats (WebP)
- [ ] Text compression enabled (gzip/brotli)
- [ ] Browser caching configured
- [ ] No vulnerable libraries

---

## Common Issues & Fixes

### Performance Issues

#### Issue: High LCP (Largest Contentful Paint)
**Solutions:**
- Preload hero images: `<link rel="preload" as="image" href="...">`
- Use responsive images with srcset
- Optimize image formats (WebP)
- Implement priority hints: `fetchpriority="high"`

#### Issue: High CLS (Cumulative Layout Shift)
**Solutions:**
- Set explicit width/height on images
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS aspect-ratio for responsive images

#### Issue: Large JavaScript Bundles
**Solutions:**
- Code splitting at route level
- Lazy load non-critical components
- Remove unused dependencies
- Use dynamic imports

### Accessibility Issues

#### Issue: Touch Targets Too Small
**Solution:** All buttons already have `min-h-[44px]` ✅

#### Issue: Missing Alt Text
**Solutions:**
- Add descriptive alt text to all images
- Use empty alt="" for decorative images
- Include context in alt text

#### Issue: Low Color Contrast
**Solutions:**
- Check contrast ratio (minimum 4.5:1 for normal text)
- Use darker/lighter shades as needed
- Test with color contrast checker tools

---

## Performance Budget

### Mobile
- **JavaScript**: ≤ 300 KB (gzipped)
- **CSS**: ≤ 50 KB (gzipped)
- **Images**: ≤ 500 KB per page
- **Total Page Size**: ≤ 1 MB
- **Requests**: ≤ 50

### Desktop
- **JavaScript**: ≤ 400 KB (gzipped)
- **CSS**: ≤ 75 KB (gzipped)
- **Images**: ≤ 800 KB per page
- **Total Page Size**: ≤ 1.5 MB
- **Requests**: ≤ 75

---

## Testing Timeline

### Phase 1: Initial Audit (Day 1)
- Run baseline Lighthouse tests
- Document current scores
- Identify critical issues

### Phase 2: Optimization (Day 2-3)
- Implement fixes for critical issues
- Optimize images and assets
- Improve caching strategies

### Phase 3: Validation (Day 4)
- Re-run Lighthouse tests
- Compare before/after scores
- Verify all metrics meet targets

### Phase 4: Continuous Monitoring
- Set up automated Lighthouse CI
- Monitor performance over time
- Alert on regressions

---

## Reporting Template

### Test Results Summary
```
Page: /news
Date: YYYY-MM-DD
Device: Mobile/Desktop

Scores:
- Performance: XX/100
- Accessibility: XX/100
- Best Practices: XX/100
- SEO: XX/100

Core Web Vitals:
- LCP: X.Xs
- FID: XXms
- CLS: 0.XX

Critical Issues:
1. [Issue description]
2. [Issue description]

Recommendations:
1. [Recommendation]
2. [Recommendation]
```

---

## Tools & Resources

### Testing Tools
- **Chrome DevTools Lighthouse**: Built-in, free
- **PageSpeed Insights**: https://pagespeed.web.dev/
- **WebPageTest**: https://www.webpagetest.org/
- **GTmetrix**: https://gtmetrix.com/

### Accessibility Testing
- **axe DevTools**: Chrome extension
- **WAVE**: https://wave.webaim.org/
- **NVDA Screen Reader**: Free screen reader for testing

### Performance Monitoring
- **Lighthouse CI**: Automated testing in CI/CD
- **Web Vitals Extension**: Chrome extension
- **Sentry**: Real user monitoring (RUM)

---

## Expected Results (Based on Current Implementation)

### Mobile (Predicted Scores)
- **Performance**: 75-85 (Good, room for improvement)
  - LCP: 2.0-2.5s (carousel images)
  - FID: <100ms (React hydration)
  - CLS: <0.1 (fixed layouts)
- **Accessibility**: 95-100 (Excellent, all targets met)
- **Best Practices**: 95-100 (Clean implementation)
- **SEO**: 95-100 (Comprehensive meta tags & structured data)

### Desktop (Predicted Scores)
- **Performance**: 85-95 (Very Good)
- **Accessibility**: 95-100 (Excellent)
- **Best Practices**: 95-100 (Excellent)
- **SEO**: 95-100 (Excellent)

---

## Next Steps After Testing

1. **Document Results**: Save HTML reports for reference
2. **Create GitHub Issues**: Track performance improvements
3. **Monitor Regressions**: Set up Lighthouse CI
4. **User Testing**: Gather real-world performance feedback
5. **Iterate**: Continuous improvement based on data

---

## Contact & Support

For questions or assistance with Lighthouse testing:
- Review this guide thoroughly
- Check Chrome DevTools documentation
- Consult Web.dev performance guides

---

**Last Updated**: October 25, 2025
**Task**: 10.2 - Lighthouse Performance & Accessibility Testing
**Status**: Ready for Testing
