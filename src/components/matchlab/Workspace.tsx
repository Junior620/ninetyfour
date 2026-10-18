"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
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
import type { Match } from "@/lib/matchlab/schema";
import {
  LabContext,
  type LabData,
  Heading,
  Empty,
  Status,
  Pagination,
  PlayerAvatar,
  api,
  formatDay,
  initials,
  jerseyFor,
} from "./shared";
import { Players } from "./Players";
import { Squad } from "./Squad";
import { Analysis } from "./Analysis";
import { Reports } from "./Reports";
import { Extensions } from "./Extensions";
import { PushSettings } from "./PushSettings";
import { TourInvite } from "./Help";

async function fetchLab(queryString: string): Promise<LabData> {
  const params = new URLSearchParams(queryString);
  params.delete("id");
  params.delete("module");
  params.delete("revision");
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
      {!["analyze", "site", "admin", "ai", "alerts", "squad"].includes(section) && (
        <div className="ml-filterbar">
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
      ) : section === "squad" ? (
        <Squad />
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
        const jersey = jerseyFor(
          data.graph,
          e.player_id,
          match?.season_id,
          match?.category_id,
        );
        return (
          <p key={i} className="ml-highlight">
            <PlayerAvatar playerId={e.player_id} name={p?.full_name} size={36} />
            <strong>
              {p?.full_name} · #{jersey ?? "—"}
            </strong>{" "}
            · {positionNames[e.position as keyof typeof positionNames]} ·{" "}
            {displayScore(e.score)} /10
          </p>
        );
      })}
      <p>
        {t.reports.bestPositions} :{" "}
        {rank.bestPositions
          .map(
            (p) =>
              `${positionNames[p.position as keyof typeof positionNames]} · ${displayScore(p.mean)} /10 · ${p.n} joueur(s)`,
          )
          .join(" / ") || "Non calculable"}
      </p>
      {rank.playerCount > 0 && rank.playerCount < 5 && (
        <small>{t.reports.small}</small>
      )}
    </div>
  );
}
function DossierCard({ data, match }: { data: LabData; match: Match }) {
  const ground = match.circumstances.ground;
  const season = data.graph.seasons.find((s) => s.id === match.season_id);
  const kind = match.competition || match.circumstances.match_type;
  return (
    <div className="ml-dossier">
      <div className="ml-dossier-main">
        <div className="ml-dossier-top">
          <small>
            {formatDay(match.played_on, "long").toUpperCase()}
            {kind && ` / ${kind.toUpperCase()}`}
          </small>
          <span>{t.overview.reportStatus[match.status]}</span>
        </div>
        <div className="ml-dossier-teams">
          <div className="ml-team">
            <Image src="/logo-crest.png" alt="" width={46} height={46} />
            <div>
              <b>{t.overview.club}</b>
              <small>
                {match.category_id}
                {season && ` · ${season.name}`}
              </small>
            </div>
          </div>
          <strong className="ml-dossier-score">
            {match.home_score ?? "–"}
            <span aria-hidden>—</span>
            {match.away_score ?? "–"}
          </strong>
          <div className="ml-team ml-team-away">
            <span className="ml-team-mark" aria-hidden>
              {initials(match.opponent).slice(0, 1) || "?"}
            </span>
            <div>
              <b>{match.opponent}</b>
              <small>
                {ground ? t.match.groundMatch[ground] : t.match.opponent}
              </small>
            </div>
          </div>
        </div>
        {(match.venue || ground) && (
          <p className="ml-dossier-venue">
            <MapPin size={13} aria-hidden />
            {[match.venue, ground && t.match.grounds[ground]]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
      <aside className="ml-dossier-review">
        <small>{t.overview.review}</small>
        <h3>{t.overview.reviewTitle[match.status]}</h3>
        <p>{t.overview.reviewText[match.status]}</p>
        <Link href={`/matchlab/analyze?id=${match.id}`}>
          {t.overview.openFile}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </aside>
    </div>
  );
}
function Overview({ data }: { data: LabData }) {
  const { graph } = data;
  const last = graph.matches[0];
  const toReview = graph.players.filter((p) => p.status === "trial");
  const recent = [...graph.reports]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3);
  return (
    <>
      <TourInvite />
      <section className="ml-hero">
        <div className="ml-hero-head">
          <div className="ml-hero-copy">
            <p className="ml-eyebrow">
              {t.overview.eyebrow}
              {(data.filters.category || last?.category_id) &&
                ` · ${data.filters.category || last?.category_id}`}
            </p>
            <h1>
              {t.overview.title} <span>{t.overview.light}</span>
            </h1>
            <p>{t.overview.intro}</p>
          </div>
          <div className="ml-actions">
            <Link href="/matchlab/analyze" className="ml-button secondary">
              <Plus size={17} />
              {t.overview.create}
            </Link>
            <Link href="/matchlab/analyze#video" className="ml-button">
              <Upload size={17} />
              {t.overview.import}
            </Link>
          </div>
        </div>
        <div className="ml-hero-photo">
          <Image
            src="/promise-01.png"
            alt=""
            fill
            sizes="(min-width:1024px) 75vw, 100vw"
            priority
          />
          <div className="ml-banner-mark">
            <Image
              src="/n91-lab-logo.png"
              alt="N91 MatchLab"
              width={180}
              height={90}
            />
            <span>
              {t.overview.bannerBrand}
              <br />
              {t.overview.bannerLab}
            </span>
          </div>
        </div>
      </section>
      <section className="ml-overview-block">
        <div className="ml-block-head">
          <p className="ml-eyebrow">{t.overview.dossierTitle}</p>
          <small>{t.overview.shared}</small>
        </div>
        {last ? (
          <DossierCard data={data} match={last} />
        ) : (
          <div className="ml-card ml-dossier-empty">
            <p>{t.overview.noLast}</p>
            <Link className="ml-button" href="/matchlab/analyze">
              <Plus size={17} />
              {t.overview.create}
            </Link>
          </div>
        )}
      </section>
      <section className="ml-overview-block">
        <div className="ml-block-head">
          <p className="ml-eyebrow">{t.overview.recentReports}</p>
          <small>{t.overview.recentReportsMeta}</small>
        </div>
        {recent.length ? (
          <div className="ml-report-list">
            {recent.map((r) => (
              <Link
                key={r.id}
                className="ml-review-row"
                href={`/matchlab/reports?id=${r.match_id}&revision=${r.id}`}
              >
                <FileText size={20} aria-hidden />
                <span>
                  <b>
                    N91 {r.snapshot.match.category_id} —{" "}
                    {r.snapshot.match.opponent}
                  </b>
                  <small>
                    {formatDay(r.snapshot.match.played_on)} ·{" "}
                    {t.overview.revision} #{r.revision}
                  </small>
                </span>
                <span
                  className={`ml-badge${r.validated_at ? " ml-badge-reviewed" : ""}`}
                >
                  {r.validated_at
                    ? t.reports.validated
                    : t.reports.unvalidated}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="ml-card ml-dossier-empty">
            <p>{t.overview.noReports}</p>
            <Link className="ml-button secondary" href="/matchlab/reports">
              {t.overview.openReports}
            </Link>
          </div>
        )}
      </section>
      <section className="ml-overview-block">
        <div className="ml-block-head">
          <p className="ml-eyebrow">{t.overview.readings}</p>
          <small>{t.overview.structure}</small>
        </div>
        <div className="ml-readings-grid">
          <div className="ml-readings">
            <div className="ml-panel-head">
              <b>{t.overview.axesTitle}</b>
              <small>{t.overview.axesKinds}</small>
            </div>
            <div className="ml-readings-items">
              {[
                [
                  "01",
                  t.overview.collective,
                  t.overview.collectiveText,
                  t.overview.collectiveDetail,
                  "reports",
                ],
                [
                  "02",
                  t.overview.individual,
                  t.overview.individualText,
                  t.overview.individualDetail,
                  "players",
                ],
                [
                  "03",
                  t.overview.recruitment,
                  t.overview.recruitmentText,
                  t.overview.recruitmentDetail,
                  "players",
                ],
              ].map(([num, kind, title, text, link]) => (
                <Link href={`/matchlab/${link}`} key={num}>
                  <span>
                    {num} / {kind.toUpperCase()}
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
            </div>
          </div>
          <aside className="ml-review-panel">
            <div className="ml-panel-head">
              <b>{t.overview.toReview}</b>
              <small>{t.overview.toReviewMeta}</small>
            </div>
            {toReview.length ? (
              toReview.slice(0, 3).map((p) => (
                <Link
                  className="ml-review-row"
                  href="/matchlab/players"
                  key={p.id}
                >
                  <PlayerAvatar playerId={p.id} name={p.full_name} />
                  <span>
                    <b>{p.full_name}</b>
                    <small>
                      {graph.memberships
                        .filter((m) => m.player_id === p.id)
                        .map((m) => m.category_id)
                        .filter((c, i, all) => all.indexOf(c) === i)
                        .join(" · ")}{" "}
                      · {positionNames[p.usual_position]}
                    </small>
                  </span>
                  <span className="ml-badge">{t.players.trial}</span>
                </Link>
              ))
            ) : (
              <p className="ml-review-empty">{t.overview.toReviewEmpty}</p>
            )}
            {toReview.length > 3 && (
              <Link className="ml-table-link" href="/matchlab/players">
                {t.overview.allProfiles} ({toReview.length})
                <ArrowUpRight size={15} />
              </Link>
            )}
            <small>{t.decision}</small>
          </aside>
        </div>
      </section>
      <div className="ml-feature-grid">
        {[
          {
            Icon: Users,
            title: t.overview.squad,
            heading: t.overview.squadTitle,
            text: "U-14 · U-16 · U-17 · U-18",
            href: "players",
          },
          {
            Icon: Film,
            title: t.overview.library,
            heading: t.overview.libraryText,
            text: t.overview.libraryDetail,
            href: "video",
            image: "/promise-03.png",
          },
          {
            Icon: FileText,
            title: t.overview.reports,
            heading: t.overview.reportsText,
            text: t.overview.reportsDetail,
            href: "reports",
          },
        ].map((c) => (
          <Link
            key={c.href}
            href={`/matchlab/${c.href}`}
            className={`ml-card${c.image ? " ml-feature-media" : ""}`}
          >
            <c.Icon size={24} />
            <small>{c.title}</small>
            <h3>{c.heading}</h3>
            <p>{c.text}</p>
            {c.image && (
              <Image src={c.image} alt="" fill sizes="(min-width:1024px) 15vw, 45vw" />
            )}
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
