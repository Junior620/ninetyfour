"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { mockPlayers, performanceChartData } from "@/lib/data";

export default function CoachStatsPage() {
  const t = useTranslations("dashboard.coach");
  const first = performanceChartData[0];
  const last = performanceChartData[performanceChartData.length - 1];
  const techDelta = (last?.technical ?? 0) - (first?.technical ?? 0);
  const physDelta = (last?.physical ?? 0) - (first?.physical ?? 0);

  const avgTech =
    mockPlayers.reduce((s, p) => s + p.technicalScore, 0) / mockPlayers.length;
  const avgTact =
    mockPlayers.reduce((s, p) => s + p.tacticalScore, 0) / mockPlayers.length;
  const avgPhys =
    mockPlayers.reduce((s, p) => s + p.physicalScore, 0) / mockPlayers.length;
  const avgMent =
    mockPlayers.reduce((s, p) => s + p.mentalScore, 0) / mockPlayers.length;

  const strongest =
    [
      { k: t("technical"), v: avgTech },
      { k: t("tactical"), v: avgTact },
      { k: t("physical"), v: avgPhys },
      { k: t("mental"), v: avgMent },
    ].sort((a, b) => b.v - a.v)[0];

  const weakest =
    [
      { k: t("technical"), v: avgTech },
      { k: t("tactical"), v: avgTact },
      { k: t("physical"), v: avgPhys },
      { k: t("mental"), v: avgMent },
    ].sort((a, b) => a.v - b.v)[0];

  return (
    <DashboardLayout requiredRole="coach" title={t("statistics")}>
      <div className="space-y-6">
        <PerformanceChart
          data={performanceChartData}
          title={t("chartTitle")}
          summary={t("chartSummary", { tech: techDelta, phys: physDelta })}
          showSeriesToggles
          insights={[
            { label: t("bestProgress"), value: `${t("technical")} +${techDelta}` },
            { label: t("strongestSkill"), value: strongest.k },
            { label: t("prioritySkill"), value: weakest.k },
            {
              label: t("distanceToGoal"),
              value: `${Math.max(0, 80 - Math.round(avgTech))} pts`,
            },
          ]}
        />

        <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
          <h2 className="font-bold text-navy">{t("groupStats")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("technical"), value: Math.round(avgTech) },
              { label: t("tactical"), value: Math.round(avgTact) },
              { label: t("physical"), value: Math.round(avgPhys) },
              { label: t("mental"), value: Math.round(avgMent) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-4 py-3"
              >
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="text-2xl font-bold text-navy">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">{t("comparePlayers")}</h2>
          <div className="space-y-3">
            {mockPlayers.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_repeat(4,minmax(0,4rem))] items-center gap-2 rounded-xl border border-[#E5E2D9] px-3 py-2 text-sm"
              >
                <span className="font-semibold text-navy">
                  {p.firstName} {p.lastName}
                </span>
                <span className="text-center text-royal">{p.technicalScore}</span>
                <span className="text-center text-royal">{p.tacticalScore}</span>
                <span className="text-center text-royal">{p.physicalScore}</span>
                <span className="text-center text-royal">{p.mentalScore}</span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_repeat(4,minmax(0,4rem))] gap-2 px-3 text-[11px] text-text-muted">
              <span />
              <span className="text-center">{t("technical")}</span>
              <span className="text-center">{t("tactical")}</span>
              <span className="text-center">{t("physical")}</span>
              <span className="text-center">{t("mental")}</span>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
