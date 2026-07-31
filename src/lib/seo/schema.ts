import { getSiteUrl } from "@/lib/site-url";
import { contactInfo } from "@/lib/data/academy";

const SITE_NAME = "Ninety One Foot Academy";

export function organizationJsonLd(locale: "fr" | "en") {
  const base = getSiteUrl();
  const description =
    locale === "en"
      ? "Football academy in Douala dedicated to the sporting, academic and human development of young African talents."
      : "Académie de football à Douala dédiée au développement sportif, académique et humain des jeunes talents africains.";

  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "@id": `${base}/#organization`,
    name: SITE_NAME,
    url: base,
    logo: {
      "@type": "ImageObject",
      url: `${base}/logo-crest.png`,
      width: 512,
      height: 512,
    },
    image: `${base}/og-image.png`,
    description,
    email: contactInfo.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Douala",
      addressCountry: "CM",
    },
    areaServed: {
      "@type": "City",
      name: "Douala",
    },
    sport: "Football",
  };
}

export function websiteJsonLd(locale: "fr" | "en") {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: SITE_NAME,
    url: `${base}/${locale}`,
    inLanguage: locale === "en" ? "en" : "fr",
    publisher: { "@id": `${base}/#organization` },
  };
}

export function breadcrumbJsonLd(
  locale: string,
  items: Array<{ name: string; path: string }>
) {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}/${locale}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function articleJsonLd({
  locale,
  title,
  description,
  slug,
  datePublished,
  image,
}: {
  locale: string;
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  image?: string;
}) {
  const base = getSiteUrl();
  const url = `${base}/${locale}/actualites/${slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished,
    inLanguage: locale === "en" ? "en" : "fr",
    mainEntityOfPage: url,
    url,
    image: image ? [image.startsWith("http") ? image : `${base}${image}`] : undefined,
    author: {
      "@type": "SportsOrganization",
      name: SITE_NAME,
      url: base,
    },
    publisher: {
      "@type": "SportsOrganization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${base}/logo-crest.png`,
      },
    },
  };
}
