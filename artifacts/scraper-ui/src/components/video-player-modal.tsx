import { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Youtube, AlertCircle } from "lucide-react";
import { VideoResult, proxyStreamUrl } from "@/lib/api";

interface VideoPlayerModalProps {
  video: VideoResult | null;
  open: boolean;
  onClose: () => void;
}

function isHlsUrl(url: string): boolean {
  return url.includes(".m3u8") || url.includes("hls_playlist");
}

export function VideoPlayerModal({ video, open, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [quality, setQuality] = useState<"best" | "medium">("best");
  const [error, setError] = useState(false);

  const rawStreamUrl =
    video?.streamUrls
      ? quality === "best"
        ? video.streamUrls.best
        : video.streamUrls.medium
      : null;

  const streamUrl = rawStreamUrl ? proxyStreamUrl(rawStreamUrl) : null;

  // Attach / detach HLS.js whenever the stream URL changes or modal closes
  useEffect(() => {
    const videoEl = videoRef.current;

    // Tear down any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!open || !streamUrl || !videoEl) return;

    setError(false);

    if (isHlsUrl(streamUrl)) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: false });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoEl.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            if (quality === "best") {
              setQuality("medium");
            } else {
              setError(true);
            }
          }
        });
      } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari: native HLS support
        videoEl.src = streamUrl;
        videoEl.play().catch(() => {});
      } else {
        setError(true);
      }
    } else {
      // Direct MP4 progressive stream
      videoEl.src = streamUrl;
      videoEl.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoEl) {
        videoEl.pause();
        videoEl.src = "";
      }
    };
  }, [open, streamUrl, quality]);

  const handleVideoError = () => {
    if (quality === "best") {
      setQuality("medium");
    } else {
      setError(true);
    }
  };

  const switchQuality = (q: "best" | "medium") => {
    setQuality(q);
    setError(false);
  };

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-black border-border">
        <DialogTitle className="sr-only">{video.title}</DialogTitle>

        <div className="relative w-full aspect-video bg-black">
          {!error ? (
            <video
              ref={videoRef}
              controls
              className="w-full h-full"
              onError={handleVideoError}
              controlsList="nodownload"
              playsInline
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
                Stream unavailable or expired. Open on YouTube to watch.
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
                  onClick={() => switchQuality("best")}
                  className="text-xs"
                >
                  Best Quality
                </Button>
                <Button
                  variant={quality === "medium" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => switchQuality("medium")}
                  className="text-xs"
                >
                  Lower Quality
                </Button>
                {streamUrl && (
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <a href={streamUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-3 w-3 mr-1" /> Download
                    </a>
                  </Button>
                )}
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
