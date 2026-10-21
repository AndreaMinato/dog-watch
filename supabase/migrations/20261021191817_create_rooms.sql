create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  last_joined_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('camera', 'viewer')),
  name text not null,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index room_members_user_id_idx on public.room_members (user_id);

alter table public.room_members enable row level security;

-- Clients never read room_members directly: Realtime authorization goes through this
-- definer function, kept out of the schemas exposed by the Data API.
create schema private;

create function private.is_room_member(topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members
    where user_id = (select auth.uid())
      and topic = 'room:' || room_id
  );
$$;

revoke all on function private.is_room_member(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_room_member(text) to authenticated;

create policy "room members receive room messages"
on realtime.messages
for select
to authenticated
using ((select private.is_room_member((select realtime.topic()))));

create policy "room members send room messages"
on realtime.messages
for insert
to authenticated
with check ((select private.is_room_member((select realtime.topic()))));
