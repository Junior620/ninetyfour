"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlayerTable } from "@/components/dashboard/PlayerTable";
import { PlayerProgressCard } from "@/components/dashboard/PlayerProgressCard";
import { EvaluationForm } from "@/components/forms/EvaluationForm";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { mockPlayers, performanceChartData } from "@/lib/data";
import type { Player, Locale } from "@/types";

export default function CoachDashboardPage() {
  const t = useTranslations("dashboard.coach");
  const locale = useLocale() as Locale;
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(
    mockPlayers[0]
  );

  return (
    <DashboardLayout requiredRole="coach">
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-black-premium">{t("title")}</h1>

        <section id="players">
          <h2 className="mb-4 text-lg font-bold text-black-premium">
            {t("players")}
          </h2>
          <PlayerTable
            players={mockPlayers}
            locale={locale}
            onSelect={setSelectedPlayer}
          />
        </section>

        {selectedPlayer && (
          <PlayerProgressCard player={selectedPlayer} locale={locale} />
        )}

        <section id="evaluation">
          <h2 className="mb-4 text-lg font-bold text-black-premium">
            {t("addEvaluation")}
          </h2>
          <EvaluationForm playerId={selectedPlayer?.id} />
        </section>

        <section id="stats">
          <h2 className="mb-4 text-lg font-bold text-black-premium">
            {t("statistics")}
          </h2>
          <PerformanceChart data={performanceChartData} />
        </section>
      </div>
    </DashboardLayout>
  );
}
