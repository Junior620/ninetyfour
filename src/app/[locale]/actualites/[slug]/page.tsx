import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { getArticleBySlug } from "@/lib/data";
import { localized, formatDate, cn } from "@/lib/utils";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Not found" };
  return {
    title: localized(article.title, locale as Locale),
    description: localized(article.excerpt, locale as Locale),
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  const t = await getTranslations({ locale, namespace: "news" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const paragraphs = localized(article.content, loc).split("\n\n");

  return (
    <article>
      <div className="relative h-[40vh] min-h-[300px] bg-navy">
        <Image
          src={article.image}
          alt={localized(article.title, loc)}
          fill
          className="object-cover opacity-60"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container-narrow">
            <Badge className="mb-4 bg-gold text-navy">
              {t(`categories.${article.category}`)}
            </Badge>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {localized(article.title, loc)}
            </h1>
            <time className="mt-2 block text-sm text-white/60">
              {formatDate(article.date, loc)}
            </time>
          </div>
        </div>
      </div>

      <div className="section-padding bg-cream">
        <div className="container-narrow">
          <Link
            href="/actualites"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "mb-8 -ml-4 inline-flex"
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon("back")}
          </Link>

          <div className="prose prose-lg max-w-none">
            {paragraphs.map((p, i) => (
              <p key={i} className="mb-4 leading-relaxed text-text-muted">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
