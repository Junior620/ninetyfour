-- Scope and immutable history checks also apply to direct PostgREST clients.
create function public.ml_valid_fundamentals(a jsonb) returns boolean language sql immutable set search_path='' as $$
 select jsonb_typeof(a)='object' and not exists(select 1 from jsonb_each(a) e where e.key not in ('technique','tactical','physical','mental') or (e.value<>'null'::jsonb and (jsonb_typeof(e.value)<>'number' or e.value::text !~ '^[1-5]$')));
$$;
alter table public.ml_players add check(public.ml_valid_fundamentals(fundamentals));
alter table public.ml_targets add check(public.ml_valid_fundamentals(fundamentals)), add check(position in ('GK','CB','FB','DM','CM','AM','WG','ST'));
alter table public.ml_media add check(purpose<>'photo' or (mime in ('image/jpeg','image/png') and bytes<=5242880));

create function public.ml_immutable_relations() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_TABLE_NAME in ('ml_memberships','ml_consents','ml_media') and new.player_id<>old.player_id then raise exception 'IMMUTABLE_RELATION' using errcode='23514';end if;
 if TG_TABLE_NAME in ('ml_memberships','ml_matches','ml_targets') and (new.season_id<>old.season_id or new.category_id<>old.category_id) then raise exception 'IMMUTABLE_SCOPE' using errcode='23514';end if;
 if TG_TABLE_NAME in ('ml_evaluations','ml_markers') and new.match_id<>old.match_id then raise exception 'IMMUTABLE_RELATION' using errcode='23514';end if;
 if TG_TABLE_NAME='ml_evaluations' and (new.player_id<>old.player_id or new.position<>old.position or new.questionnaire_version<>old.questionnaire_version) then raise exception 'IMMUTABLE_EVALUATION_KEY' using errcode='23514';end if;
 return new;
end $$;
do $$ declare t text;begin foreach t in array array['memberships','matches','targets','consents','media','evaluations','markers'] loop
 execute format('create trigger immutable_relations before update on public.ml_%I for each row execute function public.ml_immutable_relations()',t);
end loop;end $$;

drop policy reports_read on public.ml_reports;
create policy reports_read on public.ml_reports for select to authenticated using(
 ml_match_access(match_id)
 and not exists(select 1 from jsonb_array_elements(snapshot->'players') p where not ml_player_access((p->>'id')::uuid))
 and not exists(select 1 from jsonb_array_elements(snapshot->'evaluations') e where not ml_player_access((e->>'player_id')::uuid))
 and not exists(select 1 from jsonb_array_elements(snapshot->'markers') m where m->>'player_id' is not null and not ml_player_access((m->>'player_id')::uuid))
);
drop policy media_read on public.ml_media;
create policy media_read on public.ml_media for select to authenticated using(
 ml_permission('media') and ml_player_access(player_id)
 and exists(select 1 from ml_settings s where s.retention_days is not null and s.consent_policy is not null and ml_media.created_at+make_interval(days=>s.retention_days)>now())
 and exists(select 1 from ml_consents c where c.id=consent_id and c.player_id=ml_media.player_id and c.revoked_at is null and c.granted_at<=now() and c.expires_at>now())
);
revoke all on function public.ml_immutable_relations() from public,anon,authenticated;
revoke all on function public.ml_valid_fundamentals(jsonb) from public,anon;
grant execute on function public.ml_valid_fundamentals(jsonb) to authenticated;
