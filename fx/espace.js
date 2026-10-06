/* ==========================================================================
   Espace YUL FC · application joueurs + staff
   Données : /api/auth/*, /api/club/* (worker/club.js). Photos : /api/media.
   ========================================================================== */
(() => {
'use strict';

/* ---------------- utilitaires ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TZ = 'America/Toronto';
const D = iso => new Date(iso);
const fmtDay = iso => D(iso).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
const fmtTime = iso => D(iso).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const fmtShort = iso => D(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
const fmtDateOnly = s => s ? D(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }) : '';
const money = n => (Number(n) || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
const toLocalInput = iso => { if(!iso) return ''; const d = D(iso); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
const fromLocalInput = v => v ? new Date(v).toISOString() : '';
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const isPast = e => D(e.date).getTime() < Date.now() - 3 * 3600e3;
const initials = n => String(n || '?').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const pName = p => p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '';
const SITE = location.origin;

const COMP = { league: 'Saison régulière', playoff: 'Séries', cup: 'Coupe', friendly: 'Amical' };
const ROLE = { admin: 'Admin', manager: 'Gérant', coach: 'Coach', player: 'Joueur' };
const POS = { GK: 'Gardien', DEF: 'Défenseur', MID: 'Milieu', FWD: 'Attaquant', '': 'Poste ?' };
const AV = { 'oui': 'Dispo', 'non': 'Pas dispo', 'peut-être': 'Incertain' };
const ATT = ['présent', 'retard', 'absent', 'excusé'];
const ATT_TAG = { 'présent': 'green', 'retard': 'gold', 'absent': 'red', 'excusé': 'blue' };

/* ---------------- API ---------------- */
async function api(path, body, method){
  const opt = { method: method || (body !== undefined ? 'POST' : 'GET'), headers: {}, credentials: 'same-origin' };
  if(body instanceof FormData) opt.body = body;
  else if(body !== undefined){ opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(body); }
  let r;
  try{ r = await fetch(path, opt); }catch(e){ throw new Error('Pas de connexion. Réessaie.'); }
  let data = null;
  try{ data = await r.json(); }catch(e){}
  if(!r.ok){
    if(r.status === 401 && S.user && !path.startsWith('/api/auth/')){ S.user = null; renderLogin(); }
    const e = new Error((data && data.error) || 'Erreur ' + r.status); e.status = r.status; throw e;
  }
  return data;
}

/* ---------------- état ---------------- */
const S = { user: null, d: null, setupNeeded: false, setupReady: false, authMode: 'login', sheet: null };
const staff = () => S.user && ['admin', 'manager', 'coach'].includes(S.user.role);
const finance = () => S.user && ['admin', 'manager'].includes(S.user.role);
const admin = () => S.user && S.user.role === 'admin';

/* ---------------- toast / feuille ---------------- */
let toastT;
function toast(msg, isErr){
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(toastT); toastT = setTimeout(() => t.className = 'toast', isErr ? 4200 : 2400);
}
function openSheet(title, html, after){
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = html;
  $('#sheet').hidden = false;
  document.body.style.overflow = 'hidden';
  if(after) after($('#sheetBody'));
}
function closeSheet(){ $('#sheet').hidden = true; document.body.style.overflow = ''; S.sheet = null; }
document.addEventListener('click', e => { if(e.target.closest('[data-close]')) closeSheet(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

async function busy(btn, fn){
  const b = btn; const old = b && b.innerHTML;
  if(b){ b.disabled = true; b.innerHTML = '…'; }
  try{ return await fn(); }
  catch(e){ toast(e.message, true); }
  finally{ if(b && document.contains(b)){ b.disabled = false; b.innerHTML = old; } }
}
const formData = f => Object.fromEntries(new FormData(f).entries());
async function copy(text){
  try{ await navigator.clipboard.writeText(text); toast('Copié'); }
  catch(e){ const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); toast('Copié'); }
}

/* ==========================================================================
   CONNEXION
   ========================================================================== */
function renderLogin(err){
  const setup = S.setupNeeded && S.authMode === 'setup';
  document.title = 'Connexion · Espace YUL FC';
  $('#app').innerHTML = `
  <div class="auth">
    <div class="auth-card">
      <img class="auth-crest" src="fx/yul-crest.png" alt="YUL FC">
      ${setup ? `
        <h1>Première<br>configuration</h1>
        <p class="sub">Crée le compte administrateur du club. Cette étape n'est possible qu'une seule fois.</p>
        ${S.setupReady ? '' : `<p class="form-err">Le secret STAFF_UPLOAD_KEY n'est pas encore ajouté dans Cloudflare. Ajoute-le, puis recharge cette page.</p>`}
        <form data-form="setup" autocomplete="off">
          <div class="field"><label>Clé de configuration</label><input name="key" type="password" required placeholder="Valeur de STAFF_UPLOAD_KEY"></div>
          <div class="field"><label>Ton nom</label><input name="name" required placeholder="Adel Mihoubi"></div>
          <div class="field"><label>Email</label><input name="email" type="email" required autocomplete="username"></div>
          <div class="field"><label>Mot de passe</label><input name="password" type="password" minlength="8" required autocomplete="new-password"><div class="hint">8 caractères minimum.</div></div>
          <p class="form-err">${esc(err || '')}</p>
          <button class="btn primary block">Créer le compte admin</button>
        </form>
        <div class="auth-switch"><button data-act="auth-mode" data-mode="login">J'ai déjà un compte</button></div>
      ` : `
        <h1>Espace<br>YUL FC</h1>
        <p class="sub">Joueurs et staff. Connecte-toi avec l'email et le code reçus du club.</p>
        <form data-form="login">
          <div class="field"><label>Email</label><input name="email" type="email" required autocomplete="username" inputmode="email"></div>
          <div class="field"><label>Mot de passe ou code temporaire</label><input name="password" type="password" required autocomplete="current-password"></div>
          <p class="form-err">${esc(err || '')}</p>
          <button class="btn primary block">Se connecter</button>
        </form>
        <p class="sub small" style="margin:1rem 0 0;">Mot de passe oublié ? Demande un nouveau code à un membre du staff.</p>
        ${S.setupNeeded ? `<div class="auth-switch"><button data-act="auth-mode" data-mode="setup">Première configuration du club</button></div>` : ''}
      `}
      <a class="back" href="/">← Retour au site</a>
    </div>
  </div>`;
  const first = $('#app input'); if(first && matchMedia('(min-width:760px)').matches) first.focus();
}

function renderMustChange(err){
  document.title = 'Nouveau mot de passe · Espace YUL FC';
  $('#app').innerHTML = `
  <div class="auth">
    <div class="auth-card">
      <img class="auth-crest" src="fx/yul-crest.png" alt="">
      <h1>Bienvenue<br>${esc((S.user.name || '').split(' ')[0])}</h1>
      <p class="sub">Choisis ton mot de passe personnel pour remplacer le code temporaire.</p>
      <form data-form="mustchange">
        <div class="field"><label>Code temporaire</label><input name="current" type="password" required autocomplete="current-password"></div>
        <div class="field"><label>Nouveau mot de passe</label><input name="next" type="password" minlength="8" required autocomplete="new-password"><div class="hint">8 caractères minimum.</div></div>
        <div class="field"><label>Confirme le mot de passe</label><input name="confirm" type="password" minlength="8" required autocomplete="new-password"></div>
        <p class="form-err">${esc(err || '')}</p>
        <button class="btn primary block">Enregistrer et continuer</button>
      </form>
      <div class="auth-switch"><button data-act="logout">Se déconnecter</button></div>
    </div>
  </div>`;
}

/* ==========================================================================
   COQUILLE
   ========================================================================== */
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>',
};

function routes(){
  if(!staff()) return [
    ['accueil', 'Accueil', 'home'], ['calendrier', 'Calendrier', 'cal'], ['annonces', 'Annonces', 'news'],
    ['presences', 'Présences', 'check'], ['contrat', 'Contrat', 'doc'],
  ];
  const r = [['tableau', 'Tableau de bord'], ['effectif', 'Effectif'], ['calendrier', 'Calendrier'], ['annonces', 'Annonces']];
  if(finance()) r.push(['contrats', 'Contrats et paiements']);
  r.push(['photos', 'Photos du site']);
  if(admin()) r.push(['comptes', 'Comptes']);
  return r;
}
function currentRoute(){
  const h = location.hash.replace(/^#\/?/, '').split('/')[0];
  const rs = routes().map(r => r[0]);
  return rs.includes(h) ? h : rs[0];
}
function badges(){
  const b = {};
  if(!staff()){
    const c = S.d.contract;
    if(c && c.status === 'à signer') b.contrat = 1;
    const pending = upcomingFor().filter(e => !myAvail(e.id)).length;
    if(pending) b.calendrier = pending;
  }
  return b;
}
function renderShell(){
  const r = currentRoute();
  const bd = badges();
  const u = S.user;
  $('#app').innerHTML = `
  <div class="shell ${staff() ? 'is-staff' : 'is-player'}">
    <header class="topbar">
      <div class="topbar-in">
        <a class="brand" href="#${routes()[0][0]}"><img src="fx/yul-crest.png" alt=""><div><b>YUL FC</b><small>${staff() ? 'ESPACE STAFF' : 'ESPACE JOUEUR'}</small></div></a>
        <button class="me-btn" data-act="profile" aria-label="Mon compte"><span class="avatar">${esc(initials(u.name))}</span><span>${esc(u.name.split(' ')[0])}</span></button>
      </div>
      <nav class="tabs" aria-label="Sections">
        ${routes().map(([k, l]) => `<a href="#${k}" class="${k === r ? 'on' : ''}">${esc(l)}${bd[k] ? `<span class="dot">${bd[k]}</span>` : ''}</a>`).join('')}
      </nav>
    </header>
    <main id="view"></main>
    ${staff() ? '' : `<nav class="bottom-nav" aria-label="Sections">
      ${routes().map(([k, l, ic]) => `<a href="#${k}" class="${k === r ? 'on' : ''}">${ICON[ic]}<span>${esc(l)}</span>${bd[k] ? '<i class="dot"></i>' : ''}</a>`).join('')}
    </nav>`}
  </div>`;
  renderView();
}
function renderView(){
  const r = currentRoute();
  const v = $('#view'); if(!v) return;
  const fn = (staff() ? STAFF_VIEWS : PLAYER_VIEWS)[r];
  const label = (routes().find(x => x[0] === r) || [])[1] || '';
  document.title = label + ' · Espace YUL FC';
  v.innerHTML = fn();
  const after = (staff() ? STAFF_AFTER : PLAYER_AFTER)[r];
  if(after) after(v);
}
window.addEventListener('hashchange', () => { if(S.d){ renderShell(); window.scrollTo(0, 0); } });
async function refresh(keepSheet){
  S.d = await api('/api/club/bootstrap');
  S.user = S.d.user;
  const y = window.scrollY;
  renderShell();
  window.scrollTo(0, y);
  if(keepSheet && S.sheet) S.sheet();
}

/* ==========================================================================
   VUES JOUEUR
   ========================================================================== */
const myAvail = eid => (S.d.availability || []).find(a => a.eventId === eid);
const upcomingFor = () => (S.d.events || []).filter(e => !isPast(e));
const pastFor = () => (S.d.events || []).filter(e => isPast(e)).reverse();

function evName(e){
  if(e.type === 'match') return e.isHome === false ? `${e.opponent} vs YUL FC` : `YUL FC vs ${e.opponent}`;
  return e.title || (e.type === 'entrainement' ? 'Entraînement' : 'Événement');
}
function evTag(e){
  if(e.type === 'match') return `<span class="tag gold">Match${e.comp ? ' · ' + esc(COMP[e.comp] || '') : ''}</span>`;
  if(e.type === 'entrainement') return '<span class="tag blue">Entraînement</span>';
  return '<span class="tag">Événement</span>';
}
function availPicker(e){
  const a = myAvail(e.id);
  return `<div class="avail-q">Ta disponibilité</div>
    <div class="avail" role="group" aria-label="Ta disponibilité">
      ${['oui', 'peut-être', 'non'].map(s => `<button class="${s}${a && a.status === s ? ' on' : ''}" data-act="avail" data-ev="${e.id}" data-s="${s}" aria-pressed="${a && a.status === s ? 'true' : 'false'}">${s === 'oui' ? 'Présent' : s === 'non' ? 'Absent' : 'Incertain'}</button>`).join('')}
    </div>`;
}
function callupBox(e){
  const me = S.d.player;
  if(!e.callup || !e.callup.published){
    return e.type === 'match' ? '<div class="callup">Convocation pas encore publiée par le staff.</div>' : '';
  }
  const inIt = me && e.callup.playerIds.includes(me.id);
  if(inIt) return `<div class="callup yes"><b>✓ Tu es convoqué.</b>${e.callup.meet ? ` Rendez-vous : <b style="color:var(--ink)">${esc(e.callup.meet)}</b>.` : ''}${e.callup.message ? `<div class="mt small" style="white-space:pre-line">${esc(e.callup.message)}</div>` : ''}</div>`;
  return `<div class="callup no">Tu n'es pas convoqué pour celui-ci.${e.callup.message ? `<div class="mt small" style="white-space:pre-line">${esc(e.callup.message)}</div>` : ''}</div>`;
}
function eventCard(e, hero){
  return `<div class="card ${hero ? 'hl next-hero' : ''}">
    <div class="ev-top">${evTag(e)}${e.round ? `<span class="tag">${esc(e.round)}</span>` : ''}</div>
    <div class="ev-date mt">${esc(fmtDay(e.date))} · ${esc(fmtTime(e.date))}</div>
    <div class="ev-title">${esc(evName(e))}</div>
    <div class="ev-meta">${e.venue ? `📍 <b>${esc(e.venue)}</b>` : 'Lieu à confirmer'}${e.meet ? ` · RDV <b>${esc(e.meet)}</b>` : ''}</div>
    ${e.notes ? `<div class="ev-meta" style="white-space:pre-line">${esc(e.notes)}</div>` : ''}
    ${availPicker(e)}
    ${callupBox(e)}
  </div>`;
}
function myStats(){
  let played = 0, goals = 0, assists = 0, marked = 0, present = 0;
  (S.d.events || []).forEach(e => {
    if(e.myAttendance){ marked++; if(e.myAttendance === 'présent' || e.myAttendance === 'retard'){ present++; if(e.type === 'match') played++; } }
    if(e.myStats){ goals += e.myStats.goals || 0; assists += e.myStats.assists || 0; }
  });
  return { played, goals, assists, rate: marked ? Math.round(present / marked * 100) : null, marked };
}
function balance(contract, payments){
  const paid = (payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const fee = contract ? Number(contract.fee) || 0 : 0;
  return { fee, paid, due: Math.max(0, Math.round((fee - paid) * 100) / 100) };
}
function newsCard(n){
  return `<article class="card news">
    <div class="row">${n.pinned ? '<span class="tag gold">Épinglé</span>' : ''}${staff() ? `<span class="tag">${n.audience === 'staff' ? 'Staff seulement' : n.audience === 'all' ? 'Tout le monde' : 'Joueurs'}</span>` : ''}</div>
    <h3 class="${n.pinned || staff() ? 'mt' : ''}">${esc(n.title)}</h3>
    <div class="meta">${esc(n.author || 'Staff')} · ${esc(fmtShort(n.createdAt))}</div>
    ${n.body ? `<p>${esc(n.body)}</p>` : ''}
    ${staff() ? `<div class="row end mt"><button class="btn sm ghost" data-act="news-edit" data-id="${n.id}">Modifier</button><button class="btn sm danger" data-act="news-del" data-id="${n.id}">Supprimer</button></div>` : ''}
  </article>`;
}
const sortedNews = () => (S.d.news || []).slice().sort((a, b) => (b.pinned - a.pinned) || String(b.createdAt).localeCompare(String(a.createdAt)));

const PLAYER_VIEWS = {
  accueil(){
    const me = S.d.player;
    const first = (S.user.name || '').split(' ')[0];
    if(!me) return `<div class="page-head"><div><h1 class="page-title">Salut ${esc(first)}</h1></div></div>
      <div class="empty"><b>Profil joueur non lié</b>Ton compte n'est relié à aucun joueur de l'effectif. Préviens le staff.</div>`;
    const up = upcomingFor();
    const st = myStats();
    const c = S.d.contract, bal = balance(c, S.d.payments);
    const alerts = [];
    if(c && c.status === 'à signer') alerts.push(`<a class="card hl clickable" href="#contrat" style="display:block;text-decoration:none;color:inherit;"><span class="tag gold">Action requise</span><div class="ev-title">Ton contrat ${esc(c.season || '')} est prêt à signer</div><div class="ev-meta">Lis-le et signe-le en ligne →</div></a>`);
    if(c && bal.due > 0) alerts.push(`<a class="card clickable" href="#contrat" style="display:block;text-decoration:none;color:inherit;"><span class="tag red">Cotisation</span><div class="ev-title">Reste à payer : ${esc(money(bal.due))}</div><div class="ev-meta">${c.dueDate ? 'Échéance : ' + esc(fmtDateOnly(c.dueDate)) : 'Voir le détail de ta cotisation →'}</div></a>`);
    const news = sortedNews().slice(0, 2);
    return `
      <div class="page-head"><div>
        <h1 class="page-title">Salut ${esc(first)}</h1>
        <p class="page-sub">${me.num != null ? '#' + esc(me.num) + ' · ' : ''}${esc(POS[me.pos || ''])}</p>
      </div></div>
      ${alerts.join('')}
      <div class="section-lbl">Prochain rendez-vous</div>
      ${up.length ? eventCard(up[0], true) : '<div class="empty"><b>Rien de prévu</b>Le staff publiera le prochain match ou entraînement ici.</div>'}
      ${up.length > 1 ? `<a class="btn ghost block mt" href="#calendrier">Voir les ${up.length - 1} autre${up.length > 2 ? 's' : ''} rendez-vous</a>` : ''}
      <div class="section-lbl">Ma saison</div>
      <div class="kpis">
        <div class="kpi"><div class="n">${st.played}</div><div class="l">Matchs joués</div></div>
        <div class="kpi"><div class="n gold">${st.goals}</div><div class="l">Buts</div></div>
        <div class="kpi"><div class="n">${st.assists}</div><div class="l">Passes déc.</div></div>
        <div class="kpi"><div class="n">${st.rate == null ? '–' : st.rate + '%'}</div><div class="l">Présence</div></div>
      </div>
      <div class="section-lbl">Dernières annonces</div>
      ${news.length ? news.map(newsCard).join('') + '<a class="btn ghost block mt" href="#annonces">Toutes les annonces</a>' : '<div class="empty">Aucune annonce pour le moment.</div>'}
    `;
  },
  calendrier(){
    const up = upcomingFor(), past = pastFor();
    return `
      <div class="page-head"><div><h1 class="page-title">Calendrier</h1><p class="page-sub">Indique ta dispo pour chaque rendez-vous.</p></div></div>
      <div class="section-lbl">À venir</div>
      ${up.length ? `<div class="cards">${up.map(e => eventCard(e)).join('')}</div>` : '<div class="empty"><b>Rien de prévu</b>Aucun match ni entraînement publié pour l\'instant.</div>'}
      <div class="section-lbl">Passés</div>
      ${past.length ? `<div class="list">${past.map(e => `
        <div class="li">
          <div class="main"><div class="t">${esc(evName(e))}</div><div class="s">${esc(fmtShort(e.date))}${e.myStats && (e.myStats.goals || e.myStats.assists) ? ` · ${e.myStats.goals ? e.myStats.goals + ' but' + (e.myStats.goals > 1 ? 's' : '') : ''}${e.myStats.goals && e.myStats.assists ? ', ' : ''}${e.myStats.assists ? e.myStats.assists + ' passe' + (e.myStats.assists > 1 ? 's' : '') : ''}` : ''}</div></div>
          ${e.result ? `<span class="score ${e.result.yul > e.result.opp ? 'green' : e.result.yul < e.result.opp ? 'red' : 'gold'}">${e.result.yul}-${e.result.opp}</span>` : ''}
          ${e.myAttendance ? `<span class="tag ${ATT_TAG[e.myAttendance]}">${esc(e.myAttendance)}</span>` : ''}
        </div>`).join('')}</div>` : '<div class="empty">Aucun rendez-vous passé.</div>'}
    `;
  },
  annonces(){
    const n = sortedNews();
    return `<div class="page-head"><div><h1 class="page-title">Annonces</h1><p class="page-sub">Les messages du staff.</p></div></div>
      ${n.length ? n.map(newsCard).join('') : '<div class="empty"><b>Aucune annonce</b>Les messages du staff apparaîtront ici.</div>'}`;
  },
  presences(){
    const ev = (S.d.events || []).filter(e => e.myAttendance).reverse();
    const c = { 'présent': 0, 'retard': 0, 'absent': 0, 'excusé': 0 };
    ev.forEach(e => c[e.myAttendance]++);
    const rate = ev.length ? Math.round((c['présent'] + c['retard']) / ev.length * 100) : null;
    return `<div class="page-head"><div><h1 class="page-title">Mes présences</h1><p class="page-sub">Historique noté par le staff, matchs et entraînements.</p></div></div>
      <div class="kpis">
        <div class="kpi"><div class="n gold">${rate == null ? '–' : rate + '%'}</div><div class="l">Taux de présence</div></div>
        <div class="kpi"><div class="n green">${c['présent']}</div><div class="l">Présent</div></div>
        <div class="kpi"><div class="n">${c['retard']}</div><div class="l">Retard</div></div>
        <div class="kpi"><div class="n red">${c['absent']}</div><div class="l">Absent${c['excusé'] ? ` · ${c['excusé']} excusé${c['excusé'] > 1 ? 's' : ''}` : ''}</div></div>
      </div>
      ${ev.length ? `<div class="bar" aria-hidden="true">${ATT.map(k => c[k] ? `<i style="width:${c[k] / ev.length * 100}%;background:var(--${k === 'présent' ? 'win' : k === 'retard' ? 'gold' : k === 'absent' ? 'loss' : 'info'})"></i>` : '').join('')}</div>` : ''}
      <div class="section-lbl">Historique</div>
      ${ev.length ? `<div class="list">${ev.map(e => `<div class="li"><div class="main"><div class="t">${esc(evName(e))}</div><div class="s">${esc(fmtShort(e.date))} · ${e.type === 'match' ? 'Match' : e.type === 'entrainement' ? 'Entraînement' : 'Événement'}</div></div><span class="tag ${ATT_TAG[e.myAttendance]}">${esc(e.myAttendance)}</span></div>`).join('')}</div>`
        : '<div class="empty"><b>Pas encore d\'historique</b>Tes présences apparaîtront ici dès que le staff les aura notées.</div>'}`;
  },
  contrat(){
    const c = S.d.contract;
    if(!c) return `<div class="page-head"><div><h1 class="page-title">Mon contrat</h1></div></div>
      <div class="empty"><b>Aucun contrat pour l'instant</b>Ton contrat apparaîtra ici quand le staff l'aura préparé.</div>`;
    const pays = S.d.payments || [];
    const bal = balance(c, pays);
    return `<div class="page-head"><div><h1 class="page-title">Mon contrat</h1><p class="page-sub">Ce que tu as signé avec le club et le suivi de ta cotisation.</p></div></div>
      ${contractDoc(c, S.d.player)}
      ${c.file ? `<a class="btn block mt" href="/api/club/contract-file" target="_blank" rel="noopener">📄 Ouvrir le contrat (PDF)</a>` : ''}
      ${c.status === 'à signer' ? `
        <div class="card hl mt2">
          <div class="section-lbl" style="margin-top:0">Signature électronique</div>
          <form data-form="sign">
            <label class="check"><input type="checkbox" name="accept" required> J'ai lu ce contrat et j'en accepte toutes les conditions.</label>
            <div class="field"><label>Ton nom complet</label><input name="fullName" required minlength="3" value="${esc(pName(S.d.player))}"></div>
            <button class="btn primary block">Signer le contrat</button>
          </form>
        </div>` : ''}
      <div class="section-lbl">Cotisation</div>
      <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
        <div class="kpi"><div class="n" style="font-size:1.4rem">${esc(money(bal.fee))}</div><div class="l">Total</div></div>
        <div class="kpi"><div class="n green" style="font-size:1.4rem">${esc(money(bal.paid))}</div><div class="l">Payé</div></div>
        <div class="kpi"><div class="n ${bal.due > 0 ? 'red' : 'green'}" style="font-size:1.4rem">${esc(money(bal.due))}</div><div class="l">Reste</div></div>
      </div>
      ${bal.fee ? `<div class="bar"><i style="width:${Math.min(100, bal.paid / bal.fee * 100)}%;background:var(--win)"></i></div>` : ''}
      ${pays.length ? `<div class="list mt">${pays.map(p => `<div class="li"><div class="main"><div class="t">${esc(money(p.amount))}</div><div class="s">${esc(fmtDateOnly(p.date))} · ${esc(p.method)}${p.note ? ' · ' + esc(p.note) : ''}</div></div><span class="tag green">Reçu</span></div>`).join('')}</div>` : '<p class="muted small mt">Aucun paiement enregistré pour l\'instant.</p>'}
    `;
  },
};
function contractDoc(c, p){
  return `<div class="contract-doc">
    <div class="row"><img src="fx/yul-crest.png" alt="" style="width:34px"><div><h3>Contrat joueur</h3><div class="cd-sub">YUL FC · Saison ${esc(c.season || '')}</div></div>
      <span class="spacer"></span><span class="tag ${c.status === 'signé' ? 'green' : c.status === 'à signer' ? 'gold' : ''}" style="${c.status === 'signé' ? '' : 'color:#8A6A14;border-color:#D8C38B'}">${esc(c.status)}</span></div>
    <dl>
      <div><dt>Joueur</dt><dd>${esc(pName(p) || '–')}</dd></div>
      <div><dt>Cotisation</dt><dd>${esc(money(c.fee))}</dd></div>
      <div><dt>Début</dt><dd>${esc(fmtDateOnly(c.startDate) || '–')}</dd></div>
      <div><dt>Fin</dt><dd>${esc(fmtDateOnly(c.endDate) || '–')}</dd></div>
      ${c.dueDate ? `<div><dt>Échéance de paiement</dt><dd>${esc(fmtDateOnly(c.dueDate))}</dd></div>` : ''}
    </dl>
    ${c.includes ? `<h4>Inclus</h4><p>${esc(c.includes)}</p>` : ''}
    ${c.clauses ? `<h4>Conditions</h4><p>${esc(c.clauses)}</p>` : ''}
    ${c.signedAt ? `<div class="sig">Signé électroniquement par <b>${esc(c.signedName)}</b><br><span style="color:#6B7280">le ${esc(fmtShort(c.signedAt))} à ${esc(fmtTime(c.signedAt))}</span></div>` : ''}
  </div>`;
}
const PLAYER_AFTER = {};

/* ==========================================================================
   VUES STAFF
   ========================================================================== */
const players = () => S.d.players || [];
const activePlayers = () => players().filter(p => p.status !== 'inactif');
const playerById = id => players().find(p => p.id === id);
const accountFor = pid => (S.d.accounts || []).find(a => a.playerId === pid);
const availFor = (eid, pid) => (S.d.availability || []).find(a => a.eventId === eid && a.playerId === pid);
const eventById = id => (S.d.events || []).find(e => e.id === id);
const contractFor = pid => (S.d.contracts || []).find(c => c.playerId === pid);
const paymentsFor = pid => (S.d.payments || []).filter(p => p.playerId === pid).sort((a, b) => String(a.date).localeCompare(String(b.date)));
function availSummary(e){
  const c = { oui: 0, 'peut-être': 0, non: 0, none: 0 };
  activePlayers().forEach(p => { const a = availFor(e.id, p.id); c[a ? a.status : 'none']++; });
  return c;
}
function availBar(c){
  const t = c.oui + c['peut-être'] + c.non + c.none || 1;
  return `<div class="bar">${c.oui ? `<i style="width:${c.oui / t * 100}%;background:var(--win)"></i>` : ''}${c['peut-être'] ? `<i style="width:${c['peut-être'] / t * 100}%;background:var(--gold)"></i>` : ''}${c.non ? `<i style="width:${c.non / t * 100}%;background:var(--loss)"></i>` : ''}</div>
    <div class="row small mt" style="gap:14px"><span class="green">● ${c.oui} dispo</span><span class="gold">● ${c['peut-être']} incertain</span><span class="red">● ${c.non} absent</span><span class="muted">○ ${c.none} sans réponse</span></div>`;
}
function staffEventRow(e){
  const c = availSummary(e);
  return `<div class="li clickable" data-act="event-open" data-id="${e.id}">
    <div class="main">
      <div class="t">${esc(evName(e))}</div>
      <div class="s">${esc(fmtShort(e.date))} · ${esc(fmtTime(e.date))}${e.venue ? ' · ' + esc(e.venue) : ''}</div>
    </div>
    ${e.result ? `<span class="score">${e.result.yul}-${e.result.opp}</span>` : ''}
    ${!isPast(e) ? `<span class="tag green" title="Disponibles">${c.oui} ✓</span>` : ''}
    ${e.published ? (e.callup && e.callup.published ? '<span class="tag gold">Convoqués</span>' : '') : '<span class="tag">Brouillon</span>'}
  </div>`;
}

const STAFF_VIEWS = {
  tableau(){
    const evs = S.d.events || [];
    const up = evs.filter(e => !isPast(e));
    const next = up[0];
    const ap = activePlayers();
    const noAccess = ap.filter(p => !accountFor(p.id)).length;
    const waiting = (S.d.accounts || []).filter(a => a.active && a.mustChange).length;
    let fin = '';
    if(finance()){
      let due = 0, toSign = 0;
      ap.forEach(p => { const c = contractFor(p.id); if(c && c.status !== 'brouillon'){ due += balance(c, paymentsFor(p.id)).due; } if(c && c.status === 'à signer') toSign++; });
      fin = `<div class="kpi"><div class="n ${due > 0 ? 'red' : ''}" style="font-size:1.5rem">${esc(money(due))}</div><div class="l">Cotisations dues</div></div>
             <div class="kpi"><div class="n">${toSign}</div><div class="l">Contrats à signer</div></div>`;
    }
    const first = (S.user.name || '').split(' ')[0];
    return `
      <div class="page-head"><div><h1 class="page-title">Salut ${esc(first)}</h1><p class="page-sub">${esc(ROLE[S.user.role])} · vue d'ensemble du club</p></div>
        <div class="row"><button class="btn sm" data-act="event-new">+ Événement</button><button class="btn sm" data-act="news-new">+ Annonce</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="n gold">${ap.length}</div><div class="l">Joueurs actifs</div></div>
        <div class="kpi"><div class="n">${noAccess}</div><div class="l">Sans accès${waiting ? ` · ${waiting} en attente` : ''}</div></div>
        ${fin || `<div class="kpi"><div class="n">${up.length}</div><div class="l">Rendez-vous à venir</div></div><div class="kpi"><div class="n">${(S.d.news || []).length}</div><div class="l">Annonces</div></div>`}
      </div>
      <div class="section-lbl">Prochain rendez-vous</div>
      ${next ? `<div class="card hl clickable" data-act="event-open" data-id="${next.id}">
          <div class="ev-top">${evTag(next)}${next.published ? '' : '<span class="tag">Brouillon, invisible des joueurs</span>'}</div>
          <div class="ev-date mt">${esc(fmtDay(next.date))} · ${esc(fmtTime(next.date))}</div>
          <div class="ev-title">${esc(evName(next))}</div>
          <div class="ev-meta">${next.venue ? esc(next.venue) : 'Lieu à confirmer'}</div>
          ${availBar(availSummary(next))}
          <div class="callup ${next.callup && next.callup.published ? 'yes' : ''}">${next.callup && next.callup.published ? `<b>Convocation publiée</b> · ${next.callup.playerIds.length} joueurs` : 'Convocation pas encore publiée'}</div>
          <div class="row end mt"><span class="btn sm primary">Gérer →</span></div>
        </div>` : `<div class="empty"><b>Rien de prévu</b>Crée le prochain match ou entraînement.<div class="mt"><button class="btn primary" data-act="event-new">+ Nouvel événement</button></div></div>`}
      ${!ap.length ? `<div class="section-lbl">Pour commencer</div>
        <div class="card"><ol style="padding-left:1.2rem;line-height:2">
          <li>Ajoute les joueurs dans <a href="#effectif">Effectif</a>.</li>
          <li>Crée l'accès de chaque joueur : tu reçois un code temporaire à lui envoyer.</li>
          <li>Publie le prochain match dans <a href="#calendrier">Calendrier</a> : les joueurs indiquent leur dispo.</li>
          <li>Publie la convocation, puis note les présences et le résultat après le match.</li>
        </ol></div>` : ''}
      <div class="section-lbl">Annonces récentes</div>
      ${sortedNews().slice(0, 2).map(newsCard).join('') || '<div class="empty">Aucune annonce.</div>'}
    `;
  },

  effectif(){
    const ps = players();
    return `
      <div class="page-head"><div><h1 class="page-title">Effectif</h1><p class="page-sub">${ps.length} joueur${ps.length > 1 ? 's' : ''} · les accès joueurs se créent depuis chaque fiche.</p></div>
        <div class="row"><button class="btn ghost" data-act="squad-import">Importer l'effectif du site</button><button class="btn primary" data-act="player-new">+ Joueur</button></div></div>
      ${ps.length > 6 ? `<div class="field"><input id="squadSearch" type="search" placeholder="Rechercher un joueur…" aria-label="Rechercher"></div>` : ''}
      ${ps.length ? `<div class="list" id="squadList">${ps.map(p => {
        const acc = accountFor(p.id);
        const accTag = !acc ? '<span class="tag">Pas d\'accès</span>' : !acc.active ? '<span class="tag red">Désactivé</span>' : acc.mustChange ? '<span class="tag gold">En attente</span>' : '<span class="tag green">Accès actif</span>';
        return `<div class="li clickable" data-act="player-open" data-id="${p.id}" data-search="${esc((pName(p) + ' ' + (p.num ?? '')).toLowerCase())}">
          <div class="num">${p.num ?? '–'}</div>
          <div class="main"><div class="t">${esc(pName(p))}</div><div class="s">${esc(playerMeta(p))}${p.status !== 'actif' ? ' · ' + esc(p.status) : ''}</div></div>
          ${accTag}
        </div>`;
      }).join('')}</div>` : '<div class="empty"><b>Aucun joueur</b>Récupère d\'un coup les joueurs affichés sur yulfc.com, ou ajoute-les un par un.<div class="row mt" style="justify-content:center"><button class="btn primary" data-act="squad-import">Importer l\'effectif du site</button><button class="btn" data-act="player-new">+ Ajouter un joueur</button></div></div>'}
    `;
  },

  calendrier(){
    const evs = S.d.events || [];
    const up = evs.filter(e => !isPast(e)), past = evs.filter(isPast).reverse();
    return `
      <div class="page-head"><div><h1 class="page-title">Calendrier</h1><p class="page-sub">Matchs, entraînements, dispos, convocations, présences et résultats.</p></div>
        <div class="row"><button class="btn primary" data-act="event-new">+ Événement</button></div></div>
      <div class="section-lbl">À venir</div>
      ${up.length ? `<div class="list">${up.map(staffEventRow).join('')}</div>` : '<div class="empty">Aucun événement à venir.</div>'}
      <div class="section-lbl">Passés</div>
      ${past.length ? `<div class="list">${past.map(staffEventRow).join('')}</div>` : '<div class="empty">Aucun événement passé.</div>'}
      <p class="muted small mt2">Les matchs publiés apparaissent aussi sur le site public (prochain match et résultats).</p>
    `;
  },

  annonces(){
    return `
      <div class="page-head"><div><h1 class="page-title">Annonces</h1><p class="page-sub">Messages visibles dans l'espace des joueurs.</p></div>
        <div class="row"><button class="btn primary" data-act="news-new">+ Annonce</button></div></div>
      ${sortedNews().map(newsCard).join('') || '<div class="empty"><b>Aucune annonce</b>Publie le premier message pour l\'équipe.</div>'}
    `;
  },

  contrats(){
    const ps = players();
    let tFee = 0, tPaid = 0;
    const rows = ps.map(p => {
      const c = contractFor(p.id), pays = paymentsFor(p.id), b = balance(c, pays);
      if(c && c.status !== 'brouillon'){ tFee += b.fee; tPaid += b.paid; }
      const st = !c ? '<span class="tag">Aucun</span>' : `<span class="tag ${c.status === 'signé' ? 'green' : c.status === 'à signer' ? 'gold' : ''}">${esc(c.status)}</span>`;
      return `<tr class="clickable" data-act="contract-open" data-id="${p.id}">
        <td><b>${esc(pName(p))}</b>${p.num != null ? ` <span class="muted">#${p.num}</span>` : ''}</td>
        <td>${st}</td><td class="r">${c ? esc(money(b.fee)) : '–'}</td><td class="r">${c ? esc(money(b.paid)) : '–'}</td>
        <td class="r ${b.due > 0 ? 'red' : ''}">${c ? esc(money(b.due)) : '–'}</td></tr>`;
    }).join('');
    return `
      <div class="page-head"><div><h1 class="page-title">Contrats</h1><p class="page-sub">Contrat de chaque joueur, signature en ligne et suivi des paiements.</p></div></div>
      <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
        <div class="kpi"><div class="n" style="font-size:1.4rem">${esc(money(tFee))}</div><div class="l">Cotisations</div></div>
        <div class="kpi"><div class="n green" style="font-size:1.4rem">${esc(money(tPaid))}</div><div class="l">Encaissé</div></div>
        <div class="kpi"><div class="n ${tFee - tPaid > 0 ? 'red' : ''}" style="font-size:1.4rem">${esc(money(Math.max(0, tFee - tPaid)))}</div><div class="l">Reste dû</div></div>
      </div>
      <div class="section-lbl">Par joueur</div>
      ${ps.length ? `<div class="table-wrap"><table><thead><tr><th>Joueur</th><th>Contrat</th><th class="r">Cotisation</th><th class="r">Payé</th><th class="r">Reste</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : '<div class="empty">Ajoute d\'abord des joueurs dans l\'Effectif.</div>'}
      <p class="muted small mt">Les contrats en brouillon ne sont pas visibles par les joueurs et ne comptent pas dans les totaux.</p>
    `;
  },

  photos(){
    return `
      <div class="page-head"><div><h1 class="page-title">Photos du site</h1><p class="page-sub">Les photos ajoutées ici s'affichent directement sur yulfc.com.</p></div></div>
      <div class="card">
        <form data-form="photo">
          <div class="grid2">
            <div class="field"><label>Emplacement</label>
              <select name="slot" id="photoSlot">
                <option value="gallery">Galerie (plusieurs photos)</option>
                <option value="hero">Grande photo de l'accueil</option>
                <option value="histoire">Photo « Notre histoire »</option>
                <option value="player">Carte d'un joueur</option>
              </select></div>
            <div class="field" id="photoNumField" hidden><label>Numéro de maillot</label><input name="num" type="number" min="0" max="999" inputmode="numeric"></div>
          </div>
          <div class="field"><label>Image(s)</label><input name="file" type="file" accept="image/jpeg,image/png,image/webp" multiple required></div>
          <div class="field"><label>Légende (optionnel)</label><input name="caption" maxlength="140"></div>
          <button class="btn primary">Mettre en ligne</button>
        </form>
      </div>
      <div class="section-lbl">En ligne</div>
      <div id="photoList" class="photo-grid"><p class="muted small">Chargement…</p></div>
    `;
  },

  comptes(){
    const accs = (S.d.accounts || []).slice().sort((a, b) => (a.role === 'player') - (b.role === 'player') || a.name.localeCompare(b.name));
    return `
      <div class="page-head"><div><h1 class="page-title">Comptes</h1><p class="page-sub">Qui a accès à l'espace, et avec quel rôle.</p></div>
        <div class="row"><button class="btn primary" data-act="staff-new">+ Compte staff</button></div></div>
      <div class="card flat small" style="line-height:1.7">
        <b>Admin</b> : tout, y compris les comptes staff. · <b>Gérant</b> : tout sauf les comptes staff, avec contrats et paiements.
        · <b>Coach</b> : effectif, calendrier, convocations, présences, annonces et photos (pas l'argent). · <b>Joueur</b> : son espace personnel.
      </div>
      <div class="table-wrap mt"><table><thead><tr><th>Nom</th><th>Rôle</th><th>État</th><th>Dernière connexion</th><th></th></tr></thead><tbody>
      ${accs.map(a => `<tr>
        <td><b>${esc(a.name)}</b><div class="muted small">${esc(a.email)}</div></td>
        <td>${a.id === S.user.id ? esc(ROLE[a.role]) : `<select class="role-sel" data-id="${a.id}" aria-label="Rôle" style="background:var(--void);border:1px solid var(--line);border-radius:8px;padding:6px">
          ${Object.entries(ROLE).map(([k, l]) => `<option value="${k}" ${a.role === k ? 'selected' : ''} ${k === 'player' && !a.playerId ? 'disabled' : ''}>${l}</option>`).join('')}</select>`}</td>
        <td>${!a.active ? '<span class="tag red">Désactivé</span>' : a.mustChange ? '<span class="tag gold">En attente</span>' : '<span class="tag green">Actif</span>'}</td>
        <td class="small muted">${a.lastLogin ? esc(fmtShort(a.lastLogin)) : 'Jamais'}</td>
        <td class="r" style="white-space:nowrap">${a.id === S.user.id ? '<span class="muted small">Toi</span>' : `
          <button class="btn sm" data-act="acc-reset" data-id="${a.id}">Nouveau code</button>
          <button class="btn sm ghost" data-act="acc-toggle" data-id="${a.id}">${a.active ? 'Désactiver' : 'Réactiver'}</button>
          <button class="btn sm danger" data-act="acc-del" data-id="${a.id}" aria-label="Supprimer">✕</button>`}</td>
      </tr>`).join('')}
      </tbody></table></div>
    `;
  },
};

const STAFF_AFTER = {
  effectif(v){
    const s = $('#squadSearch', v);
    if(s) s.addEventListener('input', () => {
      const q = s.value.trim().toLowerCase();
      $$('#squadList .li', v).forEach(li => { li.hidden = q && !li.dataset.search.includes(q); });
    });
  },
  photos(v){
    const sel = $('#photoSlot', v), nf = $('#photoNumField', v);
    sel.addEventListener('change', () => { nf.hidden = sel.value !== 'player'; $('input', nf).required = sel.value === 'player'; });
    loadPhotos();
  },
  comptes(v){
    $$('.role-sel', v).forEach(s => s.addEventListener('change', () => busy(null, async () => {
      await api('/api/club/accounts/update', { id: s.dataset.id, role: s.value });
      toast('Rôle mis à jour'); await refresh();
    })));
  },
};

/* ---------------- fiche joueur ---------------- */
const NATIONS = ['Canada', 'Algérie', 'Maroc', 'Tunisie', 'France', 'Haïti', 'Madagascar', 'Sénégal', 'Côte d\'Ivoire', 'Cameroun',
  'RD Congo', 'Guinée', 'Mali', 'Liban', 'Syrie', 'Irak', 'Égypte', 'Belgique', 'Portugal', 'Espagne', 'Italie', 'Brésil',
  'Colombie', 'Mexique', 'Venezuela', 'Pérou', 'Chili', 'Argentine', 'Salvador', 'Honduras', 'États-Unis', 'Royaume-Uni'];
function ageOf(d){
  if(!d) return null;
  const b = new Date(d + 'T12:00:00'), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if(n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a >= 0 && a < 120 ? a : null;
}
const playerMeta = p => [POS[p.pos || ''], ageOf(p.birthDate) != null ? ageOf(p.birthDate) + ' ans' : '', p.nationality || ''].filter(Boolean).join(' · ');
function playerForm(p = {}){
  return `<form data-form="player">
    <input type="hidden" name="id" value="${esc(p.id || '')}">
    <div class="grid2">
      <div class="field"><label>Prénom</label><input name="firstName" required value="${esc(p.firstName || '')}"></div>
      <div class="field"><label>Nom</label><input name="lastName" value="${esc(p.lastName || '')}"></div>
    </div>
    <div class="grid3">
      <div class="field"><label>Numéro</label><input name="num" type="number" min="0" max="99" inputmode="numeric" value="${p.num ?? ''}"></div>
      <div class="field"><label>Poste</label><select name="pos">${Object.entries(POS).map(([k, l]) => `<option value="${k}" ${p.pos === k || (!p.pos && k === '') ? 'selected' : ''}>${k ? l : '–'}</option>`).join('')}</select></div>
      <div class="field"><label>Statut</label><select name="status">${['actif', 'blessé', 'suspendu', 'inactif'].map(s => `<option ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class="grid2">
      <div class="field"><label>Date de naissance</label><input name="birthDate" type="date" max="${today()}" value="${esc(p.birthDate || '')}"><div class="hint" id="ageHint">${p.birthDate ? esc(ageOf(p.birthDate) + ' ans') : ''}</div></div>
      <div class="field"><label>Nationalité</label><input name="nationality" list="natList" autocomplete="off" placeholder="ex. Canada" value="${esc(p.nationality || '')}">
        <datalist id="natList">${NATIONS.map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
    </div>
    <div class="grid2">
      <div class="field"><label>Téléphone</label><input name="phone" type="tel" value="${esc(p.phone || '')}"></div>
      <div class="field"><label>Email</label><input name="email" type="email" value="${esc(p.email || '')}"></div>
    </div>
    <div class="field"><label>Notes internes (staff)</label><textarea name="notes" placeholder="Visible uniquement par le staff">${esc(p.notes || '')}</textarea></div>
    <button class="btn primary block">${p.id ? 'Enregistrer' : 'Ajouter le joueur'}</button>
  </form>`;
}
function openPlayer(id){
  const p = playerById(id);
  if(!p) return closeSheet();
  S.sheet = () => openPlayer(id);
  const acc = accountFor(p.id);
  // stats issues du calendrier
  let present = 0, marked = 0, goals = 0, assists = 0;
  (S.d.events || []).forEach(e => {
    const m = (e.attendance || {})[p.id]; if(m){ marked++; if(m === 'présent' || m === 'retard') present++; }
    const sc = e.result && (e.result.scorers || []).find(s => s.playerId === p.id); if(sc){ goals += sc.goals; assists += sc.assists; }
  });
  openSheet(pName(p) || 'Joueur', `
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi"><div class="n">${marked ? Math.round(present / marked * 100) + '%' : '–'}</div><div class="l">Présence</div></div>
      <div class="kpi"><div class="n gold">${goals}</div><div class="l">Buts</div></div>
      <div class="kpi"><div class="n">${assists}</div><div class="l">Passes</div></div>
    </div>
    <div class="section-lbl">Accès à l'espace joueur</div>
    <div class="card flat">${!acc ? `
        <p class="small muted">${esc(p.firstName)} n'a pas encore d'accès. Tu vas obtenir un code temporaire à lui envoyer.</p>
        <form data-form="access" class="mt"><input type="hidden" name="playerId" value="${p.id}">
          <div class="field"><label>Email du joueur</label><input name="email" type="email" required value="${esc(p.email || '')}"></div>
          <button class="btn primary block">Créer son accès</button></form>`
      : `<div class="row"><div class="main"><b>${esc(acc.email)}</b><div class="small muted">${!acc.active ? 'Désactivé' : acc.mustChange ? 'Code envoyé, première connexion pas encore faite' : 'Connecté' + (acc.lastLogin ? ' · dernière fois le ' + esc(fmtShort(acc.lastLogin)) : '')}</div></div>
          <span class="spacer"></span><button class="btn sm" data-act="acc-reset" data-id="${acc.id}">Nouveau code</button></div>`}
    </div>
    <div class="section-lbl">Fiche</div>
    ${playerForm(p)}
    <div class="row end mt2"><button class="btn sm danger" data-act="player-del" data-id="${p.id}">Retirer de l'effectif</button></div>
  `);
}
function showCode(acc, code){
  const first = (acc.name || '').split(' ')[0];
  const msg = `Salut ${first} ! Voici ton accès à l'Espace YUL FC :\n${SITE}/espace.html\n\nEmail : ${acc.email}\nCode temporaire : ${code}\n\nTu choisiras ton mot de passe à la première connexion.`;
  openSheet('Code d\'accès', `
    <p>Accès prêt pour <b>${esc(acc.name)}</b>. Envoie-lui ce message : le code n'est affiché qu'une seule fois.</p>
    <div class="code-box"><div class="code">${esc(code)}</div><div class="s">${esc(acc.email)}</div></div>
    <div class="msg-box">${esc(msg)}</div>
    <div class="row mt">
      <button class="btn primary" data-act="copy" data-text="${esc(msg)}">Copier le message</button>
      <a class="btn" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="btn" href="sms:?&body=${encodeURIComponent(msg)}">SMS</a>
    </div>
    <button class="btn ghost block mt2" data-close>Terminé</button>
  `);
}

/* ---------------- fiche événement ---------------- */
let evTab = 'infos';
function eventForm(e = {}){
  const type = e.type || 'match';
  return `<form data-form="event">
    <input type="hidden" name="id" value="${esc(e.id || '')}">
    <div class="field"><label>Type</label>
      <div class="seg" id="evTypeSeg" role="group">${[['match', 'Match'], ['entrainement', 'Entraînement'], ['autre', 'Autre']].map(([k, l]) => `<button type="button" data-type="${k}" class="${type === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <input type="hidden" name="type" value="${type}"></div>
    <div class="field ev-match"><label>Adversaire</label><input name="opponent" value="${esc(e.opponent || '')}" placeholder="ex. Legends FC"></div>
    <div class="field ev-other"><label>Titre</label><input name="title" value="${esc(e.title || '')}" placeholder="ex. Entraînement physique"></div>
    <div class="grid2">
      <div class="field"><label>Date et heure</label><input name="date" type="datetime-local" required value="${esc(toLocalInput(e.date))}"></div>
      <div class="field"><label>Rendez-vous</label><input name="meet" value="${esc(e.meet || '')}" placeholder="ex. 9h15 au vestiaire"></div>
    </div>
    <div class="field"><label>Lieu</label><input name="venue" value="${esc(e.venue || '')}" placeholder="ex. Collège Letendre"></div>
    <div class="grid3 ev-match">
      <div class="field"><label>Compétition</label><select name="comp">${[['league', 'Saison régulière'], ['playoff', 'Séries'], ['cup', 'Coupe'], ['friendly', 'Amical']].map(([k, l]) => `<option value="${k}" ${(e.comp || 'league') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>Terrain</label><select name="isHome"><option value="true" ${e.isHome !== false ? 'selected' : ''}>Domicile</option><option value="false" ${e.isHome === false ? 'selected' : ''}>Extérieur</option></select></div>
      <div class="field"><label>Tour (séries)</label><input name="round" value="${esc(e.round || '')}" placeholder="ex. Demi-finale"></div>
    </div>
    <div class="field"><label>Infos pour les joueurs</label><textarea name="notes" placeholder="Tenue, covoiturage, consignes…">${esc(e.notes || '')}</textarea></div>
    <label class="check"><input type="checkbox" name="published" ${e.published || !e.id ? 'checked' : ''}> Publier (visible des joueurs${type === 'match' ? ' et sur le site' : ''})</label>
    <button class="btn primary block">${e.id ? 'Enregistrer' : 'Créer l\'événement'}</button>
  </form>`;
}
function bindEventForm(root){
  const seg = $('#evTypeSeg', root); if(!seg) return;
  const apply = t => {
    $('input[name=type]', root).value = t;
    $$('button', seg).forEach(b => b.classList.toggle('on', b.dataset.type === t));
    $$('.ev-match', root).forEach(x => x.hidden = t !== 'match');
    $$('.ev-other', root).forEach(x => x.hidden = t === 'match');
  };
  seg.addEventListener('click', e => { const b = e.target.closest('button'); if(b) apply(b.dataset.type); });
  apply($('input[name=type]', root).value);
}
function openEvent(id, tab){
  const e = eventById(id); if(!e) return closeSheet();
  if(tab) evTab = tab;
  S.sheet = () => openEvent(id);
  const isMatch = e.type === 'match';
  const tabs = [['infos', 'Infos'], ['dispos', 'Dispos'], ['convocation', 'Convocation'], ['presences', 'Présences']];
  if(isMatch) tabs.push(['resultat', 'Résultat']);
  if(!tabs.some(t => t[0] === evTab)) evTab = 'infos';
  const ap = activePlayers();
  let body = '';

  if(evTab === 'infos'){
    body = eventForm(e) + `<div class="row end mt2"><button class="btn sm danger" data-act="event-del" data-id="${e.id}">Supprimer l'événement</button></div>`;
  }
  else if(evTab === 'dispos'){
    body = availBar(availSummary(e)) + (ap.length ? `<div class="list mt">${ap.map(p => {
      const a = availFor(e.id, p.id);
      return `<div class="li"><div class="num">${p.num ?? '–'}</div><div class="main"><div class="t">${esc(pName(p))}</div><div class="s">${a ? esc(AV[a.status]) + (a.note ? ' · ' + esc(a.note) : '') : 'Pas de réponse'}</div></div>
        <div class="seg" role="group" aria-label="Dispo de ${esc(pName(p))}">
          ${[['oui', '✓', 'g'], ['peut-être', '?', ''], ['non', '✕', 'r']].map(([s, l, cl]) => `<button class="${a && a.status === s ? 'on ' + cl : ''}" data-act="avail-staff" data-ev="${e.id}" data-p="${p.id}" data-s="${s}" title="${AV[s]}">${l}</button>`).join('')}
        </div></div>`;
    }).join('')}</div>` : '<div class="empty mt">Aucun joueur dans l\'effectif.</div>') + '<p class="muted small mt">Les joueurs répondent eux-mêmes depuis leur espace. Tu peux corriger une réponse ici.</p>';
  }
  else if(evTab === 'convocation'){
    const c = e.callup || { playerIds: [] };
    const pre = c.playerIds && c.playerIds.length ? c.playerIds : ap.filter(p => (availFor(e.id, p.id) || {}).status === 'oui').map(p => p.id);
    const order = { 'oui': 0, 'peut-être': 1, undefined: 2, 'non': 3 };
    const sorted = ap.slice().sort((a, b) => order[(availFor(e.id, a.id) || {}).status] - order[(availFor(e.id, b.id) || {}).status] || (a.num ?? 999) - (b.num ?? 999));
    body = `${c.published ? '<div class="callup yes" style="margin-top:0"><b>Convocation publiée</b>, visible des joueurs.</div>' : '<div class="callup" style="margin-top:0">Pas encore publiée. Les joueurs ne la voient pas.</div>'}
      <form data-form="callup" class="mt">
        <input type="hidden" name="id" value="${e.id}">
        <div class="row" style="margin-bottom:8px"><span class="lbl" style="margin:0">Joueurs convoqués · <span id="cuCount">${pre.length}</span></span><span class="spacer"></span>
          <button type="button" class="btn sm ghost" data-act="cu-all">Tous les dispos</button><button type="button" class="btn sm ghost" data-act="cu-none">Aucun</button></div>
        <div class="list">${sorted.map(p => { const a = availFor(e.id, p.id); return `<label class="li" style="cursor:pointer"><input type="checkbox" name="p" value="${p.id}" ${pre.includes(p.id) ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--gold)" data-avail="${a ? a.status : ''}">
          <div class="num">${p.num ?? '–'}</div><div class="main"><div class="t">${esc(pName(p))}</div><div class="s">${esc(POS[p.pos || ''])}</div></div>
          ${a ? `<span class="tag ${a.status === 'oui' ? 'green' : a.status === 'non' ? 'red' : 'gold'}">${esc(AV[a.status])}</span>` : '<span class="tag">?</span>'}</label>`; }).join('')}</div>
        <div class="field mt"><label>Rendez-vous</label><input name="meet" value="${esc(c.meet || e.meet || '')}" placeholder="ex. 9h15 au vestiaire"></div>
        <div class="field"><label>Message aux joueurs</label><textarea name="message" placeholder="Tenue, consignes…">${esc(c.message || '')}</textarea></div>
        <div class="row">
          <button class="btn primary" name="publish" value="1">${c.published ? 'Mettre à jour (publiée)' : 'Publier la convocation'}</button>
          <button class="btn" name="publish" value="0">${c.published ? 'Retirer la publication' : 'Enregistrer en brouillon'}</button>
          <button type="button" class="btn ghost" data-act="cu-share" data-id="${e.id}">Copier pour WhatsApp</button>
        </div>
      </form>`;
  }
  else if(evTab === 'presences'){
    const att = e.attendance || {};
    const base = e.callup && e.callup.playerIds && e.callup.playerIds.length ? ap.filter(p => e.callup.playerIds.includes(p.id) || att[p.id]) : ap;
    const others = ap.filter(p => !base.includes(p));
    const row = p => `<div class="li"><div class="num">${p.num ?? '–'}</div><div class="main"><div class="t">${esc(pName(p))}</div></div>
      <div class="seg att" data-p="${p.id}" role="group" aria-label="Présence de ${esc(pName(p))}">${ATT.map(k => `<button type="button" data-v="${k}" class="${att[p.id] === k ? 'on ' + (k === 'présent' ? 'g' : k === 'absent' ? 'r' : k === 'excusé' ? 'b' : '') : ''}">${k === 'présent' ? 'Présent' : k === 'retard' ? 'Retard' : k === 'absent' ? 'Absent' : 'Excusé'}</button>`).join('')}</div></div>`;
    body = `<p class="muted small">${isPast(e) ? '' : 'Événement pas encore passé : tu peux quand même noter les présences. '}Touche un statut pour chaque joueur, puis enregistre.</p>
      <div class="row mt"><button class="btn sm" data-act="att-all">Tout le monde présent</button></div>
      <div class="list mt" id="attList">${base.map(row).join('')}</div>
      ${others.length ? `<details class="mt"><summary class="muted small" style="cursor:pointer">Autres joueurs (${others.length})</summary><div class="list mt">${others.map(row).join('')}</div></details>` : ''}
      <button class="btn primary block mt2" data-act="att-save" data-id="${e.id}">Enregistrer les présences</button>`;
  }
  else if(evTab === 'resultat'){
    const r = e.result || { yul: '', opp: '', scorers: [] };
    const pool = ap.filter(p => (e.callup && e.callup.playerIds || []).includes(p.id) || ['présent', 'retard'].includes((e.attendance || {})[p.id]) || (r.scorers || []).some(s => s.playerId === p.id));
    const list = pool.length ? pool : ap;
    body = `<form data-form="result">
      <input type="hidden" name="id" value="${e.id}">
      <div class="row" style="justify-content:center;gap:18px">
        <div style="text-align:center"><div class="lbl">YUL FC</div><input name="yul" type="number" min="0" max="99" inputmode="numeric" value="${r.yul}" required style="width:84px;text-align:center;font-family:var(--ff-display);font-size:2rem;background:var(--void);border:1px solid var(--line);border-radius:10px;padding:8px"></div>
        <div class="score muted">–</div>
        <div style="text-align:center"><div class="lbl">${esc(e.opponent)}</div><input name="opp" type="number" min="0" max="99" inputmode="numeric" value="${r.opp}" required style="width:84px;text-align:center;font-family:var(--ff-display);font-size:2rem;background:var(--void);border:1px solid var(--line);border-radius:10px;padding:8px"></div>
      </div>
      <div class="section-lbl">Buteurs et passeurs</div>
      <div class="table-wrap"><table><thead><tr><th>Joueur</th><th class="r">Buts</th><th class="r">Passes</th></tr></thead><tbody>
        ${list.map(p => { const s = (r.scorers || []).find(x => x.playerId === p.id) || {}; return `<tr><td>${p.num != null ? `<span class="muted">#${p.num}</span> ` : ''}${esc(pName(p))}</td>
          <td class="r"><input type="number" min="0" max="20" inputmode="numeric" name="g_${p.id}" value="${s.goals || ''}" placeholder="0" style="width:56px;text-align:center;background:var(--void);border:1px solid var(--line);border-radius:8px;padding:6px"></td>
          <td class="r"><input type="number" min="0" max="20" inputmode="numeric" name="a_${p.id}" value="${s.assists || ''}" placeholder="0" style="width:56px;text-align:center;background:var(--void);border:1px solid var(--line);border-radius:8px;padding:6px"></td></tr>`; }).join('')}
      </tbody></table></div>
      <button class="btn primary block mt2">Enregistrer le résultat</button>
      ${e.result ? `<button type="button" class="btn ghost block mt" data-act="result-clear" data-id="${e.id}">Effacer le résultat</button>` : ''}
    </form>
    <p class="muted small mt">Le score s'affiche sur le site public si le match est publié.</p>`;
  }

  openSheet(evName(e), `
    <div class="ev-date">${esc(fmtDay(e.date))} · ${esc(fmtTime(e.date))}</div>
    <div class="row mt" style="margin-bottom:14px">${evTag(e)}${e.published ? '<span class="tag green">Publié</span>' : '<span class="tag">Brouillon</span>'}</div>
    <div class="subtabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="${evTab === k ? 'on' : ''}" data-act="ev-tab" data-tab="${k}" data-id="${e.id}">${l}</button>`).join('')}</div>
    ${body}`, root => {
      bindEventForm(root);
      const cnt = $('#cuCount', root);
      if(cnt) root.addEventListener('change', () => { cnt.textContent = $$('input[name=p]:checked', root).length; });
      $$('.seg.att', root).forEach(sg => sg.addEventListener('click', ev => {
        const b = ev.target.closest('button'); if(!b) return;
        const wasOn = b.classList.contains('on');
        $$('button', sg).forEach(x => x.className = '');
        if(!wasOn) b.className = 'on ' + (b.dataset.v === 'présent' ? 'g' : b.dataset.v === 'absent' ? 'r' : b.dataset.v === 'excusé' ? 'b' : '');
      }));
    });
}

/* ---------------- contrat (staff) ---------------- */
const CONTRACT_TEMPLATE = {
  includes: 'Inscription à la ligue (LSAQ)\nMaillot du club\nAccès aux entraînements et aux matchs de la saison',
  clauses: `1. Le joueur s'engage à représenter YUL FC pour la saison indiquée.
2. Le joueur indique sa disponibilité avant chaque match et prévient le staff en cas d'absence.
3. Le joueur respecte ses coéquipiers, le staff, les adversaires et les arbitres.
4. La cotisation est payable au plus tard à la date d'échéance indiquée.
5. Le joueur autorise le club à utiliser les photos et vidéos d'équipe sur ses réseaux et son site.
6. Le club peut mettre fin au contrat en cas de manquement grave au respect ou aux règles de la ligue.`,
};
function openContract(pid){
  const p = playerById(pid); if(!p) return closeSheet();
  S.sheet = () => openContract(pid);
  const c = contractFor(pid) || {};
  const pays = paymentsFor(pid), b = balance(c.playerId ? c : null, pays);
  const y = new Date().getFullYear();
  openSheet('Contrat · ' + pName(p), `
    ${c.signedAt ? `<div class="callup yes" style="margin-top:0"><b>Signé</b> par ${esc(c.signedName)} le ${esc(fmtShort(c.signedAt))}.</div>` : ''}
    <form data-form="contract" class="mt">
      <input type="hidden" name="playerId" value="${pid}">
      <div class="grid2">
        <div class="field"><label>Saison</label><input name="season" value="${esc(c.season || String(y + (new Date().getMonth() > 8 ? 1 : 0)))}"></div>
        <div class="field"><label>Statut</label><select name="status">${['brouillon', 'à signer', 'signé', 'terminé'].map(s => `<option ${(c.status || 'brouillon') === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <div class="hint">« à signer » : le joueur le voit et peut le signer en ligne.</div></div>
      </div>
      <div class="grid3">
        <div class="field"><label>Début</label><input name="startDate" type="date" value="${esc((c.startDate || '').slice(0, 10))}"></div>
        <div class="field"><label>Fin</label><input name="endDate" type="date" value="${esc((c.endDate || '').slice(0, 10))}"></div>
        <div class="field"><label>Échéance</label><input name="dueDate" type="date" value="${esc((c.dueDate || '').slice(0, 10))}"></div>
      </div>
      <div class="field"><label>Cotisation ($)</label><input name="fee" type="number" min="0" step="0.01" inputmode="decimal" value="${c.fee ?? ''}"></div>
      <div class="field"><label>Inclus</label><textarea name="includes">${esc(c.includes || '')}</textarea></div>
      <div class="field"><label>Conditions</label><textarea name="clauses" style="min-height:180px">${esc(c.clauses || '')}</textarea></div>
      <div class="row">
        <button class="btn primary">Enregistrer le contrat</button>
        ${!c.includes && !c.clauses ? '<button type="button" class="btn ghost" data-act="contract-template">Utiliser le modèle</button>' : ''}
        ${c.signedAt ? '<label class="check" style="margin:0"><input type="checkbox" name="resetSignature"> Annuler la signature</label>' : ''}
      </div>
    </form>
    <div class="section-lbl">Document PDF (optionnel)</div>
    ${c.playerId ? `<div class="card flat">
      ${c.file ? `<div class="row"><div><b>${esc(c.file.name)}</b><div class="small muted">${Math.round(c.file.size / 1024)} Ko · ajouté le ${esc(fmtShort(c.file.at))}</div></div><span class="spacer"></span>
        <a class="btn sm" href="/api/club/contract-file?playerId=${pid}" target="_blank" rel="noopener">Ouvrir</a><button class="btn sm danger" data-act="pdf-del" data-id="${pid}">Retirer</button></div>` : ''}
      <form data-form="pdf" class="${c.file ? 'mt' : ''}"><input type="hidden" name="playerId" value="${pid}">
        <div class="field"><input name="file" type="file" accept="application/pdf" required></div>
        <button class="btn sm">${c.file ? 'Remplacer le PDF' : 'Ajouter le PDF'}</button></form>
    </div>` : '<p class="muted small">Enregistre d\'abord le contrat pour pouvoir y joindre un PDF.</p>'}
    <div class="section-lbl">Paiements</div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi"><div class="n" style="font-size:1.25rem">${esc(money(b.fee))}</div><div class="l">Cotisation</div></div>
      <div class="kpi"><div class="n green" style="font-size:1.25rem">${esc(money(b.paid))}</div><div class="l">Payé</div></div>
      <div class="kpi"><div class="n ${b.due > 0 ? 'red' : ''}" style="font-size:1.25rem">${esc(money(b.due))}</div><div class="l">Reste</div></div>
    </div>
    ${pays.length ? `<div class="list mt">${pays.map(x => `<div class="li"><div class="main"><div class="t">${esc(money(x.amount))}</div><div class="s">${esc(fmtDateOnly(x.date))} · ${esc(x.method)}${x.note ? ' · ' + esc(x.note) : ''} · noté par ${esc(x.by || '')}</div></div>
      <button class="btn sm danger" data-act="pay-del" data-p="${pid}" data-id="${x.id}" aria-label="Supprimer ce paiement">✕</button></div>`).join('')}</div>` : ''}
    <form data-form="payment" class="card flat mt">
      <input type="hidden" name="playerId" value="${pid}">
      <div class="grid2">
        <div class="field"><label>Montant ($)</label><input name="amount" type="number" step="0.01" inputmode="decimal" required value="${b.due || ''}"></div>
        <div class="field"><label>Date</label><input name="date" type="date" value="${today()}"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Mode</label><select name="method"><option>virement</option><option>comptant</option><option>carte</option><option>autre</option></select></div>
        <div class="field"><label>Note</label><input name="note" placeholder="ex. 1er versement"></div>
      </div>
      <button class="btn">Enregistrer le paiement</button>
    </form>
  `);
}

/* ---------------- annonces ---------------- */
function openNews(id){
  const n = id ? (S.d.news || []).find(x => x.id === id) : {};
  openSheet(id ? 'Modifier l\'annonce' : 'Nouvelle annonce', `
    <form data-form="news"><input type="hidden" name="id" value="${esc(n.id || '')}">
      <div class="field"><label>Titre</label><input name="title" required maxlength="120" value="${esc(n.title || '')}"></div>
      <div class="field"><label>Message</label><textarea name="body" style="min-height:160px">${esc(n.body || '')}</textarea></div>
      <div class="field"><label>Visible par</label><select name="audience">
        <option value="players" ${n.audience === 'players' || !n.audience ? 'selected' : ''}>Joueurs et staff</option>
        <option value="staff" ${n.audience === 'staff' ? 'selected' : ''}>Staff seulement</option></select></div>
      <label class="check"><input type="checkbox" name="pinned" ${n.pinned ? 'checked' : ''}> Épingler en haut</label>
      <button class="btn primary block">${id ? 'Enregistrer' : 'Publier l\'annonce'}</button>
    </form>`);
}

/* ---------------- photos ---------------- */
const SLOT_LABEL = s => s === 'hero' ? 'Accueil' : s === 'histoire' ? 'Notre histoire' : s === 'gallery' ? 'Galerie' : s.startsWith('player-') ? 'Joueur #' + s.slice(7) : s;
async function loadPhotos(){
  const box = $('#photoList'); if(!box) return;
  try{
    const r = await api('/api/media');
    const items = r.items || [];
    box.innerHTML = items.length ? items.map(i => `<figure><img src="${esc(i.url)}" alt="${esc(i.caption || '')}" loading="lazy">
      <figcaption><span>${esc(SLOT_LABEL(i.slot))}</span><button data-act="photo-del" data-id="${esc(i.id)}">Supprimer</button></figcaption></figure>`).join('')
      : '<p class="muted small">Aucune photo en ligne pour le moment.</p>';
  }catch(e){ box.innerHTML = `<p class="red small">${esc(e.message)}</p>`; }
}
function resizeImage(file, max){
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      cv.toBlob(b => b ? res({ blob: b, w, h }) : rej(new Error('Image illisible.')), 'image/jpeg', .86);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Image illisible.')); };
    img.src = url;
  });
}

/* ---------------- import de l'effectif du site public ---------------- */
async function siteSquad(){
  const r = await fetch('/', { cache: 'no-store' });
  if(!r.ok) throw new Error('Impossible de lire le site.');
  const html = await r.text();
  const m = html.match(/const players = (\[[\s\S]*?\n\]);/);
  if(!m) throw new Error('Effectif introuvable sur le site.');
  let list;
  try{ list = Function('"use strict";return (' + m[1] + ');')(); }catch(e){ throw new Error('Effectif du site illisible.'); }
  return list.filter(p => p && p.name).map(p => {
    const parts = String(p.name).trim().split(/\s+/);
    const lastName = parts.length > 1 ? parts.pop() : '';
    return { firstName: parts.join(' '), lastName, num: p.noNumber ? '' : p.num, captain: !!p.captain };
  });
}
const sameName = (a, b) => pName(a).toLowerCase() === pName(b).toLowerCase();
async function openSquadImport(){
  openSheet('Importer l\'effectif', '<p class="muted">Lecture de l\'effectif publié sur yulfc.com…</p>');
  let list;
  try{ list = await siteSquad(); }catch(e){ $('#sheetBody').innerHTML = `<p class="red">${esc(e.message)}</p>`; return; }
  const fresh = list.filter(x => !players().some(p => sameName(p, x)));
  const already = list.length - fresh.length;
  S.importList = fresh;
  $('#sheetBody').innerHTML = `
    <p>${list.length} joueurs sur le site. ${fresh.length ? 'Coche ceux à ajouter à l\'espace staff' : 'Ils sont tous déjà dans l\'espace staff'}${already && fresh.length ? ` (${already} déjà présent${already > 1 ? 's' : ''}, non affiché${already > 1 ? 's' : ''})` : ''}.</p>
    ${fresh.length ? `
      <div class="row mt"><span class="lbl" style="margin:0">Sélection · <span id="impCount">0</span> / ${fresh.length}</span><span class="spacer"></span>
        <button type="button" class="btn sm ghost" data-act="imp-all">Tout cocher</button><button type="button" class="btn sm ghost" data-act="imp-none">Tout décocher</button></div>
      <div class="list mt" id="impList">${fresh.map((x, i) => `<label class="li" style="cursor:pointer"><input type="checkbox" value="${i}" style="width:20px;height:20px;accent-color:var(--gold)">
        <div class="num">${x.num === '' ? '–' : esc(x.num)}</div><div class="main"><div class="t">${esc(pName(x))}</div>${x.captain ? '<div class="s">Capitaine</div>' : ''}</div></label>`).join('')}</div>
      <p class="muted small mt">Le poste, le téléphone et l'email restent à compléter sur chaque fiche. Aucun accès n'est créé automatiquement.</p>
      <button class="btn primary block mt2" data-act="squad-import-go" id="impGo" disabled style="position:sticky;bottom:0;box-shadow:0 -12px 24px var(--void)">Choisis au moins un joueur</button>` : '<button class="btn block mt2" data-close>Fermer</button>'}`;
  const box = $('#impList'); if(box) box.addEventListener('change', impUpdate);
}
function impUpdate(){
  const n = $$('#impList input:checked').length, go = $('#impGo');
  $('#impCount').textContent = n;
  go.disabled = !n;
  go.textContent = n ? `Ajouter ${n === 1 ? 'ce joueur' : 'ces ' + n + ' joueurs'}` : 'Choisis au moins un joueur';
}

/* ==========================================================================
   ACTIONS (clics)
   ========================================================================== */
const ACT = {
  'auth-mode': b => { S.authMode = b.dataset.mode; renderLogin(); },
  async logout(){ try{ await api('/api/auth/logout', {}); }catch(e){} S.user = null; S.d = null; closeSheet(); S.authMode = 'login'; renderLogin(); },
  profile(){
    const u = S.user;
    openSheet('Mon compte', `
      <div class="row"><span class="avatar" style="width:46px;height:46px;font-size:1rem">${esc(initials(u.name))}</span><div><b>${esc(u.name)}</b><div class="muted small">${esc(u.email)} · ${esc(ROLE[u.role])}</div></div></div>
      <div class="section-lbl">Changer mon mot de passe</div>
      <form data-form="password">
        <div class="field"><label>Mot de passe actuel</label><input name="current" type="password" required autocomplete="current-password"></div>
        <div class="field"><label>Nouveau mot de passe</label><input name="next" type="password" minlength="8" required autocomplete="new-password"></div>
        <button class="btn block">Mettre à jour</button>
      </form>
      <div class="section-lbl">Session</div>
      <div class="row"><a class="btn" href="/">Voir le site</a><button class="btn danger" data-act="logout">Se déconnecter</button></div>
    `);
  },
  avail: b => busy(null, async () => {
    const ev = b.dataset.ev, s = b.dataset.s;
    const cur = myAvail(ev);
    const status = cur && cur.status === s ? '' : s;
    await api('/api/club/availability/set', { eventId: ev, status });
    S.d.availability = (S.d.availability || []).filter(a => a.eventId !== ev);
    if(status) S.d.availability.push({ eventId: ev, playerId: S.d.player.id, status });
    renderShell();
    toast(status ? 'Réponse enregistrée' : 'Réponse retirée');
  }),
  'avail-staff': b => busy(null, async () => {
    const cur = availFor(b.dataset.ev, b.dataset.p);
    const status = cur && cur.status === b.dataset.s ? '' : b.dataset.s;
    await api('/api/club/availability/set', { eventId: b.dataset.ev, playerId: b.dataset.p, status });
    await refresh(true);
  }),
  'squad-import': () => openSquadImport(),
  'imp-all': () => { $$('#impList input').forEach(i => i.checked = true); impUpdate(); },
  'imp-none': () => { $$('#impList input').forEach(i => i.checked = false); impUpdate(); },
  'squad-import-go': b => busy(b, async () => {
    const list = $$('#impList input:checked').map(i => (S.importList || [])[+i.value]).filter(Boolean); let n = 0;
    if(!list.length) return;
    for(const x of list){
      b.textContent = `${++n} / ${list.length}…`;
      await api('/api/club/players/save', { firstName: x.firstName, lastName: x.lastName, num: x.num, pos: '', status: 'actif', notes: x.captain ? 'Capitaine' : '' });
    }
    S.importList = null; closeSheet(); toast(list.length > 1 ? list.length + ' joueurs ajoutés' : '1 joueur ajouté'); await refresh();
  }),
  'player-new': () => { S.sheet = null; openSheet('Nouveau joueur', playerForm()); },
  'player-open': b => openPlayer(b.dataset.id),
  'player-del': b => busy(b, async () => {
    const p = playerById(b.dataset.id);
    if(!confirm(`Retirer ${pName(p)} de l'effectif ? Son accès sera désactivé.`)) return;
    await api('/api/club/players/delete', { id: b.dataset.id });
    closeSheet(); toast('Joueur retiré'); await refresh();
  }),
  'acc-reset': b => busy(b, async () => {
    if(!confirm('Générer un nouveau code temporaire ? L\'ancien mot de passe ne fonctionnera plus.')) return;
    const r = await api('/api/club/accounts/reset', { id: b.dataset.id });
    await refresh(); showCode(r.account, r.tempCode);
  }),
  'acc-toggle': b => busy(b, async () => {
    const a = (S.d.accounts || []).find(x => x.id === b.dataset.id);
    await api('/api/club/accounts/update', { id: a.id, active: !a.active });
    toast(a.active ? 'Compte désactivé' : 'Compte réactivé'); await refresh();
  }),
  'acc-del': b => busy(b, async () => {
    const a = (S.d.accounts || []).find(x => x.id === b.dataset.id);
    if(!confirm(`Supprimer définitivement le compte de ${a.name} ?`)) return;
    await api('/api/club/accounts/delete', { id: a.id });
    toast('Compte supprimé'); await refresh();
  }),
  'staff-new': () => openSheet('Nouveau compte staff', `
    <form data-form="staffacc">
      <div class="field"><label>Nom</label><input name="name" required></div>
      <div class="field"><label>Email</label><input name="email" type="email" required></div>
      <div class="field"><label>Rôle</label><select name="role"><option value="coach">Coach</option><option value="manager">Gérant</option><option value="admin">Admin</option></select></div>
      <button class="btn primary block">Créer le compte</button>
    </form>`),
  'event-new': () => { S.sheet = null; evTab = 'infos'; openSheet('Nouvel événement', eventForm({}), bindEventForm); },
  'event-open': b => openEvent(b.dataset.id, 'infos'),
  'ev-tab': b => openEvent(b.dataset.id, b.dataset.tab),
  'event-del': b => busy(b, async () => {
    if(!confirm('Supprimer cet événement, ses dispos, sa convocation et son résultat ?')) return;
    await api('/api/club/events/delete', { id: b.dataset.id });
    closeSheet(); toast('Événement supprimé'); await refresh();
  }),
  'cu-all': () => { $$('#sheetBody input[name=p]').forEach(i => i.checked = i.dataset.avail === 'oui'); $('#cuCount').textContent = $$('#sheetBody input[name=p]:checked').length; },
  'cu-none': () => { $$('#sheetBody input[name=p]').forEach(i => i.checked = false); $('#cuCount').textContent = 0; },
  'cu-share': b => {
    const e = eventById(b.dataset.id);
    const ids = $$('#sheetBody input[name=p]:checked').map(i => i.value);
    const names = ids.map(playerById).filter(Boolean).sort((a, c) => (a.num ?? 999) - (c.num ?? 999)).map(p => `${p.num != null ? '#' + p.num + ' ' : ''}${pName(p)}`);
    const meet = $('#sheetBody input[name=meet]').value, msg = $('#sheetBody textarea[name=message]').value;
    copy(`⚽ CONVOCATION YUL FC\n${evName(e)}\n${fmtDay(e.date)} · ${fmtTime(e.date)}${e.venue ? '\n📍 ' + e.venue : ''}${meet ? '\n⏰ RDV ' + meet : ''}\n\n${names.join('\n')}${msg ? '\n\n' + msg : ''}\n\nDétails : ${SITE}/espace.html`);
  },
  'att-all': () => $$('#sheetBody .seg.att').forEach(sg => { $$('button', sg).forEach(x => x.className = ''); $('button[data-v="présent"]', sg).className = 'on g'; }),
  'att-save': b => busy(b, async () => {
    const marks = {};
    $$('#sheetBody .seg.att').forEach(sg => { const on = $('button.on', sg); if(on) marks[sg.dataset.p] = on.dataset.v; });
    await api('/api/club/events/attendance', { id: b.dataset.id, marks });
    toast('Présences enregistrées'); await refresh(true);
  }),
  'result-clear': b => busy(b, async () => {
    if(!confirm('Effacer le score et les buteurs ?')) return;
    await api('/api/club/events/result', { id: b.dataset.id, clear: true });
    toast('Résultat effacé'); await refresh(true);
  }),
  'news-new': () => openNews(),
  'news-edit': b => openNews(b.dataset.id),
  'news-del': b => busy(b, async () => {
    if(!confirm('Supprimer cette annonce ?')) return;
    await api('/api/club/news/delete', { id: b.dataset.id });
    toast('Annonce supprimée'); await refresh();
  }),
  'contract-open': b => openContract(b.dataset.id),
  'contract-template': () => {
    const f = $('#sheetBody form[data-form=contract]');
    const inc = f.elements.namedItem('includes'), cl = f.elements.namedItem('clauses');
    if(!inc.value) inc.value = CONTRACT_TEMPLATE.includes;
    if(!cl.value) cl.value = CONTRACT_TEMPLATE.clauses;
    toast('Modèle ajouté, adapte-le avant d\'enregistrer');
  },
  'pdf-del': b => busy(b, async () => {
    if(!confirm('Retirer le PDF de ce contrat ?')) return;
    await api('/api/club/contract-file?playerId=' + encodeURIComponent(b.dataset.id), undefined, 'DELETE');
    toast('PDF retiré'); await refresh(true);
  }),
  'pay-del': b => busy(b, async () => {
    if(!confirm('Supprimer ce paiement ?')) return;
    await api('/api/club/payments/delete', { playerId: b.dataset.p, id: b.dataset.id });
    toast('Paiement supprimé'); await refresh(true);
  }),
  'photo-del': b => busy(b, async () => {
    if(!confirm('Retirer cette photo du site ?')) return;
    await api('/api/media?id=' + encodeURIComponent(b.dataset.id), undefined, 'DELETE');
    toast('Photo retirée'); loadPhotos();
  }),
  copy: b => copy(b.dataset.text),
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if(!b || !ACT[b.dataset.act]) return;
  if(b.tagName === 'A' && !b.getAttribute('href')) e.preventDefault();
  if(b.tagName === 'BUTTON') e.preventDefault();
  ACT[b.dataset.act](b, e);
});

/* ==========================================================================
   FORMULAIRES (envoi)
   ========================================================================== */
const FORMS = {
  async login(f){
    const v = formData(f);
    try{
      const r = await api('/api/auth/login', { email: v.email, password: v.password });
      S.user = r.user;
      if(S.user.mustChange) return renderMustChange();
      await refresh();
    }catch(e){ renderLogin(e.message); $('#app input[name=email]').value = v.email; }
  },
  async setup(f){
    const v = formData(f);
    try{ const r = await api('/api/auth/setup', v); S.user = r.user; S.setupNeeded = false; await refresh(); toast('Compte admin créé. Bienvenue !'); }
    catch(e){ renderLogin(e.message); }
  },
  async mustchange(f){
    const v = formData(f);
    if(v.next !== v.confirm) return renderMustChange('Les deux mots de passe ne correspondent pas.');
    try{ const r = await api('/api/auth/password', { current: v.current, next: v.next }); S.user = r.user; await refresh(); toast('Mot de passe enregistré'); }
    catch(e){ renderMustChange(e.message); }
  },
  async password(f, btn){
    await busy(btn, async () => { const v = formData(f); await api('/api/auth/password', v); f.reset(); toast('Mot de passe mis à jour'); });
  },
  async sign(f, btn){
    await busy(btn, async () => {
      const v = formData(f);
      await api('/api/club/contracts/sign', { fullName: v.fullName, accept: !!v.accept });
      toast('Contrat signé. Merci !'); await refresh();
    });
  },
  async player(f, btn){
    await busy(btn, async () => {
      const v = formData(f);
      const p = await api('/api/club/players/save', v);
      toast(v.id ? 'Fiche enregistrée' : 'Joueur ajouté');
      await refresh(); openPlayer(p.id);
    });
  },
  async access(f, btn){
    await busy(btn, async () => {
      const v = formData(f);
      const r = await api('/api/club/accounts/create', { role: 'player', playerId: v.playerId, email: v.email });
      await refresh(); showCode(r.account, r.tempCode);
    });
  },
  async staffacc(f, btn){
    await busy(btn, async () => {
      const r = await api('/api/club/accounts/create', formData(f));
      await refresh(); showCode(r.account, r.tempCode);
    });
  },
  async event(f, btn){
    await busy(btn, async () => {
      const v = formData(f);
      const body = { ...v, date: fromLocalInput(v.date), published: !!v.published, isHome: v.isHome === 'true' };
      const e = await api('/api/club/events/save', body);
      toast(v.id ? 'Événement enregistré' : 'Événement créé');
      await refresh(); openEvent(e.id, v.id ? 'infos' : 'dispos');
    });
  },
  async callup(f, btn, submitter){
    await busy(btn, async () => {
      const ids = $$('input[name=p]:checked', f).map(i => i.value);
      const publish = submitter && submitter.value === '1';
      const v = formData(f);
      await api('/api/club/events/callup', { id: v.id, playerIds: ids, meet: v.meet, message: v.message, published: publish });
      toast(publish ? 'Convocation publiée' : 'Convocation enregistrée (non publiée)'); await refresh(true);
    });
  },
  async result(f, btn){
    await busy(btn, async () => {
      const v = formData(f);
      const scorers = [];
      Object.keys(v).forEach(k => { const m = k.match(/^g_(.+)$/); if(m) scorers.push({ playerId: m[1], goals: +v[k] || 0, assists: +v['a_' + m[1]] || 0 }); });
      await api('/api/club/events/result', { id: v.id, yul: v.yul, opp: v.opp, scorers });
      toast('Résultat enregistré'); await refresh(true);
    });
  },
  async news(f, btn){
    await busy(btn, async () => {
      const v = formData(f);
      await api('/api/club/news/save', { ...v, pinned: !!v.pinned });
      closeSheet(); toast(v.id ? 'Annonce modifiée' : 'Annonce publiée'); await refresh();
    });
  },
  async contract(f, btn){
    await busy(btn, async () => {
      const v = formData(f);
      await api('/api/club/contracts/save', { ...v, resetSignature: !!v.resetSignature });
      toast('Contrat enregistré'); await refresh(true);
    });
  },
  async pdf(f, btn){
    await busy(btn, async () => {
      const fd = new FormData(f);
      const file = fd.get('file');
      if(!file || !file.size) throw new Error('Choisis un fichier PDF.');
      await api('/api/club/contract-file', fd);
      toast('PDF ajouté'); await refresh(true);
    });
  },
  async payment(f, btn){
    await busy(btn, async () => {
      await api('/api/club/payments/add', formData(f));
      toast('Paiement enregistré'); await refresh(true);
    });
  },
  async photo(f, btn){
    await busy(btn, async () => {
      const v = formData(f);
      const files = [...f.elements.namedItem('file').files];
      if(!files.length) throw new Error('Choisis une image.');
      const slot = v.slot === 'player' ? 'player-' + parseInt(v.num, 10) : v.slot;
      if(slot === 'player-NaN') throw new Error('Indique le numéro de maillot.');
      const list = slot === 'gallery' ? files : files.slice(0, 1);
      let n = 0;
      for(const file of list){
        const { blob, w, h } = await resizeImage(file, slot === 'hero' ? 2400 : slot.startsWith('player-') ? 1200 : 2000);
        const fd = new FormData();
        fd.append('file', blob, (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg');
        fd.append('slot', slot); fd.append('caption', v.caption || ''); fd.append('w', w); fd.append('h', h);
        await api('/api/media', fd);
        n++;
      }
      f.reset(); $('#photoNumField').hidden = true;
      toast(n > 1 ? n + ' photos en ligne' : 'Photo en ligne'); loadPhotos();
    });
  },
};
document.addEventListener('input', e => {
  if(e.target.name === 'birthDate' && $('#ageHint')){ const a = ageOf(e.target.value); $('#ageHint').textContent = a != null ? a + ' ans' : ''; }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]');
  if(!f || !FORMS[f.dataset.form]) return;
  e.preventDefault();
  const btn = e.submitter || $('button:not([type=button])', f);
  FORMS[f.dataset.form](f, btn, e.submitter);
});

/* ==========================================================================
   DÉMARRAGE
   ========================================================================== */
(async function start(){
  try{
    const r = await api('/api/auth/me');
    if(!r.user){
      S.setupNeeded = !!r.setupNeeded; S.setupReady = !!r.setupReady;
      S.authMode = S.setupNeeded ? 'setup' : 'login';
      return renderLogin();
    }
    S.user = r.user;
    if(S.user.mustChange) return renderMustChange();
    await refresh();
  }catch(e){
    $('#app').innerHTML = `<div class="auth"><div class="auth-card"><img class="auth-crest" src="fx/yul-crest.png" alt=""><h1>Espace<br>indisponible</h1><p class="sub">${esc(e.message)}</p><button class="btn primary block" onclick="location.reload()">Réessayer</button><a class="back" href="/">← Retour au site</a></div></div>`;
  }
})();
})();
