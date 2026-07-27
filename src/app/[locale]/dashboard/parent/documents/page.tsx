"use client";

import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "@/components/ui/toast";
import { parentData } from "@/lib/data";
import { formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function ParentDocumentsPage() {
  const t = useTranslations("dashboard.parent");
  const locale = useLocale() as Locale;

  return (
    <DashboardLayout requiredRole="parent" title={t("documents")}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parentData.documents.map((doc) => (
          <div
            key={doc.id}
            className="rounded-2xl border border-[#E5E2D9] bg-white p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-xs font-bold text-gold">
                PDF
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-navy">
                  {localized(doc.name, locale)}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {t("updatedOn", { date: formatDate(doc.updatedAt, locale) })} •{" "}
                  {doc.size}
                </p>
                {doc.toSign ? (
                  <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {t("toSign")}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast(t("actionToast"))}
              className="mt-4 h-10 w-full rounded-xl bg-gold text-sm font-bold text-navy"
            >
              {t("download")}
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
