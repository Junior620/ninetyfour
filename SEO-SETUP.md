# SEO Setup — Ninety One Foot Academy

Canonique : `https://www.ninetyonefootacademy.com`

## 1. Variables d’environnement (Vercel)

| Variable | Obligatoire | Rôle |
|----------|-------------|------|
| `NEXT_PUBLIC_SITE_URL` | Oui | `https://www.ninetyonefootacademy.com` |
| `AUTH_SECRET` | Oui (auth) | Session JWT |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Non | GA4 optionnel (`G-XXXXXXXX`) |
| `INDEXNOW_KEY` | Non | Clé IndexNow (UUID sans `{}`) |

Après ajout de `INDEXNOW_KEY` en local :

```bash
npm run indexnow:key
```

Cela crée `public/{INDEXNOW_KEY}.txt` (à committer ou régénérer en CI).

## 2. Google Search Console

1. Ajouter la propriété **domaine** : `ninetyonefootacademy.com` (couvre www et apex).
2. Vérification DNS : enregistrement TXT fourni par Google chez le registrar.
3. Une fois vérifié, soumettre :
   - `https://www.ninetyonefootacademy.com/sitemap.xml`
4. Contrôler : indexation, exclusions, canonicals, CWV, HTTPS, données structurées.
5. Inspecter en priorité : `/fr`, `/en`, `/fr/rejoindre`, `/fr/academie`, `/fr/contact`, 1 article.
6. Demander une nouvelle exploration **après** déploiement de ce lot SEO.
7. Ne pas utiliser l’API Indexing Google pour les pages ordinaires.

### Suivi GSC

- **J+7** : sitemap traité, pas d’erreurs 4xx/5xx majeures, login/dashboard non indexés.
- **J+30** : impressions sur requêtes marque + locales Douala/Cameroun ; corriger pages « Explorée, non indexée » si besoin.
- **J+90** : CTR, positions moyennes hors marque, CWV mobile, candidatures organiques.

## 3. Bing Webmaster Tools

1. Importer depuis GSC **ou** ajouter le domaine manuellement.
2. Vérifier la propriété.
3. Soumettre le même sitemap.
4. Activer Bing Places si fiche locale Douala créée.
5. Relier IndexNow (ci-dessous).

## 4. IndexNow

1. Générer une clé (UUID) → `INDEXNOW_KEY` sur Vercel.
2. Publier `https://www.ninetyonefootacademy.com/{clé}.txt` (contenu = la clé).
3. Après publication de contenu public :

```bash
curl -X POST https://www.ninetyonefootacademy.com/api/indexnow \
  -H "Content-Type: application/json" \
  -d "{}"
```

Ou avec une liste limitée d’URL déjà dans le sitemap. Les URLs login/dashboard sont rejetées.

## 5. Google Analytics 4 (optionnel)

1. Créer une propriété GA4.
2. Définir `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
3. Événements recommandés (à brancher progressivement dans les formulaires) :
   - `join_start` / `join_step` / `join_submit`
   - `contact_submit`
   - `click_whatsapp` / `click_phone` / `click_email`
   - `language_switch`
4. **Ne jamais** envoyer documents, données médicales ou identifiants de mineurs.

## 6. Données manquantes à fournir

Sans ces éléments, le SEO local et le Schema restent partiels :

- [ ] Téléphone officiel (+237 …)
- [ ] WhatsApp officiel
- [ ] Adresse complète (rue / quartier, pas seulement « Douala »)
- [ ] URLs Instagram / Facebook / X / LinkedIn / YouTube officiels
- [ ] Confirmation : les numéros promo `678 259 540 / 693 881 971` sont-ils officiels ?
- [ ] Confirmation email : `contact@ninetyonefoot.academy` vs `ninetyonefoot@outlook.com`
- [ ] Mentions légales / confidentialité / conditions candidatures (texte juridique)
- [ ] Validation contenu : parrains nommés, actualités 2026, vidéos (remplacer placeholders)
- [ ] Médias académie (remplacer Unsplash si possible)
- [ ] Accès DNS + GSC + Bing

## 7. Google Business Profile / local

Checklist hors site :

- [ ] Fiche GBP Douala (catégorie école de sport / académie football)
- [ ] NAP identique au site
- [ ] Photos réelles, horaires si applicables
- [ ] Bing Places
- [ ] Annuaires sportifs camerounais fiables uniquement (pas de PBN)

## 8. Redirect www

`vercel.json` redirige `ninetyonefootacademy.com` → `www.ninetyonefootacademy.com` (301). Vérifier aussi le DNS apex → Vercel.
