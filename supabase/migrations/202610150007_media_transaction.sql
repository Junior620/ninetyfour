create function public.ml_attach_media(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare item public.ml_media;begin
 item=jsonb_populate_record(null::public.ml_media,payload);
 if not public.ml_permission('media') or not public.ml_player_access(item.player_id,true) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if not exists(select 1 from public.ml_consents c where c.id=item.consent_id and c.player_id=item.player_id and c.granted_at<=now() and c.expires_at>now() and c.revoked_at is null and (item.purpose<>'photo' or c.purpose='internal_photo')) then raise exception 'MEDIA_NOT_AUTHORIZED' using errcode='42501';end if;
 if item.path <> ('players/'||item.player_id::text||'/'||item.id::text||(case item.mime when 'image/png' then '.png' when 'image/jpeg' then '.jpg' else '.pdf' end)) then raise exception 'INVALID_PATH' using errcode='23514';end if;
 insert into public.ml_media(id,player_id,consent_id,path,mime,purpose,bytes,sha256) values(item.id,item.player_id,item.consent_id,item.path,item.mime,item.purpose,item.bytes,item.sha256);
 insert into public.ml_audit(user_id,action,resource,resource_id) values(auth.uid(),'MEDIA_UPLOAD','media',item.id::text);
 return item.id;
end $$;
revoke all on function public.ml_attach_media(jsonb) from public,anon;
grant execute on function public.ml_attach_media(jsonb) to authenticated;
