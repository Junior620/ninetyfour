-- Cahier v2.2 step 5 (without AI): tactics cell. Two or three game plans per match,
-- linked to a lineup, with their reasons, scenarios, training priorities and review.

create table public.ml_plans (
 id uuid primary key default gen_random_uuid(),
 match_id uuid not null references public.ml_matches(id),
 rank int not null default 1 check(rank between 1 and 3),
 title text not null check(length(btrim(title)) between 2 and 120),
 lineup_id uuid references public.ml_lineups(id),
 block text check(block is null or block in ('high','mid','low')),
 with_ball text not null default '' check(length(with_ball)<=2000),
 without_ball text not null default '' check(length(without_ball)<=2000),
 transitions text not null default '' check(length(transitions)<=2000),
 set_pieces text not null default '' check(length(set_pieces)<=2000),
 scenarios jsonb not null default '[]' check(jsonb_typeof(scenarios)='array' and jsonb_array_length(scenarios)<=6),
 reasons text not null default '' check(length(reasons)<=2000),
 opponent_notes text not null default '' check(length(opponent_notes)<=2000),
 priorities jsonb not null default '[]' check(jsonb_typeof(priorities)='array' and jsonb_array_length(priorities)<=5),
 review jsonb,
 created_by uuid default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 version int not null default 1,
 unique(match_id, rank)
);
alter table public.ml_plans enable row level security;

-- The author is set by the database; a plan stays on its match and its lineup must be
-- one of the same season and category.
create function public.ml_plan_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if coalesce(current_setting('ml.restoring',true),'')='1' then return new; end if;
 if TG_OP='INSERT' then new.created_by=auth.uid();
 elsif new.match_id<>old.match_id or new.created_by is distinct from old.created_by then
  raise exception 'IMMUTABLE_RELATION' using errcode='23514';
 end if;
 if new.lineup_id is not null and not exists(
  select 1 from public.ml_lineups l join public.ml_matches m on m.id=new.match_id
  where l.id=new.lineup_id and l.season_id=m.season_id and l.category_id=m.category_id) then
  raise exception 'INVALID_DATA' using errcode='23514';
 end if;
 return new;
end $$;
create trigger ml_plan_guard before insert or update on public.ml_plans for each row execute function public.ml_plan_guard();
create trigger ml_guard before insert or update on public.ml_plans for each row execute function public.ml_guard();
create trigger ml_plans_touch_updated_at before update on public.ml_plans for each row execute function public.ml_touch_updated_at();
create trigger ml_audit after insert or update on public.ml_plans for each row execute function public.ml_audit_change();

-- Internal staff work: writers of the match only.
create policy plans_read on public.ml_plans for select to authenticated using(ml_match_access(match_id,true));
create policy plans_write on public.ml_plans for all to authenticated using(ml_match_access(match_id,true)) with check(ml_match_access(match_id,true));
grant select,insert,update on public.ml_plans to authenticated;

-- Removing an alternative plan is audited with its content.
create function public.ml_remove_plan(plan uuid) returns void language plpgsql security definer set search_path='' as $$
declare p public.ml_plans;
begin
 select * into p from public.ml_plans where id=plan;
 if p.id is null or not public.ml_match_access(p.match_id,true) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 delete from public.ml_plans where id=plan;
 insert into public.ml_audit(user_id,action,resource,resource_id,details)
 values(auth.uid(),'PLAN_REMOVED','plan',plan::text,to_jsonb(p));
end $$;
revoke all on function public.ml_remove_plan(uuid) from public,anon;
grant execute on function public.ml_remove_plan(uuid) to authenticated;

-- Generic save accepts plans.
create or replace function public.ml_save(kind text, payload jsonb, expected int) returns jsonb language plpgsql security invoker set search_path = '' as $$
 declare tbl text; row_data jsonb; result jsonb; rid uuid; cols text;
 begin
 if not public.ml_active() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if kind not in ('matches','players','memberships','evaluations','markers','consents','targets','lineups','requirements','trials','live_sessions','plans') then raise exception 'INVALID_KIND'; end if;
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

-- Restoration includes plans (after the lineups they point to).
create or replace function public.ml_restore(data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare kind text; item jsonb; cols text; collision boolean; inserted int=0;
 begin
 if not public.ml_direction() or not public.ml_permission('export') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if jsonb_array_length(coalesce(data->'media','[]'))>0 and not public.ml_permission('media') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform pg_advisory_xact_lock(910002);
 perform set_config('ml.restoring','1',true);
 foreach kind in array array['seasons','players','memberships','matches','videos','evaluations','markers','consents','media','reports','targets','lineups','requirements','trials','dossiers','live_sessions','plans'] loop
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
