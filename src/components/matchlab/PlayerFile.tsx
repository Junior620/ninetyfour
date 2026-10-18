"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ArrowLeft, Pencil } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import { playerProfile, type Period } from "@/lib/matchlab/profile";
import { displayScore } from "@/lib/matchlab/scoring";
import { positionNames, type Position } from "@/lib/matchlab/questionnaire";
import { targetGaps } from "@/lib/matchlab/targets";
import { sequenceIndicators, timecode } from "@/lib/matchlab/sequences";
import { dossierSequences } from "@/lib/matchlab/dossier";
import { useLab, Heading, Empty, formatDay } from "./shared";
import { PlayerPhoto } from "./PlayerPhoto";
import { TargetGapCell } from "./Players";
import { TrialPanel } from "./Trial";
import { ClubDossiers } from "./ClubDossier";

type Range = "all" | "365" | "90" | "custom";
const daysAgo = (days: number) =>
  new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
const decimal = (v: number | null) =>
  v === null
    ? "—"
    : v.toLocaleString("fr-FR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
const monthLabel = (p: string) =>
  new Date(`${p}-15T12:00:00`).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });

/** Internal player file: everything observed over a chosen period, with its sample. */
export function PlayerFile({ id }: { id?: string }) {
  const { data } = useLab();
  const { graph } = data;
  const [range, setRange] = useState<Range>("all");
  const [custom, setCustom] = useState<{ from: string; to: string }>({
    from: daysAgo(365),
    to: daysAgo(0),
  });
  const player = graph.players.find((p) => p.id === id);
  const back = (
    <Link className="ml-button secondary" href="/matchlab/players">
      <ArrowLeft size={17} />
      {t.playerFile.back}
    </Link>
  );
  if (!player)
    return (
      <>
        <Heading title={t.nav.player}>{back}</Heading>
        <Empty text={t.playerFile.notFound} />
      </>
    );
  const reader = data.member.role === "reader";
  const period: Period =
    range === "all"
      ? {}
      : range === "custom"
        ? custom
        : { from: daysAgo(Number(range)), to: daysAgo(0) };
  const profile = playerProfile(player, graph, period);
  const { sample } = profile;
  const from = period.from || sample.from || "";
  const to = period.to || sample.to || "";
  const sequences =
    from && to ? dossierSequences(player.id, graph, from, to) : [];
  const indicators = sequenceIndicators(sequences);
  const matches = new Map(graph.matches.map((m) => [m.id, m]));
  const memberships = graph.memberships.filter((m) => m.player_id === player.id);
  const comments = profile.history.flatMap((r) =>
    [r.evaluation.observation, r.evaluation.priorities]
      .filter((text) => text.trim())
      .map((text, i) => ({ key: `${r.evaluation.id}-${i}`, row: r, text })),
  );
  const sampleLine = [
    `${sample.matches} ${t.playerFile.matches}`,
    `${sample.minutes} ${t.playerFile.minutes}`,
    sample.minutesUnknown
      ? `${t.playerFile.minutesUnknown} ${sample.minutesUnknown} ${t.playerFile.evaluations}`
      : "",
    sample.from && sample.to
      ? `${formatDay(sample.from)} – ${formatDay(sample.to)}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Heading title={player.full_name} eyebrow={t.playerFile.eyebrow}>
        <div className="ml-actions">
          {back}
          {!reader && (
            <Link
              className="ml-button"
              href={`/matchlab/players?id=${player.id}`}
            >
              <Pencil size={17} />
              {t.playerFile.edit}
            </Link>
          )}
        </div>
      </Heading>
      {reader && <p className="ml-notice">{t.playerFile.readerNote}</p>}

      <section className="ml-card ml-player-file-head" aria-label={t.playerFile.identity}>
        <PlayerPhoto player={player} />
        <dl className="ml-facts">
          <div>
            <dt>{t.players.usual}</dt>
            <dd>{positionNames[player.usual_position]}</dd>
          </div>
          <div>
            <dt>{t.players.foot}</dt>
            <dd>{t.players[player.strong_foot]}</dd>
          </div>
          <div>
            <dt>{t.status}</dt>
            <dd>{t.players[player.status]}</dd>
          </div>
          <div>
            <dt>{t.playerFile.memberships}</dt>
            <dd>
              {memberships.length
                ? memberships
                    .map(
                      (m) =>
                        `${graph.seasons.find((s) => s.id === m.season_id)?.name ?? "—"} · ${m.category_id} · #${m.jersey}`,
                    )
                    .join(" ; ")
                : "—"}
            </dd>
          </div>
          {player.updated_at && (
            <div>
              <dt>{t.playerFile.updated}</dt>
              <dd>{formatDay(player.updated_at.slice(0, 10))}</dd>
            </div>
          )}
          <div>
            <dt>{t.playerFile.gap}</dt>
            <dd>
              <TargetGapCell gap={targetGaps(player, graph)} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="ml-card ml-period" aria-label={t.playerFile.period}>
        <fieldset className="ml-period-choice">
          <legend>{t.playerFile.period}</legend>
          {(
            [
              ["all", t.playerFile.allTime],
              ["365", t.playerFile.last365],
              ["90", t.playerFile.last90],
              ["custom", `${t.from} / ${t.to}`],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="ml-check">
              <input
                type="radio"
                name="player-period"
                checked={range === value}
                onChange={() => setRange(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        {range === "custom" && (
          <div className="ml-form-grid">
            <label>
              {t.from}
              <input
                type="date"
                value={custom.from}
                max={custom.to}
                onChange={(e) => setCustom({ ...custom, from: e.target.value })}
              />
            </label>
            <label>
              {t.to}
              <input
                type="date"
                value={custom.to}
                min={custom.from}
                onChange={(e) => setCustom({ ...custom, to: e.target.value })}
              />
            </label>
          </div>
        )}
        <p className="ml-method">
          {t.playerFile.periodHint} {sampleLine}
        </p>
      </section>

      <div className="ml-kpis">
        {[
          [t.playerFile.score, `${displayScore(profile.score)}`],
          [t.playerFile.kpiMatches, `${sample.matches}`],
          [t.playerFile.kpiMinutes, `${sample.minutes}`],
          [t.playerFile.sequences, `${sequences.length}`],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <p className="ml-method">
        {t.playerFile.scoreHint} {sample.scored} {t.playerFile.evaluations}.
      </p>

      {sample.evaluations === 0 ? (
        <Empty text={t.playerFile.empty} />
      ) : (
        <>
          <div className="ml-analytics-grid">
            <section className="ml-card">
              <h2>{t.playerFile.positions}</h2>
              <ul className="ml-plain-list">
                {profile.positions.map((p) => (
                  <li key={p.position}>
                    <strong>{positionNames[p.position]}</strong> ·{" "}
                    {p.matches} {t.playerFile.matches} · {p.minutes} min
                  </li>
                ))}
              </ul>
              <h2>{t.playerFile.progression}</h2>
              <div className="ml-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={profile.progression.map((p) => ({
                      ...p,
                      label: monthLabel(p.period),
                    }))}
                  >
                    <CartesianGrid stroke="#e6edf5" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, _name, item) => [
                        `${displayScore(value as number)} /10 · ${(item.payload as { matches: number }).matches} ${t.playerFile.matches}`,
                        t.playerFile.score,
                      ]}
                    />
                    <Line
                      dataKey="score"
                      name={t.playerFile.score}
                      stroke="#1b548e"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="ml-method">{t.playerFile.progressionHint}</p>
            </section>
            <section className="ml-card">
              <h2>
                {t.playerFile.criteria} ·{" "}
                {positionNames[profile.criteriaPosition as Position]}
              </h2>
              <div className="ml-table-wrap">
                <table className="ml-file-criteria">
                  {(["common", "specific"] as const).map((group) => (
                    <tbody key={group}>
                      <tr>
                        <th scope="colgroup" colSpan={3}>
                          {group === "common"
                            ? t.playerFile.common
                            : t.playerFile.specific}
                        </th>
                      </tr>
                      {profile.criteria
                        .filter((c) => c.group === group)
                        .map((c) => (
                          <tr key={c.key}>
                            <td>{c.label}</td>
                            <td className="ml-num">{decimal(c.mean)} /5</td>
                            <td className="ml-num">
                              {c.answers} {t.playerFile.answers}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  ))}
                </table>
              </div>
              <p className="ml-method">{t.playerFile.criteriaHint}</p>
            </section>
          </div>

          <section className="ml-card">
            <h2>{t.playerFile.history}</h2>
            <div className="ml-table-wrap">
              <table>
                <thead>
                  <tr>
                    {t.playerFile.historyColumns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profile.history.map((r) => (
                    <tr key={r.evaluation.id}>
                      <td>{formatDay(r.match.played_on)}</td>
                      <td>
                        {r.match.opponent}
                        <small>
                          {r.match.category_id}
                          {r.jersey ? ` · #${r.jersey}` : ""}
                        </small>
                      </td>
                      <td>{positionNames[r.evaluation.position]}</td>
                      <td className="ml-num">
                        {r.evaluation.minutes ?? "—"}
                      </td>
                      <td className="ml-num">{displayScore(r.score)}</td>
                      <td>
                        <Link
                          className="ml-table-link"
                          href={`/matchlab/analyze?id=${r.match.id}`}
                        >
                          {t.playerFile.open}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="ml-card">
        <h2>{t.playerFile.sequences}</h2>
        <p className="ml-method">{t.playerFile.sequencesHint}</p>
        {sequences.length ? (
          <>
            <ul className="ml-plain-list">
              {indicators.map((i) => (
                <li key={i.kind}>
                  <strong>{t.analysis.markerTypes[i.kind]}</strong> ·{" "}
                  {i.success + i.fail
                    ? `${i.success}/${i.success + i.fail} ${t.sequences.successRate}`
                    : "—"}{" "}
                  · {i.total} {t.sequences.sample}
                </li>
              ))}
            </ul>
            <ul className="ml-sequence-list">
              {sequences.map((m) => {
                const match = matches.get(m.match_id);
                return (
                  <li className="ml-file-sequence" key={m.id}>
                    <Link
                      className="ml-timecode"
                      href={`/matchlab/analyze?id=${m.match_id}&t=${Math.floor(m.seconds)}#video`}
                    >
                      {timecode(m.seconds)}
                    </Link>
                    <span>
                      <strong>{t.analysis.markerTypes[m.kind]}</strong>
                      {m.outcome && ` · ${t.sequences.outcomes[m.outcome]}`} ·{" "}
                      {match?.opponent} · {match && formatDay(match.played_on)}
                      {m.tags.length > 0 && (
                        <small>{m.tags.join(" · ")}</small>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="ml-muted">{t.sequences.noSequence}</p>
        )}
        <p className="ml-method">{t.sequences.physical}</p>
      </section>

      {!reader && (
        <section className="ml-card">
          <h2>{t.playerFile.comments}</h2>
          <p className="ml-method">{t.playerFile.commentsHint}</p>
          {player.scouting.trim() && (
            <blockquote className="ml-quote">
              <small>{t.players.notes}</small>
              {player.scouting}
            </blockquote>
          )}
          {comments.length ? (
            <ul className="ml-plain-list">
              {comments.map((c) => (
                <li key={c.key}>
                  <small>
                    {formatDay(c.row.match.played_on)} · {c.row.match.opponent}
                  </small>
                  {c.text}
                </li>
              ))}
            </ul>
          ) : (
            !player.scouting.trim() && (
              <p className="ml-muted">{t.playerFile.noComment}</p>
            )
          )}
        </section>
      )}

      {!reader && (
        <section className="ml-card">
          <h2>{t.playerFile.trials}</h2>
          <details className="ml-trial-details">
            <summary>{t.trial.open}</summary>
            <TrialPanel player={player} />
          </details>
        </section>
      )}

      {!reader && <ClubDossiers player={player} />}
    </>
  );
}
