import { Link } from "wouter";
import { ArrowLeft, Shield, FileText, Users, Lock } from "lucide-react";

const YEAR = new Date().getFullYear();

export default function Legal() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-primary leading-none">
              CASPER TECH DEVS
            </span>
            <span className="text-xs text-muted-foreground">Legal & Policies</span>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight mb-2">Legal & Policies</h1>
        <p className="text-muted-foreground text-sm mb-10">
          Last updated: April {YEAR} · CASPER TECH DEVS
        </p>

        {/* MIT License */}
        <section id="license" className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold">MIT License</h2>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-6 text-sm leading-relaxed font-mono text-muted-foreground whitespace-pre-wrap">
{`MIT License

Copyright (c) ${YEAR} CASPER TECH DEVS
Creator: TRABY CASPER

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`}
          </div>
        </section>

        {/* Privacy Policy */}
        <section id="privacy" className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Privacy Policy</h2>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              CASPER TECH DEVS — Image & Video Scraper does not collect, store, or sell any personal
              data. This tool is a search interface and stream proxy; it does not require account
              registration or login.
            </p>
            <h3 className="text-foreground font-semibold mt-6 mb-2">What we do not collect</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>No names, emails, or personal identifiers</li>
              <li>No search queries are stored after the request completes</li>
              <li>No cookies or tracking pixels are used</li>
              <li>No third-party analytics are embedded</li>
            </ul>
            <h3 className="text-foreground font-semibold mt-6 mb-2">Third-party services</h3>
            <p>
              Search results are sourced from <strong>Yandex Images & Video</strong> and streamed
              from <strong>YouTube CDN</strong>. By using this tool you interact with these services,
              which have their own privacy policies. We act only as a proxy and do not retain any
              content or metadata beyond the lifetime of your request.
            </p>
            <h3 className="text-foreground font-semibold mt-6 mb-2">Stream proxy</h3>
            <p>
              The <code className="text-primary bg-primary/10 px-1 rounded">/api/stream</code> endpoint
              proxies YouTube CDN URLs through our server to enable in-browser playback.
              Only URLs from an explicit allowlist of trusted CDN hostnames are proxied.
              No content is cached or logged beyond server access logs retained for
              security purposes for up to 7 days.
            </p>
          </div>
        </section>

        {/* Acceptable Use */}
        <section id="use" className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Acceptable Use Policy</h2>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              This tool is provided for personal, educational, and research use. By using it, you agree not to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Scrape at rates that degrade service for other users</li>
              <li>Circumvent copyright protection systems or DRM</li>
              <li>Redistribute copyrighted content without permission from the rights holder</li>
              <li>Use the stream proxy to serve malicious or illegal content</li>
              <li>Automate bulk downloads of third-party copyrighted media</li>
            </ul>
            <p className="mt-4">
              Content scraped through this tool is subject to the terms of service of the
              originating platforms (Yandex, YouTube, etc.). Users are solely responsible
              for how they use the content they retrieve.
            </p>
          </div>
        </section>

        {/* Contributing */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Contributing & Security</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              This project is open source under the MIT license. Contributions, bug reports,
              and feature suggestions are welcome via GitHub.
            </p>
            <p>
              To report a security vulnerability, please do not open a public issue. Instead,
              contact the maintainer directly via a{" "}
              <a
                href="https://github.com/Casper-Tech-ke/casper-scraper/security/advisories/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                private security advisory
              </a>{" "}
              on GitHub.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="https://github.com/Casper-Tech-ke/casper-scraper/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
              >
                <Users className="h-3 w-3" /> CONTRIBUTING.md
              </a>
              <a
                href="https://github.com/Casper-Tech-ke/casper-scraper/blob/main/SECURITY.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
              >
                <Shield className="h-3 w-3" /> SECURITY.md
              </a>
              <a
                href="https://github.com/Casper-Tech-ke/casper-scraper/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
              >
                <FileText className="h-3 w-3" /> LICENSE
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/30 bg-card/60 py-6 text-center text-xs text-muted-foreground/60">
        © {YEAR} CASPER TECH DEVS. Released under the MIT License.
      </footer>
    </div>
  );
}
