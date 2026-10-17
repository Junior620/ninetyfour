# Illustration de la connexion

Depuis le 17 octobre 2026, l’ancienne scène (silhouette de joueur, but schématique, bouton « Pause » visible) est supprimée. Elle est remplacée par `src/components/matchlab/LoginShotMotion.tsx`, une animation abstraite de type motion branding, affichée dans le panneau bleu de connexion, de récupération et de réinitialisation, sous le texte d’introduction.

## Direction artistique

Aucun personnage. La frappe est suggérée par trois lignes de mouvement en dégradé qui balaient derrière le ballon. Un ballon vectoriel (pentagone central, pièces du bord découpées par le contour) part sur une trajectoire tendue qui passe sous la transversale et entre dans la lucarne. Une tête lumineuse or suit le ballon, la trajectoire se dessine et trois points de suivi apparaissent à son passage, en écho à l’analyse vidéo. Le filet est une maille en losanges très fine, peu profonde sous la barre et plus profonde au sol ; seul le plan arrière cède à l’impact, avec un halo et une onde discrets. Le ballon retombe dans le filet puis s’efface.

Palette : blanc, bleu clair, bleu N91 et une seule touche or (tête de trajectoire et onde d’impact). Lignes du terrain très fines qui s’estompent vers le texte, léger halo de profondeur derrière le but. Le titre reste l’élément principal : l’illustration occupe la moitié basse du panneau.

## Technique

- SVG inline et Web Animations API native : aucune vidéo, image, bibliothèque ni timer. Le composant fait environ 17 Ko de source et le CSS Module environ 2 Ko, avant compilation.
- Une seule géométrie TypeScript (courbe de Bézier du tir, table d’abscisses curvilignes) produit à la fois le dessin et les images clés. Le ballon, son ombre, la trajectoire et la tête lumineuse partagent la même progression, sans dérive.
- Seize animations démarrent au même instant (`startTime` commun) sur une boucle de 7,2 s : impact à 46 % du cycle, frappe à 20 %.
- Réglages en tête de fichier : `DURATION`, `STRIKE`, `IMPACT`, points `P0`, `C1`, `C2`, `P1`, longueur de la tête `COMET`, points de suivi `DOTS`, géométrie du but `FRONT`, `TOP_DEPTH` et `GROUND_DEPTH`.

## Accessibilité

Le SVG est décoratif (`aria-hidden`, `focusable="false"`, aucun événement de pointeur). Pour respecter WCAG 2.2.2, une commande de pause reste disponible, mais réduite à une petite icône peu contrastée qui s’affirme au survol et au focus clavier (`aria-pressed`, contour visible). Avec `prefers-reduced-motion: reduce`, aucune animation n’est créée et l’icône est masquée. La composition fixe montre le ballon sur le point de penalty, la trajectoire prévue et les points de suivi. Un changement de préférence pendant la visite est pris en compte.

## Vérification

Recette Edge headless (Chromium) sur la version compilée : 375, 430, 768, 1024 × 768, 1024 × 600, 1440 et 1920 px. Aucun débordement horizontal, illustration contenue dans le panneau, aucun chevauchement avec le logo, le titre, le texte, la signature ou le formulaire. Seize animations à 7 200 ms avec départ commun, pause puis reprise de toutes les couches, puis mode réduit sans animation ni commande. Résultats dans `login-animation-results.json`. Captures : `screenshots/login-animation-desktop.jpg`, `screenshots/login-animation-mobile.jpg` et les phases du tir dans `screenshots/login-animation-phases.jpg`.
