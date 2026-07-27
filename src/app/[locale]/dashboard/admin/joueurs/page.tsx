"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MoreHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { mockPlayers } from "@/lib/data";
import { localized, cn } from "@/lib/utils";
import type { Locale } from "@/types";

function categoryFromAge(age: number) {
  if (age <= 14) return "U-14";
  if (age <= 16) return "U-16";
  return "U-18";
}

function progressTone(text: string) {
  if (text.includes("-") || text.toLowerCase().includes("régress")) return "text-red-700 bg-red-50";
  if (text.includes("+")) return "text-emerald-800 bg-emerald-50";
  return "text-slate-600 bg-slate-100";
}

function ScoreBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const filled = Math.round(value / 20);
  return (
    <div className="min-w-[7rem]" title={`${label} ${value}/100`}>
      <div className="mb-0.5 flex justify-between text-[10px] text-text-muted">
        <span>{label}</span>
        <span className="font-semibold text-navy">{value}</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-sm",
              i < filled ? "bg-royal" : "bg-[#E5E2D9]"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminPlayersPage() {
  const t = useTranslations("dashboard.admin");
  const locale = useLocale() as Locale;
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const filtered = useMemo(() => {
    return mockPlayers.filter((p) => {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      const cat = categoryFromAge(p.age);
      const matchQ = !q || name.includes(q.toLowerCase());
      const matchCat = category === "all" || cat === category;
      return matchQ && matchCat;
    });
  }, [q, category]);

  const pageItems = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <DashboardLayout requiredRole="admin" title={t("players")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E5E2D9] bg-white p-3">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder={t("search")}
            className="h-10 min-w-[180px] flex-1 rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3 text-sm outline-none focus:border-gold/50"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
            className="h-10 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm"
          >
            <option value="all">{t("filterCategory")}: {t("all")}</option>
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
                <TableHead>{t("scores.tech")}</TableHead>
                <TableHead>{t("scores.tact")}</TableHead>
                <TableHead>{t("scores.phys")}</TableHead>
                <TableHead>{locale === "fr" ? "Progression" : "Progress"}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((player, idx) => {
                const progress = localized(player.lastProgress, locale);
                const statusKey = idx === 1 ? "injured" : idx === 2 ? "suspended" : "active";
                return (
                  <TableRow key={player.id} className="hover:bg-[#F7F6F2]/60">
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
                            {localized(player.position, locale)} · {player.age}{" "}
                            {locale === "fr" ? "ans" : "yrs"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{categoryFromAge(player.age)}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-[#F7F6F2] px-2.5 py-0.5 text-xs font-semibold text-navy">
                        {t(`playerStatus.${statusKey}`)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ScoreBar value={player.technicalScore} label={t("scores.tech")} />
                    </TableCell>
                    <TableCell>
                      <ScoreBar value={player.tacticalScore} label={t("scores.tact")} />
                    </TableCell>
                    <TableCell>
                      <ScoreBar value={player.physicalScore} label={t("scores.phys")} />
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E2D9] hover:border-gold/40">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => toast(t("toastMock"))}
                          >
                            {t("viewProfile")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast(t("toastMock"))}>
                            {t("edit")}
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

        <div className="flex items-center justify-between text-sm">
          <p className="text-text-muted">
            {filtered.length} {locale === "fr" ? "joueurs" : "players"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-[#E5E2D9] bg-white px-3 py-1.5 disabled:opacity-40"
            >
              ←
            </button>
            <span className="px-2 py-1.5">
              {page + 1}/{pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-lg border border-[#E5E2D9] bg-white px-3 py-1.5 disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
