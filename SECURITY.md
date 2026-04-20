# Security Policy

## Supported Versions

We actively maintain the latest version of this project. Only the `main` branch receives security patches.

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ |
| Older branches | ❌ |

---

## Responsible Disclosure

If you discover a security vulnerability in this project, please **do not** open a public GitHub issue. Instead, report it privately so we can address it before public disclosure.

**How to report:**

1. Email the maintainer or open a [private security advisory](https://github.com/Casper-Tech-ke/casper-scraper/security/advisories/new) on GitHub.
2. Include:
   - A description of the vulnerability
   - Steps to reproduce it
   - Its potential impact
   - Any suggested mitigations (optional but appreciated)

We will acknowledge your report within **72 hours** and aim to release a fix within **14 days** for critical issues.

---

## Scope

Issues we consider in-scope:
- Remote code execution
- Server-side request forgery (SSRF) via the stream proxy
- Authentication bypass (if auth is added in future)
- Sensitive data exposure via API responses
- Dependency vulnerabilities with a known exploit

Out of scope:
- Rate-limiting / DoS without an authentication bypass
- Issues requiring physical access to the server
- Theoretical vulnerabilities without a proof-of-concept

---

## Stream Proxy Security

The `/api/stream` endpoint only proxies URLs from an explicit allowlist of CDN hostnames (`googlevideo.com`, `ytimg.com`, etc.). Arbitrary URL proxying is intentionally blocked. If you find a bypass, please report it immediately.

---

## Dependencies

We keep dependencies up to date. You can audit them at any time:

```bash
pnpm audit
```

---

## Contact

**Maintainer:** TRABY CASPER — [GitHub](https://github.com/Casper-Tech-ke)

Thank you for helping keep this project secure.
