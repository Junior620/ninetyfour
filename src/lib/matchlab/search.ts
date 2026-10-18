import { POSITIONS, type Position } from "./questionnaire";
import { individualScore } from "./scoring";
import type { Graph, Player } from "./schema";
import { CATEGORIES, type Category } from "./trials";

export type Metric = "rating" | "regularity" | "minutes" | "progression";
export type ProfileQuery = {
  categories: Category[];
  positions: Position[];
  lastMatches: number | null;
  metric: Metric;
  limit: number;
  /** Phrases understood, shown back to the user. */
  understood: string[];
};
const words: Record<string, number> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
};
export const plain = (s: string) =>
  s
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ");
const count = (s: string) => (/^\d+$/.test(s) ? Number(s) : words[s]);
const NUMBER = "(\\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)";
// Most specific phrases first; a matched phrase is removed before the generic ones run.
const positionRules: [RegExp, Position[], string][] = [
  [/\bdefenseurs? centra(l|ux)\b/, ["CB"], "défenseurs centraux"],
  [/\bmilieux? defensifs?\b|\bsentinelles?\b/, ["DM"], "milieux défensifs"],
  [/\bmilieux? relayeurs?\b|\brelayeurs?\b/, ["CM"], "milieux relayeurs"],
  [/\bmilieux? offensifs?\b|\bmeneurs?\b/, ["AM"], "milieux offensifs"],
  [
    /\bavants?[- ]centres?\b|\bbuteurs?\b|\bpointes?\b/,
    ["ST"],
    "avants-centres",
  ],
  [/\bgardiens?\b/, ["GK"], "gardiens"],
  [/\blatera(l|ux)\b|\blaterales?\b/, ["FB"], "latéraux"],
  [/\bailiers?\b/, ["WG"], "ailiers"],
  [/\bdefenseurs?\b|\bdefense\b/, ["CB", "FB"], "défenseurs"],
  [/\bmilieux?\b/, ["DM", "CM", "AM"], "milieux"],
  [/\battaquants?\b|\battaque\b/, ["WG", "ST"], "attaquants"],
];

/** Positions named in a sentence, most specific phrase first. */
export function positionsIn(input: string): Position[] {
  let text = plain(input);
  const found = new Set<Position>();
  for (const [rule, list] of positionRules)
    if (rule.test(text)) {
      list.forEach((p) => found.add(p));
      text = text.replace(rule, " ");
    }
  return POSITIONS.filter((p) => found.has(p));
}
/** Rule-based reading of a request in everyday French. Nothing is guessed silently. */
export function parseProfileQuery(input: string): ProfileQuery {
  let text = plain(input);
  const understood: string[] = [];
  const categories = [
    ...new Set(
      [...text.matchAll(/\bu ?-? ?(14|16|17|18)\b/g)].map(
        (m) => `U-${m[1]}` as Category,
      ),
    ),
  ].filter((c) => CATEGORIES.includes(c));
  categories.forEach((c) => understood.push(c));
  let lastMatches: number | null = null;
  const period = text.match(
    new RegExp(`\\b${NUMBER} derni(?:ers|eres) (?:matchs?|rencontres?)\\b`),
  );
  if (period) {
    lastMatches = count(period[1]);
    text = text.replace(period[0], " ");
  } else if (/\bdernier match\b|\bderniere rencontre\b/.test(text)) {
    lastMatches = 1;
    text = text.replace(/\bdernier match\b|\bderniere rencontre\b/, " ");
  } else if (/\bderniers matchs\b|\bdernieres rencontres\b/.test(text))
    lastMatches = 3;
  if (lastMatches)
    understood.push(
      `${lastMatches} dernier${lastMatches > 1 ? "s" : ""} match${lastMatches > 1 ? "s" : ""}`,
    );
  let limit = 5;
  const top = text.match(new RegExp(`\\b(?:top|les|des) ${NUMBER}\\b`));
  if (top) {
    limit = Math.min(20, count(top[1]));
    understood.push(`${limit} résultat${limit > 1 ? "s" : ""}`);
  }
  const positions = new Set<Position>();
  for (const [rule, list, label] of positionRules)
    if (rule.test(text)) {
      list.forEach((p) => positions.add(p));
      understood.push(label);
      text = text.replace(rule, " ");
    }
  const metric: Metric = /\b(reguli|constan|stable|fiable)/.test(text)
    ? "regularity"
    : /\b(temps de jeu|minutes|plus utilis|joue le plus)/.test(text)
      ? "minutes"
      : /\b(progress|evolu|en hausse|ameliore)/.test(text)
        ? "progression"
        : "rating";
  understood.push(metricLabels[metric]);
  return {
    categories,
    positions: POSITIONS.filter((p) => positions.has(p)),
    lastMatches,
    metric,
    limit,
    understood,
  };
}
export const metricLabels: Record<Metric, string> = {
  rating: "les mieux évalués (moyenne des notes /10)",
  regularity:
    "les plus réguliers (plus faible écart entre leurs notes, 2 matchs minimum)",
  minutes: "le plus de temps de jeu",
  progression:
    "la plus forte progression (moyenne récente − moyenne ancienne, 2 matchs minimum)",
};

export type ProfileRow = {
  player: Player;
  mean: number | null;
  spread: number | null;
  progression: number | null;
  scores: number[];
  minutes: number;
  matches: number;
};

/** Runs a query on the authorised graph; every row shows its own sample. */
export function runProfileQuery(
  graph: Pick<Graph, "players" | "memberships" | "matches" | "evaluations">,
  q: ProfileQuery,
) {
  const matches = graph.matches
    .filter((m) => !q.categories.length || q.categories.includes(m.category_id))
    .sort((a, b) => b.played_on.localeCompare(a.played_on))
    .slice(0, q.lastMatches ?? undefined);
  const matchIds = new Set(matches.map((m) => m.id));
  const order = new Map(matches.map((m, i) => [m.id, i]));
  const evaluations = graph.evaluations.filter(
    (e) =>
      matchIds.has(e.match_id) &&
      (!q.positions.length || q.positions.includes(e.position)),
  );
  const rows: ProfileRow[] = [];
  for (const player of graph.players) {
    const own = evaluations
      .filter((e) => e.player_id === player.id)
      // Oldest first, so progression compares earlier and later matches.
      .sort((a, b) => order.get(b.match_id)! - order.get(a.match_id)!);
    if (!own.length) continue;
    const scores = own
      .map((e) => individualScore(e.common, e.specific))
      .filter((s): s is number => s !== null);
    const mean = scores.length
      ? scores.reduce((s, v) => s + v, 0) / scores.length
      : null;
    const spread =
      scores.length >= 2 && mean !== null
        ? Math.sqrt(
            scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length,
          )
        : null;
    const half = Math.floor(scores.length / 2);
    const avg = (list: number[]) =>
      list.reduce((s, v) => s + v, 0) / list.length;
    const progression =
      scores.length >= 2
        ? avg(scores.slice(scores.length - half)) - avg(scores.slice(0, half))
        : null;
    rows.push({
      player,
      mean,
      spread,
      progression,
      scores,
      minutes: own.reduce((s, e) => s + (e.minutes ?? 0), 0),
      matches: new Set(own.map((e) => e.match_id)).size,
    });
  }
  const value = (r: ProfileRow) =>
    q.metric === "rating"
      ? r.mean
      : q.metric === "regularity"
        ? r.spread
        : q.metric === "minutes"
          ? r.minutes
          : r.progression;
  const ranked = rows
    .filter((r) => value(r) !== null)
    .sort((a, b) =>
      q.metric === "regularity"
        ? a.spread! - b.spread! || b.mean! - a.mean!
        : value(b)! - value(a)!,
    );
  // Players expected in this scope but without a usable sample in the period.
  const seasons = new Set(
    matches.map((m) => `${m.season_id}|${m.category_id}`),
  );
  const expected = graph.players.filter(
    (p) =>
      (!q.positions.length || q.positions.includes(p.usual_position)) &&
      graph.memberships.some(
        (m) =>
          m.player_id === p.id &&
          seasons.has(`${m.season_id}|${m.category_id}`),
      ),
  );
  const missing = expected.filter(
    (p) => !ranked.some((r) => r.player.id === p.id),
  );
  const dates = matches.map((m) => m.played_on).sort();
  return {
    results: ranked.slice(0, q.limit),
    insufficient: rows.filter((r) => value(r) === null),
    missing,
    period: {
      from: dates[0] ?? null,
      to: dates[dates.length - 1] ?? null,
      matches: matches.length,
    },
    sample: {
      evaluations: evaluations.length,
      players: rows.length,
    },
  };
}
