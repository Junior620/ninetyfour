"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Download,
  Dumbbell,
  FileText,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { toast } from "@/components/ui/toast";
import { parentData, performanceChartData } from "@/lib/data";
import { downloadTextFile } from "@/lib/download";
import { cn, formatDate, localized } from "@/lib/utils";
import type { Locale } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function CompactKpi({
  icon: Icon,
  label,
  value,
  bar,
  detail,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  bar: number;
  detail: string;
  hint: string;
}) {
  return (
    <div className="flex h-[138px] flex-col justify-between rounded-2xl border border-[#E5E2D9] bg-white p-4 shadow-[0_8px_24px_rgba(7,20,38,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-gold">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] font-semibold text-text-muted">{hint}</span>
      </div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-2xl font-bold text-navy">{value}</p>
      </div>
      <div>
        <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-[#F7F6F2]">
          <div
            className="h-full rounded-full bg-royal"
            style={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
          />
        </div>
        <p className="text-[11px] font-medium text-gold">{detail}</p>
      </div>
    </div>
  );
}

export default function ParentOverviewPage() {
  const t = useTranslations("dashboard.parent");
  const locale = useLocale() as Locale;
  const [childId, setChildId] = useState(parentData.children[0].id);
  const [selectedMsg, setSelectedMsg] = useState<
    (typeof parentData.messages)[number] | null
  >(null);

  const child = useMemo(
    () => parentData.children.find((c) => c.id === childId) ?? parentData.children[0],
    [childId]
  );

  const techDelta =
    performanceChartData[performanceChartData.length - 1].technical -
    performanceChartData[0].technical;

  const sessionDate = formatDate(parentData.nextSession.date, locale);

  return (
    <DashboardLayout requiredRole="parent" title={t("overview")}>
      <div className="space-y-6">
        {/* Player identity */}
        <section className="rounded-2xl border border-[#E5E2D9] bg-white p-4 shadow-[0_8px_24px_rgba(7,20,38,0.04)] sm:p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-gold">
              {child.firstName[0]}
              {child.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-navy">
                  {child.firstName} {child.lastName}
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  {t("statusActive")}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {child.category} • {localized(child.position, locale)} •{" "}
                {localized(child.group, locale)}
                {child.jersey ? ` • #${child.jersey}` : ""}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {t("lastEvaluation")} : {formatDate(child.lastEvaluation, locale)}
              </p>
            </div>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-text-muted">
                {t("selectChild")}
              </span>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="h-10 min-w-[180px] rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3 text-sm outline-none focus:border-gold/50"
              >
                {parentData.children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Next session + quick actions */}
        <div className="grid gap-4 lg:grid-cols-5">
          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5 lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
              {t("nextSession")}
            </p>
            <h3 className="mt-2 text-lg font-bold text-navy">
              {sessionDate} • {parentData.nextSession.time}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {localized(parentData.nextSession.location, locale)}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {t("equipment")} : {localized(parentData.nextSession.kit, locale)}
            </p>
            <Link
              href="/dashboard/parent/calendrier"
              className="mt-4 inline-flex text-sm font-bold text-navy hover:text-gold"
            >
              {t("seeDetails")} →
            </Link>
          </section>
          <section className="grid grid-cols-2 gap-2 lg:col-span-2">
            {[
              {
                label: t("contactCoach"),
                icon: UserRound,
                href: "/contact",
              },
              {
                label: t("reportAbsence"),
                icon: CalendarDays,
                href: "/dashboard/parent/presences",
              },
              {
                label: t("viewCalendar"),
                icon: CalendarDays,
                href: "/dashboard/parent/calendrier",
              },
              {
                label: t("downloadReport"),
                icon: Download,
                href: "#download-report",
              },
            ].map((action) => {
              const Icon = action.icon;
              const className =
                "flex min-h-[72px] flex-col items-start justify-center gap-1 rounded-2xl border border-[#E5E2D9] bg-white px-3 py-2 text-left text-xs font-semibold text-navy transition hover:-translate-y-0.5 hover:border-gold/40";
              if (action.href === "#download-report") {
                return (
                  <button
                    key={action.label}
                    type="button"
                    className={className}
                    onClick={() => {
                      downloadTextFile(
                        `rapport-parent-${new Date().toISOString().slice(0, 10)}.txt`,
                        [
                          "Ninety One Foot Academy — Rapport parent",
                          `${child.firstName} ${child.lastName}`,
                          `Catégorie: ${child.category}`,
                          `Présences: ${parentData.attendance.percentage}%`,
                          `Moyenne scolaire: ${parentData.academic.average}`,
                        ].join("\n")
                      );
                      toast(
                        locale === "fr"
                          ? "Téléchargement démarré"
                          : "Download started"
                      );
                    }}
                  >
                    <Icon className="h-4 w-4 text-gold" />
                    {action.label}
                  </button>
                );
              }
              return (
                <Link key={action.label} href={action.href} className={className}>
                  <Icon className="h-4 w-4 text-gold" />
                  {action.label}
                </Link>
              );
            })}
          </section>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactKpi
            icon={Activity}
            label="Technique"
            value={`${parentData.kpi.technical.value}%`}
            bar={parentData.kpi.technical.value}
            detail={t("kpiTechDelta", { n: parentData.kpi.technical.delta })}
            hint={localized(parentData.kpi.technical.hint, locale)}
          />
          <CompactKpi
            icon={Dumbbell}
            label="Physique"
            value={`${parentData.kpi.physical.value}%`}
            bar={parentData.kpi.physical.value}
            detail={t("kpiPhysTarget", { n: parentData.kpi.physical.target })}
            hint={localized(parentData.kpi.physical.hint, locale)}
          />
          <Link href="/dashboard/parent/presences" className="block">
            <CompactKpi
              icon={CalendarDays}
              label={t("attendance")}
              value={`${parentData.attendance.percentage}%`}
              bar={parentData.attendance.percentage}
              detail={t("kpiAttendanceDetail", {
                absences: parentData.attendance.absences.length,
              })}
              hint={`${parentData.attendance.present}/${parentData.attendance.total}`}
            />
          </Link>
          <CompactKpi
            icon={BookOpen}
            label={t("academic")}
            value={parentData.academic.average}
            bar={(parentData.academic.averageValue / 20) * 100}
            detail={t("kpiAcademicDetail", { n: parentData.kpi.academicDelta })}
            hint={localized(parentData.kpi.academicHint, locale)}
          />
        </div>

        <PerformanceChart
          data={performanceChartData}
          title={t("playerProgress")}
          summary={t("chartSummary", { points: techDelta })}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-bold text-navy">
                <BookOpen className="h-4 w-4 text-gold" />
                {t("academic")}
              </h3>
              <Link
                href="/dashboard/parent/scolaire"
                className="text-xs font-semibold text-gold hover:underline"
              >
                {t("seeDetails")}
              </Link>
            </div>
            <p className="text-2xl font-bold text-navy">
              {t("average")} : {parentData.academic.average}
            </p>
            <p className="mt-1 text-sm text-gold">
              +{parentData.academic.delta} {locale === "fr" ? "point" : "pts"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {t("academicFocus", {
                subject: localized(parentData.academic.focus, locale),
              })}
            </p>
            <div className="mt-4 space-y-3">
              {parentData.academic.subjects.map((subject) => (
                <div key={subject.name.fr}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{localized(subject.name, locale)}</span>
                    <span className="font-bold text-royal">{subject.grade}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#F7F6F2]">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        subject.value >= 15
                          ? "bg-emerald-500"
                          : subject.value >= 14
                            ? "bg-royal"
                            : "bg-amber-500"
                      )}
                      style={{ width: `${(subject.value / 20) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-bold text-navy">
                <MessageSquare className="h-4 w-4 text-gold" />
                {t("messages")}
              </h3>
              <Link
                href="/dashboard/parent/messages"
                className="text-xs font-semibold text-gold hover:underline"
              >
                {t("seeAllMessages")}
              </Link>
            </div>
            <div className="space-y-3">
              {parentData.messages.slice(0, 3).map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => setSelectedMsg(msg)}
                  className="w-full rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] p-3 text-left transition hover:border-gold/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">
                      {localized(msg.title, locale)}
                    </p>
                    {msg.unread ? (
                      <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-navy">
                        {t("unread")}
                      </span>
                    ) : null}
                    {msg.needsReply ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        {t("needsReply")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {t("from")} {localized(msg.sender, locale)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                    {localized(msg.preview, locale)}
                  </p>
                  <p className="mt-2 text-[11px] text-text-muted/70">
                    {formatDate(msg.date, locale)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[#E5E2D9] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-navy">
              <FileText className="h-4 w-4 text-gold" />
              {t("documents")}
            </h3>
            <Link
              href="/dashboard/parent/documents"
              className="text-xs font-semibold text-gold hover:underline"
            >
              {t("seeAllDocs")}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parentData.documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-[#E5E2D9] p-4 transition hover:border-gold/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-[10px] font-bold text-gold">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">
                      {localized(doc.name, locale)}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {t("updatedOn", { date: formatDate(doc.updatedAt, locale) })}{" "}
                      • {doc.size}
                    </p>
                    {doc.toSign ? (
                      <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        {t("toSign")}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const name = localized(doc.name, locale);
                    downloadTextFile(
                      `${name.replace(/\s+/g, "-").toLowerCase()}.txt`,
                      [
                        "Ninety One Foot Academy",
                        name,
                        `Mis à jour: ${doc.updatedAt}`,
                        `Taille: ${doc.size}`,
                      ].join("\n")
                    );
                    toast(
                      locale === "fr"
                        ? "Téléchargement démarré"
                        : "Download started"
                    );
                  }}
                  className="mt-3 h-9 w-full rounded-lg bg-gold text-xs font-bold text-navy"
                >
                  {t("download")}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Dialog
        open={!!selectedMsg}
        onOpenChange={(open) => {
          if (!open) setSelectedMsg(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedMsg ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-bold text-navy">
                  {localized(selectedMsg.title, locale)}
                </DialogTitle>
                <DialogDescription>
                  {t("from")} {localized(selectedMsg.sender, locale)} •{" "}
                  {formatDate(selectedMsg.date, locale)}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-navy">
                {localized(selectedMsg.preview, locale)}
              </p>
              <Link
                href="/dashboard/parent/messages"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-gold px-4 text-sm font-bold text-navy"
              >
                {t("seeAllMessages")}
              </Link>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
