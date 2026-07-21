# Heart Magic OS — CEO Dashboard
### v1.0 — The Today View, Fully Specified
Companion to: PRD v1.0 (Section 5.1, Core Philosophy #1), Screens & Flows v1.0 (Template E), AI Search v1.0, AI Strategists v1.0

---

## 0. This Already Exists — It Needed Filling In, Not Building

Before anything else: a "CEO Dashboard" as a second, separate screen would directly contradict a decision made in Sprint 1 and restated every sprint since — one opinionated Today view (Template E), not a dashboard someone configures. The good news is that's exactly what this request already describes. The PRD's original Today view example (Section 5.1) was: *"overnight orders and revenue vs. trailing average, any Klaviyo flow with an anomalous drop, any SKU that crossed a reorder threshold, open tasks due today, any customer escalation flagged high-priority."* That's four of your seven lines, worded slightly differently, from eight requests ago. The other three (top creative, reviews, experiments ending) are new because the collections they depend on — Meta Ads, Experiments, Customer Cases — didn't exist yet when the Today view was first specified. **This document doesn't create a new screen. It finishes specifying the one that already exists, now that the data it needs actually has a home.**

---

## 1. The Seven Lines, Mapped to Real Sources

| Line | Source | Status |
|---|---|---|
| Revenue yesterday | `commerce_orders` (Technical Architecture Section 2) | Schema exists; sync deferred twice now (Sprint 2 and Sprint 3 both prioritized content modules first) — see Backlog |
| Top-performing creative | Creative Library + Meta Ads, ranked by the `outcome` field just added (AI Search Section 3) | Needs real entries with logged outcomes — same gap AI Search and the Meta Strategist both already surfaced independently |
| Biggest drop in performance | Anomaly check against trailing baseline — literally the PRD's original "any flow with an anomalous drop" | Conceptually specified since Sprint 1; needs the scheduled comparison job (Section 3) |
| New customer reviews | Not yet a defined object — see gap below | **Real gap** |
| Inventory alerts | `commerce_inventory` + reorder threshold field (Sprint 2 ticket C2) | Schema/ticket exists; same sync dependency as revenue |
| Experiments ending this week | Experiments collection, `Test Record` entry type | Needs a `startDate`/`endDate` structured-field convention — one addition, same pattern as the `outcome` convention |
| Three AI-generated recommendations | New — Section 2 | Genuinely new, specified below |

**The reviews gap, stated plainly:** nothing in the architecture today ingests reviews. Your actual Amazon VOC tracker (found in Drive) proves this is currently a manual spreadsheet process, not a system. Two honest options, not solved here: mirror Shopify/Amazon reviews the same way `commerce_orders` mirrors orders (a real integration, real engineering work), or — cheaper, and enough to unblock this Today-view line — let reviews land as Customer Cases or Testimonial Theme entries (Customer Psychology) whenever someone manually logs one. Worth a real decision, not a default; flagged in the Backlog rather than picked for you.

---

## 2. The New Piece: Three AI-Generated Recommendations

This is the one line with no precedent, so it earns real design rather than a one-liner.

**Mechanism:** a scheduled job (same job-queue pattern used for sync and search indexing throughout) runs each morning, gathers the day's actual signals — the anomaly check's output, any Experiments ending this week, any Case pattern (three similar complaints, per the PRD's original escalation-pattern logic), any inventory alert — and makes **one** Tier 1 Claude call (PRD Section 16: ambient, no tool-calling, synthesis only) to rank the three most worth acting on today.

**The same grounding discipline as everywhere else in this build applies here too:** each recommendation must cite the specific signal that produced it — "Eternal Bloom Rose crossed its reorder threshold three days earlier than last cycle" is a recommendation; a generic "consider running a promotion" with nothing behind it is exactly the kind of ungrounded output this entire system has been built to avoid, and should never render. If a morning genuinely has fewer than three real signals worth surfacing, the honest behavior — consistent with AI Search's "say so rather than invent" rule — is to show fewer than three, not pad to three with filler.

---

## 3. Updated Today View

```
┌──────────────────────────────────────────────────────────────┐
│  Good morning, Jacob.                                          │
│                                                                  │
│  Revenue yesterday: $640 (12 orders) — in line with trailing    │
│  average → [View Orders]                                        │
│                                                                  │
│  Top performer: "Replace Coffee" Meta angle — marked winning     │
│  after last week's test → [View Entry]                          │
│                                                                  │
│  Biggest drop: Eternal Bloom Rose email flow open rate down     │
│  18% vs. trailing average → [View Flow]                         │
│                                                                  │
│  2 new reviews since yesterday → [View]                         │
│                                                                  │
│  Eternal Bloom Rose crossed its reorder threshold               │
│  → [View Inventory]                                              │
│                                                                  │
│  1 experiment ends Friday: Founder-video hook test              │
│  → [View Experiment]                                             │
│                                                                  │
│  Today's recommendations:                                        │
│   1. Reorder Eternal Bloom Rose stock — 3 days ahead of usual    │
│      pace [from Inventory]                                       │
│   2. Log a verdict on the Replace Coffee vs. Frictionless        │
│      Ritual angles — both are drafted, neither has a result      │
│      on file [from Meta Ads]                                     │
│   3. Founder-video experiment ends Friday with no Result &       │
│      Learning entry queued — assign someone before it lapses     │
│      [from Experiments]                                          │
└──────────────────────────────────────────────────────────────┘
```

Every line is still a live link into its source object, per the original Template E specification (Screens & Flows Section 2) — nothing about adding these three new lines changes that rule.

---

## 4. Small Schema Additions This Requires

Consistent with how every prior gap in this build has been handled — a convention within the existing generic schema, not a new table:

- `Test Record` entries (Experiments) need `startDate`/`endDate` in `structuredFields` — the same kind of addition as the `outcome` field AI Search introduced.
- The anomaly-check and recommendation jobs are new *workers*, not new schema — they read existing tables (`commerce_orders`, `marketing_flows`, `Entry`, `Case`) and write to `ActivityLog`/surface directly in the Today view render.
- Reviews remain an open decision (Section 1), not resolved by a schema addition here.

---

## Closing

Four of the seven lines were already specified; three needed collections that now exist; one (recommendations) needed real design and got it, held to the same "cite your source, don't pad with filler" standard as every other AI feature in this build. Nothing here is a second dashboard — it's the first one, finished.
