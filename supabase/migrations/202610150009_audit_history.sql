create or replace function public.ml_audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.ml_audit(user_id,action,resource,resource_id,details) values(auth.uid(),TG_OP,TG_TABLE_NAME,new.id::text,jsonb_build_object('version',new.version,'before',case when TG_OP='UPDATE' then to_jsonb(old) else null end,'after',to_jsonb(new)));
 return new;
end $$;
create function public.ml_session_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.ml_audit(user_id,action,resource,resource_id) values(new.user_id,case when TG_OP='INSERT' then 'LOGIN' else 'SESSION_REVOKED' end,'session',new.id::text);
 return new;
end $$;
create trigger session_audit after insert or update on public.ml_sessions for each row execute function public.ml_session_audit();
revoke all on function public.ml_session_audit() from public,anon,authenticated;
