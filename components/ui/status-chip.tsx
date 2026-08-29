import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  neutral: "bg-muted text-muted-foreground",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-blue-500",
  neutral: "bg-muted-foreground/60",
};

/**
 * The recurring status language across the app — employee status, shift
 * active/inactive, holiday type, settings save state. A dot + label pill
 * rather than a solid badge: legible at a glance without shouting, and the
 * dot color alone is enough to scan a dense table.
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASSES[tone])} />
      {children}
    </span>
  );
}
