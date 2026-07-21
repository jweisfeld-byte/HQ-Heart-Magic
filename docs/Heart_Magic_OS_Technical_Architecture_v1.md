# Heart Magic OS — Technical Architecture Document
### v1.0 — Complete System Design
Companion to: Heart Magic OS PRD v1.0
Status: **Architecture spec — illustrative schema/code included for precision, not yet a running system**

---

## 0. Grounding & Design Constraints

Every decision below is anchored to what the PRD already confirmed, so this isn't a generic architecture — it's this company's architecture:

- Team: founder + 1–3 collaborators today, designed to scale to ~15–30 without a rewrite.
- Internal-only, permanently. This removes an entire category of "what if we sell this" hedging from every decision below — no public API versioning for third parties, no per-tenant billing infrastructure, no SOC 2 program forced on day one.
- Confirmed stack commitments from the PRD: Next.js/TypeScript, PostgreSQL, tRPC-first, Vercel hosting, Claude as the AI layer, pgvector for semantic search.
- Confirmed integrations: Shopify, Klaviyo, QuickBooks, Slack, Google Workspace (SSO) — plus **Google Drive**, newly scoped in this document.
- Governing principle carried over from the PRD and worth restating because it drives almost every choice below: **don't rebuild what already exists well, and never let a shortcut become permanent architecture.** A CTO optimizing for a multi-year asset with a tiny team makes different calls than one optimizing for a Series C startup with a 40-person platform team — fewer moving parts, more managed services, more defense-in-depth per moving part, because there's no large team to firefight incidents.
- **Sprint 1 shipped (revision note):** Next.js, Tailwind, Supabase, Authentication, Navigation, Dashboard Layout, Theme, Deployment, and GitHub are live. Supabase was chosen for both Postgres and Auth, superseding this document's original Neon + WorkOS split — Sections 4, 9, 10, 12, 13, and 15 below have been updated in place to reflect that, with the reasoning kept visible rather than silently rewritten, per this system's own "be honest about what changed and why" principle.

---

## 1. Folder Structure

**Decision: a single monorepo, managed with pnpm workspaces + Turborepo.**

```
heart-magic-os/
├── apps/
│   ├── web/                        # Next.js 15 app — the actual product surface
│   │   ├── app/
│   │   │   ├── (auth)/              # sign-in, SSO callback, invite acceptance
│   │   │   ├── (app)/               # authenticated shell
│   │   │   │   ├── home/            # Today view
│   │   │   │   ├── docs/
│   │   │   │   ├── projects/
│   │   │   │   ├── commerce/
│   │   │   │   ├── marketing/
│   │   │   │   ├── cases/
│   │   │   │   ├── finance/
│   │   │   │   ├── people/
│   │   │   │   └── settings/
│   │   │   └── api/
│   │   │       ├── trpc/[trpc]/     # single tRPC HTTP handler
│   │   │       └── webhooks/        # shopify/, klaviyo/, quickbooks/, drive/, slack/
│   │   ├── components/              # app-specific composed components
│   │   ├── middleware.ts            # auth + org-scoping gate, runs on every request
│   │   └── lib/                     # app-only helpers (non-shared)
│   └── workers/                     # long-running background jobs (NOT on Vercel's request lifecycle)
│       ├── sync/                    # shopify.ts, klaviyo.ts, quickbooks.ts, drive.ts — polling + webhook processors
│       ├── search/                  # indexing.ts — text extraction, embedding, upsert into search_index
│       ├── ai/                      # briefing.ts, pattern-detection.ts, bounded-agents/
│       └── notifications/           # digest emails, Slack pushes
├── packages/
│   ├── db/                          # Prisma schema, migrations, seed scripts — the ONE source of truth for data shape
│   ├── api/                         # tRPC routers + procedures, shared by web and workers
│   ├── ui/                          # design system: tokens, primitives, composed components (Section 15 of the PRD)
│   ├── integrations/                # one typed client per external system
│   │   ├── shopify/  klaviyo/  quickbooks/  google-drive/  slack/
│   ├── ai/                          # Claude client wrapper, prompt templates, agent/tool definitions, embedding client
│   ├── permissions/                 # RBAC logic — the single implementation used by both tRPC middleware and Postgres RLS generation
│   ├── config/                      # shared eslint, tsconfig, tailwind config
│   └── types/                       # shared Zod schemas / TS types generated from the Prisma schema
├── infra/                           # deployment configs, Terraform (optional — see Section 9)
├── .github/workflows/                # CI/CD (Section 12)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Why a monorepo, specifically:** the single biggest maintainability risk in a system this cross-functional is type drift — a `Task` shape defined once in the web app and re-guessed in a worker script is exactly how "the Slack notification says a different status than the UI" bugs happen. A monorepo with a shared `packages/db` and `packages/types` makes that class of bug structurally impossible: change the Prisma schema once, every consumer gets a type error at build time if it's now wrong. Turborepo's remote caching also keeps CI fast as the codebase grows, which matters because a small team can't absorb a 15-minute CI pipeline without it eating into actual product time.

**Why `apps/workers` is separate from `apps/web`:** Vercel serverless functions have hard execution time limits (10s on Hobby, up to 300s on Pro with configuration, but not designed for long-running or scheduled work). Shopify/Klaviyo sync, AI embedding generation, and agent jobs are exactly the workloads that don't belong on a request/response lifecycle. Separating them now — even though today's volume is small enough that it "would probably work" crammed into API routes — avoids a painful re-platforming the day a sync job legitimately needs 90 seconds.

**Why `packages/permissions` is its own package, not scattered logic:** access control is the one area where "explain it in three different places slightly differently" is a genuine security bug, not just a maintainability annoyance. One implementation, referenced everywhere it's enforced (Section 5, Section 11).

---

## 2. Database Schema

**Decision: PostgreSQL as the single relational store, Prisma as the schema/migration layer, `pgvector` and Postgres full-text search enabled as extensions — not separate systems.**

Illustrative core schema (trimmed for readability — real schema will have more columns/indexes):

```prisma
// packages/db/schema.prisma

model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  users     User[]
  documents Document[]
  // every tenant-scoped table below carries organizationId
}

model User {
  id             String   @id @default(cuid())
  organizationId String
  email          String   @unique
  name           String
  avatarUrl      String?
  roleAssignments RoleAssignment[]
  createdAt      DateTime @default(now())

  @@index([organizationId])
}

enum Role {
  OWNER
  ADMIN
  MANAGER
  CONTRIBUTOR
  VIEWER
  GUEST
}

model RoleAssignment {
  id        String @id @default(cuid())
  userId    String
  domain    String   // "finance" | "marketing" | "*" etc — domain-scoped, per PRD Section 11
  role      Role
  expiresAt DateTime?  // non-null for Guest/contractor access — enforces auto-expiry
  user      User   @relation(fields: [userId], references: [id])

  @@index([userId])
}

// SUPERSEDED (Sprint 2): Document/DocumentVersion below are generalized into
// Library / EntryType / Entry / EntryVersion — see Heart_Magic_OS_Content_Modules_v1.md
// Section 1. "Docs & Knowledge" becomes Knowledge Vault, one Library among four
// (Brand Bible, Marketing Playbook, Creative Library, Knowledge Vault) rather than
// a special-cased standalone domain. Kept here, struck through, so the reasoning
// for the change stays visible rather than silently rewritten.
model Document {
  id             String   @id @default(cuid())
  organizationId String
  docType        String   // "SOP" | "Formulation" | "Meeting" | "Generic"
  title          String
  blocks         Json     // flexible content, Notion-style
  ownerId        String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  versions       DocumentVersion[]
  driveLink      DriveFile?

  @@index([organizationId])
}

model DocumentVersion {
  id         String   @id @default(cuid())
  documentId String
  blocks     Json
  editedBy   String
  createdAt  DateTime @default(now())
  document   Document @relation(fields: [documentId], references: [id])

  @@index([documentId, createdAt])
}

model Project {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  status         String   // "planned" | "active" | "done" | "blocked"
  tasks          Task[]
}

model Task {
  id         String    @id @default(cuid())
  projectId  String?
  title      String
  status     String    // "todo" | "in_progress" | "done"
  priority   Int       @default(0)
  assigneeId String?
  dueAt      DateTime?
  createdAt  DateTime  @default(now())

  @@index([projectId])
  @@index([assigneeId, status])
}

model ObjectRelation {
  // the generic "everything can link to everything" mechanism from PRD Section 8
  id           String @id @default(cuid())
  fromType     String   // "task" | "document" | "case" | "commerce_order" ...
  fromId       String
  toType       String
  toId         String

  @@index([fromType, fromId])
  @@index([toType, toId])
}

model IntegrationConnection {
  id             String   @id @default(cuid())
  organizationId String
  provider       String   // "shopify" | "klaviyo" | "quickbooks" | "google_drive" | "slack"
  encryptedTokens Bytes   // encrypted at the application layer before storage — see Section 10
  syncCursor     String?
  status         String   // "healthy" | "degraded" | "failed"
  lastSyncedAt   DateTime?
}

// Cached mirrors — never authoritative (PRD Section 10 hard rule)
model CommerceOrder {
  id             String   @id @default(cuid())
  organizationId String
  sourceSystem   String   @default("shopify")
  sourceId       String
  customerRef    String
  totalCents     Int
  status         String
  syncedAt       DateTime

  @@unique([sourceSystem, sourceId])
  @@index([organizationId, syncedAt])
}

model Case {
  id             String   @id @default(cuid())
  organizationId String
  title          String
  status         String   // "open" | "resolved"
  customerRef    String?
  createdAt      DateTime @default(now())
}

model ActivityLog {
  id         String   @id @default(cuid())
  organizationId String
  actorId    String
  action     String
  objectType String
  objectId   String
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([organizationId, createdAt])
  @@index([objectType, objectId])
}

model SearchIndex {
  id         String @id @default(cuid())
  objectType String
  objectId   String
  content    String                       // raw extracted text
  // tsvector column added via raw SQL migration (Prisma doesn't model tsvector natively)
  // embedding vector(1024) added via raw SQL migration (pgvector)
  updatedAt  DateTime @updatedAt

  @@unique([objectType, objectId])
}

model DriveFile {
  id            String   @id @default(cuid())
  documentId    String?  @unique
  driveFileId   String   @unique
  webViewLink   String
  mimeType      String
  lastModified  DateTime
  contentSynced DateTime?   // last time we pulled text for indexing
  document      Document? @relation(fields: [documentId], references: [id])
}
```

Raw-SQL migration additions Prisma can't express natively:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "SearchIndex" ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
ALTER TABLE "SearchIndex" ADD COLUMN embedding vector(1024);
CREATE INDEX search_tsv_idx ON "SearchIndex" USING GIN (tsv);
CREATE INDEX search_embedding_idx ON "SearchIndex" USING ivfflat (embedding vector_cosine_ops);
```

**Why Prisma over a raw query builder:** migration history as version-controlled, reviewable files (Section 11) is the single highest-leverage maintainability decision in the whole data layer — every schema change is a diffable PR, every environment can be brought to an exact known state, and a new engineer can read `schema.prisma` as the ground truth rather than reverse-engineering the database. The cost (occasional raw SQL for Postgres-specific features like `tsvector`/`pgvector`, shown above) is small and contained.

**Why cached commerce/marketing tables instead of querying Shopify/Klaviyo live on every request:** latency and reliability. A Today-view page load that fans out to three external APIs synchronously is slow and fragile — if Klaviyo has a bad five minutes, HM OS shouldn't go down with it. Webhook-driven caching (Section 6 of the PRD) means the app only ever talks to Postgres on the request path; external APIs are only touched by background workers.

**Why `ObjectRelation` as a generic join table instead of a foreign key per relationship type:** the PRD's core philosophy commits to "any object can link to any object" (launch projects referencing docs, orders, and tasks together). Modeling every possible pairwise relationship as its own foreign key would mean a schema migration every time someone wants a new kind of cross-link. One generic, indexed relation table trades a small amount of query verbosity for a large amount of long-term schema stability.

---

## 3. API Architecture

**Decision: tRPC as the primary internal API layer; plain Next.js Route Handlers reserved exclusively for webhooks.**

```
packages/api/
├── routers/
│   ├── documents.ts
│   ├── tasks.ts
│   ├── commerce.ts      # read-only procedures over cached Shopify data
│   ├── marketing.ts
│   ├── cases.ts
│   ├── finance.ts
│   └── search.ts
├── middleware/
│   ├── auth.ts           # attaches session + org context
│   ├── permissions.ts    # enforces RoleAssignment checks per procedure
│   └── rateLimiter.ts
└── root.ts               # merges all routers into one AppRouter type
```

Every procedure passes through a fixed middleware chain: **authenticate → resolve organization context → check domain/role permission → validate input (Zod) → execute → log to `ActivityLog` if it's a mutation.** This order is enforced structurally (each middleware wraps the next), not left to individual route authors to remember — the same "don't rely on every engineer getting it right every time" principle that motivates Postgres RLS in Section 10.

**Why tRPC over REST or GraphQL:** the entire client is a single Next.js/TypeScript codebase talking to a single backend it controls — there is no third-party consumer of this API, ever (confirmed internal-only). In that situation, tRPC's end-to-end type inference (the frontend gets compile-time errors if it calls a procedure with the wrong shape) eliminates an entire category of integration bugs that REST or GraphQL would need a schema-generation step to catch. GraphQL's real advantage — a stable, discoverable contract for external or mobile-team consumers — doesn't apply here; adopting it now would be paying its complexity tax for a benefit nobody needs yet. If a genuinely separate client (a native mobile app) ever gets built, a thin GraphQL or REST facade can be layered in front of the same routers at that point without a rewrite.

**Why webhooks are plain Route Handlers, not tRPC procedures:** webhooks are unauthenticated-by-session (they authenticate via signature verification instead), don't originate from the app's own client, and need to return specific status codes/timing behavior each provider expects. Forcing them through tRPC's request model would fight the framework for no benefit.

**Internal versioning, not public API versioning:** because there are no external consumers, there's no need for `/v1/`, `/v2/` API versioning discipline. The only versioning concern is that `packages/api` and `apps/web` deploy together (monorepo, same release) — so the router and its caller are always in lockstep by construction, sidestepping the entire "API contract versioning" problem that only exists when clients and servers deploy independently.

---

## 4. Authentication

**Confirmed (Sprint 1, supersedes the original WorkOS recommendation): Supabase Auth, with Google OAuth as the sole sign-in method.**

Flow: user clicks "Continue with Google" → Supabase Auth handles the OAuth handshake with Google → Supabase issues a session (JWT, stored as an HttpOnly, Secure, SameSite=Lax cookie, refreshed via Supabase's client SDK) → `middleware.ts` on every request verifies the session via `supabase.auth.getUser()` and attaches `{ userId, organizationId }` to the request context consumed by the tRPC middleware chain in Section 3.

- **Why this supersedes WorkOS:** the original recommendation optimized for a clean upgrade path to enterprise SSO/SAML, on the theory that it was cheap optionality worth keeping. With HM OS confirmed internal-only, permanently, that optionality is worth less than it looked on paper — and Supabase Auth buys something more valuable for this specific system: `auth.uid()` is a native input to Postgres Row-Level Security policies (Section 10), which means the database's own permission enforcement is written in terms of the same identity the auth layer issues, with no translation step in between. That's a tighter, simpler security model than a separate auth provider's JWT being independently mapped to RLS policies by application code.
- **Why this doesn't cost the SSO optionality as much as it seems to:** Supabase Auth still supports SAML SSO as an add-on if it's ever genuinely needed later; it's just not the primary reason for the choice anymore.
- **Why Google-only, no email/password:** unchanged from the original reasoning — the team already lives in Google Workspace, and a password option adds a second, weaker security surface for no benefit to a team that already has Google accounts.
- **Session lifetime and 2FA:** sessions refresh silently while active and expire after inactivity; Owner/Admin roles require Google's own 2FA to be enabled on their Workspace account, checked at sign-in, rather than HM OS building a redundant second 2FA system.
- **Consolidation this also enables:** since Supabase also offers Storage, it's worth revisiting Section 8 (File Management) once Sprint 2's read surfaces are live — R2 remains the right call for egress-fee reasons at scale, but Supabase Storage is a reasonable v1 shortcut for early file uploads if it means one fewer integration to wire up before there's real file volume to justify optimizing for.

---

## 5. AI Architecture

**Decision: Claude (Anthropic API) as the sole reasoning engine, called exclusively from `apps/workers` and a narrow set of server-side tRPC procedures — never directly from the browser.**

```
packages/ai/
├── client.ts              # single Anthropic SDK instance, model config, retry/backoff
├── prompts/                # versioned prompt templates per job (briefing, case-pattern, drafting)
├── embeddings.ts           # Voyage AI client (Anthropic's recommended embedding partner — Claude itself has no embeddings endpoint)
├── agents/
│   ├── inventory-watch.ts  # Tier 4 bounded agent — PRD Section 16
│   └── weekly-digest.ts
└── guardrails.ts           # tool allowlists, spend caps, output validation
```

Implementation follows the PRD's four-tier sequencing exactly, because the architecture for each tier is genuinely different:

- **Tier 1 (ambient briefings):** a scheduled worker job reads structured data (orders, tasks, cases) via Prisma, assembles it into a compact context payload, and calls Claude once per user per morning to render it as natural-language prose. No tool-calling, no write access — purely a formatting/summarization call, which keeps cost and risk low for the highest-frequency AI usage in the system.
- **Tier 2 (assistive drafting):** synchronous calls from a tRPC procedure (e.g., "draft a case response") triggered by explicit user action, output always written to a draft field the human must approve/edit before it's saved as real content — enforced at the schema level (a `Case.draftResponse` field is separate from `Case.sentResponse`), not just a UI convention.
- **Tier 3 (command-palette copilot):** a tRPC procedure that first queries `SearchIndex` (Section 7) for relevant context via hybrid search, then passes only that retrieved context to Claude — retrieval-augmented, not "hope the model remembers the business." This keeps answers grounded and keeps token costs bounded regardless of how much data HM OS eventually holds.
- **Tier 4 (bounded agents):** each agent is a narrow worker script with an explicit, hard-coded tool allowlist (e.g., `inventory-watch` can only call `createTask`, never `updateInventory`) enforced in `guardrails.ts` at the code level, not just via prompt instructions — the same defense-in-depth principle as Postgres RLS backing up app-level permission checks. Every agent action writes to `ActivityLog` with `actorId = "agent:inventory-watch"`, so agent behavior is exactly as auditable as human behavior.

**Why Voyage AI for embeddings specifically:** Anthropic's own guidance recommends Voyage as its embeddings partner since Claude doesn't expose an embeddings endpoint; using it keeps the AI stack coherent (one vendor relationship, one likely-optimized integration path) rather than introducing a second unrelated AI vendor (e.g., OpenAI) purely for embeddings.

**Cost control as an architectural concern, not an afterthought:** prompt caching (Anthropic's native feature) is used for the largely-static portions of every prompt (system instructions, schema descriptions), so repeated calls of the same type don't re-pay for the same tokens. Every AI call is logged with token counts to `ActivityLog`, making cost attribution per feature (briefing vs. drafting vs. copilot) a query, not a guess — essential for keeping the cost estimate in Section 16 honest as usage grows.

---

## 6. Google Drive Integration

**Decision: Drive is a linked source, not an absorbed one — HM OS references and indexes Drive files, it does not become a second copy of Google Drive.**

This is a direct application of the PRD's "one object, one home" principle under new information: the team already keeps real working documents (spreadsheets, supplier contracts, legal paperwork) in Google Drive, and migrating all of it into HM OS's native `Document` model on day one would be both enormous busywork and a regression — some of that content (a shared budget spreadsheet with live formulas) is genuinely better left in Drive's native tools.

**Mechanism:**
1. Google Drive OAuth scope is requested as an *additional* consent during the same Google sign-in already used for authentication (Section 4) — one Google relationship, two scopes, not a second integration to separately connect.
2. A user links a specific Drive file or folder to an HM OS `Document`, `Project`, or `Case` via the Drive Picker UI (Google's own embeddable file picker — not a custom-built Drive browser, which would be reinventing something Google already ships for free).
3. HM OS stores only a reference (`DriveFile.driveFileId`, `webViewLink`) plus periodically-refreshed extracted text for search purposes (via Drive's `files.export` for Docs/Sheets) — never a permanent binary copy, avoiding the sync-conflict problem of two systems each thinking they hold the canonical version.
4. Google Drive push notifications (the `watch` channel API) trigger a background re-index job when a linked file changes, rather than polling every file on a schedule — efficient and near-real-time, consistent with the PRD's "the system should be honest about staleness" principle (a linked Drive file's indexed content shows a "last synced" timestamp exactly like commerce data does).

**Why not build a Drive clone or attempt full two-way sync:** two-way sync of arbitrary file types (especially Sheets with live formulas, or Docs with comments/suggestions) is a genuinely hard, bug-prone engineering problem that companies with dedicated platform teams struggle with. For a small team, the 80% value — "find and reference the Drive file from inside HM OS, and have its content show up in search" — is achievable safely; the last 20% (edit a Doc from within HM OS) is not worth the risk of silent data loss.

---

## 7. Search Indexing

**Decision: hybrid lexical + semantic search over a single `SearchIndex` table, built incrementally via event-driven background jobs — exactly as scoped in PRD Section 17, now made concrete.**

Pipeline:

```
object created/updated (Document, Task, Case, DriveFile content refresh)
        │
        ▼
enqueue indexJob({ objectType, objectId })      # apps/workers/search
        │
        ▼
extract plain text  →  upsert SearchIndex.content
        │
        ├──▶ tsvector generated automatically (Postgres GENERATED column, Section 2)
        │
        └──▶ call Voyage AI embeddings API  →  store in SearchIndex.embedding
```

Query-time, a search request runs both a `tsvector @@ query` lexical match and a `pgvector` cosine-similarity match, merges the two ranked lists (lexical matches weighted higher by default, per the PRD's rationale that an exact SKU/order-number search should never lose to a fuzzy semantic near-miss), and returns a single ranked list.

**Why one Postgres extension-based system instead of a dedicated search service (Elasticsearch/Algolia):** at this data volume (a small team's internal objects — thousands to low tens-of-thousands of rows, not billions), Postgres with proper indexes comfortably handles both lexical and semantic search with sub-100ms latency, and keeping search inside the primary database avoids running, paying for, and keeping in sync an entirely separate search cluster — one less system that can silently drift out of sync with the source of truth. This is the same "don't add infrastructure the current scale doesn't require" discipline as the low-code rejection in the PRD, applied to search specifically. Revisit only if object count grows two to three orders of magnitude beyond what a founder-led wellness brand plausibly generates.

**Command-palette speed (`Cmd+K`) is handled separately from deep search:** a lightweight, locally-cached subset (recent + pinned + role-relevant objects, refreshed on session start and via a lightweight polling/websocket channel) serves the instant-feel palette, so the sub-100ms requirement never depends on a full-index query round trip.

---

## 8. File Management

**Decision: Cloudflare R2 for natively-uploaded files (images, PDFs, attachments); Google Drive references (Section 6) for externally-authored documents. No file type is ever stored in two places.**

- **Upload path:** client requests a signed upload URL from a tRPC procedure (which checks permissions first) → uploads directly to R2 from the browser (never proxied through the app server, keeping upload bandwidth off the Vercel function budget) → on completion, a webhook/callback records the file's metadata in Postgres and enqueues a virus/malware scan job before the file is marked available.
- **Access control:** every file read goes through a short-lived signed URL generated per-request, checked against the same permission middleware as every other resource (Section 3) — there is no "public bucket" shortcut, even for internal convenience, because a leaked signed-URL link should expire in minutes, not live forever.
- **Why R2 over S3:** functionally equivalent (S3-compatible API), but R2 has no egress fees — relevant because a system that surfaces images and documents constantly (product photos, formulation PDFs) will generate meaningful read traffic, and egress fees are a classic "small line item that becomes a real cost surprise at scale" trap worth avoiding by default.
- **Thumbnailing/previews:** generated asynchronously by a worker job on upload, never on the request path — a user should never wait on image processing to see their upload succeed.

---

## 9. Deployment

**Confirmed (Sprint 1): Vercel for the web app, GitHub connected for CI/CD triggers, Supabase for Postgres — supersedes the original Neon recommendation. A managed always-on worker host (Railway or Fly.io) for `apps/workers` remains the plan for Sprint 2, once background sync jobs exist to run.**

Environments: **local → preview (automatic, per pull request) → production.** No separate long-lived "staging" environment is maintained — for a team this size, an ever-growing set of preview environments (one per PR, auto-torn-down on merge) gives the same safety property (test before production) without the maintenance burden and drift risk of a permanent staging environment that inevitably diverges from production over time.

- **Why Vercel for the app tier:** unchanged — it is the reference deployment target for Next.js, meaning framework features (Server Components, streaming, edge middleware) work correctly with zero platform-specific tuning.
- **Why Supabase over Neon for Postgres, now that both are on the table:** Neon's specific advantage — cheap, full database branching per pull request — is real, but Supabase's bundling of Postgres, Auth, and Storage under one project and one dashboard is worth more to a team this size than that specific branching workflow is, especially now that Auth (Section 4) is already tied to it. Supabase does support branching (as a paid add-on) if per-PR database previews become worth paying for once the CI/CD pipeline in Section 12 is live — not a capability that's been given up, just not the default reason for the choice anymore.
- **Why a separate host for workers, not Vercel Functions, once they exist:** as established in Section 1, sync jobs and AI agent runs are long-running by nature and don't fit Vercel's request-response execution model well even with its background function options. Railway/Fly.io remain the plan for Sprint 2 — simple, low-ops always-on containers, not a Kubernetes cluster, which would be over-engineering for this workload for years to come.
- **Secrets management:** environment variables managed through Vercel's and Supabase's built-in encrypted secret stores, never committed to the repo, injected at build/runtime only.

---

## 10. Security

Security for a small, internal, but commerce-and-customer-data-holding system, layered so no single mistake is catastrophic:

- **Encryption in transit:** TLS enforced everywhere (Vercel/Supabase/R2 all default to this), HSTS enabled at the app level.
- **Encryption at rest:** Supabase encrypts the database at rest by default; integration OAuth tokens (Shopify, Klaviyo, QuickBooks, Drive, Slack) are additionally encrypted at the application layer before being written to `IntegrationConnection.encryptedTokens` (Section 2) — so even a full database dump doesn't hand over live access to every connected system, only to the app's own encryption key, which is managed separately.
- **Defense in depth on permissions:** app-layer checks in the tRPC middleware chain (Section 3) are the primary gate, but Postgres Row-Level Security policies scoped to `organization_id`, written directly against `auth.uid()` (Section 4), are enabled as a second, independent layer — meaning even a bug that skips the app-layer check (a missed `where` clause, a copy-pasted query) cannot leak data across organizational boundaries, because the database itself refuses the query. This single-tenant-today system is architected as if it will never be safe to assume "there's only one org anyway" — good discipline regardless, and free insurance if a second entity is ever added. Since Supabase Auth's identity is native to Postgres here, these policies can be written and tested directly in Supabase's SQL editor before any application code exists — worth doing as one of the first things in Sprint 2, not deferred to "later."
- **Least-privilege integration scopes:** each OAuth connection (Shopify, Klaviyo, QuickBooks, Drive) requests only the specific API scopes each feature needs, never a blanket "full access" grant, reviewed whenever a new feature needs a new scope.
- **Dependency and vulnerability scanning:** GitHub Dependabot enabled on the monorepo, auto-opening PRs for vulnerable dependencies — zero-maintenance-cost security hygiene appropriate for a team without a dedicated security function.
- **Audit logging as a security control, not just a feature:** `ActivityLog` (Section 2) is append-only at the database permission level — the application's own database role has no `UPDATE`/`DELETE` grant on that table, so even a compromised application cannot cover its tracks by editing history.
- **Backups and recovery:** Supabase's point-in-time recovery covers the primary failure mode (accidental bad migration or bad data write); R2 versioning is enabled on the file bucket as a second safety net against accidental deletion.
- **Incident response baseline:** even at this team size, a one-page runbook (who gets paged, how to rotate a leaked credential, how to roll back a bad deploy) should exist before launch — not because an incident is likely, but because writing it under actual pressure is dramatically worse than writing it calmly now.

---

## 11. Versioning

Three distinct versioning concerns, each solved differently because they're genuinely different problems:

- **Content versioning (product feature):** every `Document` edit writes an immutable `DocumentVersion` row (Section 2) rather than overwriting in place — this directly serves the PRD's trust principle (nothing silently disappears) and enables diff/undo UI later without a schema change.
- **Database schema versioning:** Prisma Migrate's migration files are the single source of truth, committed to the repo, one migration per PR, applied automatically to preview branches and explicitly (never silently) to production as a gated CI/CD step (Section 12) — this is what makes "what does production's schema actually look like" always answerable by reading git history rather than inspecting a live database and hoping.
- **Release versioning:** the monorepo is tagged with semantic version numbers on every production deploy, with a changelog auto-generated from conventional-commit-formatted PR titles — lightweight enough not to burden a small team, but enough to answer "what changed between last Tuesday and today" without archaeology through commit history.

---

## 12. CI/CD

**Decision: GitHub Actions, gated on a fixed pipeline that never allows an unreviewed migration or a failing test suite to reach production.**

```
On every pull request:
  1. Install (cached via Turborepo remote cache)
  2. Typecheck + lint (fails fast, cheapest checks first)
  3. Unit tests (packages/api, packages/permissions — the highest-risk logic)
  4. Prisma migration diff check (flags destructive changes for explicit human review)
  5. Deploy preview (Vercel app + isolated Supabase project/branch)
  6. Playwright smoke tests against the preview URL (core flows: sign-in, create task, search)

On merge to main:
  1. All of the above, plus:
  2. Apply database migration to production (explicit step, never combined silently with app deploy)
  3. Deploy to production
  4. Tag release, generate changelog
```

**Why gate migrations separately from app deploys, rather than "just run migrate deploy automatically":** the single most common way small teams take down production is an automatic migration that locks a table or drops a column a still-deploying old version of the app is actively querying. An explicit, visible migration step — reviewed in the PR diff (step 4 above) before it ever runs — costs almost nothing in a fast-moving small team and prevents the single most damaging class of self-inflicted outage.

**Why Playwright smoke tests specifically, not a large E2E suite:** a small team maintaining an enormous E2E suite spends more time fixing flaky tests than shipping — a tight set of tests covering only the core loops (sign-in, create/edit core objects, search) catches the failures that would actually be embarrassing (the app is broken) without becoming its own maintenance burden.

---

## 13. Future Scalability

Concrete triggers for each scaling decision, so infrastructure is added when there's evidence it's needed, not preemptively:

- **Connection pooling before read replicas:** Supabase's built-in pooler (Supavisor) handles the connection-count growth of more users/workers well past this team's realistic scale; a read replica (available as a Supabase add-on) only becomes worth the added complexity if analytics-style queries (e.g., a heavy Finance rollup) start visibly contending with transactional traffic — a specific, observable trigger, not a guess.
- **Redis/Upstash caching layer:** deferred until the Today view's aggregate queries (Section 5.1 of the PRD) show up as a real latency cost under load — likely somewhere past 15–20 concurrent daily users, well beyond current scale. Added as a thin cache in front of specific expensive queries, not as a blanket cache-everything layer, to avoid the cache-invalidation complexity tax before it's earned.
- **Background job scaling:** Trigger.dev/Railway's worker concurrency scales via configuration, not a re-architecture — this was chosen specifically in Section 1/9 so this axis of growth is "turn a dial," not "redesign a system."
- **Explicitly rejected pre-emptively:** database sharding, multi-region active-active deployment, and a dedicated search cluster (Section 7). Each solves a scale problem (data volume in the billions of rows, global latency for a globally-distributed user base, search index size in the tens of millions) that a founder-led wellness brand's internal ops tool will not plausibly hit within the multi-year horizon this PRD plans for. Building for that scale now would be optimizing for a hypothetical at the direct expense of shipping speed today — the same discipline that ruled out a plugin framework and a low-code platform earlier in the PRD.

---

## 14. Performance Strategy

Performance is treated as a functional requirement (per the PRD's Core Philosophy #4 — "speed is a feature with veto power"), enforced at several layers:

- **Server Components + streaming** for the Today view and other data-heavy pages — the page shell renders instantly while data-dependent sections stream in, rather than blocking the whole page on the slowest query.
- **Edge caching for read-heavy, low-volatility views:** cached commerce/marketing mirror pages (Section 2) can be served from Vercel's edge cache with short TTLs plus on-write invalidation, since they're reads of already-cached data — a cache of a cache, deliberately, because the underlying sync jobs are the actual source of truth freshness, not the page render.
- **Optimistic UI for mutations:** task status changes, case updates, and similar frequent actions update the UI immediately and reconcile with the server in the background — this is the specific mechanic that makes an app "feel like Linear" rather than "feel like a form that submits."
- **N+1 query avoidance enforced structurally:** Prisma's `include`/`select` patterns are used deliberately per query, and a CI lint rule flags any resolver making per-row database calls in a loop — a class of bug that's cheap to prevent early and expensive to hunt down later at scale.
- **Everything slow moves to a background job:** any operation over roughly 200ms (AI calls, embedding generation, third-party sync, file processing) is enqueued rather than awaited inline — this is the same principle from Section 1 applied at the request-handling level, not just the deployment-topology level.
- **Bundle budget enforced in CI:** a hard ceiling on client-side JavaScript bundle size, checked automatically, because the "feels fast" goal is as much about the browser as the server, and bundle bloat is a silent, gradual failure mode that's much cheaper to prevent than to later reverse.

---

## 15. Cost Estimates

Two notes before the numbers: first, this is **infrastructure run-rate cost**, distinct from the build/labor cost estimate offered earlier and still outstanding if wanted. Second, every figure below is a reasonable planning estimate, not a quote — actual usage (especially AI token volume) will move these, and the architecture above (Section 5, 10) is specifically designed so real usage is measurable from day one rather than guessed at forever.

| Category | Service | Today (1–4 users) | Year 2 (10–15 users, heavier data/AI use) | Why this line exists |
|---|---|---|---|---|
| App hosting | Vercel (Pro) | ~$20/mo | ~$20–150/mo | Scales mostly with team seats, not usage, at this size |
| Worker hosting | Railway or Fly.io | ~$10–20/mo | ~$50–100/mo | Scales with sync frequency + AI agent job volume |
| Database + Auth | Supabase (Pro) | ~$25/mo | ~$25–100/mo | One project covers Postgres, Auth, and Storage — scales with data volume + add-ons (branching, read replica) if/when earned |
| AI — reasoning | Anthropic (Claude API) | ~$50–100/mo | ~$200–500/mo | Directly tied to Tier 1–4 AI usage (Section 5); the single most usage-sensitive line item |
| AI — embeddings | Voyage AI | ~$5–15/mo | ~$20–50/mo | Scales with document/case volume being indexed |
| File storage | Cloudflare R2 | ~$5–15/mo | ~$20–50/mo | No egress fees keeps this line predictable as usage grows |
| Transactional email | Resend | $0 (free tier) | ~$20/mo | Only system emails — Klaviyo remains the customer-facing sender |
| Error tracking | Sentry | $0–26/mo | ~$26–80/mo | Team-plan pricing tiers by event volume |
| Product analytics | PostHog | $0 (generous free tier) | ~$0–50/mo | Usage-based, unlikely to be a real cost driver at this scale |
| Slack, Google Workspace, Shopify, Klaviyo, QuickBooks | — | $0 additional | $0 additional | Already-paid tools being integrated against, not new spend |
| **Total (estimate)** | | **~$100–190/mo** | **~$400–1,000/mo** | |

**Why this is the right way to read these numbers:** the Year 2 range is wide on purpose — the dominant variable is AI usage (Tier 3/4 adoption specifically), which is also the most valuable and most controllable line item (prompt caching and retrieval-scoping in Section 5 directly bound it). Every other line scales gently and predictably with team size, which is the intended outcome of choosing managed, usage-billed services over fixed-cost infrastructure at this stage — the business pays roughly in proportion to how much value it's extracting, which is the right shape of cost curve for a multi-year bet with an uncertain growth trajectory.

---

## Closing

This architecture assumes the confirmed facts from the PRD hold: team stays small-but-real (1–15ish people) over the horizon this covers, the system stays internal-only, and the existing tool stack (Shopify, Klaviyo, QuickBooks, Slack, Google Workspace) stays in place as the systems of record this OS orchestrates rather than replaces. If any of those change materially — a much larger hiring plan, a decision to swap Klaviyo for something else, a move off Google Workspace — the sections most affected would be Section 4 (auth), Section 6 (Drive), and Section 18 of the PRD (integrations), not the core data/API/AI architecture, which is intentionally decoupled from any single integration's presence.

Natural next step, if useful: the build cost/timeline estimate for Phase 1 that's still outstanding from the PRD, now scoped against this concrete architecture rather than a general stack description.
