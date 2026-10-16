-- Include players observed only through video markers in immutable snapshots.
create or replace function public.ml_report(match uuid, expected int, correction text default '', validate boolean default false) returns jsonb language plpgsql security definer set search_path = '' as $$
 declare m public.ml_matches; r public.ml_reports; data jsonb; rev int;
 begin
 if not public.ml_match_access(match,true) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 select * into m from public.ml_matches where id=match for update;
 if m.version<>expected then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 select coalesce(max(revision),0)+1 into rev from public.ml_reports where match_id=match;
 select jsonb_build_object('match',to_jsonb(m),'evaluations',coalesce((select jsonb_agg(to_jsonb(e)) from public.ml_evaluations e where match_id=match),'[]'),'players',coalesce((select jsonb_agg(to_jsonb(p)) from public.ml_players p where id in(select player_id from public.ml_evaluations where match_id=match union select player_id from public.ml_markers where match_id=match and player_id is not null)),'[]'),'markers',coalesce((select jsonb_agg(to_jsonb(v)) from public.ml_markers v where match_id=match),'[]')) into data;
 insert into public.ml_reports(match_id,revision,snapshot,correction,created_by,validated_by,validated_at) values(match,rev,data,correction,auth.uid(),case when validate then auth.uid() end,case when validate then now() end) returning * into r;
 insert into public.ml_audit(user_id,action,resource,resource_id) values(auth.uid(),case when validate then 'REPORT_VALIDATED' else 'REPORT_REVISION' end,'ml_reports',r.id::text);
 return to_jsonb(r);
 end $$;
