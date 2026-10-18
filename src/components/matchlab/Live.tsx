"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, CameraOff, Flag, Pause, Play, Undo2, WifiOff } from "lucide-react";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
import { positionNames } from "@/lib/matchlab/questionnaire";
import {
  SEQUENCE_ACTIONS,
  type LiveSession,
  type Marker,
  type Match,
  type Player,
} from "@/lib/matchlab/schema";
import {
  liveClock,
  liveSummary,
  minuteLabel,
  type LiveSummary,
} from "@/lib/matchlab/live";
import { useLab, api, Heading, Empty, PlayerAvatar, formatDay } from "./shared";

type SessionPayload = Omit<
  LiveSession,
  "version" | "created_by" | "created_at" | "updated_at"
>;
type EventPayload = Omit<Marker, "version" | "validated_by">;
/** What this device still has to send: the latest wanted session and the new events. */
type Store = {
  session: SessionPayload | null;
  base: number;
  events: EventPayload[];
};
const key = (matchId: string) => `ml-live-${matchId}`;
const readStore = (matchId: string): Store => {
  try {
    const raw = JSON.parse(localStorage.getItem(key(matchId)) || "null");
    if (raw && Array.isArray(raw.events)) return raw;
  } catch {}
  return { session: null, base: 0, events: [] };
};
const writeStore = (matchId: string, store: Store) => {
  try {
    if (!store.session && !store.events.length) localStorage.removeItem(key(matchId));
    else localStorage.setItem(key(matchId), JSON.stringify(store));
  } catch {}
};
/** Network problems keep the item for later; a refusal by the server drops it. */
const retriable = (e: unknown) =>
  e instanceof TypeError ||
  ["DATABASE_UNAVAILABLE", "RATE_LIMITED", "INTERNAL_ERROR"].includes(
    e instanceof Error ? e.message : "",
  );
const payloadOf = (s: LiveSession | SessionPayload): SessionPayload => ({
  id: s.id,
  match_id: s.match_id,
  status: s.status,
  present: s.present,
  first_half_at: s.first_half_at,
  half_time_at: s.half_time_at,
  second_half_at: s.second_half_at,
  finished_at: s.finished_at,
  notes: s.notes,
  half_summary: s.half_summary,
  final_summary: s.final_summary,
});
const clockText = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    Math.floor(seconds % 60),
  ).padStart(2, "0")}`;

/** Live match from the touchline: nothing filmed or recorded, only typed facts persist. */
export function Live({ id }: { id?: string }) {
  const { data } = useLab();
  const router = useRouter();
  if (data.member.role === "reader")
    return (
      <>
        <Heading title={t.nav.live} />
        <p className="ml-notice">{t.errors.FORBIDDEN}</p>
      </>
    );
  const matches = [...data.graph.matches].sort((a, b) =>
    b.played_on.localeCompare(a.played_on),
  );
  const match = matches.find((m) => m.id === id) ?? matches[0];
  return (
    <>
      <Heading title={t.nav.live} eyebrow={t.live.eyebrow} />
      {match ? (
        <>
          <label className="ml-live-match">
            {t.live.match}
            <select
              value={match.id}
              onChange={(e) => router.replace(`/matchlab/live?id=${e.target.value}`)}
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {formatDay(m.played_on)} · {m.category_id} · {m.opponent}
                </option>
              ))}
            </select>
          </label>
          <LiveRoom key={match.id} match={match} />
        </>
      ) : (
        <Empty text={t.live.noMatch} />
      )}
    </>
  );
}

function LiveRoom({ match }: { match: Match }) {
  const { data, refresh } = useLab();
  const { graph } = data;
  const [store, setStore] = useState<Store>(() => readStore(match.id));
  const [saved, setSaved] = useState<LiveSession | null>(null);
  const [sent, setSent] = useState<EventPayload[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const busy = useRef(false);
  const storeRef = useRef(store);
  const update = useCallback(
    (change: (s: Store) => Store) => {
      const next = change(storeRef.current);
      storeRef.current = next;
      writeStore(match.id, next);
      setStore(next);
    },
    [match.id],
  );

  const fromGraph = graph.live_sessions.find((s) => s.match_id === match.id) ?? null;
  const server =
    saved && (!fromGraph || saved.version >= fromGraph.version) ? saved : fromGraph;
  const session: SessionPayload | null =
    store.session ?? (server ? payloadOf(server) : null);
  const squad = graph.memberships
    .filter(
      (m) => m.season_id === match.season_id && m.category_id === match.category_id,
    )
    .map((m) => ({ jersey: m.jersey, player: graph.players.find((p) => p.id === m.player_id) }))
    .filter((x): x is { jersey: number; player: Player } => !!x.player)
    .sort((a, b) => a.jersey - b.jersey);
  const events: EventPayload[] = [
    ...graph.markers.filter((m) => m.match_id === match.id && m.source === "live"),
    ...sent,
    ...store.events,
  ]
    .filter((e, i, all) => all.findIndex((x) => x.id === e.id) === i)
    .filter((e) => !removed.includes(e.id))
    .sort((a, b) => a.seconds - b.seconds);

  const flush = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    let progressed = false;
    try {
      const pending = storeRef.current;
      if (pending.session) {
        try {
          const result: LiveSession = await api("data", {
            kind: "live_sessions",
            payload: pending.session,
            version: pending.base,
          });
          setSaved(result);
          update((s) => ({
            ...s,
            base: result.version,
            session:
              JSON.stringify(s.session) === JSON.stringify(pending.session) ? null : s.session,
          }));
          progressed = true;
        } catch (e) {
          if (retriable(e)) throw e;
          setError(errorMessage(e instanceof Error ? e.message : "INTERNAL_ERROR"));
          update((s) => ({ ...s, session: null }));
        }
      }
      for (const event of storeRef.current.events) {
        try {
          await api("data", { kind: "markers", payload: event, version: 0 });
          setSent((list) => [...list, event]);
          progressed = true;
        } catch (e) {
          if (retriable(e)) throw e;
          // Already stored by an earlier attempt whose answer was lost.
          if (!(e instanceof Error && e.message === "VERSION_CONFLICT"))
            setError(errorMessage(e instanceof Error ? e.message : "INTERNAL_ERROR"));
        }
        update((s) => ({ ...s, events: s.events.filter((x) => x.id !== event.id) }));
      }
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      busy.current = false;
    }
    if (progressed) void refresh();
  }, [refresh, update]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const retry = setInterval(() => {
      const s = storeRef.current;
      if (s.session || s.events.length) void flush();
    }, 5000);
    const back = () => void flush();
    window.addEventListener("online", back);
    const first = setTimeout(back, 0);
    return () => {
      clearInterval(tick);
      clearInterval(retry);
      clearTimeout(first);
      window.removeEventListener("online", back);
    };
  }, [flush]);

  const change = (next: SessionPayload) => {
    setError("");
    update((s) => ({
      ...s,
      base: s.session ? s.base : (server?.version ?? 0),
      session: next,
    }));
    void flush();
  };

  if (!session)
    return (
      <section className="ml-card">
        <h2>{t.live.before}</h2>
        <p className="ml-method">{t.live.noRecording}</p>
        <button
          type="button"
          className="ml-button"
          onClick={() =>
            change({
              id: crypto.randomUUID(),
              match_id: match.id,
              status: "ready",
              present: squad.map((s) => s.player.id),
              first_half_at: null,
              half_time_at: null,
              second_half_at: null,
              finished_at: null,
              notes: [],
              half_summary: null,
              final_summary: null,
            })
          }
        >
          <Play size={17} />
          {t.live.prepare}
        </button>
        {error && <p className="ml-error" role="alert">{error}</p>}
      </section>
    );

  const clock = liveClock(session, now);
  const present = squad.filter((s) => session.present.includes(s.player.id));
  const summarize = (phase: "half_time" | "finished", at: number): LiveSummary => {
    const c = liveClock(
      phase === "half_time"
        ? { ...session, status: "half_time", half_time_at: new Date(at).toISOString() }
        : { ...session, status: "finished", finished_at: new Date(at).toISOString() },
      at,
    );
    return liveSummary(events as Marker[], {
      phase,
      elapsed: c.elapsed,
      split: phase === "finished" && session.second_half_at ? (c.firstLength ?? 0) : c.elapsed / 2,
      present: session.present,
    });
  };
  const pending = store.events.length + (store.session ? 1 : 0);

  return (
    <div className="ml-live">
      <div className="ml-live-bar" role="status" aria-live="polite">
        <div>
          <small>{t.live.phases[session.status]}</small>
          <strong className="ml-live-clock">
            {session.status === "ready" ? "00:00" : clockText(clock.display)}
          </strong>
          {clock.running && <span>{minuteLabel(clock.minute, clock.half)}</span>}
        </div>
        <p className={online ? "ml-muted" : "ml-live-offline"}>
          {!online && <WifiOff size={16} aria-hidden />}
          {pending
            ? `${pending} ${t.live.pending}`
            : online
              ? t.live.synced
              : t.live.offline}
        </p>
        <div className="ml-actions">
          {session.status === "ready" && (
            <button
              type="button"
              className="ml-button"
              onClick={() =>
                change({ ...session, status: "first_half", first_half_at: new Date().toISOString() })
              }
            >
              <Play size={17} />
              {t.live.kickoff}
            </button>
          )}
          {session.status === "first_half" && (
            <button
              type="button"
              className="ml-button secondary"
              onClick={() => {
                const at = Date.now();
                change({
                  ...session,
                  status: "half_time",
                  half_time_at: new Date(at).toISOString(),
                  half_summary: summarize("half_time", at),
                });
              }}
            >
              <Pause size={17} />
              {t.live.halfTime}
            </button>
          )}
          {session.status === "half_time" && (
            <button
              type="button"
              className="ml-button"
              onClick={() =>
                change({ ...session, status: "second_half", second_half_at: new Date().toISOString() })
              }
            >
              <Play size={17} />
              {t.live.secondHalf}
            </button>
          )}
          {["first_half", "half_time", "second_half"].includes(session.status) && (
            <button
              type="button"
              className="ml-button secondary"
              onClick={() => {
                if (!window.confirm(t.live.finishConfirm)) return;
                const at = Date.now();
                change({
                  ...session,
                  status: "finished",
                  finished_at: new Date(at).toISOString(),
                  final_summary: summarize("finished", at),
                });
              }}
            >
              <Flag size={17} />
              {t.live.finish}
            </button>
          )}
        </div>
      </div>
      {error && <p className="ml-error" role="alert">{error}</p>}

      {session.status === "ready" && (
        <Prepare
          session={session}
          squad={squad}
          onPresent={(ids) => change({ ...session, present: ids })}
        />
      )}
      {session.status !== "finished" && <CameraPreview />}
      {clock.running && (
        <Tagging
          players={present}
          onRecord={(event) => {
            const c = liveClock(session, Date.now());
            update((s) => ({
              ...s,
              events: [
                ...s.events,
                {
                  id: crypto.randomUUID(),
                  match_id: match.id,
                  seconds: Math.round(c.elapsed * 10) / 10,
                  end_seconds: null,
                  tags: [],
                  verified: false,
                  source: "live",
                  video_id: null,
                  minute: c.minute,
                  position: null,
                  theme: "",
                  observation: "",
                  ...event,
                },
              ],
            }));
            void flush();
            return minuteLabel(c.minute, c.half);
          }}
        />
      )}
      {session.status !== "ready" && (
        <section className="ml-card">
          <h2>{t.live.recent}</h2>
          {events.length ? (
            <ul className="ml-live-events">
              {[...events]
                .reverse()
                .slice(0, 12)
                .map((e) => {
                  const p = squad.find((s) => s.player.id === e.player_id);
                  const waiting = store.events.some((x) => x.id === e.id);
                  return (
                    <li key={e.id}>
                      <span className="ml-live-minute">
                        {minuteLabel(
                          e.minute ?? 0,
                          clock.firstLength !== null && e.seconds >= clock.firstLength ? 2 : 1,
                        )}
                      </span>
                      <span>
                        <strong>{t.analysis.markerTypes[e.kind]}</strong>
                        {e.outcome && ` · ${t.sequences.outcomes[e.outcome]}`} ·{" "}
                        {p ? `#${p.jersey} ${p.player.full_name}` : t.live.unidentified}
                        {waiting && <small>{t.live.pending}</small>}
                      </span>
                      {session.status !== "finished" && (
                        <button
                          type="button"
                          className="ml-button secondary"
                          onClick={async () => {
                            if (waiting) {
                              update((s) => ({ ...s, events: s.events.filter((x) => x.id !== e.id) }));
                              return;
                            }
                            try {
                              await api("live", { action: "remove", id: e.id });
                              setRemoved((r) => [...r, e.id]);
                              void refresh();
                            } catch (err) {
                              setError(errorMessage(err instanceof Error ? err.message : "INTERNAL_ERROR"));
                            }
                          }}
                        >
                          <Undo2 size={16} />
                          {t.live.undo}
                        </button>
                      )}
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="ml-muted">{t.live.noEvent}</p>
          )}
          <p className="ml-method">{t.live.eventsHint}</p>
        </section>
      )}
      {session.status !== "ready" && (
        <Notes
          session={session}
          disabled={session.status === "finished"}
          onAdd={(text) =>
            change({
              ...session,
              notes: [
                ...session.notes,
                { minute: clock.minute, text, at: new Date().toISOString() },
              ],
            })
          }
        />
      )}
      {session.final_summary && (
        <SummaryView title={t.live.summaryFinal} summary={session.final_summary} squad={squad} />
      )}
      {session.half_summary && (
        <SummaryView title={t.live.summaryHalf} summary={session.half_summary} squad={squad} />
      )}
      {clock.running && events.length > 0 && (
        <details className="ml-card ml-live-preview">
          <summary>{t.live.preview}</summary>
          <SummaryView
            summary={liveSummary(events as Marker[], {
              phase: "half_time",
              elapsed: clock.elapsed,
              split: clock.elapsed / 2,
              present: session.present,
            })}
            squad={squad}
          />
        </details>
      )}
      <section className="ml-card ml-live-ai">
        <h2>{t.live.ai}</h2>
        <p className="ml-muted">{t.live.aiDisabled}</p>
      </section>
      {session.status === "finished" && (
        <Link className="ml-button secondary" href={`/matchlab/analyze?id=${match.id}`}>
          {t.live.openAnalysis}
        </Link>
      )}
    </div>
  );
}

function Prepare({
  session,
  squad,
  onPresent,
}: {
  session: SessionPayload;
  squad: { jersey: number; player: Player }[];
  onPresent: (ids: string[]) => void;
}) {
  const { data } = useLab();
  const photos = squad.filter((s) =>
    data.graph.media.some((m) => m.player_id === s.player.id && m.purpose === "photo"),
  ).length;
  return (
    <div className="ml-analytics-grid">
      <section className="ml-card">
        <h2>{t.live.squad}</h2>
        <p className="ml-method">{t.live.squadHint}</p>
        {squad.length ? (
          <div className="ml-check-grid">
            {squad.map(({ jersey, player }) => (
              <label key={player.id} className="ml-check">
                <input
                  type="checkbox"
                  checked={session.present.includes(player.id)}
                  onChange={(e) =>
                    onPresent(
                      e.target.checked
                        ? [...session.present, player.id]
                        : session.present.filter((x) => x !== player.id),
                    )
                  }
                />
                #{jersey} {player.full_name}
              </label>
            ))}
          </div>
        ) : (
          <p className="ml-muted">{t.live.noSquad}</p>
        )}
      </section>
      <section className="ml-card">
        <h2>{t.live.checks}</h2>
        <ul className="ml-plain-list">
          <li>
            {data.settings.consent_policy ? t.live.policyOk : t.live.policyMissing}
          </li>
          <li>
            {photos}/{squad.length} {t.live.photos}
          </li>
          <li>{t.live.noRecording}</li>
          <li>{t.live.framing}</li>
        </ul>
      </section>
    </div>
  );
}

/** Camera preview only: the stream goes to a <video> element, never to a recorder. */
function CameraPreview() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [on, setOn] = useState(false);
  const [problem, setProblem] = useState("");
  const stop = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setOn(false);
  };
  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), []);
  return (
    <section className="ml-card ml-live-camera">
      <div className="ml-section-title">
        <h2>{t.live.camera}</h2>
        {on ? (
          <button type="button" className="ml-button secondary" onClick={stop}>
            <CameraOff size={17} />
            {t.live.cameraOff}
          </button>
        ) : (
          <button
            type="button"
            className="ml-button secondary"
            onClick={async () => {
              setProblem("");
              if (!navigator.mediaDevices?.getUserMedia) {
                setProblem(t.live.cameraUnavailable);
                return;
              }
              try {
                stream.current = await navigator.mediaDevices.getUserMedia({
                  video: { facingMode: "environment" },
                  audio: false,
                });
                if (video.current) video.current.srcObject = stream.current;
                setOn(true);
              } catch (e) {
                setProblem(
                  e instanceof DOMException && e.name === "NotAllowedError"
                    ? t.live.cameraDenied
                    : t.live.cameraUnavailable,
                );
              }
            }}
          >
            <Camera size={17} />
            {t.live.cameraOn}
          </button>
        )}
      </div>
      <video ref={video} className="ml-live-video" hidden={!on} autoPlay muted playsInline />
      <p className="ml-method">{t.live.cameraHint}</p>
      {problem && <p className="ml-notice">{problem}</p>}
    </section>
  );
}

function Tagging({
  players,
  onRecord,
}: {
  players: { jersey: number; player: Player }[];
  onRecord: (event: {
    kind: Marker["kind"];
    outcome: Marker["outcome"];
    player_id: string | null;
  }) => string;
}) {
  const [kind, setKind] = useState<Marker["kind"]>("duel");
  const [outcome, setOutcome] = useState<Marker["outcome"]>(null);
  const [last, setLast] = useState("");
  const record = (player: { jersey: number; player: Player } | null) => {
    const minute = onRecord({ kind, outcome, player_id: player?.player.id ?? null });
    setLast(
      `${t.live.recorded} : ${t.analysis.markerTypes[kind]}${
        outcome ? ` · ${t.sequences.outcomes[outcome]}` : ""
      } · ${player ? `#${player.jersey}` : t.live.unidentified} · ${minute}`,
    );
    setOutcome(null);
  };
  return (
    <section className="ml-card ml-live-tagging">
      <fieldset>
        <legend>{t.live.action}</legend>
        <div className="ml-live-actions">
          {SEQUENCE_ACTIONS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={kind === a}
              className="ml-live-choice"
              onClick={() => setKind(a)}
            >
              {t.analysis.markerTypes[a]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t.live.outcome}</legend>
        <div className="ml-live-outcomes">
          {([null, "success", "fail"] as const).map((o) => (
            <button
              key={o ?? "none"}
              type="button"
              aria-pressed={outcome === o}
              className="ml-live-choice"
              onClick={() => setOutcome(o)}
            >
              {o ? t.sequences.outcomes[o] : t.live.noOutcome}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t.live.tapPlayer}</legend>
        <div className="ml-live-players">
          {players.map((p) => (
            <button
              key={p.player.id}
              type="button"
              className="ml-live-player"
              onClick={() => record(p)}
              aria-label={`#${p.jersey} ${p.player.full_name}`}
            >
              <PlayerAvatar playerId={p.player.id} name={p.player.full_name} size={40} />
              <strong>#{p.jersey}</strong>
              <small>{p.player.full_name}</small>
            </button>
          ))}
          <button
            type="button"
            className="ml-live-player ml-live-unknown"
            onClick={() => record(null)}
          >
            <strong>?</strong>
            <small>{t.live.unidentified}</small>
          </button>
        </div>
      </fieldset>
      <p className="ml-success ml-live-last" role="status" hidden={!last}>
        {last}
      </p>
    </section>
  );
}

function Notes({
  session,
  disabled,
  onAdd,
}: {
  session: SessionPayload;
  disabled: boolean;
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <section className="ml-card">
      <h2>{t.live.notes}</h2>
      {!disabled && (
        <form
          className="ml-live-note"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onAdd(text.trim());
            setText("");
          }}
        >
          <input
            value={text}
            maxLength={500}
            placeholder={t.live.notePlaceholder}
            aria-label={t.live.notes}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="ml-button secondary">{t.live.addNote}</button>
        </form>
      )}
      {session.notes.length ? (
        <ul className="ml-plain-list">
          {[...session.notes].reverse().map((n) => (
            <li key={n.at}>
              <small>{n.minute}&apos;</small>
              {n.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ml-muted">{t.live.noNote}</p>
      )}
    </section>
  );
}

function SummaryView({
  title,
  summary: s,
  squad,
}: {
  title?: string;
  summary: LiveSummary;
  squad: { jersey: number; player: Player }[];
}) {
  const who = (id: string) => squad.find((x) => x.player.id === id);
  const name = (id: string) => {
    const p = who(id);
    return p ? `#${p.jersey} ${p.player.full_name}` : t.live.unidentified;
  };
  const standout = s.standout ? s.players.find((p) => p.player_id === s.standout) : null;
  const body = (
    <>
      <p className="ml-method">
        {s.minutes} {t.live.observed} · {s.events} {t.live.events} · {s.unidentified}{" "}
        {t.live.unidentifiedCount}
      </p>
      <div className="ml-analytics-grid">
        <div>
          <h3>{t.live.collective}</h3>
          <ul className="ml-plain-list">
            {s.collective.map((c) => (
              <li key={c.kind}>
                <strong>{t.analysis.markerTypes[c.kind]}</strong> · {c.total}{" "}
                {t.live.actions} · {c.success} {t.live.successes} · {c.fail}{" "}
                {t.live.toCorrect}
              </li>
            ))}
          </ul>
          <h3>{t.live.trends}</h3>
          {s.trends.length ? (
            <ul className="ml-plain-list">
              {s.trends.map((tr) => (
                <li key={tr.kind}>
                  {t.analysis.markerTypes[tr.kind]} : {tr.before} → {tr.after} (
                  {tr.after > tr.before ? t.live.trendUp : t.live.trendDown})
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-muted">{t.live.noTrend}</p>
          )}
          <small className="ml-muted">{t.live.trendHint}</small>
          <h3>{t.live.workAxes}</h3>
          {s.workAxes.length ? (
            <ul className="ml-plain-list">
              {s.workAxes.map((w) => (
                <li key={w.kind}>
                  {t.analysis.markerTypes[w.kind]} : {w.fail} {t.live.toCorrect} /{" "}
                  {w.qualified}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-muted">{t.live.noWork}</p>
          )}
        </div>
        <div>
          <h3>{t.live.standout}</h3>
          {standout ? (
            <div className="ml-live-standout">
              <PlayerAvatar playerId={standout.player_id} name={who(standout.player_id)?.player.full_name} size={64} />
              <div>
                <strong>{name(standout.player_id)}</strong>
                <p>
                  {who(standout.player_id) &&
                    positionNames[who(standout.player_id)!.player.usual_position]}{" "}
                  · {standout.total} {t.live.actions} · {standout.success}{" "}
                  {t.live.successes} · {standout.fail} {t.live.toCorrect}
                </p>
                <small>
                  {t.live.reasons} :{" "}
                  {standout.kinds
                    .map((k) => `${t.analysis.markerTypes[k.kind]} ${k.success}/${k.total}`)
                    .join(" · ")}{" "}
                  · {s.minutes} {t.live.observed}
                </small>
              </div>
            </div>
          ) : (
            <p className="ml-muted">{t.live.noStandout}</p>
          )}
          <p className="ml-method">{t.decision}</p>
          {s.observe.length > 0 && (
            <>
              <h3>{t.live.observe}</h3>
              <ul className="ml-plain-list">
                {s.observe.map((o) => (
                  <li key={o.player_id}>
                    {name(o.player_id)} · {t.analysis.markerTypes[o.kind]}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <h3>{t.live.players}</h3>
      {s.players.length ? (
        <div className="ml-table-wrap">
          <table>
            <tbody>
              {s.players.map((p) => (
                <tr key={p.player_id}>
                  <td>{name(p.player_id)}</td>
                  <td>
                    <span className={`ml-badge ml-live-${p.status}`}>
                      {t.live.statuses[p.status]}
                    </span>
                  </td>
                  <td className="ml-num">
                    {p.total} {t.live.actions}
                  </td>
                  <td className="ml-num">
                    {p.success} {t.live.successes} · {p.fail} {t.live.toCorrect}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="ml-muted">{t.live.noEvent}</p>
      )}
      {s.presentWithoutEvent > 0 && (
        <p className="ml-muted">
          {s.presentWithoutEvent} {t.live.presentWithout}
        </p>
      )}
      <p className="ml-method">{t.live.statusRule}</p>
    </>
  );
  return title ? (
    <section className="ml-card ml-live-summary">
      <h2>{title}</h2>
      <p className="ml-muted">
        {t.live.frozen} {new Date(s.generated_at).toLocaleString("fr-FR")}
      </p>
      {body}
    </section>
  ) : (
    body
  );
}
