# Contract Collaboration Platform

A prototype contract review tool for small businesses. Upload a contract (PDF or DOCX) and get AI-powered plain-language explanations, risk flags, and structured clause breakdowns.

**Live:** [contract-platform.dubussy.com](https://contract-platform.dubussy.com)

## What it does

- **Upload** a PDF or DOCX contract
- **Parse** it into structured, navigable clauses
- **Explain** each clause in plain language
- **Flag** risks with severity ratings (low / medium / high)
- **Suggest changes** based on your negotiation intent (in progress)

## Getting started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload a contract to try it out.

You'll need an Anthropic API key for the AI features to work. Create a `.env.local` file:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Tech stack

- [Next.js 16](https://nextjs.org) with App Router and Turbopack
- [React 19](https://react.dev) with TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Anthropic Claude](https://docs.anthropic.com) for contract analysis
- [Cloudflare Workers](https://developers.cloudflare.com/workers) via [OpenNext](https://opennext.js.org/cloudflare)
- [pdfjs-dist](https://mozilla.github.io/pdf.js) for client-side PDF extraction
- [mammoth](https://github.com/mwilliamson/mammoth.js) for DOCX extraction

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

## Deployment

This app deploys to Cloudflare Workers via [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), which auto-builds from the `main` branch on GitHub.

Cloudflare dashboard settings:
- **Build command:** `npx @opennextjs/cloudflare build`
- **Deploy command:** `npx @opennextjs/cloudflare deploy`

The `ANTHROPIC_API_KEY` must be set as a Workers secret (`wrangler secret put ANTHROPIC_API_KEY`).

> **Note:** The OpenNext build has [known issues on Windows](https://opennext.js.org/cloudflare#windows-support). Local dev works fine, but Workers builds should run via the Cloudflare CI (Linux).

## License

Private project — not licensed for distribution.