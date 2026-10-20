import type { LabData } from "./shared";

/**
 * Last data graph per scope, kept in memory for this tab only. Switching page shows it
 * at once while it is reloaded in the background. Cleared on logout and on any
 * authentication refusal; a login reloads the whole page, so another account never
 * sees it.
 */
const cache = new Map<string, LabData>();

/** Scope of the data request: the filters, without page-only parameters. */
export function labQuery(queryString: string) {
  const params = new URLSearchParams(queryString);
  for (const key of ["id", "module", "revision", "t", "ask"]) params.delete(key);
  params.sort();
  return params.toString();
}
export const cachedLab = (key: string) => cache.get(key) ?? null;
export const clearLabCache = () => cache.clear();

export async function fetchLab(key: string): Promise<LabData> {
  const response = await fetch(`/api/matchlab/data?${key}`, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) cache.clear();
    throw new Error(result.code);
  }
  cache.set(key, result);
  return result;
}
