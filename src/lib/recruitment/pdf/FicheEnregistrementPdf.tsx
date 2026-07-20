import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { RecruitmentFormData } from "@/lib/validations/schemas";

export type RecruitmentPdfProps = {
  backgroundDataUri: string;
  photoDataUri?: string | null;
  data: RecruitmentFormData;
};

const styles = StyleSheet.create({
  page: {
    position: "relative",
  },
  background: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  },
  layer: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  text: {
    fontSize: 10,
    color: "#000",
    fontFamily: "Helvetica",
  },
  small: {
    fontSize: 8,
  },
});

function FieldText({
  style,
  children,
}: {
  style: Record<string, unknown>;
  children: React.ReactNode;
}) {
  return <Text style={[styles.text as any, style as any]}>{children}</Text>;
}

export function FicheEnregistrementPdf({
  backgroundDataUri,
  photoDataUri,
  data,
}: RecruitmentPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image style={styles.background} src={backgroundDataUri} />

        <View style={styles.layer}>
          {/* Header */}
          <FieldText style={{ position: "absolute", left: "6.2%", top: "20.8%" }}>
            {data.playerNumber}
          </FieldText>

          <FieldText style={{ position: "absolute", left: "36.5%", top: "20.8%" }}>
            {data.category}
          </FieldText>

          <FieldText style={{ position: "absolute", left: "60%", top: "20.8%" }}>
            {data.zone === "FINAL" ? "FINALE" : `ZONE ${data.zone}`}
          </FieldText>

          {/* Section 1 */}
          <FieldText style={{ position: "absolute", left: "6.2%", top: "31.2%" }}>
            {data.lastName.toUpperCase()}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "6.2%", top: "35.3%" }}>
            {data.firstNames.toUpperCase()}
          </FieldText>

          <FieldText style={{ position: "absolute", left: "26%", top: "40.4%" }}>
            {data.dobDay}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "33%", top: "40.4%" }}>
            {data.dobMonth}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "41.5%", top: "40.4%" }}>
            {data.dobYear}
          </FieldText>

          <FieldText style={{ position: "absolute", left: "6.2%", top: "46.0%" }}>
            {data.age}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "26%", top: "46.0%" }}>
            {data.nationality.toUpperCase()}
          </FieldText>

          {/* Section 2 */}
          <FieldText style={{ position: "absolute", left: "6.2%", top: "55.2%" }}>
            {data.playerPhone}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "6.2%", top: "59.5%" }}>
            {data.fatherTutorName.toUpperCase()}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "6.2%", top: "63.6%" }}>
            {data.fatherTutorPhone}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "52%", top: "59.5%", width: "40%" as any }}>
            {data.email}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "40.5%", top: "63.0%", width: "54%" as any, fontSize: 7 } as any}>
            {data.address}
          </FieldText>

          {/* Section 3 */}
          <FieldText style={{ position: "absolute", left: "6.2%", top: "72.0%", width: "87%" as any }}>
            {data.currentClub}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "6.2%", top: "77.0%", width: "87%" as any, fontSize: 7 } as any}>
            {data.previousClubs || ""}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "6.2%", top: "81.8%", width: "87%" as any, fontSize: 7 } as any}>
            {data.school}
          </FieldText>

          {/* Section 4 */}
          <FieldText style={{ position: "absolute", left: "6.2%", top: "86.4%", width: "40%" as any }}>
            {data.primaryPosition}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "54%", top: "86.4%", width: "40%" as any, fontSize: 9 } as any}>
            {data.secondaryPosition || ""}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "52%", top: "90.0%", width: "40%" as any, fontSize: 8 } as any}>
            {data.strongFoot === "left" ? "GAUCHE" : data.strongFoot === "right" ? "DROIT" : "LES DEUX"}
          </FieldText>

          {/* Photo */}
          {photoDataUri ? (
            <Image
              src={photoDataUri}
              style={{
                position: "absolute",
                left: "78%",
                top: "9.2%",
                width: "15%",
                height: "10%",
                borderRadius: 6,
              }}
            />
          ) : null}

          {/* Section 5 */}
          <FieldText style={{ position: "absolute", left: "12%", top: "92.0%", width: "25%" as any, fontSize: 8 } as any}>
            {data.injuryCurrent ? "OUI" : "NON"}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "12%", top: "95.6%", width: "35%" as any, fontSize: 8 } as any}>
            {data.injuryCurrent ? data.injuryDetails || "" : ""}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "12%", top: "99.2%", width: "35%" as any, fontSize: 8 } as any}>
            {data.allergies || ""}
          </FieldText>

          {/* Section 6 (simplified) */}
          <FieldText style={{ position: "absolute", left: "42%", top: "92.0%", width: "48%" as any, fontSize: 7 } as any}>
            {`Naissance: ${data.birthCertificateProvided ? "OUI" : "NON"} | Parentale: ${
              data.parentalAuthProvided ? "OUI" : "NON"
            } | Médical: ${data.medicalCertificateProvided ? "OUI" : "NON"}`}
          </FieldText>
          <FieldText style={{ position: "absolute", left: "42%", top: "96.0%", width: "48%" as any, fontSize: 7 } as any}>
            {`Frais: ${data.feesPaidProvided ? "OUI" : "NON"} | Montant: ${data.amountPaidXaf || ""} | Paiement: ${
              data.paymentMethod
            }`}
          </FieldText>

          {/* Section 8 */}
          <FieldText style={{ position: "absolute", left: "13%", top: "98.5%", width: "70%" as any, fontSize: 8 } as any}>
            {data.parentDeclarationName.toUpperCase()}
          </FieldText>
        </View>
      </Page>
    </Document>
  );
}

