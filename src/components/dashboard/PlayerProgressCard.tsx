"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Player } from "@/types";
import type { Locale } from "@/types";
import { localized } from "@/lib/utils";

interface PlayerProgressCardProps {
  player: Player;
  locale: Locale;
}

export function PlayerProgressCard({ player, locale }: PlayerProgressCardProps) {
  const scores = [
    { label: locale === "fr" ? "Technique" : "Technical", value: player.technicalScore },
    { label: locale === "fr" ? "Tactique" : "Tactical", value: player.tacticalScore },
    { label: locale === "fr" ? "Physique" : "Physical", value: player.physicalScore },
    { label: locale === "fr" ? "Mental" : "Mental", value: player.mentalScore },
  ];

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-black-premium">
              {player.firstName} {player.lastName}
            </CardTitle>
            <p className="mt-1 text-sm text-text-muted">
              {localized(player.position, locale)} · {player.age}{" "}
              {locale === "fr" ? "ans" : "years"} ·{" "}
              {localized(player.strongFoot, locale)}
            </p>
          </div>
          <Badge className="bg-gold/10 text-gold">
            {localized(player.lastProgress, locale)}
          </Badge>
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
              {locale === "fr" ? "Axes de travail" : "Areas to improve"}
            </h4>
            <ul className="space-y-1">
              {player.improvements.map((i) => (
                <li key={i.fr} className="text-sm text-text-muted">
                  • {localized(i, locale)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
