import type { Player, PerformanceDataPoint, Application } from "@/types";

export const mockPlayer: Player = {
  id: "p1",
  firstName: "Kofi",
  lastName: "Mensah",
  age: 16,
  position: { fr: "Milieu central", en: "Central midfielder" },
  strongFoot: { fr: "Droit", en: "Right" },
  objectives: [
    { fr: "Améliorer la vision de jeu", en: "Improve game vision" },
    { fr: "Renforcer le jeu de tête", en: "Strengthen heading" },
    { fr: "Progresser en finition", en: "Progress in finishing" },
  ],
  strengths: [
    { fr: "Passe courte et longue", en: "Short and long passing" },
    { fr: "Endurance", en: "Endurance" },
    { fr: "Lecture du jeu", en: "Game reading" },
  ],
  improvements: [
    { fr: "Jeu aérien", en: "Aerial play" },
    { fr: "Finition", en: "Finishing" },
    { fr: "Prise de décision sous pression", en: "Decision making under pressure" },
  ],
  technicalScore: 78,
  tacticalScore: 82,
  physicalScore: 75,
  mentalScore: 80,
  lastProgress: {
    fr: "+4% en score technique ce mois",
    en: "+4% in technical score this month",
  },
};

export const mockPlayers: Player[] = [
  mockPlayer,
  {
    id: "p2",
    firstName: "Amara",
    lastName: "Diallo",
    age: 17,
    position: { fr: "Attaquant", en: "Forward" },
    strongFoot: { fr: "Gauche", en: "Left" },
    objectives: [
      { fr: "Améliorer le placement", en: "Improve positioning" },
    ],
    strengths: [
      { fr: "Vitesse", en: "Speed" },
      { fr: "Finition", en: "Finishing" },
    ],
    improvements: [
      { fr: "Jeu de tête", en: "Heading" },
    ],
    technicalScore: 85,
    tacticalScore: 72,
    physicalScore: 88,
    mentalScore: 76,
    lastProgress: {
      fr: "+6% en score physique",
      en: "+6% in physical score",
    },
  },
  {
    id: "p3",
    firstName: "Jean",
    lastName: "Nkoulou",
    age: 15,
    position: { fr: "Défenseur central", en: "Centre back" },
    strongFoot: { fr: "Droit", en: "Right" },
    objectives: [
      { fr: "Sorties de balle", en: "Ball distribution" },
    ],
    strengths: [
      { fr: "Tacles", en: "Tackling" },
      { fr: "Placement", en: "Positioning" },
    ],
    improvements: [
      { fr: "Vitesse", en: "Speed" },
    ],
    technicalScore: 70,
    tacticalScore: 85,
    physicalScore: 82,
    mentalScore: 78,
    lastProgress: {
      fr: "+3% en score tactique",
      en: "+3% in tactical score",
    },
  },
];

export const performanceChartData: PerformanceDataPoint[] = [
  { month: "Jan", technical: 65, physical: 60 },
  { month: "Fév", technical: 68, physical: 63 },
  { month: "Mar", technical: 72, physical: 67 },
  { month: "Avr", technical: 74, physical: 70 },
  { month: "Mai", technical: 76, physical: 73 },
  { month: "Jun", technical: 78, physical: 75 },
];

export const mockApplications: Application[] = [
  {
    id: "a1",
    firstName: "Samuel",
    lastName: "Eto'o Jr",
    birthDate: "2010-03-15",
    city: "Douala",
    position: "Attaquant",
    status: "pending",
    submittedAt: "2026-03-20",
  },
  {
    id: "a2",
    firstName: "David",
    lastName: "Fotso",
    birthDate: "2009-07-22",
    city: "Yaoundé",
    position: "Milieu",
    status: "reviewed",
    submittedAt: "2026-03-15",
  },
  {
    id: "a3",
    firstName: "Ibrahim",
    lastName: "Bello",
    birthDate: "2010-11-08",
    city: "Douala",
    position: "Défenseur",
    status: "accepted",
    submittedAt: "2026-02-28",
  },
];

export const coachComments = [
  {
    date: "2026-03-18",
    text: {
      fr: "Excellente séance technique. Kofi montre une belle progression dans la vision de jeu.",
      en: "Excellent technical session. Kofi shows great progress in game vision.",
    },
    coach: "Coach Martin",
  },
  {
    date: "2026-03-15",
    text: {
      fr: "Travail physique solide. Continuer sur cette lancée pour le prochain match.",
      en: "Solid physical work. Keep it up for the next match.",
    },
    coach: "Coach Martin",
  },
];

export const monthlyGoals = [
  { fr: "Améliorer la précision des passes longues", en: "Improve long pass accuracy" },
  { fr: "Augmenter la vitesse maximale de 2%", en: "Increase top speed by 2%" },
  { fr: "Participer activement aux ateliers leadership", en: "Actively participate in leadership workshops" },
];

export const upcomingTraining = {
  date: "2026-03-25",
  time: "08:00",
  type: { fr: "Séance technique", en: "Technical session" },
  location: { fr: "Terrain principal, Douala", en: "Main pitch, Douala" },
};

export const calendarEvents = [
  { date: "2026-03-25", title: { fr: "Séance technique", en: "Technical session" } },
  { date: "2026-03-27", title: { fr: "Match amical", en: "Friendly match" } },
  { date: "2026-03-28", title: { fr: "Analyse vidéo", en: "Video analysis" } },
  { date: "2026-03-30", title: { fr: "Renforcement physique", en: "Physical strengthening" } },
];

export const videosToReview = [
  { id: "vr1", title: { fr: "Match vs Academy Select — Mi-temps 1", en: "Match vs Academy Select — 1st half" }, date: "2026-03-18" },
  { id: "vr2", title: { fr: "Séance technique — Passes longues", en: "Technical session — Long passes" }, date: "2026-03-15" },
];

export const parentData = {
  attendance: { present: 18, total: 20, percentage: 90 },
  academic: {
    grade: { fr: "Bien", en: "Good" },
    subjects: [
      { name: { fr: "Mathématiques", en: "Mathematics" }, grade: "14/20" },
      { name: { fr: "Français", en: "French" }, grade: "15/20" },
      { name: { fr: "Anglais", en: "English" }, grade: "13/20" },
    ],
  },
  messages: [
    {
      date: "2026-03-20",
      title: { fr: "Réunion parents — Avril 2026", en: "Parents meeting — April 2026" },
      preview: { fr: "Nous vous invitons à la réunion trimestrielle...", en: "We invite you to the quarterly meeting..." },
    },
    {
      date: "2026-03-10",
      title: { fr: "Rapport de progression — Mars", en: "Progress report — March" },
      preview: { fr: "Le rapport mensuel de Kofi est disponible...", en: "Kofi's monthly report is available..." },
    },
  ],
  documents: [
    { name: { fr: "Règlement intérieur", en: "Internal regulations" }, type: "PDF" },
    { name: { fr: "Calendrier scolaire 2026", en: "2026 school calendar" }, type: "PDF" },
    { name: { fr: "Autorisation parentale", en: "Parental authorization" }, type: "PDF" },
  ],
};
