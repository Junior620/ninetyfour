"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  aiModules,
  AI_UNAVAILABLE,
  type AiModule,
  type AiScreenState,
} from "@/lib/matchlab/ai";
import { useLab, Heading, useMutation, Feedback, api } from "./shared";

const previews: Record<
  AiModule,
  {
    title: string;
    text: string;
    columns: string[];
    rows: string[][];
    limits: string;
    draft?: string;
  }
> = {
  video: {
    title: "Couverture de la caméra et événements candidats",
    text: "Fichier fictif · aucun transfert · aucune identification réelle",
    columns: ["Personnage fictif", "Visibilité simulée", "Repère candidat"],
    rows: [
      [
        "Joueur A · dossard 8",
        "4 min sur 12 observables",
        "03:20 · passe à revoir",
      ],
      [
        "Joueur B · dossard 4",
        "3 min sur 12 observables",
        "07:10 · duel à confirmer",
      ],
    ],
    limits:
      "Temps visible à la caméra ≠ temps de jeu réel ≠ activité sur tout le terrain. Occlusions et caméra unique empêchent tout classement définitif. Dossards et événements exigent une confirmation humaine.",
  },
  "next-match": {
    title: "Axes de préparation à discuter",
    text: "Équipe fictive · trois rencontres simulées · proposition illustrative",
    columns: ["Axe", "Source fictive", "Revue attendue"],
    rows: [
      [
        "Sortie de balle côté gauche",
        "Match A · repère 12:30",
        "Vérifier avec le staff",
      ],
      ["Latéral à revoir", "Évaluations A et B", "Disponibilité inconnue"],
    ],
    limits:
      "Aucune sélection automatique. Les disponibilités ne se déduisent pas des notes. Le staff compose manuellement son équipe.",
  },
  summary: {
    title: "Brouillon de synthèse",
    text: "Références simulées : critères communs, poste et repère 03:20 du Match A.",
    columns: ["Preuve fictive", "Observation"],
    rows: [["Critère q1 · Match A", "Une observation à contextualiser"]],
    limits:
      "Le brouillon doit être relu, corrigé et sourcé avant toute utilisation. Aucune copie vers un rapport officiel dans cette démo.",
    draft:
      "APERÇU FICTIF — Le groupe a montré de bonnes intentions dans les sorties de balle observées. Revoir la séquence 03:20 avec l’éducateur. L’échantillon reste insuffisant pour conclure.",
  },
  assistant: {
    title: "Conversation privée — aperçu",
    text: "Exemple : quelles évaluations fictives restent incomplètes ?",
    columns: ["Réponse simulée", "Source fictive"],
    rows: [
      [
        "Une réponse manque ; ne pas l’assimiler à Non observé.",
        "Évaluation A · question q3",
      ],
    ],
    limits:
      "Toute réponse future doit citer ses sources, appliquer le périmètre autorisé et refuser les questions hors accès. Aucun LLM n’est appelé.",
    draft: "Quels latéraux progressent sur la période choisie ?",
  },
  trends: {
    title: "Tendance descriptive à confirmer",
    text: "Période fictive septembre–octobre · n = 3 · même poste observé",
    columns: ["Match fictif", "Observation simulée"],
    rows: [
      ["A", "Appuis à revoir"],
      ["B", "Placement plus régulier"],
      ["C", "Évolution à confirmer"],
    ],
    limits:
      "Trois rencontres constituent un petit échantillon. Aucun diagnostic de baisse de forme ; séparer les postes et les méthodes de notation.",
  },
  load: {
    title: "Minutes déclarées — aperçu non médical",
    text: "Valeurs entièrement fictives, sans GPS ni capteur",
    columns: ["Match fictif", "Minutes saisies", "Intervalle"],
    rows: [
      ["A", "45", "—"],
      ["B", "60", "7 jours"],
      ["C", "50", "6 jours"],
    ],
    limits:
      "Les minutes saisies ne mesurent ni fatigue, ni intensité, ni risque de blessure. Aucun kilomètre ni sprint n’est calculé.",
  },
  opponents: {
    title: "Fiche adversaire fictive",
    text: "Seulement des observations consignées par un staff fictif",
    columns: ["Observation", "Source fictive"],
    rows: [
      ["Bloc médian observé sur une séquence", "Match A · 18:40"],
      ["Dispositif à confirmer", "Note staff A"],
    ],
    limits:
      "Pas de données externes inventées. Une séquence ne décrit pas le comportement permanent d’un adversaire.",
  },
  training: {
    title: "Brouillon de séance à discuter",
    text: "Catégorie fictive U-17 · priorités issues de trois observations simulées",
    columns: ["Priorité", "Piste pédagogique"],
    rows: [
      ["Prise d’information", "Jeu de conservation adapté par l’éducateur"],
      ["Communication", "Retour collectif sur une séquence"],
    ],
    limits:
      "L’éducateur adapte et valide les exercices, la durée et les contraintes. Aucune prescription médicale ni charge automatique.",
    draft:
      "Objectif fictif : favoriser la prise d’information avant réception. À adapter au groupe et aux conditions du jour.",
  },
  voice: {
    title: "Note de terrain — texte de démonstration",
    text: "Microphone désactivé · aucune capture audio",
    columns: ["Association future", "Confirmation requise"],
    rows: [["Joueur, match, minute", "Choix explicite après relecture"]],
    limits:
      "Une future capture nécessitera un consentement audio et une politique de conservation. Aucun enregistrement ni transcription dans cette version.",
    draft: "Note fictive à relire avant de l’associer à une séquence.",
  },
  profiles: {
    title: "Profils à revoir — comparaison explicable",
    text: "Notes cibles modifiables dans Joueurs & profils ; exemple ci-dessous entièrement fictif",
    columns: ["Dimension", "Cible fictive", "Observation fictive"],
    rows: [
      ["Technique", "4/5", "À revoir sur deux matchs"],
      ["Tactique", "4/5", "Sources insuffisantes"],
    ],
    limits:
      "Les fondamentaux restent séparés de la note officielle 40/60. Pourcentages désactivés tant que la formule n’est pas validée. Aucune décision de recrutement automatique.",
  },
};
const states: Record<AiScreenState, string> = {
  empty: "Vide",
  loading: "Chargement simulé",
  error: "Erreur simulée",
  "not-configured": "Non configuré",
  demo: "Démonstration",
  "review-required": "Revue humaine requise",
};

export function AiLab() {
  const query = useSearchParams();
  const active =
    aiModules.find((m) => m.id === query.get("module")) || aiModules[0];
  return (
    <>
      <Heading title="N91 Lab IA" />
      <p className="ml-notice">
        Interfaces de préparation uniquement. Aucun moteur IA ni transfert vers
        un prestataire. Les données réelles restent hors des démonstrations.
      </p>
      <div className="ml-module-grid">
        {aiModules.map((m, i) => (
          <Link
            className="ml-card"
            key={m.id}
            href={`/matchlab/ai?module=${m.id}`}
            aria-current={active.id === m.id ? "page" : undefined}
          >
            <small>{String(i + 1).padStart(2, "0")} · Non configuré</small>
            <h2>{m.title}</h2>
            <p>{m.description}</p>
          </Link>
        ))}
      </div>
      <ModuleScreen key={active.id} module={active.id} />
    </>
  );
}
function ModuleScreen({ module }: { module: AiModule }) {
  const { data } = useLab();
  const mutation = useMutation();
  const [demo, setDemo] = useState(false);
  const [state, setState] = useState<AiScreenState>("demo");
  const [review, setReview] = useState("");
  const preview = previews[module];
  const [draft, setDraft] = useState(preview.draft || "");
  return (
    <section
      className="ml-card"
      aria-label={aiModules.find((m) => m.id === module)!.title}
    >
      <h2>{preview.title}</h2>
      <p className="ml-notice">{preview.limits}</p>
      {module === "video" && (
        <p>
          <Link className="ml-button secondary" href="/matchlab/analyze">
            Ouvrir le lecteur vidéo local et les repères manuels
          </Link>
        </p>
      )}
      {module === "profiles" && (
        <p>
          <Link href="/matchlab/players">
            Modifier les profils cibles du staff
          </Link>
        </p>
      )}
      <p>
        État du connecteur : <strong>Moteur non connecté</strong>
      </p>
      <div className="ml-actions">
        <button className="ml-button" disabled>
          {module === "voice"
            ? "Microphone à venir"
            : "Générer — moteur non connecté"}
        </button>
        <button
          className="ml-button secondary"
          onClick={() => {
            setDemo(!demo);
            setReview("");
          }}
        >
          {demo ? "Quitter l’aperçu fictif" : "Activer un aperçu fictif"}
        </button>
      </div>
      {demo && (
        <aside className="ml-notice">
          <h3>APERÇU — DONNÉES SIMULÉES</h3>
          <p>
            Aucune écriture dans les historiques, rapports, exports ou articles.
            La revue ci-dessous reste dans cette page.
          </p>
          <label>
            État à prévisualiser
            <select
              value={state}
              onChange={(e) => setState(e.target.value as AiScreenState)}
            >
              {Object.entries(states).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {state === "empty" ? (
            <p>Aucun résultat fictif à présenter.</p>
          ) : state === "loading" ? (
            <p role="status">
              Chargement simulé pour tester l’interface — aucune tâche serveur
              en cours.
            </p>
          ) : state === "error" ? (
            <p role="alert">
              Erreur simulée : source fictive indisponible. Les données
              officielles sont inchangées.
            </p>
          ) : state === "not-configured" ? (
            <p>Le connecteur est absent. Aucun traitement lancé.</p>
          ) : (
            <>
              <p>{preview.text}</p>
              <div className="ml-table-wrap">
                <table>
                  <thead>
                    <tr>
                      {preview.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.draft && (
                <label>
                  Brouillon fictif modifiable
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                </label>
              )}
              <p>
                Confiance : non mesurée · sources fictives · validation humaine
                obligatoire.
              </p>
              <label>
                Commentaire de revue fictive
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
              </label>
              <div className="ml-actions">
                {[
                  "Accepter comme note fictive",
                  "Ignorer",
                  "Demander une correction",
                ].map((action) => (
                  <button
                    key={action}
                    className="ml-button secondary"
                    onClick={() =>
                      setReview(`${action} — démonstration locale uniquement`)
                    }
                  >
                    {action}
                  </button>
                ))}
              </div>
              <p role="status">{review}</p>
            </>
          )}
        </aside>
      )}
      <details>
        <summary>Contrat du connecteur désactivé</summary>
        <pre className="ml-code">
          {JSON.stringify(
            {
              request: {
                module,
                contractVersion: "1",
                scope: data.filters,
                consentIds: [],
              },
              response: AI_UNAVAILABLE,
            },
            null,
            2,
          )}
        </pre>
        <button
          className="ml-button secondary"
          disabled={mutation.busy}
          onClick={() =>
            mutation.run(async () => {
              await api(`ai/${module}`, {
                contractVersion: "1",
                scope: data.filters,
                consentIds: [],
              });
            }, false)
          }
        >
          Vérifier le statut du connecteur
        </button>
        <Feedback {...mutation} />
      </details>
    </section>
  );
}
