-- Keep alert delivery independent from audit-history formatting.
create function public.ml_alert_changed() returns trigger language plpgsql security definer set search_path='' as $$
declare match_id uuid;
begin
 if TG_TABLE_NAME='ml_evaluations' then match_id=new.match_id;
 elsif new.status in ('evaluated','reviewed') then match_id=new.id;
 else return new; end if;
 insert into public.ml_alerts(match_id,event) values(match_id,'MATCH_SAVED')
 on conflict on constraint ml_alerts_match_id_key do update set updated_at=now();
 return new;
end $$;
create trigger evaluation_alert after insert or update on public.ml_evaluations for each row execute function public.ml_alert_changed();
create trigger match_alert after insert or update on public.ml_matches for each row execute function public.ml_alert_changed();
revoke all on function public.ml_alert_changed() from public,anon,authenticated;

-- A recovery session need not already be a registered MatchLab session.
-- It may only revoke its own sessions, never another identity's sessions.
create function public.ml_revoke_own_sessions() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 update public.ml_sessions set revoked_at=now() where user_id=auth.uid() and revoked_at is null;
end $$;
revoke all on function public.ml_revoke_own_sessions() from public,anon;
grant execute on function public.ml_revoke_own_sessions() to authenticated;
