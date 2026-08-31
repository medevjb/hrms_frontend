import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardAttendanceToday, DashboardOnLeave } from "@/types/dashboard";

const CELLS: Array<{ key: keyof DashboardAttendanceToday; label: string; className: string }> = [
  { key: "present", label: "Present", className: "text-emerald-600 dark:text-emerald-400" },
  { key: "late", label: "Late", className: "text-amber-600 dark:text-amber-400" },
  { key: "absent", label: "Absent", className: "text-rose-600 dark:text-rose-400" },
  { key: "on_leave", label: "On leave", className: "text-indigo-600 dark:text-indigo-400" },
  { key: "missing_checkout", label: "No checkout", className: "text-muted-foreground" },
];

function LeaveList({ title, people }: { title: string; people: DashboardOnLeave[] }) {
  if (people.length === 0) return null;
  return (
    <div className="space-y-1.5 border-t border-border/50 pt-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      {people.map((person) => (
        <div key={`${person.employee_id}-${person.until}`} className="flex items-center justify-between text-xs">
          <span className="truncate text-foreground">{person.name}</span>
          <span className="text-muted-foreground">
            {person.leave_type} · until {person.until}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AttendanceTodayPanel({ attendance }: { attendance: DashboardAttendanceToday }) {
  return (
    <Card className="border-border/70 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-heading text-base font-bold text-foreground">
          Attendance today
        </CardTitle>
        <Link href="/attendance" className="text-xs font-semibold text-primary hover:underline">
          Open attendance
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {CELLS.map((cell) => (
            <div key={cell.key} className="rounded-xl bg-muted/40 p-2 text-center">
              <p className={`font-mono text-lg font-bold ${cell.className}`}>
                {attendance[cell.key] as number}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">{cell.label}</p>
            </div>
          ))}
        </div>

        <LeaveList title="On leave today" people={attendance.on_leave_today} />
        <LeaveList title="On leave this week" people={attendance.on_leave_upcoming} />
      </CardContent>
    </Card>
  );
}
