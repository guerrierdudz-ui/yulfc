/* ==========================================================================
   YUL FC · lien entre le site public et l'Espace membres (/espace.html)
   1. Zone joueur / Zone coach : vraie connexion (comptes créés par le staff)
   2. Match Center : prochain match et résultats publiés par le staff
   ========================================================================== */
(() => {
  'use strict';
  const PORTAL = '/espace.html';
  const $ = id => document.getElementById(id);

  /* ---------------- 1. Connexion ---------------- */
  function setMsg(el, text, isErr){
    if(!el) return;
    el.textContent = text;
    el.style.color = isErr ? 'var(--loss)' : '';
  }
  async function login(form, emailId, passId, msgEl){
    const email = ($(emailId) || {}).value || '', password = ($(passId) || {}).value || '';
    if(!email || !password){ setMsg(msgEl, 'Entre ton email et ton mot de passe (ou ton code temporaire).', true); return; }
    const btn = form.querySelector('button[type=submit], button');
    if(btn){ btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = '…'; }
    try{
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ email, password }) });
      const d = await r.json().catch(() => ({}));
      if(!r.ok) throw new Error(d.error || 'Connexion impossible.');
      location.href = PORTAL;
    }catch(e){
      setMsg(msgEl, e.message, true);
      if(btn){ btn.disabled = false; btn.textContent = btn.dataset.label; }
    }
  }

  // phase de capture : passe avant les anciens gestionnaires de démonstration
  document.addEventListener('submit', e => {
    const f = e.target;
    if(f.id === 'lockerForm'){ e.preventDefault(); e.stopImmediatePropagation(); login(f, 'lockerEmail', 'lockerPass', $('lockerMsg')); }
    if(f.id === 'coachForm'){ e.preventDefault(); e.stopImmediatePropagation(); login(f, 'coachEmail', 'coachPass', $('coachMsg')); }
  }, true);
  document.addEventListener('click', e => {
    if(e.target.closest('#phonePreview')){ e.preventDefault(); e.stopImmediatePropagation(); location.href = PORTAL; }
    if(e.target.closest('#forgotLink')){ e.preventDefault(); e.stopImmediatePropagation(); setMsg($('lockerMsg'), 'Mot de passe oublié : demande un nouveau code temporaire à un membre du staff.'); }
  }, true);
  document.addEventListener('keydown', e => {
    if(e.key === 'Enter' && e.target.closest && e.target.closest('#phonePreview')){ e.preventDefault(); e.stopImmediatePropagation(); location.href = PORTAL; }
  }, true);

  // déjà connecté : bouton direct vers l'espace
  fetch('/api/auth/me', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).then(d => {
    if(!d || !d.user) return;
    const first = String(d.user.name || '').split(' ')[0];
    const staff = d.user.role !== 'player';
    [['lockerForm', !staff], ['coachForm', staff]].forEach(([id, primary]) => {
      const f = $(id); if(!f || !primary) return;
      const a = document.createElement('a');
      a.href = PORTAL; a.className = 'login-submit portal-open';
      a.style.cssText = 'display:block;text-align:center;text-decoration:none;margin-bottom:1rem;' + (primary ? '' : 'opacity:.75;');
      a.textContent = `Ouvrir mon espace (${first})`;
      f.parentNode.insertBefore(a, f);
    });
  }).catch(() => {});

  /* ---------------- 2. Matchs publiés par le staff ---------------- */
  const call = name => { try{ if(typeof window[name] === 'function') window[name](); }catch(e){} };
  function applyMatches(list){
    if(typeof matchDB === 'undefined' || !matchDB) return;
    const now = Date.now();
    const dayKeys = new Set(matchDB.archive.map(m => String(m.date || '').slice(0, 10)).filter(Boolean));
    let changed = false;

    list.filter(m => m.result).forEach(m => {
      const id = 'club-' + m.id;
      if(matchDB.archive.some(a => a.id === id)) return;
      if(dayKeys.has(String(m.date).slice(0, 10))) return; // déjà dans les résultats officiels
      const y = m.result.yul, o = m.result.opp;
      const rec = {
        id, opponent: m.opponent, venue: m.venue || '', comp: m.comp || 'league', round: m.round || '',
        date: m.date, kickoff: m.date, result: y > o ? 'W' : y < o ? 'L' : 'D', scoreYul: y, scoreOpp: o,
        status: 'full-time', isHome: m.isHome, events: [], stats: null, ratings: {}, potm: null,
        reportPublished: false, year: String(m.date).slice(0, 4), segment: 'summer', format: '11v11',
      };
      // insertion à sa place chronologique (les matchs sans date restent où ils sont)
      const at = matchDB.archive.findIndex(a => a.date && Date.parse(a.date) > Date.parse(m.date));
      if(at === -1) matchDB.archive.push(rec); else matchDB.archive.splice(at, 0, rec);
      changed = true;
    });

    const next = list.find(m => !m.result && Date.parse(m.date) > now - 3 * 3600e3);
    if(next){
      matchDB.next = Object.assign({}, matchDB.next, {
        id: 'next', opponent: next.opponent, venue: next.venue || 'Lieu à confirmer', comp: next.comp || 'league',
        matchday: next.round || '', kickoff: next.date, status: 'upcoming', isHome: next.isHome !== false,
        scoreYul: 0, scoreOpp: 0, events: [], stats: null, ratings: {}, potm: null, reportPublished: false,
        year: String(next.date).slice(0, 4), segment: 'summer', format: '11v11',
      });
      changed = true;
    }
    if(!changed) return;
    ['renderNextMatchCard', 'renderArchiveGrid', 'renderShResults', 'renderShTeamStats', 'renderShHomeAway',
     'renderMediaFeatured', 'renderMediaLatestGrid'].forEach(call);
  }
  fetch('/api/public/matches').then(r => r.ok ? r.json() : null).then(d => {
    if(d && Array.isArray(d.matches) && d.matches.length) applyMatches(d.matches);
  }).catch(() => {});
})();
