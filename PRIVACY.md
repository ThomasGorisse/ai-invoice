# Politique de Confidentialite — AI Invoice

*Derniere mise a jour : 25 mars 2026*

## 1. Responsable du traitement

Thomas Gorisse, auto-entrepreneur
44230 Saint-Sebastien-sur-Loire, France
Contact : thomas@gorisse.dev

## 2. Donnees collectees

### Donnees de facturation (transmises par API)
- Identite et coordonnees de l'emetteur (nom, adresse, SIRET, email)
- Identite et coordonnees du client
- Details des prestations facturees
- Montants et conditions de paiement

### Donnees techniques
- Adresse IP (logs Cloudflare, retention 30 jours)
- En-tetes HTTP standards

### Donnees de paiement
- Gerees exclusivement par Stripe. Nous ne stockons aucune donnee bancaire.

## 3. Finalite et base legale

| Finalite | Base legale |
|---|---|
| Generation de factures | Execution du contrat |
| Logs techniques | Interet legitime (securite) |
| Paiement | Execution du contrat |

## 4. Duree de conservation

- **Factures generees** : non stockees par defaut. Avec KV active, 12 mois maximum.
- **Logs techniques** : 30 jours (Cloudflare)
- **Donnees Stripe** : selon la politique de Stripe

## 5. Destinataires

- Cloudflare (hebergement, CDN)
- Stripe (paiements)

Aucune donnee n'est vendue ou transmise a des tiers a des fins commerciales.

## 6. Transferts hors UE

Cloudflare et Stripe sont certifies EU-US Data Privacy Framework.

## 7. Vos droits (RGPD)

Conformement au RGPD, vous disposez d'un droit de :
- Acces a vos donnees
- Rectification
- Effacement
- Portabilite
- Opposition au traitement
- Limitation du traitement

Pour exercer ces droits : thomas@gorisse.dev

Vous pouvez egalement introduire une reclamation aupres de la CNIL (www.cnil.fr).

## 8. Securite

Les communications sont chiffrees en HTTPS/TLS. Les donnees sont traitees en memoire et non persistees sauf activation explicite du stockage.

## 9. Cookies

AI Invoice n'utilise pas de cookies.
