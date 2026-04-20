import { Link } from "wouter";
import { Github, Code2, Heart, FileText, Shield, Users, BookOpen } from "lucide-react";

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

const LEGAL_LINKS = [
  { label: "License", icon: FileText, href: "/legal#license" },
  { label: "Privacy", icon: Shield, href: "/legal#privacy" },
  { label: "Acceptable Use", icon: Users, href: "/legal#use" },
];

const REPO_LINKS = [
  {
    label: "GitHub",
    icon: Github,
    href: "https://github.com/Casper-Tech-ke/casper-scraper",
    external: true,
  },
  {
    label: "Contributing",
    icon: Users,
    href: "https://github.com/Casper-Tech-ke/casper-scraper/blob/main/CONTRIBUTING.md",
    external: true,
  },
  {
    label: "Security",
    icon: Shield,
    href: "https://github.com/Casper-Tech-ke/casper-scraper/blob/main/SECURITY.md",
    external: true,
  },
  { label: "API Docs", icon: BookOpen, href: "/docs", external: false },
];

export function Footer() {
  const creator = TEAM.find((t) => t.role === "creator")!;
  const helpers = TEAM.filter((t) => t.role === "helper");

  return (
    <footer className="border-t border-border/30 bg-card/60 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="h-4 w-4 text-primary" />
              <span className="font-black text-primary tracking-tight">CASPER TECH DEVS</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              High-performance image &amp; video scraper powered by Yandex, rotating proxies, and
              YouTube stream resolution.
            </p>
          </div>

          {/* Team */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Team
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href={creator.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors group"
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Github className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>
                  {creator.name}
                  <span className="ml-1 text-[10px] text-primary/70 font-normal">creator</span>
                </span>
              </a>
              {helpers.map((h) => (
                <a
                  key={h.github}
                  href={h.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors group"
                >
                  <div className="h-7 w-7 rounded-full bg-muted/60 border border-border/40 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                    <Github className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  {h.name}
                </a>
              ))}
            </div>
          </div>

          {/* Repo */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Project
            </h4>
            <div className="flex flex-col gap-2">
              {REPO_LINKS.map((l) => (
                l.external ? (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <l.icon className="h-3.5 w-3.5" />
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <l.icon className="h-3.5 w-3.5" />
                    {l.label}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Legal
            </h4>
            <div className="flex flex-col gap-2">
              {LEGAL_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <l.icon className="h-3.5 w-3.5" />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/20 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
          <span>© {new Date().getFullYear()} CASPER TECH DEVS. MIT License.</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-red-400 mx-0.5 fill-red-400" /> by the team
          </span>
        </div>
      </div>
    </footer>
  );
}
