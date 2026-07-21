import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { RecruitmentFormData } from "@/lib/validations/schemas";

export type RecruitmentPdfProps = {
  photoDataUri?: string | null;
  logoDataUri?: string | null;
  data: RecruitmentFormData;
};

const COLORS = {
  navy: "#1f3fa8",
  gold: "#c2a14e",
  bar: "#111111",
  label: "#16205a",
  labelBg: "#f4f6fb",
  border: "#bfbfbf",
  text: "#111111",
  muted: "#7a8091",
};

const POSITION_LABELS: Record<string, string> = {
  GARDIEN: "Gardien",
  DEFENSEUR_CENTRAL: "Défenseur central",
  LATERAL_DROIT: "Latéral droit",
  LATERAL_GAUCHE: "Latéral gauche",
  MILIEU_CENTRAL: "Milieu défensif",
  MILIEU_RELAYEUR: "Milieu relayeur",
  MILIEU_OFFENSIF: "Milieu offensif",
  AILE_DROIT: "Ailier droit",
  AILE_GAUCHE: "Ailier gauche",
  ATTAQUANT: "Attaquant",
};

const POSITIONS_ROW1 = [
  "GARDIEN",
  "DEFENSEUR_CENTRAL",
  "LATERAL_DROIT",
  "LATERAL_GAUCHE",
  "MILIEU_CENTRAL",
] as const;

const POSITIONS_ROW2 = [
  "MILIEU_RELAYEUR",
  "MILIEU_OFFENSIF",
  "AILE_DROIT",
  "AILE_GAUCHE",
  "ATTAQUANT",
] as const;

const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.text,
    backgroundColor: "#ffffff",
  },
  goldBorder: {
    border: `4 solid ${COLORS.gold}`,
    padding: 8,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.navy,
    border: `2 solid ${COLORS.gold}`,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  logoImgBox: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  brandTop: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  brandSub: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    marginTop: 1,
  },
  goldLine: {
    width: "55%",
    height: 2,
    backgroundColor: COLORS.gold,
    marginVertical: 4,
  },
  ficheTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },
  ficheSub: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#333",
    marginTop: 2,
  },
  photoBox: {
    width: 72,
    height: 80,
    border: `2 solid ${COLORS.navy}`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoPlaceholder: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 1.3,
  },
  photoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  sectionBar: {
    backgroundColor: COLORS.bar,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 3,
    marginTop: 4,
  },
  sectionBarText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  labelCell: {
    width: "38%",
    backgroundColor: COLORS.labelBg,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.border,
    justifyContent: "center",
  },
  labelText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.label,
  },
  valueCell: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    justifyContent: "center",
  },
  valueText: {
    fontSize: 8,
  },
  twoCol: {
    flexDirection: "row",
    gap: 6,
  },
  col: {
    flex: 1,
  },
  pickRow: {
    flexDirection: "row",
  },
  pickCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pickOn: {
    backgroundColor: COLORS.navy,
  },
  pickOff: {
    backgroundColor: "#ffffff",
  },
  pickTextOn: {
    color: "#ffffff",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  pickTextOff: {
    color: COLORS.label,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  blockTitle: {
    backgroundColor: COLORS.navy,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  blockTitleText: {
    color: "#fff",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    backgroundColor: COLORS.bar,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  footerText: {
    color: "#fff",
    fontSize: 6,
    textAlign: "center",
  },
  italicNote: {
    fontSize: 7,
    fontStyle: "italic",
    color: "#333",
    marginBottom: 3,
    marginTop: 1,
  },
  playerNumberRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "stretch",
  },
  playerNumBox: {
    width: "22%",
    marginRight: 6,
  },
});

function SectionBar({ title }: { title: string }) {
  return (
    <View style={styles.sectionBar}>
      <Text style={styles.sectionBarText}>{title}</Text>
    </View>
  );
}

function LabelValue({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.labelCell}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <View style={styles.valueCell}>
        <Text style={styles.valueText}>{value?.trim() ? value : " "}</Text>
      </View>
    </View>
  );
}

function Pick({
  label,
  on,
  flex,
}: {
  label: string;
  on: boolean;
  flex?: number;
}) {
  return (
    <View
      style={[
        styles.pickCell,
        on ? styles.pickOn : styles.pickOff,
        flex != null ? { flex } : {},
      ]}
    >
      <Text style={on ? styles.pickTextOn : styles.pickTextOff}>{label}</Text>
    </View>
  );
}

export function FicheEnregistrementPdf({ photoDataUri, logoDataUri, data }: RecruitmentPdfProps) {
  const dob = [data.dobDay, data.dobMonth, data.dobYear].filter(Boolean).join(" / ");
  const foot =
    data.strongFoot === "right"
      ? "Droit"
      : data.strongFoot === "left"
        ? "Gauche"
        : "Les deux";
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.goldBorder}>
          {/* Header */}
          <View style={styles.header}>
            {logoDataUri ? (
              <View style={styles.logoImgBox}>
                <Image src={logoDataUri} style={styles.logoImg} />
              </View>
            ) : (
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>91</Text>
              </View>
            )}
            <View style={styles.headerCenter}>
              <Text style={styles.brandTop}>NINETY ONE</Text>
              <Text style={styles.brandSub}>FOOT ACADEMY</Text>
              <View style={styles.goldLine} />
              <Text style={styles.ficheTitle}>FICHE D'ENREGISTREMENT</Text>
              <Text style={styles.ficheSub}>DÉTECTION DES JEUNES TALENTS 2026</Text>
            </View>
            <View style={styles.photoBox}>
              {photoDataUri ? (
                <Image src={photoDataUri} style={styles.photoImg} />
              ) : (
                <Text style={styles.photoPlaceholder}>
                  PHOTO{"\n"}D'IDENTITÉ{"\n"}(RÉCENTE)
                </Text>
              )}
            </View>
          </View>

          {/* Numéro + catégorie + zone */}
          <View style={styles.playerNumberRow}>
            <View style={styles.playerNumBox}>
              <View style={styles.blockTitle}>
                <Text style={styles.blockTitleText}>NUMÉRO DE JOUEUR</Text>
              </View>
              <View style={[styles.row, { minHeight: 22 }]}>
                <View style={[styles.valueCell, { width: "100%" }]}>
                  <Text style={styles.valueText}>{data.playerNumber}</Text>
                </View>
              </View>
            </View>
            <View style={{ flex: 1, marginRight: 6 }}>
              <View style={styles.blockTitle}>
                <Text style={styles.blockTitleText}>CATÉGORIE</Text>
              </View>
              <View style={styles.pickRow}>
                <Pick label="U-14" on={data.category === "U-14"} />
                <Pick label="U-16" on={data.category === "U-16"} />
                <Pick label="U-18" on={data.category === "U-18"} />
              </View>
            </View>
            <View style={{ flex: 1.4 }}>
              <View style={styles.blockTitle}>
                <Text style={styles.blockTitleText}>ZONE DE DÉTECTION</Text>
              </View>
              <View style={styles.pickRow}>
                <Pick label="ZONE A" on={data.zone === "A"} />
                <Pick label="ZONE B" on={data.zone === "B"} />
                <Pick label="ZONE C" on={data.zone === "C"} />
                <Pick label="FINALE" on={data.zone === "FINAL"} />
              </View>
            </View>
          </View>

          {/* 1 */}
          <SectionBar title="1. INFORMATIONS DU JOUEUR" />
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <LabelValue label="NOM" value={data.lastName.toUpperCase()} />
              <LabelValue label="PRÉNOM(S)" value={data.firstNames.toUpperCase()} />
              <LabelValue label="DATE DE NAISSANCE" value={dob} />
              <LabelValue label="ÂGE" value={data.age} />
              <LabelValue label="NATIONALITÉ" value={data.nationality} />
            </View>
            <View style={styles.col}>
              <LabelValue label="LIEU DE NAISSANCE" value={data.birthPlace} />
              <LabelValue label="VILLE DE RÉSIDENCE" value={data.city} />
              <LabelValue label="QUARTIER" value={data.neighborhood} />
              <LabelValue label="TAILLE (cm)" value={data.heightCm} />
              <LabelValue label="POIDS (kg)" value={data.weightKg} />
            </View>
          </View>

          {/* 2 */}
          <SectionBar title="2. CONTACTS" />
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <LabelValue label="NOM DU PÈRE / TUTEUR" value={data.fatherTutorName} />
              <LabelValue label="TÉLÉPHONE" value={data.fatherTutorPhone} />
              <LabelValue label="NOM DE LA MÈRE" value={data.motherName} />
              <LabelValue label="TÉLÉPHONE" value={data.motherPhone || data.playerPhone} />
              <LabelValue label="E-MAIL" value={data.email} />
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <View style={[styles.labelCell, { width: "100%", borderRightWidth: 0 }]}>
                  <Text style={styles.labelText}>ADRESSE COMPLÈTE</Text>
                </View>
              </View>
              <View style={[styles.row, { minHeight: 58 }]}>
                <View style={[styles.valueCell, { width: "100%" }]}>
                  <Text style={styles.valueText}>{data.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3 */}
          <SectionBar title="3. PARCOURS FOOTBALLISTIQUE" />
          <LabelValue label="CLUB ACTUEL" value={data.currentClub} />
          <LabelValue label="ANCIEN(S) CLUB(S)" value={data.previousClubs} />
          <LabelValue label="ÉTABLISSEMENT SCOLAIRE FRÉQUENTÉ" value={data.school} />

          {/* 4 */}
          <SectionBar title="4. PROFIL SPORTIF" />
          <View style={styles.twoCol}>
            <View style={[styles.col, { flex: 1.5 }]}>
              <Text style={[styles.labelText, { marginBottom: 3 }]}>POSTE PRINCIPAL</Text>
              <View style={styles.pickRow}>
                {POSITIONS_ROW1.map((p) => (
                  <Pick
                    key={p}
                    label={POSITION_LABELS[p]}
                    on={data.primaryPosition === p}
                  />
                ))}
              </View>
              <View style={styles.pickRow}>
                {POSITIONS_ROW2.map((p) => (
                  <Pick
                    key={p}
                    label={POSITION_LABELS[p]}
                    on={data.primaryPosition === p}
                  />
                ))}
              </View>
            </View>
            <View style={styles.col}>
              <LabelValue label="DEUXIÈME POSTE" value={data.secondaryPosition} />
              <Text style={[styles.labelText, { marginTop: 4, marginBottom: 3 }]}>PIED FORT</Text>
              <View style={styles.pickRow}>
                <Pick label="DROIT" on={foot === "Droit"} />
                <Pick label="GAUCHE" on={foot === "Gauche"} />
                <Pick label="LES DEUX" on={foot === "Les deux"} />
              </View>
            </View>
          </View>

          {/* 5 & 6 */}
          <View style={[styles.twoCol, { marginTop: 4 }]}>
            <View style={styles.col}>
              <SectionBar title="5. ÉTAT DE SANTÉ" />
              <View style={styles.pickRow}>
                <View style={[styles.labelCell, { width: "46%" }]}>
                  <Text style={styles.labelText}>BLESSURE ACTUELLE</Text>
                </View>
                <Pick label="OUI" on={data.injuryCurrent === true} />
                <Pick label="NON" on={data.injuryCurrent === false} />
              </View>
              <LabelValue
                label="SI OUI, LAQUELLE ?"
                value={data.injuryCurrent ? data.injuryDetails : ""}
              />
              <LabelValue label="ALLERGIES CONNUES" value={data.allergies} />
            </View>
            <View style={styles.col}>
              <SectionBar title="6. DOCUMENTS FOURNIS" />
              <View style={styles.pickRow}>
                <View style={[styles.labelCell, { width: "55%" }]}>
                  <Text style={styles.labelText}>ACTE DE NAISSANCE</Text>
                </View>
                <Pick label="OUI" on={data.birthCertificateProvided} />
                <Pick label="NON" on={!data.birthCertificateProvided} />
              </View>
              <View style={styles.pickRow}>
                <View style={[styles.labelCell, { width: "55%" }]}>
                  <Text style={styles.labelText}>AUTORISATION PARENTALE</Text>
                </View>
                <Pick label="OUI" on={data.parentalAuthProvided} />
                <Pick label="NON" on={!data.parentalAuthProvided} />
              </View>
              <View style={styles.pickRow}>
                <View style={[styles.labelCell, { width: "55%" }]}>
                  <Text style={styles.labelText}>CERTIFICAT MÉDICAL</Text>
                </View>
                <Pick label="OUI" on={data.medicalCertificateProvided} />
                <Pick label="NON" on={!data.medicalCertificateProvided} />
              </View>
              <View style={styles.pickRow}>
                <View style={[styles.labelCell, { width: "55%" }]}>
                  <Text style={styles.labelText}>FRAIS RÉGLÉS</Text>
                </View>
                <Pick label="OUI" on={data.feesPaidProvided} />
                <Pick label="NON" on={!data.feesPaidProvided} />
              </View>
              <LabelValue label="MONTANT PAYÉ (XAF)" value={data.amountPaidXaf} />
              <View style={styles.pickRow}>
                <View style={[styles.labelCell, { width: "40%" }]}>
                  <Text style={styles.labelText}>MODE</Text>
                </View>
                <Pick label="ESPÈCES" on={data.paymentMethod === "cash"} />
                <Pick label="MOBILE" on={data.paymentMethod === "mobile_money"} />
                <Pick label="AUTRE" on={data.paymentMethod === "other"} />
              </View>
            </View>
          </View>

          {/* 7 */}
          <SectionBar title="7. RÉSERVÉ À L'ADMINISTRATION" />
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <LabelValue label="NUMÉRO DE DOSSARD" value="" />
              <LabelValue label="NUMÉRO DE GROUPE" value="" />
              <LabelValue label="HEURE D'ARRIVÉE" value="" />
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <View style={[styles.labelCell, { width: "100%", borderRightWidth: 0 }]}>
                  <Text style={styles.labelText}>OBSERVATIONS</Text>
                </View>
              </View>
              <View style={[styles.row, { minHeight: 34 }]}>
                <View style={[styles.valueCell, { width: "100%" }]}>
                  <Text style={styles.valueText}> </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 8 */}
          <SectionBar title="8. DÉCLARATION DU PARENT / TUTEUR" />
          <Text style={styles.italicNote}>
            Je certifie que les informations fournies sont exactes et j'autorise mon enfant à
            participer à la journée de détection organisée par Ninety One Foot Academy.
          </Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <LabelValue
                label="NOM DU PARENT / TUTEUR"
                value={data.parentDeclarationName.toUpperCase()}
              />
            </View>
            <View style={styles.col}>
              <LabelValue label="DATE" value={dateStr} />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Immeuble Air France, Bonanjo — Douala / Cameroun  •  ninetyonefoot@outlook.com  •
              ninetyonefoot.com  •  @ninety.one.foot
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
