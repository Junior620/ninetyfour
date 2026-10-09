import { z } from "zod";

export const applicationSchema = z.object({
  firstName: z.string().min(2, "Minimum 2 caractères"),
  lastName: z.string().min(2, "Minimum 2 caractères"),
  birthDate: z.string().min(1, "Date requise"),
  city: z.string().min(2, "Ville requise"),
  position: z.string().min(1, "Poste requis"),
  strongFoot: z.enum(["left", "right", "both"]),
  currentClub: z.string().optional(),
  schoolLevel: z.string().min(1, "Niveau scolaire requis"),
  parentContact: z.string().min(2, "Contact parent requis"),
  phone: z.string().min(8, "Téléphone invalide"),
  email: z.string().email("Email invalide"),
  message: z.string().optional(),
  videoLink: z.string().url("URL invalide").optional().or(z.literal("")),
  consent: z.literal(true, { message: "Consentement requis" }),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

export function createContactSchema(locale: string = "fr") {
  const message = (fr: string, en: string) => locale === "en" ? en : fr;
  const maximum = (limit: number) => message(`Maximum ${limit} caractères`, `Maximum ${limit} characters`);
  return z.object({
    name: z.string().trim().min(2, message("Nom requis", "Please enter your name")).max(120, maximum(120)),
    email: z.string().trim().email(message("Email invalide", "Enter a valid email address")).max(200, maximum(200)),
    subject: z.string().trim().min(3, message("Sujet requis", "Enter a subject of at least 3 characters")).max(200, maximum(200)),
    message: z.string().trim().min(10, message("Message trop court (10 caractères minimum)", "Your message must contain at least 10 characters")).max(5000, maximum(5000)),
    locale: z.enum(["fr", "en"]).optional(),
    /** Honeypot — must stay empty */
    website: z.string().max(200).optional(),
    idempotencyKey: z.string().min(8).max(80).optional(),
  });
}

export const contactSchema = createContactSchema();

export type ContactFormData = z.infer<typeof contactSchema>;

export const evaluationSchema = z.object({
  playerId: z.string().min(1),
  date: z.string().min(1),
  evalType: z.enum(["monthly", "quarterly", "match"]),
  session: z.string().min(1),
  evaluator: z.string().min(1),
  technical: z.number().min(0).max(100),
  tactical: z.number().min(0).max(100),
  physical: z.number().min(0).max(100),
  mental: z.number().min(0).max(100),
  positives: z.string().optional(),
  axes: z.string().optional(),
  nextObjective: z.string().optional(),
  commentInternal: z.string().optional(),
  commentVisible: z.string().min(5, "Commentaire requis"),
});

export type EvaluationFormData = z.infer<typeof evaluationSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Recruitment (Fiche d'enregistrement - PDF identique)
// ─────────────────────────────────────────────────────────────────────────────

export function createRecruitmentSchema(locale: string = "fr") {
  const message = (fr: string, en: string) => locale === "en" ? en : fr;
  const requiredText = (fr: string, en: string, minimum = 1) =>
    z.string({ error: message(fr, en) }).trim().min(minimum, message(fr, en));
  return z
  .object({
    playerNumber: requiredText("Numéro requis", "Player number is required"),
    category: z.enum(["U-14", "U-16", "U-18"], { message: message("Catégorie requise", "Select a category") }),
    zone: z.enum(["A", "B", "C", "FINAL"], { message: message("Zone requise", "Select a zone") }),
    lastName: requiredText("Nom requis", "Last name is required"),
    firstNames: requiredText("Prénom(s) requis", "First name(s) are required"),
    dobDay: requiredText("Jour requis", "Day is required"),
    dobMonth: requiredText("Mois requis", "Month is required"),
    dobYear: requiredText("Année requise", "A four-digit year is required", 4),
    age: requiredText("Âge requis", "Age is required"),
    nationality: requiredText("Nationalité requise", "Nationality is required"),
    birthPlace: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    heightCm: z.string().optional(),
    weightKg: z.string().optional(),

    playerPhone: requiredText("Téléphone requis", "Phone number is required", 5),
    fatherTutorName: requiredText("Nom du père/tuteur requis", "Father or guardian name is required", 2),
    fatherTutorPhone: requiredText("Téléphone requis", "Phone number is required", 5),
    motherName: z.string().optional(),
    motherPhone: z.string().optional(),
    email: z.string({ error: message("Email invalide", "Enter a valid email address") }).trim().email(message("Email invalide", "Enter a valid email address")),
    address: requiredText("Adresse requise", "Address is required", 2),

    currentClub: requiredText("Club requis", "Current club is required"),
    previousClubs: z.string().optional(),
    school: requiredText("Établissement scolaire requis", "School is required"),

    primaryPosition: requiredText("Poste requis", "Position is required"),
    secondaryPosition: z.string().optional(),
    strongFoot: z.enum(["left", "right", "both"], { message: message("Pied fort requis", "Select a preferred foot") }),

    injuryCurrent: z.boolean(),
    injuryDetails: z.string().optional(),
    allergies: z.string().optional(),

    birthCertificateProvided: z.boolean(),
    parentalAuthProvided: z.boolean(),
    medicalCertificateProvided: z.boolean(),
    feesPaidProvided: z.boolean(),

    amountPaidXaf: z.string().optional(),
    paymentMethod: z.enum(["cash", "mobile_money", "other"], { message: message("Mode de paiement requis", "Select a payment method") }),
    paymentMethodOther: z.string().optional(),

    parentDeclarationName: requiredText("Nom du parent requis", "Parent name is required", 2),
    consent: z.literal(true, { message: message("Consentement requis", "Consent is required") }),
  })
  .superRefine((values, ctx) => {
    if (values.injuryCurrent && (!values.injuryDetails || values.injuryDetails.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: message("Veuillez préciser la blessure.", "Please describe the injury."),
        path: ["injuryDetails"],
      });
    }

    if (values.feesPaidProvided && (!values.amountPaidXaf || values.amountPaidXaf.trim().length < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: message("Montant requis.", "Amount is required."),
        path: ["amountPaidXaf"],
      });
    }

    if (values.paymentMethod === "other" && (!values.paymentMethodOther || values.paymentMethodOther.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: message("Veuillez préciser le mode de paiement.", "Please specify the payment method."),
        path: ["paymentMethodOther"],
      });
    }
  });

}

export const recruitmentSchema = createRecruitmentSchema();

export type RecruitmentFormData = z.infer<typeof recruitmentSchema>;
