import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "./logger";

const execFileAsync = promisify(execFile);

const YTDLP_PATH = process.env["YTDLP_PATH"] ?? "/home/runner/yt-dlp";
const TIMEOUT_MS = 25_000;

// Candidate Python paths in preference order — the Nix store path changes on
// module reinstalls so we probe each one at startup and pick the first that works.
const PYTHON_CANDIDATES = [
  "/home/runner/.nix-profile/bin/python3.10",
  "/home/runner/.nix-profile/bin/python3",
  "/usr/bin/python3.10",
  "/usr/bin/python3",
  "python3.10",
  "python3",
];

async function findPython(): Promise<string> {
  for (const p of PYTHON_CANDIDATES) {
    try {
      await execFileAsync(p, ["--version"], { timeout: 3_000 });
      logger.info({ python: p }, "Found Python for yt-dlp");
      return p;
    } catch {
      // try next
    }
  }
  // Last resort: use `which` via the shell
  try {
    const { stdout } = await execFileAsync("sh", ["-c", "which python3.10 || which python3"], {
      timeout: 3_000,
    });
    const resolved = stdout.trim();
    if (resolved) {
      logger.info({ python: resolved }, "Found Python via which");
      return resolved;
    }
  } catch {
    // ignore
  }
  throw new Error("No Python interpreter found — install python-3.10 module");
}

let _pythonPath: string | null = null;
async function getPython(): Promise<string> {
  if (!_pythonPath) _pythonPath = await findPython();
  return _pythonPath;
}

export interface StreamFormat {
  formatId: string;
  quality: string;
  ext: string;
  type: "video+audio" | "video" | "audio";
  vcodec: string | null;
  acodec: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  filesize: number | null;
  url: string;
}

export interface StreamUrls {
  best: string;
  medium: string;
}

export interface ResolvedVideo {
  videoId: string;
  title: string;
  duration: number | null;
  thumbnail: string;
  streamUrls: StreamUrls;
  formats: StreamFormat[];
}

function normalizeYouTubeUrl(input: string): string {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return `https://www.youtube.com/watch?v=${input}`;
  }
  return input;
}

export function isYouTubeUrl(url: string): boolean {
  return (
    url.includes("youtube.com/watch") ||
    url.includes("youtu.be/") ||
    url.includes("youtube.com/shorts/")
  );
}

export function isTikTokUrl(url: string): boolean {
  return url.includes("tiktok.com") || url.includes("vm.tiktok.com");
}

export async function resolveYouTubeVideo(
  urlOrId: string
): Promise<ResolvedVideo> {
  const url = normalizeYouTubeUrl(urlOrId);
  logger.info({ url }, "Resolving YouTube video");

  const nodeExec = process.execPath;
  const pythonPath = await getPython();

  // Runtime identifier is "node" not "nodejs" (yt-dlp naming)
  const { stdout } = await execFileAsync(
    pythonPath,
    [
      YTDLP_PATH,
      "--js-runtimes",
      `node:${nodeExec}`,
      "-j",
      "--no-playlist",
      url,
    ],
    { timeout: TIMEOUT_MS, maxBuffer: 20 * 1024 * 1024 }
  );

  const data = JSON.parse(stdout) as {
    id: string;
    title: string;
    duration: number;
    thumbnail: string;
    formats: Array<{
      format_id: string;
      format_note?: string;
      ext: string;
      vcodec?: string;
      acodec?: string;
      width?: number;
      height?: number;
      fps?: number;
      filesize?: number;
      url: string;
    }>;
  };

  const formats: StreamFormat[] = (data.formats ?? [])
    .filter((f) => {
      if (!f.url || f.ext === "mhtml") return false;
      // HLS manifest URLs from yt-dlp's JS extractor are signed for the yt-dlp
      // session and return 403 when re-fetched by our proxy.  Only keep direct
      // CDN videoplayback URLs which can be reliably proxied.
      if (f.url.includes("manifest.googlevideo.com")) return false;
      return true;
    })
    .map((f) => {
      const hasVideo = f.vcodec && f.vcodec !== "none";
      const hasAudio = f.acodec && f.acodec !== "none";
      const type: StreamFormat["type"] =
        hasVideo && hasAudio ? "video+audio" : hasVideo ? "video" : "audio";
      return {
        formatId: f.format_id,
        quality: f.format_note ?? "",
        ext: f.ext,
        type,
        vcodec: hasVideo ? (f.vcodec ?? null) : null,
        acodec: hasAudio ? (f.acodec ?? null) : null,
        width: f.width ?? null,
        height: f.height ?? null,
        fps: f.fps ?? null,
        filesize: f.filesize ?? null,
        url: f.url,
      };
    });

  // YouTube DASH streams are video-only or audio-only — a plain <video> tag
  // cannot play them without MSE muxing. We must use only combined (video+audio)
  // streams, which are typically itag=22 (720p mp4) and itag=18 (360p mp4).
  const combined = formats.filter((f) => f.type === "video+audio");

  // Prefer mp4 combined, sorted best quality first
  const combinedMp4 = combined
    .filter((f) => f.ext === "mp4")
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  // Any combined stream as fallback (webm, etc.)
  const combinedAny = [...combined].sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  // best = highest quality combined stream (audio always included)
  const bestVideo = combinedMp4[0] ?? combinedAny[0] ?? formats[0];

  // medium = lowest quality combined mp4 (smallest file, fastest load)
  const mediumVideo =
    combinedMp4[combinedMp4.length - 1] ??
    combinedAny[combinedAny.length - 1] ??
    bestVideo;

  return {
    videoId: data.id,
    title: data.title,
    duration: data.duration ?? null,
    thumbnail: data.thumbnail ?? "",
    streamUrls: {
      best: bestVideo?.url ?? "",
      medium: mediumVideo?.url ?? "",
    },
    formats,
  };
}

export async function resolveStreamUrlsSafe(
  youtubeUrl: string
): Promise<StreamUrls | null> {
  try {
    const resolved = await resolveYouTubeVideo(youtubeUrl);
    return resolved.streamUrls;
  } catch (err) {
    logger.warn({ url: youtubeUrl, err }, "Failed to resolve stream URLs");
    return null;
  }
}
