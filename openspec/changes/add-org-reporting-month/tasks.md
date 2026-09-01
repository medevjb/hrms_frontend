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

- [ ] 4.1 Generalize `features/dashboard/utils.ts` `generateMonthCalendarDays` from `(currentDate, ...)` to `(startISO, endISO, todayKey, ...)`; replace `isSameMonth`/`startOfMonth`/`endOfMonth` with the period range and rename `isCurrentMonth` → `isInPeriod`; update its unit tests for a straddling range (26 Aug–25 Sep)
- [ ] 4.2 Update `features/attendance/AttendanceCalendarView.tsx` to derive `monthFrom/monthTo` and header label from `useReportingPeriod`; prev/next step periods; React Query key changes to `["attendance","month",targetId,periodKey,cutoff]`; verify header reads "September 2026" and totals count only 26 Aug–25 Sep when cutoff = 25
- [ ] 4.3 Update `features/attendance/AttendanceMonthList.tsx` (and any `AttendanceList` default date filter) to use the period range; verify the list contains only in-period rows

## 5. Frontend — dashboards

- [ ] 5.1 Update `features/dashboard/SelfDashboard.tsx` + `components/AttendanceCalendarCard.tsx` + `components/TopStatCards.tsx` "this month" stats to use `useReportingPeriod`; verify the present/late/absent counts equal the attendance calendar's for the current period
- [ ] 5.2 Update `components/LeaveBalanceCard.tsx` "taken this month" to count leave days inside the current reporting period; verify against a leave record straddling the boundary
- [ ] 5.3 Update `features/dashboard/ManagementDashboard.tsx` and its panels (`AttendanceTodayPanel`, `WorkforcePanel`, `PayrollPanel`, `PeopleMovementPanel`) month-scoped figures to the reporting period; verify each panel's "this month" range in the network tab

## 6. Frontend — reports, leave, calendars

- [ ] 6.1 Update `features/reports/*` default date range to the current reporting period (via `useReportingPeriod`) and pass `period`/`date_from`/`date_to`; verify a report opened with no dates returns only in-period records and the range chip shows the period label
- [ ] 6.2 Update `features/leave/*` employee-facing usage/summary windows to the reporting period (leave *year* boundaries unchanged); verify "used this month" matches the dashboard card
- [ ] 6.3 Update `features/calendar/MonthCalendar.tsx` + `features/holidays/*` + `features/personal-events/*` overlays so navigation steps reporting periods and the grid spans the period; verify holidays/events on 26–31 of the prior calendar month appear in the period that now contains them

## 7. Verification

- [ ] 7.1 With cutoff = 25 and org date = 26 Sep 2026, manually walk attendance calendar, self dashboard, management dashboard, a report, and leave summary; confirm all show "October 2026" as current and identical present/absent/leave counts for the same employee
- [ ] 7.2 Set cutoff back to blank; confirm every surface reverts to calendar months with no stale cached figures (React Query refetches on the new key)
- [ ] 7.3 Create a September 2026 payroll period with no `payroll_cutoff_day` override; confirm it is 26 Aug–25 Sep and matches the reporting period shown elsewhere
- [ ] 7.4 Run frontend `tsc`, lint, and the full test suite; run backend `php artisan test` for the matching change — all green
