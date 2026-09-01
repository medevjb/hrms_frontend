## Purpose

Defines the organization-wide custom reporting month: an admin-controlled cutoff day that shifts what every calendar, dashboard, report, list filter, and API "month" covers, so that counts across the whole platform (and payroll) agree on the same date range.

## ADDED Requirements

### Requirement: Admin-controlled reporting cutoff setting

The organization settings SHALL expose a single `reporting_month_cutoff_day` value that is an integer from 1 to 28, or null. It SHALL be readable by any authenticated user and writable only by users holding the organization-settings admin permission (the same permission that already gates other organization settings). The value SHALL be edited only from the admin Settings panel; no other surface may change it.

#### Scenario: Admin sets the cutoff

- **WHEN** an admin submits `reporting_month_cutoff_day = 25` from the Settings panel
- **THEN** the value is persisted and returned on the organization-settings resource
- **AND** every subsequent reporting-period resolution across the platform uses cutoff day 25

#### Scenario: Non-admin cannot change it

- **WHEN** a user without the organization-settings admin permission submits a write that includes `reporting_month_cutoff_day`
- **THEN** the request is rejected with a forbidden/authorization error and the stored value is unchanged

#### Scenario: Cleared cutoff falls back to calendar months

- **WHEN** `reporting_month_cutoff_day` is null
- **THEN** every reporting period equals the calendar month (1st → last day) with the calendar month's name

#### Scenario: Out-of-range value rejected

- **WHEN** a write sets `reporting_month_cutoff_day` to 0, 29, 31, or a non-integer
- **THEN** the request is rejected with a validation error naming the field

### Requirement: Reporting-period resolution

The system SHALL resolve any reference date to exactly one reporting period. With cutoff day `C` (non-null), the period whose end month is `M`/`Y` SHALL start on day `C+1` of the previous month and end on day `C` of `M`/`Y`, inclusive. Each period SHALL be identified by a stable `key` (`YYYY-MM` of the end month), a human `label` (the end month's name and year, e.g. "September 2026"), and `start_date`/`end_date` as `YYYY-MM-dd`. A reference date on day `> C` SHALL belong to the period ending the following month; a date on day `<= C` SHALL belong to the period ending that month. When `C` is null the period is the calendar month of the reference date.

#### Scenario: Date after the cutoff

- **WHEN** cutoff is 25 and the reference date is 26 Aug 2026
- **THEN** the resolved period is `{ key: "2026-09", label: "September 2026", start_date: "2026-08-26", end_date: "2026-09-25" }`

#### Scenario: Date on or before the cutoff

- **WHEN** cutoff is 25 and the reference date is 25 Sep 2026 (or 10 Sep 2026)
- **THEN** the resolved period is the one ending `2026-09-25` and labeled "September 2026"

#### Scenario: Cutoff clamped months are contiguous

- **WHEN** cutoff is 28 and periods for February and March are resolved
- **THEN** the February period ends `..-02-28` (or `-02-29` is NOT used — cutoff max is 28) and the March period starts the next day with no gap or overlap between any two consecutive periods

#### Scenario: Stepping between periods

- **WHEN** a client requests the period before or after a given period
- **THEN** it receives the adjacent period with contiguous, non-overlapping boundaries and a label matching its end month

### Requirement: Current reporting period from organization time

The "current" reporting period SHALL be derived from the organization's current date in the organization timezone (the same server-resolved date used elsewhere), never the client clock. Surfaces that show "this month" by default SHALL open on the current reporting period.

#### Scenario: Current period near a boundary

- **WHEN** cutoff is 25 and the organization date is 26 Sep 2026
- **THEN** the current reporting period is the one starting `2026-09-26` and labeled "October 2026", even for a client whose local date is still 25 Sep

### Requirement: Platform-wide adoption of the reporting period

Every date-scoped view, aggregate, calendar grid, and default list filter that presently means "this calendar month" SHALL instead be computed against the reporting period. This applies at minimum to: the attendance calendar and month list; self-service and management dashboards including their "this month" stat cards, attendance calendar card, and leave-balance usage window; reports/analytics default date ranges and any month grouping; leave usage and accrual windows shown to employees; and the holiday and personal-event calendar overlays. Month-navigation controls SHALL step between reporting periods and SHALL label the visible range by its period, not by a calendar month.

#### Scenario: Attendance calendar reflects the period

- **WHEN** cutoff is 25 and an employee opens the attendance calendar with no month selected
- **THEN** the grid and the day list cover `2026-08-26`–`2026-09-25`, the header reads "September 2026", and the present/late/absent/working-day totals count only days in that range

#### Scenario: Dashboard "this month" matches attendance

- **WHEN** the same employee views their dashboard "this month" attendance stats
- **THEN** the present/absent/late counts equal those shown on the attendance calendar for the current reporting period

#### Scenario: Report default range

- **WHEN** a manager opens an attendance or leave report without setting dates
- **THEN** the default range is the current reporting period and the result set contains only records dated within it

#### Scenario: Navigating to the previous period

- **WHEN** the user clicks "previous" on any month-navigation control
- **THEN** the view moves to the immediately preceding reporting period and its label updates to that period's end month

#### Scenario: Leave balance usage window

- **WHEN** an employee views their leave-balance card
- **THEN** the "taken this month" figure counts leave days falling inside the current reporting period

### Requirement: Payroll period alignment

Payroll period creation SHALL default its boundaries to the organization reporting period for the selected month so that a payroll period covers exactly the same dates as the rest of the platform for that month. A payroll-specific override MAY still be applied, but when no override is configured the payroll period SHALL equal the reporting period. The period label SHALL follow the same end-month convention.

#### Scenario: Payroll period equals reporting period

- **WHEN** reporting cutoff is 25, no payroll-specific override is set, and an admin creates the payroll period for September 2026
- **THEN** the payroll period is `2026-08-26`–`2026-09-25` labeled "September 2026", identical to the reporting period

#### Scenario: Explicit payroll override still honored

- **WHEN** a payroll-specific cutoff override of 20 is configured and the September 2026 payroll period is created
- **THEN** the payroll period uses day 20 (`2026-08-21`–`2026-09-20`) while non-payroll surfaces continue to use the reporting cutoff of 25

### Requirement: Setting change propagation

When `reporting_month_cutoff_day` changes, subsequent responses and views SHALL reflect the new boundaries without requiring a deploy. Cached month-scoped data on the client SHALL be keyed such that a cutoff change produces a fresh fetch rather than stale calendar-month data.

#### Scenario: Cutoff changed mid-session

- **WHEN** an admin changes the cutoff from null to 25 and any user then reloads or revisits a month-scoped view
- **THEN** that view recomputes against cutoff 25 and does not display previously cached calendar-month figures
