"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Footprints,
  MoreHorizontal,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { mockPlayers } from "@/lib/data";
import { localized, cn } from "@/lib/utils";
import type { Locale, Player } from "@/types";

function categoryFromAge(age: number) {
  if (age <= 14) return "U-14";
  if (age <= 16) return "U-16";
  return "U-18";
}

function progressTone(text: string) {
  if (text.includes("-") || text.toLowerCase().includes("régress"))
    return "text-red-700 bg-red-50";
  if (text.includes("+")) return "text-emerald-800 bg-emerald-50";
  return "text-slate-600 bg-slate-100";
}

type PlayerStatus = "active" | "injured" | "suspended";

type PlayerRow = Player & { status: PlayerStatus };

function statusTone(status: PlayerStatus) {
  if (status === "injured") return "bg-amber-100 text-amber-900";
  if (status === "suspended") return "bg-red-100 text-red-800";
  return "bg-emerald-100 text-emerald-900";
}

function ScoreBar({ value, label }: { value: number; label: string }) {
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

function ScoreMeter({
  value,
  label,
  accent = "bg-royal",
}: {
  value: number;
  label: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[#E8E4DA] bg-white p-3">
      <div className="mb-2 flex items-end justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          {label}
        </p>
        <p className="font-heading text-2xl font-bold leading-none text-navy">
          {value}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F0EDE5]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", accent)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
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
  const [players, setPlayers] = useState<PlayerRow[]>(() =>
    mockPlayers.map((p, idx) => ({
      ...p,
      status: idx === 1 ? "injured" : idx === 2 ? "suspended" : "active",
    }))
  );
  const [selected, setSelected] = useState<PlayerRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    age: 0,
    technicalScore: 0,
    tacticalScore: 0,
    physicalScore: 0,
    status: "active" as PlayerStatus,
  });
  const pageSize = 8;

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      const cat = categoryFromAge(p.age);
      const matchQ = !q || name.includes(q.toLowerCase());
      const matchCat = category === "all" || cat === category;
      return matchQ && matchCat;
    });
  }, [players, q, category]);

  const pageItems = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  function openProfile(player: PlayerRow, edit = false) {
    setSelected(player);
    setEditing(edit);
    setDraft({
      firstName: player.firstName,
      lastName: player.lastName,
      age: player.age,
      technicalScore: player.technicalScore,
      tacticalScore: player.tacticalScore,
      physicalScore: player.physicalScore,
      status: player.status,
    });
  }

  function savePlayer() {
    if (!selected) return;
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === selected.id
          ? {
              ...p,
              firstName: draft.firstName.trim() || p.firstName,
              lastName: draft.lastName.trim() || p.lastName,
              age: draft.age,
              technicalScore: draft.technicalScore,
              tacticalScore: draft.tacticalScore,
              physicalScore: draft.physicalScore,
              status: draft.status,
            }
          : p
      )
    );
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            firstName: draft.firstName.trim() || prev.firstName,
            lastName: draft.lastName.trim() || prev.lastName,
            age: draft.age,
            technicalScore: draft.technicalScore,
            tacticalScore: draft.tacticalScore,
            physicalScore: draft.physicalScore,
            status: draft.status,
          }
        : null
    );
    setEditing(false);
    toast(t("toastSaved"));
  }

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
              {pageItems.map((player) => {
                const progress = localized(player.lastProgress, locale);
                return (
                  <TableRow key={player.id} className="hover:bg-[#F7F6F2]/60">
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => openProfile(player)}
                        className="flex items-center gap-3 text-left"
                      >
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
                      </button>
                    </TableCell>
                    <TableCell>{categoryFromAge(player.age)}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-[#F7F6F2] px-2.5 py-0.5 text-xs font-semibold text-navy">
                        {t(`playerStatus.${player.status}`)}
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
                          <DropdownMenuItem onClick={() => openProfile(player)}>
                            {t("viewProfile")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openProfile(player, true)}>
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

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setEditing(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-xl [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/10">
          {selected ? (
            <>
              <div className="relative overflow-hidden bg-navy px-5 pb-5 pt-5 text-white sm:px-6">
                <div
                  className="pointer-events-none absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      "radial-gradient(ellipse 70% 80% at 100% -20%, rgba(201,154,46,0.4), transparent 50%), radial-gradient(ellipse 50% 60% at 0% 100%, rgba(10,79,163,0.45), transparent 55%)",
                  }}
                  aria-hidden
                />
                <DialogHeader className="relative space-y-0 text-left">
                  <div className="flex items-start gap-4 pr-8">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gold text-navy shadow-lg">
                      <span className="font-heading text-xl font-bold leading-none">
                        {selected.firstName[0]}
                        {selected.lastName[0]}
                      </span>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {selected.age} {locale === "fr" ? "ans" : "yrs"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="font-heading text-xl font-bold tracking-wide text-white sm:text-2xl">
                        {selected.firstName} {selected.lastName}
                      </DialogTitle>
                      <DialogDescription className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                            statusTone(selected.status)
                          )}
                        >
                          {t(`playerStatus.${selected.status}`)}
                        </span>
                        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                          {categoryFromAge(selected.age)}
                        </span>
                        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                          {localized(selected.position, locale)}
                        </span>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="relative mt-4 flex flex-wrap items-center gap-3 text-sm text-white/75">
                  <span className="inline-flex items-center gap-1.5">
                    <Footprints className="h-3.5 w-3.5 text-gold" aria-hidden />
                    {localized(selected.strongFoot, locale)}
                  </span>
                  <span className="text-white/25">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-gold" aria-hidden />
                    {localized(selected.lastProgress, locale)}
                  </span>
                </div>
              </div>

              {editing ? (
                <div className="space-y-3 bg-[#F7F6F2] p-4 sm:p-5">
                  <div className="grid gap-3 rounded-xl border border-[#E8E4DA] bg-white p-4 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        {locale === "fr" ? "Prénom" : "First name"}
                      </span>
                      <input
                        value={draft.firstName}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, firstName: e.target.value }))
                        }
                        className="h-10 w-full rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        {locale === "fr" ? "Nom" : "Last name"}
                      </span>
                      <input
                        value={draft.lastName}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, lastName: e.target.value }))
                        }
                        className="h-10 w-full rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        {locale === "fr" ? "Âge" : "Age"}
                      </span>
                      <input
                        type="number"
                        min={10}
                        max={20}
                        value={draft.age}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            age: Number(e.target.value) || d.age,
                          }))
                        }
                        className="h-10 w-full rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        {t("status")}
                      </span>
                      <select
                        value={draft.status}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            status: e.target.value as PlayerStatus,
                          }))
                        }
                        className="h-10 w-full rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3"
                      >
                        <option value="active">{t("playerStatus.active")}</option>
                        <option value="injured">
                          {t("playerStatus.injured")}
                        </option>
                        <option value="suspended">
                          {t("playerStatus.suspended")}
                        </option>
                      </select>
                    </label>
                    {(
                      [
                        ["technicalScore", t("scores.tech")],
                        ["tacticalScore", t("scores.tact")],
                        ["physicalScore", t("scores.phys")],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="block text-sm">
                        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          {label}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={draft[key]}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              [key]: Number(e.target.value) || 0,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={savePlayer}
                      className="h-11 flex-1 rounded-xl bg-gold text-sm font-bold text-navy"
                    >
                      {locale === "fr" ? "Enregistrer" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="h-11 flex-1 rounded-xl border border-[#E5E2D9] bg-white text-sm font-semibold text-navy"
                    >
                      {locale === "fr" ? "Annuler" : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="max-h-[min(50vh,26rem)] space-y-4 overflow-y-auto bg-[#F7F6F2] p-4 sm:p-5">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <ScoreMeter
                        value={selected.technicalScore}
                        label={t("scores.tech")}
                        accent="bg-royal"
                      />
                      <ScoreMeter
                        value={selected.tacticalScore}
                        label={t("scores.tact")}
                        accent="bg-navy"
                      />
                      <ScoreMeter
                        value={selected.physicalScore}
                        label={t("scores.phys")}
                        accent="bg-gold"
                      />
                    </div>

                    {selected.mentalScore ? (
                      <ScoreMeter
                        value={selected.mentalScore}
                        label={locale === "fr" ? "Mental" : "Mental"}
                        accent="bg-emerald-600"
                      />
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <section className="rounded-xl border border-[#E8E4DA] bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 text-gold">
                            <Zap className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy">
                            {locale === "fr" ? "Points forts" : "Strengths"}
                          </h3>
                        </div>
                        <ul className="space-y-2">
                          {selected.strengths.map((s) => (
                            <li
                              key={s.fr}
                              className="flex items-start gap-2 text-sm text-navy"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                              {localized(s, locale)}
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section className="rounded-xl border border-[#E8E4DA] bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal/10 text-royal">
                            <Target className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy">
                            {locale === "fr" ? "À travailler" : "To improve"}
                          </h3>
                        </div>
                        <ul className="space-y-2">
                          {selected.improvements.map((s) => (
                            <li
                              key={s.fr}
                              className="flex items-start gap-2 text-sm text-navy"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-royal" />
                              {localized(s, locale)}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    {selected.objectives.length > 0 ? (
                      <section className="rounded-xl border border-[#E8E4DA] bg-white p-4">
                        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                          {locale === "fr" ? "Objectifs" : "Objectives"}
                        </h3>
                        <ul className="space-y-2">
                          {selected.objectives.map((o) => (
                            <li
                              key={o.fr}
                              className="rounded-lg bg-[#F7F6F2] px-3 py-2 text-sm font-medium text-navy"
                            >
                              {localized(o, locale)}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                  </div>

                  <div className="border-t border-[#E5E2D9] bg-white p-4 sm:px-5">
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gold text-sm font-bold text-navy transition hover:opacity-95"
                    >
                      {t("edit")}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
