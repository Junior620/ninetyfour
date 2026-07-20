"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { recruitmentSchema, type RecruitmentFormData } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RecruitmentForm() {
  const locale = useLocale();
  const isFr = locale === "fr";
  const t = useTranslations("recruitment");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecruitmentFormData>({
    resolver: zodResolver(recruitmentSchema),
    defaultValues: {
      consent: undefined as unknown as true,
      injuryCurrent: false,
      birthCertificateProvided: false,
      parentalAuthProvided: false,
      medicalCertificateProvided: false,
      feesPaidProvided: false,
      paymentMethod: "cash",
    },
  });

  const injuryCurrent = watch("injuryCurrent");
  const birthCertificateProvided = watch("birthCertificateProvided");
  const parentalAuthProvided = watch("parentalAuthProvided");
  const medicalCertificateProvided = watch("medicalCertificateProvided");
  const feesPaidProvided = watch("feesPaidProvided");
  const paymentMethod = watch("paymentMethod");

  const docProvidedKeys = useMemo(
    () => ({
      birth: birthCertificateProvided,
      parental: parentalAuthProvided,
      medical: medicalCertificateProvided,
      fees: feesPaidProvided,
    }),
    [birthCertificateProvided, parentalAuthProvided, medicalCertificateProvided, feesPaidProvided]
  );

  async function onSubmit(values: RecruitmentFormData) {
    setError("");

    const requiredDocs: { key: string; fileLabel: string }[] = [];
    if (docProvidedKeys.birth) requiredDocs.push({ key: "birthCertificate", fileLabel: "Acte de naissance" });
    if (docProvidedKeys.parental) requiredDocs.push({ key: "parentalAuth", fileLabel: "Autorisation parentale" });
    if (docProvidedKeys.medical) requiredDocs.push({ key: "medicalCertificate", fileLabel: "Certificat médical" });
    if (docProvidedKeys.fees) requiredDocs.push({ key: "feesReceipt", fileLabel: "Justificatif frais" });

    const missing = requiredDocs.find((d) => !docFiles[d.key]);
    if (missing) {
      setError(
        isFr
          ? `Veuillez importer le document : ${missing.fileLabel}`
          : `Please upload the document: ${missing.fileLabel}`
      );
      return;
    }

    if (!photoFile) {
      setError(
        isFr
          ? "Veuillez importer la photo d’identité."
          : "Please upload your ID photo."
      );
      return;
    }

    const formData = new FormData();
    for (const [k, v] of Object.entries(values)) {
      if (v === undefined) continue;
      if (typeof v === "boolean") {
        formData.append(k, String(v));
        continue;
      }
      formData.append(k, String(v));
    }
    formData.append("photo", photoFile);

    if (docProvidedKeys.birth) formData.append("birthCertificate", docFiles.birthCertificate as File);
    if (docProvidedKeys.parental) formData.append("parentalAuth", docFiles.parentalAuth as File);
    if (docProvidedKeys.medical) formData.append("medicalCertificate", docFiles.medicalCertificate as File);
    if (docProvidedKeys.fees) formData.append("feesReceipt", docFiles.feesReceipt as File);

    try {
      const res = await fetch("/api/recruitments", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch (e) {
      setError(isFr ? "Une erreur est survenue." : "An error occurred.");
    }
  }

  if (submitted) {
    return (
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-8 text-center">
          <p className="text-lg font-medium text-royal">
            {t("submitted")}
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-black-premium">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
          {/* Section 0: photo */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
              {isFr ? "Photo d’identité" : "ID photo"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 sm:items-center">
              <Label htmlFor="photo">{isFr ? "Importer la photo" : "Upload photo"}</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setPhotoFile(f);
                }}
              />
            </div>
          </section>

          {/* Section 1: joueur */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
              {isFr ? "1. Informations du joueur" : "1. Player information"}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="playerNumber">{isFr ? "Numéro de joueur" : "Player number"}</Label>
                <Input id="playerNumber" {...register("playerNumber")} />
                {errors.playerNumber && <p className="mt-1 text-xs text-destructive">{errors.playerNumber.message}</p>}
              </div>

              <div>
                <Label>{isFr ? "Catégorie" : "Category"}</Label>
                <Select onValueChange={(v) => setValue("category", v as RecruitmentFormData["category"])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isFr ? "Choisir" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="U-14">U-14</SelectItem>
                    <SelectItem value="U-16">U-16</SelectItem>
                    <SelectItem value="U-18">U-18</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
              </div>

              <div>
                <Label>{isFr ? "Zone de détection" : "Detection area"}</Label>
                <Select onValueChange={(v) => setValue("zone", v as RecruitmentFormData["zone"])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isFr ? "Choisir" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">{isFr ? "Zone A" : "Area A"}</SelectItem>
                    <SelectItem value="B">{isFr ? "Zone B" : "Area B"}</SelectItem>
                    <SelectItem value="C">{isFr ? "Zone C" : "Area C"}</SelectItem>
                    <SelectItem value="FINAL">{isFr ? "Finale" : "Final"}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.zone && <p className="mt-1 text-xs text-destructive">{errors.zone.message}</p>}
              </div>

              <div>
                <Label htmlFor="lastName">{isFr ? "Nom" : "Last name"}</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>}
              </div>

              <div>
                <Label htmlFor="firstNames">{isFr ? "Prénom(s)" : "First names"}</Label>
                <Input id="firstNames" {...register("firstNames")} />
                {errors.firstNames && <p className="mt-1 text-xs text-destructive">{errors.firstNames.message}</p>}
              </div>

              <div>
                <Label htmlFor="dobDay">{isFr ? "Jour de naissance" : "Birth day"}</Label>
                <Input id="dobDay" {...register("dobDay")} />
                {errors.dobDay && <p className="mt-1 text-xs text-destructive">{errors.dobDay.message}</p>}
              </div>

              <div>
                <Label htmlFor="dobMonth">{isFr ? "Mois" : "Month"}</Label>
                <Input id="dobMonth" {...register("dobMonth")} />
                {errors.dobMonth && <p className="mt-1 text-xs text-destructive">{errors.dobMonth.message}</p>}
              </div>

              <div>
                <Label htmlFor="dobYear">{isFr ? "Année" : "Year"}</Label>
                <Input id="dobYear" {...register("dobYear")} />
                {errors.dobYear && <p className="mt-1 text-xs text-destructive">{errors.dobYear.message}</p>}
              </div>

              <div>
                <Label htmlFor="age">{isFr ? "Âge" : "Age"}</Label>
                <Input id="age" {...register("age")} />
                {errors.age && <p className="mt-1 text-xs text-destructive">{errors.age.message}</p>}
              </div>

              <div>
                <Label htmlFor="nationality">{isFr ? "Nationalité" : "Nationality"}</Label>
                <Input id="nationality" {...register("nationality")} />
                {errors.nationality && <p className="mt-1 text-xs text-destructive">{errors.nationality.message}</p>}
              </div>
            </div>
          </section>

          {/* Section 2: contacts */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
              {isFr ? "2. Contacts et adresse" : "2. Contacts & address"}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="playerPhone">{isFr ? "Téléphone" : "Phone"}</Label>
                <Input id="playerPhone" {...register("playerPhone")} />
                {errors.playerPhone && <p className="mt-1 text-xs text-destructive">{errors.playerPhone.message}</p>}
              </div>

              <div>
                <Label htmlFor="fatherTutorName">{isFr ? "Nom du père / tuteur" : "Father / guardian name"}</Label>
                <Input id="fatherTutorName" {...register("fatherTutorName")} />
                {errors.fatherTutorName && <p className="mt-1 text-xs text-destructive">{errors.fatherTutorName.message}</p>}
              </div>

              <div>
                <Label htmlFor="fatherTutorPhone">{isFr ? "Téléphone (père/tuteur)" : "Phone (guardian)"}</Label>
                <Input id="fatherTutorPhone" {...register("fatherTutorPhone")} />
                {errors.fatherTutorPhone && <p className="mt-1 text-xs text-destructive">{errors.fatherTutorPhone.message}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="address">{isFr ? "Adresse complète" : "Full address"}</Label>
                <Textarea id="address" {...register("address")} rows={3} />
                {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>}
              </div>
            </div>
          </section>

          {/* Section 3: parcours */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
              {isFr ? "3. Parcours footballistique" : "3. Football background"}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="currentClub">{isFr ? "Club actuel" : "Current club"}</Label>
                <Input id="currentClub" {...register("currentClub")} />
                {errors.currentClub && <p className="mt-1 text-xs text-destructive">{errors.currentClub.message}</p>}
              </div>
              <div>
                <Label htmlFor="previousClubs">{isFr ? "Anciens clubs" : "Previous clubs"}</Label>
                <Input id="previousClubs" {...register("previousClubs")} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="school">{isFr ? "Établissement scolaire fréquenté" : "School"}</Label>
                <Input id="school" {...register("school")} />
                {errors.school && <p className="mt-1 text-xs text-destructive">{errors.school.message}</p>}
              </div>
            </div>
          </section>

          {/* Section 4: profil sportif */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
              {isFr ? "4. Profil sportif" : "4. Sports profile"}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>{isFr ? "Poste principal" : "Primary position"}</Label>
                <Select
                  onValueChange={(v) =>
                    setValue("primaryPosition", v as RecruitmentFormData["primaryPosition"])
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isFr ? "Choisir" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GARDIEN">{isFr ? "Gardien" : "Goalkeeper"}</SelectItem>
                    <SelectItem value="DEFENSEUR_CENTRAL">{isFr ? "Défenseur central" : "Center back"}</SelectItem>
                    <SelectItem value="LATERAL_DROIT">{isFr ? "Latéral droit" : "Right back"}</SelectItem>
                    <SelectItem value="LATERAL_GAUCHE">{isFr ? "Latéral gauche" : "Left back"}</SelectItem>
                    <SelectItem value="MILIEU_CENTRAL">{isFr ? "Milieu central" : "Central mid"}</SelectItem>
                    <SelectItem value="MILIEU_RELAYEUR">{isFr ? "Milieu relayeur" : "Holding mid"}</SelectItem>
                    <SelectItem value="MILIEU_OFFENSIF">{isFr ? "Milieu offensif" : "Attacking mid"}</SelectItem>
                    <SelectItem value="AILE_DROIT">{isFr ? "Ailier droit" : "Right winger"}</SelectItem>
                    <SelectItem value="AILE_GAUCHE">{isFr ? "Ailier gauche" : "Left winger"}</SelectItem>
                    <SelectItem value="ATTAQUANT">{isFr ? "Attaquant" : "Striker"}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.primaryPosition && <p className="mt-1 text-xs text-destructive">{errors.primaryPosition.message}</p>}
              </div>

              <div>
                <Label>{isFr ? "Deuxième poste" : "Second position"}</Label>
                <Input {...register("secondaryPosition")} />
              </div>

              <div>
                <Label>{isFr ? "Pied fort" : "Strong foot"}</Label>
                <Select onValueChange={(v) => setValue("strongFoot", v as RecruitmentFormData["strongFoot"])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isFr ? "Choisir" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">{isFr ? "Gauche" : "Left"}</SelectItem>
                    <SelectItem value="right">{isFr ? "Droit" : "Right"}</SelectItem>
                    <SelectItem value="both">{isFr ? "Les deux" : "Both"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Section 5: santé */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
              {isFr ? "5. État de santé" : "5. Health status"}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>{isFr ? "Blessure actuelle" : "Current injury"}</Label>
                <div className="mt-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={injuryCurrent === true}
                      onChange={() => setValue("injuryCurrent", true)}
                    />
                    {isFr ? "Oui" : "Yes"}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={injuryCurrent === false}
                      onChange={() => setValue("injuryCurrent", false)}
                    />
                    {isFr ? "Non" : "No"}
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="injuryDetails">{isFr ? "Si oui, laquelle ?" : "If yes, which one?"}</Label>
                <Input id="injuryDetails" disabled={!injuryCurrent} {...register("injuryDetails")} />
                {errors.injuryDetails && <p className="mt-1 text-xs text-destructive">{errors.injuryDetails.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="allergies">{isFr ? "Allergies connues" : "Known allergies"}</Label>
                <Input id="allergies" {...register("allergies")} />
              </div>
            </div>
          </section>

          {/* Section 6: documents */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
              {isFr ? "6. Documents à fournir" : "6. Documents to provide"}
            </h3>

            <div className="grid gap-5 sm:grid-cols-2">
              <DocYesNo
                label={isFr ? "Copie acte de naissance" : "Birth certificate copy"}
                value={birthCertificateProvided}
                onChange={(v) => setValue("birthCertificateProvided", v)}
                file={docFiles.birthCertificate ?? null}
                onFile={(f) => setDocFiles((prev) => ({ ...prev, birthCertificate: f }))}
                isFr={isFr}
                error={errors.birthCertificateProvided}
              />
              <DocYesNo
                label={isFr ? "Autorisation parentale" : "Parental authorization"}
                value={parentalAuthProvided}
                onChange={(v) => setValue("parentalAuthProvided", v)}
                file={docFiles.parentalAuth ?? null}
                onFile={(f) => setDocFiles((prev) => ({ ...prev, parentalAuth: f }))}
                isFr={isFr}
                error={errors.parentalAuthProvided}
              />
              <DocYesNo
                label={isFr ? "Certificat médical (si dispo)" : "Medical certificate (if available)"}
                value={medicalCertificateProvided}
                onChange={(v) => setValue("medicalCertificateProvided", v)}
                file={docFiles.medicalCertificate ?? null}
                onFile={(f) => setDocFiles((prev) => ({ ...prev, medicalCertificate: f }))}
                isFr={isFr}
                error={errors.medicalCertificateProvided}
              />
              <DocYesNo
                label={isFr ? "Frais d’inscription (réglés)" : "Registration fees (paid)"}
                value={feesPaidProvided}
                onChange={(v) => setValue("feesPaidProvided", v)}
                file={docFiles.feesReceipt ?? null}
                onFile={(f) => setDocFiles((prev) => ({ ...prev, feesReceipt: f }))}
                isFr={isFr}
                error={errors.feesPaidProvided}
              />

              <div className="sm:col-span-2">
                <Label htmlFor="amountPaidXaf">{isFr ? "Montant payé (XAF)" : "Amount paid (XAF)"}</Label>
                <Input id="amountPaidXaf" disabled={!feesPaidProvided} {...register("amountPaidXaf")} />
                {errors.amountPaidXaf && <p className="mt-1 text-xs text-destructive">{errors.amountPaidXaf.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label>{isFr ? "Mode de paiement" : "Payment method"}</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  {(
                    [
                      ["cash", isFr ? "Espèces" : "Cash"],
                      ["mobile_money", isFr ? "Mobile money" : "Mobile money"],
                      ["other", isFr ? "Autre" : "Other"],
                    ] as const
                  ).map(([val, lbl]) => (
                    <label key={val} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={paymentMethod === val}
                        onChange={() => setValue("paymentMethod", val)}
                      />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="paymentMethodOther">{isFr ? "Préciser (si autre)" : "Specify (if other)"}</Label>
                <Input
                  id="paymentMethodOther"
                  disabled={paymentMethod !== "other"}
                  {...register("paymentMethodOther")}
                />
                {errors.paymentMethodOther && <p className="mt-1 text-xs text-destructive">{errors.paymentMethodOther.message}</p>}
              </div>
            </div>
          </section>

          {/* Section 8: déclaration */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
              {isFr ? "8. Déclaration parent/tuteur" : "8. Parent/guardian declaration"}
            </h3>
            <div>
              <Label htmlFor="parentDeclarationName">{isFr ? "Nom du parent / tuteur" : "Parent/guardian name"}</Label>
              <Input id="parentDeclarationName" {...register("parentDeclarationName")} />
              {errors.parentDeclarationName && (
                <p className="mt-1 text-xs text-destructive">{errors.parentDeclarationName.message}</p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={watch("consent") === true}
                onCheckedChange={(checked) => setValue("consent", checked === true ? true : (undefined as unknown as true))}
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed text-text-muted">
                {isFr
                  ? "Je certifie que les informations fournies sont exactes."
                  : "I confirm the information provided is accurate."}
              </Label>
            </div>
            {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold text-navy hover:bg-gold/90 sm:w-auto"
          >
            {isSubmitting ? (isFr ? "Envoi..." : "Sending...") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DocYesNo({
  label,
  value,
  onChange,
  file,
  onFile,
  isFr,
  error,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  file: File | null;
  onFile: (f: File | null) => void;
  isFr: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-left">{label}</Label>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={value} onChange={() => onChange(true)} />
          {isFr ? "Oui" : "Yes"}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={!value} onChange={() => onChange(false)} />
          {isFr ? "Non" : "No"}
        </label>
      </div>
      <div>
        <Input
          type="file"
          accept="application/pdf,image/*"
          disabled={!value}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {value && !file && (
          <p className="mt-1 text-xs text-text-muted">{isFr ? "Ajoutez le document" : "Add the document"}</p>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{String(error.message ?? error)}</p>}
    </div>
  );
}

