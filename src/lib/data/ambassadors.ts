import type { Ambassador } from "@/types";

export const ambassadors: Ambassador[] = [
  {
    id: "martin-keller",
    name: "Martin Keller",
    role: {
      fr: "Mécène — Suisse",
      en: "Patron — Switzerland",
    },
    description: {
      fr: "Soutient l'académie par des dons matériels et contribue à sa visibilité en Europe.",
      en: "Supports the academy through material donations and helps raise its profile across Europe.",
    },
    country: { fr: "Suisse", en: "Switzerland" },
    photo: "/ambassador-01.jpg",
  },
  {
    id: "sarah-okonkwo",
    name: "Sarah Okonkwo",
    role: {
      fr: "Ambassadrice — Royaume-Uni",
      en: "Ambassador — United Kingdom",
    },
    description: {
      fr: "Relaie notre projet auprès de clubs et d'organisations sportives britanniques.",
      en: "Promotes our project among clubs and sports organizations in the United Kingdom.",
    },
    country: { fr: "Royaume-Uni", en: "United Kingdom" },
    photo: "/ambassador-02.jpg",
  },
  {
    id: "jean-pierre-dubois",
    name: "Jean-Pierre Dubois",
    role: {
      fr: "Connecteur — France",
      en: "Connector — France",
    },
    description: {
      fr: "Met l'académie en relation avec des partenaires et opportunités en France et en Afrique francophone.",
      en: "Connects the academy with partners and opportunities in France and French-speaking Africa.",
    },
    country: { fr: "France", en: "France" },
    photo: "/ambassador-03.jpg",
  },
  {
    id: "amina-hassan",
    name: "Amina Hassan",
    role: {
      fr: "Ambassadrice — Canada",
      en: "Ambassador — Canada",
    },
    description: {
      fr: "Développe notre réseau international et recherche des sponsors pour soutenir les jeunes talents.",
      en: "Expands our international network and seeks sponsors to support young talents.",
    },
    country: { fr: "Canada", en: "Canada" },
    photo: "/ambassador-04.jpg",
  },
];
