# Architecture

`/matchlab` possède un root layout français, Inter et CSS propre. Le proxy bifurque avant next-intl ; aucun composant analytics public n’y est monté. Les pages et API privées sont dynamiques et portent no-store/noindex. Les trois cartes et URL de la vitrine sont conservées ; un accès staff traduit est ajouté sous les cartes.

Chaîne d’accès : cookie dédié → Supabase getUser serveur → membre actif en base/RLS → session JWT enregistrée et non révoquée → périmètre catégorie/saison ou partage explicite → ressource. L’ancien cookie nofa_session n’autorise rien dans MatchLab.

Les composants React appellent `/api/matchlab`. La validation Zod précède les RPC transactionnelles. `server.ts` centralise session, CSRF, limitation persistante et erreurs ; `repository.ts` charge seulement les lignes autorisées par RLS ; `filter.ts` referme les relations exportées. `scoring.ts` reste pur, sans accès réseau. Le PDF, Excel et CSV réutilisent cette même méthode de calcul.

| Route | Rôle |
|---|---|
| /matchlab | Redirection connexion / vue d’ensemble |
| /matchlab/login, recover, reset | Session Supabase dédiée et récupération |
| /matchlab/overview, matches, players, analyze, reports | Cinq écrans du modèle |
| /matchlab/analytics, video, alerts | Analytique, index des repères, alertes internes |
| /matchlab/exports | Exports filtrés, aperçu/restauration d’archive |
| /matchlab/site | Articles FR/EN, permissions indépendantes |
| /matchlab/admin | Habilitations, saisons, gouvernance, audit |
| /matchlab/ai?module=… | Dix vues d’interface IA |
| /api/matchlab/data | GET graphe autorisé ; POST création/édition avec version |
| /api/matchlab/reports, alerts, admin | Révisions, lectures d’alertes et administration |
| /api/matchlab/media | Upload contrôlé / lecture authentifiée sans URL publique |
| /api/matchlab/exports, imports | Téléchargement, dry-run et restauration |
| /api/matchlab/articles | Un seul service CMS, y compris l’ancien écran admin |
| /api/matchlab/ai/[module], push | Contrats désactivés / abonnement optionnel préparé |

Le chargement SQL est paginé par lots de 500 et plafonné à 10 000 lignes par table ; les listes affichent 20 lignes. L’agrégation actuelle filtre en mémoire après RLS. Ce plafond produit une erreur explicite ; un volume supérieur nécessitera agrégation/pagination serveur spécialisée et une nouvelle recette de charge. Aucun objectif de performance à grande échelle n’est affirmé.
