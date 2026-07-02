"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SectionTitle } from "@/components/sections/SectionTitle";
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

export default function NewsPage() {
  const t = useTranslations("news");
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
          <h1 className="text-3xl font-bold uppercase tracking-wide text-white md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-white/70">{t("subtitle")}</p>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  filter === cat
                    ? "bg-navy text-white"
                    : "bg-white text-text-muted hover:bg-navy/10"
                )}
              >
                {cat === "all" ? "Tous" : t(`categories.${cat}`)}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <NewsCard
                key={article.slug}
                title={localized(article.title, locale)}
                excerpt={localized(article.excerpt, locale)}
                image={article.image}
                date={formatDate(article.date, locale)}
                category={t(`categories.${article.category}`)}
                slug={article.slug}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
