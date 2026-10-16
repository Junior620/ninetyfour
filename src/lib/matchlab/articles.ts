import { z } from "zod";
const localized = z
  .object({ fr: z.string().max(100000), en: z.string().max(100000) })
  .strict();
export const articleSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      .max(160),
    title: localized,
    excerpt: localized,
    content: localized,
    category: z.enum(["academy", "matches", "training", "partners", "events"]),
    date: z.iso.date(),
    image: z
      .string()
      .regex(
        /^(\/[a-zA-Z0-9_-]+\.(jpeg|jpg|png|webp)|https:\/\/images\.unsplash\.com\/[^\s]+)$/,
      ),
  })
  .strict();
export type ArticleDocument = z.infer<typeof articleSchema>;
export type ArticleRecord = {
  id: string;
  slug: string;
  draft: Omit<ArticleDocument, "slug">;
  published: Omit<ArticleDocument, "slug"> | null;
  version: number;
  updated_at: string;
};
