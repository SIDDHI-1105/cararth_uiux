import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, PenTool } from "lucide-react";
import TopicExplorer from "./TopicExplorer";
import CreateArticle from "./CreateArticle";

export default function ContentStrategy() {
  const [activeSubTab, setActiveSubTab] = useState("discover");

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-100 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Content Strategy Hub
          </CardTitle>
          <CardDescription>
            Discover winning topics, then create SEO-optimized content with one-click generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-1">
              <TabsTrigger 
                value="discover"
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md"
                data-testid="tab-discover-topics"
              >
                <Compass className="h-4 w-4" />
                Discover Topics
              </TabsTrigger>
              <TabsTrigger 
                value="create"
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md"
                data-testid="tab-create-content"
              >
                <PenTool className="h-4 w-4" />
                Create Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4">
              <TopicExplorer />
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <CreateArticle />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
