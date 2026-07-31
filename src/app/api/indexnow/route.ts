import { NextResponse } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { newsArticles } from "@/lib/data";
import { localizedUrl } from "@/lib/seo/metadata";

const staticPaths = [
  "",
  "/academie",
  "/vision",
  "/programme",
  "/formation-sportive",
  "/education",
  "/performance-lab",
  "/partenaires",
  "/parrains",
  "/actualites",
  "/galerie",
  "/rejoindre",
  "/contact",
];

function publicUrls(): string[] {
  const urls = routing.locales.flatMap((locale) =>
    staticPaths.map((path) => localizedUrl(locale, path))
  );
  const articles = routing.locales.flatMap((locale) =>
    newsArticles.map((article) =>
      localizedUrl(locale, `/actualites/${article.slug}`)
    )
  );
  return [...urls, ...articles];
}

/**
 * POST /api/indexnow — submit public URLs to IndexNow.
 * Requires INDEXNOW_KEY. Never submits login/dashboard/API.
 */
export async function POST(request: Request) {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "indexnow_not_configured" },
      { status: 503 }
    );
  }

  let bodyUrls: string[] | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body?.urlList)) {
      bodyUrls = body.urlList.filter((u: unknown) => typeof u === "string");
    }
  } catch {
    bodyUrls = undefined;
  }

  const allowed = new Set(publicUrls());
  const urlList = (bodyUrls?.length ? bodyUrls : [...allowed]).filter((u) =>
    allowed.has(u)
  );

  if (urlList.length === 0) {
    return NextResponse.json(
      { success: false, error: "no_valid_urls" },
      { status: 400 }
    );
  }

  const host = new URL(localizedUrl("fr", "")).host;
  const payload = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const text = await res.text().catch(() => "");
    console.info("[indexnow]", res.status, urlList.length, text.slice(0, 200));

    return NextResponse.json({
      success: res.ok || res.status === 202,
      status: res.status,
      submitted: urlList.length,
      response: text || null,
    });
  } catch (error) {
    console.error("[indexnow]", error);
    return NextResponse.json(
      { success: false, error: "request_failed" },
      { status: 500 }
    );
  }
}
