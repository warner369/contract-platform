# Testing Document — Contract Collaboration Platform

> Use the test contract in `TEST_CONTRACT.md` (paste text mode) for all tests below. This contract is designed to exercise every feature: parsing, analysis, risk levels, suggestions, proactive changes, tracked-changes export, and the inline accordion layout.

---

## Setup

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Copy the contents of `TEST_CONTRACT.md` into the "Paste Text" tab on the upload page
4. Click "Analyse Contract" and wait for parsing to complete

---

## 1. Contract Parsing

**What to check:** The AI correctly identifies all 12 clauses plus 2 schedules from the test contract.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 1.1 | Contract title displays | "Software Development Services Agreement" or close variant | ⬜ |
| 1.2 | Summary appears | Brief summary mentioning software development, two parties, cloud platform | ⬜ |
| 1.3 | Parties listed | TechVenture Ltd and CodeCraft Solutions Pty Ltd as badges | ⬜ |
| 1.4 | Clause count | 12+ clauses visible in the list | ⬜ |
| 1.5 | Clause titles match contract | "Definitions", "Scope of Services", "Payment Terms", "Intellectual Property", "Confidentiality", "Warranties", "Limitation of Liability", "Indemnification", "Termination", "Force Majeure", "Dispute Resolution", "General Provisions" | ⬜ |
| 1.6 | Risk dots visible | Each clause card has a coloured risk dot (red/amber/green) | ⬜ |
| 1.7 | Clause text preview | Each card shows the first ~2 lines of clause text | ⬜ |
| 1.8 | Category badges | Clause cards show category badges (e.g. "payment", "liability", "ip") | ⬜ |

---

## 2. Inline Accordion Layout

**What to check:** Clicking a clause expands its detail panel below the card. Clicking again collapses it.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 2.1 | Click clause "Payment Terms" | Detail panel expands below the "Payment Terms" card with loading spinner, then analysis | ⬜ |
| 2.2 | Click "Payment Terms" again | Detail panel collapses | ⬜ |
| 2.3 | Click "Limitation of Liability" while "Payment Terms" is open | "Payment Terms" collapses, "Limitation of Liability" expands below its card | ⬜ |
| 2.4 | Chevron icon rotates | The chevron icon on the selected clause card rotates 180° when expanded | ⬜ |
| 2.5 | Click close (X) in detail panel | Detail panel collapses (same as clicking the clause card again) | ⬜ |
| 2.6 | Re-click same clause after closing | Analysis loads instantly from cache (no spinner) | ⬜ |
| 2.7 | Scroll behaviour | After expanding a clause near the bottom of the list, page scrolls to bring the detail panel into view | ⬜ |

---

## 3. Clause Analysis

**What to check:** Each clause's analysis includes explanation, risks, opportunities, related clauses, and considerations.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 3.1 | Click "Limitation of Liability" | Detail panel loads and shows: risk badge (likely high risk), "What this means" section | ⬜ |
| 3.2 | "What this means" | Plain-language explanation of the liability cap and exclusions | ⬜ |
| 3.3 | "Potential concerns" section | Lists specific risks (e.g. "total liability capped at fees paid", "no protection for gross negligence") | ⬜ |
| 3.4 | "Opportunities" section | Lists potential benefits (e.g. "opportunity to negotiate uncapped liability for IP infringement") | ⬜ |
| 3.5 | "Suggested improvements" section | Visible and either showing proactive suggestions or "Generating suggestions..." loading state | ⬜ |
| 3.6 | "Related clauses" section (collapsed by default) | Click to expand. Shows numbered list with clickable clause IDs | ⬜ |
| 3.7 | "Considerations" section (collapsed by default) | Click to expand. Shows recommendation items with blue arrow bullets | ⬜ |
| 3.8 | Risk badge colour matches dot | If risk dot is red on the card, badge in detail panel should be red; amber → amber; green → green | ⬜ |

### Per-clause expected risk levels

| Clause | Expected Risk | Reasoning |
|--------|-------------|-----------|
| 1. Definitions | Low | Standard definitions |
| 2. Scope of Services | Low-Medium | Subcontracting clause is loose |
| 3. Payment Terms | Medium | 2% monthly late interest is high; 60-day suspension is aggressive |
| 4. Intellectual Property | Medium | Provider retains ownership until full payment — risk to Client if dispute arises |
| 5. Confidentiality | Low | Standard mutual NDA provisions |
| 6. Warranties | Medium | Warranty cap limited to 12 months fees; no error-free warranty |
| 7. Limitation of Liability | **High** | Excludes consequential damages; total cap = fees paid — very unfavourable to Client |
| 8. Indemnification | Medium | Mutual but Provider controls defence |
| 9. Termination | Medium | Client convenience termination is short (15 days); Provider cure period is 30 days |
| 10. Force Majeure | Low | Standard force majeure with 90-day termination right |
| 11. Dispute Resolution | Low | Multi-tiered (negotiation → mediation → arbitration) — standard and fair |
| 12. General Provisions | Low | Boilerplate |

---

## 4. Proactive Suggestions

**What to check:** After analysis loads, the "Suggested improvements" section auto-generates suggestions from the AI's recommendations.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 4.1 | Select "Limitation of Liability" | After analysis loads, "Suggested improvements" section shows "Generating suggestions..." then displays suggestion cards | ⬜ |
| 4.2 | Suggestion card content | Each card shows a diff view (red removed / green added) with rationale below | ⬜ |
| 4.3 | Accept a suggestion | Click "Accept". Card shows "Handled". Clause card in the list now shows a green "1 accepted" pill badge | ⬜ |
| 4.4 | Reject a suggestion | (Re-expand clause to generate new suggestions) Click "Reject" on a suggestion. Card shows "Handled". | ⬜ |
| 4.5 | "Or describe what you want to change" link | Below the proactive suggestions, this link is visible. Click it to expand a textarea. | ⬜ |
| 4.6 | Manual suggestion flow | Type "I want to cap the Provider's liability at twice the fees paid" and submit. New suggestions appear. | ⬜ |
| 4.7 | Accept manual suggestion | Click "Accept" on the manual suggestion. Clause card updates with accepted pill. | ⬜ |

---

## 5. Related Clauses Navigation

**What to check:** The "Related clauses" section in a clause's analysis shows clickable clause IDs that navigate to other clauses.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 5.1 | Expand "Related clauses" on "Limitation of Liability" | Shows numbered list: "1. clause-6 — Warranties are capped at 12 months fees, consistent with the liability cap" (or similar) | ⬜ |
| 5.2 | Click a related clause ID | The current clause collapses, and the related clause expands with its analysis | ⬜ |
| 5.3 | Back navigation | Click the original clause to re-open it. Analysis loads from cache (no spinner). | ⬜ |

---

## 6. Tab Switching (Clauses ↔ Changes)

**What to check:** Switching between "Clauses" and "Changes" tabs preserves state.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 6.1 | Select "Payment Terms" clause and wait for analysis | Detail panel open with analysis showing | ⬜ |
| 6.2 | Click "Changes" tab | Changes view appears. No detail panel visible. | ⬜ |
| 6.3 | Click "Clauses" tab | "Payment Terms" detail panel is still open with analysis (no re-fetch) | ⬜ |
| 6.4 | Tab bar is sticky | Scroll down the clause list. The "Clauses"/"Changes" tab bar remains visible at the top. | ⬜ |

---

## 7. Comparison View (Changes Tab)

**What to check:** The Changes tab shows a summary of all changes and comparison of modified clauses.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 7.1 | Switch to "Changes" tab | Shows "Changes Summary" with counts (accepted, rejected, pending) | ⬜ |
| 7.2 | Change cards | Each accepted/rejected change appears as a card with status colour | ⬜ |
| 7.3 | After accepting suggestions in Clauses tab, return to Changes | New accepted changes appear in the summary | ⬜ |
| 7.4 | Side-by-side comparison | Changed clauses show original text (red-tinted) vs modified text (green-tinted) | ⬜ |

---

## 8. Change Indicators on Clause Cards

**What to check:** Clause cards show pills for their change status.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 8.1 | Accept a suggestion on "Limitation of Liability" | Clause card shows "1 accepted" emerald pill | ⬜ |
| 8.2 | Multiple changes | If you accept another suggestion on the same clause, pill updates to "2 accepted" | ⬜ |
| 8.3 | "Modified" indicator | If clause text differs from original, blue "Modified" pill appears | ⬜ |
| 8.4 | Pending pill | If a suggestion is still pending, amber "pending" pill shows | ⬜ |

---

## 9. Tracked-Changes DOCX Export

**What to check:** The "Download DOCX" button generates a Word document with proper tracked changes.

**Prerequisite:** Accept at least 2 suggestions (see Section 4) before testing this section.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 9.1 | Hover over "Download DOCX" button in header | Tooltip/disclaimer appears explaining the output format and suggesting copy-paste as alternative | ⬜ |
| 9.2 | Click "Download DOCX" | Button shows "Exporting..." then a .docx file downloads | ⬜ |
| 9.3 | Open the downloaded .docx in Microsoft Word | Document opens with the contract title, parties, and all 12 clauses | ⬜ |
| 9.4 | Tracked changes visible | Accepted changes appear as redline (strikethrough for original text, underline for new text) | ⬜ |
| 9.5 | Unchanged clauses | Clauses with no changes render as normal text (no markup) | ⬜ |
| 9.6 | Rejected changes NOT shown | Rejected suggestions do NOT appear as tracked changes in the document | ⬜ |
| 9.7 | Revision tracking is ON | In Word, the "Track Changes" indicator shows as active | ⬜ |
| 9.8 | Clause numbering | Clauses are numbered with bold headings like "3 Payment Terms" | ⬜ |
| 9.9 | File name | Downloaded file name contains the contract title and "tracked-changes" | ⬜ |

---

## 10. Export Disclaimer

**What to check:** The user is informed about the formatting limitation before downloading.

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 10.1 | Hover "Download DOCX" | A white tooltip appears explaining: clean layout, won't match original formatting, and suggesting copy-paste as alternative | ⬜ |
| 10.2 | Tooltip disappears on mouse leave | Tooltip disappears when mouse moves away | ⬜ |

---

## 11. Edge Cases and Error Handling

| # | Check | Expected Result | Pass? |
|---|-------|----------------|-------|
| 11.1 | Download DOCX with no contract loaded | Button is disabled | ⬜ |
| 11.2 | Download DOCX with no changes accepted | Document generates with all clauses as normal text (no redline) | ⬜ |
| 11.3 | Download DOCX with only rejected changes | Same as 11.2 — rejected changes don't appear in export | ⬜ |
| 11.4 | Very long clause text | Clause detail panel expands without layout issues. If panel is very tall, it should still be usable. | ⬜ |
| 11.5 | Rapidly switching between clauses | Each click loads analysis (from cache after first load). No crash or stale data. | ⬜ |
| 11.6 | Navigate away and back (browser back) | Contract data preserved in sessionStorage. Page reloads contract from session. | ⬜ |

---

## 12. Specific Clause Analysis Checks

These tests verify the AI is producing meaningful, different analysis for each clause type. Not all will pass every time (AI is non-deterministic), but check for general quality.

| # | Clause | Key Analysis Check | Expected Content | Pass? |
|---|--------|-------------------|------------------|-------|
| 12.1 | 1. Definitions | Explanation identifies this as a standard definitions clause | Low-risk, boilerplate explanation | ⬜ |
| 12.2 | 3. Payment Terms | Risks flag the high late interest rate and suspension clause | Specific mention of 2% monthly interest | ⬜ |
| 12.3 | 4. Intellectual Property | Risks flag the ownership-until-payment structure | Risk that Provider retains IP if dispute arises | ⬜ |
| 12.4 | 7. Limitation of Liability | High-risk badge. Risks flag the exclusion of consequential damages and low cap | Mention of consequential damages exclusion | ⬜ |
| 12.5 | 9. Termination | Opportunities section suggests negotiating longer cure period for Provider breach | Opportunity to balance termination rights | ⬜ |
| 12.6 | 11. Dispute Resolution | Suggested improvements may propose adding an escalation clause or specifying arbitration rules | Specific mention of arbitration or ADR | ⬜ |

---

## Test Contract Source

The test contract is in `TEST_CONTRACT.md` at the project root. It contains:

- **12 clauses** spanning all major legal categories (definitions, payment, IP, liability, confidentiality, indemnity, force majeure, dispute resolution, general, termination, warranties, scope)
- **2 schedules** (Platform Specification, Notice Details)
- **2 parties** (TechVenture Ltd as Client, CodeCraft Solutions Pty Ltd as Provider)
- **Deliberate risk factors**:
  - Clause 7 (Limitation of Liability): very high risk for the Client — excludes consequential damages and caps at fees paid
  - Clause 3 (Payment Terms): aggressive late interest and suspension rights
  - Clause 4 (IP): ownership retained by Provider until full payment
  - Clause 6 (Warranties): warranty period limited to 12 months fees
- **Cross-references**: IP clause references payment, liability references warranties, termination references confidentiality
- **Varied clause lengths**: from short (General Provisions) to long (Confidentiality, Termination)

---

## Regression Checklist

After any code change, re-run these critical checks:

- [ ] Upload/paste still works
- [ ] Parsing produces 12+ clauses
- [ ] Clicking a clause expands its analysis inline
- [ ] Clicking the same clause collapses it
- [ ] Analysis loads from cache on second click (no spinner)
- [ ] Accepting a suggestion updates the clause card
- [ ] Tab switch preserves state
- [ ] Download DOCX generates a file with tracked changes
- [ ] `npm run test:run` passes
- [ ] `npm run lint` passes with 0 errors