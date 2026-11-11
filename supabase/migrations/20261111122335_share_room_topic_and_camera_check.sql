create function private.room_topic(room uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'room:' || room;
$$;

create function private.lock_room_and_check_camera(target_room uuid, caller uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.rooms where id = target_room for update;
  return exists (
    select 1 from public.room_members
    where room_id = target_room and user_id = caller and role = 'camera'
  );
end;
$$;

revoke all on function private.room_topic(uuid) from public, anon, authenticated;
revoke all on function private.lock_room_and_check_camera(uuid, uuid) from public, anon, authenticated;

create or replace function private.is_room_member(topic text)
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
      and topic = private.room_topic(room_id)
  );
$$;

create or replace function public.rotate_room_key(target_room uuid, caller uuid, new_key_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.lock_room_and_check_camera(target_room, caller) then
    return false;
  end if;

  update public.rooms set key_hash = new_key_hash where id = target_room;
  delete from public.room_members where room_id = target_room and user_id <> caller;
  perform realtime.send(
    jsonb_build_object('event', jsonb_build_object('type', 'key_rotated', 'by', caller)),
    'control',
    private.room_topic(target_room),
    true
  );
  return true;
end;
$$;

create or replace function public.close_room(target_room uuid, caller uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.lock_room_and_check_camera(target_room, caller) then
    return false;
  end if;

  perform realtime.send(
    jsonb_build_object('event', jsonb_build_object('type', 'room_closed')), 'control', private.room_topic(target_room), true
  );
  delete from public.rooms where id = target_room;
  return true;
end;
$$;
