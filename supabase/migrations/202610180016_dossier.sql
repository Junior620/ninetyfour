-- Cahier v2.2 step 3 (second part): club dossier prepared by the staff, validated by the
-- direction, shared only with a named recipient and only with the elements approved.

-- Diffusion authorisation from the legal guardian, distinct from photo consents.
alter table public.ml_consents drop constraint if exists ml_consents_purpose_check;
alter table public.ml_consents add constraint ml_consents_purpose_check
 check(purpose in ('internal_photo','export_photo','dossier_share'));

create table public.ml_dossiers (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.ml_players(id),
 recipient text not null check(length(btrim(recipient)) between 2 and 160),
 recipient_contact text not null default '' check(length(recipient_contact)<=200),
 period_from date not null,
 period_to date not null,
 sections text[] not null default '{}' check(sections <@ array['photo','positions','statistics','criteria','progression','strengths','development','sequences','staff_comments','scouting','status']),
 strengths text not null default '' check(length(strengths)<=2000),
 development text not null default '' check(length(development)<=2000),
 sequence_ids uuid[] not null default '{}' check(cardinality(sequence_ids)<=30),
 status text not null default 'draft' check(status in ('draft','validated','withdrawn')),
 content jsonb,
 prepared_by uuid default auth.uid(),
 prepared_at timestamptz not null default now(),
 validated_by uuid,
 validated_at timestamptz,
 withdrawn_at timestamptz,
 version int not null default 1,
 check(period_to>=period_from),
 check(status<>'validated' or (content is not null and validated_by is not null))
);
alter table public.ml_dossiers enable row level security;

create function public.ml_current_consent(p uuid, kind text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ml_consents c where c.player_id=p and c.purpose=kind and c.revoked_at is null and c.granted_at<=now() and c.expires_at>now());
$$;
revoke all on function public.ml_current_consent(uuid,text) from public,anon;
grant execute on function public.ml_current_consent(uuid,text) to authenticated;

-- Who prepared and who validated is set by the database. Only the direction validates, and
-- only with a current diffusion consent (plus the export photo consent when the photo is
-- included). The validated content is frozen; it can only be withdrawn.
create function public.ml_dossier_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if coalesce(current_setting('ml.restoring',true),'')='1' then return new; end if;
 if TG_OP='INSERT' then
  if new.status<>'draft' or new.content is not null then raise exception 'INVALID_DATA' using errcode='23514'; end if;
  new.prepared_by=auth.uid(); new.prepared_at=now();
  new.validated_by=null; new.validated_at=null; new.withdrawn_at=null;
  return new;
 end if;
 if new.player_id<>old.player_id or new.prepared_by is distinct from old.prepared_by or new.prepared_at<>old.prepared_at then
  raise exception 'IMMUTABLE_RELATION' using errcode='23514';
 end if;
 if old.status='withdrawn' then raise exception 'IMMUTABLE_DECISION' using errcode='23514'; end if;
 if old.status='validated' then
  if new.status<>'withdrawn'
   or (to_jsonb(new)-'status'-'withdrawn_at'-'version')<>(to_jsonb(old)-'status'-'withdrawn_at'-'version') then
   raise exception 'IMMUTABLE_DECISION' using errcode='23514';
  end if;
  new.withdrawn_at=now();
  return new;
 end if;
 if new.status='withdrawn' then
  new.withdrawn_at=now(); new.content=null; new.validated_by=null; new.validated_at=null;
 elsif new.status='validated' then
  if not public.ml_direction() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if new.content is null then raise exception 'INVALID_DATA' using errcode='23514'; end if;
  if not public.ml_current_consent(new.player_id,'dossier_share')
   or ('photo'=any(new.sections) and not public.ml_current_consent(new.player_id,'export_photo')) then
   raise exception 'SHARE_CONSENT_REQUIRED' using errcode='23514';
  end if;
  new.validated_by=auth.uid(); new.validated_at=now();
 else
  new.content=null; new.validated_by=null; new.validated_at=null; new.withdrawn_at=null;
 end if;
 return new;
end $$;
create trigger ml_dossier_guard before insert or update on public.ml_dossiers for each row execute function public.ml_dossier_guard();
create trigger ml_guard before insert or update on public.ml_dossiers for each row execute function public.ml_guard();
create trigger ml_audit after insert or update on public.ml_dossiers for each row execute function public.ml_audit_change();

-- Staff and direction with write access to the player; readers and recipients never.
create policy dossiers_read on public.ml_dossiers for select to authenticated using(ml_player_access(player_id,true));
create policy dossiers_write on public.ml_dossiers for all to authenticated using(ml_player_access(player_id,true)) with check(ml_player_access(player_id,true));
grant select,insert,update on public.ml_dossiers to authenticated;

-- Each PDF produced from a validated dossier is logged with its recipient.
create function public.ml_dossier_exported(dossier uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.ml_dossiers;
begin
 select * into d from public.ml_dossiers where id=dossier;
 if d.id is null or not public.ml_player_access(d.player_id,true) or not public.ml_permission('export') then
  raise exception 'FORBIDDEN' using errcode='42501';
 end if;
 if d.status<>'validated' then raise exception 'INVALID_DATA' using errcode='23514'; end if;
 if not public.ml_current_consent(d.player_id,'dossier_share') then raise exception 'SHARE_CONSENT_REQUIRED' using errcode='23514'; end if;
 insert into public.ml_audit(user_id,action,resource,resource_id,details)
 values(auth.uid(),'DOSSIER_EXPORTED','dossier',dossier::text,jsonb_build_object('player_id',d.player_id,'recipient',d.recipient,'validated_by',d.validated_by));
 return jsonb_build_object('photo',('photo'=any(d.sections)) and public.ml_current_consent(d.player_id,'export_photo'));
end $$;
revoke all on function public.ml_dossier_exported(uuid) from public,anon;
grant execute on function public.ml_dossier_exported(uuid) to authenticated;

-- Restoration includes dossiers (validated content and authors kept as archived).
create or replace function public.ml_restore(data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare kind text; item jsonb; cols text; collision boolean; inserted int=0;
 begin
 if not public.ml_direction() or not public.ml_permission('export') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if jsonb_array_length(coalesce(data->'media','[]'))>0 and not public.ml_permission('media') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform pg_advisory_xact_lock(910002);
 perform set_config('ml.restoring','1',true);
 foreach kind in array array['seasons','players','memberships','matches','videos','evaluations','markers','consents','media','reports','targets','lineups','requirements','trials','dossiers'] loop
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
