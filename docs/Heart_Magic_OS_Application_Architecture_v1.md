# Heart Magic OS — Application Architecture
### v1.0 — From Documentation to Software
Consolidates: PRD, Technical Architecture, Screens & Flows, Design System, Content Modules Architecture, Knowledge Graph Architecture, AI Search, AI Strategists, CEO Dashboard, Product Backlog
Status: **The complete proposal, before any code — this is the document the brief asked for**

---

## 0. The Reframe, and What Doesn't Change

A page describes something. Software *does* something: it holds state, remembers history, takes action, and gets more useful the longer it's used. That's the actual distinction Notion, Linear, and HubSpot's founders built around, and it's the right one to hold here. The documents produced across Sprints 1–3 were never meant to be the product — they were always meant to be exactly what this instruction calls them: source material. Nothing built in them gets thrown away in this transition. What changes is the posture: every one of those documents now gets read as a spec for a running application, not as a wiki page describing an idea.

**The reassuring part, and the actual payoff of three sprints of discipline:** almost everything a modern SaaS application needs was already designed generically, specifically so this moment wouldn't require redesigning anything. What follows is mostly a map showing that, plus the small number of things that are genuinely new.

---

## 1. The Module Pattern — One Engine, Fifteen Applications

Every example given — Brand Bible, Meta Ads, UGC, Experiments, Advertorials, Email — is not a separate application. Each is the same **Module**: a `Library` (Content Modules Architecture Section 1) rendered through the same Templates (Screens & Flows Sections 2–3), searched through the same index (Technical Architecture Section 7), connected through the same graph (Knowledge Graph Section 4), and assisted by the same AI pipeline (AI Search Section 1, AI Strategists Section 0). Building "a creative management system for Meta Ads" and "an experiment tracking system for Experiments" is not six engineering projects — it's one engine and fifteen configurations, exactly the claim made since Sprint 2 and now the thing actually being built on.

This is the same principle Linear applies to make Issues, Projects, and Cycles all feel like one coherent product instead of six bolted-together tools — a small number of real, well-modeled objects, with variety coming from configuration and data, not from parallel one-off implementations.

---

## 2. The Ten Required Capabilities, Mapped

Stated per the brief, checked against what already has a full specification:

| Capability | Already specified in | Status |
|---|---|---|
| List View | Screens & Flows, Template A | Done — filterable by Entry Type and Tag |
| Detail View | Screens & Flows, Template B (native, panel) / Template C (mirrored, page) | Done |
| Search | Technical Architecture §7, hybrid tsvector + pgvector | Done |
| Filters | Template A's filter bar + Tag/EntryTag | Done |
| Tags | Content Modules §1, `Tag`/`EntryTag` | Done |
| Relationships | Knowledge Graph §4, typed `ObjectRelation` + Connections panel | Done |
| AI Assistant | AI Search §1 (general) + AI Strategists (named specialists) | Done, scoped per module below |
| Edit Mode | Content Modules §7, block editor + structured-field form | Done |
| History | Content Modules §1, `EntryVersion` | Done |
| **Dashboard** | — | **New — Section 3** |

Nine of ten capabilities requested were already fully designed before this instruction was given. The one gap — a per-module dashboard, distinct from the org-wide CEO Dashboard — is real and gets designed properly below, not hand-waved.

---

## 3. What's Genuinely New: Per-Module Dashboards

**Not a second instance of the rejected "configurable widget dashboard" pattern** (PRD Section 15, Screens & Flows Section 0) — that rejection was about a user-configurable grid with nothing in it by default. A per-module dashboard is the opposite: a small, fixed, engineer-defined summary strip at the top of each Module's List View, specific to what that collection actually tracks. This is the same discipline as a Linear project's header stats (issue count by status, cycle progress) — informative, non-configurable, and different per object type on purpose.

Concretely, a `ModuleDashboard` component renders 2–4 stat widgets chosen per Library, drawn from a small fixed widget vocabulary (count-by-status, most-recently-updated, top-by-outcome, upcoming-deadline) — not a new per-widget system, a config array on the `Library` row itself:

- **Experiments:** active count, ending-this-week count (needs the `startDate`/`endDate` convention from the Product Backlog, item B9), win rate (% of concluded tests marked `outcome: winning`)
- **Meta Ads:** total angles on file, tested vs. untested split (this single widget makes the Backlog's O1 gap — untested hooks — visible every time someone opens the module, which is a better fix than a policy reminder)
- **Email:** active flows/campaigns, most recent Campaign Retro
- **Creative Library:** asset count by type — its List View is already the gallery grid (Template G), so this renders as a strip above it, not a redesign

---

## 4. What's Genuinely New: Thematic Hubs, Not One Flat Hub

A real problem this transition surfaces that Sprint 3 didn't need to solve yet: the sidebar (Screens & Flows Section 4) was specified for roughly eight destinations and "never scrolls" was a hard rule. Fifteen Modules plus Creative Library in a flat sidebar breaks that rule outright, and — this is the actual refinement — a single flat hub with sixteen cards isn't much better than a flat sidebar; it just moves the scanning problem one screen deeper.

**The confirmed sidebar** groups the sixteen collections into six thematic destinations, plus Dashboard and Settings — eight items total, fitting the original nav budget exactly:

```
🏠 Dashboard
🧠 Knowledge
🎯 Marketing
🎥 Creative
🤝 Creators
📊 Analytics
🧪 Experiments
⚙️ Settings
```

Every collection, mapped — nothing left unassigned:

| Sidebar item | Collections inside | Landing behavior |
|---|---|---|
| 🧠 Knowledge | Brand Knowledge, Product Knowledge, Customer Psychology, SOPs, Team Knowledge, Wholesale, Future Ideas | Mini-hub (Template G) — 7 cards, then drill into a Module's List View |
| 🎯 Marketing | Marketing, Meta Ads, Advertorials, Email | Mini-hub — 4 cards |
| 🎥 Creative | UGC, Creative Library | Mini-hub — 2 cards |
| 🤝 Creators | Creator Knowledge | Goes straight to List View — one collection doesn't need a hub in front of it |
| 📊 Analytics | Analytics | Straight to List View |
| 🧪 Experiments | Experiments | Straight to List View |

**One judgment call worth flagging, not silently deciding:** Customer Psychology could reasonably sit under Marketing instead of Knowledge, since marketing is its heaviest daily user. It's placed under Knowledge here because it belongs with Brand and Product Knowledge in the "who we are and who we sell to" cluster, distinct from "what we're actively running" (Marketing/Meta Ads/Advertorials/Email) — but this is a real either-way call, not a settled one.

**Where Commerce, Cases, Finance, and People fit:** they're not represented in this sidebar because none of them exist yet as shipped modules — Shopify/Klaviyo sync (Backlog B1) hasn't landed. This sidebar is honestly the nav for what's actually being built right now. Those four domains get added back to the sidebar in the same style once Sprint 4/5 (per the Product Backlog) ship them, not folded into one of these six categories artificially.

Single-collection destinations (Creators, Analytics, Experiments) skip the hub entirely and open directly on the Module's List View — a hub screen in front of one card would be the same "screen that only shows a filtered slice of another screen" pattern already rejected in Screens & Flows Section 0.

---

## 5. The Six Named Examples, Concretely

| Requested | Module (Library) | Dashboard widgets | AI Assistant |
|---|---|---|---|
| Searchable knowledge base | **Brand Knowledge** | Entry count, most recently updated | General AI Search, scoped to this library |
| Creative management system | **Meta Ads** | Tested vs. untested, top performer | 🎯 Meta Strategist (AI Strategists §2) |
| Creator database | **UGC** + **Creator Knowledge** | Active creators, videos this month | 📹 Creative Director (briefs) + general search for creator lookup |
| Experiment tracking software | **Experiments** | Active, ending this week, win rate | General AI Search + CRO Strategist for analysis |
| Landing page library | **Advertorials** | Entry count by status | ✍️ Copywriter |
| Campaign management system | **Email** | Active flows, last retro | ✍️ Copywriter |

No new engineering per row — every cell above is a configuration of Sections 1–4, not a new build.

---

## 6. From Documentation to Seed Data

The brief specifies existing documentation as seed content, which is directly actionable because of a choice made without knowing it would matter yet: every content document produced since Sprint 3 (the Brand Knowledge seed, in particular) was written in a consistent, parseable shape — one heading per Entry, a stated Entry Type, structured status/owner/tags, source citations. A seed script reads each doc, maps each section to an `Entry` row (Library + EntryType already named in the heading), and writes it with `status: published` and a `Reference` back to its original Drive source (Knowledge Graph Section 4) — the same citation mechanism already built, now pointed at this build's own source documents instead of external ones. This is a few hours of parsing work, not a new subsystem, precisely because the documentation was produced in software-shaped form from the start rather than free-form prose.

---

## 7. Application Structure

No change to the folder structure, packages, or stack already specified (Technical Architecture Section 1, Section 14) — this instruction changes what gets built next, not the architecture it gets built on. Routing, concretely:

```
/today                        → org-wide CEO Dashboard (Template E)
/knowledge                     → mini-hub, 7 cards (Section 4)
/marketing                     → mini-hub, 4 cards
/creative                      → mini-hub, 2 cards
/creators                      → straight to Creator Knowledge List View
/analytics                     → straight to Analytics List View
/experiments                   → straight to Experiments List View
/:group/:libraryKey            → Module List/Gallery view (Template A/G) + ModuleDashboard strip
/:group/:libraryKey/:id        → Module Detail view (Template B, wide or standard per Content Modules §3)
/search                        → AI Search (Template H)
/strategists/:key              → AI Strategist session (reuses Template H, scoped + persona'd)
/settings                      → unchanged from Screens & Flows §3
/projects, /commerce, /cases, /finance, /people   → added back to the sidebar once Sprint 4/5 ship them (Section 4)
```

---

## 8. What Actually Blocks Starting Code

Per the Product Backlog, three open decisions are now urgent rather than deferrable, because this transition makes them load-bearing for the first real UI work rather than abstract:

- **D2 (Design System reconciliation)** is the most urgent of all of them — building real screens on the invented Sprint 1 palette instead of the actual brand pack found in Drive would mean redoing every screen once this gets noticed, which is exactly the expensive-shortcut failure mode this whole build has been designed to avoid.
- **D1 (reviews ingestion)** blocks the CEO Dashboard's reviews line and the Customer Psychology module's Testimonial Theme population.
- **D4 (Community collection)** blocks the Founder Coach's grounding scope from being accurate before it's ever queried.

None of these are big decisions. All three are cheap to make now and expensive to leave ambiguous once real screens exist.

---

## Closing

Nine of the ten required capabilities per module, the seed-data pipeline, and the routing structure all already existed in the documents produced before this instruction — because they were written as software specifications from the start, not as pages about software. The two genuinely new pieces (per-module dashboards, the Knowledge Hub) are both small, both configuration-driven, and both fit the same engine rather than requiring a new one. That's the actual proof this was designed as software first: the moment "build it for real" arrived, there was very little left to design.
