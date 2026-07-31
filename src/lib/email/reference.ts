import { randomBytes } from "crypto";
import type { FormKind } from "./config";

const KIND_LABEL: Record<FormKind, string> = {
  contact: "CONTACT",
  recruitment: "RECRUITMENT",
};

export function generateReference(kind: FormKind, date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const code = randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
  return `NOFA-${KIND_LABEL[kind]}-${y}${m}${d}-${code}`;
}
