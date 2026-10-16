create function public.ml_admin(action text, payload jsonb, expected int default 0) returns jsonb language plpgsql security definer set search_path='' as $$
 declare result jsonb; current_version int; uid uuid; active_directions int;
 begin
 if not public.ml_direction() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(910001);
 if action='season' then
 insert into public.ml_seasons(name,starts_on,ends_on) values(payload->>'name',(payload->>'starts_on')::date,(payload->>'ends_on')::date) returning to_jsonb(ml_seasons.*) into result;
 elsif action='member' then
 uid=(payload->>'user_id')::uuid;
 select version into current_version from public.ml_members where user_id=uid for update;
 if coalesce(current_version,0)<>expected then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 if exists(select 1 from public.ml_members where user_id=uid and role='direction' and active) and (payload->>'role'<>'direction' or not (payload->>'active')::boolean) then
 select count(*) into active_directions from public.ml_members where role='direction' and active;
 if active_directions<=1 then raise exception 'LAST_DIRECTION' using errcode='23514'; end if;
 end if;
 insert into public.ml_members(user_id,role,active,permissions,version) values(uid,payload->>'role',(payload->>'active')::boolean,array(select jsonb_array_elements_text(payload->'permissions')),expected+1)
 on conflict(user_id) do update set role=excluded.role,active=excluded.active,permissions=excluded.permissions,version=excluded.version returning to_jsonb(ml_members.*) into result;
 delete from public.ml_scopes where user_id=uid;
 insert into public.ml_scopes(user_id,season_id,category_id) select uid,(s->>'season_id')::uuid,s->>'category_id' from jsonb_array_elements(payload->'scopes') s;
 -- Permission changes end every existing MatchLab session immediately.
 update public.ml_sessions set revoked_at=now() where user_id=uid;
 elsif action='revoke' then
 uid=(payload->>'user_id')::uuid;update public.ml_sessions set revoked_at=now() where user_id=uid;result=jsonb_build_object('revoked',true);
 elsif action='share' then
 if payload->>'kind'='match' and not exists(select 1 from public.ml_matches where id=(payload->>'resource_id')::uuid) then raise exception 'INVALID_RESOURCE' using errcode='23514'; end if;
 if payload->>'kind'='player' and not exists(select 1 from public.ml_players where id=(payload->>'resource_id')::uuid) then raise exception 'INVALID_RESOURCE' using errcode='23514'; end if;
 if coalesce((payload->>'remove')::boolean,false) then delete from public.ml_shares where user_id=(payload->>'user_id')::uuid and kind=payload->>'kind' and resource_id=(payload->>'resource_id')::uuid;
 else insert into public.ml_shares values((payload->>'user_id')::uuid,payload->>'kind',(payload->>'resource_id')::uuid) on conflict do nothing;end if;result=jsonb_build_object('saved',true);
 elsif action='settings' then
 update public.ml_settings set retention_days=(payload->>'retention_days')::int,consent_policy=payload->>'consent_policy',version=version+1 where id='governance' and version=expected returning to_jsonb(ml_settings.*) into result;
 if result is null then raise exception 'VERSION_CONFLICT' using errcode='40001';end if;
 else raise exception 'INVALID_ACTION';end if;
 insert into public.ml_audit(user_id,action,resource,resource_id) values(auth.uid(),'ADMIN_'||action,'administration',coalesce(uid::text,result->>'id'));
 return result;
 end $$;
revoke all on function public.ml_admin(text,jsonb,int) from public,anon;
grant execute on function public.ml_admin(text,jsonb,int) to authenticated;

create function public.ml_article_valid(doc jsonb) returns boolean language sql immutable as $$
 select jsonb_typeof(doc)='object' and length(doc->'title'->>'fr')>0 and length(doc->'title'->>'en')>0 and length(doc->'excerpt'->>'fr')>0 and length(doc->'excerpt'->>'en')>0 and length(doc->'content'->>'fr')>0 and length(doc->'content'->>'en')>0
 and (doc->>'category') in ('academy','matches','training','partners','events') and (doc->>'date') ~ '^\d{4}-\d{2}-\d{2}$'
 and ((doc->>'image') ~ '^/[a-zA-Z0-9_-]+\.(jpeg|jpg|png|webp)$' or (doc->>'image') ~ '^https://images\.unsplash\.com/');
$$;
create function public.ml_article_save(action text, article uuid, payload jsonb, expected int) returns jsonb language plpgsql security definer set search_path='' as $$
 declare a public.ml_articles; result public.ml_articles;
 begin
 if action in ('publish','unpublish') then
 if not public.ml_permission('site_publisher') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 else if not public.ml_permission('site_editor') then raise exception 'FORBIDDEN' using errcode='42501';end if;end if;
 select * into a from public.ml_articles where id=article for update;
 if coalesce(a.version,0)<>expected then raise exception 'VERSION_CONFLICT' using errcode='40001';end if;
 if action='draft' then
 if a.id is null then insert into public.ml_articles(id,slug,draft) values(coalesce(article,gen_random_uuid()),payload->>'slug',payload-'slug') returning * into result;
 else update public.ml_articles set draft=payload-'slug',version=version+1,updated_at=now() where id=a.id returning * into result;end if;
 elsif action='restore' then
 update public.ml_articles set draft=(select draft from public.ml_article_revisions where article_id=a.id and version=(payload->>'revision')::int),version=version+1,updated_at=now() where id=a.id returning * into result;
 elsif action='publish' then
 if not coalesce(public.ml_article_valid(a.draft),false) then raise exception 'INCOMPLETE_TRANSLATIONS' using errcode='23514';end if;
 update public.ml_articles set published=draft,version=version+1,updated_at=now() where id=a.id returning * into result;
 elsif action='unpublish' then update public.ml_articles set published=null,version=version+1,updated_at=now() where id=a.id returning * into result;
 else raise exception 'INVALID_ACTION';end if;
 insert into public.ml_article_revisions(article_id,version,draft,published,author) values(result.id,result.version,result.draft,result.published,auth.uid());
 insert into public.ml_audit(user_id,action,resource,resource_id) values(auth.uid(),'ARTICLE_'||action,'ml_articles',result.id::text);
 return to_jsonb(result);
 end $$;
revoke all on function public.ml_article_save(text,uuid,jsonb,int) from public,anon;
grant execute on function public.ml_article_save(text,uuid,jsonb,int) to authenticated;
-- Only explicitly published article documents are accessible to the public site.
create function public.ml_published_articles() returns table(slug text,document jsonb) language sql stable security definer set search_path='' as $$ select slug,published from public.ml_articles where published is not null order by published->>'date' desc; $$;
revoke all on function public.ml_published_articles() from public;
grant execute on function public.ml_published_articles() to anon,authenticated;

create function public.ml_media_guard() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if not exists(select 1 from public.ml_settings where retention_days is not null and length(consent_policy)>0) then raise exception 'GOVERNANCE_REQUIRED' using errcode='23514';end if;
 if TG_TABLE_NAME='ml_media' then
 if not exists(select 1 from public.ml_consents c where c.id=new.consent_id and c.player_id=new.player_id and c.revoked_at is null and c.expires_at>now()) then raise exception 'CONSENT_REQUIRED' using errcode='23514';end if;
 end if;return new;
 end $$;
create trigger ml_media_consent before insert or update on public.ml_media for each row execute function public.ml_media_guard();
create trigger ml_consent_governance before insert on public.ml_consents for each row execute function public.ml_media_guard();
