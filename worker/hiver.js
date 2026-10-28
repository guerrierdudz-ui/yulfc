/* ==========================================================================
   YUL FC · Contrat 7v7 Hiver 2027
   - Versions publiées par le staff (jamais modifiées : une modification = nouvelle version)
   - Sélection des joueurs 7v7 qui voient le contrat + statut (principal / réserviste) fixé par le staff
   - Signature électronique : nom complet + signature dessinée + case d'acceptation
   - Preuve de consentement : date et heure serveur, compte, IP, appareil, empreinte du texte signé
   - Copie PDF générée au moment de la signature et conservée en privé dans R2
   Stockage (db/) : hiver/meta.json · hiver/v/{n}.json · hiver/roster.json · hiver/sig/{joueur}/{n}.json
   PDF (privé)   : private/hiver2027/{joueur}-v{n}.pdf
   ========================================================================== */
import { Doc, wrap, width, jpegInfo } from './pdf.js';

const enc = new TextEncoder();
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});
const err = (msg, status = 400) => json({ error: msg }, status);
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async data => hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data));
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
const now = () => new Date().toISOString();
const str = (v, max = 200) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);
const email = v => { const s = String(v || '').trim().toLowerCase(); return /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[a-z]{2,}$/.test(s) ? s : ''; };
const safeId = v => /^[a-z0-9]{6,32}$/.test(String(v || '')) ? String(v) : '';
const TZ = 'America/Toronto';
const FINANCE = ['admin', 'manager'];

export const STATUSES = { principal: 'Joueur principal', 'réserviste': 'Joueur réserviste' };
export const CONSENT = 'J’ai lu et compris toutes les conditions de ce contrat et je les accepte.';

/* ---------- version 1 : les 10 articles approuvés pour l'hiver 2027 (texte intégral) ---------- */
const V1 = {
  title: 'Contrat YUL FC – 7v7 Hiver 2027',
  season: 'Saison hivernale 2027',
  fee: 300,
  installments: [{ amount: 150, due: '2026-11-19' }, { amount: 150, due: '2026-12-17' }],
  text: "Article 1 – Engagement et objectif\n\nBienvenue au sein de YUL FC pour la saison hivernale 2027.\n\nNotre objectif est d’être le plus compétitif possible tout en maintenant un esprit d’équipe positif.\n\nChaque joueur s’engage à respecter les règlements du club, les décisions des entraîneurs et les conditions du présent contrat pendant toute la saison.\n\nArticle 2 – Saison et matchs\n\n* Début de la saison : janvier 2027.\n* Les matchs se dérouleront les mardis ou mercredis soir, selon le calendrier de la compétition.\n* Chaque joueur s’engage à être disponible dans la mesure de ses possibilités et à communiquer ses indisponibilités.\n\nArticle 3 – Présences et ponctualité\n\n* Confirmer ses disponibilités au moins 48 heures avant chaque match ou entraînement.\n* Arriver au minimum 15 minutes avant le début de chaque match.\n* Prévenir les entraîneurs en cas d’absence.\n* Les absences injustifiées seront évaluées au cas par cas par les entraîneurs.\n\nArticle 4 – Temps de jeu\n\n* Le temps de jeu est déterminé exclusivement par les entraîneurs.\n* Aucun minimum de temps de jeu n’est garanti.\n* Les décisions sportives peuvent tenir compte des performances, de l’assiduité, de l’attitude et des besoins de l’équipe.\n* Chaque joueur doit respecter les décisions des entraîneurs.\n\nArticle 5 – Effectif et réservistes\n\n* L’effectif comprend 13 joueurs principaux et 5 réservistes.\n* Les réservistes sont convoqués selon les besoins de l’équipe.\n* Le statut de réserviste ne garantit aucune convocation ni aucun temps de jeu minimum.\n\nArticle 6 – Équipement\n\n* Les joueurs qui ne faisaient pas partie de YUL FC lors de la saison précédente devront se procurer le maillot bleu officiel.\n* Le maillot sera fourni par YUL FC à un prix encore à déterminer, communiqué avant toute commande.\n* Les joueurs possédant déjà le maillot bleu officiel pourront continuer à l’utiliser.\n\nArticle 7 – Modalités financières\n\nLa cotisation totale est fixée à 300 $ CAD par joueur.\n\nPaiement obligatoire en deux versements :\n\n* 150 $ avant le 19 novembre 2026.\n* 150 $ avant le 17 décembre 2026.\n\nLe joueur s’engage à respecter ces échéances.\n\nEn cas de retard de paiement, le club communiquera avec le joueur afin de régulariser la situation.\n\nArticle 8 – Conditions disciplinaires\n\nChaque joueur doit respecter ses coéquipiers, les entraîneurs, les arbitres et les adversaires.\n\nLes insultes, menaces, violences et discriminations sont interdites.\n\nEn cas de non-respect des règles, les sanctions possibles sont :\n\n1. Avertissement.\n2. Suspension temporaire.\n3. Exclusion de l’équipe.\n\nLes sanctions seront appliquées selon la gravité et les circonstances. Le joueur pourra présenter sa version des faits avant une suspension ou une exclusion, dans la mesure du possible.\n\nArticle 9 – Départ en cours de saison\n\nTout joueur souhaitant quitter YUL FC doit en informer les responsables.\n\nAucun remboursement de la cotisation ne sera accordé après le début de la saison, sous réserve des dispositions légales applicables.\n\nArticle 10 – Confirmation d’engagement\n\nEn signant électroniquement ce contrat, le joueur confirme :\n\n* Avoir lu et compris toutes les conditions.\n* Accepter les règlements du club.\n* S’engager à respecter les modalités financières.\n* Accepter les décisions sportives des entraîneurs.\n* S’engager pour la saison hivernale 2027.\n\nLa signature électronique constitue la confirmation officielle de son engagement, sous réserve des exigences légales applicables.",
};

/* ---------- lecture du texte : « Article N – Titre », listes « * » et « 1. », paragraphes ---------- */
export function parseArticles(src){
  const arts = []; let a = null, list = null;
  for(const raw of String(src).split('\n')){
    const line = raw.trim();
    const h = line.match(/^Article\s+(\d+)\s*[–—-]\s*(.+)$/);
    if(h){ a = { n: +h[1], title: h[2].trim(), blocks: [] }; arts.push(a); list = null; continue; }
    if(!a){ if(line){ a = { n: 0, title: '', blocks: [] }; arts.push(a); } else continue; }
    if(!line){ list = null; continue; }
    const ul = line.match(/^[*•-]\s+(.+)$/), ol = line.match(/^(\d+)\.\s+(.+)$/);
    if(ul || ol){
      const t = ul ? 'ul' : 'ol';
      if(!list || list.t !== t){ list = { t, items: [] }; a.blocks.push(list); }
      list.items.push(ul ? ul[1] : ol[2]);
    } else { list = null; a.blocks.push({ t: 'p', s: line }); }
  }
  return arts;
}
const versionHash = v => sha256(JSON.stringify({ title: v.title, season: v.season, text: v.text, fee: v.fee, installments: v.installments }));

/* ---------- accès aux données ---------- */
async function current(D){
  const meta = await D.get('hiver/meta.json');
  if(meta && meta.current){ const v = await D.get('hiver/v/' + meta.current + '.json'); if(v) return v; }
  const v = { v: 1, ...V1, publishedAt: now(), publishedBy: 'system' };
  v.hash = await versionHash(v);
  await D.put('hiver/v/1.json', v);
  await D.put('hiver/meta.json', { current: 1 });
  return v;
}
const roster = async D => (await D.get('hiver/roster.json')) || { players: {} };
const publicSig = s => { if(!s) return s; const { sigImage, ...rest } = s; return rest; };
const pdfKey = (pid, v) => `private/hiver2027/${pid}-v${v}.pdf`;

/* ---------- données envoyées à l'espace (bootstrap) ---------- */
export async function hiverBootstrap(D, u, playerId){
  const v = await current(D);
  const r = await roster(D);
  if(FINANCE.includes(u.role)){
    const sigs = (await D.all('hiver/sig/')).map(publicSig);
    const meta = await D.get('hiver/meta.json');
    const versions = [];
    for(let n = 1; n <= (meta ? meta.current : 1); n++){ const x = n === v.v ? v : await D.get('hiver/v/' + n + '.json'); if(x) versions.push({ v: x.v, title: x.title, publishedAt: x.publishedAt, hash: x.hash }); }
    return { version: v, versions, roster: r.players, signatures: sigs };
  }
  if(!playerId || !r.players[playerId]) return null;
  const mine = (await D.all('hiver/sig/' + playerId + '/')).map(publicSig).sort((a, b) => a.v - b.v);
  return { version: v, status: r.players[playerId].status, signatures: mine };
}

/* ---------- écritures ---------- */
export async function hiverRoute(path, request, env, body, u, D){
  const finance = FINANCE.includes(u.role);
  if(path === 'hiver/roster'){
    if(!finance) return err('Accès refusé pour ton rôle.', 403);
    const pid = safeId(body.playerId); if(!pid || !(await D.get('players/' + pid + '.json'))) return err('Joueur introuvable.', 404);
    const r = await roster(D);
    if(body.selected === false) delete r.players[pid];
    else {
      const status = STATUSES[body.status] ? body.status : (r.players[pid] && r.players[pid].status) || 'principal';
      r.players[pid] = { status, at: now(), by: u.id };
    }
    await D.put('hiver/roster.json', r);
    return json({ roster: r.players });
  }
  if(path === 'hiver/publish'){
    if(!finance) return err('Accès refusé pour ton rôle.', 403);
    const cur = await current(D);
    const title = str(body.title, 120) || cur.title;
    const text = String(body.text ?? '').replace(/\r/g, '').replace(/[<>]/g, '').trim().slice(0, 30000);
    const arts = parseArticles(text).filter(a => a.n);
    if(!arts.length) return err('Le texte doit contenir au moins un « Article 1 – Titre ».');
    const inst = (Array.isArray(body.installments) ? body.installments : cur.installments)
      .map(x => ({ amount: Math.round(Number(x.amount) * 100) / 100, due: /^\d{4}-\d{2}-\d{2}$/.test(String(x.due)) ? String(x.due) : '' }))
      .filter(x => x.amount > 0 && x.due).slice(0, 6);
    if(!inst.length) return err('Ajoute au moins une échéance de paiement.');
    const v = { v: cur.v + 1, title, season: str(body.season, 80) || cur.season, fee: inst.reduce((t, x) => t + x.amount, 0), installments: inst, text, publishedAt: now(), publishedBy: u.id, publishedByName: u.name };
    v.hash = await versionHash(v);
    if(v.hash === cur.hash) return err('Aucune modification par rapport à la version actuelle.');
    await D.put('hiver/v/' + v.v + '.json', v);
    await D.put('hiver/meta.json', { current: v.v });
    return json(v);
  }
  if(path === 'hiver/sign'){
    const pid = u.playerId; if(!pid) return err('Aucun profil joueur lié à ce compte.');
    const r = await roster(D);
    const entry = r.players[pid];
    if(!entry) return err('Ce contrat ne t’est pas destiné.', 403);
    const cur = await current(D);
    if(Number(body.v) !== cur.v || body.hash !== cur.hash) return err('Le contrat vient d’être mis à jour. Relis la nouvelle version avant de signer.', 409);
    const key = `hiver/sig/${pid}/${cur.v}.json`;
    if(await D.get(key)) return err('Tu as déjà signé cette version du contrat.', 409);
    if(body.accepted !== true) return err('Coche la case d’acceptation avant de signer.');
    const fullName = str(body.fullName, 80);
    if(fullName.length < 3 || !/\s/.test(fullName)) return err('Indique ton nom complet (prénom et nom).');
    const birth = String(body.birthDate || '');
    const by = +birth.slice(0, 4), thisYear = new Date().getFullYear();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(birth) || isNaN(Date.parse(birth)) || by < thisYear - 90 || by > thisYear - 12) return err('Date de naissance invalide.');
    const mail = email(body.email); if(!mail) return err('Courriel invalide.');
    const m = String(body.signature || '').match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
    if(!m) return err('Signature manquante.');
    const sigBytes = Uint8Array.from(atob(m[1]), c => c.charCodeAt(0));
    if(sigBytes.length < 1500 || sigBytes.length > 120000 || !jpegInfo(sigBytes)) return err('Signature illisible. Efface et signe à nouveau.');
    const player = await D.get('players/' + pid + '.json');
    const rec = {
      id: uid(), playerId: pid, v: cur.v, versionHash: cur.hash, title: cur.title,
      fullName, birthDate: birth, email: mail, status: entry.status, statusLabel: STATUSES[entry.status],
      playerNum: player && player.num != null ? player.num : null,
      signedAt: now(),
      consent: {
        accepted: true, text: CONSENT,
        accountId: u.id, accountEmail: u.email || '', accountName: u.name || '',
        ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '',
        country: (request.cf && request.cf.country) || '',
        userAgent: str(request.headers.get('user-agent'), 300),
        clientTime: str(body.clientTime, 40), clientTz: str(body.clientTz, 60),
      },
      sigHash: await sha256(sigBytes),
      sigImage: 'data:image/jpeg;base64,' + m[1],
    };
    const pdf = await renderPdf(env, request, cur, rec);
    rec.pdfHash = await sha256(pdf);
    rec.pdfSize = pdf.length;
    await env.MEDIA.put(pdfKey(pid, cur.v), pdf, { httpMetadata: { contentType: 'application/pdf' }, customMetadata: { sha256: rec.pdfHash, signature: rec.id } });
    if(await D.get(key)) return err('Tu as déjà signé cette version du contrat.', 409);
    await D.put(key, rec);
    await notifySigned(env, rec);
    return json(publicSig(rec));
  }
  return null;
}

/* Envoi automatique par courriel : à brancher plus tard (option A). Rien n'est envoyé pour l'instant. */
async function notifySigned(env, rec){ void env; void rec; }

/* ---------- téléchargement du PDF signé ---------- */
export async function hiverPdf(request, env, u){
  const url = new URL(request.url);
  const pid = safeId(url.searchParams.get('pid')) || u.playerId;
  const v = parseInt(url.searchParams.get('v'), 10);
  if(!pid || !v) return err('Paramètres manquants.');
  if(!FINANCE.includes(u.role) && u.playerId !== pid) return err('Accès refusé.', 403);
  const obj = await env.MEDIA.get(pdfKey(pid, v));
  if(!obj) return err('Contrat signé introuvable.', 404);
  const rec = await (async () => { const o = await env.MEDIA.get('db/hiver/sig/' + pid + '/' + v + '.json'); return o ? o.json() : null; })();
  const name = `YUL-FC-contrat-7v7-hiver-2027-v${v}-${(rec && rec.fullName || 'joueur').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-')}.pdf`;
  return new Response(obj.body, { headers: {
    'content-type': 'application/pdf',
    'content-disposition': `${url.searchParams.get('dl') ? 'attachment' : 'inline'}; filename="${name}"`,
    'cache-control': 'private, no-store',
    'x-content-sha256': (obj.customMetadata && obj.customMetadata.sha256) || '',
  } });
}

/* ==========================================================================
   Mise en page du PDF (format lettre)
   ========================================================================== */
const NAVY = '#070D1C', NAVY2 = '#0C1730', GOLD = '#F0B429', GOLD_D = '#B8892A', INK = '#1A2236', GRAY = '#5B6478', LIGHT = '#F3F5FA', LINE = '#D9DEEA', WHITE = '#F4F5F2';
const M = 54, CW = 612 - 2 * M;
const money = n => Number(n).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
const dateLong = s => new Date(s.length === 10 ? s + 'T12:00:00Z' : s).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: s.length === 10 ? 'UTC' : TZ });
const timeFr = s => new Date(s).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).replace(/\s/g, ' ');

async function asset(env, request, path){
  const r = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
  if(!r.ok) throw new Error('Fichier introuvable : ' + path);
  return new Uint8Array(await r.arrayBuffer());
}

export async function renderPdf(env, request, v, rec){
  const [anton, inter, interb, crest] = await Promise.all(['/fx/pdf/anton.ttf', '/fx/pdf/inter.ttf', '/fx/pdf/interb.ttf', '/fx/pdf/crest.jpg'].map(p => asset(env, request, p)));
  const sig = Uint8Array.from(atob(rec.sigImage.split(',')[1]), c => c.charCodeAt(0));
  const doc = new Doc();
  layout(doc, v, rec, crest, sig);
  return doc.build({ anton, inter, interb }, { Title: v.title + ' · ' + rec.fullName, Author: 'YUL FC', Subject: 'Contrat signé électroniquement, version ' + v.v });
}

export function layout(doc, v, rec, crest, sig){
  const H = doc.H;
  let y;
  const signedLine = `Signé électroniquement le ${dateLong(rec.signedAt)} à ${timeFr(rec.signedAt)} (heure de Montréal)`;

  /* en-tête page 1 */
  doc.rect(0, H - 158, 612, 158, NAVY);
  doc.rect(0, H - 161, 612, 3, GOLD);
  const ci = jpegInfo(crest), ch = 112, cw = ch * ci.w / ci.h;
  doc.image('Crest', crest, M - 6, H - 158 + 23, cw, ch);
  const tx = M - 6 + cw + 16;
  doc.text(tx, H - 54, `CONTRAT JOUEUR · VERSION ${v.v}`, 'interb', 8, GOLD, 1.6);
  let ty = H - 84;
  for(const l of wrap(v.title.toUpperCase(), 'anton', 25, 612 - M - tx)){ doc.text(tx, ty, l, 'anton', 25, WHITE); ty -= 27; }
  doc.text(tx, ty + 6, v.season, 'inter', 9.5, '#B9C2DA');
  doc.text(tx, ty - 9, signedLine, 'inter', 8, GOLD);

  const cont = () => {
    doc.page();
    doc.rect(0, H - 34, 612, 34, NAVY);
    doc.rect(0, H - 36, 612, 2, GOLD);
    doc.text(M, H - 21.5, ('YUL FC · ' + v.title).toUpperCase(), 'interb', 7.5, GOLD, 1.2);
    y = H - 64;
  };
  const ensure = h => { if(y - h < 78) cont(); };

  /* bloc joueur */
  y = H - 161 - 26;
  const boxH = 82;
  doc.rect(M, y - boxH, CW, boxH, LIGHT);
  doc.rect(M, y - boxH, 3, boxH, GOLD);
  const cell = (x, yy, label, value) => {
    doc.text(x, yy, label.toUpperCase(), 'interb', 6.5, GOLD_D, 1.2);
    const vv = wrap(value || '–', 'inter', 10.5, CW / 2 - 30)[0];
    doc.text(x, yy - 15, vv, 'inter', 10.5, INK);
  };
  cell(M + 18, y - 20, 'Nom complet', rec.fullName);
  cell(M + CW / 2, y - 20, 'Date de naissance', dateLong(rec.birthDate));
  cell(M + 18, y - 54, 'Courriel', rec.email);
  cell(M + CW / 2, y - 54, 'Statut du joueur', rec.statusLabel + (rec.playerNum != null ? ' · nº ' + rec.playerNum : ''));
  y -= boxH + 26;

  /* articles */
  const P = 10, LH = 14.2;
  for(const a of parseArticles(v.text)){
    ensure(64);
    if(a.n){
      doc.text(M, y, 'ARTICLE ' + a.n, 'interb', 7.5, GOLD_D, 1.6);
      y -= 18;
      for(const l of wrap(a.title.toUpperCase(), 'anton', 15, CW)){ doc.text(M, y, l, 'anton', 15, NAVY2); y -= 18; }
      doc.rect(M, y + 8, 28, 2, GOLD);
      y -= 8;
    }
    for(const b of a.blocks){
      if(b.t === 'p'){
        const ls = wrap(b.s, 'inter', P, CW);
        for(const l of ls){ ensure(LH); doc.text(M, y, l, 'inter', P, INK); y -= LH; }
        y -= 5;
      } else {
        b.items.forEach((it, i) => {
          const ls = wrap(it, 'inter', P, CW - 18);
          ensure(LH);
          if(b.t === 'ul') doc.text(M + 4, y, '•', 'interb', P, GOLD_D);
          else doc.text(M + 1, y, (i + 1) + '.', 'interb', P, GOLD_D);
          for(const l of ls){ ensure(LH); doc.text(M + 18, y, l, 'inter', P, INK); y -= LH; }
          y -= 2;
        });
        y -= 4;
      }
    }
    y -= 12;
  }

  /* échéancier */
  const rowH = 34, schH = 46 + v.installments.length * rowH;
  ensure(schH + 20);
  doc.text(M, y, 'PAIEMENT', 'interb', 7.5, GOLD_D, 1.6); y -= 18;
  doc.text(M, y, 'ÉCHÉANCIER DE PAIEMENT', 'anton', 15, NAVY2); y -= 12;
  const top = y;
  doc.rect(M, top - (v.installments.length * rowH + 30), CW, v.installments.length * rowH + 30, LIGHT);
  doc.rect(M, top - (v.installments.length * rowH + 30), 3, v.installments.length * rowH + 30, GOLD);
  y = top - 8;
  v.installments.forEach((x, i) => {
    doc.text(M + 18, y - 18, money(x.amount), 'anton', 16, NAVY2);
    doc.text(M + 110, y - 17, 'avant le ' + dateLong(x.due), 'inter', 10.5, INK);
    const lab = 'VERSEMENT ' + (i + 1);
    doc.text(M + CW - 16 - width(lab, 'interb', 7) - 1.2 * (lab.length - 1), y - 16, lab, 'interb', 7, GOLD_D, 1.2);
    if(i < v.installments.length - 1) doc.line(M + 18, y - rowH + 4, M + CW - 16, y - rowH + 4, LINE);
    y -= rowH;
  });
  doc.text(M + 18, y - 14, `Total : ${money(v.fee)} par joueur`, 'interb', 9, INK);
  y = top - (v.installments.length * rowH + 30) - 30;

  /* signature */
  ensure(196);
  doc.text(M, y, 'ENGAGEMENT', 'interb', 7.5, GOLD_D, 1.6); y -= 18;
  doc.text(M, y, 'SIGNATURE ÉLECTRONIQUE', 'anton', 15, NAVY2); y -= 14;
  const sTop = y, sH = 150;
  doc.rect(M, sTop - sH, CW, sH, LIGHT);
  doc.rect(M, sTop - sH, 3, sH, GOLD);
  doc.rect(M + 18, sTop - 23, 10, 10, GOLD);
  doc.line(M + 20.2, sTop - 18.2, M + 22.6, sTop - 20.8, NAVY, 1.4); doc.line(M + 22.6, sTop - 20.8, M + 26.2, sTop - 15.4, NAVY, 1.4);
  doc.text(M + 34, sTop - 21, CONSENT, 'inter', 8.5, INK);
  const si = jpegInfo(sig);
  if(si){
    const maxW = 250, maxH = 78, k = Math.min(maxW / si.w, maxH / si.h);
    doc.image('Sig', sig, M + 18, sTop - 34 - si.h * k, si.w * k, si.h * k);
  }
  doc.line(M + 18, sTop - 116, M + 280, sTop - 116, '#9AA3B8', .7);
  doc.text(M + 18, sTop - 129, rec.fullName, 'interb', 10, INK);
  doc.text(M + 18, sTop - 142, signedLine, 'inter', 7.5, GRAY);
  const rx = M + 310;
  const kv = (yy, k, val) => { doc.text(rx, yy, k.toUpperCase(), 'interb', 6.5, GOLD_D, 1.2); doc.text(rx, yy - 13, val, 'inter', 9.5, INK); };
  kv(sTop - 44, 'Statut', rec.statusLabel);
  kv(sTop - 76, 'Version du contrat', 'Version ' + v.v + ' · publiée le ' + dateLong(v.publishedAt));
  kv(sTop - 108, 'Identifiant de signature', rec.id);
  y = sTop - sH - 26;

  /* preuve de consentement */
  const c = rec.consent;
  const proof = [
    ['Case d’acceptation', 'cochée par le joueur avant la signature'],
    ['Date et heure (serveur)', rec.signedAt + ' (UTC)'],
    ['Compte', `${c.accountName || ''} · ${c.accountEmail || ''} · ${c.accountId}`],
    ['Adresse IP', (c.ip || 'non disponible') + (c.country ? ' · ' + c.country : '')],
    ['Appareil', c.userAgent || 'non disponible'],
    ['Empreinte du texte signé (SHA-256)', v.hash],
    ['Empreinte de la signature (SHA-256)', rec.sigHash],
  ];
  const lines = proof.flatMap(([k, val]) => wrap(val, 'inter', 7.5, CW - 160).map((l, i) => [i ? '' : k, l]));
  ensure(30 + lines.length * 10.5 + 30);
  doc.text(M, y, 'PREUVE DE CONSENTEMENT', 'interb', 7.5, GOLD_D, 1.6); y -= 16;
  for(const [k, l] of lines){ if(k) doc.text(M, y, k, 'interb', 7.5, INK); doc.text(M + 160, y, l, 'inter', 7.5, GRAY); y -= 10.5; }
  y -= 8;
  for(const l of wrap('Document généré automatiquement au moment de la signature. Le texte ci-dessus correspond exactement à la version ' + v.v + ' du contrat. Toute modification du contrat entraîne une nouvelle version, qui doit être acceptée et signée de nouveau par le joueur.', 'inter', 7.5, CW)){ doc.text(M, y, l, 'inter', 7.5, GRAY); y -= 10.5; }

  /* pieds de page */
  const n = doc.pages.length;
  doc.pages.forEach((pg, i) => {
    doc.cur = pg;
    doc.line(M, 52, 612 - M, 52, LINE);
    doc.text(M, 40, `YUL FC · ${v.title} · version ${v.v} · ${rec.fullName}`, 'inter', 7, GRAY);
    const pgl = `Page ${i + 1} / ${n}`;
    doc.text(612 - M - width(pgl, 'inter', 7), 40, pgl, 'inter', 7, GRAY);
    doc.text(M, 29, 'Empreinte SHA-256 du texte : ' + v.hash, 'inter', 6, '#8A93A8');
  });
}
