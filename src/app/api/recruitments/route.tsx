import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";

import { recruitmentSchema } from "@/lib/validations/schemas";
import { FicheEnregistrementPdf } from "@/lib/recruitment/pdf/FicheEnregistrementPdf";
import { getSupabaseAdminClient } from "@/lib/supabase/serverClient";

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

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const photo = form.get("photo");
    if (!(photo instanceof File)) {
      return NextResponse.json({ success: false, error: "Missing photo" }, { status: 400 });
    }

    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const photoDataUri = toDataUri(photoBuffer, photo.type || "image/jpeg");

    const backgroundPath = path.join(
      process.cwd(),
      "public",
      "Fiche_Enregistrement_Ninety_One_Foot_Academy_Premium_page-0001.jpg"
    );
    const backgroundBuffer = await readFile(backgroundPath);
    const backgroundDataUri = toDataUri(backgroundBuffer, "image/jpeg");

    // Documents files
    const birthCertificate = form.get("birthCertificate");
    const parentalAuth = form.get("parentalAuth");
    const medicalCertificate = form.get("medicalCertificate");
    const feesReceipt = form.get("feesReceipt");

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
      playerPhone: getFormString(form, "playerPhone"),
      fatherTutorName: getFormString(form, "fatherTutorName"),
      fatherTutorPhone: getFormString(form, "fatherTutorPhone"),
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

    const pdfBuffer = await renderToBuffer(
      <FicheEnregistrementPdf
        backgroundDataUri={backgroundDataUri}
        photoDataUri={photoDataUri}
        data={data}
      />
    );

    const pdfBase64 = pdfBuffer.toString("base64");

    let pdfSignedUrl: string | null = null;
    let applicationId: string | null = null;

    const canUseSupabase =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (canUseSupabase) {
      const supabase = getSupabaseAdminClient();

      const now = Date.now();
      const photoPath = `photos/${now}_${photo.name || "photo.jpg"}`;
      const pdfPath = `pdfs/${now}_recruitment.pdf`;

      // Upload photo
      await supabase.storage.from("recruitment-photos").upload(photoPath, photoBuffer, {
        contentType: photo.type || "image/jpeg",
        upsert: true,
      });

      // Upload docs
      const docsToUpload: { file: File | null | undefined; key: string }[] = [
        { file: birthCertificate instanceof File ? birthCertificate : undefined, key: "birth" },
        { file: parentalAuth instanceof File ? parentalAuth : undefined, key: "parental" },
        { file: medicalCertificate instanceof File ? medicalCertificate : undefined, key: "medical" },
        { file: feesReceipt instanceof File ? feesReceipt : undefined, key: "fees" },
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

      // Upload pdf
      await supabase.storage.from("recruitment-pdfs").upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

      const { data: signed } = await supabase.storage
        .from("recruitment-pdfs")
        .createSignedUrl(pdfPath, 60 * 60);
      pdfSignedUrl = signed?.signedUrl ?? null;

      // Create row (optional: table must exist)
      try {
        const { data: rowData } = await supabase
          .from("recruitment_applications")
          .insert({
            form_data: data,
            photo_path: photoPath,
            pdf_path: pdfPath,
            docs_paths: docsPaths,
            status: "PENDING",
          })
          .select("id")
          .single();

        if (rowData?.id) applicationId = rowData.id as string;
      } catch {
        // ignore if table isn't configured yet
      }
    }

    // Emails (optional)
    const canUseResend = !!process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;
    const senderEmail = process.env.SENDER_EMAIL;

    if (canUseResend && adminEmail && senderEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const pdfUrl = pdfSignedUrl ?? "";

      await resend.emails.send({
        from: senderEmail,
        to: data.email,
        subject: isFrench(data) ? "Votre PDF de candidature" : "Your recruitment PDF",
        text: pdfUrl
          ? `Bonjour,\n\nVoici votre PDF de candidature : ${pdfUrl}\n\nCordialement,\nNinety One Foot Academy`
          : `Bonjour,\n\nVotre PDF a été généré.\n\nCordialement,\nNinety One Foot Academy`,
      });

      await resend.emails.send({
        from: senderEmail,
        to: adminEmail,
        subject: "Nouvelle inscription - Recruitment",
        text: `Une nouvelle candidature a été soumise.\n\nNom: ${data.firstNames} ${data.lastName}\nVille: ${data.school}\nPDF: ${
          pdfUrl || "(non stocke)"
        }`,
      });
    }

    return NextResponse.json({
      success: true,
      applicationId,
      pdfSignedUrl,
      pdfBase64,
      fileName: `fiche-enregistrement-${data.lastName}-${data.firstNames}.pdf`.replace(/\s+/g, "-"),
    });
  } catch (error) {
    console.error("[Recruitment error]", error);
    return NextResponse.json({ success: false, error: "Recruitment failed" }, { status: 500 });
  }
}

function isFrench(_data: unknown) {
  // API ne reçoit pas la locale pour l’instant; par défaut FR.
  return true;
}

