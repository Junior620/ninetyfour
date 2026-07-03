import type { Partner } from "@/types";

export const partners: Partner[] = [
  {
    id: "astra",
    name: "Astra Invest",
    logo: "/partner-astra.png",
    role: {
      fr: "Partenaire stratégique",
      en: "Strategic partner",
    },
    description: {
      fr: "Astra Invest soutient la vision de Ninety One Foot Academy en tant que partenaire stratégique du projet.",
      en: "Astra Invest supports Ninety One Foot Academy's vision as a strategic partner of the project.",
    },
  },
  {
    id: "voak",
    name: "Voak Sport",
    logo: "/partner-voak.png",
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
    id: "johny",
    name: "Johny Sport Consulting",
    logo: "/partner-johny.png",
    role: {
      fr: "Accompagnement sportif",
      en: "Sports consulting",
    },
    description: {
      fr: "Johny Sport Consulting accompagne le développement sportif et stratégique de l'académie avec une expertise terrain reconnue.",
      en: "Johny Sport Consulting supports the academy's sporting and strategic development with recognized field expertise.",
    },
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
