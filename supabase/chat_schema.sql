-- HQ-wide Claude chat assistant (Jacob's ask: a chat that can pull from
-- everything in HQ to inform decisions). Read-only — never writes
-- anything else in the app, only ever answers questions. Conversation
-- history is per-user (keyed by email, same convention as
-- user_appearance_settings) so everyone's chat is their own.

create table if not exists chat_message (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  role text not null, -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_message_user_idx on chat_message(user_email, created_at);

alter table chat_message enable row level security;

drop policy if exists "service role full access" on chat_message;
create policy "service role full access" on chat_message
  for all using (true) with check (true);
