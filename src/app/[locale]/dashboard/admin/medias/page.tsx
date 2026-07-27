"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "@/components/ui/toast";
import { galleryItems } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function AdminMediaPage() {
  const t = useTranslations("dashboard.admin");
  const locale = useLocale() as Locale;
  const [q, setQ] = useState("");
  const [items, setItems] = useState(
    galleryItems.map((item, i) => ({
      ...item,
      size: `${1.2 + (i % 5) * 0.4} MB`,
      addedOn: `2026-0${(i % 6) + 1}-12`,
      usage: i % 3 === 0 ? "Hero" : i % 3 === 1 ? "News" : "Gallery",
    }))
  );

  const filtered = useMemo(() => {
    return items.filter((m) =>
      localized(m.title, locale).toLowerCase().includes(q.toLowerCase())
    );
  }, [items, q, locale]);

  return (
    <DashboardLayout requiredRole="admin" title={t("media")}>
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
            {t("importMedia")}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((media) => (
            <div
              key={media.id}
              className="overflow-hidden rounded-2xl border border-[#E5E2D9] bg-white transition hover:-translate-y-0.5"
            >
              <div className="relative aspect-square bg-[#F7F6F2]">
                <Image
                  src={media.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 50vw, 25vw"
                />
                <span className="absolute top-2 left-2 rounded-md bg-navy/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  {media.type}
                </span>
              </div>
              <div className="space-y-2 p-3">
                <p className="line-clamp-1 text-sm font-semibold text-navy">
                  {localized(media.title, locale)}
                </p>
                <p className="text-xs text-text-muted">
                  {t("fileSize")}: {media.size} · {t("addedOn")} {media.addedOn}
                </p>
                <p className="text-xs text-text-muted">
                  {t("usage")}: {media.usage}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(media.image);
                        toast(t("toastCopied"));
                      } catch {
                        toast(t("toastMock"));
                      }
                    }}
                    className="rounded-lg border border-[#E5E2D9] px-2 py-1 text-[11px] font-semibold"
                  >
                    {t("copyLink")}
                  </button>
                  <button
                    type="button"
                    onClick={() => toast(t("toastMock"))}
                    className="rounded-lg border border-[#E5E2D9] px-2 py-1 text-[11px] font-semibold"
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(t("confirmDelete"))) return;
                      setItems((prev) => prev.filter((x) => x.id !== media.id));
                      toast(t("toastDeleted"));
                    }}
                    className="rounded-lg border border-[#E5E2D9] px-2 py-1 text-[11px] font-semibold text-red-700"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
