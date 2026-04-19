import { ProxyAgent, fetch as undiciFetch } from "undici";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "./logger";

const execFileAsync = promisify(execFile);

const PROXY_LIST_URL =
  "https://raw.githubusercontent.com/mauricegift/free-proxies/master/files/http.json";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const CHECK_TIMEOUT_MS = 5_000;
const REQUEST_TIMEOUT_MS = 15_000;
const HEALTH_CHECK_URL = "http://ip-api.com/json/?fields=query";
const HEALTH_CHECK_CONCURRENCY = 50;
const BATCH_SIZE = 8;

interface ProxyEntry {
  url: string;
  failures: number;
  banned: boolean;
  validated: boolean;
}

function isCaptchaBody(body: string): boolean {
  return (
    body.includes("showcaptcha") ||
    body.includes("captcha_smart") ||
    body.includes("Are you not a robot") ||
    body.includes('"type":"captcha"') ||
    body.includes("SmartCaptcha")
  );
}

async function curlFetch(
  proxyUrl: string,
  url: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<{ body: string; status: number }> {
  const timeoutSec = Math.ceil(timeoutMs / 1000);
  const args = [
    "--silent",
    "--max-time",
    String(timeoutSec),
    "--proxy",
    proxyUrl,
    "--compressed",
    "--location",
    "--insecure",
    "-w",
    "\n___STATUS_%{http_code}___",
  ];

  for (const [k, v] of Object.entries(headers)) {
    args.push("-H", `${k}: ${v}`);
  }
  args.push(url);

  const { stdout } = await execFileAsync("curl", args, {
    maxBuffer: 10 * 1024 * 1024,
    timeout: timeoutMs + 2000,
  });

  const marker = "\n___STATUS_";
  const idx = stdout.lastIndexOf(marker);
  if (idx === -1) {
    return { body: stdout, status: 0 };
  }

  const body = stdout.slice(0, idx);
  const statusStr = stdout.slice(idx + marker.length, idx + marker.length + 6).replace("___", "");
  const status = parseInt(statusStr, 10) || 0;

  return { body, status };
}

class ProxyManager {
  private allProxies: ProxyEntry[] = [];
  private validProxies: ProxyEntry[] = [];
  private lastRefresh = 0;
  private refreshing = false;
  private cursor = 0;

  async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      const resp = await fetch(PROXY_LIST_URL, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { proxies?: string[] };

      this.allProxies = (data.proxies ?? [])
        .filter((p) => !p.startsWith("socks"))
        .map((p) => (p.startsWith("http") ? p : `http://${p}`))
        .map((url) => ({ url, failures: 0, banned: false, validated: false }));

      this.lastRefresh = Date.now();
      logger.info({ count: this.allProxies.length }, "Proxy list loaded");
    } catch (err) {
      logger.warn({ err }, "Failed to refresh proxy list");
    } finally {
      this.refreshing = false;
    }
  }

  private async checkProxy(proxyUrl: string): Promise<boolean> {
    try {
      const agent = new ProxyAgent({
        uri: proxyUrl,
        connect: { rejectUnauthorized: false, timeout: CHECK_TIMEOUT_MS },
      });

      const resp = await undiciFetch(HEALTH_CHECK_URL, {
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
        // @ts-expect-error undici dispatcher
        dispatcher: agent,
      });

      return resp.status === 200;
    } catch {
      return false;
    }
  }

  async validateProxies(): Promise<void> {
    if (this.allProxies.length === 0) await this.refresh();

    const toCheck = this.allProxies.filter((p) => !p.validated && !p.banned);
    logger.info({ count: toCheck.length }, "Validating proxies...");

    const valid: ProxyEntry[] = [];

    for (let i = 0; i < toCheck.length; i += HEALTH_CHECK_CONCURRENCY) {
      const batch = toCheck.slice(i, i + HEALTH_CHECK_CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (entry) => {
          const ok = await this.checkProxy(entry.url);
          if (ok) {
            entry.validated = true;
            return entry;
          }
          return null;
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value) valid.push(r.value);
      }

      if (valid.length >= 20) break;
    }

    this.validProxies = valid;
    this.cursor = 0;
    logger.info({ valid: valid.length }, "Proxy validation complete");
  }

  private async ensureReady(): Promise<void> {
    if (
      Date.now() - this.lastRefresh > REFRESH_INTERVAL_MS ||
      this.allProxies.length === 0
    ) {
      await this.refresh();
      await this.validateProxies();
    } else if (this.validProxies.filter((p) => !p.banned).length === 0) {
      await this.validateProxies();
    }
  }

  private pickBatch(): ProxyEntry[] {
    const available = this.validProxies.filter((p) => !p.banned);
    if (available.length === 0) return [];
    const batch: ProxyEntry[] = [];
    for (let i = 0; i < BATCH_SIZE && i < available.length; i++) {
      batch.push(available[(this.cursor + i) % available.length]);
    }
    this.cursor = (this.cursor + BATCH_SIZE) % Math.max(available.length, 1);
    return batch;
  }

  markSuccess(url: string): void {
    const e = this.validProxies.find((p) => p.url === url);
    if (e) e.failures = 0;
  }

  markFailure(url: string): void {
    const e = this.validProxies.find((p) => p.url === url);
    if (!e) return;
    e.failures += 1;
    if (e.failures >= 3) {
      e.banned = true;
      logger.debug({ proxy: url }, "Proxy banned");
    }
  }

  async fetchViaProxy(
    proxyUrl: string,
    url: string,
    headers: Record<string, string>
  ): Promise<{ body: string; status: number; proxy: string }> {
    const { body, status } = await curlFetch(proxyUrl, url, headers, REQUEST_TIMEOUT_MS);
    logger.debug({ proxy: proxyUrl, status, bodyLen: body.length }, "curl proxy response");
    return { body, status, proxy: proxyUrl };
  }

  async fetchWithAnyProxy(
    url: string,
    headers: Record<string, string>
  ): Promise<{ body: string; status: number; proxy: string }> {
    await this.ensureReady();

    const available = this.validProxies.filter((p) => !p.banned);
    if (available.length === 0) throw new Error("No valid proxies available");

    const maxBatches = Math.ceil(available.length / BATCH_SIZE);

    for (let b = 0; b < maxBatches; b++) {
      const batch = this.pickBatch();
      if (batch.length === 0) break;

      const result = await this.raceBatch(url, headers, batch);
      if (result) {
        this.markSuccess(result.proxy);
        return result;
      }
    }

    throw new Error("All valid proxies exhausted — try refreshing");
  }

  private raceBatch(
    url: string,
    headers: Record<string, string>,
    batch: ProxyEntry[]
  ): Promise<{ body: string; status: number; proxy: string } | null> {
    return new Promise((resolve) => {
      let settled = 0;
      let won = false;
      const total = batch.length;

      const settle = () => {
        settled += 1;
        if (settled === total && !won) resolve(null);
      };

      for (const entry of batch) {
        this.fetchViaProxy(entry.url, url, headers)
          .then((result) => {
            if (won) return;
            if (!result.body || isCaptchaBody(result.body)) {
              this.markFailure(entry.url);
              settle();
              return;
            }
            won = true;
            resolve(result);
          })
          .catch(() => {
            this.markFailure(entry.url);
            settle();
          });
      }
    });
  }

  getStats() {
    const validBanned = this.validProxies.filter((p) => p.banned).length;
    return {
      total: this.allProxies.length,
      validated: this.validProxies.length,
      available: this.validProxies.length - validBanned,
      banned: validBanned,
    };
  }
}

export const proxyManager = new ProxyManager();
