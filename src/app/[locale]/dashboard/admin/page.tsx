"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPositionLabel, normalizeAppStatus } from "@/lib/admin/labels";
import { mockPlayers, newsArticles, galleryItems } from "@/lib/data";

type AppItem = {
  id: string;
  firstNames?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  primaryPosition?: string;
  status?: string;
  createdAt?: string | null;
};

export default function AdminOverviewPage() {
  const t = useTranslations("dashboard.admin");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const [applications, setApplications] = useState<AppItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/recruitments");
        const json = await res.json();
        if (mounted) setApplications(Array.isArray(json?.items) ? json.items : []);
      } catch {
        if (mounted) setApplications([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const pendingCount = applications.filter(
    (a) => normalizeAppStatus(a.status) === "pending"
  ).length;

  const kpis = [
    {
      icon: Users,
      value: Math.max(mockPlayers.length, 24),
      label: t("kpi.players"),
      delta: t("kpi.playersDelta"),
      href: "/dashboard/admin/joueurs",
    },
    {
      icon: ClipboardList,
      value: pendingCount || 7,
      label: t("kpi.applications"),
      delta: t("kpi.applicationsDelta"),
      href: "/dashboard/admin/candidatures",
      cta: t("examine"),
    },
    {
      icon: FileText,
      value: Math.max(newsArticles.length, 18),
      label: t("kpi.articles"),
      delta: t("kpi.articlesDelta"),
      href: "/dashboard/admin/articles",
    },
    {
      icon: ImageIcon,
      value: Math.max(galleryItems.length, 12),
      label: t("kpi.media"),
      delta: t("kpi.mediaDelta"),
      href: "/dashboard/admin/medias",
    },
  ];

  const recent = applications.slice(0, 5);
  const activities = [
    { id: "a1", label: t("activity.a1"), time: "10:24" },
    { id: "a2", label: t("activity.a2"), time: "09:12" },
    { id: "a3", label: t("activity.a3"), time: "Hier" },
    { id: "a4", label: t("activity.a4"), time: "Hier" },
  ];

  return (
    <DashboardLayout requiredRole="admin" title={t("overview")}>
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.href}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.25 }}
                className="rounded-2xl border border-[#E5E2D9] bg-white p-5 shadow-[0_8px_24px_rgba(7,20,38,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Link
                    href={kpi.href}
                    className="text-xs font-semibold text-navy/60 hover:text-gold"
                  >
                    {t("seeAll")}
                  </Link>
                </div>
                <p className="mt-4 text-3xl font-bold text-navy">{kpi.value}</p>
                <p className="mt-1 text-sm text-text-muted">{kpi.label}</p>
                <p className="mt-2 text-xs font-medium text-gold">{kpi.delta}</p>
                {kpi.cta ? (
                  <Link
                    href={kpi.href}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:text-gold"
                  >
                    {kpi.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">{t("recentApplications")}</h2>
              <Link
                href="/dashboard/admin/candidatures"
                className="text-sm font-semibold text-gold hover:underline"
              >
                {t("seeAll")}
              </Link>
            </div>
            <div className="space-y-3">
              {recent.length === 0 ? (
                <p className="text-sm text-text-muted">{t("noResults")}</p>
              ) : (
                recent.map((app) => {
                  const status = normalizeAppStatus(app.status);
                  const name = `${app.firstNames ?? app.firstName ?? ""} ${app.lastName ?? ""}`.trim();
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E2D9] px-3 py-3 transition hover:bg-[#F7F6F2]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{name || "—"}</p>
                        <p className="truncate text-xs text-text-muted">
                          {formatPositionLabel(app.primaryPosition, locale)}
                          {app.city ? ` · ${app.city}` : ""}
                        </p>
                      </div>
                      <StatusBadge
                        status={status}
                        label={t(`statusLabels.${status}`)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5 lg:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-navy">{t("recentActivity")}</h2>
            <ul className="space-y-4">
              {activities.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">{item.label}</p>
                    <p className="text-xs text-text-muted">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
