-- Cahier v2.2 step 4: live match without recording. Only the session (phases, notes,
-- frozen summaries) and the timestamped events (ml_markers, source 'live') persist.

create table public.ml_live_sessions (
 id uuid primary key default gen_random_uuid(),
 match_id uuid not null unique references public.ml_matches(id),
 status text not null default 'ready' check(status in ('ready','first_half','half_time','second_half','finished')),
 present uuid[] not null default '{}' check(cardinality(present)<=60),
 first_half_at timestamptz,
 half_time_at timestamptz,
 second_half_at timestamptz,
 finished_at timestamptz,
 notes jsonb not null default '[]' check(jsonb_typeof(notes)='array' and jsonb_array_length(notes)<=300),
 half_summary jsonb,
 final_summary jsonb,
 created_by uuid default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 version int not null default 1,
 check(half_time_at is null or (first_half_at is not null and half_time_at>=first_half_at)),
 check(second_half_at is null or (half_time_at is not null and second_half_at>=half_time_at)),
 check(finished_at is null or first_half_at is not null)
);
alter table public.ml_live_sessions enable row level security;

-- Phases only move forward; each phase needs its own timestamp (taken on the device, so a
-- kickoff tapped offline keeps its real time) and a finished session is frozen.
create function public.ml_live_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare
 rank_new int = array_position(array['ready','first_half','half_time','second_half','finished'], new.status);
 rank_old int;
begin
 if coalesce(current_setting('ml.restoring',true),'')='1' then return new; end if;
 if (new.first_half_at>now()+interval '10 minutes') or (new.half_time_at>now()+interval '10 minutes')
  or (new.second_half_at>now()+interval '10 minutes') or (new.finished_at>now()+interval '10 minutes') then
  raise exception 'INVALID_DATA' using errcode='23514';
 end if;
 -- A match stopped early may finish without a second half.
 if (rank_new>=2 and new.first_half_at is null) or (rank_new=3 and new.half_time_at is null)
  or (rank_new=4 and new.second_half_at is null) or (rank_new=5 and new.finished_at is null) then
  raise exception 'INVALID_DATA' using errcode='23514';
 end if;
 if TG_OP='INSERT' then
  new.created_by=auth.uid();
  return new;
 end if;
 rank_old = array_position(array['ready','first_half','half_time','second_half','finished'], old.status);
 if old.status='finished' then raise exception 'IMMUTABLE_DECISION' using errcode='23514'; end if;
 if new.match_id<>old.match_id or new.created_by is distinct from old.created_by then raise exception 'IMMUTABLE_RELATION' using errcode='23514'; end if;
 if rank_new<rank_old then raise exception 'INVALID_DATA' using errcode='23514'; end if;
 -- Timestamps of past phases and a frozen half-time summary do not change.
 if (old.first_half_at is not null and new.first_half_at is distinct from old.first_half_at)
  or (old.half_time_at is not null and new.half_time_at is distinct from old.half_time_at)
  or (old.second_half_at is not null and new.second_half_at is distinct from old.second_half_at)
  or (old.half_summary is not null and new.half_summary is distinct from old.half_summary) then
  raise exception 'IMMUTABLE_DECISION' using errcode='23514';
 end if;
 return new;
end $$;
create trigger ml_live_guard before insert or update on public.ml_live_sessions for each row execute function public.ml_live_guard();
create trigger ml_guard before insert or update on public.ml_live_sessions for each row execute function public.ml_guard();
create trigger ml_live_touch_updated_at before update on public.ml_live_sessions for each row execute function public.ml_touch_updated_at();
create trigger ml_audit after insert or update on public.ml_live_sessions for each row execute function public.ml_audit_change();

-- Internal staff observations: writers of the match only, never readers.
create policy live_read on public.ml_live_sessions for select to authenticated using(ml_match_access(match_id,true));
create policy live_write on public.ml_live_sessions for all to authenticated using(ml_match_access(match_id,true)) with check(ml_match_access(match_id,true));
grant select,insert,update on public.ml_live_sessions to authenticated;

-- Undo for a live event while its session is still running; the removal is audited.
create function public.ml_remove_live_event(event uuid) returns void language plpgsql security definer set search_path='' as $$
declare m public.ml_markers;
begin
 select * into m from public.ml_markers where id=event;
 if m.id is null or m.source<>'live' or not public.ml_match_access(m.match_id,true) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if exists(select 1 from public.ml_live_sessions s where s.match_id=m.match_id and s.status='finished') then
  raise exception 'IMMUTABLE_DECISION' using errcode='23514';
 end if;
 delete from public.ml_markers where id=event;
 insert into public.ml_audit(user_id,action,resource,resource_id,details)
 values(auth.uid(),'LIVE_EVENT_REMOVED','marker',event::text,jsonb_build_object('match_id',m.match_id,'kind',m.kind,'minute',m.minute,'player_id',m.player_id));
end $$;
revoke all on function public.ml_remove_live_event(uuid) from public,anon;
grant execute on function public.ml_remove_live_event(uuid) to authenticated;

-- Generic save accepts live sessions.
create or replace function public.ml_save(kind text, payload jsonb, expected int) returns jsonb language plpgsql security invoker set search_path = '' as $$
 declare tbl text; row_data jsonb; result jsonb; rid uuid; cols text;
 begin
 if not public.ml_active() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if kind not in ('matches','players','memberships','evaluations','markers','consents','targets','lineups','requirements','trials','live_sessions') then raise exception 'INVALID_KIND'; end if;
 tbl='ml_'||kind; rid=coalesce((payload->>'id')::uuid,gen_random_uuid());
 execute format('select to_jsonb(t) from public.%I t where id=$1 for update',tbl) into row_data using rid;
 if row_data is null then
 if expected<>0 or kind in ('players','memberships') then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 select string_agg(format('%I',key),',') into cols from jsonb_object_keys(payload||jsonb_build_object('id',rid,'version',1)) key;
 execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) returning to_jsonb(%I.*)',tbl,cols,cols,tbl,tbl) into result using payload||jsonb_build_object('id',rid,'version',1);
 else
 if kind='trials' then raise exception 'IMMUTABLE_DECISION' using errcode='23514'; end if;
 if (row_data->>'version')::int<>expected then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 select string_agg(format('%I=r.%I',key,key),',') into cols from jsonb_object_keys(payload||jsonb_build_object('version',expected+1)) key where key<>'id';
 execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$1) r where t.id=$2 returning to_jsonb(t)',tbl,cols,tbl) into result using row_data||payload||jsonb_build_object('version',expected+1),rid;
 end if;
 return result;
 end $$;

-- Restoration includes live sessions.
create or replace function public.ml_restore(data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare kind text; item jsonb; cols text; collision boolean; inserted int=0;
 begin
 if not public.ml_direction() or not public.ml_permission('export') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if jsonb_array_length(coalesce(data->'media','[]'))>0 and not public.ml_permission('media') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform pg_advisory_xact_lock(910002);
 perform set_config('ml.restoring','1',true);
 foreach kind in array array['seasons','players','memberships','matches','videos','evaluations','markers','consents','media','reports','targets','lineups','requirements','trials','dossiers','live_sessions'] loop
 for item in select value from jsonb_array_elements(coalesce(data->kind,'[]')) loop
 if kind='requirements' and exists(select 1 from public.ml_requirements r where r.category_id=item->>'category_id' and r.position=item->>'position' and r.criterion=item->>'criterion') then continue;end if;
 execute format('select exists(select 1 from public.%I where id=$1)','ml_'||kind) into collision using (item->>'id')::uuid;
 if collision then raise exception 'IMPORT_COLLISION' using errcode='23505';end if;
 if kind='reports' then item=item||jsonb_build_object('source_author',item->>'created_by','created_by',auth.uid(),'validated_by',null,'validated_at',null);end if;
 select string_agg(format('%I',key),',') into cols from jsonb_object_keys(item) key;
 execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1)','ml_'||kind,cols,cols,'ml_'||kind) using item;
 inserted=inserted+1;
 end loop;
 end loop;
 insert into public.ml_audit(user_id,action,resource,details) values(auth.uid(),'IMPORT_OK','archive',jsonb_build_object('records',inserted));
 return jsonb_build_object('records',inserted);
 end $$;
