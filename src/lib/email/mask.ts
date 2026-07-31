/** Mask email for UI display: j***@domain.com */
export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at < 1) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

/** First name heuristic from a full name; empty if unreliable. */
export function extractFirstName(name: string | undefined | null): string | null {
  if (!name) return null;
  const first = name.trim().split(/\s+/)[0];
  if (!first || first.length < 2) return null;
  // Reject if looks like email or has digits only
  if (/[@\d]/.test(first)) return null;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}
