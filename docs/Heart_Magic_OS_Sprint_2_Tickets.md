# Heart Magic OS — Sprint 2 Backlog
### Revised scope: Brand Bible, Marketing Playbook, Creative Library, Knowledge Vault
References: Content Modules Architecture v1.0, Technical Architecture v1.0 (updated for Supabase), Screens & Flows v1.0, Design System v1.0

**Sprint 1 recap (done):** Next.js, Tailwind, Supabase, Authentication, Navigation, Dashboard Layout, Theme, Deployment, GitHub.

**Scope revision note:** Sprint 2 was originally scoped around Commerce/Marketing sync and the Today view (Epics A3/A4/C/D below). That's been superseded by direction to build the four content modules first — a reasonable resequencing, since these modules have zero external API dependency (no Shopify/Klaviyo integration risk) and prove out the generic content architecture and design system wiring faster than integration work would. Epics A1/A2 and B remain exactly as valuable as before — this content system needs the same schema/RLS foundation and design tokens Commerce would have needed. A3/A4/C/D move to Sprint 3, unchanged, not dropped.

**Sprint 2 goal:** the first truly usable version of HM OS — someone non-technical can open Brand Bible, Marketing Playbook, Creative Library, or Knowledge Vault, find what they need fast, and create a new entry without confusion. Nothing below is infrastructure for its own sake; every ticket earns its place against that bar.

---

## Epic A — Data Foundations (RLS + Schema)

Do this first — every other epic reads data this epic creates.

**A1. Postgres schema migration for core tables**
Create `organizations`, `users`, `role_assignments`, `activity_log` per Technical Architecture Section 2, plus `Library`, `EntryType`, `Entry`, `EntryVersion`, `Tag`, `EntryTag` per Content Modules Architecture Section 1. Prisma schema + first migration.
*Acceptance:* migration runs clean on a fresh Supabase project; every table has `organization_id`; `Entry` carries `libraryId`/`entryTypeId` indexes.

**A2. Row-Level Security policies**
Write RLS policies scoped to `organization_id` via `auth.uid()` for every table in A1, directly in Supabase's SQL editor before any app code depends on them.
*Acceptance:* a manual test — querying as a second, unaffiliated Supabase user returns zero rows from org-scoped tables, even with a hand-crafted query that skips application code entirely.

**A3. Seed the four Libraries and their Entry Types**
Insert the four `Library` rows (Brand Bible, Marketing Playbook, Creative Library, Knowledge Vault) and their `EntryType` rows per Content Modules Architecture Section 2 — this is data, not a migration, and should be trivially editable/extensible without a deploy.
*Acceptance:* all four libraries and their entry types exist in the seeded database; adding a fifth `EntryType` to an existing library requires only an insert, no schema change.

**Deferred to Sprint 3, unchanged:** Shopify connection + webhook ingestion, Klaviyo connection + webhook ingestion (`integration_connections`, `commerce_*`, `marketing_*` tables) — see the scope revision note above.

---

## Epic B — Design System Wiring

Can run in parallel with Epic A — different surface area, no shared dependencies.

**B1. Tailwind config from design tokens**
Translate `Heart_Magic_OS_Design_System_v1.md` Section 14's token JSON directly into `tailwind.config.ts` (colors, spacing scale, radius, shadow, font families) plus CSS variables for light/dark mode per Section 12 of that doc.
*Acceptance:* no hardcoded hex/px values anywhere in `packages/ui`; toggling dark mode via the documented mechanism swaps every semantic color correctly, matching the HTML style-guide specimen already delivered.

**B2. Core primitives**
Build `Button` (4 variants, 3 sizes), `Input`, `StatusPill` (inline-editable dropdown), `Card`, `Avatar`, `Badge`, `Skeleton`, `EmptyState` in `packages/ui`, per the Component Inventory in Screens & Flows Section 7 and the visual spec in Design System Sections 5–7.
*Acceptance:* each has a working hover/focus/disabled state matching the design system doc; focus rings use the accent color, never a browser default (Design System Section 7).

**B3. App shell**
`Sidebar`, `SidebarNavItem`, `TopBarSearch` per Screens & Flows Section 4 — this likely already exists from Sprint 1's "Navigation" and "Dashboard Layout" tickets; this ticket is specifically to reconcile that existing work against the documented spec (240px width, active-state accent pill, no default-blue selection state) rather than build from scratch.
*Acceptance:* sidebar visually matches the Design System Section 8 spec exactly, including the active nav item's accent-tinted pill background.

---

## Epic C — Entry Editor & List/Gallery Views

Depends on Epic A (schema/seed) and Epic B (primitives). This is the sprint's core deliverable.

**C1. Library browse view (Template A)**
`ListRow`-based list, filterable by Entry Type and Tag, one instance reused across Brand Bible, Marketing Playbook, and Knowledge Vault (Content Modules Section 3).
*Acceptance:* switching libraries changes only the data and filters shown, never the component used to render them.

**C2. Creative Library gallery view (Template G — new)**
Thumbnail grid, click-through to standard Template B detail panel, per Content Modules Section 3.
*Acceptance:* grid responds correctly at the mobile breakpoint (2 columns per Section 4 of that doc); non-image entry types (if any land in Creative Library later) degrade gracefully to a file-type icon tile.

**C3. Entry detail panel — standard and wide variants**
Template B, using the existing 420px width for short reference entries and the 680px `proseMaxWidth` token for long-form types (Brand Story, full Playbooks) — a token choice per Content Modules Section 3, not two components.
*Acceptance:* both widths render from the same `Panel` component with a `width` prop; no forked implementation.

**C4. Entry creation flow**
The context-aware `Create` action resolves to a two-step chooser (Library → Entry Type), then opens the block editor pre-filled with that type's expected sections (Content Modules Section 7).
*Acceptance:* a non-technical test user can create a new SOP entry without being shown the words "schema," "field," or "database" anywhere in the flow.

**C5. Block editor (WYSIWYG)**
The `RichTextBlock` component, if not already usable from Sprint 1's foundation — bold/italic/lists/headers as toolbar actions, no markdown syntax exposed.
*Acceptance:* content created in the editor round-trips correctly through `Entry.blocks` and renders identically on reload.

**C6. Version history**
Every Entry save writes an `EntryVersion` row; a simple version list/diff view is reachable from the detail panel.
*Acceptance:* editing an entry twice produces two retrievable historical versions, matching the existing Document-versioning pattern this generalizes.

**C7. "Turn Playbook into Project" action**
Marketing Playbook's one entry-type-specific action (Content Modules Section 2.2) — reads a Playbook entry's `structuredFields` task list and creates a Project + Tasks via the existing Projects & Tasks domain.
*Acceptance:* one click produces a real Project with the playbook's steps as Tasks, correctly linked back to the originating Entry via `ObjectRelation`.

---

## Epic D — Search & Tagging

Depends on Epic C (needs entries to index).

**D1. Search indexing pipeline for Entries**
Wire `Entry` create/update into the existing event-driven `SearchIndex` pipeline (Technical Architecture Section 7) — `tsvector` generation is automatic; embedding generation via Voyage AI follows the same background-job pattern already built.
*Acceptance:* a newly created entry is findable via lexical search within seconds and via semantic search within the embedding job's normal latency.

**D2. Command palette integration**
Entries appear in `Cmd+K` results ranked alongside every other object type, per the existing relevance rules (Screens & Flows Section 4) — no special-casing required if D1 is done correctly.
*Acceptance:* searching a Brand Bible term surfaces the right entry in the palette without navigating to a library first.

**D3. Tagging UI**
Simple tag add/remove on the entry detail panel, backed by `Tag`/`EntryTag`; tag-based filtering on Template A/G list views.
*Acceptance:* a tag applied to entries across different libraries (e.g., "Eternal Bloom Rose" on a Brand Bible entry and a Creative Library asset) correctly filters both when selected.

---

## Suggested Sequencing

```
Week 1:  A1 → A2 → A3 (parallel: B1, B2 in progress)
Week 2:  B2, B3 finish → C1, C4, C5 start
Week 3:  C2, C3, C6, C7 → D1 starts
Week 4:  D2, D3 → mobile responsiveness pass on all of Epic C → full Sprint 2 review
```

**Not in this sprint, on purpose:** Shopify/Klaviyo sync, Today view, Commerce read surfaces (deferred to Sprint 3, per the scope revision note above), Customer Cases, Finance. Resist pulling these forward — the entire point of this sprint is proving the generic Library/Entry architecture once, cleanly, across four real modules, before anything else gets built on top of it.

---

## Definition of Done for Sprint 2

Not "all tickets closed" — the actual bar: **a non-technical employee can open any of the four modules on their phone or laptop, find a specific entry through search in under ten seconds, and create a new entry without help.** If that's not true after D3 ships, the sprint isn't done regardless of ticket status — go find the gap before starting Sprint 3.
