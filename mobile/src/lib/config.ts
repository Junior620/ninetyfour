/** MatchLab server (the Next.js site). Set in mobile/.env.local, see .env.example. */
export const API_URL = (
  process.env.EXPO_PUBLIC_MATCHLAB_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
/** Web screen where the same data is shown, for the "open on the web" hints. */
export const WEB_URL = `${API_URL}/matchlab/overview`;
