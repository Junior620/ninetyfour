import type { Pillar } from "@/types";

export const academyInfo = {
  period: "2026–2029",
  targetAge: { fr: "15–17 ans", en: "15–17 years" },
  sessionsPerWeek: { fr: "4 séances structurées par semaine", en: "4 structured sessions per week" },
  location: { fr: "Douala, Cameroun", en: "Douala, Cameroon" },
};

export const promisePillars: Pillar[] = [
  {
    id: "talent",
    title: { fr: "Talent", en: "Talent" },
    description: {
      fr: "Identifier, révéler et accompagner les jeunes joueurs à fort potentiel.",
      en: "Identify, reveal and support young players with high potential.",
    },
    tag: { fr: "Détection", en: "Detection" },
    href: "/formation-sportive",
    icon: "Star",
    image: "/promise-01.png",
  },
  {
    id: "education",
    title: { fr: "Éducation", en: "Education" },
    description: {
      fr: "Construire des bases scolaires solides pour préparer l'avenir de chaque joueur.",
      en: "Build solid academic foundations to prepare each player's future.",
    },
    tag: { fr: "Suivi scolaire", en: "Academic support" },
    href: "/education",
    icon: "GraduationCap",
    image: "/promise-02.png",
  },
  {
    id: "performance",
    title: { fr: "Performance", en: "Performance" },
    description: {
      fr: "Mesurer, analyser et faire progresser chaque athlète avec méthode.",
      en: "Measure, analyze and develop each athlete with method.",
    },
    tag: { fr: "Analyse", en: "Analysis" },
    href: "/performance-lab",
    icon: "TrendingUp",
    image: "/promise-03.png",
  },
  {
    id: "leadership",
    title: { fr: "Leadership", en: "Leadership" },
    description: {
      fr: "Former des joueurs responsables, disciplinés et capables d'inspirer.",
      en: "Train responsible, disciplined players who can inspire others.",
    },
    tag: { fr: "Leadership", en: "Leadership" },
    href: "/vision",
    icon: "Crown",
    image: "/promise-04.png",
  },
];

export const dimensions: Pillar[] = [
  {
    id: "sport",
    title: { fr: "Formation sportive", en: "Sports training" },
    description: {
      fr: "Technique, tactique, physique et mental au plus haut niveau.",
      en: "Technique, tactics, physical and mental at the highest level.",
    },
    icon: "Dumbbell",
  },
  {
    id: "edu",
    title: { fr: "Éducation", en: "Education" },
    description: {
      fr: "Suivi scolaire personnalisé et discipline académique.",
      en: "Personalized academic support and academic discipline.",
    },
    icon: "BookOpen",
  },
  {
    id: "tech",
    title: { fr: "Technologie", en: "Technology" },
    description: {
      fr: "Analyse vidéo, données de performance et suivi intelligent.",
      en: "Video analysis, performance data and smart tracking.",
    },
    icon: "Cpu",
  },
  {
    id: "human",
    title: { fr: "Développement humain", en: "Human development" },
    description: {
      fr: "Leadership, communication et responsabilité au quotidien.",
      en: "Leadership, communication and responsibility every day.",
    },
    icon: "Heart",
  },
];

export const keyStats = [
  {
    value: { fr: "15–17 ANS", en: "15–17 YRS" },
    label: { fr: "Catégorie d'âge cible", en: "Target age category" },
    tag: { fr: "Formation", en: "Training" },
    icon: "Users",
    image: "/stat-01.png",
    featured: true,
  },
  {
    value: { fr: "4 SÉANCES / SEMAINE", en: "4 SESSIONS / WEEK" },
    label: { fr: "Entraînements structurés", en: "Structured training" },
    tag: { fr: "Encadrement", en: "Coaching" },
    icon: "Timer",
    image: "/stat-02.png",
    featured: true,
  },
  {
    value: { fr: "100 %", en: "100 %" },
    label: { fr: "Suivi individualisé", en: "Individualized tracking" },
    tag: { fr: "Accompagnement", en: "Support" },
    icon: "UserCheck",
    image: "/stat-03.png",
    featured: true,
  },
  {
    value: { fr: "DOUALA", en: "DOUALA" },
    label: {
      fr: "Ancrage local, ambition internationale",
      en: "Local roots, international ambition",
    },
    tag: { fr: "Territoire", en: "Territory" },
    icon: "MapPin",
    image: "/stat-04.png",
    featured: true,
  },
  {
    value: { fr: "4 PILIERS", en: "4 PILLARS" },
    label: {
      fr: "Sport, éducation, performance, leadership",
      en: "Sport, education, performance, leadership",
    },
    tag: { fr: "Modèle", en: "Model" },
    icon: "Landmark",
    image: "/stat-05.png",
  },
  {
    value: { fr: "3 PARTENAIRES", en: "3 PARTNERS" },
    label: {
      fr: "Un écosystème au service du talent",
      en: "An ecosystem serving talent",
    },
    tag: { fr: "Réseau", en: "Network" },
    icon: "Handshake",
    image: "/stat-06.png",
  },
  {
    value: { fr: "2 OUTILS", en: "2 TOOLS" },
    label: {
      fr: "Technologies de performance",
      en: "Performance technologies",
    },
    note: { fr: "Footbar & Veo", en: "Footbar & Veo" },
    tag: { fr: "Performance", en: "Performance" },
    icon: "BarChart3",
    image: "/stat-07.png",
  },
  {
    value: { fr: "1 VISION", en: "1 VISION" },
    label: {
      fr: "Former les leaders du football africain",
      en: "Shaping African football leaders",
    },
    tag: { fr: "Ambition", en: "Ambition" },
    icon: "Target",
    image: "/stat-08.png",
  },
];

export const values: Pillar[] = [
  {
    id: "excellence",
    title: { fr: "Excellence", en: "Excellence" },
    description: { fr: "Viser le meilleur dans chaque détail.", en: "Aiming for the best in every detail." },
    icon: "Award",
  },
  {
    id: "discipline",
    title: { fr: "Discipline", en: "Discipline" },
    description: { fr: "La constance forge les champions.", en: "Consistency builds champions." },
    icon: "Target",
  },
  {
    id: "respect",
    title: { fr: "Respect", en: "Respect" },
    description: { fr: "Envers soi, les autres et le jeu.", en: "Towards oneself, others and the game." },
    icon: "Handshake",
  },
  {
    id: "ambition",
    title: { fr: "Ambition", en: "Ambition" },
    description: { fr: "Rêver grand, travailler plus dur.", en: "Dream big, work harder." },
    icon: "Rocket",
  },
  {
    id: "humility",
    title: { fr: "Humilité", en: "Humility" },
    description: { fr: "Apprendre chaque jour pour progresser.", en: "Learn every day to progress." },
    icon: "Leaf",
  },
];

export const whyReasons: Pillar[] = [
  {
    id: "structure",
    title: { fr: "Encadrement structuré", en: "Structured coaching" },
    description: {
      fr: "Un staff qualifié et un programme rigoureux.",
      en: "Qualified staff and a rigorous program.",
    },
    icon: "Users",
  },
  {
    id: "vision",
    title: { fr: "Vision long terme", en: "Long-term vision" },
    description: {
      fr: "Programme 2026–2029 pour un développement durable.",
      en: "2026–2029 program for sustainable development.",
    },
    icon: "Eye",
  },
  {
    id: "individual",
    title: { fr: "Suivi individualisé", en: "Individual tracking" },
    description: {
      fr: "Chaque joueur bénéficie d'un plan personnalisé.",
      en: "Each player benefits from a personalized plan.",
    },
    icon: "UserCheck",
  },
  {
    id: "international",
    title: { fr: "Ouverture internationale", en: "International outlook" },
    description: {
      fr: "Des partenaires et opportunités à l'échelle mondiale.",
      en: "Partners and opportunities on a global scale.",
    },
    icon: "Globe",
  },
];

export const academySummary = [
  { label: { fr: "Âge cible", en: "Target age" }, value: { fr: "15–17 ans", en: "15–17 years" } },
  { label: { fr: "Séances", en: "Sessions" }, value: { fr: "4 par semaine", en: "4 per week" } },
  { label: { fr: "Suivi scolaire", en: "Academic support" }, value: { fr: "Personnalisé", en: "Personalized" } },
  { label: { fr: "Analyse Footbar", en: "Footbar analysis" }, value: { fr: "Données performance", en: "Performance data" } },
  { label: { fr: "Analyse vidéo Veo", en: "Veo video analysis" }, value: { fr: "Matchs & entraînements", en: "Matches & training" } },
  { label: { fr: "Partenaire Voak Sport", en: "Voak Sport partner" }, value: { fr: "Équipementier officiel", en: "Official kit supplier" } },
];

export const historyContent = {
  fr: "Ninety One Foot Academy est née d'une conviction profonde : l'Afrique regorge de talents footballistiques qui méritent un cadre d'excellence pour s'épanouir. Ancrée à Douala, notre académie s'inscrit dans une ambition continentale — former les leaders du football africain de demain, avec un programme structuré de 2026 à 2029.",
  en: "Ninety One Foot Academy was born from a deep conviction: Africa is full of football talents who deserve an excellence framework to thrive. Based in Douala, our academy is part of a continental ambition — to train tomorrow's African football leaders, with a structured program from 2026 to 2029.",
};

export const visionContent = {
  vision: {
    fr: "Devenir une référence du développement des jeunes talents en Afrique centrale.",
    en: "Become a benchmark for young talent development in Central Africa.",
  },
  mission: {
    fr: "Identifier, former et accompagner les jeunes joueurs à fort potentiel.",
    en: "Identify, train and support high-potential young players.",
  },
  engagement: {
    fr: "Créer des opportunités réelles pour les talents africains, avec un suivi sportif, scolaire et humain.",
    en: "Create real opportunities for African talents, with sporting, academic and human support.",
  },
};

export const contactInfo = {
  email: "contact@ninetyonefoot.academy",
  phone: "+237 6XX XXX XXX",
  whatsapp: "https://wa.me/237600000000",
  address: { fr: "Douala, Cameroun", en: "Douala, Cameroon" },
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
  },
};

export const images = {
  hero: "/hero.png",
  heroImages: [
    "/hero.png",
    "/hero-2.jpeg",
    "/hero-3.jpeg",
    "/hero-4.jpeg",
  ],
  stats: "/stats.png",
  academy: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80",
  training: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80",
  education: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
  performance: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80",
  team: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&q=80",
};
