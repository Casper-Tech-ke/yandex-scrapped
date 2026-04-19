import { Router, type IRouter, type Request, type Response } from "express";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ALLOWED_HOSTS = [
  "googlevideo.com",
  "youtube.com",
  "ytimg.com",
  "yt3.ggpht.com",
];

function isAllowedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return (
      (u.protocol === "https:" || u.protocol === "http:") &&
      ALLOWED_HOSTS.some((h) => u.hostname.endsWith(h))
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/stream?url=<encoded_cdn_url>
 *
 * Proxies a YouTube CDN stream through the server so the browser can play it.
 * CDN URLs are IP-locked to the machine that ran yt-dlp; browsers can't use
 * them directly. This endpoint fetches from the same server IP and pipes bytes
 * to the browser, including Range request forwarding so seeking works.
 */
router.get("/stream", async (req: Request, res: Response) => {
  const raw = req.query["url"];

  if (typeof raw !== "string" || !raw) {
    res.status(400).json({ error: "Missing ?url= query parameter" });
    return;
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(raw);
  } catch {
    res.status(400).json({ error: "Invalid URL encoding" });
    return;
  }

  if (!isAllowedUrl(targetUrl)) {
    res.status(403).json({ error: "URL not allowed" });
    return;
  }

  const fetchHeaders: HeadersInit = {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
  };

  // Forward Range header so the browser can seek within the video
  const rangeHeader = req.headers["range"];
  if (rangeHeader) {
    (fetchHeaders as Record<string, string>)["Range"] = rangeHeader;
  }

  try {
    // Use global fetch (Node 18+) — follows redirects automatically
    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: fetchHeaders,
      redirect: "follow",
    });

    // Forward the key headers the browser needs for video playback
    const forward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
    ];
    for (const h of forward) {
      const val = upstream.headers.get(h);
      if (val) res.setHeader(h, val);
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(upstream.status);

    if (!upstream.body) {
      res.end();
      return;
    }

    // Pipe the Web ReadableStream to Express response
    const nodeStream = Readable.fromWeb(
      upstream.body as import("stream/web").ReadableStream<Uint8Array>
    );

    await pipeline(nodeStream, res).catch((err) => {
      if ((err as NodeJS.ErrnoException).code !== "ERR_STREAM_DESTROYED") {
        logger.warn({ err }, "Stream pipeline error");
      }
    });
  } catch (err) {
    logger.error({ err, targetUrl }, "Stream proxy error");
    if (!res.headersSent) {
      res.status(502).json({ error: "Failed to fetch stream from CDN" });
    }
  }
});

export default router;
