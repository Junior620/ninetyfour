import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/schemas";
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

type SuccessPayload = {
  success: true;
  reference: string;
  maskedEmail: string;
  emailSent: boolean;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (isHoneypotTriggered(body?.website)) {
      return NextResponse.json({
        success: true,
        reference: "NOFA-CONTACT-IGNORED",
        maskedEmail: maskEmail(
          typeof body?.email === "string" ? body.email : "x@x.com"
        ),
        emailSent: false,
      } satisfies SuccessPayload);
    }

    const ip = getClientIp(request);
    if (!checkRateLimit(`contact:${ip}`)) {
      return NextResponse.json(
        { success: false, error: "rate_limited" },
        { status: 429 }
      );
    }

    const cached = getIdempotentResult<SuccessPayload>(body?.idempotencyKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const data = contactSchema.parse(body);
    const locale = (data.locale ?? "fr") as EmailLocale;
    const reference = generateReference("contact");
    const masked = maskEmail(data.email);

    console.info("[Contact received]", {
      reference,
      subject: data.subject.slice(0, 80),
      locale,
      timestamp: new Date().toISOString(),
    });

    await sendAdminNotification({
      locale,
      kind: "contact",
      reference,
      submitterName: data.name,
      submitterEmail: data.email,
      summaryLines: [
        locale === "en" ? `Subject: ${data.subject}` : `Sujet : ${data.subject}`,
      ],
    });

    const ack = await sendAcknowledgment({
      locale,
      kind: "contact",
      to: data.email,
      firstName: extractFirstName(data.name),
      reference,
    });

    const payload: SuccessPayload = {
      success: true,
      reference,
      maskedEmail: masked,
      emailSent: ack.sent,
    };
    setIdempotentResult(data.idempotencyKey, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[Contact error]", error);
    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 400 }
    );
  }
}
