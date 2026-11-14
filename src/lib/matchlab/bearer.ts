/**
 * Native clients (the MatchLab mobile app) authenticate with the Supabase access
 * token in an `Authorization: Bearer` header instead of the browser cookie.
 * A browser never attaches this header on its own, so a Bearer request carries no
 * CSRF risk; the cookie path keeps its exact Origin check. Pure: no Next, no network.
 */
export type Credential =
  | { kind: "cookie" }
  | { kind: "bearer"; token: string }
  | { kind: "invalid" };

const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** A present but malformed header is refused: it never falls back to the cookie. */
export function credential(headers: Headers): Credential {
  const header = headers.get("authorization");
  if (header === null) return { kind: "cookie" };
  const match = /^Bearer ([^\s]+)$/.exec(header);
  if (!match || match[1].length > 8192 || !JWT.test(match[1]))
    return { kind: "invalid" };
  return { kind: "bearer", token: match[1] };
}

/** Same rule as before for the cookie: exact Origin, never a cross-site fetch. */
export function cookieOriginAllowed(headers: Headers, expected: string) {
  const origin = headers.get("origin");
  return (
    !!origin &&
    origin === expected &&
    headers.get("sec-fetch-site") !== "cross-site"
  );
}

/**
 * Token login from a native app: no Origin is sent. A browser page elsewhere is still
 * refused when it identifies itself (foreign Origin or cross-site fetch). It could not
 * read the response anyway: the JSON body forces a CORS preflight that is never granted.
 */
export function nativeOriginAllowed(headers: Headers, expected: string) {
  const origin = headers.get("origin");
  if (headers.get("sec-fetch-site") === "cross-site") return false;
  return origin === null || origin === expected;
}

export function originAllowed(headers: Headers, expected: string) {
  const found = credential(headers);
  if (found.kind === "bearer") return true;
  return cookieOriginAllowed(headers, expected);
}
