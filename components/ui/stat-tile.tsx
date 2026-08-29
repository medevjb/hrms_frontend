import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
} as const;

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "violet",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", TONE_CLASSES[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
