# Heart Magic OS — Knowledge Graph Architecture
### v1.0 — Sprint 3: The Company's Brain
Companion to: PRD v1.0, Technical Architecture v1.0, Content Modules Architecture v1.0 (Sprint 2)
Status: **Foundation spec — extends the Sprint 2 schema, does not replace it**

---

## 0. What Changes, What Doesn't

Sprint 2 built one system — `Library → EntryType → Entry` — and proved a specific claim: a new module should cost a data insert, not a migration. Sprint 3 is that claim's first real test, going from 4 libraries to 15, and it holds. **Nothing in this document is a new schema.** It's the same model from Content Modules Architecture Section 1, seeded wider and given the two capabilities a true knowledge graph needs that a simple content library doesn't: typed relationships instead of generic links, and AI summaries as a first-class, staleness-tracked property of every entry.

Three reconciliations worth being explicit about, since Sprint 3's 15 collections overlap with Sprint 2's 4 modules and silently duplicating anything would be exactly the mistake this whole architecture has been built to avoid:

- **Brand Bible becomes Brand Knowledge** — same content (Brand Story, Voice & Tone, Messaging Pillars, Do's & Don'ts), renamed to match Sprint 3's vocabulary. Product Line Guide moves out of it into **Product Knowledge**, where it fits better now that Product Knowledge is a first-class collection rather than not existing yet.
- **Marketing Playbook dissolves into five collections** — Marketing, Meta Ads, UGC, Advertorials, and Email. This isn't scope growth; it's the split Sprint 2 already anticipated (its "Channel Guide" entry type existed specifically because Email/SMS/Social/Paid each had enough depth to eventually deserve their own home) finally happening now that the depth justifies it.
- **Knowledge Vault dissolves into SOPs, Product Knowledge, and Team Knowledge** — its five entry types (SOP, Formulation Record, Supplier Reference, Meeting Note, Policy/Compliance) redistribute to the collection each now fits more precisely. "Docs & Knowledge" as one undifferentiated bucket was always a placeholder for this.
- **Creative Library stays exactly as it is, and is not one of the 15** — it remains the raw asset repository (photos, video, logos, packaging files). The 15 collections below are knowledge — documents, insights, briefs, records — not files. A UGC entry describing creator strategy links *to* the actual video assets in Creative Library via a graph relationship; it doesn't duplicate them. This distinction (knowledge that's *about* something vs. the raw asset itself) is the difference between a useful graph and a redundant one.

---

## 1. "Knowledge Graph, Not Folders" — What That Actually Means

This is worth being precise about, because "knowledge graph" is also a term that gets used to justify an impressive-looking, rarely-used node-and-edge visualization screen — and that would be exactly the wrong lesson to take from this instruction.

**The real problem with folders is that knowledge is genuinely multi-parent, and a folder tree forces a single, arbitrary "true" location that hides every other legitimate context.** A customer complaint pattern about packaging is simultaneously Product Knowledge (a formulation/packaging issue), Customer Psychology (a trust/objection signal), and an SOP candidate (how support should respond next time). Filed in a folder, it lives in exactly one of those three places, and the other two contexts silently never find it. That's the actual failure mode being solved — not the *absence of a folder tree*, but the presence of genuine multi-parent relationships that a tree structurally cannot represent.

**So the graph lives in the data model — typed relationships and tags — not in a UI metaphor.** Concretely: no force-directed graph canvas, no node-and-edge visualization screen. That pattern demos beautifully and gets opened twice; Linear, Notion, and Stripe — the explicit reference points for this build — don't have one, because the actual value of graph-structured data shows up in *retrieval quality* (search surfaces the right thing regardless of which "folder" it would have lived in; AI grounding pulls from every genuinely relevant entry, not just the one in the folder someone thought to check), not in a picture of the graph. Section 5 covers exactly what the graph *does* look like on screen, and it's a list, grouped and labeled — because that's what's actually usable at 2am when someone needs an answer, not a canvas to pan and zoom.

---

## 2. The Fifteen Collections

Each is a `Library` row (Content Modules Architecture Section 1) — "Collection" is simply Sprint 3's product-facing term for the same table. Entry types listed are illustrative starting sets, not exhaustive; adding one later is the same zero-migration data insert established in Sprint 2.

| Collection | Why it's distinct from its neighbors | Starting entry types |
|---|---|---|
| **Brand Knowledge** | The authoritative voice/identity layer — absorbs Brand Bible | Brand Story, Voice & Tone, Messaging Pillars, Do's & Don'ts |
| **Product Knowledge** | Facts about the product itself, not how it's marketed | Formulation Record, Ingredient Reference, Sourcing Note, Product Line Guide |
| **Customer Psychology** | Why people buy, hesitate, and churn — the insight layer marketing and product both draw from | Buyer Persona, Objection & Response, Pain Point Insight, Testimonial Theme |
| **Marketing** | Channel-agnostic strategy and cadence — what's left after channel-specific work graduated out | General Playbook, Calendar Cadence Reference, Positioning Note |
| **Meta Ads** | Channel-specific — enough Meta-specific nuance (angles, creative testing, policy quirks) to not belong in general Marketing | Ad Angle, Ad Creative Brief, Performance Learning, Audience Note |
| **UGC** | Creator-sourced content strategy — distinct from Creative Library, which holds the actual video files | Creator Brief, Script Template, Content Example Analysis |
| **Advertorials** | A specific content format with its own conventions and compliance considerations | Advertorial Template, Published Reference, Landing Page Copy Pattern |
| **Email** | Klaviyo-adjacent knowledge — how flows/campaigns get built, not the flows themselves (those stay in Klaviyo, per PRD Section 8) | Flow Blueprint, Subject Line Bank, Campaign Retro |
| **SOPs** | Operational how-to, absorbed from Knowledge Vault | SOP, Exception Log |
| **Experiments** | Structured hypothesis → test → result records — genuinely new, and arguably the highest-leverage collection in this sprint, since it's the one that turns "we tried that once" into an actual queryable history | Hypothesis, Test Record, Result & Learning |
| **Analytics** | The *interpretation* layer on top of the Finance/Commerce dashboards that already exist — definitions and takeaways, not raw numbers | Metric Definition, Insight Note, Recurring Report Template |
| **Team Knowledge** | People-operations knowledge, absorbed from Knowledge Vault | Meeting Note, Role Reference, Onboarding Guide, Policy Note |
| **Creator Knowledge** | The creator/affiliate *roster* — who they are, terms, performance — distinct from UGC's content strategy | Creator Profile, Partnership Terms, Outreach Template |
| **Wholesale** | Partner-facing knowledge, precursor to the full Wholesale/Retail Pipeline domain already named in the PRD's Phase 4 roadmap | Partner Profile, Pricing/Terms Sheet, Onboarding Checklist |
| **Future Ideas** | Deliberately the loosest-structured collection — see Section 7 on why friction here specifically must stay near zero | Idea |

---

## 3. The Ten Capabilities — What's Reused, What's New

| Capability | Status | Where it lives |
|---|---|---|
| Tags | **Reused, unchanged** | `Tag` / `EntryTag` (Content Modules Section 1) — this is the mechanism that makes cross-collection discovery real; a tag applies identically whether it's on a Product Knowledge entry or a Meta Ads brief |
| Relationships | **Upgraded** | `ObjectRelation` gains a `relationType` — Section 4 |
| Version history | **Reused, unchanged** | `EntryVersion` (Content Modules Section 1) |
| AI summaries | **New** | `EntryAISummary` — Section 4 |
| Attachments | **New** | `Attachment` — Section 4 |
| References | **New** | `Reference` — Section 4, and deliberately narrower in scope than Relationships (see below) |
| Search | **Reused, unchanged** | `SearchIndex` (Technical Architecture Section 7), now spanning 15 collections instead of 4 |
| Status | **Reused, unchanged** | `Entry.status` (draft / published / archived) |
| Owner | **Reused, unchanged** | `Entry.ownerId` |
| Last Updated | **Reused, unchanged** | `Entry.updatedAt` |

Seven of ten were already built. That's the payoff of Sprint 2's discipline showing up concretely, not just claimed.

---

## 4. Schema Additions

```prisma
// ObjectRelation, upgraded: typed edges instead of generic links.
// This IS the knowledge graph — not a new table, an upgrade to the one
// already built in Technical Architecture Section 2.
model ObjectRelation {
  id             String   @id @default(cuid())
  organizationId String
  fromType       String
  fromId         String
  toType         String
  toId           String
  relationType   String   // "references" | "supersedes" | "contradicts" |
                           // "derived_from" | "supports" | "example_of" | "related_to"
  createdBy      String
  createdAt      DateTime @default(now())

  @@index([fromType, fromId])
  @@index([toType, toId])
  @@index([relationType])
}

// Incidental, single-purpose files attached to one Entry — a supplier PDF,
// a screenshot. NOT for genuinely reusable brand assets: a hero photo or a
// logo belongs in Creative Library as its own Entry, linked via ObjectRelation,
// where it's independently discoverable rather than buried inside one document.
model Attachment {
  id         String   @id @default(cuid())
  entryId    String
  fileRef    String    // R2 key or DriveFile id — same dual-storage pattern as Section 8/6 of the architecture doc
  fileName   String
  mimeType   String
  uploadedBy String
  createdAt  DateTime @default(now())
  entry      Entry    @relation(fields: [entryId], references: [id])

  @@index([entryId])
}

// External citations only — a link to an article, a not-yet-imported Drive
// file, a Shopify report. Internal entry-to-entry citations are a graph edge
// (ObjectRelation, relationType: "references"), not a Reference row — the
// graph stays unified rather than fragmenting citations across two tables.
model Reference {
  id          String   @id @default(cuid())
  entryId     String
  targetType  String    // "url" | "drive_file"
  url         String?
  driveFileId String?
  label       String
  createdAt   DateTime @default(now())
  entry       Entry    @relation(fields: [entryId], references: [id])

  @@index([entryId])
}

// One row per summary length, per entry — "brief" for Cmd+K/search-result
// previews, "detailed" for the detail-view header. sourceVersionId is what
// makes staleness detectable: if the Entry's current version differs from
// what the summary was generated against, the UI shows it as outdated,
// exactly like the SyncIndicator pattern used for Shopify/Klaviyo data.
model EntryAISummary {
  id              String   @id @default(cuid())
  entryId         String
  summaryType     String    // "brief" | "detailed"
  content         String
  model           String
  sourceVersionId String
  generatedAt     DateTime @default(now())
  entry           Entry    @relation(fields: [entryId], references: [id])

  @@unique([entryId, summaryType])
}
```

`Entry` (Content Modules Architecture Section 1) gains the corresponding back-relations (`attachments`, `references`, `aiSummaries`) — not restated here since the model itself is unchanged.

---

## 5. What the Graph Looks Like On Screen

Per Section 1's discipline: no canvas, no node-and-edge visualization. The existing "Related" panel from Screens & Flows (Template B) becomes a **Connections panel**, grouped by relation type rather than shown as a flat chip list:

```
Connections
  References (3)        Melting Complaint Pattern, Cold-Chain SOP, Q2 Retro
  Referenced by (5)     Packaging Update Brief, ...
  Supersedes (1)        Cold-Chain SOP v1
  Related (2)           Customer Objection: "Will it melt?", ...
```

Each row is the same clickable `RelatedObjectChip` component already in the inventory (Screens & Flows Section 7) — grouping by `relationType` is a rendering change, not a new component. This is deliberately closer to a citation list than a graph diagram, because a citation list is scannable in three seconds and a graph diagram requires interpretation. **Where the graph actually earns its complexity is invisible to the user:** in Section 6's AI summaries and Section 7's retrieval, both of which traverse `relationType`-aware paths a folder tree simply couldn't represent.

---

## 6. AI Summaries, in Practice

This is Tier 1 (PRD Section 16) applied per-entry rather than only to the Today briefing:

- On every `Entry` save, a background job (Technical Architecture's existing job-queue pattern) generates a **brief** summary (one line — what shows in search results and the Cmd+K palette) and, for longer entry types, a **detailed** summary (a paragraph — what shows at the top of the detail view, above the full content).
- Each summary records `sourceVersionId`. If the entry's latest `EntryVersion` doesn't match what a summary was generated against, the UI shows the same visual staleness treatment as a mirrored Shopify record — a quiet `⟳` marker, not a blocking error — and regeneration is queued automatically.
- **Summaries are never a substitute for reading the real entry on anything that matters** — they're a scanning aid for search results and quick recall, exactly the ambient, no-tool-calling, low-risk usage tier this pattern was designed for in the PRD. Drafting or acting from a summary alone is explicitly Tier 2/3 territory, gated by the retrieval-then-generate pattern already specified there.

---

## 7. Search and Retrieval Over the Graph

No new search system, again — `SearchIndex` (Technical Architecture Section 7) already spans every `Entry` regardless of collection. What the graph adds on top:

- **Relationship-aware retrieval for the Tier 3 copilot:** a query like "what do we know about melting complaints" doesn't just lexically/semantically match entries containing that phrase — it can traverse one hop of `ObjectRelation` from the top matches (a Customer Psychology objection entry pulls in its `references` to a Product Knowledge formulation note and a related SOP) before generating an answer, which is precisely the retrieval quality a flat search index over a folder tree can't produce, because a folder tree doesn't encode "these things are related" at all.
- **Future Ideas is deliberately excluded from AI-grounded drafting by default** — it's a capture space, not a source of truth, and treating half-formed ideas as grounding context for customer-facing drafts would be a real quality regression. It's fully searchable and taggable like everything else; it's just not in the default retrieval set for Tier 2/3 generation until something in it graduates (via a relationship or a status change) into a collection meant to ground real work.

---

## 8. What This Buys Later

The sixteenth collection — whatever it turns out to be — costs one `Library` row and its `EntryType` rows, exactly like the fifteenth did here and the fifth did in Sprint 2. That's not a promise anymore; it's a pattern that's now been exercised twice. The thing that *would* have required real engineering work — typed relationships, per-entry AI summaries, attachments distinct from first-class assets — is what this sprint actually built, and every future collection inherits it for free.

---

## Closing

Fifteen collections, zero new list screens, zero new detail screens, one schema upgrade (typed edges) and three small new tables (attachments, references, AI summaries) shared by all of them. "The company's brain," concretely, is the claim that everything above is retrievable through one search bar and one relationship graph regardless of which of the fifteen collections it started in — not fifteen filing cabinets with a shared login page.
