-- Heart Magic HQ — Marketing playbook seed: offer/sales/paid-social frameworks
--
-- Jacob's ask: get the HQ Assistant "trained" on Alex Hormozi's $100M
-- Offers, Sabri Suby's Sell Like Crazy, and Chase Chappell's paid-social
-- approach. There's no literal fine-tuning happening — Claude doesn't
-- work that way inside HQ, and reproducing full book text would also be
-- a copyright problem. What actually gets the same practical result:
-- these are distilled, in-house summaries of each framework (not
-- verbatim excerpts) filed as Knowledge entries in the existing
-- Marketing > General Playbook collection. The HQ Assistant and AI
-- Search both already retrieve from every Knowledge/Marketing entry via
-- searchEntries() — so once this is run, asking the Assistant something
-- like "how should I structure this offer?" or "what's a good hook for
-- this ad?" will pull straight from these frameworks automatically. No
-- code changes needed.
--
-- Run this after marketing_schema.sql has already been run once.

insert into entry (library_id, entry_type_id, title, body, status, owner_email)
select l.id, et.id,
  'Offer Creation — Hormozi''s Grand Slam Offer Framework ($100M Offers)',
  $body$Source: Alex Hormozi, $100M Offers. Summarized/distilled for internal use — not the book's original text.

THE CORE IDEA: most businesses compete on price because their offer is weak. A "Grand Slam Offer" is priced so far above the market that direct price comparison becomes irrelevant, because the perceived value is that much higher.

THE VALUE EQUATION — the four levers of any offer:
Value = (Dream Outcome x Perceived Likelihood of Achievement) / (Time Delay x Effort & Sacrifice)

- Dream Outcome: the specific transformation the customer actually wants, stated in their language, not ours.
- Perceived Likelihood of Achievement: proof it will work for THEM specifically — guarantees, testimonials, case studies, risk-reversal.
- Time Delay: how long until they see the result. Shrink this (fast wins, quick-start steps) and perceived value rises.
- Effort & Sacrifice: how much work/friction is required of the customer. Reduce steps, decisions, and confusion.

Raise the numerator, shrink the denominator — that's the whole game.

BUILDING THE OFFER — Hormozi's process:
1. Identify the customer's #1 dream outcome and their biggest problems/objections standing in the way.
2. List every possible solution to each problem (a "solutions list").
3. Turn solutions into deliverables (the actual bonuses/components), then trim to what actually moves the needle — most offers are stronger with fewer, higher-value components than a pile of low-value bonuses.
4. Stack bonuses that solve NEXT-level problems the customer doesn't even know they have yet, each with a title and standalone perceived value.
5. Add scarcity (limited quantity) and urgency (limited time) — but only if true; fake scarcity destroys trust.
6. Add a strong guarantee that reverses risk from the customer onto the business (unconditional, conditional, or performance-based).
7. Give the whole offer a name that makes it sound like a specific, proprietary system rather than a generic product/service.

APPLYING THIS TO A DTC BRAND: this framework applies most directly to how a product/bundle/subscription is packaged and positioned (e.g. what's included, what guarantee backs it, what makes a specific SKU or bundle feel like a "no-brainer" rather than one option among many), not just to price. It's also directly useful for structuring wholesale/partner offers and any high-ticket or bundle promotion.$body$,
  'published',
  null
from library l
join entry_type et on et.library_id = l.id and et.key = 'general-playbook'
where l.key = 'marketing'
on conflict do nothing;

insert into entry (library_id, entry_type_id, title, body, status, owner_email)
select l.id, et.id,
  'Sales & Lead Gen — Sabri Suby''s Sell Like Crazy Framework',
  $body$Source: Sabri Suby, Sell Like Crazy. Summarized/distilled for internal use — not the book's original text.

THE CORE IDEA: most marketing fails because it tries to sell cold traffic directly. Suby's system is built around capturing and nurturing demand in stages, rather than asking for the sale immediately.

THE "ICEBERG EFFECT": at any moment, only a small fraction of your total addressable market is actively ready to buy (the visible tip). The much larger group is problem-aware or solution-aware but not yet in buying mode (the submerged mass). Most businesses only market to the tip; Suby's system is built to capture the whole iceberg via lead magnets, quizzes, and low-friction opt-ins that convert "not ready yet" traffic into a nurturable list instead of losing it.

THE 3-STEP FRAMEWORK:
1. ATTRACT — get attention with a lead magnet or irresistible free offer that matches a real pain point, not just "sign up for our newsletter."
2. ENGAGE — nurture the lead with a value-first sequence (email/SMS/retargeting) that builds trust and authority before ever pitching, addressing objections along the way.
3. CONVERT — present a "Godfather Offer": one so good, backed by proof and a strong guarantee, that saying no feels like the irrational choice.

THE 5-4-3-2-1 METHOD for objection handling on sales pages/VSLs — address, in order: (5) reasons they need this now, (4) reasons this is the best solution, (3) reasons this specific brand/product is the one to trust, (2) risk-reversal points (guarantee, proof), (1) clear single call to action.

RETARGETING AS A CORE CHANNEL, NOT AN AFTERTHOUGHT: Suby treats retargeting sequences (people who engaged but didn't buy) as one of the highest-ROI parts of the funnel, since the trust-building work is already partly done — the ad/creative for retargeting should differ from cold-traffic creative (more proof/testimonial-driven, less "discover us" framing).

APPLYING THIS TO A DTC BRAND: this maps directly onto funnel design (Awareness > Consideration > Conversion stages already tracked in HQ's Funnels module) — cold ad creative should point to a low-friction lead magnet or quiz rather than straight to checkout for colder audiences, and retargeting sequences (email flows, retargeting ads) should be built and reviewed as their own distinct asset, not reused cold-traffic creative.$body$,
  'published',
  null
from library l
join entry_type et on et.library_id = l.id and et.key = 'general-playbook'
where l.key = 'marketing'
on conflict do nothing;

insert into entry (library_id, entry_type_id, title, body, status, owner_email)
select l.id, et.id,
  'Paid Social Ads Playbook — Chase Chappell''s Meta/TikTok Approach',
  $body$Source: Chase Chappell (Facebook & TikTok Ads Mastery, Chappell Digital / DOE Media). Summarized/distilled from his publicly taught framework — not any paid course's proprietary material reproduced verbatim.

WHO HE IS: paid-social media buyer and educator, advisor on $200M+ in Facebook/TikTok ad spend, founder of Sirge (Shopify conversion-rate + ad-performance tooling) and partner at DOE Media.

CORE PHILOSOPHY: treat the ad platform's algorithm as the actual audience to win over first — Meta/TikTok's delivery systems reward ads that hold attention and drive on-platform engagement, so creative quality and format often matter more than granular audience targeting once campaigns are running on broad/CBO delivery.

THE AD STRUCTURE HE TEACHES — every ad breaks into three distinct jobs:
1. THE HOOK (first 1-3 seconds): must stop the scroll on its own — a bold claim, a pattern interrupt, or a visual that doesn't look like a typical ad. If the hook doesn't work, nothing after it matters.
2. RETENTION (the middle): keep the viewer watching by continuing to deliver new information/curiosity rather than repeating the same pitch — problem/agitation, proof, demonstration.
3. THE CTA (the close): a single, clear, specific next step — not a vague "shop now" but the specific reason to act right now (offer, guarantee, urgency).

CREATIVE TESTING APPROACH: run multiple distinct creative concepts (not just color/copy variations of the same idea) against broad targeting and let the algorithm's delivery data pick winners; iterate FAST on creative rather than over-engineering audience segments. Losers get killed quickly; winners get iterated into new hooks/angles rather than run unchanged until they fatigue.

SCALING APPROACH: scale primarily through budget increases on proven campaigns/CBOs (vertical scaling) plus expanding into new creative angles and placements (horizontal scaling) rather than aggressive manual bid/audience micromanagement. Retargeting/remarketing campaigns are kept separate from cold-prospecting campaigns with their own creative built around objection-handling and proof.

TIKTOK-SPECIFIC NOTE: native, UGC-style, "doesn't look like an ad" creative consistently outperforms polished/produced ads on TikTok specifically — Spark Ads (boosting organic-style posts, including creator content) are a core lever, not a side tactic.

APPLYING THIS TO A DTC BRAND: use this to structure new Meta ad creative before it goes into HQ's ad-copy field on a funnel format — write the hook first and make sure it earns the first 3 seconds, keep cold vs. retargeting creative genuinely different rather than reusing the same asset, and treat creative testing (multiple distinct concepts) as a higher priority than granular audience-targeting experiments.$body$,
  'published',
  null
from library l
join entry_type et on et.library_id = l.id and et.key = 'general-playbook'
where l.key = 'marketing'
on conflict do nothing;
