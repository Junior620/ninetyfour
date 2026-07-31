import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  AcknowledgmentEmail,
  buildAcknowledgmentText,
  getAcknowledgmentSubject,
  type AcknowledgmentEmailProps,
} from "@/emails/AcknowledgmentEmail";
import {
  AdminNotificationEmail,
  buildAdminNotificationText,
  type AdminNotificationEmailProps,
} from "@/emails/AdminNotificationEmail";
import { getEmailConfig, type EmailLocale, type FormKind } from "./config";

export type AttachmentInput = {
  filename: string;
  content: string; // base64
  contentId?: string;
};

function requestTypeLabel(kind: FormKind, locale: EmailLocale): string {
  if (locale === "en") {
    return kind === "recruitment"
      ? "Trials / academy registration"
      : "Contact message";
  }
  return kind === "recruitment"
    ? "Inscription détection / académie"
    : "Message de contact";
}

function formatReceivedAt(locale: EmailLocale, date = new Date()): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Douala",
  }).format(date);
}

export async function sendAcknowledgment(params: {
  locale: EmailLocale;
  kind: FormKind;
  to: string;
  firstName: string | null;
  reference: string;
  attachments?: AttachmentInput[];
}): Promise<{ sent: boolean; error?: string }> {
  const config = getEmailConfig();
  if (!config.apiKey || !config.from) {
    console.info("[email] acknowledgment skipped — Resend not configured");
    return { sent: false, error: "not_configured" };
  }

  const props: AcknowledgmentEmailProps = {
    locale: params.locale,
    kind: params.kind,
    firstName: params.firstName,
    email: params.to,
    reference: params.reference,
    receivedAtLabel: formatReceivedAt(params.locale),
    requestTypeLabel: requestTypeLabel(params.kind, params.locale),
    siteUrl: config.siteUrl,
    logoUrl: `${config.siteUrl}/logo-crest.png`,
  };

  try {
    const resend = new Resend(config.apiKey);
    const html = await render(AcknowledgmentEmail(props));
    const text = buildAcknowledgmentText(props);

    const { error } = await resend.emails.send({
      from: config.from,
      to: params.to,
      replyTo: config.replyTo,
      subject: getAcknowledgmentSubject(params.locale),
      html,
      text,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        ...(a.contentId ? { contentId: a.contentId } : {}),
      })),
    });

    if (error) {
      console.error("[email] acknowledgment failed", error);
      return { sent: false, error: "send_failed" };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] acknowledgment exception", e);
    return { sent: false, error: "send_failed" };
  }
}

export async function sendAdminNotification(params: {
  locale: EmailLocale;
  kind: FormKind;
  reference: string;
  submitterName: string;
  submitterEmail: string;
  summaryLines?: string[];
  attachments?: AttachmentInput[];
}): Promise<{ sent: boolean; error?: string }> {
  const config = getEmailConfig();
  if (!config.apiKey || !config.from || !config.adminTo) {
    console.info("[email] admin notification skipped — not configured");
    return { sent: false, error: "not_configured" };
  }

  const props: AdminNotificationEmailProps = {
    locale: params.locale,
    kind: params.kind,
    reference: params.reference,
    receivedAtLabel: formatReceivedAt(params.locale),
    requestTypeLabel: requestTypeLabel(params.kind, params.locale),
    submitterName: params.submitterName,
    submitterEmail: params.submitterEmail,
    summaryLines: params.summaryLines,
  };

  try {
    const resend = new Resend(config.apiKey);
    const html = await render(AdminNotificationEmail(props));
    const text = buildAdminNotificationText(props);
    const subject =
      params.locale === "en"
        ? `[NOFA] New ${props.requestTypeLabel} — ${params.reference}`
        : `[NOFA] Nouvelle ${props.requestTypeLabel} — ${params.reference}`;

    const { error } = await resend.emails.send({
      from: config.from,
      to: config.adminTo,
      replyTo: params.submitterEmail,
      subject,
      html,
      text,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        ...(a.contentId ? { contentId: a.contentId } : {}),
      })),
    });

    if (error) {
      console.error("[email] admin notification failed", error);
      return { sent: false, error: "send_failed" };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] admin notification exception", e);
    return { sent: false, error: "send_failed" };
  }
}

export { requestTypeLabel, formatReceivedAt };
