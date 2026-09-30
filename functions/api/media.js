/* ==========================================================================
   YUL FC — API des photos (Cloudflare Pages Function + R2)
   --------------------------------------------------------------------------
   GET    /api/media              → liste publique des photos { items:[...] }
   GET    /api/media?check=1      → vérifie la clé staff (en-tête X-Staff-Key)
   POST   /api/media              → envoi d'une photo (multipart : file, slot, caption)
   DELETE /api/media?id=<id>      → suppression
   Configuration (tableau de bord Cloudflare → projet Pages → Settings) :
   - Bindings : R2 bucket, nom de variable  MEDIA
   - Variables and Secrets : STAFF_UPLOAD_KEY (chiffrée) = la clé du staff
   ========================================================================== */

const SLOT_RE = /^(hero|histoire|gallery|player-\d{1,3})$/;
const SINGLE_SLOT = s => s !== 'gallery';          // une seule photo par emplacement (sauf galerie)
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BYTES = 12 * 1024 * 1024;
const INDEX_KEY = 'index.json';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

function authorized(request, env){
  const secret = env.STAFF_UPLOAD_KEY || '';
  const given = request.headers.get('X-Staff-Key') || '';
  if(!secret || given.length !== secret.length) return false;
  let diff = 0;
  for(let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

async function readIndex(env){
  const obj = await env.MEDIA.get(INDEX_KEY);
  if(!obj) return { items: [] };
  try{ const data = await obj.json(); return Array.isArray(data.items) ? data : { items: [] }; }
  catch(e){ return { items: [] }; }
}
async function writeIndex(env, index){
  await env.MEDIA.put(INDEX_KEY, JSON.stringify(index), { httpMetadata: { contentType: 'application/json' } });
}
const clean = (v, max) => String(v || '').replace(/[<>]/g, '').trim().slice(0, max);

export async function onRequestGet({ request, env }){
  if(!env.MEDIA) return json({ error: 'Stockage non configuré (binding R2 « MEDIA » manquant).' }, 503);
  const url = new URL(request.url);
  if(url.searchParams.has('check')){
    if(!env.STAFF_UPLOAD_KEY) return json({ error: 'STAFF_UPLOAD_KEY non configurée.' }, 503);
    return authorized(request, env) ? json({ ok: true }) : json({ error: 'Clé invalide.' }, 401);
  }
  return json(await readIndex(env));
}

export async function onRequestPost({ request, env }){
  if(!env.MEDIA) return json({ error: 'Stockage non configuré (binding R2 « MEDIA » manquant).' }, 503);
  if(!authorized(request, env)) return json({ error: 'Clé staff invalide.' }, 401);

  let form;
  try{ form = await request.formData(); }catch(e){ return json({ error: 'Envoi invalide.' }, 400); }
  const file = form.get('file');
  const slot = String(form.get('slot') || 'gallery');
  if(!file || typeof file === 'string') return json({ error: 'Aucun fichier reçu.' }, 400);
  if(!SLOT_RE.test(slot)) return json({ error: 'Emplacement invalide.' }, 400);
  const ext = TYPES[file.type];
  if(!ext) return json({ error: 'Format non accepté (JPG, PNG, WebP ou GIF).' }, 415);
  if(file.size > MAX_BYTES) return json({ error: 'Image trop lourde (12 Mo maximum).' }, 413);

  const id = crypto.randomUUID();
  const key = `media/${id}.${ext}`;
  await env.MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' }
  });

  const item = {
    id, key, url: '/' + key, slot,
    caption: clean(form.get('caption'), 140),
    album: clean(form.get('album'), 80),
    w: parseInt(form.get('w'), 10) || null,
    h: parseInt(form.get('h'), 10) || null,
    size: file.size,
    createdAt: new Date().toISOString()
  };

  const index = await readIndex(env);
  if(SINGLE_SLOT(slot)){
    const old = index.items.filter(i => i.slot === slot);
    await Promise.all(old.map(i => env.MEDIA.delete(i.key)));
    index.items = index.items.filter(i => i.slot !== slot);
  }
  index.items.unshift(item);
  await writeIndex(env, index);
  return json(item, 201);
}

export async function onRequestDelete({ request, env }){
  if(!env.MEDIA) return json({ error: 'Stockage non configuré.' }, 503);
  if(!authorized(request, env)) return json({ error: 'Clé staff invalide.' }, 401);
  const id = new URL(request.url).searchParams.get('id');
  const index = await readIndex(env);
  const item = index.items.find(i => i.id === id);
  if(!item) return json({ error: 'Photo introuvable.' }, 404);
  await env.MEDIA.delete(item.key);
  index.items = index.items.filter(i => i.id !== id);
  await writeIndex(env, index);
  return json({ ok: true });
}
