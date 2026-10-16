-- Additive only. No existing club table, auth account or storage object is changed.
create table public.ml_members (
 user_id uuid primary key references auth.users(id), role text not null check(role in ('direction','staff','reader')),
 active boolean not null default true, permissions text[] not null default '{}', version int not null default 1,
 check(permissions <@ array['export','media','site_editor','site_publisher'])
);
create table public.ml_sessions (id uuid primary key, user_id uuid not null references public.ml_members(user_id), expires_at timestamptz not null default now()+interval '12 hours', revoked_at timestamptz);
create table public.ml_seasons (id uuid primary key default gen_random_uuid(), name text not null unique, starts_on date not null, ends_on date not null, version int not null default 1, check(ends_on > starts_on));
create table public.ml_categories (id text primary key check(id in ('U-14','U-16','U-17','U-18')), name text not null);
insert into public.ml_categories values ('U-14','U-14'),('U-16','U-16'),('U-17','U-17'),('U-18','U-18');
create table public.ml_scopes (user_id uuid references public.ml_members(user_id), season_id uuid references public.ml_seasons(id), category_id text references public.ml_categories(id), primary key(user_id,season_id,category_id));
create table public.ml_shares (user_id uuid references public.ml_members(user_id), kind text check(kind in ('match','player')), resource_id uuid, primary key(user_id,kind,resource_id));
create table public.ml_players (
 id uuid primary key default gen_random_uuid(), full_name text not null check(length(full_name) between 2 and 120),
 usual_position text not null check(usual_position in ('GK','CB','FB','DM','CM','AM','WG','ST')),
 strong_foot text not null check(strong_foot in ('right','left','both')), status text not null default 'active' check(status in ('active','injured','inactive','trial')),
 scouting text not null default '' check(length(scouting)<=5000), fundamentals jsonb not null default '{}', target_profile text not null default '',
 version int not null default 1, created_at timestamptz not null default now()
);
create table public.ml_memberships (
 id uuid primary key default gen_random_uuid(), player_id uuid not null references public.ml_players(id), season_id uuid not null references public.ml_seasons(id), category_id text not null references public.ml_categories(id),
 jersey int not null check(jersey between 1 and 99), version int not null default 1, unique(player_id,season_id,category_id)
);
create table public.ml_matches (
 id uuid primary key default gen_random_uuid(), season_id uuid not null references public.ml_seasons(id), category_id text not null references public.ml_categories(id),
 opponent text not null check(length(opponent) between 2 and 160), played_on date not null, competition text not null default '', venue text not null default '',
 home_score int check(home_score between 0 and 99), away_score int check(away_score between 0 and 99), status text not null default 'draft' check(status in ('draft','evaluated','reviewed')),
 context text not null default '', circumstances jsonb not null default '{}', collective jsonb not null default '{}', video_name text,
 version int not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.ml_questionnaires (id text primary key, content jsonb not null, created_at timestamptz not null default now());
create table public.ml_evaluations (
 id uuid primary key default gen_random_uuid(), match_id uuid not null references public.ml_matches(id), player_id uuid not null references public.ml_players(id),
 position text not null check(position in ('GK','CB','FB','DM','CM','AM','WG','ST')), questionnaire_version text not null default 'pdf-1.1',
 common jsonb not null default '{}', specific jsonb not null default '{}', observation text not null default '', priorities text not null default '',
 minutes int check(minutes between 0 and 150), version int not null default 1, unique(match_id,player_id,position)
);
create table public.ml_markers (
 id uuid primary key default gen_random_uuid(), match_id uuid not null references public.ml_matches(id), player_id uuid references public.ml_players(id),
 seconds numeric not null check(seconds>=0 and seconds<=86400), kind text not null check(kind in ('positive','correction','chance','transition')),
 position text check(position in ('GK','CB','FB','DM','CM','AM','WG','ST')), theme text not null default '', observation text not null default '', version int not null default 1
);
create table public.ml_reports (id uuid primary key default gen_random_uuid(), match_id uuid not null references public.ml_matches(id), revision int not null, snapshot jsonb not null, correction text not null default '', created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), validated_by uuid references auth.users(id), validated_at timestamptz, unique(match_id,revision));
create table public.ml_alerts (id uuid primary key default gen_random_uuid(), match_id uuid not null unique references public.ml_matches(id), event text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.ml_alert_reads (alert_id uuid references public.ml_alerts(id), user_id uuid references auth.users(id), read_at timestamptz not null default now(), primary key(alert_id,user_id));
create table public.ml_settings (id text primary key default 'governance' check(id='governance'), retention_days int check(retention_days>0), consent_policy text, version int not null default 1);
insert into public.ml_settings(id) values ('governance');
create table public.ml_consents (id uuid primary key default gen_random_uuid(), player_id uuid not null references public.ml_players(id), guardian_name text not null, purpose text not null check(purpose in ('internal_photo','export_photo')), policy text not null, granted_at timestamptz not null, expires_at timestamptz not null, revoked_at timestamptz, version int not null default 1, check(expires_at>granted_at));
create table public.ml_media (id uuid primary key default gen_random_uuid(), player_id uuid not null references public.ml_players(id), consent_id uuid not null references public.ml_consents(id), path text not null unique, mime text not null check(mime in ('image/jpeg','image/png','application/pdf')), purpose text not null check(purpose in ('photo','proof')), bytes int not null check(bytes>0 and bytes<=10485760), sha256 text not null, created_at timestamptz not null default now(), version int not null default 1);
create table public.ml_targets (id uuid primary key default gen_random_uuid(), season_id uuid not null references public.ml_seasons(id), category_id text not null references public.ml_categories(id), position text not null, title text not null, fundamentals jsonb not null default '{}', notes text not null default '', version int not null default 1);
create table public.ml_articles (id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), draft jsonb not null, published jsonb, version int not null default 1, updated_at timestamptz not null default now());
create table public.ml_article_revisions (id uuid primary key default gen_random_uuid(), article_id uuid not null references public.ml_articles(id), version int not null, draft jsonb not null, published jsonb, author uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(article_id,version));
create table public.ml_audit (id bigint generated always as identity primary key, user_id uuid, action text not null, resource text not null, resource_id text, details jsonb not null default '{}', created_at timestamptz not null default now());
create table public.ml_rate_limits (key text primary key, window_at timestamptz not null, count int not null);
create table public.ml_push (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), subscription jsonb not null, created_at timestamptz not null default now());

-- A dedicated, registered MatchLab session is mandatory even with a valid Auth JWT.
create function public.ml_active() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.ml_members m join public.ml_sessions s on s.user_id=m.user_id
 where m.user_id=auth.uid() and m.active and s.id=(auth.jwt()->>'session_id')::uuid and s.revoked_at is null and s.expires_at>now()
 and exists(select 1 from auth.sessions a where a.id=s.id and a.user_id=m.user_id));
$$;
create function public.ml_direction() returns boolean language sql stable security definer set search_path = '' as $$ select public.ml_active() and exists(select 1 from public.ml_members where user_id=auth.uid() and role='direction'); $$;
create function public.ml_permission(p text) returns boolean language sql stable security definer set search_path = '' as $$ select public.ml_active() and exists(select 1 from public.ml_members where user_id=auth.uid() and p=any(permissions)); $$;
create function public.ml_scope(s uuid,c text,writing boolean default false) returns boolean language sql stable security definer set search_path = '' as $$
 select public.ml_active() and (public.ml_direction() or exists(select 1 from public.ml_scopes a join public.ml_members m on m.user_id=a.user_id where a.user_id=auth.uid() and a.season_id=s and a.category_id=c and m.role='staff'));
$$;
create function public.ml_match_access(m uuid,writing boolean default false) returns boolean language sql stable security definer set search_path = '' as $$
 select public.ml_active() and exists(select 1 from public.ml_matches x where x.id=m and (public.ml_scope(x.season_id,x.category_id,writing) or (not writing and exists(select 1 from public.ml_shares where user_id=auth.uid() and kind='match' and resource_id=m))));
$$;
create function public.ml_player_access(p uuid,writing boolean default false) returns boolean language sql stable security definer set search_path = '' as $$
 select public.ml_active() and (public.ml_direction() or exists(select 1 from public.ml_memberships x where x.player_id=p and public.ml_scope(x.season_id,x.category_id,writing)) or (not writing and exists(select 1 from public.ml_shares where user_id=auth.uid() and kind='player' and resource_id=p)));
$$;
create function public.ml_rate(k text, maximum int, seconds int) returns boolean language plpgsql security definer set search_path = '' as $$
 declare n int;
 begin
 insert into public.ml_rate_limits values(k,now(),1) on conflict(key) do update set count=case when ml_rate_limits.window_at<now()-make_interval(secs=>seconds) then 1 else ml_rate_limits.count+1 end, window_at=case when ml_rate_limits.window_at<now()-make_interval(secs=>seconds) then now() else ml_rate_limits.window_at end returning count into n;
 return n<=maximum;
 end $$;
revoke all on function public.ml_rate(text,int,int) from public,anon,authenticated;
grant execute on function public.ml_rate(text,int,int) to service_role;
create function public.ml_register_session() returns void language plpgsql security definer set search_path = '' as $$
 begin
 if not exists(select 1 from public.ml_members where user_id=auth.uid() and active) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if not exists(select 1 from auth.sessions where id=(auth.jwt()->>'session_id')::uuid and user_id=auth.uid()) then raise exception 'UNAUTHENTICATED' using errcode='42501'; end if;
 insert into public.ml_sessions(id,user_id) values((auth.jwt()->>'session_id')::uuid,auth.uid()) on conflict do nothing;
 end $$;
create function public.ml_logout() returns void language sql security definer set search_path = '' as $$ update public.ml_sessions set revoked_at=now() where user_id=auth.uid() and id=(auth.jwt()->>'session_id')::uuid; $$;

-- Default deny on every new table; mutations have symmetric old/new scope checks.
do $$ declare t text; begin
 foreach t in array array['members','sessions','seasons','categories','scopes','shares','players','memberships','matches','questionnaires','evaluations','markers','reports','alerts','alert_reads','settings','consents','media','targets','articles','article_revisions','audit','rate_limits','push'] loop
 execute format('alter table public.ml_%I enable row level security',t);
 execute format('revoke all on public.ml_%I from anon, authenticated',t);
 execute format('grant select on public.ml_%I to authenticated',t);
 end loop;
end $$;
create policy members_read on public.ml_members for select to authenticated using(ml_active() and (user_id=auth.uid() or ml_direction()));
create policy sessions_read on public.ml_sessions for select to authenticated using(ml_direction());
create policy scopes_read on public.ml_scopes for select to authenticated using(ml_active() and (user_id=auth.uid() or ml_direction()));
create policy shares_read on public.ml_shares for select to authenticated using(ml_active() and (user_id=auth.uid() or ml_direction()));
create policy seasons_read on public.ml_seasons for select to authenticated using(ml_active());
create policy categories_read on public.ml_categories for select to authenticated using(ml_active());
create policy questionnaires_read on public.ml_questionnaires for select to authenticated using(ml_active());
create policy settings_read on public.ml_settings for select to authenticated using(ml_active());
create policy players_read on public.ml_players for select to authenticated using(ml_player_access(id));
create policy players_update on public.ml_players for update to authenticated using(ml_player_access(id,true)) with check(ml_player_access(id,true));
create policy memberships_read on public.ml_memberships for select to authenticated using(ml_scope(season_id,category_id) or (ml_player_access(player_id) and exists(select 1 from ml_shares where user_id=auth.uid() and kind='player' and resource_id=player_id)));
create policy memberships_update on public.ml_memberships for update to authenticated using(ml_scope(season_id,category_id,true)) with check(ml_scope(season_id,category_id,true));
create policy matches_read on public.ml_matches for select to authenticated using(ml_match_access(id));
create policy matches_insert on public.ml_matches for insert to authenticated with check(ml_scope(season_id,category_id,true));
create policy matches_update on public.ml_matches for update to authenticated using(ml_scope(season_id,category_id,true)) with check(ml_scope(season_id,category_id,true));
create policy evaluations_read on public.ml_evaluations for select to authenticated using(ml_match_access(match_id) and ml_player_access(player_id));
create policy evaluations_write on public.ml_evaluations for all to authenticated using(ml_match_access(match_id,true) and ml_player_access(player_id,true)) with check(ml_match_access(match_id,true) and ml_player_access(player_id,true));
create policy markers_read on public.ml_markers for select to authenticated using(ml_match_access(match_id) and (player_id is null or ml_player_access(player_id)));
create policy markers_write on public.ml_markers for all to authenticated using(ml_match_access(match_id,true) and (player_id is null or ml_player_access(player_id,true))) with check(ml_match_access(match_id,true) and (player_id is null or ml_player_access(player_id,true)));
create policy reports_read on public.ml_reports for select to authenticated using(ml_match_access(match_id) and not exists(select 1 from jsonb_array_elements(snapshot->'evaluations') e where not ml_player_access((e->>'player_id')::uuid)));
create policy alerts_read on public.ml_alerts for select to authenticated using(ml_match_access(match_id));
create policy reads_own on public.ml_alert_reads for all to authenticated using(user_id=auth.uid() and exists(select 1 from ml_alerts where id=alert_id)) with check(user_id=auth.uid() and exists(select 1 from ml_alerts where id=alert_id));
create policy consents_read on public.ml_consents for select to authenticated using(ml_permission('media') and ml_player_access(player_id));
create policy consents_write on public.ml_consents for all to authenticated using(ml_permission('media') and ml_player_access(player_id,true)) with check(ml_permission('media') and ml_player_access(player_id,true));
create policy media_read on public.ml_media for select to authenticated using(ml_permission('media') and ml_player_access(player_id) and exists(select 1 from ml_consents c where c.id=consent_id and c.player_id=ml_media.player_id and c.revoked_at is null and c.expires_at>now()));
create policy targets_read on public.ml_targets for select to authenticated using(ml_scope(season_id,category_id));
create policy targets_write on public.ml_targets for all to authenticated using(ml_scope(season_id,category_id,true)) with check(ml_scope(season_id,category_id,true));
create policy articles_read on public.ml_articles for select to authenticated using(ml_permission('site_editor') or ml_permission('site_publisher'));
create policy article_revisions_read on public.ml_article_revisions for select to authenticated using(ml_permission('site_editor') or ml_permission('site_publisher'));
create policy audit_read on public.ml_audit for select to authenticated using(ml_direction());
create policy push_own on public.ml_push for all to authenticated using(ml_active() and user_id=auth.uid()) with check(ml_active() and user_id=auth.uid());
grant insert,update on public.ml_matches,public.ml_evaluations,public.ml_markers,public.ml_consents,public.ml_targets to authenticated;
grant update on public.ml_players,public.ml_memberships to authenticated;
grant insert,delete on public.ml_push,public.ml_alert_reads to authenticated;

create function public.ml_valid_answers(a jsonb,n int) returns boolean language sql immutable as $$
 select jsonb_typeof(a)='object' and not exists(select 1 from jsonb_each(a) e where e.key !~ '^q[1-6]$' or substring(e.key from 2)::int>n or (e.value<>'null'::jsonb and (jsonb_typeof(e.value)<>'number' or e.value::text !~ '^[1-5]$')));
$$;
alter table public.ml_matches add check(public.ml_valid_answers(collective,5));
alter table public.ml_evaluations add check(public.ml_valid_answers(common,6) and public.ml_valid_answers(specific,5) and questionnaire_version='pdf-1.1');

create function public.ml_guard() returns trigger language plpgsql security definer set search_path = '' as $$
 begin
 if TG_OP='UPDATE' then
 if new.id<>old.id then raise exception 'IMMUTABLE_ID'; end if;
 if new.version<>old.version+1 then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 end if;
 if TG_TABLE_NAME in ('ml_evaluations','ml_markers') then
 if new.player_id is not null then
 if not exists(select 1 from public.ml_memberships p join public.ml_matches m on p.season_id=m.season_id and p.category_id=m.category_id where p.player_id=new.player_id and m.id=new.match_id) then raise exception 'PLAYER_OUTSIDE_MATCH_SCOPE' using errcode='23514'; end if;
 end if;
 end if;
 return new;
 end $$;
create function public.ml_audit_change() returns trigger language plpgsql security definer set search_path = '' as $$
 begin
 insert into public.ml_audit(user_id,action,resource,resource_id,details) values(auth.uid(),TG_OP,TG_TABLE_NAME,new.id::text,jsonb_build_object('version',new.version));
 if TG_TABLE_NAME='ml_evaluations' then
 insert into public.ml_alerts(match_id,event) values(new.match_id,'EVALUATION_SAVED') on conflict(match_id) do update set updated_at=now();
 end if;
 return new;
 end $$;
do $$ declare t text; begin foreach t in array array['players','memberships','matches','evaluations','markers','consents','media','targets','articles'] loop
 execute format('create trigger ml_guard before insert or update on public.ml_%I for each row execute function public.ml_guard()',t);
 execute format('create trigger ml_audit after insert or update on public.ml_%I for each row execute function public.ml_audit_change()',t);
 end loop; end $$;

create function public.ml_save(kind text, payload jsonb, expected int) returns jsonb language plpgsql security invoker set search_path = '' as $$
 declare tbl text; row_data jsonb; result jsonb; rid uuid; cols text;
 begin
 if not public.ml_active() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if kind not in ('matches','players','memberships','evaluations','markers','consents','targets') then raise exception 'INVALID_KIND'; end if;
 tbl='ml_'||kind; rid=coalesce((payload->>'id')::uuid,gen_random_uuid());
 execute format('select to_jsonb(t) from public.%I t where id=$1 for update',tbl) into row_data using rid;
 if row_data is null then
 if expected<>0 or kind in ('players','memberships') then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 select string_agg(format('%I',key),',') into cols from jsonb_object_keys(payload||jsonb_build_object('id',rid,'version',1)) key;
 execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) returning to_jsonb(%I.*)',tbl,cols,cols,tbl,tbl) into result using payload||jsonb_build_object('id',rid,'version',1);
 else
 if (row_data->>'version')::int<>expected then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 select string_agg(format('%I=r.%I',key,key),',') into cols from jsonb_object_keys(payload||jsonb_build_object('version',expected+1)) key where key<>'id';
 execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$1) r where t.id=$2 returning to_jsonb(t)',tbl,cols,tbl) into result using row_data||payload||jsonb_build_object('version',expected+1),rid;
 end if;
 return result;
 end $$;

create function public.ml_create_player(payload jsonb, membership jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
 declare p public.ml_players; m public.ml_memberships;
 begin
 if not public.ml_scope((membership->>'season_id')::uuid,membership->>'category_id',true) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 insert into public.ml_players(full_name,usual_position,strong_foot,status,scouting,fundamentals,target_profile) values(payload->>'full_name',payload->>'usual_position',payload->>'strong_foot',coalesce(payload->>'status','active'),coalesce(payload->>'scouting',''),coalesce(payload->'fundamentals','{}'),coalesce(payload->>'target_profile','')) returning * into p;
 insert into public.ml_memberships(player_id,season_id,category_id,jersey) values(p.id,(membership->>'season_id')::uuid,membership->>'category_id',(membership->>'jersey')::int) returning * into m;
 return jsonb_build_object('player',to_jsonb(p),'membership',to_jsonb(m),'jersey_warning',exists(select 1 from public.ml_memberships where season_id=m.season_id and category_id=m.category_id and jersey=m.jersey and player_id<>p.id));
 end $$;

create function public.ml_report(match uuid, expected int, correction text default '', validate boolean default false) returns jsonb language plpgsql security definer set search_path = '' as $$
 declare m public.ml_matches; r public.ml_reports; data jsonb; rev int;
 begin
 if not public.ml_match_access(match,true) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 select * into m from public.ml_matches where id=match for update;
 if m.version<>expected then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 select coalesce(max(revision),0)+1 into rev from public.ml_reports where match_id=match;
 select jsonb_build_object('match',to_jsonb(m),'evaluations',coalesce((select jsonb_agg(to_jsonb(e)) from public.ml_evaluations e where match_id=match),'[]'),'players',coalesce((select jsonb_agg(to_jsonb(p)) from public.ml_players p where id in(select player_id from public.ml_evaluations where match_id=match)),'[]'),'markers',coalesce((select jsonb_agg(to_jsonb(v)) from public.ml_markers v where match_id=match),'[]')) into data;
 insert into public.ml_reports(match_id,revision,snapshot,correction,created_by,validated_by,validated_at) values(match,rev,data,correction,auth.uid(),case when validate then auth.uid() end,case when validate then now() end) returning * into r;
 insert into public.ml_audit(user_id,action,resource,resource_id) values(auth.uid(),case when validate then 'REPORT_VALIDATED' else 'REPORT_REVISION' end,'ml_reports',r.id::text);
 return to_jsonb(r);
 end $$;

-- Private storage has no direct authenticated object access. A checked API streams files.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('matchlab-private','matchlab-private',false,10485760,array['image/jpeg','image/png','application/pdf']);
-- Functions are executable only by authenticated identities, except the persistent rate limiter.
do $$ declare f record; begin for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and proname like 'ml_%' and proname<>'ml_rate' loop
 execute format('revoke all on function %s from public,anon',f.signature);
 execute format('grant execute on function %s to authenticated,service_role',f.signature);
 end loop; end $$;
