import type { StaffMember, TeamCategory } from "@/types";

/** Photo temporaire — shooting officiel (maillots de match) à venir. */
export const STAFF_PHOTO_PLACEHOLDER = "/logo-crest.png";

/** Staff global de l'académie (direction, technique, médical…). */
export const staffMembers: StaffMember[] = [
  {
    id: "directeur-sportif",
    name: "À confirmer",
    role: {
      fr: "Directeur sportif",
      en: "Sporting director",
    },
    bio: {
      fr: "Pilote la vision sportive de l'académie et coordonne l'ensemble des catégories.",
      en: "Leads the academy's sporting vision and coordinates all age categories.",
    },
    photo: STAFF_PHOTO_PLACEHOLDER,
    department: "direction",
  },
  {
    id: "coach-principal",
    name: "À confirmer",
    role: {
      fr: "Entraîneur principal",
      en: "Head coach",
    },
    bio: {
      fr: "Responsable de la méthodologie d'entraînement et du développement technique des joueurs.",
      en: "Responsible for training methodology and players' technical development.",
    },
    photo: STAFF_PHOTO_PLACEHOLDER,
    department: "technical",
  },
  {
    id: "prepa-physique",
    name: "À confirmer",
    role: {
      fr: "Préparateur physique",
      en: "Fitness coach",
    },
    bio: {
      fr: "Conçoit les programmes de condition physique adaptés à chaque catégorie d'âge.",
      en: "Designs fitness programs tailored to each age category.",
    },
    photo: STAFF_PHOTO_PLACEHOLDER,
    department: "performance",
  },
  {
    id: "staff-medical",
    name: "À confirmer",
    role: {
      fr: "Responsable médicale",
      en: "Medical lead",
    },
    bio: {
      fr: "Assure le suivi santé, la prévention des blessures et la récupération des joueurs.",
      en: "Oversees player health monitoring, injury prevention and recovery.",
    },
    photo: STAFF_PHOTO_PLACEHOLDER,
    department: "medical",
  },
];

/** Staff dédié par catégorie — un encadrement propre à chaque U. */
function categoryStaff(
  category: "u14" | "u16" | "u18",
  labels: {
    coachRole: { fr: string; en: string };
    assistantRole: { fr: string; en: string };
    coachBio: { fr: string; en: string };
    assistantBio: { fr: string; en: string };
  }
): StaffMember[] {
  return [
    {
      id: `coach-${category}`,
      name: "À confirmer",
      role: labels.coachRole,
      bio: labels.coachBio,
      photo: STAFF_PHOTO_PLACEHOLDER,
      department: "technical",
    },
    {
      id: `adjoint-${category}`,
      name: "À confirmer",
      role: labels.assistantRole,
      bio: labels.assistantBio,
      photo: STAFF_PHOTO_PLACEHOLDER,
      department: "technical",
    },
  ];
}

export const teamCategories: TeamCategory[] = [
  {
    id: "u14",
    label: { fr: "Catégorie U-14", en: "U-14 Category" },
    shortLabel: { fr: "U-14", en: "U-14" },
    description: {
      fr: "Découverte et fondations : technique individuelle, coordination et esprit d'équipe pour les joueurs de moins de 14 ans. Staff dédié à cette catégorie.",
      en: "Discovery and foundations: individual technique, coordination and teamwork for players under 14. Dedicated staff for this category.",
    },
    image: "/hero-2.jpeg",
    coaches: categoryStaff("u14", {
      coachRole: { fr: "Entraîneur U-14", en: "U-14 coach" },
      assistantRole: {
        fr: "Entraîneur adjoint U-14",
        en: "U-14 assistant coach",
      },
      coachBio: {
        fr: "Responsable de la catégorie U-14 : bases techniques et plaisir du jeu.",
        en: "U-14 category lead: technical fundamentals and joy of the game.",
      },
      assistantBio: {
        fr: "Appuie l'entraîneur U-14 au quotidien sur le terrain.",
        en: "Supports the U-14 coach day to day on the pitch.",
      },
    }),
  },
  {
    id: "u16",
    label: { fr: "Catégorie U-16", en: "U-16 Category" },
    shortLabel: { fr: "U-16", en: "U-16" },
    description: {
      fr: "Progression structurée : tactique de base, physique adapté et compétition amicale pour les moins de 16 ans. Staff dédié à cette catégorie.",
      en: "Structured progression: basic tactics, age-appropriate fitness and friendly competition for under-16s. Dedicated staff for this category.",
    },
    image: "/hero-3.jpeg",
    coaches: categoryStaff("u16", {
      coachRole: { fr: "Entraîneur U-16", en: "U-16 coach" },
      assistantRole: {
        fr: "Entraîneur adjoint U-16",
        en: "U-16 assistant coach",
      },
      coachBio: {
        fr: "Responsable de la catégorie U-16 : tactique et compétitivité.",
        en: "U-16 category lead: tactics and competitiveness.",
      },
      assistantBio: {
        fr: "Appuie l'entraîneur U-16 au quotidien sur le terrain.",
        en: "Supports the U-16 coach day to day on the pitch.",
      },
    }),
  },
  {
    id: "u18",
    label: { fr: "Catégorie U-18", en: "U-18 Category" },
    shortLabel: { fr: "U-18", en: "U-18" },
    description: {
      fr: "Vers le haut niveau : intensité d'entraînement, analyse de match et préparation mentale pour les moins de 18 ans. Staff dédié à cette catégorie.",
      en: "Toward elite level: training intensity, match analysis and mental preparation for under-18s. Dedicated staff for this category.",
    },
    image: "/hero-4.jpeg",
    coaches: categoryStaff("u18", {
      coachRole: { fr: "Entraîneur U-18", en: "U-18 coach" },
      assistantRole: {
        fr: "Entraîneur adjoint U-18",
        en: "U-18 assistant coach",
      },
      coachBio: {
        fr: "Responsable de la catégorie U-18 : intensité et lecture du jeu.",
        en: "U-18 category lead: intensity and game reading.",
      },
      assistantBio: {
        fr: "Appuie l'entraîneur U-18 au quotidien sur le terrain.",
        en: "Supports the U-18 coach day to day on the pitch.",
      },
    }),
  },
];
