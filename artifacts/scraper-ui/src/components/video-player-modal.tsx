import { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Youtube, AlertCircle } from "lucide-react";
import { VideoResult, proxyStreamUrl } from "@/lib/api";

interface VideoPlayerModalProps {
  video: VideoResult | null;
  open: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ video, open, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [quality, setQuality] = useState<"best" | "medium">("best");
  const [error, setError] = useState(false);

  const rawStreamUrl =
    video?.streamUrls
      ? quality === "best"
        ? video.streamUrls.best
        : video.streamUrls.medium
      : null;

  // Proxy through the api-server so the request comes from the same IP
  // that yt-dlp used (CDN URLs are IP-locked and can't be used by the browser directly)
  const streamUrl = rawStreamUrl ? proxyStreamUrl(rawStreamUrl) : null;

  useEffect(() => {
    if (!open) {
      setError(false);
      setQuality("best");
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    }
  }, [open]);

  const handleError = () => {
    if (quality === "best") {
      setQuality("medium");
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-black border-border">
        <DialogTitle className="sr-only">{video.title}</DialogTitle>

        <div className="relative w-full aspect-video bg-black">
          {streamUrl && !error ? (
            <video
              ref={videoRef}
              key={streamUrl}
              src={streamUrl}
              controls
              autoPlay
              className="w-full h-full"
              onError={handleError}
              controlsList="nodownload"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 px-6 text-center">
              <img
                src={video.thumb}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
              <AlertCircle className="h-10 w-10 text-destructive relative z-10" />
              <p className="relative z-10 text-sm text-white/80">
                CDN stream unavailable or expired. Open on YouTube to watch.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-card">
          <h3 className="font-semibold text-sm line-clamp-2 mb-3">{video.title}</h3>

          <div className="flex flex-wrap gap-2">
            {video.streamUrls && (
              <>
                <Button
                  variant={quality === "best" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => { setQuality("best"); setError(false); }}
                  className="text-xs"
                >
                  HD (Best)
                </Button>
                <Button
                  variant={quality === "medium" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => { setQuality("medium"); setError(false); }}
                  className="text-xs"
                >
                  SD (Medium)
                </Button>
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <a href={streamUrl ?? video.streamUrls.best} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-3 w-3 mr-1" /> Download
                  </a>
                </Button>
              </>
            )}
            <Button asChild variant="outline" size="sm" className="text-xs ml-auto">
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                <Youtube className="h-3 w-3 mr-1 text-red-500" /> YouTube
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
