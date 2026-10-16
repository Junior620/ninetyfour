-- SELECT/RETURNING must evaluate a newly inserted row directly, before it is
-- visible to an auxiliary lookup of that same table.
drop policy matches_read on public.ml_matches;
create policy matches_read on public.ml_matches for select to authenticated using (
 public.ml_scope(season_id,category_id) or (public.ml_active() and exists(select 1 from public.ml_shares where user_id=auth.uid() and kind='match' and resource_id=ml_matches.id))
);
