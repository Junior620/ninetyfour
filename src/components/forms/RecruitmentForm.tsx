"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
import { cn } from "@/lib/utils";

const STEP_KEYS = ["photo", "contacts", "profile", "health", "documents"] as const;

const STEP_FIELDS: (keyof RecruitmentFormData)[][] = [
  [
    "playerNumber",
    "category",
    "zone",
    "lastName",
    "firstNames",
    "dobDay",
    "dobMonth",
    "dobYear",
    "age",
    "nationality",
    "birthPlace",
    "city",
    "neighborhood",
    "heightCm",
    "weightKg",
  ],
  [
    "playerPhone",
    "fatherTutorName",
    "fatherTutorPhone",
    "motherName",
    "motherPhone",
    "email",
    "address",
  ],
  ["currentClub", "school", "primaryPosition", "strongFoot"],
  ["injuryCurrent", "injuryDetails", "allergies"],
  [
    "birthCertificateProvided",
    "parentalAuthProvided",
    "medicalCertificateProvided",
    "feesPaidProvided",
    "amountPaidXaf",
    "paymentMethod",
    "paymentMethodOther",
    "parentDeclarationName",
    "consent",
  ],
];

export function RecruitmentForm() {
  const locale = useLocale();
  const isFr = locale === "fr";
  const t = useTranslations("recruitment");

  const [step, setStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState("fiche-enregistrement.pdf");
  // Évite le mismatch SSR/client sur l’attribut HTML `disabled` (Base UI / React 19)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
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
    mode: "onTouched",
  });

  const injuryCurrent = watch("injuryCurrent");
  const birthCertificateProvided = watch("birthCertificateProvided");
  const parentalAuthProvided = watch("parentalAuthProvided");
  const medicalCertificateProvided = watch("medicalCertificateProvided");
  const feesPaidProvided = watch("feesPaidProvided");
  const paymentMethod = watch("paymentMethod");
  const category = watch("category");
  const zone = watch("zone");
  const primaryPosition = watch("primaryPosition");
  const strongFoot = watch("strongFoot");
  const consent = watch("consent");

  const docProvidedKeys = useMemo(
    () => ({
      birth: birthCertificateProvided,
      parental: parentalAuthProvided,
      medical: medicalCertificateProvided,
      fees: feesPaidProvided,
    }),
    [birthCertificateProvided, parentalAuthProvided, medicalCertificateProvided, feesPaidProvided]
  );

  const totalSteps = STEP_KEYS.length;
  const isLastStep = step === totalSteps - 1;

  async function validateCurrentStep(): Promise<boolean> {
    if (step === 0 && !photoFile) {
      setError(
        isFr ? "Veuillez importer la photo d’identité." : "Please upload your ID photo."
      );
      return false;
    }

    if (step === totalSteps - 1) {
      const requiredDocs: { key: string; fileLabel: string }[] = [];
      if (docProvidedKeys.birth)
        requiredDocs.push({ key: "birthCertificate", fileLabel: isFr ? "Acte de naissance" : "Birth certificate" });
      if (docProvidedKeys.parental)
        requiredDocs.push({ key: "parentalAuth", fileLabel: isFr ? "Autorisation parentale" : "Parental authorization" });
      if (docProvidedKeys.medical)
        requiredDocs.push({ key: "medicalCertificate", fileLabel: isFr ? "Certificat médical" : "Medical certificate" });
      if (docProvidedKeys.fees)
        requiredDocs.push({ key: "feesReceipt", fileLabel: isFr ? "Justificatif frais" : "Fee receipt" });

      const missing = requiredDocs.find((d) => !docFiles[d.key]);
      if (missing) {
        setError(
          isFr
            ? `Veuillez importer le document : ${missing.fileLabel}`
            : `Please upload the document: ${missing.fileLabel}`
        );
        return false;
      }
    }

    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) {
      setError(isFr ? "Veuillez corriger les champs en rouge." : "Please fix the highlighted fields.");
      return false;
    }

    setError("");
    return true;
  }

  async function goNext() {
    const ok = await validateCurrentStep();
    if (ok) setStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function goPrev() {
    if (step === 0) return;
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  function downloadPdfFromBase64(base64: string, fileName: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPdfDownloadUrl(url);
    setPdfFileName(fileName);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function onSubmit(values: RecruitmentFormData) {
    setError("");

    if (!photoFile) {
      setError(isFr ? "Veuillez importer la photo d’identité." : "Please upload your ID photo.");
      setStep(0);
      return;
    }

    const formData = new FormData();
    for (const [k, v] of Object.entries(values)) {
      if (v === undefined) continue;
      formData.append(k, typeof v === "boolean" ? String(v) : String(v));
    }
    formData.append("photo", photoFile);

    if (docProvidedKeys.birth) formData.append("birthCertificate", docFiles.birthCertificate as File);
    if (docProvidedKeys.parental) formData.append("parentalAuth", docFiles.parentalAuth as File);
    if (docProvidedKeys.medical) formData.append("medicalCertificate", docFiles.medicalCertificate as File);
    if (docProvidedKeys.fees) formData.append("feesReceipt", docFiles.feesReceipt as File);

    try {
      const res = await fetch("/api/recruitments", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed");

      const json = (await res.json()) as {
        success?: boolean;
        pdfBase64?: string;
        fileName?: string;
      };

      if (json.pdfBase64) {
        downloadPdfFromBase64(
          json.pdfBase64,
          json.fileName || "fiche-enregistrement.pdf"
        );
      }

      setSubmitted(true);
    } catch {
      setError(isFr ? "Une erreur est survenue." : "An error occurred.");
    }
  }

  if (submitted) {
    return (
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-lg font-medium text-royal">{t("submitted")}</p>
          {pdfDownloadUrl && (
            <a
              href={pdfDownloadUrl}
              download={pdfFileName}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-gold px-3 text-sm font-medium text-navy transition-colors hover:bg-gold/90"
            >
              {t("downloadPdf")}
            </a>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader className="space-y-4 pb-2">
        <CardTitle className="text-xl font-bold text-black-premium">{t("title")}</CardTitle>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-text-muted sm:text-sm">
            <span>{t("stepOf", { current: step + 1, total: totalSteps })}</span>
            <span className="text-navy">{t(`steps.${STEP_KEYS[step]}`)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream">
            <div
              className="h-full rounded-full bg-gold transition-all duration-300"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <div className="hidden gap-1 sm:flex">
            {STEP_KEYS.map((key, i) => {
              const locked = i > step;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (!locked) setStep(i);
                  }}
                  aria-disabled={locked}
                  disabled={hydrated ? locked : undefined}
                  className={cn(
                    "flex-1 truncate rounded-md px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide transition-colors",
                    i === step
                      ? "bg-navy text-white"
                      : i < step
                        ? "bg-navy/10 text-navy hover:bg-navy/20"
                        : "bg-cream text-text-muted"
                  )}
                >
                  {t(`steps.${key}`)}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 0 && (
            <section className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
                {isFr ? "Photo d’identité" : "ID photo"}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 sm:items-center">
                <Label htmlFor="photo">{isFr ? "Importer la photo" : "Upload photo"}</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {photoFile && (
                <p className="text-xs text-text-muted">
                  {isFr ? "Photo sélectionnée :" : "Selected photo:"} {photoFile.name}
                </p>
              )}

              <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-navy">
                {isFr ? "Informations du joueur" : "Player information"}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={isFr ? "Numéro de joueur" : "Player number"} error={errors.playerNumber?.message}>
                  <Input {...register("playerNumber")} />
                </Field>
                <Field label={isFr ? "Catégorie" : "Category"} error={errors.category?.message}>
                  <Select value={category ?? ""} onValueChange={(v) => setValue("category", v as RecruitmentFormData["category"], { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder={isFr ? "Choisir" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="U-14">U-14</SelectItem>
                      <SelectItem value="U-16">U-16</SelectItem>
                      <SelectItem value="U-18">U-18</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={isFr ? "Zone de détection" : "Detection area"} error={errors.zone?.message}>
                  <Select value={zone ?? ""} onValueChange={(v) => setValue("zone", v as RecruitmentFormData["zone"], { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder={isFr ? "Choisir" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">{isFr ? "Zone A" : "Area A"}</SelectItem>
                      <SelectItem value="B">{isFr ? "Zone B" : "Area B"}</SelectItem>
                      <SelectItem value="C">{isFr ? "Zone C" : "Area C"}</SelectItem>
                      <SelectItem value="FINAL">{isFr ? "Finale" : "Final"}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={isFr ? "Nom" : "Last name"} error={errors.lastName?.message}>
                  <Input {...register("lastName")} />
                </Field>
                <Field label={isFr ? "Prénom(s)" : "First names"} error={errors.firstNames?.message}>
                  <Input {...register("firstNames")} />
                </Field>
                <Field label={isFr ? "Jour" : "Day"} error={errors.dobDay?.message}>
                  <Input {...register("dobDay")} placeholder="JJ" />
                </Field>
                <Field label={isFr ? "Mois" : "Month"} error={errors.dobMonth?.message}>
                  <Input {...register("dobMonth")} placeholder="MM" />
                </Field>
                <Field label={isFr ? "Année" : "Year"} error={errors.dobYear?.message}>
                  <Input {...register("dobYear")} placeholder="AAAA" />
                </Field>
                <Field label={isFr ? "Âge" : "Age"} error={errors.age?.message}>
                  <Input {...register("age")} />
                </Field>
                <Field label={isFr ? "Nationalité" : "Nationality"} error={errors.nationality?.message}>
                  <Input {...register("nationality")} />
                </Field>
                <Field label={isFr ? "Lieu de naissance" : "Place of birth"}>
                  <Input {...register("birthPlace")} />
                </Field>
                <Field label={isFr ? "Ville de résidence" : "City of residence"}>
                  <Input {...register("city")} />
                </Field>
                <Field label={isFr ? "Quartier" : "Neighborhood"}>
                  <Input {...register("neighborhood")} />
                </Field>
                <Field label={isFr ? "Taille (cm)" : "Height (cm)"}>
                  <Input {...register("heightCm")} />
                </Field>
                <Field label={isFr ? "Poids (kg)" : "Weight (kg)"}>
                  <Input {...register("weightKg")} />
                </Field>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
                {isFr ? "Contacts et adresse" : "Contacts & address"}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={isFr ? "Téléphone joueur" : "Player phone"} error={errors.playerPhone?.message}>
                  <Input {...register("playerPhone")} />
                </Field>
                <Field label={isFr ? "Nom du père / tuteur" : "Father / guardian name"} error={errors.fatherTutorName?.message}>
                  <Input {...register("fatherTutorName")} />
                </Field>
                <Field label={isFr ? "Téléphone (père/tuteur)" : "Phone (guardian)"} error={errors.fatherTutorPhone?.message}>
                  <Input {...register("fatherTutorPhone")} />
                </Field>
                <Field label={isFr ? "Nom de la mère" : "Mother’s name"}>
                  <Input {...register("motherName")} />
                </Field>
                <Field label={isFr ? "Téléphone (mère)" : "Mother’s phone"}>
                  <Input {...register("motherPhone")} />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <Input type="email" {...register("email")} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={isFr ? "Adresse complète" : "Full address"} error={errors.address?.message}>
                    <Textarea {...register("address")} rows={3} />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
                {isFr ? "Parcours footballistique" : "Football background"}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={isFr ? "Club actuel" : "Current club"} error={errors.currentClub?.message}>
                  <Input {...register("currentClub")} />
                </Field>
                <Field label={isFr ? "Anciens clubs" : "Previous clubs"}>
                  <Input {...register("previousClubs")} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={isFr ? "Établissement scolaire" : "School"} error={errors.school?.message}>
                    <Input {...register("school")} />
                  </Field>
                </div>
              </div>

              <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-navy">
                {isFr ? "Profil sportif" : "Sports profile"}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={isFr ? "Poste principal" : "Primary position"} error={errors.primaryPosition?.message}>
                  <Select value={primaryPosition ?? ""} onValueChange={(v) => v && setValue("primaryPosition", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder={isFr ? "Choisir" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GARDIEN">{isFr ? "Gardien" : "Goalkeeper"}</SelectItem>
                      <SelectItem value="DEFENSEUR_CENTRAL">{isFr ? "Défenseur central" : "Center back"}</SelectItem>
                      <SelectItem value="LATERAL_DROIT">{isFr ? "Latéral droit" : "Right back"}</SelectItem>
                      <SelectItem value="LATERAL_GAUCHE">{isFr ? "Latéral gauche" : "Left back"}</SelectItem>
                      <SelectItem value="MILIEU_CENTRAL">{isFr ? "Milieu défensif" : "Defensive mid"}</SelectItem>
                      <SelectItem value="MILIEU_RELAYEUR">{isFr ? "Milieu relayeur" : "Holding mid"}</SelectItem>
                      <SelectItem value="MILIEU_OFFENSIF">{isFr ? "Milieu offensif" : "Attacking mid"}</SelectItem>
                      <SelectItem value="AILE_DROIT">{isFr ? "Ailier droit" : "Right winger"}</SelectItem>
                      <SelectItem value="AILE_GAUCHE">{isFr ? "Ailier gauche" : "Left winger"}</SelectItem>
                      <SelectItem value="ATTAQUANT">{isFr ? "Attaquant" : "Striker"}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={isFr ? "Deuxième poste" : "Second position"}>
                  <Input {...register("secondaryPosition")} />
                </Field>
                <Field label={isFr ? "Pied fort" : "Strong foot"} error={errors.strongFoot?.message}>
                  <Select value={strongFoot ?? ""} onValueChange={(v) => setValue("strongFoot", v as RecruitmentFormData["strongFoot"], { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder={isFr ? "Choisir" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">{isFr ? "Gauche" : "Left"}</SelectItem>
                      <SelectItem value="right">{isFr ? "Droit" : "Right"}</SelectItem>
                      <SelectItem value="both">{isFr ? "Les deux" : "Both"}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
                {isFr ? "État de santé" : "Health status"}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>{isFr ? "Blessure actuelle" : "Current injury"}</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={injuryCurrent === true} onChange={() => setValue("injuryCurrent", true)} />
                      {isFr ? "Oui" : "Yes"}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={injuryCurrent === false} onChange={() => setValue("injuryCurrent", false)} />
                      {isFr ? "Non" : "No"}
                    </label>
                  </div>
                </div>
                <Field label={isFr ? "Si oui, laquelle ?" : "If yes, which one?"} error={errors.injuryDetails?.message}>
                  <Input disabled={!injuryCurrent} {...register("injuryDetails")} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={isFr ? "Allergies connues" : "Known allergies"}>
                    <Input {...register("allergies")} />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
                {isFr ? "Documents à fournir" : "Documents to provide"}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <DocYesNo
                  label={isFr ? "Copie acte de naissance" : "Birth certificate copy"}
                  value={birthCertificateProvided}
                  onChange={(v) => setValue("birthCertificateProvided", v)}
                  file={docFiles.birthCertificate ?? null}
                  onFile={(f) => setDocFiles((prev) => ({ ...prev, birthCertificate: f }))}
                  isFr={isFr}
                />
                <DocYesNo
                  label={isFr ? "Autorisation parentale" : "Parental authorization"}
                  value={parentalAuthProvided}
                  onChange={(v) => setValue("parentalAuthProvided", v)}
                  file={docFiles.parentalAuth ?? null}
                  onFile={(f) => setDocFiles((prev) => ({ ...prev, parentalAuth: f }))}
                  isFr={isFr}
                />
                <DocYesNo
                  label={isFr ? "Certificat médical (si dispo)" : "Medical certificate (if available)"}
                  value={medicalCertificateProvided}
                  onChange={(v) => setValue("medicalCertificateProvided", v)}
                  file={docFiles.medicalCertificate ?? null}
                  onFile={(f) => setDocFiles((prev) => ({ ...prev, medicalCertificate: f }))}
                  isFr={isFr}
                />
                <DocYesNo
                  label={isFr ? "Frais d’inscription (réglés)" : "Registration fees (paid)"}
                  value={feesPaidProvided}
                  onChange={(v) => setValue("feesPaidProvided", v)}
                  file={docFiles.feesReceipt ?? null}
                  onFile={(f) => setDocFiles((prev) => ({ ...prev, feesReceipt: f }))}
                  isFr={isFr}
                />
                <div className="sm:col-span-2">
                  <Field label={isFr ? "Montant payé (XAF)" : "Amount paid (XAF)"} error={errors.amountPaidXaf?.message}>
                    <Input disabled={!feesPaidProvided} {...register("amountPaidXaf")} />
                  </Field>
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
                        <input type="radio" checked={paymentMethod === val} onChange={() => setValue("paymentMethod", val)} />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Field label={isFr ? "Préciser (si autre)" : "Specify (if other)"} error={errors.paymentMethodOther?.message}>
                    <Input disabled={paymentMethod !== "other"} {...register("paymentMethodOther")} />
                  </Field>
                </div>
              </div>

              <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-navy">
                {isFr ? "Déclaration parent/tuteur" : "Parent/guardian declaration"}
              </h3>
              <Field label={isFr ? "Nom du parent / tuteur" : "Parent/guardian name"} error={errors.parentDeclarationName?.message}>
                <Input {...register("parentDeclarationName")} />
              </Field>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consent === true}
                  onCheckedChange={(checked) =>
                    setValue("consent", checked === true ? true : (undefined as unknown as true), { shouldValidate: true })
                  }
                />
                <Label htmlFor="consent" className="text-sm leading-relaxed text-text-muted">
                  {isFr
                    ? "Je certifie que les informations fournies sont exactes."
                    : "I confirm the information provided is accurate."}
                </Label>
              </div>
              {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
            </section>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              disabled={hydrated ? step === 0 : undefined}
              className="w-full border-navy text-navy sm:w-auto"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("previous")}
            </Button>

            {isLastStep ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gold text-navy hover:bg-gold/90 sm:w-auto"
              >
                {isSubmitting ? (isFr ? "Envoi..." : "Sending...") : t("submit")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                className="w-full bg-gold text-navy hover:bg-gold/90 sm:w-auto"
              >
                {t("next")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function DocYesNo({
  label,
  value,
  onChange,
  file,
  onFile,
  isFr,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  file: File | null;
  onFile: (f: File | null) => void;
  isFr: boolean;
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
      <Input
        type="file"
        accept="application/pdf,image/*"
        disabled={!value}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {value && !file && (
        <p className="text-xs text-text-muted">{isFr ? "Ajoutez le document" : "Add the document"}</p>
      )}
    </div>
  );
}
