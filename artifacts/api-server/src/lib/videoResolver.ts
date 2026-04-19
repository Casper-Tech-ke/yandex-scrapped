import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "./logger";

const execFileAsync = promisify(execFile);

const YTDLP_PATH = "/home/runner/yt-dlp";
const PYTHON_PATH = "/home/runner/.nix-profile/bin/python3.10";
const TIMEOUT_MS = 25_000;

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

export async function resolveYouTubeVideo(
  urlOrId: string
): Promise<ResolvedVideo> {
  const url = normalizeYouTubeUrl(urlOrId);
  logger.info({ url }, "Resolving YouTube video");

  const nodeExec = process.execPath;

  const { stdout } = await execFileAsync(
    PYTHON_PATH,
    [
      YTDLP_PATH,
      "--js-runtimes",
      `nodejs:${nodeExec}`,
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
    .filter((f) => f.url && f.ext !== "mhtml")
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

  const combined = formats.filter((f) => f.type === "video+audio");
  const videoOnly = formats
    .filter((f) => f.type === "video" && f.ext === "mp4")
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  // best = highest quality mp4 video (720p or best available), preferring combined if ≥720p
  const bestCombined720 = combined.find((f) => (f.height ?? 0) >= 720 && f.ext === "mp4");
  const bestVideo = bestCombined720 ?? videoOnly[0] ?? combined[0] ?? formats[0];

  // medium = 360p combined mp4, or next best combined, or lower video-only
  const medium360Combined = combined.find((f) => f.height === 360 && f.ext === "mp4");
  const anyMediumCombined = combined.find((f) => (f.height ?? 0) <= 480 && f.ext === "mp4") ?? combined[0];
  const medium480Video = videoOnly.find((f) => f.height === 480);
  const medium360Video = videoOnly.find((f) => f.height === 360);
  const mediumVideo = medium360Combined ?? anyMediumCombined ?? medium480Video ?? medium360Video ?? bestVideo;

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
