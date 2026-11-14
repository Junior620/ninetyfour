import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, useQuery } from "@tanstack/react-query";
import type { Graph, Member, Season } from "@matchlab/schema";
import type { Category } from "@matchlab/trials";
import { CATEGORIES } from "@matchlab/trials";
import { request } from "./api";

/** Same shape as the web workspace (src/components/matchlab/shared.tsx). */
export type LabData = {
  graph: Graph;
  member: Member;
  email: string;
  alerts: {
    id: string;
    match_id: string;
    event: string;
    updated_at: string;
    ml_alert_reads: { user_id: string }[];
  }[];
  scopes: { season_id: string; category_id: Category }[];
  settings: {
    retention_days: number | null;
    consent_policy: string | null;
    version: number;
  };
};
export const LAB_KEY = ["lab"] as const;
const CACHE_KEY = "matchlab.lab-cache.v1";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      // Offline: keep showing the last data instead of retrying forever.
      retry: (count, error) =>
        count < 2 && (error as { offline?: boolean }).offline !== true,
    },
  },
});

/**
 * Everything the account may see, filtered by the database (RLS): the web software's
 * graph, same endpoint. Kept on the phone so the assigned data stays readable offline.
 */
export async function fetchLab(): Promise<LabData> {
  const data = await request<LabData>("/api/matchlab/data");
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data })).catch(
    () => undefined,
  );
  return data;
}
export function useLab() {
  return useQuery({
    queryKey: LAB_KEY,
    queryFn: fetchLab,
    refetchInterval: 30_000,
  });
}
/** Last data seen on this phone, shown at once at start-up while the network answers. */
export async function restoreLabCache() {
  const raw = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
  if (!raw) return;
  try {
    const { at, data } = JSON.parse(raw) as { at: number; data: LabData };
    queryClient.setQueryData(LAB_KEY, data, { updatedAt: at });
  } catch {
    await AsyncStorage.removeItem(CACHE_KEY);
  }
}
/** Signing out removes every club datum from the phone. */
export async function forgetLab() {
  queryClient.clear();
  await AsyncStorage.removeItem(CACHE_KEY).catch(() => undefined);
}

/** Season that includes today, otherwise the most recent one. */
export function currentSeason(seasons: Season[], today = new Date()) {
  const day = today.toISOString().slice(0, 10);
  const sorted = [...seasons].sort((a, b) => b.starts_on.localeCompare(a.starts_on));
  return sorted.find((s) => s.starts_on <= day && day <= s.ends_on) ?? sorted[0] ?? null;
}
/** Categories where this account may create: all for direction, assigned ones for staff. */
export function writableCategories(data: LabData, seasonId: string): Category[] {
  if (data.member.role === "reader") return [];
  if (data.member.role === "direction") return CATEGORIES;
  return CATEGORIES.filter((c) =>
    data.scopes.some((s) => s.season_id === seasonId && s.category_id === c),
  );
}
export const canWrite = (data: LabData) => data.member.role !== "reader";
export const canUseMedia = (data: LabData) =>
  data.member.role === "direction" || data.member.permissions.includes("media");

/** Jersey and category of a player in a season. */
export function membershipOf(graph: Graph, playerId: string, seasonId?: string) {
  return graph.memberships.find(
    (m) => m.player_id === playerId && (!seasonId || m.season_id === seasonId),
  );
}
/** Players of a category in a season, with their jersey. */
export function squad(graph: Graph, seasonId: string, category: Category) {
  return graph.memberships
    .filter((m) => m.season_id === seasonId && m.category_id === category)
    .map((m) => ({ membership: m, player: graph.players.find((p) => p.id === m.player_id) }))
    .filter((r): r is typeof r & { player: NonNullable<typeof r.player> } => !!r.player)
    .sort((a, b) => a.membership.jersey - b.membership.jersey);
}
