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

router.get("/scrape/images", async (req: Request, res: Response) => {
  const text = (req.query.text as string) || "";
  const page = parseInt((req.query.page as string) || "0", 10);

  if (!text.trim()) {
    res.status(400).json({ error: "Missing required query param: text" });
    return;
  }

  const params = new URLSearchParams({ text, lr: "21312" });
  if (page > 0) params.set("p", String(page));
  const url = `https://yandex.com/images/search?${params.toString()}`;

  req.log.info({ url }, "Scraping Yandex Images");

  try {
    const { body, proxy } = await proxyManager.fetchWithAnyProxy(
      url,
      BROWSER_HEADERS
    );

    const images = parseYandexHtml(body);

    res.json({
      query: text,
      page,
      count: images.length,
      proxy,
      images,
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

export default router;
