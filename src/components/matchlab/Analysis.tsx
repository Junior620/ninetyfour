"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lightbulb, Play, Plus, Save } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import {
  CIRCUMSTANCE_KEYS,
  EVENTS,
  GROUNDS,
} from "@/lib/matchlab/circumstances";
import {
  commonQuestions,
  specificQuestions,
  collectiveQuestions,
  POSITIONS,
  positionNames,
  type Position,
  type Question,
} from "@/lib/matchlab/questionnaire";
import {
  individualScore,
  collectiveScore,
  displayScore,
  type Answers,
} from "@/lib/matchlab/scoring";
import type { Evaluation, Match, Player } from "@/lib/matchlab/schema";
import {
  useLab,
  useMutation,
  api,
  Heading,
  ScopeFields,
  Feedback,
  Empty,
  Status,
  fundamentalKeys,
  PlayerAvatar,
  jerseyFor,
} from "./shared";

export function Analysis({ id }: { id?: string }) {
  const { data } = useLab();
  const match = data.graph.matches.find((m) => m.id === id);
  if (id && !match) return <Empty />;
  return <AnalysisForm key={id || "new"} match={match} />;
}
function Questions({
  items,
  values,
  onChange,
}: {
  items: Question[];
  values: Answers;
  onChange: (a: Answers) => void;
}) {
  return (
    <div className="ml-questions">
      {items.map((q) => (
        <label key={q.id}>
          <span>
            <strong>{q.label}</strong>
            <small>{q.text}</small>
          </span>
          <select
            value={
              q.id in values
                ? values[q.id] === null
                  ? "unobserved"
                  : String(values[q.id])
                : ""
            }
            onChange={(e) => {
              const next = { ...values };
              if (e.target.value === "") delete next[q.id];
              else
                next[q.id] =
                  e.target.value === "unobserved"
                    ? null
                    : Number(e.target.value);
              onChange(next);
            }}
          >
            <option value="">{t.analysis.unanswered}</option>
            <option value="unobserved">{t.analysis.unobserved}</option>
            {t.analysis.scale.map((v, i) => (
              <option key={v} value={i + 1}>
                {i + 1} — {v}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
/** Reference choices; a free value saved before these lists stays selectable. */
function Choice({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: string[];
  value?: string;
}) {
  const previous = value && !options.includes(value) ? value : "";
  return (
    <label>
      {label}
      <select name={name} defaultValue={value || ""}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
        {previous && (
          <option value={previous}>
            {previous} · {t.match.previousValue}
          </option>
        )}
      </select>
    </label>
  );
}
function CircumstanceFields({
  value = {},
}: {
  value?: Match["circumstances"];
}) {
  const choice = (key: keyof typeof t.match.choices) => (
    <Choice
      key={key}
      name={`c_${key}`}
      label={t.match.circumstanceKeys[key]}
      options={t.match.choices[key]}
      value={value[key]}
    />
  );
  return (
    <div className="ml-form-grid ml-circumstance-grid">
      {choice("match_type")}
      <label>
        {t.match.circumstanceKeys.ground}
        <select name="c_ground" defaultValue={value.ground || ""}>
          <option value="">—</option>
          {GROUNDS.map((g) => (
            <option key={g} value={g}>
              {t.match.grounds[g]}
            </option>
          ))}
        </select>
      </label>
      {(
        [
          "surface",
          "pitch",
          "weather",
          "opposition",
          "system",
          "scenario",
        ] as const
      ).map(choice)}
      <fieldset className="wide ml-events">
        <legend>{t.match.circumstanceKeys.events}</legend>
        {EVENTS.map((e) => (
          <label key={e} className="ml-check">
            <input
              type="checkbox"
              name="c_events"
              value={e}
              defaultChecked={value.events?.includes(e)}
            />
            {t.match.events[e]}
          </label>
        ))}
      </fieldset>
      <label>
        {t.match.circumstanceKeys.absences}
        <textarea
          name="c_absences"
          maxLength={1000}
          defaultValue={value.absences}
        />
      </label>
      <label>
        {t.match.circumstanceKeys.incidents}
        <textarea
          name="c_incidents"
          maxLength={2000}
          defaultValue={value.incidents}
        />
      </label>
      <label>
        {t.match.circumstanceKeys.travel}
        <input name="c_travel" maxLength={300} defaultValue={value.travel} />
      </label>
      <label>
        {t.match.circumstanceKeys.duration}
        <input
          name="c_duration"
          type="number"
          min={1}
          max={150}
          defaultValue={value.duration ?? ""}
        />
      </label>
    </div>
  );
}
function TargetProfile({
  match,
  players,
}: {
  match?: Match;
  players: Player[];
}) {
  const { data } = useLab();
  const targets = data.graph.targets.filter(
    (target) =>
      !match ||
      (target.season_id === match.season_id &&
        target.category_id === match.category_id),
  );
  const [targetId, setTargetId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const target = targets.find((x) => x.id === targetId) || targets[0];
  const player = players.find((p) => p.id === playerId);
  const rating = (v?: number | null) => (v == null ? "—" : `${v}/5`);
  return (
    <section className="ml-card ml-target-card">
      <div className="ml-section-title">
        <h2>{t.analysis.target}</h2>
        <small>{t.analysis.targetMeta}</small>
      </div>
      {targets.length ? (
        <div className="ml-form-grid">
          <label>
            {t.analysis.targetPosition}
            <select
              value={target?.id}
              onChange={(e) => setTargetId(e.target.value)}
            >
              {targets.map((x) => (
                <option key={x.id} value={x.id}>
                  {positionNames[x.position]} · {x.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.analysis.targetCompare}
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
            >
              <option value="">—</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <p className="ml-notice">{t.analysis.targetNone}</p>
      )}
      {target && player ? (
        <div className="ml-table-wrap">
          <table className="ml-target-table">
            <thead>
              <tr>
                <th>{t.analysis.targetCriterion}</th>
                <th>{t.analysis.targetPlayer}</th>
                <th>{t.analysis.targetRequired}</th>
              </tr>
            </thead>
            <tbody>
              {fundamentalKeys.map((k, i) => (
                <tr key={k}>
                  <td>{t.players.columns[i + 2]}</td>
                  <td>{rating(player.fundamentals[k])}</td>
                  <td>{rating(target.fundamentals[k])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        target && <p className="ml-target-empty">{t.analysis.targetEmpty}</p>
      )}
      <p className="ml-method">{t.analysis.targetNote}</p>
      <Link className="ml-button secondary" href="/matchlab/players">
        {t.analysis.manageProfiles} →
      </Link>
    </section>
  );
}
function AnalysisForm({ match }: { match?: Match }) {
  const { data } = useLab();
  const router = useRouter();
  const mutation = useMutation();
  const video = useRef<HTMLVideoElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState(match?.video_name || "");
  const [collective, setCollective] = useState<Answers>(
    match?.collective || {},
  );
  const [matchDirty, setMatchDirty] = useState(false);
  const [evaluationDirty, setEvaluationDirty] = useState(false);
  const dirty = matchDirty || evaluationDirty;
  const [formKey, setFormKey] = useState(0);
  const [position, setPosition] = useState<Position>("CM");
  const [player, setPlayer] = useState("");
  const [common, setCommon] = useState<Answers>({});
  const [specific, setSpecific] = useState<Answers>({});
  const [evaluation, setEvaluation] = useState<Evaluation | undefined>();
  const [observation, setObservation] = useState("");
  const [priorities, setPriorities] = useState("");
  const [minutes, setMinutes] = useState("");
  const [markerPlayer, setMarkerPlayer] = useState("");
  const [markerNote, setMarkerNote] = useState("");
  const [markerTheme, setMarkerTheme] = useState("");
  const canWrite = data.member.role !== "reader";
  const players = match
    ? data.graph.players.filter((p) =>
        data.graph.memberships.some(
          (m) =>
            m.player_id === p.id &&
            m.season_id === match.season_id &&
            m.category_id === match.category_id,
        ),
      )
    : [];
  const evaluations = data.graph.evaluations.filter(
    (e) => e.match_id === match?.id,
  );
  const markers = data.graph.markers.filter((m) => m.match_id === match?.id);
  useEffect(
    () => () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    },
    [videoUrl],
  );
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  const loadEvaluation = (
    selectedPlayer: string,
    selectedPosition: Position,
  ) => {
    const saved = evaluations.find(
      (e) => e.player_id === selectedPlayer && e.position === selectedPosition,
    );
    setEvaluation(saved);
    setEvaluationDirty(false);
    setCommon(saved?.common || {});
    setSpecific(saved?.specific || {});
    setObservation(saved?.observation || "");
    setPriorities(saved?.priorities || "");
    setMinutes(saved?.minutes?.toString() || "");
  };
  const score = individualScore(common, specific);
  const evaluated = players.find((p) => p.id === player);
  return (
    <>
      <Heading title={t.analysis.title} eyebrow={t.analysis.eyebrow}>
        <div className="ml-actions">
          <p
            className={`ml-save-state${dirty ? " dirty" : match ? "" : " new"}`}
            role="status"
          >
            {dirty
              ? t.analysis.unsavedState
              : match
                ? `${t.analysis.lastSaved} · ${new Date(
                    match.updated_at,
                  ).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                : t.analysis.notSaved}
          </p>
          <button
            className="ml-button secondary"
            type="button"
            onClick={() => {
              if (dirty && !window.confirm(t.unsaved)) return;
              setCollective(match?.collective || {});
              setFormKey((k) => k + 1);
              setVideoUrl("");
              setMarkerNote("");
              setMarkerTheme("");
              setVideoName(match?.video_name || "");
              loadEvaluation(player, position);
              setMatchDirty(false);
            }}
          >
            {t.analysis.reset}
          </button>
          {canWrite && (
            <button
              className="ml-button"
              disabled={mutation.busy}
              onClick={() => form.current?.requestSubmit()}
            >
              <Save size={17} />
              {t.analysis.save}
            </button>
          )}
        </div>
      </Heading>
      <Feedback {...mutation} />
      <form
        key={formKey}
        ref={form}
        className="ml-card ml-match-form"
        data-tour="match-form"
        onChange={() => setMatchDirty(true)}
        onSubmit={async (e) => {
          e.preventDefault();
          const fields = new FormData(e.currentTarget);
          const values = Object.fromEntries(fields);
          const circumstances: Record<string, unknown> = {};
          for (const key of CIRCUMSTANCE_KEYS) {
            if (key === "events") {
              const events = fields.getAll("c_events").map(String);
              if (events.length) circumstances.events = events;
              continue;
            }
            const value = String(fields.get(`c_${key}`) ?? "").trim();
            if (value)
              circumstances[key] = key === "duration" ? Number(value) : value;
          }
          await mutation.run(async () => {
            const saved = await api("data", {
              kind: "matches",
              version: match?.version || 0,
              payload: {
                ...(match ? { id: match.id } : {}),
                season_id: values.season_id,
                category_id: values.category_id,
                opponent: values.opponent,
                played_on: values.played_on,
                competition: values.competition,
                venue: values.venue,
                home_score:
                  values.home_score === "" ? null : Number(values.home_score),
                away_score:
                  values.away_score === "" ? null : Number(values.away_score),
                status: values.status,
                context: values.context,
                circumstances,
                collective,
                video_name: videoName || null,
              },
            });
            setMatchDirty(false);
            if (!match) router.replace(`/matchlab/analyze?id=${saved.id}`);
          });
        }}
      >
        <fieldset disabled={!canWrite || mutation.busy}>
          <div className="ml-form-grid">
            <fieldset disabled={!!match} className="ml-form-grid wide">
              <ScopeFields
                season={match?.season_id}
                category={match?.category_id}
              />
            </fieldset>
            {match && (
              <>
                <input type="hidden" name="season_id" value={match.season_id} />
                <input
                  type="hidden"
                  name="category_id"
                  value={match.category_id}
                />
              </>
            )}
            <label>
              {t.match.opponent}
              <input
                name="opponent"
                required
                minLength={2}
                maxLength={160}
                defaultValue={match?.opponent}
              />
            </label>
            <label>
              {t.match.date}
              <input
                type="date"
                name="played_on"
                required
                defaultValue={match?.played_on}
              />
            </label>
            <label>
              {t.match.homeScore}
              <input
                name="home_score"
                type="number"
                min={0}
                max={99}
                defaultValue={match?.home_score ?? ""}
              />
            </label>
            <label>
              {t.match.awayScore}
              <input
                name="away_score"
                type="number"
                min={0}
                max={99}
                defaultValue={match?.away_score ?? ""}
              />
            </label>
            <label>
              {t.match.competition}
              <input name="competition" defaultValue={match?.competition} />
            </label>
            <label>
              {t.match.venue}
              <input name="venue" defaultValue={match?.venue} />
            </label>
            <label>
              {t.status}
              <select name="status" defaultValue={match?.status || "draft"}>
                <option value="draft">{t.draft}</option>
                <option value="evaluated">{t.evaluated}</option>
              </select>
            </label>
            <label className="wide">
              {t.match.context}
              <textarea
                name="context"
                maxLength={5000}
                defaultValue={match?.context}
              />
            </label>
          </div>
          <details className="ml-circumstances" open>
            <summary>{t.match.circumstances}</summary>
            <p>{t.match.circumstanceHint}</p>
            <CircumstanceFields value={match?.circumstances} />
          </details>
        </fieldset>
      </form>
      <div className="ml-analysis-grid">
        <section className="ml-card" id="video">
          <div className="ml-section-title">
            <h2>{t.overview.library}</h2>
            {match && <Status value={match.status} />}
          </div>
          <div className="ml-video-stage">
            {videoUrl ? (
              <video ref={video} src={videoUrl} controls playsInline />
            ) : (
              <div>
                <Play size={42} />
                <p>{t.analysis.chooseVideo}</p>
                {videoName && <small>{videoName}</small>}
              </div>
            )}
          </div>
          <label className="ml-video-select">
            {t.analysis.chooseVideo}
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setVideoUrl(URL.createObjectURL(file));
                  setVideoName(file.name);
                  setMatchDirty(true);
                }
              }}
            />
          </label>
          <p className="ml-muted">{t.analysis.local}</p>
          <small>{t.analysis.reselect}</small>
          <div className="ml-marker-actions">
            {Object.entries(t.analysis.markerTypes).map(([kind, label]) => (
              <button
                key={kind}
                className="ml-button secondary"
                disabled={!canWrite || !match || !videoUrl || mutation.busy}
                onClick={() =>
                  mutation.run(async () => {
                    await api("data", {
                      kind: "markers",
                      version: 0,
                      payload: {
                        match_id: match?.id,
                        player_id: markerPlayer || null,
                        seconds: video.current?.currentTime || 0,
                        kind,
                        position: markerPlayer ? position : null,
                        theme: markerTheme,
                        observation: markerNote,
                      },
                    });
                    setMarkerNote("");
                  })
                }
              >
                <Plus size={14} />
                {label}
              </button>
            ))}
          </div>
          <div className="ml-form-grid">
            <label>
              {t.analysis.markerPlayer}
              <select
                value={markerPlayer}
                onChange={(e) => setMarkerPlayer(e.target.value)}
              >
                <option value="">—</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.analysis.theme}
              <select
                value={markerTheme}
                onChange={(e) => setMarkerTheme(e.target.value)}
              >
                <option value="">—</option>
                {[
                  "Technique",
                  "Placement",
                  "Vitesse",
                  "Décision",
                  "Duels",
                  "Finition",
                  "Comportement",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              {t.analysis.observation}
              <textarea
                value={markerNote}
                onChange={(e) => setMarkerNote(e.target.value)}
              />
            </label>
          </div>
          <div className="ml-tip">
            <Lightbulb size={17} aria-hidden />
            <div>
              <strong>{t.analysis.tip}</strong>
              <p>{t.analysis.tipText}</p>
            </div>
          </div>
          <h3>{t.analysis.markers}</h3>
          {markers.length ? (
            markers.map((m) => (
              <button
                className="ml-marker"
                key={m.id}
                onClick={() => {
                  if (video.current) {
                    video.current.currentTime = m.seconds;
                    video.current.focus();
                  } else window.alert(t.analysis.noVideo);
                }}
              >
                <time>
                  {Math.floor(m.seconds / 60)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {Math.floor(m.seconds % 60)
                    .toString()
                    .padStart(2, "0")}
                </time>
                <span>
                  <strong>{t.analysis.markerTypes[m.kind]}</strong>
                  <small>{m.observation}</small>
                </span>
                <Play size={14} />
              </button>
            ))
          ) : (
            <Empty />
          )}
        </section>
        <div className="ml-analysis-side">
          <section className="ml-card" data-tour="collective">
            <h2>{t.analysis.collective}</h2>
            <p className="ml-score-line">
              {t.analysis.score}
              <strong>{displayScore(collectiveScore(collective))}</strong>
            </p>
            <fieldset disabled={!canWrite}>
              <Questions
                items={collectiveQuestions}
                values={collective}
                onChange={(v) => {
                  setCollective(v);
                  setMatchDirty(true);
                }}
              />
            </fieldset>
            <p className="ml-method">{t.match.circumstanceHint}</p>
          </section>
          <TargetProfile
            match={match}
            players={match ? players : data.graph.players}
          />
        </div>
      </div>
      <section className="ml-card ml-individual" data-tour="individual">
        <h2>{t.analysis.individual}</h2>
        {!match ? (
          <p className="ml-notice">{t.analysis.saveFirst}</p>
        ) : (
          <>
            <div className="ml-form-grid">
              <label>
                {t.analysis.selectPlayer}
                <select
                  value={player}
                  onChange={(e) => {
                    if (evaluationDirty && !window.confirm(t.unsaved)) return;
                    setPlayer(e.target.value);
                    loadEvaluation(e.target.value, position);
                  }}
                >
                  <option value="">—</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.analysis.observed}
                <select
                  value={position}
                  onChange={(e) => {
                    if (
                      (Object.keys(specific).length || evaluationDirty) &&
                      !window.confirm(t.analysis.changePosition)
                    )
                      return;
                    const next = e.target.value as Position;
                    setPosition(next);
                    loadEvaluation(player, next);
                  }}
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {positionNames[p]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {evaluated && (
              <div className="ml-eval-player">
                <PlayerAvatar
                  playerId={evaluated.id}
                  name={evaluated.full_name}
                  size={56}
                />
                <div>
                  <strong>{evaluated.full_name}</strong>
                  <small>
                    #
                    {jerseyFor(
                      data.graph,
                      evaluated.id,
                      match.season_id,
                      match.category_id,
                    ) ?? "—"}{" "}
                    · {positionNames[position]} ·{" "}
                    {minutes ? `${minutes} min` : `${t.analysis.minutes} —`}
                  </small>
                </div>
              </div>
            )}
            {player && (
              <fieldset disabled={!canWrite || mutation.busy}>
                <div className="ml-question-grid">
                  <section>
                    <h3>{t.analysis.common}</h3>
                    <Questions
                      items={commonQuestions}
                      values={common}
                      onChange={(v) => {
                        setCommon(v);
                        setEvaluationDirty(true);
                      }}
                    />
                  </section>
                  <section>
                    <h3>{t.analysis.specific}</h3>
                    <Questions
                      items={specificQuestions[position]}
                      values={specific}
                      onChange={(v) => {
                        setSpecific(v);
                        setEvaluationDirty(true);
                      }}
                    />
                  </section>
                </div>
                <p className="ml-score-line">
                  {t.analysis.score}
                  <strong>{displayScore(score)}</strong>
                </p>
                {score === null && (
                  <p className="ml-notice">{t.analysis.noScore}</p>
                )}
                <div className="ml-form-grid">
                  <label>
                    {t.analysis.minutes}
                    <input
                      type="number"
                      min={0}
                      max={150}
                      value={minutes}
                      onChange={(e) => {
                        setMinutes(e.target.value);
                        setEvaluationDirty(true);
                      }}
                    />
                  </label>
                  <label>
                    {t.reports.highlight}
                    <textarea
                      value={observation}
                      onChange={(e) => {
                        setObservation(e.target.value);
                        setEvaluationDirty(true);
                      }}
                    />
                  </label>
                  <label className="wide">
                    {t.analysis.priorities}
                    <textarea
                      value={priorities}
                      onChange={(e) => {
                        setPriorities(e.target.value);
                        setEvaluationDirty(true);
                      }}
                    />
                  </label>
                </div>
                <button
                  className="ml-button"
                  onClick={() =>
                    mutation.run(async () => {
                      const saved = await api("data", {
                        kind: "evaluations",
                        version: evaluation?.version || 0,
                        payload: {
                          ...(evaluation ? { id: evaluation.id } : {}),
                          match_id: match.id,
                          player_id: player,
                          position,
                          common,
                          specific,
                          observation,
                          priorities,
                          minutes: minutes === "" ? null : Number(minutes),
                          questionnaire_version: "pdf-1.1",
                        },
                      });
                      setEvaluation(saved);
                      setEvaluationDirty(false);
                    })
                  }
                >
                  {t.analysis.saveEvaluation}
                </button>
              </fieldset>
            )}
            <div className="ml-evaluation-list">
              {evaluations.map((e) => (
                <button
                  key={e.id}
                  className="ml-button secondary"
                  onClick={() => {
                    if (evaluationDirty && !window.confirm(t.unsaved)) return;
                    setPlayer(e.player_id);
                    setPosition(e.position);
                    loadEvaluation(e.player_id, e.position);
                  }}
                >
                  {players.find((p) => p.id === e.player_id)?.full_name} ·{" "}
                  {positionNames[e.position]} ·{" "}
                  {displayScore(individualScore(e.common, e.specific))}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
