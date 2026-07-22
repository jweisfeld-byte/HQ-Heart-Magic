-- Heart Magic HQ — Funnels: ad copy per format
-- Each format (funnel_stage_asset) can now hold the actual ad copy
-- text (headline/body/CTA, however Jacob wants to write it) alongside
-- its linked Google Drive creative — Jacob's ask: "add a section for
-- the ad copy as well."

alter table funnel_stage_asset
  add column if not exists ad_copy text not null default '';
