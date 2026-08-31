"use client";

import { AlarmClockIcon, CalendarCheckIcon, ClipboardCheckIcon, UsersRoundIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDashboard } from "@/services/dashboard";

import { WorkforcePanel } from "./management/WorkforcePanel";
import { AttendanceTodayPanel } from "./management/AttendanceTodayPanel";
import { PendingApprovalsPanel } from "./management/PendingApprovalsPanel";
import { PeopleMovementPanel } from "./management/PeopleMovementPanel";
import { PayrollPanel } from "./management/PayrollPanel";
import { AnnouncementsPanel } from "./management/AnnouncementsPanel";

export function ManagementDashboard() {
  const { data: dashboard, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Employee Manage Dashboard" description="The state of your teams, right now." />
        <PageLoadingSkeleton />
      </>
    );
  }

  const widgets = dashboard?.widgets;
  const approvals = widgets?.pending_approvals;
  const attendance = widgets?.attendance_today;
  const workforce = widgets?.workforce;

  const hasAnyPanel = Boolean(
    workforce || attendance || approvals || widgets?.people_movement || widgets?.payroll || widgets?.announcements,
  );

  const approvalTotal = approvals
    ? Object.values(approvals).reduce((sum, n) => sum + (n ?? 0), 0)
    : null;

  return (
    <>
      <PageHeader
        title="Employee Manage Dashboard"
        description="The state of your teams, right now."
      />

      {!hasAnyPanel ? (
        <EmptyState
          title="Nothing to manage here yet"
          description="Once you're set up to approve requests or view a team, this dashboard fills in."
        />
      ) : (
        <div className="space-y-6">
          {(workforce || attendance || approvalTotal !== null) && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              {workforce && (
                <StatTile
                  label="Headcount"
                  value={workforce.total}
                  icon={UsersRoundIcon}
                  tone="violet"
                  subtext={`${workforce.active} active`}
                />
              )}
              {attendance && (
                <StatTile
                  label="Present today"
                  value={attendance.present}
                  icon={CalendarCheckIcon}
                  tone="emerald"
                  subtext={`${attendance.late} late · ${attendance.absent} absent`}
                />
              )}
              {attendance && (
                <StatTile
                  label="On leave today"
                  value={attendance.on_leave_today.length}
                  icon={AlarmClockIcon}
                  tone="amber"
                />
              )}
              {approvalTotal !== null && (
                <StatTile
                  label="Waiting on you"
                  value={approvalTotal}
                  icon={ClipboardCheckIcon}
                  tone="blue"
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {approvals && <PendingApprovalsPanel approvals={approvals} />}
            {attendance && <AttendanceTodayPanel attendance={attendance} />}
            {workforce && <WorkforcePanel workforce={workforce} />}
            {widgets?.people_movement && <PeopleMovementPanel movement={widgets.people_movement} />}
            {widgets?.payroll && <PayrollPanel payroll={widgets.payroll} />}
            {widgets?.announcements && <AnnouncementsPanel announcements={widgets.announcements} />}
          </div>
        </div>
      )}
    </>
  );
}
