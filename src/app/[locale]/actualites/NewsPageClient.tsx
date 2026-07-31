"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { NewsCard } from "@/components/cards/PartnerCard";
import { newsArticles } from "@/lib/data";
import { localized, formatDate } from "@/lib/utils";
import type { Locale, NewsCategory } from "@/types";
import { cn } from "@/lib/utils";

const categories: (NewsCategory | "all")[] = [
  "all",
  "academy",
  "matches",
  "training",
  "partners",
  "events",
];

export function NewsPageClient() {
  const t = useTranslations("news");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const [filter, setFilter] = useState<NewsCategory | "all">("all");

  const filtered =
    filter === "all"
      ? newsArticles
      : newsArticles.filter((a) => a.category === filter);

  return (
    <>
      <section className="section-padding bg-navy">
        <div className="container-wide text-center">
          <h1 className="page-hero-title">{t("title")}</h1>
          <p className="page-hero-subtitle">{t("subtitle")}</p>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={cn(
                  "filter-chip",
                  filter === cat
                    ? "bg-navy text-white"
                    : "bg-white text-text-muted hover:bg-navy/10"
                )}
              >
                {cat === "all" ? tCommon("all") : t(`categories.${cat}`)}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article, i) => (
              <NewsCard
                key={article.slug}
                title={localized(article.title, locale)}
                excerpt={localized(article.excerpt, locale)}
                image={article.image}
                date={formatDate(article.date, locale)}
                category={t(`categories.${article.category}`)}
                slug={article.slug}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
