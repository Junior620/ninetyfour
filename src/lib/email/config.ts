import { getSiteUrl } from "@/lib/site-url";

export type EmailLocale = "fr" | "en";
export type FormKind = "contact" | "recruitment";

export function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from =
    process.env.EMAIL_FROM?.trim() ||
    process.env.SENDER_EMAIL?.trim() ||
    "";
  const replyTo =
    process.env.EMAIL_REPLY_TO?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    process.env.SENDER_EMAIL?.trim() ||
    "";
  const adminTo =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    "";

  return {
    apiKey,
    from,
    replyTo: replyTo || undefined,
    adminTo,
    siteUrl: getSiteUrl(),
    isConfigured: Boolean(apiKey && from && adminTo),
  };
}
