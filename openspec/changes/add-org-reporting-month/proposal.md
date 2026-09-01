## Why

The platform treats a "month" as the calendar month (1st → last day) in every calendar, dashboard, report, and list filter, but the business runs on a shifted cycle — e.g. "September" is 26 Aug → 25 Sep. Payroll already supports this privately via `payroll_cutoff_day`, so payroll totals and the rest of the product disagree about what a given month contains. Admins need one setting that redefines the reporting month everywhere so that every count, calendar, analytic, and API response lines up.

## What Changes

- Add an **org-wide reporting-month setting** (a single cutoff day, 1–28) editable only from the admin Settings panel. When set, reporting month *M* spans `(cutoff+1) of M-1` → `cutoff of M`; when blank, it stays the calendar month. Labeling follows the period end month (cutoff 25 → the period ending 25 Sep is "September"), matching the existing payroll convention.
- Introduce a **shared reporting-period resolver** (frontend util + backend contract) that maps a reference date to its period, produces `{ key, label, start_date, end_date }`, and steps to previous/next periods. All month math routes through it.
- **Adopt the reporting period platform-wide**: attendance calendar + month list, self & management dashboards ("this month" stats, attendance calendar card, leave-balance card), reports/analytics date ranges and grouping, leave usage/accrual windows, holiday & personal-event calendars, and every list endpoint's default month filter. Month navigation controls step between reporting periods and label them by period.
- **Align payroll**: payroll period creation uses the org reporting cutoff as its default so a payroll period and the rest of the product cover identical dates. `payroll_cutoff_day` becomes an override that defaults to the reporting cutoff. **BREAKING** for any client reading `payroll_cutoff_day` as authoritative.
- Backend contract (implemented in the separate `hrms/backend` repo, tracked by a matching change there): new fields on the organization-settings resource, a settings write path gated to the admin permission, and period-aware date handling in attendance / dashboard / report / leave controllers. This proposal defines the API shape the frontend depends on.

## Capabilities

### New Capabilities

- `reporting-period`: The organization-wide custom reporting month — the admin setting, the date→period resolver semantics (boundaries, labeling, current-period derivation, prev/next stepping), and the requirement that every date-scoped view, aggregate, calendar, and API default filter across the platform is computed against the active reporting period rather than the calendar month.

### Modified Capabilities

<!-- No existing specs under openspec/specs/; all behavior here is new. -->

## Impact

- **Frontend**
  - New: `lib/reporting-period.ts` (resolver), `features/settings` reporting-month card, `types/settings.ts` fields, `services/settings.ts` accessor.
  - Changed: `features/attendance/AttendanceCalendarView.tsx`, `features/attendance/AttendanceMonthList.tsx`, `features/calendar/*`, `features/dashboard/*` (SelfDashboard, ManagementDashboard, `components/AttendanceCalendarCard`, `components/LeaveBalanceCard`, `components/TopStatCards`, `features/dashboard/utils.ts` month grid + stats), `features/reports/*`, `features/leave/*`, `features/holidays/*`, `features/personal-events/*`.
  - Query keys that embed `monthFrom/monthTo` now embed the period key; React Query caches invalidate when the setting changes.
- **Backend (separate repo, matching change)**
  - `OrganizationSettings` migration + resource fields; `SettingsController` organization keys + admin permission gate.
  - New shared `ReportingPeriod` value object / service; adopted by attendance, dashboard, reports, leave, and `PayrollService::createPeriod` defaults.
  - API: `GET/PUT /settings/organization` gains the fields; attendance/dashboard/report/leave endpoints resolve "current month" via the reporting period; responses may include the resolved `{ key, label, start_date, end_date }` for the frontend to display.
- **Docs**: `docs/PRD.md` sections for attendance/dashboard/reports/payroll reference the reporting period.
