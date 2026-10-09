import Image from "next/image";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { words, categoryLabels, dateLabel, matchDateLabel, ticketStatusLabel, scoreLabel, type ClubMatch, type StandingSnapshot } from "@/lib/club";
import { partners } from "@/lib/data/partners";
import type { Locale, NewsArticle } from "@/types";

export function ActionLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return <Link href={href} className={`club-button${secondary ? " secondary" : ""}`}>{children}<ArrowRight size={16} aria-hidden /></Link>;
}
export function PageIntro({ title, eyebrow, description, image, children }: { title: string; eyebrow?: string; description?: string; image?: string; children?: React.ReactNode }) {
  return <header className={`club-page-intro${image ? " with-photo" : ""}`}>
    {image && <Image src={image} alt="" fill sizes="100vw" className="object-cover" preload />}
    <div className="club-container relative z-10">{eyebrow && <p className="club-kicker">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="intro-description">{description}</p>}{children}</div>
  </header>;
}
export function SectionHeading({ title, eyebrow, href, linkLabel }: { title: string; eyebrow?: string; href?: string; linkLabel?: string }) {
  return <div className="club-section-heading"><div>{eyebrow && <p className="club-kicker">{eyebrow}</p>}<h2>{title}</h2></div>{href && <Link className="club-text-link" href={href}>{linkLabel}<ArrowRight size={17} aria-hidden /></Link>}</div>;
}
export function EmptyState({ title, children, href, label }: { title: string; children: React.ReactNode; href?: string; label?: string }) {
  return <div className="club-empty"><CalendarDays size={28} aria-hidden /><h3>{title}</h3><p>{children}</p>{href && <Link className="club-text-link" href={href}>{label}<ArrowRight size={16} aria-hidden /></Link>}</div>;
}
export function NewsCard({ article, locale, horizontal = false, featured = false }: { article: NewsArticle; locale: Locale; horizontal?: boolean; featured?: boolean }) {
  return <article className={`club-news-card${horizontal ? " horizontal" : ""}${featured ? " featured" : ""}`}>
    <Link href={`/actualites/${article.slug}`} className="news-image" tabIndex={-1} aria-hidden><Image src={article.image} alt="" fill sizes={horizontal ? "(min-width:768px) 38vw, 100vw" : "(min-width:1024px) 40vw, 100vw"} className="object-cover" /></Link>
    <div className="news-copy"><div className="news-meta"><span>{categoryLabels[article.category][locale]}</span><time dateTime={article.date}>{dateLabel(article.date, locale)}</time></div>
      <h3><Link href={`/actualites/${article.slug}`}>{article.title[locale]}</Link></h3><p>{article.excerpt[locale]}</p><Link href={`/actualites/${article.slug}`} className="club-text-link" aria-label={`${words(locale,"Lire","Read")} ${article.title[locale]}`}>{words(locale,"Lire l’article","Read story")}<ArrowRight size={16} aria-hidden /></Link>
    </div>
  </article>;
}
export function PartnerGrid({ locale }: { locale: Locale }) {
  return <section className="club-partners" aria-label={words(locale,"Nos partenaires","Our partners")}><div className="club-container">
    <div className="club-section-heading"><p className="club-kicker">{words(locale,"Ils accompagnent notre vision","Supporting our vision")}</p><Link className="club-text-link" href="/partenaires">{words(locale,"Nos partenaires","Our partners")}<ArrowRight size={16} aria-hidden /></Link></div>
    <div className="partner-logo-grid">{partners.map(p => <Link href={`/partenaires#${p.id}`} key={p.id}><div className="partner-logo">{p.logo && <Image src={p.logo} alt={p.name} fill sizes="(min-width:768px) 220px, 140px" className="object-contain" />}</div><span>{p.role[locale]}</span></Link>)}</div>
  </div></section>;
}
export function MatchCard({ match, locale }: { match: ClubMatch; locale: Locale }) {
  const status = { scheduled: words(locale,"À venir","Upcoming"), live: words(locale,"En cours","In progress"), finished: words(locale,"Terminé","Finished"), postponed: words(locale,"Reporté","Postponed"), cancelled: words(locale,"Annulé","Cancelled") };
  return <article className="club-match"><p className="club-kicker">{match.competition}</p><p className="match-date">{matchDateLabel(match, locale)}</p><p className="match-status">{status[match.status]}</p>
    <div className="match-score"><span>{match.home.name}</span><strong>{scoreLabel(match)}</strong><span>{match.away.name}</span></div>
    {match.confirmed && match.kickoff && <p>{new Intl.DateTimeFormat(locale,{timeStyle:"short",timeZone:match.timezone}).format(new Date(match.kickoff))} · {match.timezone}</p>}
    <Link href={`/matchs/${match.id}`} className="club-text-link">{words(locale,"Détail du match","Match details")}<ArrowRight size={16} aria-hidden /></Link><TicketLink match={match} locale={locale} />
  </article>;
}
export function TicketLink({ match, locale }: { match: ClubMatch; locale: Locale }) {
  if (!match.ticket) return null;
  if (match.ticket.status === "on_sale") return <a className="club-button" href={match.ticket.url} target="_blank" rel="noopener noreferrer">{ticketStatusLabel(match.ticket.status, locale)}</a>;
  return <p className="match-status">{ticketStatusLabel(match.ticket.status, locale)}</p>;
}
export function Standings({ snapshot, locale }: { snapshot: StandingSnapshot; locale: Locale }) {
  return <div><p className="club-kicker">{snapshot.competition} · {snapshot.season}</p><p className="text-sm py-3">{words(locale,"Mis à jour le","Updated")} {dateLabel(snapshot.updatedAt,locale)}</p><div className="club-table-scroll" tabIndex={0} role="region" aria-label={words(locale,"Tableau de classement défilant","Scrollable standings table")}><table className="club-table"><caption className="sr-only">{snapshot.competition}</caption><thead><tr>{[words(locale,"Rang","Rank"),words(locale,"Équipe","Team"),words(locale,"Joués","Played"),"Pts",words(locale,"Diff.","GD")].map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{snapshot.rows.map(r=><tr className={r.isClub ? "is-club" : ""} key={r.rank}><td>{r.rank}</td><th scope="row">{r.team}</th><td>{r.played}</td><td><strong>{r.points}</strong></td><td>{r.goalDifference}</td></tr>)}</tbody></table></div></div>;
}
