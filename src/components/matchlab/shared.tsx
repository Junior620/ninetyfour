"use client";
import { createContext, useContext, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { Graph, Member, Filters } from "@/lib/matchlab/schema";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
export type LabData = {
  graph: Graph;
  member: Member;
  email: string;
  alerts: {
    id: string;
    match_id: string;
    updated_at: string;
    ml_alert_reads: { user_id: string }[];
  }[];
  scopes: { season_id: string; category_id: string }[];
  settings: {
    retention_days: number | null;
    consent_policy: string | null;
    version: number;
  };
  filters: Filters;
};
export const LabContext = createContext<{
  data: LabData;
  refresh: () => Promise<void>;
} | null>(null);
export function useLab() {
  const context = useContext(LabContext);
  if (!context) throw new Error("Missing MatchLab provider");
  return context;
}
export async function api(path: string, body: unknown) {
  const response = await fetch(`/api/matchlab/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.code);
  return result;
}
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { refresh } = useLab();
  return {
    busy,
    error,
    success,
    run: async (work: () => Promise<void>, reload = true) => {
      setBusy(true);
      setError("");
      setSuccess("");
      try {
        await work();
        if (reload) await refresh();
        setSuccess(t.saved);
        return true;
      } catch (e) {
        setError(
          errorMessage(e instanceof Error ? e.message : "INTERNAL_ERROR"),
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
    clear: () => {
      setError("");
      setSuccess("");
    },
  };
}
export function Feedback({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  return (
    <>
      {error && (
        <p className="ml-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="ml-success" role="status">
          {success}
        </p>
      )}
    </>
  );
}
export function Modal({
  title,
  trigger,
  children,
  open,
  onOpenChange,
}: {
  title: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger className="ml-button" aria-label={title}>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="ml-backdrop" />
        <Dialog.Popup className="ml-modal">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Close className="ml-modal-close" aria-label={t.close}>
            <X size={20} />
          </Dialog.Close>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="ml-heading">
      <div>
        {eyebrow && <p className="ml-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
export function Empty({ text = t.empty }: { text?: string }) {
  return (
    <div className="ml-empty">
      <span aria-hidden>↗</span>
      <p>{text}</p>
    </div>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`ml-badge ml-badge-${value}`}>
      {t[value as "draft" | "evaluated" | "reviewed"] || value}
    </span>
  );
}
export function ScopeFields({
  season,
  category,
}: {
  season?: string;
  category?: string;
}) {
  const { data } = useLab();
  const seasons = data.graph.seasons.filter(
    (s) =>
      data.member.role === "direction" ||
      data.scopes.some((a) => a.season_id === s.id),
  );
  return (
    <>
      <label>
        {t.season}
        <select
          name="season_id"
          required
          defaultValue={season || data.filters.season || ""}
        >
          <option value="">—</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.category}
        <select
          name="category_id"
          required
          defaultValue={category || data.filters.category || ""}
        >
          <option value="">—</option>
          {["U-14", "U-16", "U-17", "U-18"]
            .filter(
              (c) =>
                data.member.role === "direction" ||
                data.scopes.some((s) => s.category_id === c),
            )
            .map((c) => (
              <option key={c}>{c}</option>
            ))}
        </select>
      </label>
    </>
  );
}
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (n: number) => void;
}) {
  return total > 20 ? (
    <div className="ml-pagination">
      <button
        className="ml-button secondary"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        {t.previous}
      </button>
      <span>
        {page} / {Math.ceil(total / 20)}
      </span>
      <button
        className="ml-button secondary"
        disabled={page * 20 >= total}
        onClick={() => onChange(page + 1)}
      >
        {t.next}
      </button>
    </div>
  ) : null;
}
