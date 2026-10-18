import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { filterGraph } from "./filter";
import { newestFirst } from "./photos";
import type { Graph, Filters, Member } from "./schema";
import { dbError, LabError } from "./server";

async function rows<T>(db: SupabaseClient, table: string): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; offset < 10000; offset += 500) {
    const page = await db
      .from(`ml_${table}`)
      .select("*")
      .order("id")
      .range(offset, offset + 499);
    dbError(page.error);
    result.push(...((page.data ?? []) as T[]));
    if ((page.data?.length ?? 0) < 500) return result;
  }
  throw new LabError("SCOPE_TOO_LARGE", 413);
}
/** Readers see shared reports, never the staff's internal scouting notes. */
export const forMember = (graph: Graph, member: Member): Graph =>
  member.role === "reader"
    ? { ...graph, players: graph.players.map((p) => ({ ...p, scouting: "" })) }
    : graph;
export async function loadGraph(
  db: SupabaseClient,
  filters: Filters,
  exporting = false,
): Promise<Graph> {
  const [
    seasons,
    players,
    memberships,
    matches,
    evaluations,
    markers,
    videos,
    consents,
    media,
    reports,
    targets,
    lineups,
    requirements,
    trials,
    dossiers,
    live_sessions,
    plans,
  ] = await Promise.all([
    rows<Graph["seasons"][number]>(db, "seasons"),
    rows<Graph["players"][number]>(db, "players"),
    rows<Graph["memberships"][number]>(db, "memberships"),
    rows<Graph["matches"][number]>(db, "matches"),
    rows<Graph["evaluations"][number]>(db, "evaluations"),
    rows<Graph["markers"][number]>(db, "markers"),
    rows<Graph["videos"][number]>(db, "videos"),
    rows<Graph["consents"][number]>(db, "consents"),
    rows<Graph["media"][number]>(db, "media"),
    rows<Graph["reports"][number]>(db, "reports"),
    rows<Graph["targets"][number]>(db, "targets"),
    rows<Graph["lineups"][number]>(db, "lineups"),
    rows<Graph["requirements"][number]>(db, "requirements"),
    rows<Graph["trials"][number]>(db, "trials"),
    rows<Graph["dossiers"][number]>(db, "dossiers"),
    rows<Graph["live_sessions"][number]>(db, "live_sessions"),
    rows<Graph["plans"][number]>(db, "plans"),
  ]);
  return filterGraph(
    {
      seasons,
      players,
      memberships,
      matches,
      evaluations,
      markers,
      videos,
      consents,
      media: newestFirst(media),
      reports,
      targets,
      lineups,
      requirements,
      trials,
      dossiers,
      live_sessions,
      plans,
    },
    filters,
    exporting,
  );
}
