-- Heart Magic HQ — Team Calendar link
-- A single URL (Jacob's shared Google Calendar) that the sidebar's
-- "Team Calendar" item opens in a new tab. Stored as org-wide settings
-- data rather than hardcoded, same reasoning as dashboard_background_url
-- — it can be changed from Settings without touching code, and it
-- keeps a private calendar link out of the codebase.

alter table organization_settings
  add column if not exists team_calendar_url text;
