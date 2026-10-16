"use client";
import { useState } from "react";
import { Printer } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import {
  collectiveScore,
  individualScore,
  displayScore,
  rankings,
} from "@/lib/matchlab/scoring";
import { positionNames } from "@/lib/matchlab/questionnaire";
import { useLab, Heading, Empty, useMutation, api, Feedback } from "./shared";
export function Reports() {
  const { data } = useLab();
  const [matchId, setMatchId] = useState("");
  const [revision, setRevision] = useState("");
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
  const rank = rankings(evaluations);
  return (
    <>
      <Heading title={t.nav.reports} eyebrow={t.reports.eyebrow}>
        <button className="ml-button" onClick={() => window.print()}>
          <Printer size={17} />
          {t.reports.print}
        </button>
      </Heading>
      {!match ? (
        <Empty text={t.reports.empty} />
      ) : (
        <>
          <div className="ml-form-grid ml-no-print">
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
          <article className="ml-card ml-report">
            <div className="ml-report-head">
              <div>
                <small>{t.footer}</small>
                <h2>
                  N91 {displayMatch?.home_score ?? "—"} –{" "}
                  {displayMatch?.away_score ?? "—"} {displayMatch?.opponent}
                </h2>
                <small>
                  {displayMatch?.played_on} · {displayMatch?.category_id} ·{" "}
                  {displayMatch?.competition}
                </small>
              </div>
              <strong>
                {saved
                  ? `#${saved.revision} · ${saved.validated_at ? t.reports.validated : t.draft}`
                  : t.draft}
              </strong>
            </div>
            <p>{displayMatch?.context}</p>
            <div className="ml-report-block">
              <h3>{t.match.circumstances}</h3>
              {Object.entries(displayMatch?.circumstances || {}).map(
                ([k, v]) => (
                  <p key={k}>
                    <strong>
                      {
                        t.match.circumstanceKeys[
                          k as keyof typeof t.match.circumstanceKeys
                        ]
                      }
                    </strong>{" "}
                    : {v}
                  </p>
                ),
              )}
              <p>{t.match.circumstanceHint}</p>
            </div>
            <div className="ml-score-line">
              {t.reports.collective}
              <strong>
                {displayScore(collectiveScore(displayMatch?.collective || {}))}{" "}
                /10
              </strong>
            </div>
            <h3>{t.reports.individual}</h3>
            {evaluations.length ? (
              evaluations.map((e) => (
                <section className="ml-report-block" key={e.id}>
                  <h3>
                    {players.find((p) => p.id === e.player_id)?.full_name} ·{" "}
                    {positionNames[e.position as keyof typeof positionNames]} ·{" "}
                    {displayScore(individualScore(e.common, e.specific))} /10
                  </h3>
                  <p>{e.observation}</p>
                  <p>{e.priorities}</p>
                </section>
              ))
            ) : (
              <Empty />
            )}
            <div className="ml-report-block">
              <h3>{t.reports.best}</h3>
              <p>
                {rank.best
                  .map(
                    (e) =>
                      `${players.find((p) => p.id === e.player_id)?.full_name} · ${positionNames[e.position as keyof typeof positionNames]} · ${displayScore(e.score)}`,
                  )
                  .join(" / ") || "—"}
              </p>
              <p>
                {t.reports.sample} : {rank.playerCount}{" "}
                {t.overview.kpis[1].toLowerCase()}
              </p>
              {rank.playerCount < 5 && <p>{t.reports.small}</p>}
              <h3>Poste(s) le(s) mieux évalué(s)</h3>
              {rank.bestPositions.map((p) => (
                <p key={p.position}>
                  {positionNames[p.position as keyof typeof positionNames]} ·{" "}
                  {displayScore(p.mean)} /10 · {p.n} joueur(s) distinct(s)
                </p>
              ))}
            </div>
            {saved?.correction && <p>{saved.correction}</p>}
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
