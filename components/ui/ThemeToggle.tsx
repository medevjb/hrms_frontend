"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const noop = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // Server renders the placeholder, the client swaps in the real control on
  // first paint — avoids a hydration mismatch on the theme-dependent classes
  // without a setState-in-effect.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className={cn("inline-flex items-center rounded-full bg-muted/60 p-1 text-xs", className)}>
        <div className="size-6 rounded-full bg-background/80 shadow-xs" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/70 p-1 text-xs transition-colors",
        className
      )}
      role="radiogroup"
      aria-label="Theme switcher"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-all duration-200",
          !isDark
            ? "bg-card text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <SunIcon className="size-3.5 text-amber-500" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-all duration-200",
          isDark
            ? "bg-card text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MoonIcon className="size-3.5 text-indigo-400" />
        <span>Dark</span>
      </button>
    </div>
  );
}
