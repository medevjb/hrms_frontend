## Purpose

The Employee Manage Dashboard: an analytical HRM cockpit for managers and HR that surfaces workforce state, attendance and leave activity, and the approval work waiting on the viewer — every panel scoped to what that viewer is allowed to see and act on.

## ADDED Requirements

### Requirement: Access limited to management roles

`/dashboard/manage` SHALL render only for users holding `Admin`, `Head of HR`, `HR`, `Operation Manager`, or `Team Leader`. Any other user reaching it SHALL be redirected to `/dashboard/me`.

#### Scenario: Team Member blocked

- **WHEN** a `Team Member` navigates to `/dashboard/manage`
- **THEN** they are redirected to `/dashboard/me`

### Requirement: Every widget is permission-gated and scope-aware

Each widget SHALL be shown only when the viewer holds the permission that widget depends on, and its figures SHALL cover only the employees within the viewer's scope (their team, their department/operation, or the whole workforce). A widget the viewer cannot act on or see data for SHALL be omitted, not shown empty or zeroed.

#### Scenario: Team Leader sees team-scoped numbers

- **WHEN** a `Team Leader` opens the management dashboard
- **THEN** attendance-today and pending-approval counts reflect only their team's members
- **AND** org-wide workforce and payroll panels are not shown (they lack those permissions)

#### Scenario: HR sees org-wide panels

- **WHEN** an `HR` user opens the management dashboard
- **THEN** workforce headcount, attendance-today, leave/overtime approval queues, payroll preparation status, and announcements panels are shown
- **AND** the panels reflect all employees HR is responsible for

#### Scenario: Widget hidden when permission absent

- **WHEN** the viewer lacks `payroll.view`
- **THEN** no payroll period / payroll status widget appears on their management dashboard

### Requirement: Pending-approval queues link to where the work is done

The dashboard SHALL show the viewer's own pending-approval counts for leave, overtime, holiday notices, and payroll disputes (each only if that approval permission is held), and each count SHALL link to the corresponding module screen filtered to that queue.

#### Scenario: Acting on a queue

- **WHEN** the viewer clicks the "Leave approvals" count
- **THEN** they are taken to the leave screen showing the requests awaiting their decision

#### Scenario: Empty queue still shown

- **WHEN** the viewer holds `leave.approve` but has zero pending items
- **THEN** the leave-approvals widget is shown with a count of zero (the permission is held, so the widget is relevant)

### Requirement: Workforce and org composition

When the viewer holds `employee.view`, the dashboard SHALL show headcount within scope, a breakdown by employee status, and department/team rollups.

#### Scenario: Headcount panel

- **WHEN** an `HR` user opens the dashboard
- **THEN** a total headcount is shown alongside counts per status (active, probation, notice period, etc.) and per department

### Requirement: Attendance and leave activity

When the viewer holds `attendance.view`, the dashboard SHALL show today's attendance breakdown (present / late / absent / on leave / missing checkout) within scope, and a list of who is on leave today (and upcoming this week).

#### Scenario: Who's out today

- **WHEN** an `Operation Manager` opens the dashboard
- **THEN** they see which of their teams' members are on approved leave today

### Requirement: People movement

When the viewer holds `employee.view`, the dashboard SHALL show recent new joiners and recent exits/status changes within scope.

#### Scenario: New joiner list

- **WHEN** an employee within the viewer's scope joined in the last 30 days
- **THEN** they appear in the "recent joiners" panel

### Requirement: Data comes from the extended dashboard payload

All management-dashboard figures SHALL come from the single role-aware `/dashboard` response (extended with the fields this dashboard needs). No management figure SHALL be hardcoded or fabricated on the client.

#### Scenario: Backend omits a widget's data

- **WHEN** the `/dashboard` response does not include a given widget's key (viewer not permitted)
- **THEN** the client does not render that widget and does not substitute placeholder numbers
