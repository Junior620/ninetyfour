"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { parentData } from "@/lib/data";
import { formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function ParentAttendancePage() {
  const t = useTranslations("dashboard.parent");
  const locale = useLocale() as Locale;
  const [absences, setAbsences] = useState(parentData.attendance.absences);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  function submitAbsence() {
    if (!date.trim() || !reason.trim()) return;
    setAbsences((prev) => [
      {
        date,
        reason: { fr: reason, en: reason },
      },
      ...prev,
    ]);
    setOpen(false);
    setDate("");
    setReason("");
    toast(
      locale === "fr" ? "Absence signalée" : "Absence reported"
    );
  }

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
            <p className="mt-1 text-3xl font-bold text-navy">{absences.length}</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 text-xs font-bold text-gold hover:underline"
            >
              {t("reportAbsence")}
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">{t("absencesTitle")}</h2>
          <ul className="space-y-3">
            {absences.map((a) => (
              <li
                key={`${a.date}-${localized(a.reason, locale)}`}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-navy">
              {t("reportAbsence")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-text-muted">
                {locale === "fr" ? "Date" : "Date"}
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E5E2D9] px-3"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-text-muted">
                {locale === "fr" ? "Motif" : "Reason"}
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#E5E2D9] px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={submitAbsence}
              className="h-10 w-full rounded-xl bg-gold text-sm font-bold text-navy"
            >
              {locale === "fr" ? "Envoyer" : "Submit"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
