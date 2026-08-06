"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Cake,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Ruler,
  Shield,
  Users,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
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
  DropdownMenuSeparator,
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
import {
  formatPositionLabel,
  normalizeAppStatus,
  type AppStatus,
} from "@/lib/admin/labels";
import { cn } from "@/lib/utils";

type AppItem = {
  id: string;
  firstNames?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  neighborhood?: string;
  school?: string;
  address?: string;
  primaryPosition?: string;
  secondaryPosition?: string;
  strongFoot?: string;
  category?: string;
  zone?: string;
  nationality?: string;
  birthPlace?: string;
  dobDay?: string;
  dobMonth?: string;
  dobYear?: string;
  age?: string;
  heightCm?: string;
  weightKg?: string;
  playerPhone?: string;
  fatherTutorName?: string;
  fatherTutorPhone?: string;
  motherName?: string;
  motherPhone?: string;
  currentClub?: string;
  previousClubs?: string;
  injuryCurrent?: boolean;
  injuryDetails?: string;
  allergies?: string;
  reference?: string;
  status?: string;
  pdfSignedUrl?: string | null;
  createdAt?: string | null;
};

function fullName(app: AppItem) {
  return `${app.firstNames ?? app.firstName ?? ""} ${app.lastName ?? ""}`.trim();
}

function initials(app: AppItem) {
  const first = (app.firstNames ?? app.firstName ?? "?").trim();
  const last = (app.lastName ?? "").trim();
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

function formatHeight(raw?: string) {
  if (!raw?.trim()) return null;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) return raw;
  // Values like 1.75 are metres; 175 is cm
  if (n > 0 && n < 3) return `${String(raw).replace(".", ",")} m`;
  return `${raw} cm`;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Mail;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2.5">
      {Icon ? (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F6F2] text-navy/70">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium leading-snug text-navy">{value}</p>
      </div>
    </div>
  );
}

function ProfileSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-[#E8E4DA] bg-white", className)}>
      <div className="border-b border-[#E8E4DA] px-4 py-2.5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-[#F0EDE5] px-4">{children}</div>
    </section>
  );
}

export default function AdminApplicationsPage() {
  const t = useTranslations("dashboard.admin");
  const locale = useLocale();
  const [items, setItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [position, setPosition] = useState("all");
  const [city, setCity] = useState("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<AppItem | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/recruitments");
        const json = await res.json();
        if (mounted) setItems(Array.isArray(json?.items) ? json.items : []);
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    items.forEach((a) => {
      const c = a.city ?? a.school ?? "";
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [items]);

  const positions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((a) => {
      if (a.primaryPosition) set.add(a.primaryPosition);
    });
    return Array.from(set).sort();
  }, [items]);

  const duplicateIds = useMemo(() => {
    const map = new Map<string, string[]>();
    items.forEach((a) => {
      const key = `${fullName(a).toLowerCase()}|${(a.email ?? "").toLowerCase()}`;
      const list = map.get(key) ?? [];
      list.push(a.id);
      map.set(key, list);
    });
    const dups = new Set<string>();
    map.forEach((ids) => {
      if (ids.length > 1) ids.forEach((id) => dups.add(id));
    });
    return dups;
  }, [items]);

  const filtered = useMemo(() => {
    let list = items.filter((a) => {
      const name = fullName(a).toLowerCase();
      const loc = (a.city ?? a.school ?? a.address ?? "").toLowerCase();
      const st = normalizeAppStatus(a.status);
      const matchQ =
        !q ||
        name.includes(q.toLowerCase()) ||
        loc.includes(q.toLowerCase()) ||
        (a.email ?? "").toLowerCase().includes(q.toLowerCase());
      const matchSt = status === "all" || st === status;
      const matchPos = position === "all" || a.primaryPosition === position;
      const matchCity =
        city === "all" || a.city === city || a.school === city;
      return matchQ && matchSt && matchPos && matchCity;
    });

    list = [...list].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortAsc ? da - db : db - da;
    });
    return list;
  }, [items, q, status, position, city, sortAsc]);

  async function updateStatus(id: string, next: AppStatus) {
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: next.toUpperCase() } : a))
    );
    try {
      await fetch("/api/admin/recruitments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      const toastKey =
        next === "accepted"
          ? "toastAccepted"
          : next === "rejected"
            ? "toastRejected"
            : next === "interview"
              ? "toastInterview"
              : "toastPending";
      toast(t(toastKey));
    } catch {
      toast(
        locale === "en"
          ? "Unable to update status"
          : "Impossible de mettre à jour le statut"
      );
    }
  }

  async function removeItem(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    setItems((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/admin/recruitments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      toast(t("toastDeleted"));
    } catch {
      toast(t("toastDeleted"));
    }
  }

  function exportCsv() {
    const header = ["Nom", "Email", "Poste", "Lieu", "Statut", "Date"];
    const rows = filtered.map((a) => [
      fullName(a),
      a.email ?? "",
      formatPositionLabel(a.primaryPosition, locale),
      a.city ?? a.school ?? "",
      normalizeAppStatus(a.status),
      a.createdAt ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "candidatures.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout requiredRole="admin" title={t("applications")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E5E2D9] bg-white p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="h-10 min-w-[160px] flex-1 rounded-xl border border-[#E5E2D9] bg-[#F7F6F2] px-3 text-sm outline-none focus:border-gold/50"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm"
          >
            <option value="all">{t("filterStatus")}: {t("all")}</option>
            <option value="pending">{t("statusLabels.pending")}</option>
            <option value="accepted">{t("statusLabels.accepted")}</option>
            <option value="rejected">{t("statusLabels.rejected")}</option>
            <option value="interview">{t("statusLabels.interview")}</option>
          </select>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="h-10 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm"
          >
            <option value="all">{t("filterPosition")}: {t("all")}</option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {formatPositionLabel(p, locale)}
              </option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-10 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm"
          >
            <option value="all">{t("filterCity")}: {t("all")}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortAsc((v) => !v)}
            className="h-10 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm font-medium hover:border-gold/40"
          >
            {t("sortDate")} {sortAsc ? "↑" : "↓"}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="h-10 rounded-xl border border-[#E5E2D9] bg-white px-3 text-sm font-medium hover:border-gold/40"
          >
            {t("exportCsv")}
          </button>
          <Link
            href="/rejoindre"
            className="inline-flex h-10 items-center rounded-xl bg-gold px-4 text-sm font-bold text-navy transition hover:translate-y-[-1px]"
          >
            {t("newApplication")}
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E5E2D9] bg-white">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F7F6F2]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-text-muted">{t("noResults")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("candidate")}</TableHead>
                  <TableHead>{t("filterPosition")}</TableHead>
                  <TableHead>{t("location")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("dossier")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => {
                  const st = normalizeAppStatus(app.status);
                  const isDup = duplicateIds.has(app.id);
                  const date = app.createdAt
                    ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR").format(
                        new Date(app.createdAt)
                      )
                    : "—";
                  return (
                    <TableRow key={app.id} className="hover:bg-[#F7F6F2]/60">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy">{fullName(app) || "—"}</span>
                          {isDup ? (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                              {t("duplicate")}
                            </span>
                          ) : null}
                        </div>
                        {app.email ? (
                          <p className="text-xs text-text-muted">{app.email}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {formatPositionLabel(app.primaryPosition, locale)}
                      </TableCell>
                      <TableCell>{app.city ?? app.school ?? "—"}</TableCell>
                      <TableCell>{date}</TableCell>
                      <TableCell>
                        <StatusBadge status={st} label={t(`statusLabels.${st}`)} />
                      </TableCell>
                      <TableCell>
                        {app.pdfSignedUrl ? (
                          <a
                            href={app.pdfSignedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-navy hover:text-gold"
                          >
                            {t("viewPdf")}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E2D9] hover:border-gold/40">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelected(app)}>
                              {t("viewProfile")}
                            </DropdownMenuItem>
                            {app.pdfSignedUrl ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  window.open(app.pdfSignedUrl!, "_blank", "noopener,noreferrer");
                                }}
                              >
                                {t("downloadPdf")}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateStatus(app.id, "accepted")}>
                              {t("accept")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(app.id, "rejected")}>
                              {t("reject")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(app.id, "pending")}>
                              {t("setPending")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(app.id, "interview")}>
                              {t("setInterview")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-700"
                              onClick={() => removeItem(app.id)}
                            >
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/10">
          {selected ? (
            <>
              <div className="relative overflow-hidden bg-navy px-5 pb-5 pt-5 text-white sm:px-6">
                <div
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(201,154,46,0.35), transparent 55%)",
                  }}
                  aria-hidden
                />
                <DialogHeader className="relative space-y-0 text-left">
                  <div className="flex items-start gap-4 pr-8">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold text-lg font-bold text-navy shadow-lg">
                      {initials(selected)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="font-heading text-xl font-bold leading-tight tracking-wide text-white sm:text-2xl">
                        {fullName(selected) || t("candidate")}
                      </DialogTitle>
                      <DialogDescription className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          status={normalizeAppStatus(selected.status)}
                          label={t(
                            `statusLabels.${normalizeAppStatus(selected.status)}`
                          )}
                        />
                        {selected.category ? (
                          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                            {selected.category}
                          </span>
                        ) : null}
                        {selected.primaryPosition ? (
                          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                            {formatPositionLabel(selected.primaryPosition, locale)}
                          </span>
                        ) : null}
                        {selected.reference ? (
                          <span className="text-[11px] text-white/50">
                            {selected.reference}
                          </span>
                        ) : null}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="relative mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      {t("profileSize")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {[formatHeight(selected.heightCm), selected.weightKg ? `${selected.weightKg} kg` : null]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      {t("profileStrongFoot")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold capitalize text-white">
                      {selected.strongFoot || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      {t("location")}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-white">
                      {selected.city || selected.birthPlace || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[min(52vh,28rem)] space-y-3 overflow-y-auto bg-[#F7F6F2] p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ProfileSection
                    title={locale === "fr" ? "Identité" : "Identity"}
                  >
                    <InfoRow
                      icon={Cake}
                      label={t("profileDob")}
                      value={
                        selected.dobDay && selected.dobMonth && selected.dobYear
                          ? `${selected.dobDay}/${selected.dobMonth}/${selected.dobYear}${
                              selected.age ? ` · ${selected.age} ans` : ""
                            }`
                          : selected.age
                            ? `${selected.age} ans`
                            : null
                      }
                    />
                    <InfoRow
                      icon={MapPin}
                      label={t("profileBirthPlace")}
                      value={selected.birthPlace}
                    />
                    <InfoRow
                      icon={Shield}
                      label={t("profileNationality")}
                      value={selected.nationality}
                    />
                    <InfoRow
                      icon={MapPin}
                      label={t("profileAddress")}
                      value={
                        [selected.address, selected.neighborhood, selected.city]
                          .filter(Boolean)
                          .join(", ") || null
                      }
                    />
                  </ProfileSection>

                  <ProfileSection
                    title={locale === "fr" ? "Football" : "Football"}
                  >
                    <InfoRow
                      icon={Shield}
                      label={t("filterPosition")}
                      value={
                        selected.primaryPosition
                          ? formatPositionLabel(selected.primaryPosition, locale)
                          : null
                      }
                    />
                    <InfoRow
                      label={t("profileSecondaryPosition")}
                      value={
                        selected.secondaryPosition
                          ? formatPositionLabel(
                              selected.secondaryPosition,
                              locale
                            )
                          : null
                      }
                    />
                    <InfoRow
                      label={t("profileCurrentClub")}
                      value={selected.currentClub}
                    />
                    <InfoRow
                      label={t("profilePreviousClubs")}
                      value={selected.previousClubs}
                    />
                    <InfoRow
                      icon={GraduationCap}
                      label={t("profileSchool")}
                      value={selected.school}
                    />
                  </ProfileSection>

                  <ProfileSection
                    title={locale === "fr" ? "Contact" : "Contact"}
                  >
                    <InfoRow
                      icon={Mail}
                      label={t("profileEmail")}
                      value={selected.email}
                    />
                    <InfoRow
                      icon={Phone}
                      label={t("profilePhone")}
                      value={selected.playerPhone}
                    />
                  </ProfileSection>

                  <ProfileSection
                    title={locale === "fr" ? "Famille & santé" : "Family & health"}
                  >
                    <InfoRow
                      icon={Users}
                      label={t("profileFather")}
                      value={
                        [selected.fatherTutorName, selected.fatherTutorPhone]
                          .filter(Boolean)
                          .join(" · ") || null
                      }
                    />
                    <InfoRow
                      icon={Users}
                      label={t("profileMother")}
                      value={
                        [selected.motherName, selected.motherPhone]
                          .filter(Boolean)
                          .join(" · ") || null
                      }
                    />
                    <InfoRow
                      icon={Ruler}
                      label={t("profileInjuries")}
                      value={
                        selected.injuryCurrent
                          ? selected.injuryDetails || t("profileInjuryYes")
                          : selected.injuryDetails || null
                      }
                    />
                    <InfoRow
                      label={t("profileAllergies")}
                      value={selected.allergies}
                    />
                  </ProfileSection>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[#E5E2D9] bg-white p-4 sm:px-5">
                {selected.pdfSignedUrl ? (
                  <a
                    href={selected.pdfSignedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-bold text-white transition hover:bg-navy/90 sm:flex-none sm:min-w-[10rem]"
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    {t("viewPdf")}
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    void updateStatus(selected.id, "accepted");
                    setSelected(null);
                  }}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 sm:flex-none"
                >
                  {t("accept")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void updateStatus(selected.id, "rejected");
                    setSelected(null);
                  }}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E2D9] px-4 text-sm font-semibold text-navy transition hover:border-red-300 hover:text-red-700 sm:flex-none"
                >
                  {t("reject")}
                </button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
