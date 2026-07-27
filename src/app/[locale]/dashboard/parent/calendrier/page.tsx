"use client";

import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { parentData } from "@/lib/data";
import { formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function ParentCalendarPage() {
  const t = useTranslations("dashboard.parent");
  const locale = useLocale() as Locale;

  return (
    <DashboardLayout requiredRole="parent" title={t("calendar")}>
      <div className="space-y-3">
        {parentData.calendar.map((event) => (
          <div
            key={`${event.date}-${event.time}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E2D9] bg-white px-4 py-4"
          >
            <div>
              <p className="font-bold text-navy">
                {localized(event.title, locale)}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {formatDate(event.date, locale)} • {event.time}
              </p>
            </div>
            <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy">
              {t("nextSession")}
            </span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
