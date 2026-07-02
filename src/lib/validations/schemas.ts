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
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  subject: z.string().min(3, "Sujet requis"),
  message: z.string().min(10, "Message trop court"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const evaluationSchema = z.object({
  playerId: z.string().min(1),
  technical: z.number().min(0).max(100),
  tactical: z.number().min(0).max(100),
  physical: z.number().min(0).max(100),
  mental: z.number().min(0).max(100),
  comment: z.string().min(5, "Commentaire requis"),
});

export type EvaluationFormData = z.infer<typeof evaluationSchema>;
