import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  violet: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 border border-violet-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20",
  blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20",
  rose: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20",
} as const;

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "violet",
  subtext,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof TONE_CLASSES;
  subtext?: string;
}) {
  return (
    <div className="group flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105", TONE_CLASSES[tone])}>
        <Icon className="size-5.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        {subtext && <p className="truncate text-[11px] text-muted-foreground/80">{subtext}</p>}
      </div>
    </div>
  );
}

