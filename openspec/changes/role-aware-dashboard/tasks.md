## 1. Backend — extend the dashboard payload (`/Users/jb/Herd/hrms/backend`, new branch)

- [x] 1.1 Branch from `main`; confirm baseline green: `php artisan test tests/Feature/Api/V1/DashboardControllerTest.php` passes before changes — NOTE: backend is a shared checkout already on `roles-module` with unrelated in-flight work (system console); per user go-ahead, changes made on that branch instead of a fresh one. Full suite green (469 passed / 2 skipped).
- [x] 1.2 In `DashboardService::me`, add `next_approved_leave` (nearest future `LeaveRequest` with approved status: `leave_type`, `start_date`, `days_requested`, or `null`); verify via a new test asserting the field for an employee with/without upcoming approved leave
- [x] 1.3 In `DashboardService::me`, extend each `leave_balances[]` item with `entitlement` (from `leaveType.annual_allocation_days`) and `taken` (clamp `max(0, entitlement - balance)` unless a cheap approved-days ledger sum is available — pick one, comment the choice); verify with a test asserting the shape — chose `max(0, entitlement − balance)`, commented in code
- [x] 1.4 In `DashboardService::workforce`, add `by_department: [{ id, name, headcount }]` via a single grouped query; verify with a test on seeded departments
- [x] 1.5 In `DashboardService::attendanceToday`, add `on_leave_today` and `on_leave_upcoming` (next 7 days) lists — `{ employee_id, name, leave_type, until }` — reusing the same `ScopeResolver::employeeIdsFor($user, AttendanceView)` id set; verify a Team-Leader-scoped test returns only their team and an HR test is unrestricted
- [x] 1.6 Add a `people_movement` widget builder gated by `PermissionName::EmployeeView`, scoped through `ScopeResolver::employeeIdsFor($user, EmployeeView)`: `recent_joiners` (joining_date within 30 days) and `recent_exits` (status in RESIGNED/TERMINATED/ARCHIVED, updated within 30 days); include it in `for()` only when the permission is held; verify gated + scoped with tests
- [x] 1.7 Run `vendor/bin/pint --dirty` and `XDEBUG_MODE=off php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress` — both clean
- [x] 1.8 Run full `php artisan test` — all green (469 passed, 2 pre-existing Fortify skips)
- [x] 1.9 Verify self attendance read: confirm `AttendanceRecordPolicy` / `AttendanceController@index` lets a plain `Team Member` list their own records (`filter[employee_id]=self`); if it requires `attendance.view`, add an explicit self-branch and a test proving a role-less employee can read their own month — Team Member role already carries `attendance.view` @ SELF scope; `ScopeResolver` limits to own id. No branch needed; added a test proving it.
- [x] 1.10 Update `docs/PRD.md` §73–§78 status note and `docs/api.md` if the `/dashboard` payload is documented there; note the new additive fields — PRD §111 updated; `docs/api.md` only lists the endpoint, no payload detail to amend

## 2. Frontend — types & services for the new payload

- [x] 2.1 Extend `types/dashboard.ts`: `DashboardMe.next_approved_leave`, `leave_balances[]` gains `entitlement`/`taken`, `DashboardWorkforce.by_department`, `DashboardAttendanceToday.on_leave_today`/`on_leave_upcoming`, new `DashboardPeopleMovement` on `widgets.people_movement`; `npx tsc --noEmit` clean
- [x] 2.2 Confirm `services/dashboard.ts` needs no change (same `useDashboard()`); add `services/attendance.ts` usage note or a thin `useSelfAttendanceMonth(dateFrom, dateTo)` wrapper over `useAttendanceList`; typecheck clean — added `useSelfAttendanceMonth(employeeId, from, to)` with per_page 100

## 3. Frontend — role-aware entry (`dashboard-entry` spec)

- [x] 3.1 Add `isManagementRole(user)` to `lib/permissions.ts` (roles: Admin, Head of HR, HR, Operation Manager, Team Leader — exact match); unit-verify by importing in a page and by reasoning against `types/auth.ts` role names
- [x] 3.2 Rewrite `app/(dashboard)/page.tsx` as an async server component: `getCurrentUser()`, render `<DashboardChooser />` when `isManagementRole`, else `<SelfDashboard />` — build clean; live login walk-through blocked (backend.test unreachable at time of run)
- [x] 3.3 Add `app/(dashboard)/dashboard/me/page.tsx` (server component → `<SelfDashboard />` for anyone) — route present in build manifest
- [x] 3.4 Add `app/(dashboard)/dashboard/manage/page.tsx` (server component → `redirect("/dashboard/me")` unless `isManagementRole`, else `<ManagementDashboard />`) — route present in build manifest
- [x] 3.5 Build `features/dashboard/DashboardChooser.tsx` — two cards linking `/dashboard/me` and `/dashboard/manage`, styled with the `frontend-design` skill (applied within the app's existing design system); the page renders no dashboard widgets itself
- [x] 3.6 Update `components/layouts/AppSidebar.tsx` so the "Dashboard" item (still `href: "/"`) shows active on `/`, `/dashboard/me`, and `/dashboard/manage` — `isActive` now matches `/dashboard` prefix
- [x] 3.7 Client-side defense-in-depth in `RouteGuard` for a non-manager on `/dashboard/manage` — DEVIATION from the task's "show the no-access state": the spec ("redirected to `/dashboard/me`") wins, so RouteGuard does `router.replace("/dashboard/me")` instead of a dead-end lock screen. Verified: teammember/sysadmin land on `/dashboard/me`.

## 4. Frontend — Self Employee Dashboard made dynamic (`self-dashboard` spec)

- [x] 4.1 Create `features/dashboard/SelfDashboard.tsx` from the current `DashboardOverview` body, removing `ManagerWorkforceSection` and the `isManagerOrAdmin` block entirely (also deleted the now-orphaned `ManagerWorkforceSection.tsx`)
- [x] 4.2 Replace identity fallbacks: name/designation/employee code come only from `useProfile()`/`useCurrentUser()`; missing fields render a dash, never `"Md. Sayadul..."`/`"EMP-1042"`
- [x] 4.3 Wire KPI cards (`TopStatCards`): working period + attendance-today from `useAttendanceToday()`, length of service from real `joining_date` (null → "—"), upcoming leave from `me.next_approved_leave` (empty state when null); also removed the setState-in-effect lint error
- [x] 4.4 Make `AttendanceCalendarCard` dynamic: month lifted to `SelfDashboard`, records fetched via `useSelfAttendanceMonth(employeeId, from, to)`, refetch on month change; real records + holidays passed into `generateMonthCalendarDays`; loading state dims the grid
- [x] 4.5 Strip `utils.ts` `generateMonthCalendarDays`: removed `referenceOverrides`, `isMay2026`, and the hardcoded `stats` overrides; stats computed purely from records + holidays + weekend rule; added `NO_RECORD` for past work days with nothing logged
- [x] 4.6 `DayDetailsModal` shows the real record or an explicit "No record" / "hasn't happened yet" state; "request correction" is disabled for `NO_RECORD`/`OFF`/`HOLIDAY`/`FUTURE` and otherwise opens `AdjustAttendanceDialog` with the real `AttendanceRecord` (no `dummyRecord`)
- [x] 4.7 `LeaveBalanceCard`: renders remaining/entitlement/taken from `me.leave_balances[]`; removed `14 - b.balance` / `total: 14` and `MOCK_LEAVE_BALANCES`; loading + empty states added
- [x] 4.8 `TodayScheduleCard`: timeline derived from `useAttendanceToday()` (shift start/end, grace, actual check-in/out); no backend break-window field exists, so the lunch row is omitted rather than faked; non-work-day and no-shift states handled
- [x] 4.9 `QuickActionsAndAnnouncements`: announcements + holidays from `useDashboard()` widgets; quick-action links stay static; removed `MOCK_ANNOUNCEMENTS` / `MOCK_UPCOMING_HOLIDAYS`; empty states added
- [x] 4.10 Deleted `features/dashboard/DashboardOverview.tsx` and every `MOCK_*` constant from `mockData.ts` (types only remain); `tsc` / `lint` (0 errors) / `build` all clean

## 5. Frontend — Employee Manage Dashboard (`management-dashboard` spec)

- [x] 5.1 Created `features/dashboard/ManagementDashboard.tsx` + `features/dashboard/management/` (6 panels); consumes `useDashboard()`; renders a panel only when its payload key is present; `EmptyState` when no panel applies
- [x] 5.2 `WorkforcePanel` (headcount, active, by-status chips, by-department list) — rendered only when `widgets.workforce` present
- [x] 5.3 `AttendanceTodayPanel` (present/late/absent/on-leave/missing-checkout cells) + "on leave today / this week" lists from `attendance_today` (backend scopes both counts and lists via `ScopeResolver`)
- [x] 5.4 `PendingApprovalsPanel`: one row per present key in `pending_approvals`, each linking to its module (`/leave`, `/overtime`, `/holidays`, `/payroll` — design D6); zero-count row still shown when the key is present
- [x] 5.5 `PeopleMovementPanel` (recent joiners / recent exits) from `people_movement`; the whole panel is absent when the payload omits the key (backend gates on `employee.view`)
- [x] 5.6 `PayrollPanel` + `AnnouncementsPanel` reuse existing payload keys; announcements panel shows a "New" link only when the user holds `announcement.create`
- [x] 5.7 Applied `frontend-design` within the app's existing token system — a stat-tile hero row for "state of the operation", then a cards grid, active-voice empty-state copy; light/dark handled by the shared tokens
- [x] 5.8 `npx tsc --noEmit`, `npm run lint` (0 errors), `npm run build` all clean

## 6. Verification (cross-cutting)

- [x] 6.1 Role walk-through (headless Chromium against a prod build, real backend, one seeded user per role):
  - Team Member → `/` renders the self dashboard (own name, no chooser); `/dashboard/manage` redirects to `/dashboard/me`
  - Team Leader → `/` shows the chooser; `/dashboard/manage` shows Waiting-on-you / Attendance today / Workforce / People movement / Announcements (no Payroll — lacks `payroll.view`)
  - HR → chooser; manage adds the Payroll panel
  - Admin → chooser; manage shows the full set
  - System Admin / DevOps → self dashboard, no chooser; `/dashboard/manage` redirects to `/dashboard/me`; length-of-service shows "—" (no employee record)
  - No page errors, no "Md. Sayadul" / "EMP-1042" on any screen
- [x] 6.2 Grep the repo for residual mock usage: no `MOCK_`, no `"Md. Sayadul"`, no `EMP-1042`, no `referenceOverrides`, no `isMay2026` remain in `features/dashboard/` (also removed the orphaned `DashboardOverview.tsx` and `ManagerWorkforceSection.tsx`)
- [x] 6.3 Confirmed no `/dashboard` payload key is fabricated client-side: every panel/widget reads `dashboard?.widgets.<key>` and renders nothing (management) or an empty state (self) when absent; no `?? <number>` fallbacks remain. Browser check showed the Payroll panel correctly absent for a Team Leader.
- [x] 6.4 Green together: backend `pint` + `phpstan` clean, `php artisan test` 469 passed / 2 skipped; frontend `tsc` + `lint` (0 errors) + `build` clean.

## 7. Follow-up fix — weekend alignment (2026-08-31)

- [x] 7.0 The calendar hardcoded Sat/Sun as the weekend; a per-employee `weekend_day` set from the admin panel wasn't reflected. Fix: `DashboardService::me` now returns `weekend_days` (the employee override, else the org weekend); `generateMonthCalendarDays` takes `weekendDays` and shades no-record days from it; `SelfDashboard` passes `me.weekend_days` through. Backend test added; browser-verified an employee with `weekend_day = monday` shows only Mondays as "(Off)".
- [x] 7.1 The calendar treated days before the employee's joining date as "No record" and counted them as working days. Fix: `generateMonthCalendarDays` takes `joiningDate` (from `profile.employee.joining_date`), marks earlier days `PRE_HIRE` (dim, non-interactive, no label), and excludes them from every stat. Browser-verified: joining Aug 15 → days 1–14 render as pre-hire, "Working days" drops accordingly. Frontend-only (joining_date already in the profile payload).
- [x] 7.3 Break wasn't showing on the dashboard because the only shift had `break_minutes: 60` but no start/end window (the row needs exact times to position). Reworked `SaveShiftModal` into a clear "Break time" section — "Break start time" / "Break end time" pickers with a live duration readout; dropped the confusing standalone minutes input (still passed through for shifts that only carry a duration). Backfilled the existing shift's window to 13:00–14:00 (matching its 60 min) so it renders now — adjustable in the shift editor. Verified on the live preview: shift list, edit modal, and Self dashboard "Today's schedule" all show `1:00 PM – 2:00 PM · Break`.
- [x] 7.2 Shift break time. Shifts only had a `break_minutes` duration; the user wanted a scheduled break window on the shift, applied automatically wherever the shift is used. Backend: migration adds nullable `break_start`/`break_end` to `shifts`; `Shift::booted` keeps `break_minutes` = window length when both are set; `ShiftResource`, `EmployeeResource.current_shift`, `ProfileResource.current_shift`, and `attendance/today` all expose the window; `SaveShiftRequest` validates `after:break_start` + `required_with`. 3 new shift tests, full suite 473/2. Frontend: `SaveShiftModal` gains "Break start"/"Break end" time fields (break-minutes auto-fills read-only from them); `ShiftsList` shows a Break column; `ShiftSelect` and the employee "Regular shift" card show the window; the dashboard "Today's schedule" renders a Break step at the real time. Browser-verified end to end (create → assign → dashboard shows "1:00 PM – 1:45 PM"). Also fixed a latent bug: `SelfDashboard` was parsing ISO shift times as `HH:MM`.

## 8. Known limitation (not addressed — flag for follow-up)

- [ ] 8.1 `workforce` (total, by_status, by_department, departments, teams) is computed org-wide, not scoped to the viewer — pre-existing in `DashboardService::workforce()`, and `by_department` (this change) follows the same pattern. The `management-dashboard` spec wants headcount "within scope". `attendance_today` and `pending_approvals` ARE scoped via `ScopeResolver`; only `workforce` is not. Retrofitting scope onto the whole builder was outside "extend the current payload only" (design D5) — left for a dedicated change.
