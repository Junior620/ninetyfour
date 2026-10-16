create or replace function public.ml_immutable_relations() returns trigger language plpgsql set search_path='' as $$
declare n jsonb=to_jsonb(new);o jsonb=to_jsonb(old);begin
 if TG_TABLE_NAME in ('ml_memberships','ml_consents','ml_media') and n->>'player_id' is distinct from o->>'player_id' then raise exception 'IMMUTABLE_RELATION' using errcode='23514';end if;
 if TG_TABLE_NAME in ('ml_memberships','ml_matches','ml_targets') and (n->>'season_id' is distinct from o->>'season_id' or n->>'category_id' is distinct from o->>'category_id') then raise exception 'IMMUTABLE_SCOPE' using errcode='23514';end if;
 if TG_TABLE_NAME in ('ml_evaluations','ml_markers') and n->>'match_id' is distinct from o->>'match_id' then raise exception 'IMMUTABLE_RELATION' using errcode='23514';end if;
 if TG_TABLE_NAME='ml_evaluations' and (n->>'player_id' is distinct from o->>'player_id' or n->>'position' is distinct from o->>'position' or n->>'questionnaire_version' is distinct from o->>'questionnaire_version') then raise exception 'IMMUTABLE_EVALUATION_KEY' using errcode='23514';end if;
 return new;
end $$;
