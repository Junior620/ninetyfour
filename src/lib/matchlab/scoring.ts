/** Official questionnaire 1.1. No circumstance changes a score. Round only at display. */
export type Answer = number | null;
export type Answers = Record<string, Answer>;
export const SCORING_VERSION = "pdf-1.1";

export function mean(
  values: readonly (number | null | undefined)[],
): number | null {
  const observed = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  return observed.length
    ? observed.reduce((sum, value) => sum + value, 0) / observed.length
    : null;
}
export function individualScore(
  common: Answers,
  position: Answers,
): number | null {
  const a = mean(Object.values(common));
  const b = mean(Object.values(position));
  return a === null || b === null ? null : (a * 0.4 + b * 0.6) * 2;
}
export function collectiveScore(answers: Answers): number | null {
  const value = mean(Object.values(answers));
  return value === null ? null : value * 2;
}
export function displayScore(value: number | null, locale = "fr"): string {
  return value === null
    ? "—"
    : value.toLocaleString(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}
export interface ScoredEvaluation {
  player_id: string;
  position: string;
  common: Answers;
  specific: Answers;
}
export function rankings(evaluations: ScoredEvaluation[]) {
  const scored = evaluations.map((e) => ({
    ...e,
    score: individualScore(e.common, e.specific),
  }));
  const valid = scored.filter(
    (e): e is typeof e & { score: number } => e.score !== null,
  );
  const maximum = valid.length ? Math.max(...valid.map((e) => e.score)) : null;
  const positions = [...new Set(valid.map((e) => e.position))].map(
    (position) => {
      const group = valid.filter((e) => e.position === position);
      const n = new Set(group.map((e) => e.player_id)).size;
      return {
        position,
        mean: mean(group.map((e) => e.score)),
        n,
        smallSample: n < 5,
      };
    },
  );
  const bestPositionMean = positions.length
    ? Math.max(...positions.map((p) => p.mean!))
    : null;
  return {
    best: valid.filter(
      (e) => maximum !== null && Math.abs(e.score - maximum) < 1e-10,
    ),
    playerCount: new Set(valid.map((e) => e.player_id)).size,
    positions,
    bestPositions: positions.filter(
      (p) =>
        bestPositionMean !== null &&
        Math.abs(p.mean! - bestPositionMean) < 1e-10,
    ),
  };
}
