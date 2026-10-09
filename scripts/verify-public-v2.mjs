import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Read-only checks. This script never posts forms or calls remote services.
const base = new URL(process.env.V2_BASE_URL || "http://127.0.0.1:3000");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)) {
  throw new Error("V2_BASE_URL must refer to a local preview.");
}
const output = path.resolve("artifacts/v2/http-report.json");
const decode = value => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const plain = value => decode(value.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(match => [match[1].toLowerCase(), decode(match[2] ?? match[3])]));
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "gi"))].map(match => attrs(match[0]));
const cache = new Map();
async function get(urlPath) {
  const url = new URL(urlPath, base);
  url.hash = "";
  if (url.origin !== base.origin) throw new Error(`Remote request refused: ${url}`);
  if (cache.has(url.href)) return cache.get(url.href);
  const task = (async () => {
    try {
      const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Googlebot" }, signal: AbortSignal.timeout(45000) });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        const result = await get(new URL(location, url).href);
        return { ...result, redirect: { status: response.status, location } };
      }
      const type = response.headers.get("content-type") || "";
      const html = type.includes("text/html") ? (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "") : "";
      await response.body?.cancel().catch(() => {});
      return { status: response.status, type, html };
    } catch (error) {
      return { status: 0, html: "", error: String(error) };
    }
  })();
  cache.set(url.href, task);
  return task;
}

const staticPaths = ["", "/academie", "/vision", "/programme", "/formation-sportive", "/education", "/performance-lab", "/encadrement", "/equipes", "/partenaires", "/parrains", "/actualites", "/galerie", "/rejoindre", "/contact", "/saison", "/informations-legales", "/confidentialite", "/login"];
const newsSource = await readFile("src/lib/data/news.ts", "utf8");
const articlePaths = [...newsSource.matchAll(/slug:\s*"([^"]+)"/g)].map(match => `/actualites/${match[1]}`);
const teamPaths = ["/equipes/u14", "/equipes/u16", "/equipes/u18"];
const expectedPaths = ["fr", "en"].flatMap(locale => [...staticPaths, ...articlePaths, ...teamPaths].map(route => `/${locale}${route}`));
const report = { generatedAt: new Date().toISOString(), base: base.href, method: "Local GET only; blocking metadata user-agent; no external requests, form submissions or database writes.", pages: [], links: [], anchors: [], images: [], notFound: [], protected: [], resources: [], skippedExternalImages: [], failures: [], summary: {} };
const imagePaths = new Set();
const links = new Map();
const anchors = new Map();

for (const route of expectedPaths) {
  const response = await get(route);
  const html = response.html;
  const title = plain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => plain(match[1]));
  const lang = tags(html, "html")[0]?.lang || "";
  const canonical = tags(html, "link").find(link => link.rel === "canonical")?.href || "";
  const description = tags(html, "meta").find(meta => meta.name === "description")?.content || "";
  const robots = tags(html, "meta").filter(meta => meta.name === "robots").map(meta => meta.content);
  const page = { route, status: response.status, title, h1, lang, canonical, description, robots, error: response.error };
  report.pages.push(page);
  const issues = [];
  if (response.status !== 200) issues.push(`HTTP ${response.status}`);
  if (!title) issues.push("title missing");
  if (h1.length !== 1) issues.push(`${h1.length} H1 headings`);
  if (lang !== route.split("/")[1]) issues.push(`lang=${lang}`);
  if (!description) issues.push("description missing");
  if (!canonical || new URL(canonical, base).pathname.replace(/\/$/, "") !== route) issues.push("canonical path mismatch or missing");
  if (issues.length) report.failures.push({ route, issues });
  for (const anchor of tags(html, "a")) {
    if (!anchor.href || /^(mailto:|tel:|javascript:)/.test(anchor.href)) continue;
    const target = new URL(anchor.href, new URL(route, base));
    if (target.origin !== base.origin) continue;
    if (/^\/(fr|en)(\/|$)/.test(target.pathname)) {
      const key = target.pathname + target.search;
      if (!links.has(key)) links.set(key, route);
      if (target.hash) anchors.set(key + target.hash, route);
    }
  }
  for (const img of tags(html, "img")) {
    if (!("alt" in img)) report.failures.push({ route, issues: [`Image lacks alt attribute: ${img.src}`] });
    if (!img.src || img.src.startsWith("data:")) continue;
    const target = new URL(img.src, base);
    const original = target.pathname === "/_next/image" ? target.searchParams.get("url") : img.src;
    if (!original) continue;
    const originalUrl = new URL(original, base);
    if (originalUrl.origin === base.origin) imagePaths.add(originalUrl.pathname);
    else if (!report.skippedExternalImages.includes(originalUrl.href)) report.skippedExternalImages.push(originalUrl.href);
  }
  console.log(`${response.status} ${route}`);
}
for (const [route, from] of links) {
  const response = await get(route);
  report.links.push({ route, from, status: response.status });
  if (response.status !== 200) report.failures.push({ route, issues: [`Internal link from ${from}: HTTP ${response.status}`] });
}
for (const [route, from] of anchors) {
  const url = new URL(route, base);
  const response = await get(route);
  const id = decodeURIComponent(url.hash.slice(1));
  const ids = [...response.html.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map(match => decode(match[1]));
  const found = ids.includes(id);
  report.anchors.push({ route, from, found });
  if (!found) report.failures.push({ route, issues: [`Anchor not found (from ${from})`] });
}
for (const route of imagePaths) {
  const response = await get(route);
  report.images.push({ route, status: response.status, type: response.type });
  if (response.status !== 200 || !response.type?.startsWith("image/")) report.failures.push({ route, issues: ["Local image unavailable"] });
}
for (const locale of ["fr", "en"]) {
  for (const section of ["actualites", "equipes", "matchs", "joueurs"]) {
    const route = `/${locale}/${section}/__v2-not-published__`;
    const response = await get(route);
    report.notFound.push({ route, status: response.status });
    if (response.status !== 404) report.failures.push({ route, issues: [`Expected HTTP 404, got ${response.status}`] });
  }
}
for (const route of ["/api/admin/users", "/api/admin/recruitments"]) {
  const response = await get(route);
  report.protected.push({ route, status: response.status });
  if (![401, 403].includes(response.status)) report.failures.push({ route, issues: [`Expected unauthorized response, got ${response.status}`] });
}
for (const route of ["/robots.txt", "/sitemap.xml"]) {
  const response = await get(route);
  report.resources.push({ route, status: response.status });
  if (response.status !== 200) report.failures.push({ route, issues: [`Expected HTTP 200, got ${response.status}`] });
}
report.summary = { pages: report.pages.length, internalLinks: report.links.length, anchors: report.anchors.length, localImages: report.images.length, expected404: report.notFound.length, protectedAPIs: report.protected.length, resources: report.resources.length, skippedExternalImages: report.skippedExternalImages.length, failures: report.failures.length };
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report.summary));
if (report.failures.length) { console.error(JSON.stringify(report.failures, null, 2)); process.exitCode = 1; }
