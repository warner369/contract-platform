# Contract Collaboration Platform

Contract review and collaboration platform for SMBs: upload contracts, parse into structured clauses, get plain-language explanations, flag risks, map dependencies, and enable intent-based editing with multi-user collaboration.

## Stack

- **Next.js 16.1** with App Router and Turbopack
- **React 19** with TypeScript (strict mode)
- **Tailwind CSS v4** for styling
- **Anthropic SDK** (`@anthropic-ai/sdk ^0.80.0`) — model: `claude-sonnet-4-5-20250929`
- **Cloudflare Workers** via OpenNext adapter for deployment
- **Cloudflare D1** for persistent storage (SQLite database)
- **mammoth** for DOCX extraction, **pdfjs-dist** for client-side PDF extraction
- **Custom auth** — PBKDF2 password hashing (Web Crypto API), session tokens in D1
- **Next.js 16 proxy.ts** for route protection

## Commands

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Next.js production build
npm run lint         # ESLint check
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run (CI-friendly)
npm run test:coverage # Vitest with coverage
npm run verify       # lint + test:run + build
npm run build:cf     # Build for Cloudflare Workers (Linux/CI only)
npm run preview      # Local Cloudflare Workers preview (wrangler dev)
npx wrangler d1 migrations apply contract-platform-db --local   # Apply D1 migrations locally
npx wrangler d1 migrations apply contract-platform-db --remote  # Apply D1 migrations to production
npx wrangler d1 execute contract-platform-db --local --command="SQL"  # Run ad-hoc SQL locally
npx wrangler types --env-interface CloudflareEnv                  # Regenerate CloudflareEnv types
```

> **Do not use `npm run deploy`** — it bypasses Cloudflare Workers Builds and breaks the git integration. Deployments happen automatically when you push to `main`.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing page (redirects to /dashboard if authed)
│   ├── layout.tsx                        # Root layout with AuthProvider
│   ├── globals.css                       # Tailwind v4 + custom vars
│   ├── middleware.ts                      # Edge auth middleware (cookie check + redirects)
│   ├── login/page.tsx                    # Login page
│   ├── register/page.tsx                 # Registration page
│   ├── dashboard/page.tsx                # User's contract list
│   ├── invite/[token]/page.tsx           # Invite acceptance page
│   ├── contracts/[id]/page.tsx          # Contract view (loads from D1 via API)
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts         # POST: create user + session
│       │   ├── login/route.ts            # POST: verify credentials + session
│       │   ├── logout/route.ts           # POST: delete session
│       │   └── me/route.ts              # GET: current user info
│       ├── contracts/
│       │   ├── route.ts                  # POST: create contract, GET: list contracts
│       │   └── [id]/
│       │       ├── route.ts             # GET: contract detail, PUT: update, DELETE: remove
│       │       ├── invites/route.ts      # POST: create invite link
│       │       └── collaborators/
│       │           ├── route.ts          # GET: list collaborators
│       │           └── [userId]/route.ts # PUT: change permission, DELETE: remove
│       ├── invites/[token]/
│       │   ├── route.ts                  # GET: invite details
│       │   └── accept/route.ts           # POST: accept invite
│       ├── users/search/route.ts         # GET: search users by name/email
│       ├── parse/route.ts                # Contract parsing endpoint (AI, remains stateless)
│       ├── analyse-clause/route.ts       # Clause analysis endpoint (AI)
│       └── suggest-change/route.ts       # Intent-based editing endpoint (AI)
├── components/
│   ├── UploadArea.tsx                    # File upload with drag-drop (Client)
│   ├── UploadForm.tsx                    # Upload orchestration — saves to D1 via API
│   ├── ContractView.tsx                  # Clause list + detail panel (Client)
│   ├── ContractPageClient.tsx            # Tab switcher (clauses/changes)
│   ├── ClauseDetailPanel.tsx             # Clause analysis + suggest changes
│   ├── SuggestChangePanel.tsx            # Intent-based editing UI
│   ├── ProactiveSuggestions.tsx           # Auto-generated suggestions
│   ├── ComparisonView.tsx                # Side-by-side diff (Client)
│   ├── ExportButton.tsx                  # DOCX export with tracked changes
│   ├── LifecycleBadge.tsx                # Lifecycle state dropdown
│   ├── ClauseNotes.tsx                  # Clause-level notes (internal/external)
│   ├── ThreadPanel.tsx                  # Clause-level discussion threads
│   ├── VariablesPanel.tsx                # Contract variable editing
│   ├── RequireAuth.tsx                  # Auth guard redirect component
│   ├── ShareModal.tsx                   # Collaborator management + invite links
│   └── providers/
│       ├── AuthProvider.tsx              # React Context for auth state (user, login, logout)
│       └── ContractProvider.tsx          # React Context + useReducer (Client)
├── hooks/
│   └── useSSEFetch.ts                   # SSE stream consumer hook
├── lib/
│   ├── ai/
│   │   ├── prompts.ts                    # System prompts + prompt factories
│   │   └── client.ts                     # Anthropic SDK client + generateJsonCompletion
│   ├── auth/
│   │   ├── hash.ts                       # PBKDF2 password hashing (Web Crypto API)
│   │   ├── session.ts                    # Session token create/verify/delete + cookie helpers
│   │   ├── getUser.ts                    # Extract user from request (session cookie → D1 lookup)
│   │   └── index.ts                      # Barrel export
│   ├── db/
│   │   ├── client.ts                     # getDb() via getCloudflareContext(), getCachedDb() with React cache()
│   │   └── authHelpers.ts               # requireAuth, getContractAccess, requireOwner helpers
│   ├── parsers/
│   │   ├── pdf.ts                         # Stub — throws error (PDF handled client-side)
│   │   ├── docx.ts                        # DOCX text extraction (mammoth)
│   │   └── index.ts                       # Parser router by MIME type
│   ├── reducer.ts                         # Contract reducer (pure function)
│   ├── audit.ts                           # withAudit dispatcher wrapper
│   ├── export.ts                           # DOCX export with tracked changes
│   └── sse.ts                             # SSE server/client utilities
├── types/
│   ├── contract.ts                        # Contract-related TypeScript types
│   ├── auth.ts                            # User, Session, auth request/response types
│   └── collaboration.ts                  # Collaborator, Invite types + mappers
├── __tests__/
│   ├── setup.ts                          # Vitest global setup
│   ├── mocks/contract-data.ts            # Test fixtures
│   ├── unit/                             # Unit tests
│   ├── api/                              # API route tests
│   └── components/                       # Component tests
├── migrations/
│   └── 0001_initial_schema.sql           # D1 database schema
└── vitest.config.ts
```

## Architecture

### Authentication Flow

```
[Login/Register Form] → POST /api/auth/login or /api/auth/register
    → PBKDF2 hash verify (Web Crypto API) → create session token → set HttpOnly cookie
    → redirect to /dashboard

[proxy.ts] → checks session_token cookie on every request
    → /dashboard, /contracts, /invite: require valid session
    → /login, /register: redirect to /dashboard if already authed
    → /api/*, /, static: pass through
```

### Data Flow

```
[UploadForm] → /api/parse (AI, stateless) → POST /api/contracts (persist to D1)
    → redirect to /contracts/[id]
    → ContractView loads from GET /api/contracts/[id]
    → ContractProvider hydrates from API response
    ↓
[ClauseDetailPanel] → /api/analyse-clause (SSE) → explanation, risks
    ↓
[SuggestChangePanel / ProactiveSuggestions] → /api/suggest-change (SSE)
    ↓
[Share Modal] → POST /api/contracts/[id]/invites → shareable link → /invite/[token]
```

### Database (Cloudflare D1)

Accessed via `getCloudflareContext()` from `@opennextjs/cloudflare` in API routes. Local dev uses wrangler's local D1.

**Tables**: users, sessions, contracts, clauses, contract_collaborators, contract_invites, notes, threads, thread_messages, changes, audit_log

**Permissions**: Collaborators have `read`, `comment`, or `edit` access. Only the contract owner can delete contracts or manage collaborators. Share links use invite tokens with 7-day expiry.

### State Management

`ContractProvider` uses `useReducer` (with pure reducer in `lib/reducer.ts`). Analysis and suggestion caches use `useRef<Map>`. Currently in-memory only — changes/notes/threads are not yet persisted to D1 (the API routes exist but the UI does not yet call them on every mutation; this is deferred future work).

The `ContractProvider` accepts an optional `initialState` prop for hydrating from the API response when viewing a persisted contract.

## Code Standards

- Use `interface` for data structures, `type` for union aliases
- Import types with `import type` when possible
- Only add `'use client'` when the component needs hooks, event handlers, or browser APIs
- Client components should be leaf nodes — keep state as close to where it's used as possible
- API routes: thin handlers, logic in `lib/`. Use `NextRequest`/`NextResponse` from `next/server`
- Return `NextResponse.json()` with proper status codes
- All AI calls go through API routes, never from client components
- All AI-suggested changes are proposals requiring explicit user acceptance
- Styling: Tailwind utility classes only, palette: slate/navy/blue, risk: emerald/amber/red
- Set `export const maxDuration = 60` on API routes for Cloudflare Workers
- Password hashing uses PBKDF2 via Web Crypto API (100k iterations, SHA-256, 16-byte salt) — **no bcrypt** (not available in Workers runtime). Max 100k iterations on Cloudflare Workers.
- Auth middleware is `src/middleware.ts` (NOT proxy.ts) — Cloudflare Workers requires Edge runtime for middleware, but Next.js 16's `proxy.ts` forces Node.js runtime. Using `middleware.ts` with `export const runtime = 'experimental-edge'` resolves this. Do NOT rename to proxy.ts.
- D1 access via `getCloudflareContext()` from `@opennextjs/cloudflare` (NOT `getRequestContext` from `@cloudflare/next-on-pages`)
- Session cookies: HttpOnly, Secure (production), SameSite=Lax, 30-day expiry

## Critical

- **NEVER** expose `ANTHROPIC_API_KEY` to client-side code
- **NEVER** call the Anthropic API from client components — always use API routes
- All AI-suggested changes MUST be proposals requiring explicit user acceptance
- User modifications are tracked but never auto-applied
- `ANTHROPIC_API_KEY` must be set in `.env.local` for dev and as a Cloudflare Workers secret for deployment
- **`esbuild` must remain a direct devDependency** — `@opennextjs/cloudflare` uses `esbuild` at the top level during its build. If `esbuild` is only nested (e.g. under `@opennextjs/aws`), the CF build fails with `ERR_MODULE_NOT_FOUND: Cannot find package 'esbuild'`. Do NOT remove `esbuild` from `devDependencies`.
- The `REJECT_CHANGE` action uses change `id` (not `clauseId`) to identify the change to reject, since multiple changes can exist for the same clause.
- D1 LOCAL MIGRATIONS must be re-applied after schema changes: `npx wrangler d1 migrations apply contract-platform-db --local`
- After changing `wrangler.toml`, regenerate types: `npx wrangler types --env-interface CloudflareEnv`

## Deployment

Deployment is via **Cloudflare Workers Builds** (CI/CD connected to the GitHub repo).

In the Cloudflare dashboard:
- **Build command**: `npx @opennextjs/cloudflare build`
- **Deploy command**: `npx @opennextjs/cloudflare deploy`
- Set `ANTHROPIC_API_KEY` as a Workers secret
- D1 database binding `DB` is configured in `wrangler.toml`

> **Windows limitation:** `@opennextjs/cloudflare` produces broken chunk references on Windows. Local dev (`npm run dev`) works for auth pages, but local dev with D1 requires `npm run preview` (wrangler dev). Deployments must go through Cloudflare CI.

## Known Issues

- **`pdf.ts` is a stub**: PDF extraction is handled client-side in `UploadForm.tsx` using `pdfjs-dist`. The server-side `pdf.ts` only throws an error — PDFs must be sent as extracted text via JSON.
- **Changes/notes/threads not yet persisted to D1**: The API routes for CRUD on notes, threads, changes, lifecycle exist but the UI dispatchers in ContractProvider don't call them yet. Data is in-memory only during a session. This is deferred future work.
- **`.npmrc` contains `legacy-peer-deps=true`**: Required because `esbuild@0.25.4` conflicts with `esbuild@^0.27` (optional peer dep of `vite@8`). Do NOT remove.

## TODO

- [x] Extract `contractReducer` to `lib/reducer.ts` for testability
- [x] Add testing infrastructure (Vitest + React Testing Library + jsdom)
- [x] Extend types for context layers, variables, threads, lifecycle, audit
- [x] Add reducer actions: PROPOSE_CHANGE, ADD/REMOVE_CLAUSE_NOTE, SET_LIFECYCLE_STATE, ADD_THREAD, ADD_THREAD_MESSAGE, RESOLVE_THREAD, SET_VARIABLE, ADD_AUDIT_ENTRY
- [x] Add ContractProvider dispatchers and derived selectors for new actions
- [x] Implement `ClauseDetailPanel.tsx` — extracted from ContractView, with suggest-change UI
- [x] Wire up `ComparisonView` — rendered in ContractPageClient tabs
- [x] Wire suggest-change UI — SuggestChangePanel + ProactiveSuggestions
- [x] Add D1 database with auth, contracts, collaboration schema
- [x] Custom auth system (register, login, sessions, PBKDF2 hashing)
- [x] Next.js 16 proxy.ts for route protection
- [x] Contract persistence API (CRUD via D1)
- [x] Upload flow saves to D1 instead of sessionStorage
- [x] Dashboard page listing user's contracts
- [x] Share modal with invite links + collaborator management
- [x] Invite acceptance page
- [ ] Persist changes/notes/threads to D1 on every mutation (API routes exist, UI wiring needed)
- [ ] Add tests for auth, contract API, and collaboration flows
- [ ] Wire `ComparisonView` into contract detail page for side-by-side diffs of active changes