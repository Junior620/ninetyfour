"use client";
import { useState } from "react";
import { Play, Plus } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import {
  SEQUENCE_ACTIONS,
  type Marker,
  type Match,
  type Player,
} from "@/lib/matchlab/schema";
import {
  sequenceIndicators,
  timecode,
  parseTags,
} from "@/lib/matchlab/sequences";
import { useLab, useMutation, api, Feedback, PlayerAvatar, Empty } from "./shared";

const THEMES = [
  "Technique",
  "Placement",
  "Vitesse",
  "Décision",
  "Duels",
  "Finition",
  "Comportement",
] as const;
type Outcome = Marker["outcome"];
/** ml_save merges a payload over the row, but the schema fills defaults: send it all. */
const full = (m: Marker) => ({
  id: m.id,
  match_id: m.match_id,
  player_id: m.player_id,
  seconds: m.seconds,
  end_seconds: m.end_seconds,
  kind: m.kind,
  outcome: m.outcome,
  tags: m.tags,
  verified: m.verified,
  source: m.source,
  video_id: m.video_id,
  minute: m.minute,
  position: m.position,
  theme: m.theme,
  observation: m.observation,
});

/** Timestamped sequences: creation at the video's current time, review and indicators. */
export function Sequences({
  match,
  players,
  videoRef,
  videoId,
  hasVideo,
}: {
  match?: Match;
  players: Player[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoId: string | null;
  hasVideo: boolean;
}) {
  const { data } = useLab();
  const canWrite = data.member.role !== "reader";
  const mutation = useMutation();
  const [player, setPlayer] = useState("");
  const [theme, setTheme] = useState("");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [filterPlayer, setFilterPlayer] = useState("");
  const [filterKind, setFilterKind] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const byId = new Map(players.map((p) => [p.id, p]));
  const markers = data.graph.markers
    .filter((m) => m.match_id === match?.id)
    .sort((a, b) => a.seconds - b.seconds);
  const shown = markers.filter(
    (m) =>
      (!filterPlayer ||
        (filterPlayer === "none" ? !m.player_id : m.player_id === filterPlayer)) &&
      (!filterKind || m.kind === filterKind),
  );
  const indicators = sequenceIndicators(markers, {
    playerId: filterPlayer && filterPlayer !== "none" ? filterPlayer : undefined,
  });
  const seek = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return window.alert(t.analysis.noVideo);
    v.currentTime = seconds;
    v.focus();
  };
  const save = (payload: object, version: number) =>
    mutation.run(async () => {
      await api("data", { kind: "markers", version, payload });
    });

  return (
    <div className="ml-sequences">
      {canWrite && match && (
        <fieldset className="ml-sequence-create" disabled={mutation.busy}>
          <legend>{t.sequences.actions}</legend>
          <div className="ml-form-grid">
            <label>
              {t.sequences.player}
              <select value={player} onChange={(e) => setPlayer(e.target.value)}>
                <option value="">{t.sequences.unknownPlayer}</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.analysis.theme}
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="">—</option>
                {THEMES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <fieldset className="wide ml-outcomes">
              <legend>{t.sequences.outcome}</legend>
              {(["success", "fail", null] as Outcome[]).map((o) => (
                <label key={String(o)} className="ml-check">
                  <input
                    type="radio"
                    name="sequence-outcome"
                    checked={outcome === o}
                    onChange={() => setOutcome(o)}
                  />
                  {t.sequences.outcomes[o ?? "none"]}
                </label>
              ))}
            </fieldset>
            <label>
              {t.sequences.tags}
              <input value={tags} maxLength={300} onChange={(e) => setTags(e.target.value)} />
            </label>
            <label>
              {t.analysis.observation}
              <input value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>
          <div className="ml-marker-actions">
            {SEQUENCE_ACTIONS.map((kind) => (
              <button
                key={kind}
                type="button"
                className="ml-button secondary"
                disabled={!hasVideo}
                onClick={() =>
                  save(
                    {
                      match_id: match.id,
                      player_id: player || null,
                      seconds: Math.round((videoRef.current?.currentTime ?? 0) * 10) / 10,
                      end_seconds: null,
                      kind,
                      outcome,
                      tags: parseTags(tags),
                      verified: false,
                      source: "manual",
                      video_id: videoId,
                      minute: null,
                      position: player ? (byId.get(player)?.usual_position ?? null) : null,
                      theme,
                      observation: note,
                    },
                    0,
                  ).then((ok) => ok && setNote(""))
                }
              >
                <Plus size={14} />
                {t.analysis.markerTypes[kind]}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <Feedback {...mutation} />
      <h3>{t.sequences.title}</h3>
      <div className="ml-form-grid ml-sequence-filters">
        <label>
          {t.sequences.filterPlayer}
          <select value={filterPlayer} onChange={(e) => setFilterPlayer(e.target.value)}>
            <option value="">{t.sequences.all}</option>
            <option value="none">{t.sequences.unknownPlayer}</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.sequences.filterAction}
          <select value={filterKind} onChange={(e) => setFilterKind(e.target.value)}>
            <option value="">{t.sequences.all}</option>
            {Object.entries(t.analysis.markerTypes).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      {shown.length ? (
        <ul className="ml-sequence-list">
          {shown.map((m) => {
            const p = m.player_id ? byId.get(m.player_id) : undefined;
            return (
              <li key={m.id} className="ml-sequence">
                <button type="button" className="ml-marker" onClick={() => seek(m.seconds)}>
                  <time>
                    {timecode(m.seconds)}
                    {m.end_seconds !== null && ` – ${timecode(m.end_seconds)}`}
                  </time>
                  <span>
                    <strong>
                      {t.analysis.markerTypes[m.kind]}
                      {m.outcome && (
                        <span className={`ml-outcome ${m.outcome}`}>
                          {" "}
                          · {t.sequences.outcomes[m.outcome]}
                        </span>
                      )}
                    </strong>
                    {m.observation && <small>{m.observation}</small>}
                  </span>
                  <Play size={14} aria-hidden />
                </button>
                <div className="ml-sequence-meta">
                  {p ? (
                    <span className="ml-sequence-player">
                      <PlayerAvatar playerId={p.id} name={p.full_name} size={28} />
                      {p.full_name}
                    </span>
                  ) : (
                    <span>{t.sequences.unknownPlayer}</span>
                  )}
                  <span className={`ml-badge${m.verified ? " ml-badge-reviewed" : ""}`}>
                    {m.verified ? t.sequences.verified : t.sequences.unverified}
                  </span>
                  <span>{t.sequences.sources[m.source]}</span>
                  {m.tags.map((tag) => (
                    <span key={tag} className="ml-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                {canWrite && (
                  <div className="ml-actions">
                    <button
                      type="button"
                      className="ml-button secondary"
                      disabled={!hasVideo || mutation.busy}
                      onClick={() => {
                        const now = videoRef.current?.currentTime ?? 0;
                        if (now >= m.seconds)
                          save({ ...full(m), end_seconds: Math.round(now * 10) / 10 }, m.version);
                      }}
                    >
                      {t.sequences.end}
                    </button>
                    <button
                      type="button"
                      className="ml-button secondary"
                      aria-expanded={editing === m.id}
                      onClick={() => setEditing(editing === m.id ? null : m.id)}
                    >
                      {t.sequences.edit}
                    </button>
                  </div>
                )}
                {editing === m.id && canWrite && (
                  <form
                    className="ml-form-grid ml-sequence-edit"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      const playerId = String(f.get("player") || "") || null;
                      const ok = await save(
                        {
                          ...full(m),
                          player_id: playerId,
                          position: playerId
                            ? (byId.get(playerId)?.usual_position ?? null)
                            : null,
                          outcome: (String(f.get("outcome") || "") || null) as Outcome,
                          verified: f.get("verified") === "on",
                          tags: parseTags(String(f.get("tags") || "")),
                          observation: String(f.get("observation") || ""),
                        },
                        m.version,
                      );
                      if (ok) setEditing(null);
                    }}
                  >
                    <label>
                      {t.sequences.player}
                      <select name="player" defaultValue={m.player_id ?? ""}>
                        <option value="">{t.sequences.unknownPlayer}</option>
                        {players.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.full_name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t.sequences.outcome}
                      <select name="outcome" defaultValue={m.outcome ?? ""}>
                        <option value="">{t.sequences.outcomes.none}</option>
                        <option value="success">{t.sequences.outcomes.success}</option>
                        <option value="fail">{t.sequences.outcomes.fail}</option>
                      </select>
                    </label>
                    <label>
                      {t.sequences.tags}
                      <input name="tags" defaultValue={m.tags.join(", ")} maxLength={300} />
                    </label>
                    <label>
                      {t.analysis.observation}
                      <input name="observation" defaultValue={m.observation} maxLength={2000} />
                    </label>
                    <label className="ml-check wide">
                      <input type="checkbox" name="verified" defaultChecked={m.verified} />
                      {t.sequences.verify}
                    </label>
                    <button className="ml-button" disabled={mutation.busy}>
                      {t.sequences.save}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty />
      )}
      <section className="ml-indicators" aria-label={t.sequences.indicators}>
        <h3>{t.sequences.indicators}</h3>
        <p className="ml-method">{t.sequences.indicatorsHint}</p>
        {indicators.length ? (
          <div className="ml-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.sequences.filterAction}</th>
                  <th>{t.sequences.outcome}</th>
                  <th>{t.sequences.title}</th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((i) => (
                  <tr key={i.kind}>
                    <td>
                      <strong>{t.analysis.markerTypes[i.kind]}</strong>
                      <small>
                        {i.total} {t.sequences.sample}
                      </small>
                    </td>
                    <td>
                      {i.success + i.fail
                        ? `${i.success}/${i.success + i.fail} ${t.sequences.successRate}`
                        : "—"}
                      {i.open > 0 && (
                        <small>
                          {i.open} {t.sequences.outcomes.none.toLowerCase()}
                        </small>
                      )}
                    </td>
                    <td className="ml-indicator-links">
                      {i.sequences.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="ml-timecode"
                          onClick={() => seek(s.seconds)}
                        >
                          {timecode(s.seconds)}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ml-muted">{t.sequences.noSequence}</p>
        )}
        <p className="ml-method">{t.sequences.physical}</p>
      </section>
    </div>
  );
}
