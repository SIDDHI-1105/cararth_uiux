// server/lib/renderShell.ts
// Server-side HTML shell generator for SEO-critical pages
// Injects meta tags and JSON-LD structured data before client JavaScript loads

interface MetaTags {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string;
}

interface RenderShellOptions {
  meta?: MetaTags;
  jsonLd?: any[];
  bodyHtml?: string;
  initialState?: Record<string, any>;
}

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildJsonLdScripts(jsonLdArray: any[] = []): string {
  return jsonLdArray
    .map((obj) => {
      try {
        return `<script type="application/ld+json">${JSON.stringify(obj, null, 2)}</script>`;
      } catch (e) {
        console.error('Failed to serialize JSON-LD:', e);
        return "";
      }
    })
    .join("\n    ");
}

export function renderShell(options: RenderShellOptions = {}): string {
  const { meta = {}, jsonLd = [], bodyHtml = "", initialState = {} } = options;
  
  const title = escapeHtml(meta.title || "CarArth — India's Very Own Used Car Search Engine");
  const description = escapeHtml(
    meta.description || "Find verified used cars from multiple platforms in one trusted place. No paid listings. AI-assisted price insights."
  );
  const canonical = escapeHtml(meta.canonical || "https://www.cararth.com/");
  const keywords = escapeHtml(
    meta.keywords || "used car search India, verified used cars, no paid listings, car syndication, AI price insights"
  );
  const jsonLdScripts = buildJsonLdScripts(jsonLd);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${keywords}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph tags for social sharing -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="website" />
    
    <!-- JSON-LD Structured Data -->
    ${jsonLdScripts}
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    
    <style>
      /* Minimal styles to prevent FOUC (Flash of Unstyled Content) */
      body {
        margin: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #fff;
        color: #111;
        line-height: 1.6;
      }
      #root {
        min-height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="root">${bodyHtml}</div>
    <script>
      // Pass initial state to client for hydration
      window.__CARARTH_INITIAL_STATE = ${JSON.stringify(initialState)};
    </script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}
