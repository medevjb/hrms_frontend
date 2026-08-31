import Link from "next/link";
import { ArrowRightIcon, LayoutGridIcon, UserRoundIcon } from "lucide-react";

/**
 * Landing hub for management roles. Not onboarding — there's no stored
 * choice; picking a side just navigates there, and coming back here lets
 * them switch. Each card previews the character of where it leads: the
 * personal side calm and single-track, the management side a dense grid.
 */
export function DashboardChooser({ firstName }: { firstName: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center py-10">
      <div className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Dashboard</p>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          Where to, {firstName}?
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a view. You can come back here any time from the sidebar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/me"
          className="group flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="space-y-4">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserRoundIcon className="size-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-heading text-lg font-bold text-foreground">
                Self Employee Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Your shift, attendance calendar, leave balances, payslips and requests.
              </p>
            </div>
            <div className="flex gap-1.5">
              {["Today", "Calendar", "Leave"].map((label) => (
                <span
                  key={label}
                  className="rounded-lg bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Open my dashboard
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/manage"
          className="group flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="space-y-4">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <LayoutGridIcon className="size-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-heading text-lg font-bold text-foreground">
                Employee Manage Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Headcount, attendance, and the approvals waiting on you — across your teams.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {["Workforce", "Attendance", "Approvals", "On leave", "Payroll", "Movement"].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-lg bg-muted/60 px-2 py-1 text-center text-[11px] font-medium text-muted-foreground"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          </div>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Open management view
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
