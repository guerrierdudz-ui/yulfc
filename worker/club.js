/* ==========================================================================
   YUL FC · Espace membres (joueurs + staff)
   Stockage : bucket R2 « MEDIA », sous le préfixe db/ (jamais servi publiquement).
   Rôles    : admin · manager · coach · player
     - admin   : tout, y compris les comptes staff
     - manager : effectif, calendrier, convocations, annonces, photos, contrats et paiements
     - coach   : effectif, calendrier, convocations, présences, annonces, photos
     - player  : son calendrier, ses dispos (par événement et du mois), ses convocations, les annonces, son contrat, ses présences
   Premier compte admin : /espace.html → « Première configuration » avec la clé STAFF_UPLOAD_KEY.
   ========================================================================== */

const SESSION_DAYS = 30;
const COOKIE = 'yul_s';
const PBKDF2_ITER = 100000;
const STAFF = ['admin', 'manager', 'coach'];
const FINANCE = ['admin', 'manager'];
const ROLES = ['admin', 'manager', 'coach', 'player'];
const MAX_PDF = 10 * 1024 * 1024;

/* ---------------- utilitaires ---------------- */
const enc = new TextEncoder();
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});
const err = (msg, status = 400) => json({ error: msg }, status);
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
const now = () => new Date().toISOString();

const str = (v, max = 200) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);
const text = (v, max = 4000) => String(v ?? '').replace(/[<>]/g, '').replace(/\r/g, '').slice(0, max).trim();
const num = (v, min = -1e9, max = 1e9) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null; };
const int = (v, min, max) => { const n = num(v, min, max); return n === null ? null : Math.round(n); };
const oneOf = (v, list, dflt) => list.includes(v) ? v : dflt;
const isoDate = v => { const s = String(v || ''); return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([.]\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(s) ? s : ''; };
const email = v => { const s = String(v || '').trim().toLowerCase(); return /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[a-z]{2,}$/.test(s) ? s : ''; };
const safeId = v => /^[a-z0-9]{6,32}$/.test(String(v || '')) ? String(v) : '';

function timingSafeEqual(a, b){
  if(typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0; for(let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/* ---------------- stockage R2 ---------------- */
const db = env => ({
  async get(key){ const o = await env.MEDIA.get('db/' + key); if(!o) return null; try{ return await o.json(); }catch(e){ return null; } },
  async put(key, val){ await env.MEDIA.put('db/' + key, JSON.stringify(val), { httpMetadata: { contentType: 'application/json' } }); return val; },
  async del(key){ await env.MEDIA.delete('db/' + key); },
  async keys(prefix){
    const out = []; let cursor;
    do{
      const r = await env.MEDIA.list({ prefix: 'db/' + prefix, cursor, limit: 1000 });
      r.objects.forEach(o => out.push(o.key.slice(3)));
      cursor = r.truncated ? r.cursor : undefined;
    }while(cursor);
    return out;
  },
  async all(prefix){
    const ks = await this.keys(prefix);
    const vals = await Promise.all(ks.map(k => this.get(k)));
    return vals.filter(Boolean);
  },
});

/* ---------------- mots de passe et sessions ---------------- */
async function hashPassword(password, saltHex){
  const salt = saltHex ? new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITER }, key, 256);
  return { salt: hex(salt), hash: hex(bits) };
}
function tempCode(){
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = crypto.getRandomValues(new Uint8Array(8));
  const c = [...r].map(x => A[x % A.length]).join('');
  return `YUL-${c.slice(0, 4)}-${c.slice(4)}`;
}
const pwOk = p => typeof p === 'string' && p.length >= 8 && p.length <= 200;

function readCookie(request){
  const c = request.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([A-Za-z0-9_-]{20,})'));
  return m ? m[1] : '';
}
const sessionCookie = (token, maxAge) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

async function createSession(D, user){
  const token = b64u(crypto.getRandomValues(new Uint8Array(32)));
  await D.put('sessions/' + await sha256(token) + '.json', { uid: user.id, exp: Date.now() + SESSION_DAYS * 864e5 });
  return token;
}
export async function currentUser(request, env){
  if(!env.MEDIA) return null;
  const token = readCookie(request); if(!token) return null;
  const D = db(env);
  const s = await D.get('sessions/' + await sha256(token) + '.json');
  if(!s || s.exp < Date.now()) return null;
  const u = await D.get('users/' + s.uid + '.json');
  if(!u || !u.active) return null;
  return u;
}
export const isStaff = u => !!u && STAFF.includes(u.role);
const publicUser = u => u && ({ id: u.id, name: u.name, email: u.email, role: u.role, playerId: u.playerId || null, mustChange: !!u.mustChange, active: !!u.active, lastLogin: u.lastLogin || null, createdAt: u.createdAt });

const userByEmail = async (D, mail) => {
  const ref = await D.get('emails/' + await sha256(mail) + '.json');
  return ref ? D.get('users/' + ref.id + '.json') : null;
};
async function saveUser(D, u){
  await D.put('users/' + u.id + '.json', u);
  await D.put('emails/' + await sha256(u.email) + '.json', { id: u.id });
  return u;
}

/* ---------------- authentification ---------------- */
async function authMe(request, env){
  const D = db(env);
  const u = await currentUser(request, env);
  if(!u){
    const anyUser = (await D.keys('users/')).length > 0;
    return json({ user: null, setupNeeded: !anyUser, setupReady: !!env.STAFF_UPLOAD_KEY });
  }
  return json({ user: publicUser(u) });
}

async function authSetup(request, env, body){
  const D = db(env);
  if((await D.keys('users/')).length) return err('La configuration initiale est déjà faite.', 409);
  if(!env.STAFF_UPLOAD_KEY) return err('Ajoute d\'abord le secret STAFF_UPLOAD_KEY dans Cloudflare.', 503);
  if(!timingSafeEqual(String(body.key || ''), env.STAFF_UPLOAD_KEY)) return err('Clé de configuration invalide.', 401);
  const mail = email(body.email), name = str(body.name, 80);
  if(!mail || !name) return err('Nom et email valides requis.');
  if(!pwOk(body.password)) return err('Mot de passe : 8 caractères minimum.');
  const { salt, hash } = await hashPassword(body.password);
  const u = await saveUser(D, { id: uid(), name, email: mail, role: 'admin', playerId: null, salt, hash, mustChange: false, active: true, createdAt: now() });
  const token = await createSession(D, u);
  return json({ user: publicUser(u) }, 201, { 'set-cookie': sessionCookie(token, SESSION_DAYS * 86400) });
}

async function authLogin(request, env, body){
  const D = db(env);
  const mail = email(body.email);
  const pw = String(body.password || '');
  if(!mail || !pw) return err('Email et mot de passe requis.');
  const tKey = 'throttle/' + await sha256(mail) + '.json';
  const t = await D.get(tKey) || { n: 0, until: 0 };
  if(t.until > Date.now()) return err('Trop d\'essais. Réessaie dans 15 minutes.', 429);
  const u = await userByEmail(D, mail);
  let ok = false;
  if(u && u.active){ const { hash } = await hashPassword(pw, u.salt); ok = timingSafeEqual(hash, u.hash); }
  else await hashPassword(pw); // même durée de réponse, compte existant ou non
  if(!ok){
    t.n = (t.n || 0) + 1;
    if(t.n >= 8){ t.until = Date.now() + 15 * 60e3; t.n = 0; }
    await D.put(tKey, t);
    return err('Email ou mot de passe incorrect.', 401);
  }
  if(t.n) await D.del(tKey);
  u.lastLogin = now(); await D.put('users/' + u.id + '.json', u);
  const token = await createSession(D, u);
  return json({ user: publicUser(u) }, 200, { 'set-cookie': sessionCookie(token, SESSION_DAYS * 86400) });
}

async function authLogout(request, env){
  const token = readCookie(request);
  if(token) await db(env).del('sessions/' + await sha256(token) + '.json');
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('x'.repeat(20), 0) });
}

async function authPassword(request, env, body, u){
  const { hash } = await hashPassword(String(body.current || ''), u.salt);
  if(!timingSafeEqual(hash, u.hash)) return err('Mot de passe actuel incorrect.', 401);
  if(!pwOk(body.next)) return err('Nouveau mot de passe : 8 caractères minimum.');
  if(body.next === body.current) return err('Choisis un mot de passe différent du code temporaire.');
  const h = await hashPassword(body.next);
  u.salt = h.salt; u.hash = h.hash; u.mustChange = false;
  await db(env).put('users/' + u.id + '.json', u);
  return json({ user: publicUser(u) });
}

/* ---------------- normalisation des objets ---------------- */
const POS = ['GK', 'DEF', 'MID', 'FWD', ''];
function cleanPlayer(b, old = {}){
  return {
    ...old,
    id: old.id || uid(),
    firstName: str(b.firstName, 60), lastName: str(b.lastName, 60),
    num: (b.num === '' || b.num == null) ? null : int(b.num, 0, 99),
    pos: oneOf(b.pos, POS, ''),
    phone: str(b.phone, 30),
    birthDate: (isoDate(b.birthDate) || '').slice(0, 10),
    nationalities: (Array.isArray(b.nationalities) ? b.nationalities : String(b.nationalities || b.nationality || '').split(/\s*[,/;]\s*/))
      .map(n => str(n, 40)).filter(Boolean).filter((n, i, a) => a.findIndex(x => x.toLowerCase() === n.toLowerCase()) === i).slice(0, 4),
    email: email(b.email) || '',
    status: oneOf(b.status, ['actif', 'blessé', 'suspendu', 'inactif'], 'actif'),
    t7: b.t7 === undefined ? !!old.t7 : (b.t7 === true || b.t7 === 'true' || b.t7 === 'on'),
    notes: text(b.notes, 1000),
    updatedAt: now(), createdAt: old.createdAt || now(),
  };
}
const EV_TYPES = ['match', 'entrainement', 'autre'];
/* Deux équipes : tout l'effectif joue en 11v11 ; les joueurs cochés « t7 » jouent aussi en 7v7 */
const TEAMS = ['11v11', '7v7'];
const teamOf = e => e && e.team === '7v7' ? '7v7' : '11v11';
const inTeam = (p, team) => !!p && (team !== '7v7' || !!p.t7);
function cleanEvent(b, old = {}){
  return {
    ...old,
    id: old.id || uid(),
    type: oneOf(b.type, EV_TYPES, 'match'),
    team: oneOf(b.team, TEAMS, old.team || '11v11'),
    title: str(b.title, 120),
    opponent: str(b.opponent, 80),
    date: isoDate(b.date),
    meet: str(b.meet, 40),
    venue: str(b.venue, 120),
    comp: oneOf(b.comp, ['league', 'playoff', 'cup', 'friendly', ''], ''),
    round: str(b.round, 60),
    isHome: b.isHome === true || b.isHome === 'true' ? true : b.isHome === false || b.isHome === 'false' ? false : null,
    notes: text(b.notes, 2000),
    published: !!b.published,
    callup: old.callup || { published: false, playerIds: [], message: '', meet: '' },
    attendance: old.attendance || {},
    result: old.result || null,
    createdAt: old.createdAt || now(), updatedAt: now(),
  };
}
function cleanContract(b, old = {}){
  return {
    ...old,
    playerId: old.playerId || safeId(b.playerId),
    season: str(b.season, 40),
    startDate: isoDate(b.startDate), endDate: isoDate(b.endDate),
    fee: num(b.fee, 0, 100000) ?? 0,
    dueDate: isoDate(b.dueDate),
    includes: text(b.includes, 2000),
    clauses: text(b.clauses, 8000),
    status: oneOf(b.status, ['brouillon', 'à signer', 'signé', 'terminé'], 'brouillon'),
    signedAt: old.signedAt || null, signedName: old.signedName || '',
    file: old.file || null,
    updatedAt: now(), createdAt: old.createdAt || now(),
  };
}

/* ---------------- lecture groupée ---------------- */
/* Dispos du mois : jours et plages horaires où chaque joueur est libre */
const SLOTS = ['matin', 'aprem', 'soir', 'tard'];
const monthOk = v => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v || '')) ? String(v) : '';
function monthsAround(){
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  const out = [];
  for(let i = -1; i <= 2; i++){
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    out.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'));
  }
  return out;
}
function cleanMonthly(b, month, playerId, u){
  const days = {};
  const src = b.days && typeof b.days === 'object' ? b.days : {};
  for(const [d, list] of Object.entries(src)){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d) || d.slice(0, 7) !== month || !Array.isArray(list)) continue;
    const sl = SLOTS.filter(x => list.includes(x));
    if(sl.length) days[d] = sl;
  }
  return { month, playerId, days, note: str(b.note, 300), updatedAt: now(), by: u.id };
}

/* Assiduité de l'équipe (agrégée, sans noms) : moyenne et rang du joueur par type */
function teamAttendance(players, events, me){
  const active = new Set(players.filter(p => p.status !== 'inactif').map(p => p.id));
  const out = {};
  for(const type of ['entrainement', 'match', 'all']){
    const per = {};
    for(const e of events){
      if(type !== 'all' && e.type !== type) continue;
      for(const [pid, v] of Object.entries(e.attendance || {})){
        if(!active.has(pid)) continue;
        const r = per[pid] || (per[pid] = { n: 0, ok: 0 });
        r.n++; if(v === 'présent' || v === 'retard') r.ok++;
      }
    }
    const rates = Object.entries(per).map(([pid, r]) => ({ pid, rate: r.ok / r.n }));
    if(!rates.length){ out[type] = null; continue; }
    const avg = Math.round(rates.reduce((s, r) => s + r.rate, 0) / rates.length * 100);
    const mine = me && rates.find(r => r.pid === me.id);
    const rank = mine ? 1 + rates.filter(r => r.rate > mine.rate + 1e-9).length : null;
    out[type] = { avg, rank, of: rates.length };
  }
  return out;
}

async function bootstrap(env, u){
  const D = db(env);
  const staff = isStaff(u), finance = FINANCE.includes(u.role);
  const [players, eventsAll, news] = await Promise.all([D.all('players/'), D.all('events/'), D.all('news/')]);
  eventsAll.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  news.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const out = { user: publicUser(u), now: now() };

  if(staff){
    out.players = players.sort((a, b) => (a.num ?? 999) - (b.num ?? 999));
    out.events = eventsAll;
    const av = await D.all('avail/');
    out.availability = av; // [{eventId, playerId, status, note, at}]
    out.months = monthsAround();
    out.monthly = (await Promise.all(out.months.map(m => D.all('monthly/' + m + '/')))).flat();
    out.news = news;
    const users = await D.all('users/');
    out.accounts = users.map(publicUser);
    const byNew = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt));
    out.applications = (await D.all('apps/')).sort(byNew);
    out.inquiries = (await D.all('inquiries/')).sort(byNew);
    if(finance){
      out.contracts = await D.all('contracts/');
      out.payments = await D.all('payments/');
    }
    return json(out);
  }

  // joueur
  const me = players.find(p => p.id === u.playerId) || null;
  out.player = me;
  out.teammates = players.filter(p => p.status !== 'inactif').map(p => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, num: p.num, pos: p.pos, t7: !!p.t7 }));
  const visible = eventsAll.filter(e => e.published && (!me || inTeam(me, teamOf(e))));
  out.events = visible.map(e => ({
    id: e.id, type: e.type, team: teamOf(e), title: e.title, opponent: e.opponent, date: e.date, meet: e.meet, venue: e.venue,
    comp: e.comp, round: e.round, isHome: e.isHome, notes: e.notes, result: e.result ? { yul: e.result.yul, opp: e.result.opp } : null,
    callup: e.callup && e.callup.published ? { published: true, playerIds: e.callup.playerIds, message: e.callup.message, meet: e.callup.meet } : { published: false },
    myAttendance: me ? (e.attendance || {})[me.id] || null : null,
    myStats: me && e.result && Array.isArray(e.result.scorers) ? e.result.scorers.find(s => s.playerId === me.id) || null : null,
  }));
  out.news = news.filter(n => n.audience !== 'staff' && (!n.team || n.team === '11v11' || (me && me.t7)));
  out.teamAttendance = {};
  for(const t of TEAMS){
    if(!me || !inTeam(me, t)) continue;
    out.teamAttendance[t] = teamAttendance(players.filter(p => inTeam(p, t)), visible.filter(e => teamOf(e) === t), me);
  }
  out.months = monthsAround();
  out.monthly = me ? (await Promise.all(out.months.map(m => D.get('monthly/' + m + '/' + me.id + '.json')))).filter(Boolean) : [];
  if(me){
    const myKeys = (await D.keys('avail/')).filter(k => k.endsWith('/' + me.id + '.json'));
    out.availability = (await Promise.all(myKeys.map(k => D.get(k)))).filter(Boolean);
    const c = await D.get('contracts/' + me.id + '.json');
    out.contract = c && c.status !== 'brouillon' ? c : null;
    out.payments = (await D.all('payments/' + me.id + '/')).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }
  return json(out);
}

/* ---------------- écritures ---------------- */
async function route(path, request, env, body, u){
  const D = db(env);
  const staff = isStaff(u), finance = FINANCE.includes(u.role), admin = u.role === 'admin';
  const need = ok => { if(!ok) throw Object.assign(new Error('forbidden'), { status: 403 }); };

  switch(path){
    case 'bootstrap': return bootstrap(env, u);

    /* ---- effectif ---- */
    case 'players/save': {
      need(staff);
      const id = safeId(body.id);
      const old = id ? await D.get('players/' + id + '.json') : null;
      if(id && !old) return err('Joueur introuvable.', 404);
      const p = cleanPlayer(body, old || {});
      if(!p.firstName) return err('Prénom requis.');
      return json(await D.put('players/' + p.id + '.json', p));
    }
    case 'players/delete': {
      need(staff);
      const id = safeId(body.id); if(!id) return err('Joueur invalide.');
      await D.del('players/' + id + '.json');
      for(const k of await D.keys('avail/')) if(k.endsWith('/' + id + '.json')) await D.del(k);
      // le compte lié est désactivé (pas supprimé) pour garder l'historique
      for(const acc of await D.all('users/')) if(acc.playerId === id){ acc.active = false; acc.playerId = null; await D.put('users/' + acc.id + '.json', acc); }
      return json({ ok: true });
    }

    /* ---- comptes ---- */
    case 'accounts/create': {
      const role = oneOf(body.role, ROLES, 'player');
      need(staff && (role === 'player' || admin));
      const mail = email(body.email); if(!mail) return err('Email invalide.');
      if(await userByEmail(D, mail)) return err('Un compte existe déjà avec cet email.', 409);
      let playerId = null, name = str(body.name, 80);
      if(role === 'player'){
        playerId = safeId(body.playerId);
        const p = playerId && await D.get('players/' + playerId + '.json');
        if(!p) return err('Choisis le joueur lié à ce compte.');
        if((await D.all('users/')).some(x => x.playerId === playerId && x.active)) return err('Ce joueur a déjà un compte.', 409);
        name = name || `${p.firstName} ${p.lastName}`.trim();
        if(!p.email){ p.email = mail; await D.put('players/' + p.id + '.json', p); }
      }
      if(!name) return err('Nom requis.');
      const code = tempCode();
      const { salt, hash } = await hashPassword(code);
      const acc = await saveUser(D, { id: uid(), name, email: mail, role, playerId, salt, hash, mustChange: true, active: true, createdAt: now() });
      return json({ account: publicUser(acc), tempCode: code }, 201);
    }
    case 'accounts/reset': {
      need(staff);
      const acc = await D.get('users/' + safeId(body.id) + '.json'); if(!acc) return err('Compte introuvable.', 404);
      need(admin || acc.role === 'player');
      const code = tempCode(); const h = await hashPassword(code);
      acc.salt = h.salt; acc.hash = h.hash; acc.mustChange = true; acc.active = true;
      await D.put('users/' + acc.id + '.json', acc);
      for(const k of await D.keys('sessions/')){ const s = await D.get(k); if(s && s.uid === acc.id) await D.del(k); }
      return json({ account: publicUser(acc), tempCode: code });
    }
    case 'accounts/update': {
      need(admin);
      const acc = await D.get('users/' + safeId(body.id) + '.json'); if(!acc) return err('Compte introuvable.', 404);
      if(acc.id === u.id && (body.active === false || (body.role && body.role !== 'admin'))) return err('Tu ne peux pas retirer ton propre accès admin.');
      if(body.role) acc.role = oneOf(body.role, ROLES, acc.role);
      if(typeof body.active === 'boolean') acc.active = body.active;
      if(body.name) acc.name = str(body.name, 80);
      await D.put('users/' + acc.id + '.json', acc);
      if(!acc.active) for(const k of await D.keys('sessions/')){ const s = await D.get(k); if(s && s.uid === acc.id) await D.del(k); }
      return json({ account: publicUser(acc) });
    }
    case 'accounts/delete': {
      need(admin);
      const acc = await D.get('users/' + safeId(body.id) + '.json'); if(!acc) return err('Compte introuvable.', 404);
      if(acc.id === u.id) return err('Tu ne peux pas supprimer ton propre compte.');
      await D.del('users/' + acc.id + '.json');
      await D.del('emails/' + await sha256(acc.email) + '.json');
      return json({ ok: true });
    }

    /* ---- calendrier ---- */
    case 'events/save': {
      need(staff);
      const id = safeId(body.id);
      const old = id ? await D.get('events/' + id + '.json') : null;
      if(id && !old) return err('Événement introuvable.', 404);
      const e = cleanEvent(body, old || {});
      if(!e.date) return err('Date requise.');
      if(e.type === 'match' && !e.opponent) return err('Adversaire requis pour un match.');
      return json(await D.put('events/' + e.id + '.json', e));
    }
    case 'events/delete': {
      need(staff);
      const id = safeId(body.id); if(!id) return err('Événement invalide.');
      await D.del('events/' + id + '.json');
      for(const k of await D.keys('avail/' + id + '/')) await D.del(k);
      return json({ ok: true });
    }
    case 'events/callup': {
      need(staff);
      const e = await D.get('events/' + safeId(body.id) + '.json'); if(!e) return err('Événement introuvable.', 404);
      const ids = (Array.isArray(body.playerIds) ? body.playerIds : []).map(safeId).filter(Boolean).slice(0, 60);
      e.callup = { published: !!body.published, playerIds: [...new Set(ids)], message: text(body.message, 1000), meet: str(body.meet, 40), updatedAt: now() };
      return json(await D.put('events/' + e.id + '.json', e));
    }
    case 'events/attendance': {
      need(staff);
      const e = await D.get('events/' + safeId(body.id) + '.json'); if(!e) return err('Événement introuvable.', 404);
      const marks = {};
      for(const [pid, v] of Object.entries(body.marks || {})){
        if(safeId(pid) && ['présent', 'retard', 'absent', 'excusé'].includes(v)) marks[pid] = v;
      }
      e.attendance = marks;
      return json(await D.put('events/' + e.id + '.json', e));
    }
    case 'events/result': {
      need(staff);
      const e = await D.get('events/' + safeId(body.id) + '.json'); if(!e) return err('Événement introuvable.', 404);
      if(body.clear){ e.result = null; return json(await D.put('events/' + e.id + '.json', e)); }
      const yul = int(body.yul, 0, 99), opp = int(body.opp, 0, 99);
      if(yul === null || opp === null) return err('Score invalide.');
      const scorers = (Array.isArray(body.scorers) ? body.scorers : []).map(s => ({
        playerId: safeId(s.playerId), goals: int(s.goals, 0, 20) || 0, assists: int(s.assists, 0, 20) || 0,
      })).filter(s => s.playerId && (s.goals || s.assists)).slice(0, 30);
      e.result = { yul, opp, scorers, potm: safeId(body.potm) || null, at: now() };
      return json(await D.put('events/' + e.id + '.json', e));
    }

    /* ---- disponibilités ---- */
    case 'availability/set': {
      const eventId = safeId(body.eventId);
      const e = eventId && await D.get('events/' + eventId + '.json');
      if(!e || (!staff && !e.published)) return err('Événement introuvable.', 404);
      if(!staff && teamOf(e) === '7v7'){ const me = await D.get('players/' + u.playerId + '.json'); if(!inTeam(me, '7v7')) return err('Événement introuvable.', 404); }
      let playerId = u.playerId;
      if(staff && body.playerId) playerId = safeId(body.playerId);
      if(!playerId) return err('Aucun profil joueur lié à ce compte.');
      const status = oneOf(body.status, ['oui', 'non', 'peut-être'], '');
      const key = 'avail/' + eventId + '/' + playerId + '.json';
      if(!status){ await D.del(key); return json({ ok: true }); }
      return json(await D.put(key, { eventId, playerId, status, note: str(body.note, 200), at: now(), by: u.id }));
    }

    case 'monthly/set': {
      const month = monthOk(body.month); if(!month) return err('Mois invalide.');
      let playerId = u.playerId;
      if(staff && body.playerId) playerId = safeId(body.playerId);
      if(!playerId) return err('Aucun profil joueur lié à ce compte.');
      return json(await D.put('monthly/' + month + '/' + playerId + '.json', cleanMonthly(body, month, playerId, u)));
    }

    case 'requests/update': {
      need(staff);
      const kind = body.kind === 'inquiry' ? 'inquiries/' : 'apps/';
      const key = kind + safeId(body.id) + '.json';
      const r = await D.get(key); if(!r) return err('Demande introuvable.', 404);
      const ST = kind === 'apps/' ? ['nouveau', 'contacté', 'essai', 'accepté', 'refusé'] : ['nouveau', 'contacté', 'en discussion', 'partenaire', 'refusé'];
      if(body.status !== undefined) r.status = oneOf(body.status, ST, r.status);
      if(body.notes !== undefined) r.notes = text(body.notes, 2000);
      r.updatedAt = now();
      return json(await D.put(key, r));
    }
    case 'requests/delete': {
      need(staff);
      const kind = body.kind === 'inquiry' ? 'inquiries/' : 'apps/';
      await D.del(kind + safeId(body.id) + '.json');
      return json({ ok: true });
    }

    /* ---- annonces ---- */
    case 'news/save': {
      need(staff);
      const id = safeId(body.id);
      const old = id ? await D.get('news/' + id + '.json') : null;
      const n = {
        ...(old || {}), id: old ? old.id : uid(),
        title: str(body.title, 120), body: text(body.body, 4000),
        audience: oneOf(body.audience, ['all', 'players', 'staff'], 'players'),
        team: oneOf(body.team, TEAMS, ''),
        pinned: !!body.pinned, author: (old && old.author) || u.name,
        createdAt: (old && old.createdAt) || now(), updatedAt: now(),
      };
      if(!n.title) return err('Titre requis.');
      return json(await D.put('news/' + n.id + '.json', n));
    }
    case 'news/delete': {
      need(staff);
      await D.del('news/' + safeId(body.id) + '.json');
      return json({ ok: true });
    }

    /* ---- contrats et paiements ---- */
    case 'contracts/save': {
      need(finance);
      const pid = safeId(body.playerId);
      if(!pid || !await D.get('players/' + pid + '.json')) return err('Joueur introuvable.', 404);
      const old = await D.get('contracts/' + pid + '.json');
      const c = cleanContract(body, old || { playerId: pid });
      if(body.resetSignature){ c.signedAt = null; c.signedName = ''; }
      return json(await D.put('contracts/' + pid + '.json', c));
    }
    case 'contracts/sign': {
      if(!u.playerId) return err('Aucun profil joueur lié à ce compte.');
      const c = await D.get('contracts/' + u.playerId + '.json');
      if(!c || c.status !== 'à signer') return err('Aucun contrat à signer.', 404);
      const name = str(body.fullName, 120);
      if(name.length < 3 || !body.accept) return err('Écris ton nom complet et coche la case d\'acceptation.');
      c.status = 'signé'; c.signedAt = now(); c.signedName = name;
      return json(await D.put('contracts/' + u.playerId + '.json', c));
    }
    case 'payments/add': {
      need(finance);
      const pid = safeId(body.playerId);
      if(!pid || !await D.get('players/' + pid + '.json')) return err('Joueur introuvable.', 404);
      const amount = num(body.amount, -100000, 100000);
      if(!amount) return err('Montant invalide.');
      const p = { id: uid(), playerId: pid, amount: Math.round(amount * 100) / 100, date: isoDate(body.date) || now().slice(0, 10),
        method: oneOf(body.method, ['comptant', 'virement', 'carte', 'autre'], 'autre'), note: str(body.note, 200), by: u.name, at: now() };
      return json(await D.put('payments/' + pid + '/' + p.id + '.json', p), 201);
    }
    case 'payments/delete': {
      need(finance);
      const pid = safeId(body.playerId), id = safeId(body.id);
      if(!pid || !id) return err('Paiement invalide.');
      await D.del('payments/' + pid + '/' + id + '.json');
      return json({ ok: true });
    }
  }
  return err('Action inconnue.', 404);
}

/* ---------------- fichier PDF du contrat ---------------- */
async function contractFile(request, env, u){
  const D = db(env);
  const url = new URL(request.url);
  if(request.method === 'GET'){
    const pid = safeId(url.searchParams.get('playerId')) || u.playerId;
    if(!pid) return err('Joueur invalide.');
    if(!FINANCE.includes(u.role) && pid !== u.playerId) return err('Accès refusé.', 403);
    const c = await D.get('contracts/' + pid + '.json');
    if(!c || !c.file || (!FINANCE.includes(u.role) && c.status === 'brouillon')) return err('Aucun document.', 404);
    const obj = await env.MEDIA.get('db/files/' + c.file.key);
    if(!obj) return err('Document introuvable.', 404);
    return new Response(obj.body, { headers: {
      'content-type': 'application/pdf', 'cache-control': 'private, no-store',
      'content-disposition': `inline; filename="contrat-yulfc.pdf"`, 'x-content-type-options': 'nosniff',
    } });
  }
  if(request.method === 'POST'){
    if(!FINANCE.includes(u.role)) return err('Accès refusé.', 403);
    let form; try{ form = await request.formData(); }catch(e){ return err('Envoi invalide.'); }
    const pid = safeId(form.get('playerId')), file = form.get('file');
    if(!pid) return err('Joueur invalide.');
    const c = await D.get('contracts/' + pid + '.json');
    if(!c) return err('Enregistre d\'abord le contrat, puis ajoute le PDF.', 404);
    if(!file || typeof file === 'string') return err('Aucun fichier reçu.');
    if(file.type !== 'application/pdf') return err('Le document doit être un PDF.', 415);
    if(file.size > MAX_PDF) return err('PDF trop lourd (10 Mo maximum).', 413);
    const buf = await file.arrayBuffer();
    if(new TextDecoder().decode(buf.slice(0, 5)) !== '%PDF-') return err('Ce fichier n\'est pas un PDF valide.', 415);
    if(c.file) await env.MEDIA.delete('db/files/' + c.file.key);
    const key = uid() + '.pdf';
    await env.MEDIA.put('db/files/' + key, buf, { httpMetadata: { contentType: 'application/pdf' } });
    c.file = { key, name: str(file.name, 120) || 'contrat.pdf', size: file.size, at: now() };
    return json(await D.put('contracts/' + pid + '.json', c));
  }
  if(request.method === 'DELETE'){
    if(!FINANCE.includes(u.role)) return err('Accès refusé.', 403);
    const pid = safeId(url.searchParams.get('playerId'));
    const c = pid && await D.get('contracts/' + pid + '.json');
    if(!c || !c.file) return err('Aucun document.', 404);
    await env.MEDIA.delete('db/files/' + c.file.key);
    c.file = null;
    return json(await D.put('contracts/' + pid + '.json', c));
  }
  return err('Méthode non permise.', 405);
}

/* ---------------- matchs publics (site) ---------------- */
/* ---------------- effectif public (âge + nationalités pour les cartes du site) ----------------
   Seul l'âge est publié, jamais la date de naissance. */
function ageFrom(d){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))) return null;
  const [y, m, day] = d.split('-').map(Number);
  const n = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  let a = n.getFullYear() - y;
  if(n.getMonth() + 1 < m || (n.getMonth() + 1 === m && n.getDate() < day)) a--;
  return a >= 10 && a < 100 ? a : null;
}
async function publicSquad(env){
  const list = env.MEDIA ? await db(env).all('players/') : [];
  // stats 7v7 calculées à partir des matchs 7v7 publiés (présences + buteurs)
  const evs7 = env.MEDIA ? (await db(env).all('events/')).filter(e => e.published && e.type === 'match' && teamOf(e) === '7v7') : [];
  const s7 = p => {
    if(!p.t7) return null;
    let apps = 0, goals = 0, assists = 0;
    for(const e of evs7){
      const a = (e.attendance || {})[p.id];
      const sc = e.result && Array.isArray(e.result.scorers) ? e.result.scorers.find(x => x.playerId === p.id) : null;
      if(a === 'présent' || a === 'retard' || sc) apps++;
      if(sc){ goals += sc.goals || 0; assists += sc.assists || 0; }
    }
    return { apps, goals, assists };
  };
  const squad = list.filter(p => p.status !== 'inactif').map(p => ({
    t7: !!p.t7, s7: s7(p),
    name: `${p.firstName || ''} ${p.lastName || ''}`.trim(), num: p.num ?? null,
    age: ageFrom(p.birthDate),
    pos: ['GK', 'DEF', 'MID', 'FWD'].includes(p.pos) ? p.pos : null,
    nationalities: Array.isArray(p.nationalities) && p.nationalities.length ? p.nationalities : (p.nationality ? [p.nationality] : []),
  })).filter(p => p.name && (p.age != null || p.pos || p.nationalities.length || p.t7));
  return new Response(JSON.stringify({ squad }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' } });
}

async function publicMatches(env){
  if(!env.MEDIA) return json({ matches: [] });
  const evs = await db(env).all('events/');
  const matches = evs.filter(e => e.type === 'match' && e.published).map(e => ({
    id: e.id, team: teamOf(e), date: e.date, opponent: e.opponent, venue: e.venue, comp: e.comp || 'league', round: e.round,
    isHome: e.isHome, result: e.result ? { yul: e.result.yul, opp: e.result.opp } : null,
  })).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return new Response(JSON.stringify({ matches }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' } });
}

/* ---------------- formulaires publics : candidatures joueurs + demandes partenaires ----------------
   Envoyés depuis le site public, stockés dans R2 (db/apps/, db/inquiries/), visibles dans l'Espace staff. */
const shortTxt = (v, n) => str(v, n);
async function rateOk(env, request, kind){
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const hour = new Date().toISOString().slice(0, 13);
  const key = `rate/${kind}/${hour}/${(await sha256(ip)).slice(0, 16)}.json`;
  const D = db(env); const r = (await D.get(key)) || { n: 0 };
  if(r.n >= 8) return false;
  r.n++; await D.put(key, r); return true;
}
async function publicApply(request, env){
  let b = {}; try{ b = JSON.parse((await request.text()).slice(0, 60000)) || {}; }catch(e){ return err('JSON invalide.'); }
  if(b.website) return json({ ok: true }); // pot de miel anti-robots
  if(!await rateOk(env, request, 'apply')) return err('Trop d\'envois. Réessaie plus tard.', 429);
  const first = shortTxt(b.firstName, 60), last = shortTxt(b.lastName, 60), mail = email(b.email);
  if(!first || !mail) return err('Nom et courriel requis.');
  const av = {}; if(b.availability && typeof b.availability === 'object') for(const [d, l] of Object.entries(b.availability)) if(Array.isArray(l)) av[shortTxt(d, 12)] = l.slice(0, 6).map(x => shortTxt(x, 20));
  const a = {
    id: uid(), ref: shortTxt(b.ref, 20), firstName: first, lastName: last, email: mail, phone: shortTxt(b.phone, 30),
    dob: (isoDate(b.dob) || '').slice(0, 10), nationality: shortTxt(b.nationality, 40), city: shortTxt(b.city, 60),
    formats: (Array.isArray(b.formats) ? b.formats : []).filter(f => ['summer', 'winter'].includes(f)),
    pos1: shortTxt(b.pos1, 20), pos2: shortTxt(b.pos2, 20), role7v7: shortTxt(b.role7v7, 30), foot: shortTxt(b.foot, 10), height: shortTxt(b.height, 15),
    currentTeam: shortTxt(b.currentTeam, 80), formerTeam: shortTxt(b.formerTeam, 80), level: shortTxt(b.level, 60), years: shortTxt(b.years, 5), league: shortTxt(b.league, 80),
    desc: text(b.desc, 1500), sunday: shortTxt(b.sunday, 10), availability: av,
    video: shortTxt(b.video, 300), instaFoot: shortTxt(b.instaFoot, 120), tiktok: shortTxt(b.tiktok, 120),
    why: text(b.why, 1500), looking: text(b.looking, 1500),
    status: 'nouveau', notes: '', createdAt: now(),
  };
  await db(env).put('apps/' + a.id + '.json', a);
  return json({ ok: true, id: a.id });
}
async function publicPartner(request, env){
  let b = {}; try{ b = JSON.parse((await request.text()).slice(0, 20000)) || {}; }catch(e){ return err('JSON invalide.'); }
  if(b.website) return json({ ok: true });
  if(!await rateOk(env, request, 'partner')) return err('Trop d\'envois. Réessaie plus tard.', 429);
  const name = shortTxt(b.name, 80), mail = email(b.email);
  if(!name || !mail) return err('Nom et courriel requis.');
  const q = { id: uid(), name, company: shortTxt(b.company, 100), email: mail, phone: shortTxt(b.phone, 30), message: text(b.message, 3000), status: 'nouveau', notes: '', createdAt: now() };
  await db(env).put('inquiries/' + q.id + '.json', q);
  return json({ ok: true });
}

/* ---------------- point d'entrée ---------------- */
function sameOrigin(request){
  const o = request.headers.get('origin');
  if(!o) return true;
  try{ return new URL(o).host === new URL(request.url).host; }catch(e){ return false; }
}

export async function handleClub(request, env){
  const url = new URL(request.url);
  const p = url.pathname;
  if(p === '/api/public/matches' && request.method === 'GET') return publicMatches(env);
  if(p === '/api/public/squad' && request.method === 'GET') return publicSquad(env);
  if(!env.MEDIA) return err('Stockage non configuré (binding R2 « MEDIA » manquant).', 503);
  if((p === '/api/public/apply' || p === '/api/public/partner') && request.method === 'POST'){
    if(!sameOrigin(request)) return err('Origine refusée.', 403);
    return p.endsWith('apply') ? publicApply(request, env) : publicPartner(request, env);
  }

  if(request.method !== 'GET' && !sameOrigin(request)) return err('Origine refusée.', 403);

  if(p === '/api/club/contract-file'){
    const u = await currentUser(request, env);
    if(!u) return err('Connexion requise.', 401);
    return contractFile(request, env, u);
  }

  let body = {};
  if(request.method === 'POST'){
    if(!(request.headers.get('content-type') || '').includes('application/json')) return err('Format JSON attendu.', 415);
    const raw = await request.text();
    if(raw.length > 200000) return err('Requête trop volumineuse.', 413);
    try{ body = raw ? JSON.parse(raw) : {}; }catch(e){ return err('JSON invalide.'); }
    if(!body || typeof body !== 'object') body = {};
  }

  if(p === '/api/auth/me' && request.method === 'GET') return authMe(request, env);
  if(p === '/api/auth/setup' && request.method === 'POST') return authSetup(request, env, body);
  if(p === '/api/auth/login' && request.method === 'POST') return authLogin(request, env, body);
  if(p === '/api/auth/logout' && request.method === 'POST') return authLogout(request, env);

  const u = await currentUser(request, env);
  if(!u) return err('Connexion requise.', 401);
  if(p === '/api/auth/password' && request.method === 'POST') return authPassword(request, env, body, u);
  if(u.mustChange) return err('Change d\'abord ton code temporaire.', 403);

  const m = p.match(/^\/api\/club\/([a-z]+(?:\/[a-z]+)?)$/);
  if(!m) return err('Introuvable.', 404);
  if(m[1] === 'bootstrap' ? request.method !== 'GET' : request.method !== 'POST') return err('Méthode non permise.', 405);
  try{
    return await route(m[1], request, env, body, u);
  }catch(e){
    if(e.status === 403) return err('Accès refusé pour ton rôle.', 403);
    throw e;
  }
}
