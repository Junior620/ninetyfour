type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const idempotencyCache = new Map<string, { expiresAt: number; payload: unknown }>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const IDEMPOTENCY_TTL_MS = 60 * 60 * 1000;

function prune() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  for (const [key, entry] of idempotencyCache) {
    if (entry.expiresAt <= now) idempotencyCache.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Returns true if allowed, false if rate limited. */
export function checkRateLimit(key: string): boolean {
  prune();
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (existing.count >= MAX_REQUESTS) return false;
  existing.count += 1;
  return true;
}

/** Honeypot filled = bot. Empty/undefined = human. */
export function isHoneypotTriggered(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function getIdempotentResult<T>(key: string | undefined | null): T | null {
  if (typeof key !== "string" || key.length < 8 || key.length > 400) return null;
  prune();
  const entry = idempotencyCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return entry.payload as T;
}

export function setIdempotentResult(key: string | undefined | null, payload: unknown) {
  if (typeof key !== "string" || key.length < 8 || key.length > 400) return;
  prune();
  idempotencyCache.set(key, {
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    payload,
  });
}
