# Illustration de la connexion

`src/components/matchlab/LoginFootballAnimation.tsx` est intégré dans `Login.tsx`, sous le texte du panneau bleu et avant sa signature. Le composant de connexion étant partagé, les écrans de récupération et de réinitialisation utilisent la même illustration. Les champs, validations et appels d’authentification sont inchangés.

## Choix technique

SVG inline et CSS Module (`LoginFootballAnimation.module.css`), sans asset distant, vidéo, canvas, bibliothèque supplémentaire, timer JavaScript ou boucle de rendu React. Le seul état React sert au bouton Pause/Reprendre. Les deux fichiers sources totalisent environ 8,6 Ko avant compilation ; ce chiffre n’est pas une mesure du poids transféré.

La silhouette, le ballon, la perspective du but et les repères de terrain reprennent le bleu, le blanc et un or discret. Le cadre du but reste fixe et est dessiné devant le ballon ; le maillage réagit séparément à l’impact.

## Réglages

- `--shot-duration: 6.8s` synchronise les sept animations : jambe, déplacement/rotation du ballon, ombre, trajectoire, filet et impact.
- Anticipation à 24 %, frappe à 33 %, impact à 66 %, amortissement jusqu’à 78 %, puis pause et effacement. Le retour à la position initiale se fait lorsque le ballon est invisible.
- `--shot-accent` règle la touche or. Les autres couleurs sont locales au composant.
- Le `viewBox="0 0 560 232"` fixe le repère de dessin. Modifier ensemble la position du ballon, les points de sa trajectoire et l’origine de l’impact si la géométrie change.
- La largeur est fluide, plafonnée à 540 px sur desktop et 330 px sous 640 px. Aucun positionnement de l’illustration au-dessus du texte ou du formulaire.
- Le panneau réserve 120 px en haut sur desktop pour préserver le logo, y compris sur écran court. Son espacement mobile existant est conservé.

## Accessibilité

Le SVG est décoratif (`aria-hidden="true"`, `focusable="false"`, aucun événement de pointeur). Une commande Pause/Reprendre indépendante et accessible au clavier permet d’arrêter la boucle sans déplacer ses éléments. Son nom accessible correspond à l’action affichée.

Le dessin statique est l’état CSS par défaut. Les animations ne sont déclarées que sous `prefers-reduced-motion: no-preference`. En mode `reduce`, elles sont explicitement désactivées, le ballon reste près du pied, la trajectoire et le but restent visibles, et la commande de pause est masquée. Aucun clignotement ni changement de contenu annoncé aux lecteurs d’écran.

## Vérification

Recette Chromium : 375, 430, 768, 1024, 1440 et 1920 px, plus 1024 × 600. Aucun débordement horizontal, chevauchement logo/titre, illustration/texte ou illustration/formulaire. Les sept animations partagent une durée calculée de 6,8 s et passent toutes en pause ; Tab conduit ensuite au champ e-mail. Les écrans de récupération et de réinitialisation gardent leurs formulaires. Les règles de rendu statique ont été relues ; la préférence système du poste n’a pas été modifiée pendant la recette.

Lint ciblé, typage et build Webpack réussis. Aucun test unitaire ne duplique le dessin SVG. Les mesures sont conservées dans `login-animation-results.json`. Les captures de la version compilée sont `screenshots/login-animation-desktop.jpg` et `screenshots/login-animation-mobile.jpg`.
