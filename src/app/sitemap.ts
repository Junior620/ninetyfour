import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { routing } from "@/lib/i18n/routing";
import { newsArticles } from "@/lib/data";

const staticPaths = [
  "",
  "/academie",
  "/vision",
  "/programme",
  "/formation-sportive",
  "/education",
  "/performance-lab",
  "/partenaires",
  "/actualites",
  "/galerie",
  "/rejoindre",
  "/contact",
  "/login",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticEntries = routing.locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : 0.8,
    }))
  ) as MetadataRoute.Sitemap;

  const articleEntries = routing.locales.flatMap((locale) =>
    newsArticles.map((article) => ({
      url: `${baseUrl}/${locale}/actualites/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  return [...staticEntries, ...articleEntries];
}
