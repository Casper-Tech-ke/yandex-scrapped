# CASPER TECH DEVS — Image & Video Scraper

> A high-performance media search and streaming tool powered by Yandex Images/Video, rotating proxies, and YouTube stream resolution via yt-dlp.

Built and maintained by **[TRABY CASPER](https://github.com/Casper-Tech-ke)** with contributions from Keith ([kkeizza](https://github.com/kkeizza)) and Silent Wolf ([SilentWolf-Kenya](https://github.com/SilentWolf-Kenya)).

---

## Features

- **Yandex Image Search** — scrape high-quality images from Yandex with proxy rotation to avoid rate-limits
- **Yandex Video Search** — find YouTube-hosted videos via Yandex's video index
- **YouTube Stream Resolution** — extract direct combined MP4 stream URLs using yt-dlp (itag 18/22, video+audio, no MSE required)
- **Server-side Stream Proxy** — IP-locked YouTube CDN URLs are proxied transparently so the browser can seek and play without CORS errors
- **Dark-themed UI** — clean, responsive grid UI with video player modal, quality switching, and download support
- **REST API** — fully documented JSON API with branding, proxy stats, and scrape endpoints

---

## Architecture

```
Browser
  │
  ├── GET /scraper-ui/          → Vite React frontend
  │
  ├── GET /api/scrape/images    → Yandex image scraper (Node.js / Express)
  ├── GET /api/scrape/videos    → Yandex video scraper + yt-dlp resolver
  └── GET /api/stream           → YouTube CDN stream proxy
```

**Stack:**
- Backend: Node.js, Express, TypeScript, yt-dlp
- Frontend: React, Vite, TailwindCSS, shadcn/ui, Wouter
- Monorepo: pnpm workspaces

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.10+ (for yt-dlp)

### Install

```bash
git clone https://github.com/Casper-Tech-ke/casper-scraper.git
cd casper-scraper
pnpm install
```

### Run in development

```bash
# Start the API server (also spawns the Vite frontend at /scraper-ui/)
pnpm --filter @workspace/api-server run dev
```

Open `http://localhost:8080/scraper-ui/`

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port for the API server (default 8080) |
| `BASE_PATH` | Yes (frontend) | Vite base path (default `/scraper-ui/`) |
| `SESSION_SECRET` | Recommended | Secret for session signing |

---

## Deployment

### Replit (Recommended)

This project is built for Replit and deploys in one click.

1. Open the project in [Replit](https://replit.com)
2. Click **Deploy** → **Autoscale** or **Reserved VM**
3. Replit will build and publish the app to a `.replit.app` domain automatically

> **Important:** YouTube CDN stream URLs are locked to the server's IP address. For streaming to work in production, you **must** deploy to a server with a **fixed public IP** — Replit Reserved VM gives you this. Autoscale may rotate IPs between requests and break stream playback.

**Recommended Replit deployment type:** Reserved VM

Once deployed, yt-dlp is downloaded automatically on first start. No extra setup is required.

---

### Self-Hosting (VPS / Cloud)

You can host this on any server with a fixed public IP (AWS EC2, Google Cloud, DigitalOcean Droplet, Hetzner, etc.).

#### 1. Clone and install

```bash
git clone https://github.com/Casper-Tech-ke/casper-scraper.git
cd casper-scraper
npm install -g pnpm
pnpm install
```

#### 2. Install system dependencies

```bash
# Python 3.10+ (for yt-dlp)
sudo apt install python3 python3-pip -y

# Download yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /home/$USER/yt-dlp
chmod +x /home/$USER/yt-dlp
```

#### 3. Set environment variables

Create a `.env` file or export these in your shell / process manager:

```env
PORT=8080
NODE_ENV=production
SESSION_SECRET=your-long-random-secret-here
```

#### 4. Build and start

```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

The app will be available at `http://your-server-ip:8080/scraper-ui/`

#### 5. Run as a system service (optional)

Create `/etc/systemd/system/casper-scraper.service`:

```ini
[Unit]
Description=CASPER TECH DEVS Scraper
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/casper-scraper
ExecStart=/usr/bin/node artifacts/api-server/dist/index.mjs
Restart=on-failure
Environment=PORT=8080
Environment=NODE_ENV=production
Environment=SESSION_SECRET=your-secret-here

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable casper-scraper
sudo systemctl start casper-scraper
```

#### 6. Reverse proxy with Nginx (optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        # Required for video streaming (large responses, no buffering)
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}
```

Then add SSL with Certbot:

```bash
sudo certbot --nginx -d yourdomain.com
```

---

### Production Notes

| Topic | Detail |
|---|---|
| **IP locking** | YouTube CDN URLs are tied to the server IP. The server that runs yt-dlp must also proxy the stream. Do not put the stream proxy behind a load balancer with multiple IPs. |
| **yt-dlp path** | The server expects yt-dlp at `/home/runner/yt-dlp`. Override by setting `YTDLP_PATH` env var. |
| **Stream URL expiry** | Resolved stream URLs expire in ~6 hours. Users must re-search to get fresh playable URLs. |
| **Proxy pool** | The free proxy pool is validated at startup. In production, expect ~20–40% of proxies to be active at any time. |
| **Memory** | yt-dlp resolution uses ~50 MB per concurrent resolve. Limit `MAX_PARALLEL_RESOLVE` in `scrape.ts` if memory is constrained. |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/scrape/images?text=&count=` | Search Yandex Images |
| GET | `/api/scrape/videos?text=&count=` | Search Yandex Videos + resolve YouTube streams |
| GET | `/api/stream?url=` | Proxy a YouTube CDN stream URL |
| GET | `/api/docs` | API documentation JSON |

Full interactive docs available at `/scraper-ui/docs` in the running app.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on submitting issues and pull requests.

## Security

See [SECURITY.md](./SECURITY.md) for our responsible disclosure policy.

## License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for full terms.

---

© 2025 CASPER TECH DEVS. Built with ❤️ by the team.
