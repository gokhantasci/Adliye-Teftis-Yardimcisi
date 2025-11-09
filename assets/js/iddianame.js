(() => {
  'use strict';
  if (window.__iddianameBooted) return;
  window.__iddianameBooted = true;


  const $ = (s, r = document) => r.querySelector(s);
  const PAGE_SIZE = 20;
  const fmtInt = n => new Intl.NumberFormat('tr-TR').format(n || 0);

  // ---------- helpers
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

  // --- doğrulayıcılar
  const RX_ID = /^\s*\d{4}\s*\/\s*\d{1,6}\s*$/;      // C ve F: YYYY/N...
  const RX_DT = /^\s*\d{2}\/\d{2}\/\d{4}\s*$/;       // G: dd/mm/yyyy
  function isValidId(v){ return RX_ID.test(String(v || '')); }
  function isValidDate(v){ return RX_DT.test(String(v || '')); }

  // 0-bazlı indeksler
  const COL = { C:2, D:3, F:5, G:6, I:8, J:9, K:10, L:11 };
  const ROW = { TITLE:2, BIRIM:4, ARALIK:5, HEADER:10, DATA_START:11 }; // D3,F5,F6,C11 başlık; veri C12
  const TITLE_NEEDLE = norm('İDDİANAME DEĞERLENDİRİLME ZAMAN KONTROLÜ');

  const state = {
    rows: [], sheetName: '', birimAdi: '', denetimAraligi: '', currentPage: 1, searchTerm: '', delayCheckDone: false
  };

  function isDataHeaderRow(row){
    const C = norm(row[2]), F = norm(row[5]), G = norm(row[6]),
      I = norm(row[8]), J = norm(row[9]), K = norm(row[10]), L = norm(row[11]);
    let score = 0;
    if (C.startsWith('iddianame no')) score++;
    if (F.includes('degerlendirme no') || F.includes('değerlendirme no')) score++;
    if (G.includes('gonderildigi') || G.includes('gönderildiği')) score++;
    if (I.includes('degerlendirme tarihi') || I.includes('değerlendirme tarihi')) score++;
    if (J.includes('kabul') || J.includes('iade') || J.includes('degerlendirme') || J.includes('değerlendirme')) score++;
    if (K.includes('sure') || K.includes('süre')) score++;
    if (L === 'hakim' || L === 'hakim adi' || L === 'hakim adı') score++;
    return score >= 6;
  }

  function looksLikeIddianameNo(s){
    const v = String(s || '').trim();
    return /^\d{4}\s*[/\-]\s*\d{1,6}$/.test(v);
  }

  // ---------- Excel oku (StyleSheet’e sabit)
  async function readSheetExact(file){
    const XLSX = window.XLSX;
    if (!XLSX){ toast('danger','Bağımlılık','xlsx-loader.js yüklenemedi.'); return null; }

    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type:'array', cellDates:true, dateNF:'dd.mm.yyyy' });

    const sheetName = wb.SheetNames.includes('StyleSheet') ? 'StyleSheet' : wb.SheetNames[0];
    const ws  = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(ws, { header:1, raw:false, defval:'' });

    // D3 başlık kontrolü
    const d3 = cell(aoa, ROW.TITLE, COL.D);
    if (!d3 || !norm(d3).includes(TITLE_NEEDLE)){
      toast('danger','Hatalı Tablo','D3 hücresinde beklenen başlık yok. Lütfen orijinal tabloyu yükleyiniz.');
      return null;
    }

    // Meta (F5, F6)
    const birim  = txt(cell(aoa, ROW.BIRIM, COL.F));
    const aralik = txt(cell(aoa, ROW.ARALIK, COL.F));

    const headerRow = aoa[ROW.HEADER] || [];
    const okHeader =
      norm(headerRow[COL.C]).startsWith('iddianame no') &&
      (norm(headerRow[COL.F]).includes('degerlendirme') || norm(headerRow[COL.F]).includes('değerlendirme')) &&
      (norm(headerRow[COL.G]).includes('gonderildigi') || norm(headerRow[COL.G]).includes('gönderildiği'));
    if (!okHeader){ console.warn('Başlık satırı beklenenden farklı; veri C12’den okunacak.'); }

    // Veriyi C12’den itibaren oku
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

      // sadece doğru formatlı satırlar
      if (!isValidId(C) || !isValidId(F) || !isValidDate(G)) continue;

      const cN = norm(C);
      const dN = norm(row[COL.D] ?? '');

      if (cN.includes('sistemden alinmistir') || dN.includes('sistemden alinmistir')) continue;
      if (cN === 'kurul mufettisi' || cN === 'hakim' || cN === 'hâkim') continue;
      if (cN.startsWith('gelen dosya listesi') || cN.startsWith('birim adi') || cN.startsWith('denetim araligi')) continue;
      if (!C && !F && !G) continue;

      const nonDataTail = !looksLikeIddianameNo(C) && !F && !G && !I && !J && !K && !L;
      if (nonDataTail) continue;

      rows.push({ iddianameNo:C, degerNo:F, gonderimTarihi:G, degerTar:I, degerDurum:J, sureGun:K, hakim:L });
    }

    if (!rows.length){
      toast('warning','Veri Yok','C12’den itibaren veri satırı bulunamadı.');
      return null;
    }

    return { rows, sheetName, birimAdi: birim, denetimAraligi: aralik };
  }

  // ---------- render + pager
  function clearPreview(){
    const wrap = $('#combinedTableWrap');
    const card = $('#combinedSummaryCard');
    const stats = $('#combinedStats');
    if (wrap) wrap.innerHTML = `<div class="placeholder">Henüz veri yok.</div>`;
    if (stats) stats.innerHTML = '';
    if (card) card.style.display = 'none';
  }

  // Tarih parse helper (dd/mm/yyyy -> Date)
  function parseDate(s){
    if (!s || typeof s !== 'string') return null;
    const parts = s.trim().split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month - 1, day);
  }

  // Gün farkı hesapla
  function daysDiff(date1, date2){
    if (!date1 || !date2) return null;
    const diff = Math.abs(date2 - date1);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Gecikme süresi kontrol ve uyarı (İddianame için: gönderim - değerlendirme tarihi)
  function checkDelayDiscrepancy(rows){
    if (!rows || rows.length < 3) return;

    const discrepancies = [];
    for (let i = 0; i < Math.min(3, rows.length); i++){
      const r = rows[i];
      const gonderimDate = parseDate(r.gonderimTarihi);
      const degerDate = parseDate(r.degerTar);
      const reportedDelay = parseInt(r.sureGun, 10);

      if (!gonderimDate || !degerDate || isNaN(reportedDelay)) continue;

      const calculatedDelay = daysDiff(gonderimDate, degerDate);
      if (calculatedDelay === null) continue;

      const diff = calculatedDelay - reportedDelay;
      if (diff > 0){
        discrepancies.push({index: i + 1, diff});
      }
    }

    // İlk 3 kayıtta aynı fark varsa uyar
    if (discrepancies.length >= 3){
      const firstDiff = discrepancies[0].diff;
      const allSame = discrepancies.every(d => d.diff === firstDiff);
      if (allSame){
        toast('warning', 'Süre Uyumsuzluğu',
          `Tablodaki sürelerden ${firstDiff} gün düşüldüğü tespit edilmiştir. (İlk ${discrepancies.length} kayıtta aynı fark)`);
      }
    }
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
        return norm(r.iddianameNo).includes(term) ||
               norm(r.degerNo).includes(term) ||
               norm(r.gonderimTarihi).includes(term) ||
               norm(r.degerTar).includes(term) ||
               norm(r.degerDurum).includes(term) ||
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
        ${state.sheetName ? `<span class="badge">${esc(state.sheetName)}</span>` : ''}
        ${state.birimAdi ? `<span class="badge">${esc(state.birimAdi)}</span>` : ''}
        ${state.denetimAraligi ? `<span class="badge">${esc(state.denetimAraligi)}</span>` : ''}
      `;
    }

    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.currentPage > pageCount) state.currentPage = pageCount;
    const start = (state.currentPage - 1) * PAGE_SIZE;
    const end   = Math.min(total, start + PAGE_SIZE);
    const pageRows = filteredRows.slice(start, end);

    let html = `<div class="table-wrap-inner">`;
    html += `<table class="table compact" id="previewXls">`;
    html += `<thead><tr class="center">
      <th>İddianame No</th>
      <th>İddianame Değerlendirme No</th>
      <th>İddianamenin Gönderildiği Tarih</th>
      <th>İddianame Değerlendirme Tarihi</th>
      <th>Değerlendirme (Kabul-İade)</th>
      <th>Süre (Gün)</th>
      <th>Hakim</th>
    </tr></thead><tbody>`;
    for (const r of pageRows){
      html += `<tr class="center">
        <td>${esc(r.iddianameNo)}</td>
        <td>${esc(r.degerNo)}</td>
        <td>${esc(r.gonderimTarihi)}</td>
        <td>${esc(r.degerTar)}</td>
        <td>${esc(r.degerDurum)}</td>
        <td class="num">${esc(r.sureGun)}</td>
        <td>${esc(r.hakim)}</td>
      </tr>`;
    }
    html += `</tbody></table>`;
    html += renderPagerHtml(state.currentPage, pageCount);
    html += `</div>`;

    wrap.innerHTML = html;
    bindPager(pageCount);
    card.style.display = 'block';

    // İlk render'da gecikme kontrolü yap
    if (state.currentPage === 1 && !state.delayCheckDone){
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
      </div>
    `;
  }
  function bindPager(pageCount){
    const toPage = (p) => { state.currentPage = Math.min(pageCount, Math.max(1, p)); renderCombinedPreview(); };
    $('#pgFirst')?.addEventListener('click', () => toPage(1));
    $('#pgPrev') ?.addEventListener('click', () => toPage(state.currentPage - 1));
    $('#pgNext') ?.addEventListener('click', () => toPage(state.currentPage + 1));
    $('#pgLast') ?.addEventListener('click', () => toPage(pageCount));
  }

  async function exportToDocx(){
    // Minimum süre filtresi (gün)
    const minEl = document.getElementById('minSureGunInput');
    const minStr = (minEl && typeof minEl.value === 'string') ? minEl.value.trim() : '0';
    const minDays = parseInt(minStr, 10);
    if (isNaN(minDays) || minDays < 0) {
      window.toast?.({type:'warning', title:'Geçersiz Değer', body:'Minimum Süre (Gün) 0 veya pozitif bir sayı olmalıdır.'});
      return;
    }

    const payload = {
	  birimAdi: state.birimAdi || '',
	  denetimAraligi: state.denetimAraligi || '',
	  rows: Array.isArray(state.rows) ? state.rows : [],
	  replaceVars: {
        YER: (state.birimAdi || '').toUpperCase(),
        TARIH: new Date().toLocaleDateString('tr-TR')
	  }
    };
    if (!payload.rows.length) {
      window.toast?.({type:'warning', title:'Veri yok', body:'Tabloda satır bulunamadı.'});
      return;
    }

    // Hakim istatistiği
    const hakimCounts = {};
    const sureGunValues = [];
    payload.rows.forEach(r => {
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
      window.toast?.({type:'info', title:'Aktarılan Hakimler', body:toastMsg});
    }

    // Filtreden geçen satırlar: minDays > 0 ise sadece daha büyük olanlar; 0 ise tümü
    const filteredRows = (minDays > 0)
      ? payload.rows.filter(r => {
        const v = parseInt(String(r.sureGun ?? '').replace(/[^\d-]/g,''), 10);
        return !isNaN(v) && v >= minDays;
      })
      : payload.rows;

    if (minDays > 0 && filteredRows.length === 0) {
      window.toast?.({type:'warning', title:'Filtre Sonucu Boş', body:`${minDays} gün ve üzeri süreye sahip satır yok.`});
      return;
    }

    payload.rows = filteredRows;
    // Use explicit .php to avoid server redirects that can drop POST bodies
    const apiUrl = '/api/iddianame_writer.php';
    const bodyStr = JSON.stringify(payload);
    const exportBtn = document.getElementById('exportDocxBtn');
    if (exportBtn) { exportBtn.disabled = true; exportBtn.classList.add('busy'); }
    console.log('[iddianame][export:init]', { url: apiUrl, method: 'POST', bytes: bodyStr.length, rowCount: payload.rows.length });

    try {
      const startedAt = performance.now();
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: bodyStr
      });
      const durMs = Math.round(performance.now() - startedAt);
      console.log('[iddianame][export:response]', { status: res.status, durationMs: durMs, redirected: res.redirected, finalUrl: res.url, contentType: res.headers.get('Content-Type'), disposition: res.headers.get('Content-Disposition') });

      console.log('Sunucu yanıtı:', {
        status: res.status,
        contentType: res.headers.get('Content-Type'),
        disposition: res.headers.get('Content-Disposition')
      });

      const ct = (res.headers.get('Content-Type') || '').toLowerCase();
      const cd = res.headers.get('Content-Disposition') || '';
      let blob = null;

      if (res.ok && (ct.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || /filename\s*=\s*"?[^";]*\.docx"?/i.test(cd))){
        blob = await res.blob();
      } else if (res.ok) {
        // İçerik türü yanlış gelse bile ZIP imzasını kontrol ederek kabul et
        const tmpBlob = await res.blob();
        const ab = await tmpBlob.arrayBuffer();
        const u8 = new Uint8Array(ab);
        const looksZip = u8.length >= 4 && u8[0] === 0x50 && u8[1] === 0x4B; // 'PK' imzası
        if (looksZip) blob = new Blob([ab], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }

      if (!blob) {
        let msg = `(${res.status}) Word dosyası oluşturulamadı.`;
        try {
          const text = await res.clone().text();
          try { const j = JSON.parse(text); if (j && j.reason) msg = j.reason; } catch { if (text) msg = text.slice(0, 500); }
        } catch {}
        window.toast?.({type:'danger', title:'Hata', body: msg});
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = '1- İDDİANAME DEĞERLENDİRME ZAMAN KONTROLÜ.docx';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.toast?.({type:'success', title:'İndiriliyor', body:'Denetime uygun Word belgesi indiriliyor.'});
    } catch (e){
      window.toast?.({type:'danger', title:'Ağ Hatası', body: String(e)});
    } finally {
      if (exportBtn) { exportBtn.disabled = false; exportBtn.classList.remove('busy'); }
    }
  }

  // İndirme kartı (buton görünümü Dosya Seç ile aynı)
  function renderExportCard(){
    const host = document.getElementById('udfUploadCard');
    if (!host) return;

    const old = document.getElementById('exportInfoCard');
    if (old) old.remove();

    const birim  = state.birimAdi || 'Belirtilmeyen birim';
    const aralik = state.denetimAraligi || 'belirtilen';
    const count  = state.rows.length;

    // Sayfadaki "Dosya Seç" alanıyla birebir görünüm için aynı kart/başlık yapısını kullan
    const html = `
    <section class="card card-upload" id="exportInfoCard" style="margin-top:12px">
      <div class="card-head">
        <span class="material-symbols-rounded">description</span>
        <strong>Word Çıktısı</strong>
      </div>
      <div class="card-body" style="display:block">
        <div class="muted" style="margin-bottom:8px">
          ${esc(birim)} – ${esc(aralik)} aralığında <b>${count}</b> satır hazır.
        </div>
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

  // exportHealthBtn kaldırıldı (sunucu durum kontrolü devre dışı)

  // ---------- süreç
  async function processExcel(file){
    toast('info','Okunuyor','Excel dosyası okunuyor…');
    try {
      window.XlsSpinner?.show();
      const res = await readSheetExact(file);
      if (!res){ clearPreview(); return; }

      state.rows = res.rows;
      state.sheetName = res.sheetName;
      state.birimAdi = res.birimAdi || '';
      state.denetimAraligi = res.denetimAraligi || '';
      state.currentPage = 1;
      state.delayCheckDone = false;

      renderCombinedPreview();

      const birim = state.birimAdi || 'Belirtilmeyen birim';
      const aralik = state.denetimAraligi || 'belirtilmeyen tarih aralığı';
      toast('success','Tablo Yüklendi', `${birim}'nin ${aralik} denetim tarihleri arasında yüklenen İddianame Değerlendirme tablosunda ${state.rows.length} adet kayda rastlanılmış olup yanda gösterilmektedir.`);
      renderExportCard();
    } finally {
      window.XlsSpinner?.hide();
    }
  }

  // ---------- yükleme UI (tek dosya)
  const elDrop   = $('#udfDrop');
  const elInput  = $('#udfInput');
  const elChosen = $('#xlsChosen');
  const setChosenText = (t) => { if (elChosen) elChosen.textContent = t || ''; };

  function isExcelFile(f){
    if (!f) return false;
    const nameOk = /\.xlsx?$/i.test(f.name);
    const typeOk = /sheet|excel|spreadsheet/i.test(f.type || '') || nameOk;
    return nameOk || typeOk;
  }
  function pickFirstExcelFile(fileList){
    if (!fileList || fileList.length === 0) return null;
    if (fileList.length > 1) toast('warning','Tek Dosya','Yalnızca 1 adet XLS/XLSX seçebilirsiniz. İlk dosya işlendi.');
    const f = fileList[0];
    if (!isExcelFile(f)){ toast('warning','Dosya Türü','Lütfen XLS/XLSX dosyası seçiniz.'); return null; }
    return f;
  }
  function handleFiles(fl){
    const f = pickFirstExcelFile(fl);
    if (!f){ setChosenText(''); return; }
    setChosenText(`Seçilen: ${f.name}`);
    window.setInlineXlsLoading('#xlsInlineSpinnerIdd', true);
    Promise.resolve().then(() => processExcel(f)).finally(() => window.setInlineXlsLoading('#xlsInlineSpinnerIdd', false));
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

  if (elDrop){
    elDrop.addEventListener('click', () => elInput?.click());
    ['dragenter','dragover'].forEach(ev => elDrop.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); elDrop.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(ev => elDrop.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); elDrop.classList.remove('dragover'); }));
    elDrop.addEventListener('drop', e => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0){ toast('warning','Dosya','Bırakılan dosya algılanamadı.'); return; }
      window.setInlineXlsLoading('#xlsInlineSpinnerIdd', true);
      Promise.resolve().then(() => handleFiles(files)).finally(() => window.setInlineXlsLoading('#xlsInlineSpinnerIdd', false));
    });
  }
  if (elInput){
    elInput.addEventListener('change', () => {
      const files = elInput.files;
      if (!files || !files.length){ toast('warning','Dosya','Herhangi bir dosya seçilmedi.'); return; }
      window.setInlineXlsLoading('#xlsInlineSpinnerIdd', true);
      Promise.resolve().then(() => handleFiles(files)).finally(() => window.setInlineXlsLoading('#xlsInlineSpinnerIdd', false));
    });
  }

  // Arama input event listener - event delegation kullan
  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'searchInput'){
      state.searchTerm = e.target.value.trim();
      state.currentPage = 1;
      renderCombinedPreview();
    }
  });
})();
