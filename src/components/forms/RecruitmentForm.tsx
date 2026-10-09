"use client";

import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useWatch, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { createRecruitmentSchema, type RecruitmentFormData } from "@/lib/validations/schemas";
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
import { FormSubmissionResult, FormSubmitLabel, type FormSubmissionStatus } from "@/components/forms/FormSubmissionResult";
import { cn } from "@/lib/utils";
import { attachmentMessage, DOCUMENT_ACCEPT, PHOTO_ACCEPT, recruitmentDocuments, validateAttachment, validateRecruitmentAttachments, type AttachmentField, type DocumentField } from "@/lib/recruitment/attachments";

const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const defaultValues: Partial<RecruitmentFormData> = {
  consent: undefined,
  injuryCurrent: false,
  birthCertificateProvided: false,
  parentalAuthProvided: false,
  medicalCertificateProvided: false,
  feesPaidProvided: false,
  paymentMethod: "cash",
};

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

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
  const [docFiles, setDocFiles] = useState<Partial<Record<DocumentField, File | null>>>({});
  const [error, setError] = useState("");
  const [fileErrors, setFileErrors] = useState<Partial<Record<AttachmentField, string>>>({});
  const [view, setView] = useState<"form" | "result">("form");
  const [resultStatus, setResultStatus] =
    useState<FormSubmissionStatus>("success");
  const [successMeta, setSuccessMeta] = useState<{
    reference?: string;
    maskedEmail?: string;
    emailSent?: boolean;
  } | null>(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState("fiche-enregistrement.pdf");
  const idempotencyKey = useRef<string | null>(null);
  const hydrated = useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot);
  useEffect(() => () => {
    if (pdfDownloadUrl) URL.revokeObjectURL(pdfDownloadUrl);
  }, [pdfDownloadUrl]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    getValues,
    setError: setFieldError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecruitmentFormData>({
    resolver: zodResolver(createRecruitmentSchema(locale)),
    defaultValues,
    mode: "onTouched",
  });

  const injuryCurrent = useWatch({ control, name: "injuryCurrent" });
  const birthCertificateProvided = useWatch({ control, name: "birthCertificateProvided" });
  const parentalAuthProvided = useWatch({ control, name: "parentalAuthProvided" });
  const medicalCertificateProvided = useWatch({ control, name: "medicalCertificateProvided" });
  const feesPaidProvided = useWatch({ control, name: "feesPaidProvided" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const category = useWatch({ control, name: "category" });
  const zone = useWatch({ control, name: "zone" });
  const primaryPosition = useWatch({ control, name: "primaryPosition" });
  const strongFoot = useWatch({ control, name: "strongFoot" });
  const consent = useWatch({ control, name: "consent" });

  const totalSteps = STEP_KEYS.length;
  const isLastStep = step === totalSteps - 1;

  async function validateCurrentStep(): Promise<boolean> {
    if (step === 0) {
      const issue = validateAttachment("photo", photoFile);
      if (issue) {
        const message = attachmentMessage(issue, locale);
        setFileErrors(prev => ({ ...prev, photo: message }));
        setError(message);
        return false;
      }
    }

    const valid = await trigger(STEP_FIELDS[step]);
    // Later steps are still incomplete, so Zod may defer cross-field refinements.
    if (step === 3 && injuryCurrent && (getValues("injuryDetails")?.trim().length ?? 0) < 2) {
      const message = isFr ? "Veuillez préciser la blessure." : "Please describe the injury.";
      setFieldError("injuryDetails", { type: "manual", message });
      setError(message);
      return false;
    }
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

    const attachmentIssues = validateRecruitmentAttachments(values, { photo: photoFile, ...docFiles });
    if (attachmentIssues.length) {
      setFileErrors(Object.fromEntries(attachmentIssues.map(issue => [issue.field, attachmentMessage(issue, locale)])));
      setError(isFr ? "Veuillez corriger les pièces jointes." : "Please check the attachments.");
      setStep(attachmentIssues[0].field === "photo" ? 0 : totalSteps - 1);
      return;
    }
    if (!photoFile) return;
    idempotencyKey.current ??= createIdempotencyKey();

    const formData = new FormData();
    for (const [k, v] of Object.entries(values)) {
      if (v === undefined) continue;
      formData.append(k, typeof v === "boolean" ? String(v) : String(v));
    }
    formData.append("photo", photoFile);
    formData.append("locale", locale === "en" ? "en" : "fr");
    formData.append("idempotencyKey", idempotencyKey.current);
    formData.append("website", "");

    for (const document of recruitmentDocuments) {
      const file = docFiles[document.field];
      if (values[document.flag] && file) formData.append(document.field, file);
    }

    try {
      const res = await fetch("/api/recruitments", { method: "POST", body: formData });
      const json = (await res.json()) as {
        success?: boolean;
        pdfBase64?: string;
        fileName?: string;
        reference?: string;
        maskedEmail?: string;
        emailSent?: boolean;
      };

      if (!res.ok || !json.success) {
        setResultStatus("error");
        setSuccessMeta(null);
        setView("result");
        return;
      }

      if (json.pdfBase64) {
        downloadPdfFromBase64(
          json.pdfBase64,
          json.fileName || "fiche-enregistrement.pdf"
        );
      }

      const emailSent = Boolean(json.emailSent);
      setSuccessMeta({
        reference: json.reference,
        maskedEmail: json.maskedEmail,
        emailSent,
      });
      setResultStatus(emailSent ? "success" : "received");
      setView("result");
    } catch {
      setResultStatus("error");
      setSuccessMeta(null);
      setView("result");
    }
  }

  function onInvalid(invalid: FieldErrors<RecruitmentFormData>) {
    const firstInvalidStep = STEP_FIELDS.findIndex(fields => fields.some(field => invalid[field]));
    if (firstInvalidStep >= 0) setStep(firstInvalidStep);
    setError(isFr ? "Veuillez corriger les champs en rouge." : "Please fix the highlighted fields.");
  }

  function handleReset() {
    if (resultStatus === "error") { setView("form"); setError(""); return; }
    idempotencyKey.current = null;
    reset(defaultValues);
    setPhotoFile(null);
    setDocFiles({});
    setFileErrors({});
    setPdfFileName("fiche-enregistrement.pdf");
    setView("form");
    setSuccessMeta(null);
    setResultStatus("success");
    setError("");
    setStep(0);
    setPdfDownloadUrl(null);
  }

  function selectFile(field: AttachmentField, file: File | null) {
    const issue = validateAttachment(field, file, false);
    setFileErrors(previous => ({ ...previous, [field]: issue ? attachmentMessage(issue, locale) : undefined }));
    if (field === "photo") setPhotoFile(issue ? null : file);
    else setDocFiles(previous => ({ ...previous, [field]: issue ? null : file }));
    return !issue;
  }

  if (view === "result") {
    return (
      <FormSubmissionResult
        status={resultStatus}
        reference={successMeta?.reference}
        maskedEmail={successMeta?.maskedEmail}
        emailSent={successMeta?.emailSent}
        allowReset={resultStatus !== "error"}
        onReset={handleReset}
      >
        {resultStatus !== "error" && pdfDownloadUrl ? (
          <a
            href={pdfDownloadUrl}
            download={pdfFileName}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-navy px-4 text-sm font-medium text-white transition-colors hover:bg-navy/90"
          >
            {t("downloadPdf")}
          </a>
        ) : null}
      </FormSubmissionResult>
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
        <form method="post" onSubmit={(event) => {
          if (!isLastStep) { event.preventDefault(); void goNext(); return; }
          void handleSubmit(onSubmit, onInvalid)(event);
        }} className="space-y-6" noValidate>
          <div
            className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden"
            aria-hidden
          >
            <label htmlFor="recruitment-website">Website</label>
            <input
              id="recruitment-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>
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
                  accept={PHOTO_ACCEPT}
                  aria-invalid={!!fileErrors.photo}
                  aria-describedby="photo-help photo-error"
                  onChange={(e) => {
                    if (!selectFile("photo", e.target.files?.[0] ?? null)) e.target.value = "";
                  }}
                />
              </div>
              <p id="photo-help" className="text-xs text-text-muted">{isFr ? "JPEG ou PNG, 5 Mo maximum." : "JPEG or PNG, maximum 5 MB."}</p>
              <p id="photo-error" className="text-xs text-destructive" role="alert">{fileErrors.photo}</p>
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
                  <Input {...register("dobDay")} placeholder={isFr ? "JJ" : "DD"} />
                </Field>
                <Field label={isFr ? "Mois" : "Month"} error={errors.dobMonth?.message}>
                  <Input {...register("dobMonth")} placeholder="MM" />
                </Field>
                <Field label={isFr ? "Année" : "Year"} error={errors.dobYear?.message}>
                  <Input {...register("dobYear")} placeholder={isFr ? "AAAA" : "YYYY"} />
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
                <fieldset>
                  <legend className="text-sm font-medium">{isFr ? "Blessure actuelle" : "Current injury"}</legend>
                  <div className="mt-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="injuryCurrent" checked={injuryCurrent === true} onChange={() => setValue("injuryCurrent", true)} />
                      {isFr ? "Oui" : "Yes"}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="injuryCurrent" checked={injuryCurrent === false} onChange={() => setValue("injuryCurrent", false)} />
                      {isFr ? "Non" : "No"}
                    </label>
                  </div>
                </fieldset>
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
                  onFile={(f) => selectFile("birthCertificate", f)}
                  error={fileErrors.birthCertificate}
                  isFr={isFr}
                />
                <DocYesNo
                  label={isFr ? "Autorisation parentale" : "Parental authorization"}
                  value={parentalAuthProvided}
                  onChange={(v) => setValue("parentalAuthProvided", v)}
                  file={docFiles.parentalAuth ?? null}
                  onFile={(f) => selectFile("parentalAuth", f)}
                  error={fileErrors.parentalAuth}
                  isFr={isFr}
                />
                <DocYesNo
                  label={isFr ? "Certificat médical (si dispo)" : "Medical certificate (if available)"}
                  value={medicalCertificateProvided}
                  onChange={(v) => setValue("medicalCertificateProvided", v)}
                  file={docFiles.medicalCertificate ?? null}
                  onFile={(f) => selectFile("medicalCertificate", f)}
                  error={fileErrors.medicalCertificate}
                  isFr={isFr}
                />
                <DocYesNo
                  label={isFr ? "Frais d’inscription (réglés)" : "Registration fees (paid)"}
                  value={feesPaidProvided}
                  onChange={(v) => setValue("feesPaidProvided", v)}
                  file={docFiles.feesReceipt ?? null}
                  onFile={(f) => selectFile("feesReceipt", f)}
                  error={fileErrors.feesReceipt}
                  isFr={isFr}
                />
                <div className="sm:col-span-2">
                  <Field label={isFr ? "Montant payé (XAF)" : "Amount paid (XAF)"} error={errors.amountPaidXaf?.message}>
                    <Input disabled={!feesPaidProvided} {...register("amountPaidXaf")} />
                  </Field>
                </div>
                <fieldset className="sm:col-span-2" aria-describedby={errors.paymentMethod ? "payment-method-error" : undefined}>
                  <legend className="text-sm font-medium">{isFr ? "Mode de paiement" : "Payment method"}</legend>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                    {(
                      [
                        ["cash", isFr ? "Espèces" : "Cash"],
                        ["mobile_money", isFr ? "Mobile money" : "Mobile money"],
                        ["other", isFr ? "Autre" : "Other"],
                      ] as const
                    ).map(([val, lbl]) => (
                      <label key={val} className="flex items-center gap-2 text-sm">
                        <input type="radio" name="paymentMethod" checked={paymentMethod === val} onChange={() => setValue("paymentMethod", val)} />
                        {lbl}
                      </label>
                    ))}
                  </div>
                  {errors.paymentMethod && <p id="payment-method-error" role="alert" className="mt-1 text-xs text-destructive">{errors.paymentMethod.message}</p>}
                </fieldset>
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
                  aria-invalid={!!errors.consent}
                  aria-describedby={errors.consent ? "consent-error" : undefined}
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
              {errors.consent && <p id="consent-error" role="alert" className="text-xs text-destructive">{errors.consent.message}</p>}
            </section>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

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
                key="submit"
                type="submit"
                disabled={!hydrated || isSubmitting}
                aria-busy={isSubmitting}
                className="min-h-11 w-full bg-gold text-navy hover:bg-gold/90 sm:w-auto"
              >
                <FormSubmitLabel loading={isSubmitting} idleLabel={t("submit")} />
              </Button>
            ) : (
              <Button
                key="next"
                type="button"
                onClick={(event) => { event.preventDefault(); void goNext(); }}
                disabled={!hydrated}
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

// Keep labels and errors attached to the actual input or Base UI select trigger.
function connectField(children: ReactNode, id: string, describedBy?: string, invalid = false): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{ children?: ReactNode; id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
    if (element.type === Input || element.type === Textarea || element.type === SelectTrigger) {
      return cloneElement(element, { id, "aria-describedby": describedBy, "aria-invalid": invalid });
    }
    return element.props.children ? cloneElement(element, {}, connectField(element.props.children, id, describedBy, invalid)) : element;
  });
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1">{connectField(children, id, error ? errorId : undefined, !!error)}</div>
      {error && <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function DocYesNo({ label, value, onChange, file, onFile, isFr, error }: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  file: File | null;
  onFile: (f: File | null) => boolean;
  isFr: boolean;
  error?: string;
}) {
  const id = useId();
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name={`${id}-provided`} checked={value} onChange={() => onChange(true)} />
          {isFr ? "Oui" : "Yes"}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name={`${id}-provided`} checked={!value} onChange={() => onChange(false)} />
          {isFr ? "Non" : "No"}
        </label>
      </div>
      <Label htmlFor={id} className="sr-only">{isFr ? "Importer : " : "Upload: "}{label}</Label>
      <Input id={id} type="file" accept={DOCUMENT_ACCEPT} disabled={!value}
        aria-invalid={value && !!error} aria-describedby={`${id}-help${value && error ? ` ${id}-error` : ""}`}
        onChange={(e) => { if (!onFile(e.target.files?.[0] ?? null)) e.target.value = ""; }} />
      <p id={`${id}-help`} className="text-xs text-text-muted">{isFr ? "PDF, JPEG ou PNG, 10 Mo maximum. Pièce requise si vous choisissez Oui." : "PDF, JPEG or PNG, maximum 10 MB. A file is required when you select Yes."}</p>
      {value && file && <p className="text-xs text-text-muted">{file.name}</p>}
      {value && error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}
