# CLAUDE.md

Guidance for working on this repository. Read this before writing any code.

## Project

**InsureLeads** is a lead management CRM for insurance agencies. Leads arrive from a public web form, an admin assigns them to agents, and agents track each lead through calls, callbacks and quotes until it is won or lost.

## Working style

- Work in small steps, one at a time.
- Do not add libraries or features that were not requested. Propose them first.
- Code, identifiers, code comments and the README are in English.
- After each working step: commit using Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`) and push.
- When a roadmap stage is completed, tick it in `README.md` as part of that commit.
- Never commit `.env` or any secret. Only `.env.example` is tracked.

## Tech stack

- **Backend:** Node.js, Express, TypeScript (`strict`)
- **Database:** PostgreSQL running in Docker (`docker-compose`), accessed with `pg` and raw SQL. No ORM.
- **Validation:** Zod
- **Auth:** JWT in an httpOnly cookie, passwords hashed with bcrypt
- **Frontend (later):** React, TypeScript, Vite, CSS Modules, Redux Toolkit + RTK Query
- **Later:** Jest + Supertest, GitHub Actions, Redis

## Server conventions (mandatory)

- TypeScript only. No `any`.
- `routes/` contain routing only. All request logic lives in `controllers/`. There is no services layer.
- All SQL lives in `db/queries/` and always uses parameterized queries (`$1`, `$2`, ...). Never build SQL by string concatenation.
- Every async controller is wrapped in `asyncHandler`. No manual try/catch in controllers.
- Expected errors are thrown with `throw new ApiError(statusCode, message)`. A global `errorHandler` is registered last in `app.ts`.
- Uniform response shape, typed with a shared `ApiResponse<T>`:
  - success: `{ success: true, data }`
  - failure: `{ success: false, error }`
- Validate input with Zod at the start of each controller, before any DB access.
- Use precise status codes: 200, 201, 204, 400, 401, 403, 404, 409, 500.
- Environment variables are read and validated once, in `config.ts`, via `requireEnv`. Never write `process.env.X as string` anywhere else.
- Naming:
  - Files in camelCase: `leadController.ts`, `leadRoutes.ts`, `leadQueries.ts`
  - Functions as verb + resource: `getLead`, `listLeads`, `updateLeadStatus`

## Folder structure

```
insureleads-crm/
├── docker-compose.yml
├── README.md
├── CLAUDE.md
├── server/src/
│   ├── config.ts
│   ├── app.ts
│   ├── server.ts
│   ├── db/
│   │   ├── pool.ts
│   │   ├── migrations/
│   │   └── queries/
│   ├── routes/
│   ├── controllers/
│   ├── schemas/
│   ├── middleware/
│   ├── types/
│   └── utils/
└── client/src/        (later)
```

## Data model

**users**
- `id`, `name`, `email` (unique), `password_hash`, `role` (`'admin' | 'agent'`), `created_at`

**leads**
- `id`, `full_name`, `phone`, `email` (nullable)
- `insurance_type`: `'car' | 'home' | 'travel' | 'mortgage' | 'health_life'`
- `status`: `'new' | 'in_progress' | 'callback' | 'quote_sent' | 'won' | 'lost'`, default `'new'`
- `agent_id`: FK to `users`, nullable (a new lead is not assigned yet)
- `consent_at`: when the customer accepted the privacy terms
- `callback_at` (nullable), `created_at`, `updated_at`

**lead_notes**
- `id`, `lead_id` (FK to `leads`), `author_id` (FK to `users`, nullable: `NULL` means a system note, e.g. a duplicate submission), `content`, `created_at`

Rules:
- `status`, `role` and `insurance_type` are restricted with `CHECK` constraints.
- Indexes on `leads.agent_id`, `leads.status` and `leads.phone`.
- **Duplicate rule:** when a new lead is submitted and an open lead (status not `won`/`lost`) with the same phone already exists, do not create a new lead. Add a note to the existing lead instead.

## API (planned, built incrementally)

**Auth**
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

**Leads**
- `POST /api/leads`: public, used by the lead form
- `GET /api/leads`: an agent sees only their own leads, an admin sees all
- `GET /api/leads/:id`
- `PATCH /api/leads/:id/status`: the assigned agent, or an admin
- `PATCH /api/leads/:id/assign`: admin only

**Notes**
- `GET /api/leads/:id/notes`
- `POST /api/leads/:id/notes`

**Users**
- `GET /api/users`: admin only
- `POST /api/users`: admin only
