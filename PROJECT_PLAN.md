# Course Enrollment System — Project Plan

> **How to build:** Follow **§8 Phased build roadmap** in order (Phases **1 → 7**), using each phase’s **definition of done** before moving on.

This document is the implementation plan for a **student–administrator course enrollment platform** with authentication, role-based access, enrollment workflows (including approval), reporting, and notifications. The **frontend** is **React** with **[shadcn/ui](https://ui.shadcn.com)** styled with **Tailwind CSS**, using **[Base UI](https://base-ui.com/react/overview/quick-start)** (not Radix) as the **unstyled primitive layer** the CLI wires up when you pass `--base base`; the **backend** is **Node.js** (REST API); the database is **PostgreSQL on [Neon](https://neon.tech)** (managed, serverless-friendly Postgres).

---

## 1. Goals and scope

### 1.1 Primary goals

- Allow **students** to register, sign in, update their profile, browse courses, request enrollment, track status, cancel when allowed, and receive notifications.
- Allow **administrators** to manage students and courses, approve or reject enrollments, adjust course capacity (as part of course data), view dashboards and reports, and manage other admin accounts where required.
- Enforce **security** (JWT, password hashing, RBAC) and **persistence** in PostgreSQL, with **logging** and a **notification** subsystem.

### 1.2 Out of scope (unless requirements change)

- Payment processing, waitlists beyond simple capacity checks, multi-campus scheduling, or mobile native apps (unless the course explicitly adds them).

---

## 2. Technology stack

| Layer | Choice | Notes |
|--------|--------|--------|
| Frontend | **React** (e.g. **Vite** + React 18+) | SPA; role-aware UI (student vs admin) |
| UI components | **[shadcn/ui](https://ui.shadcn.com)** + **[Base UI](https://base-ui.com)** | Use the official CLI flag **`--base base`** so generated components use **Base UI** primitives (maintained by the MUI team), styled with Tailwind—**not** the default **Radix**-backed registry. Add only what you need (`npx shadcn@latest add …`). Use **lucide-react** for icons. |
| Styling | **Tailwind CSS** | Required by shadcn; theme via CSS variables (light/dark optional). |
| UI / data fetching | **React Router**, **TanStack Query** (optional), **fetch** or **axios** | Call the Node API with `Authorization: Bearer <jwt>` |
| Backend | **Node.js** + **Express** or **Fastify** | REST API matching the route tables below; TypeScript recommended |
| Validation | **Zod** (or Joi) | Request/response validation aligned with shared DTO shapes |
| Database | **Neon** (PostgreSQL) | Use Neon’s connection string; enable **connection pooling** (Neon pooler or PgBouncer) for serverless / many short-lived connections |
| DB access | **node-pg** / **postgres.js**, or **Prisma** / **Drizzle** | Migrations via Prisma Migrate, Drizzle Kit, Knex, or node-pg-migrate |
| Auth | **JWT** (access tokens, `jsonwebtoken` or `jose`) | Same contract: `TokenResponse` on login; middleware for protected routes |
| Passwords | **bcrypt** or **argon2** (`@node-rs/argon2`) | Never store plaintext passwords |
| Optional real-time | **Polling** from React, or **WebSockets** (e.g. Socket.IO) on Node | For live enrollment status; polling is simplest to ship first |
| Env | **dotenv** | `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN` for CORS |

**Neon notes:** Store `DATABASE_URL` from the Neon console. If the API runs in a serverless or auto-scaling environment, prefer Neon's **pooled** connection string and a small connection pool to avoid exhausting DB connections.

### 2.1 shadcn/ui with Base UI (primitive layer)

The shadcn CLI lets you choose the **headless primitive library** at init time: **`radix`** (default in many tutorials) or **`base`** ([Base UI](https://base-ui.com/react/overview/quick-start)). **This project standardizes on Base UI.**

| What to run | Notes |
|-------------|--------|
| New Vite app via shadcn | `npx shadcn@latest init -t vite --base base` (or `create` with the same `--base base`) |
| Existing project | `npx shadcn@latest init --base base` in `client/` after Tailwind is set up |

This sets `components.json` and pulls registry items that **compose** [Base UI](https://base-ui.com) components (accessibility, focus behavior) with shadcn’s Tailwind styles. **Do not** mix Radix-based shadcn components into the same project without migration—they are different APIs (e.g. Radix’s `asChild` vs Base UI’s composition patterns). Follow the **generated** code in `src/components/ui/` and [shadcn CLI docs](https://ui.shadcn.com/docs/cli) (`docs` command supports `-b base`).

---

## 3. High-level architecture

Intended request flow:

```text
Browser
    → React app (Vite dev server or static host)
        → HTTPS / JSON
            → Node.js API (Express/Fastify routers)
                → Domain services (enrollment, capacity, prerequisites)
                    → Technical services (auth/JWT, DB, notifications)
                        → Neon (PostgreSQL)
```

**Principles**

- **React** + **shadcn/ui (Base UI registry)** own layout and components (forms, tables, dialogs, dropdowns, toasts); client-side routing; store the JWT in memory, `httpOnly` cookie (preferred in production), or `localStorage` (common for labs—document the tradeoff).
- **API routes** stay thin: validate input (Zod), call services, return JSON; map errors to HTTP status codes.
- **Domain services** own rules: e.g. “cannot enroll if course full,” “prerequisite not satisfied,” “only admin can approve.”
- **Repositories / DB layer** isolate SQL; types shared or duplicated between backend and optional `packages/shared` for DTOs.
- **CORS**: Allow the React dev origin (e.g. `http://localhost:5173`) and production frontend URL via `CLIENT_ORIGIN`.

---

## 4. Feature checklist

### 4.1 Student features

| Feature | Plan |
|---------|------|
| User registration | `POST /auth/register` creates a student user; validate email uniqueness |
| Login & logout | `POST /auth/login`, `POST /auth/logout` (client may discard token; optional server-side denylist later) |
| Update profile | `PUT /students/{student_id}` with authorization so users only update self unless admin |
| View available courses | `GET /courses`, `GET /courses/{course_id}` |
| Select / enroll in courses | `POST /enrollments` → create pending enrollment where policy requires approval |
| View enrollment status | `GET /students/{student_id}/enrollments` and/or `GET /enrollments/{id}` |
| Cancel enrollment | `DELETE /enrollments/{id}` with ownership/admin checks |
| Receive notifications | `GET /notifications`, `PUT /notifications/{id}/read`; optionally `GET /students/{id}/notifications` |

### 4.2 Administrator features

| Feature | Plan |
|---------|------|
| Admin login | Same `POST /auth/login` with `role=admin` in token claims |
| Manage students (CRUD) | `GET /students`, `GET/PUT/DELETE /students/{id}`; align with `/admin/students` for listing |
| Manage courses (CRUD) | `POST/PUT/DELETE /courses`, prerequisites sub-routes |
| Approve / reject enrollments | `PUT /enrollments/{id}/approve`, `PUT /enrollments/{id}/reject` |
| View reports & statistics | `GET /admin/dashboard`, `GET /admin/reports/*` |
| Manage course capacities | Store `capacity` (and optionally `enrolled_count` or derive count) on **courses**; enforce on approve/enroll |

### 4.3 System features

| Feature | Plan |
|---------|------|
| RBAC | Middleware: `authenticate`, `requireAdmin`, `requireStudent` (or scoped permissions) on Express/Fastify routes |
| JWT authentication | Issue signed JWT on login; validate on protected routes |
| Secure password hashing | Hash at registration/password change; verify at login |
| Real-time enrollment status | Minimum: accurate status after each action; optional push/SSE/WebSocket later |
| Database persistence | Neon PostgreSQL: tables + migrations |
| Logging and notifications | Structured logging for audit; `notifications` table + send paths (admin/system → user) |

---

## 5. API surface (consolidated)

Use this as the master route list for implementation and tests. Some paths overlap by design (`/students` vs `/admin/students`, `/enrollments` vs `/admin/enrollments`); implementation can delegate both to the same service methods.

### 5.1 Authentication

| Method | Endpoint | Access | Response model |
|--------|----------|--------|----------------|
| POST | `/auth/register` | Public | `StudentResponse` |
| POST | `/auth/login` | Public | `TokenResponse` |
| GET | `/auth/me` | Authenticated | `UserResponse` |
| POST | `/auth/logout` | Authenticated | `MessageResponse` |
| POST | `/auth/change-password` | Authenticated | `MessageResponse` |

### 5.2 Students

| Method | Endpoint | Access | Response model |
|--------|----------|--------|----------------|
| GET | `/students` | Admin | `List[StudentResponse]` |
| GET | `/students/{student_id}` | Authenticated (scoped) | `StudentResponse` |
| PUT | `/students/{student_id}` | Authenticated (scoped) | `StudentResponse` |
| DELETE | `/students/{student_id}` | Admin | `MessageResponse` |
| GET | `/students/{student_id}/enrollments` | Authenticated (scoped) | `List[EnrollmentResponse]` |
| GET | `/students/{student_id}/notifications` | Authenticated (scoped) | `List[NotificationResponse]` |

### 5.3 Courses

| Method | Endpoint | Access | Response model |
|--------|----------|--------|----------------|
| GET | `/courses` | All (public or authenticated per policy) | `List[CourseResponse]` |
| GET | `/courses/{course_id}` | All | `CourseResponse` |
| POST | `/courses` | Admin | `CourseResponse` |
| PUT | `/courses/{course_id}` | Admin | `CourseResponse` |
| DELETE | `/courses/{course_id}` | Admin | `MessageResponse` |
| GET | `/courses/{course_id}/students` | Admin | `List[StudentResponse]` |
| POST | `/courses/{course_id}/prerequisites` | Admin | `MessageResponse` |
| DELETE | `/courses/{course_id}/prerequisites/{prereq_id}` | Admin | `MessageResponse` |

### 5.4 Enrollments

| Method | Endpoint | Access | Response model |
|--------|----------|--------|----------------|
| POST | `/enrollments` | Student | `EnrollmentResponse` |
| GET | `/enrollments/{id}` | Authenticated | `EnrollmentResponse` |
| GET | `/enrollments` | Admin | `List[EnrollmentResponse]` |
| PUT | `/enrollments/{id}/approve` | Admin | `EnrollmentResponse` |
| PUT | `/enrollments/{id}/reject` | Admin | `EnrollmentResponse` |
| DELETE | `/enrollments/{id}` | Student / Admin | `MessageResponse` |

### 5.5 Admin aggregation & reports

| Method | Endpoint | Response model |
|--------|----------|----------------|
| GET | `/admin/dashboard` | `DashboardResponse` |
| GET | `/admin/students` | `List[StudentResponse]` |
| GET | `/admin/courses` | `List[CourseResponse]` |
| GET | `/admin/enrollments` | `List[EnrollmentResponse]` |
| POST | `/admin/admins` | `AdminResponse` |
| PUT | `/admin/admins/{id}` | `AdminResponse` |
| DELETE | `/admin/admins/{id}` | `MessageResponse` |
| GET | `/admin/reports/enrollments` | `List[ReportResponse]` |
| GET | `/admin/reports/students` | `List[ReportResponse]` |
| GET | `/admin/reports/courses` | `List[ReportResponse]` |

### 5.6 Notifications

| Method | Endpoint | Response model |
|--------|----------|----------------|
| GET | `/notifications` | `List[NotificationResponse]` |
| POST | `/notifications` | `NotificationResponse` |
| PUT | `/notifications/{id}/read` | `MessageResponse` |

---

## 6. Data model (PostgreSQL on Neon)

### 6.1 Confirmed from specification

**Users (students and admins)**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'admin')),
    is_active BOOLEAN DEFAULT TRUE
);
```

### 6.2 Tables to add (plan)

| Table | Purpose |
|-------|---------|
| `courses` | Course catalog; include `capacity`, timestamps, title, code, description |
| `course_prerequisites` | Many-to-many: course → prerequisite course |
| `enrollments` | Student–course link; `status` (e.g. pending, approved, rejected, cancelled); timestamps |
| `notifications` | User-targeted messages; `read` flag; optional `type` |
| Optional: `refresh_tokens` or `sessions` | If implementing server-side logout invalidation |

**Enrollment status** (define explicitly in code and DB check constraint or enum type): e.g. `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

---

## 7. Security and authorization rules (plan)

- **JWT**: Include `sub` (user id), `role`, `exp`; sign with a strong secret from environment variables.
- **Student routes**: Students may only access their own `student_id` resources unless the spec allows broader access.
- **Admin routes**: Guard with `role == admin`.
- **POST /notifications**: Restrict who can send (admin or system); students should not broadcast arbitrary notifications.
- **Password change**: Requires current password verification.
- **HTTPS** in production; never log tokens or passwords.

---

## 8. Phased build roadmap

Build **in order**: each phase has a **definition of done (DoD)**. Skip starting the next phase until the current one meets its DoD (unless you parallelize backend/frontend with clear handoffs).

### 8.1 Phase overview

| Phase | Name | Primary outcome | Depends on |
|-------|------|-----------------|------------|
| **1** | Project & platform foundation | Repo layout, Neon, `users` table, API shell, React + shadcn (Base UI) scaffold, CORS | — |
| **2** | Authentication | Register, login, JWT, `/auth/me`, change password, logout; minimal auth UI | Phase 1 |
| **3** | Courses & prerequisites | Course CRUD + capacity; public list/detail; prerequisite routes; browse + admin course UI | Phase 2 |
| **4** | Enrollments workflow | Enroll, approve/reject, cancel; business rules (capacity, duplicates, prerequisites); student + admin enrollment UI | Phase 3 |
| **5** | Students & admin aggregation | Profile update, `/students/*` nested routes; `/admin/*` dashboard & reports; admin shell + student shell | Phase 4 |
| **6** | Notifications & system polish | Notification APIs, in-app list/read; create on key events; structured logging; error shape consistency | Phase 5 |
| **7** | Quality & handoff | Tests, README, env checklist, optional OpenAPI | Phase 6 |

```text
1 → 2 → 3 → 4 → 5 → 6 → 7
```

### 8.0 Implementation status

As of **2026-04-14**, verified against the repo: **Phases 1–7** are implemented (run `npm run dev` from the root; apply migrations in `server/drizzle/` per `README.md`). **Phase 7** includes Vitest (unit + HTTP smoke), optional DB integration tests behind `RUN_DB_INTEGRATION=1`, OpenAPI/Swagger UI at **`/documentation`**, and GitHub Actions CI.

#### Phases 1–7 (done)

| Phase | Status | Summary |
|-------|--------|---------|
| **1** | Done | Workspaces (`client/` / `server/`), Neon + `users` migration, Fastify shell (`GET /health`, `GET /health/db`), CORS, Vite + Tailwind + shadcn (**Base UI** registry in `client/components.json`; stack table §2 still accurate) |
| **2** | Done | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/change-password`; `authenticate` / `requireRole`; JWT (`jose`) + bcrypt; login/register/account UI |
| **3** | Done | `courses`, `course_prerequisites`; public `GET /courses`, `GET /courses/:id`; admin course CRUD + prerequisites; `GET /courses/:id/students` lists users with **APPROVED** enrollment |
| **4** | Done | `enrollments` with status constraint + unique `(user_id, course_id)`; `POST /enrollments`, `GET /enrollments` (admin), `GET /enrollments/mine`, `GET /enrollments/:id`, approve/reject/cancel; capacity + prerequisite rules server-side; student + admin enrollment UIs |
| **5** | Done | `GET /students` (admin), scoped `GET/PUT /students/:id`, `DELETE /students/:id` (admin), `GET /students/:id/enrollments`; `/admin/dashboard`, `/admin/students`, `/admin/courses`, `/admin/enrollments`, `/admin/reports/*`, `/admin/admins` CRUD; student profile on **`/account`**; admin layout under **`/admin/*`** |
| **6** | Done | `notifications` table + Drizzle migration; `GET/POST /notifications`, `PUT /notifications/:id/read`; approve/reject emits student notifications in a **DB transaction**; `GET /students/:id/notifications` uses same data; `NotificationMenu` + Sonner; optional admin “send notification” on **`/admin/dashboard`**; Fastify **Pino** config (`LOG_LEVEL`, redact, `pino-pretty` in dev) |
| **7** | Done | **Vitest** in `server/`: unit tests (`password`, `jwt`), `app.inject` smoke for **`GET /health`**; optional **`RUN_DB_INTEGRATION=1`** register+login test against a real DB; **`npm test`** at repo root; **OpenAPI** via `@fastify/swagger` + **`@fastify/swagger-ui`** at **`/documentation`**; **CI** — `.github/workflows/ci.yml` (lint, test, build) |

#### Phase 7 (detail)

| Planned item | Status |
|--------------|--------|
| README: clone, env vars, migrate, scripts, first admin | **Done** — see root `README.md` |
| Unit/integration tests (Vitest/Jest) | **Done** — `server/src/**/*.test.ts`; DB integration optional (`RUN_DB_INTEGRATION=1`) |
| Optional OpenAPI | **Done** — Swagger UI at **`GET /documentation`** (OpenAPI 3.0 spec; route detail depends on Fastify JSON schemas) |
| CI pipeline | **Done** — GitHub Actions on `main`/`master` |

**Stack note:** **TanStack Query** (§2) is optional and is **not** used; the client uses `fetch` via `client/src/lib/api.ts`.

**API note:** Student “my enrollments” can use **`GET /enrollments/mine`** or **`GET /students/{id}/enrollments`** (scoped). **`GET /students/{id}/notifications`** returns the same notification list as **`GET /notifications`** (scoped to that student when the caller is the student or an admin).

---

### Phase 1 — Project & platform foundation

| Track | Work |
|--------|------|
| **Repository** | `client/` (Vite + React + TypeScript), `server/` (Node + Express or Fastify + TypeScript). Root or workspace `package.json` as you prefer. |
| **Database** | Neon project; **pooled** `DATABASE_URL` in `server/.env`. First migration: `users` table (see §6.1). |
| **Server** | App entry, config loader (`dotenv`), JSON body parser, **CORS** for Vite dev origin (`CLIENT_ORIGIN`), `GET /health` and a DB ping route. |
| **Client** | Tailwind → `npx shadcn@latest init -t vite --base base` (or `init --base base`); add `button`, `input`, `card` to prove the pipeline. |
| **Shared** | Optional `packages/shared` or duplicated TS types for `MessageResponse`, `UserResponse` shapes. |

**Definition of done:** `npm run dev` (or equivalent) runs client and server; health + DB check succeed; blank routed shell page loads with one shadcn-styled component; migrations apply cleanly to Neon.

---

### Phase 2 — Authentication

| Track | Work |
|--------|------|
| **Backend** | `POST /auth/register`, `POST /auth/login` (bcrypt/argon2 verify + JWT), `GET /auth/me`, `POST /auth/logout`, `POST /auth/change-password`. Middleware: `authenticate`, `requireRole`. |
| **Frontend** | Login + register pages (react-hook-form + Zod + shadcn `Form`); store JWT; protected route wrapper; redirect after login; show logged-in user from `/auth/me`. |

**Definition of done:** A student can register and log in; JWT is sent on protected calls; password change works; logout clears client token (and matches server contract if you add denylist later).

---

### Phase 3 — Courses & prerequisites

| Track | Work |
|--------|------|
| **Database** | `courses`, `course_prerequisites` (or equivalent schema). Include **capacity** on `courses`. |
| **Backend** | `GET /courses`, `GET /courses/:id` (policy: public vs auth per §10); admin: `POST/PUT/DELETE /courses`, `GET /courses/:id/students`, prerequisite `POST/DELETE` routes. |
| **Frontend** | **Student:** course catalog + detail pages. **Admin:** course list + create/edit/delete + prerequisites + capacity field. |

**Definition of done:** Admins manage full course catalog; students see catalog and details; prerequisites and capacity persist in Neon.

---

### Phase 4 — Enrollments workflow

| Track | Work |
|--------|------|
| **Database** | `enrollments` with `status` enum/constraint (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`). |
| **Backend** | `POST /enrollments`, `GET /enrollments/:id`, `GET /enrollments` (admin), `PUT .../approve`, `PUT .../reject`, `DELETE /enrollments/:id`. Enforce: no duplicate active enrollments, capacity on approve, prerequisite checks. |
| **Frontend** | **Student:** enroll button + my enrollments list with status. **Admin:** pending queue; approve/reject; optional cancel. |

**Definition of done:** End-to-end enrollment lifecycle works; capacity and prerequisites enforced server-side.

---

### Phase 5 — Students & admin aggregation

| Track | Work |
|--------|------|
| **Backend** | `GET/PUT/DELETE /students` and `/students/:id` (RBAC); `GET /students/:id/enrollments`, `GET /students/:id/notifications` (can align with data from Phase 4). **Admin:** `GET /admin/dashboard`, `GET /admin/students`, `/admin/courses`, `/admin/enrollments`, reports under `/admin/reports/*`, `POST/PUT/DELETE /admin/admins`. Reuse service layer for duplicate list routes (`/students` vs `/admin/students`) if desired. |
| **Frontend** | **Student:** profile edit. **Admin:** layout (nav), dashboard stats, consolidated lists, report views, enrollment/student/course report pages. |

**Definition of done:** Admin sees dashboard and reports; student updates own profile; admin CRUD for admins matches API (if in scope).

---

### Phase 6 — Notifications & system polish

| Track | Work |
|--------|------|
| **Database** | `notifications` table (`user_id`, `body`, `read`, timestamps, optional `type`). |
| **Backend** | `GET /notifications`, `POST /notifications` (restrict senders), `PUT /notifications/:id/read`. Emit notifications on enrollment approve/reject (and other events you define). |
| **Frontend** | Notification bell or list + mark read; toasts (Sonner or shadcn) for mutation feedback. |
| **Ops** | Structured logging (**pino**); consistent error JSON `{ message, code? }`; optional Swagger/OpenAPI for Express. |

**Definition of done:** Users see notifications for enrollment decisions; logs are useful for debugging; API errors are predictable.

---

### Phase 7 — Quality & handoff

| Track | Work |
|--------|------|
| **Tests** | Unit tests for domain services (**Vitest** / **Jest**); integration tests for auth + one critical flow (e.g. enroll → approve). Use a Neon **branch** or test DB. |
| **Docs** | `README`: clone, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, migrate, `client` + `server` scripts, first admin bootstrap (see §10). |

**Definition of done:** CI or documented manual test pass; new developer can run the stack from README alone.

---

### 8.2 Parallelization (optional)

- **Backend-first:** Complete Phases 1–2 API, then 3–4 API before heavy UI—use **Postman/Thunder Client** or `curl` until Phase 2–4 UI catches up.
- **Vertical slices:** After Phase 2, each feature can be “API slice + UI slice” (e.g. Phase 3 courses end-to-end before Phase 4) if the team prefers full-stack milestones.

---

## 9. Deliverables

| Deliverable | Description |
|-------------|-------------|
| Runnable API | Node.js server with planned routes implemented or explicitly stubbed with clear contract |
| Runnable UI | React app for student and admin flows against the API |
| Database | Neon database with migrations reflecting final schema |
| Documentation | README with env vars and run instructions; this plan updated if scope changes |
| Evidence of security | Hashed passwords, JWT on protected routes, RBAC tests |

---

## 10. Open decisions (resolve early)

1. **Duplicate admin list endpoints**: Whether `/admin/students` must differ from `GET /students` or can call the same handler.
2. **Public vs authenticated** `GET /courses`: **Resolved in implementation** — catalog list/detail are **public** (no JWT); mutations remain admin-only.
3. **Real-time**: Polling only vs WebSocket for enrollment status.
4. **First admin user**: **Partially addressed** — registration creates students; `npm run promote-admin -w server -- <email>` (see `README.md`) promotes an existing user to admin for local QA.

---

## 11. Revision history

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-14 | Initial plan from feature list and API specification |
| 1.1 | 2026-04-14 | Stack: React (frontend), Node.js (API), Neon (PostgreSQL) |
| 1.2 | 2026-04-14 | UI: shadcn/ui + Tailwind (documented in stack and Phase 1 / 5) |
| 1.3 | 2026-04-14 | UI primitives: **Base UI** via `shadcn init --base base`; Radix explicitly out of scope |
| 1.4 | 2026-04-14 | **§8** restructured into phased roadmap (overview table, DoD per phase, §8.2 parallelization) |
| 1.5 | 2026-04-14 | **§8.0** implementation status: Phases **1–4** marked **Done**; §10 items 2 and 4 updated to reflect current repo |
| 1.6 | 2026-04-14 | **§8.0** Phase **5** marked **Done** (students + admin aggregation API and UI) |
| 1.7 | 2026-04-14 | **§8.0** re-verified against repo: Phases **1–5** done; **6** not started; **7** partial (README only); gaps listed (notifications API, tests, OpenAPI, CI); stack clarifications (JWT lib, student list route, TanStack Query optional) |
| 1.8 | 2026-04-14 | **§8.0** Phase **6** marked **Done** (notifications API + UI + logging); Phase **7** unchanged (tests/OpenAPI/CI still open) |
| 1.9 | 2026-04-14 | **§8.0** Phase **7** marked **Done**: Vitest, Swagger UI (`/documentation`), CI workflow; `buildApp` extracted for tests |

---

*End of project plan.*
