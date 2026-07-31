import { promises as fs } from "fs";
import path from "path";

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { recruitmentSchema } from "@/lib/validations/schemas";
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
      return NextResponse.json({
        success: true,
        reference: "NOFA-RECRUITMENT-IGNORED",
        maskedEmail: maskEmail(getFormString(form, "email") || "x@x.com"),
        emailSent: false,
        applicationId: null,
        pdfSignedUrl: null,
        pdfBase64: "",
        fileName: "",
      } satisfies SuccessPayload);
    }

    const ip = getClientIp(request);
    if (!checkRateLimit(`recruitment:${ip}`)) {
      return NextResponse.json(
        { success: false, error: "rate_limited" },
        { status: 429 }
      );
    }

    const idempotencyKey = getFormString(form, "idempotencyKey");
    const cached = getIdempotentResult<SuccessPayload>(idempotencyKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const photo = form.get("photo");
    if (!(photo instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing photo" },
        { status: 400 }
      );
    }

    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const photoDataUri = toDataUri(photoBuffer, photo.type || "image/jpeg");

    let logoBuffer: Buffer | null = null;
    for (const name of ["logo-crest.png", "logo.png"]) {
      try {
        logoBuffer = await fs.readFile(path.join(process.cwd(), "public", name));
        break;
      } catch {
        // try next
      }
    }
    const logoDataUri = logoBuffer ? toDataUri(logoBuffer, "image/png") : null;

    const birthCertificate = form.get("birthCertificate");
    const parentalAuth = form.get("parentalAuth");
    const medicalCertificate = form.get("medicalCertificate");
    const feesReceipt = form.get("feesReceipt");

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

    const data = recruitmentSchema.parse(payload);
    const reference = generateReference("recruitment");
    const fullName = `${data.firstNames} ${data.lastName}`.trim();

    const pdfBuffer = await renderToBuffer(
      <FicheEnregistrementPdf
        photoDataUri={photoDataUri}
        logoDataUri={logoDataUri}
        data={data}
      />
    );

    const pdfBase64 = pdfBuffer.toString("base64");
    const fileName =
      `fiche-enregistrement-${data.lastName}-${data.firstNames}.pdf`.replace(
        /\s+/g,
        "-"
      );

    let pdfSignedUrl: string | null = null;
    let applicationId: string | null = null;

    const canUseSupabase =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (canUseSupabase) {
      const supabase = getSupabaseAdminClient();

      const now = Date.now();
      const photoPath = `photos/${now}_${photo.name || "photo.jpg"}`;
      const pdfPath = `pdfs/${now}_recruitment.pdf`;

      await supabase.storage.from("recruitment-photos").upload(photoPath, photoBuffer, {
        contentType: photo.type || "image/jpeg",
        upsert: true,
      });

      const docsToUpload: { file: File | null | undefined; key: string }[] = [
        {
          file: birthCertificate instanceof File ? birthCertificate : undefined,
          key: "birth",
        },
        {
          file: parentalAuth instanceof File ? parentalAuth : undefined,
          key: "parental",
        },
        {
          file: medicalCertificate instanceof File ? medicalCertificate : undefined,
          key: "medical",
        },
        {
          file: feesReceipt instanceof File ? feesReceipt : undefined,
          key: "fees",
        },
      ];

      const docsPaths: Record<string, string> = {};
      for (const d of docsToUpload) {
        if (!d.file) continue;
        const buffer = Buffer.from(await d.file.arrayBuffer());
        const ext = d.file.name?.split(".").pop() || "bin";
        const docPath = `docs/${now}_${d.key}.${ext}`;
        await supabase.storage.from("recruitment-docs").upload(docPath, buffer, {
          contentType: d.file.type,
          upsert: true,
        });
        docsPaths[d.key] = docPath;
      }

      await supabase.storage.from("recruitment-pdfs").upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

      const { data: signed } = await supabase.storage
        .from("recruitment-pdfs")
        .createSignedUrl(pdfPath, 60 * 60);
      pdfSignedUrl = signed?.signedUrl ?? null;

      try {
        const { data: rowData } = await supabase
          .from("recruitment_applications")
          .insert({
            form_data: { ...data, reference, locale },
            photo_path: photoPath,
            pdf_path: pdfPath,
            docs_paths: docsPaths,
            status: "PENDING",
          })
          .select("id")
          .single();

        if (rowData?.id) applicationId = rowData.id as string;
      } catch {
        // table may be missing
      }
    }

    const pdfAttachment = [{ filename: fileName, content: pdfBase64 }];

    await sendAdminNotification({
      locale,
      kind: "recruitment",
      reference,
      submitterName: fullName,
      submitterEmail: data.email,
      summaryLines: [
        locale === "en"
          ? `Category: ${data.category} · Zone: ${data.zone}`
          : `Catégorie : ${data.category} · Zone : ${data.zone}`,
      ],
      attachments: pdfAttachment,
    });

    const ack = await sendAcknowledgment({
      locale,
      kind: "recruitment",
      to: data.email,
      firstName: extractFirstName(data.firstNames),
      reference,
      attachments: pdfAttachment,
    });

    const success: SuccessPayload = {
      success: true,
      reference,
      maskedEmail: maskEmail(data.email),
      emailSent: ack.sent,
      applicationId,
      pdfSignedUrl,
      pdfBase64,
      fileName,
    };
    setIdempotentResult(idempotencyKey, success);
    return NextResponse.json(success);
  } catch (error) {
    console.error("[Recruitment error]", error);
    return NextResponse.json(
      { success: false, error: "Recruitment failed" },
      { status: 500 }
    );
  }
}
