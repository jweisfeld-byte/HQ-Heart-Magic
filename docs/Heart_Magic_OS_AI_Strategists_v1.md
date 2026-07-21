# Heart Magic OS — AI Strategists
### v1.0 — Specialists, Not a Chatbot
Companion to: PRD v1.0 (Section 16), AI Search v1.0
Status: **Foundation spec — one framework, five configured instances, walked against real content**

---

## 0. The One Decision Everything Else Depends On

Five strategists were requested. The wrong way to build them is five separate prompts bolted onto five separate features — which is how "AI strategy" projects quietly become five things to maintain, each drifting further from the others every time the brand voice changes. **The right way, and what's actually built below: one `Strategist` framework — a persona, a fixed grounding scope, and an output shape — and the five requested strategists are five configured rows on top of it.** This is the same discipline as `Library`/`EntryType` in Sprint 2 and the query classifier in AI Search: build the mechanism once, generically, and let configuration — not new code — produce variety.

The payoff, stated concretely the same way it was for Libraries: a sixth strategist (a Wholesale Strategist, an Ops Strategist, whatever comes next) is a data insert — a name, a grounding scope, a persona prompt — not a new system.

**Why this isn't a contradiction of "no generic chatbot"** (PRD Section 16, AI Search Section 0): a Strategist is retrieval-grounded and scope-bounded exactly like AI Search — it never answers from general knowledge about wellness brands, only from what's actually in Heart Magic OS, and always cites what it used. What's different from AI Search is that a Strategist has a *fixed* domain (Meta Strategist always grounds in Meta Ads + Brand Knowledge + Customer Psychology, every time) rather than AI Search's *dynamic* per-query scoping, and it has a persona and an output shape suited to its job. Specialists with a defined lane, not a generalist that'll answer anything.

---

## 1. What a Strategist Actually Is

```prisma
model Strategist {
  id                String   @id @default(cuid())
  organizationId    String
  key               String    // "meta-strategist" | "copywriter" | "cro-strategist" | "creative-director" | "founder-coach"
  name              String
  icon              String
  domainDescription String
  groundingScope    Json      // { libraries: [...], tags: [...], entryTypes: [...] }
  personaPrompt     String    // voice, expertise, and boundaries
  outputMode        String    // "list" | "draft" | "analysis" | "brief" | "dialogue"
  createdAt         DateTime @default(now())

  @@unique([organizationId, key])
}

model StrategistSession {
  id           String   @id @default(cuid())
  strategistId String
  userId       String
  createdAt    DateTime @default(now())
  strategist   Strategist @relation(fields: [strategistId], references: [id])
  turns        StrategistTurn[]
}

model StrategistTurn {
  id                String   @id @default(cuid())
  sessionId         String
  role              String    // "user" | "strategist"
  content           String
  retrievedEntryIds Json?     // same citation discipline as AISearchQuery
  createdAt         DateTime @default(now())
  session           StrategistSession @relation(fields: [sessionId], references: [id])
}
```

A Strategist query runs the *exact* pipeline from AI Search Section 1 — retrieve, ground-check, synthesize, cite — with two differences: the retrieval scope is pre-set (`groundingScope`) instead of classified fresh each time, and the synthesis prompt is layered with `personaPrompt` and shaped by `outputMode`. Everything else — the search index, the graph traversal, the mandatory citations, the "say so if nothing's recorded" rule — is inherited, not rebuilt.

---

## 2. The Five Strategists, Defined

| Strategist | Grounding scope | Output mode | Gap this surfaces |
|---|---|---|---|
| 🎯 **Meta Strategist** | Meta Ads, Brand Knowledge (voice), Customer Psychology (avatars), Experiments (results) | `list` — ad hooks/angles | None — this one is fully supported by collections already specified |
| ✍️ **Copywriter** | Email, Product Knowledge, Advertorials, Marketing, Brand Knowledge | `draft` — full copy, written as a real Entry in `status: draft` | None — reuses the existing Tier 2 draft/review pattern directly (Section 6) |
| 📊 **CRO Strategist** | Analytics, Experiments, Marketing (funnels/offers), Customer Psychology (objections) | `analysis` — findings + recommendation | Analytics' entry types (Metric Definition, Insight Note, Recurring Report Template — Knowledge Graph Section 2) don't yet include a **Heatmap/Session Note** or **Funnel Analysis** type. Cheap to add — one more `EntryType` row — but worth doing before this strategist is populated with real input. |
| 📹 **Creative Director** | UGC, Creative Library, Brand Knowledge (visual identity) | `brief` — shot lists, creative briefs | "Editing" and "B-roll" aren't distinct entry types today — B-roll is a tag on Creative Library's existing Video entry type, and editing guidance belongs as an SOP once one exists. No new tables needed, just a tagging convention. |
| 🌱 **Founder Coach** | Brand Knowledge, Customer Psychology, Team Knowledge, Future Ideas | `dialogue` — the one multi-turn strategist, see Section 5 | "Community" isn't a defined collection. For now it maps to Team Knowledge / Creator Knowledge; worth a real conversation about whether Community earns its own collection once there's enough content to justify it (same bar every other collection cleared). |

---

## 3. Worked Example — Meta Strategist, on Real Content

**Query:** *"Give me 20 hooks for burned-out founders."*

**Grounding retrieval** pulls, from what actually exists in your Drive-sourced content:
- **Customer Psychology** → the "Creative / Founder" persona, verbatim from the real Ambassador Talking Points doc: *"Wants to be on the next level of optimal, creative energy. Is into optimization, bio hacking... puts their soul into their biz"* — and the matching solution angle already written: *"This doesn't just make your wheels spin, it makes you work smarter, not harder... enhances your creativity by connecting you deeper with your intuition."*
- **Brand Knowledge** → Voice & Tone's 70/30 rule (story before solution) and the explicit "don't be salesy or frantic" boundary.
- **Meta Ads** → the existing angles already on file (Replace Coffee, Frictionless Ritual, Come Back to Yourself) as reference points for what's already been said, so hooks don't just repeat them.
- **Experiments** → checked, and — consistent with what AI Search already surfaced — nothing is logged yet. The Meta Strategist's answer says so explicitly rather than implying any of the 20 hooks are pre-validated.

**Output (`list` mode, abbreviated):** twenty hooks grounded in the real founder-burnout persona and real brand voice, each traceable back to the persona/voice entries that shaped it, with a closing note: *"None of these are tested yet — want me to set up an Experiment entry for whichever ones you run?"* — turning the gap AI Search found into the next real action, rather than pretending it doesn't exist.

---

## 4. How This Differs From, and Reuses, AI Search

Same pipeline (AI Search Section 1), three concrete differences:

1. **Scope is fixed, not classified.** AI Search asks "which collections are relevant to this specific question"; a Strategist already knows — that's what makes it a specialist rather than a generalist with a costume on.
2. **A persona shapes tone and framing**, not just content — the same retrieved facts, run through the Meta Strategist's prompt, come out as ad hooks; run through the Founder Coach's prompt, they'd come out as reflective strategic framing instead.
3. **Output shape is explicit** (`list` / `draft` / `analysis` / `brief` / `dialogue`), which drives which UI renders the answer — a list renders as, well, a list; a `draft` output is written into a real `Entry` (status: draft) in the relevant collection, not just displayed and forgotten.

What doesn't change: the grounding check, the mandatory citations, and the rule that nothing gets invented past what's actually retrieved. A Strategist is not a looser version of AI Search — if anything it's stricter, since its domain is narrower by design.

---

## 5. The Founder Coach Exception

Every other strategist is effectively single-shot: ask, get an answer, maybe ask again. The Founder Coach is deliberately multi-turn (`StrategistSession`/`StrategistTurn` support this for all five, but only Founder Coach is expected to use it heavily), because reflective strategic thinking — "does this new SKU idea fit our positioning," "how do I talk about this tradeoff with the team" — genuinely benefits from back-and-forth in a way "give me 20 hooks" doesn't.

This is not the generic chatbot the PRD rejected, for the reason stated in Section 0: every turn is still grounded in retrieved Brand Knowledge/Customer Psychology/Team Knowledge content, still cites what it drew on, and still says plainly when something isn't documented rather than answering from general founder-coaching platitudes. The multi-turn format is a UX choice suited to the job, not a loosening of the grounding discipline.

---

## 6. Draft Governance (Copywriter, Specifically)

The Copywriter is the one strategist whose output is meant to become real, usable content — an email, a PDP paragraph, an advertorial. Its output writes directly into a new `Entry` in the relevant collection (Email, Product Knowledge, Advertorials) with `status: "draft"`, using the exact mechanism already specified for Tier 2 assistive drafting (PRD Section 16): a human reviews and explicitly publishes, nothing the Copywriter produces goes live on its own. No new governance model needed — this is the existing draft/review pattern, pointed at a new source.

---

## 7. Where This Lives in the UI

Not five new nav items — that would violate the same "minimal nav" discipline from Screens & Flows Section 4 this whole build has held to. Strategists live as a picker at the top of the existing AI Search surface (Template H): default is general AI Search (dynamic scope), or select a named Strategist for a fixed-scope, persona-driven answer instead. One screen, one input, a dropdown — not five destinations to remember.

---

## 8. What This Buys Later

A sixth strategist — Wholesale Strategist, Ops Strategist, whatever comes next — is a `Strategist` row: a grounding scope, a persona prompt, an output mode. No new pipeline, no new UI screen, no new table. That's the same promise Sprint 2 made for Libraries and Sprint 3 made for the graph, extended one more layer: specialization is configuration here, not code.

---

## Closing

Five specialists, one framework, zero new retrieval infrastructure — Meta Strategist, Copywriter, CRO Strategist, Creative Director, and Founder Coach are all the same pipeline wearing a different, bounded job description. The worked example in Section 3 used your actual founder-persona language and actual brand-voice rules, not placeholder copy, because that's the same standard every deliverable in this build has been held to since the first real Drive document got pulled in.
