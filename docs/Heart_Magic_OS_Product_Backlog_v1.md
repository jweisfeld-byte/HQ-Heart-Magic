# Heart Magic OS — Product Backlog
### v1.0 — Every Open Item, Consolidated
Status: **This is the backlog you just asked for — not a proposal to build one later**

---

## The Workflow, Confirmed

Agreed on all five points, and worth naming what's already been true in practice rather than treating this as a new constraint: every "Sprint N" request in this build has gotten a scoped spec before anything was called done, every deferred item has been named rather than silently dropped (Shopify/Klaviyo sync has now been pushed twice, and both times it's written down, not lost), and scope creep has been flagged rather than absorbed (the CEO Dashboard request could have become a second dashboard; it didn't). The one gap between what's been happening and what you're proposing: none of it has lived in one place a person could scan top to bottom. That's what this document is.

Going forward: every new feature gets a short PRD before code, sprints are 1–2 weeks with a definition of done stated up front (this build has been doing "definition of done," just not always as a single labeled line), and review happens with you and Bliss before the next sprint's scope gets locked. Mid-sprint additions go on this backlog, not into the current sprint, unless they're genuinely blocking.

---

## Open Items

### Decisions needed (not code — need your input before the related build item can start)

| # | Item | Source | Why it's blocking |
|---|---|---|---|
| D1 | Reviews ingestion approach — mirror Shopify/Amazon reviews as a real integration, or land them as manual Case/Testimonial entries for now | CEO Dashboard §1 | Blocks the "new customer reviews" Today-view line |
| D2 | Design System reconciliation — real brand pack (Deep Red `#810101` / Warm Gold `#D4A574` / Warm Cream `#F0E6D3`, Alice/Poppins/Josefin Sans) vs. the invented Sprint 1 palette (clay/Fraunces+Inter) already wired into the Tailwind config | Brand Knowledge Seed, closing note | Every UI ticket since Sprint 1 has been building on the wrong values |
| D3 | Bookkeeper/accountant access — real Guest seat in HM OS, or finance stays fully internal for now | PRD §Closing | Blocks Finance domain permission scoping (Phase 4) |
| D4 | "Community" as its own collection, or stays folded into Team/Creator Knowledge | AI Strategists §2 | Blocks Founder Coach's grounding scope being fully accurate |
| D5 | File storage: finish the R2 migration Sprint 1 shortcut assumed, or stay on Supabase Storage since it's already working | Technical Architecture §4 (Supabase revision note) | Low urgency, but drifting undecided |

### Build items (engineering, sprint-sized)

| # | Item | Source | Depends on |
|---|---|---|---|
| B1 | Shopify + Klaviyo webhook sync into `commerce_*`/`marketing_*` tables | Sprint 2 backlog, Epic A (deferred twice) | — |
| B2 | Today View wired to real data (revenue, inventory, anomaly check) | CEO Dashboard | B1 |
| B3 | Orders/Products read surfaces (Templates A/C) | Sprint 2 backlog, Epic D (deferred) | B1 |
| B4 | AI Search pipeline (classifier, retrieval, synthesis, Template H) | AI Search v1.0 | Sprint 3 collections populated with some real content |
| B5 | Transcription pipeline for video/audio content | AI Search §3, Query 2 gap | Creative Library has real video entries |
| B6 | AI Strategists framework (`Strategist`/`StrategistSession`/`StrategistTurn`, picker UI) | AI Strategists v1.0 | B4 |
| B7 | Daily AI-recommendations job (anomaly check + signal gathering + Tier 1 synthesis) | CEO Dashboard §2 | B1, B2 |
| B8 | Analytics: add Heatmap/Funnel Analysis entry type | AI Strategists §2 (CRO Strategist gap) | — |
| B9 | Experiments: add `startDate`/`endDate` convention to Test Record | CEO Dashboard §4 | — |

### Operational discipline (not a sprint ticket — a habit to start now, independent of any build)

| # | Item | Source |
|---|---|---|
| O1 | Log an `outcome` on every Ad Angle / Subject Line / Advertorial once a test concludes | AI Search §3, AI Strategists worked example — both surfaced this as the single highest-leverage gap in the whole system |
| O2 | Create a `Result & Learning` entry after any content shoot or test, not just the raw asset | AI Search §5, Query 1 |
| O3 | Populate Creator Knowledge with real per-person profiles as ambassador relationships are formalized | Creator Profile worked example |

---

## Suggested First Three Sprints

Two-week sprints, one clear objective each, review with you and Bliss at the end of each before the next is scoped — not planned further than three ahead, per "resist adding features mid-sprint" applying just as much to over-planning as to scope creep.

**Sprint 4:** D1, D2, D5 decided → B1 (commerce sync) started. Definition of done: Shopify orders visibly landing in `commerce_orders` within seconds of a real order.

**Sprint 5:** B2, B3, B9 → Today View and Orders/Products live on real data. Definition of done: the PRD's original exit criterion — you open HM OS before Shopify some morning because it already told you something.

**Sprint 6:** B4 (AI Search) → the four example queries from that spec re-run against real, by-then-more-populated data, not just what was found in Drive today. Definition of done: at least one of the two queries that surfaced a gap in the original test now returns a real answer instead of a gap report.

Everything else on this list — B5 through B9, O1 through O3 — gets pulled forward only when a sprint review surfaces it as the actual next-highest-leverage thing, not on a fixed schedule decided today.
