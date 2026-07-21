# Heart Magic OS — Content Modules Architecture
### v1.0 — Brand Bible, Marketing Playbook, Creative Library, Knowledge Vault
Companion to: PRD v1.0, Technical Architecture v1.0, Screens & Flows v1.0, Design System v1.0
Status: **Foundation spec — every future content-driven module builds on what's defined here**

---

## 0. The One Decision Everything Else Depends On

Four modules were requested. The wrong way to build them is four database tables, four list screens, four detail screens, and four search implementations — a plausible-looking plan that quietly commits to rebuilding the same system four times and a fifth time whenever the next module gets requested.

**The right way, and the actual architecture below: there is one content system — Libraries containing typed Entries — and Brand Bible, Marketing Playbook, Creative Library, and Knowledge Vault are four rows of configuration on top of it, not four schemas.** This is the same discipline the Screens & Flows document applied to screens (six templates, not forty bespoke layouts) and the Technical Architecture applied to cross-object relationships (one generic `ObjectRelation` table, not a foreign key per relationship type) — applied here one level deeper, to content itself.

The payoff is concrete and worth stating up front: when a fifth module gets requested eighteen months from now — an Ops Playbook, a Wholesale Partner Directory, whatever it turns out to be — building it means inserting one `Library` row and a handful of `EntryType` rows. No migration, no new screens, no new search implementation. That's the actual meaning of "scalable system rather than a collection of pages," made concrete rather than left as an aspiration.

**Reconciliation note:** this supersedes the standalone `Document`/`DocumentVersion` model from Technical Architecture Section 2. That model was scoped when "Docs & Knowledge" was one undifferentiated domain; it's now generalized into the `Entry`/`EntryVersion` model below, and the original Docs & Knowledge domain becomes **Knowledge Vault** — one of the four libraries, not a fifth concept sitting outside this system. Nothing about the PRD's information architecture changes; this is that same domain, given the scaffolding it always needed once more than one kind of library was on the roadmap.

---

## 1. The Generic Data Model

```prisma
model Library {
  id             String   @id @default(cuid())
  organizationId String
  key            String   // "brand-bible" | "marketing-playbook" | "creative-library" | "knowledge-vault"
  name           String
  icon           String
  description    String
  accentToken    String   // e.g. "clay" | "rose" | "sage" — ties directly to Design System Section 1
  entryTypes     EntryType[]
  entries        Entry[]

  @@unique([organizationId, key])
}

model EntryType {
  id          String  @id @default(cuid())
  libraryId   String
  key         String    // "voice-tone" | "playbook" | "photo" | "sop" ...
  name        String
  icon        String
  fieldSchema Json      // engineer-defined structured template — see Section 8: never end-user-editable
  library     Library   @relation(fields: [libraryId], references: [id])
  entries     Entry[]

  @@unique([libraryId, key])
}

model Entry {
  id               String   @id @default(cuid())
  organizationId   String
  libraryId        String
  entryTypeId      String
  title            String
  blocks           Json      // rich WYSIWYG content
  structuredFields Json      // typed values matching EntryType.fieldSchema
  status           String   @default("draft")  // draft | published | archived
  ownerId          String
  fileRef          String?   // R2 key or DriveFile id — populated for asset-type entries (Creative Library)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  library          Library   @relation(fields: [libraryId], references: [id])
  entryType        EntryType @relation(fields: [entryTypeId], references: [id])
  versions         EntryVersion[]
  tags             EntryTag[]

  @@index([organizationId, libraryId])
  @@index([entryTypeId, status])
}

model EntryVersion {
  id        String   @id @default(cuid())
  entryId   String
  blocks    Json
  editedBy  String
  createdAt DateTime @default(now())
  entry     Entry    @relation(fields: [entryId], references: [id])

  @@index([entryId, createdAt])
}

model Tag {
  id             String @id @default(cuid())
  organizationId String
  name           String
  entries        EntryTag[]

  @@unique([organizationId, name])
}

model EntryTag {
  entryId String
  tagId   String
  entry   Entry @relation(fields: [entryId], references: [id])
  tag     Tag   @relation(fields: [tagId], references: [id])

  @@id([entryId, tagId])
}
```

**Nothing new needed for relations or search.** An Entry links to a Task, a Case, an Order, or another Entry through the existing `ObjectRelation` table (Technical Architecture Section 2) — a Marketing Playbook entry referencing the Project it spawned uses the exact same mechanism as a Case referencing an Order. Every Entry indexes into the existing `SearchIndex` table the same way a Task or Case does, with `objectType: "entry"` and `libraryId` carried as a filterable facet. **Versioning reuses the same append-only pattern** already established for Documents. This is the entire point of building those primitives generically the first time: this is the third or fourth system in this product to lean on them for free.

**Why `fieldSchema` is JSON but not a user-facing field builder:** the PRD explicitly rejected a custom-field builder (PRD Section 15, restated in Screens & Flows Section 0) — that decision holds here without modification. `EntryType.fieldSchema` is a structure engineers define when a new entry type is needed (e.g., adding a "Supplier Reference" type to Knowledge Vault), not something a non-technical employee configures. The flexibility this model provides is for the team building HM OS to add types cheaply; it is deliberately invisible to the people using it, per Section 8 below.

---

## 2. Module Definitions

Every page in every module answers the same five questions, per the brief. Answered once here at the module level; entry-type-level specifics (Section 2.1–2.4) refine "who" and "how often" further where they meaningfully differ within a module.

### 2.1 Brand Bible
- **Why does this exist?** So "is this on-brand" has one authoritative answer instead of living in Jacob's head — the single highest-leverage defense against brand drift as more people create customer-facing content.
- **Who uses it?** Anyone producing customer-facing material — marketing/growth first, but also whoever's answering a tone-sensitive support case, and every new hire in their first week.
- **How often?** Referenced constantly (every piece of content created should get a quick check), edited rarely — a brand bible that changes weekly isn't a brand bible.
- **What actions can they take?** Browse by entry type, search, copy a hex code or exact wording, jump to the matching Creative Library asset (logo, product photography) via cross-link, comment/suggest an edit for review rather than editing published brand guidance unilaterally.
- **How does AI eventually enhance this page?** This is the single most valuable AI integration point in the whole system: Tier 2 assistive drafting (PRD Section 16) should pull Brand Bible content as grounding context **automatically, every time**, whenever anything customer-facing is drafted anywhere in HM OS — a case response, a campaign brief, a social caption. Nobody should have to remember to "check the brand bible first"; the AI should have already read it.

*Entry types:* Brand Story, Voice & Tone, Messaging Pillars, Do's & Don'ts, Product Line Guide (one per SKU line — Elemental, Eternal Bloom Rose, Signature Blend).

### 2.2 Marketing Playbook
- **Why does this exist?** So running a campaign or a launch doesn't mean reinventing the process each time, and so what's learned from one launch actually improves the next one instead of evaporating.
- **Who uses it?** The marketing/growth lead day-to-day; Jacob when reviewing a plan or after a retro.
- **How often?** Referenced at the start of every campaign or launch; edited after retros, deliberately ("update the playbook with what we learned" as a real, expected step, not an afterthought).
- **What actions can they take?** Browse by playbook type, and — the one genuinely novel action in this module — **turn a Playbook entry into a live Project** with pre-filled Tasks (a direct, one-click bridge into the existing Projects & Tasks domain from PRD Section 8), rather than the playbook staying a document nobody actually follows step by step.
- **How does AI eventually enhance this page?** Tier 2: draft a first-pass campaign brief from a playbook template plus a stated goal (already scoped generally in PRD Section 16, now given a concrete source). Tier 4, later: a bounded agent that checks a completed campaign's Project against its originating Playbook and flags skipped steps — strictly advisory, never auto-modifying either object.

*Entry types:* Playbook (a runnable checklist template — the entry type with `structuredFields` shaped as an ordered task list, directly consumed by the "turn into Project" action), Channel Guide (Email/SMS/Social/Paid, one entry per channel), Campaign Retro, Calendar Cadence Reference.

### 2.3 Creative Library
- **Why does this exist?** One home for every brand asset — photography, logos, packaging files, video — so nobody digs through Google Drive, old email attachments, or a designer's personal folder to find "the good product shot."
- **Who uses it?** Everyone creating anything customer-facing; support occasionally, to pull an asset for a customer-facing answer.
- **How often?** Very high-frequency browsing/searching, moderate-frequency uploading.
- **What actions can they take?** Filter by type/tag/product line, preview inline, download, copy a shareable link, and — the cross-link mechanic again — insert directly into a Doc, Case response, or Campaign Playbook without leaving that context.
- **How does AI eventually enhance this page?** Tier 1/3: semantic search over auto-generated image descriptions is one of the best concrete uses of the `pgvector` search already built (Technical Architecture Section 7) — "find a photo with the frother on a marble counter" should just work, without every image needing hand-written tags. Tier 4, later: auto-tagging new uploads by product line and content type as they land.

*Entry types:* Photo, Video, Logo/Mark, Packaging File, Font/Type Asset — each carrying `structuredFields` for usage rights, associated product line, and format/resolution.

### 2.4 Knowledge Vault
- **Why does this exist?** The institutional-memory layer for everything real and operational that isn't brand, marketing, or creative assets — SOPs, formulation records, supplier information, meeting notes, policy notes. This *is* the PRD's original "Docs & Knowledge" domain, scoped as one library among four now that the product has grown past treating all documentation as one undifferentiated pile.
- **Who uses it?** Everyone — especially new hires (their onboarding checklist and role-relevant SOPs live here, per PRD Section 5.5) and ops.
- **How often?** High-frequency reference, moderate-frequency editing.
- **What actions can they take?** Browse by type, link to a related Task/Case/Project, view version history/diff on anything that's been edited.
- **How does AI eventually enhance this page?** Tier 2: draft a new SOP from a rough voice note or bullet list (already scoped in PRD Section 16). Tier 3: the command-palette copilot answering "how do we handle a damaged shipment" by retrieving the right SOP directly, rather than someone hunting for it.

*Entry types:* SOP, Formulation Record, Supplier/Vendor Reference, Meeting Note, Policy/Compliance Note.

---

## 3. UX System — Reused, Extended by Exactly One New Template

All four modules are built from the six templates in Screens & Flows v1.0, plus **one genuinely new template**, justified the same way Board (Template D) was: it fits a shape of content the existing templates don't.

- **List/browse view (any library):** Template A, filterable by Library, Entry Type, and Tag — the same `ListRow` component every other list in the system uses.
- **Reference/reading detail (Brand Bible, Marketing Playbook, Knowledge Vault entries):** Template B, the native detail panel — but using the **wide variant (680px, the existing `proseMaxWidth` token from Design System Section 3)** for long-form entry types like Brand Story or a full Playbook, versus the standard 420px width for short reference entries like a single Do/Don't. This is a token choice, not a new template — directly applying the Design System's "density is a token, not a redesign" principle (Design System Section 11) to panel width instead of inventing a seventh layout.
- **Template G — Gallery (new, Creative Library only):** a grid of visual thumbnails rather than text rows, because image-heavy content is a genuinely different shape than everything else in the system — the same justification that earned Board its place. Clicking a thumbnail opens the standard Template B detail panel; only the *browsing* surface is visual, keeping the interaction model (single click, list-adjacent panel) identical to everywhere else.
- **Entry creation, everywhere:** the existing context-aware `Create` action (Screens & Flows Section 0) now resolves to a two-step chooser — pick a Library, then an Entry Type — rather than a blank page. Section 8 covers why this matters for non-technical usability.

---

## 4. Mobile Responsiveness

Not previously specified in detail — worth doing properly here since it applies system-wide, not just to these four modules.

- **Sidebar** collapses to a bottom tab bar (the five most-used destinations) below a 768px breakpoint, with a "More" entry opening the full navigation as a drawer — never a hamburger-only pattern hiding primary navigation, which is a common mobile-web regression.
- **Template B panels become full-screen takeovers** on mobile rather than a fixed-width side panel — there's no room for "panel over list" at phone width, so the transition becomes a full navigation with a clear back action, preserving scroll position on return exactly as the desktop panel does.
- **Template A lists** drop secondary columns (owner, updated timestamp) to a single subtitle line under the title, keeping title + status pill + one identifying detail — the same information hierarchy, just stacked instead of columned.
- **Template G gallery** drops from a multi-column grid to 2 columns, never 1 — a single-column image feed reads as infinite scroll rather than a browsable library.
- **Touch targets are 44×44px minimum**, not the 40px desktop minimum from Design System Section 13 — the tighter desktop value assumes a mouse; touch needs the extra margin, and this is specified explicitly here so it doesn't get silently applied everywhere and waste space on desktop, or silently skipped on mobile because the 40px number is the one that's already documented.

---

## 5. Fast Search

No new search system — this is the existing hybrid `tsvector` + `pgvector` architecture from Technical Architecture Section 7, applied to a larger, more varied body of content than it was originally scoped against:

- Every `Entry` is indexed into `SearchIndex` on create/update via the same event-driven pipeline already built for Tasks and Cases — `libraryId` and `entryTypeId` are stored as filterable facets alongside the existing lexical/semantic columns.
- The command palette (`Cmd+K`) surfaces Entries exactly like any other object, ranked by the same relevance rules already defined (Screens & Flows Section 4) — a Brand Bible entry and an open Case can appear in the same result list if both are relevant, which is the point of a unified search layer instead of four separate ones.
- A dedicated per-library search/browse view is just Template A with a pinned `libraryId` filter — not a new screen, per the "saved view, not a screen" rule from Screens & Flows Section 0.
- At the stated scale target — thousands of entries — this remains comfortably within Postgres's capability, per the same reasoning in Technical Architecture Section 7 that ruled out a dedicated search cluster; nothing about four content-heavy modules changes that math by an order of magnitude.

---

## 6. AI-Readiness, as a Property of the Schema

The generic `Entry` model means AI readiness isn't four separate integration projects — it's one retrieval path (query `SearchIndex`, optionally filtered by `libraryId`) that every module gets automatically the moment it has content in it. Concretely, per the four-tier framework (PRD Section 16, Technical Architecture Section 5):

- **Tier 1 (ambient):** the Today view's briefing can already reference "3 new assets added to Creative Library this week" or "the Elemental Playbook was updated" using the same activity-log mechanism every other object uses — no module-specific work required.
- **Tier 2 (assistive drafting):** Brand Bible and Marketing Playbook entries are the primary grounding context for any drafting task anywhere in the system, as described in Section 2.1 — this is the concrete payoff of "AI-ready" for this sprint specifically.
- **Tier 3 (copilot):** every module is queryable through the same command-palette copilot the moment it's indexed — asking "what's our tone guidance for email subject lines" retrieves from Brand Bible; asking "how do we handle a damaged shipment" retrieves from Knowledge Vault; same code path, different content.
- **Tier 4 (bounded agents):** deferred, as already scoped — auto-tagging Creative Library uploads and playbook-compliance checking are both real future agents, neither built this sprint.

---

## 7. Non-Technical Employee UX

The single biggest risk to "easy for non-technical employees" is that the generic, powerful schema in Section 1 leaks into the UI as generic, powerful — and therefore intimidating — configuration. It must not:

- **Entry creation is a two-step choice, never a blank canvas:** pick a Library, pick an Entry Type, and the editor opens pre-filled with that type's expected sections (an SOP starts with empty "Purpose / Steps / Exceptions" headers already in place) — the person is filling in a form-shaped thing, not confronting an empty page and having to invent structure.
- **No markdown, no syntax, ever.** The block editor (already in the Component Inventory, Screens & Flows Section 7) is WYSIWYG — bold is a button, not `**asterisks**`.
- **The words "schema," "field," and "database" never appear in the product.** Internally this is `Library` → `EntryType` → `Entry`; to a user, it's just "Brand Bible" and "a new Voice & Tone entry" — the abstraction is real and load-bearing for engineering, and completely invisible to the person filling in a form.
- **Empty states guide, they don't just report absence** — per the existing `EmptyState` component (Screens & Flows Section 7): a brand-new Marketing Playbook library shows "Nothing here yet — start with your next launch's playbook" plus the create action, not a bare "No entries."

---

## 8. What This Buys Later

Restating Section 0's payoff now that the whole system is specified: a fifth library is a data migration inserting one `Library` row and a few `EntryType` rows, reusing every screen, every search behavior, every version-history mechanism, and every AI retrieval path already built for the first four. That's the actual, testable meaning of "designed as a scalable system rather than a collection of pages" — not an aspiration in this document, but a property of the schema in Section 1 that can be verified the day it's needed.

---

## Closing

Nothing in this document introduces a feature outside the four requested modules — Section 0's "no random features" instruction was read as license to build the underlying system properly, not as permission to add scope on top of it. The four modules ship as four `Library` rows; everything they need — search, versioning, cross-linking, AI grounding, mobile behavior — already exists as of this document, inherited rather than rebuilt.
