import type { Player, PerformanceDataPoint, Application } from "@/types";

export const mockPlayer: Player = {
  id: "p1",
  firstName: "Kofi",
  lastName: "Mensah",
  age: 16,
  position: { fr: "Milieu central", en: "Central midfielder" },
  strongFoot: { fr: "Droit", en: "Right" },
  objectives: [
    {
      fr: "Réussir 7 tirs cadrés sur 10 avant le 31 août",
      en: "Hit 7/10 shots on target by August 31",
    },
    {
      fr: "Améliorer la vision de jeu en 1 contre 1",
      en: "Improve game vision in 1v1 situations",
    },
  ],
  strengths: [
    { fr: "Passe courte et longue", en: "Short and long passing" },
    { fr: "Endurance", en: "Endurance" },
    { fr: "Lecture du jeu", en: "Game reading" },
  ],
  improvements: [
    { fr: "Finition sous pression", en: "Finishing under pressure" },
    { fr: "Prise de décision rapide", en: "Quick decision making" },
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
  { month: "Jan", technical: 65, physical: 60, tactical: 70, mental: 68 },
  { month: "Fév", technical: 68, physical: 63, tactical: 72, mental: 70 },
  { month: "Mar", technical: 72, physical: 67, tactical: 74, mental: 72 },
  { month: "Avr", technical: 74, physical: 70, tactical: 76, mental: 74 },
  { month: "Mai", technical: 76, physical: 73, tactical: 78, mental: 76 },
  { month: "Jun", technical: 78, physical: 75, tactical: 82, mental: 80 },
];

export const coachData = {
  nextSession: {
    date: "2026-07-28",
    time: "16:00",
    location: { fr: "Stade de Bonamoussadi", en: "Bonamoussadi Stadium" },
    type: { fr: "Séance technique U16", en: "U16 technical session" },
  },
  todos: [
    { id: "t1", label: { fr: "3 joueurs à évaluer", en: "3 players to evaluate" } },
    { id: "t2", label: { fr: "2 absences à justifier", en: "2 absences to justify" } },
    { id: "t3", label: { fr: "1 rapport à publier", en: "1 report to publish" } },
  ],
  recentEvals: [
    {
      player: "Amara Diallo",
      date: "2026-07-22",
      type: { fr: "Mensuelle", en: "Monthly" },
    },
    {
      player: "Jean Nkoulou",
      date: "2026-07-18",
      type: { fr: "Après-match", en: "Post-match" },
    },
  ],
  attention: [
    {
      id: "p3",
      reason: { fr: "Sans évaluation depuis 3 semaines", en: "No evaluation for 3 weeks" },
    },
    {
      id: "p2",
      reason: { fr: "Baisse tactique récente", en: "Recent tactical drop" },
    },
  ],
};

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
  children: [
    {
      id: "p1",
      firstName: "Kofi",
      lastName: "Mensah",
      category: "U-16",
      position: { fr: "Milieu de terrain", en: "Midfielder" },
      group: { fr: "Groupe Élite", en: "Elite group" },
      status: "active" as const,
      lastEvaluation: "2026-07-21",
      jersey: "8",
    },
    {
      id: "p2",
      firstName: "Awa",
      lastName: "Mensah",
      category: "U-14",
      position: { fr: "Ailière droite", en: "Right winger" },
      group: { fr: "Groupe Espoir", en: "Hope group" },
      status: "active" as const,
      lastEvaluation: "2026-07-18",
      jersey: "11",
    },
  ],
  attendance: {
    present: 18,
    total: 20,
    percentage: 90,
    absences: [
      { date: "2026-07-08", reason: { fr: "Maladie", en: "Illness" } },
      { date: "2026-06-22", reason: { fr: "Examen scolaire", en: "School exam" } },
    ],
  },
  kpi: {
    technical: { value: 78, delta: 4, hint: { fr: "Bon niveau", en: "Good level" } },
    physical: {
      value: 75,
      delta: 2,
      target: 80,
      hint: { fr: "À renforcer", en: "Needs work" },
    },
    academicAverage: 14,
    academicDelta: 0.8,
    academicHint: { fr: "Niveau satisfaisant", en: "Satisfactory level" },
  },
  nextSession: {
    date: "2026-07-28",
    time: "16:00",
    location: { fr: "Stade de Bonamoussadi", en: "Bonamoussadi Stadium" },
    kit: { fr: "tenue blanche", en: "white kit" },
    type: { fr: "Séance technique", en: "Technical session" },
  },
  academic: {
    average: "14/20",
    averageValue: 14,
    delta: 1.2,
    updatedAt: "2026-07-15",
    focus: { fr: "Anglais", en: "English" },
    grade: { fr: "Niveau satisfaisant", en: "Satisfactory level" },
    subjects: [
      { name: { fr: "Mathématiques", en: "Mathematics" }, grade: "14/20", value: 14 },
      { name: { fr: "Français", en: "French" }, grade: "15/20", value: 15 },
      { name: { fr: "Anglais", en: "English" }, grade: "13/20", value: 13 },
    ],
  },
  messages: [
    {
      id: "m1",
      date: "2026-07-25",
      sender: { fr: "Coach Martin", en: "Coach Martin" },
      title: { fr: "Préparation séance de mardi", en: "Tuesday session prep" },
      preview: {
        fr: "Merci d’amener la tenue blanche et les crampons secs.",
        en: "Please bring the white kit and dry boots.",
      },
      unread: true,
      needsReply: false,
    },
    {
      id: "m2",
      date: "2026-07-22",
      sender: { fr: "Administration NOFA", en: "NOFA Admin" },
      title: { fr: "Rapport de progression — Juillet", en: "Progress report — July" },
      preview: {
        fr: "Le rapport mensuel de Kofi est disponible au téléchargement.",
        en: "Kofi's monthly report is ready to download.",
      },
      unread: true,
      needsReply: false,
    },
    {
      id: "m3",
      date: "2026-07-18",
      sender: { fr: "Service scolaire", en: "Academic service" },
      title: { fr: "Bulletin trimestriel disponible", en: "Term report available" },
      preview: {
        fr: "Veuillez confirmer la lecture du bulletin avant le 30 juillet.",
        en: "Please confirm you have read the report before July 30.",
      },
      unread: false,
      needsReply: true,
    },
  ],
  documents: [
    {
      id: "d1",
      name: { fr: "Règlement intérieur", en: "Internal regulations" },
      type: "PDF",
      updatedAt: "2026-07-15",
      size: "1,2 Mo",
      toSign: false,
    },
    {
      id: "d2",
      name: { fr: "Calendrier scolaire 2026", en: "2026 school calendar" },
      type: "PDF",
      updatedAt: "2026-07-01",
      size: "840 Ko",
      toSign: false,
    },
    {
      id: "d3",
      name: { fr: "Autorisation parentale", en: "Parental authorization" },
      type: "PDF",
      updatedAt: "2026-07-20",
      size: "320 Ko",
      toSign: true,
    },
  ],
  calendar: [
    {
      date: "2026-07-28",
      time: "16:00",
      title: { fr: "Séance technique", en: "Technical session" },
    },
    {
      date: "2026-07-30",
      time: "17:00",
      title: { fr: "Match amical U16", en: "U16 friendly match" },
    },
    {
      date: "2026-08-02",
      time: "09:00",
      title: { fr: "Évaluation physique", en: "Physical assessment" },
    },
    {
      date: "2026-08-05",
      time: "16:00",
      title: { fr: "Séance tactique", en: "Tactical session" },
    },
  ],
};
