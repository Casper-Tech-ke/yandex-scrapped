# Contributing to CASPER TECH DEVS — Image & Video Scraper

Thank you for your interest in contributing! We welcome bug reports, feature ideas, and pull requests.

---

## Code of Conduct

Be respectful and constructive. We expect all contributors to treat each other with professionalism and kindness.

---

## Reporting Bugs

1. Search [existing issues](https://github.com/Casper-Tech-ke/casper-scraper/issues) first to avoid duplicates.
2. Open a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs. actual behaviour
   - Your environment (OS, Node version, browser)
   - Relevant logs or screenshots

---

## Suggesting Features

Open an issue with the label **`enhancement`** and describe:
- The problem you want to solve
- Your proposed solution
- Any alternatives you considered

---

## Pull Requests

1. **Fork** the repository and create a feature branch off `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Make your changes** following the existing code style:
   - TypeScript strict mode
   - No `any` types unless strictly necessary
   - Prefer named exports
   - Keep components small and focused

4. **Test your changes:**
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

5. **Commit** with a clear message:
   ```
   feat: add Instagram scraper support
   fix: handle HLS manifest URLs correctly
   docs: update API reference
   ```

6. **Open a pull request** targeting `main` with:
   - A description of what changed and why
   - Screenshots for UI changes
   - Reference to any related issue (e.g. `Closes #42`)

---

## Project Structure

```
/
├── artifacts/
│   ├── api-server/     # Express backend + yt-dlp integration
│   └── scraper-ui/     # React + Vite frontend
├── lib/                # Shared utilities
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
└── README.md
```

---

## Local Development Tips

- The API server spawns the Vite frontend automatically in development.
- yt-dlp is downloaded automatically on first start to `/home/runner/yt-dlp`.
- Proxy pool validation runs at startup — failures are non-fatal.
- Stream URLs expire in ~6 hours; re-search to get fresh ones.

---

## Contact

**Creator:** TRABY CASPER — [GitHub](https://github.com/Casper-Tech-ke)

Questions? Open an issue or reach out via GitHub.
