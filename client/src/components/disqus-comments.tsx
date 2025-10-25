import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface DisqusCommentsProps {
  articleId: string;
  articleTitle: string;
  articleUrl?: string;
}

export function DisqusComments({ articleId, articleTitle, articleUrl }: DisqusCommentsProps) {
  const disqusShortname = import.meta.env.VITE_DISQUS_SHORTNAME || "cararth";

  useEffect(() => {
    // Reset Disqus if already loaded
    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = articleId;
          this.page.url = articleUrl || window.location.href;
          this.page.title = articleTitle;
        },
      });
    } else {
      // Load Disqus for the first time
      window.disqus_config = function (this: any) {
        this.page.url = articleUrl || window.location.href;
        this.page.identifier = articleId;
        this.page.title = articleTitle;
      };

      const script = document.createElement("script");
      script.src = `https://${disqusShortname}.disqus.com/embed.js`;
      script.setAttribute("data-timestamp", String(+new Date()));
      document.body.appendChild(script);
    }
  }, [articleId, articleTitle, articleUrl, disqusShortname]);

  return (
    <Card className="mt-8" data-testid="disqus-comments">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Comments & Discussion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div id="disqus_thread" className="min-h-[200px]">
          <noscript>
            Please enable JavaScript to view the{" "}
            <a href="https://disqus.com/?ref_noscript">
              comments powered by Disqus.
            </a>
          </noscript>
        </div>
      </CardContent>
    </Card>
  );
}

// Type declaration for Disqus global
declare global {
  interface Window {
    DISQUS?: any;
    disqus_config?: any;
  }
}
