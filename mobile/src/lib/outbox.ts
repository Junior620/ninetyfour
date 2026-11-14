import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { schemas, type Resource } from "@matchlab/schema";
import { ApiError, request } from "./api";
import { fetchLab, LAB_KEY, queryClient, type LabData } from "./lab";

/**
 * Field-side writes. A save is sent at once; if the server cannot be reached it waits
 * here, on the phone, and leaves automatically when the network returns. A refusal
 * (invalid data, rights, "modified elsewhere") is never retried blindly: it stays
 * visible until the staff resolves it. Nothing is overwritten silently: every write
 * carries the version it was based on and the server answers 409 if it changed.
 */
export type Job = {
  id: string;
  label: string;
  kind: Resource;
  payload: Record<string, unknown>;
  version: number;
  membership?: Record<string, unknown>;
  created_at: string;
  status: "pending" | "failed";
  attempts: number;
  code?: string;
  message?: string;
};
export type SyncState = {
  jobs: Job[];
  online: boolean;
  sending: boolean;
  lastSync: number | null;
};
export type SaveResult =
  | { status: "sent"; data: Record<string, unknown> }
  | { status: "queued"; job: Job };

const STORE = "matchlab.outbox.v1";
let state: SyncState = { jobs: [], online: true, sending: false, lastSync: null };
const listeners = new Set<() => void>();
const emit = (next: Partial<SyncState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};
const persist = (jobs: Job[]) => {
  emit({ jobs });
  return AsyncStorage.setItem(STORE, JSON.stringify(jobs)).catch(() => undefined);
};
export const useSync = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );

/**
 * Fields of an existing row that its strict schema accepts, plus its id: database
 * columns such as created_at or updated_at would be refused by the server.
 */
export function editable(
  kind: "players" | "matches" | "evaluations" | "lineups",
  row: { id: string } & Record<string, unknown>,
) {
  const keys = Object.keys(schemas[kind].shape);
  return Object.fromEntries(
    Object.entries(row).filter(([k]) => keys.includes(k) && row[k] !== undefined),
  ) as Record<string, unknown>;
}

const send = (job: Pick<Job, "kind" | "payload" | "version" | "membership">) =>
  request<Record<string, unknown>>("/api/matchlab/data", {
    json: {
      kind: job.kind,
      payload: job.payload,
      version: job.version,
      ...(job.membership ? { membership: job.membership } : {}),
    },
  });

/** A creation retried after a lost answer may already exist: never create it twice. */
function alreadySaved(job: Job, data: LabData) {
  const rows = data.graph[job.kind as keyof LabData["graph"]] as unknown as {
    id: string;
    full_name?: string;
  }[];
  if (job.version !== 0) return false;
  if (typeof job.payload.id === "string")
    return rows.some((r) => r.id === job.payload.id);
  if (job.kind === "players" && job.membership)
    return data.graph.players.some(
      (p) =>
        p.full_name.trim().toLowerCase() ===
          String(job.payload.full_name).trim().toLowerCase() &&
        data.graph.memberships.some(
          (m) =>
            m.player_id === p.id &&
            m.season_id === job.membership!.season_id &&
            m.category_id === job.membership!.category_id &&
            m.jersey === job.membership!.jersey,
        ),
    );
  return false;
}
const retryable = (e: unknown) =>
  e instanceof ApiError && (e.offline || e.status >= 500 || e.code === "RATE_LIMITED");

/**
 * Validates with the web's own Zod schema, then sends. Offline → queued.
 * A refusal is thrown to the form, which keeps what was typed.
 */
export async function save(
  input: Pick<Job, "label" | "kind" | "payload" | "version" | "membership">,
): Promise<SaveResult> {
  const payload = schemas[input.kind].parse(input.payload) as Record<string, unknown>;
  const job = { ...input, payload };
  const enqueue = async () => {
    const queued: Job = {
      ...job,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      status: "pending",
      attempts: 1,
    };
    await persist([...state.jobs, queued]);
    return { status: "queued", job: queued } as const;
  };
  // Order is kept: a save never overtakes one still waiting (a match before its sheet).
  if (state.jobs.some((j) => j.status === "pending")) {
    const queued = await enqueue();
    flush();
    return queued;
  }
  try {
    const data = await send(job);
    emit({ lastSync: Date.now() });
    await queryClient.invalidateQueries({ queryKey: LAB_KEY });
    return { status: "sent", data };
  } catch (e) {
    if (!retryable(e)) throw e;
    return enqueue();
  }
}

/** Sends the waiting saves in order; stops at the first network failure. */
export async function flush() {
  if (state.sending || !state.jobs.some((j) => j.status === "pending")) return;
  emit({ sending: true });
  try {
    let fresh: LabData | null = null;
    for (const job of state.jobs.filter((j) => j.status === "pending")) {
      try {
        if (job.attempts > 0 && job.version === 0) {
          fresh ??= await fetchLab();
          if (alreadySaved(job, fresh)) {
            await persist(state.jobs.filter((j) => j.id !== job.id));
            continue;
          }
        }
        await send(job);
        await persist(state.jobs.filter((j) => j.id !== job.id));
        emit({ lastSync: Date.now() });
      } catch (e) {
        if (retryable(e)) {
          await persist(
            state.jobs.map((j) => (j.id === job.id ? { ...j, attempts: j.attempts + 1 } : j)),
          );
          break;
        }
        const error = e instanceof ApiError ? e : new ApiError("INTERNAL_ERROR", 500);
        await persist(
          state.jobs.map((j) =>
            j.id === job.id
              ? { ...j, status: "failed", code: error.code, message: error.message }
              : j,
          ),
        );
      }
    }
  } finally {
    emit({ sending: false });
    await queryClient.invalidateQueries({ queryKey: LAB_KEY });
  }
}
export async function retry(id: string) {
  await persist(state.jobs.map((j) => (j.id === id ? { ...j, status: "pending" } : j)));
  await flush();
}
export const discard = (id: string) => persist(state.jobs.filter((j) => j.id !== id));
export const clearOutbox = () => persist([]);

/** Loads waiting saves and resumes them on reconnection and when the app comes back. */
export async function startSync() {
  const raw = await AsyncStorage.getItem(STORE).catch(() => null);
  if (raw)
    try {
      emit({ jobs: JSON.parse(raw) as Job[] });
    } catch {
      await AsyncStorage.removeItem(STORE);
    }
  const offNet = NetInfo.addEventListener((s) => {
    const online = s.isConnected !== false && s.isInternetReachable !== false;
    const back = online && !state.online;
    emit({ online });
    if (back) flush();
  });
  const offApp = AppState.addEventListener("change", (s) => {
    if (s === "active") flush();
  });
  flush();
  return () => {
    offNet();
    offApp.remove();
  };
}
