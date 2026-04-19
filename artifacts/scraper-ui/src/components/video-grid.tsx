import { VideoResult } from "@/lib/api";
import { Play, Download, ExternalLink, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoGridProps {
  videos: VideoResult[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <div 
          key={video.videoId} 
          className="flex flex-col group overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all hover:shadow-md"
        >
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img 
              src={video.thumb} 
              alt={video.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <a 
                href={video.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-12 w-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all hover:bg-primary"
              >
                <Play className="h-5 w-5 ml-1" />
              </a>
            </div>
          </div>
          
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-semibold line-clamp-2 text-sm mb-2 group-hover:text-primary transition-colors">
              {video.title}
            </h3>
            
            <div className="mt-auto pt-4 space-y-3">
              {video.streamUrls ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="secondary" size="sm" className="w-full text-xs">
                    <a href={video.streamUrls.best} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3 w-3 mr-1.5" /> Best
                    </a>
                  </Button>
                  <Button asChild variant="secondary" size="sm" className="w-full text-xs">
                    <a href={video.streamUrls.medium} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3 w-3 mr-1.5" /> Medium
                    </a>
                  </Button>
                </div>
              ) : null}
              
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-4 w-4 mr-2 text-red-500" /> Watch on YouTube
                </a>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
