import type { GalleryItem } from "@/types";

export const galleryItems: GalleryItem[] = [
  {
    id: "g1",
    title: { fr: "Séance technique", en: "Technical session" },
    category: "training",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=80",
    type: "image",
  },
  {
    id: "g2",
    title: { fr: "Travail physique", en: "Physical training" },
    category: "training",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe67508b?w=600&q=80",
    type: "image",
  },
  {
    id: "g3",
    title: { fr: "Match amical", en: "Friendly match" },
    category: "matches",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80",
    type: "image",
  },
  {
    id: "g4",
    title: { fr: "Célébration", en: "Celebration" },
    category: "matches",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=80",
    type: "image",
  },
  {
    id: "g5",
    title: { fr: "Vie à l'académie", en: "Academy life" },
    category: "academy-life",
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80",
    type: "image",
  },
  {
    id: "g6",
    title: { fr: "Équipe U17", en: "U17 team" },
    category: "academy-life",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80",
    type: "image",
  },
  {
    id: "g7",
    title: { fr: "Remise des maillots Voak", en: "Voak kit presentation" },
    category: "partners",
    image: "https://images.unsplash.com/photo-1624886478548-1c2e3e4e5e5a?w=600&q=80",
    type: "image",
  },
  {
    id: "g8",
    title: { fr: "Session Footbar", en: "Footbar session" },
    category: "partners",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80",
    type: "image",
  },
  {
    id: "g9",
    title: { fr: "Cours de soutien", en: "Tutoring session" },
    category: "education",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80",
    type: "image",
  },
  {
    id: "g10",
    title: { fr: "Séminaire leadership", en: "Leadership seminar" },
    category: "education",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80",
    type: "image",
  },
  {
    id: "v1",
    title: { fr: "Highlights match amical", en: "Friendly match highlights" },
    category: "matches",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80",
    type: "video",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "v2",
    title: { fr: "Analyse Veo — Séance technique", en: "Veo analysis — Technical session" },
    category: "training",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=80",
    type: "video",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
];

export const videoItems = galleryItems.filter((item) => item.type === "video");
export const imageItems = galleryItems.filter((item) => item.type === "image");
