import { errorMessage } from "@matchlab/messages";
import { API_URL } from "./config";
import { clearTokens, readTokens, writeTokens, type Tokens } from "./session";

/** Error returned by the MatchLab API, or OFFLINE when the server cannot be reached. */
export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public fields: { path: string; message: string }[] = [],
    /** Underlying cause, shown in development builds only. */
    public detail = "",
  ) {
    super(
      (code === "OFFLINE" ? OFFLINE_MESSAGE : errorMessage(code)) +
        (__DEV__ && detail ? ` [${detail}]` : ""),
    );
  }
  get offline() {
    return this.code === "OFFLINE";
  }
}
export const OFFLINE_MESSAGE =
  "Serveur MatchLab injoignable. Vérifiez le réseau ; votre saisie est conservée sur le téléphone.";

let tokens: Tokens | null = null;
let loaded = false;
let refreshing: Promise<Tokens | null> | null = null;
let onSessionLost: (() => void) | null = null;

/** The auth provider is told when the session can no longer be used. */
export const setSessionLostHandler = (handler: (() => void) | null) => {
  onSessionLost = handler;
};
export async function currentTokens() {
  if (!loaded) {
    tokens = await readTokens();
    loaded = true;
  }
  return tokens;
}
async function store(next: Tokens | null) {
  tokens = next;
  loaded = true;
  if (next) await writeTokens(next);
  else await clearTokens();
}

async function raw(path: string, init: RequestInit) {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch (e) {
    // Only a transport failure means "offline"; anything else (body encoding, a bug)
    // must not be shown as a network problem nor be queued for retry.
    const cause = e instanceof Error ? (e.cause instanceof Error ? e.cause : e) : null;
    const message = cause ? `${cause.name}: ${cause.message}` : String(e);
    console.warn("[MatchLab] request not sent:", path, message);
    if (/unsupported|formdata|invalid|is not a function|bytes/i.test(message))
      throw new ApiError("INTERNAL_ERROR", 0, [], message);
    throw new ApiError("OFFLINE", 0, [], message);
  }
}
async function parse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      typeof data?.code === "string" ? data.code : "INTERNAL_ERROR",
      response.status,
      Array.isArray(data?.fields) ? data.fields : [],
    );
  return data as T;
}

export async function signIn(email: string, password: string) {
  const response = await raw("/api/matchlab/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  await store(await parse<Tokens>(response));
}
/** Revokes the MatchLab session on the server, then forgets the tokens in any case. */
export async function signOut() {
  try {
    await request("/api/matchlab/auth/logout", { method: "POST", json: {} });
  } catch {
    /* Offline or already expired: the local tokens are removed all the same. */
  }
  await store(null);
}

async function refresh(): Promise<Tokens | null> {
  const current = await currentTokens();
  if (!current) return null;
  refreshing ??= (async () => {
    try {
      const response = await raw("/api/matchlab/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      });
      if (response.status === 401) {
        await store(null);
        return null;
      }
      const next = await parse<Tokens>(response);
      await store(next);
      return next;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
async function validAccessToken() {
  const current = await currentTokens();
  if (!current) return null;
  // Renew one minute before expiry; expires_at is in seconds.
  if (current.expires_at && current.expires_at * 1000 - Date.now() < 60_000)
    return (await refresh())?.access_token ?? null;
  return current.access_token;
}
/** Access token for components that load protected files themselves (photos). */
export const accessToken = validAccessToken;

type Options = {
  method?: "GET" | "POST" | "DELETE";
  json?: unknown;
  form?: FormData;
};
/**
 * Authenticated call to /api/matchlab/*. One silent token renewal on 401; if that fails
 * the session is over and the app returns to the login screen.
 */
export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const send = async (token: string | null) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.json !== undefined) headers["Content-Type"] = "application/json";
    return raw(path, {
      method: options.method ?? (options.json || options.form ? "POST" : "GET"),
      headers,
      body: options.form ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined),
    });
  };
  let response = await send(await validAccessToken());
  if (response.status === 401) {
    const renewed = await refresh();
    if (renewed) response = await send(renewed.access_token);
    if (response.status === 401) {
      await store(null);
      onSessionLost?.();
    }
  }
  return parse<T>(response);
}
