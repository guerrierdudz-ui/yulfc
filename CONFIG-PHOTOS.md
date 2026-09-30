# Photos depuis la zone staff — configuration Cloudflare (une seule fois)

L'envoi de photos utilise **Cloudflare R2** (stockage) et une petite fonction serveur
(`functions/api/media.js`) qui est déployée automatiquement avec le site.

## 1. Créer le bucket R2
1. Tableau de bord Cloudflare → **R2 Object Storage** → **Create bucket**.
2. Nom : `yulfc-media` (tu peux choisir un autre nom) → **Create bucket**.
   > R2 demande d'ajouter un moyen de paiement au compte, mais les 10 Go par mois sont gratuits.

## 2. Relier le bucket au site
1. **Workers & Pages** → projet **yulfc** → **Settings** → **Bindings** → **Add** → **R2 bucket**.
2. **Variable name** : `MEDIA` (exactement, en majuscules).
3. **R2 bucket** : `yulfc-media` → **Save**.

## 3. Créer la clé d'envoi du staff
1. Même projet → **Settings** → **Variables and Secrets** → **Add**.
2. Nom : `STAFF_UPLOAD_KEY` · Valeur : une phrase secrète longue (ex. `yul-2026-maillot-bleu-514`).
3. Choisir **Encrypt**, puis **Save**.
4. Donner cette clé seulement aux membres du staff qui publient des photos.

## 4. Redéployer
Settings → Deployments → **Retry deployment** sur le dernier déploiement (ou faire un nouveau push).

## Utilisation
Zone coach → Command Center → **MEDIA CENTER** → onglet **PHOTOS** :
- entrer la clé une fois (elle reste enregistrée sur l'appareil) ;
- choisir **où afficher** : galerie, grande photo de l'accueil, photo de « Notre histoire » ou photo d'un joueur ;
- glisser les photos ou les choisir sur le téléphone. Elles sont redimensionnées automatiquement avant l'envoi.

Tant que les étapes 1 à 3 ne sont pas faites, l'onglet fonctionne en **mode démo** :
les photos restent seulement sur l'appareil utilisé.
