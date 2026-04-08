# Contract Collaboration Platform — Prototype

Contract review and collaboration platform for SMBs: upload contracts, parse into structured clauses, get plain-language explanations, flag risks, map dependencies, and enable intent-based editing.

## Stack

- **Next.js 16.1** with App Router and Turbopack
- **React 19** with TypeScript (strict mode)
- **Tailwind CSS v4** for styling
- **Anthropic SDK** (`@anthropic-ai/sdk ^0.80.0`) — model: `claude-sonnet-4-5-20250929`
- **Cloudflare Workers** via OpenNext adapter for deployment
- **mammoth** for DOCX extraction, **pdfjs-dist** for client-side PDF extraction
- No database — React state/context only
- No authentication — single-user prototype

## Commands

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Next.js production build
npm run lint         # ESLint check
npm run build:cf     # Build for Cloudflare Workers (Linux/CI only)
npm run preview      # Local Cloudflare Workers preview (wrangler dev)
```

> **Do not use `npm run deploy`** — it bypasses Cloudflare Workers Builds and breaks the git integration. Deployments happen automatically when you push to `main`.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing page (Server)
│   ├── layout.tsx                        # Root layout (Server)
│   ├── globals.css                       # Tailwind v4 + custom vars
│   ├── contract/
│   │   └── page.tsx                      # Contract view page (Server)
│   └── api/
│       ├── parse/route.ts                # Contract parsing endpoint
│       ├── analyse-clause/route.ts       # Clause analysis endpoint
│       └── suggest-change/route.ts       # Intent-based editing endpoint
├── components/
│   ├── UploadArea.tsx                    # File upload with drag-drop (Client)
│   ├── UploadForm.tsx                    # Upload orchestration + navigation (Client)
│   ├── ContractView.tsx                  # Clause list + detail panel (Client)
│   ├── ComparisonView.tsx               # Side-by-side diff (Client) — NOT WIRED UP
│   └── providers/
│       └── ContractProvider.tsx          # React Context + useReducer (Client)
├── lib/
│   ├── ai/
│   │   ├── prompts.ts                    # System prompts + prompt factories
│   │   └── client.ts                     # Anthropic SDK client + generateJsonCompletion
│   └── parsers/
│       ├── pdf.ts                         # Stub — throws error (PDF handled client-side)
│       ├── docx.ts                        # DOCX text extraction (mammoth)
│       └── index.ts                       # Parser router by MIME type
└── types/
    └── contract.ts                        # All TypeScript interfaces and type aliases
```

## Architecture

### Data Flow

```
[UploadForm] → /api/parse → sessionStorage → [ContractView] → ContractProvider.setContract
    ↓
[ContractView] displays clauses, handles selection
    ↓
[ClauseDetailPanel] (inline in ContractView) → /api/analyse-clause → explanation, risks
    ↓
/api/suggest-change — EXISTS BUT NO UI CALLS IT YET
```

### Cross-Page Data

Uploaded contract data passes from the landing page (`UploadForm`) to `/contract` via `sessionStorage`. The `ContractView` reads it on mount and populates React context.

### State Management

`ContractProvider` uses `useReducer` with actions: `SET_CONTRACT`, `SET_LOADING`, `SET_ERROR`, `SELECT_CLAUSE`, `APPLY_CHANGE`, `REJECT_CHANGE`, `RESET`. Selector helpers: `getClauseById`, `getChangesForClause`.

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

## Critical

- **NEVER** expose `ANTHROPIC_API_KEY` to client-side code
- **NEVER** call the Anthropic API from client components — always use API routes
- All AI-suggested changes MUST be proposals requiring explicit user acceptance
- User modifications are tracked but never auto-applied
- `ANTHROPIC_API_KEY` must be set in `.env.local` for dev and as a Cloudflare Workers secret for deployment

## Deployment

Deployment is via **Cloudflare Workers Builds** (CI/CD connected to the GitHub repo).

In the Cloudflare dashboard:
- **Build command**: `npx @opennextjs/cloudflare build`
- **Deploy command**: `npx @opennextjs/cloudflare deploy`
- Set `ANTHROPIC_API_KEY` as a Workers secret

> **Windows limitation:** `@opennextjs/cloudflare` produces broken chunk references on Windows. Local dev (`npm run dev`) and lint/typecheck work fine, but deployments must go through the Cloudflare CI. Do not run `npm run deploy` from any machine — it bypasses Workers Builds and breaks the git connection.

## Known Issues

- **`pdf.ts` is a stub**: PDF extraction is handled client-side in `UploadForm.tsx` using `pdfjs-dist`. The worker file (`public/pdf.worker.min.mjs`) must be re-copied from `node_modules/pdfjs-dist/build/` when upgrading `pdfjs-dist`. The server-side `pdf.ts` only throws an error — PDFs must be sent as extracted text via JSON.
- **`ComparisonView.tsx` is orphaned**: Fully implemented but never imported or rendered. Needs to be wired into the contract page.
- **No suggest-change UI**: The `/api/suggest-change` endpoint exists but no component calls it.
- **No accept/reject UI**: `ContractProvider` has `applyChange`/`rejectChange` actions but no UI buttons trigger them.

## TODO

- [ ] Implement `ClauseDetail.tsx` — extract from inline in ContractView, add suggest-change UI
- [ ] Wire up `ComparisonView` — import and render in the contract page
- [ ] Wire suggest-change UI — add intent input + proposal accept/reject flow