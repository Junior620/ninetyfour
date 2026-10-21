# Données et règles

Migrations additives `supabase/migrations/202610150001…` : tables préfixées ml_, aucune modification des modèles Prisma du club. Types Supabase générés dans `src/lib/matchlab/database.types.ts`, contrats applicatifs Zod dans schema.ts.

- ml_members / scopes / shares / sessions : rôles direction, staff, reader, permissions distinctes, affectations et révocation.
- seasons / categories : saisons éditables ; U-14, U-16, U-17, U-18 initialisées.
- players / memberships : profil, poste habituel, pied, statut ; dossard 1–99 par appartenance. Un doublon de dossard est un avertissement, pas une unicité mondiale.
- matches : circonstances descriptives, score nullable, collectif séparé, brouillon/évalué/revu, nom vidéo local sans fichier transféré. `circumstances` (jsonb validé par Zod) : `match_type`, `ground` (`home`/`away`/`neutral`), `surface`, `pitch`, `weather`, `opposition`, `system`, `scenario`, `events` (`absences`, `injury`, `red_card`, `tactical_change`, `interruption`, `delay`), `absences`, `incidents`, `travel`, `duration`. Les listes proposées reprennent la référence ; une valeur libre antérieure reste valide. `updated_at` est tenu par le trigger `ml_matches_touch_updated_at` (migration 202610170012).
- questionnaires / evaluations : questionnaire PDF 1.1 immuable, six questions communes et cinq pour chacun des huit postes ; une évaluation par match/joueur/poste. Le JSON omis représente absence ; null signifie Non observé.
- markers : positif, correction, occasion, transition ; minute/seconde, joueur optionnel, poste, thème et observation.
- reports : instantané immuable, révision, auteur, validateur, motif de correction ; audit avant/après des entités modifiables.
- alerts / alert_reads : une alerte par match, rafraîchie sans doublon ; lecture par compte. Une rencontre évaluée sans score reste signalée.
- consents / media / settings : autorisations photo interne/export, justificatifs privés, politique et durée définies par la direction. Rien n’est activé par défaut sans politique.
- targets : fondamentaux séparés du questionnaire officiel.
- articles / article_revisions : CMS bilingue, publication explicite.

Note individuelle = (moyenne des réponses communes notées × 0,40 + moyenne des réponses de poste notées × 0,60) × 2. Un groupe entièrement absent/non observé rend la note non calculable. Pas de zéro ajouté. Précision conservée ; une décimale à l’affichage. Exemple 4 et 3 → 6,8/10. La note collective est indépendante et les circonstances n’altèrent jamais le calcul.

Ex æquo conservés, effectifs de joueurs distincts, résultats ventilés par poste et avertissement n < 5. Les notes de fondamentaux n’entrent pas dans le 40/60. Toute écriture utilise une version attendue et un conflit explicite HTTP409. Les rapports créent de nouvelles révisions ; ils ne remplacent pas un instantané validé.

## Ajouts du cahier v2.2 (migrations 202610180013 à 202610210020)

- lineups : scénarios du terrain tactique (saison, catégorie, type, formation, placements avec rôle et consigne, banc, notes, match optionnel) et leurs simulations d’action enregistrées (`simulations` : nom, formation, porteur de départ, gestes tracés, adversaires ; 12 au maximum).
- requirements / trials : référentiel d’essai (catégorie × poste × critère → niveau 1–5, échantillon minimal) et décisions d’essai immuables, auteur fixé par la base.
- videos : vidéo de match dans le bucket privé `matchlab-videos` (chemin, taille, durée, équipe filmée, conditions, état) ; import soumis à la gouvernance.
- markers (étendu) : douze actions du cahier, fin, résultat, tags, vérification avec auteur, source (manuelle, direct, IA), vidéo, minute.
- players.updated_at : date de mise à jour de la fiche.
- consents.purpose : ajout de `dossier_share` (diffusion d’un dossier club).
- dossiers : dossier club (destinataire, période, éléments, points forts, axes, séquences choisies), préparé par / validé par / retiré, contenu figé à la validation.
- live_sessions : match en direct (phases et leurs horodatages, présents, notes, synthèses de mi-temps et finale figées) ; les actions sont des `markers` de source `live`.
- plans : plans de match (rang 1 à 3, composition liée, bloc, quatre phases, scénarios, raisons, notes sur l’adversaire, priorités d’entraînement, bilan avant/après).
- Fonctions : `ml_remove_video`, `ml_current_consent`, `ml_dossier_exported`, `ml_remove_live_event`, `ml_remove_plan`, `ml_assistant_log` ; `ml_save` et `ml_restore` couvrent les nouvelles tables.
