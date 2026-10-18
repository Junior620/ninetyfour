"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import {
  collectiveScore,
  individualScore,
  displayScore,
  rankings,
} from "@/lib/matchlab/scoring";
import {
  positionNames,
  collectiveQuestions,
  answerHighlights,
} from "@/lib/matchlab/questionnaire";
import { describeCircumstances } from "@/lib/matchlab/circumstances";
import {
  useLab,
  Heading,
  Empty,
  useMutation,
  api,
  Feedback,
  PlayerAvatar,
  jerseyFor,
  clock,
  formatDay,
} from "./shared";
const axis = (value: number | null | undefined) =>
  value === undefined ? "—" : value === null ? t.reports.notObserved : `${value}/5`;
export function Reports() {
  const { data } = useLab();
  // A dashboard link may open a given match (?id=) and revision (?revision=).
  const query = useSearchParams();
  const [matchId, setMatchId] = useState(query.get("id") || "");
  const [revision, setRevision] = useState(query.get("revision") || "");
  const [correction, setCorrection] = useState("");
  const mutation = useMutation();
  const match = data.graph.matches.find(
    (m) => m.id === (matchId || data.graph.matches[0]?.id),
  );
  const reports = data.graph.reports
    .filter((r) => r.match_id === match?.id)
    .sort((a, b) => b.revision - a.revision);
  const saved = reports.find((r) => r.id === revision);
  const displayMatch = saved?.snapshot.match || match;
  const evaluations =
    saved?.snapshot.evaluations ||
    data.graph.evaluations.filter((e) => e.match_id === match?.id);
  const players = saved?.snapshot.players || data.graph.players;
  const markers = [
    ...(saved?.snapshot.markers ||
      data.graph.markers.filter((m) => m.match_id === match?.id)),
  ].sort((a, b) => a.seconds - b.seconds);
  const rank = rankings(evaluations);
  const nameOf = (id: string) => players.find((p) => p.id === id)?.full_name;
  const jersey = (id: string) =>
    jerseyFor(
      data.graph,
      id,
      displayMatch?.season_id,
      displayMatch?.category_id,
    ) ?? "—";
  const circumstances = describeCircumstances(displayMatch?.circumstances);
  const ground = displayMatch?.circumstances.ground;
  return (
    <>
      <Heading title={t.nav.reports} eyebrow={t.reports.eyebrow}>
        <button className="ml-button" onClick={() => window.print()}>
          <Printer size={17} />
          {t.reports.print}
        </button>
      </Heading>
      {!match || !displayMatch ? (
        <Empty text={t.reports.empty} />
      ) : (
        <>
          <div className="ml-form-grid ml-report-picker ml-no-print">
            <label>
              {t.nav.matches}
              <select
                value={match.id}
                onChange={(e) => {
                  setMatchId(e.target.value);
                  setRevision("");
                }}
              >
                {data.graph.matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.played_on} · {m.opponent} · {m.category_id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.reports.history}
              <select
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
              >
                <option value="">
                  {t.draft} · {t.version} {match.version}
                </option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    #{r.revision} · {r.created_at.slice(0, 10)} ·{" "}
                    {r.validated_at
                      ? t.reports.validated
                      : t.reports.unvalidated}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <article className="ml-card ml-report" data-tour="report">
            <div className="ml-report-head">
              <div>
                <small>{t.footer}</small>
                <h2>
                  N91 {displayMatch.category_id} — {displayMatch.opponent}
                </h2>
                <small>
                  {[
                    formatDay(displayMatch.played_on),
                    displayMatch.venue,
                    ground && t.match.grounds[ground],
                    displayMatch.competition,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </div>
              <div className="ml-report-score">
                <strong>
                  {displayMatch.home_score === null &&
                  displayMatch.away_score === null
                    ? "—"
                    : `${displayMatch.home_score ?? "—"} – ${displayMatch.away_score ?? "—"}`}
                </strong>
                <span>
                  {saved
                    ? `#${saved.revision} · ${saved.validated_at ? t.reports.validated : t.reports.unvalidated}`
                    : t.draft}
                </span>
              </div>
            </div>
            <section className="ml-report-block">
              <div className="ml-score-line">
                {t.reports.collective}
                <strong>
                  {displayScore(collectiveScore(displayMatch.collective))} /10
                </strong>
              </div>
              <h3>{t.reports.axes}</h3>
              <div className="ml-axes">
                {collectiveQuestions.map((q) => (
                  <div key={q.id}>
                    <small>{q.label}</small>
                    <strong>{axis(displayMatch.collective[q.id])}</strong>
                  </div>
                ))}
              </div>
            </section>
            {displayMatch.context && (
              <section className="ml-report-block">
                <h3>{t.match.context}</h3>
                <p>{displayMatch.context}</p>
              </section>
            )}
            <section className="ml-report-block">
              <h3>{t.match.circumstances}</h3>
              {circumstances.length ? (
                <dl className="ml-facts">
                  {circumstances.map((c) => (
                    <div key={c.key}>
                      <dt>{c.label}</dt>
                      <dd>{c.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p>—</p>
              )}
              <p>{t.match.circumstanceHint}</p>
            </section>
            <section className="ml-report-block">
              <h3>{t.reports.individual}</h3>
              {evaluations.length ? (
                evaluations.map((e) => {
                  const { support, work } = answerHighlights(
                    e.position,
                    e.common,
                    e.specific,
                  );
                  return (
                    <article className="ml-report-player" key={e.id}>
                      <PlayerAvatar
                        playerId={e.player_id}
                        name={nameOf(e.player_id)}
                        size={44}
                      />
                      <div>
                        <h4>{nameOf(e.player_id) ?? "—"}</h4>
                        <small>
                          {t.reports.jersey} #{jersey(e.player_id)} ·{" "}
                          {positionNames[e.position]} · {t.reports.minutes}{" "}
                          {e.minutes ?? "—"} min
                        </small>
                        {support.length > 0 && (
                          <p>
                            <b>{t.reports.support} :</b> {support.join(", ")}
                          </p>
                        )}
                        {work.length > 0 && (
                          <p>
                            <b>{t.reports.work} :</b> {work.join(", ")}
                          </p>
                        )}
                        {e.observation && (
                          <p>
                            <b>{t.reports.highlight} :</b> {e.observation}
                          </p>
                        )}
                        {e.priorities && (
                          <p>
                            <b>{t.reports.priority} :</b> {e.priorities}
                          </p>
                        )}
                      </div>
                      <strong className="ml-report-note">
                        {displayScore(individualScore(e.common, e.specific))}
                        <small>/10</small>
                      </strong>
                    </article>
                  );
                })
              ) : (
                <Empty />
              )}
            </section>
            <section className="ml-report-block">
              <h3>{t.reports.best}</h3>
              {rank.best.length ? (
                rank.best.map((e, i) => (
                  <p key={i} className="ml-highlight">
                    <PlayerAvatar
                      playerId={e.player_id}
                      name={nameOf(e.player_id)}
                      size={30}
                    />
                    <strong>
                      {nameOf(e.player_id)} · #{jersey(e.player_id)}
                    </strong>
                    · {positionNames[e.position as keyof typeof positionNames]}{" "}
                    · {displayScore(e.score)} /10
                  </p>
                ))
              ) : (
                <p>{t.reports.noBest}</p>
              )}
              <h3>{t.reports.bestPositions}</h3>
              {rank.bestPositions.length ? (
                rank.bestPositions.map((p) => (
                  <p key={p.position}>
                    {positionNames[p.position as keyof typeof positionNames]}{" "}
                    · {displayScore(p.mean)} /10 · {p.n} joueur(s) distinct(s)
                  </p>
                ))
              ) : (
                <p>—</p>
              )}
              <p>
                {t.reports.sample} : {rank.playerCount} joueur(s) distinct(s)
              </p>
              {rank.playerCount > 0 && rank.playerCount < 5 && (
                <p className="ml-notice">{t.reports.small}</p>
              )}
            </section>
            <section className="ml-report-block">
              <h3>
                {t.reports.markers} ({markers.length})
              </h3>
              {markers.length ? (
                <ul className="ml-report-markers">
                  {markers.map((m) => (
                    <li key={m.id}>
                      <time>{clock(m.seconds)}</time>
                      <span>
                        <b>{t.analysis.markerTypes[m.kind]}</b>
                        {m.theme && ` · ${m.theme}`}
                        {m.player_id && ` · ${nameOf(m.player_id) ?? ""}`}
                        {m.observation && ` — ${m.observation}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t.reports.noMarkers}</p>
              )}
              <Link
                className="ml-table-link ml-no-print"
                href={`/matchlab/analyze?id=${match.id}#video`}
              >
                {t.match.open} →
              </Link>
            </section>
            {saved?.correction && (
              <section className="ml-report-block">
                <h3>{t.reports.correction}</h3>
                <p>{saved.correction}</p>
              </section>
            )}
            <p className="ml-report-review">{t.reports.review}</p>
            <p className="ml-method">{t.reports.immutable}</p>
          </article>
          {data.member.role !== "reader" && (
            <div className="ml-card ml-no-print">
              <label>
                {t.reports.correction}
                <textarea
                  value={correction}
                  onChange={(e) => setCorrection(e.target.value)}
                />
              </label>
              <Feedback {...mutation} />
              <div className="ml-actions">
                {[false, true].map((validate) => (
                  <button
                    key={String(validate)}
                    className={`ml-button ${validate ? "" : "secondary"}`}
                    disabled={mutation.busy}
                    onClick={() =>
                      mutation.run(async () => {
                        const result = await api("reports", {
                          match: match.id,
                          version: match.version,
                          correction,
                          validate,
                        });
                        setRevision(result.id);
                      })
                    }
                  >
                    {validate ? t.reports.validate : t.reports.create}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
