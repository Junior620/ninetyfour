"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import { toast } from "@/components/ui/toast";

type UserItem = {
  id: string;
  email: string;
  name: string;
  role: string | null;
  status: string;
  createdAt: string | null;
};

export default function AdminUsersPage() {
  const t = useTranslations("dashboard.admin");
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetch("/api/admin/users", { credentials: "include" }).then(res => res.json()).then(json => {
      setItems(Array.isArray(json?.items) ? json.items : []);
    }).catch(() => {
      setItems([]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (filter === "pending") {
      return items.filter((u) => u.status === "pending");
    }
    return items;
  }, [items, filter]);

  async function updateStatus(id: string, status: "active" | "rejected") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast(t("toastUserError"));
        return;
      }
      toast(
        status === "active" ? t("toastUserApproved") : t("toastUserRejected")
      );
      setLoading(true);
      await load();
    } catch {
      toast(t("toastUserError"));
    } finally {
      setBusyId(null);
    }
  }

  function statusLabel(status: string) {
    if (status === "pending") return t("userStatus.pending");
    if (status === "active") return t("userStatus.active");
    if (status === "rejected") return t("userStatus.rejected");
    if (status === "disabled") return t("userStatus.disabled");
    return status;
  }

  function roleLabel(role: string | null) {
    if (!role) return "—";
    if (role === "player") return t("userRoles.player");
    if (role === "parent") return t("userRoles.parent");
    if (role === "coach") return t("userRoles.coach");
    return role;
  }

  function formatDate(value: string | null) {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  return (
    <DashboardLayout requiredRole="admin" title={t("users")}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy">
              {t("users")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("usersSubtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                filter === "pending"
                  ? "bg-navy text-white"
                  : "bg-muted text-navy"
              }`}
            >
              {t("usersFilterPending")}
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                filter === "all" ? "bg-navy text-white" : "bg-muted text-navy"
              }`}
            >
              {t("usersFilterAll")}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("userName")}</TableHead>
                <TableHead>{t("userEmail")}</TableHead>
                <TableHead>{t("userRole")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm">
                    {t("usersLoading")}
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{roleLabel(user.role)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          user.status === "active"
                            ? "accepted"
                            : user.status === "rejected"
                              ? "rejected"
                              : "pending"
                        }
                        label={statusLabel(user.status)}
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {user.status === "pending" ? (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            disabled={busyId === user.id}
                            onClick={() => updateStatus(user.id, "active")}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {t("approveUser")}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === user.id}
                            onClick={() => updateStatus(user.id, "rejected")}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {t("rejectUser")}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
