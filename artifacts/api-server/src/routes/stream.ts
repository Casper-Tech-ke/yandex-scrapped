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
      ALLOWED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}

function buildProxyUrl(req: Request, cdnUrl: string): string {
  const host = req.get("host") ?? "localhost";
  const proto = req.get("x-forwarded-proto") ?? req.protocol ?? "https";
  return `${proto}://${host}/api/stream?url=${encodeURIComponent(cdnUrl)}`;
}

/**
 * Rewrite every absolute URL in an M3U8 body so it goes through /api/stream.
 * Handles both master manifests (referencing other .m3u8 files) and
 * media manifests (referencing .ts / .m4s segments).
 */
function rewriteM3u8(body: string, req: Request): string {
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      // Keep comments and empty lines as-is
      if (!trimmed || trimmed.startsWith("#")) return line;
      // Rewrite any absolute URL
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return buildProxyUrl(req, trimmed);
      }
      return line;
    })
    .join("\n");
}

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * GET /api/stream?url=<encoded_cdn_url>
 *
 * Proxies YouTube CDN streams through the server so the browser can play them.
 * CDN URLs are IP-locked to the machine that ran yt-dlp. Supports:
 *   - Direct MP4 progressive downloads (Range forwarding for seeking)
 *   - HLS manifests (.m3u8) — URLs inside are rewritten to also go through this proxy
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
    logger.warn({ targetUrl }, "Stream proxy: URL not in allowlist");
    res.status(403).json({ error: "URL not allowed" });
    return;
  }

  const fetchHeaders: Record<string, string> = { ...FETCH_HEADERS };

  // Forward Range header for seekable MP4 playback
  const rangeHeader = req.headers["range"];
  if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: fetchHeaders,
      redirect: "follow",
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const isHls =
      contentType.includes("mpegurl") ||
      contentType.includes("x-mpegURL") ||
      targetUrl.includes(".m3u8");

    if (isHls && upstream.body) {
      // Read the manifest text, rewrite all CDN URLs, return modified manifest
      const text = await upstream.text();
      const rewritten = rewriteM3u8(text, req);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");
      res.status(200).send(rewritten);
      return;
    }

    // Direct binary stream (MP4, TS segments, etc.)
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
