import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { routing } from "@/lib/i18n/routing";
import { indexingAllowed } from "./indexing";

const SITE_NAME = "Ninety One Foot Academy";

export type BuildPageMetadataInput = {
  locale: string;
  /** Path without locale, e.g. "" | "/academie" | "/actualites/slug" */
  path: string;
  title: string;
  description: string;
  /** Use absolute title (no "| SiteName" template) — for home */
  absoluteTitle?: boolean;
  robots?: Metadata["robots"];
  ogImage?: string;
  ogType?: "website" | "article";
  publishedTime?: string;
};

function normalizePath(path: string): string {
  if (!path || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function localizedUrl(locale: string, path: string = ""): string {
  const base = getSiteUrl();
  const normalized = normalizePath(path);
  return `${base}/${locale}${normalized}`;
}

export function buildLanguageAlternates(path: string = "") {
  const normalized = normalizePath(path);
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = localizedUrl(locale, normalized);
  }
  languages["x-default"] = localizedUrl(routing.defaultLocale, normalized);
  return languages;
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
  robots,
  ogImage = "/og-image.png",
  ogType = "website",
  publishedTime,
}: BuildPageMetadataInput): Metadata {
  const canonical = localizedUrl(locale, path);
  const ogLocale = locale === "en" ? "en_US" : "fr_FR";
  const displayTitle = absoluteTitle ? title : title;

  return {
    title: absoluteTitle
      ? { absolute: displayTitle }
      : displayTitle,
    description,
    robots: indexingAllowed() ? robots : { index: false, follow: false },
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      type: ogType,
      locale: ogLocale,
      alternateLocale: locale === "en" ? ["fr_FR"] : ["en_US"],
      url: canonical,
      siteName: SITE_NAME,
      title: absoluteTitle ? displayTitle : `${displayTitle} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: displayTitle,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: absoluteTitle ? displayTitle : `${displayTitle} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export { SITE_NAME };
