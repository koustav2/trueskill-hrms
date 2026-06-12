# TrueSkill HRMS — Backend

Node.js + Express + MySQL (Sequelize) backend with enterprise-grade security:
TLS (in prod), AES-256-GCM field encryption at rest, bcrypt password hashing, JWT access/refresh auth, role-based access (`EMPLOYEE` / `HR_ADMIN`), rate limiting, and centralized validation/error handling.

## Phase 1 (this delivery): Auth & onboarding foundation
- Register → email verification → status transitions (`PENDING_VERIFY` → `DOCS_PENDING`)
- Login (Employee Code **or** email) with JWT access + refresh tokens
- Change password (authenticated) + Forgot/Reset password (email link)
- Password policy enforced server-side (8+ chars, upper, number, special) — matches the app's Change Password screen
- AES-256-GCM encryption utility (used for Aadhar/PAN/bank/salary in later phases)
- Seed HR admin account

## Requirements
- Node.js 20 LTS
- MySQL 8 (for dev/prod). Tests use in-memory SQLite — no MySQL needed.

## Setup
```bash
cd backend
cp .env.example .env          # then edit secrets (see below)
npm install

# Generate strong secrets
openssl rand -hex 32          # use for ENCRYPTION_KEY
openssl rand -hex 48          # use for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET

# Create the database in MySQL, then:
npm run db:migrate
npm run db:seed               # creates HR admin (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)

npm run dev                   # http://localhost:4000/api/v1
```

In development, if `SMTP_HOST` is empty, verification/reset **links are logged to the console** instead of being emailed — handy for local testing.

## Test
```bash
npm test                      # Jest + Supertest against in-memory SQLite
```

## Auth API (`/api/v1`)
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | – | `fullName, email, phone?, password` |
| POST | `/auth/verify-email` | – | `token` |
| POST | `/auth/login` | – | `identifier (email or EMP code), password` |
| POST | `/auth/refresh` | – | `refreshToken` |
| POST | `/auth/forgot-password` | – | `email` |
| POST | `/auth/reset-password` | – | `token, newPassword` |
| POST | `/auth/change-password` | Bearer | `oldPassword, newPassword` |
| GET | `/me` | Bearer | – |
| GET | `/health` | – | – |

Response envelope: `{ success, message, data, error }`.

## Project structure
```
src/
  config/      env, db, sequelize.config, mailer
  db/          models, migrations, seeders
  middlewares/ auth (JWT), role guard, validate, rateLimit, error
  modules/auth controller, service, routes, validators
  utils/       crypto (AES-256-GCM), password, jwt, response, errors, employeeId, logger
  app.js, server.js, routes.js
tests/         auth.test.js
```

## Phase 2 feature APIs (`/api/v1`, all require Bearer auth)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/me/profile` | any | Profile details |
| PUT | `/me/profile` | any | Update name/phone/address/pincode |
| POST | `/me/avatar` | any | multipart `file` |
| GET | `/documents` | any | My documents |
| POST | `/documents/:type` | any | multipart `file` (+`fileBack`, `number`); type = AADHAR/PAN/BANK/QUALIFICATION |
| PUT | `/documents/:id/verify` | HR | `{status, remarks}`; on full verification issues Employee Code + seeds leave balances + emails the employee |
| GET | `/attendance/today` | any | Today's record |
| POST | `/attendance/check-in` | any | multipart `selfie` optional |
| POST | `/attendance/check-out` | any | |
| GET | `/attendance?month=&year=` | any | History |
| GET | `/leaves?status=` | any | My leaves (APPLIED/APPROVED/REJECTED) |
| GET | `/leaves/balance` | any | CL/SL/PL/ML balances |
| POST | `/leaves` | any | `{type,startDate,endDate,remarks}` |
| PUT | `/leaves/:id/decision` | HR | `{status,remarks}`; approval decrements balance |
| GET | `/salary-slips` | any | Decrypted amounts |
| GET | `/salary-slips/:id` | owner/HR | |
| POST | `/salary-slips` | HR | `{userId,month,year,gross,deductions}` (stored encrypted) |
| GET | `/tasks` · POST `/tasks` · PATCH `/tasks/:id/status` | any | |
| GET | `/tours` · POST `/tours` · PUT `/tours/:id/decision` | any / HR | |
| GET | `/advances` · POST `/advances` · PUT `/advances/:id/decision` | any / HR | amount encrypted at rest |
| GET | `/notices` · POST `/notices` | any / HR | |
| GET | `/notifications` · PATCH `/notifications/:id/read` | any | |

Encrypted-at-rest fields (AES-256-GCM): document numbers (Aadhar/PAN/bank), salary gross/deductions/net, advance amounts. Uploaded files are served from `/uploads`.

## Roadmap
- **Phase 5:** premium admin web UI (React/Vite) consuming the HR_ADMIN endpoints above.
- See `../PLAN.md` for the full architecture and the Android + Admin Web plans.
