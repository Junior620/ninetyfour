# N91 MatchLab — application mobile (Lot 1)

Application Expo / React Native (iOS, Android, tablettes) pour le staff. Elle utilise **la même API et la même base** que MatchLab web : un joueur ou un match créé sur le téléphone apparaît dans `/matchlab` sans ressaisie. Le tableau de bord web (`/matchlab/overview`) se recharge toutes les 30 s.

## Lancer en local

```bash
# 1. Le site (API MatchLab), à la racine du dépôt
npm run dev

# 2. L'app, dans mobile/
cd mobile
npm install
cp .env.example .env.local   # adresse du serveur, voir ci-dessous
npx expo start --ios         # simulateur iPhone via Expo Go (Xcode requis)
```

`EXPO_PUBLIC_MATCHLAB_API_URL` dans `.env.local` :
- simulateur iOS sur ce Mac : `http://localhost:3000`
- iPhone réel avec Expo Go, même Wi-Fi : `http://<IP-du-Mac>:3000`
- production : `https://www.ninetyonefootacademy.com`

### Version native (icône, écran de démarrage)

`npm run ios` compile la vraie app (`expo run:ios`) et l'installe dans le simulateur. Prérequis sur ce Mac (Intel, sans Homebrew) : Ruby 3.3 et CocoaPods installés dans le dossier utilisateur, à mettre dans le PATH :

```bash
export PATH="$HOME/.rubies/ruby-3.3.13/bin:$PATH" LANG=en_US.UTF-8
npm run ios
```

`patches/expo-modules-jsi+58.0.23.patch` (appliqué automatiquement après `npm install`) corrige une erreur de compilation de ce module Expo avec Xcode 26 (Swift 6.2). Expo SDK 58 vise Xcode 27 ; supprimer le patch quand Expo publie le correctif ou après passage à Xcode 27.

Les images viennent des logos officiels du site (`public/logo-crest.png`, `public/n91-lab-logo.png`) et sont dans `assets/images/`. Expo Go (`npx expo start --ios`) reste utilisable pour développer, avec sa propre icône.

Connexion avec un compte MatchLab actif (table `ml_members`), le même que sur le web.

## Architecture

- `src/app/` : écrans (Expo Router). Onglets Accueil, Effectif, Matchs, Terrain, Rapports ; fiche joueur, préparation de match en 6 étapes, évaluation, fin de match, rapport, synchronisation.
- `src/lib/api.ts` : appels `/api/matchlab/*` avec jeton `Authorization: Bearer`, renouvellement automatique (`/auth/refresh`).
- `src/lib/session.ts` : jetons dans le trousseau iOS / Keystore Android (expo-secure-store).
- `src/lib/lab.ts` : données autorisées (`GET /api/matchlab/data`, filtrées par RLS), copie locale pour la consultation hors ligne.
- `src/lib/outbox.ts` : file des saisies. Envoi immédiat ; sans réseau, attente sur le téléphone puis envoi au retour de la connexion, dans l'ordre. Conflit de version (409) affiché, jamais écrasé.
- Règles métier **partagées avec le web, sans copie** : `@matchlab/*` pointe vers `../src/lib/matchlab` (schémas Zod, note 40/60, questionnaire 1.1, formations, essai de catégorie). Voir `metro.config.js` et `tsconfig.json`.

## Côté serveur (ajouts pour le mobile)

- `src/lib/matchlab/bearer.ts` + `server.ts` : une requête portant un jeton Bearer est authentifiée par ce jeton seul (mêmes contrôles : membre actif, session MatchLab enregistrée, RLS). Le contrôle d'Origin reste obligatoire pour les cookies du web.
- `POST /api/matchlab/auth/token` (connexion, limitée comme le login web) et `/auth/refresh`. `logout` révoque aussi une session mobile.
- Une session MatchLab dure 12 h : le staff se reconnecte chaque jour.

## Vérifications

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Limites connues du Lot 1 (prévu au Lot 2)

- Vidéo (capture d'évaluation, match en direct avec IA), notifications push natives, exports PDF partagés, assistant.
- La copie locale et les saisies en attente sont dans le stockage de l'app, **non chiffrées** (les jetons, eux, sont dans le trousseau). Utiliser un appareil verrouillé ; à la déconnexion tout est effacé.
- Champs du cahier sans colonne en base : heure du match, taille, postes secondaires, année de naissance (migration à prévoir).
- Le portrait demande le réseau (pas de mise en file des photos).
