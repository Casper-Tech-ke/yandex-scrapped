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

> **⚠️ IP-Lock Notice:** YouTube CDN stream URLs are tied to the **exact server IP** that ran yt-dlp. The same IP must also serve the `/api/stream` proxy. Platforms that rotate or share outbound IPs (serverless, Heroku free dynos) will cause stream 403 errors. Use a fixed-IP plan where possible.

---

### Replit (Recommended)

The easiest one-click deployment, fully integrated with the project.

1. Open your project on [Replit](https://replit.com)
2. Click **Deploy** in the top-right corner
3. Choose **Reserved VM** ← required for a fixed IP and reliable streaming
4. Click **Deploy** — Replit builds and publishes to `your-app.replit.app` automatically

yt-dlp is downloaded automatically on first boot. No extra config needed.

> **Autoscale vs Reserved VM:** Autoscale spins up containers on demand and may use different IPs per request, breaking the YouTube CDN IP-lock. **Reserved VM** keeps a single fixed IP — use this for production.

---

### Render

Render supports the included `render.yaml` Blueprint for one-click deployment.

#### Option A — Blueprint (easiest)

1. Fork this repo to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render detects `render.yaml` automatically
4. Add your `SESSION_SECRET` environment variable when prompted
5. Click **Apply** — Render builds and deploys

#### Option B — Manual Web Service

1. **New** → **Web Service** → connect your GitHub repo
2. Set the following:

| Field | Value |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm install -g pnpm && pnpm install && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /home/render/yt-dlp && chmod +x /home/render/yt-dlp && BASE_PATH=/scraper-ui/ pnpm --filter @workspace/scraper-ui run build && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node artifacts/api-server/dist/index.mjs` |
| **Health Check Path** | `/api/health` |

3. Add environment variables under **Environment**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `YTDLP_PATH` | `/home/render/yt-dlp` |
| `SESSION_SECRET` | *(generate a random string)* |

4. Click **Create Web Service**

> **Render IP note:** Render **Starter** plan instances have a stable outbound IP per region. Streaming should work reliably. The free tier may have cold starts that invalidate cached stream URLs.

Once deployed, your app is live at `https://casper-scraper.onrender.com/scraper-ui/`

---

### Heroku

> **⚠️ Heroku IP warning:** Standard Heroku dynos use **shared, rotating IPs**. YouTube CDN will 403 stream requests after a dyno restart or cycling. Use Heroku's [Static IP add-on](https://elements.heroku.com/addons/fixie) (Fixie or QuotaGuard) to get a fixed outbound IP if you need reliable streaming.

#### 1. Install the Heroku CLI

```bash
curl https://cli-assets.heroku.com/install.sh | sh
heroku login
```

#### 2. Create the app and set buildpacks

```bash
heroku create your-app-name

# Add both Node.js and Python buildpacks (Python is needed for yt-dlp)
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
```

#### 3. Set environment variables

```bash
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -hex 32)
heroku config:set YTDLP_PATH=/app/yt-dlp
```

#### 4. Deploy

```bash
git push heroku main
heroku open
```

Your app will be at `https://your-app-name.herokuapp.com/scraper-ui/`

The included `Procfile` and `heroku-postbuild` script handle everything automatically:
- Downloads yt-dlp to `/app/yt-dlp`
- Builds the scraper-ui frontend
- Builds the api-server

> **Note:** Heroku's ephemeral filesystem resets on each dyno restart. yt-dlp is re-downloaded automatically via the `heroku-postbuild` hook, which Heroku runs on every deploy. Between deploys, the server also auto-downloads it at startup if the binary is missing.

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
