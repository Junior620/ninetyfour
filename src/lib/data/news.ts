import type { NewsArticle } from "@/types";

export const newsArticles: NewsArticle[] = [
  {
    slug: "lancement-programme-2026",
    title: {
      fr: "Lancement officiel du programme 2026–2029",
      en: "Official launch of the 2026–2029 program",
    },
    excerpt: {
      fr: "Ninety One Foot Academy dévoile son ambitieux programme de formation pour les trois prochaines années.",
      en: "Ninety One Foot Academy unveils its ambitious training program for the next three years.",
    },
    content: {
      fr: "Ninety One Foot Academy est fière d'annoncer le lancement officiel de son programme 2026–2029. Ce programme structuré vise à former les leaders du football africain de demain, en combinant excellence sportive, éducation rigoureuse et développement humain.\n\nBasée à Douala, l'académie accueillera des jeunes talents âgés de 15 à 17 ans pour un parcours complet de développement. Avec 4 séances structurées par semaine et un suivi individualisé, chaque joueur bénéficiera d'un accompagnement sur mesure.\n\nLes partenariats avec Voak Sport, Footbar et Veo garantissent un environnement de performance de classe internationale.",
      en: "Ninety One Foot Academy is proud to announce the official launch of its 2026–2029 program. This structured program aims to train tomorrow's African football leaders, combining sporting excellence, rigorous education and human development.\n\nBased in Douala, the academy will welcome young talents aged 15 to 17 for a complete development journey. With 4 structured sessions per week and individualized tracking, each player will benefit from tailored support.\n\nPartnerships with Voak Sport, Footbar and Veo guarantee a world-class performance environment.",
    },
    category: "academy",
    date: "2026-01-15",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe67508b?w=800&q=80",
  },
  {
    slug: "partenariat-voak-sport",
    title: {
      fr: "Partenariat officiel avec Voak Sport",
      en: "Official partnership with Voak Sport",
    },
    excerpt: {
      fr: "Voak Sport devient l'équipementier officiel de Ninety One Foot Academy.",
      en: "Voak Sport becomes the official kit supplier of Ninety One Foot Academy.",
    },
    content: {
      fr: "Nous sommes ravis d'annoncer notre partenariat officiel avec Voak Sport. Tous nos joueurs seront équipés avec des tenues professionnelles de haute qualité, conçues pour la performance et le confort.\n\nCe partenariat s'inscrit dans notre vision d'offrir les meilleures conditions de développement à nos talents.",
      en: "We are delighted to announce our official partnership with Voak Sport. All our players will be equipped with high-quality professional kits, designed for performance and comfort.\n\nThis partnership is part of our vision to offer the best development conditions to our talents.",
    },
    category: "partners",
    date: "2026-02-01",
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80",
  },
  {
    slug: "journee-detection-douala",
    title: {
      fr: "Journée de détection à Douala",
      en: "Scouting day in Douala",
    },
    excerpt: {
      fr: "Une journée portes ouvertes pour découvrir les talents de la région.",
      en: "An open day to discover regional talents.",
    },
    content: {
      fr: "Ninety One Foot Academy organise sa première journée de détection à Douala. Les jeunes joueurs âgés de 15 à 17 ans sont invités à participer à des tests techniques et tactiques.\n\nInscriptions ouvertes — places limitées.",
      en: "Ninety One Foot Academy is organizing its first scouting day in Douala. Young players aged 15 to 17 are invited to participate in technical and tactical tests.\n\nRegistrations open — limited places.",
    },
    category: "events",
    date: "2026-02-20",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
  },
  {
    slug: "integration-footbar-veo",
    title: {
      fr: "Intégration des outils Footbar et Veo",
      en: "Integration of Footbar and Veo tools",
    },
    excerpt: {
      fr: "Le Performance Lab équipe l'académie de technologies de pointe.",
      en: "The Performance Lab equips the academy with cutting-edge technology.",
    },
    content: {
      fr: "Notre Performance Lab intègre désormais les solutions Footbar et Veo pour un suivi complet des performances. Chaque joueur dispose d'un tableau de bord personnalisé avec données techniques, physiques et vidéo.\n\nUne révolution dans le développement des jeunes talents africains.",
      en: "Our Performance Lab now integrates Footbar and Veo solutions for complete performance monitoring. Each player has a personalized dashboard with technical, physical and video data.\n\nA revolution in the development of young African talents.",
    },
    category: "training",
    date: "2026-03-05",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
  },
  {
    slug: "premier-match-amical",
    title: {
      fr: "Premier match amical de la saison",
      en: "First friendly match of the season",
    },
    excerpt: {
      fr: "Les jeunes de l'académie disputent leur premier match officiel.",
      en: "Academy youngsters play their first official match.",
    },
    content: {
      fr: "L'équipe U17 de Ninety One Foot Academy a disputé son premier match amical de la saison. Une performance encourageante qui confirme le potentiel de notre groupe.\n\nAnalyse vidéo Veo disponible pour le staff technique.",
      en: "The Ninety One Foot Academy U17 team played its first friendly match of the season. An encouraging performance that confirms our group's potential.\n\nVeo video analysis available for the technical staff.",
    },
    category: "matches",
    date: "2026-03-18",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80",
  },
  {
    slug: "seminaire-education-leadership",
    title: {
      fr: "Séminaire éducation et leadership",
      en: "Education and leadership seminar",
    },
    excerpt: {
      fr: "Un atelier dédié au développement personnel des joueurs.",
      en: "A workshop dedicated to players' personal development.",
    },
    content: {
      fr: "L'académie a organisé un séminaire sur le leadership et la communication. Les joueurs ont participé à des ateliers interactifs sur la gestion des émotions et la responsabilité.\n\nParce que former des leaders, c'est aussi former des citoyens.",
      en: "The academy organized a seminar on leadership and communication. Players participated in interactive workshops on emotional management and responsibility.\n\nBecause training leaders also means training citizens.",
    },
    category: "academy",
    date: "2026-04-02",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
  },
];

export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return newsArticles.find((a) => a.slug === slug);
}
