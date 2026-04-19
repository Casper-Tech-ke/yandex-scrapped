import { Router, type IRouter, type Request, type Response } from "express";
import * as cheerio from "cheerio";
import { proxyManager } from "../lib/proxyManager";

const router: IRouter = Router();

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export interface ImageResult {
  title: string;
  origUrl: string;
  thumb: string;
  width: number | null;
  height: number | null;
  domain: string;
  sourceUrl: string;
}

interface SerpEntity {
  image?: string;
  origUrl?: string;
  alt?: string;
  origWidth?: number;
  origHeight?: number;
  width?: number;
  height?: number;
  snippet?: { title?: string; domain?: string; url?: string };
  viewerData?: { preview?: Array<{ url?: string; w?: number; h?: number }> };
}

function absoluteUrl(url?: string): string {
  if (!url) return "";
  return url.startsWith("//") ? `https:${url}` : url;
}

function parseYandexHtml(html: string, debug?: string[]): ImageResult[] {
  const $ = cheerio.load(html);
  const results: ImageResult[] = [];
  const elems = $("[data-state]");

  debug?.push(`data-state elements: ${elems.length}`);

  elems.each((_i, el) => {
    if (results.length > 0) return;
    try {
      const raw = $(el).attr("data-state") || "";
      debug?.push(`elem ${_i} raw len: ${raw.length}`);

      const obj = JSON.parse(raw) as {
        initialState?: {
          serpList?: {
            items?: {
              keys?: string[];
              entities?: Record<string, SerpEntity>;
            };
          };
        };
      };

      const items = obj.initialState?.serpList?.items;
      if (!items?.keys || !items.entities) {
        debug?.push(`  no serpList.items`);
        return;
      }

      debug?.push(`  found ${items.keys.length} images`);

      for (const key of items.keys) {
        const e: SerpEntity = items.entities[key] || {};
        const origUrl =
          e.origUrl ||
          e.viewerData?.preview?.[0]?.url ||
          absoluteUrl(e.image);
        if (!origUrl) continue;

        results.push({
          title: e.snippet?.title || e.alt || "",
          origUrl: absoluteUrl(origUrl),
          thumb: absoluteUrl(e.image),
          width: e.origWidth || e.width || null,
          height: e.origHeight || e.height || null,
          domain: e.snippet?.domain || "",
          sourceUrl: e.snippet?.url || "",
        });
      }
    } catch (err) {
      debug?.push(`  parse error: ${(err as Error).message.slice(0, 60)}`);
    }
  });

  return results;
}

const PER_PAGE = 30;
const MAX_IMAGES = 300;
const MAX_PARALLEL_PAGES = 4;

async function fetchPage(
  text: string,
  pageIndex: number
): Promise<ImageResult[]> {
  const params = new URLSearchParams({ text, lr: "21312" });
  if (pageIndex > 0) params.set("p", String(pageIndex));
  const url = `https://yandex.com/images/search?${params.toString()}`;
  const { body } = await proxyManager.fetchWithAnyProxy(url, BROWSER_HEADERS);
  return parseYandexHtml(body);
}

router.get("/scrape/images", async (req: Request, res: Response) => {
  const text = (req.query.text as string) || "";
  const page = parseInt((req.query.page as string) || "0", 10);
  const requestedCount = Math.min(
    parseInt((req.query.count as string) || "30", 10),
    MAX_IMAGES
  );

  if (!text.trim()) {
    res.status(400).json({ error: "Missing required query param: text" });
    return;
  }

  req.log.info({ text, page, requestedCount }, "Scraping Yandex Images");

  try {
    if (requestedCount <= PER_PAGE) {
      const images = await fetchPage(text, page);
      res.json({
        query: text,
        page,
        count: images.length,
        images: images.slice(0, requestedCount),
      });
      return;
    }

    const pagesNeeded = Math.ceil(requestedCount / PER_PAGE);
    const allImages: ImageResult[] = [];

    for (
      let batchStart = 0;
      batchStart < pagesNeeded && allImages.length < requestedCount;
      batchStart += MAX_PARALLEL_PAGES
    ) {
      const batchEnd = Math.min(batchStart + MAX_PARALLEL_PAGES, pagesNeeded);
      const pageIndices = Array.from(
        { length: batchEnd - batchStart },
        (_, i) => page + batchStart + i
      );

      req.log.info({ pages: pageIndices }, "Fetching batch of pages");

      const batchResults = await Promise.allSettled(
        pageIndices.map((p) => fetchPage(text, p))
      );

      let batchEmpty = true;
      for (const r of batchResults) {
        if (r.status === "fulfilled" && r.value.length > 0) {
          allImages.push(...r.value);
          batchEmpty = false;
        }
      }

      if (batchEmpty) break;
    }

    const unique = deduplicateImages(allImages).slice(0, requestedCount);

    res.json({
      query: text,
      page,
      count: unique.length,
      images: unique,
    });
  } catch (err) {
    req.log.error({ err }, "Scrape failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
      proxyStats: proxyManager.getStats(),
      images: [],
    });
  }
});

function deduplicateImages(images: ImageResult[]): ImageResult[] {
  const seen = new Set<string>();
  return images.filter((img) => {
    if (seen.has(img.origUrl)) return false;
    seen.add(img.origUrl);
    return true;
  });
}

router.get("/scrape/proxies", (_req: Request, res: Response) => {
  res.json(proxyManager.getStats());
});

router.post("/scrape/proxies/refresh", async (_req: Request, res: Response) => {
  await proxyManager.refresh();
  res.json({ success: true, stats: proxyManager.getStats() });
});

router.get("/scrape/images/debug", async (req: Request, res: Response) => {
  const text = (req.query.text as string) || "cat";
  const params = new URLSearchParams({ text, lr: "21312" });
  const url = `https://yandex.com/images/search?${params.toString()}`;
  const debug: string[] = [];

  try {
    const { body, status, proxy } = await proxyManager.fetchWithAnyProxy(
      url,
      BROWSER_HEADERS
    );

    const images = parseYandexHtml(body, debug);

    res.json({
      status,
      bodyLength: body.length,
      proxy,
      proxyStats: proxyManager.getStats(),
      parseDebug: debug,
      imageCount: images.length,
      firstImage: images[0] ?? null,
      bodyPreview: body.slice(0, 400),
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
      proxyStats: proxyManager.getStats(),
    });
  }
});

router.get("/scrape/test-proxy", async (req: Request, res: Response) => {
  const proxyUrl = (req.query.proxy as string) || "";
  if (!proxyUrl) {
    res.status(400).json({ error: "Missing ?proxy= param" });
    return;
  }
  const debug: string[] = [];
  try {
    const { body, status, proxy } = await proxyManager.fetchViaProxy(
      proxyUrl,
      "https://yandex.com/images/search?text=cat&lr=21312",
      BROWSER_HEADERS
    );
    const images = parseYandexHtml(body, debug);
    res.json({
      status,
      bodyLength: body.length,
      proxy,
      imageCount: images.length,
      parseDebug: debug,
      firstImage: images[0] ?? null,
      bodyPreview: body.slice(0, 500),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export interface VideoResult {
  videoId: string;
  title: string;
  url: string;
  previewUrl: string;
  thumb: string;
  description: string;
  width: number | null;
  height: number | null;
}

interface VideoClip {
  videoId?: string;
  description?: string;
  preview?: { posterSrc?: string };
  cwidth?: number;
  cheight?: number;
  relatedParams?: {
    text?: string;
    related_url?: string;
    related?: string;
  };
}

interface VideoPreloadedState {
  pages?: {
    search?: {
      serpItems?: Array<{ type: string; props?: { videoId?: string } }>;
    };
  };
  clips?: {
    items?: Record<string, VideoClip>;
  };
}

function absoluteVideoUrl(url?: string): string {
  if (!url) return "";
  return url.startsWith("//") ? `https:${url}` : url;
}

function parseYandexVideoHtml(html: string, debug?: string[]): VideoResult[] {
  const $ = cheerio.load(html);
  const results: VideoResult[] = [];

  const $frames = $("noframes#UniAppVideo-PreloadedState");
  debug?.push(`noframes#UniAppVideo-PreloadedState count: ${$frames.length}`);

  if ($frames.length === 0) return results;

  try {
    const raw = $frames.text();
    debug?.push(`raw len: ${raw.length}`);
    const state = JSON.parse(raw) as VideoPreloadedState;

    const serpItems = (state.pages?.search?.serpItems ?? []).filter(
      (i) => i.type === "videoSnippet" && i.props?.videoId
    );
    const clips = state.clips?.items ?? {};

    debug?.push(`serpItems: ${serpItems.length}, clips: ${Object.keys(clips).length}`);

    for (const item of serpItems) {
      const vid = item.props!.videoId!;
      const clip = clips[vid];
      if (!clip) continue;

      const relUrl = clip.relatedParams?.related_url ?? "";
      const title = clip.relatedParams?.text ?? "";
      const thumb = absoluteVideoUrl(clip.preview?.posterSrc);

      results.push({
        videoId: vid,
        title,
        url: relUrl,
        previewUrl: `https://yandex.com/video/preview/${vid}`,
        thumb,
        description: clip.description ?? "",
        width: clip.cwidth ?? null,
        height: clip.cheight ?? null,
      });
    }
  } catch (err) {
    debug?.push(`parse error: ${(err as Error).message.slice(0, 80)}`);
  }

  return results;
}

async function fetchVideoPage(
  text: string,
  pageIndex: number
): Promise<VideoResult[]> {
  const params = new URLSearchParams({ text, from: "tabbar" });
  if (pageIndex > 0) params.set("p", String(pageIndex));
  const url = `https://yandex.com/video/search?${params.toString()}`;
  const { body } = await proxyManager.fetchWithAnyProxy(url, BROWSER_HEADERS);
  return parseYandexVideoHtml(body);
}

const MAX_VIDEOS = 200;
const MAX_PARALLEL_VIDEO_PAGES = 3;

router.get("/scrape/videos", async (req: Request, res: Response) => {
  const text = (req.query.text as string) || "";
  const page = parseInt((req.query.page as string) || "0", 10);
  const requestedCount = Math.min(
    parseInt((req.query.count as string) || "17", 10),
    MAX_VIDEOS
  );

  if (!text.trim()) {
    res.status(400).json({ error: "Missing required query param: text" });
    return;
  }

  req.log.info({ text, page, requestedCount }, "Scraping Yandex Videos");

  try {
    if (requestedCount <= 17) {
      const videos = await fetchVideoPage(text, page);
      res.json({
        query: text,
        page,
        count: videos.length,
        videos: videos.slice(0, requestedCount),
      });
      return;
    }

    const pagesNeeded = Math.ceil(requestedCount / 17);
    const allVideos: VideoResult[] = [];

    for (
      let batchStart = 0;
      batchStart < pagesNeeded && allVideos.length < requestedCount;
      batchStart += MAX_PARALLEL_VIDEO_PAGES
    ) {
      const batchEnd = Math.min(batchStart + MAX_PARALLEL_VIDEO_PAGES, pagesNeeded);
      const pageIndices = Array.from(
        { length: batchEnd - batchStart },
        (_, i) => page + batchStart + i
      );

      const batchResults = await Promise.allSettled(
        pageIndices.map((p) => fetchVideoPage(text, p))
      );

      let batchEmpty = true;
      for (const r of batchResults) {
        if (r.status === "fulfilled" && r.value.length > 0) {
          allVideos.push(...r.value);
          batchEmpty = false;
        }
      }

      if (batchEmpty) break;
    }

    const seenIds = new Set<string>();
    const unique = allVideos
      .filter((v) => {
        if (seenIds.has(v.videoId)) return false;
        seenIds.add(v.videoId);
        return true;
      })
      .slice(0, requestedCount);

    res.json({
      query: text,
      page,
      count: unique.length,
      videos: unique,
    });
  } catch (err) {
    req.log.error({ err }, "Video scrape failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
      proxyStats: proxyManager.getStats(),
      videos: [],
    });
  }
});

router.get("/scrape/videos/debug", async (req: Request, res: Response) => {
  const text = (req.query.text as string) || "cat";
  const params = new URLSearchParams({ text, from: "tabbar" });
  const url = `https://yandex.com/video/search?${params.toString()}`;
  const debug: string[] = [];

  try {
    const { body, status, proxy } = await proxyManager.fetchWithAnyProxy(
      url,
      BROWSER_HEADERS
    );
    const videos = parseYandexVideoHtml(body, debug);
    res.json({
      status,
      bodyLength: body.length,
      proxy,
      proxyStats: proxyManager.getStats(),
      parseDebug: debug,
      videoCount: videos.length,
      firstVideo: videos[0] ?? null,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
      proxyStats: proxyManager.getStats(),
    });
  }
});

export default router;
