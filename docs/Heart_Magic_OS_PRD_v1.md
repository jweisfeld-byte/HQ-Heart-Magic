# Heart Magic OS — Product Requirements Document
### v1.0 — Pre-Development Architecture & Vision
Prepared for: Jacob, Founder, Heart Magic LLC (Austin, TX)
Status: **Draft for review — no production code has been written**

---

## 0. Preface: What This Document Is, and What It Is Not

This PRD is the foundation of a multi-year product build. It is meant to be argued with, not rubber-stamped. Where I disagree with the framing in the original brief, I say so explicitly and explain why, because a co-founder who only nods is not doing the job.

Before writing this, I pulled live data from your connected Shopify store and Klaviyo account rather than guessing. Here is what I actually know about the business today, as opposed to what I'm assuming:

- **Legal entity:** Heart Magic LLC, based in Austin, TX.
- **Category:** Direct-to-consumer wellness / functional food. Specifically ceremonial-grade cacao and functional-mushroom cacao blends (Elemental, Eternal Bloom Rose, Signature/Original Blend), sold as discs, "hearts," instant cacao, plus an accessory (frother) and at least one cross-promotional bundle and affiliate-style digital offer (a free "Month of Yoga" partnership).
- **Commerce stack:** Shopify (core store of record for products, orders, inventory, customers).
- **Marketing stack:** Klaviyo (email/SMS, flows, campaigns, segments).
- **Team shape (confirmed):** Founder + 1–3 collaborators today. This is the real scale to design the v1 experience for — the personas in Section 4 beyond "Founder" are real near-term roles, not speculative future hires.
- **Commercial scope (confirmed):** HM OS is internal-only, permanently. Not a future product to sell to other brands. This removes Phase 5 (Platform) from the roadmap entirely and simplifies several decisions below.
- **Confirmed current tools:** Accounting is handled in QuickBooks or Xero (which one, specifically, still to confirm), and team communication runs through Slack. No dedicated helpdesk tool (e.g. Gorgias) is in use — support is handled informally for now, which shapes how the Customer Cases domain should ingest data (Section 18).
- **Build approach (confirmed):** budget and timeline aren't locked yet — before committing to the full custom stack in Section 14, the next deliverable should be a cost/timeline estimate for Phase 1, so this can be a real decision rather than a default.
- **No existing internal system.** There is a Claude.ai project called "HM Operating System WEBSITE" with the description "create a hub for heart magic to run from," but it contains no uploaded documents, specs, or prior art — this PRD is starting from a blank slate, not replacing an existing internal tool.

Everything else in this document — personas, workflows, roadmap sequencing — is informed judgment, not fact. I've marked the load-bearing assumptions so we can correct them in one pass rather than finding out six months into the build.

---

## 1. Vision

Heart Magic OS is the single operating surface where Heart Magic's business actually runs — not a wiki that describes the business, and not a dashboard that reports on it after the fact, but the live substrate underneath the work itself.

Five years from now, a new hire at Heart Magic should be able to open one application and see, in the same coherent surface: what shipped this week, what's in the funnel, what a customer complained about an hour ago, what the reorder point is on Peruvian heirloom cacao, what the Q3 wholesale pipeline looks like, and what needs their attention right now — ranked, not just listed. They should never need to ask "where does that live?" The answer is always: here.

The vision is not "software that helps run Heart Magic." It's software that Heart Magic cannot competitively operate without, in the way a modern e-commerce brand cannot operate without Shopify. That's a high bar, and it's the right one — it's the difference between building a tool and building infrastructure.

**A vision statement worth pushing back on:** the brief asks for something that resembles six different best-in-class products (Notion, Linear, Stripe Dashboard, HubSpot, Superhuman, Apple). Each of those products is world-class *because* it says no to almost everything outside its lane. Notion is flexible and mediocre at structured work. Linear is structured and refuses to be a wiki. Stripe's dashboard is beautiful because it only has to render one kind of data — money moving. Trying to be all six at once, on day one, is how internal tools become bloated and unloved. The way to actually get that "feels like all of these" reaction is to nail one thing first (I'll argue below for the operational command center) so well that people trust the product, then expand its surface area deliberately. Vision-as-north-star: yes. Vision-as-v1-scope: no.

---

## 2. Mission

To give Heart Magic's team perfect situational awareness and frictionless execution across every function of the business — commerce, marketing, fulfillment, finance, product development, and people — inside one fast, beautiful, trustworthy system, so that the constraint on growth is never "we couldn't find the information" or "we didn't know it needed doing," but only strategy and execution quality.

Concretely, the mission breaks into three commitments:

1. **Nothing important lives only in someone's head or a Slack thread.** If it matters to running the business, it has a home in HM OS, with an owner and a status.
2. **The system tells you what to do next, not just what happened.** Reporting is a commodity; every wellness brand has a Shopify analytics tab. The differentiator is prioritized, contextual action — surfaced, not searched for.
3. **Speed and beauty are not luxuries, they're retention mechanics — for internal tools too.** If the system is slow or ugly, people route around it with spreadsheets and DMs within a month, and all the architecture in this document becomes irrelevant. Performance and craft are functional requirements, not polish applied at the end.

---

## 3. Business Goals

These are the goals the *software* needs to serve. I'm distinguishing company-level goals (grow revenue, expand wholesale, etc. — yours to set) from the software's goals in service of the company, since conflating them leads to a PRD that reads like a pitch deck instead of a spec.

**What I can infer justifies this investment, given a small-team DTC wellness brand at this stage:**

- **Reduce coordination overhead** as headcount grows from "founder + a few people" to a real team, without the chaos of scaling via more Slack channels and more spreadsheets — the default failure mode for growing DTC brands.
- **Protect institutional knowledge.** Formulation notes, supplier relationships, what worked in past campaigns, why a product decision was made — in a founder-led company, this knowledge is dangerously concentrated. HM OS should be the place that knowledge is captured as a byproduct of doing the work, not a separate documentation chore.
- **Compress the loop between signal and action.** A spike in "mold" mentions in customer support, a SKU about to stock out, a flow with a collapsing open rate — these should surface inside a day, not get discovered at month-end review.
- **Create leverage ahead of headcount.** The explicit aim of a founder-led wellness brand adopting something like this is usually to defer hiring (ops coordinators, a BI analyst, a project manager) by having the system do coordination and reporting work software can do well.
- **Build a durable asset, not a one-off tool.** Because this is scoped as a multi-year product, architecture decisions should assume the company in three years looks meaningfully different — more SKUs, more channels (wholesale/retail is a natural next move for a cacao brand), more people — even if we build for today's scale first.

**Confirmed:** HM OS is internal-only, permanently — no commercial ambition to sell it to other brands. The multi-tenant-capable schema (Section 10) is still worth keeping for the much more mundane reason that it costs almost nothing and makes future internal reorganizations (a sister brand, a separate legal entity) painless — but Phase 5 (Platform) is off the roadmap for good, not conditional.

---

## 4. User Personas

I'm building personas around the actual shape of a small, growing DTC wellness company rather than generic enterprise archetypes. Team size is confirmed at founder + 1–3 collaborators today, so 4.2–4.4 below describe real, current roles rather than speculative hires; 4.5–4.6 remain projections for whenever those functions get staffed (bookkeeping may already be handled by a contractor via QuickBooks/Xero — worth confirming who that is and whether they need a seat).

### 4.1 The Founder / Operator — "Jacob" (confirmed persona)
Runs product, brand, marketing direction, partnerships, and probably still touches fulfillment and support personally. Needs a single morning view of the whole business, wants to delegate without losing visibility, and is the person who will feel most acutely if the system is slow or requires busywork to keep updated. This persona is the primary design target for v1 — if HM OS doesn't make Jacob's day materially better within the first month, the project has failed regardless of what else gets built.

### 4.2 The Marketing / Growth Lead (projected)
Owns campaigns, email/SMS flows (Klaviyo), content calendar, and paid acquisition if it exists. Needs campaign performance next to inventory reality (don't promote a SKU that's about to sell out) and a content pipeline that doesn't live in a separate Trello board.

### 4.3 The Ops / Fulfillment Coordinator (projected)
Owns inventory levels, supplier/co-packer relationships, order fulfillment exceptions, and shipping issues. Needs real-time stock visibility tied to reorder logic, and a task system that catches exceptions (backorders, damaged shipments) automatically rather than via manual triage.

### 4.4 The Customer Experience / Support Person (projected)
Handles inbound support, reviews, and escalations. Needs customer history (orders + past conversations + subscription status) unified in one profile view, and an easy way to flag a pattern ("three people this week mentioned melting in transit") that reaches the right owner without a Slack post disappearing into scroll.

### 4.5 The Finance / Bookkeeping Person (projected, possibly a contractor)
Cares about margin by SKU, cash position, COGS trends as ingredient costs shift, and monthly close. This persona has the strictest permission needs — financial detail should be tightly scoped even though visibility elsewhere in the system is generally generous (see Section 11).

### 4.6 The Contractor / Guest (projected)
Designers, co-packers, affiliates, or a bookkeeper who need scoped access to exactly one project or document set, nothing else, and ideally no full seat/license overhead.

**Persona-level pushback:** the brief doesn't mention team size or hiring plans at all, and I built 4.2–4.6 by inference from the product line and stage, not from anything you told me. If the real team is just you plus one part-time assistant, several sections below (permissions complexity, department-scoped finance views, contractor seats) are premature and should be simplified. I'd rather over-build the *data model* now (cheap) and under-build the *UI* for roles that don't exist yet (also cheap to add later) than the reverse.

---

## 5. User Journeys

Concrete walkthroughs, because abstract personas don't reveal design flaws — specific sequences of screens do.

### 5.1 Jacob's Morning Briefing
Opens HM OS. Lands on a **Today** view, not a dashboard grid of charts. It reads like a briefing a very good chief of staff would give: overnight orders and revenue vs. trailing average, any Klaviyo flow with an anomalous drop, any SKU that crossed a reorder threshold, open tasks assigned to him due today, and any customer escalation flagged high-priority. Every line is a live link into the underlying object, not a static number — clicking "3 orders flagged: address issue" opens those three orders, not a filtered Shopify tab in a new browser context.

### 5.2 New Product Launch (e.g., a new cacao blend)
A formulation doc is created in HM OS (recipe, sourcing notes, cost breakdown) → linked to a Project called "Launch: [Blend Name]" with a task checklist (photography, Shopify listing, Klaviyo flow, launch email, packaging order) → as the Shopify listing goes live, HM OS detects the new product via the Shopify integration and offers to attach it to the existing launch project automatically → as the Klaviyo flow is built, same auto-linking → the Today view surfaces "Launch: [Blend Name] — 2 tasks remaining, T-minus 3 days" to every relevant owner without anyone manually cross-posting status.

### 5.3 Customer Escalation
A support message comes in — confirmed to arrive informally today (email or social DMs, no dedicated helpdesk tool) — mentioning a damaged shipment. It's logged as a **Case**, auto-linked to the customer's order history and subscription status pulled from Shopify, and to their email engagement from Klaviyo. If three similar cases land in a week, HM OS should surface a pattern alert to Ops, not rely on someone noticing organically. Resolution and root cause get logged on the case, building a searchable institutional record of "what goes wrong and how we fixed it" — genuinely valuable eighteen months in, when someone asks "didn't this happen before?"

### 5.4 Monthly Financial Close (projected, finance persona)
Finance opens a Finance workspace scoped to them and (optionally) Jacob. Revenue and order data sync from Shopify; margin by SKU is computed from a COGS table maintained in HM OS (ingredient/packaging cost inputs, since Shopify doesn't know true cost of goods). Output is a monthly snapshot — not a rebuilt accounting system. HM OS should make it easy to answer "what's our margin trend on the Eternal Bloom Rose line," not replace QuickBooks/Xero (confirmed already in use) for tax and books.

### 5.5 New Team Member Onboarding
A new hire's first day should be: one login, a role-scoped Today view already populated with their team's open work, and a pinned "Start Here" doc space with SOPs relevant to their function — not a scavenger hunt across Google Drive, Shopify staff access, Klaviyo seats, and a Notion page someone forgot to share.

---

## 6. Core Philosophy

Four beliefs that should override specific feature debates whenever they conflict:

**1. Structure first, flexibility second — the inverse of Notion's bet.** Notion's genius is infinite flexibility via blocks; its cost is that every team eventually builds an ungoverned mess of half-maintained databases. Linear's genius is the opposite bet: a small number of opinionated, well-modeled objects (Issue, Project, Cycle) that everything else is a view over. For a system that's meant to *run the business* — not just document it — Linear's bet is the right one. HM OS should have a real, opinionated core object model (Section 10) with flexible views and flexible documents layered on top, not a blank canvas that becomes entropy at scale.

**2. The system should be honest about what it doesn't know.** If Shopify inventory hasn't synced in ten minutes, say so, visibly — don't silently show stale numbers as if they were live. Trust, once lost in an internal ops tool, is very hard to rebuild; people quietly go back to checking Shopify directly "just to be sure," and the tool dies from disuse, not from a single dramatic failure.

**3. Don't rebuild what Shopify and Klaviyo already do well.** The temptation in a project like this is to reimplement inventory management, order management, and email marketing inside the new system because it's satisfying to own everything. Resist it. Shopify is the system of record for commerce; Klaviyo is the system of record for marketing execution. HM OS's job is to be the **orchestration and intelligence layer above them** — unifying, contextualizing, and acting on their data — plus owning the domains that have no good existing tool tailored to this business (formulation/R&D knowledge, SOPs, cross-functional launch coordination, unified customer case history, wholesale pipeline). Duplicating commerce logic is the single most likely way this project blows its budget and timeline.

**4. Speed is a feature with veto power.** Any feature that meaningfully slows down the core loop (open app → see what matters → act) should be reconsidered or moved behind a secondary surface. This is why "AI copilot" and "semantic search" are sequenced after the core is fast and trustworthy, not before (Section 19).

---

## 7. Product Principles

Operational rules translating the philosophy into day-to-day product decisions:

- **One object, one home.** Every entity (order, customer, task, doc, campaign) has exactly one canonical location it lives, even if it's referenced/embedded in many places. No duplicated, driftable copies of the same fact.
- **Every list is actionable, not just informational.** If you can see a queue of something, you can act on an item in that queue without leaving the view (bulk actions, inline status changes) — this is the Linear/Superhuman lesson: speed comes from never having to navigate away to do the thing you came to do.
- **Command-first, mouse-optional.** A `Cmd+K` command palette should be able to reach any object, any action, any navigation destination. This is non-negotiable for the "feels like Linear/Superhuman" goal — those products are loved specifically because power users almost never touch a mouse.
- **Defaults over configuration.** Every view ships with an opinionated, good-enough default. Customization exists, but nothing should require setup before it's useful — this is where Notion actively fails new teams (a blank page is not a feature).
- **Write once, appear everywhere relevant.** Logging a customer complaint once should make it visible on the customer's profile, in the relevant Case list, and in any pattern-detection rollup — without re-entry.
- **The system earns trust by being right, quietly, over and over.** No "clever" surprises. Predictable, then delightful — in that order.
- **Design for the person doing the work, not the person reviewing the report.** It's tempting to optimize for Jacob's dashboard. The actual daily leverage comes from making the ops coordinator's and support person's workflows fast, because their time-on-task, multiplied across every day, dwarfs the value of a nicer summary view.

---

## 8. Information Architecture

The core objects in the system, and how they relate. This is the skeleton everything else hangs off, so it's worth getting right before any UI is designed.

**Top-level domains (workspaces):**

- **Home** — the personal Today view (Section 5.1), notifications/inbox, and command palette entry point.
- **Docs & Knowledge** — SOPs, formulation/R&D notes, brand guidelines, meeting notes, supplier info. Notion-like flexible pages, but each doc can optionally be typed (e.g., "SOP," "Formulation Record," "Meeting Note") to make them filterable and templated rather than an undifferentiated pile.
- **Projects & Tasks** — Linear-style structured work: Projects contain Tasks, Tasks have status/assignee/due date/priority, and can link to any other object (a Task can reference an Order, a Doc, a Campaign).
- **Commerce** (mirrored, not owned) — Products, Orders, Customers, Inventory — synced live from Shopify, read-first with specific, deliberate write-back actions (e.g., updating inventory counts) rather than a full read-write clone.
- **Marketing** (mirrored, not owned) — Campaigns, Flows, Segments, Lists — synced from Klaviyo, plus a Content Calendar that is *not* mirrored (native to HM OS, since Klaviyo doesn't model a cross-channel content calendar).
- **Customer Cases** — native to HM OS: the unified support/escalation layer referencing Commerce and Marketing data but owned here, since no existing tool in your stack models this well without adding a full helpdesk platform.
- **Finance** — COGS inputs, margin views, cash snapshots. Deliberately narrow scope (Section 5.4) — not a books/ledger replacement.
- **People** — team directory, roles, onboarding checklists. Small footprint at current scale, designed to grow.
- **Wholesale / Retail Pipeline** — deliberately called out as a *future* domain (Section 19), not built in v1, because it doesn't exist yet in the current product line, but the data model should anticipate it (Section 10).

**Relationship principle:** every object type can link to every other object type through a generic "reference" mechanism (similar to Notion's mentions or Linear's relations), surfaced as a "Related" panel on any item. This is what makes the launch-project journey (5.2) or the escalation journey (5.3) work without bespoke one-off features for every cross-domain relationship someone eventually wants.

---

## 9. Navigation

A persistent left sidebar (Linear/Superhuman pattern, not Notion's expandable tree, because a flat, fast, keyboard-navigable list beats infinite nesting for an ops tool):

```
⌘K  Search / Command
─────────────────
🏠 Home (Today)
📥 Inbox
─────────────────
📚 Docs & Knowledge
✅ Projects & Tasks
─────────────────
🛍️ Commerce
   ├─ Orders
   ├─ Products
   ├─ Customers
   └─ Inventory
✉️ Marketing
   ├─ Campaigns
   ├─ Flows
   └─ Content Calendar
🎧 Customer Cases
💰 Finance
👥 People
─────────────────
⚙️ Settings
```

Design rules for this nav: it never scrolls (small enough footprint at any scale), it's fully keyboard-navigable (`g` then a letter, à la Linear/Gmail), and every top-level item is a saved, sensible default view — never a menu that requires a second click to become useful. Sub-items under Commerce/Marketing are only shown expanded when active, keeping the resting state minimal (an Apple-like restraint principle: show less by default, reveal depth on demand).

---

## 10. Database Architecture

**Recommendation: single Postgres database, relational core + JSONB for flexible content, built multi-tenant-capable from day one even though we operate as a single tenant.**

Why multi-tenant-capable even for internal-only use: it costs almost nothing extra at the schema level (an `organization_id` foreign key on every table) and it's the difference between "trivial to support a second brand/entity later" (a co-packer's own instance, a sister brand, or if the earlier open question about commercializing HM OS ever gets a "yes") versus a painful migration. This is cheap insurance, not premature scaling.

**Core schema (illustrative, not final):**

- `organizations` — the tenant boundary. One row today (Heart Magic LLC).
- `users`, `roles`, `role_assignments` — see Section 11.
- `documents` — flexible content via a `blocks` JSONB column (Notion-style), with a typed `doc_type` enum (SOP, Formulation Record, Meeting Note, Generic) and full relational metadata (owner, created/updated, workspace).
- `projects`, `tasks` — structured, Linear-style: status enum, priority enum, assignee, due_date, and a `task_relations` join table for arbitrary cross-object linking.
- `integration_connections` — one row per external system connection (Shopify, Klaviyo, future QuickBooks, etc.), storing encrypted OAuth tokens/API keys, sync cursor state, and health status — never storing commerce data *as* the source of truth, only as a connection descriptor.
- `commerce_orders`, `commerce_products`, `commerce_customers`, `commerce_inventory` — **cached, not authoritative** mirrors of Shopify data, refreshed via webhook + periodic reconciliation sync. Every row carries `source_system`, `source_id`, and `synced_at`, and the UI always shows staleness if `synced_at` exceeds a threshold (Core Philosophy #2).
- `marketing_campaigns`, `marketing_flows`, `marketing_segments` — same caching pattern against Klaviyo.
- `cases` — native table for the Customer Cases domain, with `case_relations` to orders/customers/campaigns.
- `finance_cogs_inputs`, `finance_snapshots` — narrow, native finance tables (Section 8).
- `activity_log` — append-only event stream (who did what, when, to what object) — this doubles as the audit log (Section 11) and as the raw material for any future "what happened this week" AI summary (Section 16).
- `search_index` — a materialized, denormalized table combining a Postgres `tsvector` column (lexical search) and a `vector` column via `pgvector` (semantic search), rebuilt incrementally as source objects change (Section 17).

**Why not a NoSQL/document-only store:** the business logic here (roles, tasks, statuses, financial rollups) is fundamentally relational, and Postgres's JSONB support gives Notion-like flexible-document behavior *within* a relational system, which is a better fit than either a pure document database (weak relational integrity) or a pure relational schema with no room for the freeform doc-editing experience. This is the same architectural bet several well-regarded modern tools (Linear included) have made.

**Data ownership boundary, restated as a hard rule:** Shopify and Klaviyo are always the write-of-record for commerce and marketing execution. HM OS never becomes the primary place you edit a product listing or build an email flow — it becomes the primary place you *see* those objects in context and *act* on the narrow set of operations that benefit from being triggered centrally (e.g., flagging a product as "launch-blocked" inside a Project, which is native to HM OS, not to Shopify).

---

## 11. Permissions

**Model: role-based access control (RBAC) with resource-level overrides, scoped by domain (workspace).**

Base roles, from broadest to narrowest:

- **Owner** — full access, including billing/integration credentials and org settings. You, today; likely stays a very short list permanently.
- **Admin** — full operational access, cannot manage billing/org-level integration secrets.
- **Manager** — full access within their domain(s) (e.g., a Marketing Manager sees all of Marketing + general domains, but Finance is hidden by default).
- **Contributor** — can create/edit within assigned projects/domains, cannot change org-wide settings or see Finance unless explicitly granted.
- **Viewer** — read-only across granted domains — useful for a bookkeeper who needs to *see* order data but never edit it.
- **Guest** — scoped to one project or one document tree only, time-boxed by default (auto-expiring access, since contractor engagements end and forgotten access is a real security liability).

**Domain-level scoping matters more than role granularity here.** Finance is the one domain that should default to closed (opt-in visibility) rather than open (opt-out) — everything else in the philosophy leans toward transparency (a small, trusted team benefits from broad visibility — hidden information breeds the Slack-DM-silo problem this whole system exists to prevent), but compensation, margin, and cash position are the reasonable exception.

**Audit log is not optional**, even at 2 people. It costs little to build in from the start (it's a natural extension of the `activity_log` table in Section 10) and becomes essential the moment there's a contractor, a bookkeeper, or a dispute about "who changed this."

**Assumption flagged:** I've designed this assuming a *trusted small team* model (generous default visibility, Finance as the sole locked domain) rather than a strict need-to-know enterprise model. If Heart Magic's culture or investor/board requirements call for stricter compartmentalization, this should change early — it's a philosophy decision, not just a config toggle, and it affects how "open" the Today view and search feel to use.

---

## 12. Authentication

**Confirmed (Sprint 1): Supabase Auth**, paired with Supabase as the Postgres provider (Section 10) rather than a separately-hosted managed auth provider. Since HM OS is internal-only, permanently (Section 3), the main reason to reach for a dedicated auth product like WorkOS — a cheap upgrade path to enterprise SSO/SAML — isn't worth much here. What matters more for a system this data-model-heavy is that Supabase Auth's `auth.uid()` plugs directly into Postgres Row-Level Security (Section 11), which is a more direct implementation of "the database itself enforces the permission boundary" than a separate auth provider issuing a JWT the app has to translate into a Postgres policy itself. One fewer vendor, and a tighter security model, for a team this size.

**v1 authentication should be:**
- Google OAuth as the sole sign-in method (confirmed as the team's identity provider) — sign-in defaults to "Continue with Google," no email/password path to manage or leak.
- Optional TOTP-based 2FA, required for Owner/Admin roles at minimum given the sensitivity of integration credentials they can access.
- Session management with visible "active sessions" and remote sign-out, since this is a system with access to commerce and customer data and device hygiene matters.

**Deliberately deferred to a later phase:** SAML/enterprise SSO, SCIM provisioning, IP allowlisting — all real features, all irrelevant at a 3–15 person company, and all easy to bolt on later if the underlying auth provider supports them (which is exactly why the provider choice matters now even though the features don't).

---

## 13. Future Scalability

Three axes of scale to design for now, without over-building for any of them prematurely:

**Data volume.** Order and customer volume will grow with the business; the caching architecture in Section 10 (webhook-driven sync + reconciliation, not full-table pulls) is chosen specifically so performance doesn't degrade as Shopify's data grows — HM OS never needs to hold or query the *entirety* of commerce history in hot storage, only a rolling, indexed window plus rollup aggregates for historical reporting.

**Team size.** The permissions model (Section 11) and navigation (Section 9) are built to feel appropriately lightweight at 3 people and appropriately structured at 30, by leaning on role/domain scoping rather than hand-built per-person configuration. The one thing to watch as headcount grows: the "generous default visibility" philosophy (Section 11) should be revisited explicitly once the team crosses a size where "everyone sees everything" stops being a feature and starts being noise — likely somewhere around 15–25 people, not a number to solve for today.

**Domain expansion.** The information architecture (Section 8) treats Wholesale/Retail, and eventually possibly Manufacturing/Supply Chain planning, as anticipated-but-not-built domains. The generic object-relation mechanism (any object can link to any object) and the multi-tenant-capable schema (Section 10) mean adding a new domain later is "add tables + views," not "redesign the core."

**A scalability temptation to explicitly reject:** building a plugin/extensibility framework (so "anyone can build a module") before there's more than one team building on this system. That's the right instinct for a platform business, and the wrong one for an internal tool with a single engineering owner (you, or a small team you hire) for the foreseeable future — it adds enormous complexity in service of a flexibility nobody's asked for yet. Revisit only if the earlier open question ("could this become a product for other brands") gets a real yes.

---

## 14. Technical Stack

Opinionated, chosen for a small team building a fast, beautiful, ambitious internal product without a large dedicated platform engineering org:

- **Frontend:** Next.js (React, TypeScript) — server components for fast initial loads, client-side interactivity where it matters (command palette, inline editing). TypeScript end-to-end is non-negotiable for a system this data-model-heavy; it catches the entity-relationship mistakes that would otherwise surface as production bugs.
- **Styling / component layer:** Tailwind CSS + a small internal component library (built on primitives like Radix UI for accessibility-correct behavior — dropdowns, dialogs, comboboxes — without reinventing them). This is also the foundation for the Design System in Section 15.
- **Backend API:** tRPC if the frontend and backend stay in one TypeScript codebase (fastest path, strong type safety, ideal for a small team) — GraphQL only if/when a genuinely separate client (e.g., a future mobile app) needs a stable, independently-versioned API contract. Don't reach for GraphQL's complexity before there's a second client that needs it.
- **Database:** Supabase (managed Postgres, confirmed in Sprint 1) — chosen over Neon specifically because it bundles Auth (Section 12) and Storage under one vendor relationship, and its native `auth.uid()` integration with Row-Level Security is a cleaner fit for this system's permissions model than a separate auth provider. Prisma or Drizzle as the ORM/query layer on top. `pgvector` extension enabled from the start for semantic search (Section 17).
- **Background jobs / workflows:** a managed job queue (e.g., Trigger.dev or Inngest) for sync jobs (Shopify/Klaviyo polling + webhook processing), scheduled digests, and any future AI agent workflows — not a hand-rolled cron system.
- **Hosting:** Vercel for the app (pairs natively with Next.js, minimal ops overhead — important, since there's no dedicated DevOps function yet), managed Postgres as above.
- **File storage:** S3-compatible object storage (e.g., Cloudflare R2 for lower egress cost) for documents, images, and attachments.
- **Transactional email:** Resend or Postmark for system emails (invites, notifications) — deliberately separate from Klaviyo, which stays the marketing/customer-facing send system.
- **AI layer:** Claude (Anthropic API) as the reasoning engine — detailed in Section 16.
- **Observability:** Sentry for error tracking, and a lightweight analytics layer (e.g., PostHog) for understanding internal usage patterns — you should be able to see which parts of HM OS your own team actually uses, applying the same rigor to this product that you'd apply to the storefront.

**Why not a low-code platform (Retool, Airtable, etc.)?** This was worth seriously considering given the "don't over-build" philosophy running through this document. The honest tradeoff: low-code gets a working v1 faster and cheaper, but this brief explicitly asks for a beautiful, fast, delightful, multi-year product — and low-code tools reliably hit a ceiling on exactly those dimensions (custom interaction design, performance at scale, and the "feels like Linear/Superhuman" craft bar) within 12–18 months, at which point you're migrating off it anyway, having paid twice. If budget or speed-to-first-value is a harder constraint than I'm assuming, this is a real fork in the road worth discussing explicitly rather than deciding by default.

---

## 15. Design System

The brand needs to read as **warm and premium** (ceremonial cacao, ritual, wellness) while the *product* needs to read as **fast, precise, and trustworthy** (ops tooling). These are in tension — warmth can slide into softness/slowness, precision can slide into coldness — and the design system's job is to resolve that tension deliberately rather than let it happen by accident.

**Resolution principle:** structure and motion borrow from Linear/Apple (restraint, precision, purposeful animation, generous whitespace, no gratuitous ornamentation); color, type, and imagery borrow from the Heart Magic brand (warm neutrals, terracotta/cacao-adjacent tones, organic accent rather than saturated "SaaS blue," a serif or humanist display face for headers paired with a clean grotesque for UI text). The rule of thumb: **the chrome is Apple-quiet; the accents are Heart-Magic-warm.**

**System components to define before any screen design starts** (this is the actual work of this section, and it should happen before pixels, not after):
- Token set: color (semantic, not just palette — `surface`, `border`, `accent`, `danger`, mapped to brand hues), spacing scale, type scale, radius scale, shadow/elevation scale, motion durations/easings.
- Core primitives: button, input, select/combobox, dialog, toast, table, card, badge/status-pill, avatar, command palette — each built once, accessibly, and reused everywhere, never re-implemented per-screen.
- Data-density patterns: how a dense operational table (Orders) and a spacious document view (a Doc) coexist under one visual language without feeling like two different apps — this is the hardest and most important design problem in the whole system, since Notion and Linear each solve it for only one density, and HM OS needs both.
- Motion philosophy: fast, subtle, purposeful (state changes, not decoration) — every animation should communicate something (this saved, this loaded, this moved) rather than exist for delight alone. Delight here comes from speed and correctness, not from flourish.

**Recommendation:** commission or produce an actual brand-to-product design language document as the first design artifact, before any screen is built — a short, opinionated style guide (in the spirit of this PRD) that a designer or future hire could pick up and apply consistently. Building screens before this exists is how internal tools end up looking like six different products stapled together.

---

## 16. AI Strategy

The brief lists AI as one of twenty sections; I'd push back on that framing. AI shouldn't be *a feature area* of HM OS — it should be a *capability that runs through* several of the domains already described, and treating it as a separate module risks it becoming a bolted-on chatbot nobody uses (the fate of most 2023–2025-era "AI features"). Here's how I'd sequence it so it earns its place rather than being decorative:

**Tier 1 — Ambient intelligence (earliest, highest value, least risky):** AI summarizes and surfaces rather than generates or acts. The Today view's briefing (Section 5.1) is written in natural language by an AI process reading the underlying structured data, not hand-coded report templates — this makes it flexible to what's actually notable on a given day, rather than a fixed dashboard that misses whatever wasn't anticipated. Similarly, pattern detection on Customer Cases ("3 mold complaints this week") is an AI-assisted read over the `cases` table, not a human noticing.

**Tier 2 — Assistive drafting:** AI drafts things a human reviews before they go live — a first pass at an SOP from a rough voice note, a draft response to a customer case based on similar past resolved cases, a first-draft campaign brief from a stated goal. Never auto-sends anything customer-facing without a human in the loop at this stage — that's a trust decision, not a technical limitation, and it should be revisited deliberately later, not by default.

**Tier 3 — Command-palette copilot:** natural-language queries against the whole system ("what's our margin on Eternal Bloom Rose this quarter," "show me every case mentioning shipping delays in the last 30 days") answered inline in the command palette, grounded strictly in HM OS's own data (via the search/embedding index in Section 17) — not a general chatbot, a *query interface* over the business's own structured and unstructured data. This is the single highest-leverage AI feature for a small operating team, and it's also the one most dependent on Section 17's search architecture being solid first.

**Tier 4 — Bounded agents (later, after trust is established):** narrowly-scoped background agents with a defined job and defined authority — an "inventory watch" agent that only ever creates a task and never edits inventory directly, a "weekly ops digest" agent that only ever drafts a doc for review. The design principle here: agents are teammates with a job description and a permission boundary, not an all-powerful assistant with access to everything. This mirrors the permissions model in Section 11 — an agent is just another role.

**What I'd explicitly avoid:** a generic "chat with your data" interface as the flagship AI feature. It demos well and gets used twice. Grounding AI in specific, recurring jobs (the morning briefing, pattern detection, drafting) produces something people actually rely on daily, because it shows up inside the workflow rather than requiring someone to remember to go ask it something.

---

## 17. Search Architecture

Search is the connective tissue that makes the "one object, one home, reachable from anywhere" philosophy (Section 7) actually true in practice, so it deserves real investment rather than being an afterthought bolted onto a `LIKE '%query%'` clause.

**Two distinct search experiences, because they solve different problems:**

**1. Instant command-palette search (`Cmd+K`).** Optimized for speed over recall — sub-100ms, fuzzy-matched, ranked by recency and role-relevance (a Marketing Manager's palette should surface marketing objects first for ambiguous queries), covering navigation destinations, objects, and actions ("Create Task," "New Doc") in one unified list. This is client-side-assisted (a lightweight index cached locally, refreshed on session start and via websocket/polling updates) precisely because network round-trip latency is the enemy of the Linear/Superhuman feel this is explicitly trying to achieve.

**2. Deep/semantic search (a dedicated search view, and the backing layer for AI Tier 3).** This is where the `search_index` table from Section 10 earns its keep: a hybrid of Postgres full-text search (`tsvector`, exact/lexical matches — great for SKUs, order numbers, exact phrases) and `pgvector` embedding similarity (semantic matches — "the complaint about cacao going moldy" finding a case titled "Discs arrived with white bloom" even without shared keywords). Results are merged and re-ranked, with lexical matches generally weighted higher for precision (a search for an order number should never be beaten by a semantically-similar-but-wrong result).

**Indexing strategy:** incremental, event-driven (a document edit, a new case, a status change triggers a background re-index of that object) rather than a nightly batch job — staleness in search is one of the fastest ways to lose user trust in the whole system (Core Philosophy #2 again). Embeddings generated via a background job queue (Section 14) to avoid blocking the save path on an API call to an embedding model.

**Explicitly not building in v1:** a general-purpose "ask anything about the company" natural-language search across truly unstructured sources (Slack history, old emails) — that's a bigger, separate infrastructure problem than searching HM OS's own structured objects, and conflating the two would blow up scope. If unifying search across external tools becomes a real need later, that's a deliberate, scoped project of its own.

---

## 18. Integrations

**Confirmed, must-have from day one (already in use):**
- **Shopify** — commerce system of record (orders, products, customers, inventory). Webhook-driven sync (order created/updated, product updated, inventory level changed) plus a periodic reconciliation job to catch anything a webhook missed.
- **Klaviyo** — marketing system of record (campaigns, flows, segments, lists). Similar sync pattern via Klaviyo's webhooks/API.

**Confirmed, add in Phase 1–2:**
- **Slack** — team communication is already here. HM OS notifications (task assignments, escalation alerts, low-stock warnings) should push to relevant Slack channels in addition to the in-app inbox, not replace Slack as the ambient communication layer.
- **QuickBooks** (confirmed) — feeds the Finance domain's COGS/margin snapshot data (Section 5.4) rather than HM OS re-deriving financials independently. QuickBooks' API is a known quantity (OAuth2, well-documented) — no discovery work needed here before Phase 4.

**Confirmed gap, designed around rather than assumed:**
- No helpdesk tool exists today — support runs informally through email/social DMs. This means the Customer Cases domain (Section 8) can't auto-ingest from a helpdesk API in Phase 2; the realistic v1 approach is manual/quick case creation (forward an email, paste a DM, or a lightweight shared inbox) rather than building against an integration that doesn't exist. Worth a real conversation before Phase 2: is a proper helpdesk tool (e.g. Gorgias) worth adopting now that a system exists to feed it into, or does HM OS's native Cases domain replace that need entirely?

**Likely near-term (still unconfirmed):**
- Fulfillment/3PL or shipping software (ShipStation, or Shopify's native fulfillment) — relevant to whether "Inventory" in HM OS needs a second data source beyond Shopify itself.

**Deliberately future, not near-term:** wholesale/retail-specific tools (e.g., a B2B ordering portal), manufacturing/MRP software, and HR/payroll systems — all real needs eventually for a growing physical-product wellness brand, none urgent enough to design integrations for before the core system exists and the near-term list above is confirmed.

**Integration architecture principle:** every integration is a first-class `integration_connections` row (Section 10) with its own health monitoring, visible sync status, and graceful degradation — if Klaviyo's API is down, the Marketing domain should clearly say "last synced 14 minutes ago, retrying" rather than silently going stale or throwing an error page. This is the same trust principle from Core Philosophy #2, applied specifically to the integration layer where it's most likely to be tested by real-world API flakiness.

---

## 19. Roadmap

A multi-year roadmap, sequenced so every phase ships something genuinely useful on its own — no phase is "infrastructure only" with nothing to show for it, because that's how internal tools lose founder attention and momentum halfway through.

| Phase | Name | Core Bet | Ships |
|---|---|---|---|
| 0 | Discovery (now) | Get the architecture and business context right before writing code | This PRD, resolved open questions, a validated data model |
| 1 | Command Center | A great read-only "Today" view beats a mediocre everything-app | Unified dashboard pulling live Shopify + Klaviyo data, Docs & Knowledge (native), basic Projects & Tasks, command palette, single-user/small-team auth |
| 2 | Operate | Multi-user coordination is the real unlock, not more dashboards | Full permissions/roles (Section 11), Customer Cases domain, notifications/inbox, cross-object linking, first automations (e.g., low-stock → auto-task) |
| 3 | Intelligence | AI should assist recurring jobs, not exist as a demo | AI-written briefings (Tier 1), semantic search (Section 17), assistive drafting (Tier 2) |
| 4 | Scale the Business | The software should grow into new revenue channels alongside the company | Finance domain, Wholesale/Retail pipeline domain, People/onboarding domain, deeper automation, bounded AI agents (Tier 4) |
| 5 | ~~Platform~~ | **Removed.** Confirmed internal-only, permanently — no external-facing platform work is planned at any point. | — |

Each phase should run 2–4 months for a small team, not because of an artificial deadline, but because a phase that drags past that window usually means its scope crept beyond what actually delivers the phase's core bet.

---

## 20. Development Phases (Execution Detail)

Breaking Phase 1 down further, since it's the one that needs to be right — a shaky foundation here undermines everything after it:

**Phase 1a — Foundation (no user-facing features yet):** repo, auth provider setup, database schema for the core objects (Section 10), Shopify + Klaviyo integration connections with working webhook ingestion into the cached commerce/marketing tables, base design system tokens and primitive components (Section 15) — deliberately unglamorous, deliberately first, because everything built on a wrong foundation gets rebuilt.

**Phase 1b — Today View + Read Surfaces:** the briefing view (5.1), read-only Commerce and Marketing domain views (Orders, Products, Customers, Campaigns, Flows) rendering live synced data — this is the first moment the product feels real, and it should be usable by you personally before any second user is invited.

**Phase 1c — Docs & Knowledge, Projects & Tasks (native, write-heavy):** this is where the product starts doing things Shopify/Klaviyo can't, and where the "one object, one home" and cross-linking principles (Section 7–8) get tested for the first time in production use.

**Phase 1d — Command Palette + Polish Pass:** don't skip this even under time pressure — the command palette and the overall feel of speed are core to the vision (Section 1) and to the product principles (Section 7), and retrofitting them after the fact is dramatically harder than building them alongside the primitives.

**Exit criteria for Phase 1, concretely:** you, personally, open HM OS before Shopify or Klaviyo's own dashboards on a given morning, because it tells you more, faster. If that's not true after Phase 1 ships, that's the signal to stop and fix the core loop before adding Phase 2's multi-user complexity on top of it.

---

## Closing: Resolved and Remaining

**Resolved (folded into the sections above):**
- Team is founder + 1–3 collaborators today — the persona set in Section 4 reflects real current roles.
- HM OS is internal-only, permanently — Phase 5 (Platform) is removed from the roadmap, not conditional.
- QuickBooks/Xero (accounting) and Slack (comms) are already in use and are now confirmed integrations, not speculative ones. No helpdesk tool exists — Customer Cases is designed around manual intake for now.
- Budget/timeline isn't locked — the technical stack in Section 14 is the recommended default, but shouldn't be treated as final until there's a cost/timeline estimate to weigh it against.

**Also resolved:** accounting is QuickBooks (not Xero) and Google Workspace is the team's identity provider — Section 12 now specifies Google SSO as the default sign-in method rather than an optional add-on, and Section 18 no longer hedges between QuickBooks/Xero.

**Still open, and worth resolving before Phase 1 starts:**
- Whether a bookkeeper/accountant is a contractor who'd need a scoped Guest seat (Section 11), or whether finance stays entirely internal for now.

**Natural next deliverable:** a cost and timeline estimate for Phase 1 (Command Center), scoped against the stack in Section 14, so the "invest properly vs. move lean" decision can be made with real numbers rather than as a default. Say the word and I'll put that together next.
