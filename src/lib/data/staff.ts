import type { StaffMember, TeamCategory } from "@/types";

/** Staff global de l'académie (direction, technique, médical…). */
export const staffMembers: StaffMember[] = [
  {
    id: "directeur-sportif",
    name: "Jean-Marc Mbarga",
    role: {
      fr: "Directeur sportif",
      en: "Sporting director",
    },
    bio: {
      fr: "Pilote la vision sportive de l'académie et coordonne l'ensemble des catégories.",
      en: "Leads the academy's sporting vision and coordinates all age categories.",
    },
    photo: "/ambassador-01.jpg",
    department: "direction",
  },
  {
    id: "coach-principal",
    name: "Paul Essomba",
    role: {
      fr: "Entraîneur principal",
      en: "Head coach",
    },
    bio: {
      fr: "Responsable de la méthodologie d'entraînement et du développement technique des joueurs.",
      en: "Responsible for training methodology and players' technical development.",
    },
    photo: "/ambassador-02.jpg",
    department: "technical",
  },
  {
    id: "prepa-physique",
    name: "Serge Ntone",
    role: {
      fr: "Préparateur physique",
      en: "Fitness coach",
    },
    bio: {
      fr: "Conçoit les programmes de condition physique adaptés à chaque catégorie d'âge.",
      en: "Designs fitness programs tailored to each age category.",
    },
    photo: "/ambassador-03.jpg",
    department: "performance",
  },
  {
    id: "staff-medical",
    name: "Dr. Aline Fouda",
    role: {
      fr: "Responsable médicale",
      en: "Medical lead",
    },
    bio: {
      fr: "Assure le suivi santé, la prévention des blessures et la récupération des joueurs.",
      en: "Oversees player health monitoring, injury prevention and recovery.",
    },
    photo: "/ambassador-04.jpg",
    department: "medical",
  },
];

/** Coaches assignés par catégorie (référencés aussi sur la page Équipes). */
const coachU14: StaffMember = {
  id: "coach-u14",
  name: "Kevin Owona",
  role: {
    fr: "Entraîneur U-14",
    en: "U-14 coach",
  },
  bio: {
    fr: "Accompagne les plus jeunes sur les bases techniques et le plaisir du jeu.",
    en: "Supports the youngest players with technical fundamentals and the joy of the game.",
  },
  photo: "/ambassador-01.jpg",
  department: "technical",
};

const coachU16: StaffMember = {
  id: "coach-u16",
  name: "Eric Biya",
  role: {
    fr: "Entraîneur U-16",
    en: "U-16 coach",
  },
  bio: {
    fr: "Développe la compréhension tactique et la compétitivité des joueurs en formation.",
    en: "Develops tactical understanding and competitiveness for players in development.",
  },
  photo: "/ambassador-02.jpg",
  department: "technical",
};

const coachU18: StaffMember = {
  id: "coach-u18",
  name: "Martin Atangana",
  role: {
    fr: "Entraîneur U-18",
    en: "U-18 coach",
  },
  bio: {
    fr: "Prépare les joueurs au haut niveau : intensité, discipline et lecture du jeu.",
    en: "Prepares players for elite level: intensity, discipline and game reading.",
  },
  photo: "/ambassador-03.jpg",
  department: "technical",
};

export const teamCategories: TeamCategory[] = [
  {
    id: "u14",
    label: { fr: "Catégorie U-14", en: "U-14 Category" },
    description: {
      fr: "Découverte et fondations : technique individuelle, coordination et esprit d'équipe pour les joueurs de moins de 14 ans.",
      en: "Discovery and foundations: individual technique, coordination and teamwork for players under 14.",
    },
    coaches: [coachU14],
  },
  {
    id: "u16",
    label: { fr: "Catégorie U-16", en: "U-16 Category" },
    description: {
      fr: "Progression structurée : tactique de base, physique adapté et compétition amicale pour les moins de 16 ans.",
      en: "Structured progression: basic tactics, age-appropriate fitness and friendly competition for under-16s.",
    },
    coaches: [coachU16],
  },
  {
    id: "u18",
    label: { fr: "Catégorie U-18", en: "U-18 Category" },
    description: {
      fr: "Vers le haut niveau : intensité d'entraînement, analyse de match et préparation mentale pour les moins de 18 ans.",
      en: "Toward elite level: training intensity, match analysis and mental preparation for under-18s.",
    },
    coaches: [coachU18],
  },
];
