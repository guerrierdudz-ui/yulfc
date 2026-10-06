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

  /* ---------------- 3. Âge et nationalités sur les cartes joueurs ----------------
     Saisis par le staff dans l'Espace (fiche joueur), reliés aux cartes par le nom. */
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const ISO = { 'canada':'CA','algerie':'DZ','maroc':'MA','tunisie':'TN','france':'FR','haiti':'HT','madagascar':'MG','senegal':'SN',
    'cote d ivoire':'CI','cameroun':'CM','rd congo':'CD','congo':'CG','guinee':'GN','mali':'ML','liban':'LB','syrie':'SY','irak':'IQ',
    'egypte':'EG','belgique':'BE','portugal':'PT','espagne':'ES','italie':'IT','bresil':'BR','colombie':'CO','mexique':'MX',
    'venezuela':'VE','perou':'PE','chili':'CL','argentine':'AR','salvador':'SV','el salvador':'SV','honduras':'HN',
    'etats unis':'US','usa':'US','royaume uni':'GB','angleterre':'GB','allemagne':'DE','suisse':'CH','turquie':'TR','libye':'LY',
    'jordanie':'JO','palestine':'PS','iran':'IR','pakistan':'PK','inde':'IN','bangladesh':'BD','chine':'CN','vietnam':'VN',
    'philippines':'PH','nigeria':'NG','ghana':'GH','benin':'BJ','togo':'TG','burkina faso':'BF','niger':'NE','tchad':'TD',
    'gabon':'GA','burundi':'BI','rwanda':'RW','ethiopie':'ET','erythree':'ER','somalie':'SO','soudan':'SD','mauritanie':'MR',
    'comores':'KM','maurice':'MU','jamaique':'JM','cuba':'CU','republique dominicaine':'DO','guatemala':'GT','nicaragua':'NI',
    'equateur':'EC','bolivie':'BO','paraguay':'PY','uruguay':'UY','pays bas':'NL','pologne':'PL','roumanie':'RO','ukraine':'UA',
    'russie':'RU','grece':'GR','albanie':'AL','bosnie':'BA','serbie':'RS','croatie':'HR','armenie':'AM','japon':'JP','coree du sud':'KR' };
  // drapeaux en image : les émojis drapeaux ne s'affichent pas sous Windows
  const flag = n => { const c = ISO[norm(n)]; return c ? `<img class="pc-flag" src="https://flagcdn.com/w40/${c.toLowerCase()}.png" alt="" width="16" height="12" loading="lazy">` : ''; };
  let SQUAD = null;
  const POS_LABEL = { GK: 'Gardien', DEF: 'Défenseur', MID: 'Milieu', FWD: 'Attaquant' };

  function siteName(card){
    const num = card.getAttribute('data-num');
    try{ if(typeof players !== 'undefined'){ const p = players.find(x => String(x.num) === String(num)); if(p) return p.name; } }catch(e){}
    const n = card.querySelector('.player-name'); return n ? n.textContent : '';
  }
  function infoFor(name){ return SQUAD && SQUAD.get(norm(name)); }
  function decorate(root){
    if(!SQUAD) return;
    (root && root.querySelectorAll ? root : document).querySelectorAll('.player-card[data-num]').forEach(card => {
      const info = infoFor(siteName(card));
      const old = card.querySelector('.pc-meta');
      if(!info){ if(old) old.remove(); return; }
      const bits = [];
      if(info.age != null) bits.push(`<span>${info.age} ans</span>`);
      info.nationalities.forEach(n => bits.push(`<span class="pc-nat">${flag(n)}${esc(n)}</span>`));
      const html = (info.pos ? `<span class="pc-pos">${POS_LABEL[info.pos]}</span>` : '') + bits.join('');
      if(old){ if(old.innerHTML !== html) old.innerHTML = html; return; }
      const el = document.createElement('div'); el.className = 'pc-meta'; el.innerHTML = html;
      const name = card.querySelector('.player-name');
      if(name) name.insertAdjacentElement('afterend', el); else (card.querySelector('.player-info') || card).appendChild(el);
    });
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function applySquad(list){
    SQUAD = new Map(list.map(x => [norm(x.name), x]));
    // fiche joueur (fenêtre au clic) : âge et nationalité
    try{
      if(typeof players !== 'undefined') players.forEach(p => {
        const i = SQUAD.get(norm(p.name)); if(!i) return;
        if(i.age != null) p.age = i.age + ' ans';
        if(i.pos){ p.posCat = i.pos; p.pos = POS_LABEL[i.pos]; }
        if(i.nationalities.length){ p.country = i.nationalities.join(' / '); p.flag = i.nationalities.map(flag).join(''); }
      });
    }catch(e){}
    if(!document.getElementById('pc-meta-style')){
      const st = document.createElement('style'); st.id = 'pc-meta-style';
      st.textContent = `.player-card .pc-meta{ display:flex; flex-wrap:wrap; align-items:center; gap:.2rem .6rem; margin-top:.35rem;
        font-family:var(--ff-mono, monospace); font-size:clamp(.56rem, 4.6cqi, .7rem); letter-spacing:.04em; color:rgba(244,245,242,.82);
        text-shadow:0 1px 4px rgba(0,0,0,.7); position:relative; z-index:2; }
        .player-card .pc-meta .pc-flag, .modal-bio-row .pc-flag{ display:inline-block; width:1.35em; height:auto; border-radius:2px; margin-right:.35em; vertical-align:-.12em; box-shadow:0 0 0 1px rgba(0,0,0,.25); }
        .player-card .pc-meta > span{ white-space:nowrap; }
        .player-card .pc-meta .pc-pos{ flex-basis:100%; color:var(--gold, #F0B429); text-transform:uppercase; letter-spacing:.14em; }
        .player-card:has(.pc-meta) .player-pos{ display:none; }`;
      document.head.appendChild(st);
    }
    // postes connus : on redessine l'effectif pour que les filtres (Gardiens, Défenseurs…) fonctionnent
    try{
      const active = document.querySelector('#squadFilters button.active');
      if(typeof renderPlayersGrid === 'function') renderPlayersGrid(active ? active.dataset.posfilter : 'all');
      if(typeof renderHomeSquadPreview === 'function') renderHomeSquadPreview();
    }catch(e){}
    decorate(document);
    new MutationObserver(ms => { for(const m of ms) for(const n of m.addedNodes) if(n.nodeType === 1 && (n.matches('.player-card') || n.querySelector('.player-card'))){ decorate(n.parentElement || n); return; } })
      .observe(document.body, { childList: true, subtree: true });
  }
  fetch('/api/public/squad').then(r => r.ok ? r.json() : null).then(d => {
    if(d && Array.isArray(d.squad) && d.squad.length) applySquad(d.squad);
  }).catch(() => {});
})();
