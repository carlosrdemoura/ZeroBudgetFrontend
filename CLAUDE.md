# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev        # Start dev server
yarn build      # Production build
yarn start      # Run production server
yarn lint       # ESLint via Next.js
yarn codegen    # Regenerate API client from backend Swagger spec (requires .env.local with NEXT_PUBLIC_API_URL)
```

Use `yarn` (not npm). Path alias `@/*` maps to `./src/*`.

## Architecture

**Zero-based budgeting app** (YNAB-inspired) built with Next.js 14 Pages Router, React Query for server state, and Axios for HTTP with JWT auth.

### Key patterns

- **Auth:** JWT stored in `localStorage`, injected by Axios interceptor (`src/lib/api/client.ts`). On 401, clears storage and redirects to `/login`. The `useAuth` hook (`src/hooks/useAuth.ts`) holds client-side auth state.
- **Routing:** Dynamic routes `/budget/[month]` and `/transactions/[month]` where `month` is `YYYY-MM`. Index page redirects to current month's budget or login.
- **API layer:** Hand-written wrappers in `src/lib/api/` (auth, budget, transactions, categories) that call typed endpoints. `src/lib/api/generated/` contains the codegen output from the backend's Swagger spec — regenerate with `yarn codegen` when the backend changes.
- **Styling:** TailwindCSS 4 + DaisyUI 5. Custom YNAB-inspired themes (`ynab` light, `ynab-dark`) defined in `src/styles/globals.css` using oklch color space.

### Directory layout

```
src/
├── pages/          # Next.js file-based routes + _app.tsx (React Query provider)
├── components/     # Feature-grouped: auth/, budget/, transactions/, layout/, ui/
├── lib/api/        # Axios client, hand-written API wrappers, generated/ client
├── hooks/          # useAuth
├── types/          # Domain types (Auth, Budget, Transactions, Categories)
└── styles/         # globals.css with theme definitions
```
