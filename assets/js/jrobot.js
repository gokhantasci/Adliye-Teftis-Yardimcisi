// /assets/js/jrobot.js — v2-stable (Statü, Kayıt Türü ve Hatırlatmalar)
(() => {
  'use strict';

  // ==== Kısayollar ====
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const debounce = (fn, d = 180) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; };
  const pick = (obj, dotted) => dotted.split('.').reduce((cur,p) => (cur && typeof cur === 'object' && p in cur) ? cur[p] : '', obj) ?? '';
  const toDayNum = iso => { if (!iso) return null; const d = new Date(iso); if (!Number.isFinite(d.getTime())) return null; d.setHours(0,0,0,0); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  const fmtInt = n => new Intl.NumberFormat('tr-TR').format(n || 0);
  // ==== Hatırlatmalar (yerel state) ====
  const HAT = { rows: [], page: 1, pageSize: 5, q: '', showDone: false };

  // ==== Global durum ====
  let RAW = [];     // tüm kayıtlar
  let VIEW = [];    // filtrelenmiş görünüm

  // ---- Hatırlatma "Yapıldı" kalıcılığı (localStorage)
  const DONE_LS_KEY = 'jr_hatir_done_v1';

  function loadDoneMap(){
    try { return JSON.parse(localStorage.getItem(DONE_LS_KEY) || '{}'); } catch (e){ return {}; }
  }
  function saveDoneMap(map){
    try { localStorage.setItem(DONE_LS_KEY, JSON.stringify(map)); } catch (e){}
  }
  function stripHtml(s){
    const tmp = document.createElement('div');
    tmp.innerHTML = String(s || '');
    return tmp.textContent || tmp.innerText || '';
  }
  function rowKeyForReminder(r){
    const oneri = stripHtml(r.oneriHtml || r.oneri || '').trim();
    const dn = String(r.dosyaNo || '').trim();
    const kn = String(r.kararNo || '').trim();
    return `${dn}::${kn}::${oneri}`;
  }
  function isReminderDone(r){
    const m = loadDoneMap();
    return !!m[rowKeyForReminder(r)];
  }
  function setReminderDoneByKey(key, val){
    const m = loadDoneMap();
    if (val) m[key] = Date.now(); else delete m[key];
    saveDoneMap(m);
  }

  // Kapanış alan adları
  const CLOSE_KEYS = ['kapanisTarihi','dosyaKapanisTarihi','kapatmaTarihi','kapanmaTarihi','kapanışTarihi'];

  // Tarih filtreleri (#col2)
  const DF = { acilis:{from:'',to:''}, karar:{from:'',to:''}, kapanis:{from:'',to:''} };

  // Role kartları state (5'li pager)
  const CARD_PAGE_SIZE = 5;
  const JR_STATE = {
    hakim:{page:1,q:''},
    savci:{page:1,q:''},
    katip:{page:1,q:''},
    // 2. satır yeni kartlar:
    statu:{page:1,q:''},
    kayit:{page:1,q:''}
  };

  // ISO tarihe ay ekleyip day-number döndürür
  function addMonthsToISOToDayNum(iso, months){
    if (!iso) return null;
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return null;
    d.setHours(0,0,0,0);
    d.setMonth(d.getMonth() + months);
    return toDayNum(d.toISOString().slice(0,10));
  }

  // ==== DOM ====
  const dropZone   = $('#udfDrop');
  const fileInput  = $('#udfInput');
  const chosenHint = $('#udfChosen');
  const col2       = $('#col2');
  const col10      = $('#col10');

  // ==== JSON yükleme ====
  fileInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []).filter(f => /\.json$/i.test(f.name));
    if (!files.length) return toastERR('Lütfen .json dosyası seçin.');
    await initFromFiles(files);
  });
  if (dropZone){
    dropZone.addEventListener('click', () => fileInput?.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('is-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-over'));
    dropZone.addEventListener('drop', async e => {
      e.preventDefault(); dropZone.classList.remove('is-over');
      const files = Array.from(e.dataTransfer?.files || []).filter(f => /\.json$/i.test(f.name));
      if (!files.length) return toastERR('Lütfen .json dosyası bırakın.');
      await initFromFiles(files);
    });
  }

  function normStrTR(s){
    return String(s ?? '')
      .toLocaleLowerCase('tr-TR')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // r.taraflar alanını normalize eder
  function normalizeTaraflar(val){
    if (Array.isArray(val)) {
      const parts = val.map(v => {
        if (v && typeof v === 'object') {
          return normStrTR(Object.values(v).join(' '));
        }
        return normStrTR(v);
      }).filter(Boolean).sort();
      return parts.join(' | ');
    }
    if (val && typeof val === 'object') {
      return normStrTR(Object.values(val).join(' '));
    }
    return normStrTR(val);
  }

  // (geldigiDosyaId + taraflar) anahtarı
  function dupKeyByGeldigiVeTaraflar(rec){
    const gid = String(rec?.geldigiDosyaId ?? '').trim();
    const taraf = normalizeTaraflar(rec?.taraflar);
    if (!gid || !taraf) return '';
    return gid + ' :: ' + taraf;
  }

  async function initFromFiles(files){
    try {
      const arrays = [];
      for (const f of files){
        const txt = await f.text();
        const data = JSON.parse(txt);
        if (Array.isArray(data)) arrays.push(data);
      }
      RAW = arrays.flat();
      VIEW = RAW.slice();

      if (chosenHint) chosenHint.textContent = files.map(f => f.name).join(', ');
      toastOK(`${RAW.length.toLocaleString('tr-TR')} kayıt yüklendi.`);

      // JSON başarıyla yüklendi: Çoklu Excel kartını görünür yap
      const mcard = document.getElementById('multiExcelCard');
      if (mcard) mcard.style.display = '';

      destroyInfoCard();
      ensureSideFilterCard();
      ensureSecondRowCards();
      buildHatirlatmaCard();
      applyFilters();
      renderRoleCards();
      renderSecondRowCards();
      refreshHatirlatmaCard();
    } catch (e){
      toastERR('JSON okunamadı: ' + (e.message || e));
    }
  }

  // ==== “Bilgi” kartını yok et ====
  function destroyInfoCard(){
    if (!col2) return;
    const cards = $$('#col2 > .card');
    for (const c of cards){
      const hdr = c.querySelector('.card-head, .card-header');
      const strong = hdr?.querySelector('strong');
      if (strong && strong.textContent.trim().toLowerCase() === 'bilgi'){ c.remove(); break; }
    }
  }

  // ==== #col2 tarih filtre kartı ====
  const uploadCard = document.getElementById('jsonUploadCard');
  if (uploadCard) uploadCard.style.alignSelf = 'start';
  function ensureSideFilterCard(){
    if (!col2) return;
    if ($('#jrSideDateCard')) return;

    const card = document.createElement('section');
    card.className = 'card';
    card.id = 'jrSideDateCard';
    card.style.alignSelf = 'start';
    card.innerHTML = `
      <div class="card-header d-flex flex-wrap align-items-center gap-2">
        <strong style="font-size:var(--fs-md);margin:0;" class="me-auto">Tarih Filtresi</strong>
        <button type="button" class="chip" id="btnClr_acilis" data-key="acilis" data-active="0" hidden>Açılış ✕</button>
        <button type="button" class="chip" id="btnClr_karar" data-key="karar" data-active="0" hidden>Karar ✕</button>
        <button type="button" class="chip" id="btnClr_kapanis" data-key="kapanis" data-active="0" hidden>Kapanış ✕</button>
        <button type="button" class="chip" id="btnClr_all" hidden>Tümü ✕</button>
      </div>
      <div class="card-body" style="padding:14px;">
        ${pairBlock('Açılış', 'acilis')}
        ${pairBlock('Karar',  'karar')}
        ${pairBlock('Kapanış','kapanis')}
      </div>
      <div class="card-footer">
        <div class="d-flex gap-2">
          <button class="btn" id="btnClearAll" style="font-size:var(--fs-sm);">Tümünü Temizle</button>
          <button class="btn" id="btnApplyDateFilters" style="font-size:var(--fs-sm);">Uygula</button>
        </div>
      </div>
    `;
    col2.appendChild(card);

    // Space => bugün, Enter => Uygula
    card.querySelectorAll('input[type="date"]').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.code === 'Space' || e.key === ' '){
          e.preventDefault();
          const d = new Date(), y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
          inp.value = `${y}-${m}-${day}`;
          validateAll();
        } else if (e.key === 'Enter'){
          $('#btnApplyDateFilters')?.click();
        }
      });
      inp.addEventListener('input', debounce(() => { validateAll(); updateHeaderChips(); }, 120));
    });

    // Tek tek temizle (chip click)
    ['acilis','karar','kapanis'].forEach(key => {
      card.querySelector(`#btnClr_${key}`)?.addEventListener('click', () => {
        $(`#${key}From`).value = '';
        $(`#${key}To`).value   = '';
        setPairState(key, {from:'',to:''});
        validateAll();
        updateHeaderChips();
        applyFilters();
      });
    });
    // Hepsini temizle chip
    card.querySelector('#btnClr_all')?.addEventListener('click', () => {
      ['acilis','karar','kapanis'].forEach(k => { $(`#${k}From`).value = ''; $(`#${k}To`).value = ''; setPairState(k,{from:'',to:''}); });
      validateAll(); updateHeaderChips(); applyFilters();
    });
    // Keyboard accessibility for chips
    card.querySelectorAll('.chip').forEach(chip => {
      chip.tabIndex = 0;
      chip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); chip.click(); } });
    });

    // Uygula / Hepsini Temizle
    $('#btnApplyDateFilters')?.addEventListener('click', () => {
      const invalids = validateAll(true);
      if (invalids.length) toastERR(`Hatalı aralık temizlendi: ${invalids.join(', ')}`);
      updateHeaderChips();
      applyFilters();
      try {
        const sums = [DF.acilis,DF.karar,DF.kapanis].map(x => (x.from || x.to) ? 1 : 0).reduce((a,b) => a + b,0);
        const filtered = Array.isArray(VIEW) ? VIEW.length : 0;
        const totalRaw = Array.isArray(RAW) ? RAW.length : filtered;
        const msg = sums ? `Filtre uygulandı (${sums} aktif, ${filtered.toLocaleString('tr-TR')} / ${totalRaw.toLocaleString('tr-TR')} kayıt).` : `Filtre kaldırıldı (${totalRaw.toLocaleString('tr-TR')} kayıt).`;
        window.toast?.({ type: sums ? 'info' : 'warning', title: 'Tarih Filtresi', body: msg, delay: 3500 });
      } catch (_){}
    });
    $('#btnClearAll')?.addEventListener('click', () => {
      ['acilis','karar','kapanis'].forEach(k => {
        $(`#${k}From`).value = ''; $(`#${k}To`).value = '';
        setPairState(k,{from:'',to:''});
      });
      clearErrors();
      updateHeaderChips();
      applyFilters();
      try {
        const totalRaw = Array.isArray(RAW) ? RAW.length : (Array.isArray(VIEW) ? VIEW.length : 0);
        window.toast?.({ type:'warning', title:'Tarih Filtresi', body:`Tüm filtreler temizlendi (${totalRaw.toLocaleString('tr-TR')} kayıt).`, delay:3000 });
      } catch (_){}
    });
    updateHeaderChips();
  }

  function pairBlock(title, key){
    return `
      <div class="mb-2">
        <label class="form-label mb-1 small d-block">${esc(title)}</label>
        <div class="date-range-group">
          <input type="date" class="form-control form-control-sm" id="${key}From" aria-label="${title} Başlangıç">
          <span class="range-sep">–</span>
          <input type="date" class="form-control form-control-sm" id="${key}To" aria-label="${title} Bitiş">
        </div>
        <div class="invalid-feedback d-block small mt-1" id="err_${key}" style="display:none"></div>
      </div>
    `;
  }

  function setPairState(key, st){ DF[key].from = st.from || ''; DF[key].to = st.to || ''; }
  function validatePair(key){
    const from = $(`#${key}From`)?.value || '';
    const to   = $(`#${key}To`)?.value   || '';
    const err  = $(`#err_${key}`);
    const fEl  = $(`#${key}From`);
    const tEl  = $(`#${key}To`);
    const chip = $(`#btnClr_${key}`);
    let valid = true, msg = '';
    if (from && to){
      const f = toDayNum(from), t = toDayNum(to);
      if (f !== null && t !== null && f > t){ valid = false; msg = 'Başlangıç, Bitiş’ten büyük olamaz.'; }
    }
    [fEl,tEl].forEach(el => el && el.classList.toggle('is-invalid', !valid && (from || to)));
    if (err){ err.style.display = (!valid && (from || to)) ? 'block' : 'none'; err.textContent = (!valid && (from || to)) ? msg : ''; }
    if (chip) chip.hidden = !(from || to);
    return { valid, from, to };
  }
  function validateAll(autoFix = false){
    const keys = ['acilis','karar','kapanis'];
    const invalids = [];
    keys.forEach(k => {
      const v = validatePair(k);
      if (v.valid){ setPairState(k, v); } else {
        if (autoFix){
          setPairState(k, {from:'',to:''});
          $(`#${k}From`).value = ''; $(`#${k}To`).value = '';
          const err = $(`#err_${k}`); err && (err.style.display = 'none');
          [$(`#${k}From`), $(`#${k}To`)].forEach(el => el && el.classList.remove('is-invalid'));
        } else invalids.push(k);
      }
    });
    return invalids;
  }
  function updateHeaderChips(){
    ['acilis','karar','kapanis'].forEach(k => {
      const chip = $(`#btnClr_${k}`); if (!chip) return;
      const st = DF[k];
      const has = !!(st.from || st.to);
      chip.hidden = !has;
      chip.dataset.active = has ? '1' : '0';
      if (has){
        chip.textContent = (k === 'acilis' ? 'Açılış' : (k === 'karar' ? 'Karar' : 'Kapanış')) + ': ' + (st.from || '…') + ' – ' + (st.to || '…') + ' ✕';
      } else {
        chip.textContent = (k === 'acilis' ? 'Açılış' : (k === 'karar' ? 'Karar' : 'Kapanış')) + ' ✕';
      }
    });
    const any = [DF.acilis,DF.karar,DF.kapanis].some(st => st.from || st.to);
    const allChip = $('#btnClr_all'); if (allChip){ allChip.hidden = !any; }
  }
  function clearErrors(){
    ['acilis','karar','kapanis'].forEach(k => {
      const err = $(`#err_${k}`); err && (err.style.display = 'none');
      [$(`#${k}From`), $(`#${k}To`)].forEach(el => el && el.classList.remove('is-invalid'));
    });
  }

  // ==== Filtre uygula ====
  function inRange(iso, range){
    if (!range || (!range.from && !range.to)) return true;
    const dn = toDayNum(iso);
    if (range.from){ const f = toDayNum(range.from); if (dn === null || dn < f) return false; }
    if (range.to){   const t = toDayNum(range.to);   if (dn === null || dn > t) return false; }
    return true;
  }
  function anyCloseInRange(rec, range){
    if (!range || (!range.from && !range.to)) return true; // filtre kapalı → geçir
    let seen = false;
    for (const k of CLOSE_KEYS){
      if (!(k in rec)) continue;
      seen = true;
      if (inRange(rec[k], range)) return true;
    }
    return seen ? false : true; // kapanış yoksa filtreyi yok say
  }
  function applyFilters(){
    VIEW = RAW.filter(r => {
      if (!inRange(pick(r,'dosyaAcilisTarihi'), DF.acilis)) return false;
      if (!inRange(pick(r,'kararTarihi'),      DF.karar )) return false;
      if (!anyCloseInRange(r, DF.kapanis))                return false;
      return true;
    });
    renderRoleCards();
    renderSecondRowCards();
    refreshHatirlatmaCard(); // Filtre değişince hatırlatmalar da yenilensin
  }

  // ==== 1. SATIR: Role kartları ====
  function computeGroups(type){
    const groups = new Map();

    for (const r of VIEW){
      let ids = [];
      if (type === 'hakim')      ids = [r.hukumHakimBaskanPId, r.hukumUye1PId, r.hukumUye2PId];
      else if (type === 'savci') ids = [r.hukumSavciPId, r.hukumSavciPId2, r.hukumSavciPId3, r.hukumSavciPId4, r.hukumSavciPId5];
      else if (type === 'katip') ids = [r.hukumKatipPId];

      else if (type === 'statu') {
        const val = String(r.statuAcklm ?? '').trim();
        if (val) { if (!groups.has(val)) groups.set(val,{count:0,rows:[]}); const g = groups.get(val); g.count++; g.rows.push(r); }
        continue;
      } else if (type === 'kayit') {
        const val = String(pick(r, 'dosyaKayitTuru.aciklama') ?? '').trim();
        if (val) { if (!groups.has(val)) groups.set(val,{count:0,rows:[]}); const g = groups.get(val); g.count++; g.rows.push(r); }
        continue;
      } else {
        continue;
      }

      ids.forEach(id => {
        const k = String(id ?? '').trim(); if (!k) return;
        if (!groups.has(k)) groups.set(k,{count:0,rows:[]});
        const g = groups.get(k); g.count++; g.rows.push(r);
      });
    }

    return [...groups.entries()]
      .map(([key,data]) => ({ key, count:data.count, rows:data.rows }))
      .sort((a,b) => b.count - a.count || a.key.localeCompare(b.key, 'tr'));
  }

  function ensureCardActions(){
    const specs = [
      { id:'hakimCard', bodyId:'hakimBody', key:'hakim',   col:null },
      { id:'savciCard', bodyId:'savciBody', key:'savci',   col:null },
      { id:'katipCard', bodyId:'katipBody', key:'katip',   col:null },
      { id:'statuCard', bodyId:'statuBody', key:'statu',   col:null },
      { id:'kayitCard', bodyId:'kayitBody', key:'kayit',   col:null }
    ];

    specs.forEach(({id,key,bodyId}) => {
      const card = document.getElementById(id);
      if (!card) return;
      const head = card.querySelector('.card-header') || card.querySelector('.card-head');
      if (!head) return;

      if (!head.querySelector(`#${key}Search`)){
        const actions = document.createElement('div');
        actions.className = 'd-flex justify-content-end align-items-center gap-2 flex-wrap';
        actions.style.marginLeft = 'auto';
        actions.innerHTML = `
          <input id="${key}Search" type="text" class="form-control form-control-sm"
            placeholder="${key === 'statu' ? 'Statü ara' : '139329'}" list="${key}Suggestions">
          <datalist id="${key}Suggestions"></datalist>
          <button class="btn" id="${key}SaveBtn" style="display:inline-flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded" style="font-size:18px;">save</span>
            <span>XLS</span>
          </button>
        `;
        head.appendChild(actions);

        const inp = actions.querySelector(`#${key}Search`);
        inp.addEventListener('input', debounce(() => {
          JR_STATE[key].q = (inp.value || '').trim().toLowerCase();
          JR_STATE[key].page = 1;
          if (key === 'hakim' || key === 'savci' || key === 'katip') renderCard(key);
          else renderSecondCard(key);
        },120));

        actions.querySelector(`#${key}SaveBtn`)?.addEventListener('click', () => {
          let groups = computeGroups(key);
          const q = JR_STATE[key].q;
          if (q) groups = groups.filter(g => g.key.toLowerCase().includes(q));
          const rows = groups.map(g => ({ Değer:g.key, Adet:g.count }));
          exportXLS(rows, `${key}_gruplar.xlsx`);
        });

        card._fillSuggestions = function(){
          const dl = actions.querySelector(`#${key}Suggestions`); if (!dl) return;
          const groups = computeGroups(key).slice(0,20);
          dl.innerHTML = groups.map(g => `<option value="${esc(g.key)}">${esc(g.key)} • ${g.count}</option>`).join('');
        };
      }

      // İçerik tıklama → modal (delege)
      const bodyEl = document.getElementById(bodyId);
      if (bodyEl && !bodyEl.dataset.clickBound){
        bodyEl.addEventListener('click', (e) => {
          const tr = e.target.closest('tr[data-key]');
          if (!tr) return;
          const val = tr.getAttribute('data-key');
          if (!val) return;
          openListModal(key, val);
        });
        bodyEl.dataset.clickBound = '1';
      }
    });
  }

  function renderCard(key){
    const bodyId = (key === 'hakim') ? 'hakimBody' : (key === 'savci' ? 'savciBody' : 'katipBody');
    const bodyEl = document.getElementById(bodyId);
    if (!bodyEl) return;

    let groups = computeGroups(key);
    const q = JR_STATE[key].q;
    if (q) groups = groups.filter(g => String(g.key).toLowerCase().includes(q));

    const total = groups.length;
    const mp = Math.max(1, Math.ceil(total / CARD_PAGE_SIZE));
    if (JR_STATE[key].page > mp) JR_STATE[key].page = mp;
    const start = (JR_STATE[key].page - 1) * CARD_PAGE_SIZE;
    const end   = Math.min(start + CARD_PAGE_SIZE, total);
    const pageRows = groups.slice(start, end);

    bodyEl.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm mb-0">
          <thead class="table-light">
            <tr><th>#</th><th>Sicil</th><th class="text-end">Adet</th></tr>
          </thead>
          <tbody>
            ${pageRows.map((g,i) => `
              <tr data-key="${esc(g.key)}" style="cursor:pointer">
                <td class="text-body-secondary">${start + i + 1}</td>
                <td>${esc(g.key)}</td>
                <td class="text-end">${g.count.toLocaleString('tr-TR')}</td>
              </tr>
            `).join('') || `<tr><td colspan="3" class="text-body-secondary">Kayıt yok.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    const cardEl = bodyEl.closest('.card');
    let footer = cardEl.querySelector(':scope > .card-footer');
    if (!footer){
      footer = document.createElement('div');
      footer.className = 'card-footer';
      cardEl.appendChild(footer);
    }
    footer.innerHTML = `
      <div class="pager" style="display:flex;align-items:center;justify-content:center;gap:8px;">
        <div><button class="btn" id="${key}Prev">Önceki</button></div>
        <div class="muted" style="min-width:80px;text-align:center;">${total ? (start + 1) : 0}–${end} / ${total}</div>
        <div><button class="btn" id="${key}Next">Sonraki</button></div>
      </div>
    `;
    footer.querySelector(`#${key}Prev`)?.addEventListener('click', () => { if (JR_STATE[key].page > 1){ JR_STATE[key].page--; renderCard(key);} });
    footer.querySelector(`#${key}Next`)?.addEventListener('click', () => { if (JR_STATE[key].page < mp){ JR_STATE[key].page++; renderCard(key);} });

    const card = cardEl; if (typeof card._fillSuggestions === 'function') card._fillSuggestions();
  }

  function renderRoleCards(){
    ensureCardActions();
    // Panelleri göster (yükleme sonrası)
    ['hakimCard', 'savciCard', 'katipCard'].forEach(id => {
      const panel = document.getElementById(id);
      if (panel) panel.style.display = '';
    });
    renderCard('hakim');
    renderCard('savci');
    renderCard('katip');
  }

  // ==== Yardımcılar ====
  function normalizeTR(s){ return String(s ?? '').trim().toLocaleLowerCase('tr-TR'); }
  function hasValue(v){ return v !== null && v !== undefined && String(v).trim() !== ''; }

  // ==== Hatırlatmalar – UI Kur ====
  function buildHatirlatmaCard() {
	  // --- Sayaç bilgisini al ve toast ile göster ---
    if (window.jQuery && typeof window.jQuery.getJSON === 'function') {
		  window.jQuery.getJSON('https://sayac.657.com.tr/arttirkarar', function(response) {
        try {
			  const adetRaw = (response && typeof response.adet !== 'undefined') ? Number(response.adet) : 0;
			  if (adetRaw > 0) {
            const msg = `28/10/2025 tarihinden bugüne kadar ${fmtInt(adetRaw)} adet işlem yaptık.`;
            window.toast?.({ type: 'info', title: 'Başarılı', body: msg, delay : 9000 });
			  }
        } catch (e) {
			  console.warn('Sayaç verisi okunamadı:', e);
        }
		  }).fail(function() {
        console.warn('Sayaç servisine ulaşılamadı.');
		  });
    }
    const body = document.getElementById('hatirlatmaBody');
    if (!body) return;

    body.innerHTML = '';

    // Kontrolleri card header'a taşıyoruz
    const hatirCard = body.closest('.card');
    const cardHeader = hatirCard ? hatirCard.querySelector('.card-header') : null;

    if (cardHeader) {
      // Mevcut kontrol div'ini temizle veya oluştur
      let controlsInHeader = cardHeader.querySelector('.jr-controls');
      if (!controlsInHeader) {
        controlsInHeader = document.createElement('div');
        controlsInHeader.className = 'jr-controls';
        controlsInHeader.style.marginLeft = 'auto';
        controlsInHeader.style.display = 'flex';
        controlsInHeader.style.alignItems = 'center';
        controlsInHeader.style.gap = '12px';
        cardHeader.appendChild(controlsInHeader);
      }

      controlsInHeader.innerHTML = `
        <label class="form-check form-switch m-0" style="display:inline-flex;align-items:center;gap:6px;">
          <input id="hatirToggleDone" class="form-check-input" type="checkbox" role="switch" style="margin:0;">
          <span class="small" style="white-space:nowrap;">Yapılanları göster</span>
        </label>
        <button class="btn subtle" id="hatirExport" style="white-space:nowrap;">
          <span class="material-symbols-rounded" style="font-size:18px;">save</span>
          <span>XLSX</span>
        </button>
      `;
    }
    // Log yapıldı işaretlemeleri
    body.addEventListener('change', function(e){
      const cb = e.target.closest('input.hatir-done[type="checkbox"]');
      if (!cb) return;
      const key = cb.getAttribute('data-key') || '';
      const parts = key.split('::');
      const dosyaNo = parts[0] || '';
      const kararNo = parts[1] || '';
      if (window.logEvent) {
        const state = cb.checked ? 'yapıldı olarak işaretlendi' : 'yapılmadı olarak işaretlendi';
        window.logEvent('action', `Dosya ${dosyaNo}, Karar ${kararNo} ${state}`);
      }
    });

    // Tablo iskeleti
    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-responsive';
    tableWrap.innerHTML = `
      <table class="table table-sm align-middle mb-0" id="hatirlatmaTable">
        <thead class="table-light">
          <tr>
            <th style="width:40px">#</th>
            <th>Dosya No</th>
            <th>Karar No</th>
            <th>Öneri</th>
            <th style="width:88px" class="text-center">Yapıldı</th>
          </tr>
        </thead>
        <tbody id="hatirlatmaTBody">
          <tr><td colspan="5" class="text-body-secondary small py-3">Veri bekleniyor...</td></tr>
        </tbody>
      </table>
    `;

    // Find or create Bootstrap card-footer for hatirlatma card
    let cardFoot = hatirCard ? (hatirCard.querySelector('.card-footer') || hatirCard.querySelector('.card-foot')) : null;
    if (!cardFoot && hatirCard) {
      cardFoot = document.createElement('div');
      cardFoot.className = 'card-footer';
      hatirCard.appendChild(cardFoot);
    }

    const pager = document.createElement('div');
    pager.className = 'pager';
    pager.id = 'hatirlatmaPager';
    pager.innerHTML = `
      <div><button class="btn" id="hatirPrev">Önceki</button></div>
      <div class="muted" id="hatirPageInfo">Sayfa 1/1</div>
      <div><button class="btn" id="hatirNext">Sonraki</button></div>
    `;

    body.appendChild(tableWrap);

    // Append pager to card-footer (preferred) or fallback to body
    if (cardFoot) {
      cardFoot.innerHTML = '';
      cardFoot.appendChild(pager);
    } else {
      body.appendChild(pager);
    }

    // Eventler
    $('#hatirSearch')?.addEventListener('input', debounce((e) => {
      HAT.q = (e.target.value || '').trim().toLowerCase();
      HAT.page = 1;
      renderHatirlatmaTable();
    }, 120));

    $('#hatirExport')?.addEventListener('click', () => {
      const all = getFilteredHatirRows();
      const rows = all.map((r,i) => ({ '#': i + 1, dosyaNo: r.dosyaNo, kararNo: r.kararNo, oneri: stripHtml(r.oneriHtml || r.oneri || '') }));
      exportXLS(rows, 'hatirlatmalar.xlsx');
    });

    $('#hatirPrev')?.addEventListener('click', () => { if (HAT.page > 1){ HAT.page--; renderHatirlatmaTable(); } });
    $('#hatirNext')?.addEventListener('click', () => {
      const total = getFilteredHatirRows().length;
      const pages = Math.max(1, Math.ceil(total / HAT.pageSize));
      if (HAT.page < pages){ HAT.page++; renderHatirlatmaTable(); }
    });

    // Toggle burada (eleman kesin var)
    $('#hatirToggleDone')?.addEventListener('change', (e) => {
      HAT.showDone = !!e.target.checked;
      HAT.page = 1;
      renderHatirlatmaTable();
    });
  }

  // Hatırlatma satırlarında "Yapıldı" checkbox'ı — delege
  if (!document.documentElement.dataset.hatirDoneBound){
    document.addEventListener('change', (e) => {
      const inp = e.target;
      if (inp && inp.classList.contains('hatir-done')){
        const key = inp.getAttribute('data-key') || '';
        const checked = !!inp.checked;
        if (key){
          setReminderDoneByKey(key, checked);
          // showDone kapalıysa işaretlenen satırı anında gizle
          if (!HAT.showDone || !checked){
            renderHatirlatmaTable();
          } else {
            // showDone açıkken de redraw edelim ki sınıflar güncellensin
            renderHatirlatmaTable();
          }
          try { window.toast?.({type:'success', title: checked ? 'İşaretlendi' : 'Geri alındı', body: checked ? 'Hatırlatma yapıldı olarak kaydedildi.' : 'Hatırlatma yapılmadı durumuna alındı.'}); } catch {}
        }
      }
    }, true);
    document.documentElement.dataset.hatirDoneBound = '1';
  }

  // ==== Hatırlatmalar – Tablo doldur / pager ====
  function setHatirlatmaData(arr){
    HAT.rows = Array.isArray(arr) ? arr : [];
    HAT.page = 1;
    renderHatirlatmaTable();
  }

  function getFilteredHatirRows(){
    const q = HAT.q;
    let base = HAT.rows.slice();

    // Toggle kapalıysa "yapıldı" olanları gizle
    if (!HAT.showDone) base = base.filter(r => !isReminderDone(r));

    // Arama
    if (q){
      base = base.filter(r => {
        const hay = (r.dosyaNo || '') + ' ' + (r.kararNo || '') + ' ' + stripHtml(r.oneriHtml || r.oneri || '');
        return hay.toLowerCase().includes(q);
      });
    }

    return base;
  }

  function renderHatirlatmaTable(){
    const tbody = $('#hatirlatmaTBody');
    const pageInfo = $('#hatirPageInfo');
    const prevBtn = $('#hatirPrev');
    const nextBtn = $('#hatirNext');
    if (!tbody) return;

    const all = getFilteredHatirRows();
    const total = all.length;
    if (!total){
      tbody.innerHTML = `<tr><td colspan="5" class="text-body-secondary small py-3">Kayıt bulunamadı.</td></tr>`;
      pageInfo && (pageInfo.textContent = 'Sayfa 0/0');
      prevBtn && (prevBtn.disabled = true);
      nextBtn && (nextBtn.disabled = true);
      return;
    }

    const pages = Math.max(1, Math.ceil(total / HAT.pageSize));
    if (HAT.page > pages) HAT.page = pages;
    const start = (HAT.page - 1) * HAT.pageSize;
    const end = Math.min(start + HAT.pageSize, total);
    const slice = all.slice(start, end);

    tbody.innerHTML = slice.map((r,i) => {
      const key = rowKeyForReminder(r);
      const done = isReminderDone(r);
      const trCls = done ? 'class="table-light text-body-secondary"' : '';
      return `
        <tr ${trCls}>
          <td class="text-body-secondary">${start + i + 1}</td>
          <td>${esc(r.dosyaNo || '')}</td>
          <td>${esc(r.kararNo || '')}</td>
          <td>${r.oneriHtml || esc(r.oneri || '')}</td>
          <td class="text-center">
            <input type="checkbox" class="form-check-input hatir-done" data-key="${esc(key)}" aria-label="Yapıldı" ${done ? 'checked' : ''}>
          </td>
        </tr>
      `;
    }).join('');

    pageInfo && (pageInfo.textContent = `Sayfa ${HAT.page}/${pages}`);
    prevBtn && (prevBtn.disabled = (HAT.page <= 1));
    nextBtn && (nextBtn.disabled = (HAT.page >= pages));
  }

  // ==== Hatırlatmalar – Kurallara göre doldur ====
  function refreshHatirlatmaCard() {
    const rows = (window.G && Array.isArray(G.rows)) ? G.rows : VIEW;
    const out = [];

    const TARGET_BYU  = 'ceza dava dosyası (basit yargılama usulü)';
    const TARGET_HAGB = "hagb'ye uyulmaması üzerine açılış";

    let byuCount = 0, hagbCount = 0, durCount = 0, tarafCount = 0, genBYUCount = 0;
    const byuSamples = [], hagbSamples = [], durSamples = [], tarafSamples = [], genBYUSamples = [];

    // BUGÜN (sıfırlanmış)
    const today = new Date(); today.setHours(0,0,0,0);
    const todayDN = toDayNum(today.toISOString().slice(0,10));

    // Mükerrer anahtarlar (geldigiDosyaId + taraflar)
    const DUP = new Map();
    for (const r of rows){
      const k = dupKeyByGeldigiVeTaraflar(r);
      if (!k) continue;
      DUP.set(k, (DUP.get(k) || 0) + 1);
    }

    for (const r of rows) {
      if (!r) continue;

      const dosyaNo = String(r.dosyaNo || r.cbsEsasNo || '').trim();
      const kararNo = String(r.kararNo || '').trim();

      // --- 1) BYU (tevzi edilmiş, kapalı değil)
      const tur = normalizeTR(r.dosyaTurKodAciklama);
      const gidRaw = r.gittigiDosyaId;
      const hasGid = (gidRaw !== null && gidRaw !== undefined && String(gidRaw).trim() !== '' && String(gidRaw) !== '0');
      const statNorm = normalizeTR(r.statuAcklm);
      const notKapali = !/kapal[ıi]/i.test(statNorm);

      if (tur === TARGET_BYU && hasGid && notKapali) {
        out.push({
          dosyaNo, kararNo,
          oneri: 'BYU Dosyası tevzi edilmiş, kapalı değil',
          oneriHtml: `🟡 BYU Dosyası tevzi edilmiş, kapalı değil`
        });
        byuCount++;
        if (byuSamples.length < 5) byuSamples.push({dosyaNo, kararNo});
      }

      // --- 2) HAGB açıklama dosyası
      const kayitAck = normalizeTR(r?.dosyaKayitTuru?.aciklama);
      const kapanis = r.dosyaKapanisTarihi;
      const hasKapanis = hasValue(kapanis);
      const gittigiNull = (r.gittigiDosyaId == null); // ✅ yeni koşul

      if (kayitAck === TARGET_HAGB && hasKapanis && gittigiNull) {
		  out.push({
          dosyaNo, kararNo,
          oneri: 'HAGB Açıklama dosyası tali karar fişi düzenlendi mi?',
          oneriHtml: `🔵 HAGB Açıklama dosyası tali karar fişi düzenlendi mi?`
		  });
		  hagbCount++;
		  if (hagbSamples.length < 5) hagbSamples.push({ dosyaNo, kararNo });
      }

      // --- 3) Karar <= Bugün <= Tâlik duruşma
      const kararDN = toDayNum(pick(r,'kararTarihi'));
      const talikDN = toDayNum(pick(r,'talikDurusmaTarihi'));
      if (kararDN !== null && talikDN !== null && kararDN <= todayDN && todayDN <= talikDN) {
        out.push({
          dosyaNo, kararNo,
          oneri: 'Dosya karara çıkmış ama duruşma günü silinmemiş',
          oneriHtml: `🟠 Dosya karara çıkmış ama duruşma günü silinmemiş`
        });
        durCount++;
        if (durSamples.length < 5) durSamples.push({dosyaNo, kararNo});
      }

      // --- 4) Taraf Bilgisi değişmiş (🔴)
      const tarafChanged = String(r?.tarafBilgisiDegisti ?? '').trim().toUpperCase() === 'E';
      if (tarafChanged) {
        out.push({
          dosyaNo, kararNo,
          oneri: 'Taraf Bilgisi sonradan değişmiş, kontrol.',
          oneriHtml: `🔴 Taraf Bilgisi sonradan değişmiş, kontrol.`
        });
        tarafCount++;
        if (tarafSamples.length < 5) tarafSamples.push({dosyaNo, kararNo});
      }

      // --- 5) Ceza Dava Dosyası olup BYU’ya ait olabilecek (Genel Tür)
      const isCezaDava   = normalizeTR(r.dosyaTurKodAciklama) === 'ceza dava dosyası';
      const noSavci2     = (r.hukumSavciPId === null || String(r.hukumSavciPId || '').trim() === ''); // <— düzeltme hatırlandı
      const notKapatildi = !/kapat[ıi]ld[ıi]/i.test(String(r.statuAcklm || ''));
      const hasKararNo   = String(r.kararNo || '').trim() !== '';

      // ➊ İcra birimlerini hariç tut
      const notIcra = !/icra/i.test(String(r.birimAdi || ''));

      // ➋ Tarih kontrolü: (dosyaAcilisTarihi + 30 gün) < kararTarihi
      const toDate = (s) => {
		  if (!s) return null;
		  const t = String(s).trim();
		  // ISO veya Date parse edilebilen formatlar
		  let d = new Date(t);
		  if (!isNaN(d)) return d;
		  // dd.mm.yyyy veya dd/mm/yyyy desteği
		  const m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
		  if (m) {
          const [_, dd, mm, yyyy] = m;
          d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
          return isNaN(d) ? null : d;
		  }
		  return null;
      };
      const addDays = (d, n) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + n) : null);

      const acilisT   = toDate(r.dosyaAcilisTarihi);
      const kararT    = toDate(r.kararTarihi || r.kararTarih); // varsa alternatif alan
      const acilis30  = addDays(acilisT, 30);
      const acilis30ltKarar = (acilis30 && kararT) ? (acilis30 < kararT) : false;

      if (notIcra && isCezaDava && noSavci2 && notKapatildi && hasKararNo && acilis30ltKarar) {
		  out.push({
          dosyaNo,
          kararNo,
          oneri: 'BYU dosyası olup Genel Tür de kalmış dosya olabilir mi?',
          oneriHtml: `🟡 BYU dosyası olup Genel Tür de kalmış dosya olabilir mi?`
		  });
		  genBYUCount++;
		  if (genBYUSamples.length < 5) genBYUSamples.push({ dosyaNo, kararNo });
      }


      // --- 7) Tâlik geçmiş (karar yok, talik < bugün)
      {
        const kararNull = !hasValue(pick(r,'kararTarihi'));
        const talikDN   = toDayNum(pick(r,'talikDurusmaTarihi'));
        if (kararNull && talikDN !== null && talikDN < todayDN) {
          out.push({
            dosyaNo, kararNo,
            oneri: 'Kaçak olabilir mi?',
            oneriHtml: '🟠 Kaçak olabilir mi?'
          });
        }
      }

      // --- 8) Yargıtay/İstinaf'tan dönmüş ama kapatılmamış
      {
		  const stNorm   = normalizeTR(r.statuAcklm);
		  const dondu    = stNorm.includes('yargıtaydan döndü') || stNorm.includes('istinaftan döndü');
		  const kapaliMi = hasValue(r.dosyaKapanisTarihi); // null/boş ise kapalı değil

		  // düzeltilen koşul: gittigiDosyaId == null
		  const noGid = (r.gittigiDosyaId == null); // null veya undefined

		  if (dondu && !kapaliMi && noGid) {
          out.push({
			  dosyaNo,
			  kararNo,
			  oneri: "Dosya Yargıtaydan / İstinaf'tan döndü kapalı değil.",
			  oneriHtml: "🟡 Dosya Yargıtaydan / İstinaf'tan döndü kapalı değil."
          });
		  }
      }

      // --- 9) Mükerrer: geldigiDosyaId + taraflar aynı (count > 1)
      {
        const k = dupKeyByGeldigiVeTaraflar(r);
        if (k && (DUP.get(k) || 0) > 1) {
          out.push({
            dosyaNo,
            kararNo,
            oneri: 'Mükerrer dosya olabilir mi, aynı dosyadan aynı kişi iki kere dava açılmış?',
            oneriHtml: '🟣 Mükerrer dosya olabilir mi, aynı dosyadan aynı kişi iki kere dava açılmış?'
          });
        }
      }

    }


    setHatirlatmaData(out);
  }

  // ==== 2. SATIR: UI iskeleti ====
  function ensureSecondRowCards(){
    if (!col10) return;
    if (document.getElementById('jrRow2')) return;

    const row = document.createElement('div');
    row.id = 'jrRow2';
    row.className = 'mt-1';

    // 1) Statü
    row.appendChild(wrapCard(`
      <div class="card h-100" id="statuCard">
        <div class="card-header py-2 d-flex align-items-center gap-2">
          <span class="material-symbols-rounded">flag</span>
          <strong class="small mb-0">Dosya Durumu</strong>
        </div>
        <div class="card-body p-0" id="statuBody"></div>
      </div>
    `));

    // 2) Kayıt Türü
    row.appendChild(wrapCard(`
      <div class="card h-100" id="kayitCard">
        <div class="card-header py-2 d-flex align-items-center gap-2">
          <span class="material-symbols-rounded">category</span>
          <strong class="small mb-0">Dosya Açılış Durumu</strong>
        </div>
        <div class="card-body p-0" id="kayitBody"></div>
      </div>
    `));

    // 3) Hatırlatmalar
    row.appendChild(wrapCard(`
      <div class="card h-100" id="hatirlatmaCard">
        <div class="card-header py-2 d-flex align-items-center gap-2">
          <span class="material-symbols-rounded">notifications_active</span>
          <strong class="small mb-0">Hatırlatmalar</strong>
        </div>
        <div class="card-body" id="hatirlatmaBody">
          <div class="text-body-secondary small">Bu kartı bir sonraki adımda tasarlayacağız.</div>
        </div>
      </div>
    `));

    col10.appendChild(row);

    function wrapCard(html){
      const d = document.createElement('div');
      d.innerHTML = html.trim();
      return d.firstElementChild;
    }
  }

  function renderSecondCard(key){
	  const bodyId = key === 'statu' ? 'statuBody' : 'kayitBody';
	  const bodyEl = document.getElementById(bodyId);
	  if (!bodyEl) return;

	  let groups = computeGroups(key);
	  const q = JR_STATE[key].q;
	  if (q) groups = groups.filter(g => String(g.key).toLowerCase().includes(q));

	  const total = groups.length;
	  const mp = Math.max(1, Math.ceil(total / CARD_PAGE_SIZE));
	  if (JR_STATE[key].page > mp) JR_STATE[key].page = mp;
	  const start = (JR_STATE[key].page - 1) * CARD_PAGE_SIZE;
	  const end   = Math.min(start + CARD_PAGE_SIZE, total); // <-- DÜZELTİLDİ
	  const pageRows = groups.slice(start, end);

	  bodyEl.innerHTML = `
		<div class="table-responsive">
		  <table class="table table-sm mb-0">
			<thead class="table-light">
			  <tr><th>#</th><th>${key === 'statu' ? 'Statü' : 'Açıklama'}</th><th class="text-end">Adet</th></tr>
			</thead>
			<tbody>
			  ${pageRows.map((g,i) => `
				<tr data-key="${esc(g.key)}" style="cursor:pointer">
				  <td class="text-body-secondary">${start + i + 1}</td>
				  <td>${esc(g.key)}</td>
				  <td class="text-end">${g.count.toLocaleString('tr-TR')}</td>
				</tr>
			  `).join('') || `<tr><td colspan="3" class="text-body-secondary">Kayıt yok.</td></tr>`}
			</tbody>
		  </table>
		</div>
	  `;

	  const cardEl = bodyEl.closest('.card');
	  let footer = cardEl.querySelector(':scope > .card-footer');
	  if (!footer){
      footer = document.createElement('div');
      footer.className = 'card-footer py-2';
      cardEl.appendChild(footer);
	  }
    footer.innerHTML = `
        <div class="pager" style="display:flex;align-items:center;justify-content:center;gap:8px;">
          <div><button class="btn" id="${key}Prev">Önceki</button></div>
          <div class="muted small" style="min-width:80px;text-align:center;">${total ? (start + 1) : 0}–${end} / ${total}</div>
          <div><button class="btn" id="${key}Next">Sonraki</button></div>
        </div>
      `;
	  footer.querySelector(`#${key}Prev`)?.addEventListener('click', () => { if (JR_STATE[key].page > 1){ JR_STATE[key].page--; renderSecondCard(key);} });
	  footer.querySelector(`#${key}Next`)?.addEventListener('click', () => { if (JR_STATE[key].page < mp){ JR_STATE[key].page++; renderSecondCard(key);} });

	  const card = cardEl; if (typeof card._fillSuggestions === 'function') card._fillSuggestions();
  }

  function renderSecondRowCards(){
    ensureCardActions();
    renderSecondCard('statu');
    renderSecondCard('kayit');
  }

  // ==== Sicil / Değer listesi modalı (diğer kartlar) ====
  const JR_LIST = { type:'', sicil:'', rows:[], page:1, q:'' };
  const MODAL_PAGE_SIZE = 10;

  function ensureModalStyles(){
    if (document.getElementById('jrModalFix')) return;
    const css = `
#jrListModal.modal-backdrop{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35);z-index:2147483647}
#jrListModal.modal-backdrop.open{display:flex}
#jrListModal .modal-card{width:min(92vw,860px);max-height:88vh;background:var(--card-bg,#fff);color:var(--text,#111);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.25);display:flex;flex-direction:column}
#jrListModal .modal-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(0,0,0,.08);position:sticky;top:0;background:inherit;z-index:1}
#jrListModal .modal-body{padding:12px 16px;overflow:auto}
#jrListModal .modal-foot{padding:8px 16px;border-top:1px solid rgba(0,0,0,.08)}
    `.trim();
    const style = document.createElement('style');
    style.id = 'jrModalFix';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function ensureListModal(){
    if (document.getElementById('jrListModal')) return true;

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div id="jrListModal" class="modal-backdrop">
        <div class="modal-card" style="max-width:860px">
          <div class="modal-head">
            <strong id="jrListHdrTitle">Kayıtlar</strong>
            <button class="btn btn--icon" id="btnJrListClose" aria-label="Kapat">✕</button>
          </div>
          <div class="modal-body">
            <div class="title-actions" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <input id="jrListSearch" class="input form-control form-control-sm" placeholder="Ara (dosyaNo / kararNo)" style="flex:1;min-width:220px">
              <button class="btn" id="btnJrListExport" title="Tümünü Kaydet (XLS)">
                <span class="material-symbols-rounded" style="font-size:18px;vertical-align:middle;">file_download</span>
                <span style="vertical-align:middle;">Kaydet (XLS)</span>
              </button>
            </div>
            <div style="overflow:auto;max-height:60vh">
              <table class="table table-sm" style="width:100%">
                <thead class="table-light"><tr><th>#</th><th>dosyaNo</th><th>kararNo</th></tr></thead>
                <tbody id="jrListTbody"></tbody>
              </table>
            </div>
          </div>
          <div class="modal-foot d-flex justify-content-end align-items-center gap-2">
            <button class="btn" id="jrListPrev">Önceki</button>
            <span class="text-body-secondary small" id="jrListInfo"></span>
            <button class="btn" id="jrListNext">Sonraki</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrap.firstElementChild);
    ensureModalStyles();
    wireJrModalDelegates();
    return true;
  }

  function wireJrModalDelegates(){
    if (document.documentElement.dataset.jrModalDelegated === '1') return;

    document.addEventListener('click', (e) => {
      const modalEl = document.getElementById('jrListModal');
      const inModal = !!e.target.closest('#jrListModal .modal-card');

      if (modalEl && modalEl.classList.contains('open') && !inModal && e.target === modalEl) {
        modalEl.classList.remove('open');
        return;
      }

      if (e.target.closest('#btnJrListClose, #jrListClose')) {
        modalEl?.classList.remove('open'); return;
      }
      if (e.target.closest('#jrListPrev')) {
        if (JR_LIST.page > 1) { JR_LIST.page--; renderListModal(); }
        return;
      }
      if (e.target.closest('#jrListNext')) {
        const tot = filterModalRows().length;
        const mp  = Math.max(1, Math.ceil(tot / MODAL_PAGE_SIZE));
        if (JR_LIST.page < mp) { JR_LIST.page++; renderListModal(); }
        return;
      }
      if (e.target.closest('#btnJrListExport, #jrListExport')) {
        const rows = filterModalRows().map((r,i) => ({ '#': i + 1, dosyaNo: r.dosyaNo, kararNo: r.kararNo }));
        exportXLS(rows, `${JR_LIST.type}_${JR_LIST.sicil}_kayitlar.xlsx`);
        return;
      }
    }, true);

    document.addEventListener('input', (e) => {
      const t = e.target;
      if (t && t.id === 'jrListSearch') {
        JR_LIST.q = (t.value || '').trim().toLowerCase();
        JR_LIST.page = 1;
        renderListModal();
      }
    }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modalEl = document.getElementById('jrListModal');
        if (modalEl && modalEl.classList.contains('open')) modalEl.classList.remove('open');
      }
    });

    document.documentElement.dataset.jrModalDelegated = '1';
  }

  function openListModal(type, value){
    ensureListModal();
    JR_LIST.type = type; JR_LIST.sicil = value; JR_LIST.page = 1; JR_LIST.q = '';

    const selected = [];
    for (const r of VIEW){
      let match = false;
      if (type === 'hakim'){
        const ids = [r.hukumHakimBaskanPId, r.hukumUye1PId, r.hukumUye2PId].map(v => String(v ?? '').trim());
        match = ids.includes(String(value));
      } else if (type === 'savci'){
        const ids = [r.hukumSavciPId, r.hukumSavciPId2, r.hukumSavciPId3, r.hukumSavciPId4, r.hukumSavciPId5].map(v => String(v ?? '').trim());
        match = ids.includes(String(value));
      } else if (type === 'katip'){
        const ids = [r.hukumKatipPId].map(v => String(v ?? '').trim());
        match = ids.includes(String(value));
      } else if (type === 'statu'){
        match = String(r.statuAcklm ?? '').trim() === String(value);
      } else if (type === 'kayit'){
        match = String(pick(r,'dosyaKayitTuru.aciklama') ?? '').trim() === String(value);
      }
      if (match){
        selected.push({ dosyaNo:String(r.dosyaNo || ''), kararNo:String(r.kararNo || '') });
      }
    }
    JR_LIST.rows = selected;

    const titleEl =
      document.getElementById('jrListHdrTitle') ||
      document.getElementById('jrListModalTitle') ||
      document.getElementById('jrListTitle');
    if (titleEl) titleEl.textContent = `${type.toUpperCase()} – Değer: ${value} (${selected.length})`;

    const s = document.getElementById('jrListSearch'); if (s) s.value = '';
    document.getElementById('jrListModal')?.classList.add('open');
    renderListModal();
  }

  function filterModalRows(){
    const q = JR_LIST.q;
    if (!q) return JR_LIST.rows;
    return JR_LIST.rows.filter(r =>
      r.dosyaNo.toLowerCase().includes(q) || r.kararNo.toLowerCase().includes(q)
    );
  }

  function renderListModal(){
    const all = filterModalRows();
    const total = all.length;
    const mp = Math.max(1, Math.ceil(total / MODAL_PAGE_SIZE));
    if (JR_LIST.page > mp) JR_LIST.page = mp;
    const start = (JR_LIST.page - 1) * MODAL_PAGE_SIZE;
    const end   = Math.min(start + MODAL_PAGE_SIZE, total);

    const tbody = document.getElementById('jrListTbody');
    if (tbody){
      tbody.innerHTML = all.slice(start,end).map((r,i) => `
        <tr><td class="text-body-secondary">${start + i + 1}</td><td>${esc(r.dosyaNo)}</td><td>${esc(r.kararNo)}</td></tr>
      `).join('') || `<tr><td colspan="3" class="text-body-secondary">Kayıt yok.</td></tr>`;
    }

    const info = document.getElementById('jrListInfo');
    if (info) info.textContent = `${total ? (start + 1) : 0}–${end} / ${total}`;
  }

  // ==== Export yardımcıları ====
  function exportXLS(rows, filename){
    try {
      if (window.XLSX && Array.isArray(rows)){
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1');
        XLSX.writeFile(wb, filename || 'export.xlsx');
        return;
      }
    } catch (e){}
    // yedek: CSV (xls adıyla)
    const keys = rows.length ? Object.keys(rows[0]) : [];
    const header = keys.join(';');
    const body = rows.map(r => keys.map(k => {
      const s = String(r[k] ?? ''); return /[;\n"]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(';')).join('\n');
    const blob = new Blob([header + '\n' + body], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = (filename || 'export.xls');
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  }

  // ==== Toast kısayolları ====
  function toastOK(msg){ try { window.toast?.({type:'success', title:'Tamam', body:msg}); } catch {} }
  function toastERR(msg){ try { window.toast?.({type:'danger', title:'Hata', body:msg}); } catch {} }


  // ==== Public API ====
  window.jrobot = {
    setData(arr){
      RAW = Array.isArray(arr) ? arr : [];
      VIEW = RAW.slice();
      destroyInfoCard();
      ensureSideFilterCard();
      ensureSecondRowCards();
      buildHatirlatmaCard();
      applyFilters();
      refreshHatirlatmaCard();
    },
    refresh(){ applyFilters(); }
  };

  // === [Multi Excel Dropzone] jsonUploadCol içine kart ekle (başta gizli) ===
  (function bindMultiExcelDropzone(){
	  if (window.__jrMultiExcelBound) return; window.__jrMultiExcelBound = true;

	  function isExcelFile(f){
      const name = String(f?.name || '');
      const type = String(f?.type || '');
      return (/\.xlsx?$/i.test(name) || /sheet|excel/i.test(type));
	  }
	  function uniqueByNameSize(arr){
      const seen = new Set();
      return arr.filter(f => {
		  const key = (f.name || '') + '__' + (f.size || 0);
		  if (seen.has(key)) return false;
		  seen.add(key); return true;
      });
	  }

	  function buildCard(){
      const sec = document.createElement('section');
      sec.id = 'multiExcelCard';
      sec.className = 'panel';
      sec.style.marginTop = '0';
      sec.setAttribute('aria-label','Çoklu Excel yükleme');
      sec.innerHTML = `
		  <div class="panel-head">
			<div style="display:flex;align-items:center;gap:8px;">
			  <span class="material-symbols-rounded" aria-hidden="true">upload_file</span>
			  <strong>Çoklu Excel Yükle</strong>
			</div>
		  </div>
        <div class="panel-body" style="display:block;margin-top:0;">
			<div id="multiExcelDrop" style="min-height:120px; display:block; padding:18px; text-align:center; border:1px dashed var(--border); border-radius:10px; cursor:pointer;">
			  <input id="multiExcelInput" type="file"
				accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				multiple hidden>
			  <div id="multiExcelHint" class="muted" style="text-align:center;">
				<div style="font-weight:600; margin-bottom:6px">Dosyaları buraya sürükleyip bırakın</div>
				<div>Yalnızca <strong>XLS</strong> ve <strong>XLSX</strong> kabul edilir.</div>
			  </div>
			</div>
      <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:8px; flex-wrap:nowrap;">
        <label for="multiExcelInput" class="btn" title="XLS/XLSX seç" style="display:inline-flex; align-items:center; gap:8px; white-space:nowrap;">
        <span class="material-symbols-rounded" style="font-size:20px; line-height:1; display:inline-block;">add_to_drive</span>
        <span style="line-height:1; display:inline-block;">Dosya Seç</span>
        </label>
        <button type="button" class="btn" id="btnMultiExcelClear" title="Seçimi temizle" style="display:inline-flex; align-items:center; gap:8px; white-space:nowrap;">
        <span class="material-symbols-rounded" style="font-size:20px; line-height:1; display:inline-block;">delete</span>
        <span style="line-height:1; display:inline-block;">Temizle</span>
        </button>
        <button type="button" class="btn" id="btnMultiExcelImport" title="Seçili dosyaları işle" style="display:inline-flex; align-items:center; gap:8px; white-space:nowrap;">
        <span class="material-symbols-rounded" style="font-size:20px; line-height:1; display:inline-block;">play_arrow</span>
        <span style="line-height:1; display:inline-block;">İçe Aktar (çoklu)</span>
        </button>
      </div>
      <div id="multiExcelSummary" class="muted" style="font-size:12px; margin-top:6px;"></div>
      </div>
		`;
      return sec;
	  }

	  function attachTo(mount){
      if (!mount || document.getElementById('multiExcelCard')) return;

      const card = buildCard();
      card.style.display = 'none'; // ilk açılışta gizli
      mount.appendChild(card);

      const input   = document.getElementById('multiExcelInput');
      const drop    = document.getElementById('multiExcelDrop');
      const hint    = document.getElementById('multiExcelHint');
      const summary = document.getElementById('multiExcelSummary');
      const btnClr  = document.getElementById('btnMultiExcelClear');
      const btnRun  = document.getElementById('btnMultiExcelImport');

      let picked = [];

      function renderSummary(){
		  if (!picked.length){ summary.textContent = ''; return; }
		  const maxShow = 5;
		  const names = picked.slice(0,maxShow).map(f => f.name).join(', ');
		  const more  = picked.length > maxShow ? (' ve ' + (picked.length - maxShow) + ' dosya…') : '';
		  summary.textContent = picked.length + ' dosya seçildi: ' + names + more;
      }
      function addFiles(list){
		  const files = Array.from(list || []);
		  const onlyExcel = files.filter(isExcelFile);
		  const rejected = files.length - onlyExcel.length;
		  picked = uniqueByNameSize(picked.concat(onlyExcel));
		  renderSummary();
		  if (rejected > 0 && window.toast){
          window.toast({type:'warning', title:'Uyarı', body: rejected + ' dosya XLS/XLSX olmadığı için alınmadı.'});
		  }
		  if (!onlyExcel.length && files.length){
          hint.innerHTML = '<strong>Uygun dosya bulunamadı.</strong> Yalnızca XLS ve XLSX yükleyin.';
		  } else if (picked.length){
          hint.textContent = "Seçimi onaylamak için 'İçe Aktar (çoklu)' düğmesine basın.";
		  }
      }
      function setDropState(on){
		  drop.style.background = on ? 'color-mix(in oklab, var(--primary) 10%, transparent)' : 'transparent';
      }

      input.addEventListener('change', (e) => addFiles(e.target.files));
      ['dragenter','dragover'].forEach(evt => drop.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); setDropState(true); }));
      ['dragleave','drop'].forEach(evt => drop.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); setDropState(false); }));
      drop.addEventListener('drop', (e) => addFiles(e.dataTransfer?.files || []));
      drop.addEventListener('click', (e) => {
		  const tag = String(e.target?.tagName || '').toLowerCase();
		  if (tag !== 'button' && tag !== 'label' && tag !== 'input') input.click();
      });

      btnClr.addEventListener('click', () => {
		  picked = []; input.value = '';
		  hint.innerHTML = '<div style="font-weight:600; margin-bottom:6px">Dosyaları buraya sürükleyip bırakın</div><div>Yalnızca <strong>XLS</strong> ve <strong>XLSX</strong> kabul edilir.</div>';
		  summary.textContent = '';
		  window.toast?.({type:'info', title:'Temizlendi', body:'Seçili dosyalar kaldırıldı.'});
      });

      btnRun.addEventListener('click', () => {
		  if (!picked.length){
          window.toast?.({type:'warning', title:'Dosya yok', body:'Önce en az bir XLS/XLSX seçin.'});
          return;
		  }
		  // Uygulamaya haber ver
		  const ev = new CustomEvent('jr-multi-excel-selected', { detail: { files: picked.slice() }});
		  document.dispatchEvent(ev);
		  window.toast?.({type:'success', title:'Hazır', body: picked.length + ' dosya ile işlem başlatıldı.'});
      });
	  }

    function tryMount(){
      const mount = document.getElementById('jsonUploadCol');
      if (mount) attachTo(mount);
    }

	  // İlk deneme
	  if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', tryMount);
	  } else {
      tryMount();
	  }

	  // Dinamik oluşum için gözlemci
	  const obs = new MutationObserver(() => { tryMount(); });
	  obs.observe(document.documentElement || document.body, { childList:true, subtree:true });
  })();

  // === Excel yükleme sonrası panelleri göster ===
  document.addEventListener('jr-multi-excel-selected', function(){
    ['hakimCard', 'savciCard', 'katipCard'].forEach(id => {
      const panel = document.getElementById(id);
      if (panel) panel.style.display = '';
    });
  });

})();
