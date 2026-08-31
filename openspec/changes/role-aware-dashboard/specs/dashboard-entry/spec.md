## Purpose

Defines what a user sees when they open the app or click "Dashboard" in the sidebar: managers get a chooser between their personal and management dashboards, everyone else goes straight to their personal one.

## ADDED Requirements

### Requirement: Management roles land on the dashboard chooser

When a user whose roles include any of `Admin`, `Head of HR`, `HR`, `Operation Manager`, or `Team Leader` navigates to `/`, the system SHALL render a dashboard chooser offering exactly two destinations: "Self Employee Dashboard" and "Employee Manage Dashboard".

The chooser is a hub, not one-time onboarding: no choice is persisted, and returning to `/` always shows the chooser again.

#### Scenario: Team Leader opens the app

- **WHEN** a user with the `Team Leader` role loads `/`
- **THEN** the chooser is shown with a "Self Employee Dashboard" option and an "Employee Manage Dashboard" option
- **AND** neither the personal dashboard widgets nor the management widgets are rendered on `/` itself

#### Scenario: Admin returns to the chooser after picking

- **WHEN** an `Admin` user has navigated to `/dashboard/manage` and then clicks "Dashboard" in the sidebar
- **THEN** the system navigates to `/` and shows the chooser again
- **AND** no prior selection is pre-applied or remembered

#### Scenario: User holds a management role plus Team Member

- **WHEN** a user whose roles are `["Team Member", "HR"]` loads `/`
- **THEN** the chooser is shown (holding any management role is sufficient)

### Requirement: Non-management users go straight to the self dashboard

When a user with none of the five management roles navigates to `/`, the system SHALL render the Self Employee Dashboard directly, with no chooser.

#### Scenario: Team Member opens the app

- **WHEN** a user whose only role is `Team Member` loads `/`
- **THEN** the Self Employee Dashboard is rendered at `/`
- **AND** no chooser is shown

#### Scenario: System Admin / DevOps is unaffected

- **WHEN** a user whose only role is `System Admin / DevOps` loads `/`
- **THEN** the system does not show the chooser (this role is not a management role for dashboard purposes)

### Requirement: Direct dashboard routes

The system SHALL expose `/dashboard/me` rendering the Self Employee Dashboard and `/dashboard/manage` rendering the Employee Manage Dashboard, reachable by direct navigation and by selecting an option from the chooser.

#### Scenario: Chooser selection navigates to a route

- **WHEN** a manager selects "Employee Manage Dashboard" from the chooser
- **THEN** the system navigates to `/dashboard/manage` and renders the management dashboard

#### Scenario: Non-manager is kept out of the management route

- **WHEN** a user with no management role navigates directly to `/dashboard/manage`
- **THEN** the system redirects them to `/dashboard/me`

#### Scenario: Anyone may view their own self dashboard

- **WHEN** any authenticated user navigates directly to `/dashboard/me`
- **THEN** the Self Employee Dashboard is rendered regardless of role

### Requirement: Sidebar Dashboard link is unchanged

The sidebar SHALL keep a single "Dashboard" entry pointing at `/`. Its active state SHALL also be considered active while the user is on `/dashboard/me` or `/dashboard/manage`.

#### Scenario: Active highlight on a sub-route

- **WHEN** a manager is on `/dashboard/manage`
- **THEN** the sidebar "Dashboard" item is shown as the active item
