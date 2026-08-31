## Context

See `proposal.md` — Why. Current state that shapes the approach:

- `/` is the only dashboard route (`app/(dashboard)/page.tsx` → `features/dashboard/DashboardOverview.tsx`). There is no `/dashboard` route.
- `DashboardOverview` mixes real hooks (`useDashboard`, `useAttendanceToday`, `useLeaveBalances`, `useHolidays`) with large amounts of hardcoded fallback: `features/dashboard/mockData.ts` constants, `utils.ts` `referenceOverrides` for May-2026, `14 - balance` leave math, and `"Md. Sayadul Islam Chowdhury"` / `"EMP-1042"` identity fallbacks.
- Its role check tests invented names (`"HR_MANAGER"`, `"SUPER_ADMIN"`, `"TEAM_LEADER"`). Real role names from `/auth/me` are `Admin`, `Head of HR`, `HR`, `Operation Manager`, `Team Leader`, `Team Member`, `System Admin / DevOps` (`user.roles: string[]`).
- Backend has one endpoint `GET /api/v1/dashboard` → `DashboardService::for(User)`. It already assembles per-permission widgets (`me`, `attendance_today`, `pending_approvals`, `workforce`, `payroll`, `upcoming_holidays`, `announcements`) and scopes employee sets through `ScopeResolver::employeeIdsFor()` (which now resolves real team/department grants; `null` = unrestricted, `[]` = nothing).
- Dashboard pages can be server components: `getCurrentUser()` (`lib/session.ts`, `server-only`) is available, and sibling detail pages (`departments/[id]/page.tsx`) already `await params` in async server components. `redirect()` from `next/navigation` works there.
- `RouteGuard` (client) already soft-gates sections by permission via `lib/nav-permissions.ts`. `AppSidebar` computes active state with `pathname === href || pathname.startsWith(href + "/")`, and `/` is special-cased to exact match.
- `frontend-design` skill governs the visual language for the new management dashboard; it is invoked during apply, not planning.

## Goals / Non-Goals

**Goals:**

- One decision point (`isManagementRole(user)`) reused by routing, redirects, and sidebar.
- Server-side role gating for `/` and `/dashboard/manage` so a non-manager never downloads or briefly sees the wrong surface.
- Split `DashboardOverview` into three self-contained surfaces sharing hooks, not a god component with conditionals.
- Self dashboard: every widget driven by a hook; delete mock constants and reference overrides; graceful loading/empty/error per widget.
- Management dashboard: additive extension of the existing `/dashboard` payload; new widget builders follow the existing `can()` + `ScopeResolver` pattern exactly.

**Non-Goals:**

- No historical/time-series data, no charts of trends over time, no attrition-rate math, no birthdays/anniversaries (needs date-of-birth / confirmation-date history we won't build now).
- No per-role bespoke dashboard templates — still one payload, permission-gated widgets (keeps §111's design).
- No stored dashboard preference / onboarding state.
- No change to `/system` console or `System Admin / DevOps`.
- No new top-level sidebar entries.

## Decisions

### D1: `/` is a client-routed smart entry, deep routes are server-gated

`app/(dashboard)/page.tsx` becomes a small server component: read `getCurrentUser()`, and if `isManagementRole` render `<DashboardChooser />`, else render `<SelfDashboard />`. No redirect for `/` (keeps the URL stable so the sidebar link and "Dashboard" active state stay simple, and matches the user's ask that clicking Dashboard always lands on the chooser).

`app/(dashboard)/dashboard/manage/page.tsx`: server component, `redirect("/dashboard/me")` unless `isManagementRole`.
`app/(dashboard)/dashboard/me/page.tsx`: server component, renders `<SelfDashboard />` for anyone.

*Alternative considered:* one `/dashboard` hub route with everything nested and `/` redirecting to it. Rejected — the user explicitly chose "`/` = smart entry", and an extra redirect hop on every app open is worse UX.

*Alternative considered:* client-only gating via `RouteGuard`. Rejected for `/dashboard/manage` — role isn't a permission in `nav-permissions.ts`, and we want no flash of the manager UI. Client gating is still fine as defense-in-depth.

### D2: `isManagementRole` helper

Add to `lib/permissions.ts` (or a new `lib/dashboard-access.ts`):

```ts
const MANAGEMENT_ROLES = ["Admin", "Head of HR", "HR", "Operation Manager", "Team Leader"];
export function isManagementRole(user: Pick<CurrentUser, "roles">): boolean {
  return user.roles.some((r) => MANAGEMENT_ROLES.includes(r));
}
```

Exact role-name match against the backend's seeded names. `System Admin / DevOps` and `Team Member` are deliberately absent. Used by the two pages, the chooser, and `AppSidebar` (if it needs to vary — it does not today, link stays `/`).

*Alternative considered:* permission-signal detection (`leave.approve` || `attendance.view` || `employee.view`). Rejected — the user picked "Those 4 + Admin" by role, and permission-signal would sweep in edge configs unpredictably. Role list is explicit and matches the seeder.

### D3: Component structure under `features/dashboard/`

- `SelfDashboard.tsx` — the current `DashboardOverview` body minus `ManagerWorkforceSection`, minus mock fallbacks. Keeps `EmployeeHeroHeader`, `TopStatCards`, `AttendanceCalendarCard`, `TodayScheduleCard`, `LeaveBalanceCard`, `QuickActionsAndAnnouncements`.
- `ManagementDashboard.tsx` — new; composed of small widget components in `features/dashboard/management/`.
- `DashboardChooser.tsx` — two large cards linking to `/dashboard/me` and `/dashboard/manage`, styled per `frontend-design`.
- `DashboardOverview.tsx` is removed; `mockData.ts` keeps only the exported *types* (`CalendarDayItem`, `LeaveBalanceItem`, `ScheduleItem`, `DashboardKPI`, `CalendarDayStatus`) and loses every `MOCK_*` constant. `utils.ts` `generateMonthCalendarDays` loses `referenceOverrides` and the `isMay2026` stat hardcoding; it maps only real `backendRecords` + `holidays`, and computes stats from those.

### D4: Self dashboard data sources (make it dynamic)

| Widget | Source | Backend work |
|---|---|---|
| Identity (name, designation, code) | `useProfile()` / `useCurrentUser()` | none |
| KPI: working period / status | `useAttendanceToday()` | none |
| KPI: length of service | `useProfile().employee.joining_date` + `calculateLengthOfService` | none |
| KPI: upcoming leave | **new** `me.next_approved_leave` in `/dashboard` payload | `DashboardService::me` adds next approved `LeaveRequest` (type, start, days) |
| KPI: attendance today | `useAttendanceToday()` record status | none |
| Attendance calendar | `useAttendanceList({ employee_id: self, date_from, date_to })` per visible month | none (endpoint exists; confirm self-scope allowed without extra permission — an employee reading their own records) |
| Today's schedule timeline | derive from `useAttendanceToday()` (shift start/end, grace) + org settings lunch window if present | `me` widget (or `attendance/today`) exposes shift break window if the model has one; otherwise timeline shows check-in / check-out only |
| Leave balances (remaining / entitlement / taken) | **extended** `me.leave_balances[]` | add `entitlement` (from `leave_type.annual_allocation_days`) and `taken` (entitlement − balance, or a real ledger sum if available) to each item |
| Quick actions | static links (legit — they're navigation) | none |
| Upcoming holidays | `useHolidays()` or `upcoming_holidays` widget | none |
| Announcements | `announcements` widget | none |

`self`-scoped attendance read: `GET /attendance` must return the caller's own records. If the current policy requires `attendance.view`, add an explicit self-branch (an employee may always read their own attendance) — verify during apply and note in tasks.

### D5: Management dashboard payload extensions

Extend `DashboardService` (all additive, all gated + scoped like existing builders):

- `workforce` — add `by_department: [{ id, name, headcount }]` and `by_status` already exists.
- `attendance_today` — already scoped; add `on_leave_today: [{ employee_id, name, leave_type, until }]` and `on_leave_upcoming` (next 7 days) — gated by `attendance.view`, scoped by `ScopeResolver`.
- `pending_approvals` — already present; the client turns each key into a link to the module screen with the right filter.
- new `people_movement` widget — gated by `employee.view`, scoped: `recent_joiners` (joined ≤30d), `recent_exits` (status → RESIGNED/TERMINATED/ARCHIVED ≤30d).
- `payroll` — already present; no change.
- `announcements` — already present; management view shows management affordances (link to create) client-side only.

Everything reads current tables with simple `where`/`count`/`groupBy`. No migrations.

*Alternative considered:* a separate `GET /dashboard/management` endpoint. Rejected — the user chose "extend current payload only", and §111's whole design is one role-aware payload. Keeping it one endpoint means the client just reads more keys when present.

### D6: Widget → module link map (management dashboard)

| Count | Links to |
|---|---|
| Leave approvals | `/leave` (requests awaiting me) |
| Overtime approvals | `/overtime` |
| Holiday notices | `/holidays` (notices tab) |
| Payroll disputes | `/payroll` (disputes) |
| Headcount / status | `/employees` (filtered) |
| On leave today | `/leave` |
| Payroll period | `/payroll/{id}` |

Exact filter query params are an apply-time detail; the requirement is only that each is actionable.

### D7: Backend tests

Extend `tests/Feature/Api/V1/DashboardControllerTest.php`: new-field assertions on `me` (next approved leave, leave-balance entitlement/taken), `workforce.by_department`, `attendance_today.on_leave_today` scoped for a Team Leader vs unrestricted for HR, `people_movement` gated by `employee.view` and scoped. Frontend: rely on typecheck/lint/build (no test infra for dashboard components); optionally a Playwright smoke that a Team Member never sees the chooser.

## Risks / Trade-offs

- **[Self attendance read may need a policy tweak]** → If `GET /attendance` rejects a plain Team Member reading their own month, the calendar breaks. Mitigation: task to verify `AttendanceRecordPolicy` allows self-read; add the self-branch if missing (small, well-scoped).
- **[Today's schedule "lunch break" has no obvious backend field]** → Timeline may lose the break row. Mitigation: render check-in/check-out reliably; show the break only if org settings expose a break window; otherwise omit rather than fake `01:00 PM – 01:30 PM`.
- **[`taken` for leave balances may not be a stored value]** → Computing `entitlement − balance` can go negative with carry-forward or adjustments. Mitigation: clamp at 0 for display, or sum approved leave days for the year if that query is cheap; decide during apply, note in tasks.
- **[Removing mock data exposes thin real data in dev]** → Dashboards look empty on a fresh DB. Mitigation: acceptable — empty states are specced; the seeded demo data (§ PRD 5408: ~60 employees, 90 days attendance) covers realistic testing.
- **[Two new routes under `/dashboard/` vs the `(dashboard)` route group]** → Naming collision is only visual (`(dashboard)` is a group, not a path segment). No real conflict, but note for reviewers.
- **[Scope of "ideal HRM dashboard items" is judgement]** → The spec fixes the widget *set*; visual richness is bounded by "extend current payload only". Anything needing new aggregation infra is explicitly a non-goal.

## Migration Plan

1. Backend first: extend `DashboardService` + resources, add tests, `pint` / `phpstan` / `php artisan test` clean, on a backend branch. Payload is additive → safe to ship before frontend.
2. Frontend: helper + routes + `SelfDashboard` (dynamic) + `DashboardChooser`, then `ManagementDashboard` widgets consuming the new keys.
3. Delete `DashboardOverview.tsx` and `MOCK_*` constants in the same frontend change.
4. Rollback: revert the frontend change (routes collapse back to `/`); the additive backend fields are inert if unused.

## Open Questions

- Exact filter query-params for each management widget's "act on it" link — resolvable at apply time without changing specs or task shape.
- Whether `taken` for leave uses a ledger sum or `entitlement − balance` — apply-time, bounded by D5/Risks.
