"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { imageItems, videoItems } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale, GalleryCategory } from "@/types";
import { cn } from "@/lib/utils";

const categories: (GalleryCategory | "all")[] = [
  "all",
  "training",
  "matches",
  "academy-life",
  "partners",
  "education",
];

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const locale = useLocale() as Locale;
  const [filter, setFilter] = useState<GalleryCategory | "all">("all");

  const categoryLabels = Object.fromEntries(
    categories
      .filter((c) => c !== "all")
      .map((c) => [c, t(`categories.${c}`)])
  );

  const filtered =
    filter === "all"
      ? imageItems
      : imageItems.filter((item) => item.category === filter);

  const galleryData = filtered.map((item) => ({
    id: item.id,
    title: localized(item.title, locale),
    image: item.image,
    category: item.category,
    type: item.type,
    videoUrl: item.videoUrl,
  }));

  const videoData = videoItems.map((item) => ({
    id: item.id,
    title: localized(item.title, locale),
    image: item.image,
    category: item.category,
    type: item.type as "video",
    videoUrl: item.videoUrl,
  }));

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

          <GalleryGrid items={galleryData} categoryLabels={categoryLabels} />
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <h2 className="mb-8 text-2xl font-bold uppercase tracking-wide text-black-premium">
            {t("videosTitle")}
          </h2>
          <GalleryGrid items={videoData} categoryLabels={categoryLabels} />
        </div>
      </section>
    </>
  );
}
