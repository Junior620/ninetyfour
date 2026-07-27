"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EvaluationForm } from "@/components/forms/EvaluationForm";
import { coachData } from "@/lib/data";
import { formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function CoachEvaluationsPage() {
  const t = useTranslations("dashboard.coach");
  const locale = useLocale() as Locale;

  return (
    <DashboardLayout requiredRole="coach" title={t("evaluations")}>
      <div className="space-y-6">
        <EvaluationForm />

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
            <h2 className="font-bold text-navy">{t("history")}</h2>
            <ul className="mt-3 space-y-2">
              {coachData.recentEvals.map((ev) => (
                <li
                  key={`${ev.player}-${ev.date}`}
                  className="flex items-center justify-between rounded-xl border border-[#E5E2D9] px-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-navy">{ev.player}</p>
                    <p className="text-xs text-text-muted">
                      {localized(ev.type, locale)}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted">
                    {formatDate(ev.date, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
            <h2 className="font-bold text-navy">{t("drafts")}</h2>
            <p className="mt-3 text-sm text-text-muted">{t("noDrafts")}</p>
            <Link
              href="/dashboard/coach/joueurs"
              className="mt-4 inline-flex text-sm font-semibold text-gold hover:underline"
            >
              {t("players")} →
            </Link>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
