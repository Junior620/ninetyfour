import type { Partner } from "@/types";

export const partners: Partner[] = [
  {
    id: "voak",
    name: "Voak Sport",
    role: {
      fr: "Équipementier officiel",
      en: "Official kit supplier",
    },
    description: {
      fr: "Voak Sport équipe nos joueurs avec des tenues professionnelles de haute qualité, garantissant confort et performance sur le terrain.",
      en: "Voak Sport equips our players with high-quality professional kits, ensuring comfort and performance on the pitch.",
    },
    website: "https://voaksport.com",
  },
  {
    id: "footbar",
    name: "Footbar",
    role: {
      fr: "Performance sportive et données",
      en: "Sports performance and data",
    },
    description: {
      fr: "Footbar fournit des données de performance en temps réel pour analyser la vitesse, l'endurance et les actions de chaque joueur.",
      en: "Footbar provides real-time performance data to analyze each player's speed, endurance and actions.",
    },
    website: "https://footbar.com",
  },
  {
    id: "veo",
    name: "Veo",
    role: {
      fr: "Analyse vidéo intelligente",
      en: "Smart video analysis",
    },
    description: {
      fr: "Veo permet l'enregistrement et l'analyse vidéo automatique des matchs et entraînements pour un feedback précis.",
      en: "Veo enables automatic video recording and analysis of matches and training for precise feedback.",
    },
    website: "https://veo.co",
  },
];

export const partnerBenefits = [
  {
    title: { fr: "Qualité", en: "Quality" },
    description: {
      fr: "Des partenaires reconnus pour leur excellence.",
      en: "Partners recognized for their excellence.",
    },
  },
  {
    title: { fr: "Innovation", en: "Innovation" },
    description: {
      fr: "Technologies de pointe au service des joueurs.",
      en: "Cutting-edge technology at the service of players.",
    },
  },
  {
    title: { fr: "Fiabilité", en: "Reliability" },
    description: {
      fr: "Des outils éprouvés par les meilleures académies.",
      en: "Tools proven by the best academies.",
    },
  },
  {
    title: { fr: "Ouverture internationale", en: "International outlook" },
    description: {
      fr: "Un réseau mondial d'opportunités.",
      en: "A global network of opportunities.",
    },
  },
];
