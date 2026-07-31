# Configuration emails — Ninety One Foot Academy

Accusés de réception automatiques pour les formulaires publics **Contact** et **Recrutement / détection** (`/rejoindre`), via **Resend** + templates React Email.

## Formulaires couverts

| Formulaire | Route | API | Accusé | Notif admin | Référence |
|------------|-------|-----|--------|-------------|-----------|
| Contact | `/fr/contact`, `/en/contact` | `POST /api/contact` | Oui | Oui | `NOFA-CONTACT-YYYYMMDD-XXXX` |
| Recrutement | `/fr/rejoindre`, `/en/rejoindre` | `POST /api/recruitments` | Oui (+ PDF joint) | Oui (+ PDF) | `NOFA-RECRUITMENT-YYYYMMDD-XXXX` |

Non couverts (pas de formulaire public) : newsletter, partenariat, sponsoring. `ApplicationForm` reste orphelin.

## Variables d’environnement

À définir sur Vercel (et localement dans `.env.local`) — **jamais dans le dépôt** :

```env
RESEND_API_KEY=
EMAIL_FROM=Ninety One Foot Academy <noreply@votre-domaine-verifie.com>
EMAIL_REPLY_TO=contact@votre-domaine-officiel.com
ADMIN_NOTIFICATION_EMAIL=admin@votre-domaine.com
NEXT_PUBLIC_SITE_URL=https://www.ninetyonefootacademy.com
```

Rétrocompatibilité : si `EMAIL_FROM` / `ADMIN_NOTIFICATION_EMAIL` sont absents, le code lit encore `SENDER_EMAIL` et `ADMIN_EMAIL`.

### Informations à fournir par le propriétaire (ne pas inventer)

- [ ] Adresse d’expédition vérifiée chez Resend (`EMAIL_FROM`)
- [ ] Adresse de réponse officielle (`EMAIL_REPLY_TO`) — idéalement celle affichée sur le site
- [ ] Boîte de réception des notifications internes (`ADMIN_NOTIFICATION_EMAIL`)

## DNS (délivrabilité)

1. Créer / vérifier le domaine dans [Resend Domains](https://resend.com/domains).
2. Ajouter les enregistrements fournis par Resend :
   - **SPF** (TXT)
   - **DKIM** (TXT / CNAME selon Resend)
3. **DMARC** recommandé (chez le registrar), par exemple :

```txt
_dmarc.votre-domaine.com. TXT "v=DMARC1; p=none; rua=mailto:dmarc@votre-domaine.com"
```

Passer ensuite à `p=quarantine` puis `p=reject` une fois les métriques stables.

4. Attendre la validation « Verified » dans Resend avant la prod.

## Comportement

1. Validation serveur (Zod) + honeypot + rate limit (5 / 15 min / IP) + clé d’idempotence.
2. Génération de référence unique.
3. Notification admin + accusé demandeur (FR ou EN selon `locale`).
4. UI succès : référence + email masqué + CTA (pas de redirect auto).
5. Si Resend est down : la demande n’est pas annulée ; l’erreur est journalisée (sans PII complète).

L’accusé **ne confirme jamais** une admission, sélection ou convocation.

## Aperçu sujets

- FR : `Nous avons bien reçu votre demande — Ninety One Foot Academy`
- EN : `We've received your request — Ninety One Foot Academy`

## Tests en développement

1. Configurer `RESEND_API_KEY` + `EMAIL_FROM` (domaine test Resend ou domaine vérifié).
2. `npm run dev` → soumettre `/fr/contact` et `/en/contact` avec une vraie adresse.
3. Soumettre `/fr/rejoindre` (parcours complet) et vérifier email + PDF.
4. Double-soumission rapide : même `idempotencyKey` → pas de double envoi.
5. Remplir le honeypot (`website`) → succès faux, **pas** d’email.
6. Email invalide → 400, pas d’email.
7. Sans `RESEND_API_KEY` : soumission OK, logs `[email] … skipped`.

## Tests en production

1. Déployer avec les 4 variables email + `NEXT_PUBLIC_SITE_URL`.
2. Envoyer un contact FR et un contact EN.
3. Envoyer une candidature test et vérifier référence affichée + emails reçu/admin.
4. Contrôler spam Gmail / Outlook.
5. Vérifier `Reply-To` vers l’adresse officielle.

## Checklist déploiement

- [ ] Domaine Resend vérifié (SPF + DKIM)
- [ ] DMARC au minimum `p=none`
- [ ] `EMAIL_FROM` / `EMAIL_REPLY_TO` / `ADMIN_NOTIFICATION_EMAIL` / `RESEND_API_KEY` sur Vercel
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.ninetyonefootacademy.com`
- [ ] Logo accessible : `https://www.ninetyonefootacademy.com/logo-crest.png`
- [ ] Test smoke contact + rejoindre après deploy
- [ ] Supprimer / ignorer les anciennes vars si migrées (`SENDER_EMAIL` → `EMAIL_FROM`)

## Fichiers principaux

- `src/lib/email/*` — config, référence, rate-limit, envoi
- `src/emails/AcknowledgmentEmail.tsx`, `AdminNotificationEmail.tsx`
- `src/components/forms/FormSuccessPanel.tsx`
- `src/app/api/contact/route.ts`, `src/app/api/recruitments/route.tsx`
- `src/components/forms/ContactForm.tsx`, `RecruitmentForm.tsx`
