# Préparation d’exploitation — aucune publication effectuée

La recette utilise Supabase local sur API55321, PostgreSQL55322, Studio55323, Mailpit55324, projet Docker n91-matchlab-local. `npm run matchlab:setup` crée seulement un compte fictif aléatoire ; les migrations locales ne doivent jamais être dirigées vers le projet du club.

Pour une future preview autorisée : choisir un environnement Supabase de preview, sauvegarder son état, examiner/appliquer les migrations additives dans l’ordre, renseigner les variables serveur MATCHLAB_SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY et MATCHLAB_APP_ORIGIN à l’origine HTTPS exacte. Configurer l’URL de callback `/api/matchlab/auth/callback` dans Supabase Auth et SMTP. Ne pas exposer service_role avec NEXT_PUBLIC. La branche de développement est codex/matchlab.

Build Vercel prévu : `next build --webpack`, Node24 conseillé (recette24.14.1), lockfile versionné, `npm ci`. Le build normal lit .env.local en local ; le lanceur MatchLab fournit ses variables dédiées sans modifier les secrets existants. Éviter deux processus Next écrivant dans le même .next.

## Premier administrateur

Créer ou choisir explicitement une identité Supabase existante dans l’environnement visé. Aucun mot de passe commun, aucune promotion automatique. Exécuter volontairement `node --env-file=<fichier-dédié> scripts/matchlab-bootstrap.mjs <UUID-utilisateur>`. Le script refuse lorsqu’une direction active existe déjà ; les habilitations suivantes passent par l’écran audité. Les rôles de la vitrine ne sont pas modifiés.

Configurer la gouvernance avant des médias réels. Importer et vérifier les six articles puis activer MATCHLAB_CMS_ENABLED. Conserver MATCHLAB_PUSH_ENABLED=false tant que l’adaptateur d’envoi Push n’est pas développé et validé ; le worker ne cache aucun contenu privé. Aucun endpoint IA à configurer : moteur volontairement absent.

Prévoir sauvegarde PostgreSQL + bucket privé, stockage chiffré des archives, durée/effacement approuvés et revue des dépendances résiduelles. Les migrations distantes et le déploiement constituent une phase séparée, non exécutée ici.
