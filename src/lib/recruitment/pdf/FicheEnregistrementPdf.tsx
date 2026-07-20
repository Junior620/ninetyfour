import React from "react";
import { Document, Page, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { RecruitmentFormData } from "@/lib/validations/schemas";

export type RecruitmentPdfProps = {
  backgroundDataUri: string;
  photoDataUri?: string | null;
  data: RecruitmentFormData;
};

/** A4 (pt) — image source 1241 × 1754 px */
const W = 595.28;
const H = 841.89;
const IMG_W = 1241;
const IMG_H = 1754;

const styles = StyleSheet.create({
  page: { padding: 0, margin: 0, position: "relative" },
  background: {
    position: "absolute",
    left: 0,
    top: 0,
    width: W,
    height: H - 0.5,
  },
});

function x(px: number) {
  return (px / IMG_W) * W;
}

function y(px: number) {
  return (px / IMG_H) * H;
}

function Field({
  px,
  py,
  width,
  size = 9,
  bold,
  children,
}: {
  px: number;
  py: number;
  width?: number;
  size?: number;
  bold?: boolean;
  children: React.ReactNode;
}) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <Text
      style={{
        position: "absolute",
        left: x(px),
        top: y(py),
        width: width ? x(width) : undefined,
        fontSize: size,
        fontFamily: bold ? "Helvetica-Bold" : "Helvetica",
        color: "#111111",
        lineHeight: 1,
      }}
    >
      {children}
    </Text>
  );
}

function Mark({ px, py, size = 11 }: { px: number; py: number; size?: number }) {
  return (
    <Text
      style={{
        position: "absolute",
        left: x(px),
        top: y(py),
        fontSize: size,
        fontFamily: "Helvetica-Bold",
        color: "#111111",
      }}
    >
      X
    </Text>
  );
}

/**
 * Coordonnées calibrées sur l’image (grilles détectées) :
 * - S1/S2/S3 : texte dans la colonne valeur (après le séparateur), pas sur le libellé
 * - Cases à cocher : centres de cellules
 */
const COL = {
  s1Value: 282,
  s2Value: 298,
  s3Value: 400,
  address: 645,
  docsCheck: 1080,
} as const;

const CATEGORY: Record<RecruitmentFormData["category"], { px: number; py: number }> = {
  "U-14": { px: 468, py: 348 },
  "U-16": { px: 537, py: 348 },
  "U-18": { px: 605, py: 348 },
};

const ZONE: Record<RecruitmentFormData["zone"], { px: number; py: number }> = {
  A: { px: 700, py: 348 },
  B: { px: 822, py: 348 },
  C: { px: 948, py: 348 },
  FINAL: { px: 1075, py: 348 },
};

/** Grille 2×5 postes (centres de cellules) */
const POSITION: Record<string, { px: number; py: number }> = {
  GARDIEN: { px: 158, py: 1088 },
  DEFENSEUR_CENTRAL: { px: 273, py: 1088 },
  LATERAL_DROIT: { px: 387, py: 1088 },
  LATERAL_GAUCHE: { px: 502, py: 1088 },
  MILIEU_CENTRAL: { px: 616, py: 1088 }, // = Milieu défensif sur la fiche
  MILIEU_RELAYEUR: { px: 158, py: 1134 },
  MILIEU_OFFENSIF: { px: 273, py: 1134 },
  AILE_DROIT: { px: 387, py: 1134 },
  AILE_GAUCHE: { px: 502, py: 1134 },
  ATTAQUANT: { px: 616, py: 1134 },
};

const FOOT: Record<RecruitmentFormData["strongFoot"], { px: number; py: number }> = {
  right: { px: 760, py: 1142 },
  left: { px: 900, py: 1142 },
  both: { px: 1055, py: 1142 },
};

export function FicheEnregistrementPdf({
  backgroundDataUri,
  photoDataUri,
  data,
}: RecruitmentPdfProps) {
  const categoryMark = CATEGORY[data.category];
  const zoneMark = ZONE[data.zone];
  const positionMark = POSITION[data.primaryPosition];
  const footMark = FOOT[data.strongFoot];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src={backgroundDataUri} style={styles.background} />

        {/* Photo */}
        {photoDataUri ? (
          <Image
            src={photoDataUri}
            style={{
              position: "absolute",
              left: x(1008),
              top: y(108),
              width: x(168),
              height: y(168),
              objectFit: "cover",
            }}
          />
        ) : null}

        {/* En-tête */}
        <Field px={105} py={342} width={300} size={10} bold>
          {data.playerNumber}
        </Field>
        {categoryMark && <Mark px={categoryMark.px} py={categoryMark.py} />}
        {zoneMark && <Mark px={zoneMark.px} py={zoneMark.py} />}

        {/* 1. Informations joueur — colonne valeur x≈282 */}
        <Field px={COL.s1Value} py={455} width={310} bold>
          {data.lastName.toUpperCase()}
        </Field>
        <Field px={COL.s1Value} py={492} width={310} bold>
          {data.firstNames.toUpperCase()}
        </Field>
        <Field px={352} py={532} width={50}>
          {data.dobDay}
        </Field>
        <Field px={452} py={532} width={50}>
          {data.dobMonth}
        </Field>
        <Field px={568} py={532} width={50}>
          {data.dobYear}
        </Field>
        <Field px={COL.s1Value} py={570} width={120}>
          {data.age}
        </Field>
        <Field px={COL.s1Value} py={608} width={310}>
          {data.nationality.toUpperCase()}
        </Field>

        {/* 2. Contacts — colonne valeur x≈298 ; adresse à droite */}
        <Field px={COL.s2Value} py={688} width={290}>
          {data.fatherTutorName.toUpperCase()}
        </Field>
        <Field px={COL.s2Value} py={720} width={290}>
          {data.fatherTutorPhone}
        </Field>
        <Field px={COL.s2Value} py={788} width={290}>
          {data.playerPhone}
        </Field>
        <Field px={COL.s2Value} py={822} width={290} size={8}>
          {data.email}
        </Field>
        <Field px={COL.address} py={700} width={480} size={8}>
          {data.address}
        </Field>

        {/* 3. Parcours — colonne valeur x≈400 */}
        <Field px={COL.s3Value} py={903} width={720}>
          {data.currentClub}
        </Field>
        <Field px={COL.s3Value} py={938} width={720} size={8}>
          {data.previousClubs || ""}
        </Field>
        <Field px={COL.s3Value} py={975} width={720} size={8}>
          {data.school}
        </Field>

        {/* 4. Profil sportif */}
        {positionMark && <Mark px={positionMark.px} py={positionMark.py} />}
        <Field px={710} py={1075} width={400} size={9}>
          {data.secondaryPosition || ""}
        </Field>
        {footMark && <Mark px={footMark.px} py={footMark.py} />}

        {/* 5. Santé */}
        {data.injuryCurrent ? (
          <Mark px={368} py={1222} />
        ) : (
          <Mark px={512} py={1222} />
        )}
        <Field px={250} py={1262} width={330} size={8}>
          {data.injuryCurrent ? data.injuryDetails || "" : ""}
        </Field>
        <Field px={110} py={1338} width={470} size={8}>
          {data.allergies || ""}
        </Field>

        {/* 6. Documents — cocher uniquement si fourni */}
        {data.birthCertificateProvided && <Mark px={COL.docsCheck} py={1222} />}
        {data.parentalAuthProvided && <Mark px={COL.docsCheck} py={1250} />}
        {data.medicalCertificateProvided && <Mark px={COL.docsCheck} py={1278} />}
        {data.feesPaidProvided && <Mark px={COL.docsCheck} py={1308} />}
        <Field px={770} py={1345} width={200}>
          {data.amountPaidXaf || ""}
        </Field>
        {data.paymentMethod === "cash" && <Mark px={825} py={1376} />}
        {data.paymentMethod === "mobile_money" && <Mark px={955} py={1376} />}
        {data.paymentMethod === "other" && <Mark px={1080} py={1376} />}
        {data.paymentMethod === "other" ? (
          <Field px={1110} py={1376} width={40} size={7}>
            {data.paymentMethodOther || ""}
          </Field>
        ) : null}

        {/* 8. Déclaration — nom dans la case du bas, pas sur le paragraphe */}
        <Field px={300} py={1648} width={300} size={9} bold>
          {data.parentDeclarationName.toUpperCase()}
        </Field>
      </Page>
    </Document>
  );
}
