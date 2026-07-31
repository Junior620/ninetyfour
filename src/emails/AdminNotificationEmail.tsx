import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { EmailLocale, FormKind } from "@/lib/email/config";

const NAVY = "#071426";
const GOLD = "#C99A2E";
const CREAM = "#F7F5EF";

export type AdminNotificationEmailProps = {
  locale: EmailLocale;
  kind: FormKind;
  reference: string;
  receivedAtLabel: string;
  requestTypeLabel: string;
  submitterName: string;
  submitterEmail: string;
  summaryLines?: string[];
};

export function buildAdminNotificationText(
  props: AdminNotificationEmailProps
): string {
  const lines = [
    `New ${props.requestTypeLabel}`,
    `Reference: ${props.reference}`,
    `Received: ${props.receivedAtLabel}`,
    `Name: ${props.submitterName}`,
    `Email: ${props.submitterEmail}`,
    ...(props.summaryLines ?? []),
  ];
  return lines.join("\n");
}

export function AdminNotificationEmail(props: AdminNotificationEmailProps) {
  const isFr = props.locale === "fr";
  return (
    <Html lang={props.locale}>
      <Head />
      <Preview>
        {isFr
          ? `Nouvelle demande ${props.reference}`
          : `New request ${props.reference}`}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Heading as="h1" style={styles.heading}>
              {isFr ? "Nouvelle demande reçue" : "New request received"}
            </Heading>
            <Text style={styles.row}>
              <strong>{isFr ? "Type" : "Type"}:</strong> {props.requestTypeLabel}
            </Text>
            <Text style={styles.row}>
              <strong>{isFr ? "Référence" : "Reference"}:</strong>{" "}
              {props.reference}
            </Text>
            <Text style={styles.row}>
              <strong>{isFr ? "Date" : "Date"}:</strong> {props.receivedAtLabel}
            </Text>
            <Text style={styles.row}>
              <strong>{isFr ? "Nom" : "Name"}:</strong> {props.submitterName}
            </Text>
            <Text style={styles.row}>
              <strong>Email:</strong> {props.submitterEmail}
            </Text>
            {(props.summaryLines ?? []).map((line) => (
              <Text key={line} style={styles.row}>
                {line}
              </Text>
            ))}
            <Text style={styles.note}>
              {isFr
                ? "Un accusé de réception a été envoyé au demandeur (si l’envoi email est configuré)."
                : "An acknowledgment email was sent to the requester (if email is configured)."}
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: `1px solid ${NAVY}14`,
    borderTop: `4px solid ${GOLD}`,
    padding: "28px 24px",
  },
  heading: {
    color: NAVY,
    fontSize: "20px",
    fontWeight: 700,
    margin: "0 0 16px",
  },
  row: {
    color: NAVY,
    fontSize: "14px",
    lineHeight: "1.55",
    margin: "0 0 8px",
  },
  note: {
    color: "#4B5563",
    fontSize: "12px",
    marginTop: "16px",
  },
};

export default AdminNotificationEmail;
