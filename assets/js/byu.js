(() => {
  'use strict';
  if (window.__byuBooted) return; window.__byuBooted = true;

  const $ = (s, r = document) => r.querySelector(s);
  const PAGE_SIZE = 20;
  const norm = s => String(s ?? '').replace(/\u00A0/g,' ').replace(/\r?\n+/g,' ').trim().toLowerCase().replace(/\s+/g,' ')
    .replaceAll('ı','i').replaceAll('İ','i').replaceAll('ş','s').replaceAll('Ş','s')
    .replaceAll('ğ','g').replaceAll('Ğ','g').replaceAll('ö','o').replaceAll('Ö','o')
    .replaceAll('ü','u').replaceAll('Ü','u').replaceAll('ç','c').replaceAll('Ç','c');
  const txt = v => String(v ?? '').trim();
  const esc = s => String(s ?? '').replace(/[&<>"']/g,m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  const COL = { C:2, F:5, G:6, I:8, J:9, K:10, L:11, D:3 }; // D başlık kontrolü için
  const ROW = { TITLE:2, BIRIM:4, ARALIK:5, HEADER:10, DATA_START:11 };
  const TITLE_NEEDLE = norm('BASİT YARGILAMA USULÜ ZAMAN KONTROLÜ');

  const state = { rows: [], sheetName: '', birimAdi: '', denetimAraligi: '', currentPage: 1, searchTerm: '', delayCheckDone: false, dateErrors: 0, emptyFieldErrors: 0 };

  function toast(type,title,body){ if (typeof window.toast === 'function') window.toast({type,title,body}); }

  function isDataHeaderRow(row){
    if (!row) return false;
    const C = norm(row[COL.C] || '');
    const F = norm(row[COL.F] || '');
    const G = norm(row[COL.G] || '');
    const I = norm(row[COL.I] || '');
    const J = norm(row[COL.J] || '');
    const K = norm(row[COL.K] || '');
    const L = norm(row[COL.L] || '');
    let score = 0;
    if (C.includes('esas') && C.includes('no')) score++;
    if (F.includes('usul') && (F.includes('karar') || F.includes('uygulanmasina'))) score++;
    if (G.includes('son') && G.includes('islem') && G.includes('tarih')) score++;
    if (I.includes('gerekceli') && I.includes('karar') && I.includes('tarih')) score++;
    if (J.includes('sure') || J.includes('süre')) score++;
    if (L.includes('hakim') || L.includes('hâkim')) score++;
    return score >= 5;
  }

  const RX_ID = /^\s*\d{4}\s*\/\s*\d{1,6}\s*$/;
  const RX_DT = /^\s*\d{2}\/\d{2}\/\d{4}\s*$/;
  function isValidId(v){ return RX_ID.test(String(v || '')); }
  function isValidDate(v){ return RX_DT.test(String(v || '')); }

  function parseDate(s){ if (!s || typeof s !== 'string') return null; const p = s.trim().split('/'); if (p.length !== 3) return null; const [d,m,y] = p.map(x => parseInt(x,10)); if (!d || !m || !y) return null; return new Date(y,m - 1,d); }
  function daysDiff(a,b){ if (!a || !b) return null; return Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24)); }

  async function readSheetExact(file){
    const XLSX = window.XLSX; if (!XLSX){ toast('danger','Bağımlılık','xlsx-loader.js yok.'); return null; }
    const ab = await file.arrayBuffer(); const wb = XLSX.read(ab,{type:'array',cellDates:true,dateNF:'dd.mm.yyyy'});
    const sheetName = wb.SheetNames.includes('StyleSheet') ? 'StyleSheet' : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName]; const aoa = XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
    const d3 = (aoa?.[ROW.TITLE]?.[COL.D]) || '';
    const expectedTitleRaw = 'BASİT YARGILAMA USULÜ ZAMAN KONTROLÜ';
    const d3Norm = norm(d3);
    const expectedNorm = norm(expectedTitleRaw);
    if (d3Norm !== expectedNorm){
      toast('warning','Başlık Uyarısı',`D3 hücresinde beklenen tam başlık yok. Bulunan: "${esc(d3)}" · Beklenen: "${expectedTitleRaw}"`);
    }
    const birim = txt(aoa?.[ROW.BIRIM]?.[COL.F] ?? '');
    const aralik = txt(aoa?.[ROW.ARALIK]?.[COL.F] ?? '');
    const rows = [];
    for (let r = ROW.DATA_START; r < aoa.length; r++){
      const row = aoa[r] || [];
      if (isDataHeaderRow(row)) continue;
      const C = txt(row[COL.C]);
      const F = txt(row[COL.F]);
      const G = txt(row[COL.G]);
      const I = txt(row[COL.I]);
      const J = txt(row[COL.J]);
      const K = txt(row[COL.K]);
      const L = txt(row[COL.L]);
      if (!C) continue;
      const cNorm = norm(C);
      if (cNorm.includes('sistemden alinmistir')) continue;
      if (cNorm.startsWith('gelen dosya listesi') || cNorm.startsWith('birim adi') || cNorm.startsWith('denetim araligi')) continue;
      if (isDataHeaderRow(row)) continue;
      if (!C && !F && !G && !I && !J && !K && !L) continue;

      // Gerekçeli Karar Tarihinden Son İşlem Tarihini düşerek süreyi hesapla
      let calculatedSure = null;
      const gerekceliDate = parseDate(I);
      const sonIslemDate = parseDate(G);
      if (gerekceliDate && sonIslemDate) {
        calculatedSure = daysDiff(sonIslemDate, gerekceliDate);
      }

      rows.push({ esasNo:C, usulKararTarihi:F, sonIslemTarihi:G, gerekceliKararTarihi:I, sureGun:calculatedSure, aciklama:K, hakim:L });
    }
    if (!rows.length){ toast('warning','Veri Yok','C12 ve sonrası veri bulunamadı.'); return null; }

    // En yüksek süreden başlayarak sırala
    rows.sort((a, b) => {
      const sureA = a.sureGun !== null ? a.sureGun : -1;
      const sureB = b.sureGun !== null ? b.sureGun : -1;
      return sureB - sureA;
    });

    return { rows, sheetName, birimAdi: birim, denetimAraligi: aralik };
  }

  function validateRows(rows){
    let dateErrors = 0;
    let emptyFieldErrors = 0;
    const validatedRows = rows.map(r => {
      let hasDateError = false;
      let hasEmptyError = false;
      const dateErrorDetails = {};

      // Boş alan kontrolü: Esas No, Usul Karar Tarihi, Son İşlem Tarihi, Gerekçeli Karar Tarihi, Hakim
      if (!r.esasNo || !r.esasNo.trim()) hasEmptyError = true;
      if (!r.usulKararTarihi || !r.usulKararTarihi.trim()) hasEmptyError = true;
      if (!r.sonIslemTarihi || !r.sonIslemTarihi.trim()) hasEmptyError = true;
      if (!r.gerekceliKararTarihi || !r.gerekceliKararTarihi.trim()) hasEmptyError = true;
      if (!r.hakim || !r.hakim.trim()) hasEmptyError = true;

      // Tarih sırası kontrolü detaylı
      const usulDate = parseDate(r.usulKararTarihi);
      const sonIslemDate = parseDate(r.sonIslemTarihi);
      const gerekceliDate = parseDate(r.gerekceliKararTarihi);

      if (usulDate && sonIslemDate && gerekceliDate) {
        // 1. Kontrol: Usul <= Son İşlem
        if (usulDate > sonIslemDate) {
          hasDateError = true;
          dateErrorDetails.usulError = 'Usul Karar Tarihi, Son İşlem Tarihinden Büyük Olamaz';
        }

        // 2. Kontrol: Son İşlem <= Gerekçeli Karar
        if (sonIslemDate > gerekceliDate) {
          hasDateError = true;
          dateErrorDetails.sonIslemError = 'Son İşlem Tarihi, Gerekçeli Karar Tarihinden Büyük Olamaz';
        }

        // 3. Kontrol: Gerekçeli Karar >= Son İşlem (aynı kontrol tersten)
        if (gerekceliDate < sonIslemDate) {
          hasDateError = true;
          dateErrorDetails.gerekceliError = 'Gerekçeli Karar Tarihi, Son İşlem Tarihinden Küçük Olamaz';
        }
      }

      if (hasDateError) dateErrors++;
      if (hasEmptyError) emptyFieldErrors++;

      return { ...r, hasDateError, hasEmptyError, dateErrorDetails };
    });

    return { validatedRows, dateErrors, emptyFieldErrors };
  }

  function checkDelayDiscrepancy(rows){
    if (!rows || rows.length < 3) return;
    const diffs = [];
    for (let i = 0;i < Math.min(3,rows.length);i++){
      const r = rows[i]; const d1 = parseDate(r.usulKararTarihi); const d2 = parseDate(r.gerekceliKararTarihi); const rep = parseInt(r.sureGun,10); const calc = daysDiff(d1,d2); if (calc != null && !isNaN(rep) && calc - rep > 0) diffs.push(calc - rep);
    }
    if (diffs.length >= 3 && diffs.every(x => x === diffs[0])) toast('warning','Süre Uyumsuzluğu',`Tablodaki sürelerden ${diffs[0]} gün düşüldüğü tespit edildi (ilk ${diffs.length} kayıt).`);
  }

  function clearPreview(){ const wrap = $('#combinedTableWrap'); const card = $('#combinedSummaryCard'); const stats = $('#combinedStats'); if (wrap) wrap.innerHTML = '<div class="placeholder">Henüz veri yok.</div>'; if (stats) stats.innerHTML = ''; if (card) card.style.display = 'none'; }

  function renderPagerHtml(cp,pc){return `<div class="card-footer" id="combinedPager"><div class="pager"><div><button class="btn ghost" id="pgPrev" ${cp <= 1 ? 'disabled' : ''}>Önceki</button></div><div class="muted">Sayfa ${cp} / ${pc} · ${PAGE_SIZE}/sayfa</div><div><button class="btn ghost" id="pgNext" ${cp >= pc ? 'disabled' : ''}>Sonraki</button></div></div></div>`;}
  function bindPager(pc){ const toPage = p => { state.currentPage = Math.min(pc,Math.max(1,p)); renderCombinedPreview(); }; $('#pgPrev')?.addEventListener('click',() => toPage(state.currentPage - 1)); $('#pgNext')?.addEventListener('click',() => toPage(state.currentPage + 1)); }

  function renderCombinedPreview(){
    const wrap = $('#combinedTableWrap'); const card = $('#combinedSummaryCard'); const stats = $('#combinedStats'); if (!wrap || !card) return;
    // Arama filtresi uygula
    let filteredRows = state.rows;
    if (state.searchTerm){
      const term = norm(state.searchTerm);
      filteredRows = state.rows.filter(r => {
        return norm(r.esasNo).includes(term) ||
               norm(r.usulKararTarihi).includes(term) ||
               norm(r.sonIslemTarihi).includes(term) ||
               norm(r.gerekceliKararTarihi).includes(term) ||
               norm(r.sureGun).includes(term) ||
               norm(r.aciklama).includes(term) ||
               norm(r.hakim).includes(term);
      });
    }
    const total = filteredRows.length; if (!total){ wrap.innerHTML = '<div class="placeholder">Arama sonucu bulunamadı.</div>'; card.style.display = 'block'; return; } if (stats){ stats.innerHTML = `<span class="badge">${total} kayıt</span>${state.sheetName ? `<span class="badge">${esc(state.sheetName)}</span>` : ''}${state.birimAdi ? `<span class="badge">${esc(state.birimAdi)}</span>` : ''}${state.denetimAraligi ? `<span class="badge">${esc(state.denetimAraligi)}</span>` : ''}`; }
    const pageCount = Math.max(1,Math.ceil(total / PAGE_SIZE)); state.currentPage = Math.min(pageCount,Math.max(1,state.currentPage)); const start = (state.currentPage - 1) * PAGE_SIZE; const end = Math.min(total,start + PAGE_SIZE); const pageRows = filteredRows.slice(start,end);
    let html = '<div class="table-wrap-inner"><table class="table compact" id="previewXls"><thead><tr class="center">' +
      '<th>Esas No</th><th>Usulün Uygulanmasına Karar Verme Tarihi</th><th>Son İşlem Tarihi</th><th>Gerekçeli Karar Tarihi</th><th>Süre (Gün)</th><th>Açıklama</th><th>İlgili Hakim</th>' +
      '</tr></thead><tbody>';
    for (const r of pageRows){
      const rowClass = r.hasDateError || r.hasEmptyError ? ' style="background-color: rgba(255, 0, 0, 0.1);"' : '';
      const emptyClass = ' style="color: red; font-weight: bold;"';

      // Tarih hataları için detaylı stil ve tooltip
      const usulStyle = r.dateErrorDetails?.usulError ? ' style="color: red; font-weight: bold; cursor: help;"' : '';
      const usulTooltip = r.dateErrorDetails?.usulError ? ` title="${r.dateErrorDetails.usulError}"` : '';

      const sonIslemStyle = r.dateErrorDetails?.sonIslemError ? ' style="color: red; font-weight: bold; cursor: help;"' : '';
      const sonIslemTooltip = r.dateErrorDetails?.sonIslemError ? ` title="${r.dateErrorDetails.sonIslemError}"` : '';

      const gerekceliStyle = r.dateErrorDetails?.gerekceliError ? ' style="color: red; font-weight: bold; cursor: help;"' : '';
      const gerekceliTooltip = r.dateErrorDetails?.gerekceliError ? ` title="${r.dateErrorDetails.gerekceliError}"` : '';

      html += `<tr class="center"${rowClass}>`;
      html += `<td${!r.esasNo || !r.esasNo.trim() ? emptyClass : ''}>${esc(r.esasNo)}</td>`;
      html += `<td${!r.usulKararTarihi || !r.usulKararTarihi.trim() ? emptyClass : usulStyle}${usulTooltip}>${esc(r.usulKararTarihi)}</td>`;
      html += `<td${!r.sonIslemTarihi || !r.sonIslemTarihi.trim() ? emptyClass : sonIslemStyle}${sonIslemTooltip}>${esc(r.sonIslemTarihi)}</td>`;
      html += `<td${!r.gerekceliKararTarihi || !r.gerekceliKararTarihi.trim() ? emptyClass : gerekceliStyle}${gerekceliTooltip}>${esc(r.gerekceliKararTarihi)}</td>`;
      html += `<td class="num">${esc(r.sureGun)}</td>`;
      html += `<td>${esc(r.aciklama)}</td>`;
      html += `<td${!r.hakim || !r.hakim.trim() ? emptyClass : ''}>${esc(r.hakim)}</td>`;
      html += `</tr>`;
    }
    html += '</tbody></table>' + renderPagerHtml(state.currentPage,pageCount) + '</div>';
    wrap.innerHTML = html;

    // Tooltip metni olan hücreye tıklanınca toast göster
    if (!wrap.__tooltipClickBound) {
      wrap.addEventListener('click', function(ev){
        try {
          const cell = ev.target && ev.target.closest && ev.target.closest('td[title], th[title]');
          if (!cell) return;
          const tip = cell.getAttribute('title') || '';
          if (!tip) return;
          let esasNo = '';
          const tr = cell.closest('tr');
          if (tr) {
            const firstTd = tr.querySelector('td');
            if (firstTd) esasNo = (firstTd.textContent || '').trim();
          }
          const bodyMsg = esasNo ? (esasNo + ': ' + tip) : tip;
          if (window.toast) {
            window.toast({ type:'warning', title:'Hata : ', body: bodyMsg });
          }
        } catch (_) { /* ignore */ }
      });
      wrap.__tooltipClickBound = true;
    }

    bindPager(pageCount); card.style.display = 'block';
    if (state.currentPage === 1 && !state.delayCheckDone) {
      checkDelayDiscrepancy(state.rows);
      state.delayCheckDone = true;
    }
  }

  async function exportToDocx(){
    const minEl = document.getElementById('minSureGunInput');
    const minDays = Math.max(0, parseInt((minEl?.value || '0'),10) || 0);
    const dusulenSureEl = document.getElementById('dusulenSureInput');
    const dusulenSure = Math.max(0, parseInt((dusulenSureEl?.value || '30'),10) || 30);

    let rows = state.rows;
    // Düşülecek süreyi uygula
    if (dusulenSure > 0){
      rows = rows.map(r => {
        const sureVal = parseInt(String(r.sureGun || '').replace(/[^\d-]/g,''),10);
        if (!isNaN(sureVal)){
          const adjusted = Math.max(0, sureVal - dusulenSure);
          return { ...r, sureGun: String(adjusted) };
        }
        return r;
      });
    }
    // Minimum filtre uygula
    if (minDays > 0){
      rows = rows.filter(r => {
        const v = parseInt(String(r.sureGun || '').replace(/[^\d-]/g,''),10);
        return !isNaN(v) && v >= minDays;
      });
      if (!rows.length){
        toast('warning','Filtre','Seçilen gün eşiğini sağlayan satır yok.');
        return;
      }
    }
    if (!rows.length){ toast('warning','Veri yok','Tabloda satır bulunamadı.'); return; }

    // Açıklama boş ise "İş yoğunluğu" yaz
    rows = rows.map(r => ({
      ...r,
      aciklama: r.aciklama && r.aciklama.trim() ? r.aciklama : 'İş yoğunluğu'
    }));

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

    const payload = { birimAdi: state.birimAdi || '', denetimAraligi: state.denetimAraligi || '', rows };
    const apiUrl = '/api/byu_writer.php';
    const bodyStr = JSON.stringify(payload);
    const exportBtn = document.getElementById('exportDocxBtn'); if (exportBtn){ exportBtn.disabled = true; exportBtn.classList.add('busy'); }
    try {
      const res = await fetch(apiUrl,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','X-Requested-With':'XMLHttpRequest'},body:bodyStr});
      let blob = null; const ct = (res.headers.get('Content-Type') || '').toLowerCase(); const cd = res.headers.get('Content-Disposition') || '';
      if (res.ok && (ct.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || /filename\s*=\s*"?[^";]+\.docx"?/i.test(cd))){ blob = await res.blob(); } else if (res.ok){ const tmp = await res.blob(); const ab = await tmp.arrayBuffer(); const u8 = new Uint8Array(ab); if (u8[0] === 0x50 && u8[1] === 0x4B) blob = new Blob([ab],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}); }
      if (!blob){ toast('danger','Hata',`(${res.status}) Word dosyası oluşturulamadı.`); return; }
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '4- BASİT YARGILAMA USULÜ ZAMAN KONTROLÜ.docx'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); toast('success','İndiriliyor','Denetime uygun Word belgesi indiriliyor.');
    } catch (e){ toast('danger','Ağ Hatası', String(e)); } finally { if (exportBtn){ exportBtn.disabled = false; exportBtn.classList.remove('busy'); } }
  }

  function renderExportCard(){
    const host = document.getElementById('udfUploadCard');
    if (!host) return;
    document.getElementById('exportInfoCard')?.remove();

    const birim = state.birimAdi || 'Belirtilmeyen birim';
    const aralik = state.denetimAraligi || 'belirtilmeyen aralık';
    const count = state.rows.length;
    const html = `<section class="card card-upload" id="exportInfoCard" style="margin-top:12px">
      <div class="card-head">
        <span class="material-symbols-rounded">description</span>
        <strong>Word Çıktısı</strong>
      </div>
      <div class="card-body" style="display:block">
        <div class="muted" style="margin-bottom:12px">${esc(birim)} – ${esc(aralik)} aralığında <b>${count}</b> satır hazır.</div>
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
          <label for="dusulenSureInput" class="muted" style="white-space:nowrap;font-size:13px">Düşülecek Süre (Gün):</label>
          <input type="number" id="dusulenSureInput" value="30" min="0" step="1" style="width:100px">
        </div>
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
          <label for="minSureGunInput" class="muted" style="white-space:nowrap;font-size:13px">Minimum Süre (Gün):</label>
          <input type="number" id="minSureGunInput" value="0" min="0" step="1" style="width:100px">
        </div>
        <div id="exportPickRow" style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn" id="exportDocxBtn" type="button" style="display:inline-flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded">description</span>
            <span>Word'e Aktar</span>
          </button>
        </div>
      </div>
    </section>`;
    host.insertAdjacentHTML('afterend', html);
    document.getElementById('exportDocxBtn')?.addEventListener('click', exportToDocx);

    // Validasyon hatası alert'ini exportInfoCard sonrasına ekle
    // Önce eski alert'i kaldır
    const oldGlobal = document.getElementById('byuValidationAlert');
    if (oldGlobal && oldGlobal.parentElement) oldGlobal.parentElement.removeChild(oldGlobal);

    if (state.dateErrors > 0 || state.emptyFieldErrors > 0) {
      let alertMsg = '';
      if (state.dateErrors > 0) alertMsg += `${state.dateErrors} kayıtta tarih hatası`;
      if (state.dateErrors > 0 && state.emptyFieldErrors > 0) alertMsg += ', ';
      if (state.emptyFieldErrors > 0) alertMsg += `${state.emptyFieldErrors} kayıtta boş veri`;
      alertMsg += ' bulunduğu tespit edilmiştir.';
      if (typeof window.showAlert === 'function') {
        const alertDiv = document.createElement('div');
        alertDiv.id = 'byuValidationAlert';
        alertDiv.style.marginTop = '12px';
        const exportCard = document.getElementById('exportInfoCard');
        if (exportCard && exportCard.parentElement){
          exportCard.parentElement.insertBefore(alertDiv, exportCard.nextSibling);
          window.showAlert(alertDiv, {
            type: 'danger',
            title: 'Tabloda Hatalar Var',
            message: alertMsg,
            icon: 'warning',
            dismissible: true
          });
        }
      }
    }
  }

  async function processExcel(file){
    toast('info','Okunuyor','Excel dosyası okunuyor…');
    try {
      window.XlsSpinner?.show();
      const res = await readSheetExact(file);
      if (!res){ clearPreview(); return; }

      // Validasyon yap
      const validation = validateRows(res.rows);
      state.rows = validation.validatedRows;
      state.dateErrors = validation.dateErrors;
      state.emptyFieldErrors = validation.emptyFieldErrors;
      state.sheetName = res.sheetName;
      state.birimAdi = res.birimAdi || '';
      state.denetimAraligi = res.denetimAraligi || '';
      state.currentPage = 1;
      state.delayCheckDone = false;
      renderCombinedPreview();

      const birim = state.birimAdi || 'Belirtilmeyen birim';
      const aralik = state.denetimAraligi || 'belirtilmeyen aralık';
      toast('success','Tablo Yüklendi', `${birim}'nin ${aralik} denetim tarihleri arasında yüklenen Basit Yargılama Usulü tablosunda ${state.rows.length} adet kayda rastlanılmış olup yanda gösterilmektedir.`);
      renderExportCard();
    } finally {
      window.XlsSpinner?.hide();
    }
  }

  // Upload UI
  const elDrop = $('#udfDrop'); const elInput = $('#udfInput'); const elChosen = $('#xlsChosen'); const setChosenText = t => { if (elChosen) elChosen.textContent = t || ''; };
  function isExcelFile(f){ if (!f) return false; const nameOk = /\.xlsx?$/i.test(f.name); const typeOk = /sheet|excel|spreadsheet/i.test(f.type || '') || nameOk; return nameOk || typeOk; }
  function pickFirstExcelFile(list){ if (!list || list.length === 0) return null; if (list.length > 1) toast('warning','Tek Dosya','Yalnızca 1 adet XLS/XLSX seçebilirsiniz. İlk dosya işlendi.'); const f = list[0]; if (!isExcelFile(f)){ toast('warning','Dosya Türü','Lütfen XLS/XLSX dosyası seçiniz.'); return null;} return f; }
  function handleFiles(list){
    const f = pickFirstExcelFile(list);
    if (!f){ setChosenText(''); return; }
    setChosenText(`Seçilen: ${f.name}`);
    window.setInlineXlsLoading('#xlsInlineSpinnerByu', true);
    Promise.resolve().then(() => processExcel(f)).finally(() => window.setInlineXlsLoading('#xlsInlineSpinnerByu', false));
    if (window.jQuery && typeof window.jQuery.getJSON === 'function') {
      window.jQuery.getJSON('https://sayac.657.com.tr/arttirkarar', function(response) {
        try {
          const adetRaw = (response && typeof response.adet !== 'undefined') ? Number(response.adet) : 0;
          if (adetRaw > 0) {
            const fmtInt = n => new Intl.NumberFormat('tr-TR').format(n || 0);
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

  if (elDrop){ elDrop.addEventListener('click',() => elInput?.click()); ['dragenter','dragover'].forEach(ev => elDrop.addEventListener(ev,e => { e.preventDefault(); e.stopPropagation(); elDrop.classList.add('dragover'); })); ['dragleave','drop'].forEach(ev => elDrop.addEventListener(ev,e => { e.preventDefault(); e.stopPropagation(); elDrop.classList.remove('dragover'); })); elDrop.addEventListener('drop',e => { const files = e.dataTransfer?.files; if (!files || files.length === 0){ toast('warning','Dosya','Bırakılan dosya algılanamadı.'); return;} handleFiles(files); }); }
  if (elInput){ elInput.addEventListener('change',() => { const files = elInput.files; if (!files || !files.length){ toast('warning','Dosya','Herhangi bir dosya seçilmedi.'); return;} handleFiles(files); }); }

  // Arama input event listener
  const searchInput = $('#searchInput');
  if (searchInput){
    searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value.trim();
      state.currentPage = 1;
      renderCombinedPreview();
    });
  }

  // BYU Warning Modal - Her sayfaya girişte göster
  (function initByuWarningModal(){
    const modal = $('#byuWarningModal');
    const checkbox = $('#byuWarningCheckbox');
    const okBtn = $('#byuWarningOkBtn');

    if (!modal || !checkbox || !okBtn) return;

    // Checkbox değiştiğinde buton durumunu güncelle
    checkbox.addEventListener('change', () => {
      okBtn.disabled = !checkbox.checked;
    });

    // Tamam butonuna tıklandığında
    okBtn.addEventListener('click', () => {
      if (checkbox.checked){
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });

    // Modal backdrop blur
    modal.style.backdropFilter = 'blur(4px)';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

    // Sayfa yüklendiğinde her zaman göster
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  })();
})();
