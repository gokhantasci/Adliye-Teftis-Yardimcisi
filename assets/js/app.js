// formatRetryMessage is now in utils.js - use window.formatRetryMessage


(function(){
  const root = document.documentElement;
  const themeKey = "minimal-theme";
  let saved = localStorage.getItem(themeKey);
  if (saved !== "light" && saved !== "dark") {
    saved = "dark";
    localStorage.setItem(themeKey, saved);
  }
  document.documentElement.setAttribute("data-theme", saved);
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  function applyIcon(){
    const mode = root.getAttribute("data-theme") || "dark";
    if (themeIcon) themeIcon.textContent = (mode === "dark" ? "dark_mode" : "light_mode");
    if (themeToggle) {
      const next = (mode === "dark" ? "light" : "dark");
      themeToggle.setAttribute("aria-pressed", mode === "dark" ? "false" : "true");
      themeToggle.setAttribute("aria-label", next === "light" ? "Açık temaya geç" : "Koyu temaya geç");
      themeToggle.setAttribute("title", next === "light" ? "Açık tema" : "Koyu tema");
    }
  }
  function toggleTheme(){
    const cur = root.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(themeKey, next);
    applyIcon();
  }
  function toggleSidebar(){
    if (!sidebar) return;
    sidebar.classList.toggle("open");
  }
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  if (sidebarToggle) sidebarToggle.addEventListener("click", toggleSidebar);
  applyIcon();
  const notesEl = document.getElementById("notes");
  const notesKey = "minimal-notes";
  const readNotes = () => JSON.parse(localStorage.getItem(notesKey) || "[]");
  const writeNotes = (arr) => localStorage.setItem(notesKey, JSON.stringify(arr));
  // escapeHtml is now in utils.js - use window.escapeHtml
  function renderNotes(){
    if (!notesEl) return;
    const data = readNotes();
    notesEl.innerHTML = "";
    if (data.length === 0) {
      notesEl.innerHTML = '<p class="muted">Hic not yok. "Yeni Not" ile baslayin.</p>';
      return;
    }
    data.forEach(function(text, idx){
      const item = document.createElement("div");
      item.className = "note";
      item.innerHTML =
        '<div class="text">' + window.escapeHtml(text) + '</div>' +
        '<div class="actions">' +
        '<button class="btn ghost" data-edit="' + idx + '">Duzenle</button>' +
        '<button class="btn" data-del="' + idx + '">Sil</button>' +
        '</div>';
      notesEl.appendChild(item);
    });
    notesEl.addEventListener("click", onNoteClick);
  }
  function onNoteClick(e){
    const t = e.target;
    if (t.matches("[data-del]")){
      const idx = +t.getAttribute("data-del");
      const arr = readNotes(); arr.splice(idx,1); writeNotes(arr); renderNotes();
    } else if (t.matches("[data-edit]")){
      const idx = +t.getAttribute("data-edit");
      const arr = readNotes(); const val = prompt("Notu duzenle:", arr[idx] || "");
      if (val !== null){ arr[idx] = val.trim(); writeNotes(arr); renderNotes(); }
    }
  }
  window.addNote = function(val){
    if (!val) {
      val = prompt("Yeni not:");
      if (!val) return;
    }
    const arr = readNotes(); arr.unshift(String(val).trim()); writeNotes(arr); renderNotes();
  };
  renderNotes();
})();
(function(){
  const API = '/api/notes.php';
  const notesKey = "minimal-notes";
  async function syncDown(){
    try{
      const r = await fetch(API, {headers:{'Accept':'application/json'}});
      if (!r.ok) return;
      const j = await r.json();
      const remote = (j && j.data && j.data.items) ? j.data.items : [];
      const local = JSON.parse(localStorage.getItem(notesKey) || "[]");
      if (local.length === 0 && remote.length > 0) {
        localStorage.setItem(notesKey, JSON.stringify(remote.map(function(x){ return x.text; })));
        if (typeof window.renderNotes === "function") window.renderNotes();
        else {
          const ev = document.createEvent('Event');
          ev.initEvent('notes-sync', true, true);
          document.dispatchEvent(ev);
        }
      }
    } catch(e){ console.error(e); }
  }
  async function pushAdd(text){
    try {
      await fetch(API, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({action:'add', text:text})
      });
    } catch(e){  }
  }
  const origAdd = window.addNote;
  if (typeof origAdd === 'function'){
    window.addNote = function(val){
      if (!val) {
        val = prompt("Yeni not:");
        if (!val) return;
      }
      origAdd(val);
      pushAdd(val);
    };
  }
  })();
(function(){
  const btn = document.getElementById('collapseBtn');
  const det = document.querySelector('details.settings');
  if (btn && det) {
    btn.addEventListener('click', function(){
      det.open = false;
    });
  }
})();
(function(){
  const key = "dashboard-settings";
  const ids = ["col_i","col_j","col_k","col_o","col_p","col_t","col_m","col_q","col_z"];
  const $ = (id) => document.getElementById(id);
  function load(){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw);
      ids.forEach(k => { if ($(k) && Object.prototype.hasOwnProperty.call(data, k)) $(k).value = data[k]; });
    } catch(e){ console.error(e); }
  }
  function save(){
    const data = {};
    ids.forEach(k => { if ($(k)) data[k] = String(($(k).value || "")).trim(); });
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch(e){ return false; }
  }
  const btn = document.getElementById("saveBtn");
  if (btn) {
    btn.addEventListener("click", function(){
      const ok = save();
      const old = btn.textContent;
      btn.textContent = ok ? "Kaydedildi ✔" : "Kaydedilemedi ✖";
      setTimeout(()=>{ btn.textContent = old; }, 1400);
    });
  }
  load();
})();
(function(){
  var det = document.querySelector('details.settings');
  if (!det) return;
  function apply(){
    var wide = window.matchMedia('(min-width: 1024px)').matches;
    det.open = !!wide;
  }
  apply();
  window.addEventListener('resize', function(){
    apply();
  });
})();
(function(){
  function el(tag, attrs, html){
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs){ if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  window.showAlert = function(target, opts){
    opts = opts || {};
    var type = opts.type || 'primary'; 
    var title = opts.title || '';
    var msg = opts.message || '';
    var icon = opts.icon || 'info';
    var dismiss = opts.dismissible !== false;
    var wrap = el('div', {class: 'alert alert-'+type});
    var icn = el('span', {class: 'material-symbols-rounded alert-icon'}, icon);
    var body = el('div', {class: 'alert-body'});
    if (title) body.appendChild(el('div', {class:'alert-title'}, title));
    body.appendChild(el('div', null, msg));
    wrap.appendChild(icn);
    wrap.appendChild(body);
    if (dismiss) {
      var btn = el('button', {class:'btn-close', type:'button', 'aria-label':'Kapat'}, '&times;');
      btn.addEventListener('click', function(){ wrap.remove(); });
      wrap.appendChild(btn);
    }
    var host = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!host) host = document.body;
    host.appendChild(wrap);
    return wrap;
  };
  window.toast = function(opts){
    opts = opts || {};
    var type = opts.type || 'primary';
    var title = opts.title || 'Bilgi';
    var body = opts.body || '';
    var autohide = opts.autohide !== false;
    var delay = (typeof opts.delay === 'number') ? opts.delay : 5000;
    
    var c = document.querySelector('.toast-container');
    if (!c) { c = el('div', {class:'toast-container'}); document.body.appendChild(c); }
    var t = el('div', {class:'toast toast-'+type});
    var head = el('div', {class:'toast-head'});
    head.appendChild(el('div', {class:'toast-title'}, title));
    var close = el('button', {class:'btn-close', type:'button', 'aria-label':'Kapat'}, '&times;');
    close.addEventListener('click', function(){ t.remove(); });
    head.appendChild(close);
    var bodyEl = el('div', {class:'toast-body'}, body);
    t.appendChild(head); t.appendChild(bodyEl);
    c.appendChild(t);
    if (autohide){
      setTimeout(function(){ if (t && t.parentNode) t.remove(); }, delay);
    }
    return t;
  };
})();
function dismissTestAlert() {
  const alert = document.getElementById('testDataAlert');
  if (alert) alert.style.display = 'none';
}
document.getElementById('excelInput')?.addEventListener('change', () => {
  dismissTestAlert();
});
  function debounce(fn, delay){ let t; return function(){ clearTimeout(t); t=setTimeout(()=>fn.apply(this, arguments), delay); }; }
(function(){
  function debounce(fn, delay){ var t; return function(){ clearTimeout(t); t=setTimeout(function(){ fn.apply(this, arguments); }, delay); }; }
  function equalizeSettingsToUpload(){
    try{
      var upload = document.querySelector('.grid-left .card.card-upload');
      var settings = document.querySelector('.sidecard details.settings');
      if(!upload || !settings) return;
      var root = document.documentElement;
      var h = upload.getBoundingClientRect().height || 0;
      if(h > 0){
        root.style.setProperty('--settings-target-height', h + 'px');
      } else {
        root.style.removeProperty('--settings-target-height');
      }
    }catch(e){ console.error(e); }
  }
  var run = debounce(equalizeSettingsToUpload, 100);
  window.addEventListener('load', run);
  window.addEventListener('resize', run);
  document.addEventListener('DOMContentLoaded', run);
  var uploadNode = document.querySelector('.grid-left .card.card-upload');
  if(uploadNode && 'MutationObserver' in window){
    var mo = new MutationObserver(run);
    mo.observe(uploadNode, {childList:true, subtree:true, attributes:true, characterData:true});
  }
})();
if (typeof dismissTestAlert !== 'function') {
  function dismissTestAlert(){
    try{
      var el = document.getElementById('testDataAlert');
      if(el){ el.remove(); }
    }catch(e){ console.error(e); }
  }
}
(function(){
  window.dismissTestAlert = function dismissTestAlert(){
    try{
      var el = document.getElementById('testDataAlert');
      if(el){ el.remove(); }
    }catch(e){ console.error(e); }
  };
})();
(function () {
  var NEWS_URL = "/data/teftis.json";      
  var LS_KEY = "teftisNews_v1";
  var LS_FETCHED_AT = "teftisNewsFetchedAt_v1";
  var REFRESH_MS = 60 * 60 * 1000;         
  var PAGE_SIZE = 2;                       
  var listEl = document.getElementById("newsList");
  var metaEl = document.getElementById("newsMeta");
  if (!listEl || !metaEl) return;
  var pagerEl = document.getElementById("newsPager");
  if (!pagerEl) {
    pagerEl = document.createElement("nav");
    pagerEl.id = "newsPager";
    pagerEl.className = "pager";
    pagerEl.setAttribute("role", "navigation");
    pagerEl.setAttribute("aria-label", "Haber sayfalama");
  }

  // -- pager konumu: newsCard'ın card-footer'ında --
  (function placePager() {
    const newsCard = document.getElementById("newsCard");
    if (!newsCard) return;
    
    let cardFoot = newsCard.querySelector(".card-footer") || newsCard.querySelector(".card-foot");
    if (!cardFoot) {
      cardFoot = document.createElement("div");
      cardFoot.className = "card-footer";
      newsCard.appendChild(cardFoot);
    }
    
    if (pagerEl.parentNode !== cardFoot) {
      cardFoot.appendChild(pagerEl);
    }
  })();
  var itemsCache = [];
  var currentPage = 1;
  function parseItems(raw) {
    if (!raw || !raw.length) return [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var x = raw[i] || {};
      var t = x.tarih || x.Tarih || x.date || "";
      var c = x.icerik || x.İcerik || x.İÇERİK || x.content || "";
      if (t && c) out.push({ tarih: t, icerik: c });
    }
    function toTime(s) { var d = new Date(s); return isNaN(d) ? 0 : d.getTime(); }
    out.sort(function (a, b) { return toTime(b.tarih) - toTime(a.tarih); }); 
    return out;
  }
  function save(items) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
      localStorage.setItem(LS_FETCHED_AT, String(Date.now()));
    } catch (e) {}
  }
  function load() {
    try {
      var s = localStorage.getItem(LS_KEY);
      return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
  }
  function lastFetchedMs() { return Number(localStorage.getItem(LS_FETCHED_AT) || 0); }
  function shouldRefresh() { return (Date.now() - lastFetchedMs()) >= REFRESH_MS; }
  function setMetaLoading() { try { metaEl.textContent = "Yükleniyor…"; } catch (e) {} }
  function setErrorInCard() {
    var body = document.querySelector("#newsCard .news-drop__content") || document.querySelector("#newsCard .card-body");
    if (body) body.innerHTML = '<p class="news-error">Haberler alınamadı.</p>';
  }
  function fetchFromRemote() {
    setMetaLoading();
    return fetch(NEWS_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        var items = parseItems(Array.isArray(data) ? data : []);
        save(items);
        return items;
      })
      .catch(function (e) {
        console.error("[NEWS]", e);
        setErrorInCard();
        return [];
      });
  }
  function renderMeta(total) {
    var fetchedAt = lastFetchedMs();
    var fetchedText = "—";
    if (fetchedAt) {
      try {
        fetchedText = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
                        .format(new Date(fetchedAt));
      } catch (e) {
        fetchedText = new Date(fetchedAt).toLocaleString('tr-TR');
      }
    }
    metaEl.textContent = total + " haber · Son güncelleme: " + fetchedText;
  }
  function renderListPage(items, page) {
    if (!items || !items.length) {
      listEl.innerHTML = "<p class='news-empty'>Haber bulunamadı.</p>";
      if (pagerEl) { pagerEl.innerHTML = ""; pagerEl.style.display = "none"; }
      return;
    }
    var total = items.length;
    var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;
    var start = (page - 1) * PAGE_SIZE;
    var end = start + PAGE_SIZE;
    var slice = items.slice(start, end);
    pagerEl.innerHTML = "";
    pagerEl.style.display = (totalPages <= 1 ? "none" : "");
    if (totalPages > 1) {
      // unified pager layout: left(prev), center(info), right(next)
  var left = document.createElement('div');
  var center = document.createElement('div');
  var right = document.createElement('div');
      var prev = document.createElement('button');
      prev.type='button'; prev.className='btn ghost'; prev.textContent='Önceki'; prev.disabled = (page===1);
      prev.addEventListener('click', function(){ renderListPage(itemsCache, currentPage - 1); });
      left.appendChild(prev);
  var info = document.createElement('div'); info.className='muted'; info.textContent='Sayfa '+page+' / '+totalPages; center.appendChild(info);
      var next = document.createElement('button');
      next.type='button'; next.className='btn ghost'; next.textContent='Sonraki'; next.disabled = (page===totalPages);
      next.addEventListener('click', function(){ renderListPage(itemsCache, currentPage + 1); });
      right.appendChild(next);
      // Track interactions for keyboard pager shortcuts
      [prev, next].forEach(function(btn){
        ['focus','mouseenter','click'].forEach(function(ev){ btn.addEventListener(ev, function(){ window.__lastPager = pagerEl; }); });
      });
  pagerEl.appendChild(left); pagerEl.appendChild(center); pagerEl.appendChild(right);
    }
  }
  function render(items) {
    itemsCache = items || [];
    renderMeta(itemsCache.length);
    renderListPage(itemsCache, 1);
    // === Footer Slider News Injection ===
    (function injectFooterNews(){
      if (window.__footerNewsApplied) return; // tek seferlik
      const track = document.querySelector('.fs-track');
      if (!track) return;
      try {
        const storedKey = 'footerNews_v1';
        const existingRaw = localStorage.getItem(storedKey);
        let existing = [];
        if (existingRaw){ try{ existing = JSON.parse(existingRaw)||[]; }catch(e){} }
        const seen = new Set(existing.map(x=> (x.date+'__'+x.text)));
        const addList = [];
        itemsCache.forEach(function(it){
          const dateStr = it.tarih; // varsayılan format korunur
          const parts = String(it.icerik||'').split(/\n+/).map(p=>p.trim()).filter(Boolean);
          parts.forEach(function(part){
            const key = dateStr+'__'+part;
            if (seen.has(key)) return;
            seen.add(key);
            addList.push({ date: dateStr, text: part });
          });
        });
        if (!addList.length) { window.__footerNewsApplied = true; return; }
        // Birleştir, son eklenen ilk görünsün (slider zaten döner)
        const merged = existing.concat(addList).slice(-200); // max 200 kayıt tut
        localStorage.setItem(storedKey, JSON.stringify(merged));
        // DOM'a ekle
        addList.forEach(function(row){
          const div = document.createElement('div');
          div.className = 'fs-item';
          // Tarihi başa koy, içerik devamında; uzunluk taşarsa CSS kırpar
          div.innerHTML = '<span class="muted" style="font-variant-numeric:tabular-nums;">'+escapeHtml(row.date)+'</span> '+escapeHtml(row.text);
          track.appendChild(div);
        });
        window.__footerNewsApplied = true;
      } catch(e){ console.error('[FooterNews]', e); }
    })();
  }
  // Toast queue & throttle (max 2 concurrent, 500ms interval)
  (function enhanceToastQueue(){
    if (window.__toastQueueEnhanced) return;
    const originalToast = window.toast; // expects opts object
    const queue = [];
    let active = 0;          // currently visible count
    let lastShown = 0;       // timestamp of last shown
    function showNext(){
      if (!queue.length) return;
      if (active >= 2) return; // max 2 concurrent
      const now = Date.now();
      const since = now - lastShown;
      if (since < 500){ // enforce 500ms spacing
        setTimeout(showNext, 500 - since + 5);
        return;
      }
      const opts = queue.shift();
      lastShown = Date.now();
      active++;
      // Toast logging is handled in utils.js wrapper, no need to log here
      const el = originalToast(opts);
      const delay = (typeof opts.delay === 'number') ? opts.delay : 5000;
      setTimeout(()=>{ active = Math.max(0, active-1); showNext(); }, delay + 60);
    }
    function normalizeArgs(args){
      if (!args.length) return {};
      if (typeof args[0] === 'object' && !Array.isArray(args[0])) return {...args[0]};
      const type = args[0];
      const title = args[1];
      const body = args[2];
      const extra = (typeof args[3] === 'object' && args[3]) ? args[3] : {};
      return { ...extra, type, title, body };
    }
    function queuedToast(){
      const opts = normalizeArgs(arguments);
      // Log toast event only if global toast logger isn't active yet
      try {
        if (!window.__TOAST_LOG_WRAP_ACTIVE) {
          const toastType = String(opts.type||'info').toLowerCase();
          const msg = (opts.title||'') + (opts.body? ': '+opts.body:'');
          if (window.logEvent) window.logEvent(toastType, msg);
        }
      } catch(_) { }
      queue.push(opts);
      showNext();
      return { queued:true };
    }
    queuedToast.__queueEnhanced = true;
    window.toast = queuedToast;
    window.__toastQueueEnhanced = true;
  })();
  // Basit HTML kaçış (footer news injection için)
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[ch] || ch;
    });
  }
  function msUntilNextHour() {
    var now = new Date();
    return ((59 - now.getMinutes()) * 60 + (60 - now.getSeconds())) * 1000 - now.getMilliseconds();
  }
  function refreshIfStale() {
    if (!shouldRefresh()) return;
    fetchFromRemote().then(function (it) { render(it); });
  }
  function scheduleHourly() {
    var wait = msUntilNextHour();
    setTimeout(function () {
      refreshIfStale();
      setInterval(refreshIfStale, 60 * 60 * 1000);
    }, Math.max(1000, wait));
  }
  function ensureData() {
    var cached = load();
    if (cached.length) {
      render(cached);
      if (shouldRefresh()) { fetchFromRemote().then(function (it) { render(it); }); }
    } else {
      fetchFromRemote().then(function (it) { render(it); });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { ensureData(); scheduleHourly(); });
  } else {
    ensureData(); scheduleHourly();
  }
  // Global ArrowLeft/ArrowRight shortcuts for pagers
  (function bindGlobalPagerShortcuts(){
    if (window.__globalPagerKeysBound) return; window.__globalPagerKeysBound = true;
    function isEditable(el){ return el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName)); }
    function clickIf(btn){ if (btn && !btn.disabled) btn.click(); }
    document.addEventListener('keydown', function(e){
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (isEditable(document.activeElement)) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      let pager = window.__lastPager;
      if (!pager) pager = document.querySelector('.card-footer .pager, .modal-foot .pager, .log-panel-foot .pager');
      if (!pager){
        // Try modal foot fallbacks
        const mf = document.querySelector('.modal-foot');
        if (mf){
          const prev = mf.querySelector('#jrListPrev, #ozet-page-prev');
          const next = mf.querySelector('#jrListNext, #ozet-page-next');
          if (e.key==='ArrowLeft' && prev){ e.preventDefault(); clickIf(prev); }
          if (e.key==='ArrowRight' && next){ e.preventDefault(); clickIf(next); }
        }
        return;
      }
      const first = pager.firstElementChild;
      const last  = pager.lastElementChild;
      if (e.key==='ArrowLeft'){ const btn = first && first.querySelector('button'); if (btn){ e.preventDefault(); clickIf(btn); } }
      if (e.key==='ArrowRight'){ const btn = last && last.querySelector('button');  if (btn){ e.preventDefault(); clickIf(btn); } }
    });
    // Delegated tracking for any pager button interaction (focus/click/mouseenter)
    document.addEventListener('click', function(e){ const b = e.target.closest('.pager button'); if (b){ window.__lastPager = b.closest('.pager'); } });
    document.addEventListener('focusin', function(e){ const b = e.target.closest('.pager button'); if (b){ window.__lastPager = b.closest('.pager'); } });
    document.addEventListener('mouseover', function(e){ const b = e.target.closest('.pager button'); if (b){ window.__lastPager = b.closest('.pager'); } });
  })();
})();
(function () {
  if (window.__mailDropInitDone) return;
  window.__mailDropInitDone = true;
  function formatRetryMessage(sec) {
    sec = Number(sec) || 0;
    if (sec <= 0) return 'Bir süre sonra tekrar deneyin.';
    if (sec < 60) return sec + ' sn sonra tekrar deneyin.';
    var mins = Math.ceil(sec / 60);
    return mins + ' dk sonra tekrar deneyin.';
  }
  function formatDateTimeTR(d) {
    d = d || new Date();
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    var hh = String(d.getHours()).padStart(2, '0');
    var mi = String(d.getMinutes()).padStart(2, '0');
    return dd + '.' + mm + '.' + yyyy + ' günü saat ' + hh + ':' + mi;
  }
  var BOX_ID = 'mailDropBox';
  var INPUT_ID = 'mailDropInput';
  var BTN_ID = 'mailDropSendBtn';
  var PREVIEW_ID = 'mailPreview';
  var TOAST_ID = 'mailDropToast';
  var SUBJECT_SAFE = 'Teftiş bilgilendirme hk.';
  var REPLY_TO = 'gkhntasci@gmail.com'; 
  var LINE_DATE = formatDateTimeTR() + ' teftis.657.com.tr adresine mail adresiniz bırakılması nedeniyle bu maili almaktasınız.';
  var SAFE_PLAIN_TEXT = [
    'Merhaba Sevgili Meslektaşım,',
    '',
    LINE_DATE,
    'Gerekli sayfaya erişim için: teftis.657.com.tr adresini tarayıcınıza (Google Chrome ya da Edge) yazabilirsiniz.',
    'Kopyalamak için : ',
    '',
    'teftis.657.com.tr',
    '',
    '',
    'İyi çalışmalar dilerim.',
    '',
    '',
    '--------------------------',
    'Gökhan TAŞÇI',
    'Yazı İşleri Müdürü 139329',
    'Sakarya'
  ].join('\n');
  var emailRe = /^[A-Z0-9._%+-]+@adalet\.gov\.tr$/i;
  var $ = function (id) { return document.getElementById(id); };
  function setToast(t, ok) {
    var el = $(TOAST_ID);
    if (!el) return;
    el.textContent = t || '';
    el.style.color = ok ? 'var(--md-sys-color-primary,#2e7d32)' : 'var(--md-sys-color-on-error,#b00020)';
  }
  function setPreview() {
    var pre = $(PREVIEW_ID);
    if (pre) pre.textContent = SAFE_PLAIN_TEXT; 
  }
  function extractEmail(txt) {
    var m = (txt || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return m ? m[0].trim() : '';
  }
  function setEmail(val) {
    var inp = $(INPUT_ID);
    var btn = $(BTN_ID);
    if (!inp || !btn) return;
    inp.value = (val || '').trim();
    if (!inp.value) { btn.disabled = true; setToast(''); return; }
    if (emailRe.test(inp.value)) { btn.disabled = false; setToast('Adres alındı: ' + inp.value, true); }
    else { btn.disabled = true; setToast('Sadece @adalet.gov.tr uzantılı e-posta adresleri kabul edilir.'); }
  }
  function init() {
    var box = $(BOX_ID), inp = $(INPUT_ID), btn = $(BTN_ID);
    if (!box || !inp || !btn) return;
    setPreview();
    box.addEventListener('dragover', function (e) { e.preventDefault(); box.classList.add('drag-over'); });
    box.addEventListener('dragleave', function () { box.classList.remove('drag-over'); });
    box.addEventListener('drop', function (e) {
      e.preventDefault(); box.classList.remove('drag-over');
      var text = '';
      if (e.dataTransfer) {
        if (e.dataTransfer.getData('text/plain')) text = e.dataTransfer.getData('text/plain');
        else if (e.dataTransfer.items && e.dataTransfer.items.length) {
          var item = e.dataTransfer.items[0];
          if (item.kind === 'string') { item.getAsString(function (s) {
            var mail = extractEmail(s); if (mail) setEmail(mail); else setToast('Geçerli bir e-posta bulunamadı.');
          }); return; }
        }
      }
      var mail = extractEmail(text);
      if (mail) setEmail(mail); else setToast('Geçerli bir e-posta bulunamadı.');
    });
    box.addEventListener('click', function (e) { if (e.target !== inp && e.target !== btn) inp.focus(); });
    function handlePaste(e) {
      e.preventDefault(); e.stopPropagation();
      var text = (e.clipboardData && e.clipboardData.getData('text')) || '';
      var mail = extractEmail(text);
      if (mail) setEmail(mail); else setToast('Geçerli bir e-posta bulunamadı.');
    }
    inp.addEventListener('paste', handlePaste);
    box.addEventListener('paste', handlePaste);
    inp.addEventListener('input', function () {
      var v = inp.value.trim();
      if (!v) { btn.disabled = true; setToast(''); return; }
      if (emailRe.test(v)) { btn.disabled = false; setToast(''); }
      else { btn.disabled = true; setToast('Sadece @adalet.gov.tr uzantılı e-posta adresleri kabul edilir.'); }
    });
    btn.addEventListener('click', function () {
      var to = inp.value.trim();
      if (!emailRe.test(to)) { setToast('Sadece @adalet.gov.tr uzantılı e-posta adresleri kabul edilir.'); return; }
      btn.disabled = true;
      setToast('Gönderiliyor…');
      var bodyPayload = { to: to, subject: SUBJECT_SAFE, body: SAFE_PLAIN_TEXT };
      if (REPLY_TO) bodyPayload.reply_to = REPLY_TO;
      fetch('/api/send-mail.php?test=1&DEBUG=1', {
        method: 'POST',
        headers: (function(){
          var hpEl = document.getElementById('mailHp');
          var hpVal = hpEl ? hpEl.value : '';
          return { 'Content-Type': 'application/json', 'X-HP': hpVal };
        })(),
        body: JSON.stringify(bodyPayload)
      })
      .then(function (res) {
        return res.json().catch(function(){ return {}; }).then(function (data) {
          if ((res.ok && data && data.ok) || (data && data.msg)) {
            setToast('Mail gönderildi ✅', true);
          } else if (data && data.stage === 'GUARD') {
            var retry = data.retry_after || 0;
            setToast(formatRetryMessage(retry));
            btn.disabled = false;
          } else {
            setToast((data && (data.error || data.msg)) || 'Gönderim sırasında bir sorun oluştu.');
            btn.disabled = false;
            console.warn('send-mail.php response:', data);
          }
        });
      })
      .catch(function (err) {
        setToast('Ağ hatası: Gönderilemedi.');
        btn.disabled = false;
        console.error(err);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


// [fusion] searchSicil: Enter => filterBtn, then check column; toast if not found
(function(){
  if (window.__bindSearchEnterToast) return; window.__bindSearchEnterToast=true;
  const searchEl = document.getElementById("searchSicil");
  if (searchEl){
    searchEl.addEventListener('keydown', (ev)=>{
      if (ev.key === 'Enter'){
        ev.preventDefault();
        const btn = document.getElementById('filterBtn');
        if (btn) btn.click();
      }
    });
  }
  // Hook filter button to show "sicil yok" toast if column not found
  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn){
    filterBtn.addEventListener("click", ()=>{
      try{
        const qEl = document.getElementById("searchSicil");
        const q = qEl ? (qEl.value||"").trim() : "";
        if (!q) return;
        const wrap = document.querySelector(".table-wrap");
        let found = false;
        if (wrap){
          const ths = wrap.querySelectorAll("th");
          const needle = "(" + q + ")";
          for (let i=0;i<ths.length;i++){
            if (ths[i].textContent.trim() === needle){ found=true; break; }
          }
        }
        if (!found && window.toast){
          window.toast({ type:'warning', title:'Kayıt bulunamadı', body:'Bu sicile ait bir kayıt bulunamamıştır.' });
        }
      }catch(_){}
    });
  }
})();


// [fusion] Modal utilities: close on outside/backdrop & ESC
(function(){
  if (window.__modalUtilitiesBound) return; window.__modalUtilitiesBound = true;
  function bindModalClose(modal){
    if (!modal || modal.__closeBound) return;
    modal.__closeBound = true;
    const close = ()=>{ modal.classList.remove('is-open','active'); modal.setAttribute('aria-hidden','true'); };
    modal.__close = modal.__close || close;
    modal.addEventListener('click', (e)=>{
      const card = modal.querySelector('.modal-card');
      const isBackdrop = e.target.classList && e.target.classList.contains('cm-backdrop');
      const outsideCard = card && !card.contains(e.target) && !isBackdrop;
      if (isBackdrop || outsideCard) close();
    });
    document.addEventListener('keydown', (ev)=>{ if (ev.key==='Escape') close(); });
  }
  ['caseModal','noJudgeModal','detail-modal'].forEach(id=>{
    const m=document.getElementById(id);
    if (m) bindModalClose(m);
    const obs = new MutationObserver(()=>{
      const mm=document.getElementById(id);
      if (mm) bindModalClose(mm);
    });
    obs.observe(document.body, {childList:true, subtree:true});
  });
})();


// [fusion] Simple pager + auto paginate for modal tables
(function(){
  if (window.__pagerHelpersBound) return; window.__pagerHelpersBound = true;

  window.__applyPager = function(tableSelector, pageSize){
    try{
      pageSize = pageSize || 20;
      const table = document.querySelector(tableSelector);
      if (!table) return;
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      if (rows.length <= pageSize) return; // no need

      // Preserve all rows
      const data = rows.map(tr => tr.outerHTML);
      tbody.innerHTML = '';

      let page = 1;
      const total = data.length;
      const pages = Math.ceil(total / pageSize);

      // Find appropriate footer: modal-foot or card-footer/card-foot
      const modal = table.closest('.cmodal, .modal-card');
      let footer = modal ? modal.querySelector('.modal-foot') : null;
      
      if (!footer) {
        const card = table.closest('.card');
        footer = card ? (card.querySelector('.card-footer') || card.querySelector('.card-foot')) : null;
      }

      const pagerId = (table.id || 'table').replace(/[^a-z0-9_-]/gi,'') + '_pager';
      let pager = footer ? footer.querySelector('#'+pagerId) : table.parentElement.querySelector('#'+pagerId);
      
      if (!pager){
        pager = document.createElement('div');
        pager.id = pagerId;
        pager.className = 'pager';
        pager.style.display='flex';
        pager.style.justifyContent='space-between';
        pager.style.alignItems='center';
        pager.style.gap='8px';
        
        if (footer) {
          footer.appendChild(pager);
        } else {
          pager.style.marginTop='10px';
          table.parentElement.appendChild(pager);
        }
      }

      function renderPage(){
        const start = (page-1)*pageSize;
        const slice = data.slice(start, start+pageSize);
        tbody.innerHTML = slice.join('');
        pager.innerHTML = '';
        const info = document.createElement('div');
        info.className = 'muted';
        info.textContent = 'Sayfa ' + page + ' / ' + pages + ' — ' + total + ' kayıt';
        const left = document.createElement('div');
        const right= document.createElement('div');
        function mkBtn(label, disabled, on){
          const b=document.createElement('button');
          b.className='btn ghost';
          b.type='button';
          b.textContent=label;
          b.disabled=!!disabled;
          if (on) b.addEventListener('click', on);
          return b;
        }
        left.appendChild(mkBtn('« İlk', page===1, ()=>{ page=1; renderPage(); }));
        left.appendChild(mkBtn('‹ Önceki', page===1, ()=>{ page--; renderPage(); }));
        right.appendChild(mkBtn('Sonraki ›', page===pages, ()=>{ page++; renderPage(); }));
        right.appendChild(mkBtn('Son »', page===pages, ()=>{ page=pages; renderPage(); }));
        pager.appendChild(left);
        pager.appendChild(info);
        pager.appendChild(right);
      }
      renderPage();
    }catch(e){ console.error('pager error', e); }
  };

  function watch(tableSelector){
    function bind(){
      const table = document.querySelector(tableSelector);
      if (!table) return;
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const obs = new MutationObserver(()=>{
        const count = tbody.querySelectorAll('tr').length;
        if (count > 20) window.__applyPager(tableSelector, 20);
      });
      obs.observe(tbody, {childList:true});
    }
    // initial bind after DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bind);
    } else {
      bind();
    }
    // observe future creations
    const rootObs = new MutationObserver(()=>{
      if (document.querySelector(tableSelector)) bind();
    });
    rootObs.observe(document.body, {childList:true, subtree:true});
  }

  ['#modal-table','#noJudgeTable'].forEach(watch);
})();

// === Modal utilities: close on backdrop/outside & ESC ===
(function ensureModalBehaviors(){
  function bindModalClose(modal){
    if (!modal || modal.__closeBound) return;
    modal.__closeBound = true;
    const close = ()=> { modal.classList.remove('is-open','active'); modal.setAttribute('aria-hidden','true'); };
    modal.__close = modal.__close || close;
    // backdrop
    modal.addEventListener('click', function(e){
      const card = modal.querySelector('.modal-card');
      const isBackdrop = e.target.classList && e.target.classList.contains('cm-backdrop');
      const outsideCard = card && !card.contains(e.target) && !isBackdrop;
      if (isBackdrop || outsideCard) close();
    });
    // Esc
    document.addEventListener('keydown', function(ev){
      if (ev.key === 'Escape') close();
    });
  }
  ['caseModal','noJudgeModal','detail-modal'].forEach(function(id){
    const m = document.getElementById(id);
    if (m) bindModalClose(m);
    // observe later-created
    const obs = new MutationObserver(()=>{
      const mm = document.getElementById(id);
      if (mm) bindModalClose(mm);
    });
    obs.observe(document.body, {childList:true, subtree:true});
  });
})();

// === Simple pager helpers ===
function __applyPager(tableSelector, pageSize){
  try{
    pageSize = pageSize || 20;
    const table = document.querySelector(tableSelector);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length <= pageSize) return; // no need

    // Preserve all rows
    const data = rows.map(tr => tr.outerHTML);
    tbody.innerHTML = '';

    let page = 1;
    const total = data.length;
    const pages = Math.ceil(total / pageSize);

    // Find appropriate footer: modal-foot or card-footer/card-foot
    const modal = table.closest('.cmodal, .modal-card');
    let footer = modal ? modal.querySelector('.modal-foot') : null;
    
    if (!footer) {
      const card = table.closest('.card');
      footer = card ? (card.querySelector('.card-footer') || card.querySelector('.card-foot')) : null;
    }

    const pagerId = tableSelector.replace(/[^a-z0-9_-]/gi,'') + '_pager';
    let pager = footer ? footer.querySelector('#'+pagerId) : table.parentElement.querySelector('#'+pagerId);
    
    if (!pager){
      pager = document.createElement('div');
      pager.id = pagerId;
      pager.style.display='flex';
      pager.style.justifyContent='space-between';
      pager.style.alignItems='center';
      pager.style.gap='8px';
      
      if (footer) {
        footer.appendChild(pager);
      } else {
        pager.style.marginTop='10px';
        table.parentElement.appendChild(pager);
      }
    }

    function renderPage(){
      const start = (page-1)*pageSize;
      const slice = data.slice(start, start+pageSize);
      tbody.innerHTML = slice.join('');
      pager.innerHTML = '';
      const info = document.createElement('div');
      info.className = 'muted';
      info.textContent = 'Sayfa ' + page + ' / ' + pages + ' — ' + total + ' kayıt';
      const left = document.createElement('div');
      const right= document.createElement('div');
      function mkBtn(label, disabled, on){
        const b=document.createElement('button');
        b.className='btn'+(disabled?' ghost':'');
        b.type='button';
        b.textContent=label;
        b.disabled=!!disabled;
        if (on) b.addEventListener('click', on);
        return b;
      }
      left.appendChild(mkBtn('« İlk', page===1, ()=>{ page=1; renderPage(); }));
      left.appendChild(mkBtn('‹ Önceki', page===1, ()=>{ page--; renderPage(); }));
      right.appendChild(mkBtn('Sonraki ›', page===pages, ()=>{ page++; renderPage(); }));
      right.appendChild(mkBtn('Son »', page===pages, ()=>{ page=pages; renderPage(); }));
      pager.appendChild(left);
      pager.appendChild(info);
      pager.appendChild(right);
    }
    renderPage();
  }catch(e){ console.error('pager error', e); }
}

// Auto-paginate #noJudgeTable when caseModal opens
(function(){
  const modal = document.getElementById('caseModal');
  if (!modal) return;
  const obs = new MutationObserver(()=> {
    if (modal.classList.contains('is-open') || modal.getAttribute('aria-hidden')==='false') {
      setTimeout(()=>__applyPager('#noJudgeTable', 20), 0);
    }
  });
  obs.observe(modal, { attributes:true, attributeFilter:['class','aria-hidden'] });
})();


// [fusion] saveBtn toast
(function(){
  if (window.__saveBtnToastBound) return; window.__saveBtnToastBound = true;
  const btn = document.getElementById("saveBtn");
  if (!btn) return;
  btn.addEventListener("click", function(){
    try{
      var ok = true;
      if (typeof save === "function") ok = !!save();
      var old = btn.textContent;
      btn.textContent = ok ? "Kaydedildi ✔" : "Kaydedilemedi ✖";
      setTimeout(()=>{ btn.textContent = old; }, 1400);
      if (window.toast) {
        window.toast({
          type: ok ? "success" : "error",
          title: ok ? "Başarılı" : "Hata",
          body: ok ? "Ayarlar başarıyla kaydedildi." : "Kayıt sırasında bir hata oluştu."
        });
      }
    }catch(_e){ if (window.toast) window.toast({type:"success", title:"Başarılı", body:"Ayarlar başarıyla kaydedildi."}); }
  });
})();

  // ========================================
  // AUTO SPINNER FOR FILE INPUTS
  // ========================================
  (function initAutoSpinner() {
    // Tüm file input'ları dinle
    document.addEventListener('change', function(e) {
      const target = e.target;
    
      // Sadece file input'ları için çalış
      if (target.tagName === 'INPUT' && target.type === 'file' && target.files.length > 0) {
        const file = target.files[0];
      
        // Geçerli dosya uzantısı kontrolü
        const accept = target.getAttribute('accept') || '';
        const validExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());
        const fileName = file.name.toLowerCase();
      
        // Uzantı kontrolü
        const isValid = validExtensions.length === 0 || validExtensions.some(ext => {
          const cleanExt = ext.replace('.', '');
          return fileName.endsWith('.' + cleanExt);
        });
      
        if (isValid && window.showSpinner) {
          window.showSpinner('Veriler işleniyor...');
        
          // 2 saniye sonra spinner'ı kapat
          setTimeout(function() {
            if (window.hideSpinner) {
              window.hideSpinner();
            }
          }, 2000);
        }
      }
    });

    // Dropzone'lar için drop olayını dinle
    document.addEventListener('drop', function(e) {
      try {
        const dt = e.dataTransfer;
        if (!dt || !dt.files || dt.files.length === 0) return;
        // Sadece .dropzone veya #dropZone içine bırakıldıysa tetikle
        const el = e.target instanceof Element ? e.target.closest('.dropzone, #dropZone') : null;
        if (!el) return;
        if (window.showSpinner) {
          window.showSpinner('Veriler işleniyor...');
          setTimeout(function(){ window.hideSpinner && window.hideSpinner(); }, 2000);
        }
      } catch(_) { /* ignore */ }
    }, true);
  })();

  // ========================================
  // Log Panel Interaction
  // ========================================
  (function initLogPanel(){
    const toggle = document.getElementById('logToggle');
    const panel = document.getElementById('logPanel');
    const clearBtn = document.getElementById('logClearBtn');
    if(!toggle || !panel) return;
    function open(){ panel.hidden = false; logEvent('ui','Log panel açıldı'); }
    function close(){ panel.hidden = true; logEvent('ui','Log panel kapatıldı'); }
    toggle.addEventListener('click', ()=>{ panel.hidden ? open(): close(); });
    clearBtn?.addEventListener('click', ()=>{
      const body = document.getElementById('logPanelBody');
      if(body){ body.innerHTML=''; }
      if(window.__LOG_BUFFER__) window.__LOG_BUFFER__.length = 0;
      const stats = document.getElementById('logStats'); if(stats) stats.textContent='0 kayıt';
      // localStorage'dan da temizle
      try{ localStorage.removeItem('app_logs'); }catch(_){}
      logEvent('ui','Loglar temizlendi');
    });
  })();
