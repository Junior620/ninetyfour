export const PHOTO_ACCEPT = "image/jpeg,image/png";
export const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png";
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const recruitmentDocuments = [
  { field: "birthCertificate", flag: "birthCertificateProvided", fr: "Acte de naissance", en: "Birth certificate" },
  { field: "parentalAuth", flag: "parentalAuthProvided", fr: "Autorisation parentale", en: "Parental authorization" },
  { field: "medicalCertificate", flag: "medicalCertificateProvided", fr: "Certificat médical", en: "Medical certificate" },
  { field: "feesReceipt", flag: "feesPaidProvided", fr: "Justificatif de paiement", en: "Fee receipt" },
] as const;

export type DocumentField = typeof recruitmentDocuments[number]["field"];
export type AttachmentField = "photo" | DocumentField;
type DocumentFlag = typeof recruitmentDocuments[number]["flag"];
export type RecruitmentFiles = Partial<Record<AttachmentField, unknown>>;
export type AttachmentIssue = { field: AttachmentField; code: "missing" | "empty" | "type" | "size" };

/** Shared by the browser and route; a claimed document must be an actual nonempty File. */
export function validateAttachment(field: AttachmentField, value: unknown, required = true): AttachmentIssue | null {
  if (value === null || value === undefined) return required ? { field, code: "missing" } : null;
  if (!(value instanceof File)) return { field, code: "missing" };
  if (!value.size) return { field, code: "empty" };
  const isPhoto = field === "photo";
  const types = isPhoto ? PHOTO_ACCEPT : DOCUMENT_ACCEPT;
  if (!types.split(",").includes(value.type)) return { field, code: "type" };
  if (value.size > (isPhoto ? PHOTO_MAX_BYTES : DOCUMENT_MAX_BYTES)) return { field, code: "size" };
  return null;
}

export function validateRecruitmentAttachments(flags: Record<DocumentFlag, boolean>, files: RecruitmentFiles): AttachmentIssue[] {
  const issues: AttachmentIssue[] = [];
  const photoIssue = validateAttachment("photo", files.photo);
  if (photoIssue) issues.push(photoIssue);
  for (const document of recruitmentDocuments) {
    const issue = validateAttachment(document.field, files[document.field], flags[document.flag]);
    if (issue) issues.push(issue);
  }
  return issues;
}

export function attachmentMessage(issue: AttachmentIssue, locale: string): string {
  const isFr = locale === "fr";
  const isPhoto = issue.field === "photo";
  const document = recruitmentDocuments.find(item => item.field === issue.field);
  const label = isPhoto ? (isFr ? "Photo d’identité" : "ID photo") : (isFr ? document!.fr : document!.en);
  if (issue.code === "missing") return isFr ? `Veuillez importer : ${label}.` : `Please upload: ${label}.`;
  if (issue.code === "empty") return isFr ? `${label} : le fichier est vide.` : `${label}: the file is empty.`;
  if (issue.code === "size") return isFr ? `${label} : maximum ${isPhoto ? 5 : 10} Mo.` : `${label}: maximum ${isPhoto ? 5 : 10} MB.`;
  return isFr ? `${label} : formats acceptés ${isPhoto ? "JPEG ou PNG" : "PDF, JPEG ou PNG"}.` : `${label}: accepted formats ${isPhoto ? "JPEG or PNG" : "PDF, JPEG or PNG"}.`;
}
