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
