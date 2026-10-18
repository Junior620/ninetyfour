-- Cahier v2.2 step 2: lineup scenarios, category requirements and staff trial decisions.

-- Lineup scenarios: formation, placed players with role and instructions, bench.
create table public.ml_lineups (
 id uuid primary key default gen_random_uuid(),
 season_id uuid not null references public.ml_seasons(id),
 category_id text not null references public.ml_categories(id),
 name text not null check(length(name) between 2 and 120),
 kind text not null default 'team' check(kind in ('team','rotation','alternative','matchday')),
 formation text not null check(formation in ('4-3-3','4-4-2','4-2-3-1','3-5-2')),
 slots jsonb not null default '{}' check(jsonb_typeof(slots)='object' and octet_length(slots::text)<=20000),
 bench jsonb not null default '[]' check(jsonb_typeof(bench)='array' and jsonb_array_length(bench)<=30),
 notes text not null default '' check(length(notes)<=2000),
 match_id uuid references public.ml_matches(id),
 version int not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

-- Requirements per category, position and questionnaire criterion, set by the direction.
create table public.ml_requirements (
 id uuid primary key default gen_random_uuid(),
 category_id text not null references public.ml_categories(id),
 position text not null check(position in ('GK','CB','FB','DM','CM','AM','WG','ST')),
 criterion text not null check(criterion ~ '^(common:q[1-6]|specific:q[1-5])$'),
 level int check(level between 1 and 5),
 min_matches int not null default 3 check(min_matches between 1 and 20),
 version int not null default 1,
 unique(category_id,position,criterion)
);

-- Staff decisions on a category trial: append-only, with the comparison they relied on.
create table public.ml_trials (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.ml_players(id),
 from_category text not null references public.ml_categories(id),
 to_category text not null references public.ml_categories(id),
 position text not null check(position in ('GK','CB','FB','DM','CM','AM','WG','ST')),
 proposal text not null check(proposal in ('plan','confirm','progress','none')),
 decision text not null check(decision in ('plan','confirm','progress','dismissed')),
 reason text not null default '' check(length(reason)<=2000),
 snapshot jsonb not null default '{}' check(jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=50000),
 decided_by uuid,
 decided_at timestamptz not null default now(),
 version int not null default 1,
 check(decision=proposal or decision='dismissed' or length(reason)>=3)
);

-- Players placed in a scenario must be readable by the author; slot content stays small.
create function public.ml_lineup_guard() returns trigger language plpgsql set search_path='' as $$
declare slot record; pid uuid;
begin
 for slot in select key, value from jsonb_each(new.slots) loop
  if slot.key !~ '^[a-z0-9-]{1,16}$' or jsonb_typeof(slot.value)<>'object' then raise exception 'INVALID_DATA' using errcode='22023';end if;
  if length(coalesce(slot.value->>'role',''))>80 or length(coalesce(slot.value->>'instructions',''))>500 then raise exception 'INVALID_DATA' using errcode='22023';end if;
  pid=(slot.value->>'player_id')::uuid;
  if pid is not null and not public.ml_player_access(pid) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 end loop;
 for pid in select (value#>>'{}')::uuid from jsonb_array_elements(new.bench) loop
  if not public.ml_player_access(pid) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 end loop;
 if new.match_id is not null and not public.ml_match_access(new.match_id) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 return new;
end $$;
create trigger ml_lineup_guard before insert or update on public.ml_lineups for each row execute function public.ml_lineup_guard();
create trigger ml_lineups_touch_updated_at before update on public.ml_lineups for each row execute function public.ml_touch_updated_at();

-- The decision author is the signed-in staff member, never a client-supplied value;
-- a restoration keeps the original author and date.
create function public.ml_trial_author() returns trigger language plpgsql set search_path='' as $$
begin
 if coalesce(current_setting('ml.restoring',true),'')<>'1' then new.decided_by=auth.uid(); new.decided_at=now(); end if;
 return new;
end $$;
create trigger ml_trial_author before insert on public.ml_trials for each row execute function public.ml_trial_author();

do $$ declare t text; begin foreach t in array array['lineups','requirements','trials'] loop
 execute format('create trigger ml_guard before insert or update on public.ml_%I for each row execute function public.ml_guard()',t);
 execute format('create trigger ml_audit after insert or update on public.ml_%I for each row execute function public.ml_audit_change()',t);
 execute format('alter table public.ml_%I enable row level security',t);
 end loop; end $$;
-- Same guard as 202610150008 (JSON field access), extended to lineups.
create or replace function public.ml_immutable_relations() returns trigger language plpgsql set search_path='' as $$
declare n jsonb=to_jsonb(new);o jsonb=to_jsonb(old);begin
 if TG_TABLE_NAME in ('ml_memberships','ml_consents','ml_media') and n->>'player_id' is distinct from o->>'player_id' then raise exception 'IMMUTABLE_RELATION' using errcode='23514';end if;
 if TG_TABLE_NAME in ('ml_memberships','ml_matches','ml_targets','ml_lineups') and (n->>'season_id' is distinct from o->>'season_id' or n->>'category_id' is distinct from o->>'category_id') then raise exception 'IMMUTABLE_SCOPE' using errcode='23514';end if;
 if TG_TABLE_NAME in ('ml_evaluations','ml_markers') and n->>'match_id' is distinct from o->>'match_id' then raise exception 'IMMUTABLE_RELATION' using errcode='23514';end if;
 if TG_TABLE_NAME='ml_evaluations' and (n->>'player_id' is distinct from o->>'player_id' or n->>'position' is distinct from o->>'position' or n->>'questionnaire_version' is distinct from o->>'questionnaire_version') then raise exception 'IMMUTABLE_EVALUATION_KEY' using errcode='23514';end if;
 return new;
end $$;
create trigger immutable_relations before update on public.ml_lineups for each row execute function public.ml_immutable_relations();

create policy lineups_read on public.ml_lineups for select to authenticated using(ml_scope(season_id,category_id));
create policy lineups_write on public.ml_lineups for all to authenticated using(ml_scope(season_id,category_id,true)) with check(ml_scope(season_id,category_id,true));
create policy requirements_read on public.ml_requirements for select to authenticated using(ml_active());
create policy requirements_write on public.ml_requirements for all to authenticated using(ml_direction()) with check(ml_direction());
create policy trials_read on public.ml_trials for select to authenticated using(ml_player_access(player_id));
create policy trials_insert on public.ml_trials for insert to authenticated with check(ml_player_access(player_id,true));
grant insert,update on public.ml_lineups,public.ml_requirements to authenticated;
grant insert on public.ml_trials to authenticated;
grant select on public.ml_lineups,public.ml_requirements,public.ml_trials to authenticated;

-- Generic save also covers the new kinds (RLS and triggers still decide).
create or replace function public.ml_save(kind text, payload jsonb, expected int) returns jsonb language plpgsql security invoker set search_path = '' as $$
 declare tbl text; row_data jsonb; result jsonb; rid uuid; cols text;
 begin
 if not public.ml_active() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if kind not in ('matches','players','memberships','evaluations','markers','consents','targets','lineups','requirements','trials') then raise exception 'INVALID_KIND'; end if;
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

-- Restoration includes the new tables; requirements already defined for the same key are kept.
create or replace function public.ml_restore(data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare kind text; item jsonb; cols text; collision boolean; inserted int=0;
 begin
 if not public.ml_direction() or not public.ml_permission('export') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if jsonb_array_length(coalesce(data->'media','[]'))>0 and not public.ml_permission('media') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform pg_advisory_xact_lock(910002);
 perform set_config('ml.restoring','1',true);
 foreach kind in array array['seasons','players','memberships','matches','evaluations','markers','consents','media','reports','targets','lineups','requirements','trials'] loop
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
