import { Router, type IRouter, type Request, type Response } from "express";
import { request as undiciRequest } from "undici";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ALLOWED_HOSTS = [
  "googlevideo.com",
  "youtube.com",
  "ytimg.com",
  "yt3.ggpht.com",
  "r1---sn",
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
 * CDN URLs are IP-locked to the machine that ran yt-dlp; browsers can't access
 * them directly. This endpoint re-fetches from the server's IP and forwards
 * the byte stream, including Range request support for seeking.
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

  const upstreamHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
  };

  // Forward Range header so seeking works
  const rangeHeader = req.headers["range"];
  if (rangeHeader) {
    upstreamHeaders["Range"] = rangeHeader;
  }

  try {
    const upstream = await undiciRequest(targetUrl, {
      method: "GET",
      headers: upstreamHeaders,
      maxRedirections: 5,
    });

    const status = upstream.statusCode;

    // Forward key headers the browser needs for video playback
    const forward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
    ];
    for (const h of forward) {
      const val = upstream.headers[h];
      if (val) res.setHeader(h, val);
    }

    // Allow browser to use this stream
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.status(status);
    upstream.body.pipe(res);

    upstream.body.on("error", (err) => {
      logger.warn({ err }, "Stream body error");
      if (!res.headersSent) res.status(500).end();
    });
  } catch (err) {
    logger.error({ err, targetUrl }, "Stream proxy error");
    if (!res.headersSent) {
      res.status(502).json({ error: "Failed to fetch stream from CDN" });
    }
  }
});

export default router;
