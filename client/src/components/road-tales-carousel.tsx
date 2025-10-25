import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin, Car } from "lucide-react";
import { useState } from "react";

interface Story {
  id: string;
  title: string;
  content: string;
  carBrand?: string;
  carModel?: string;
  city?: string;
  views: number;
  likes: number;
  createdAt: string;
}

export function RoadTalesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: storiesData, isLoading } = useQuery<{ success: boolean; stories: Story[] }>({
    queryKey: ['/api/stories/featured'],
  });

  const stories = storiesData?.stories || [];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stories || stories.length === 0) {
    return null; // Don't show carousel if no featured stories
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 md:p-8" data-testid="road-tales-carousel">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🛣️ Road Tales
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
            Real Stories from Car Owners
          </span>
        </h3>
        
        {stories.length > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="h-8 w-8"
              data-testid="button-prev-story"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="h-8 w-8"
              data-testid="button-next-story"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Card className="border-none shadow-lg bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {currentStory.title}
              </h4>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {currentStory.carBrand && (
                  <span className="flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    {currentStory.carBrand} {currentStory.carModel}
                  </span>
                )}
                {currentStory.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {currentStory.city}
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 line-clamp-4 leading-relaxed">
              {currentStory.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>👁️ {currentStory.views ?? 0} views</span>
                <span>❤️ {currentStory.likes ?? 0} likes</span>
              </div>
              
              {stories.length > 1 && (
                <div className="text-sm text-gray-500">
                  {currentIndex + 1} / {stories.length}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
