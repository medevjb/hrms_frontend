## Purpose

The personal "my workday" dashboard every employee has: today's attendance and shift, this month's attendance calendar, leave balances, upcoming holidays, announcements, and self-service shortcuts — all backed by live data, never mock values.

## ADDED Requirements

### Requirement: All dashboard data comes from live APIs

The Self Employee Dashboard SHALL derive every displayed value from an API response for the current user. It SHALL NOT display hardcoded reference data, placeholder identities (e.g. a canned employee name or code), or fabricated figures (e.g. deriving "days taken" by subtracting a balance from a constant).

When a data source is still loading, the affected widget SHALL show a loading state. When a data source fails or is empty, the affected widget SHALL show an empty/error state rather than fallback fiction.

#### Scenario: New employee with no history

- **WHEN** an employee with no attendance records and no leave activity opens the self dashboard
- **THEN** the calendar renders with no attendance marks, the leave-balance widget shows their actual balances (or an empty state), and no example/placeholder rows appear

#### Scenario: Identity is the signed-in user

- **WHEN** any user opens the self dashboard
- **THEN** the name, designation, and employee code shown are that user's own values from their profile
- **AND** no default identity string is rendered when a field is missing

### Requirement: Today's attendance and shift

The dashboard SHALL show the user's shift window for today, the flexible/grace check-in cutoff, their check-in and check-out times if recorded, and their current attendance status — sourced from the attendance "today" endpoint. Check-in and check-out actions SHALL remain available subject to that endpoint's state.

#### Scenario: Before checking in on a work day

- **WHEN** it is a work day and the user has not checked in
- **THEN** the shift window and grace cutoff are shown, status reads not-checked-in, and a check-in action is offered

#### Scenario: Non-work day

- **WHEN** today is the user's weekly off or a holiday
- **THEN** the dashboard reflects that (no check-in prompt) using the "today" endpoint's flags

### Requirement: Monthly attendance calendar

The calendar SHALL display the user's real attendance records for the visible month, with holidays and weekly-off days marked. Changing the visible month SHALL load that month's records. Selecting a day SHALL show that day's real detail (check-in/out, worked time, lateness, status). Requesting a correction from a day SHALL open the correction flow pre-filled from that day's real record.

#### Scenario: Navigating months

- **WHEN** the user moves the calendar to the previous month
- **THEN** the previous month's attendance records for that user are fetched and rendered

#### Scenario: Day with no record

- **WHEN** the user selects a past work day that has no attendance record
- **THEN** the day detail reflects "no record" rather than an invented present/late entry

### Requirement: Leave balances

The dashboard SHALL show the user's current leave balance per leave type, with entitlement and amount used where the API provides them. Values SHALL come from the dashboard/leave API, not a local constant.

#### Scenario: Balances render from the API

- **WHEN** the self dashboard loads and the leave-balance data is available
- **THEN** each leave type shows its remaining balance, and (when provided) its annual entitlement and used amount, all from the response

### Requirement: Upcoming leave, holidays, and announcements

The dashboard SHALL show the user's next approved leave (if any), upcoming holidays, and recent announcements with unread state — each from its respective API. Absence of data SHALL render as an empty state.

#### Scenario: No upcoming approved leave

- **WHEN** the user has no future approved leave request
- **THEN** the upcoming-leave widget shows an empty state, not a sample leave entry

### Requirement: No management sections on the self dashboard

The Self Employee Dashboard SHALL NOT render workforce totals, pending-approval queues for others, or any other manager-only widget, regardless of the viewer's role.

#### Scenario: Manager views their self dashboard

- **WHEN** an `HR` or `Admin` user opens `/dashboard/me`
- **THEN** they see only personal widgets; the management/workforce section is absent
