# InsureLeads

Lead management CRM for insurance agencies: capture leads from a public form, assign them to agents, and track every call through to a quote.

> 🚧 **In active development.** See the [Roadmap](#roadmap) for progress.

## What it does

- **Lead capture:** prospects submit a public form (car, home, travel, mortgage, or health & life insurance) and give privacy consent.
- **Duplicate protection:** if an open lead with the same phone number already exists, the new request is added as a note on that lead instead of creating a duplicate.
- **Assignment:** admins assign incoming leads to agents.
- **Pipeline tracking:** agents move each lead through `new → in_progress → callback → quote_sent → won / lost` and schedule callbacks.
- **Notes:** every call and interaction is logged on the lead.
- **Role-based access:** agents see only their own leads, admins see everything.

## Tech stack

| Layer      | Technology                                               |
| ---------- | -------------------------------------------------------- |
| Backend    | Node.js, Express, TypeScript (strict)                    |
| Database   | PostgreSQL (Docker), `pg` with raw parameterized SQL     |
| Validation | Zod                                                      |
| Auth       | JWT in httpOnly cookies, bcrypt password hashing         |
| Frontend   | React, TypeScript, Vite, CSS Modules, Redux Toolkit + RTK Query |
| Tooling    | Docker Compose, Jest + Supertest, GitHub Actions, Redis  |

## Running locally

### Prerequisites

- Node.js 20+
- Docker Desktop (with Docker Compose)
- Git

### Setup

```bash
# 1. Create your local environment file and set your own password
cp .env.example .env

# 2. Start PostgreSQL and Redis
docker compose up -d

# 3. Install server dependencies, create the tables and start the dev server
cd server
npm install
npm run migrate

# 4. Create the first admin user (admins create agents from the app)
npm run create-admin -- --name "Dana Admin" --email admin@example.com --password choose-a-password

npm run dev

# 5. In a second terminal, start the React client
cd client
npm install
npm run dev
```

Open `http://localhost:5173` for the public lead form, and `/login` for the agent dashboard. The client proxies `/api` to the API at `http://localhost:4000`.

## Running the tests

The API tests use Jest and Supertest against a real PostgreSQL database. They create and migrate a separate `<POSTGRES_DB>_test` database automatically, so development data is never touched.

```bash
docker compose up -d
cd server
npm test
```

## Roadmap

- [x] Project setup: Docker, PostgreSQL, Express + TypeScript
- [x] Database schema & migrations
- [x] Authentication (JWT, roles)
- [x] Leads API (create, list, status, assign)
- [x] Notes API
- [x] Public lead form (React)
- [x] Agent dashboard (React + RTK Query)
- [x] Tests (Jest + Supertest)
- [ ] CI with GitHub Actions
- [x] Caching with Redis
