"use client";

import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { MetricCard } from "@/components/cards/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, MessageSquare, BookOpen } from "lucide-react";
import {
  mockPlayer,
  performanceChartData,
  parentData,
} from "@/lib/data";
import { localized, formatDate } from "@/lib/utils";
import type { Locale } from "@/types";

export default function ParentDashboardPage() {
  const t = useTranslations("dashboard.parent");
  const locale = useLocale() as Locale;

  return (
    <DashboardLayout requiredRole="parent">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-black-premium">{t("title")}</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Technique"
            value={`${mockPlayer.technicalScore}%`}
          />
          <MetricCard
            label="Physique"
            value={`${mockPlayer.physicalScore}%`}
          />
          <MetricCard
            label={t("attendance")}
            value={`${parentData.attendance.percentage}%`}
            trend={`${parentData.attendance.present}/${parentData.attendance.total}`}
          />
          <MetricCard
            label={t("academic")}
            value={localized(parentData.academic.grade, locale)}
          />
        </div>

        <PerformanceChart
          data={performanceChartData}
          title={t("playerProgress")}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-gold" />
                {t("academic")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parentData.academic.subjects.map((subject) => (
                <div key={subject.name.fr}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{localized(subject.name, locale)}</span>
                    <span className="font-bold text-royal">{subject.grade}</span>
                  </div>
                  <Progress
                    value={parseInt(subject.grade) * 5}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-gold" />
                {t("messages")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parentData.messages.map((msg) => (
                <div key={msg.date} className="rounded-lg bg-cream p-4">
                  <p className="font-medium text-black-premium">
                    {localized(msg.title, locale)}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {localized(msg.preview, locale)}
                  </p>
                  <p className="mt-2 text-xs text-text-muted/60">
                    {formatDate(msg.date, locale)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-gold" />
              {t("documents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {parentData.documents.map((doc) => (
                <div
                  key={doc.name.fr}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <span className="text-sm text-black-premium">
                    {localized(doc.name, locale)}
                  </span>
                  <span className="text-xs font-medium text-gold">{doc.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
