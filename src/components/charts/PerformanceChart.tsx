"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PerformanceDataPoint } from "@/types";

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  title?: string;
  summary?: string;
  showFilters?: boolean;
  showSeriesToggles?: boolean;
  objective?: number;
  insights?: { label: string; value: string }[];
}

type Period = "3m" | "6m" | "1y";

const SERIES = [
  { key: "technical" as const, color: "#0A4FA3", fr: "Technique", en: "Technical" },
  { key: "tactical" as const, color: "#0F766E", fr: "Tactique", en: "Tactical" },
  { key: "physical" as const, color: "#C99A2E", fr: "Physique", en: "Physical" },
  { key: "mental" as const, color: "#7C3AED", fr: "Mental", en: "Mental" },
];

export function PerformanceChart({
  data,
  title,
  summary,
  showFilters = true,
  showSeriesToggles = false,
  objective = 80,
  insights,
}: PerformanceChartProps) {
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>("6m");
  const [enabled, setEnabled] = useState({
    technical: true,
    tactical: showSeriesToggles,
    physical: true,
    mental: showSeriesToggles,
  });

  const labels = {
    scoreOutOf: locale === "fr" ? "Score sur 100" : "Score out of 100",
    objective: locale === "fr" ? `Objectif : ${objective}` : `Target: ${objective}`,
    period3m: locale === "fr" ? "3 mois" : "3 months",
    period6m: locale === "fr" ? "6 mois" : "6 months",
    period1y: locale === "fr" ? "Saison" : "Season",
  };

  const filtered = useMemo(() => {
    if (period === "3m") return data.slice(-3);
    if (period === "6m") return data.slice(-6);
    return data;
  }, [data, period]);

  return (
    <Card className="border border-[#E5E2D9] bg-white shadow-[0_8px_24px_rgba(7,20,38,0.04)]">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? (
              <CardTitle className="text-lg font-bold text-navy">{title}</CardTitle>
            ) : null}
            <p className="mt-1 text-xs text-text-muted">{labels.scoreOutOf}</p>
          </div>
          {showFilters ? (
            <div className="flex gap-1 rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] p-1">
              {(
                [
                  ["3m", labels.period3m],
                  ["6m", labels.period6m],
                  ["1y", labels.period1y],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPeriod(key)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    period === key
                      ? "bg-navy text-white"
                      : "text-text-muted hover:text-navy"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {summary ? (
          <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm font-medium text-navy">
            {summary}
          </p>
        ) : null}
        {showSeriesToggles ? (
          <div className="flex flex-wrap gap-2">
            {SERIES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  setEnabled((e) => ({ ...e, [s.key]: !e[s.key] }))
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  enabled[s.key]
                    ? "border-transparent text-white"
                    : "border-[#E5E2D9] bg-white text-text-muted"
                )}
                style={
                  enabled[s.key] ? { backgroundColor: s.color } : undefined
                }
              >
                {locale === "fr" ? s.fr : s.en}
              </button>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4">
        <div className="h-[220px] w-full sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filtered}
              margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
              <XAxis dataKey="month" stroke="#4B5563" fontSize={11} tickMargin={8} />
              <YAxis
                stroke="#4B5563"
                fontSize={11}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                width={40}
                tickMargin={6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e2db",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} iconSize={10} />
              <ReferenceLine
                y={objective}
                stroke="#C99A2E"
                strokeDasharray="4 4"
                label={{
                  value: labels.objective,
                  position: "left",
                  fill: "#C99A2E",
                  fontSize: 10,
                }}
              />
              {SERIES.map((s) =>
                enabled[s.key] ? (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ fill: s.color, r: 3 }}
                    name={locale === "fr" ? s.fr : s.en}
                    connectNulls
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {insights && insights.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {insights.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3 py-2"
              >
                <p className="text-[11px] text-text-muted">{item.label}</p>
                <p className="text-sm font-bold text-navy">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
