create table public.failed_join_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  attempted_at timestamptz not null default now()
);

create index failed_join_attempts_ip_hash_attempted_at_idx
on public.failed_join_attempts (ip_hash, attempted_at);

alter table public.failed_join_attempts enable row level security;
