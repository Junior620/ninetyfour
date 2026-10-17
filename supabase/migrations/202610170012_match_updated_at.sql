-- Keep ml_matches.updated_at truthful on every edit: the analysis room shows it as the last save in base.
create function public.ml_touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger ml_matches_touch_updated_at before update on public.ml_matches
for each row execute function public.ml_touch_updated_at();
