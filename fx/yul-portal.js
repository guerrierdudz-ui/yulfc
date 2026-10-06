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

  /* ---------------- 3. Poste, âge et nationalités dans la fiche joueur (au clic) ----------------
     Saisis par le staff dans l'Espace, reliés aux joueurs du site par le nom. */
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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
  const flag = n => { const c = ISO[norm(n)]; return c ? `<img class="pc-flag" src="https://flagcdn.com/w40/${c.toLowerCase()}.png" alt="${esc(n)}" title="${esc(n)}" width="24" height="16" loading="lazy" onerror="var s=document.createElement('span');s.className='pc-nat-txt';s.textContent=this.alt;this.replaceWith(s)">` : ''; };
  let SQUAD = null;
  const POS_LABEL = { GK: 'Gardien', DEF: 'Défenseur', MID: 'Milieu', FWD: 'Attaquant' };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function applySquad(list){
    SQUAD = new Map(list.map(x => [norm(x.name), x]));
    // fiche joueur (fenêtre au clic) : âge et nationalité
    try{
      if(typeof players !== 'undefined') players.forEach(p => {
        const i = SQUAD.get(norm(p.name)); if(!i) return;
        if(i.age != null) p.age = i.age + ' ans';
        if(i.pos){ p.posCat = i.pos; p.pos = POS_LABEL[i.pos]; }
        if(i.nationalities.length){ // drapeaux seulement (nom du pays au survol) ; nom écrit si le pays n'a pas de drapeau connu
          p.country = i.nationalities.map(n => flag(n) || `<span class="pc-nat-txt">${esc(n)}</span>`).join(''); p.flag = ''; }
      });
    }catch(e){}
    if(!document.getElementById('pc-meta-style')){
      const st = document.createElement('style'); st.id = 'pc-meta-style';
      // les infos restent dans la fiche au clic, pas sur la photo de la carte
      st.textContent = `.player-card .player-pos{ display:none !important; }
        .modal-bio-row .pc-flag{ display:inline-block; width:24px !important; height:16px !important; max-width:none; object-fit:cover; border-radius:2px; margin-right:6px; vertical-align:-3px; box-shadow:0 0 0 1px rgba(255,255,255,.12); }
        .modal-bio-row .pc-nat-txt{ margin-right:8px; }`;
      document.head.appendChild(st);
    }
    // postes connus : on redessine l'effectif pour que les filtres (Gardiens, Défenseurs…) fonctionnent
    try{
      const active = document.querySelector('#squadFilters button.active');
      if(typeof renderPlayersGrid === 'function') renderPlayersGrid(active ? active.dataset.posfilter : 'all');
      if(typeof renderHomeSquadPreview === 'function') renderHomeSquadPreview();
    }catch(e){}
  }
  fetch('/api/public/squad').then(r => r.ok ? r.json() : null).then(d => {
    if(d && Array.isArray(d.squad) && d.squad.length) applySquad(d.squad);
  }).catch(() => {});
})();
