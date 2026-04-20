const BASE = "/api";

/**
 * Returns a browser-usable URL for the given stream URL.
 *
 * - googlevideo.com URLs are IP-locked to our server, so we route them
 *   through our server-side stream proxy which fetches from the same IP.
 * - All other URLs (CASPER proxy, etc.) are returned as-is because their
 *   CORS headers allow direct browser access.
 */
export function proxyStreamUrl(cdnUrl: string): string {
  if (
    cdnUrl.includes("googlevideo.com") ||
    cdnUrl.includes("youtube.com/videoplayback")
  ) {
    return `${BASE}/stream?url=${encodeURIComponent(cdnUrl)}`;
  }
  return cdnUrl;
}

export interface ImageResult {
  title: string;
  url: string;
  width: number | null;
  height: number | null;
  domain: string;
  sourceUrl: string;
}

export interface StreamUrls {
  best: string;
  medium: string;
}

export interface VideoResult {
  videoId: string;
  title: string;
  url: string;
  previewUrl: string;
  thumb: string;
  description: string;
  width: number | null;
  height: number | null;
  streamUrls: StreamUrls | null;
}

export interface ImageSearchResponse {
  provider: string;
  creator: string;
  query: string;
  page: number;
  count: number;
  images: ImageResult[];
}

export interface VideoSearchResponse {
  provider: string;
  creator: string;
  query: string;
  page: number;
  count: number;
  videos: VideoResult[];
}

export async function searchImages(
  text: string,
  count = 30,
  page = 0
): Promise<ImageSearchResponse> {
  const params = new URLSearchParams({ text, count: String(count), page: String(page) });
  const res = await fetch(`${BASE}/scrape/images?${params}`);
  if (!res.ok) throw new Error(`Image search failed: ${res.status}`);
  return res.json();
}

export async function searchVideos(
  text: string,
  count = 17,
  page = 0
): Promise<VideoSearchResponse> {
  const params = new URLSearchParams({ text, count: String(count), page: String(page) });
  const res = await fetch(`${BASE}/scrape/videos?${params}`);
  if (!res.ok) throw new Error(`Video search failed: ${res.status}`);
  return res.json();
}
