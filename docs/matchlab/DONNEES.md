# Données et règles

Migrations additives `supabase/migrations/202610150001…` : tables préfixées ml_, aucune modification des modèles Prisma du club. Types Supabase générés dans `src/lib/matchlab/database.types.ts`, contrats applicatifs Zod dans schema.ts.

- ml_members / scopes / shares / sessions : rôles direction, staff, reader, permissions distinctes, affectations et révocation.
- seasons / categories : saisons éditables ; U-14, U-16, U-17, U-18 initialisées.
- players / memberships : profil, poste habituel, pied, statut ; dossard 1–99 par appartenance. Un doublon de dossard est un avertissement, pas une unicité mondiale.
- matches : circonstances descriptives, score nullable, collectif séparé, brouillon/évalué/revu, nom vidéo local sans fichier transféré.
- questionnaires / evaluations : questionnaire PDF 1.1 immuable, six questions communes et cinq pour chacun des huit postes ; une évaluation par match/joueur/poste. Le JSON omis représente absence ; null signifie Non observé.
- markers : positif, correction, occasion, transition ; minute/seconde, joueur optionnel, poste, thème et observation.
- reports : instantané immuable, révision, auteur, validateur, motif de correction ; audit avant/après des entités modifiables.
- alerts / alert_reads : une alerte par match, rafraîchie sans doublon ; lecture par compte. Une rencontre évaluée sans score reste signalée.
- consents / media / settings : autorisations photo interne/export, justificatifs privés, politique et durée définies par la direction. Rien n’est activé par défaut sans politique.
- targets : fondamentaux séparés du questionnaire officiel.
- articles / article_revisions : CMS bilingue, publication explicite.

Note individuelle = (moyenne des réponses communes notées × 0,40 + moyenne des réponses de poste notées × 0,60) × 2. Un groupe entièrement absent/non observé rend la note non calculable. Pas de zéro ajouté. Précision conservée ; une décimale à l’affichage. Exemple 4 et 3 → 6,8/10. La note collective est indépendante et les circonstances n’altèrent jamais le calcul.

Ex æquo conservés, effectifs de joueurs distincts, résultats ventilés par poste et avertissement n < 5. Les notes de fondamentaux n’entrent pas dans le 40/60. Toute écriture utilise une version attendue et un conflit explicite HTTP409. Les rapports créent de nouvelles révisions ; ils ne remplacent pas un instantané validé.
