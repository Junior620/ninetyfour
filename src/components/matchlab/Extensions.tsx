"use client";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { fr as t } from "@/lib/matchlab/messages";
import { AiLab } from "./AiLab";
import {
  mean,
  collectiveScore,
  individualScore,
  rankings,
  displayScore,
} from "@/lib/matchlab/scoring";
import { positionNames } from "@/lib/matchlab/questionnaire";
import { timecode } from "@/lib/matchlab/sequences";
import { useLab, Heading, Empty } from "./shared";
import { Admin } from "./Admin";
import { SiteEditor } from "./SiteEditor";
import { ExportPanel } from "./ExportPanel";
export function Extensions({ section }: { section: string }) {
  const { data } = useLab();
  const { graph } = data;
  if (section === "admin") return <Admin />;
  if (section === "site") return <SiteEditor />;
  if (section === "exports") return <ExportPanel />;
  if (section === "video")
    return (
      <>
        <Heading title={t.nav.video} eyebrow={t.analysis.markers} />
        <p className="ml-notice">{t.sequences.indicatorsHint}</p>
        {graph.markers.length ? (
          <div className="ml-module-grid">
            {[...graph.markers]
              .sort((a, b) => a.seconds - b.seconds)
              .map((m) => {
                const match = graph.matches.find((x) => x.id === m.match_id);
                const player = graph.players.find((p) => p.id === m.player_id);
                return (
                  <Link
                    className="ml-card"
                    key={m.id}
                    href={`/matchlab/analyze?id=${m.match_id}&t=${m.seconds}#video`}
                  >
                    <small>
                      {match?.opponent} · {match?.played_on}
                    </small>
                    <h3>
                      <time>{timecode(m.seconds)}</time> ·{" "}
                      {t.analysis.markerTypes[m.kind]}
                      {m.outcome && ` · ${t.sequences.outcomes[m.outcome]}`}
                    </h3>
                    <p>
                      {player?.full_name ?? t.sequences.unknownPlayer} ·{" "}
                      {m.verified ? t.sequences.verified : t.sequences.unverified}
                      {m.observation && ` — ${m.observation}`}
                    </p>
                  </Link>
                );
              })}
          </div>
        ) : (
          <Empty />
        )}
      </>
    );
  if (section === "analytics") {
    const timeline = [...graph.matches].reverse().map((m) => ({
      date: m.played_on,
      collective: collectiveScore(m.collective),
      individual: mean(
        graph.evaluations
          .filter((e) => e.match_id === m.id)
          .map((e) => individualScore(e.common, e.specific)),
      ),
    }));
    const rank = rankings(graph.evaluations);
    return (
      <>
        <Heading title={t.nav.analytics} />
        <p className="ml-notice">
          {t.overview.method} · {data.filters.from || "—"} →{" "}
          {data.filters.to || "—"}
          <br />
          {t.reports.sample} : {rank.playerCount} · {t.reports.small}
        </p>
        {graph.matches.length ? (
          <>
            <div className="ml-analytics-grid">
              <section className="ml-card">
                <h2>{t.reports.collective}</h2>
                <div className="ml-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline}>
                      <CartesianGrid stroke="#e6edf5" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line
                        dataKey="collective"
                        name={t.reports.collective}
                        stroke="#1b548e"
                        connectNulls={false}
                      />
                      <Line
                        dataKey="individual"
                        name={t.reports.individual}
                        stroke="#b7965b"
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="ml-card">
                <h2>{t.position}</h2>
                <div className="ml-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rank.positions.map((p) => ({
                        ...p,
                        label:
                          positionNames[
                            p.position as keyof typeof positionNames
                          ],
                      }))}
                    >
                      <CartesianGrid stroke="#e6edf5" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Bar
                        dataKey="mean"
                        name={t.analysis.score}
                        fill="#2e6098"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
            <section className="ml-card">
              <table>
                <thead>
                  <tr>
                    <th>{t.position}</th>
                    <th>{t.analysis.score}</th>
                    <th>{t.reports.sample}</th>
                  </tr>
                </thead>
                <tbody>
                  {rank.positions.map((p) => (
                    <tr key={p.position}>
                      <td>
                        {
                          positionNames[
                            p.position as keyof typeof positionNames
                          ]
                        }
                      </td>
                      <td>{displayScore(p.mean)}</td>
                      <td>
                        {p.n} {p.smallSample ? "*" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="ml-method">{t.players.explanation}</p>
            </section>
          </>
        ) : (
          <Empty />
        )}
      </>
    );
  }
  return <AiLab />;
}
