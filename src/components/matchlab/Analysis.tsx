"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, Save } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
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
import type { Evaluation, Match } from "@/lib/matchlab/schema";
import {
  useLab,
  useMutation,
  api,
  Heading,
  ScopeFields,
  Feedback,
  Empty,
  Status,
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
  return (
    <>
      <Heading title={t.analysis.title} eyebrow={t.analysis.eyebrow}>
        <div className="ml-actions">
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
        onChange={() => setMatchDirty(true)}
        onSubmit={async (e) => {
          e.preventDefault();
          const values = Object.fromEntries(new FormData(e.currentTarget));
          const circumstances = Object.fromEntries(
            Object.keys(t.match.circumstanceKeys)
              .filter((k) => values[`c_${k}`] !== "")
              .map((k) => [
                k,
                k === "duration" ? Number(values[`c_${k}`]) : values[`c_${k}`],
              ]),
          );
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
          <details className="ml-circumstances">
            <summary>{t.match.circumstances}</summary>
            <p>{t.match.circumstanceHint}</p>
            <div className="ml-form-grid">
              {Object.entries(t.match.circumstanceKeys).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    type={key === "duration" ? "number" : "text"}
                    min={key === "duration" ? 1 : undefined}
                    max={key === "duration" ? 150 : undefined}
                    name={`c_${key}`}
                    defaultValue={
                      match?.circumstances[
                        key as keyof Match["circumstances"]
                      ] ?? ""
                    }
                  />
                </label>
              ))}
            </div>
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
          <p className="ml-method">{t.analysis.markerHint}</p>
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
        <section className="ml-card">
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
      </div>
      <section className="ml-card ml-individual">
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
                    {t.analysis.observation}
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
