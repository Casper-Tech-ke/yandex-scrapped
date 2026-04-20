import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Code, Terminal, Image as ImageIcon, Film, Zap, Shield, RefreshCw, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";
import { NavDropdown } from "@/components/nav-dropdown";

interface Param {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: Param[];
  responseExample?: string;
  note?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/scrape/images",
    description: "Scrape image search results from Yandex Images. Returns direct CDN URLs, dimensions, source domain, and page title for each image.",
    params: [
      { name: "text", type: "string", required: true, description: "Search query term(s)" },
      { name: "count", type: "number", required: false, default: "30", description: "Number of images to return (max 300)" },
      { name: "page", type: "number", required: false, default: "0", description: "Result page offset (0-indexed)" },
    ],
    responseExample: `{
  "query": "mountain landscape",
  "page": 0,
  "count": 30,
  "images": [
    {
      "title": "Mountain sunrise photo",
      "url": "https://cdn.example.com/photo.jpg",
      "width": 1920,
      "height": 1080,
      "domain": "example.com",
      "sourceUrl": "https://example.com/gallery"
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/scrape/videos",
    description: "Scrape video results from Yandex Video search. For YouTube videos, stream URLs (combined audio+video) are resolved via yt-dlp and returned ready to play.",
    params: [
      { name: "text", type: "string", required: true, description: "Search query term(s)" },
      { name: "count", type: "number", required: false, default: "17", description: "Number of videos to return (max 200)" },
      { name: "page", type: "number", required: false, default: "0", description: "Result page offset (0-indexed)" },
    ],
    responseExample: `{
  "query": "nature documentary",
  "page": 0,
  "count": 5,
  "videos": [
    {
      "videoId": "abc123",
      "title": "Amazing Nature",
      "url": "https://www.youtube.com/watch?v=abc123",
      "previewUrl": "https://yandex.com/video/preview/abc123",
      "thumb": "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
      "description": "...",
      "width": 1280,
      "height": 720,
      "streamUrls": {
        "best": "https://rr1---sn-...googlevideo.com/videoplayback?itag=22...",
        "medium": "https://rr1---sn-...googlevideo.com/videoplayback?itag=18..."
      }
    }
  ]
}`,
    note: "Video requests take up to 30 seconds because stream URLs are resolved live. streamUrls may be null for non-YouTube videos.",
  },
  {
    method: "GET",
    path: "/api/stream",
    description: "Proxy a YouTube CDN video stream through the server. CDN URLs are IP-locked to the machine that ran yt-dlp, so the browser cannot fetch them directly. This endpoint fetches from the server's IP and pipes the byte stream to the client, including Range header support for seeking.",
    params: [
      { name: "url", type: "string (URL-encoded)", required: true, description: "The full CDN URL from a streamUrls field (must be URL-encoded)" },
    ],
    responseExample: `HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: 45234567
Accept-Ranges: bytes
Access-Control-Allow-Origin: *

[binary video data]`,
    note: "Only googlevideo.com, youtube.com, ytimg.com, and yt3.ggpht.com hosts are allowed.",
  },
  {
    method: "GET",
    path: "/api/scrape/resolve",
    description: "Resolve a YouTube video URL or ID directly to its stream formats and metadata. Returns all available formats with codec, resolution, and CDN URL details.",
    params: [
      { name: "url", type: "string", required: true, description: "Full YouTube URL (e.g. https://www.youtube.com/watch?v=ID) or bare video ID" },
    ],
    responseExample: `{
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "duration": 212,
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/...",
  "streamUrls": { "best": "...", "medium": "..." },
  "formats": [
    {
      "formatId": "22",
      "quality": "hd720",
      "ext": "mp4",
      "type": "video+audio",
      "vcodec": "avc1.64001F",
      "acodec": "mp4a.40.2",
      "width": 1280,
      "height": 720,
      "fps": 30,
      "filesize": null,
      "url": "https://rr...googlevideo.com/..."
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/scrape/proxies",
    description: "Returns current proxy pool statistics — how many proxies are loaded, how many are healthy, and their origin sources.",
    responseExample: `{
  "total": 43,
  "healthy": 27,
  "dead": 16,
  "sources": ["free-proxy-list.net", "proxyscrape.com"]
}`,
  },
  {
    method: "POST",
    path: "/api/scrape/proxies/refresh",
    description: "Triggers a fresh proxy pool refresh — re-fetches proxy lists from all sources and re-tests them. Useful when the pool is depleted or many proxies have gone dead.",
    responseExample: `{
  "success": true,
  "stats": { "total": 52, "healthy": 31 }
}`,
  },
];

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <Badge
      className={
        method === "GET"
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-xs"
          : "bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono text-xs"
      }
    >
      {method}
    </Badge>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-black/60 border border-border/40 rounded-lg p-4 text-xs font-mono text-green-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
      {code}
    </pre>
  );
}

export default function ApiDocs() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <NavDropdown />

          <button
            onClick={() => navigate("/")}
            className="flex flex-col items-start shrink-0 hover:opacity-80 transition-opacity"
          >
            <span className="text-xl font-black tracking-tight text-primary leading-none">
              CASPER TECH DEVS
            </span>
            <span className="text-xs text-muted-foreground font-medium mt-0.5">
              Image & Video Scraper
            </span>
          </button>
          <div className="flex-grow" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </Button>
        </div>
      </header>

      <div className="flex-grow container mx-auto px-4 py-10 max-w-4xl">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-primary">API Documentation</h1>
              <p className="text-sm text-muted-foreground">CASPER TECH DEVS — Image & Video Scraper API</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-card border border-border/40 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-semibold">Base URL</span>
              </div>
              <code className="text-xs text-muted-foreground font-mono">/api</code>
            </div>
            <div className="bg-card border border-border/40 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm font-semibold">Auth</span>
              </div>
              <span className="text-xs text-muted-foreground">None required</span>
            </div>
            <div className="bg-card border border-border/40 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold">Format</span>
              </div>
              <span className="text-xs text-muted-foreground">JSON responses</span>
            </div>
          </div>
        </div>

        <Separator className="mb-10 opacity-20" />

        <div className="space-y-8">
          {ENDPOINTS.map((ep) => (
            <Card key={ep.path} className="bg-card border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <MethodBadge method={ep.method} />
                    <code className="text-sm font-mono text-foreground/90">{ep.path}</code>
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    {ep.path.includes("images") && <Badge variant="outline" className="text-xs gap-1"><ImageIcon className="h-3 w-3" /> Images</Badge>}
                    {ep.path.includes("video") && <Badge variant="outline" className="text-xs gap-1"><Film className="h-3 w-3" /> Videos</Badge>}
                    {ep.path.includes("stream") && <Badge variant="outline" className="text-xs gap-1"><Zap className="h-3 w-3" /> Stream</Badge>}
                    {ep.path.includes("proxies/refresh") && <Badge variant="outline" className="text-xs gap-1"><RefreshCw className="h-3 w-3" /> Proxy</Badge>}
                  </div>
                </CardTitle>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{ep.description}</p>
              </CardHeader>

              <CardContent className="space-y-5">
                {ep.params && ep.params.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground w-28">Name</th>
                            <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground w-20">Type</th>
                            <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground w-20">Required</th>
                            <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground w-16">Default</th>
                            <th className="text-left py-2 text-xs font-medium text-muted-foreground">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((p) => (
                            <tr key={p.name} className="border-b border-border/20 last:border-0">
                              <td className="py-2 pr-4">
                                <code className="text-xs font-mono text-primary/90">{p.name}</code>
                              </td>
                              <td className="py-2 pr-4">
                                <code className="text-xs font-mono text-muted-foreground">{p.type}</code>
                              </td>
                              <td className="py-2 pr-4">
                                {p.required ? (
                                  <Badge className="text-xs bg-red-500/15 text-red-400 border-red-500/25">required</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">optional</Badge>
                                )}
                              </td>
                              <td className="py-2 pr-4 text-xs text-muted-foreground font-mono">
                                {p.default ?? "—"}
                              </td>
                              <td className="py-2 text-xs text-muted-foreground">{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {ep.note && (
                  <div className="flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                    <span className="text-yellow-400 text-xs mt-0.5">⚠</span>
                    <p className="text-xs text-yellow-200/70">{ep.note}</p>
                  </div>
                )}

                {ep.responseExample && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Example Response</h4>
                    <CodeBlock code={ep.responseExample} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-10 opacity-20" />

        <div className="bg-card border border-border/40 rounded-xl p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" /> Quick Start
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Search for images:</p>
              <CodeBlock code={`fetch('/api/scrape/images?text=sunset&count=20')\n  .then(r => r.json())\n  .then(data => console.log(data.images))`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Search for videos with playable streams:</p>
              <CodeBlock code={`fetch('/api/scrape/videos?text=nature&count=5')\n  .then(r => r.json())\n  .then(data => {\n    const video = data.videos[0];\n    // Pipe through /api/stream so the browser can play it\n    const src = \`/api/stream?url=\${encodeURIComponent(video.streamUrls.best)}\`;\n    document.querySelector('video').src = src;\n  })`} />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground/50">
          CASPER TECH DEVS API — built with Node.js, Express, yt-dlp & Yandex scraping
        </div>
      </div>

      <Footer />
    </div>
  );
}
