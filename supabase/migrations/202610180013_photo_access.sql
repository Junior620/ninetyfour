-- Player photos without the governance prerequisite; the legal guardian's consent stays mandatory.

-- Direction always holds the media right; other members keep the explicit permission.
create or replace function public.ml_permission(p text) returns boolean language sql stable security definer set search_path = '' as $$
 select public.ml_active() and exists(select 1 from public.ml_members where user_id=auth.uid() and (p=any(permissions) or (p='media' and role='direction')));
$$;

-- Consents and media no longer wait for the retention period and policy text; a media row still needs a current consent.
create or replace function public.ml_media_guard() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if TG_TABLE_NAME='ml_media' then
 if not exists(select 1 from public.ml_consents c where c.id=new.consent_id and c.player_id=new.player_id and c.revoked_at is null and c.expires_at>now()) then raise exception 'CONSENT_REQUIRED' using errcode='23514';end if;
 end if;return new;
 end $$;

-- A retention period, once defined, still hides older media; without one, media stay visible while consent holds.
drop policy media_read on public.ml_media;
create policy media_read on public.ml_media for select to authenticated using(
 ml_permission('media') and ml_player_access(player_id)
 and not exists(select 1 from ml_settings s where s.retention_days is not null and ml_media.created_at+make_interval(days=>s.retention_days)<=now())
 and exists(select 1 from ml_consents c where c.id=consent_id and c.player_id=ml_media.player_id and c.revoked_at is null and c.granted_at<=now() and c.expires_at>now())
);
