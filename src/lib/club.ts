import type { Locale, LocalizedString, NewsArticle, TeamCategoryId } from "@/types";
import { newsArticles } from "@/lib/data/news";
import { teamCategories } from "@/lib/data/staff";

export const words = (locale: string, fr: string, en: string) => locale === "en" ? en : fr;
// A calendar date has no UTC offset; keep its day in every display timezone.
export const dateLabel = (date: string, locale: string, timezone = "Africa/Douala") => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "long", timeZone: date.length === 10 ? "UTC" : timezone }).format(new Date(date.length === 10 ? `${date}T00:00:00Z` : date));
export const categoryLabels: Record<string, LocalizedString> = {
  academy: { fr: "Vie du club", en: "Club life" }, matches: { fr: "Matchs", en: "Matches" },
  training: { fr: "Formation", en: "Training" }, partners: { fr: "Partenaires", en: "Partners" },
  events: { fr: "Événements", en: "Events" }, "academy-life": { fr: "Vie de l’académie", en: "Academy life" }, education: { fr: "Éducation", en: "Education" },
};
export const clubNav = [
  { fr: "Actualités", en: "News", href: "/actualites", children: [
    { fr: "Toutes les actualités", en: "All news", href: "/actualites" },
    { fr: "Événements", en: "Events", href: "/actualites?category=events" },
    { fr: "Vie du club", en: "Club life", href: "/actualites?category=academy" }] },
  { fr: "Club", en: "Club", href: "/academie", children: [
    { fr: "Notre académie", en: "Our academy", href: "/academie" },
    { fr: "Vision & valeurs", en: "Vision & values", href: "/vision" },
    { fr: "Encadrement", en: "Coaching staff", href: "/encadrement" },
    { fr: "Venir nous rencontrer", en: "Visit us", href: "/contact#venir" }] },
  { fr: "Saison", en: "Season", href: "/saison", children: [
    { fr: "Calendrier", en: "Fixtures", href: "/saison" },
    { fr: "Résultats", en: "Results", href: "/saison?view=results" },
    { fr: "Classement", en: "Standings", href: "/saison?view=standings" }] },
  { fr: "Équipes", en: "Teams", href: "/equipes", children: teamCategories.map(t => ({ fr: t.shortLabel.fr, en: t.shortLabel.en, href: `/equipes/${t.id}` })) },
  { fr: "Formation", en: "Academy", href: "/programme", children: [
    { fr: "Programme 2026–2029", en: "2026–2029 programme", href: "/programme" },
    { fr: "Formation sportive", en: "Football development", href: "/formation-sportive" },
    { fr: "Éducation", en: "Education", href: "/education" },
    { fr: "Performance Lab", en: "Performance Lab", href: "/performance-lab" },
    { fr: "Candidater", en: "Apply", href: "/rejoindre" }] },
  { fr: "Médias", en: "Media", href: "/galerie", children: [] },
  { fr: "Partenaires", en: "Partners", href: "/partenaires", children: [
    { fr: "Nos partenaires", en: "Our partners", href: "/partenaires" },
    { fr: "Parrains & ambassadeurs", en: "Patrons & ambassadors", href: "/parrains" },
    { fr: "Devenir partenaire", en: "Become a partner", href: "/contact?subject=partnership#formulaire" }] },
];

export interface ClubMatch {
  id: string; teamId: TeamCategoryId; season: string; competition: string;
  home: { name: string; logo?: string }; away: { name: string; logo?: string }; isHome: boolean;
  date: string | null; kickoff: string | null; timezone: string; confirmed: boolean;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  homeScore: number | null; awayScore: number | null; venue?: string;
  ticket?: { url: string; status: "on_sale" | "sold_out" | "closed" | "coming_soon" };
  articleSlugs?: string[]; updatedAt: string; source: string;
}
export interface StandingSnapshot {
  teamId: TeamCategoryId; season: string; competition: string; updatedAt: string; source: string;
  rows: { rank: number; team: string; played: number; points: number; goalDifference: number; isClub?: boolean }[];
}
export interface PublicPlayer { slug: string; name: string; teamId: TeamCategoryId; position: LocalizedString; bio: LocalizedString; image?: string; number?: number }
// Publish only confirmed club information here. Dashboard demonstration data is deliberately separate.
export const matches: ClubMatch[] = [];
export const standings: StandingSnapshot[] = [];
export const publicPlayers: PublicPlayer[] = [];
export const commerce: { shopUrl: string | null; ticketUrl: string | null } = { shopUrl: null, ticketUrl: null };

function matchTime(match: ClubMatch) {
  if (match.kickoff) return Date.parse(match.kickoff);
  if (!match.date) return NaN;
  // Without a kickoff, retain the fixture until the end of its own local day.
  // Resolve the IANA timezone offset for this date (including daylight saving).
  const wallTime = Date.parse(`${match.date}T23:59:59Z`);
  let instant = wallTime;
  const format = new Intl.DateTimeFormat("en-GB", { timeZone: match.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = Object.fromEntries(format.formatToParts(new Date(instant)).map(part => [part.type, part.value]));
    const localTime = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
    const correction = wallTime - localTime;
    instant += correction;
    if (correction === 0) break;
  }
  return instant + 999;
}

export function matchDateLabel(match: ClubMatch, locale: string) {
  const date = match.date ?? match.kickoff;
  return match.confirmed && date ? dateLabel(date, locale, match.timezone) : words(locale, "Date à confirmer", "Date to be confirmed");
}

export function ticketStatusLabel(status: NonNullable<ClubMatch["ticket"]>["status"], locale: string) {
  return {
    on_sale: words(locale, "Billetterie officielle ↗", "Official tickets ↗"),
    sold_out: words(locale, "Complet", "Sold out"),
    closed: words(locale, "Billetterie fermée", "Ticket sales closed"),
    coming_soon: words(locale, "Billetterie bientôt ouverte", "Ticket sales opening soon"),
  }[status];
}

export function matchSummary(items: ClubMatch[], now = new Date()) {
  const upcoming = items.filter(m => m.status === "scheduled" && m.confirmed && matchTime(m) >= now.getTime()).sort((a, b) => matchTime(a) - matchTime(b));
  const finished = items.filter(m => m.status === "finished").sort((a,b) => (matchTime(b) || -Infinity) - (matchTime(a) || -Infinity));
  return { next: upcoming[0], nextHome: upcoming.find(m => m.isHome), last: finished[0] };
}
export function scoreLabel(match: ClubMatch) {
  if (match.homeScore !== null && match.awayScore !== null && ["live", "finished"].includes(match.status)) return `${match.homeScore} – ${match.awayScore}`;
  return match.status === "finished" ? "—" : "VS";
}
export function filterNews(items: NewsArticle[], locale: Locale, query = "", category = "", year = "") {
  const normal = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return items.filter(a => (!category || a.category === category) && (!year || a.date.startsWith(year)) && normal(`${a.title[locale]} ${a.excerpt[locale]} ${a.content[locale]}`).includes(normal(query.trim()))).sort((a,b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
export const latestNews = [...newsArticles].sort((a,b) => b.date.localeCompare(a.date));
