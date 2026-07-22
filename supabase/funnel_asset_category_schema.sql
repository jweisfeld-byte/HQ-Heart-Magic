-- Heart Magic HQ — Funnels: content category per format
-- Jacob's ask: each format within a stage should be tagged as UGC,
-- Brand Made, or AI, so stages can be built out with an even split
-- across the three (rather than accidentally all-UGC or all-AI).

alter table funnel_stage_asset
  add column if not exists content_category text;

alter table funnel_stage_asset
  drop constraint if exists funnel_stage_asset_content_category_check;

alter table funnel_stage_asset
  add constraint funnel_stage_asset_content_category_check
  check (content_category is null or content_category in ('ugc', 'brand_made', 'ai'));
