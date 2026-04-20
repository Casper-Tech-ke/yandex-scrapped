import { useState } from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Image as ImageIcon,
  Film,
  BookOpen,
  Github,
  ExternalLink,
} from "lucide-react";

interface Helper {
  name: string;
  github: string;
}

const HELPERS: Helper[] = [
  { name: "TRABY CASPER", github: "https://github.com/Casper-Tech-ke" },
  { name: "Keith", github: "https://github.com/kkeizza" },
  { name: "Silent Wolf", github: "https://github.com/SilentWolf-Kenya" },
];

interface NavDropdownProps {
  onTabChange?: (tab: "images" | "videos") => void;
}

export function NavDropdown({ onTabChange }: NavDropdownProps) {
  const [, navigate] = useLocation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-border/40 bg-card/50">
          <Menu className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 bg-card border-border/40">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Search
        </DropdownMenuLabel>

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => {
            navigate("/");
            onTabChange?.("images");
          }}
        >
          <ImageIcon className="h-4 w-4 text-blue-400" />
          <span>Images</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => {
            navigate("/");
            onTabChange?.("videos");
          }}
        >
          <Film className="h-4 w-4 text-red-400" />
          <span>Videos</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/30" />
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Docs
        </DropdownMenuLabel>

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => navigate("/docs")}
        >
          <BookOpen className="h-4 w-4 text-green-400" />
          <span>API Reference</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/30" />
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Team on GitHub
        </DropdownMenuLabel>

        {HELPERS.map((h) => (
          <DropdownMenuItem key={h.github} asChild>
            <a
              href={h.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Github className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{h.name}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
