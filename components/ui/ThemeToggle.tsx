"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

/**
 * A single icon button that flips between light and dark. The sun and moon
 * cross-fade with a quarter-turn so the switch reads as one motion. Server
 * renders the empty frame (theme unknown) and the client fills in the icon
 * on first paint — no hydration mismatch, no setState in an effect.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <SunIcon
        className={cn(
          "absolute size-[1.05rem] transition-all duration-300",
          mounted && !isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0",
        )}
      />
      <MoonIcon
        className={cn(
          "absolute size-[1.05rem] transition-all duration-300",
          isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0",
        )}
      />
    </button>
  );
}
