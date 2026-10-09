import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { indexingAllowed } from "@/lib/seo/indexing";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  if (!indexingAllowed()) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/fr/dashboard/", "/en/dashboard/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
