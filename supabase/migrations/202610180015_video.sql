-- Cahier v2.2 step 3: imported match videos and verifiable sequences.

-- Private bucket for match videos: reached only through short signed URLs issued by the API.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('matchlab-videos','matchlab-videos',false,5368709120,array['video/mp4','video/quicktime','video/webm'])
on conflict (id) do nothing;

create table public.ml_videos (
 id uuid primary key default gen_random_uuid(),
 match_id uuid not null references public.ml_matches(id),
 path text not null unique,
 name text not null check(length(name) between 1 and 200),
 mime text not null check(mime in ('video/mp4','video/quicktime','video/webm')),
 bytes bigint not null check(bytes>0 and bytes<=5368709120),
 duration_seconds numeric check(duration_seconds is null or duration_seconds between 0 and 86400),
 team_filmed text not null default '' check(length(team_filmed)<=120),
 conditions text not null default '' check(length(conditions)<=500),
 status text not null default 'uploading' check(status in ('uploading','ready')),
 created_by uuid default auth.uid(),
 created_at timestamptz not null default now(),
 version int not null default 1
);
alter table public.ml_videos enable row level security;

-- Retention and authorisations must be defined before any youth match video is imported (§09).
create function public.ml_video_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' and coalesce(current_setting('ml.restoring',true),'')<>'1'
  and not exists(select 1 from public.ml_settings where retention_days is not null and length(consent_policy)>0) then
  raise exception 'GOVERNANCE_REQUIRED' using errcode='23514';
 end if;
 if TG_OP='UPDATE' and (new.match_id<>old.match_id or new.path<>old.path) then raise exception 'IMMUTABLE_RELATION' using errcode='23514';end if;
 return new;
end $$;
create trigger ml_video_guard before insert or update on public.ml_videos for each row execute function public.ml_video_guard();
create trigger ml_guard before insert or update on public.ml_videos for each row execute function public.ml_guard();
create trigger ml_audit after insert or update on public.ml_videos for each row execute function public.ml_audit_change();

create policy videos_read on public.ml_videos for select to authenticated using(
 ml_match_access(match_id)
 and not exists(select 1 from ml_settings s where s.retention_days is not null and ml_videos.created_at+make_interval(days=>s.retention_days)<=now())
);
create policy videos_write on public.ml_videos for all to authenticated using(ml_match_access(match_id,true)) with check(ml_match_access(match_id,true));
grant select,insert,update on public.ml_videos to authenticated;

-- Sequences: the cahier's twelve actions next to the former marker kinds, with an end,
-- an outcome, N91 tags, the video they refer to, and a traceable attribution check.
alter table public.ml_markers drop constraint if exists ml_markers_kind_check;
alter table public.ml_markers add constraint ml_markers_kind_check check(kind in (
 'positive','correction','chance','transition',
 'pass','control','duel','recovery','loss','shot','run','press','cover','reposition','save','buildup'));
alter table public.ml_markers
 add column end_seconds numeric check(end_seconds is null or end_seconds between 0 and 86400),
 add column outcome text check(outcome is null or outcome in ('success','fail')),
 add column tags text[] not null default '{}' check(cardinality(tags)<=10 and coalesce(length(array_to_string(tags,'')),0)<=300),
 add column verified boolean not null default false,
 add column source text not null default 'manual' check(source in ('manual','live','ai')),
 add column video_id uuid references public.ml_videos(id),
 add column validated_by uuid,
 add column minute int check(minute is null or minute between 0 and 150);
alter table public.ml_markers add check(end_seconds is null or end_seconds>=seconds);

-- Whoever confirms an attribution is recorded by the database, not by the client.
create function public.ml_marker_review() returns trigger language plpgsql set search_path='' as $$
begin
 if coalesce(current_setting('ml.restoring',true),'')='1' then return new; end if;
 if new.verified and (TG_OP='INSERT' or not old.verified or new.player_id is distinct from old.player_id) then new.validated_by=auth.uid();
 elsif not new.verified then new.validated_by=null;
 end if;
 return new;
end $$;
create trigger ml_marker_review before insert or update on public.ml_markers for each row execute function public.ml_marker_review();

-- Players' last update, shown in the player file.
alter table public.ml_players add column updated_at timestamptz not null default now();
create trigger ml_players_touch_updated_at before update on public.ml_players for each row execute function public.ml_touch_updated_at();

-- Restoration includes videos' metadata (files themselves are not in the archive).
create or replace function public.ml_restore(data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare kind text; item jsonb; cols text; collision boolean; inserted int=0;
 begin
 if not public.ml_direction() or not public.ml_permission('export') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if jsonb_array_length(coalesce(data->'media','[]'))>0 and not public.ml_permission('media') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform pg_advisory_xact_lock(910002);
 perform set_config('ml.restoring','1',true);
 foreach kind in array array['seasons','players','memberships','matches','videos','evaluations','markers','consents','media','reports','targets','lineups','requirements','trials'] loop
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

-- Removing a video unlinks its sequences (they keep their timestamps) and deletes the row;
-- the API then deletes the file. Write access to the match is required.
create function public.ml_remove_video(video uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.ml_videos;
begin
 select * into v from public.ml_videos where id=video;
 if v.id is null or not public.ml_match_access(v.match_id,true) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 update public.ml_markers set video_id=null, version=version+1 where video_id=video;
 delete from public.ml_videos where id=video;
 insert into public.ml_audit(user_id,action,resource,resource_id,details) values(auth.uid(),'VIDEO_REMOVED','video',video::text,jsonb_build_object('match_id',v.match_id,'name',v.name,'path',v.path));
 return jsonb_build_object('path',v.path);
end $$;
revoke all on function public.ml_remove_video(uuid) from public,anon;
grant execute on function public.ml_remove_video(uuid) to authenticated;
