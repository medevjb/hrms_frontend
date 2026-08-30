import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/20",
  info: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-500/20",
  neutral: "bg-muted/80 text-muted-foreground border border-border/60",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
  warning: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
  danger: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]",
  info: "bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.4)]",
  neutral: "bg-muted-foreground/60",
};

/**
 * The recurring status language across the app — employee status, shift
 * active/inactive, holiday type, settings save state. A dot + label pill
 * rather than a solid badge: legible at a glance without shouting.
 */
export function StatusChip({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap tracking-tight transition-all",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASSES[tone])} />
      {children}
    </span>
  );
}

