# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Matir Hari

Food delivery platform for a single kitchen in Mymensingh, Bangladesh. Pre-order model with strict cut-off times (Lunch 10 AM, Dinner 5 PM BDT). Users pay a ৳50 commitment fee via bKash/Nagad and submit a TrxID; admin verifies manually.

**Roles:** Customer (mobile app), Admin (web portal), Delivery Rider (future).

---

## Repository Structure

Two independent apps — no shared workspace tooling:

- `app/` — Customer mobile app (Expo / React Native)
- `web/` — Admin web portal + REST API (Next.js)
- `design/` — HTML reference designs + `terracotta_hearth/DESIGN.md` (design system spec)

---

## web/ — Next.js API + Admin Portal

**Tech stack:** Next.js 16 (App Router), TypeScript 5 (strict), Tailwind CSS v4, Drizzle ORM, Neon PostgreSQL, JWT auth (jose), bcryptjs

### Commands
```bash
cd web
npm install
npm run dev           # Dev server at http://localhost:3000 (Turbo)
npm run build
npm run lint
npm run db:push       # Push schema changes to Neon (no migrations file)
npm run db:studio     # Drizzle Studio visual DB browser
npm run db:reset      # Drop all data + seed sample menus (tsx scripts/reset-db.ts)
npm run db:backup     # pg_dump → database_backup/backup_N_DATE.sql
npm run db:restore    # Restore from a backup (interactive)
```

### Environment setup
Copy `.env.example` → `.env.local` and fill in `DATABASE_URL` (Neon connection string) and `JWT_SECRET`.

### Architecture

**Database:** `src/db/schema.ts` — Drizzle schema for `users`, `sessions`, `menus`, `orders`, `notifications`. `src/db/index.ts` — Neon HTTP client via `@neondatabase/serverless` + `drizzle-orm/neon-http`.

**Auth:** `src/lib/auth.ts` — phone + password with JWT (jose). Tokens are Bearer tokens in `Authorization` headers. `getAuthUser(req)` extracts and verifies from any route handler.

**API routes** (`src/app/api/`):
| Route | Methods | Description |
|---|---|---|
| `/api/auth/register` | POST | name, phone, password → JWT |
| `/api/auth/login` | POST | phone, password → JWT |
| `/api/menus/today` | GET | Today's Lunch + Dinner with cut-off status |
| `/api/orders` | GET, POST | List user orders / create new order |
| `/api/orders/[id]` | GET, PATCH | Get order / perform action (submit_payment, cancel, confirm_payment, etc.) |
| `/api/users/me` | GET, PATCH | Profile + trust score perks |
| `/api/users/me/notifications` | GET, PATCH | List / mark-all-read |

**Response format:** All routes return `{ success: true, data: ... }` or `{ success: false, error: "..." }` via `src/lib/response.ts` helpers.

**Order actions (PATCH /api/orders/[id]):** `submit_payment`, `cancel`, `request_change`, `confirm_payment` (admin), `start_cooking` (admin), `out_for_delivery` (admin), `deliver` (admin), `admin_cancel` (admin). Admin actions require `isAdmin: true` in body — replace with proper admin auth before production.

**Trust Score:** Incremented on `deliver` action. Threshold is 5 → unlocks COD (no commitment fee).

---

## app/ — Expo React Native (Customer App)

**Tech stack:** Expo 54, React Native 0.81, React 19, TypeScript 5.9 (strict), Expo Router 6, NativeWind v4, Zustand, expo-secure-store

### Commands
```bash
cd app
npm install
npm start               # Expo dev server
npm run android
npm run ios
npm run lint
npx tsc --noEmit
```

### Environment
Create `app/.env.local`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```
On Android emulator use `http://10.0.2.2:3000` instead of `localhost`.

### Architecture

**Navigation:** `app/app/_layout.tsx` — root Stack loading fonts (Plus Jakarta Sans, Be Vietnam Pro) and hydrating auth store. Routes:
- `(auth)/` — onboarding, login, signup (no bottom nav)
- `(tabs)/` — index (home), history, profile (bottom tab nav)
- `checkout` — modal slide-up
- `order/[id]` — single order detail

**Root redirect:** `app/app/index.tsx` — redirects to `/(tabs)` if logged in, else `/(auth)/onboarding`.

**Auth:** `store/auth-store.ts` (Zustand) — persists JWT + user in `expo-secure-store`. `lib/api.ts` — all API calls, reads token from SecureStore on each request.

**Styling:** NativeWind v4 + Tailwind. Config in `tailwind.config.js`. CSS entry in `global.css` (imported in `_layout.tsx`). Metro config in `metro.config.js`. Design tokens in `constants/colors.ts` (matches `design/terracotta_hearth/DESIGN.md`).

**Design system:**
- Primary: `#902d13` (Deep Terracotta), Secondary: `#795900` (Warm Ochre), Surface: `#fbf9f5`
- Fonts: `PlusJakartaSans_*` (headlines), `BeVietnamPro_*` (body/labels)
- CTA gradient: `[Colors.primary, Colors.primaryContainer]` with `expo-linear-gradient`
- No explicit borders — use surface tier shifts for separation

### Screen summary
| Screen | File | Key features |
|---|---|---|
| Onboarding | `(auth)/onboarding.tsx` | Hero image, feature cards, CTA |
| Login | `(auth)/login.tsx` | Phone + password, JWT stored |
| Signup | `(auth)/signup.tsx` | Name, phone, password, terms |
| Home | `(tabs)/index.tsx` | Today's menus, live cutoff countdown, order CTA |
| Checkout | `checkout.tsx` | 2-step: summary → TrxID submission |
| History | `(tabs)/history.tsx` | Live order timeline + past order reorder |
| Profile | `(tabs)/profile.tsx` | Trust score ring, COD progress, settings |

---

## Shared Conventions

- **Package manager:** `npm`
- **TypeScript:** Strict mode in both apps
- **Naming:** PascalCase components, `use` prefix hooks, kebab-case files
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`)
- **Branches:** `main` → production, `dev` → staging, `feature/*` / `fix/*`
- **BDT time:** All cut-off logic uses UTC+6. The API computes BDT from UTC.
