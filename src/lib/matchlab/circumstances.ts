import { fr as t } from "./messages";
import type { Match } from "./schema";

/** Descriptive match context (PDF 1.1 §4 and §5.1). It never changes a score. */
export const GROUNDS = ["home", "away", "neutral"] as const;
export const EVENTS = [
  "absences",
  "injury",
  "red_card",
  "tactical_change",
  "interruption",
  "delay",
] as const;
export type Ground = (typeof GROUNDS)[number];
export type MatchEvent = (typeof EVENTS)[number];
export type CircumstanceKey = keyof typeof t.match.circumstanceKeys;
export const CIRCUMSTANCE_KEYS = Object.keys(
  t.match.circumstanceKeys,
) as CircumstanceKey[];

/** Readable label/value pairs in the catalogue order, skipping empty fields. */
export function describeCircumstances(
  circumstances: Match["circumstances"] = {},
) {
  return CIRCUMSTANCE_KEYS.flatMap((key) => {
    const value = circumstances[key];
    if (
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && !value.length)
    )
      return [];
    const text =
      key === "ground"
        ? t.match.grounds[value as Ground]
        : key === "events"
          ? (value as MatchEvent[]).map((e) => t.match.events[e]).join(", ")
          : String(value);
    return [{ key, label: t.match.circumstanceKeys[key], value: text }];
  });
}
