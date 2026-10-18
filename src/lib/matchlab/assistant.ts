import { CATEGORIES, type Category } from "./trials";
import { parseProfileQuery, positionsIn, plain, type ProfileQuery } from "./search";
import type { Position } from "./questionnaire";
import type { Match, Player } from "./schema";

export type ExportFormat = "xlsx" | "csv" | "pdf" | "zip";
export type AssistantRequest =
  | { kind: "help"; topic: "page" | "scores" | "filters" | "tour" }
  | { kind: "profiles"; query: ProfileQuery }
  | { kind: "find_match"; opponent: string | null }
  | {
      kind: "create_player";
      full_name: string | null;
      position: Position | null;
      category: Category | null;
      jersey: number | null;
      foot: Player["strong_foot"] | null;
    }
  | {
      kind: "create_match";
      opponent: string | null;
      played_on: string | null;
      category: Category | null;
    }
  | {
      kind: "export";
      format: ExportFormat;
      category: Category | null;
      from: string | null;
      to: string | null;
    }
  | { kind: "dossier" }
  | { kind: "summary" }
  | { kind: "tactics"; opponent: string | null }
  | { kind: "unknown" };

const MONTHS = [
  "janvier",
  "fevrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "septembre",
  "octobre",
  "novembre",
  "decembre",
];
const MONTH = `(${MONTHS.join("|")})`;
const day = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const local = (d: Date) => day(d.getFullYear(), d.getMonth() + 1, d.getDate());
const valid = (y: number, m: number, d: number) => {
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d;
};

/** A calendar day named in the sentence: today, tomorrow, 25/10(/2026), 25 octobre (2026). */
export function readDate(input: string, now = new Date()): string | null {
  const text = plain(input);
  if (/\baujourd hui\b/.test(text)) return local(now);
  if (/\bdemain\b/.test(text))
    return local(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const numeric = text.match(/\b(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/);
  if (numeric) {
    const [d, m] = [Number(numeric[1]), Number(numeric[2])];
    const y = numeric[3]
      ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3])
      : now.getFullYear();
    if (valid(y, m, d)) return day(y, m, d);
  }
  const named = text.match(new RegExp(`\\b(\\d{1,2})(?:er)? ${MONTH}(?: (\\d{4}))?\\b`));
  if (named) {
    const [d, m] = [Number(named[1]), MONTHS.indexOf(named[2]) + 1];
    const y = named[3] ? Number(named[3]) : now.getFullYear();
    if (valid(y, m, d)) return day(y, m, d);
  }
  return null;
}

/** "de septembre", "en octobre 2026": the whole month; a month still to come is last year's. */
export function readMonth(input: string, now = new Date()) {
  const m = plain(input).match(new RegExp(`\\b(?:de|d|en|mois de|pour) ${MONTH}(?: (\\d{4}))?\\b`));
  if (!m) return null;
  const month = MONTHS.indexOf(m[1]) + 1;
  const year = m[2]
    ? Number(m[2])
    : month > now.getMonth() + 1
      ? now.getFullYear() - 1
      : now.getFullYear();
  return {
    from: day(year, month, 1),
    to: day(year, month, new Date(year, month, 0).getDate()),
  };
}

const readCategory = (input: string): Category | null => {
  const m = plain(input).match(/\bu ?-? ?(14|16|17|18)\b/);
  const c = m ? (`U-${m[1]}` as Category) : null;
  return c && CATEGORIES.includes(c) ? c : null;
};
const CAPITAL = "[A-ZÀ-ÖØ-Ý][\\p{L}'’-]*";
const PARTICLE = "(?:de |du |da |dos |le |la |van |von |ben |ibn )?";
/** Proper name given after a cue word, or between quotes. */
function nameAfter(input: string, cues: string[]): string | null {
  const quoted = input.match(/[«"“]\s*([^»"”]{2,120}?)\s*[»"”]/);
  if (quoted) return quoted[1].trim();
  for (const cue of cues) {
    const m = input.match(
      new RegExp(`(?:^|\\s)${cue}\\s+(${CAPITAL}(?:\\s+${PARTICLE}${CAPITAL})*)`, "u"),
    );
    if (m) return m[1].trim();
  }
  return null;
}
/** Opponent after "contre", "face à" or "vs", up to a date, a category or punctuation. */
function opponentIn(input: string): string | null {
  const m = input.match(
    /(?:^|\s)(?:contre|face [àa]|vs\.?|versus)\s+(.+?)(?=\s+(?:le|du|en|pour|au|ce|cette|samedi|dimanche|lundi|mardi|mercredi|jeudi|vendredi|aujourd’hui|aujourd'hui|demain|[uU] ?-? ?\d{2})\b|\s+\d{1,2}[/.-]|[,.;?!]|$)/u,
  );
  return m ? m[1].replace(/^[«"“]s*|s*[»"”]$/g, "").trim() : null;
}

/**
 * Rule-based reading of a request in everyday French. The first matching rule wins,
 * in this order: questions about the tool, creations, export, club dossier, game plan,
 * summary, match search, profile search; anything else is not understood.
 */
export function readRequest(input: string, now = new Date()): AssistantRequest {
  const text = plain(input).replace(/\s+/g, " ").trim();
  if (
    /^(comment|pourquoi|ou |c est quoi|qu est ce)/.test(text) ||
    /\b(aide|explique|expliquer|a quoi sert|que fait|prise en main|tutoriel)\b/.test(text)
  )
    return {
      kind: "help",
      topic: /\b(note|notes|calcul|score|40|60)\b/.test(text)
        ? "scores"
        : /\bfiltre/.test(text)
          ? "filters"
          : /\b(guide|prise en main|tutoriel|commencer|debuter)\b/.test(text)
            ? "tour"
            : "page",
    };
  if (/\b(ajout|cree|creer|cre|inscri|nouveau|nouvelle|enregistr)\w*\b.*\bjoueu(r|se)s?\b/.test(text)) {
    const foot = /\bgaucher|pied gauche\b/.test(text)
      ? "left"
      : /\bdroitier|pied droit\b/.test(text)
        ? "right"
        : /\bambidextre\b/.test(text)
          ? "both"
          : null;
    const jersey = text.match(/(?:#|\bdossard (?:n ?o? ?)?|\bnumero )(\d{1,2})\b/);
    return {
      kind: "create_player",
      full_name: nameAfter(input, ["joueuse", "joueur", "nommée", "nommé", "appelée", "appelé"]),
      position: positionsIn(input)[0] ?? null,
      category: readCategory(input),
      jersey: jersey && Number(jersey[1]) >= 1 && Number(jersey[1]) <= 99 ? Number(jersey[1]) : null,
      foot,
    };
  }
  if (/\b(ajout|cree|creer|cre|nouveau|nouvelle|programm|planifi|enregistr)\w*\b.*\b(match|rencontre)\b/.test(text))
    return {
      kind: "create_match",
      opponent: opponentIn(input),
      played_on: readDate(input, now),
      category: readCategory(input),
    };
  if (/\b(export\w*|telecharg\w*|excel|xlsx|csv|pdf|archive|sauvegarde)\b/.test(text)) {
    const period = readMonth(input, now);
    return {
      kind: "export",
      format: /\bcsv\b/.test(text)
        ? "csv"
        : /\bpdf\b/.test(text)
          ? "pdf"
          : /\b(archive|zip|sauvegarde)\b/.test(text)
            ? "zip"
            : "xlsx",
      category: readCategory(input),
      from: period?.from ?? null,
      to: period?.to ?? null,
    };
  }
  if (/\bdossier\b/.test(text) && /\b(club|presentation|pour)\b/.test(text))
    return { kind: "dossier" };
  if (/\b(plan de (jeu|match)|plans de (jeu|match)|tactique|strategie|cellule)\b/.test(text))
    return { kind: "tactics", opponent: opponentIn(input) };
  if (/\b(resum\w*|synthese|bilan|performances?|fiche)\b/.test(text))
    return { kind: "summary" };
  if (/\b(match|matchs|rencontre)\b/.test(text) && !/\bderniers? \w+ matchs?\b/.test(text) && !positionsIn(input).length)
    return { kind: "find_match", opponent: opponentIn(input) };
  const query = parseProfileQuery(input);
  if (
    query.positions.length ||
    query.categories.length ||
    /\b(reguli|mieux|meilleur|note|temps de jeu|progress|joueurs?|profils?)\b/.test(text)
  )
    return { kind: "profiles", query };
  return { kind: "unknown" };
}

/** Players whose full name, or family name, appears in the sentence. */
export function findPlayers(input: string, players: Player[]): Player[] {
  const text = ` ${plain(input).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ")} `;
  const words = (name: string) =>
    plain(name).replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 1);
  const full = players.filter((p) => text.includes(` ${words(p.full_name).join(" ")} `));
  if (full.length) return full;
  return players.filter((p) => {
    const w = words(p.full_name);
    return w.length > 1 && w.slice(1).every((x) => text.includes(` ${x} `));
  });
}

/** Matches against an opponent (accents, case and spacing ignored), most recent first. */
export function findMatches(opponent: string | null, matches: Match[]): Match[] {
  const key = (s: string) => plain(s).replace(/[^a-z0-9]+/g, " ").trim();
  const wanted = opponent ? key(opponent) : "";
  return matches
    .filter((m) => !wanted || key(m.opponent).includes(wanted))
    .sort((a, b) => b.played_on.localeCompare(a.played_on));
}
