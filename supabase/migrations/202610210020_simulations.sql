-- Action simulations saved with a tactical scenario ("Simuler une action" on the board):
-- drawn passes, runs, carries and shots, and the opponent markers. The API checks
-- their shape; the database keeps the type, the number and the size in check.
alter table public.ml_lineups
 add column simulations jsonb not null default '[]'
 check(jsonb_typeof(simulations)='array' and jsonb_array_length(simulations)<=12 and octet_length(simulations::text)<=500000);
