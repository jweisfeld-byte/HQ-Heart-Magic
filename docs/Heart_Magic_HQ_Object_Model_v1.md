# Heart Magic HQ — Object Model Confirmation
### v1.0 — Sprints 5–8, and the "Objects Not Pages" Reframe
Companion to: Content Modules Architecture, Knowledge Graph Architecture, Application Architecture

---

## 0. The Mindset Shift Is Already True — Here's the Receipt

"Don't build pages, build objects" isn't a new instruction to implement — it's the exact claim `Entry` + `ObjectRelation` were built to make true, since Sprint 2. Worth proving rather than just agreeing with, against every object named:

| Named object | Already exists as | Genuinely new work |
|---|---|---|
| Creator | Creator Knowledge → Creator Profile entry | Add Instagram, Email, Payments-status fields (Section 2) |
| Ads | Meta Ads → Ad Angle entry | None — see the Creative/Meta Ads split in Section 1 |
| Products | `commerce_products`, mirrored from Shopify (Technical Architecture §2) | None — mirrored records have been full participants in `ObjectRelation` since it was designed; this just hadn't been said this plainly before |
| Campaigns | A Project (native coordination, PRD §5.2) linked to a `marketing_campaigns` mirror record | None — this is the original founder-journey pattern from the very first architecture pass |
| Experiments | Experiments collection | Field consolidation — Section 1 |
| Customers (high level) | `commerce_customers`, mirrored | None |
| SOPs | SOPs collection | None |
| Documents | Every `Entry`, universally | This is the punchline, not a gap: "Documents" was never a category to model — it's the base type everything else already is |

Six of eight named objects require zero new work. The other two get real field-level attention below, because the field lists given for Creative Library and Experiments are good and worth adopting exactly, not just approximately.

---

## 1. Field-Level Adoption

**Creative Library gains a new entry type: Ad Creative** (distinct from the existing Logo/Font/Packaging types, which keep their simpler schema — a logo doesn't have a "hook" or an "audience"):

`Title · Creator (relation → Creator Knowledge) · Platform · Campaign (relation → Project) · Hook · Audience (relation → Customer Psychology persona) · Performance (view/CTR/conversion + outcome) · Google Drive Link (DriveFile reference, never copied — Technical Architecture §6) · Thumbnail · Status · Notes`

This resolves a real split worth naming: Meta Ads' `Ad Angle` entries are the *strategy* layer — a persuasion angle that can be reused across several actual produced videos. `Ad Creative` in Creative Library is the *execution* layer — one specific indexed Drive video with its own performance. An Ad Angle can relate to several Ad Creatives that tested it; that's a real distinction worth keeping, not collapsing into one mega-object.

**Experiments collapses from three entry types into one: Experiment** (previously `Hypothesis` / `Test Record` / `Result & Learning` as separate types — genuinely simpler, and correct, since one test *is* one object with a lifecycle, not three linked documents):

`Experiment (title) · Hypothesis · Platform · Start Date · End Date · Results · Learnings · Winner? (the same field as AI Search's `outcome` convention, renamed to match how you actually think about it) · Next Step`

This is a real improvement over what shipped in Sprint 3 — adopted as-is.

---

## 2. New Entry Types This Surfaces

- **Brand Knowledge → Competitor Reference.** "Competitors" came up in the Brand Bible example and doesn't map to anything that exists — a real gap, not an oversight to paper over.
- **Marketing → Funnel.** You already have real content for this (the "Replace Coffee" / "Frictionless Ritual" / "Come Back to Yourself" funnel docs found in Drive) — it just didn't have a home as its own entry type yet.
- **Marketing → Offer.** Discounts, bundles, promotional structures — currently would live only in Shopify once Commerce sync ships; a lightweight native Offer entry type lets marketing plan and reference an offer before or independent of it becoming a live Shopify discount code.

**Customer Avatar, clarified rather than duplicated:** this already exists as Customer Psychology's `Buyer Persona` entry type, with real content already seeded (the "Creative/Founder," "Coffee Burnout Customer," etc. personas from the Ambassador Talking Points doc). The Brand Bible page *showing* Customer Avatar content isn't a filing decision — it's a relationship. This is the clearest real test yet of "relationships, not folders" (Knowledge Graph Section 1): the persona is genuinely one thing, referenced from Brand Knowledge without being copied there.

---

## 3. Sprint 8 — Marketing Dashboard

Meta, Email, Advertorials are already the Marketing hub (Application Architecture Section 4). Funnels and Offers are the two new entry types from Section 2, both filed under Marketing. "Everything connected" is `ObjectRelation` — already built, nothing new required for the connection itself. The Marketing hub's `ModuleDashboard` strip (Application Architecture Section 3) is where "connected" becomes visible: a Funnel card can show its related Ad Creatives, its Email flow, and its Experiment result in one place, because they're graph-linked, not because the dashboard was rebuilt to know about all four at once.

---

## 4. Heart Magic HQ

This isn't new scope — it's the original PRD Vision (Section 1: *"the single operating surface where Heart Magic's business actually runs"*) reasserted after a few sprints that reasonably narrowed focus to prove out the knowledge and AI layers first. Strategy, Brand, Tasks, Creative, Assets, Knowledge, AI, Experiments, and Dashboards all already map to something built or scoped: Tasks is Projects & Tasks (PRD §8), Dashboards is the CEO Dashboard plus Module Dashboards, AI is AI Search plus the Strategists, and the rest are collections already defined. The prioritization test — "does this help the team execute better every day, or is it just another document" — is Product Principle #1 from the PRD, word for word in spirit: one object, one home, versus a page that only restates what's filed somewhere else.

One real decision, not a default: should the product actually be renamed "Heart Magic HQ" across every document going forward, or keep "Heart Magic OS" as the working name for now and treat "HQ" as the framing/positioning rather than a literal rename? Cheap to decide now, genuinely annoying to have half the documents say one name and half the other if it drifts.

---

## 5. Backlog Additions

| Item | Type | Note |
|---|---|---|
| Consolidate Experiments' three entry types into one `Experiment` type | Build | Section 1 — do before any real experiment data is entered, not after |
| Add `Ad Creative` entry type to Creative Library | Build | Section 1 |
| Add `Competitor Reference`, `Funnel`, `Offer` entry types | Build | Section 2 |
| Add Instagram/Email/Payments-status fields to Creator Profile | Build | Section 0 |
| Decide: rename to "Heart Magic HQ" everywhere, or keep "OS" as the working document name | Decision | Section 4 |
