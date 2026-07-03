export type Locale = "fr" | "en";

export type LocalizedString = {
  fr: string;
  en: string;
};

export type UserRole = "player" | "parent" | "coach" | "admin";

export type NewsCategory =
  | "academy"
  | "matches"
  | "training"
  | "partners"
  | "events";

export type GalleryCategory =
  | "training"
  | "matches"
  | "academy-life"
  | "partners"
  | "education";

export interface Partner {
  id: string;
  name: string;
  role: LocalizedString;
  description: LocalizedString;
  website?: string;
  logo?: string;
}

export interface NewsArticle {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: LocalizedString;
  category: NewsCategory;
  date: string;
  image: string;
}

export interface GalleryItem {
  id: string;
  title: LocalizedString;
  category: GalleryCategory;
  image: string;
  type: "image" | "video";
  videoUrl?: string;
}

export interface Pillar {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  icon: string;
}

export interface ProgramStep {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  details: LocalizedString;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  position: LocalizedString;
  strongFoot: LocalizedString;
  objectives: LocalizedString[];
  strengths: LocalizedString[];
  improvements: LocalizedString[];
  technicalScore: number;
  tacticalScore: number;
  physicalScore: number;
  mentalScore: number;
  lastProgress: LocalizedString;
}

export interface PerformanceDataPoint {
  month: string;
  technical: number;
  physical: number;
}

export interface Application {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  city: string;
  position: string;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  submittedAt: string;
}
