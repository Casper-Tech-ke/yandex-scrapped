import { useState } from "react";
import { VideoResult } from "@/lib/api";
import { Play, Download, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "@/components/video-player-modal";

interface VideoGridProps {
  videos: VideoResult[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  const [selected, setSelected] = useState<VideoResult | null>(null);

  return (
    <>
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
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <button
                  onClick={() => setSelected(video)}
                  aria-label={`Play ${video.title}`}
                  className="h-14 w-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <Play className="h-6 w-6 ml-1" fill="currentColor" />
                </button>
              </div>

              {video.streamUrls && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                  HD
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-semibold line-clamp-2 text-sm mb-3 group-hover:text-primary transition-colors">
                {video.title}
              </h3>

              <div className="mt-auto space-y-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelected(video)}
                >
                  <Play className="h-4 w-4 mr-2" fill="currentColor" />
                  {video.streamUrls ? "Play HD Stream" : "Play"}
                </Button>

                {video.streamUrls && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="secondary" size="sm" className="w-full text-xs">
                      <a href={video.streamUrls.best} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3 mr-1" /> Best
                      </a>
                    </Button>
                    <Button asChild variant="secondary" size="sm" className="w-full text-xs">
                      <a href={video.streamUrls.medium} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3 mr-1" /> Medium
                      </a>
                    </Button>
                  </div>
                )}

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

      <VideoPlayerModal
        video={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
