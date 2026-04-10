# Contract Collaboration Platform

A contract review and collaboration platform for small businesses. Upload a contract (PDF or DOCX) and get AI-powered plain-language explanations, risk flags, structured clause breakdowns, and intent-based editing suggestions — all with multi-user sharing and lifecycle tracking.

**Live:** [contract-platform.dubussy.com](https://contract-platform.dubussy.com)

## Features

### Contract Analysis

- **Upload** PDF (client-side extraction) or DOCX contracts
- **Parse** into structured, navigable clauses with AI
- **Explain** each clause in plain language with risk severity ratings
- **Flag** risks (low / medium / high) with specific concerns identified
- **Map** dependencies between related clauses
- **Highlight** opportunities for negotiation improvement

### AI-Powered Editing

- **Suggest changes** based on your negotiation intent (e.g. "I want to cap liability at 2x fees")
- **Proactive suggestions** auto-generated from analysis recommendations
- **Alternatives** with pros/cons for each suggested change
- **Negotiation tips** for each clause
- **Side-by-side diff** view comparing original vs modified text
- All AI-suggested changes are **proposals** requiring explicit accept or reject

### Collaboration & Export

- **Share** contracts with collaborators via invite links (7-day expiry)
- **Permission levels**: read, comment, or edit access per collaborator
- **Clause-level notes** with internal and external visibility
- **Discussion threads** on individual clauses
- **Contract variables** editing scoped to affected clauses
- **Lifecycle tracking**: uploaded → structured → internal review → in negotiation → agreed → finalised
- **DOCX export** with tracked changes (redline/strikethrough) for accepted suggestions

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register an account to try it out.

You'll need an Anthropic API key for the AI features. Create a `.env.local` file:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### Local D1 Setup

For local development with the database:

```bash
# Apply D1 migrations locally
npx wrangler d1 migrations apply contract-platform-db --local

# Run ad-hoc SQL locally
npx wrangler d1 execute contract-platform-db --local --command="SQL"
```

> **Windows note:** Local dev with D1 requires `npm run preview` (wrangler dev) instead of `npm run dev`. See Known Issues below.

## Development

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run Vitest once (CI-friendly) |
| `npm run test:coverage` | Run Vitest with coverage report |
| `npm run verify` | lint + test:run + build |
| `npm run build:cf` | Build for Cloudflare Workers (Linux/CI only) |
| `npm run preview` | Local Cloudflare Workers preview (wrangler dev) |

### Type Generation

After changing `wrangler.toml`, regenerate Cloudflare types:

```bash
npx wrangler types --env-interface CloudflareEnv
```

## Tech Stack

- [Next.js 16](https://nextjs.org) with App Router and Turbopack
- [React 19](https://react.dev) with TypeScript (strict mode)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Anthropic Claude](https://docs.anthropic.com) for contract analysis (claude-sonnet-4-5)
- [Cloudflare Workers](https://developers.cloudflare.com/workers) via [OpenNext](https://opennext.js.org/cloudflare)
- [Cloudflare D1](https://developers.cloudflare.com/d1) for persistent storage (SQLite)
- [pdfjs-dist](https://mozilla.github.io/pdf.js) for client-side PDF extraction
- [mammoth](https://github.com/mwilliamson/mammoth.js) for DOCX extraction
- [docx](https://docx.js.org) for DOCX generation with tracked changes

For detailed architecture, data flow, and code conventions, see [AGENTS.md](./AGENTS.md).

## Deployment

This app deploys to Cloudflare Workers via [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), which auto-builds from the `main` branch on GitHub.

Cloudflare dashboard settings:
- **Build command:** `npx @opennextjs/cloudflare build`
- **Deploy command:** `npx @opennextjs/cloudflare deploy`

The `ANTHROPIC_API_KEY` must be set as a Workers secret (`wrangler secret put ANTHROPIC_API_KEY`).

## Known Issues

- **Windows build limitation:** `@opennextjs/cloudflare` produces broken chunk references on Windows. Local dev (`npm run dev`) works for auth pages, but local dev with D1 requires `npm run preview` (wrangler dev). Deployments must go through Cloudflare CI.
- **PDF server-side extraction is not supported:** PDFs are extracted client-side using `pdfjs-dist`. The server-side parser throws an error — PDFs must be sent as extracted text via JSON.
- **Changes, notes, and threads are session-only:** The API routes for CRUD on notes, threads, and changes exist, but the UI dispatchers don't persist to D1 on every mutation. Data is in-memory only during a session and lost on refresh.
- **Lifecycle state changes are not persisted:** Updating the lifecycle badge updates the in-memory reducer state but doesn't call the PUT API. State is lost on refresh.

## License

Private project — not licensed for distribution.