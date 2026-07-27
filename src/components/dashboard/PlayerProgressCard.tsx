"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Player, Locale } from "@/types";
import { localized } from "@/lib/utils";

interface PlayerProgressCardProps {
  player: Player;
  locale: Locale;
  /** Coach dashboard shows actions linking to evals; public pages stay read-only */
  showCoachActions?: boolean;
}

function categoryFromAge(age: number) {
  if (age <= 14) return "U-14";
  if (age <= 16) return "U-16";
  return "U-18";
}

export function PlayerProgressCard({
  player,
  locale,
  showCoachActions = false,
}: PlayerProgressCardProps) {
  const t = useTranslations("dashboard.coach");

  const scores = [
    {
      label: locale === "fr" ? "Technique" : "Technical",
      value: player.technicalScore,
    },
    {
      label: locale === "fr" ? "Tactique" : "Tactical",
      value: player.tacticalScore,
    },
    {
      label: locale === "fr" ? "Physique" : "Physical",
      value: player.physicalScore,
    },
    {
      label: locale === "fr" ? "Mental" : "Mental",
      value: player.mentalScore,
    },
  ];

  const progress = localized(player.lastProgress, locale);
  const tone = progress.includes("-")
    ? "bg-red-50 text-red-700"
    : progress.includes("+")
      ? "bg-emerald-50 text-emerald-800"
      : "bg-slate-100 text-slate-600";

  return (
    <Card className="border border-[#E5E2D9] bg-white shadow-[0_8px_24px_rgba(7,20,38,0.04)]">
      <CardHeader>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-gold">
            {player.firstName[0]}
            {player.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl font-bold text-navy">
                {player.firstName} {player.lastName}
              </CardTitle>
              <Badge className={tone}>{progress}</Badge>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {categoryFromAge(player.age)} • {localized(player.position, locale)} •{" "}
              {locale === "fr" ? "Groupe Élite" : "Elite group"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {localized(player.strongFoot, locale)} • N°
              {player.id === "p1" ? "8" : player.id === "p2" ? "9" : "4"} •{" "}
              {locale === "fr" ? "Dernière évaluation" : "Last evaluation"} : 21/07/2026
            </p>
            {showCoachActions ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/dashboard/coach/joueurs"
                  className="inline-flex h-9 items-center rounded-lg border border-[#E5E2D9] px-3 text-xs font-semibold text-navy"
                >
                  {t("fullProfile")}
                </Link>
                <Link
                  href="/dashboard/coach/evaluations"
                  className="inline-flex h-9 items-center rounded-lg bg-gold px-3 text-xs font-bold text-navy"
                >
                  {t("newEval")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {scores.map((score) => (
            <div key={score.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-text-muted">{score.label}</span>
                <span className="font-bold text-royal">{score.value}%</span>
              </div>
              <Progress value={score.value} className="h-2" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gold">
              {locale === "fr" ? "Objectifs" : "Goals"}
            </h4>
            <ul className="space-y-1">
              {player.objectives.map((obj) => (
                <li key={obj.fr} className="text-sm text-text-muted">
                  • {localized(obj, locale)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gold">
              {locale === "fr" ? "Points forts" : "Strengths"}
            </h4>
            <ul className="space-y-1">
              {player.strengths.map((s) => (
                <li key={s.fr} className="text-sm text-text-muted">
                  • {localized(s, locale)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gold">
              {locale === "fr" ? "Axes de travail" : "Focus areas"}
            </h4>
            <ul className="space-y-1">
              {player.improvements.map((i) => (
                <li key={i.fr} className="text-sm text-text-muted">
                  • {localized(i, locale)}
                </li>
              ))}
            </ul>
            {showCoachActions ? (
              <p className="mt-3 text-xs text-navy">
                <span className="font-semibold">{t("recommendedDrill")} :</span>{" "}
                {locale === "fr"
                  ? "série de frappes après conduite de balle"
                  : "finishing series after dribbling"}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
