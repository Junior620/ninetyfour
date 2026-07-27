"use client";

import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "@/components/ui/toast";
import { parentData } from "@/lib/data";
import { formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function ParentMessagesPage() {
  const t = useTranslations("dashboard.parent");
  const locale = useLocale() as Locale;
  const sorted = [...parentData.messages].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <DashboardLayout requiredRole="parent" title={t("messagesNav")}>
      <div className="space-y-3">
        {sorted.map((msg) => (
          <button
            key={msg.id}
            type="button"
            onClick={() => toast(t("actionToast"))}
            className="w-full rounded-2xl border border-[#E5E2D9] bg-white p-4 text-left transition hover:border-gold/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-navy">
                {localized(msg.title, locale)}
              </h2>
              {msg.unread ? (
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-navy">
                  {t("unread")}
                </span>
              ) : null}
              {msg.needsReply ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  {t("needsReply")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {t("from")} {localized(msg.sender, locale)} •{" "}
              {formatDate(msg.date, locale)}
            </p>
            <p className="mt-2 text-sm text-text-muted">
              {localized(msg.preview, locale)}
            </p>
          </button>
        ))}
      </div>
    </DashboardLayout>
  );
}
