import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { persistRecruitment } from "@/lib/recruitment/persist";
import { recruitmentDocuments, validateRecruitmentAttachments } from "@/lib/recruitment/attachments";

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createRecruitmentSchema } from "@/lib/validations/schemas";
import { FicheEnregistrementPdf } from "@/lib/recruitment/pdf/FicheEnregistrementPdf";
import { getSupabaseAdminClient } from "@/lib/supabase/serverClient";
import { generateReference } from "@/lib/email/reference";
import { extractFirstName, maskEmail } from "@/lib/email/mask";
import {
  checkRateLimit,
  getClientIp,
  getIdempotentResult,
  isHoneypotTriggered,
  setIdempotentResult,
} from "@/lib/email/rate-limit";
import { sendAcknowledgment, sendAdminNotification } from "@/lib/email/send";
import type { EmailLocale } from "@/lib/email/config";

function toDataUri(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function getFormString(form: FormData, key: string) {
  const v = form.get(key);
  if (v === null) return undefined;
  if (typeof v === "string") return v;
  return undefined;
}

function getFormBool(form: FormData, key: string) {
  const v = form.get(key);
  if (typeof v !== "string") return false;
  return v === "true";
}

type SuccessPayload = {
  success: true;
  reference: string;
  maskedEmail: string;
  emailSent: boolean;
  applicationId: string | null;
  pdfSignedUrl: string | null;
  pdfBase64: string;
  fileName: string;
};

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    if (isHoneypotTriggered(getFormString(form, "website"))) {
      return NextResponse.json({ success: false, error: "invalid_request" }, { status: 400 });
    }
    const ip = getClientIp(request);
    if (!checkRateLimit(`recruitment:${ip}`)) {
      return NextResponse.json(
        { success: false, error: "rate_limited" },
        { status: 429 }
      );
    }

    const idempotencyKey = getFormString(form, "idempotencyKey");
    const localeRaw = getFormString(form, "locale");
    const locale: EmailLocale = localeRaw === "en" ? "en" : "fr";

    const payload = {
      playerNumber: getFormString(form, "playerNumber"),
      category: getFormString(form, "category"),
      zone: getFormString(form, "zone"),
      lastName: getFormString(form, "lastName"),
      firstNames: getFormString(form, "firstNames"),
      dobDay: getFormString(form, "dobDay"),
      dobMonth: getFormString(form, "dobMonth"),
      dobYear: getFormString(form, "dobYear"),
      age: getFormString(form, "age"),
      nationality: getFormString(form, "nationality"),
      birthPlace: getFormString(form, "birthPlace"),
      city: getFormString(form, "city"),
      neighborhood: getFormString(form, "neighborhood"),
      heightCm: getFormString(form, "heightCm"),
      weightKg: getFormString(form, "weightKg"),
      playerPhone: getFormString(form, "playerPhone"),
      fatherTutorName: getFormString(form, "fatherTutorName"),
      fatherTutorPhone: getFormString(form, "fatherTutorPhone"),
      motherName: getFormString(form, "motherName"),
      motherPhone: getFormString(form, "motherPhone"),
      email: getFormString(form, "email"),
      address: getFormString(form, "address"),
      currentClub: getFormString(form, "currentClub"),
      previousClubs: getFormString(form, "previousClubs"),
      school: getFormString(form, "school"),
      primaryPosition: getFormString(form, "primaryPosition"),
      secondaryPosition: getFormString(form, "secondaryPosition"),
      strongFoot: getFormString(form, "strongFoot"),
      injuryCurrent: getFormBool(form, "injuryCurrent"),
      injuryDetails: getFormString(form, "injuryDetails"),
      allergies: getFormString(form, "allergies"),
      birthCertificateProvided: getFormBool(form, "birthCertificateProvided"),
      parentalAuthProvided: getFormBool(form, "parentalAuthProvided"),
      medicalCertificateProvided: getFormBool(form, "medicalCertificateProvided"),
      feesPaidProvided: getFormBool(form, "feesPaidProvided"),
      amountPaidXaf: getFormString(form, "amountPaidXaf"),
      paymentMethod: getFormString(form, "paymentMethod"),
      paymentMethodOther: getFormString(form, "paymentMethodOther"),
      parentDeclarationName: getFormString(form, "parentDeclarationName"),
      consent: getFormBool(form, "consent"),
    };

    const data = createRecruitmentSchema(locale).parse(payload);
    const files = {
      photo: form.get("photo"),
      birthCertificate: form.get("birthCertificate"),
      parentalAuth: form.get("parentalAuth"),
      medicalCertificate: form.get("medicalCertificate"),
      feesReceipt: form.get("feesReceipt"),
    };
    const attachmentIssues = validateRecruitmentAttachments(data, files);
    if (attachmentIssues.length) {
      return NextResponse.json({ success: false, error: "invalid_attachments", issues: attachmentIssues }, { status: 400 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "service_unavailable" }, { status: 503 });
    }
    const cacheKey = idempotencyKey ? `recruitment:${data.email}:${idempotencyKey}` : undefined;
    const cached = getIdempotentResult<SuccessPayload>(cacheKey);
    if (cached) return NextResponse.json(cached);
    const photo = files.photo as File;
    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const photoDataUri = toDataUri(photoBuffer, photo.type);
    let logoBuffer: Buffer | null = null;
    for (const name of ["logo-crest.png", "logo.png"]) {
      try {
        logoBuffer = await fs.readFile(path.join(process.cwd(), "public", name));
        break;
      } catch { /* Try the alternate club logo. */ }
    }
    const logoDataUri = logoBuffer ? toDataUri(logoBuffer, "image/png") : null;
    const reference = generateReference("recruitment");
    const fullName = `${data.firstNames} ${data.lastName}`.trim();

    const pdfBuffer = await renderToBuffer(FicheEnregistrementPdf({
      photoDataUri, logoDataUri, data,
    }));
    const pdfBase64 = pdfBuffer.toString("base64");
    const fileName =
      `fiche-enregistrement-${data.lastName}-${data.firstNames}.pdf`.replace(
        /\s+/g,
        "-"
      );

    const supabase = getSupabaseAdminClient();
    const batch = randomUUID();
    const photoPath = `photos/${batch}/photo.${photo.type === "image/png" ? "png" : "jpg"}`;
    const pdfPath = `pdfs/${batch}/recruitment.pdf`;
    const uploads = [
      { bucket: "recruitment-photos", path: photoPath, body: photoBuffer, contentType: photo.type },
      { bucket: "recruitment-pdfs", path: pdfPath, body: pdfBuffer, contentType: "application/pdf" },
    ];
    const docsPaths: Record<string, string> = {};
    const storageKeys = { birthCertificate: "birth", parentalAuth: "parental", medicalCertificate: "medical", feesReceipt: "fees" } as const;
    for (const document of recruitmentDocuments) {
      if (!data[document.flag]) continue;
      const file = files[document.field] as File;
      const key = storageKeys[document.field];
      const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
      const docPath = `docs/${batch}/${key}.${ext}`;
      uploads.push({ bucket: "recruitment-docs", path: docPath, body: Buffer.from(await file.arrayBuffer()), contentType: file.type });
      docsPaths[key] = docPath;
    }
    const applicationId = await persistRecruitment(supabase, uploads, {
      form_data: { ...data, reference, locale }, photo_path: photoPath,
      pdf_path: pdfPath, docs_paths: docsPaths, status: "PENDING",
    });
    // Cache the durable receipt before optional notification services can fail.
    const success: SuccessPayload = {
      success: true, reference, maskedEmail: maskEmail(data.email), emailSent: false,
      applicationId, pdfSignedUrl: null, pdfBase64, fileName,
    };
    setIdempotentResult(cacheKey, success);
    try {
      const { data: signed } = await supabase.storage.from("recruitment-pdfs").createSignedUrl(pdfPath, 3600);
      success.pdfSignedUrl = signed?.signedUrl ?? null;
    } catch { /* The saved PDF is still available through the admin area. */ }
    const pdfAttachment = [{ filename: fileName, content: pdfBase64 }];
    try {
      await sendAdminNotification({
        locale, kind: "recruitment", reference, submitterName: fullName, submitterEmail: data.email,
        summaryLines: [locale === "en" ? `Category: ${data.category} · Zone: ${data.zone}` : `Catégorie : ${data.category} · Zone : ${data.zone}`],
        attachments: pdfAttachment,
      });
    } catch { /* A notification cannot invalidate an application already saved. */ }
    try {
      const ack = await sendAcknowledgment({
        locale, kind: "recruitment", to: data.email,
        firstName: extractFirstName(data.firstNames), reference, attachments: pdfAttachment,
      });
      success.emailSent = ack.sent;
    } catch { /* The response accurately reports that no acknowledgement was sent. */ }
    setIdempotentResult(cacheKey, success);
    return NextResponse.json(success);
  } catch (error) {
    console.error("[Recruitment error]", error instanceof ZodError ? "validation" : "persistence");
    return NextResponse.json(
      { success: false, error: error instanceof ZodError ? "validation_failed" : "service_unavailable" },
      { status: error instanceof ZodError ? 400 : 503 }
    );
  }
}
