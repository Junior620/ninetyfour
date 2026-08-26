import type { MetadataRoute } from "next";
import { routing } from "@/lib/i18n/routing";
import { newsArticles } from "@/lib/data";
import { buildLanguageAlternates, localizedUrl } from "@/lib/seo/metadata";

/** Public indexable paths only (no login, dashboards, API). */
const staticPaths = [
  "",
  "/academie",
  "/vision",
  "/programme",
  "/formation-sportive",
  "/education",
  "/performance-lab",
  "/encadrement",
  "/equipes",
  "/partenaires",
  "/parrains",
  "/actualites",
  "/galerie",
  "/rejoindre",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = routing.locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: localizedUrl(locale, path),
      lastModified: undefined,
      changeFrequency: (path === "" ? "weekly" : "monthly") as
        | "weekly"
        | "monthly",
      priority: path === "" ? 1 : 0.8,
      alternates: {
        languages: buildLanguageAlternates(path),
      },
    }))
  );

  const articleEntries = routing.locales.flatMap((locale) =>
    newsArticles.map((article) => {
      const path = `/actualites/${article.slug}`;
      return {
        url: localizedUrl(locale, path),
        lastModified: new Date(article.date),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: {
          languages: buildLanguageAlternates(path),
        },
      };
    })
  );

  return [...staticEntries, ...articleEntries];
}
