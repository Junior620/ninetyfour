"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "@/components/ui/toast";
import { newsArticles } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function AdminArticlesPage() {
  const t = useTranslations("dashboard.admin");
  const locale = useLocale() as Locale;
  const [q, setQ] = useState("");
  const [items, setItems] = useState(
    newsArticles.map((a, i) => ({
      ...a,
      status: i % 4 === 0 ? "draft" : "published",
      views: 120 + i * 37,
      author: "Admin NOFA",
    }))
  );

  const filtered = useMemo(() => {
    return items.filter((a) =>
      localized(a.title, locale).toLowerCase().includes(q.toLowerCase())
    );
  }, [items, q, locale]);

  return (
    <DashboardLayout requiredRole="admin" title={t("articles")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="h-10 min-w-[200px] flex-1 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm outline-none focus:border-gold/50"
          />
          <button
            type="button"
            onClick={() => toast(t("toastMock"))}
            className="h-10 rounded-xl bg-gold px-4 text-sm font-bold text-navy transition hover:translate-y-[-1px]"
          >
            + {t("newArticle")}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article) => (
            <article
              key={article.slug}
              className="overflow-hidden rounded-2xl border border-[#E5E2D9] bg-white shadow-[0_8px_24px_rgba(7,20,38,0.04)] transition hover:-translate-y-0.5"
            >
              <div className="relative aspect-[16/10] bg-[#F7F6F2]">
                <Image
                  src={article.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {article.category}
                  </span>
                  <span
                    className={
                      article.status === "published"
                        ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800"
                        : "rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900"
                    }
                  >
                    {article.status === "published" ? t("published") : t("draft")}
                  </span>
                </div>
                <h3 className="line-clamp-2 text-sm font-bold text-navy">
                  {localized(article.title, locale)}
                </h3>
                <p className="text-xs text-text-muted">
                  {article.date} · {article.author} · {article.views} {t("views")}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toast(t("toastMock"))}
                    className="h-9 flex-1 rounded-lg bg-gold text-xs font-bold text-navy"
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => toast(t("toastMock"))}
                    className="h-9 flex-1 rounded-lg border border-[#E5E2D9] text-xs font-semibold text-navy"
                  >
                    {t("preview")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(t("confirmDelete"))) return;
                      setItems((prev) => prev.filter((x) => x.slug !== article.slug));
                      toast(t("toastDeleted"));
                    }}
                    className="h-9 rounded-lg border border-[#E5E2D9] px-3 text-xs font-semibold text-red-700"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
