# Build Plan: PRD Gap Closure

> Tracks implementation of features needed to close the gap between the PRD (`Smart_Contract_Platform_PRD_v1.docx`) and the current prototype. Mark tasks complete as you go. Use the learning sections to avoid known pitfalls.

---

## Dependencies to Add

```bash
npm install react-diff-viewer-continued nanoid docx
```

| Package | Why |
|---------|-----|
| `react-diff-viewer-continued` | Split/unified diff rendering with word-level highlighting. Theming via CSS-in-JS that maps to Tailwind palette. Used in `ComparisonView` upgrade and `SuggestChangePanel`. |
| `nanoid` | Tiny, URL-safe ID generator for client-side entity creation (notes, threads, changes, audit entries). |
| `docx` | Generate Word DOCX documents with tracked changes (redline/strikeout). Used in `exportContractToDocx` for client-side export. |

---

## Build Sequence

Tasks are ordered by dependency chain and momentum. Complete them in order unless noted otherwise.

---

### 7.1 — Audit Trail Automation ✅

- [x] Create `src/lib/audit.ts` with a `withAudit` utility function
  - Signature: `withAudit(dispatch: React.Dispatch<ContractAction>, action: ContractAction, detail: string)`
  - Dispatches the action, then dispatches `ADD_AUDIT_ENTRY` with: `nanoid()` ID, action type, clauseId (if present in payload), human-readable detail, `new Date().toISOString()`
- [x] Update `src/components/providers/ContractProvider.tsx` to wrap all mutation dispatchers with `withAudit`:
  - `applyChange`, `rejectChange`, `proposeChange`, `addClauseNote`, `removeClauseNote`, `setLifecycleState`, `addThread`, `addThreadMessage`, `resolveThread`, `setVariable`
  - `setContract`, `selectClause`, `setLoading`, `setError`, `reset` do NOT need audit (they are framework-level, not user actions)
- [x] Write tests in `src/__tests__/unit/audit.test.ts`
  - Test that `withAudit` dispatches the original action + an `ADD_AUDIT_ENTRY`
  - Test that the audit entry has correct action type, clause ID, and timestamp

**Learning:**
- The reducer already handles `ADD_AUDIT_ENTRY`. The gap is that no dispatcher calls it automatically. `withAudit` is middleware, not a reducer change.
- `ADD_AUDIT_ENTRY` must fire AFTER the primary action so the audit log reflects completed actions.
- Don't audit `SET_LOADING` or `SET_ERROR` — those are UI state, not user actions.

---

### 1.1 — Extract ClauseDetailPanel ✅

- [x] Create `src/components/ClauseDetailPanel.tsx`
  - Move the inline `ClauseDetailPanel` function from `ContractView.tsx` lines 141-291
  - Props: `{ clause: Clause; contractTitle: string }`
  - Import types from `@/types/contract`
  - Keep `'use client'` directive (uses hooks)
- [x] Update `src/components/ContractView.tsx`
  - Remove the inline `ClauseDetailPanel` function definition
  - Add `import ClauseDetailPanel from './ClauseDetailPanel'`
  - Verify the existing usage at line 123 still works

**Learning:**
- This is a pure refactor — no behavior change. Run `npm run test:run` and `npm run lint` after to verify.
- The `ClauseDetailPanel` uses `useContract()` internally (for `selectClause`). That import stays in the extracted file.
- Future features (suggest-change, notes, threads, variables) will be sections added WITHIN this extracted component.

---

### 1.2 — Add View Switcher to Contract Page ✅

- [x] Update `src/app/contract/page.tsx`
  - Created `src/components/ContractPageClient.tsx` as a `'use client'` wrapper managing `activeView` state
  - Tab bar with "Clauses" and "Changes" tabs with underline indicator
  - When `activeView === 'clauses'`, renders `<ContractView />`
  - When `activeView === 'changes'`, renders `<ComparisonView />`
- [x] ComparisonView already uses `useContract()` — no changes needed

**Learning:**
- The `/contract` page is currently a server component. The view switcher needs client state, so either:
  - Option A: Make the page `'use client'` (simplest, no downside for a prototype)
  - Option B: Extract a small `ContractPageClient` wrapper component
  - **Recommend Option A** — keep it simple
- The tab state doesn't need to be in URL params for the prototype. If you navigate away and back, defaulting to "Clauses" is fine.

---

### 4.3 — Render Opportunities in Analysis ✅

- [x] Edit `src/components/ClauseDetailPanel.tsx`
  - Added an "Opportunities" section between "Potential concerns" and "Related clauses"
  - Style: emerald bullet points (matches the positive framing of opportunities vs. amber risks)
  - Condition: only render if `analysis.opportunities.length > 0`
  - Section header: "Opportunities" (same style as other section headers)

```tsx
{analysis.opportunities.length > 0 && (
  <div>
    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
      Opportunities
    </h4>
    <ul className="space-y-1">
      {analysis.opportunities.map((opp, i) => (
        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
          <span className="text-emerald-500 mt-0.5">•</span>
          {opp}
        </li>
      ))}
    </ul>
  </div>
)}
```

**Learning:**
- The API already returns `opportunities[]` in `ClauseAnalysis`. This is a display-only fix.
- Place opportunities AFTER risks and BEFORE related clauses. The reading order should be: what it means → what to worry about → what you could gain → what's connected → what to do.

---

### 4.2 — Parsing Confidence Indicator ✅

- [x] Edit `src/components/ContractView.tsx`
  - If `confidence === 'low'`: amber warning triangle icon with tooltip
  - If `confidence === 'medium'`: blue info icon with tooltip
  - If `confidence === 'high'` or undefined: no indicator
  - Placed next to the risk-level dot in a flex container

**Learning:**
- `confidence` is optional on `Clause` (`confidence?: ParsingConfidence`). The parse prompt doesn't currently ask for it, so most clauses will have `undefined`. That's fine — no indicator shown.
- If you want to populate confidence values, update `PARSE_SYSTEM_PROMPT` to request a confidence field per clause in a future iteration. Not blocking for this task.
- Don't make the indicator too prominent — it's advisory, not an error. A subtle icon is better than a bold badge.

---

### 2.1 — Create SuggestChangePanel ✅

- [x] Create `src/components/SuggestChangePanel.tsx` with `'use client'`
- [x] Add intent input: a `<textarea>` with placeholder "What do you want to achieve? e.g. 'I want to ensure I have full IP ownership'"
- [x] Add submit button: "Suggest changes" (disabled when input is empty or loading)
- [x] On submit: POST to `/api/suggest-change` with `{ clause, userIntent, contractTitle }`
- [x] Handle the `SuggestResponse` and render:

**Suggestions section:**

- Each suggestion rendered as a diff card
  - Use `ReactDiffViewer` from `react-diff-viewer-continued` with `splitView={false}` (inline/unified mode, not split — saves sidebar space)
  - `oldValue={suggestion.originalText}`, `newValue={suggestion.suggestedText}`
  - Below the diff: rationale text (small, slate-600)
  - Three action buttons per suggestion:
    - **Accept** (emerald): dispatches `PROPOSE_CHANGE` then `APPLY_CHANGE`. Also `ADD_AUDIT_ENTRY` via `withAudit`. Collapses the card into an "Accepted" confirmation.
    - **Reject** (red): dispatches `PROPOSE_CHANGE` then `REJECT_CHANGE`. Also `ADD_AUDIT_ENTRY`. Collapses to "Rejected" confirmation.
    - **Preview** (blue, outline): temporarily sets the clause text in the left panel to `suggestedText` so the user can read it in context. A "Revert preview" button restores original. This is local state only — no dispatch.

**Alternatives section:**

- Expandable cards below suggestions
- Each shows: `text`, `pros[]` (emerald bullets), `cons[]` (amber bullets)
- "Use this alternative" button converts it to a suggestion and enters the same accept/reject/preview flow

**Negotiation tips section:**

- Simple bulleted list at the bottom
- Blue arrow bullets (same style as recommendations in ClauseDetailPanel)

**Theme the diff viewer:**

```tsx
const diffStyles = {
  variables: {
    light: {
      addedBackground: '#ecfdf5',
      addedColor: '#065f46',
      removedBackground: '#fef2f2',
      removedColor: '#991b1b',
      wordAddedBackground: '#a7f3d0',
      wordRemovedBackground: '#fecaca',
    },
  },
};
```

**Learning:**

- The `SuggestResponse` type already exists in `src/types/contract.ts` with `suggestions[]`, `alternatives[]`, `negotiationTips[]`. No type changes needed.
- `ClauseChange.id` is required by the reducer. Generate with `nanoid()` when creating the change from a suggestion.
- `ClauseChange.clauseId` should be set to the current clause's ID.
- `ClauseChange.type` maps directly from `suggestion.type` ('modify' | 'add' | 'remove').
- `ClauseChange.originalText` = `suggestion.originalText`, `ClauseChange.suggestedText` = `suggestion.suggestedText`, `ClauseChange.rationale` = `suggestion.rationale`.
- `ClauseChange.status` starts as 'pending' (set by PROPOSE_CHANGE), then transitions to 'accepted'/'rejected'.
- The `/api/suggest-change` endpoint already works. No backend changes needed.
- Preview is local UI state — use `useState` for a `previewText: string | null` that temporarily overrides the displayed clause text. Do NOT dispatch to state for preview.

---

### 2.2 — Integrate SuggestChangePanel into ClauseDetailPanel ✅

- [x] Edit `src/components/ClauseDetailPanel.tsx`
  - Import `SuggestChangePanel`
  - Added a collapsible section with header "Suggest changes" after the analysis sections
  - Collapsed by default. Click the chevron header to expand.
  - Pass `clause` and `contractTitle` as props

**Learning:**

- Use a `<details>` element or `useState` toggle for the collapsible section. `<details>` is simpler but `useState` gives more control over animations.
- The suggest panel needs to know when a change has been applied to clear its local state. Pass an `onSuggestionHandled` callback or observe `getChangesForClause(clause.id)` from context.
- The section should scroll into view when expanded if it's below the fold.

---

### 2.3 — Change Indicators on Clause Cards ✅

- [x] Edit `src/components/ContractView.tsx`
  - Use `getChangesForClause(clause.id)` from `useContract()` for each clause card
  - If the clause has changes: show count pills (pending=amber, accepted=emerald, rejected=slate-strikethrough)
  - If clause text differs between `state.original` and `state.current`: show a "Modified" pill (blue)

**Learning:**

- `getChangesForClause` is already defined in `ContractProvider`. You need to destructure it from `useContract()`.
- Be careful with re-renders: calling `getChangesForClause` for every clause in the list could be expensive. For the prototype (< 50 clauses) it's fine. For later optimization, memoize with `useMemo`.
- The "Modified" indicator compares `state.original.clauses.find(c => c.id === clause.id)?.text !== state.current?.clauses.find(c => c.id === clause.id)?.text`.

---

### 3.1 — Upgrade ComparisonView with Diff Viewer

- [ ] Edit `src/components/ComparisonView.tsx`
  - Import `ReactDiffViewer` from `react-diff-viewer-continued`
  - Replace the plain-text side-by-side divs with `<ReactDiffViewer>` for each changed clause
  - `oldValue={originalClause.text}`, `newValue={currentClause.text}`, `splitView={true}`
  - Apply the Tailwind palette theme (see 2.1 for diffStyles)
  - Keep the "Changes Summary" section at the top (it's good)
  - Keep the change status cards (they show the change log, not the diff)

**Learning:**

- `react-diff-viewer-continued` has peer dependencies on `react` and `react-dom`. Both already in the project.
- The component supports `leftTitle` and `rightTitle` props — use them: "Original" and "Modified".
- For long clauses, the diff viewer may be tall. Consider adding `maxHeight` with scroll via the `styles` prop.
- The existing `ComparisonView` is well-structured. Keep the summary section, just improve the diff rendering.

---

### 3.2 — Round-by-Round vs Drift Toggle

- [ ] Edit `src/components/ComparisonView.tsx`
  - Add a segmented control at the top: "All changes" | "Pending only"
  - "All changes" (default): shows drift from baseline (current behavior — compares original vs current)
  - "Pending only": filters `state.changes` to only `status === 'pending'`, and only shows clauses affected by pending changes
  - Style: simple button group with `bg-slate-100` / `bg-white` for active/inactive

**Learning:**

- PRD Section 8.1 calls these "Drift from baseline" and "Round-by-round comparison". For the prototype, "All changes" and "Pending only" are clearer labels.
- In a multi-user system, "round-by-round" would be per-publish-event. For the single-user prototype, pending changes = the current round.

---

### 3.3 — Word-Level Diff Highlighting

- [ ] Ensure `disableWordDiff={false}` (this is the default in `react-diff-viewer-continued`)
- [ ] Verify visually that individual word changes are highlighted within added/removed lines

**Learning:**

- This is enabled by default. The task is just to verify it works with legal text after completing 3.1.
- For legal text, word-level diffs are critical: "may" → "shall", "and" → "or", "30" → "60" must be immediately visible.

---

### 4.1 — Create ClauseNotes Component

- [ ] Create `src/components/ClauseNotes.tsx` with `'use client'`
- [ ] Accept props: `{ clauseId: string }`
- [ ] Use `useContract()` to get `getNotesForClause`, `addClauseNote`, `removeClauseNote`
- [ ] Render notes grouped by visibility:
  - **Internal notes** (visibility: 'internal'): slate/blue left border, lock icon
  - **External notes** (visibility: 'external'): emerald left border, globe icon
- [ ] Each note shows: content, relative time (e.g. "2h ago"), visibility badge, delete button (hover-reveal)
- [ ] Add note form at the bottom:
  - `<textarea>` for content
  - Toggle for visibility: "Internal" / "External" (default: Internal)
  - "Add note" button
  - On submit: dispatch `ADD_CLAUSE_NOTE` with `nanoid()` ID, clauseId, content, visibility, `new Date().toISOString()`
- [ ] Integrate into `ClauseDetailPanel.tsx` as a collapsible section: "Notes ({count})"

**Learning:**

- PRD Section 6.1 defines 6 context layers. For the prototype (single-user, no counterparty), internal vs external notes cover the core distinction.
- Internal notes = annotations only the contract owner sees. External notes = context the owner would share with counterparty. This distinction matters even in single-user mode because it shapes how users think about clauses.
- The `NoteVisibility` type already exists: `'internal' | 'external'`.
- Relative time: use a simple helper like `(Date.now() - new Date(createdAt).getTime()) / 3600000` for hours, or just show the timestamp for the prototype. Don't add a date library.

---

### 5.1 — Create ThreadPanel Component

- [ ] Create `src/components/ThreadPanel.tsx` with `'use client'`
- [ ] Accept props: `{ clauseId: string }`
- [ ] Use `useContract()` to get `getThreadsForClause`, `addThread`, `addThreadMessage`, `resolveThread`
- [ ] Render threads for this clause:

Each thread:

- Root message: full width, author + timestamp + content
- Replies: indented with `border-l-2 border-slate-200`, author initial avatar (colored circle), timestamp, content
- "Reply" button: reveals a textarea. On submit: dispatch `ADD_THREAD_MESSAGE` with `nanoid()` message ID, author "You", content, timestamp
- "Resolve" button at bottom of open threads (emerald, subtle)
- Resolved threads: collapsed chip — "Discussion resolved — {first message preview}... — Reopen"
  - "Reopen" dispatches nothing yet (no `REOPEN_THREAD` action). For the prototype, resolved = resolved. Add a `REOPEN_THREAD` action to the reducer if needed.

New thread:

- "Start a discussion" button at the bottom
- Opens a textarea. On submit: dispatch `ADD_THREAD` with `nanoid()` thread ID, clause ID, first message, `resolved: false`

- [ ] Integrate into `ClauseDetailPanel.tsx` as a collapsible section: "Discussion ({count})"

**Learning:**

- GitHub PR review threads are the pattern: left-border indentation, root + replies, resolve/reopen.
- Author for prototype is hardcoded as "You". In a multi-user system this would come from auth. Don't over-engineer.
- `ThreadMessage.author` is a `string`. Use "You" for all user-authored messages.
- The `RESOLVE_THREAD` reducer action already exists and works.
- Currently there is no `REOPEN_THREAD` action. If you need it, add it to the reducer and types. For the prototype, resolved threads staying resolved is acceptable — add a note and defer.
- Each thread action should trigger `ADD_AUDIT_ENTRY` via `withAudit`.

---

### 6.1 — Create LifecycleBadge Component

- [ ] Create `src/components/LifecycleBadge.tsx` with `'use client'`
- [ ] Use `useContract()` to get `state.lifecycleState`, `setLifecycleState`
- [ ] Render as a clickable badge:
  - Color: uploaded=slate, structured=blue, internal_review=amber, in_negotiation=amber, agreed=emerald, finalised=emerald-dark
  - Label: human-readable state name (e.g. "Internal Review" not "internal_review")
- [ ] On click: show dropdown with valid next states only
  - Transition graph: `structured → internal_review → in_negotiation → agreed → finalised`
  - `uploaded` → `structured` is auto-transitioned by `SET_CONTRACT`, don't show it
- [ ] On transition: dispatch `SET_LIFECYCLE_STATE` + `ADD_AUDIT_ENTRY`

Label mapping:

```ts
const LABELS: Record<ContractLifecycleState, string> = {
  uploaded: 'Uploaded',
  structured: 'Structured',
  internal_review: 'Internal Review',
  in_negotiation: 'In Negotiation',
  agreed: 'Agreed',
  finalised: 'Finalised',
};
```

Color mapping:

```ts
const COLORS: Record<ContractLifecycleState, string> = {
  uploaded: 'bg-slate-100 text-slate-700',
  structured: 'bg-blue-100 text-blue-700',
  internal_review: 'bg-amber-100 text-amber-700',
  in_negotiation: 'bg-amber-100 text-amber-700',
  agreed: 'bg-emerald-100 text-emerald-700',
  finalised: 'bg-emerald-200 text-emerald-800',
};
```

Valid transitions:

```ts
const TRANSITIONS: Record<ContractLifecycleState, ContractLifecycleState[]> = {
  uploaded: [],
  structured: ['internal_review'],
  internal_review: ['in_negotiation'],
  in_negotiation: ['agreed'],
  agreed: ['finalised'],
  finalised: [],
};
```

- [ ] Integrate into `src/app/contract/page.tsx` — render at the top of the contract header area

**Learning:**

- The Linear status-badge-with-dropdown pattern: only show valid next states, not all states. This prevents invalid jumps like going from "structured" directly to "finalised".
- The badge should be positioned prominently — top of the page, near the contract title. It's the primary status signal.
- Dropdown should close on click-outside. Use a simple `useState` + `useEffect` with a ref for click-outside detection. No library needed.

---

### 6.2 — Create VariablesPanel Component

- [ ] Create `src/components/VariablesPanel.tsx` with `'use client'`
- [ ] Accept props: `{ contractTitle: string }`
- [ ] Use `useContract()` to get `state.variables`, `setVariable`, `state.current`
- [ ] Render all variables as key-value rows:

Each row:

- Left: variable name (label, not editable)
- Right: variable value (click-to-edit — text display, click turns into `<input>`)
- Below: subtle list of affected clause IDs (clickable — dispatch `SELECT_CLAUSE` on click)

- [ ] "Add variable" button at the bottom:
  - Opens a row with name input + value input
  - On submit: dispatch `SET_VARIABLE` with `nanoid()` ID, name, value, empty `affectedClauseIds`
  - For the prototype, `affectedClauseIds` is manually editable or empty. Auto-detection of affected clauses from clause text is a future feature.

- [ ] Integrate into `ClauseDetailPanel.tsx` — show variables that reference the current clause (i.e. `variable.affectedClauseIds.includes(clause.id)`)
  - Section header: "Variables ({count})"
  - Each variable row shows value + "Affects {count} clauses"

**Learning:**

- The Notion property-row pattern: compact, scannable, click-to-edit. No modals.
- `ContractVariable.affectedClauseIds` is a `string[]` of clause IDs. When a variable value changes, the UI should highlight affected clauses (task 6.3).
- For the prototype, variables are created manually. The PRD envisions AI-suggested variables from templates — that's a future feature.
- Don't try to parse clause text to auto-detect variable references. That's an AI feature for later.

---

### 6.3 — Variable-Affected-Clause Highlighting

- [ ] Edit `src/components/ContractView.tsx`
  - Track `recentlyAffectedClauseIds` in local state (or context)
  - When a variable is changed via `setVariable`:
    - Extract `affectedClauseIds` from the variable
    - Set those IDs as "recently affected" in state
    - After 3 seconds, clear the highlighting
  - In the clause list, if a clause ID is in `recentlyAffectedClauseIds`:
    - Add a brief blue pulse animation or blue left border
    - Tailwind: `ring-2 ring-blue-300` or `border-l-4 border-blue-400`

**Learning:**

- This is a UX flourish that makes variable changes feel connected to the document. Without it, changing a variable feels disconnected.
- The 3-second timeout prevents the highlight from being permanent noise. Use `setTimeout` with cleanup in `useEffect`.
- For the prototype, this can be driven by watching `state.variables` changes in a `useEffect`. No need for a dedicated event system.

---

### 7.2 — Clause Text Search

- [ ] Edit `src/components/ContractView.tsx`
  - Add a search input above the clause list
  - Magnifying glass icon, placeholder "Search clauses..."
  - On input: filter `state.current.clauses` by matching `clause.text` or `clause.title` (case-insensitive)
  - Show filtered count: "Showing {n} of {total} clauses"
  - Clear button (X) to reset the filter
  - No debounce needed — < 100 clauses, `String.includes()` is instant

- [ ] If no clauses match: show "No clauses match '{query}'" message

**Learning:**

- PRD Section 9: "Text search: Search within a contract for specific words or phrases."
- This is a client-side filter, not a database query. For the prototype, `String.includes()` is sufficient.
- Semantic search (PRD "fast follow") is out of scope for now.
- Keep the search input subtle — it shouldn't dominate the UI. A small input with an icon is enough.

---

### 7.3 — Clause Card Enhancements

- [ ] Edit `src/components/ContractView.tsx`
  - **Modified indicator**: If `state.original` and `state.current` differ for this clause, show a small "Modified" pill (blue, subtle)
  - **Change count pill**: From `getChangesForClause(clause.id)`, show a pill with the count and status color (pending=amber, accepted=emerald, rejected=slate-strikethrough)
  - **Thread count icon**: From `getThreadsForClause(clause.id)`, show a small chat bubble icon with count if > 0
  - **Notes count**: From `getNotesForClause(clause.id)`, show a small note icon with count if > 0

**Learning:**

- These indicators turn the clause list into a scannable dashboard. A reviewer can see at a glance which clauses have activity.
- Place indicators in a consistent location on each card — a small row at the bottom of the card, right-aligned.
- Don't overload the card. Use subtle icons/pills. The clause text should remain the primary content.
- This task depends on 2.3 being complete (change indicators), but thread and note indicators are independent. Do them all together since they share the same UI area.

---

## Phase Summary

| Task | Status | Files Changed | Key Pattern |
|------|--------|---------------|-------------|
| 7.1 Audit Trail Automation | ✅ | 2 (new + edit Provider) | Middleware wrapper around dispatch |
| 1.1 Extract ClauseDetailPanel | ✅ | 2 (new + edit ContractView) | Pure refactor, no behavior change |
| 1.2 View Switcher | ✅ | 2 (new + edit contract page) | Tab bar with underline indicator |
| 4.3 Render Opportunities | ✅ | 1 (edit ClauseDetailPanel) | Display-only, data already returned |
| 4.2 Confidence Indicator | ✅ | 1 (edit ContractView) | Conditional icon on clause cards |
| 2.1 SuggestChangePanel | ✅ | 1 (new) | Inline diff + accept/reject/preview |
| 2.2 Integrate Suggest Panel | ✅ | 1 (edit ClauseDetailPanel) | Collapsible section |
| 2.3 Change Indicators | ✅ | 1 (edit ContractView) | Pill badges on clause cards |
| 3.1 Upgrade ComparisonView | ⬜ | 1 (edit) | react-diff-viewer-continued |
| 3.2 Round-by-Round Toggle | ⬜ | 1 (edit ComparisonView) | Segmented control filter |
| 3.3 Word-Level Diff | ⬜ | 1 (verify in 3.1) | Default behavior verification |
| 4.1 ClauseNotes | ⬜ | 2 (new + edit ClauseDetailPanel) | Key-value rows, visibility toggle |
| 5.1 ThreadPanel | ⬜ | 2 (new + edit ClauseDetailPanel) | GitHub PR thread pattern |
| 6.1 LifecycleBadge | ⬜ | 2 (new + edit contract page) | Linear status dropdown |
| 6.2 VariablesPanel | ⬜ | 2 (new + edit ClauseDetailPanel) | Notion property rows |
| 6.3 Variable Highlighting | ⬜ | 1 (edit ContractView) | Temporary blue pulse on affected clauses |
| 7.2 Text Search | ⬜ | 1 (edit ContractView) | Client-side string filter |
| 7.3 Card Enhancements | ⬜ | 1 (edit ContractView) | Status/counts indicator row |

### UX Improvements (added during implementation)

| Task | Status | Files Changed | What it fixes |
|------|--------|---------------|---------------|
| Proactive suggestions | ✅ | 1 (new ProactiveSuggestions.tsx) | Auto-generates suggestions from analysis.recommendations |
| API response caches | ✅ | 2 (edit Provider + ClauseDetailPanel) | Prevents re-fetching analysis/suggestions on tab switch |
| Hidden pattern for tabs | ✅ | 1 (edit ContractPageClient) | Preserves component state on Clauses↔Changes switch |
| Sticky tab bar | ✅ | 1 (edit ContractPageClient + page) | Tab bar stays visible when scrolling |
| Sidebar scroll constraint | ✅ | 1 (edit ContractView) | Detail panel scrolls independently within viewport |
| ClauseDetailPanel sections | ✅ | 1 (rewrite ClauseDetailPanel) | Stacked collapsible sections instead of one long scroll |
| SuggestChangePanel cache | ✅ | 1 (edit SuggestChangePanel) | Uses suggestionCache from provider to avoid re-fetching |
| Inline accordion layout | ✅ | 1 (rewrite ContractView) | Detail panel expands below clause card instead of sidebar |
| Related clauses formatting | ✅ | 1 (edit ClauseDetailPanel) | Numbered list with clickable clause IDs |
| Tracked-changes DOCX export | ✅ | 3 (new export.ts + ExportButton.tsx + edit page) | Downloads Word doc with redline for accepted/pending changes |
| Export button disabled when no changes | ✅ | 1 (edit ExportButton) | Greyed out until accepted or pending changes exist |
| Export disclaimer with bold copy-paste guidance | ✅ | 1 (edit ExportButton) | Clear format warning + bold copy-paste alternative |
| Alternatives under each suggestion | ✅ | 2 (edit ProactiveSuggestions + SuggestChangePanel) | Alternatives shown as expandable cards inside each suggestion card |
| Dim other suggestions on accept/reject | ✅ | 2 (edit ProactiveSuggestions + SuggestChangePanel) | Unselected suggestions dim to 40% opacity; "Choose a different option" link to override |

---

## PRD Coverage Tracker

After completing all tasks above, the prototype will cover these PRD requirements:

| PRD Section | Requirement | Covered By | Status |
|-------------|-------------|------------|--------|
| 3.1 | Lifecycle states | 6.1 LifecycleBadge | ⬜ |
| 4.2 | Parsing confidence flagging | 4.2 Confidence Indicator | ⬜ |
| 5.1 | Plain-language explanations | Already built | ✅ |
| 5.1 | Risk flagging | Already built | ✅ |
| 5.1 | Dependency mapping | Already built | ✅ |
| 5.1 | Intent-based editing | 2.1 + 2.2 SuggestChangePanel + ProactiveSuggestions | ✅ |
| 5.1 | Opportunities display | 4.3 Render Opportunities | ✅ |
| 6.1 | Context layers (notes) | 4.1 ClauseNotes | ⬜ |
| 6.2 | Clause-level threads | 5.1 ThreadPanel | ⬜ |
| 7.2 | Configurable variables | 6.2 VariablesPanel | ⬜ |
| 8.1 | Round-by-round comparison | 3.1 + 3.2 ComparisonView | ⬜ |
| 8.1 | Drift from baseline | 3.1 ComparisonView | ⬜ |
| 8.2 | Cross-reference management | Already built (stable IDs) | ✅ |
| 9 | Text search | 7.2 Text Search | ⬜ |
| 11.1 | Audit trail | 7.1 Audit Automation | ⬜ |

### Explicitly Deferred (out of scope for prototype per AGENTS.md + PRD v1)

- Multi-user collaboration / counterparty sharing (PRD 2.1, 3.2, 6.4)
- Authentication / email OTP (PRD 2.1)
- Template creation from uploaded contracts (PRD 7.1)
- Approval workflows (PRD 10)
- Send to my lawyer (PRD 5.3)
- Clean PDF generation / finalisation (PRD 3.4) — partially addressed: DOCX export with tracked changes exists, but does not preserve original document formatting
- Related contracts / addenda (PRD 3.5)
- Notifications / email (PRD 13.2)
- Jurisdiction input in UI (PRD 5.2) — `userContext` param exists on API
- Data export/deletion (PRD 11.2)