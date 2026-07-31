import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { EmailLocale, FormKind } from "@/lib/email/config";

const NAVY = "#071426";
const GOLD = "#C99A2E";
const CREAM = "#F7F5EF";
const MUTED = "#4B5563";

export type AcknowledgmentEmailProps = {
  locale: EmailLocale;
  kind: FormKind;
  firstName: string | null;
  email: string;
  reference: string;
  receivedAtLabel: string;
  requestTypeLabel: string;
  siteUrl: string;
  logoUrl: string;
};

function copy(locale: EmailLocale, kind: FormKind) {
  if (locale === "en") {
    const introByKind =
      kind === "recruitment"
        ? "We have successfully received your registration request for our trials / academy programme. It remains subject to review and does not guarantee selection."
        : "We have successfully received your request and forwarded it to our team. It will be reviewed carefully, and we will contact you if a response or additional information is required.";

    return {
      subject: "We've received your request — Ninety One Foot Academy",
      preview: "Your request has been successfully sent to our team.",
      greeting: (name: string | null) => (name ? `Hello ${name},` : "Hello,"),
      thanks: "Thank you for contacting Ninety One Foot Academy.",
      body: introByKind,
      summaryTitle: "Request summary",
      typeLabel: "Request type",
      refLabel: "Reference",
      dateLabel: "Received on",
      emailLabel: "Email address",
      cta: "Discover Ninety One Foot Academy",
      disclaimer:
        "This email only confirms that we have received your request. It does not constitute an application approval, invitation, selection or final confirmation.",
      ignore:
        "If you did not make this request, you can ignore this email or contact our team using the official details on our website.",
      regards: "Kind regards,",
      team: "The Ninety One Foot Academy Team",
      location: "Douala, Cameroon",
    };
  }

  const introByKind =
    kind === "recruitment"
      ? "Votre demande d'inscription aux détections / à l'académie a bien été reçue. Elle reste soumise à examen et ne garantit aucune sélection."
      : "Votre demande a bien été reçue et transmise à notre équipe. Elle sera examinée avec attention et nous reviendrons vers vous dans les meilleurs délais si une réponse ou des informations complémentaires sont nécessaires.";

  return {
    subject: "Nous avons bien reçu votre demande — Ninety One Foot Academy",
    preview: "Votre demande a été transmise avec succès à notre équipe.",
    greeting: (name: string | null) => (name ? `Bonjour ${name},` : "Bonjour,"),
    thanks: "Nous vous remercions d'avoir contacté Ninety One Foot Academy.",
    body: introByKind,
    summaryTitle: "Récapitulatif de votre demande",
    typeLabel: "Type de demande",
    refLabel: "Référence",
    dateLabel: "Date de réception",
    emailLabel: "Adresse email",
    cta: "Découvrir Ninety One Foot Academy",
    disclaimer:
      "Cet email confirme uniquement la bonne réception de votre demande. Il ne constitue pas une acceptation, une sélection, une convocation ou une validation définitive.",
    ignore:
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email ou contacter notre équipe à partir des coordonnées officielles présentes sur notre site.",
    regards: "Cordialement,",
    team: "L'équipe Ninety One Foot Academy",
    location: "Douala, Cameroun",
  };
}

export function getAcknowledgmentSubject(locale: EmailLocale) {
  return copy(locale, "contact").subject;
}

export function buildAcknowledgmentText(props: AcknowledgmentEmailProps): string {
  const t = copy(props.locale, props.kind);
  return [
    t.greeting(props.firstName),
    "",
    t.thanks,
    "",
    t.body,
    "",
    t.summaryTitle,
    `${t.typeLabel}: ${props.requestTypeLabel}`,
    `${t.refLabel}: ${props.reference}`,
    `${t.dateLabel}: ${props.receivedAtLabel}`,
    `${t.emailLabel}: ${props.email}`,
    "",
    t.disclaimer,
    "",
    t.ignore,
    "",
    t.regards,
    t.team,
    "Ninety One Foot Academy",
    t.location,
    props.siteUrl,
  ].join("\n");
}

export function AcknowledgmentEmail(props: AcknowledgmentEmailProps) {
  const t = copy(props.locale, props.kind);
  const homeUrl = `${props.siteUrl}/${props.locale}`;

  return (
    <Html lang={props.locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={props.logoUrl}
              width="72"
              height="72"
              alt="Ninety One Foot Academy"
              style={styles.logo}
            />
            <Text style={styles.brand}>Ninety One Foot Academy</Text>
          </Section>

          <Section style={styles.card}>
            <Heading as="h1" style={styles.heading}>
              {t.greeting(props.firstName)}
            </Heading>
            <Text style={styles.paragraph}>{t.thanks}</Text>
            <Text style={styles.paragraph}>{t.body}</Text>

            <Text style={styles.summaryTitle}>{t.summaryTitle}</Text>
            <Section style={styles.summaryBox}>
              <Text style={styles.row}>
                <strong>{t.typeLabel} :</strong> {props.requestTypeLabel}
              </Text>
              <Text style={styles.row}>
                <strong>{t.refLabel} :</strong> {props.reference}
              </Text>
              <Text style={styles.row}>
                <strong>{t.dateLabel} :</strong> {props.receivedAtLabel}
              </Text>
              <Text style={styles.row}>
                <strong>{t.emailLabel} :</strong> {props.email}
              </Text>
            </Section>

            <Section style={styles.ctaWrap}>
              <Button href={homeUrl} style={styles.button}>
                {t.cta}
              </Button>
            </Section>

            <Hr style={styles.hr} />
            <Text style={styles.disclaimer}>{t.disclaimer}</Text>
            <Text style={styles.muted}>{t.ignore}</Text>
            <Text style={styles.paragraph}>
              {t.regards}
              <br />
              <strong>{t.team}</strong>
            </Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              <strong>Ninety One Foot Academy</strong>
              <br />
              {t.location}
              <br />
              <Link href={props.siteUrl} style={styles.footerLink}>
                {props.siteUrl.replace(/^https?:\/\//, "")}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: CREAM,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: "24px 12px",
  },
  container: { maxWidth: "560px", margin: "0 auto" },
  header: { textAlign: "center" as const, padding: "16px 0 24px" },
  logo: { margin: "0 auto 8px", display: "block" },
  brand: {
    color: NAVY,
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    margin: 0,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: `1px solid ${NAVY}14`,
    padding: "32px 28px",
  },
  heading: {
    color: NAVY,
    fontSize: "22px",
    fontWeight: 700,
    margin: "0 0 16px",
  },
  paragraph: {
    color: NAVY,
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 14px",
  },
  summaryTitle: {
    color: NAVY,
    fontSize: "14px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    margin: "20px 0 10px",
  },
  summaryBox: {
    backgroundColor: CREAM,
    borderRadius: "8px",
    borderLeft: `3px solid ${GOLD}`,
    padding: "14px 16px",
    marginBottom: "24px",
  },
  row: {
    color: NAVY,
    fontSize: "14px",
    lineHeight: "1.55",
    margin: "0 0 6px",
  },
  ctaWrap: { textAlign: "center" as const, margin: "8px 0 20px" },
  button: {
    backgroundColor: GOLD,
    color: NAVY,
    fontWeight: 700,
    fontSize: "14px",
    textDecoration: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    display: "inline-block",
  },
  hr: { borderColor: `${NAVY}18`, margin: "20px 0" },
  disclaimer: {
    color: MUTED,
    fontSize: "13px",
    lineHeight: "1.55",
    margin: "0 0 12px",
  },
  muted: {
    color: MUTED,
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 16px",
  },
  footer: { textAlign: "center" as const, padding: "20px 8px 0" },
  footerText: { color: MUTED, fontSize: "12px", lineHeight: "1.6", margin: 0 },
  footerLink: { color: NAVY, textDecoration: "underline" },
};

export default AcknowledgmentEmail;
