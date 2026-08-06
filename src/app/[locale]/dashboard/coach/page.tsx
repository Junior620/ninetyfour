"use client";

import { Link } from "@/lib/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ClipboardList,
  FileText,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Users,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { coachData, mockPlayers, performanceChartData } from "@/lib/data";
import { downloadTextFile } from "@/lib/download";
import { formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";

export default function CoachOverviewPage() {
  const t = useTranslations("dashboard.coach");
  const locale = useLocale() as Locale;

  const techDelta =
    (performanceChartData.at(-1)?.technical ?? 0) -
    (performanceChartData[0]?.technical ?? 0);
  const physDelta =
    (performanceChartData.at(-1)?.physical ?? 0) -
    (performanceChartData[0]?.physical ?? 0);
  const avgProgress = ((techDelta + physDelta) / 2).toFixed(1);

  const kpis = [
    { value: Math.max(mockPlayers.length, 24), label: t("kpiPlayers"), icon: Users },
    { value: 18, label: t("kpiEvals"), icon: ClipboardList },
    { value: `+${avgProgress}%`, label: t("kpiProgress"), icon: TrendingUp },
    { value: coachData.attention.length, label: t("kpiAttention"), icon: AlertTriangle },
  ];

  const actions = [
    { label: t("newEval"), href: "/dashboard/coach/evaluations", icon: ClipboardList },
    { label: t("addAttendance"), href: "/dashboard/coach/joueurs", icon: CalendarDays },
    { label: t("createSession"), href: "/dashboard/coach/joueurs", icon: CalendarDays },
    { label: t("addComment"), href: "/dashboard/coach/evaluations", icon: MessageSquare },
    { label: t("contactParent"), href: "/contact", icon: UserPlus },
    { label: t("downloadReport"), href: "#download-report", icon: FileText },
  ];

  return (
    <DashboardLayout requiredRole="coach" title={t("overview")}>
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-2xl border border-[#E5E2D9] bg-white p-4 shadow-[0_8px_24px_rgba(7,20,38,0.04)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-gold">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-2xl font-bold text-navy">{kpi.value}</p>
                <p className="text-sm text-text-muted">{kpi.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5 lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
              {t("nextSession")}
            </p>
            <h2 className="mt-2 text-lg font-bold text-navy">
              {formatDate(coachData.nextSession.date, locale)} •{" "}
              {coachData.nextSession.time}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {localized(coachData.nextSession.type, locale)}
            </p>
            <p className="text-sm text-text-muted">
              {localized(coachData.nextSession.location, locale)}
            </p>
          </section>

          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5 lg:col-span-2">
            <h3 className="font-bold text-navy">{t("todoToday")}</h3>
            <ul className="mt-3 space-y-2">
              {coachData.todos.map((todo) => (
                <li
                  key={todo.id}
                  className="rounded-xl bg-[#F7F6F2] px-3 py-2 text-sm text-navy"
                >
                  {localized(todo.label, locale)}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section>
          <h3 className="mb-3 font-bold text-navy">{t("quickActions")}</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => {
              const Icon = action.icon;
              const className =
                "flex min-h-14 items-center gap-2 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:border-gold/40";
              if (action.href === "#download-report") {
                return (
                  <button
                    key={action.label}
                    type="button"
                    className={className}
                    onClick={() => {
                      const lines = [
                        "Ninety One Foot Academy — Rapport coach",
                        `Date: ${new Date().toISOString().slice(0, 10)}`,
                        "",
                        `Joueurs: ${mockPlayers.length}`,
                        `Évaluations (période): 18`,
                        `Joueurs à suivre: ${coachData.attention.length}`,
                        "",
                        ...mockPlayers.map(
                          (p) =>
                            `- ${p.firstName} ${p.lastName}: tech ${p.technicalScore}, tact ${p.tacticalScore}, phys ${p.physicalScore}`
                        ),
                      ];
                      downloadTextFile(
                        `rapport-coach-${new Date().toISOString().slice(0, 10)}.txt`,
                        lines.join("\n")
                      );
                    }}
                  >
                    <Icon className="h-4 w-4 text-gold" />
                    {action.label}
                  </button>
                );
              }
              return (
                <Link key={action.label} href={action.href} className={className}>
                  <Icon className="h-4 w-4 text-gold" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-navy">{t("attentionPlayers")}</h3>
              <Link
                href="/dashboard/coach/joueurs"
                className="text-xs font-semibold text-gold hover:underline"
              >
                {t("seeAll")}
              </Link>
            </div>
            <ul className="space-y-2">
              {coachData.attention.map((item) => {
                const player = mockPlayers.find((p) => p.id === item.id);
                if (!player) return null;
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3"
                  >
                    <p className="font-semibold text-navy">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-xs text-amber-900">
                      {localized(item.reason, locale)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-navy">{t("recentEvals")}</h3>
              <Link
                href="/dashboard/coach/evaluations"
                className="text-xs font-semibold text-gold hover:underline"
              >
                {t("seeAll")}
              </Link>
            </div>
            <ul className="space-y-2">
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
        </div>
      </div>
    </DashboardLayout>
  );
}
