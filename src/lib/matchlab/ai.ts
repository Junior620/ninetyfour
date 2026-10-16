import type { Filters } from "./schema";
export const aiModules = [
  {
    id: "video",
    title: "Analyse vidéo",
    description:
      "Repères candidats, couverture et revue humaine des séquences.",
  },
  {
    id: "next-match",
    title: "Préparer le prochain match",
    description: "Questions à examiner à partir des observations autorisées.",
  },
  {
    id: "summary",
    title: "Synthèse de rapport",
    description: "Proposition de synthèse, reliée aux preuves et révisable.",
  },
  {
    id: "assistant",
    title: "Assistant du staff",
    description: "Réponses documentées dans le périmètre habilité.",
  },
  {
    id: "trends",
    title: "Tendances",
    description: "Évolutions avec période, méthode, échantillon et limites.",
  },
  {
    id: "load",
    title: "Charge & minutes",
    description: "Lecture descriptive des minutes ; aucun diagnostic médical.",
  },
  {
    id: "opponents",
    title: "Étudier l’adversaire",
    description: "Hypothèses tactiques à vérifier collectivement.",
  },
  {
    id: "training",
    title: "Préparer l’entraînement",
    description: "Pistes de séance à valider par l’encadrement.",
  },
  {
    id: "voice",
    title: "Notes vocales",
    description: "Contrat de transcription. Microphone et envoi désactivés.",
  },
  {
    id: "profiles",
    title: "Profils recherchés",
    description: "Comparaison explicable, sans sélection automatique.",
  },
] as const;
export type AiModule = (typeof aiModules)[number]["id"];
export type ConfidenceLevel = "unknown" | "low" | "medium" | "high";
export type AiProcessingStatus =
  "not_configured" | "queued" | "review_required" | "rejected" | "approved";
export interface EvidenceReference {
  resourceId: string;
  kind: "match" | "evaluation" | "marker";
  timestamp?: number;
}
export interface VideoAsset {
  id: string;
  localName: string;
  durationSeconds: number | null;
  consentIds: string[];
  transferred: false;
}
export interface AiAnalysisJob {
  id: string;
  module: AiModule;
  scope: Filters;
  status: AiProcessingStatus;
  requestedBy: string;
  contractVersion: "1";
}
export interface CandidateDetection {
  id: string;
  start: number;
  end: number;
  confidence: ConfidenceLevel;
  evidence: EvidenceReference[];
}
export interface CandidateJerseyNumber extends CandidateDetection {
  number: number | null;
  confirmedPlayerId: string | null;
}
export interface VideoEventCandidate extends CandidateDetection {
  kind: string;
  description: string;
}
export interface PlayerVideoObservation {
  playerId: string | null;
  candidate: CandidateDetection;
  observation: string;
  reviewed: false;
}
export interface CoverageWindow {
  start: number;
  end: number;
  occlusion: "unknown" | "partial" | "clear";
  cameraCut: boolean;
}
export interface ActivityMetricCandidate {
  name: string;
  unit: string;
  value: number | null;
  coverage: CoverageWindow[];
  notMeasuredReason: string | null;
}
export interface AiInsight {
  text: string;
  evidence: EvidenceReference[];
  confidence: ConfidenceLevel;
  limitations: string[];
}
export interface AiRecommendation extends AiInsight {
  requiresHumanReview: true;
  automaticDecision: false;
}
export interface HumanReview {
  reviewerId: string;
  decision: "approve" | "correct" | "reject";
  reason: string;
  reviewedAt: string;
}
export interface AiRequest {
  module: AiModule;
  contractVersion: "1";
  scope: Filters;
  consentIds: string[];
}
/** Future inputs only. No dispatcher or provider is connected to these contracts. */
export interface AiInputs {
  video: { asset: VideoAsset; matchId: string; reviewJerseys: true };
  "next-match": {
    matchIds: string[];
    availabilitySourceIds: string[];
    manualLineup: true;
  };
  summary: { reportIds: string[]; editableDraft: string };
  assistant: { question: string; permittedResourceIds: string[] };
  trends: { playerIds: string[]; positions: string[]; minimumSample: number };
  load: { validatedMinutesEvaluationIds: string[]; medicalInference: false };
  opponents: { opponent: string; staffObservationIds: string[] };
  training: {
    categoryId: string;
    priorityEvaluationIds: string[];
    educatorReview: true;
  };
  voice: {
    localAudioId: string | null;
    manualText: string;
    consentId: string | null;
  };
  profiles: {
    targetIds: string[];
    playerIds: string[];
    compatibilityFormula: null;
  };
}
export type ModuleRequest<M extends AiModule> = AiRequest & {
  module: M;
  input: AiInputs[M];
};
export type AiScreenState =
  "empty" | "loading" | "error" | "not-configured" | "demo" | "review-required";
export interface AiDraftOutput {
  insights: AiInsight[];
  recommendations: AiRecommendation[];
  sampleSize: number;
  period: { from: string; to: string };
  draft: true;
  humanReview: HumanReview | null;
  officialScore: never;
}
export interface AiUnavailable {
  code: "AI_NOT_CONFIGURED";
  engineEnabled: false;
  transmitted: false;
  contractVersion: "1";
}
export const AI_UNAVAILABLE: AiUnavailable = {
  code: "AI_NOT_CONFIGURED",
  engineEnabled: false,
  transmitted: false,
  contractVersion: "1",
};
