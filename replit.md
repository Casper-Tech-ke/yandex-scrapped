# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

**Product**: CASPER TECH DEVS — Image & Video Scraper  
**Provider**: CASPER TECH DEVS | **Creator**: TRABY CASPER | **Helped by**: Keith

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (artifacts/scraper-ui), TailwindCSS v4

## Architecture

- `artifacts/api-server` — Express API at port 8080 (→ proxy port 80). Handles `/api/*` routes.
  - In development, **also spawns the Vite dev server** (`artifacts/scraper-ui`) as a child process on port 22742 and proxies all `/scraper-ui/*` traffic to it via `http-proxy-middleware`.
  - This is necessary because only ports 8080 and 8081 are registered in `.replit`; Vite's allocated port (22742) is invisible to the Replit proxy.
- `artifacts/scraper-ui` — React + Vite frontend at `/scraper-ui/`. The workflow shows as "failed" (expected — the Vite process is managed by api-server instead).
- `artifacts/mockup-sandbox` — Canvas design sandbox at port 8081.

## Key Features

- **Image search**: Yandex Images scraper → returns Yandex CDN URLs (avatars.mds.yandex.net)
- **Video search**: Yandex Videos scraper → YouTube results auto-enriched with direct CDN stream URLs via yt-dlp (Python 3.10)
- **Stream resolution**: MAX_PARALLEL_RESOLVE=6 parallel batches; best=1080p, medium=360p
- **Branding middleware**: all JSON responses include `provider` + `creator` fields

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally (also starts Vite)

## Key Files

- `artifacts/api-server/src/app.ts` — branding middleware, /scraper-ui/ Vite proxy
- `artifacts/api-server/src/index.ts` — spawns Vite dev server as child process
- `artifacts/api-server/src/routes/scrape.ts` — image/video routes, stream URL enrichment
- `artifacts/api-server/src/lib/videoResolver.ts` — yt-dlp subprocess
- `artifacts/scraper-ui/src/pages/home.tsx` — main UI with search, tabs, grid, footer
- `artifacts/scraper-ui/vite.config.ts` — reads PORT + BASE_PATH env vars

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
