import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "./logger";

const execFileAsync = promisify(execFile);

const YTDLP_PATH = "/home/runner/yt-dlp";
const PYTHON_PATH = "/home/runner/.nix-profile/bin/python3.10";
const TIMEOUT_MS = 30_000;

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

export interface ResolvedVideo {
  videoId: string;
  title: string;
  duration: number | null;
  thumbnail: string;
  formats: StreamFormat[];
  best: {
    videoAndAudio: StreamFormat | null;
    video720p: StreamFormat | null;
    audioOnly: StreamFormat | null;
  };
}

function normalizeYouTubeUrl(input: string): string {
  // Accept bare video ID, youtu.be/, or full URL
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return `https://www.youtube.com/watch?v=${input}`;
  }
  if (input.startsWith("youtu.be/")) {
    return `https://www.youtube.com/${input}`;
  }
  return input;
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
        hasVideo && hasAudio
          ? "video+audio"
          : hasVideo
          ? "video"
          : "audio";

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
  const videoOnly = formats.filter((f) => f.type === "video");
  const audioOnly = formats.filter((f) => f.type === "audio");

  const video720 =
    videoOnly.find(
      (f) => f.height === 720 && f.ext === "mp4"
    ) ??
    videoOnly.find((f) => f.height === 720) ??
    null;

  const bestCombined =
    combined.find((f) => f.ext === "mp4") ?? combined[0] ?? null;

  const bestAudio =
    audioOnly.find((f) => f.ext === "m4a" && f.quality === "medium") ??
    audioOnly.find((f) => f.ext === "m4a") ??
    audioOnly.find((f) => f.quality === "medium") ??
    audioOnly[0] ??
    null;

  return {
    videoId: data.id,
    title: data.title,
    duration: data.duration ?? null,
    thumbnail: data.thumbnail ?? "",
    formats,
    best: {
      videoAndAudio: bestCombined,
      video720p: video720,
      audioOnly: bestAudio,
    },
  };
}
