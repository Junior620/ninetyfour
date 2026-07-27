"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { performanceChartData } from "@/lib/data";

export default function ParentProgressPage() {
  const t = useTranslations("dashboard.parent");
  const techDelta =
    performanceChartData[performanceChartData.length - 1].technical -
    performanceChartData[0].technical;

  return (
    <DashboardLayout requiredRole="parent" title={t("progressNav")}>
      <PerformanceChart
        data={performanceChartData}
        title={t("playerProgress")}
        summary={t("chartSummary", { points: techDelta })}
      />
    </DashboardLayout>
  );
}
