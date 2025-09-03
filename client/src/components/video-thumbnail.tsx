import { useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoThumbnailProps {
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  duration?: string;
  autoPlay?: boolean;
  className?: string;
}

export default function VideoThumbnail({ 
  videoUrl, 
  thumbnailUrl, 
  title, 
  duration, 
  autoPlay = false,
  className = ""
}: VideoThumbnailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  if (isPlaying) {
    return (
      <div className={`relative ${className}`}>
        <video
          src={videoUrl}
          controls
          autoPlay={autoPlay}
          muted={isMuted}
          className="w-full h-full object-cover rounded-lg"
          data-testid="video-player"
        />
        
        {/* Mute/Unmute Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
          data-testid="button-mute-toggle"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`relative group cursor-pointer overflow-hidden rounded-lg ${className}`}
      onClick={handlePlay}
      data-testid="video-thumbnail"
    >
      {/* Thumbnail Image */}
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        data-testid="thumbnail-image"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300" />
      
      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 rounded-full p-4 group-hover:bg-white group-hover:scale-110 transition-all duration-300 animate-pulse-glow">
          <Play className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" />
        </div>
      </div>
      
      {/* Duration Badge */}
      {duration && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {duration}
        </div>
      )}
      
      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <h3 className="text-white font-semibold text-sm line-clamp-2">{title}</h3>
      </div>
    </div>
  );
}