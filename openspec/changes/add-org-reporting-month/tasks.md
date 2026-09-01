## 1. Backend contract (separate `hrms/backend` repo — matching change)

- [x] 1.1 Add migration: `reporting_month_cutoff_day` nullable unsigned tinyint (default null) on `organization_settings`; verify `php artisan migrate` succeeds and `OrganizationSettings::current()->reporting_month_cutoff_day` is null on existing rows
- [x] 1.2 Add `ReportingPeriod` value object / `ReportingPeriodService` with `resolve(refDate, ?cutoff)`, `current($settings)`, `step($period, ±1)`, `contains($period, $date)`; unit test the boundary table (cutoff 25 → 26 Aug 2026 = Sep window; cutoff null = calendar month; cutoff 28 contiguity) — mirrors spec scenarios
- [x] 1.3 Expose `reporting_month_cutoff_day` and resolved `reporting_period {key,label,start_date,end_date}` on `OrganizationSettingsResource`; add `reporting_month_cutoff_day` to `UpdateOrganizationSettingsRequest` (`nullable|integer|min:1|max:28`); the existing `updateOrganization` path (Gate `organization`) already persists the new fillable field; feature-test admin-can / non-admin-forbidden / out-of-range-rejected
- [x] 1.4 Adopt `ReportingPeriodService` as the default month range in `ReportService::dateRange` and accept `filter[period]` on reports + attendance index; keep `date_from`/`date_to` as overrides; echo the resolved period on the org-settings response. Note: attendance `index` and `DashboardService` have no server-side calendar-month default to change — the dashboard "this month" figures are computed client-side from the attendance range, so that adoption lands in the frontend tasks.
- [x] 1.5 In `PayrollService::createPeriod`, default boundaries to the reporting cutoff when `payroll_cutoff_day` is null; keep `payroll_cutoff_day` as an override; test "no override = reporting period" and "override still honored" per spec
- [x] 1.6 Update `docs/PRD.md` §85 (new setting) and §63 (payroll period fallback) to reference the reporting period

## 2. Frontend — shared resolver

- [x] 2.1 Add `lib/reporting-period.ts`: `resolvePeriod`, `periodFromKey`, `stepPeriod`, `periodContains` returning `{ key, label, startDate, endDate }`; `lib/reporting-period.test.ts` (vitest, newly added: `vitest` devDep + `vitest.config.mts` + `test` script) passes a table mirroring the backend boundary test
- [x] 2.2 Extend `types/auth.ts` `CurrentUser.organization` (SSR session payload) and `types/settings.ts` `OrganizationSettingsData` with `reporting_month_cutoff_day` + `reporting_period` (`ReportingPeriodPayload`); `tsc` passes
- [x] 2.3 Add `hooks/use-reporting-period.ts`: reads cutoff + current period from `useCurrentUser().organization`, takes an optional `initialKey`, returns `{ period, cutoff, current, isCurrent, goPrev, goNext, goToCurrent, goToKey, contains }`; stepping/default-to-current logic covered by the `lib/reporting-period` tests it delegates to

## 3. Frontend — admin Settings panel

- [x] 3.1 Add a "Reporting month cut-off day" field to `features/settings/OrganizationSettingsTab.tsx` (number input 1–28, blank = calendar month) with help text + a live "current reporting month" line; wire through `useUpdateOrganizationSettings` and `router.refresh()` so the SSR session picks up the change; server rejects `29`/`0` with a 422 (covered by backend `SettingsControllerTest`)
- [x] 3.2 The Organization tab is only reachable with `settings.manage` (`useOrganizationSettings` 403s and the nav hides it otherwise) — the field inherits that gate, no extra check needed

## 4. Frontend — attendance surfaces

- [x] 4.1 Generalized `features/dashboard/utils.ts` `generateMonthCalendarDays` to `(periodStart, periodEnd, ...)`; grid spans `startOfWeek(periodStart)`–`endOfWeek(periodEnd)`, `isSameMonth`/`startOfMonth`/`endOfMonth` dropped, `isCurrentMonth` → `isInPeriod` (also `features/dashboard/mockData.ts` + `AttendanceCalendarCard`)
- [x] 4.2 `AttendanceCalendarView.tsx` derives the range + label from `useReportingPeriod`; `AttendanceCalendarCard` header now shows `period.label` with prev/next stepping periods + a "This month" jump; React Query key is `["attendance","month",targetId,startDate,endDate]` (start/end come from the period, so a cutoff change re-keys it)
- [x] 4.3 `AttendanceMonthList.tsx` takes `title` (the period label) instead of `month: Date`; prev/next call the period steppers; the list already filtered to `monthFrom..monthTo` which are now the period bounds. (`AttendanceList` has no default month filter — user-driven only.)

## 5. Frontend — dashboards

- [x] 5.1 `SelfDashboard.tsx` uses `useReportingPeriod` for the attendance range; the only "this month" figures on the dashboard are the `AttendanceCalendarCard` legend stats (present/late/absent/working-days), now counted over the period. `TopStatCards` has no month-scoped figure (today-only KPIs).
- [x] 5.2 No change: `LeaveBalanceCard` shows leave-*year* allocation ("Allocation for {year}", YTD taken, remaining) — per the design, leave-year boundaries are unaffected. There is no "taken this month" figure on the dashboard.
- [x] 5.3 No change: `ManagementDashboard` panels have no client-side calendar-month range. `PayrollPanel` shows the backend's latest `PayrollPeriod` (already reporting-month-aligned); `PeopleMovementPanel` is a rolling 30 days; attendance/workforce panels are today/headcount. Backend `DashboardService` is today-only.

## 6. Frontend — reports, leave, calendars

- [x] 6.1 `ReportsPage.tsx`: the backend already defaults a dateless report to the current reporting month (task 1.4); the UI now shows "Defaults to {label} ({start} → {end})" under the From Date field via `useReportingPeriod`
- [x] 6.2 No change: `features/leave/*` is leave-year (`LeaveBalancePanel`) or explicit-filter (`LeaveRequestsList` dates default to null) — neither is a "this calendar month" window, so both are correctly out of scope per the design
- [x] 6.3 `features/calendar/MonthCalendar.tsx` takes a `period` + steppers instead of `month: Date`; grid spans `startOfWeek(period.startDate)`–`endOfWeek(period.endDate)`, "outside" = outside the period, header shows `period.label`. `HolidayCalendar` and `PersonalEventsTab` drive it with `useReportingPeriod`; their chip maps are date-keyed so events on 26–31 of the prior calendar month now render inside the period that contains them.

## 7. Verification

- [x] 7.1 / 7.2 Behaviour covered by automated tests: backend `ReportingPeriodServiceTest` (boundary table), `SettingsControllerTest` (cutoff set/clear shifts/reverts the resolved period), `ReportControllerTest` (dateless report defaults to the reporting month; `filter[period]` scopes it), `MeIncludesRolesTest` (session carries the period); frontend `lib/reporting-period.test.ts` (resolver mirrors the backend), `tsc` + `next build` + `eslint` clean. `e2e/reporting-month.spec.ts` added for the settings→calendar→reports round-trip (needs both dev servers; not run here). Cache freshness: month-scoped React Query keys embed the period bounds and `router.refresh()` re-runs the SSR session on save.
- [x] 7.3 Covered by `PayrollCalculationTest` — "with no payroll cutoff the period falls back to the organization reporting month" asserts 26 Aug–25 Sep / "September 2026".
- [x] 7.4 Backend `php artisan test` — 553 passed / 2 pre-existing skips. Frontend `npx tsc --noEmit` clean, `npx vitest run` 10/10, `npx eslint .` 0 errors, `npm run build` compiles.
