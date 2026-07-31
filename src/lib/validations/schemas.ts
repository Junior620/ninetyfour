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

export const contactSchema = z.object({
  name: z.string().min(2, "Nom requis").max(120),
  email: z.string().email("Email invalide").max(200),
  subject: z.string().min(3, "Sujet requis").max(200),
  message: z.string().min(10, "Message trop court").max(5000),
  locale: z.enum(["fr", "en"]).optional(),
  /** Honeypot — must stay empty */
  website: z.string().max(200).optional(),
  idempotencyKey: z.string().min(8).max(80).optional(),
});

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

export const recruitmentSchema = z
  .object({
    playerNumber: z.string().min(1, "Numéro requis"),
    category: z.enum(["U-14", "U-16", "U-18"]),
    zone: z.enum(["A", "B", "C", "FINAL"]),
    lastName: z.string().min(1, "Nom requis"),
    firstNames: z.string().min(1, "Prénom(s) requis"),
    dobDay: z.string().min(1, "Jour requis"),
    dobMonth: z.string().min(1, "Mois requis"),
    dobYear: z.string().min(4, "Année requise"),
    age: z.string().min(1, "Âge requis"),
    nationality: z.string().min(1, "Nationalité requise"),
    birthPlace: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    heightCm: z.string().optional(),
    weightKg: z.string().optional(),

    playerPhone: z.string().min(5, "Téléphone requis"),
    fatherTutorName: z.string().min(2, "Nom du père/tuteur requis"),
    fatherTutorPhone: z.string().min(5, "Téléphone requis"),
    motherName: z.string().optional(),
    motherPhone: z.string().optional(),
    email: z.string().email("Email invalide"),
    address: z.string().min(2, "Adresse requise"),

    currentClub: z.string().min(1, "Club requis"),
    previousClubs: z.string().optional(),
    school: z.string().min(1, "Établissement scolaire requis"),

    primaryPosition: z.string().min(1, "Poste requis"),
    secondaryPosition: z.string().optional(),
    strongFoot: z.enum(["left", "right", "both"]),

    injuryCurrent: z.boolean(),
    injuryDetails: z.string().optional(),
    allergies: z.string().optional(),

    birthCertificateProvided: z.boolean(),
    parentalAuthProvided: z.boolean(),
    medicalCertificateProvided: z.boolean(),
    feesPaidProvided: z.boolean(),

    amountPaidXaf: z.string().optional(),
    paymentMethod: z.enum(["cash", "mobile_money", "other"]),
    paymentMethodOther: z.string().optional(),

    parentDeclarationName: z.string().min(2, "Nom du parent requis"),
    consent: z.literal(true, { message: "Consentement requis" }),
  })
  .superRefine((values, ctx) => {
    if (values.injuryCurrent && (!values.injuryDetails || values.injuryDetails.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez préciser la blessure.",
        path: ["injuryDetails"],
      });
    }

    if (values.feesPaidProvided && (!values.amountPaidXaf || values.amountPaidXaf.trim().length < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Montant requis.",
        path: ["amountPaidXaf"],
      });
    }

    if (values.paymentMethod === "other" && (!values.paymentMethodOther || values.paymentMethodOther.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez préciser le mode de paiement.",
        path: ["paymentMethodOther"],
      });
    }
  });

export type RecruitmentFormData = z.infer<typeof recruitmentSchema>;
