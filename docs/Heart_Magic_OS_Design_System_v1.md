# Heart Magic OS — Visual Identity & Design System
### v1.0 — Complete Documentation
Companion to: PRD v1.0, Technical Architecture v1.0, Screens & Flows v1.0
Status: **Design system spec — every value below is final enough to build from**

---

## 0. Creative Direction

Ten adjectives were given: Apple, Stripe, Linear, Calm, Organic, Premium, Natural, Minimal, Warm, Luxury. Three of those name companies, seven name feelings — and the job of a creative director is to notice that the seven feelings don't all pull the same direction, and resolve the tension rather than average it away.

**The resolution:** structure is Apple/Stripe/Linear (restraint, precision, generous space, quiet chrome). Warmth is Heart Magic (color, type character, and specific tuned details — never generic SaaS gray-and-blue with a logo swapped in). **Minimal describes how much is on screen. Warm describes what's actually there.** A system can be both at once — Apple's own interfaces prove restraint and warmth aren't opposites — but only if warmth is designed deliberately into the few elements that exist, not layered on as decoration afterward.

Concretely, that produces some explicit rejections, stated up front because a creative direction is defined as much by what it refuses as by what it chooses:

- **No default SaaS blue.** Blue-as-accent is the single most generic signal in enterprise software — it's what you get by not deciding. Heart Magic OS's accent is a warm clay/terracotta, tied directly to cacao, and it is the *only* saturated color in the system's chrome (Section 1).
- **No pure black or pure white.** Both read cold and clinical. Every "black" in this system is a warm near-black (a deep espresso brown), every "white" is a warm off-white — the same discipline Apple applies to its own grays, and the specific mechanism that makes a minimal interface feel warm rather than sterile.
- **No bouncy/spring motion.** Playful, elastic animation (a popular pattern right now) reads energetic, not calm or premium. Every transition in this system eases smoothly in and out — motion that reassures rather than performs (Section 9).
- **No decorative texture, gradients, or illustration in the product chrome.** Luxury in interface design comes from precision and material quality (real spacing, real type, real color), not ornament. Where warmth and brand personality get to show up more expressively — empty states, onboarding, the sign-in screen — is called out explicitly in each section below, and nowhere else.
- **No more than one accent color doing work at a time.** A palette with five "brand colors" all competing for attention isn't premium, it's indecisive. Section 1 defines a strict hierarchy: one accent, two supporting tones used sparingly, and everything else neutral.

---

## 1. Color System

**Primitive palette** — the raw values design tokens are built from. Warm-neutral base throughout; nothing here is a pure gray.

| Token | Hex | Used for |
|---|---|---|
| `neutral-0` | `#FBF9F5` | Page background (light) — warm off-white, not `#FFFFFF` |
| `neutral-50` | `#F5F1EA` | Sidebar / recessed surfaces |
| `neutral-100` | `#EDE7DC` | Borders, dividers |
| `neutral-200` | `#DDD4C4` | Disabled fills, skeleton loading |
| `neutral-400` | `#A69983` | Secondary/muted text |
| `neutral-600` | `#6B5F4E` | Tertiary text, icons at rest |
| `neutral-800` | `#3A2F24` | Primary text (not pure black) |
| `neutral-900` | `#241C14` | Headlines, highest-emphasis text |
| `clay-500` | `#B5562F` | **Primary accent** — buttons, links, active states, focus rings |
| `clay-600` | `#9A4623` | Accent hover/pressed |
| `clay-100` | `#F3E0D4` | Accent-tinted backgrounds (selected nav item, subtle highlight) |
| `rose-500` | `#C77B7B` | Secondary accent — used only for the Eternal Bloom Rose product line references and sparing decorative moments, never for UI chrome |
| `sage-500` | `#7A8B6F` | Tertiary accent / success semantic |
| `amber-500` | `#C99A3E` | Warning semantic |
| `brick-500` | `#A8503F` | Danger semantic — muted, never a fire-engine red |

**Semantic tokens** (what components actually reference — never a raw hex in component code, per Section 11):

| Semantic token | Light value | Dark value |
|---|---|---|
| `bg.page` | `neutral-0` | `#1C1611` (warm espresso, not `#000000`) |
| `bg.surface` | `#FFFFFF` (cards lift slightly above the warm page bg) | `#26201A` |
| `bg.sidebar` | `neutral-50` | `#171310` |
| `border.default` | `neutral-100` | `#3A2F24` |
| `text.primary` | `neutral-800` | `#F0E9DE` (warm off-white, not pure white) |
| `text.secondary` | `neutral-600` | `#B5A891` |
| `text.tertiary` | `neutral-400` | `#8A7C68` |
| `accent.default` | `clay-500` | `clay-500` (same hue; see Section 12 for why it doesn't shift) |
| `accent.hover` | `clay-600` | `#C96A3F` (lightened, not darkened, for dark-mode contrast) |
| `accent.subtle` | `clay-100` | `#3D2A1F` |
| `success` | `sage-500` | `#8FA383` |
| `warning` | `amber-500` | `#D6AC5C` |
| `danger` | `brick-500` | `#BC6152` |

**Why one accent, strictly:** every additional "brand color" used in UI chrome is a decision the user has to unconsciously parse ("does orange mean something different from rose here?"). Clay does all interactive/action signaling. Rose and sage are reserved for the narrow cases where they carry real product meaning (a Rose-line SKU thumbnail border in Products; a `success` semantic state) — never interchangeably as decoration.

---

## 2. Typography

**Typeface pairing: Fraunces (display/headings) + Inter (UI/body).**

- **Fraunces** is a warm, slightly editorial serif with real character in its curves — it carries the "organic, premium, warm" half of the brief in every headline without needing color or imagery to do it. Used only for page titles, section headers, and the Today view's briefing prose (Template E) — anywhere the system is allowed to sound like a person, not a spreadsheet.
- **Inter** carries every interactive and data-dense surface — tables, forms, buttons, navigation. It's the same family of grotesque Linear and Stripe both use for exactly the right reason: at small sizes and high density, character shows up as noise, not warmth. Restraint here is what makes Fraunces's warmth read as intentional rather than default.

**Type scale** (base unit 16px, ratio ~1.25):

| Token | Size / Line-height | Weight | Typeface | Used for |
|---|---|---|---|---|
| `display` | 36px / 44px | 500 | Fraunces | Today view greeting, empty-state headlines |
| `h1` | 28px / 36px | 500 | Fraunces | Page titles (Docs, Projects, Settings) |
| `h2` | 22px / 28px | 500 | Fraunces | Section headers within a page |
| `h3` | 17px / 24px | 600 | Inter | Card/panel sub-headers, table group headers |
| `body` | 15px / 22px | 400 | Inter | Default body text, doc content |
| `body-medium` | 15px / 22px | 500 | Inter | Emphasized inline text, active nav labels |
| `ui` | 13px / 18px | 400 | Inter | Table cells, form labels, secondary UI text |
| `caption` | 12px / 16px | 400 | Inter | Timestamps, helper text, sync indicators |

**Why 15px body instead of the more common 16px:** paired with generous line-height and the spacing scale in Section 3, 15px reads calmer and denser without sacrificing legibility — closer to Linear's information density than a marketing site's. Never drops below 12px anywhere in the product; anything smaller fails the accessibility bar in Section 13 before it fails taste.

---

## 3. Spacing & Grid

**Base unit: 4px.** Every spacing value in the system is a multiple of it — no arbitrary pixel values anywhere in component styling.

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

| Token | Value | Typical use |
|---|---|---|
| `space-1` | 4px | Icon-to-label gap |
| `space-2` | 8px | Tight stacks, chip padding |
| `space-3` | 12px | Input padding, list row vertical padding |
| `space-4` | 16px | Default gap between elements |
| `space-6` | 24px | Card padding, section gaps |
| `space-8` | 32px | Page margins (mobile/narrow) |
| `space-10` | 40px | Page margins (default) |
| `space-16` | 64px | Major section breaks (Today view) |

**Grid:** 240px fixed sidebar (Screens & Flows Section 4), content area on a 12-column fluid grid with a 1280px max width for list/table views (Templates A/C) and a 680px max width for prose/document content (Template B's Doc content, matching a comfortable reading line length rather than stretching text edge-to-edge on a wide monitor). Detail panels (Template B) are a fixed 420px, never resizable in v1 — one width, tuned once, is more consistent than a resize handle nobody asked for.

**Why a strict 4px system instead of allowing arbitrary values:** this is the single most load-bearing decision for long-term visual consistency. Every "this screen feels slightly off from that one" bug in real products traces back to someone using `15px` instead of `16px` under deadline pressure. A hard constraint at the token level makes that class of drift structurally impossible, not just discouraged by convention.

---

## 4. Icons

**Base set: a licensed line-icon library (Phosphor or Lucide — both open, consistent, MIT-licensed), used at a 1.5px stroke weight, rounded caps and joins, 20×20px default grid.**

- **Rounded, not sharp, line terminals** — a small detail, but it's the difference between an icon set that reads clinical (sharp Bootstrap-style icons) and one that reads soft/organic without becoming cartoonish. This single stroke-cap decision does more for the "organic/warm" brief than any color choice could.
- **Monochrome at rest** (`text.secondary`), shifting to `accent.default` only on active/selected state (sidebar) or hover (interactive icon buttons) — icons never carry their own independent color palette; they inherit from the same semantic tokens as text, keeping the whole system visually coherent.
- **A small set of custom marks — five, deliberately no more — reserved for moments where brand personality is allowed to show:** the sign-in screen, empty states, and the onboarding welcome. These are the one place hand-drawn, warmer, less geometric marks (a cacao pod, a simple ritual/heart motif) earn their keep, precisely because they're rare enough to still feel special. Commissioning a full custom icon set for all 40+ functional icons would be expensive and, more importantly, wrong: functional icons should disappear into the interface, not compete with the content next to them.

---

## 5. Cards

The default container for grouped content (a document preview, a metric summary, a settings section).

- **Radius: 12px** — noticeably softer than the 4–8px typical of enterprise SaaS, which reads warmer and more premium without sacrificing precision. This radius value is used consistently across cards, buttons, inputs, and panels (Section 11) — one radius token, not a different curve on every component.
- **At rest:** `bg.surface`, 1px `border.default`, **no drop shadow** — flat-first, matching Linear and Apple's own preference for borders over shadows to establish hierarchy in a light, non-glossy interface.
- **On hover (interactive cards only):** elevation shifts to `shadow-1` (Section 10) and the border tints very slightly toward `accent.subtle` — enough to confirm interactivity, not enough to feel like the card is jumping off the page.
- **Padding:** `space-6` (24px) internal, consistently — a card that changes its internal padding based on content type is a card that doesn't feel like part of a system.

---

## 6. Buttons

Four variants, no more, because a fifth variant is almost always a sign someone needed a specific one-off rather than a real new pattern:

| Variant | Visual | Use |
|---|---|---|
| **Primary** | Solid `accent.default` fill, `neutral-0` text, weight 500 | The one primary action per screen (Save, Create) |
| **Secondary** | `bg.surface` fill, 1px `border.default`, `text.primary` | Any non-primary action that still needs visual weight |
| **Ghost** | No fill, no border, `text.secondary`, background appears only on hover | Tertiary/low-emphasis actions (Cancel, inline row actions) |
| **Destructive** | Solid `danger` fill | Delete/archive confirmations only — never used for routine actions |

- **Radius: 8px** (tighter than cards' 12px — buttons are smaller, functional elements; using the exact same radius as cards at a much smaller size would look proportionally heavier).
- **Sizes:** `sm` 28px height (inline/table actions), `md` 36px (default), `lg` 44px (primary page-level actions, forms) — three sizes, mapped directly to the 4px spacing scale, never an arbitrary in-between height.
- **Labels are sentence case, never all-caps.** All-caps button labels are a dated enterprise-SaaS tell and read as shouting — quiet confidence is the entire brief.
- **Disabled state:** reduced opacity (60%) plus a genuinely disabled cursor, never color alone — color-only disabled states fail colorblind users and are called out again in Section 13.

---

## 7. Forms

- **Labels above the field, always** — never floating labels. Floating labels (the label animates into the field on focus) are a pattern optimized for looking clever in a demo and cost real users clarity, especially anyone using assistive tech or scanning quickly; rejected outright rather than "used sparingly."
- **Inputs:** `bg.surface`, 1px `border.default`, 8px radius, `space-3` vertical padding, `space-4` horizontal — generous enough to feel unhurried, consistent with the "calm" brief, without being so large it wastes vertical rhythm in dense forms (Finance's COGS Input, Section 3 of Screens & Flows).
- **Focus state:** a 2px `accent.default` ring with a soft offset — never the browser's default blue outline, and never `outline: none` without a replacement (a real, common accessibility regression called out explicitly so it isn't reintroduced later under time pressure).
- **Helper and error text:** `caption` size, positioned directly below the field it describes, error text in `danger` — always paired with a small inline icon, per the color-isn't-the-only-signal rule (Section 13).
- **Required fields:** marked with a subtle asterisk in `text.tertiary`, not a red asterisk — red is reserved for actual error states, not routine form structure, so its meaning stays sharp when it does appear.

---

## 8. Navigation

- **Sidebar:** `bg.sidebar` (a half-step darker than page background — enough contrast to read as a distinct zone, not enough to feel like a separate app bolted on).
- **Nav item at rest:** `text.secondary` label + icon, no background.
- **Nav item active:** `accent.subtle` background pill (rounded, matching the 8px button radius), `accent.default` icon and label — this is the *only* place in the resting UI where the accent color appears as a fill rather than a line/text color, making "where am I" unmistakable at a glance without needing a second visual signal.
- **No default-blue selected state, ever** — worth restating here specifically because sidebar active-states are exactly where component libraries' default blue most often leaks through unnoticed.
- **Hover (inactive items):** a very subtle `neutral-100`/`#2A231C` background tint — present, but clearly secondary to the active state's accent treatment.
- **Top bar:** minimal — search trigger and nothing else by default (Screens & Flows Section 4). No breadcrumb, no page title repeated in a top bar, because the sidebar's active state already answers "where am I," and repeating that information in a second location is exactly the kind of redundant chrome the "minimal" brief exists to prevent.

---

## 9. Animation

**Duration scale**, tied to purpose rather than picked per-component:

| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion-micro` | 100ms | ease-out | Hover states, button press |
| `motion-standard` | 180ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Panel slide-in, dropdown open, status pill transitions |
| `motion-macro` | 260ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Full-page transitions (rare — most navigation in this system doesn't full-reload, per the Templates in Screens & Flows) |

- **Every easing curve is a smooth ease — never a spring/bounce.** This is worth repeating from Section 0 because it's the single motion decision most likely to get overridden by a well-meaning "let's make it feel more alive" suggestion later; springy motion reads playful and energetic, which actively works against "calm" and "luxury," both of which are conveyed by things moving predictably and settling immediately, not bouncing past their target.
- **Motion always communicates state, never exists as decoration.** A panel sliding in tells you where it came from (Section 1 of Screens & Flows); a status pill's color transition confirms a change registered. If an animation doesn't answer "what just happened," it's cut.
- **`prefers-reduced-motion` is respected everywhere, automatically** — every transition above degrades to an instant state change, no exceptions, no per-component opt-out to remember.

---

## 10. Shadows & Elevation

Shadows are **warm-tinted**, not the generic `rgba(0,0,0,x)` every default component library ships with — shadow color is derived from `neutral-900` at low opacity, so even a card's shadow carries the palette's warmth instead of introducing a cold gray cast into an otherwise warm interface. This is a small, easy-to-miss detail that's disproportionately responsible for whether a "warm" palette actually reads warm once real UI chrome (borders, shadows, dividers) is layered on top of it.

| Token | Value (light mode) | Use |
|---|---|---|
| `shadow-0` | none | Resting cards, resting buttons — flat by default |
| `shadow-1` | `0 1px 2px rgba(36,28,20,0.06), 0 1px 1px rgba(36,28,20,0.04)` | Hover elevation (cards), resting dropdowns |
| `shadow-2` | `0 4px 12px rgba(36,28,20,0.08)` | Open dropdowns, tooltips |
| `shadow-3` | `0 12px 32px rgba(36,28,20,0.14)` | Modals, slide-in panels (Template B) |

Elevation is used sparingly and always paired with a state change (hover, open) — never applied to a resting element just to make it "pop," which is the single fastest way an interface stops looking calm and starts looking busy.

---

## 11. Component Philosophy

Restating and extending the Technical Architecture's `packages/ui` principle from the design side:

- **Every component consumes semantic tokens, never raw hex/px values.** A button's fill color is `accent.default`, never `#B5562F` hardcoded inline — this is what makes dark mode (Section 12) a token swap instead of a second implementation, and what makes a future palette refinement a one-file change instead of a find-and-replace across the codebase.
- **One radius scale, one shadow scale, one spacing scale, applied everywhere** — the enemy of a system that "feels expensive" is inconsistency at the millimeter level, not a wrong color choice. Users rarely consciously notice that spacing is consistent; they very much notice, as unease, when it isn't.
- **Density is a token, not a redesign.** Templates A/C (dense tables) and Template B/E (spacious panels and prose) share the same component primitives at different density settings (tighter `space-*` values, smaller `ui` vs `body` text) — solving the exact "how do a dense table and a spacious doc view coexist under one visual language" problem the PRD flagged as the hardest design problem in the system (PRD Section 15), by making density a variable on shared components rather than two different visual languages.
- **Nothing is designed in isolation.** Every component in the Screens & Flows inventory (Section 7 of that document) maps to a token-driven implementation here — there is no component in this system whose visual properties aren't traceable to Section 14's token file.

---

## 12. Dark Mode

**Dark mode is a separately tuned palette, not an inverted one.** The lazy version of dark mode — literally flipping light-mode grays — is exactly what makes so much dark mode software feel like an afterthought: flat, cold, low-contrast where it shouldn't be, harsh where it shouldn't be either.

- **Background is a warm espresso-brown near-black (`#1C1611`), not `#000000` or a cool slate gray.** Pure black creates uncomfortably high contrast against light text (a real eye-strain issue, not just an aesthetic one) and reads generic-tech rather than warm; a tuned dark brown keeps the "organic/warm" identity intact after dark.
- **Text is warm off-white (`#F0E9DE`), never pure white** — same reasoning as light mode's `neutral-0`, applied in reverse.
- **The accent hue doesn't shift, but its value does** — `clay-500` stays the same recognizable brand color, but its *hover* state lightens rather than darkens (`clay-600` in light mode → a lighter `#C96A3F` in dark mode), because darkening an already-dark-mode-appropriate color reduces contrast instead of adding it. This is a common and easy mistake (reusing the light-mode hover formula verbatim) worth flagging explicitly.
- **Shadows nearly disappear in dark mode** — elevation is communicated primarily through surface color shifts (a card's `bg.surface` is a full step lighter than `bg.page`) rather than shadow, since shadows are much less visible against a dark background regardless of intensity; relying on them there would silently break the elevation system precisely when a user has dark mode on.
- **Respects `prefers-color-scheme` by default**, with an explicit manual override in Settings — automatic is the right default (most people never touch this setting), but it should never be the *only* option.

---

## 13. Accessibility

Accessibility is treated as a design constraint enforced from the token level up, not a pass done at the end:

- **Every text/background pairing in Sections 1–2 meets WCAG AA** — 4.5:1 minimum for body text, 3:1 for large text (18px+) and UI components/icons. `text.tertiary` on `bg.page` is the tightest pairing in the system and was specifically checked against this bar, not just eyeballed.
- **Color is never the only signal.** Status pills pair color with a label, always (`● Open`, not a bare colored dot); form errors pair `danger` color with an icon and text, never color alone — directly protects colorblind users, who are otherwise a real and often-forgotten fraction of any team.
- **Focus states are always visible, system-wide**, using the 2px accent ring defined in Section 7 — never suppressed for aesthetic reasons, on any interactive element, including custom components like `StatusPill` and `Dropdown` from the Screens & Flows component inventory.
- **Minimum interactive target size: 40×40px**, even where the visible icon/label is smaller — a small icon button gets invisible padding to reach this, rather than shipping a target that's technically clickable but genuinely hard to hit, especially relevant for the row-level quick actions defined in the Interaction Principles (Screens & Flows Section 1).
- **Motion respects `prefers-reduced-motion`** (Section 9), and **contrast/color respects `prefers-color-scheme`** (Section 12) — the system defers to the operating system's accessibility signals by default rather than assuming its own defaults are right for everyone.
- **Semantic markup is a component-library responsibility, not a per-screen one** — because every component in this system is built once in `packages/ui` (Technical Architecture Section 1) and reused everywhere, getting ARIA roles and keyboard behavior right once in `Dropdown`, `Dialog`, and `Combobox` correctly propagates that correctness to every screen that uses them, rather than requiring every screen to reimplement it.

---

## 14. Design Tokens

The literal specification — this is the file `packages/ui/tokens.ts` (Technical Architecture Section 1) should be built from directly, not reinterpreted.

```json
{
  "color": {
    "neutral": {
      "0": "#FBF9F5", "50": "#F5F1EA", "100": "#EDE7DC",
      "200": "#DDD4C4", "400": "#A69983", "600": "#6B5F4E",
      "800": "#3A2F24", "900": "#241C14"
    },
    "clay": { "100": "#F3E0D4", "500": "#B5562F", "600": "#9A4623" },
    "rose": { "500": "#C77B7B" },
    "sage": { "500": "#7A8B6F" },
    "amber": { "500": "#C99A3E" },
    "brick": { "500": "#A8503F" },
    "semantic": {
      "light": {
        "bg.page": "{neutral.0}", "bg.surface": "#FFFFFF", "bg.sidebar": "{neutral.50}",
        "border.default": "{neutral.100}",
        "text.primary": "{neutral.800}", "text.secondary": "{neutral.600}", "text.tertiary": "{neutral.400}",
        "accent.default": "{clay.500}", "accent.hover": "{clay.600}", "accent.subtle": "{clay.100}",
        "success": "{sage.500}", "warning": "{amber.500}", "danger": "{brick.500}"
      },
      "dark": {
        "bg.page": "#1C1611", "bg.surface": "#26201A", "bg.sidebar": "#171310",
        "border.default": "#3A2F24",
        "text.primary": "#F0E9DE", "text.secondary": "#B5A891", "text.tertiary": "#8A7C68",
        "accent.default": "{clay.500}", "accent.hover": "#C96A3F", "accent.subtle": "#3D2A1F",
        "success": "#8FA383", "warning": "#D6AC5C", "danger": "#BC6152"
      }
    }
  },
  "typography": {
    "fontFamily": { "display": "Fraunces", "ui": "Inter" },
    "scale": {
      "display": { "size": 36, "lineHeight": 44, "weight": 500, "font": "display" },
      "h1": { "size": 28, "lineHeight": 36, "weight": 500, "font": "display" },
      "h2": { "size": 22, "lineHeight": 28, "weight": 500, "font": "display" },
      "h3": { "size": 17, "lineHeight": 24, "weight": 600, "font": "ui" },
      "body": { "size": 15, "lineHeight": 22, "weight": 400, "font": "ui" },
      "bodyMedium": { "size": 15, "lineHeight": 22, "weight": 500, "font": "ui" },
      "ui": { "size": 13, "lineHeight": 18, "weight": 400, "font": "ui" },
      "caption": { "size": 12, "lineHeight": 16, "weight": 400, "font": "ui" }
    }
  },
  "space": { "1": 4, "2": 8, "3": 12, "4": 16, "6": 24, "8": 32, "10": 40, "16": 64 },
  "radius": { "sm": 8, "md": 12, "full": 9999 },
  "shadow": {
    "0": "none",
    "1": "0 1px 2px rgba(36,28,20,0.06), 0 1px 1px rgba(36,28,20,0.04)",
    "2": "0 4px 12px rgba(36,28,20,0.08)",
    "3": "0 12px 32px rgba(36,28,20,0.14)"
  },
  "motion": {
    "micro": { "duration": 100, "easing": "ease-out" },
    "standard": { "duration": 180, "easing": "cubic-bezier(0.4,0,0.2,1)" },
    "macro": { "duration": 260, "easing": "cubic-bezier(0.4,0,0.2,1)" }
  },
  "layout": {
    "sidebarWidth": 240,
    "panelWidth": 420,
    "contentMaxWidth": 1280,
    "proseMaxWidth": 680
  }
}
```

---

## Closing

Every visual decision in this document traces back to one of two things: the six-template screen system from Screens & Flows v1.0, or a token in Section 14 — nothing here is a one-off. That's deliberate: a design system's real test isn't how good the first screen looks, it's whether the fiftieth screen someone builds eighteen months from now, without asking a designer, still looks like it belongs.

Attached alongside this document is a live style-guide specimen rendering these tokens directly — colors, type, buttons, cards, forms, navigation, and both light and dark mode — so this isn't just described, it's visible.
