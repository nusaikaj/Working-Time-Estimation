# Working Time Estimation System

A full-stack application for Project Managers to create and assign tasks to
Engineers, who submit fractional working-day estimates; the backend then
computes the exact task end date/time using a configurable working-hours,
weekend, and holiday-aware calculation engine.

> See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design rationale, API
> contract, and the calculation engine's algorithm walkthrough.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Run Backend](#run-backend)
- [Run Frontend](#run-frontend)
- [Run Tests](#run-tests)
- [Docker](#docker)
- [Demo Credentials](#demo-credentials)
- [API Documentation](#api-documentation)
- [Folder Structure](#folder-structure)
- [Assumptions](#assumptions)
- [Limitations](#limitations)
- [Future Improvements](#future-improvements)

---

## Project Overview

Two roles:

- **PM** — creates tasks, assigns them to engineers, configures working
  hours/holidays, and triggers the end-date calculation.
- **Engineer** — sees only their own assigned tasks and submits a fractional
  (and possibly negative) working-day estimate for each.

The core deliverable is **`backend/src/services/timeCalculationService.js`**:
given a start date/time and a signed, fractional estimate in working days, it
returns the exact end date/time, correctly handling weekends, recurring and
one-time holidays, working-hour boundaries, partial days, and minute-precision
rounding. **This calculation only ever runs on the backend** — the frontend
never computes it.

## Architecture

Layered backend (`routes → controllers → services → models`), with the
calculation engine implemented as a pure, framework-free function so it can
be unit tested in complete isolation. Full details, diagrams, and the API
contract are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios, Material UI, React Hook Form, Yup, React Toastify |
| Backend | Node.js, Express.js |
| Database | MySQL, Sequelize ORM |
| Auth | JWT, bcrypt |
| Testing | Jest, Supertest |
| Tooling | ESLint, Prettier, Docker, GitHub Actions |

## Installation

Prerequisites: **Node.js ≥ 18**, **MySQL ≥ 8.0** (or Docker — see
[Docker](#docker) to skip installing MySQL/Node locally entirely).

```bash
git clone <this-repo>
cd "working time estimation"
```

## Database Setup

1. Create the databases (development + test):

   ```sql
   CREATE DATABASE working_time_estimation;
   CREATE DATABASE working_time_estimation_test;
   ```

   (Or run `backend/src/database/schema.sql` directly — it creates
   `working_time_estimation` and every table. The test database only needs
   the migrations, run next.)

2. Configure environment variables:

   ```bash
   cd backend
   cp .env.example .env
   # edit .env with your MySQL credentials
   ```

3. Run migrations, then seed demo data:

   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   ```

   This creates the `users`, `tasks`, `working_settings`,
   `recurring_holidays`, and `one_time_holidays` tables, then seeds:
   - 1 PM account, 3 Engineer accounts (see [Demo Credentials](#demo-credentials))
   - Default working hours (08:00–16:00)
   - Recurring holiday (17 May) + one-time holiday (27 May 2004) — the same
     dates used in the assignment's worked examples
   - 5 sample tasks in various states

## Run Backend

```bash
cd backend
npm install      # if not already done
npm run dev      # nodemon, http://localhost:5000
# or: npm start   for a plain production start
```

Health check: `GET http://localhost:5000/api/health`

## Run Frontend

```bash
cd frontend
npm install
cp .env.example .env   # optional — defaults to Vite's dev proxy at /api
npm run dev             # http://localhost:5173
```

The dev server proxies `/api/*` to `http://localhost:5000` (see
`vite.config.js`), so the backend must be running for the app to function.

## Run Tests

```bash
cd backend
npm test              # unit + integration
npm run test:coverage # adds a coverage report (coverage/ + terminal summary)
```

- **Unit tests** (`tests/unit/timeCalculationService.test.js`) are pure —
  no database required. They include all 5 worked examples from the
  assignment plus dozens of edge cases (weekends, holidays, boundary times,
  leap years, month/year rollovers, extreme magnitudes, input validation).
  Coverage on this file is enforced at **95%** by `jest.config.js` (currently
  100%).
- **Integration tests** (`tests/integration/*.test.js`) drive the real
  Express app with Supertest against the **test** database
  (`DB_NAME_TEST` in `.env`) — make sure that database exists and migrations
  have been run (or just `sequelize.sync()` handles it, as the tests do in
  `beforeAll`). They cover the full auth flow and role-based authorization,
  including the create → assign → estimate → calculate task lifecycle.

## Docker

The fastest way to run everything (MySQL + backend + frontend) with zero
local installs beyond Docker itself:

```bash
cp .env.example .env   # root .env, used by docker-compose.yml
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api
- MySQL: localhost:3306 (credentials from `.env`)

On first boot the backend container waits for MySQL, runs migrations
automatically, and — because `RUN_SEED_ON_BOOT=true` by default in
`.env.example` — seeds the same demo data described above. Set it to `false`
in your `.env` after the first run if you don't want seeding to repeat.

## Demo Credentials

All seeded accounts share the password **`Password@123`**.

| Role | Email |
|---|---|
| PM | `pm@example.com` |
| Engineer | `engineer1@example.com` |
| Engineer | `engineer2@example.com` |
| Engineer | `engineer3@example.com` |

## API Documentation

Base URL: `/api`. Every response is `{ success, message, data }` (or
`{ success: false, message, errors }` on failure). Full endpoint-by-endpoint
authorization matrix is in [ARCHITECTURE.md § API Surface](ARCHITECTURE.md#7-api-surface-rest-json-all-under-api).

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Engineer self-registration |
| POST | `/auth/login` | public | PM or Engineer login |
| GET | `/auth/me` | any | Current user profile |
| GET | `/users/engineers` | PM | List engineers (assignment dropdown) |
| GET | `/tasks` | any | List tasks (scoped by role), `?page&limit&status&search` |
| GET | `/tasks/stats` | any | Dashboard statistics |
| POST | `/tasks` | PM | Create task |
| GET | `/tasks/:id` | any | Task detail (scoped) |
| PATCH | `/tasks/:id` | PM | Update title/description/status |
| PATCH | `/tasks/:id/assign` | PM | (Re)assign engineer |
| PATCH | `/tasks/:id/estimate` | ENGINEER | Submit/update own estimate |
| POST | `/tasks/:id/calculate` | PM | Run the calculation engine, persist result |
| GET | `/settings` | any | Read working hours |
| PUT | `/settings` | PM | Update working hours |
| GET / POST / DELETE | `/holidays/recurring[/:id]` | any / PM / PM | Recurring holidays |
| GET / POST / DELETE | `/holidays/one-time[/:id]` | any / PM / PM | One-time holidays |

## Folder Structure

```
backend/
  src/
    config/        # env.js, database.js — centralised configuration
    models/        # Sequelize models + associations
    controllers/    # thin HTTP layer
    routes/         # express.Router() per resource
    middleware/      # auth, role guard, validation, error handler
    services/        # business logic + timeCalculationService.js
    validators/       # express-validator chains
    utils/            # ApiError, ApiResponse, asyncHandler, logger
    database/
      migrations/      # sequelize-cli migrations (schema source of truth)
      seeders/          # demo data
      schema.sql        # human-readable schema mirror
  tests/
    unit/               # timeCalculationService — pure, no DB
    integration/         # Supertest against a real MySQL test DB

frontend/
  src/
    components/     # reusable UI (common/, tasks/)
    pages/           # route-level screens (auth/, plus Dashboard, TaskList…)
    layouts/          # AppLayout (sidebar+navbar), AuthLayout
    hooks/            # useDebounce, etc.
    services/         # axios client + one module per API resource
    contexts/         # AuthContext, ThemeModeContext
    routes/           # ProtectedRoute / RoleRoute guards
    theme/            # MUI theme (dark + light, professional palette)
    utils/            # formatters, constants
```

## Assumptions

- Only Engineers self-register; PM accounts are provisioned via the seed
  script (or directly in the database) — the assignment scopes "Register" to
  Engineer Features only.
- `working_settings` is a single-row table: the app always reads/writes the
  first (and only) row rather than tracking historical settings changes.
- A task's `status` is one of `PENDING` / `IN_PROGRESS` / `COMPLETED`; the
  dashboard's "Pending" counter is everything not `COMPLETED`.
- An engineer viewing/acting on a task that isn't theirs receives `404`
  (not `403`), so they can't distinguish "doesn't exist" from "not mine."
- Seconds on any date/time input are always truncated — the spec states
  seconds are ignored and calculations are minute-precision.
- The fractional-day-to-minutes conversion **floors** rather than rounds
  (verified against all 5 official worked examples in the assignment).

## Limitations

- No password-reset/email-verification flow — out of scope for the
  assignment's auth requirements.
- `working_settings` has no history/versioning; changing working hours
  affects future calculations only (past `calculatedEndDateTime` values are
  not retroactively recalculated).
- No WebSocket/real-time updates — the dashboard/task list refetch on
  navigation and after mutations, not via push updates.
- Full live browser verification of the frontend was not performed in the
  authoring environment (no headless-Chromium tooling available there); it
  was verified via a clean `vite build`, a clean ESLint pass, and a live dev
  server smoke check instead. Please do a manual click-through after setup.

## Future Improvements

- Audit log of task status/estimate/assignment changes.
- Bulk task import (CSV) for PMs.
- Email notifications when a task is assigned or its estimate is submitted.
- Per-engineer working-hour overrides (currently one global schedule).
- Optimistic UI updates + React Query for caching/retries instead of manual
  `useState`/`useEffect` data fetching.
