-- Cahier v2.2 assistant (rule-based, no AI): suggestions, validations and cancellations
-- are kept in the audit journal. Nothing is sent to an external engine.

create function public.ml_assistant_log(event text, details jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.ml_active() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if event not in ('ASSISTANT_SUGGESTION','ASSISTANT_VALIDATED','ASSISTANT_CANCELLED')
  or jsonb_typeof(details)<>'object' or length(details::text)>4000 then
  raise exception 'INVALID_DATA' using errcode='23514';
 end if;
 insert into public.ml_audit(user_id,action,resource,details) values(auth.uid(),event,'assistant',details);
end $$;
revoke all on function public.ml_assistant_log(text,jsonb) from public,anon;
grant execute on function public.ml_assistant_log(text,jsonb) to authenticated;
