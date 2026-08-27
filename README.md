# Agency HRM — Frontend

Next.js 16 app for the Agency Human Resource Management System. See
[`docs/PRD.md`](docs/PRD.md) for the full product spec — this file is just enough to get
running. `docs/architecture.md`, `database.md`, `permissions.md`, and `api.md` are
quick-reference companions to the PRD.

The companion API lives in a separate repository:
[`hrms_backend`](https://github.com/medevjb/hrms_backend).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Mantine (components/theme) + Tailwind
v4 (layout utilities only — see `docs/architecture.md`) · TanStack Query · Zod ·
Playwright

## Setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL — point at the backend's /api/v1
```

The backend must be running (`hrms_backend`, `php artisan serve`) for API calls to
succeed.

## Running

```bash
npm run dev          # http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit
npm run test:e2e      # Playwright — spins up the dev server itself
```

## Layout

```text
app/            App Router — route groups, layouts, pages
features/       one folder per domain (employees, attendance, leave, payroll, ...)
components/     ui/, forms/, tables/, charts/, layouts/ — shared, cross-feature
lib/            api-client.ts (talks to /api/v1), theme.ts
e2e/            Playwright specs
```

Every HR-facing feature is built here — never in the backend's Inertia `/system`
console, which is a separate System Admin/DevOps surface (PRD §5.1).
