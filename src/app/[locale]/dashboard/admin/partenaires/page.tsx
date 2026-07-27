"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "@/components/ui/toast";
import { partners } from "@/lib/data";
import { localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function AdminPartnersPage() {
  const t = useTranslations("dashboard.admin");
  const locale = useLocale() as Locale;
  const [q, setQ] = useState("");
  const [items, setItems] = useState(
    partners.map((p, i) => ({
      ...p,
      active: i !== partners.length - 1,
      startDate: `2025-0${(i % 8) + 1}-01`,
    }))
  );

  const filtered = useMemo(() => {
    return items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  }, [items, q]);

  return (
    <DashboardLayout requiredRole="admin" title={t("partners")}>
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
            + {t("partners")}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((partner) => (
            <div
              key={partner.id}
              className="rounded-2xl border border-[#E5E2D9] bg-white p-5 shadow-[0_8px_24px_rgba(7,20,38,0.04)]"
            >
              <div className="flex items-start gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E2D9] bg-[#F7F6F2]">
                  {partner.logo ? (
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-contain p-1"
                    />
                  ) : (
                    <span className="text-sm font-bold text-navy">
                      {partner.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-navy">{partner.name}</h3>
                    <span
                      className={
                        partner.active
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                      }
                    >
                      {partner.active ? t("active") : t("inactive")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {t("partnershipType")}: {localized(partner.role, locale)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {t("startDate")}: {partner.startDate}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-text-muted">
                {localized(partner.description, locale)}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => toast(t("toastMock"))}
                  className="h-9 flex-1 rounded-lg bg-gold text-xs font-bold text-navy"
                >
                  {t("edit")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItems((prev) =>
                      prev.map((x) =>
                        x.id === partner.id ? { ...x, active: !x.active } : x
                      )
                    );
                    toast(t("toastSaved"));
                  }}
                  className="h-9 flex-1 rounded-lg border border-[#E5E2D9] text-xs font-semibold text-navy"
                >
                  {t("deactivate")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
