"use client";

import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { MetricCard } from "@/components/cards/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Video, Target } from "lucide-react";
import {
  mockPlayer,
  performanceChartData,
  coachComments,
  monthlyGoals,
  upcomingTraining,
  calendarEvents,
  videosToReview,
} from "@/lib/data";
import { localized, formatDate } from "@/lib/utils";
import type { Locale } from "@/types";

export default function PlayerDashboardPage() {
  const t = useTranslations("dashboard.player");
  const locale = useLocale() as Locale;

  return (
    <DashboardLayout requiredRole="player">
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-black-premium sm:text-2xl">{t("title")}</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-0 bg-white shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-gold" />
                {t("nextTraining")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-royal">
                {formatDate(upcomingTraining.date, locale)}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {upcomingTraining.time} — {localized(upcomingTraining.type, locale)}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {localized(upcomingTraining.location, locale)}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <MetricCard label="Technique" value={`${mockPlayer.technicalScore}%`} trend="+4%" />
            <MetricCard label="Physique" value={`${mockPlayer.physicalScore}%`} trend="+3%" />
            <MetricCard label="Tactique" value={`${mockPlayer.tacticalScore}%`} trend="+2%" />
            <MetricCard label="Mental" value={`${mockPlayer.mentalScore}%`} trend="+1%" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PerformanceChart
            data={performanceChartData}
            title={t("technicalProgress")}
          />

          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-gold" />
                {t("monthlyGoals")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {monthlyGoals.map((goal) => (
                  <li key={goal.fr} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {localized(goal, locale)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("coachComments")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coachComments.map((comment) => (
                <div key={comment.date} className="border-l-2 border-gold pl-4">
                  <p className="text-sm text-text-muted">
                    {localized(comment.text, locale)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted/60">
                    {comment.coach} — {formatDate(comment.date, locale)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4 text-gold" />
                {t("videosToReview")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {videosToReview.map((video) => (
                <div
                  key={video.id}
                  className="flex flex-col gap-2 rounded-lg bg-cream p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-black-premium">
                    {localized(video.title, locale)}
                  </span>
                  <Badge variant="secondary" className="w-fit shrink-0 text-xs">
                    {formatDate(video.date, locale)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("calendar")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {calendarEvents.map((event) => (
                <div key={event.date + event.title.fr} className="rounded-lg border p-4">
                  <p className="text-xs font-bold text-gold">
                    {formatDate(event.date, locale)}
                  </p>
                  <p className="mt-1 text-sm text-black-premium">
                    {localized(event.title, locale)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
