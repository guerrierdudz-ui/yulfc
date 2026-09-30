/* ==========================================================================
   YUL FX — couche "spectacle" pour YUL FC Digital Stadium
   Script autonome, chargé en fin de <body>. Aucune dépendance.
   Chaque module est isolé dans un try/catch : si l'un échoue, le site
   continue de fonctionner normalement.
   ========================================================================== */
(function(){
  'use strict';

  const RM    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE  = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const MOBILE= () => window.innerWidth <= 900;
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const buzz = (ms=8) => { try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} };
  const safe = (name, fn) => { try{ fn(); }catch(e){ console.warn('[YUL FX] ' + name, e); } };

  /* État partagé du scroll (une seule écoute, rAF) */
  let scrollY = window.scrollY, lastY = scrollY, velocity = 0;
  const onScrollFns = [];
  let ticking = false;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    if(!ticking){
      ticking = true;
      requestAnimationFrame(() => {
        velocity = scrollY - lastY; lastY = scrollY;
        onScrollFns.forEach(f => f(scrollY, velocity));
        ticking = false;
      });
    }
  }, {passive:true});

  /* ------------------------------------------------------------------
     0. Correctif REVEAL : sur mobile, les sections très hautes n'atteignent
        jamais 15 % de visibilité → elles restaient invisibles.
        On observe avec un seuil 0 + marge, y compris pour le contenu
        injecté dynamiquement.
     ------------------------------------------------------------------ */
  safe('reveal', () => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold:0, rootMargin:'0px 0px -8% 0px'});
    const scan = root => $$('.reveal:not(.in)', root).forEach(el => io.observe(el));
    scan(document);
    new MutationObserver(muts => {
      for(const m of muts) for(const n of m.addedNodes) if(n.nodeType === 1){
        if(n.classList.contains('reveal') && !n.classList.contains('in')) io.observe(n);
        else if(n.querySelector) scan(n);
      }
    }).observe(document.body, {childList:true, subtree:true});
  });

  /* ------------------------------------------------------------------
     1. Barre de progression
     ------------------------------------------------------------------ */
  safe('progress', () => {
    const bar = document.createElement('div');
    bar.className = 'fx-progress';
    document.body.appendChild(bar);
    const upd = y => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? clamp(y / h, 0, 1) : 0})`;
    };
    onScrollFns.push(upd); upd(scrollY);
  });

  /* ------------------------------------------------------------------
     2. HERO : projecteurs de stade, étincelles, parallax, motto animé
     ------------------------------------------------------------------ */
  const hero = $('.hero');
  safe('hero-split', () => {
    const motto = hero && $('.hero-motto', hero);
    if(!motto || RM) return;
    let i = 0;
    $$('span', motto).forEach((span, si) => {
      const txt = span.textContent;
      span.setAttribute('aria-label', txt);
      span.classList.add('fx-split');
      span.innerHTML = [...txt].map(ch => ch === ' '
        ? '<span class="fx-sp" aria-hidden="true"> </span>'
        : `<span class="fx-ch" aria-hidden="true" style="--i:${i++};--d:${si*120}ms">${ch}</span>`).join('');
    });
    // Rejouer l'animation au moment où l'intro se ferme
    const intro = $('#intro');
    if(intro && !intro.classList.contains('hide')){
      motto.style.visibility = 'hidden';
      const reveal = () => { motto.style.visibility = ''; $$('.fx-ch', motto).forEach(c => { c.style.animation = 'none'; c.offsetWidth; c.style.animation = ''; }); };
      new MutationObserver((m, obs) => { if(intro.classList.contains('hide')){ reveal(); obs.disconnect(); } })
        .observe(intro, {attributes:true, attributeFilter:['class']});
      setTimeout(() => { if(motto.style.visibility === 'hidden') reveal(); }, 6000);
    }
  });

  safe('hero-canvas', () => {
    if(!hero || RM) return;
    const cv = document.createElement('canvas');
    cv.className = 'fx-hero-canvas';
    cv.setAttribute('aria-hidden', 'true');
    const photo = $('.hero-photo', hero);
    photo ? photo.after(cv) : hero.prepend(cv);
    const ctx = cv.getContext('2d');
    let W=0, H=0, DPR=1, visible=true, t=0, raf=0;
    let px=.5, py=.3; // position du "regard" des projecteurs
    const sparks = [];
    const N = () => MOBILE() ? 45 : 110;

    function resize(){
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W*DPR; cv.height = H*DPR;
      ctx.setTransform(DPR,0,0,DPR,0,0);
      while(sparks.length < N()) sparks.push(newSpark(true));
      sparks.length = N();
    }
    function newSpark(init){
      return {
        x: Math.random()*W, y: init ? Math.random()*H : H + 10,
        r: Math.random()*1.8 + .4, vy: -(Math.random()*.5 + .15), vx:(Math.random()-.5)*.25,
        a: Math.random()*.6 + .2, tw: Math.random()*Math.PI*2,
        gold: Math.random() < .75
      };
    }
    function beam(x0, y0, angle, spread, alpha){
      const len = Math.hypot(W, H) * 1.1;
      const a1 = angle - spread, a2 = angle + spread;
      const g = ctx.createRadialGradient(x0, y0, 0, x0, y0, len);
      g.addColorStop(0, `rgba(255,244,214,${alpha})`);
      g.addColorStop(.35, `rgba(240,180,41,${alpha*.35})`);
      g.addColorStop(1, 'rgba(240,180,41,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + Math.cos(a1)*len, y0 + Math.sin(a1)*len);
      ctx.lineTo(x0 + Math.cos(a2)*len, y0 + Math.sin(a2)*len);
      ctx.closePath(); ctx.fill();
      // halo de la lampe
      const h = ctx.createRadialGradient(x0, y0, 0, x0, y0, 60);
      h.addColorStop(0, `rgba(255,250,235,${alpha*2.2})`); h.addColorStop(1, 'rgba(255,250,235,0)');
      ctx.fillStyle = h; ctx.beginPath(); ctx.arc(x0, y0, 60, 0, Math.PI*2); ctx.fill();
    }
    function frame(){
      raf = 0;
      if(!visible || document.hidden) return;
      t += 0.008;
      ctx.clearRect(0,0,W,H);
      const sway = Math.sin(t) * .06;
      const tx = px * W, ty = H * (.55 + py*.3);
      const L = [-W*.05, -H*.08], R = [W*1.05, -H*.08];
      beam(L[0], L[1], Math.atan2(ty - L[1], tx - W*.18 - L[0]) + sway, .09, .10);
      beam(R[0], R[1], Math.atan2(ty - R[1], tx + W*.18 - R[0]) - sway, .09, .10);
      if(!MOBILE()) beam(W*.5, -H*.2, Math.PI/2 + Math.sin(t*.7)*.25, .06, .05);
      for(const s of sparks){
        s.x += s.vx + Math.sin(t*3 + s.tw)*.15; s.y += s.vy; s.tw += .05;
        if(s.y < -10) Object.assign(s, newSpark(false));
        const a = s.a * (.6 + .4*Math.sin(s.tw));
        ctx.fillStyle = s.gold ? `rgba(240,180,41,${a})` : `rgba(160,190,255,${a*.8})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if(!raf) raf = requestAnimationFrame(frame); };
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }).observe(hero);
    document.addEventListener('visibilitychange', kick);
    window.addEventListener('resize', resize, {passive:true});
    resize(); kick();

    // Parallax pointeur (desktop) / gyroscope (Android)
    const img = $('.hero-photo-img', hero);
    const setTilt = (nx, ny) => {
      px = .5 + nx*.35; py = .3 + ny*.3;
      if(img){ hero.style.setProperty('--fx-px', (-nx*18)+'px'); hero.style.setProperty('--fx-py', (-ny*12)+'px'); }
    };
    if(FINE){
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        setTilt((e.clientX - r.left)/r.width - .5, (e.clientY - r.top)/r.height - .5);
      });
      hero.addEventListener('pointerleave', () => setTilt(0,0));
    } else if('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function'){
      window.addEventListener('deviceorientation', e => {
        if(e.gamma == null) return;
        setTilt(clamp(e.gamma/40, -.5, .5), clamp((e.beta-45)/60, -.5, .5));
      }, {passive:true});
    }

    // Parallax au scroll : la photo zoome, le contenu s'efface
    onScrollFns.push(y => {
      const h = hero.offsetHeight || 1;
      if(y > h * 1.2) return;
      const p = clamp(y / h, 0, 1);
      hero.style.setProperty('--fx-sy', (y*.35)+'px');
      hero.style.setProperty('--fx-sc', (1.08 + p*.12).toFixed(3));
      hero.style.setProperty('--fx-cy', (y*.18)+'px');
      hero.style.setProperty('--fx-co', (1 - p*1.1).toFixed(3));
    });
  });

  /* ------------------------------------------------------------------
     3. Bandeau défilant sous le hero
     ------------------------------------------------------------------ */
  safe('marquee', () => {
    if(!hero) return;
    const words = ['ON VIENT.', 'ON GAGNE.', 'YUL FC', 'MONTRÉAL', 'SAISON 01', 'LSAQ', 'DIGITAL STADIUM'];
    const unit = words.map((w,i) => `<span class="${i%2 ? 'on' : ''}">${w}</span><span class="star">★</span>`).join('');
    const m = document.createElement('div');
    m.className = 'fx-marquee'; m.setAttribute('aria-hidden','true');
    m.innerHTML = `<div class="fx-marquee-track">${unit.repeat(4)}</div>`;
    m.setAttribute('data-view', 'home'); // visible sur l'accueil seulement
    hero.after(m);
    if(RM) return;
    const track = m.firstElementChild;
    let x = 0, speed = 0, half = 0, inView = false;
    const measure = () => { half = track.scrollWidth / 2; };
    measure(); window.addEventListener('resize', measure, {passive:true});
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; if(inView) loop(); }).observe(m);
    onScrollFns.push((y, v) => { speed = clamp(v * .6, -40, 40); });
    function loop(){
      if(!inView) return;
      speed *= .92;
      x -= 1 + Math.abs(speed);
      if(-x >= half) x += half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(loop);
    }
  });

  /* ------------------------------------------------------------------
     4. Titres de section révélés par balayage
     ------------------------------------------------------------------ */
  safe('titles', () => {
    if(RM) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('fx-in'); io.unobserve(en.target); } });
    }, {threshold:0, rootMargin:'0px 0px -12% 0px'});
    $$('section .section-title').forEach(el => { el.classList.add('fx-title'); io.observe(el); });
  });

  /* ------------------------------------------------------------------
     5. Cartes joueurs : tilt 3D + reflet holo (délégué → marche aussi
        pour les cartes générées dynamiquement)
     ------------------------------------------------------------------ */
  safe('tilt', () => {
    if(RM) return;
    let active = null;
    const ensureGlare = card => {
      if(!card.querySelector(':scope > .fx-glare')){
        const g = document.createElement('div'); g.className = 'fx-glare'; card.appendChild(g);
      }
    };
    const move = (card, cx, cy) => {
      const r = card.getBoundingClientRect();
      const nx = (cx - r.left)/r.width, ny = (cy - r.top)/r.height;
      card.style.setProperty('--ry', ((nx - .5) * 18).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((.5 - ny) * 14).toFixed(2) + 'deg');
      card.style.setProperty('--gx', (nx*100).toFixed(1) + '%');
      card.style.setProperty('--gy', (ny*100).toFixed(1) + '%');
      card.style.setProperty('--hx', (nx*100).toFixed(1) + '%');
      card.style.setProperty('--hy', (ny*100).toFixed(1) + '%');
    };
    const leave = card => { card.classList.remove('fx-tilting'); card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); };

    if(FINE){
      document.addEventListener('pointermove', e => {
        const card = e.target.closest && e.target.closest('.player-card');
        if(active && active !== card){ leave(active); active = null; }
        if(!card) return;
        ensureGlare(card);
        active = card; card.classList.add('fx-tilting');
        move(card, e.clientX, e.clientY);
      }, {passive:true});
    } else {
      // Mobile : petit effet de pression + reflet qui suit le doigt
      document.addEventListener('touchstart', e => {
        const card = e.target.closest && e.target.closest('.player-card, .pillar-card, .hub-card, .map-tile, .btn-primary');
        if(!card) return;
        card.classList.add('fx-press'); buzz(6);
        if(card.classList.contains('player-card')){ ensureGlare(card); card.classList.add('fx-tilting'); move(card, e.touches[0].clientX, e.touches[0].clientY); }
        const end = () => { card.classList.remove('fx-press'); leave(card); card.removeEventListener('touchend', end); card.removeEventListener('touchcancel', end); };
        card.addEventListener('touchend', end); card.addEventListener('touchcancel', end);
      }, {passive:true});
    }
  });

  /* ------------------------------------------------------------------
     6. Projecteur sous le pointeur sur les cartes (desktop)
     ------------------------------------------------------------------ */
  safe('spotlight', () => {
    if(!FINE || RM) return;
    const SEL = '.pillar-card, .hub-card, .map-tile, .demo-card, .stat-cell, .mc-kpi';
    const prep = el => {
      if(el.dataset.fxSpot) return; el.dataset.fxSpot = '1';
      el.classList.add('fx-spot');
      const g = document.createElement('span'); g.className = 'fx-spot-glow'; g.setAttribute('aria-hidden','true');
      el.prepend(g);
    };
    document.addEventListener('pointermove', e => {
      const el = e.target.closest && e.target.closest(SEL);
      if(!el) return;
      prep(el);
      const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--sy', (e.clientY - r.top) + 'px');
    }, {passive:true});
  });

  /* ------------------------------------------------------------------
     7. Boutons magnétiques (desktop)
     ------------------------------------------------------------------ */
  safe('magnetic', () => {
    if(!FINE || RM) return;
    $$('.btn-primary, .btn-ghost, .nav-cta, .locker-link').forEach(b => {
      b.classList.add('fx-mag');
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2);
        b.style.transform = `translate(${dx*.22}px, ${dy*.3}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  });

  /* ------------------------------------------------------------------
     8. Compte à rebours : chaque chiffre qui change "flippe"
     ------------------------------------------------------------------ */
  safe('countdown-flip', () => {
    if(RM) return;
    const SEL = '.countdown .num, .mp-countdown .n, .hub-countdown .n';
    const last = new WeakMap();
    const check = el => {
      const v = el.textContent;
      if(last.has(el) && last.get(el) !== v){
        el.classList.remove('fx-tick'); void el.offsetWidth; el.classList.add('fx-tick');
      }
      last.set(el, v);
    };
    new MutationObserver(muts => {
      for(const m of muts){
        const el = (m.target.nodeType === 3 ? m.target.parentElement : m.target);
        const hit = el && el.closest && el.closest(SEL);
        if(hit) check(hit);
      }
    }).observe(document.body, {childList:true, characterData:true, subtree:true});
  });

  /* ------------------------------------------------------------------
     9. Son d'ambiance (synthétisé, aucun fichier) — désactivé par défaut
     ------------------------------------------------------------------ */
  let audioCtx = null, soundOn = false;
  try{ soundOn = localStorage.getItem('yulfx-sound') === '1'; }catch(e){}
  function roar(){
    if(!soundOn) return;
    try{
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx, dur = 2.4, n = ctx.sampleRate * dur;
      const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      for(let i=0;i<n;i++) d[i] = (Math.random()*2-1);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = .6;
      const g = ctx.createGain(); const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(.35, now+.25); g.gain.exponentialRampToValueAtTime(.001, now+dur);
      bp.frequency.linearRampToValueAtTime(1500, now+.4);
      src.connect(bp).connect(g).connect(ctx.destination); src.start();
      // coup de sifflet
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(2900, now); o.frequency.setValueAtTime(3100, now+.08);
      og.gain.setValueAtTime(.05, now); og.gain.exponentialRampToValueAtTime(.001, now+.35);
      o.connect(og).connect(ctx.destination); o.start(now); o.stop(now+.4);
    }catch(e){}
  }
  safe('sound-toggle', () => {
    const b = document.createElement('button');
    b.className = 'fx-sound'; b.type = 'button';
    b.setAttribute('aria-label', 'Son des célébrations'); b.setAttribute('aria-pressed', String(soundOn));
    b.innerHTML = '<svg class="fx-on" viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/></svg>'
                + '<svg class="fx-off" viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
    b.addEventListener('click', () => {
      soundOn = !soundOn; b.setAttribute('aria-pressed', String(soundOn));
      try{ localStorage.setItem('yulfx-sound', soundOn ? '1' : '0'); }catch(e){}
      if(soundOn) roar(); buzz(10);
    });
    document.body.appendChild(b);
  });

  /* ------------------------------------------------------------------
     10. Célébration : confettis bleu/or + "BUT !" + tremblement
     ------------------------------------------------------------------ */
  let celebrating = false;
  function celebrate(word){
    if(celebrating) return; celebrating = true;
    buzz([30, 40, 60]); roar();
    if(RM){ celebrating = false; return; }
    const flash = document.createElement('div'); flash.className = 'fx-flash'; document.body.appendChild(flash);
    const w = document.createElement('div'); w.className = 'fx-goal-word'; w.textContent = word || 'BUT !'; document.body.appendChild(w);
    document.body.classList.add('fx-shake');
    const cv = document.createElement('canvas'); cv.className = 'fx-confetti'; document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); const DPR = Math.min(devicePixelRatio||1, 2);
    const W = innerWidth, H = innerHeight; cv.width = W*DPR; cv.height = H*DPR; ctx.scale(DPR, DPR);
    const colors = ['#F0B429', '#FCE7A6', '#2F6BFF', '#FFFFFF', '#1B2E5C', '#F0B429'];
    const count = MOBILE() ? 140 : 260, P = [];
    for(let i=0;i<count;i++){
      const fromLeft = i % 2 === 0;
      P.push({
        x: fromLeft ? -10 : W+10, y: H*(.55 + Math.random()*.4),
        vx: (fromLeft ? 1 : -1) * (Math.random()*9 + 5), vy: -(Math.random()*14 + 8),
        w: Math.random()*8 + 5, h: Math.random()*5 + 3, rot: Math.random()*6, vr: (Math.random()-.5)*.4,
        c: colors[i % colors.length], life: 0
      });
    }
    const t0 = performance.now();
    (function step(now){
      const el = now - t0;
      ctx.clearRect(0,0,W,H);
      for(const p of P){
        p.vy += .32; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.rot*2)); // effet de rotation 3D
        ctx.fillStyle = p.c; ctx.globalAlpha = clamp(1 - (el-2600)/800, 0, 1);
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
      }
      if(el < 3400) requestAnimationFrame(step);
      else { cv.remove(); flash.remove(); w.remove(); document.body.classList.remove('fx-shake'); celebrating = false; }
    })(t0);
  }
  window.YULFX = { celebrate };

  safe('celebrate-hooks', () => {
    // a) Quand le site affiche son "GOAL toast" existant
    const toast = $('#goalToast');
    if(toast){
      new MutationObserver(() => { if(toast.classList.contains('show')) celebrate('BUT !'); })
        .observe(toast, {attributes:true, attributeFilter:['class']});
    }
    // b) Bouton dans le hero
    const actions = hero && $('.hero-actions', hero);
    if(actions){
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'fx-celebrate';
      b.innerHTML = '<span class="ball">⚽</span> CÉLÉBRER UN BUT';
      b.addEventListener('click', () => celebrate('BUT !'));
      actions.after(b);
    }
    // c) Easter egg : 5 taps rapides sur le logo
    const logo = $('header .brand');
    if(logo){
      let taps = 0, timer;
      logo.addEventListener('click', () => {
        taps++; clearTimeout(timer); timer = setTimeout(() => taps = 0, 1200);
        if(taps >= 5){ taps = 0; celebrate('YUL FC !'); }
      });
    }
  });

  /* ------------------------------------------------------------------
     11. Dock mobile façon application
     ------------------------------------------------------------------ */
  safe('dock', () => {
    const items = [
      ['top',        'ACCUEIL', '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
      ['pitch',      'ÉQUIPE',  '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.5c2.6.2 4.4 1.9 5 4.5"/>'],
      ['match',      'MATCHS',  '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/><path d="M12 3v4M21 10l-5 0M3 10h5M7 20l2.5-5.5M17 20l-2.5-5.5"/>'],
      ['data-center','STATS',   '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],
      ['fanzone',    'FAN ZONE','<path d="M12 21s-7-4.4-9.3-9C1.3 8.6 3.6 5 7 5c2 0 3.4 1 5 3 1.6-2 3-3 5-3 3.4 0 5.7 3.6 4.3 7-2.3 4.6-9.3 9-9.3 9z"/>']
    ].filter(([id]) => document.getElementById(id));
    if(items.length < 3) return;
    const dock = document.createElement('nav');
    dock.className = 'fx-dock'; dock.setAttribute('aria-label', 'Navigation rapide');
    dock.innerHTML = '<span class="fx-dock-pill" aria-hidden="true"></span>' + items.map(([id, label, svg]) =>
      `<a href="#${id}" data-fx-sec="${id}"><svg viewBox="0 0 24 24" aria-hidden="true">${svg}</svg>${label}</a>`).join('');
    document.body.appendChild(dock);
    document.body.classList.add('fx-has-dock');
    const pill = $('.fx-dock-pill', dock), links = $$('a', dock);
    const setOn = id => {
      links.forEach(a => a.classList.toggle('on', a.dataset.fxSec === id));
      const on = links.find(a => a.dataset.fxSec === id);
      if(on){ pill.style.opacity = '1'; pill.style.width = on.offsetWidth + 'px'; pill.style.transform = `translateX(${on.offsetLeft}px)`; } else pill.style.opacity = '0';
    };
    links.forEach(a => a.addEventListener('click', () => { buzz(8); setOn(a.dataset.fxSec); }));
    // Onglet actif = page courante (YUL Router) ; autres pages → aucun onglet
    const pageToTab = p => p === 'home' ? 'top' : p;
    const cur = () => pageToTab(window.YULRouter ? window.YULRouter.current() : 'home');
    window.addEventListener('yul:page', e => { setOn(pageToTab(e.detail.page)); dock.classList.remove('fx-hidden'); });
    onScrollFns.push((y, v) => {
      // se cache en descendant, réapparaît en remontant
      if(y > 400 && v > 6) dock.classList.add('fx-hidden');
      else if(v < -6 || y < 400) dock.classList.remove('fx-hidden');
    });
    requestAnimationFrame(() => setOn(cur()));
    window.addEventListener('resize', () => setOn((links.find(a => a.classList.contains('on')) || links[0]).dataset.fxSec), {passive:true});
  });

})();
