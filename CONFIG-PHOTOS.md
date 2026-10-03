# Photos depuis la zone staff · configuration Cloudflare (Worker)

Le site est hébergé comme **Worker Cloudflare**. Les photos sont stockées dans **R2** et
gérées par `worker/index.js`. La liaison au stockage est déclarée dans `wrangler.jsonc`
(pas besoin de l'ajouter dans le tableau de bord).

## 1. Vérifier le nom du Worker
Dans Cloudflare → **Workers & Pages**, note le nom exact du projet du site.
Il doit être identique à la ligne `"name": "yulfc"` de `wrangler.jsonc` (sinon, corrige cette ligne).

## 2. Créer le bucket R2
**R2 Object Storage** → **Create bucket** → nom : `yulfc-media` → **Create bucket**.
(R2 demande un moyen de paiement au compte ; les 10 Go par mois sont gratuits.)

## 3. Publier le code
Copier les fichiers dans le projet (dont `worker/`, `wrangler.jsonc`, `.assetsignore`), puis commit + push sur `main`.
Cloudflare redéploie automatiquement. Vérifier : **https://yulfc.com/api/media** doit afficher `{"items":[]}`.

## 4. Créer la clé du staff
Projet → **Settings** → **Variables and Secrets** → **Add** → Type **Secret**
Nom : `STAFF_UPLOAD_KEY` · Valeur : ta phrase secrète → **Deploy**.

## Utilisation
Zone coach → Command Center → **MEDIA CENTER** → onglet **PHOTOS** → entrer la clé → envoyer des photos.
