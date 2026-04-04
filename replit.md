# ETR Gem Mining App

## Overview

Full-stack USDT gem mining platform. Users deposit USDT (BSC/BEP-20), earn Gems over 180 days, and convert them to ETR tokens or USDT.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind CSS
- **Auth**: JWT (bcrypt passwords, jsonwebtoken)
- **Build**: esbuild (CJS bundle)

## Structure

```text
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   └── gem-mining/         # React + Vite frontend (port 20501)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated + custom React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/     # Per-table schema files
├── .env.example            # Environment variable template
└── README.md               # Full setup & deployment guide
```

## Wallet Architecture (current)

- `/wallet` — Overview: asset rows (USDT, ETR, Gems). Click to navigate.
- `/wallet/usdt` — USDT page: Deposit (all users) + Withdraw (verified only)
- `/wallet/etr` — ETR page: Transfer (verified only) + Withdraw (mainnet lock)
- `/wallet/usdt/deposit` — Full deposit flow: address generation + proof submission in one page
- `/verify` — Mint Verification Badge standalone page (costs 20 ETR, unlocks USDT withdrawals + ETR transfers)
- Profile badge: shows verified/unverified status with link to `/verify`

**Design rules**: Single orange accent (`hsl(25 95% 53%)`). No tabs. No multi-colors. Dark cards `#0f1117`.

## Admin Access

- Default admin username: `admin`, password: `admin123`
- Admin flag set directly in DB (`is_admin = true`)
- Admin panel accessible via `/admin` route when logged in as admin

## Key Features

1. **Authentication**: JWT-based, bcrypt password hashing, recovery question/answer, timing-safe login
2. **Deposits**: BSC/BEP-20 USDT deposits with address pool assignment, screenshot or TX hash proof, admin approval
3. **Mining**: Gems accumulate continuously after deposit approval
   - $100 deposit → 10,000,000 gems over 180 days (~55,555/day)
4. **Conversion**:
   - 10,000,000 gems = 100 ETR = $350 USDT
   - Dynamic rate kicks in after 1M ETR swapped (rate doubles)
5. **Referral System**: 2-level (15% L1, 5% L2) gem rewards
6. **ETR Wallet**: ETR transferable between users; USDT balance tracked
7. **Withdrawals**: BSC/BEP-20, manual admin approval
8. **Admin Panel**: 5 tabs — Overview, Users (with balance adjust), Deposits (with screenshot viewer), Withdrawals, Addresses (full CRUD)

## Database Schema

- `users` — user accounts with balances, mining state, referral codes
- `deposits` — USDT deposit requests (pending/approved/rejected), screenshot (base64), assigned BSC address
- `deposit_addresses` — BSC address pool managed by admin (active/inactive)
- `conversions` — gem conversion history
- `withdrawals` — withdrawal requests with balance pre-deduction
- `system_config` — key-value store (e.g., `total_etr_swapped`)

## API Routes

All routes under `/api`:
- `POST /auth/signup` — register (username validation: `[a-zA-Z0-9_]{3,30}`)
- `POST /auth/login` — login (timing-safe, returns JWT)
- `GET /auth/me` — get current user
- `POST /auth/logout` — logout (client-side token removal)
- `POST /auth/recovery` — reset password via recovery answer
- `GET /deposits/generate-address` — get a random active BSC address from pool
- `GET/POST /deposits` — user deposits (supports txHash, screenshotData, assignedAddress)
- `GET /mining/status` — current mining state
- `POST /mining/claim` — claim pending gems
- `GET/POST /conversions` — gem conversion
- `GET /wallet` — balance summary
- `POST /wallet/transfer` — ETR transfer between users
- `GET /referrals` — referral tree info
- `GET/POST /withdrawals` — withdrawal requests (balance deducted immediately)
- `GET /system/stats` — public system stats
- `GET /admin/stats` — full admin stats (users, pending counts, address pool)
- `GET /admin/users` — all users with balances
- `POST /admin/users/:id/ban` — ban/unban user
- `POST /admin/users/:id/adjust-balance` — set gems/etr/usdt balance
- `GET /admin/deposits` — all deposits (with screenshot data)
- `POST /admin/deposits/:id/approve` — approve deposit
- `POST /admin/deposits/:id/reject` — reject deposit
- `DELETE /admin/deposits/:id/screenshot` — remove screenshot from deposit
- `GET /admin/withdrawals` — all withdrawals
- `POST /admin/withdrawals/:id/approve` — approve withdrawal
- `POST /admin/withdrawals/:id/reject` — reject + refund
- `GET/POST /admin/addresses` — manage BSC deposit address pool
- `PUT /admin/addresses/:id` — edit address (also toggles isActive)
- `DELETE /admin/addresses/:id` — delete address

## Custom API Hooks

Located in `lib/api-client-react/src/custom-api.ts` — extends the generated Orval hooks with new endpoints:
- `useGenerateDepositAddress` — picks a random active BSC address
- `useGetDepositsFull` — deposits with screenshot data and assignedAddress
- `useCreateDepositFull` — create deposit with screenshot support
- `useAdminGetStatsFull` — full admin stats including address pool counts
- `useAdminGetDepositsWithScreenshots` — admin view with full screenshot data
- `useAdminGetWithdrawalsFull` — admin withdrawal list
- `useAdminApprove/RejectDeposit/WithdrawalFull` — action hooks
- `useAdminDeleteDepositScreenshot` — screenshot removal
- `useAdminGetAddresses` / `useAdminAddAddress` / `useAdminUpdateAddress` / `useAdminDeleteAddress` — address pool CRUD
- `useAdminBanUserFull` — ban/unban
- `useAdminAdjustBalance` — balance adjustment

## Security

- CORS: configured via `ALLOWED_ORIGIN` env var (defaults to `*` in dev)
- Body limit: 10MB (supports base64 screenshots)
- Passwords: bcrypt with 12 rounds
- JWT: 7-day expiry, signed with `SESSION_SECRET` env var
- Username: enforced format `[a-zA-Z0-9_]{3,30}`
- Timing-safe auth: password hash comparison even for unknown users
- Withdrawal safety: balance deducted at request time, refunded on rejection

## Mining Constants

- `GEMS_PER_100_USDT` = 10,000,000
- `MINING_PERIOD_DAYS` = 180
- `DAILY_GEMS_PER_100_USDT` ≈ 55,555
- `GEMS_PER_ETR_NORMAL` = 100,000 (10M gems = 100 ETR)
- `GEMS_PER_ETR_DYNAMIC` = 200,000 (after 1M ETR swapped)
- `ETR_TOTAL_SUPPLY` = 21,000,000
- Min deposit: $10 USDT
