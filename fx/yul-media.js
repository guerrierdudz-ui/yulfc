/* ==========================================================================
   YUL Media · envoi de photos depuis la zone staff + affichage sur le site
   --------------------------------------------------------------------------
   - Command Center → MEDIA CENTER → onglet PHOTOS : glisser-déposer / choisir
     des images, choisir où elles vont (galerie, accueil, Notre histoire,
     photo d'un joueur). Les images sont redimensionnées avant l'envoi.
   - En ligne (Cloudflare Pages + R2) : stockées sur le serveur, visibles par tous.
   - Sans serveur (aperçu, fichier local) : mode démo, gardées sur cet appareil
     seulement (IndexedDB).
   ========================================================================== */
(function(){
  'use strict';

  const API = '/api/media';
  const KEY_STORE = 'yul-staff-key';
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let mode = 'pending';           // 'server' | 'local'
  let items = [];                 // [{id,url,slot,caption,album,w,h,createdAt}]
  const objectUrls = new Map();   // id → blob: URL (mode local)

  /* ---------------- Stockage local (démo) ---------------- */
  const idb = {
    db: null,
    open(){
      if(this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open('yul-media', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async all(){
      const db = await this.open();
      return new Promise((res, rej) => {
        const q = db.transaction('photos').objectStore('photos').getAll();
        q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error);
      });
    },
    async put(rec){
      const db = await this.open();
      return new Promise((res, rej) => {
        const t = db.transaction('photos', 'readwrite'); t.objectStore('photos').put(rec);
        t.oncomplete = res; t.onerror = () => rej(t.error);
      });
    },
    async del(id){
      const db = await this.open();
      return new Promise((res, rej) => {
        const t = db.transaction('photos', 'readwrite'); t.objectStore('photos').delete(id);
        t.oncomplete = res; t.onerror = () => rej(t.error);
      });
    }
  };

  /* ---------------- Chargement ---------------- */
  async function load(){
    try{
      const r = await fetch(API, { cache: 'no-store' });
      const ct = r.headers.get('content-type') || '';
      if(r.ok && ct.includes('json')){
        const data = await r.json();
        mode = 'server'; items = data.items || [];
        return;
      }
      if(ct.includes('json') && r.status === 503){ mode = 'server-misconfigured'; items = []; return; }
    }catch(e){}
    mode = 'local';
    try{
      const recs = await idb.all();
      recs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      items = recs.map(r => {
        if(!objectUrls.has(r.id)) objectUrls.set(r.id, URL.createObjectURL(r.blob));
        const { blob, ...rest } = r; return { ...rest, url: objectUrls.get(r.id) };
      });
    }catch(e){ items = []; }
  }

  /* ---------------- Redimensionnement avant envoi ---------------- */
  async function shrink(file, max){
    if(file.type === 'image/gif') return { blob: file, w: null, h: null, type: file.type };
    let bmp;
    try{ bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch(e){
      try{ bmp = await createImageBitmap(file); }catch(e2){ return { blob: file, w: null, h: null, type: file.type }; }
    }
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * s), h = Math.round(bmp.height * s);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    const keepPng = file.type === 'image/png';
    const type = keepPng ? 'image/png' : 'image/jpeg';
    let blob = await new Promise(r => c.toBlob(r, type, 0.86));
    if(keepPng && blob && blob.size > 3e6) blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
    if(!blob) return { blob: file, w: bmp.width, h: bmp.height, type: file.type };
    return { blob, w, h, type: blob.type };
  }

  /* ---------------- Envoi / suppression ---------------- */
  const staffKey = () => { try{ return localStorage.getItem(KEY_STORE) || ''; }catch(e){ return ''; } };

  function uploadServer(fd, onProgress){
    return new Promise((res, rej) => {
      const x = new XMLHttpRequest();
      x.open('POST', API);
      x.setRequestHeader('X-Staff-Key', staffKey());
      x.upload.onprogress = e => { if(e.lengthComputable) onProgress(e.loaded / e.total); };
      x.onload = () => {
        let data = {}; try{ data = JSON.parse(x.responseText); }catch(e){}
        x.status >= 200 && x.status < 300 ? res(data) : rej(new Error(data.error || ('Erreur ' + x.status)));
      };
      x.onerror = () => rej(new Error('Connexion impossible.'));
      x.send(fd);
    });
  }

  async function upload(file, slot, caption, album, onProgress){
    const max = slot === 'hero' ? 2400 : slot.startsWith('player-') ? 1200 : 2000;
    const { blob, w, h, type } = await shrink(file, max);
    if(mode === 'server'){
      const ext = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif' }[type] || 'jpg';
      const fd = new FormData();
      fd.append('file', new File([blob], (file.name || 'photo').replace(/\.\w+$/, '') + '.' + ext, { type }));
      fd.append('slot', slot); fd.append('caption', caption || ''); fd.append('album', album || '');
      if(w) fd.append('w', w); if(h) fd.append('h', h);
      return uploadServer(fd, onProgress);
    }
    // mode local
    const rec = { id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), slot, caption, album, w, h,
                  createdAt: new Date().toISOString(), blob };
    if(slot !== 'gallery'){
      for(const old of items.filter(i => i.slot === slot)) await idb.del(old.id);
    }
    await idb.put(rec); onProgress(1);
    return rec;
  }

  async function remove(item){
    if(mode === 'server'){
      const r = await fetch(API + '?id=' + encodeURIComponent(item.id), { method: 'DELETE', headers: { 'X-Staff-Key': staffKey() } });
      if(!r.ok){ let d = {}; try{ d = await r.json(); }catch(e){} throw new Error(d.error || 'Suppression impossible.'); }
    } else {
      await idb.del(item.id);
      if(objectUrls.has(item.id)){ URL.revokeObjectURL(objectUrls.get(item.id)); objectUrls.delete(item.id); }
    }
  }

  /* ==================================================================
     AFFICHAGE PUBLIC
     ================================================================== */
  const bySlot = slot => items.find(i => i.slot === slot);
  const gallery = () => items.filter(i => i.slot === 'gallery');

  function applyHero(){
    const it = bySlot('hero'), img = $('.hero .hero-photo-img');
    if(!img) return;
    if(!img.dataset.origSrc) img.dataset.origSrc = img.getAttribute('src');
    const want = it ? it.url : img.dataset.origSrc;
    if(img.getAttribute('src') !== want) img.setAttribute('src', want);
  }
  function applyStory(){
    const fig = $('.story-photo'); if(!fig) return;
    const img = $('img', fig), it = bySlot('histoire');
    if(!img.dataset.origSrc) img.dataset.origSrc = img.getAttribute('src');
    if(it){ fig.classList.remove('is-empty'); if(img.getAttribute('src') !== it.url) img.setAttribute('src', it.url); }
    else if(img.getAttribute('src') !== img.dataset.origSrc){ img.setAttribute('src', img.dataset.origSrc); }
  }
  function applyPlayers(root){
    $$('.player-card[data-num]', root || document).forEach(card => {
      const it = bySlot('player-' + card.dataset.num);
      const ph = $('.player-photo', card); if(!ph) return;
      if(it){
        ph.style.backgroundImage = `url("${it.url}")`;
        ph.classList.add('yul-has-photo');
      } else if(ph.classList.contains('yul-has-photo')){
        ph.style.backgroundImage = ''; ph.classList.remove('yul-has-photo');
      }
    });
  }
  function applyModal(){
    const numEl = $('#modalNum'), panel = $('#playerModal .modal-panel');
    if(!numEl || !panel) return;
    const n = (numEl.textContent.match(/\d+/) || [])[0];
    let box = $('.yul-modal-photo', panel);
    const it = n && bySlot('player-' + n);
    if(it){
      if(!box){ box = document.createElement('div'); box.className = 'yul-modal-photo'; panel.insertBefore(box, $('.modal-head', panel)); }
      box.style.backgroundImage = `url("${it.url}")`;
    } else if(box) box.remove();
  }

  /* Galerie publique dans la page Media Center */
  let lbIndex = 0;
  function renderPublicGallery(){
    const anchor = $('#mediaGalleriesGrid'); if(!anchor) return;
    let wrap = $('#yulPhotoSection');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'yulPhotoSection'; wrap.className = 'yul-photos';
      const host = anchor.closest('.reveal') || anchor.parentElement;
      host.parentNode.insertBefore(wrap, host);
    }
    const list = gallery();
    if(!list.length){ wrap.innerHTML = ''; wrap.hidden = true; return; }
    wrap.hidden = false;
    wrap.innerHTML = `<div class="hub-section-title">PHOTOS</div>
      <div class="yul-photo-grid">${list.map((p, i) => `
        <button type="button" class="yul-photo" data-i="${i}" aria-label="${esc(p.caption || 'Photo YUL FC')}">
          <img src="${esc(p.url)}" alt="${esc(p.caption || '')}" loading="lazy" ${p.w ? `width="${p.w}" height="${p.h}"` : ''}>
          ${p.caption || p.album ? `<span class="yp-cap">${esc(p.caption || p.album)}</span>` : ''}
        </button>`).join('')}</div>`;
    $$('.yul-photo', wrap).forEach(b => b.addEventListener('click', () => openLightbox(+b.dataset.i)));
  }

  function lightbox(){
    let lb = $('#yulLightbox');
    if(lb) return lb;
    lb = document.createElement('div');
    lb.id = 'yulLightbox'; lb.className = 'yul-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = `<button class="yul-lb-close" aria-label="Fermer">✕</button>
      <button class="yul-lb-nav prev" aria-label="Précédent">‹</button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="yul-lb-nav next" aria-label="Suivant">›</button>
      <div class="yul-lb-count"></div>`;
    document.body.appendChild(lb);
    const close = () => { lb.classList.remove('open'); document.documentElement.style.overflow = ''; };
    $('.yul-lb-close', lb).addEventListener('click', close);
    lb.addEventListener('click', e => { if(e.target === lb) close(); });
    $('.prev', lb).addEventListener('click', () => showLb(lbIndex - 1));
    $('.next', lb).addEventListener('click', () => showLb(lbIndex + 1));
    document.addEventListener('keydown', e => {
      if(!lb.classList.contains('open')) return;
      if(e.key === 'Escape') close(); else if(e.key === 'ArrowLeft') showLb(lbIndex - 1); else if(e.key === 'ArrowRight') showLb(lbIndex + 1);
    });
    let x0 = null;
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if(x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if(Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
    });
    return lb;
  }
  function showLb(i){
    const list = gallery(); if(!list.length) return;
    lbIndex = (i + list.length) % list.length;
    const lb = lightbox(), p = list[lbIndex];
    $('img', lb).src = p.url; $('img', lb).alt = p.caption || '';
    $('figcaption', lb).textContent = [p.album, p.caption].filter(Boolean).join(' · ');
    $('.yul-lb-count', lb).textContent = `${lbIndex + 1} / ${list.length}`;
  }
  function openLightbox(i){ lightbox().classList.add('open'); document.documentElement.style.overflow = 'hidden'; showLb(i); }

  function applyAll(){
    applyHero(); applyStory(); applyPlayers(); applyModal(); renderPublicGallery(); renderStaffList();
  }

  /* ==================================================================
     ZONE STAFF · onglet PHOTOS du Media Center
     ================================================================== */
  const SLOT_LABEL = s => s === 'gallery' ? 'Galerie' : s === 'hero' ? "Photo d'accueil" : s === 'histoire' ? 'Notre histoire'
    : s.startsWith('player-') ? 'Joueur #' + s.slice(7) : s;

  function playerOptions(){
    let list = [];
    try{ if(typeof players !== 'undefined' && Array.isArray(players)) list = players; }catch(e){}
    if(!list.length){
      list = $$('#playersGrid .player-card[data-num]').map(c => ({ num: c.dataset.num, name: ($('.player-name', c) || {}).textContent || '' }));
    }
    return list.map(p => `<option value="player-${esc(p.num)}">#${esc(p.num)}-${esc(p.name)}</option>`).join('');
  }

  function buildStaffPanel(){
    const tabs = $('#mediaSubTabs'); if(!tabs || $('#mediaSub-photos')) return;
    const btn = document.createElement('button');
    btn.dataset.msub = 'photos'; btn.textContent = 'PHOTOS';
    tabs.insertBefore(btn, tabs.children[1] || null);

    const panel = document.createElement('div');
    panel.id = 'mediaSub-photos'; panel.style.display = 'none'; panel.className = 'yul-up';
    panel.innerHTML = `
      <div class="yul-up-mode" id="yulUpMode"></div>

      <div class="hub-card yul-up-key" id="yulUpKeyBox" hidden>
        <div class="hc-tag">CONNEXION AU STOCKAGE</div>
        <p class="yul-up-help">Entre la clé d'envoi du staff (définie dans Cloudflare : <code>STAFF_UPLOAD_KEY</code>). Elle reste enregistrée sur cet appareil.</p>
        <div class="yul-up-row">
          <input type="password" id="yulUpKey" placeholder="Clé d'envoi staff" autocomplete="off">
          <button type="button" class="pc-btn" id="yulUpKeyBtn">Connecter</button>
        </div>
        <div class="yul-up-msg" id="yulUpKeyMsg"></div>
      </div>

      <div class="hub-card" id="yulUpForm">
        <div class="hc-tag">AJOUTER DES PHOTOS</div>
        <div class="yul-up-grid2">
          <div class="login-field"><label for="yulUpSlot">Où afficher ?</label>
            <select id="yulUpSlot" class="mc-audience-select">
              <option value="gallery">Galerie photos (Media Center)</option>
              <option value="hero">Grande photo de l'accueil</option>
              <option value="histoire">Photo de la page Notre histoire</option>
              <optgroup label="Photo d'un joueur" id="yulUpPlayers"></optgroup>
            </select>
          </div>
          <div class="login-field" id="yulUpAlbumField"><label for="yulUpAlbum">Album (facultatif)</label>
            <input id="yulUpAlbum" placeholder="ex. YUL FC vs Atlas MTL · 27 sept.">
          </div>
        </div>
        <div class="login-field"><label for="yulUpCaption">Légende (facultatif)</label>
          <input id="yulUpCaption" maxlength="140" placeholder="ex. Célébration après le 2-0">
        </div>
        <label class="yul-drop" id="yulDrop" tabindex="0">
          <input type="file" id="yulUpFile" accept="image/*" multiple hidden>
          <span class="yd-ic">⇪</span>
          <span class="yd-t">Glisse tes photos ici</span>
          <span class="yd-s">ou <u>choisis sur ton appareil</u> · JPG, PNG, WebP · redimensionnées automatiquement</span>
        </label>
        <div class="yul-queue" id="yulQueue"></div>
      </div>

      <div class="hub-section-title">PHOTOS EN LIGNE</div>
      <div class="yul-up-filter" id="yulUpFilter">
        <button class="active" data-f="all">TOUTES</button><button data-f="gallery">GALERIE</button>
        <button data-f="hero">ACCUEIL</button><button data-f="histoire">HISTOIRE</button><button data-f="player">JOUEURS</button>
      </div>
      <div class="yul-staff-grid" id="yulStaffGrid"></div>`;
    const lib = $('#mediaSub-library');
    lib.parentNode.insertBefore(panel, lib);
    $('#yulUpPlayers', panel).innerHTML = playerOptions();

    // Onglets : le site gère CONTENT / LIBRARY / STUDIO, on gère PHOTOS
    tabs.addEventListener('click', e => {
      const b = e.target.closest('button'); if(!b) return;
      const on = b.dataset.msub === 'photos';
      panel.style.display = on ? 'block' : 'none';
      if(on){
        $$('button', tabs).forEach(x => x.classList.toggle('active', x === b));
        ['content', 'library', 'studio'].forEach(s => { const el = $('#mediaSub-' + s); if(el) el.style.display = 'none'; });
        $('#yulUpPlayers', panel).innerHTML = playerOptions();
        refreshStaff();
      }
    });

    const slotSel = $('#yulUpSlot', panel), albumField = $('#yulUpAlbumField', panel);
    const multi = () => slotSel.value === 'gallery';
    slotSel.addEventListener('change', () => {
      albumField.style.display = multi() ? '' : 'none';
      $('#yulUpFile', panel).multiple = multi();
    });

    const drop = $('#yulDrop', panel), input = $('#yulUpFile', panel);
    drop.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); input.click(); } });
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => handleFiles([...e.dataTransfer.files]));
    input.addEventListener('change', () => { handleFiles([...input.files]); input.value = ''; });

    $('#yulUpKeyBtn', panel).addEventListener('click', checkKey);
    $('#yulUpKey', panel).addEventListener('keydown', e => { if(e.key === 'Enter') checkKey(); });

    $('#yulUpFilter', panel).addEventListener('click', e => {
      const b = e.target.closest('button'); if(!b) return;
      $$('#yulUpFilter button').forEach(x => x.classList.toggle('active', x === b));
      staffFilter = b.dataset.f; renderStaffList();
    });
  }

  let staffFilter = 'all', keyOk = false;

  async function checkKey(){
    const input = $('#yulUpKey'), msg = $('#yulUpKeyMsg');
    const k = input.value.trim(); if(!k) return;
    msg.textContent = 'Vérification…'; msg.className = 'yul-up-msg';
    try{
      const r = await fetch(API + '?check=1', { headers: { 'X-Staff-Key': k }, cache: 'no-store' });
      if(r.ok){
        try{ localStorage.setItem(KEY_STORE, k); }catch(e){}
        keyOk = true; msg.textContent = 'Connecté ✓'; msg.className = 'yul-up-msg ok';
        input.value = ''; updateMode();
      } else {
        let d = {}; try{ d = await r.json(); }catch(e){}
        msg.textContent = d.error || 'Clé refusée.'; msg.className = 'yul-up-msg err';
      }
    }catch(e){ msg.textContent = 'Connexion impossible.'; msg.className = 'yul-up-msg err'; }
  }

  async function verifySavedKey(){
    if(mode !== 'server' || !staffKey()){ keyOk = false; return; }
    try{
      const r = await fetch(API + '?check=1', { headers: { 'X-Staff-Key': staffKey() }, cache: 'no-store' });
      keyOk = r.ok;
      if(!r.ok) try{ localStorage.removeItem(KEY_STORE); }catch(e){}
    }catch(e){ keyOk = false; }
  }

  function updateMode(){
    const box = $('#yulUpMode'); if(!box) return;
    const keyBox = $('#yulUpKeyBox'), form = $('#yulUpForm');
    if(mode === 'server'){
      box.className = 'yul-up-mode live';
      box.innerHTML = keyOk
        ? '<b>● EN LIGNE</b> Les photos envoyées sont visibles par tous les visiteurs. <button type="button" id="yulUpLogout">Déconnecter la clé</button>'
        : '<b>● EN LIGNE</b> Connecte la clé du staff pour envoyer des photos.';
      keyBox.hidden = keyOk; form.classList.toggle('locked', !keyOk);
      const lo = $('#yulUpLogout'); if(lo) lo.onclick = () => { try{ localStorage.removeItem(KEY_STORE); }catch(e){} keyOk = false; updateMode(); };
    } else if(mode === 'server-misconfigured'){
      box.className = 'yul-up-mode warn';
      box.innerHTML = '<b>● STOCKAGE À CONFIGURER</b> Le serveur répond mais le bucket R2 « MEDIA » n\'est pas relié au projet Cloudflare Pages.';
      keyBox.hidden = true; form.classList.add('locked');
    } else {
      box.className = 'yul-up-mode demo';
      box.innerHTML = '<b>● MODE DÉMO</b> Aucun serveur de photos détecté : les photos restent sur <u>cet appareil uniquement</u>. Une fois le site en ligne sur Cloudflare avec R2, elles seront visibles par tous.';
      keyBox.hidden = true; form.classList.remove('locked');
    }
    renderStaffList();
  }

  function handleFiles(files){
    const imgs = files.filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|heic)$/i.test(f.name));
    if(!imgs.length) return;
    if($('#yulUpForm').classList.contains('locked')) return;
    const slot = $('#yulUpSlot').value;
    const list = slot === 'gallery' ? imgs : imgs.slice(0, 1);
    const caption = $('#yulUpCaption').value.trim(), album = slot === 'gallery' ? $('#yulUpAlbum').value.trim() : '';
    const q = $('#yulQueue');
    list.reduce((p, f) => p.then(async () => {
      const row = document.createElement('div'); row.className = 'yq-row';
      row.innerHTML = `<span class="yq-name">${esc(f.name)}</span><span class="yq-bar"><i></i></span><span class="yq-st">Préparation…</span>`;
      q.prepend(row);
      const bar = $('i', row), st = $('.yq-st', row);
      try{
        st.textContent = 'Envoi…';
        await upload(f, slot, caption, album, p => { bar.style.width = Math.round(p * 100) + '%'; });
        bar.style.width = '100%'; st.textContent = 'Envoyée ✓'; row.classList.add('ok');
        setTimeout(() => row.remove(), 4000);
      }catch(e){
        st.textContent = e.message || 'Échec'; row.classList.add('err');
      }
    }), Promise.resolve()).then(async () => { await load(); applyAll(); });
  }

  function renderStaffList(){
    const grid = $('#yulStaffGrid'); if(!grid) return;
    const list = items.filter(i => staffFilter === 'all' || (staffFilter === 'player' ? i.slot.startsWith('player-') : i.slot === staffFilter));
    if(!list.length){ grid.innerHTML = '<div class="empty-state"><div class="es-title">AUCUNE PHOTO.</div><p>Les photos envoyées apparaîtront ici.</p></div>'; return; }
    const canDelete = mode === 'local' || keyOk;
    grid.innerHTML = list.map(p => `
      <div class="ysg-item">
        <div class="ysg-img" style="background-image:url('${esc(p.url)}')"></div>
        <div class="ysg-meta"><span class="ysg-slot">${esc(SLOT_LABEL(p.slot))}</span>
          <span class="ysg-cap">${esc(p.caption || p.album || new Date(p.createdAt).toLocaleDateString('fr-CA'))}</span></div>
        ${canDelete ? `<button type="button" class="ysg-del" data-id="${esc(p.id)}" aria-label="Supprimer">Supprimer</button>` : ''}
      </div>`).join('');
    $$('.ysg-del', grid).forEach(b => b.addEventListener('click', async () => {
      const it = items.find(i => i.id === b.dataset.id); if(!it) return;
      if(!confirm('Supprimer cette photo du site ?')) return;
      b.disabled = true; b.textContent = '…';
      try{ await remove(it); await load(); applyAll(); }
      catch(e){ alert(e.message); b.disabled = false; b.textContent = 'Supprimer'; }
    }));
  }

  async function refreshStaff(){ await load(); await verifySavedKey(); updateMode(); applyAll(); }

  /* ---------------- Démarrage ---------------- */
  async function init(){
    buildStaffPanel();
    await load();
    await verifySavedKey();
    updateMode();
    applyAll();
    // Cartes joueurs et fiche joueur générées plus tard par le site
    new MutationObserver(muts => {
      for(const m of muts){
        if(m.target.id === 'modalNum' || (m.target.parentElement && m.target.parentElement.id === 'modalNum')) applyModal();
        m.addedNodes.forEach(n => { if(n.nodeType === 1 && (n.matches('.player-card') || n.querySelector('.player-card'))) applyPlayers(n.parentElement || n); });
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    const mg = $('#mediaGalleriesGrid');
    if(mg) new MutationObserver(() => { if(!$('#yulPhotoSection')) renderPublicGallery(); }).observe(mg.parentElement.parentElement, { childList: true });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.YULMedia = { reload: async () => { await load(); applyAll(); }, get items(){ return items.slice(); }, get mode(){ return mode; } };
})();
