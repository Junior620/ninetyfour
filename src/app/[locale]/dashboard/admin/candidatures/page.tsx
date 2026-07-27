"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MoreHorizontal } from "lucide-react";
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
import { toast } from "@/components/ui/toast";
import {
  formatPositionLabel,
  normalizeAppStatus,
  type AppStatus,
} from "@/lib/admin/labels";

type AppItem = {
  id: string;
  firstNames?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  school?: string;
  address?: string;
  primaryPosition?: string;
  status?: string;
  pdfSignedUrl?: string | null;
  createdAt?: string | null;
};

function fullName(app: AppItem) {
  return `${app.firstNames ?? app.firstName ?? ""} ${app.lastName ?? ""}`.trim();
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
      toast(t("toastMock"));
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
          <button
            type="button"
            onClick={() => toast(t("toastMock"))}
            className="h-10 rounded-xl bg-gold px-4 text-sm font-bold text-navy transition hover:translate-y-[-1px]"
          >
            {t("newApplication")}
          </button>
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
                            <DropdownMenuItem onClick={() => toast(t("toastMock"))}>
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
    </DashboardLayout>
  );
}
