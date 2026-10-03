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
    ['data-center',  'DATA CENTER',     'Statistiques'],
    ['media',        'MEDIA CENTER',    'Actualités'],
    ['fanzone',      'FAN ZONE',        'Prédictions'],
    ['scouting',     'SCOUTING ROOM',   'Recrutement'],
    ['partners',     'PARTNERS LOUNGE', 'Partenaires'],
    ['locker',       'LOCKER ROOM',     'Accès joueurs'],
    ['coach-center', 'COMMAND CENTER',  'Staff']
  ];
  const IDS = PAGES.map(p => p[0]);
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
    crumb.innerHTML = `<a href="#top">← Accueil</a><span class="fx-crumb-count"><b>${String(i+1).padStart(2,'0')}</b> / ${String(PAGES.length).padStart(2,'0')} · ${name}</span>`;
    const prev = PAGES[i-1], next = PAGES[i+1];
    pager.innerHTML =
      (prev ? `<a href="#${prev[0]}" class="prev"><span class="lab">← PRÉCÉDENT</span><span class="ttl">${prev[1]}</span></a>`
            : `<a href="#top" class="prev"><span class="lab">← RETOUR</span><span class="ttl">ACCUEIL</span></a>`) +
      (next ? `<a href="#${next[0]}" class="next"><span class="lab">SUIVANT →</span><span class="ttl">${next[1]}</span></a>`
            : `<a href="#top" class="next"><span class="lab">RETOUR →</span><span class="ttl">ACCUEIL</span></a>`);
    document.title = `${name} · YUL FC`;
    void sub;
  }

  function markNav(page){
    document.querySelectorAll('#desktopNav a[data-section], #mobileMenu a[href^="#"], footer a[href^="#"]').forEach(a => {
      a.classList.toggle('fx-cur', a.getAttribute('href') === '#' + page);
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
      nativeScroll.call(target, {block:'start'});
      window.scrollBy(0, -90);
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
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if(!a) return;
    const href = a.getAttribute('href');
    if(href === '#' || href.length < 2) return; // liens-boutons gérés par le site
    const r = resolve(href);
    if(!r) return;
    e.preventDefault();
    const hash = r.page === 'home' && !r.target ? location.pathname + location.search : href;
    if(location.hash !== href) history.pushState({yul:r.page}, '', hash);
    go(r.page, r.target, true);
  });

  /* Boutons précédent / suivant du navigateur */
  window.addEventListener('popstate', () => {
    const r = resolve(location.hash) || {page:'home', target:null};
    go(r.page, r.target, true);
  });
  window.addEventListener('hashchange', () => {
    const r = resolve(location.hash);
    if(r && (r.page !== current() || r.target)) go(r.page, r.target, false);
  });

  /* ---------- scrollIntoView du code existant → ouvre la bonne page ---------- */
  const orig = Element.prototype.scrollIntoView;
  Element.prototype.__yulOrigScroll = orig;
  Element.prototype.scrollIntoView = function(){
    const p = pageOf(this);
    if(p && p !== current()){
      const isRoot = this.matches('body > [data-view]');
      go(p, isRoot ? null : this, true);
      return;
    }
    return orig.apply(this, arguments);
  };

  /* ---------- Démarrage ---------- */
  const start = resolve(location.hash) || {page:'home', target:null};
  apply(start.page, start.target);
  window.YULRouter = { go: (page) => go(page, null, true), current };
})();
