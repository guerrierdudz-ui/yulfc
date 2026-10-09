/* ==========================================================================
   YUL Router · navigation par pages (#pitch, #match, ...) sans rechargement.
   - Tous les liens "#zone" existants continuent de marcher.
   - Les appels existants à element.scrollIntoView() ouvrent d'abord la bonne page.
   - Bouton retour du navigateur supporté.
   Événement émis : window 'yul:page' { detail:{ page } }
   ========================================================================== */
(function(){
  'use strict';

  const PAGES = [
    ['histoire',     'NOTRE HISTOIRE',  'Qui sommes-nous'],
    ['pitch',        'THE PITCH',       'Équipe'],
    ['match',        'MATCH CENTER',    'Matchs'],
    ['season-hub',   'SEASON HUB',      'Saison 2026'],
    ['media',        'MEDIA CENTER',    'Actualités'],
    ['fanzone',      'FAN ZONE',        'Prédictions'],
    ['scouting',     'SCOUTING ROOM',   'Recrutement'],
    ['partners',     'PARTNERS LOUNGE', 'Partenaires'],
    ['locker',       'LOCKER ROOM',     'Accès joueurs'],
    ['coach-center', 'COMMAND CENTER',  'Staff']
  ];
  const IDS = PAGES.map(p => p[0]);
  /* Vraies adresses (SEO) : yulfc.com/equipe, /matchs... (les liens #pitch continuent de marcher) */
  const SLUGS = { 'histoire':'histoire', 'pitch':'equipe', 'match':'matchs', 'season-hub':'saison', 'media':'medias',
                  'fanzone':'fan-zone', 'scouting':'recrutement', 'partners':'partenaires' };
  const TITLES = {
    'histoire':'Notre histoire | YUL FC, club de soccer de Montréal',
    'pitch':'Effectif | YUL FC, soccer amateur à Montréal',
    'match':'Calendrier et résultats | YUL FC',
    'season-hub':'Saison, classement et stats | YUL FC',
    'media':'Médias, photos et vidéos | YUL FC',
    'fanzone':'Fan Zone | YUL FC',
    'scouting':'Rejoindre une équipe de soccer à Montréal | YUL FC recrute',
    'partners':'Devenir partenaire | YUL FC'
  };
  const BY_SLUG = Object.fromEntries(Object.entries(SLUGS).map(([k,v]) => [v,k]));
  const pathFor = page => SLUGS[page] ? '/' + SLUGS[page] : (page === 'home' ? '/' : '/');
  const pageFromPath = () => BY_SLUG[location.pathname.replace(/^\/+|\/+$/g, '')] || null;
  const BASE_TITLE = document.title;
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const current = () => root.getAttribute('data-page') || 'home';

  /* Quelle page contient cet élément ? (null = visible partout) */
  function pageOf(el){
    const host = el && el.closest && el.closest('body [data-view]');
    if(!host) return null;
    const views = host.getAttribute('data-view').split(/\s+/);
    if(views.includes(current())) return current();
    return views.find(v => v === 'home' || IDS.includes(v)) || null;
  }

  /* ---------- Fil d'Ariane + pagination (créés une seule fois) ---------- */
  const crumb = document.createElement('div');
  crumb.className = 'fx-crumb';
  const pager = document.createElement('nav');
  pager.className = 'fx-pager';
  pager.setAttribute('aria-label', 'Zone précédente / suivante');
  const firstView = document.querySelector('body > [data-view]');
  if(firstView) firstView.parentNode.insertBefore(crumb, firstView);
  const footer = document.querySelector('body > footer');
  if(footer) footer.parentNode.insertBefore(pager, footer); else document.body.appendChild(pager);

  function paint(page){
    const i = IDS.indexOf(page);
    if(i < 0){ crumb.innerHTML = ''; pager.innerHTML = ''; return; }
    const [, name, sub] = PAGES[i];
    crumb.innerHTML = `<a href="/">← Accueil</a><span class="fx-crumb-count">${name}</span>`;
    const prev = PAGES[i-1], next = PAGES[i+1];
    pager.innerHTML =
      (prev ? `<a href="${SLUGS[prev[0]] ? pathFor(prev[0]) : '#' + prev[0]}" class="prev"><span class="lab">← PRÉCÉDENT</span><span class="ttl">${prev[1]}</span></a>`
            : `<a href="/" class="prev"><span class="lab">← RETOUR</span><span class="ttl">ACCUEIL</span></a>`) +
      (next ? `<a href="${SLUGS[next[0]] ? pathFor(next[0]) : '#' + next[0]}" class="next"><span class="lab">SUIVANT →</span><span class="ttl">${next[1]}</span></a>`
            : `<a href="/" class="next"><span class="lab">RETOUR →</span><span class="ttl">ACCUEIL</span></a>`);
    document.title = TITLES[page] || `${name} · YUL FC`;
    void sub;
  }

  function markNav(page){
    document.querySelectorAll('#desktopNav a[data-section], #mobileMenu a[href^="#"], #mobileMenu a[href^="/"], footer a[href^="#"], footer a[href^="/"]').forEach(a => {
      a.classList.toggle('fx-cur', a.getAttribute('href') === '#' + page || (SLUGS[page] && a.getAttribute('href') === pathFor(page)));
    });
  }

  /* ---------- Transition ---------- */
  const wipe = document.createElement('div');
  wipe.className = 'fx-wipe'; wipe.setAttribute('aria-hidden', 'true');
  wipe.innerHTML = '<span></span>';
  document.body.appendChild(wipe);
  let busy = null;

  function apply(page, target){
    root.setAttribute('data-page', page);
    paint(page); markNav(page);
    if(page === 'home') document.title = BASE_TITLE;
    const nativeScroll = Element.prototype.__yulOrigScroll || Element.prototype.scrollIntoView;
    const html = root.style.scrollBehavior; root.style.scrollBehavior = 'auto';
    if(target && !(target.matches && target.matches('[data-view]')) && target.id !== 'top'){
      // la cible et son contenu s'affichent tout de suite (sinon l'animation d'apparition peut la laisser invisible)
      [target, ...target.querySelectorAll('.reveal')].forEach(el => el.classList && el.classList.add('in'));
      for(let a = target.parentElement; a && a !== document.body; a = a.parentElement) if(a.classList.contains('reveal')) a.classList.add('in');
      // défilement calculé (plus fiable que scrollIntoView sur iPhone)
      void nativeScroll;
      const y = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - 90;
      window.scrollTo(0, Math.max(0, y));
      setTimeout(() => { const y2 = target.getBoundingClientRect().top + window.pageYOffset - 90; if(Math.abs(y2 - window.pageYOffset) > 40) window.scrollTo(0, Math.max(0, y2)); }, 120);
      const field = target.querySelector('input:not([type=hidden]):not([tabindex="-1"]), textarea');
      if(field && target.id === 'partner-inquiry-form' && !window.matchMedia('(pointer:coarse)').matches) setTimeout(() => { try{ field.focus({ preventScroll: true }); }catch(e){} }, 350);
    } else {
      window.scrollTo(0, 0);
    }
    root.style.scrollBehavior = html;
    const firstShown = [...document.querySelectorAll('body > [data-view]')].find(el => el.offsetParent !== null || el.getClientRects().length);
    if(firstShown && !RM){ firstShown.classList.remove('fx-page-in'); void firstShown.offsetWidth; firstShown.classList.add('fx-page-in'); }
    window.dispatchEvent(new CustomEvent('yul:page', {detail:{page}}));
  }

  function go(page, target, animate){
    if(page === current() && !target){ window.scrollTo({top:0, behavior: RM ? 'auto' : 'smooth'}); return; }
    if(page === current()){ apply(page, target); return; }
    if(RM || !animate){ apply(page, target); return; }
    clearTimeout(busy);
    const i = IDS.indexOf(page);
    wipe.firstElementChild.textContent = i > -1 ? PAGES[i][1] : 'YUL FC';
    wipe.classList.remove('reveal'); wipe.style.transition = 'none'; wipe.style.transform = '';
    void wipe.offsetWidth; wipe.style.transition = '';
    wipe.classList.add('cover');
    busy = setTimeout(() => {
      apply(page, target);
      wipe.classList.add('reveal');
      busy = setTimeout(() => { wipe.classList.remove('cover', 'reveal'); }, 460);
    }, 360);
  }

  /* Résout un hash (#pitch, #partner-inquiry-form, #top...) */
  function resolve(hash){
    if(hash && hash[0] === '/'){
      const [path, frag] = hash.split('#');
      const pg = BY_SLUG[path.replace(/^\/+|\/+$/g, '')];
      if(path === '/' || path === '') return frag ? resolve('#' + frag) : {page:'home', target:null};
      if(!pg) return null;
      const t = frag && document.getElementById(frag);
      return {page:pg, target:t || null};
    }
    const id = (hash || '').replace(/^#/, '');
    if(!id || id === 'top') return {page:'home', target:null};
    if(IDS.includes(id)) return {page:id, target:null};
    const el = document.getElementById(id);
    if(!el) return null;
    const p = pageOf(el);
    return p ? {page:p, target:el} : null;
  }

  /* ---------- Clics sur les liens internes ---------- */
  document.addEventListener('click', e => {
    if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"], a[href^="/"]');
    if(!a || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if(href === '#' || href.length < 1) return; // liens-boutons gérés par le site
    if(href[0] === '/' && href !== '/' && !BY_SLUG[href.split('#')[0].replace(/^\/+|\/+$/g, '')]) return; // autre page du site
    const r = resolve(href);
    if(!r) return;
    e.preventDefault();
    const url = urlFor(r, href);
    if(location.pathname + location.hash !== url) history.pushState({yul:r.page}, '', url);
    go(r.page, r.target, true);
  });

  /* Adresse affichée pour une destination : /equipe, /partenaires#partner-inquiry-form, /... */
  function urlFor(r, href){
    const base = pathFor(r.page);
    if(r.target && r.target.id) return (SLUGS[r.page] || r.page === 'home' ? base : '') + '#' + r.target.id;
    if(SLUGS[r.page] || r.page === 'home') return base;
    return '#' + r.page; // pages privées (vestiaire, staff) : garde le #
  }
  function fromLocation(){
    const pg = pageFromPath();
    if(pg){
      const t = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
      return {page:pg, target: t && pageOf(t) === pg ? t : null};
    }
    return resolve(location.hash);
  }

  /* Boutons précédent / suivant du navigateur */
  window.addEventListener('popstate', () => {
    const r = fromLocation() || {page:'home', target:null};
    go(r.page, r.target, true);
  });
  window.addEventListener('hashchange', () => {
    const r = fromLocation();
    if(r && (r.page !== current() || r.target)) go(r.page, r.target, false);
  });

  /* ---------- scrollIntoView du code existant → ouvre la bonne page ---------- */
  const orig = Element.prototype.scrollIntoView;
  Element.prototype.__yulOrigScroll = orig;
  Element.prototype.scrollIntoView = function(){
    const p = pageOf(this);
    if(p && p !== current()){
      const isRoot = this.matches('body > [data-view]');
      if(SLUGS[p] || p === 'home'){ const u = pathFor(p); if(location.pathname !== u) history.pushState({yul:p}, '', u); }
      go(p, isRoot ? null : this, true);
      return;
    }
    return orig.apply(this, arguments);
  };

  /* ---------- Démarrage ---------- */
  const start = fromLocation() || {page:'home', target:null};
  // anciens liens yulfc.com/#pitch → yulfc.com/equipe
  if(!pageFromPath() && SLUGS[start.page] && !start.target) history.replaceState(history.state, '', pathFor(start.page) + location.search);
  /* Les liens #page deviennent de vraies adresses (lisibles par Google) */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href').slice(1);
    if(SLUGS[id]) a.setAttribute('href', pathFor(id));
    else if(id === 'top') a.setAttribute('href', '/');
  });
  apply(start.page, start.target);
  window.YULRouter = { go: (page) => { if(SLUGS[page] || page === 'home'){ const u = pathFor(page); if(location.pathname !== u) history.pushState({yul:page}, '', u); } go(page, null, true); }, current, pathFor };
})();
