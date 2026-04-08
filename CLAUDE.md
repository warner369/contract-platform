# Contract Collaboration Platform - Prototype

## What we're building

A prototype of a contract review and collaboration platform for SMBs negotiating contracts. Users upload contracts, the system parses them into structured clauses, provides plain-language explanations, flags risks, maps dependencies, and enables intent-based editing.

## Stack

- **Next.js 16+** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **Anthropic SDK** for contract analysis
- **No database** — React state/context only
- **No authentication** — single-user prototype

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint check
```

## Architecture

### Server vs Client Components

Use **Server Components** (default) for:
- Data fetching from APIs
- Static content rendering
- SEO-critical pages

Use **Client Components** (`'use client'`) ONLY for:
- Event handlers (onClick, onChange, onSubmit)
- React hooks (useState, useEffect, useContext)
- Browser APIs (localStorage, sessionStorage)

### File Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (Server)
│   ├── layout.tsx                  # Root layout (Server)
│   ├── contract/
│   │   └── page.tsx                # Contract view page (Server)
│   └── api/
│       ├── parse/route.ts          # Contract parsing endpoint
│       ├── analyse-clause/route.ts # Clause analysis endpoint
│       └── suggest-change/route.ts # Intent-based editing endpoint
├── components/
│   ├── ui/                         # Shared UI primitives
│   ├── ContractView.tsx            # Contract display (Client)
│   ├── ClauseCard.tsx              # Individual clause (Client)
│   ├── ClauseDetail.tsx            # Expanded clause view (Client)
│   ├── ComparisonView.tsx          # Side-by-side diff (Client)
│   ├── UploadArea.tsx              # File upload (Client)
│   └── providers/
│       └── ContractProvider.tsx    # State management (Client)
├── lib/
│   ├── ai/
│   │   ├── prompts.ts              # Claude API prompts
│   │   └── client.ts               # Anthropic SDK setup
│   ├── parsers/
│   │   ├── pdf.ts                  # PDF text extraction
│   │   └── docx.ts                 # DOCX text extraction
│   └── utils.ts                    # Shared utilities
└── types/
    └── contract.ts                 # TypeScript interfaces
```

## Rules

### Component Patterns

- **IMPORTANT**: Only add `'use client'` when absolutely necessary
- Client components should be leaf nodes — keep state as close to where it's used as possible
- Pass serializable props from Server to Client components

### API Routes

- Keep handlers thin — extract logic to `lib/` functions
- Always return `Response.json()` with proper status codes
- Handle errors gracefully with user-facing messages
- Use `NextRequest` and `NextResponse` from `next/server`

### State Management

- Use React Context for contract state (see `ContractProvider.tsx`)
- Store original and modified versions of contracts
- Track accepted/rejected changes
- No sessionStorage — context persists during session only

### TypeScript

- All functions must have explicit return types
- All function parameters must be typed
- Use interfaces for data structures (not type aliases)
- Import types with `import type` when possible

### Styling

- Use Tailwind utility classes only
- Professional colour palette: slate, navy, subtle blue accents
- Contract text is the primary visual focus
- Risk indicators: subtle green/amber/red, not alarming
- No custom CSS files

## Critical

- **NEVER** expose `ANTHROPIC_API_KEY` to client-side code
- **NEVER** call Claude API from client components — always use API routes
- All AI-suggested changes MUST be proposals requiring explicit user acceptance
- User modifications are tracked but never auto-applied

## Data Flow

```
[Upload] → /api/parse (extract text, send to Claude) → ParsedContract
    ↓
[ContractProvider] stores original + current state
    ↓
[ContractView] displays clauses, handles selection
    ↓
[ClauseDetail] on click → /api/analyse-clause → explanation, risks
    ↓
[SuggestChange] user intent → /api/suggest-change → proposed clause edits
    ↓
[ComparisonView] shows original vs modified
```

## Tasks

1. Create `/api/parse` route — PDF/DOCX extraction + Claude parsing
2. Create `/contract` page — display parsed clauses
3. Create `/api/analyse-clause` route — clause explanation + risk assessment
4. Create `/api/suggest-change` route — intent-based editing
5. Implement `ContractView.tsx` — clause display with expand/collapse
6. Implement `ClauseDetail.tsx` — expanded view with AI analysis
7. Create `ContractProvider.tsx` — React Context for state
8. Implement comparison view — original vs modified diff