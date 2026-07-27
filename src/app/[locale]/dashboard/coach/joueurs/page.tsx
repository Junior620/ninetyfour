"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { MoreHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlayerProgressCard } from "@/components/dashboard/PlayerProgressCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { mockPlayers } from "@/lib/data";
import { cn, localized } from "@/lib/utils";
import type { Locale, Player } from "@/types";

function categoryFromAge(age: number) {
  if (age <= 14) return "U-14";
  if (age <= 16) return "U-16";
  return "U-18";
}

function progressTone(text: string) {
  if (text.includes("-")) return "bg-red-50 text-red-700";
  if (text.includes("+")) return "bg-emerald-50 text-emerald-800";
  return "bg-slate-100 text-slate-600";
}

export default function CoachPlayersPage() {
  const t = useTranslations("dashboard.coach");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Player>(mockPlayers[0]);

  const filtered = useMemo(() => {
    return mockPlayers.filter((p) => {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      const cat = categoryFromAge(p.age);
      return (
        (!q || name.includes(q.toLowerCase())) &&
        (category === "all" || cat === category)
      );
    });
  }, [q, category]);

  return (
    <DashboardLayout requiredRole="coach" title={t("players")}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E5E2D9] bg-white p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="h-10 min-w-[180px] flex-1 rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3 text-sm outline-none focus:border-gold/50"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm"
          >
            <option value="all">
              {t("filterCategory")}: {t("all")}
            </option>
            <option value="U-14">U-14</option>
            <option value="U-16">U-16</option>
            <option value="U-18">U-18</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E5E2D9] bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === "fr" ? "Joueur" : "Player"}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("lastEval")}</TableHead>
                <TableHead>Tech</TableHead>
                <TableHead>Tact</TableHead>
                <TableHead>Phys</TableHead>
                <TableHead>{locale === "fr" ? "Progression" : "Progress"}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((player, idx) => {
                const progress = localized(player.lastProgress, locale);
                const active = selected.id === player.id;
                const statusKey =
                  idx === 1 ? "statusInjured" : idx === 2 ? "statusAbsent" : "statusActive";
                return (
                  <TableRow
                    key={player.id}
                    onClick={() => setSelected(player)}
                    className={cn(
                      "cursor-pointer hover:bg-[#F7F6F2]/70",
                      active && "bg-gold/10"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">
                          {player.firstName[0]}
                          {player.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-navy">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="text-xs text-text-muted">
                            {localized(player.position, locale)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{categoryFromAge(player.age)}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-[#F7F6F2] px-2.5 py-0.5 text-xs font-semibold">
                        {t(statusKey)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-text-muted">
                      21/07/2026
                    </TableCell>
                    <TableCell className="font-semibold text-royal">
                      {player.technicalScore}
                    </TableCell>
                    <TableCell className="font-semibold text-royal">
                      {player.tacticalScore}
                    </TableCell>
                    <TableCell className="font-semibold text-royal">
                      {player.physicalScore}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          progressTone(progress)
                        )}
                      >
                        {progress}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E2D9]">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelected(player)}>
                            {t("viewProfile")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push("/dashboard/coach/evaluations")}
                          >
                            {t("newEval")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push("/dashboard/coach/statistiques")}
                          >
                            {t("viewStats")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast(t("toast"))}>
                            {t("editInfo")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast(t("toast"))}>
                            {t("downloadPlayerReport")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <PlayerProgressCard player={selected} locale={locale} showCoachActions />
      </div>
    </DashboardLayout>
  );
}
