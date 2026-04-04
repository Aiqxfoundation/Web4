# ETR Gem Mining

A full-stack USDT mining platform built on BSC/BEP-20.

---

## How It Works

1. Users register and deposit USDT (BEP-20) via an assigned BSC address.
2. After admin approval, they earn **Gems** daily over 180 days proportional to their deposit.
3. Gems can be converted to **ETR tokens** or **USDT**.
4. A 2-level referral system rewards 15% (L1) and 5% (L2) of referrals' gem earnings.
5. Users can withdraw USDT or ETR back to their personal BSC wallet.

---

## Tech Stack

| Layer     | Stack                                                        |
|-----------|--------------------------------------------------------------|
| Frontend  | React + Vite + TypeScript + TailwindCSS + Tanstack Query     |
| Backend   | Node.js + Express + TypeScript                               |
| Database  | PostgreSQL via Drizzle ORM                                   |
| Auth      | JWT Bearer tokens + bcrypt                                   |
| Monorepo  | pnpm workspaces                                              |

---

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL and SESSION_SECRET
```

### 3. Push database schema

```bash
cd lib/db && pnpm db:push
```

### 4. Start development servers

```bash
# Starts API server on port 8080 and frontend on port 20501
pnpm --filter @workspace/api-server run dev &
pnpm --filter @workspace/gem-mining run dev
```

Or with a single command:

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev & PORT=20501 BASE_PATH=/ pnpm --filter @workspace/gem-mining run dev
```

---

## Default Admin Account

Create an account with username `admin`, then set `is_admin = true` in the database:

```sql
UPDATE users SET is_admin = true WHERE username = 'admin';
```

Then log in at `/login` with your admin credentials and go to `/admin`.

---

## Admin Panel Features

| Tab          | Capabilities                                                         |
|--------------|----------------------------------------------------------------------|
| Overview     | Live stats: users, gems, deposits, pending counts, address pool size |
| Users        | View all users, ban/unban, adjust Gems/ETR/USDT balances            |
| Deposits     | Approve/reject, view/delete payment screenshots                      |
| Withdrawals  | Approve (mark paid) or reject withdrawal requests                   |
| Addresses    | Add, edit, activate/deactivate, delete BSC deposit addresses         |

---

## Deposit Flow (BSC/BEP-20)

1. User clicks **Generate BSC Address** — server assigns a random address from admin pool.
2. User sends USDT (BEP-20) to that address.
3. User submits the deposit with the TX hash **or** a payment screenshot.
4. Admin reviews and approves in the admin panel.
5. On approval, mining starts and the user's account becomes active.

---

## Environment Variables

| Variable         | Required | Description                                                      |
|------------------|----------|------------------------------------------------------------------|
| `DATABASE_URL`   | Yes      | PostgreSQL connection string                                     |
| `SESSION_SECRET` | Yes      | JWT signing secret — use a long random string in production      |
| `ALLOWED_ORIGIN` | No       | Frontend origin for CORS (defaults to `*` which is insecure)    |
| `PORT`           | No       | API server port (default: `8080`)                                |

---

## Security Notes

- All passwords are hashed with bcrypt (12 rounds).
- JWTs expire after 7 days.
- Request body limit is 10 MB (to support base64 screenshot uploads).
- Username validation enforces alphanumeric + underscore characters only.
- Timing-safe password comparison prevents enumeration attacks.
- Set `SESSION_SECRET` and `ALLOWED_ORIGIN` before going to production.
