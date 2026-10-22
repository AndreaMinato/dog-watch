create extension if not exists pg_cron with schema pg_catalog;

create function public.purge_expired()
returns void
language sql
set search_path = ''
as $$
  delete from public.rooms where last_joined_at < now() - interval '30 days';
  delete from public.failed_join_attempts where attempted_at < now() - interval '24 hours';
$$;

revoke execute on function public.purge_expired() from public, anon, authenticated;

select cron.schedule('purge-expired', '0 * * * *', 'select public.purge_expired()');
