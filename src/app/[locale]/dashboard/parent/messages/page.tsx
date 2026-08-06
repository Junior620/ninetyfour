"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parentData } from "@/lib/data";
import { formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";

type Msg = (typeof parentData.messages)[number];

export default function ParentMessagesPage() {
  const t = useTranslations("dashboard.parent");
  const locale = useLocale() as Locale;
  const [messages, setMessages] = useState(parentData.messages);
  const [selected, setSelected] = useState<Msg | null>(null);
  const sorted = [...messages].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  function openMessage(msg: Msg) {
    setSelected(msg);
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, unread: false } : m))
    );
  }

  return (
    <DashboardLayout requiredRole="parent" title={t("messagesNav")}>
      <div className="space-y-3">
        {sorted.map((msg) => (
          <button
            key={msg.id}
            type="button"
            onClick={() => openMessage(msg)}
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

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-bold text-navy">
                  {localized(selected.title, locale)}
                </DialogTitle>
                <DialogDescription>
                  {t("from")} {localized(selected.sender, locale)} •{" "}
                  {formatDate(selected.date, locale)}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-navy">
                {localized(selected.preview, locale)}
              </p>
              {selected.needsReply ? (
              <Link
                href="/contact"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-gold px-4 text-sm font-bold text-navy"
              >
                {t("needsReply")}
              </Link>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
