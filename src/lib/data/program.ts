import type { ProgramStep } from "@/types";

export const programSteps: ProgramStep[] = [
  {
    id: "identification",
    title: { fr: "Identification", en: "Identification" },
    description: {
      fr: "Repérage des profils prometteurs.",
      en: "Scouting promising profiles.",
    },
    details: {
      fr: "Repérage des jeunes talents lors de compétitions, tournois et événements sportifs dans les communautés et académies partenaires.",
      en: "Scouting young talents during competitions, tournaments and sporting events in communities and partner academies.",
    },
    image: "/program-01.png",
  },
  {
    id: "evaluation",
    title: { fr: "Évaluation", en: "Evaluation" },
    description: {
      fr: "Analyse complète du potentiel.",
      en: "Complete potential analysis.",
    },
    details: {
      fr: "Analyse technique, tactique, physique, mentale et comportementale à travers des tests et observations détaillées.",
      en: "Technical, tactical, physical, mental and behavioral analysis through detailed tests and observations.",
    },
    image: "/program-02.png",
  },
  {
    id: "integration",
    title: { fr: "Intégration", en: "Integration" },
    description: {
      fr: "Accueil et définition des objectifs.",
      en: "Welcome and goal setting.",
    },
    details: {
      fr: "Sélection des profils correspondant aux exigences du programme et signature d'un parcours personnalisé.",
      en: "Selection of profiles meeting program requirements and signing of a personalized pathway.",
    },
    image: "/program-03.png",
  },
  {
    id: "development",
    title: { fr: "Développement", en: "Development" },
    description: {
      fr: "Progression continue et structurée.",
      en: "Continuous and structured progress.",
    },
    details: {
      fr: "Programme individualisé combinant entraînement, éducation, suivi médical et accompagnement humain.",
      en: "Individualized program combining training, education, medical follow-up and human support.",
    },
    image: "/program-04.png",
  },
  {
    id: "exposition",
    title: { fr: "Exposition", en: "Exposure" },
    description: {
      fr: "Mise en lumière des talents.",
      en: "Showcasing talents.",
    },
    details: {
      fr: "Mise en relation avec les académies, clubs et partenaires internationaux pour créer des opportunités réelles au plus haut niveau.",
      en: "Connecting with international academies, clubs and partners to create real opportunities at the highest level.",
    },
    image: "/program-05.png",
  },
];

export const playerBenefits = [
  { fr: "Programme individuel", en: "Individual program" },
  { fr: "Évaluations régulières", en: "Regular evaluations" },
  { fr: "Suivi scolaire", en: "Academic support" },
  { fr: "Suivi vidéo", en: "Video monitoring" },
  { fr: "Suivi physique", en: "Physical monitoring" },
  { fr: "Préparation mentale", en: "Mental preparation" },
];

export const sportDimensions = [
  {
    title: { fr: "Technique", en: "Technical" },
    description: {
      fr: "Perfectionner les fondamentaux : contrôle, passe, dribble, finition.",
      en: "Perfect fundamentals: control, passing, dribbling, finishing.",
    },
  },
  {
    title: { fr: "Tactique", en: "Tactical" },
    description: {
      fr: "Comprendre le jeu : placement, lecture, transitions offensives et défensives.",
      en: "Understand the game: positioning, reading, offensive and defensive transitions.",
    },
  },
  {
    title: { fr: "Physique", en: "Physical" },
    description: {
      fr: "Développer la condition : vitesse, endurance, force et agilité.",
      en: "Develop conditioning: speed, endurance, strength and agility.",
    },
  },
  {
    title: { fr: "Mental", en: "Mental" },
    description: {
      fr: "Renforcer la confiance, la résilience et la concentration.",
      en: "Strengthen confidence, resilience and concentration.",
    },
  },
];

export const weeklyProgram = [
  { fr: "Séance technique", en: "Technical session" },
  { fr: "Opposition / matchs", en: "Opposition / matches" },
  { fr: "Analyse vidéo", en: "Video analysis" },
  { fr: "Renforcement physique", en: "Physical strengthening" },
];

export const joinConditions = [
  { fr: "Âge entre 15 et 17 ans", en: "Age between 15 and 17" },
  { fr: "Motivation et engagement", en: "Motivation and commitment" },
  { fr: "Niveau sportif confirmé", en: "Confirmed sporting level" },
  { fr: "Engagement scolaire", en: "Academic commitment" },
  { fr: "Autorisation parentale", en: "Parental authorization" },
];

export const joinProcess = [
  { fr: "Étude du dossier", en: "Application review" },
  { fr: "Convocation éventuelle", en: "Possible invitation" },
  { fr: "Test technique", en: "Technical test" },
  { fr: "Entretien joueur / parent", en: "Player / parent interview" },
  { fr: "Intégration si sélectionné", en: "Integration if selected" },
];

export const educationSections = {
  academic: [
    { fr: "Organisation scolaire", en: "School organization" },
    { fr: "Méthodes de travail", en: "Study methods" },
    { fr: "Discipline", en: "Discipline" },
    { fr: "Objectifs trimestriels", en: "Quarterly goals" },
  ],
  personal: [
    { fr: "Leadership", en: "Leadership" },
    { fr: "Communication", en: "Communication" },
    { fr: "Gestion des émotions", en: "Emotional management" },
    { fr: "Responsabilité", en: "Responsibility" },
    { fr: "Culture générale", en: "General knowledge" },
  ],
  future: [
    { fr: "Orientation", en: "Guidance" },
    { fr: "Accompagnement", en: "Support" },
    { fr: "Projet sportif", en: "Sports project" },
    { fr: "Projet scolaire", en: "Academic project" },
    { fr: "Projet professionnel", en: "Professional project" },
  ],
};

export const performanceTools = [
  {
    title: { fr: "Analyse vidéo Veo", en: "Veo video analysis" },
    description: {
      fr: "Enregistrement automatique et analyse des matchs et entraînements.",
      en: "Automatic recording and analysis of matches and training.",
    },
  },
  {
    title: { fr: "Données Footbar", en: "Footbar data" },
    description: {
      fr: "Statistiques de performance en temps réel pendant les séances.",
      en: "Real-time performance statistics during sessions.",
    },
  },
  {
    title: { fr: "Suivi physique", en: "Physical monitoring" },
    description: {
      fr: "Tests réguliers de vitesse, endurance et force.",
      en: "Regular speed, endurance and strength tests.",
    },
  },
  {
    title: { fr: "Statistiques individuelles", en: "Individual statistics" },
    description: {
      fr: "Tableaux de bord personnalisés pour chaque joueur.",
      en: "Personalized dashboards for each player.",
    },
  },
  {
    title: { fr: "Préparation mentale", en: "Mental preparation" },
    description: {
      fr: "Accompagnement psychologique et gestion de la pression.",
      en: "Psychological support and pressure management.",
    },
  },
];

export const performanceMetrics = [
  { key: "speed", label: { fr: "Vitesse", en: "Speed" }, value: "32.4 km/h", trend: "+2.1%" },
  { key: "endurance", label: { fr: "Endurance", en: "Endurance" }, value: "87%", trend: "+5.3%" },
  { key: "actions", label: { fr: "Actions", en: "Actions" }, value: "142", trend: "+12" },
  { key: "precision", label: { fr: "Précision", en: "Precision" }, value: "78%", trend: "+4.2%" },
  { key: "progress", label: { fr: "Progression", en: "Progress" }, value: "+18%", trend: "+3.1%" },
  { key: "load", label: { fr: "Charge d'entraînement", en: "Training load" }, value: "Modérée", trend: "Stable" },
];
