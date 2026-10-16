import { z } from "zod";
import { revalidatePath } from "next/cache";
import { articleSchema } from "@/lib/matchlab/articles";
import { newsArticles } from "@/lib/data/news";
import {
  requireLab,
  body,
  checkOrigin,
  dbError,
  rateLimit,
  json,
  failure,
  LabError,
} from "@/lib/matchlab/server";
export async function GET(request: Request) {
  try {
    const { db, member } = await requireLab();
    if (
      !member.permissions.some(
        (p) => p === "site_editor" || p === "site_publisher",
      )
    )
      throw new LabError("FORBIDDEN", 403);
    const result = await db
      .from("ml_articles")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    dbError(result.error);
    const id = new URL(request.url).searchParams.get("id");
    const revisions = id
      ? await db
          .from("ml_article_revisions")
          .select("*")
          .eq("article_id", z.uuid().parse(id))
          .order("version", { ascending: false })
          .limit(100)
      : null;
    if (revisions) dbError(revisions.error);
    return json({ articles: result.data, revisions: revisions?.data || [] });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db, user, member } = await requireLab();
    await rateLimit(request, "articles", user.id);
    const input = z
      .object({
        action: z.enum(["draft", "publish", "unpublish", "restore", "seed"]),
        id: z.uuid().optional(),
        version: z.number().int().min(0).default(0),
        payload: z.unknown().optional(),
      })
      .parse(await body(request));
    if (input.action === "seed") {
      if (
        !member.permissions.includes("site_editor") ||
        !member.permissions.includes("site_publisher")
      )
        throw new LabError("FORBIDDEN", 403);
      const existing = await db.from("ml_articles").select("slug");
      dbError(existing.error);
      let imported = 0;
      for (const article of newsArticles) {
        if (existing.data?.some((a) => a.slug === article.slug)) continue;
        const draft = await db.rpc("ml_article_save", {
          action: "draft",
          article: crypto.randomUUID(),
          payload: articleSchema.parse(article),
          expected: 0,
        });
        dbError(draft.error);
        const published = await db.rpc("ml_article_save", {
          action: "publish",
          article: draft.data.id,
          payload: {},
          expected: draft.data.version,
        });
        dbError(published.error);
        imported++;
      }
      for (const locale of ["fr", "en"]) revalidatePath(`/${locale}`, "layout");
      revalidatePath("/sitemap.xml");
      return json({ imported });
    }
    const payload =
      input.action === "draft"
        ? articleSchema.parse(input.payload)
        : input.action === "restore"
          ? z
              .object({ revision: z.number().int().positive() })
              .parse(input.payload)
          : {};
    const result = await db.rpc("ml_article_save", {
      action: input.action,
      article: input.id || crypto.randomUUID(),
      payload,
      expected: input.version,
    });
    dbError(result.error);
    if (["publish", "unpublish"].includes(input.action)) {
      for (const locale of ["fr", "en"]) revalidatePath(`/${locale}`, "layout");
      revalidatePath("/sitemap.xml");
    }
    return json(result.data);
  } catch (e) {
    return failure(e);
  }
}
