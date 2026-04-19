import { Router, type IRouter, type Request, type Response } from "express";
import * as cheerio from "cheerio";

const router: IRouter = Router();

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua":
    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Linux"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

interface ImageResult {
  title: string;
  url: string;
  thumb: string;
  width: number | null;
  height: number | null;
  source: string;
  domain: string;
}

function isCaptcha(body: string): boolean {
  return (
    body.includes("showcaptcha") ||
    body.includes("CheckCaptcha") ||
    body.includes("anti-robot") ||
    body.includes("Are you not a robot") ||
    body.includes("captcha_smart") ||
    body.includes('"type":"captcha"')
  );
}

function parseHtmlImages(html: string): ImageResult[] {
  const results: ImageResult[] = [];
  const $ = cheerio.load(html);

  $("[data-bem]").each((_i, el) => {
    try {
      const raw = $(el).attr("data-bem") || "";
      const parsed = JSON.parse(raw);
      const item =
        parsed["serp-item"] ||
        parsed["thumbs-item"] ||
        parsed["image-item"] ||
        null;
      if (!item) return;

      const previews: unknown[] = Array.isArray(item.preview)
        ? item.preview
        : item.preview
          ? [item.preview]
          : [];

      for (const prev of previews) {
        const p = prev as Record<string, unknown>;
        const thumb = item.thumb as Record<string, unknown> | undefined;
        const snippet = item.snippet as Record<string, unknown> | undefined;
        const imageUrl = (p.url as string) || "";
        if (!imageUrl) continue;
        results.push({
          title: (snippet?.title as string) || "",
          url: imageUrl,
          thumb: (thumb?.url as string) || "",
          width: (p.w as number) || null,
          height: (p.h as number) || null,
          source: (snippet?.url as string) || "",
          domain: (snippet?.domain as string) || extractDomain(snippet?.url as string),
        });
      }
    } catch {
    }
  });

  if (results.length === 0) {
    $("[data-state]").each((_i, el) => {
      try {
        const raw = $(el).attr("data-state") || "";
        const parsed = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
        extractFromObject(parsed, results);
      } catch {
      }
    });
  }

  if (results.length === 0) {
    $("script").each((_i, el) => {
      const text = $(el).html() || "";
      if (!text.includes('"preview"') && !text.includes('"thumb"')) return;
      try {
        const jsonMatch = text.match(/\{.*"preview".*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          extractFromObject(parsed, results);
        }
      } catch {
      }
    });
  }

  return results;
}

function parseJsonResponse(body: string): ImageResult[] {
  const results: ImageResult[] = [];
  try {
    const data = JSON.parse(body);
    if (data.type === "captcha") return results;
    extractFromObject(data, results);
  } catch {
  }
  return results;
}

function extractFromObject(obj: unknown, results: ImageResult[]): void {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((item) => extractFromObject(item, results));
    return;
  }

  const o = obj as Record<string, unknown>;

  if (o.preview && (o.thumb || o.url)) {
    const previews = Array.isArray(o.preview) ? o.preview : [o.preview];
    for (const prev of previews) {
      const p = prev as Record<string, unknown>;
      const thumb = o.thumb as Record<string, unknown> | undefined;
      const snippet = o.snippet as Record<string, unknown> | undefined;
      const imageUrl = (p.url as string) || (o.url as string) || "";
      if (!imageUrl || !imageUrl.startsWith("http")) continue;
      results.push({
        title: (snippet?.title as string) || (o.title as string) || "",
        url: imageUrl,
        thumb: (thumb?.url as string) || "",
        width: (p.w as number) || null,
        height: (p.h as number) || null,
        source: (snippet?.url as string) || "",
        domain: (snippet?.domain as string) || extractDomain(snippet?.url as string),
      });
    }
    return;
  }

  for (const val of Object.values(o)) {
    extractFromObject(val, results);
    if (results.length >= 50) return;
  }
}

function extractDomain(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

router.get("/scrape/images", async (req: Request, res: Response) => {
  const text = (req.query.text as string) || "";
  const page = parseInt((req.query.page as string) || "0", 10);
  const format = (req.query.format as string) || "html";

  if (!text.trim()) {
    res.status(400).json({ error: "Missing required query param: text" });
    return;
  }

  const params = new URLSearchParams({ text, lr: "21312" });
  if (page > 0) params.set("p", String(page));

  let url: string;
  let extraHeaders: Record<string, string> = {};

  if (format === "json") {
    params.set("format", "json");
    params.set("request_source", "site");
    url = `https://yandex.com/images/search?${params.toString()}`;
    extraHeaders = {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
    };
  } else {
    url = `https://yandex.com/images/search?${params.toString()}`;
  }

  req.log.info({ url, format }, "Scraping Yandex Images");

  try {
    const response = await fetch(url, {
      headers: { ...BROWSER_HEADERS, ...extraHeaders },
      redirect: "follow",
    });

    const body = await response.text();

    if (!response.ok) {
      req.log.warn({ status: response.status }, "Yandex returned non-200");
      res.status(502).json({
        error: `Upstream returned HTTP ${response.status}`,
        images: [],
        captcha: false,
      });
      return;
    }

    if (isCaptcha(body)) {
      req.log.warn("Yandex CAPTCHA triggered — IP is blocked");
      res.status(429).json({
        error:
          "Yandex blocked this request with a CAPTCHA. " +
          "Datacenter/cloud IPs are routinely blocked by Yandex. " +
          "To fix this: configure a residential or rotating proxy, or run the scraper from a non-cloud IP.",
        captcha: true,
        images: [],
      });
      return;
    }

    const images =
      format === "json"
        ? parseJsonResponse(body)
        : parseHtmlImages(body);

    res.json({
      query: text,
      page,
      count: images.length,
      images,
      note:
        images.length === 0
          ? "No images parsed. Yandex may have changed their HTML structure."
          : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Scrape request failed");
    res.status(500).json({
      error: "Scrape request failed",
      detail: err instanceof Error ? err.message : String(err),
      images: [],
    });
  }
});

router.get("/scrape/images/debug", async (req: Request, res: Response) => {
  const text = (req.query.text as string) || "cat";
  const params = new URLSearchParams({ text, lr: "21312" });
  const url = `https://yandex.com/images/search?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });

    const body = await response.text();

    res.json({
      status: response.status,
      contentType: response.headers.get("content-type"),
      bodyLength: body.length,
      captcha: isCaptcha(body),
      bodyPreview: body.slice(0, 500),
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
