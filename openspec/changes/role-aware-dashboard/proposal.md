## Why

Today every user lands on one dashboard (`/`) that is largely hardcoded mock data — a May-2026 attendance calendar, fixed KPI numbers, dummy leave balances. Managers and HR staff have no operational cockpit; individual employees see manager-only sections they can't act on. We need to separate "my own workday" from "managing other people's" and make the personal view show real data.

## What Changes

- **Role-aware entry at `/`.** Team Leader, HR, Head of HR, Operation Manager, and Admin land on a **dashboard chooser** with two options: **Self Employee Dashboard** and **Employee Manage Dashboard**. Every other role (Team Member, and any user without a management role) lands directly on the Self Employee Dashboard. System Admin / DevOps is unaffected (they use the `/system` console).
- **The chooser is a permanent hub, not one-time onboarding.** No preference is stored. The sidebar "Dashboard" link keeps pointing at `/`; a manager clicking it always returns to the chooser and can pick again. Deep links `/dashboard/me` (self) and `/dashboard/manage` (management) render the surfaces directly; a non-manager hitting `/dashboard/manage` is redirected to `/dashboard/me`.
- **Self Employee Dashboard becomes dynamic.** The existing widgets (KPI stat cards, attendance calendar, today's schedule timeline, leave balances, quick actions, upcoming holidays, announcements) are rewired to live APIs. All hardcoded reference data (`mockData.ts` constants, the May-2026 calendar overrides, `14 - balance` fabrications, the `"Md. Sayadul..."` / `EMP-1042` fallbacks) is removed. The manager-only "Management & Workforce" section is removed from this view (it moves to the management dashboard).
- **New Employee Manage Dashboard** — an analytical HRM cockpit built with the `frontend-design` skill: workforce headcount and status mix, today's attendance breakdown, the caller's pending-approval queues (leave / overtime / holiday notices / payroll disputes) with links to act, who's on leave today / this week, department & team rollups, current payroll period status, recent announcements, and new-joiner / recent-exit lists. Every widget is permission-gated and scope-aware; a widget the caller can't act on is not shown.
- **Backend: extend the existing `/dashboard` payload only.** Add the fields the two views need that are cheaply computable from current tables (leave-balance entitlement/taken, next approved leave, today's schedule inputs, on-leave-today lists, new joiners / recent exits, department rollups). No historical-trend or time-series infrastructure.
- **Fix stale role checks.** `DashboardOverview` currently matches invented role names (`"HR_MANAGER"`, `"SUPER_ADMIN"`, `"TEAM_LEADER"`); the real names are `"Admin"`, `"Head of HR"`, `"HR"`, `"Operation Manager"`, `"Team Leader"`, `"Team Member"`. A shared helper resolves "is this a management role".

## Capabilities

### New Capabilities

- `dashboard-entry`: the role-aware landing behavior at `/` — who sees the chooser vs. the self dashboard, the chooser page itself, the `/dashboard/me` and `/dashboard/manage` routes, and redirect rules.
- `self-dashboard`: the personal employee dashboard — which widgets it shows, what live data backs each one, and what it must never show (manager-only sections, fabricated numbers).
- `management-dashboard`: the Employee Manage Dashboard — its widget set, the permission gate on each widget, scope-awareness, and the action links out to the relevant modules.

### Modified Capabilities

<!-- None: openspec/specs/ is currently empty, so the dashboard has no prior spec to amend. -->

## Impact

- **Frontend routes**: `app/(dashboard)/page.tsx` (becomes the role-aware entry), new `app/(dashboard)/dashboard/me/page.tsx` and `app/(dashboard)/dashboard/manage/page.tsx`.
- **Frontend features**: `features/dashboard/` — `DashboardOverview` split into `SelfDashboard` + `ManagementDashboard` + `DashboardChooser`; `mockData.ts` reduced to real types only; `utils.ts` calendar generator loses its reference overrides; new components for the management widgets; `components/layouts/AppSidebar.tsx` (Dashboard link target unchanged, verify active-state matching for the new sub-routes).
- **Frontend services / types**: `services/dashboard.ts`, `types/dashboard.ts` extended for the new payload fields; `services/attendance.ts` used for the month calendar; possibly `services/leave.ts` for next-approved-leave.
- **Backend** (`/Users/jb/Herd/hrms/backend`): `app/Services/DashboardService.php` (new/expanded widget builders), `app/Http/Resources/Api/V1/*` if leave-balance shape changes, `tests/Feature/Api/V1/DashboardControllerTest.php`, `docs/PRD.md` §73–§78 status note and `docs/api.md` if the payload contract is documented there.
- **No breaking API changes**: the `/dashboard` payload is additive; existing widget keys keep their shape.
