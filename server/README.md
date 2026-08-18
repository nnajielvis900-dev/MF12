# Ledgerly Server (Express + PostgreSQL)

Production backend for the Ledgerly personal finance app. The mobile preview
ships with an on-device data layer (`lib/db.ts` + `lib/api.ts`) that mirrors
this API 1:1 — point the app's service layer at these endpoints to go live.

## Setup

```bash
createdb ledgerly
cp .env.example .env          # fill in DATABASE_URL + JWT_SECRET
npm install
npm run db:init               # applies db/schema.sql
npm run dev
```

Generate a strong secret: `openssl rand -hex 64`

## Endpoints

| Method | Path                    | Auth | Description                          |
| ------ | ----------------------- | ---- | ------------------------------------ |
| POST   | /api/auth/register      | —    | Create account (bcrypt cost 12)      |
| POST   | /api/auth/login         | —    | Sign in, returns JWT (rate-limited)  |
| GET    | /api/transactions       | JWT  | List, optional `?month=YYYY-MM`      |
| POST   | /api/transactions       | JWT  | Create (zod-validated)               |
| DELETE | /api/transactions/:id   | JWT  | Delete (owner-scoped)                |
| GET    | /api/budgets            | JWT  | List monthly limits                  |
| PUT    | /api/budgets            | JWT  | Upsert limit; `0` removes            |

## Security measures

- **bcrypt (cost 12)** password hashing; generic login errors prevent user enumeration
- **JWT (HS256)** bearer auth with configurable expiry; per-route `requireAuth`
- **helmet** security headers + strict **CORS** allow-list
- **Rate limiting** on auth endpoints (20 attempts / 15 min)
- **Parameterized SQL only** — no string interpolation, SQL-injection safe
- **zod** input validation on every write endpoint
- **Integer cents** for money with DB-level CHECK constraints
- Owner-scoped queries (`WHERE user_id = $`) and `ON DELETE CASCADE`
