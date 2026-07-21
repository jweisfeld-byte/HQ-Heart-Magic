# Heart Magic OS — Screens, Flows & Component Inventory
### v1.0 — Complete UX Design
Companion to: PRD v1.0, Technical Architecture v1.0
Status: **Design spec — wireframes are structural diagrams, no code, no pixels yet**

---

## 0. Design Mandate, and What I Refused to Build

The brief for this pass is "every click should feel intentional, every screen should have a purpose." The single biggest threat to that goal isn't bad screens — it's *too many* screens, each slightly different from the last for no real reason. Linear has roughly six screen shapes reused for dozens of object types. Notion has effectively one (the page) and suffers for it in structured contexts. Apple's system apps famously ship with fewer options than their competitors, not more. The discipline in all three cases is the same: **fewer patterns, applied consistently, beat more screens, each bespoke.**

So before designing anything, here's what I cut, and why — consistent with the "challenge unnecessary complexity" instruction:

- **No configurable dashboard with draggable widgets.** The PRD already rejected this in favor of one opinionated Today view (Section 5.1 of the PRD). Restating it here because it would be easy to quietly reintroduce it as "just a customizable Home screen" — it's the same bad idea in different clothes. One good briefing beats an empty grid the user has to fill in themselves.
- **No deep folder nesting for Docs & Knowledge.** Nested folders are how Google Drive and Notion pages become unnavigable within a year. Docs are flat, typed, and filtered/tagged instead — same principle as Linear having no folder tree for issues.
- **No per-object-type "New" button scattered across the UI.** One global Create action, invoked identically everywhere (`Cmd+K` → "Create," or the `C` key), that infers the right object type from context (inside a Project, it defaults to a Task; inside Docs, a Document). Six create buttons that all do a version of the same thing is exactly the kind of incidental complexity this build should refuse.
- **No multi-step onboarding wizard.** One screen, pre-populated by role, per PRD Section 5.5 — a wizard is a UX pattern for collecting information the system doesn't already have; HM OS already knows the new hire's role and team.
- **No custom-field builder in v1.** Every object type ships with an opinionated, fixed set of fields. Real, recurring requests for a specific new field get added deliberately later; a general-purpose field builder is exactly the kind of flexibility that looks powerful in a demo and produces an ungoverned mess in a year (the PRD's core critique of Notion, restated at the field level).
- **No fake editing surface over Shopify/Klaviyo objects.** Orders, Products, Campaigns, and Flows are read-first with a clearly labeled "Open in Shopify" / "Open in Klaviyo" action — never a form that looks editable but silently doesn't sync back. A half-working edit form is worse than no edit form.
- **No deep comment threading.** Cases and Tasks get one flat, chronological activity feed — replies, status changes, and comments interleaved by time, the way Linear does issue history. Threaded replies are a feature that helps large public communities and actively hurts small internal teams trying to scan "what happened here" quickly.

Every screen below exists because it does something none of the others do. If a proposed screen only would have shown a filtered slice of another screen's data, it's a saved view, not a screen — that distinction is enforced throughout.

---

## 1. Interaction Principles

Rules every screen in the system obeys, without exception, because consistency of *behavior* is what makes an interface feel fast, more than any individual screen's layout does:

- **Single click on a list row opens its detail.** Never a second click, never a chevron to expand first.
- **Status is always changed inline**, via a small dropdown anchored to the status pill itself — never by opening the full detail view just to change one field. This is the single most-repeated action in any ops tool and it must be the cheapest one.
- **Hover reveals row-level quick actions** (assign, change status, archive) without navigating away — bulk and single-item actions both stay in the list.
- **Checkboxes exist for bulk action only**, appear on hover/focus (not permanently visible clutter), and disappear once nothing is selected.
- **Keyboard-first, mouse-optional**, system-wide:

| Shortcut | Action |
|---|---|
| `Cmd+K` | Open command palette (search, navigate, create — anywhere) |
| `C` | Create (context-aware: infers object type from current screen) |
| `/` | Focus the in-page search/filter bar |
| `G` then a letter | Go to section (`G H` Home, `G D` Docs, `G P` Projects, `G C` Commerce, `G M` Marketing, `G X` Cases, `G F` Finance) |
| `Esc` | Close current overlay/panel, return focus to underlying list |
| `Cmd+Enter` | Submit the current form/comment |
| `J` / `K` | Move selection down/up in a list (vim-style, Linear/Superhuman convention) |

- **Detail views for native, write-heavy objects (Task, Case, Doc) open as a right-side panel over the list** — the list never disappears, scroll position is preserved, closing the panel (`Esc`) returns exactly where you were. This is what makes triaging twenty cases in a row fast instead of exhausting.
- **Detail views for mirrored, read-first objects (Order, Product, Customer, Campaign) open as a full page** — these carry more information density and are visited less repetitively than Tasks/Cases, so a full navigation is the right weight, and it visually reinforces "this is a different kind of object, sourced elsewhere."
- **Loading states are skeleton screens shaped like the real layout**, never a bare spinner on a blank page — the user should be able to tell what kind of content is coming before it arrives.
- **Successful mutations are silent** (optimistic UI update, no toast) — the interface confirming every save with a popup is noise. **Failures are the only thing that interrupts**, with a specific, actionable message, never a bare "Something went wrong."

---

## 2. Screen Templates

Every screen in Heart Magic OS is an instance of one of six templates. This is the structural decision that makes "every screen have a purpose" achievable without producing forty bespoke layouts to maintain.

### Template A — List View
Used for any collection of same-type objects a person scans, filters, and triages.

```
┌──────────────────────────────────────────────────────────────┐
│  [Icon] Section Title                    [Filter ▾][+ Create]│
├──────────────────────────────────────────────────────────────┤
│  🔍 Search or filter this list...                             │
├──────────────────────────────────────────────────────────────┤
│ ☐  ● Status   Title / Name          Owner    Updated    ⋯    │
│ ☐  ● Status   Title / Name          Owner    Updated    ⋯    │
│ ☐  ● Status   Title / Name          Owner    Updated    ⋯    │
├──────────────────────────────────────────────────────────────┤
│  ⟳ Synced 2 min ago            (only shown on mirrored data)  │
└──────────────────────────────────────────────────────────────┘
```
A single click opens Detail (per the panel-vs-page rule in Section 1). A saved-view selector (not a separate screen) lets a user pin a filtered slice — "My open cases," "Low stock," "Overdue tasks" — as a shortcut back to the same template with a preset filter.

### Template B — Detail Panel (native objects: Task, Case, Document)
```
┌───────────────────────────────┐
│ ✕  Title                  ⋯   │  ← slides in from right, list stays visible behind it
│    ● Status ▾   👤 Assignee ▾ │
├───────────────────────────────┤
│  Description / content         │
│  (rich text for Docs,          │
│   structured fields for Tasks) │
├───────────────────────────────┤
│  Related  [Order #1042][Doc]   │  ← generic cross-object links, PRD Section 8
├───────────────────────────────┤
│  Activity (flat, chronological)│
│  · Jacob changed status → Done │
│  · Comment: "shipped replace." │
│  [ Write a comment... ]        │
└───────────────────────────────┘
```

### Template C — Detail Page (mirrored objects: Order, Product, Customer, Campaign, Flow)
```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Orders                          [Open in Shopify ↗] │
├──────────────────────────────────────────────────────────────┤
│  Order #1042                              ● Fulfilled          │
│  Customer · Items · Totals (dense, information-first layout)  │
├──────────────────────────────────────────────────────────────┤
│  Related  [Case: damaged shipment] [Task: reship]              │
├──────────────────────────────────────────────────────────────┤
│  ⟳ Synced 2 min ago                                            │
└──────────────────────────────────────────────────────────────┘
```
The "Open in [Source System] ↗" action is mandatory on every Template C screen — it's the visible admission that this is a mirror, not the source of truth, executing the PRD's trust principle at the UI layer.

### Template D — Board (an alternate *view*, not a separate screen)
A toggle available on any Template A list backed by a status field (Tasks, Cases) — same data, same detail-panel behavior on click, rendered as status-grouped columns instead of rows. Explicitly not a distinct screen in the inventory below, because it isn't one.

### Template E — Narrative Briefing (unique to the Today view)
```
┌──────────────────────────────────────────────────────────────┐
│  Good morning, Jacob.                                          │
│                                                                │
│  Overnight: 12 orders ($640), in line with your trailing       │
│  average. 3 orders flagged — address issue → [Review]          │
│                                                                │
│  Eternal Bloom Rose crossed its reorder threshold (140 units    │
│  left) → [View inventory]                                      │
│                                                                │
│  Your open tasks today (2)             [Launch: New Blend] →   │
│                                                                │
│  1 case needs attention: 3rd mold mention this week → [Open]   │
└──────────────────────────────────────────────────────────────┘
```
Prose, not widgets — every line is a live link into its underlying object (Template B or C), not a static summary. This is the one screen in the system allowed to break from the tabular templates, because its entire purpose is synthesis rather than browsing.

### Template F — Form / Settings
```
┌──────────────────────────────────────────────────────────────┐
│  Section Title                                                 │
├──────────────────────────────────────────────────────────────┤
│  Label                                                          │
│  [ input.................................. ]                    │
│                                                                  │
│  Label                                                          │
│  [ input.................................. ]                    │
│                                                                  │
│                                          [ Cancel ]  [ Save ]   │
└──────────────────────────────────────────────────────────────┘
```
Used for Settings, COGS input, and Profile — plain, stacked, no visual novelty, because a form no one enjoys "exploring" should not try to be delightful, just fast and clear.

---

## 3. Complete Screen Inventory

Every screen in Heart Magic OS, mapped to its template. If it's not in this table, it isn't a screen — it's a saved view, a state, or a component (covered in Sections 6–7).

| # | Screen | Template | Purpose (why it exists at all) |
|---|---|---|---|
| 1 | Sign-in | F (unique layout, see Section 4) | Single Google SSO entry point — nothing else belongs here |
| 2 | Invite Acceptance | F | One-time flow for a new teammate to join an org |
| 3 | Today (Home) | E | The daily reason to open the app — see PRD 5.1 |
| 4 | Inbox / Notifications | Custom panel (Section 4) | Everything needing attention that isn't already on Today |
| 5 | Docs & Knowledge — Browse | A | Scan/filter all SOPs, formulation records, notes |
| 6 | Document Detail | B | Read/edit a single doc; linked Drive files show inline |
| 7 | My Tasks | A (filtered saved view of Projects data) | Cross-project personal task list — not a separate data model |
| 8 | Projects — Browse | A | Scan all active/planned/done projects |
| 9 | Project Detail | A nested (task list scoped to one project) + Board toggle (D) | Where a launch (PRD 5.2) actually gets coordinated |
| 10 | Task Detail | B | Full context on one task without leaving the project list |
| 11 | Orders | A | Scan recent/flagged orders |
| 12 | Order Detail | C | Full order context + links to customer, case, Shopify |
| 13 | Products | A | Scan catalog, spot low stock at a glance |
| 14 | Product Detail | C | Variant/inventory detail, formulation doc link |
| 15 | Customers | A | Find a customer fast (support/escalation entry point) |
| 16 | Customer Detail | C (extended: unified profile) | Orders + subscription + case history + email engagement, unified — this is the single highest-value "why build this instead of just using Shopify" screen |
| 17 | Inventory | A (grouped by SKU, not a generic list) | Stock levels + reorder threshold visibility |
| 18 | Campaigns | A | Scan sent/scheduled Klaviyo campaigns |
| 19 | Campaign Detail | C | Performance summary + "Open in Klaviyo" for editing |
| 20 | Flows | A | Scan active Klaviyo flows |
| 21 | Flow Detail | C | Performance summary + anomaly flag if open rate drops |
| 22 | Content Calendar | Custom (calendar grid, Section 4) | Native cross-channel planning — the one thing Klaviyo doesn't model |
| 23 | Cases — Browse | A | Support queue, triage view |
| 24 | Case Detail | B | Full case context, linked order/customer, resolution log |
| 25 | Finance Dashboard | Custom (narrow, chart + table hybrid) | Margin/COGS trend — deliberately not a full BI tool |
| 26 | COGS Input | F | Where ingredient/packaging costs get entered manually |
| 27 | People — Directory | A | Who's who, roles, at-a-glance |
| 28 | Person Profile | B | Role, onboarding checklist status, permissions summary |
| 29 | Settings — Integrations | F (custom rows, Section 7) | Connection health for Shopify/Klaviyo/QuickBooks/Drive/Slack |
| 30 | Settings — Roles & Permissions | F (custom table) | Who can see/do what, domain by domain |
| 31 | Settings — Organization | F | Org name, defaults |
| 32 | Settings — Profile | F | Personal preferences, notification settings |
| 33 | Search Results (deep search) | A (results-shaped) | Full hybrid search, distinct from the instant `Cmd+K` palette |

**Deliberately not a screen:** a "Dashboard/Reports" builder, a "Wholesale Pipeline" screen (Phase 4, doesn't exist yet — see PRD Roadmap), a standalone "Analytics" section (Finance Dashboard covers the one analytics need that's real today; anything more is speculative scope).

---

## 4. Global Chrome

The persistent frame every screen above lives inside — designed once, never redesigned per-screen.

**App shell:**
```
┌────────────┬───────────────────────────────────────────────┐
│ ⌘K Search  │                                                │
│────────────│         [ Active screen renders here ]         │
│ 🏠 Home    │                                                │
│ 📥 Inbox 3 │                                                │
│────────────│                                                │
│ 📚 Docs    │                                                │
│ ✅ Projects│                                                │
│────────────│                                                │
│ 🛍 Commerce│                                                │
│ ✉️ Marketing│                                                │
│ 🎧 Cases 1 │                                                │
│ 💰 Finance │                                                │
│ 👥 People  │                                                │
│────────────│                                                │
│ ⚙️ Settings│                                                │
│ 🧑 Jacob   │                                                │
└────────────┴───────────────────────────────────────────────┘
```
Unread counts appear only on Inbox and Cases (the two places genuinely time-sensitive, unattended items accumulate) — badges everywhere would just be noise the eye learns to ignore, defeating their own purpose.

**Command Palette (`Cmd+K`), overlaid on top of anything:**
```
┌──────────────────────────────────────────┐
│ 🔍 Search or type a command...            │
├──────────────────────────────────────────┤
│  → Create Task                             │
│  → Create Doc                              │
│  📄 Formulation: Eternal Bloom Rose         │
│  🛍 Order #1042 — Sarah K.                  │
│  🎧 Case: "arrived melted"                  │
└──────────────────────────────────────────┘
```
Ranked by: exact match → recency → role-relevance. Actions (`Create Task`) and objects (search results) share one list, sorted by relevance rather than segregated into separate tabs — segregating them would force the user to know which tab their intent belongs in before they've typed anything, adding a decision the single-list design avoids entirely.

**Inbox / Notifications panel** (slides from the right, same mechanism as Template B):
```
┌───────────────────────────────┐
│ Inbox                      ✕  │
├───────────────────────────────┤
│ ● Assigned: Reship order #1042│
│ ● Case pattern: 3 mold reports │
│ ○ Task done: Photography       │
└───────────────────────────────┘
```
Unread (●) vs. read (○) is the only state — no priority levels, no categories to configure. An inbox that requires setup before it's useful has already failed at its one job.

**Content Calendar** (the one genuinely custom layout, because a calendar grid has no equivalent among the six templates):
```
┌──────────────────────────────────────────────────────────┐
│  July 2026                                    [+ Create]  │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
│     │ IG  │     │Email│     │     │     │
│     │post │     │flow │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```
Clicking any item opens Template B (it's a native, lightweight content-plan object, not a mirrored Klaviyo object) — reinforcing that only genuinely calendar-shaped data gets a calendar screen; everything else stays in Template A/D.

---

## 5. Key User Flows

The five journeys from PRD Section 5, now walked screen-by-screen.

### 5.1 Jacob's Morning Briefing
```
Sign-in (auto, session persists)
   → Today (Template E) — the landing screen, always
       → click "3 orders flagged" → Orders (Template A, pre-filtered)
           → click a row → Order Detail (Template C)
       → click "Eternal Bloom Rose reorder" → Inventory (Template A)
       → click "1 case needs attention" → Case Detail (Template B, opened over Cases list)
```
Zero navigation decisions required to see what matters — every path starts from one screen and is exactly one click deep to the next.

### 5.2 New Product Launch
```
Cmd+K → "Create Doc" → Document Detail (Template B), typed as "Formulation Record"
   → from the Doc, "Create Project" (context-aware Create, Section 0) → Project Detail
       → add Tasks inline (photography, Shopify listing, Klaviyo flow, launch email)
   → [days later] Shopify webhook fires → new Product appears in Products (Template A)
       → HM OS surfaces a one-click prompt: "Link this to Launch: New Blend?" → confirmed
   → Today view (Template E) now reads: "Launch: New Blend — 2 tasks remaining, T-minus 3 days"
```
The auto-link prompt is the one moment the system proactively interrupts — justified because it's replacing what would otherwise be manual cross-referencing (PRD Product Principle: "write once, appear everywhere relevant").

### 5.3 Customer Escalation
```
Case reported (manually created — no helpdesk integration, per confirmed gap) 
   → Cmd+K → "Create Case" → Case Detail (Template B) opens directly, pre-filled with customer lookup
       → search customer inline → auto-links Customer Detail (Template C) — order history + engagement appear immediately
   → Case resolved → status set inline (Section 1 rule) → resolution logged in the flat activity feed
   → [if 3rd similar case in a week] Today view (Template E) surfaces the pattern the next morning
```

### 5.4 Monthly Financial Close
```
Today → sidebar → Finance Dashboard (custom, narrow)
   → COGS Input (Template F) — update ingredient/packaging costs if changed
   → Finance Dashboard recalculates margin-by-SKU automatically, no separate "run report" step
```
No export/report-generation screen — the dashboard *is* the report, always current, because a system that makes you regenerate a report is admitting its live view isn't trustworthy.

### 5.5 New Team Member Onboarding
```
Invite Acceptance (Google SSO) → first login
   → Today (Template E), already populated: "Welcome — here's what your team's working on"
   → People → Person Profile (Template B) — pinned onboarding checklist, role-scoped Docs surfaced automatically
```
One screen, not a wizard, because everything a wizard would ask (role, team, starting permissions) is already known at invite time (Section 11 of the PRD) — asking again would be the system contradicting its own data model.

---

## 6. Empty, Loading, and Error States

Treated as first-class design, not an afterthought, because a system that looks broken the moment it has no data yet loses trust before it's earned any (PRD Core Philosophy #2).

- **Empty state:** icon + one sentence describing what belongs here + a single primary action. Never a bare table header with nothing under it. Example — Cases with zero open items: *"No open cases. Nice."* + `[+ Create Case]`, not a blank grid that reads as broken.
- **Loading state:** skeleton shapes matching the real layout (rows for Template A, a panel outline for Template B) — communicates "this is coming" rather than "something might be wrong."
- **Error state:** specific and actionable, inline where the failure happened — *"Couldn't reach Shopify — retrying in 30s"* on a Commerce screen, never a generic toast disconnected from what broke.
- **Staleness indicator:** every Template C screen and every mirrored Template A list carries a quiet `⟳ Synced Xm ago` footer. If that exceeds a threshold, it turns into a visible warning rather than continuing to look current — the one state that's allowed to be more insistent than the "silent success" rule in Section 1, because silently showing stale commerce data is the specific failure mode the PRD calls out as fatal to trust.

---

## 7. Component Inventory

The complete catalog. Every component below is built once in `packages/ui` (Technical Architecture Section 1) and reused everywhere it appears — nothing in this system is a one-off.

**Layout & Navigation**
- `AppShell` — the persistent sidebar + content frame (Section 4)
- `SidebarNavItem` — icon + label + optional unread badge
- `TopBarSearch` — the `Cmd+K` trigger, always visible
- `CommandPalette` — the overlay itself (Section 4)
- `Panel` — the sliding right-side container underlying every Template B screen
- `Tabs` — used sparingly (e.g., Person Profile: Overview / Permissions)
- `Breadcrumb` — used only on Detail Pages (Template C) to signal "you're one level deep in a mirror"

**Data Display**
- `ListRow` — the single row primitive underlying every Template A instance, with slots for status, title, owner, timestamp, quick actions
- `StatusPill` — colored, inline-editable dropdown trigger (Section 1's inline-status rule, implemented once)
- `PriorityIndicator` — small iconography for Task priority, Linear-style
- `Avatar` — person/customer representation, consistent size scale
- `Badge` — unread counts, small numeric labels only
- `SyncIndicator` — the `⟳ Synced Xm ago` component (Section 6), including its "stale" visual escalation state
- `RelatedObjectChip` — the clickable cross-object reference used in every "Related" panel (PRD Section 8's generic relation mechanism, made visible)
- `ActivityFeedItem` — one entry in a flat chronological feed (status change, comment, or system event, visually distinguished by icon not by separate UI)
- `EmptyState` — icon + sentence + action (Section 6)
- `Skeleton` — loading placeholder shapes (Section 6)
- `DataTable` — denser variant of ListRow for Finance/Inventory, same interaction rules

**Forms & Input**
- `Button` — primary / secondary / destructive / ghost variants only, no fifth variant without a real justified use
- `Input`, `Textarea`
- `Combobox` — searchable select, used for assignee/customer/tag pickers
- `DatePicker`
- `Checkbox`, `Toggle`
- `RichTextBlock` — the Notion-style block editor powering Document content
- `DrivePickerTrigger` — invokes Google's native Drive Picker (Technical Architecture Section 6), styled to match but not reimplementing Google's UI
- `FileDropzone` — native upload path (R2), distinct from `DrivePickerTrigger` so the two file-origin paths are never visually confused

**Overlay & Feedback**
- `Dialog` — confirmation/destructive-action modals only (delete, archive) — reserved for genuinely interruptive moments, not general-purpose popups
- `Toast` — error-only per Section 1's silent-success rule
- `Tooltip`
- `Dropdown` — underlies `StatusPill`, assignee changes, and the sidebar's overflow (`⋯`) menus

**Domain-Specific Composites**
- `OrderLineItemRow` (Order Detail)
- `CustomerProfileHeader` (Customer Detail — orders/subscription/engagement summary strip)
- `TaskCard` (Board view, Template D)
- `KanbanColumn` (Board view, Template D)
- `CaseThread` (Case Detail's activity feed, specialized `ActivityFeedItem` usage)
- `CogsInputRow` (Finance — Template F)
- `IntegrationHealthCard` (Settings — Integrations: provider icon, status, last-synced, reconnect action)
- `RoleAssignmentRow` (Settings — Roles: user, domain, role dropdown, expiry date for Guests)
- `BriefingLine` (Today view — the single repeating unit of Template E's narrative, each line a live link)

**What's deliberately not in this inventory:** a chart-building component (the Finance Dashboard uses a small, fixed set of pre-defined chart shapes, not a generic configurable charting engine — same "no field builder" discipline applied to visualization), and a generic "widget" component (there is no dashboard for widgets to populate, per Section 0).

---

## Closing

Every screen in this system is one of six templates; every template exists because at least four screens need it. Nothing here was designed to look impressive in isolation — the standard throughout was "does this make the next click more obvious," which is the actual, testable version of "every click should feel intentional."

Two things naturally follow from this document, if useful next: the visual design system pass (applying the PRD's brand-to-product tokens — color, type, motion — on top of these structural wireframes), and the still-outstanding Phase 1 build cost/timeline estimate, now scoped against a concrete screen count rather than a general feature list.
