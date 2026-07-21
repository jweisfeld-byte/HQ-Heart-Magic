# Heart Magic OS — AI Search
### v1.0 — The Tier 3 Copilot, Made Concrete
Companion to: PRD v1.0 (Section 16), Technical Architecture v1.0 (Section 5), Knowledge Graph Architecture v1.0 (Section 7)
Status: **Foundation spec — walked against your real Drive content, not hypothetical examples**

---

## 0. What This Is, and Isn't

This is the PRD's Tier 3 "command-palette copilot" (Section 16), given its own real specification instead of a paragraph. Worth being precise about the boundary, because it's easy to blur:

- **It is not the `Cmd+K` command palette.** That's for instant navigation — jump to a known object in under 100ms. This is for questions you don't already know the answer to.
- **It is not a general chatbot.** The PRD explicitly rejected "chat with your data" as a flagship AI feature — it demos well and gets used twice. AI Search is narrower and more useful than that: a single question in, a grounded answer with sources out, not an open-ended conversation thread.
- **It only ever answers from what's actually in the graph.** If nothing was written down, it says so. It does not infer a plausible-sounding answer from general knowledge about wellness brands. This is the single most important guarantee this feature makes, and Section 5 walks through exactly why, using your real content.

---

## 1. The Query Pipeline

```
User types a question into AI Search (a dedicated surface, not the palette)
        │
        ▼
1. INTENT CLASSIFICATION  — one fast Claude call
   → determines scope (which collections/entry types are relevant)
   → determines mode: lookup | cross-collection aggregate | mention search | ranked-by-outcome
   → extracts topic/filter terms
        │
        ▼
2. RETRIEVAL  — reuses the hybrid tsvector + pgvector SearchIndex (Knowledge Graph Section 7), unchanged
   → runs the search scoped per the classification above
   → one-hop ObjectRelation traversal on top matches, pulling in connected entries
   → if mode = ranked-by-outcome: joins each result's outcome data (Section 3) and sorts by it
        │
        ▼
3. GROUNDING CHECK
   → zero or weak matches → skip synthesis, return an honest "nothing recorded on this yet" answer
   → real matches → proceed
        │
        ▼
4. SYNTHESIS  — Claude, Tier 3 (PRD Section 16), retrieval-augmented only
   → receives ONLY the retrieved entries' AI summaries (Knowledge Graph Section 6) + key structured fields
   → generates a direct prose answer, every claim traceable to a specific retrieved entry
        │
        ▼
5. ANSWER RENDERED  — Template H (Section 4)
   → synthesized answer on top, literal source list below, every source a real clickable link
   → query + retrieved entry IDs logged to AISearchQuery (Section 3) for cost tracking and pattern analysis
```

**Nothing in steps 2 or the underlying data changes.** This is the payoff of building the search and graph infrastructure generically in Sprints 2–3: AI Search is a thin orchestration layer — classify, retrieve, check, synthesize — on top of systems that already exist. The genuinely new work is the classifier, the outcome-ranking join, and the answer UI.

---

## 2. What's Reused, What's New

| Piece | Status |
|---|---|
| Hybrid lexical + semantic search | Reused — `SearchIndex` (Technical Architecture Section 7) |
| Relationship traversal | Reused — `ObjectRelation` (Knowledge Graph Section 4) |
| Per-entry summaries as compact context | Reused — `EntryAISummary` (Knowledge Graph Section 6) |
| Claude client / prompt infra | Reused — `packages/ai` (Technical Architecture Section 5) |
| Query intent classification | **New** |
| Outcome-ranked retrieval | **New** — depends on an outcome convention (Section 3) |
| Answer synthesis with mandatory citations | **New** |
| Answer UI (Template H) | **New** |
| Query log | **New** — `AISearchQuery` (Section 3) |
| Video/audio transcription for search | **New**, and the most real gap this exercise surfaced — see Section 5, Query 2 |

---

## 3. What's Actually New in the Schema

**An outcome convention, not a new column on `Entry`.** Any entry type representing a testable variant — Ad Angle, Subject Line, Advertorial — should include an `outcome` field in its `structuredFields` (`"winning" | "testing" | "killed" | "inconclusive"`), and ideally an `ObjectRelation` (`relationType: "supports"`) to the `Result & Learning` entry that justified the verdict. This is deliberately a convention applied within the existing generic schema (Content Modules Architecture Section 1), not a special case — consistent with the discipline that's held since Sprint 2.

**A query log:**
```prisma
model AISearchQuery {
  id                String   @id @default(cuid())
  organizationId    String
  userId            String
  queryText         String
  classifiedMode    String    // "lookup" | "cross_collection" | "mention" | "ranked_by_outcome"
  retrievedEntryIds Json      // array of Entry ids actually cited in the answer
  answer            String
  createdAt         DateTime @default(now())

  @@index([organizationId, createdAt])
}
```
This does double duty: cost attribution (same principle as Technical Architecture Section 5's AI cost logging) and, over time, a genuinely useful secondary artifact — what people actually ask reveals what the team actually wants to know, which is itself worth reviewing periodically.

**Transcription for video/audio content.** Not scoped before now: UGC videos and founder-interview footage aren't full-text searchable until their spoken content is transcribed. This is a background job added to the existing indexing pipeline (Knowledge Graph Section 7) — a transcription API call on video/audio `Attachment`/`DriveFile` content, with the transcript stored as that object's indexed text. Flagged here rather than assumed solved, because Query 2 below hits this gap directly.

---

## 4. The Answer UI — Template H (New)

```
┌──────────────────────────────────────────────────────────┐
│ 🔍 Which coffee hooks have won?                            │
├──────────────────────────────────────────────────────────┤
│ You have 3 coffee-alternative positioning angles on file   │
│ (Replace Coffee, Frictionless Ritual, Come Back to          │
│ Yourself) but none has a recorded performance verdict yet. │
│ Want to log which one converted best?                      │
├──────────────────────────────────────────────────────────┤
│ Sources                                                     │
│  📄 Replace Coffee Funnel — Meta Ads                        │
│  📄 Frictionless Ritual Funnel — Meta Ads                   │
│  📄 Come Back to Yourself Funnel — Meta Ads                 │
└──────────────────────────────────────────────────────────┘
```
The source list is never optional or collapsed by default — per the trust principle running through this entire build, an answer without visible sources is exactly the "black box AI" pattern this system has consistently avoided. A user should be able to verify any answer in one click, always.

---

## 5. Worked Against Your Real Content

Each of the four example queries, run against what I actually found in your Drive — not hypothetical data. This is the most honest test of the design: two queries work cleanly today, two surface real gaps the system correctly identifies rather than papering over.

**"Show me every lesson we've learned about founder videos."**
Classified as cross-collection aggregate (concept: "lesson learned," topic: "founder videos") — searches `Result & Learning` (Experiments), `Campaign Retro` (Email/Marketing), and `Content Example Analysis` (UGC) together, since a "lesson" could legitimately live in any of them. Real result: your Drive has one founder-video shoot on file (`Video Shooting with Wyatt / 7-22-25 Founder ad interview style`), but no `Result & Learning` entry was ever created recording what worked or didn't. **The honest answer: "One founder-video shoot exists (July 2025), no lesson has been logged from it yet — here's the raw footage."** That's not a failure of AI Search; it's AI Search correctly reporting that the Experiments collection hasn't been used for this yet.

**"Find every testimonial mentioning anxiety."**
Classified as a mention search — not scoped to one collection, since testimonials could be structured `Testimonial Theme` entries or quotes embedded inside other documents. Real result: the Ambassador Talking Points doc discusses "coffee makes you anxious" as a persona pain point — real, relevant, and findable by lexical + semantic search today. But actual customer testimonials likely also exist as spoken content in UGC video — and those aren't searchable yet, because transcription (Section 3) doesn't exist as a pipeline. **This is the one real gap this exercise surfaced that's worth prioritizing:** the videos are there; the words inside them aren't searchable until transcription is built.

**"Which coffee hooks have won?"**
Classified as ranked-by-outcome. Real result, shown in Section 4: three real positioning angles exist (Replace Coffee, Frictionless Ritual, Come Back to Yourself), all with real drafted copy — but none carries a recorded verdict. AI Search can rank by outcome the moment outcomes are logged; it cannot invent one that was never decided. This is exactly why the Experiments collection's discipline (Knowledge Graph Section 2) matters — it's the thing that makes this specific query answerable six months from now.

**"Show every advertorial related to productivity."**
Classified as a straightforward lookup, scoped to the Advertorials collection. Structurally this is the cleanest of the four — a single-collection semantic/tag search, no joins, no gaps in the pipeline. No advertorial content specifically about productivity was found in your Drive yet either, so today it would correctly return an empty result with a create-one prompt (Content Modules Architecture Section 7's empty-state pattern), not an error.

---

## 6. Trust and Guardrails

- **Never answer beyond what was retrieved.** If retrieval returns nothing, the honest answer is "nothing recorded on this," not a plausible-sounding fabrication — this is enforced by Section 1's grounding check happening *before* any generation call, not as a disclaimer added after.
- **Sources are never hidden or collapsed by default** (Section 4).
- **"No results" and "no data on this concept at all" are distinguished in the answer language** — a query about something genuinely untracked (no Experiments logged yet) should read differently from a query that's simply narrow enough to have zero matches, so a user isn't left wondering which situation they're in.
- **AI Search's ceiling is set by what gets logged, not by the model.** Section 5's four examples make this concrete rather than abstract: two gaps identified (transcription, outcome-logging) are process and pipeline gaps, not intelligence gaps — the system already knows how to use that data the moment it exists.

---

## 7. Cost

No new cost category — this uses the same Claude client and the same retrieval-then-generate discipline already budgeted in Technical Architecture Section 15's Tier 3 line item. The classifier call is small and cheap (a short, structured-output request); the synthesis call is bounded by only ever receiving retrieved summaries, never the full graph, which is exactly the token-cost control the PRD specified for this tier from the start.

---

## Closing

The two queries that "worked" today did so because the underlying architecture (hybrid search, typed relationships, per-entry summaries) already existed from Sprints 2–3. The two that surfaced gaps did so honestly, which is the actual point: this feature's value compounds with usage — every SOP written, every experiment logged, every testimonial captured makes every future question answerable — rather than requiring a big upfront data-entry project before it's useful at all.
