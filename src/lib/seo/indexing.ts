export function indexingAllowed() {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview" && process.env.VERCEL_ENV !== "development" && process.env.SITE_INDEXING !== "disabled";
}
