"use client";

import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "@/components/ui/toast";
import { parentData } from "@/lib/data";
import { formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function ParentAttendancePage() {
  const t = useTranslations("dashboard.parent");
  const locale = useLocale() as Locale;

  return (
    <DashboardLayout requiredRole="parent" title={t("attendance")}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
            <p className="text-sm text-text-muted">{t("presentLabel")}</p>
            <p className="mt-1 text-3xl font-bold text-navy">
              {parentData.attendance.present}/{parentData.attendance.total}
            </p>
            <p className="mt-1 text-xs text-text-muted">{t("sessionsLabel")}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
            <p className="text-sm text-text-muted">{t("attendance")}</p>
            <p className="mt-1 text-3xl font-bold text-navy">
              {parentData.attendance.percentage}%
            </p>
          </div>
          <div className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
            <p className="text-sm text-text-muted">{t("absencesTitle")}</p>
            <p className="mt-1 text-3xl font-bold text-navy">
              {parentData.attendance.absences.length}
            </p>
            <button
              type="button"
              onClick={() => toast(t("actionToast"))}
              className="mt-3 text-xs font-bold text-gold hover:underline"
            >
              {t("reportAbsence")}
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">{t("absencesTitle")}</h2>
          <ul className="space-y-3">
            {parentData.attendance.absences.map((a) => (
              <li
                key={a.date}
                className="flex items-center justify-between rounded-xl border border-[#E5E2D9] px-4 py-3"
              >
                <span className="font-medium text-navy">
                  {formatDate(a.date, locale)}
                </span>
                <span className="text-sm text-text-muted">
                  {localized(a.reason, locale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DashboardLayout>
  );
}
