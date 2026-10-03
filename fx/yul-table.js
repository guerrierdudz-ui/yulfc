/* ==========================================================================
   YUL Table : classement moderne (Season Hub > onglet Classement)
   Remplace l'affichage d'origine (renderShTable) sans toucher aux données :
   le classement vient toujours de la saison choisie dans le Season Hub.
   - Podium des 3 premiers
   - Tableau complet lisible sur ordinateur, lignes compactes sur mobile
     (toucher une ligne pour voir le détail)
   - Barre de points, rangée YUL FC mise en avant, bouton "Voir YUL FC"
   ========================================================================== */
(function(){
  'use strict';
  if(typeof window.renderShTable !== 'function') return;

  const L = {
    fr: { final:'CLASSEMENT FINAL', live:'SAISON EN COURS', complete:'SAISON TERMINÉE', progress:'EN COURS',
          teams:'équipes', club:'Club', p:'MJ', w:'V', d:'N', l:'D', gf:'BP', ga:'BC', gd:'DB', pts:'Pts',
          pFull:'Matchs joués', wFull:'Victoires', dFull:'Nuls', lFull:'Défaites', gfFull:'Buts pour', gaFull:'Buts contre', gdFull:'Différence de buts', ptsFull:'Points',
          champion:'CHAMPION', you:'YUL', seeYul:'Voir YUL FC', points:'points', pos:'Position',
          empty:'CLASSEMENT PAS ENCORE DISPONIBLE.', emptyP:'Le classement sera affiché dès que le staff l\'aura entré dans le Command Center.',
          legendChamp:'Champion', legendYul:'YUL FC', legendBar:'Barre : points par rapport au 1er', details:'Détails' },
    en: { final:'FINAL TABLE', live:'LIVE SEASON', complete:'SEASON COMPLETE', progress:'IN PROGRESS',
          teams:'teams', club:'Club', p:'P', w:'W', d:'D', l:'L', gf:'GF', ga:'GA', gd:'GD', pts:'Pts',
          pFull:'Played', wFull:'Wins', dFull:'Draws', lFull:'Losses', gfFull:'Goals for', gaFull:'Goals against', gdFull:'Goal difference', ptsFull:'Points',
          champion:'CHAMPION', you:'YUL', seeYul:'Find YUL FC', points:'points', pos:'Position',
          empty:'TABLE NOT YET AVAILABLE.', emptyP:'The table will appear as soon as staff enter it in the Command Center.',
          legendChamp:'Champion', legendYul:'YUL FC', legendBar:'Bar: points compared to 1st', details:'Details' }
  };
  const lang = () => (window.YULi18n && window.YULi18n.get && window.YULi18n.get() === 'en') ? 'en' : 'fr';
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function crest(r){
    let inner = '';
    try{ inner = clubLogoHtml(r); }catch(e){ inner = ''; }
    const hasImg = /<img/i.test(inner);
    return `<span class="yt-crest${hasImg ? '' : ' initials'}" aria-hidden="true">${inner || esc(r.club.slice(0, 2).toUpperCase())}</span>`;
  }
  const signed = n => (n > 0 ? '+' : '') + n;
  const gdClass = n => n > 0 ? 'pos' : n < 0 ? 'neg' : 'zero';

  function podium(table, t, isFinal, maxPts){
    const top = table.slice(0, 3);
    if(top.length < 3) return '';
    const card = (r, i) => {
      const pos = i + 1, gd = r.gf - r.ga;
      return `<div class="yt-pod p${pos}${r.isYul ? ' is-yul' : ''}" style="--d:${[1, 0, 2][i] * 90}ms">
        <div class="yt-pod-rank">${pos}</div>
        ${isFinal && pos === 1 ? `<div class="yt-pod-crown">🏆<span> ${t.champion}</span></div>` : ''}
        <div class="yt-pod-crest">${crest(r)}</div>
        <div class="yt-pod-name">${esc(r.club)}</div>
        <div class="yt-pod-pts"><b data-yt-count="${r.pts}">${r.pts}</b><span>${t.points}</span></div>
        <div class="yt-pod-rec">${r.w}${t.w} · ${r.d}${t.d} · ${r.l}${t.l}<span class="gd-part"> · <span class="${gdClass(gd)}">${signed(gd)}</span></span></div>
      </div>`;
    };
    // ordre visuel 2 · 1 · 3
    return `<div class="yt-podium">${card(top[1], 1)}${card(top[0], 0)}${card(top[2], 2)}</div>`;
  }

  function render(){
    let sf;
    try{ sf = currentSeasonData(); }catch(e){ return; }
    try{ if(typeof renderYulDataStrip === 'function') renderYulDataStrip(); }catch(e){}
    const el = document.getElementById('shTableWrap'); if(!el) return;
    const t = L[lang()];
    const table = (sf && sf.table) || [];
    if(!table.length){
      el.innerHTML = `<div class="empty-state"><div class="es-title">${t.empty}</div><p>${t.emptyP}</p></div>`;
      return;
    }
    const isFinal = sf.status === 'completed';
    const maxPts = Math.max(1, ...table.map(r => r.pts || 0));
    const yulIdx = table.findIndex(r => r.isYul);
    const head = `<div class="yt-row yt-hrow" role="row">
        <span class="c-pos" role="columnheader" title="${t.pos}">#</span>
        <span class="c-club" role="columnheader">${t.club}</span>
        <span class="c-n" role="columnheader" title="${t.pFull}">${t.p}</span>
        <span class="c-n" role="columnheader" title="${t.wFull}">${t.w}</span>
        <span class="c-n" role="columnheader" title="${t.dFull}">${t.d}</span>
        <span class="c-n" role="columnheader" title="${t.lFull}">${t.l}</span>
        <span class="c-n c-goals" role="columnheader" title="${t.gfFull}">${t.gf}</span>
        <span class="c-n c-goals" role="columnheader" title="${t.gaFull}">${t.ga}</span>
        <span class="c-gd" role="columnheader" title="${t.gdFull}">${t.gd}</span>
        <span class="c-pts" role="columnheader" title="${t.ptsFull}">${t.pts}</span>
      </div>`;
    const rows = table.map((r, i) => {
      const pos = i + 1, gd = r.gf - r.ga, pct = Math.round((r.pts / maxPts) * 100);
      const champ = isFinal && pos === 1;
      const cls = ['yt-row', 'yt-team', r.isYul ? 'is-yul' : '', pos <= 3 ? 'top' + pos : ''].join(' ');
      return `<div class="${cls}" role="row" style="--i:${i};--pct:${pct}%" data-pos="${pos}">
        <button type="button" class="yt-hit" aria-expanded="false" aria-label="${esc(r.club)} · ${t.pos} ${pos} · ${r.pts} ${t.points}"></button>
        <span class="c-pos" role="cell"><span class="yt-pos">${pos}</span></span>
        <span class="c-club" role="cell">
          ${crest(r)}
          <span class="yt-name">
            <span class="yt-club">${esc(r.club)}${r.isYul ? `<span class="yt-you">${t.you}</span>` : ''}${champ ? `<span class="yt-champ">🏆<span> ${t.champion}</span></span>` : ''}</span>
            <span class="yt-mini">${r.p} ${t.p} · ${r.w}${t.w} ${r.d}${t.d} ${r.l}${t.l}</span>
          </span>
        </span>
        <span class="c-n" role="cell">${r.p}</span>
        <span class="c-n" role="cell">${r.w}</span>
        <span class="c-n" role="cell">${r.d}</span>
        <span class="c-n" role="cell">${r.l}</span>
        <span class="c-n c-goals" role="cell">${r.gf}</span>
        <span class="c-n c-goals" role="cell">${r.ga}</span>
        <span class="c-gd ${gdClass(gd)}" role="cell">${signed(gd)}</span>
        <span class="c-pts" role="cell"><b>${r.pts}</b></span>
        <span class="yt-bar" aria-hidden="true"><i></i></span>
        <span class="yt-more" role="cell">
          <span><em>${t.pFull}</em><b>${r.p}</b></span>
          <span><em>${t.wFull}</em><b>${r.w}</b></span>
          <span><em>${t.dFull}</em><b>${r.d}</b></span>
          <span><em>${t.lFull}</em><b>${r.l}</b></span>
          <span><em>${t.gfFull}</em><b>${r.gf}</b></span>
          <span><em>${t.gaFull}</em><b>${r.ga}</b></span>
        </span>
      </div>`;
    }).join('');

    el.innerHTML = `<div class="yt${RM ? ' no-anim' : ''}">
      <div class="yt-top">
        <div class="yt-status"><span class="yt-dot${isFinal ? '' : ' live'}"></span>${isFinal ? t.final : t.live}<span class="yt-sep">·</span><span class="yt-muted">${table.length} ${t.teams}</span></div>
        ${yulIdx >= 0 ? `<button type="button" class="yt-find">${t.seeYul} · ${yulIdx + 1}<sup>${lang() === 'fr' ? (yulIdx === 0 ? 'er' : 'e') : (['st','nd','rd'][yulIdx] || 'th')}</sup></button>` : ''}
      </div>
      ${podium(table, t, isFinal, maxPts)}
      <div class="yt-table" role="table" aria-label="${isFinal ? t.final : t.live}">
        ${head}
        <div class="yt-body" role="rowgroup">${rows}</div>
      </div>
      <div class="yt-legend">
        ${isFinal ? `<span><i class="lg champ"></i>${t.legendChamp}</span>` : ''}
        ${yulIdx >= 0 ? `<span><i class="lg yul"></i>${t.legendYul}</span>` : ''}
        <span><i class="lg bar"></i>${t.legendBar}</span>
      </div>
    </div>`;

    // Interactions
    const root = el.querySelector('.yt');
    root.querySelectorAll('.yt-team .yt-hit').forEach(b => b.addEventListener('click', () => {
      const row = b.closest('.yt-team'); const open = !row.classList.contains('open');
      row.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
    }));
    const find = root.querySelector('.yt-find');
    if(find) find.addEventListener('click', () => {
      const row = root.querySelector('.yt-team.is-yul'); if(!row) return;
      row.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
    });
    // Animation à l'apparition (barres + chiffres)
    const start = () => {
      root.classList.add('in');
      if(RM) return;
      root.querySelectorAll('[data-yt-count]').forEach(n => {
        const to = +n.dataset.ytCount, t0 = performance.now();
        const step = now => { const p = Math.min(1, (now - t0) / 900); n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if(p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    };
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver(es => { if(es.some(e => e.isIntersecting)){ start(); io.disconnect(); } }, { threshold: 0.05 });
      io.observe(root);
    } else start();
  }

  window.renderShTable = render;
  render();
  window.addEventListener('yul:lang', render);
})();
