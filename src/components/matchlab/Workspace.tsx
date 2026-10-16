"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Plus,
  Upload,
  Users,
  Film,
  FileText,
} from "lucide-react";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
import { positionNames, POSITIONS } from "@/lib/matchlab/questionnaire";
import {
  collectiveScore,
  displayScore,
  rankings,
} from "@/lib/matchlab/scoring";
import {
  LabContext,
  type LabData,
  Heading,
  Empty,
  Status,
  Pagination,
  api,
} from "./shared";
import { Players } from "./Players";
import { Analysis } from "./Analysis";
import { Reports } from "./Reports";
import { Extensions } from "./Extensions";
import { PushSettings } from "./PushSettings";

async function fetchLab(queryString: string): Promise<LabData> {
  const params = new URLSearchParams(queryString);
  params.delete("id");
  params.delete("module");
  const response = await fetch(`/api/matchlab/data?${params}`, {
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.code);
  return result;
}

export function Workspace({ section }: { section: string }) {
  const query = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<LabData | null>(null);
  const [error, setError] = useState("");
  const queryString = query.toString();
  const refresh = useCallback(async () => {
    const result = await fetchLab(queryString);
    setData(result);
    setError("");
  }, [queryString]);
  useEffect(() => {
    let active = true;
    fetchLab(queryString)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e.message));
      });
    return () => {
      active = false;
    };
  }, [queryString]);
  if (error)
    return (
      <div className="ml-service-state">
        <p role="alert">{error}</p>
        <button
          className="ml-button"
          onClick={() =>
            refresh().catch((e) => setError(errorMessage(e.message)))
          }
        >
          {t.retry}
        </button>
        <Link href="/matchlab/login">{t.auth.loginAgain}</Link>
      </div>
    );
  if (!data)
    return (
      <p className="ml-loading" role="status">
        {t.loading}
      </p>
    );
  const filter = (key: string, value: string) => {
    const params = new URLSearchParams(queryString);
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/matchlab/${section}?${params}`);
  };
  return (
    <LabContext.Provider value={{ data, refresh }}>
      {!["analyze", "site", "admin", "ai", "alerts"].includes(section) && (
        <div className="ml-filterbar">
          <label>
            {t.season}
            <select
              value={query.get("season") || ""}
              onChange={(e) => filter("season", e.target.value)}
            >
              <option value="">{t.all}</option>
              {data.graph.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.category}
            <select
              value={query.get("category") || ""}
              onChange={(e) => filter("category", e.target.value)}
            >
              <option value="">{t.all}</option>
              {["U-14", "U-16", "U-17", "U-18"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <details>
            <summary>{t.filters}</summary>
            <div className="ml-filter-extra">
              <label>
                {t.from}
                <input
                  type="date"
                  value={query.get("from") || ""}
                  onChange={(e) => filter("from", e.target.value)}
                />
              </label>
              <label>
                {t.to}
                <input
                  type="date"
                  value={query.get("to") || ""}
                  onChange={(e) => filter("to", e.target.value)}
                />
              </label>
              <label>
                {t.position}
                <select
                  value={query.get("position") || ""}
                  onChange={(e) => filter("position", e.target.value)}
                >
                  <option value="">{t.all}</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {positionNames[p]}
                    </option>
                  ))}
                </select>
              </label>
              <Link href={`/matchlab/${section}`}>{t.resetFilters}</Link>
            </div>
          </details>
        </div>
      )}
      {!data.graph.seasons.length && <p className="ml-notice">{t.noSeason}</p>}
      {section === "overview" ? (
        <Overview data={data} />
      ) : section === "matches" ? (
        <Matches data={data} />
      ) : section === "players" ? (
        <Players />
      ) : section === "analyze" ? (
        <Analysis id={query.get("id") || undefined} />
      ) : section === "reports" ? (
        <Reports />
      ) : section === "alerts" ? (
        <>
          <Heading title={t.alerts.title} />
          <PushSettings />
          {data.alerts.length ? (
            data.alerts.map((a) => (
              <article className="ml-card ml-alert" key={a.id}>
                <div>
                  <Link href={`/matchlab/analyze?id=${a.match_id}`}>
                    {data.graph.matches.find((m) => m.id === a.match_id)
                      ?.opponent || t.nav.matches}
                  </Link>
                  <p>
                    {data.graph.evaluations.some(
                      (e) =>
                        e.match_id === a.match_id && rankings([e]).best.length,
                    )
                      ? t.alerts.evaluated
                      : t.alerts.informative}
                  </p>
                  <MatchHighlights data={data} matchId={a.match_id} />
                </div>
                {!a.ml_alert_reads.length && (
                  <button
                    className="ml-button secondary"
                    onClick={async () => {
                      await api("alerts", { id: a.id });
                      await refresh();
                    }}
                  >
                    {t.alerts.read}
                  </button>
                )}
              </article>
            ))
          ) : (
            <Empty text={t.alerts.empty} />
          )}
        </>
      ) : (
        <Extensions section={section} />
      )}
    </LabContext.Provider>
  );
}
function MatchHighlights({
  data,
  matchId,
}: {
  data: LabData;
  matchId: string;
}) {
  const match = data.graph.matches.find((m) => m.id === matchId);
  const rank = rankings(
    data.graph.evaluations.filter((e) => e.match_id === matchId),
  );
  return (
    <div>
      <p>
        Note collective :{" "}
        {displayScore(collectiveScore(match?.collective || {}))} /10
      </p>
      {rank.best.map((e, i) => {
        const p = data.graph.players.find((p) => p.id === e.player_id);
        const photo = data.graph.media.find(
          (m) => m.player_id === e.player_id && m.purpose === "photo",
        );
        const jersey = data.graph.memberships.find(
          (m) =>
            m.player_id === e.player_id &&
            m.season_id === match?.season_id &&
            m.category_id === match?.category_id,
        )?.jersey;
        return (
          <p key={i} className="ml-highlight">
            {photo && (
              <Image
                src={`/api/matchlab/media?id=${photo.id}`}
                alt=""
                width={36}
                height={36}
                unoptimized
              />
            )}
            <strong>
              {p?.full_name} · #{jersey ?? "—"}
            </strong>{" "}
            · {positionNames[e.position as keyof typeof positionNames]} ·{" "}
            {displayScore(e.score)} /10
          </p>
        );
      })}
      <p>
        Poste(s) le(s) mieux évalué(s) :{" "}
        {rank.bestPositions
          .map(
            (p) =>
              `${positionNames[p.position as keyof typeof positionNames]} · ${displayScore(p.mean)} /10 · ${p.n} joueur(s)`,
          )
          .join(" / ") || "Non calculable"}
      </p>
      {rank.playerCount < 5 && <small>{t.reports.small}</small>}
    </div>
  );
}
function Overview({ data }: { data: LabData }) {
  const { graph } = data;
  const last = graph.matches[0];
  return (
    <>
      <section className="ml-hero">
        <div className="ml-hero-copy">
          <p className="ml-eyebrow">
            {t.overview.eyebrow}
            {data.filters.category ? ` · ${data.filters.category}` : ""}
          </p>
          <h1>
            {t.overview.title}
            <br />
            <span>{t.overview.light}</span>
          </h1>
          <p>{t.overview.intro}</p>
          <div className="ml-actions">
            <Link href="/matchlab/analyze" className="ml-button">
              <Plus size={17} />
              {t.overview.create}
            </Link>
            <Link
              href="/matchlab/analyze#video"
              className="ml-button secondary"
            >
              <Upload size={17} />
              {t.overview.import}
            </Link>
          </div>
        </div>
        <div className="ml-hero-photo">
          <Image
            src="/hero-3.jpeg"
            alt=""
            fill
            sizes="(min-width:1200px) 40vw, 100vw"
            priority
          />
          <span>{t.overview.dossier}</span>
        </div>
      </section>
      <section className="ml-dossier">
        <div>
          <p className="ml-eyebrow">{t.overview.latest}</p>
          <h2>{t.overview.shared}</h2>
        </div>
        {last ? (
          <Link
            href={`/matchlab/analyze?id=${last.id}`}
            className="ml-scorecard"
          >
            <span className="ml-team-mark">N91</span>
            <strong>
              {last.home_score ?? "—"} : {last.away_score ?? "—"}
            </strong>
            <div>
              <b>{last.opponent}</b>
              <small>
                {last.category_id} · {last.played_on}
              </small>
            </div>
            <ArrowUpRight size={21} />
          </Link>
        ) : (
          <p>{t.overview.noLast}</p>
        )}
      </section>
      <section className="ml-readings">
        <p className="ml-eyebrow">{t.overview.readings}</p>
        <div>
          {[
            ["01", t.overview.collective, t.overview.collectiveText, "reports"],
            ["02", t.overview.individual, t.overview.individualText, "players"],
            [
              "03",
              t.overview.recruitment,
              t.overview.recruitmentText,
              "players",
            ],
          ].map(([num, title, text, link]) => (
            <Link href={`/matchlab/${link}`} key={num}>
              <span>{num}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
        <small>{t.decision}</small>
      </section>
      <div className="ml-feature-grid">
        {[
          {
            Icon: Users,
            title: t.overview.squad,
            text: "U-14 · U-16 · U-17 · U-18",
            href: "players",
          },
          {
            Icon: Film,
            title: t.overview.library,
            text: t.overview.libraryText,
            href: "video",
          },
          {
            Icon: FileText,
            title: t.overview.reports,
            text: t.overview.reportsText,
            href: "reports",
          },
        ].map((c) => (
          <Link key={c.href} href={`/matchlab/${c.href}`} className="ml-card">
            <c.Icon size={24} />
            <small>{c.title}</small>
            <h3>{c.text}</h3>
            <ArrowUpRight size={16} />
          </Link>
        ))}
      </div>
      <div className="ml-kpis">
        {[
          graph.matches.length,
          graph.players.length,
          graph.players.filter((p) => p.status === "trial").length,
          graph.markers.length,
        ].map((n, i) => (
          <article key={i}>
            <span>{t.overview.kpis[i]}</span>
            <strong>{n.toString().padStart(2, "0")}</strong>
          </article>
        ))}
      </div>
      <p className="ml-method">{t.overview.method}</p>
      <details className="ml-card ml-history" open>
        <summary>{t.overview.history}</summary>
        <MatchTable data={data} limit={5} />
      </details>
    </>
  );
}
function Matches({ data }: { data: LabData }) {
  const [search, setSearch] = useState("");
  const filtered = {
    ...data,
    graph: {
      ...data.graph,
      matches: data.graph.matches.filter((m) =>
        m.opponent.toLowerCase().includes(search.toLowerCase()),
      ),
    },
  };
  return (
    <>
      <Heading title={t.nav.matches} eyebrow={t.match.eyebrow}>
        <Link className="ml-button" href="/matchlab/analyze">
          <Plus size={17} />
          {t.match.new}
        </Link>
      </Heading>
      <label className="ml-search">
        {t.search}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.match.opponent}
        />
      </label>
      <div className="ml-card">
        <MatchTable data={filtered} />
      </div>
    </>
  );
}
export function MatchTable({ data, limit }: { data: LabData; limit?: number }) {
  const [page, setPage] = useState(1);
  const list = data.graph.matches;
  return list.length ? (
    <>
      <div className="ml-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.match.date}</th>
              <th>{t.match.opponent}</th>
              <th>{t.category}</th>
              <th>{t.analysis.score}</th>
              <th>{t.status}</th>
              <th aria-label={t.match.open} />
            </tr>
          </thead>
          <tbody>
            {list
              .slice(limit ? 0 : (page - 1) * 20, limit || page * 20)
              .map((m) => (
                <tr key={m.id}>
                  <td>{m.played_on}</td>
                  <td>
                    <strong>N91 — {m.opponent}</strong>
                    <small>{m.competition}</small>
                  </td>
                  <td>{m.category_id}</td>
                  <td>{displayScore(collectiveScore(m.collective))}</td>
                  <td>
                    <Status value={m.status} />
                  </td>
                  <td>
                    <Link
                      className="ml-table-link"
                      href={`/matchlab/analyze?id=${m.id}`}
                    >
                      {t.match.open}
                      <ArrowUpRight size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!limit && (
        <Pagination page={page} total={list.length} onChange={setPage} />
      )}
    </>
  ) : (
    <Empty text={t.noMatches} />
  );
}
