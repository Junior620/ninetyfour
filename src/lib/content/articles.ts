import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { newsArticles } from "@/lib/data/news";
import type { NewsArticle } from "@/types";
/** One public read adapter. Never falls back to old content after CMS activation. */
export const getPublicArticles = cache(async (): Promise<NewsArticle[]> => {
  if (process.env.MATCHLAB_CMS_ENABLED !== "true")
    return [...newsArticles].sort((a, b) => b.date.localeCompare(a.date));
  // Stop prerendering before Supabase wraps fetch's dynamic-render signal.
  // Published CMS content must be read at request time, never frozen in a build.
  await connection();
  const url = process.env.MATCHLAB_SUPABASE_URL;
  const key = process.env.MATCHLAB_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error("Public article repository is not configured");
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
    },
  });
  const result = await db.rpc("ml_published_articles");
  if (result.error) throw new Error("Public article repository unavailable");
  return (result.data ?? []).map(
    (row: { slug: string; document: Omit<NewsArticle, "slug"> }) => ({
      ...row.document,
      slug: row.slug,
    }),
  );
});
export async function getPublicArticle(slug: string) {
  return (await getPublicArticles()).find((a) => a.slug === slug);
}
