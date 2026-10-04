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

Setup instructions will be added as the project setup stage is completed.

## Roadmap

- [ ] Project setup: Docker, PostgreSQL, Express + TypeScript
- [ ] Database schema & migrations
- [ ] Authentication (JWT, roles)
- [ ] Leads API (create, list, status, assign)
- [ ] Notes API
- [ ] Public lead form (React)
- [ ] Agent dashboard (React + RTK Query)
- [ ] Tests (Jest + Supertest)
- [ ] CI with GitHub Actions
- [ ] Caching with Redis
