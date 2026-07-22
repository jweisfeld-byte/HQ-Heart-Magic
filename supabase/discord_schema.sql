-- Heart Magic HQ — Discord notifications schema
-- Jacob's ask: automate weekly-results messages to his Discord
-- communities. Discord webhooks (one per channel/community) are the
-- simplest way to post messages — no bot/OAuth needed, just a URL
-- generated from Discord's own channel settings (Edit Channel >
-- Integrations > Webhooks > New Webhook > Copy Webhook URL).
--
-- Supports multiple webhooks since Jacob mentioned "communities"
-- (plural) — the weekly digest posts to every row in this table.

create table if not exists discord_webhook (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  webhook_url text not null,
  created_at timestamptz not null default now()
);

alter table discord_webhook enable row level security;

-- Same service-role-bypass pattern used everywhere else in this app —
-- all real access goes through createAdminClient() server-side.
drop policy if exists "service role full access" on discord_webhook;
create policy "service role full access" on discord_webhook
  for all using (true) with check (true);
