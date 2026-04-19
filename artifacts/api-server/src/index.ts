import { spawn } from "child_process";
import { existsSync } from "fs";
import { chmod, writeFile } from "fs/promises";
import app from "./app";
import { logger } from "./lib/logger";
import { proxyManager } from "./lib/proxyManager";

const YTDLP_PATH = "/home/runner/yt-dlp";
const YTDLP_URL =
  "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

async function ensureYtDlp(): Promise<void> {
  if (existsSync(YTDLP_PATH)) return;
  logger.warn({ path: YTDLP_PATH }, "yt-dlp not found — downloading");
  try {
    const res = await fetch(YTDLP_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(YTDLP_PATH, buf);
    await chmod(YTDLP_PATH, 0o755);
    logger.info({ path: YTDLP_PATH }, "yt-dlp downloaded OK");
  } catch (err) {
    logger.error({ err }, "Failed to download yt-dlp — video streams will not resolve");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Ensure yt-dlp is present before handling any requests
ensureYtDlp().catch(() => {});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  proxyManager.validateProxies().then(() => {
    logger.info(proxyManager.getStats(), "Proxy pool ready");
  }).catch((e) => {
    logger.warn({ err: e }, "Proxy pool warm-up failed");
  });

  // In development, launch the scraper-ui Vite dev server as a child process.
  // The api-server proxies /scraper-ui/* traffic to it at port 22742.
  if (process.env.NODE_ENV === "development") {
    const vite = spawn(
      "pnpm",
      ["--filter", "@workspace/scraper-ui", "run", "dev"],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          PORT: "22742",
          BASE_PATH: "/scraper-ui/",
        },
      },
    );
    vite.on("error", (spawnErr) => {
      logger.error({ err: spawnErr }, "Failed to start Vite dev server");
    });
    logger.info({ vitePort: 22742 }, "Vite dev server spawned");
  }
});
