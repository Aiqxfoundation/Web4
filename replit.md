# Peridot Mining App

## Overview

Full-stack USDT/gem mining platform on BNB Smart Chain (BEP-20). Users deposit USDT, earn Peridot Gems over configurable sessions, and convert them to **PTC** (Peridot Token). Features a 2-tier KYC-gated referral commission system and 8 mining levels.

## Branding

- **Platform name**: Peridot Mining
- **Token**: PTC (Peridot Token, BEP-20)
- **Internal DB field**: `etrBalance` (kept for compatibility, represents PTC balance in UI)
- **Auth token key**: `etr_token` in localStorage (kept for session compatibility)

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
│   └── db/                 # Drizzle schema + migrations
```

## Key Database Tables

- `users` — user accounts with balances (gemsBalance, etrBalance=PTC, usdtBalance), KYC status, referral linkage
- `deposits` — USDT deposits with screenshot support
- `withdrawals` — USDT/PTC withdrawal requests
- `conversions` — gem → PTC conversion history
- `deposit_addresses` — admin-managed deposit addresses
- `level_unlocks` — per-user mining level unlock records
- `referral_gem_rewards` — tracks gem commissions earned per referral pair (locked until both KYC verified)
- `system_config` — key-value store for platform config (conversion rate etc.)

## Referral Commission System

- **USDT commission**: 15% of deposit credited to first KYC-verified upline (bubbles max 2 levels)
- **Gem commission**: 10% of claimed gems queued to direct L1 upline (locked until BOTH user and upline are KYC verified)
- **L2 USDT commission**: 5% to L2 upline on deposit (handled in same bubbling logic)
- `referredByUserId` is stored as `doublePrecision` in DB — cast to `number` when comparing with integer IDs

## Mining System

- **Free users**: Level 0, 3-hour sessions, ~285,714 gems/year
- **Paid users**: Levels 1-7, 24-hour sessions, 10M+ gems per $100 USDT over 180 days
- Session expiry triggers a green "Session Complete" banner prompting a claim
- Claiming restarts the session (sets `lastClaimedAt`)

## Frontend Pages

| Route | Page |
|-------|------|
| `/mining` | Main mining dashboard with animated gem particles and session ring |
| `/levels` | Level investment and unlock page |
| `/convert` | Gem → PTC conversion (PTC-only, USDT option removed) |
| `/wallet` | Portfolio overview (USDT, PTC, Gems) |
| `/wallet/usdt` | USDT deposit/withdrawal detail |
| `/wallet/etr` | PTC token detail (transfer & history) |
| `/referral` | Referral network — KYC-aware claimable/locked gem breakdown |
| `/profile` | User profile + KYC status |
| `/verify` | Mint KYC Verification Badge (costs 20 PTC) |
| `/admin` | Admin dashboard (deposits, withdrawals, users, stats) |

## Layout Features

- **Desktop**: Left sidebar with Peridot Mining branding
- **Mobile**: Top header + bottom tab bar
- **Info Drawer**: Right-side sliding drawer with 8 static info pages (About, Documents, Privacy Policy, Terms, Blockchain, Upcoming Utilities, PTC Conversion & Gems, Levels & All Features)

## API Routes

- `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`
- `GET /api/mining/status`, `POST /api/mining/start`, `POST /api/mining/claim`
- `GET /api/referrals`, `POST /api/referrals/apply`, `POST /api/referrals/claim-gems`
- `GET /api/levels`, `POST /api/levels/unlock`, `POST /api/levels/invest`
- `GET/POST /api/deposits`, `POST /api/deposits/generate-address`
- `GET/POST /api/withdrawals`
- `GET /api/wallet`, `GET /api/me`
- `POST /api/etr/transfer`
- `GET/POST /api/conversions`
- `GET /api/admin/*` — admin management routes

## Custom API Client Hooks (lib/api-client-react/src/custom-api.ts)

Supplements generated hooks with:
- `useGetReferrals` — full referral network with KYC-aware gem breakdown
- `useClaimReferralGems` — claim all unlocked referral gem rewards
- `useGetDepositsFull`, `useCreateDepositFull` — screenshot-aware deposit flow
- `useGetLevels`, `useUnlockLevel`, `useInvestInLevel` — levels system
- `useAdminGet*`, `useAdminApprove/Reject*` — admin wrappers
- `useAdminBanUserFull`, `useAdminAdjustBalance`

## Important Implementation Notes

- `referredByUserId` is `doublePrecision` in DB — compare with `as unknown as number`
- Auth token stored as `etr_token` in localStorage (keep for session compatibility)
- `etrBalance` field in DB represents PTC balance — don't rename to avoid breaking changes
- Deposit approval triggers USDT commission to first verified upline (max 2 levels up)
- Mining claim triggers referral gem reward insert for direct upline
- Dynamic halving: conversion rate doubles after 1M PTC converted (tracked in system_config)
