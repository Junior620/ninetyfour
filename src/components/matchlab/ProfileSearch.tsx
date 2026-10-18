"use client";
import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { fr as t } from "@/lib/matchlab/messages";
import { positionNames } from "@/lib/matchlab/questionnaire";
import {
  parseProfileQuery,
  runProfileQuery,
  metricLabels,
  type ProfileQuery,
} from "@/lib/matchlab/search";
import { useLab, PlayerAvatar, formatDay } from "./shared";

const one = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

/** Everyday-language profile search: rules only, with period, sample and missing data shown. */
export function ProfileSearch({ initial = "" }: { initial?: string }) {
  const { data } = useLab();
  const [text, setText] = useState(initial);
  const [query, setQuery] = useState<ProfileQuery | null>(() =>
    initial ? parseProfileQuery(initial) : null,
  );
  const result = query ? runProfileQuery(data.graph, query) : null;
  return (
    <section
      className="ml-card ml-profile-search"
      aria-label={t.profileSearch.title}
    >
      <h2>{t.profileSearch.title}</h2>
      <form
        className="ml-profile-search-form"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(text.trim() ? parseProfileQuery(text) : null);
        }}
      >
        <label>
          {t.profileSearch.label}
          <input
            value={text}
            maxLength={200}
            placeholder={t.profileSearch.placeholder}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <button className="ml-button">
          <Search size={17} aria-hidden />
          {t.profileSearch.submit}
        </button>
      </form>
      {query && result && (
        <>
          <dl className="ml-facts ml-search-meta">
            <div>
              <dt>{t.profileSearch.categories}</dt>
              <dd>{query.categories.join(", ") || t.profileSearch.all}</dd>
            </div>
            <div>
              <dt>{t.profileSearch.positions}</dt>
              <dd>
                {query.positions.map((p) => positionNames[p]).join(", ") ||
                  t.profileSearch.all}
              </dd>
            </div>
            <div>
              <dt>{t.profileSearch.period}</dt>
              <dd>
                {result.period.from
                  ? `${formatDay(result.period.from)} → ${formatDay(result.period.to!)} · ${result.period.matches} match(s)`
                  : "—"}
                {!query.lastMatches && ` · ${t.profileSearch.allMatches}`}
              </dd>
            </div>
            <div>
              <dt>{t.profileSearch.sample}</dt>
              <dd>
                {result.sample.evaluations} évaluation(s) ·{" "}
                {result.sample.players} joueur(s)
              </dd>
            </div>
            <div className="wide">
              <dt>{t.profileSearch.metric}</dt>
              <dd>{metricLabels[query.metric]}</dd>
            </div>
          </dl>
          <p className="ml-method">
            {t.profileSearch.understood} : {query.understood.join(" · ")}.{" "}
            {t.profileSearch.method}
          </p>
          {result.results.length ? (
            <div className="ml-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.players.columns[0]}</th>
                    <th>{t.profileSearch.mean}</th>
                    <th>{t.profileSearch.spread}</th>
                    <th>{t.profileSearch.progression}</th>
                    <th>{t.profileSearch.minutes}</th>
                    <th>{t.profileSearch.matches}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r) => (
                    <tr key={r.player.id}>
                      <td>
                        <Link
                          className="ml-player-name"
                          href={`/matchlab/player?id=${r.player.id}`}
                        >
                          <PlayerAvatar
                            playerId={r.player.id}
                            name={r.player.full_name}
                          />
                          <strong>{r.player.full_name}</strong>
                        </Link>
                      </td>
                      <td>{one(r.mean)}</td>
                      <td>{one(r.spread)}</td>
                      <td>
                        {r.progression === null
                          ? "—"
                          : `${r.progression > 0 ? "+" : ""}${one(r.progression)}`}
                      </td>
                      <td>{r.minutes}</td>
                      <td>{r.matches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="ml-notice">{t.profileSearch.none}</p>
          )}
          {result.insufficient.length > 0 && (
            <p className="ml-muted">
              {t.profileSearch.insufficient} :{" "}
              {result.insufficient.map((r) => r.player.full_name).join(", ")}
            </p>
          )}
          {result.missing.length > 0 && (
            <p className="ml-muted">
              {t.profileSearch.missing} ({result.missing.length}) :{" "}
              {result.missing.map((p) => p.full_name).join(", ")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
