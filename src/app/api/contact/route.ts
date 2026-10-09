import { NextResponse } from "next/server";
import { ZodError } from "zod";
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
      return NextResponse.json({ success: false, error: "invalid_request" }, { status: 400 });
    }

    const ip = getClientIp(request);
    if (!checkRateLimit(`contact:${ip}`)) {
      return NextResponse.json(
        { success: false, error: "rate_limited" },
        { status: 429 }
      );
    }

    const data = contactSchema.parse(body);
    const cacheKey = data.idempotencyKey ? `contact:${data.email}:${data.idempotencyKey}` : undefined;
    const cached = getIdempotentResult<SuccessPayload>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const locale = (data.locale ?? "fr") as EmailLocale;
    const reference = generateReference("contact");
    const masked = maskEmail(data.email);

    const delivery = await sendAdminNotification({
      locale,
      kind: "contact",
      reference,
      submitterName: data.name,
      submitterEmail: data.email,
      summaryLines: [
        locale === "en" ? `Subject: ${data.subject}` : `Sujet : ${data.subject}`,
        data.message,
      ],
    });

    if (!delivery.sent) {
      return NextResponse.json({ success: false, error: "service_unavailable" }, { status: 503 });
    }

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
    setIdempotentResult(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[Contact error]", error instanceof ZodError ? "validation" : "delivery");
    return NextResponse.json(
      { success: false, error: error instanceof ZodError || error instanceof SyntaxError ? "validation_failed" : "service_unavailable" },
      { status: error instanceof ZodError || error instanceof SyntaxError ? 400 : 503 }
    );
  }
}
