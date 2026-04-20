import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Code, Terminal, Image as ImageIcon, Film, Zap, Shield, ArrowLeft } from "lucide-react";
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
  badge: "images" | "videos";
  summary: string;
  description: string;
  params: Param[];
  responseExample: string;
  note?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/image",
    badge: "images",
    summary: "Search Images",
    description:
      "Search Yandex Images and receive clean JSON results. Each item includes a direct CDN image URL, pixel dimensions, source domain, and page title.",
    params: [
      {
        name: "text",
        type: "string",
        required: true,
        description: "Search query — e.g. \"mountain landscape\" or \"cute cats\"",
      },
      {
        name: "count",
        type: "number",
        required: false,
        default: "30",
        description: "How many images to return. Maximum: 300.",
      },
      {
        name: "page",
        type: "number",
        required: false,
        default: "0",
        description: "Result page offset (0-indexed). Use to paginate through results.",
      },
    ],
    responseExample: `{
  "provider": "CASPER TECH DEVS",
  "creator": "TRABY CASPER",
  "query": "mountain landscape",
  "page": 0,
  "count": 3,
  "images": [
    {
      "title": "Mountain Sunrise",
      "url": "https://cdn.example.com/mountain.jpg",
      "width": 1920,
      "height": 1080,
      "domain": "example.com",
      "sourceUrl": "https://example.com/gallery/mountain"
    },
    {
      "title": "Rocky Peak at Dawn",
      "url": "https://cdn2.example.com/peak.jpg",
      "width": 1280,
      "height": 854,
      "domain": "example2.com",
      "sourceUrl": "https://example2.com/photos/rocky-peak"
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/video",
    badge: "videos",
    summary: "Search Videos",
    description:
      "Search Yandex Video and receive clean JSON results. Each item includes a title, thumbnail, video page URL, and preview link. For YouTube results the response also includes resolved stream URLs for direct playback.",
    params: [
      {
        name: "text",
        type: "string",
        required: true,
        description: "Search query — e.g. \"nature documentary\" or \"lo-fi music\"",
      },
      {
        name: "count",
        type: "number",
        required: false,
        default: "17",
        description: "How many videos to return. Maximum: 200.",
      },
      {
        name: "page",
        type: "number",
        required: false,
        default: "0",
        description: "Result page offset (0-indexed). Use to paginate through results.",
      },
    ],
    responseExample: `{
  "provider": "CASPER TECH DEVS",
  "creator": "TRABY CASPER",
  "query": "nature documentary",
  "page": 0,
  "count": 2,
  "videos": [
    {
      "videoId": "abc123",
      "title": "Amazing Nature — Planet Earth",
      "url": "https://www.youtube.com/watch?v=abc123",
      "previewUrl": "https://yandex.com/video/preview/abc123",
      "thumb": "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
      "description": "A stunning journey through the world's wildest places.",
      "width": 1280,
      "height": 720
    },
    {
      "videoId": "xyz789",
      "title": "Ocean Life — Blue Planet",
      "url": "https://www.youtube.com/watch?v=xyz789",
      "previewUrl": "https://yandex.com/video/preview/xyz789",
      "thumb": "https://i.ytimg.com/vi/xyz789/hqdefault.jpg",
      "description": "Dive into the deep blue ocean.",
      "width": 1920,
      "height": 1080
    }
  ]
}`,
    note: "Video requests may take up to 30 seconds — results are fetched live through rotating proxies.",
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
  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "/api/v1";

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

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-primary">API Reference</h1>
              <p className="text-sm text-muted-foreground">CASPER TECH DEVS — Image & Video Search API · v1</p>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-card border border-border/40 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-semibold">Base URL</span>
              </div>
              <code className="text-xs text-primary/80 font-mono break-all">{baseUrl}</code>
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
                <span className="text-sm font-semibold">Response Format</span>
              </div>
              <span className="text-xs text-muted-foreground">JSON · UTF-8</span>
            </div>
          </div>
        </div>

        {/* Endpoint index */}
        <div className="bg-card border border-border/40 rounded-xl p-5 mb-10">
          <h2 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">Endpoints</h2>
          <div className="space-y-2">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className="flex items-center gap-3">
                <MethodBadge method={ep.method} />
                <code className="text-sm font-mono text-primary/90">{ep.path}</code>
                <span className="text-sm text-muted-foreground hidden sm:block">— {ep.summary}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-10 opacity-20" />

        {/* Endpoint cards */}
        <div className="space-y-10">
          {ENDPOINTS.map((ep) => (
            <Card key={ep.path} className="bg-card border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <MethodBadge method={ep.method} />
                    <code className="text-sm font-mono text-foreground/90">{ep.path}</code>
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    {ep.badge === "images" && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <ImageIcon className="h-3 w-3" /> Images
                      </Badge>
                    )}
                    {ep.badge === "videos" && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Film className="h-3 w-3" /> Videos
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <h3 className="text-base font-semibold mt-1">{ep.summary}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ep.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Parameters */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Query Parameters
                  </h4>
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

                {/* Note */}
                {ep.note && (
                  <div className="flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                    <span className="text-yellow-400 text-xs mt-0.5">⚠</span>
                    <p className="text-xs text-yellow-200/70">{ep.note}</p>
                  </div>
                )}

                {/* Example response */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Example Response
                  </h4>
                  <CodeBlock code={ep.responseExample} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-10 opacity-20" />

        {/* Quick start */}
        <div className="bg-card border border-border/40 rounded-xl p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" /> Quick Start
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Search images:</p>
              <CodeBlock
                code={`fetch('${baseUrl}/image?text=sunset&count=20')
  .then(r => r.json())
  .then(data => {
    data.images.forEach(img => {
      console.log(img.url, img.width, img.height);
    });
  });`}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Search videos:</p>
              <CodeBlock
                code={`fetch('${baseUrl}/video?text=nature+documentary&count=5')
  .then(r => r.json())
  .then(data => {
    data.videos.forEach(video => {
      console.log(video.title, video.url, video.thumb);
    });
  });`}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Paginate through results:</p>
              <CodeBlock
                code={`// Page 0 → first 30, page 1 → next 30, etc.
fetch('${baseUrl}/image?text=cars&count=30&page=1')
  .then(r => r.json())
  .then(data => console.log(\`Got \${data.count} images\`));`}
              />
            </div>
          </div>
        </div>

        {/* Errors */}
        <div className="mt-8 bg-card border border-border/40 rounded-xl p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-400" /> Error Responses
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <Badge className="bg-red-500/15 text-red-400 border-red-500/25 font-mono text-xs shrink-0">400</Badge>
              <div>
                <p className="text-sm font-medium">Bad Request</p>
                <p className="text-xs text-muted-foreground">The <code className="font-mono">text</code> parameter is missing or empty.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <Badge className="bg-red-500/15 text-red-400 border-red-500/25 font-mono text-xs shrink-0">500</Badge>
              <div>
                <p className="text-sm font-medium">Server Error</p>
                <p className="text-xs text-muted-foreground">All proxies failed or Yandex blocked the request. Try again after a few seconds.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground/50">
          CASPER TECH DEVS API v1 — built with Node.js, Express & Yandex scraping
        </div>
      </div>

      <Footer />
    </div>
  );
}
