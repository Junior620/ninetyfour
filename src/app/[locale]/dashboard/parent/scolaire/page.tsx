"use client";

import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "@/components/ui/toast";
import { parentData } from "@/lib/data";
import { cn, formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function ParentAcademicPage() {
  const t = useTranslations("dashboard.parent");
  const locale = useLocale() as Locale;

  return (
    <DashboardLayout requiredRole="parent" title={t("academic")}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
          <p className="text-sm text-text-muted">{t("average")}</p>
          <p className="mt-1 text-4xl font-bold text-navy">
            {parentData.academic.average}
          </p>
          <p className="mt-2 text-sm font-medium text-gold">
            +{parentData.academic.delta}{" "}
            {locale === "fr" ? "point depuis le trimestre précédent" : "pts vs previous term"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {t("academicFocus", {
              subject: localized(parentData.academic.focus, locale),
            })}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            {t("updatedOn", {
              date: formatDate(parentData.academic.updatedAt, locale),
            })}
          </p>
          <button
            type="button"
            onClick={() => toast(t("actionToast"))}
            className="mt-4 h-10 rounded-xl bg-gold px-4 text-sm font-bold text-navy"
          >
            {t("downloadReport")}
          </button>
        </section>

        <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
          <div className="space-y-4">
            {parentData.academic.subjects.map((subject) => (
              <div key={subject.name.fr}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-navy">
                    {localized(subject.name, locale)}
                  </span>
                  <span className="font-bold text-royal">{subject.grade}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#F7F6F2]">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      subject.value >= 15
                        ? "bg-emerald-500"
                        : subject.value >= 14
                          ? "bg-royal"
                          : "bg-amber-500"
                    )}
                    style={{ width: `${(subject.value / 20) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
