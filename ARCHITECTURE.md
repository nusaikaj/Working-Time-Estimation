# Architecture — Working Time Estimation System

This document is the single source of truth for how the system is designed. Every
later step (database, backend, auth, calculation engine, tests, frontend, docker)
implements what is described here — nothing here should change without updating
this file first.

## 1. High-Level Overview

A full-stack app where a **PM** creates tasks, assigns them to **Engineers**, and
the backend computes a task's end date/time from a start date/time + an
estimate expressed in **fractional working days** (e.g. `3.25`, `-5.5`). The
estimate math (weekends, holidays, working hours, partial days) happens
**exclusively on the backend** in one isolated, pure, unit-testable module.

```
┌────────────────────┐        HTTPS/JSON        ┌───────────────────────┐        SQL        ┌────────────┐
│   React Frontend    │ ───────────────────────▶ │   Express Backend     │ ─────────────────▶ │   MySQL    │
│  (Vite + MUI + RHF) │ ◀─────────────────────── │  (REST API, JWT auth) │ ◀───────────────── │ (Sequelize)│
└────────────────────┘                           └───────────────────────┘                    └────────────┘
                                                            │
                                                            ▼
                                                  services/timeCalculationService.js
                                                  (pure function, zero I/O, unit tested)
```

### Architectural principles

1. **Layered backend**: `routes → controllers → services → models`. Controllers
   never touch Sequelize directly and never contain business logic; they parse
   the request, delegate to a service, and shape the response.
2. **The calculation engine is a pure module.** It receives primitives (a JS
   `Date`, a number, working-hours strings, arrays of holidays) and returns a
   primitive. It has no dependency on Express, Sequelize, or the database, so it
   can be unit tested in complete isolation and reused anywhere (API, script,
   future batch job).
3. **Validation at the boundary.** `express-validator` schemas run in
   middleware before a request ever reaches a controller. React Hook Form +
   Yup mirror the same rules client-side for instant feedback, but the server
   is the authority — the frontend check is a UX nicety, never trusted.
4. **Authorization is declarative.** A `requireRole('PM')` middleware guards
   PM-only routes; row-level checks (an engineer can only see their own tasks)
   happen inside the service layer by filtering on `req.user.id`.
5. **Config over hardcoding.** Working hours and holidays live in the
   `working_settings` / `recurring_holidays` / `one_time_holidays` tables, not
   in code, so a PM can change them without a deploy.
6. **Stateless auth.** JWT in an `Authorization: Bearer` header. No server-side
   sessions — horizontally scalable, Docker/K8s friendly.

## 2. Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js              # centralised, validated process.env access
│   │   └── database.js         # Sequelize instance + connection config
│   ├── models/                 # Sequelize models (1 file per table) + index.js
│   ├── controllers/            # thin HTTP layer — req/res only
│   ├── routes/                 # express.Router() definitions per resource
│   ├── middleware/
│   │   ├── auth.middleware.js       # verifies JWT, attaches req.user
│   │   ├── role.middleware.js       # requireRole('PM'|'ENGINEER')
│   │   ├── validate.middleware.js   # express-validator result handler
│   │   └── errorHandler.middleware.js
│   ├── services/
│   │   ├── timeCalculationService.js  # THE algorithm — pure, framework-free
│   │   ├── authService.js
│   │   ├── taskService.js
│   │   └── settingsService.js
│   ├── validators/              # express-validator chains per resource
│   ├── utils/                   # ApiError, ApiResponse, asyncHandler, logger
│   ├── database/
│   │   ├── migrations/          # sequelize-cli migrations (schema history)
│   │   └── seeders/             # PM/engineer/task/settings seed data
│   ├── app.js                   # express app, middleware wiring (no listen())
│   └── server.js                # imports app, starts http listener
├── tests/
│   ├── unit/                    # timeCalculationService — the core test suite
│   ├── integration/              # supertest against a real test DB
│   └── setup.js
├── .env.example
├── .sequelizerc
├── jest.config.js
└── package.json
```

Why `app.js` / `server.js` are split: Supertest imports `app.js` directly and
never binds a port, so integration tests can run in parallel without EADDRINUSE
conflicts.

## 3. Frontend Folder Structure

```
frontend/
├── src/
│   ├── components/       # dumb/reusable UI (StatCard, DataTable, StatusChip…)
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   └── settings/
│   ├── pages/             # route-level screens
│   │   ├── auth/          # Login, Register
│   │   ├── pm/            # Dashboard, CreateTask, TaskDetails, Settings
│   │   └── engineer/      # Dashboard, TaskDetails
│   ├── layouts/           # AppLayout (Sidebar + Navbar), AuthLayout
│   ├── hooks/              # useAuth, useTasks, useDebounce…
│   ├── services/           # axios instance + api*.js per resource
│   ├── contexts/           # AuthContext, ThemeContext
│   ├── theme/              # MUI theme (dark, professional palette)
│   ├── routes/             # ProtectedRoute, role-based route guards
│   └── utils/              # formatters, constants
```

## 4. Database Schema (see Step 2 for full Sequelize implementation)

| Table                | Purpose                                                   |
|----------------------|------------------------------------------------------------|
| `users`              | PM + Engineer accounts, hashed passwords, `role` enum       |
| `tasks`               | title, description, assignedEngineer (FK→users), estimateDays (decimal, signed), startDateTime, calculatedEndDateTime, status |
| `working_settings`    | single-row table: `workingStartTime`, `workingEndTime`      |
| `recurring_holidays`  | `month` + `day` — repeats every year (e.g. 17 May)          |
| `one_time_holidays`   | a single `holidayDate` (e.g. 27 May 2004)                   |

Relationships: `tasks.assignedEngineer → users.id` (many tasks per engineer).

## 5. Time Calculation Engine — Design

Isolated in `services/timeCalculationService.js`, exposing:

```js
calculateEndDateTime({ startDateTime, estimateDays, workingSettings, recurringHolidays, oneTimeHolidays }) -> Date
```

Algorithm (minute precision, seconds truncated):

1. **Normalize** — clone the start `Date`, zero out seconds/ms.
2. **Snap to working window** — if start falls outside working hours or on a
   non-working day (weekend/holiday), snap forward (positive estimate) or
   backward (negative estimate) to the nearest valid working instant:
   - before opening time → same day, opening time
   - after closing time → next working day, opening time
   - on a non-working day → advance to next (or previous) working day, opening time
3. **Convert estimate to whole minutes** — `estimateDays * workingMinutesPerDay`,
   rounded to the nearest minute. This is the single point where fractional
   days become a minute count, so `3.25` days at 8 working hours/day = `1560`
   minutes (3 days + 2 hours), and every downstream step only ever deals in
   whole minutes.
4. **Walk minute-by-minute in day-sized jumps** — while remaining minutes ≠ 0,
   compute how much room is left in the current working day (from the current
   pointer to closing time, or to opening time for the negative/backward
   direction). Consume `min(remaining, roomInDay)` minutes, advance the
   pointer, and if room in the day is exhausted, jump the pointer to the next
   (or previous) valid working day's opening/closing instant, skipping
   weekends and holidays.
5. **Direction symmetry** — the negative-estimate path is the mirror image of
   the positive path (walking backward from closing time toward opening time,
   skipping non-working days backward), not a separate ad-hoc algorithm — this
   is what makes `-5.5` days behave as the exact inverse of `+5.5`.
6. **Zero estimate** — after snapping to the valid window, an estimate of `0`
   returns the snapped start instant unchanged.
7. **Return** a `Date` truncated to the minute.

This module has **zero dependencies on Express/Sequelize** — the caller
(`taskService.js`) is responsible for loading `workingSettings` /
`recurringHolidays` / `oneTimeHolidays` from the DB and passing plain objects
in, which is exactly what makes it trivial to unit test with Jest against the
assignment's worked examples.

## 6. Auth & Authorization Flow

1. `POST /api/auth/register` — Engineer self-registration only (role forced to
   `ENGINEER` server-side; PM accounts are seeded, not self-registered, per the
   assignment: "PM Login / Engineer Login" + "Register" appears only under
   Engineer Features).
2. `POST /api/auth/login` — validates credentials with bcrypt, returns a JWT
   (`{ id, role }` payload, short expiry) + user profile.
3. `auth.middleware.js` verifies the JWT on every protected route and attaches
   `req.user`.
4. `role.middleware.js` (`requireRole('PM')`) blocks Engineers from
   create/assign/calculate/settings routes at the router level.
5. Row-level scoping: `taskService.listForUser(user)` filters
   `WHERE assignedEngineer = user.id` when `user.role === 'ENGINEER'`, and
   returns everything for `PM`. Engineers can never fetch another engineer's
   task even by guessing an ID (`taskService.getById` re-checks ownership).

## 7. API Surface (REST, JSON, all under `/api`)

| Method | Path                     | Role         | Purpose                                   |
|--------|--------------------------|--------------|--------------------------------------------|
| POST   | `/auth/register`         | public       | Engineer self-registration                 |
| POST   | `/auth/login`            | public       | PM or Engineer login                       |
| GET    | `/auth/me`               | any          | current user profile                       |
| GET    | `/users/engineers`       | PM           | list engineers (for assignment dropdown)   |
| GET    | `/tasks`                 | any          | list tasks (scoped by role)                |
| POST   | `/tasks`                 | PM           | create task                                |
| GET    | `/tasks/:id`             | any          | task detail (scoped)                       |
| PATCH  | `/tasks/:id`             | PM           | update title/description/status            |
| PATCH  | `/tasks/:id/assign`      | PM           | (re)assign engineer                        |
| POST   | `/tasks/:id/calculate`   | PM           | run calculation engine, persist end date   |
| PATCH  | `/tasks/:id/estimate`    | ENGINEER     | submit/update own estimateDays             |
| GET    | `/settings`              | any          | read working hours                         |
| PUT    | `/settings`              | PM           | update working hours                       |
| GET    | `/holidays/recurring`    | any          | list recurring holidays                    |
| POST   | `/holidays/recurring`    | PM           | add recurring holiday                      |
| DELETE | `/holidays/recurring/:id`| PM           | remove recurring holiday                   |
| GET    | `/holidays/one-time`     | any          | list one-time holidays                     |
| POST   | `/holidays/one-time`     | PM           | add one-time holiday                       |
| DELETE | `/holidays/one-time/:id` | PM           | remove one-time holiday                    |

All success responses: `{ success: true, data, message }`. All errors:
`{ success: false, message, errors? }` with correct HTTP status via a central
`errorHandler.middleware.js` + custom `ApiError`.

## 8. Testing Strategy

- **Unit tests** (`tests/unit/timeCalculationService.test.js`): the algorithm
  against dozens of hand-computed cases plus the 5 worked examples from the
  assignment — no DB, no HTTP, pure function in/out, sub-millisecond per test.
- **Integration tests** (`tests/integration/*.test.js`): Supertest driving
  `app.js` against a real (test) MySQL database — auth flow, role
  authorization, task CRUD, end-to-end "create task → assign → calculate →
  verify persisted `calculatedEndDateTime`".
- Coverage gate configured in `jest.config.js`, target ≥95% on
  `services/timeCalculationService.js`.

## 9. Delivery Plan (this session)

1. ✅ Architecture (this document + folder scaffold)
2. Database — Sequelize models, migrations, seeders
3. Backend core — app.js, config, middleware skeleton, utils
4. Auth — JWT + bcrypt + role guards + auth routes/controllers
5. Time Calculation Engine — full algorithm
6. Jest unit + integration tests
7. Frontend — full MUI app
8. Docker — Dockerfiles + docker-compose
9. README + CI + lint/format + polish

Each step lands as complete, working code — no stubs carried forward.
