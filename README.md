# PPD Lab — course enrollment system

Monorepo: **React (Vite 8) + shadcn/ui (Base UI)** in `client/`, **Node.js (Fastify) + Drizzle + PostgreSQL (Neon)** in `server/`. See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for full scope.

## Prerequisites

- **Node.js** `>=20.19.0` (Vite 8 requirement; `.nvmrc` pins an example version)
- A **[Neon](https://neon.tech)** project and **pooled** `DATABASE_URL`

## Setup

1. Install dependencies from the repo root:

   ```bash
   npm install
   ```

2. Configure the API environment:

   ```bash
   cp server/.env.example server/.env
   ```

   Edit `server/.env` and set `DATABASE_URL` to your Neon connection string (use the **pooled** URI from the Neon console). Keep `CLIENT_ORIGIN` aligned with the Vite dev server (`http://localhost:5173` by default).

3. Apply database migrations (creates `users`, `courses`, `course_prerequisites`, `enrollments`, and `notifications`):

   ```bash
   npm run db:migrate -w server
   ```

4. **First admin (Phase 3+):** registration creates **student** accounts only. To manage courses as an admin, register a user, then promote that account:

   ```bash
   npm run promote-admin -w server -- your-email@example.com
   ```

## Run (development)

From the repository root:

```bash
npm run dev
```

This starts:

- **Client:** [http://localhost:5173](http://localhost:5173) — Vite + React + shadcn (Base UI)
- **Server:** [http://localhost:3000](http://localhost:3000) — `GET /health`, `GET /health/db`, OpenAPI UI at **`/documentation`** (Swagger UI for the live API)

### Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run client and server together |
| `npm run build` | Build client and server |
| `npm test` | Run server Vitest suite (unit + HTTP smoke; no DB required) |
| `npm run test:coverage -w server` | Vitest with V8 coverage report |
| `npm run dev -w client` | Vite dev server only |
| `npm run dev -w server` | API only (`tsx watch`) |
| `npm run db:generate -w server` | Generate a new Drizzle migration from `src/db/schema.ts` |
| `npm run db:migrate -w server` | Apply migrations to the database in `DATABASE_URL` |
| `npm run promote-admin -w server -- <email>` | Set an existing user’s `role` to `admin` (local QA) |

## Phase 1 definition of done

- [x] Workspaces and `npm run dev` from root
- [x] Neon migration for `users` (see `server/drizzle/`)
- [x] `GET /health` and `GET /health/db` (503 if DB unreachable)
- [x] Client home page using shadcn `Card`, `Button`, `Input` (Base UI registry)

Phases **2–7** are implemented per `PROJECT_PLAN.md` (tests, optional OpenAPI UI, CI workflow).

**Tests & quality (Phase 7):**

- **`npm test`** — Vitest: password + JWT unit tests, `GET /health` smoke via `app.inject` (no database).
- **DB integration (optional):** with a migrated database in `server/.env`, run  
  `RUN_DB_INTEGRATION=1 npm run test -w server`  
  to also run register + login against the real `DATABASE_URL`.
- **OpenAPI:** Swagger UI at **`http://localhost:3000/documentation`** when the API is running (routes without Fastify JSON schemas appear with limited detail; see [Fastify Swagger](https://github.com/fastify/fastify-swagger)).
- **CI:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs client lint, server tests, and production build on push/PR to `main`/`master`.

**Enrollments (Phase 4):**

- **Students:** request enrollment from a course detail page; list and cancel from `/enrollments`. The API enforces prerequisites and duplicate rules. `GET /enrollments/mine` lists the current user’s enrollments; **`GET /students/:id/enrollments`** is also available (scoped).
- **Admins:** enrollment queue and lists under **`/admin/enrollments`** (nested under **`/admin`** layout). Approve/reject: `PUT /enrollments/:id/approve|reject`. `GET /courses/:id/students` lists **approved** enrollments.

**Students & admin aggregation (Phase 5):**

- **Students:** `GET /students` (admin-only list), scoped `GET/PUT /students/:id`, **`GET /students/:id/enrollments`**, **`GET /students/:id/notifications`**. Profile edit on **`/account`** uses **`PUT /students/:id`** (students only).
- **Admins:** **`GET /admin/dashboard`**, **`GET /admin/students`**, **`/admin/courses`**, **`/admin/enrollments`**, **`GET /admin/reports/*`**, **`POST/PUT/DELETE /admin/admins`**. UI hub: **`/admin/dashboard`** (nav to Students, Courses, Enrollments, Reports, Admins).

**Notifications (Phase 6):**

- **API:** **`GET /notifications`**, **`POST /notifications`** (admin only), **`PUT /notifications/:id/read`**. Approving or rejecting an enrollment creates a notification for the student (same transaction as the status update).
- **Client:** notification bell (**`NotificationMenu`**) on home, enrollments, and admin layout; Sonner toasts for approve/reject and notification actions; admin “Send notification” form on **`/admin/dashboard`**.
- **Logging:** configurable **`LOG_LEVEL`**; Fastify logger uses **Pino** with **`pino-pretty`** in development; sensitive headers are redacted from logs.
