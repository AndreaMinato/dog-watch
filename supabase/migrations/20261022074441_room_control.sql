-- Control events go out through realtime.send in the same transaction as the change, so
-- members only hear about it once it is committed. They are stored in realtime.messages:
-- never put the Chiave in them.

create function public.rotate_room_key(target_room uuid, caller uuid, new_key_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.rooms where id = target_room for update;
  if not exists (
    select 1 from public.room_members
    where room_id = target_room and user_id = caller and role = 'camera'
  ) then
    return false;
  end if;

  update public.rooms set key_hash = new_key_hash where id = target_room;
  delete from public.room_members where room_id = target_room and user_id <> caller;
  perform realtime.send(
    jsonb_build_object('event', jsonb_build_object('type', 'key_rotated', 'by', caller)),
    'control',
    'room:' || target_room,
    true
  );
  return true;
end;
$$;

create function public.close_room(target_room uuid, caller uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.rooms where id = target_room for update;
  if not exists (
    select 1 from public.room_members
    where room_id = target_room and user_id = caller and role = 'camera'
  ) then
    return false;
  end if;

  perform realtime.send(
    jsonb_build_object('event', jsonb_build_object('type', 'room_closed')), 'control', 'room:' || target_room, true
  );
  delete from public.rooms where id = target_room;
  return true;
end;
$$;

revoke execute on function public.rotate_room_key(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.close_room(uuid, uuid) from public, anon, authenticated;
