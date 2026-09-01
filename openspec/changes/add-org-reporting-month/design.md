## Context

See proposal.md — Why. Constraints that shape the approach:

- Frontend (`freetown`, this repo) and backend (`hrms/backend`) are separate repos. Backend already has `payroll_cutoff_day` on `OrganizationSettings` and `PayrollService::createPeriod` derives `start = end->subMonthNoOverflow()->addDay()` from it — the exact semantics we want, but private to payroll.
- Frontend month math is scattered: `features/attendance/AttendanceCalendarView.tsx` uses `startOfMonth/endOfMonth`; `features/dashboard/utils.ts` (`generateMonthCalendarDays`) builds a grid + stats from `startOfMonth/endOfMonth`; `features/calendar/*`, reports, and leave each do their own range math. There is no shared "current month" helper.
- The organization's authoritative "today" already comes from the server (`attendance/today.work_date`, `me` payloads) in the org timezone. Client clock is never trusted for date boundaries.
- Data fetching is React Query with keys that currently embed `monthFrom`/`monthTo` strings.

## Goals / Non-Goals

**Goals:**

- One resolver, shared semantics, used by every month-scoped surface and by payroll defaults.
- Backend stays the source of truth for boundaries; frontend can resolve locally for snappy navigation but agrees byte-for-byte with the backend.
- Changing the cutoff takes effect on next fetch/reload with no deploy and no stale cache.

**Non-Goals:**

- Per-department or per-employee reporting periods (org-wide only).
- Arbitrary per-month manual date overrides — the cutoff is a single rule applied uniformly.
- Reprocessing or migrating historical payroll periods already created under the old convention.
- Changing how the org's "current date"/timezone is resolved.

## Decisions

### 1. New dedicated setting `reporting_month_cutoff_day`, not reuse of `payroll_cutoff_day`

Per the user: the platform must be consistent first, then payroll follows. `payroll_cutoff_day` stays as an optional payroll override. When it is null, `PayrollService` falls back to `reporting_month_cutoff_day`. This keeps payroll's ability to diverge (some orgs cut payroll earlier than the reporting window) without forcing it.

- Alternative — promote `payroll_cutoff_day` to the single value: rejected; it removes payroll's independent override and muddies the migration for orgs already using it.

### 2. Period identified by end month; label = end month name

Matches the existing `PayrollService` label (`Carbon::create($year,$month,1)->isoFormat('MMMM YYYY')` where `$month` is the end month). Cutoff 25 → the window ending 25 Sep is "September". `key = "YYYY-MM"` of the end month is the React Query cache key and the URL/query param for navigation.

### 3. Max cutoff 28

Same clamp the backend already uses (`min($cutoffDay, 28)`, validation `max:28`). Avoids "30th of February" ambiguity and keeps every period contiguous without overflow rules. Documented in the setting's help text.

### 4. Shared resolver in both repos, backend authoritative

- Frontend: `lib/reporting-period.ts` — pure functions over `date-fns`:
  - `resolvePeriod(refDateISO, cutoff: number | null): { key, label, startDate, endDate }`
  - `currentPeriod(orgTodayISO, cutoff)`, `stepPeriod(period, ±1, cutoff)`
  - `periodContains(period, dateISO)`
- Backend: a `ReportingPeriod` value object (or static helpers on a `ReportingPeriodService`) with the same three operations, reused by attendance/dashboard/report/leave query scoping and by `PayrollService::createPeriod` for its default.
- The organization-settings API response includes the **resolved current period** (`reporting_period: { key, label, start_date, end_date }`) so first paint needs no client math; the client resolver is only for prev/next navigation and is verified against backend responses in tests.

### 5. Cutoff enters the client via existing settings/me payloads; cache keys include it

`reporting_month_cutoff_day` (and the resolved current period) ride on the organization-settings query and, for convenience on employee surfaces, on the `me`/branding payload already fetched app-wide. Every month-scoped React Query key changes from `[..., monthFrom, monthTo]` to `[..., periodKey, cutoff]` so a cutoff change is a new key → fresh fetch. A small `useReportingPeriod()` hook centralizes reading the cutoff + producing the active period from a selected `periodKey`.

### 6. Backend endpoints resolve "current month" server-side

List/report/dashboard endpoints that defaulted to the calendar month switch to `ReportingPeriod::current($settings)`. Where a client passes an explicit `period` key, the controller resolves it to `start_date`/`end_date`; explicit `date_from`/`date_to` still override for custom ranges. Responses echo the resolved period so headers/labels match.

### 7. Navigation controls step periods, grids may span the period

Month pickers/prev-next step by reporting period and show the period label. The attendance calendar grid renders the actual days in `start_date..end_date` (which can straddle two calendar months and ~28–31 days); `generateMonthCalendarDays` is generalized from `(currentDate)` to `(startISO, endISO, todayKey, ...)` and its `isCurrentMonth` notion becomes `isInPeriod`.

## Risks / Trade-offs

- **Wide blast radius — many surfaces, easy to miss one** → Centralize on the resolver + `useReportingPeriod` hook; grep for `startOfMonth`/`endOfMonth`/`monthFrom` and the tasks list enumerates each call site; add a lint note. A missed surface degrades to calendar month (visibly wrong totals) rather than crashing.
- **Frontend/backend resolver drift** → Backend is authoritative and echoes the resolved period on responses; frontend resolver has a table-driven test mirroring the backend's, and UI prefers the server-echoed period over local math where both exist.
- **Historical data spanning the boundary shift** → Records are dated by `work_date`/event date and re-bucket automatically; only already-created payroll periods keep their old boundaries (acceptable, non-goal to migrate).
- **DST / timezone at day granularity** → All boundaries are `YYYY-MM-dd` compared as strings against the org-timezone "today"; no wall-clock arithmetic.
- **Cutoff 28 surprises users expecting month-end** → Help text explains "26–28 recommended; the day the period ends"; null = calendar month for the common case.
- **Leave accrual / carry-forward tied to `leave_year_start_month`** → Out of scope here; leave *year* boundaries are unchanged, only the monthly usage window shown to employees adopts the period. Note in tasks to confirm no double-shift.

## Migration Plan

1. Backend: additive migration (`reporting_month_cutoff_day` nullable, default null) → behavior identical to today (calendar months) until an admin sets it.
2. Backend: ship resolver + adopt in read paths + `PayrollService` default; deploy.
3. Frontend: ship `lib/reporting-period.ts`, `useReportingPeriod`, settings card, and convert surfaces; deploy.
4. Admin sets the cutoff when both sides are live. No data backfill.
5. Rollback: unset the cutoff (→ calendar months everywhere) without a deploy; code paths are backward-compatible with `null`.

## Open Questions

- Should the organization-settings response embed the resolved period, or should there be a dedicated lightweight `GET /reporting-period?ref=<date>` for navigation? (Either works; leaning embed + client resolver. Does not affect specs or task breakdown.)
- Does any external/reporting export consumer depend on calendar-month grouping and need a compatibility flag? To confirm during implementation with the reports owner.
