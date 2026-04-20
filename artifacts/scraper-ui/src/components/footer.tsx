import { Github, Code2, Heart } from "lucide-react";

interface Contributor {
  name: string;
  role: "creator" | "helper";
  github: string;
}

const TEAM: Contributor[] = [
  { name: "TRABY CASPER", role: "creator", github: "https://github.com/Casper-Tech-ke" },
  { name: "Keith", role: "helper", github: "https://github.com/kkeizza" },
  { name: "Silent Wolf", role: "helper", github: "https://github.com/SilentWolf-Kenya" },
];

export function Footer() {
  const creator = TEAM.find((t) => t.role === "creator")!;
  const helpers = TEAM.filter((t) => t.role === "helper");

  return (
    <footer className="border-t border-border/30 bg-card/60 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="h-4 w-4 text-primary" />
              <span className="font-black text-primary tracking-tight">CASPER TECH DEVS</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A high-performance image &amp; video scraper powered by Yandex search,
              free rotating proxies, and YouTube stream resolution via yt-dlp.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Creator</h4>
            <a
              href={creator.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors group"
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Github className="h-3.5 w-3.5 text-primary" />
              </div>
              {creator.name}
            </a>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Helped by
            </h4>
            <div className="flex flex-col gap-2">
              {helpers.map((h) => (
                <a
                  key={h.github}
                  href={h.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors group"
                >
                  <div className="h-7 w-7 rounded-full bg-muted/60 border border-border/40 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                    <Github className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  {h.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/20 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
          <span>© {new Date().getFullYear()} CASPER TECH DEVS. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-red-400 mx-0.5 fill-red-400" /> by the team
          </span>
        </div>
      </div>
    </footer>
  );
}
