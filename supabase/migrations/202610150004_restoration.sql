alter table public.ml_reports add column source_author uuid;
create function public.ml_log(action text,details jsonb) returns void language plpgsql security definer set search_path='' as $$
 begin
 if not public.ml_active() or action not in ('EXPORT_OK','EXPORT_FAILED','IMPORT_PREVIEW','IMPORT_OK','IMPORT_FAILED','MEDIA_UPLOAD','MEDIA_READ') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 insert into public.ml_audit(user_id,action,resource,details) values(auth.uid(),action,'transfer',details);
 end $$;
revoke all on function public.ml_log(text,jsonb) from public,anon;
grant execute on function public.ml_log(text,jsonb) to authenticated;

create function public.ml_restore(data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare kind text; item jsonb; cols text; collision boolean; inserted int=0;
 begin
 if not public.ml_direction() or not public.ml_permission('export') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if jsonb_array_length(data->'media')>0 and not public.ml_permission('media') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform pg_advisory_xact_lock(910002);
 foreach kind in array array['seasons','players','memberships','matches','evaluations','markers','consents','media','reports','targets'] loop
 for item in select value from jsonb_array_elements(data->kind) loop
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
revoke all on function public.ml_restore(jsonb) from public,anon;
grant execute on function public.ml_restore(jsonb) to authenticated;
