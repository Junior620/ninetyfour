# Sécurité et limites

Défense en profondeur : identité Supabase vérifiée côté serveur, droits courants en base, RLS sur chaque table privée et relation, sessions enregistrées limitées à 12 h et contrôlées contre auth.sessions. Révocation et récupération invalident les sessions MatchLab ; re-présenter un ancien JWT ne les réactive pas. Aucun droit n’est dérivé de user_metadata, aucun accès automatique pour coach/joueur/parent.

Direction : ressources du club et habilitations. Staff : catégories/saisons affectées. Lecteur : seulement les matchs et joueurs explicitement partagés, sans mutation. Voir un match ne suffit pas à voir ses joueurs non partagés. Exports, médias, édition et publication sont des permissions indépendantes, y compris pour la direction. Dernier administrateur protégé.

Mutations : Origin exact, SameSite Lax et cookies HttpOnly/Secure en HTTPS, schémas stricts, limites de taille, quotas persistants en base, retour de navigation interne contrôlé. Les téléchargements sont no-store, noindex, nosniff. Aucun profil ni rapport dans le service worker. Les PDF et archives restent des téléchargements sensibles : un retrait de consentement ne peut pas effacer une copie déjà téléchargée.

Le bucket matchlab-private n’a aucune politique d’accès direct pour authenticated. Le service key sert à des actions contrôlées (débit, fichiers, bootstrap) ; les données métier utilisent la session et RLS. L’API média recontrôle accès et consentement (et la durée de conservation lorsqu’elle est définie) à chaque lecture, puis diffuse les octets ; aucune URL permanente ni URL publique. Photos JPEG/PNG ≤5 Mio, décodage réel Sharp, limite 25 MP, max1200px, retrait des métadonnées ; justificatifs PDF/JPEG/PNG ≤10 Mio. Pas d’antivirus intégré : scanner les justificatifs en exploitation si requis, sans rendre le bucket public.

Le bucket matchlab-videos est privé, sans politique d’accès direct. L’API vérifie l’écriture sur le match puis délivre un jeton d’envoi signé valable pour un seul chemin ; la lecture passe par une URL signée de 4 h, émise après contrôle de l’accès au match et de la durée de conservation, et journalisée. Les lecteurs ne peuvent ni envoyer ni supprimer. La suppression passe par `ml_remove_video` (contrôle d’accès, audit `VIDEO_REMOVED`) avant l’effacement du fichier. Les fichiers ne sont ni analysés ni convertis côté serveur.

Archives : SHA256, manifeste versionné, validation des relations, limites compression/décompression, refus des chemins arbitraires, collisions explicites, compensation des fichiers. Les empreintes détectent la corruption ; elles ne sont pas une signature d’origine. Seule la direction habilitée restaure une archive de confiance.

Audit : connexions/révocations, mutations avant/après, rapports, publications, exports, imports et accès médias. Accès direction uniquement. Les journaux contiennent des données privées ; leur conservation doit être définie avec les autres données. Politique/durée administrables, pas de purge automatique arbitraire. Sauvegarde et effacement réglementaire nécessitent une procédure d’exploitation distincte.

## Dépendances

Next mis à jour vers 16.4.2 pour intégrer les correctifs disponibles, notamment Windows RCE (GHSA-p293-qw3h-jr36, corrigé à partir de 16.3.3). Sources : https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36 et https://github.com/vercel/next.js/releases/tag/v16.4.2 .

Après corrections compatibles, npm audit indique 14 alertes (12 hautes, 2 modérées, aucune critique) : braces transitif dans outillage glob/eslint/shadcn, deepmerge-ts via Prisma6, uuid via ExcelJS. Une mise à niveau Prisma7 serait une migration distincte ; pas de --force destructif. Le chemin uuid signalé n’est pas utilisé directement par MatchLab. Ces alertes restent à traiter et ne constituent pas un audit de pénétration complet.

Les ports Docker locaux peuvent être exposés par Docker au réseau hôte : utiliser un poste/réseau de développement maîtrisé et uniquement les données fictives prévues. Aucune recette sur comptes réels ou secrets du club.
