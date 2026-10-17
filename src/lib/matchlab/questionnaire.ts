export type Locale = "fr" | "en";
export const POSITIONS = [
  "GK",
  "CB",
  "FB",
  "DM",
  "CM",
  "AM",
  "WG",
  "ST",
] as const;
export type Position = (typeof POSITIONS)[number];
export type Question = { id: string; label: string; text: string };
export const positionNames: Record<Position, string> = {
  GK: "Gardien",
  CB: "Défenseur central",
  FB: "Latéral",
  DM: "Milieu défensif",
  CM: "Milieu relayeur",
  AM: "Milieu offensif",
  WG: "Ailier",
  ST: "Avant-centre",
};
const questions = (rows: [string, string][]): Question[] =>
  rows.map(([label, text], i) => ({ id: `q${i + 1}`, label, text }));
export const commonQuestions = questions([
  ["Mission", "A-t-il respecté la mission et les consignes de son poste ?"],
  [
    "Prise d'information",
    "A-t-il pris des informations avant de recevoir ou d'agir ?",
  ],
  [
    "Technique sous pression",
    "A-t-il exécuté ses gestes techniques sous pression ?",
  ],
  ["Décision", "A-t-il choisi la solution adaptée au moment du jeu ?"],
  ["Transitions", "A-t-il réagi après une perte ou une récupération ?"],
  ["Communication", "A-t-il communiqué et gardé sa concentration ?"],
]);
export const specificQuestions: Record<Position, Question[]> = {
  GK: questions([
    ["Placement", "Son placement a-t-il protégé le but et la profondeur ?"],
    ["Arrêts", "A-t-il réalisé les arrêts attendus et sécurisé les ballons ?"],
    [
      "Décision de sortie",
      "A-t-il bien décidé de sortir sur les centres et les ballons en profondeur ?",
    ],
    [
      "Relance",
      "Ses relances ont-elles permis de ressortir ou de trouver une cible ?",
    ],
    ["Commandement", "A-t-il guidé sa défense ?"],
  ]),
  CB: questions([
    [
      "Ligne et profondeur",
      "A-t-il maîtrisé la profondeur et la ligne défensive ?",
    ],
    ["Duels", "A-t-il bien géré ses duels ?"],
    ["Couverture", "A-t-il protégé l'axe et couvert son partenaire ?"],
    [
      "Première relance",
      "A-t-il assuré une première passe utile vers l'avant ?",
    ],
    [
      "Jeu aérien",
      "A-t-il défendu efficacement les centres et ballons aériens ?",
    ],
  ]),
  FB: questions([
    ["Un contre un", "A-t-il contenu son adversaire direct ?"],
    ["Second poteau", "A-t-il protégé le second poteau ?"],
    ["Projection", "A-t-il choisi le bon moment pour monter ?"],
    [
      "Dernier geste",
      "Ses centres ou passes en retrait ont-ils créé du danger ?",
    ],
    ["Repli", "A-t-il effectué ses replis défensifs ?"],
  ]),
  DM: questions([
    ["Protection de l'axe", "A-t-il protégé l'axe devant la défense ?"],
    [
      "Récupération",
      "A-t-il récupéré des ballons et disputé les seconds ballons ?",
    ],
    ["Orientation", "A-t-il orienté le jeu et assuré la première relance ?"],
    ["Résistance au pressing", "A-t-il résisté au pressing ?"],
    ["Couverture", "A-t-il compensé les montées de ses partenaires ?"],
  ]),
  CM: questions([
    [
      "Volume de jeu",
      "A-t-il participé aux deux phases avec un volume constant ?",
    ],
    ["Intervalles", "A-t-il trouvé des espaces pour recevoir ?"],
    [
      "Progression",
      "A-t-il fait progresser le jeu par la passe ou la conduite ?",
    ],
    ["Projection", "A-t-il accompagné les attaques ?"],
    ["Pressing", "A-t-il pressé au bon moment ?"],
  ]),
  AM: questions([
    [
      "Espaces entre les lignes",
      "A-t-il trouvé des espaces entre les lignes ?",
    ],
    [
      "Jeu sous pression",
      "A-t-il pu se retourner ou jouer juste sous pression ?",
    ],
    ["Dernière passe", "A-t-il créé des occasions par ses dernières passes ?"],
    ["Liaison", "A-t-il relié efficacement le milieu et l'attaque ?"],
    ["Pressing haut", "A-t-il aidé l'équipe à récupérer haut ?"],
  ]),
  WG: questions([
    ["Un contre un", "A-t-il créé un avantage en un contre un ?"],
    ["Appels", "Ses appels ont-ils donné de la profondeur ?"],
    ["Création", "A-t-il créé des occasions par ses centres ou conduites ?"],
    [
      "Choix offensif",
      "A-t-il bien choisi entre dribbler, passer, centrer et tirer ?",
    ],
    ["Repli", "A-t-il participé au repli défensif ?"],
  ]),
  ST: questions([
    ["Appels", "A-t-il proposé des appels utiles et attaqué les espaces ?"],
    [
      "Jeu en appui",
      "A-t-il conservé le ballon et combiné avec ses partenaires ?",
    ],
    ["Finition", "A-t-il bien choisi ses gestes de finition ?"],
    [
      "Présence dans la surface",
      "A-t-il occupé les bonnes zones dans la surface ?",
    ],
    ["Pressing", "A-t-il orienté le pressing adverse ?"],
  ]),
};
export const collectiveQuestions = questions([
  ["Intensité", "L'équipe a-t-elle maintenu son intensité jusqu'au terme ?"],
  ["Organisation défensive", "Le bloc a-t-il protégé les zones clés ?"],
  ["Transitions", "L'équipe a-t-elle réagi après perte et récupération ?"],
  ["Finition", "A-t-elle créé et bien conclu ses occasions ?"],
  ["Solidité défensive", "A-t-elle limité les occasions dangereuses ?"],
]);
/** Report wording (PDF §5.4): criteria answered 4–5 support, 1–2 to work on. "Non observé" and 3 are left out. */
export function answerHighlights(
  position: Position,
  common: Record<string, number | null>,
  specific: Record<string, number | null>,
) {
  const rows = [
    ...commonQuestions.map((q) => [q.label, common[q.id]] as const),
    ...specificQuestions[position].map((q) => [q.label, specific[q.id]] as const),
  ];
  const pick = (keep: (v: number) => boolean) =>
    rows
      .filter(([, v]) => typeof v === "number" && keep(v))
      .map(([label]) => label);
  return { support: pick((v) => v >= 4), work: pick((v) => v <= 2) };
}
// The immutable French source is authoritative. English can be added by version without changing question IDs.
export const questionnaires = {
  "pdf-1.1": {
    fr: {
      common: commonQuestions,
      specific: specificQuestions,
      collective: collectiveQuestions,
    },
  },
};
