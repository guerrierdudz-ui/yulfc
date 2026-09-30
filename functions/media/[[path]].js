/* Sert les photos stockées dans R2 : /media/<id>.<ext> */
export async function onRequestGet({ params, env }){
  if(!env.MEDIA) return new Response('Stockage non configuré', { status: 503 });
  const path = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if(!/^[\w-]+\.(jpg|png|webp|gif)$/.test(path)) return new Response('Introuvable', { status: 404 });
  const obj = await env.MEDIA.get('media/' + path);
  if(!obj) return new Response('Introuvable', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  if(!headers.has('cache-control')) headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
}
