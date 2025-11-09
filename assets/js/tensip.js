(() => {
  'use strict';
  if (window.__tensipBooted) return; window.__tensipBooted = true;

  const $ = (s, r = document) => r.querySelector(s);
  const PAGE_SIZE = 20;
  const fmtInt = n => new Intl.NumberFormat('tr-TR').format(n || 0);

  function toast(type, title, body){
    if (typeof window.toast === 'function') window.toast({type, title, body});
    else console[type === 'danger' ? 'error' : type === 'warning' ? 'warn' : 'log'](`${title}: ${body}`);
  }
  const norm = (s) => String(s ?? '')
    .replace(/\u00A0/g,' ').replace(/\r?\n+/g,' ')
    .trim().toLowerCase().replace(/\s+/g,' ')
    .replaceAll('ı','i').replaceAll('İ','i')
    .replaceAll('ş','s').replaceAll('Ş','s')
    .replaceAll('ğ','g').replaceAll('Ğ','g')
    .replaceAll('ö','o').replaceAll('Ö','o')
    .replaceAll('ü','u').replaceAll('Ü','u')
    .replaceAll('ç','c').replaceAll('Ç','c');
  const cell = (aoa, r, c) => (aoa?.[r]?.[c] ?? '');
  const txt  = (v) => String(v ?? '').trim();
  const esc  = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  const COL = { C:2, F:5, H:7, K:10, L:11 };
  const ROW = { TITLE:2, BIRIM:4, ARALIK:5, HEADER:10, DATA_START:11 }; // D3, G5, G6, C11
  const TITLE_NEEDLE = norm('TENSİP ZAMAN KONTROLÜ');

  const state = { rows: [], sheetName: '', birimAdi: '', denetimAraligi: '', currentPage: 1, searchTerm: '', delayCheckDone: false };

  function isDataHeaderRow(row){
    const C = norm(row[COL.C] || '');
    const F = norm(row[COL.F] || '');
    const H = norm(row[COL.H] || '');
    const K = norm(row[COL.K] || '');
    const L = norm(row[COL.L] || '');
    let score = 0;
    if (C.startsWith('esas no')) score++;
    if (F.includes('kabul') && F.includes('tarih')) score++;
    if (H.includes('tensip') && H.includes('tarih')) score++;
    if (K.includes('sure') || K.includes('süre')) score++;
    if (L === 'hakim' || L === 'hakim adi' || L === 'hakim adı') score++;
    return score >= 4;
  }

  const RX_ID = /^\s*\d{4}\s*\/\s*\d{1,6}\s*$/;
  const RX_DT = /^\s*\d{2}\/\d{2}\/\d{4}\s*$/;
  function isValidId(v){ return RX_ID.test(String(v || '')); }
  function isValidDate(v){ return RX_DT.test(String(v || '')); }

  // Tarih helpers
  function parseDate(s){
    if (!s || typeof s !== 'string') return null;
    const [d,m,y] = s.trim().split('/').map(x => parseInt(x,10));
    if (!d || !m || !y) return null; return new Date(y, m - 1, d);
  }
  function daysDiff(a,b){ if (!a || !b) return null; return Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24)); }

  async function readSheetExact(file){
    const XLSX = window.XLSX; if (!XLSX){ toast('danger','Bağımlılık','xlsx-loader.js yüklenemedi.'); return null; }
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type:'array', cellDates:true, dateNF:'dd.mm.yyyy' });
    const sheetName = wb.SheetNames.includes('StyleSheet') ? 'StyleSheet' : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(ws, { header:1, raw:false, defval:'' });

    const d3 = cell(aoa, ROW.TITLE, 3); // D3
    if (!d3 || !norm(d3).includes(TITLE_NEEDLE)){
      toast('danger','Hatalı Tablo','D3 hücresinde beklenen başlık yok. Lütfen orijinal tabloyu yükleyiniz.');
      return null;
    }

    // Birim adı G5, Denetim aralığı G6
    const birim  = txt(cell(aoa, ROW.BIRIM, 6));
    const aralik = txt(cell(aoa, ROW.ARALIK, 6));

    const headerRow = aoa[ROW.HEADER] || [];
    const okHeader =
      norm(headerRow[COL.C]).startsWith('esas no') &&
      norm(headerRow[COL.F]).includes('kabul') &&
      norm(headerRow[COL.H]).includes('tensip');
    if (!okHeader){ console.warn('Başlık satırı beklenenden farklı; veri C12\'den okunacak.'); }

    const rows = [];
    for (let r = ROW.DATA_START; r < aoa.length; r++){
      const row = aoa[r] || [];
      if (isDataHeaderRow(row)) continue;
      const C = txt(row[COL.C]);
      const F = txt(row[COL.F]);
      const H = txt(row[COL.H]);
      const K = txt(row[COL.K]);
      const L = txt(row[COL.L]);
      if (!isValidId(C) || !isValidDate(F) || !isValidDate(H)) continue;
      rows.push({ esasNo:C, iddKabulTar:F, tensipTar:H, sureGun:K, hakim:L });
    }
    if (!rows.length){ toast('warning','Veri Yok','C12\'den itibaren veri satırı bulunamadı.'); return null; }
    return { rows, sheetName, birimAdi: birim, denetimAraligi: aralik };
  }

  // Uyum kontrolü: Hesaplanan gün ile rapordaki K farkı
  function checkDelayDiscrepancy(rows){
    if (!rows || rows.length < 3) return;
    const diffs = [];
    for (let i = 0;i < Math.min(3, rows.length);i++){
      const r = rows[i];
      const d1 = parseDate(r.iddKabulTar); const d2 = parseDate(r.tensipTar);
      const rep = parseInt(r.sureGun,10);
      const calc = daysDiff(d1,d2);
      if (calc != null && !isNaN(rep) && calc - rep > 0) diffs.push(calc - rep);
    }
    if (diffs.length >= 3 && diffs.every(x => x === diffs[0])){
      toast('warning','Süre Uyumsuzluğu',`Tablodaki sürelerden ${diffs[0]} gün düşüldüğü tespit edildi (ilk ${diffs.length} kayıt).`);
    }
  }

  function clearPreview(){
    const wrap = $('#combinedTableWrap');
    const card = $('#combinedSummaryCard');
    const stats = $('#combinedStats');
    if (wrap) wrap.innerHTML = `<div class="placeholder">Henüz veri yok.</div>`;
    if (stats) stats.innerHTML = '';
    if (card) card.style.display = 'none';
  }

  function renderCombinedPreview(){
    const wrap = $('#combinedTableWrap');
    const card = $('#combinedSummaryCard');
    const stats = $('#combinedStats');
    if (!wrap || !card) return;

    // Arama filtresi uygula
    let filteredRows = state.rows;
    if (state.searchTerm){
      const term = norm(state.searchTerm);
      filteredRows = state.rows.filter(r => {
        return norm(r.esasNo).includes(term) ||
               norm(r.iddKabulTar).includes(term) ||
               norm(r.tensipTar).includes(term) ||
               norm(r.sureGun).includes(term) ||
               norm(r.hakim).includes(term);
      });
    }

    const total = filteredRows.length;
    if (!total){
      wrap.innerHTML = '<div class="placeholder">Arama sonucu bulunamadı.</div>';
      card.style.display = 'block';
      return;
    }
    if (stats){
      stats.innerHTML = `
        <span class="badge">${total} kayıt</span>
        ${state.sheetName ? `<span class=\"badge\">${esc(state.sheetName)}</span>` : ''}
        ${state.birimAdi ? `<span class=\"badge\">${esc(state.birimAdi)}</span>` : ''}
        ${state.denetimAraligi ? `<span class=\"badge\">${esc(state.denetimAraligi)}</span>` : ''}
      `;
    }
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.currentPage = Math.min(pageCount, Math.max(1, state.currentPage));
    const start = (state.currentPage - 1) * PAGE_SIZE;
    const end = Math.min(total, start + PAGE_SIZE);
    const pageRows = filteredRows.slice(start,end);

    let html = `<div class="table-wrap-inner">`;
    html += `<table class="table compact" id="previewXls">`;
    html += `<thead><tr class="center">
      <th>Esas No</th>
      <th>İddianame Kabul Tarihi</th>
      <th>Tensip Tarihi</th>
      <th>Süre (Gün)</th>
      <th>Hakim</th>
    </tr></thead><tbody>`;
    for (const r of pageRows){
      html += `<tr class="center">
        <td>${esc(r.esasNo)}</td>
        <td>${esc(r.iddKabulTar)}</td>
        <td>${esc(r.tensipTar)}</td>
        <td class="num">${esc(r.sureGun)}</td>
        <td>${esc(r.hakim)}</td>
      </tr>`;
    }
    html += `</tbody></table>`;
    html += renderPagerHtml(state.currentPage, pageCount);
    html += `</div>`;

    wrap.innerHTML = html; bindPager(pageCount); card.style.display = 'block';
    if (state.currentPage === 1 && !state.delayCheckDone) {
      checkDelayDiscrepancy(state.rows);
      state.delayCheckDone = true;
    }
  }

  function renderPagerHtml(cp, pc){
    return `
      <div class="card-footer" id="combinedPager">
        <div class="pager">
          <div><button class="btn ghost" id="pgPrev"  ${cp <= 1 ? 'disabled' : ''} title="Önceki">Önceki</button></div>
          <div class="muted">Sayfa ${cp} / ${pc} · ${PAGE_SIZE}/sayfa</div>
          <div><button class="btn ghost" id="pgNext"  ${cp >= pc ? 'disabled' : ''} title="Sonraki">Sonraki</button></div>
        </div>
      </div>`;
  }
  function bindPager(pc){
    const toPage = (p) => { state.currentPage = Math.min(pc, Math.max(1,p)); renderCombinedPreview(); };
    $('#pgPrev')?.addEventListener('click', () => toPage(state.currentPage - 1));
    $('#pgNext')?.addEventListener('click', () => toPage(state.currentPage + 1));
  }

  async function exportToDocx(){
    const minEl = document.getElementById('minSureGunInput');
    const minDays = Math.max(0, parseInt((minEl?.value || '0'),10) || 0);

    let rows = state.rows;
    if (minDays > 0){
      rows = rows.filter(r => { const v = parseInt(String(r.sureGun || '').replace(/[^\d-]/g,''),10); return !isNaN(v) && v >= minDays; });
      if (!rows.length){ toast('warning','Filtre Sonucu Boş', `${minDays} gün ve üzeri süreye sahip satır yok.`); return; }
    }

    const payload = { birimAdi: state.birimAdi || '', denetimAraligi: state.denetimAraligi || '', rows };
    if (!rows.length){ toast('warning','Veri yok','Tabloda satır bulunamadı.'); return; }

    // Hakim istatistiği
    const hakimCounts = {};
    const sureGunValues = [];
    rows.forEach(r => {
      const h = String(r.hakim || '').trim();
      if (h) hakimCounts[h] = (hakimCounts[h] || 0) + 1;
      const sureVal = parseInt(String(r.sureGun || '').replace(/[^\d-]/g,''), 10);
      if (!isNaN(sureVal)) sureGunValues.push(sureVal);
    });
    const hakimList = Object.entries(hakimCounts)
      .sort((a,b) => b[1] - a[1])
      .map(([name, count]) => `${name} - ${count}`)
      .join(', ');

    let toastMsg = '';
    if (hakimList){
      toastMsg += `${hakimList} kayıt tespit edilmiştir.`;
    }
    if (sureGunValues.length > 0){
      const minGun = Math.min(...sureGunValues);
      const maxGun = Math.max(...sureGunValues);
      const avgGun = Math.round(sureGunValues.reduce((a,b) => a + b,0) / sureGunValues.length);
      if (toastMsg) toastMsg += ' ';
      toastMsg += `En az: ${minGun} gün, En fazla: ${maxGun} gün, Ortalama: ${avgGun} gün.`;
    }
    if (toastMsg){
      toast('info', 'Aktarılan Hakimler', toastMsg);
    }

    const apiUrl = '/api/tensip_writer.php';
    const exportBtn = document.getElementById('exportDocxBtn');
    const bodyStr = JSON.stringify(payload);
    if (exportBtn){ exportBtn.disabled = true; exportBtn.classList.add('busy'); }
    try {
      const res = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','X-Requested-With':'XMLHttpRequest'}, body: bodyStr });
      let blob = null; const ct = (res.headers.get('Content-Type') || '').toLowerCase(); const cd = res.headers.get('Content-Disposition') || '';
      if (res.ok && (ct.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || /filename\s*=\s*"?[^";]*\.docx"?/i.test(cd))){ blob = await res.blob(); } else if (res.ok){ const tmp = await res.blob(); const ab = await tmp.arrayBuffer(); const u8 = new Uint8Array(ab); if (u8[0] === 0x50 && u8[1] === 0x4B) blob = new Blob([ab], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }); }
      if (!blob){ let msg = `(${res.status}) Word dosyası oluşturulamadı.`; try { const t = await res.clone().text(); try { const j = JSON.parse(t); if (j && j.reason) msg = j.reason; } catch { if (t) msg = t.slice(0,500);} } catch {} toast('danger','Hata',msg); return; }
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '2- TENSİP ZAMAN KONTROLÜ.docx'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast('success','İndiriliyor','Denetime uygun Word belgesi indiriliyor.');
    } catch (e){ toast('danger','Ağ Hatası', String(e)); } finally { if (exportBtn){ exportBtn.disabled = false; exportBtn.classList.remove('busy'); } }
  }

  function renderExportCard(){
    const host = document.getElementById('udfUploadCard'); if (!host) return;
    document.getElementById('exportInfoCard')?.remove();
    const birim = state.birimAdi || 'Belirtilmeyen birim'; const aralik = state.denetimAraligi || 'belirtilmeyen aralık'; const count = state.rows.length;
    const html = `
    <section class="card card-upload" id="exportInfoCard" style="margin-top:12px">
      <div class="card-head"><span class="material-symbols-rounded">description</span><strong>Word Çıktısı</strong></div>
      <div class="card-body" style="display:block">
  <div class="muted" style="margin-bottom:8px">${esc(birim)} – ${esc(aralik)} aralığında <b>${count}</b> satır hazır.</div>
        <div id="exportPickRow" style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;align-items:center">
          <label for="minSureGunInput" class="muted" style="margin-right:4px">Minimum Süre (Gün):</label>
          <input type="number" id="minSureGunInput" value="0" min="0" step="1" style="width:120px">
          <button class="btn" id="exportDocxBtn" type="button" style="display:inline-flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded">description</span><span>Word'e Aktar</span>
          </button>
        </div>
      </div>
    </section>`;
    host.insertAdjacentHTML('afterend', html);
    document.getElementById('exportDocxBtn')?.addEventListener('click', exportToDocx);
  }

  async function processExcel(file){
    toast('info','Okunuyor','Excel dosyası okunuyor…');
    try {
      window.XlsSpinner?.show();
      const res = await readSheetExact(file); if (!res){ clearPreview(); return; }
      state.rows = res.rows; state.sheetName = res.sheetName; state.birimAdi = res.birimAdi || ''; state.denetimAraligi = res.denetimAraligi || ''; state.currentPage = 1; state.delayCheckDone = false;
      renderCombinedPreview();
      const birim = state.birimAdi || 'Belirtilmeyen birim'; const aralik = state.denetimAraligi || 'belirtilmeyen aralık';
      toast('success','Tablo Yüklendi', `${birim}'nin ${aralik} denetim tarihleri arasında yüklenen Tensip tablosunda ${state.rows.length} adet kayda rastlanılmış olup yanda gösterilmektedir.`);
      renderExportCard();
    } finally {
      window.XlsSpinner?.hide();
    }
  }

  // Upload UI bindings (same pattern as others)
  const elDrop = $('#udfDrop'); const elInput = $('#udfInput'); const elChosen = $('#xlsChosen');
  const setChosenText = (t) => { if (elChosen) elChosen.textContent = t || ''; };
  function isExcelFile(f){ if (!f) return false; const nameOk = /\.xlsx?$/i.test(f.name); const typeOk = /sheet|excel|spreadsheet/i.test(f.type || '') || nameOk; return nameOk || typeOk; }
  function pickFirstExcelFile(list){ if (!list || list.length === 0) return null; if (list.length > 1) toast('warning','Tek Dosya','Yalnızca 1 adet XLS/XLSX seçebilirsiniz. İlk dosya işlendi.'); const f = list[0]; if (!isExcelFile(f)){ toast('warning','Dosya Türü','Lütfen XLS/XLSX dosyası seçiniz.'); return null;} return f; }
  function handleFiles(fl){
    const f = pickFirstExcelFile(fl);
    if (!f){ setChosenText(''); return;}
    setChosenText(`Seçilen: ${f.name}`);
    processExcel(f).catch(err => { console.error(err); toast('danger','Okuma Hatası','Excel okunurken sorun oluştu.'); });
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
  }
  function handleFilesWithInline(fl){
    window.setInlineXlsLoading('#xlsInlineSpinnerTen', true);
    Promise.resolve().then(() => handleFiles(fl)).finally(() => window.setInlineXlsLoading('#xlsInlineSpinnerTen', false));
  }
  if (elDrop){
    elDrop.addEventListener('click', () => elInput?.click());
    ['dragenter','dragover'].forEach(ev => elDrop.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); elDrop.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(ev => elDrop.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); elDrop.classList.remove('dragover'); }));
    elDrop.addEventListener('drop', e => { const files = e.dataTransfer?.files; if (!files || files.length === 0){ toast('warning','Dosya','Bırakılan dosya algılanamadı.'); return;} handleFilesWithInline(files); });
  }
  if (elInput){ elInput.addEventListener('change', () => { const files = elInput.files; if (!files || !files.length){ toast('warning','Dosya','Herhangi bir dosya seçilmedi.'); return;} handleFilesWithInline(files); }); }

  // Arama input event listener
  const searchInput = $('#searchInput');
  if (searchInput){
    searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value.trim();
      state.currentPage = 1;
      renderCombinedPreview();
    });
  }
})();
