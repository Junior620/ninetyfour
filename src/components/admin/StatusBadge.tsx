import { cn } from "@/lib/utils";
import type { AppStatus } from "@/lib/admin/labels";

const styles: Record<AppStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  accepted: "bg-emerald-100 text-emerald-900",
  rejected: "bg-red-100 text-red-900",
  interview: "bg-sky-100 text-sky-900",
  reviewed: "bg-blue-100 text-blue-900",
};

export function StatusBadge({
  status,
  label,
}: {
  status: AppStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[status]
      )}
    >
      {label}
    </span>
  );
}
