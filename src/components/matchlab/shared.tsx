"use client";
import { createContext, useContext, useState } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { Graph, Member, Filters } from "@/lib/matchlab/schema";
import { fr as t, errorMessage } from "@/lib/matchlab/messages";
export const fundamentalKeys = [
  "technique",
  "tactical",
  "physical",
  "mental",
] as const;
export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
/** Authorised private photo (consent checked again by the media API) or initials. */
export function PlayerAvatar({
  playerId,
  name,
  size = 34,
}: {
  playerId: string;
  name?: string;
  size?: number;
}) {
  const { data } = useLab();
  const photo = data.graph.media.find(
    (m) => m.player_id === playerId && m.purpose === "photo",
  );
  return (
    <span
      className="ml-player-avatar"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {photo ? (
        <Image
          src={`/api/matchlab/media?id=${photo.id}`}
          width={size}
          height={size}
          unoptimized
          alt=""
        />
      ) : (
        initials(name) || "N91"
      )}
    </span>
  );
}
export const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
/** Calendar date (YYYY-MM-DD) read at noon so no time zone shifts the day. */
export const formatDay = (
  day: string,
  month: "short" | "long" = "short",
) =>
  new Date(`${day}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month,
    year: "numeric",
  });
/** Jersey of a player within one season and category (1–99). */
export function jerseyFor(
  graph: Graph,
  playerId: string,
  seasonId?: string,
  categoryId?: string,
) {
  return graph.memberships.find(
    (m) =>
      m.player_id === playerId &&
      m.season_id === seasonId &&
      m.category_id === categoryId,
  )?.jersey;
}
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
  tour,
}: {
  title: string;
  /** Without a trigger the dialog only opens programmatically (read-only file). */
  trigger?: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Guided tour anchor on the trigger. */
  tour?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <Dialog.Trigger
          className="ml-button"
          aria-label={title}
          data-tour={tour}
        >
          {trigger}
        </Dialog.Trigger>
      )}
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
