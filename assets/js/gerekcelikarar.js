(() => {
  'use strict';
  if (window.__gerekceliKararBooted) return;
  window.__gerekceliKararBooted = true;


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
  const RX_ID = /^\s*\d{4}\s*\/\s*\d{1,6}\s*$/;      // Dava/Karar No: YYYY/N...
  const RX_DT = /^\s*\d{2}\/\d{2}\/\d{4}\s*$/;       // Tarih: dd/mm/yyyy
  function isValidId(v){ return RX_ID.test(String(v || '')); }
  function isValidDate(v){ return RX_DT.test(String(v || '')); }

  // 0-bazlı indeksler (Gerekçeli Karar: C=Esas No, G=Karar Türü, I=Kısa Karar Tarihi, K=Gerekçeli Karar Tarihi, L=Gecikme Süresi, N=Hakim)
  const COL = { C:2, D:3, F:5, G:6, I:8, K:10, L:11, N:13 };
  const ROW = { TITLE:2, BIRIM:4, ARALIK:5, HEADER:10, DATA_START:11 };
  const TITLE_NEEDLE = norm('GEREKÇELİ KARARIN ZAMAN KONTROLÜ');

  const state = {
    rows: [], sheetName: '', birimAdi: '', denetimAraligi: '', currentPage: 1, searchTerm: '', delayCheckDone: false
  };

  function isDataHeaderRow(row){
    const C = norm(row[2]), G = norm(row[6]), I = norm(row[8]),
      K = norm(row[10]), L = norm(row[11]), N = norm(row[13]);
    let score = 0;
    // Gerekçeli Karar için başlık kontrolü: Esas No, Karar Türü, Kısa Karar Tarihi, Gerekçeli Karar Tarihi, Gecikme Süresi, Hakim
    if (C.includes('esas') && C.includes('no')) score++;
    if (G.includes('karar') && G.includes('turu')) score++;
    if (I.includes('kisa') && I.includes('karar') && I.includes('tarih')) score++;
    if (K.includes('gerekceli') && K.includes('karar') && K.includes('tarih')) score++;
    if (L.includes('gecikme') && L.includes('sure')) score++;
    if (N === 'hakim' || N.includes('hakim')) score++;
    return score >= 5;
  }

  function looksLikeKararNo(s){
    const v = String(s || '').trim();
    return /^\d{4}\s*[/\-]\s*\d{1,6}$/.test(v);
  }

  // ---------- Excel oku (StyleSheet'e sabit)
  async function readSheetExact(file){
    const XLSX = window.XLSX;
    if (!XLSX){ toast('danger','Bağımlılık','xlsx-loader.js yüklenemedi.'); return null; }

    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type:'array', cellDates:true, dateNF:'dd.mm.yyyy' });

    const sheetName = wb.SheetNames.includes('StyleSheet') ? 'StyleSheet' : wb.SheetNames[0];
    const ws  = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(ws, { header:1, raw:false, defval:'' });

    // D3 başlık kontrolü (esnek - fazladan boşluğa toleranslı)
    const d3 = cell(aoa, ROW.TITLE, COL.D);
    const d3Norm = norm(d3);
    // Normalize edilmiş metinde fazladan boşluklar zaten temizlenir
    const hasValidTitle = d3Norm.includes('gerekceli kararin zaman kontrolu') ||
                          d3Norm.includes('gerekceli karar') && d3Norm.includes('zaman') && d3Norm.includes('kontrol');
    if (!hasValidTitle){
      console.warn('D3 hücresinde beklenen başlık bulunamadı, ancak devam ediliyor. Bulunan:', d3);
    }

    // Meta (F5 - sadece birim adı)
    const birim  = txt(cell(aoa, ROW.BIRIM, COL.F));

    const headerRow = aoa[ROW.HEADER] || [];
    const okHeader =
      (norm(headerRow[COL.C]).includes('esas') && norm(headerRow[COL.C]).includes('no')) &&
      (norm(headerRow[COL.G]).includes('karar') && norm(headerRow[COL.G]).includes('turu')) &&
      (norm(headerRow[COL.I]).includes('kisa') && norm(headerRow[COL.I]).includes('karar'));
    if (!okHeader){ console.warn("Başlık satırı beklenenden farklı; veri C12'den okunacak."); }

    // Veriyi C12'den itibaren oku
    const rows = [];
    for (let r = ROW.DATA_START; r < aoa.length; r++){
      const row = aoa[r] || [];
      if (isDataHeaderRow(row)) continue;

      const C = txt(row[COL.C]); // Esas No
      const G = txt(row[COL.G]); // Karar Türü
      const I = txt(row[COL.I]); // Kısa Karar Tarihi
      const K = txt(row[COL.K]); // Gerekçeli Karar Tarihi
      const L = txt(row[COL.L]); // Gecikme Süresi
      const N = txt(row[COL.N]); // Hakim

      // En az Esas No dolu olsun
      if (!C || C.length < 3) continue;

      const cN = norm(C);

      // Sistem mesajlarını ve başlık satırlarını atla
      if (cN.includes('sistemden alinmistir')) continue;
      if (cN === 'kurul mufettisi' || cN === 'hakim' || cN === 'hâkim') continue;
      if (cN.startsWith('gelen dosya listesi') || cN.startsWith('birim adi') || cN.startsWith('denetim araligi')) continue;
      if (cN.includes('esas') && cN.includes('no')) continue; // başlık satırı

      // Boş satırları atla
      if (!C && !G && !I && !K && !L && !N) continue;

      rows.push({ esasNo:C, kararTuru:G, kisaKararTarihi:I, gerekceliKararTarihi:K, gecikme:L, hakim:N });
    }

    if (!rows.length){
      toast('warning','Veri Yok','C12\'den itibaren veri satırı bulunamadı.');
      return null;
    }

    return { rows, sheetName, birimAdi: birim, denetimAraligi: '' };
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

  // Gecikme süresi kontrol ve uyarı
  function checkDelayDiscrepancy(rows){
    if (!rows || rows.length < 3) return;

    const discrepancies = [];
    for (let i = 0; i < Math.min(3, rows.length); i++){
      const r = rows[i];
      const kisaDate = parseDate(r.kisaKararTarihi);
      const gerekceliDate = parseDate(r.gerekceliKararTarihi);
      const reportedDelay = parseInt(r.gecikme, 10);

      if (!kisaDate || !gerekceliDate || isNaN(reportedDelay)) continue;

      const calculatedDelay = daysDiff(kisaDate, gerekceliDate);
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
        return norm(r.esasNo).includes(term) ||
               norm(r.kararTuru).includes(term) ||
               norm(r.kisaKararTarihi).includes(term) ||
               norm(r.gerekceliKararTarihi).includes(term) ||
               norm(r.gecikme).includes(term) ||
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
      <th>Esas No</th>
      <th>Karar Türü</th>
      <th>Kısa Karar Tarihi</th>
      <th>Gerekçeli Karar Tarihi (Onay Tarihi)</th>
      <th>Gecikme Süresi (Gün)</th>
      <th>Hakim</th>
    </tr></thead><tbody>`;
    for (const r of pageRows){
      html += `<tr class="center">
        <td>${esc(r.esasNo)}</td>
        <td>${esc(r.kararTuru)}</td>
        <td>${esc(r.kisaKararTarihi)}</td>
        <td>${esc(r.gerekceliKararTarihi)}</td>
        <td class="num">${esc(r.gecikme)}</td>
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
    const minDelayInput = document.getElementById('minDelayInput');
    const minDelay = minDelayInput ? parseInt(minDelayInput.value, 10) : 0;

    // Gecikme filtreleme
    let filteredRows = state.rows;
    if (minDelay > 0){
      filteredRows = state.rows.filter(r => {
        const delay = parseInt(r.gecikme, 10);
        return !isNaN(delay) && delay >= minDelay;
      });
      if (filteredRows.length === 0){
        window.toast?.({type:'warning', title:'Filtreleme', body:`${minDelay} gün ve üzeri gecikme olan kayıt bulunamadı.`});
        return;
      }
    }

    const payload = {
	  birimAdi: state.birimAdi || '',
	  rows: Array.isArray(filteredRows) ? filteredRows : [],
	  replaceVars: {
        YER: (state.birimAdi || '').toUpperCase(),
        TARIH: new Date().toLocaleDateString('tr-TR')
	  }
    };

    // Hakim istatistiği
    const hakimCounts = {};
    const gecikmeValues = [];
    payload.rows.forEach(r => {
      const h = String(r.hakim || '').trim();
      if (h) hakimCounts[h] = (hakimCounts[h] || 0) + 1;
      const gecikmeVal = parseInt(String(r.gecikme || '').replace(/[^\d-]/g,''), 10);
      if (!isNaN(gecikmeVal)) gecikmeValues.push(gecikmeVal);
    });
    const hakimList = Object.entries(hakimCounts)
      .sort((a,b) => b[1] - a[1])
      .map(([name, count]) => `${name} - ${count}`)
      .join(', ');

    let toastMsg = '';
    if (hakimList){
      toastMsg += `${hakimList} kayıt tespit edilmiştir.`;
    }
    if (gecikmeValues.length > 0){
      const minGun = Math.min(...gecikmeValues);
      const maxGun = Math.max(...gecikmeValues);
      const avgGun = Math.round(gecikmeValues.reduce((a,b) => a + b,0) / gecikmeValues.length);
      if (toastMsg) toastMsg += ' ';
      toastMsg += `En az: ${minGun} gün, En fazla: ${maxGun} gün, Ortalama: ${avgGun} gün.`;
    }
    if (toastMsg){
      window.toast?.({type:'info', title:'Aktarılan Hakimler', body:toastMsg});
    }
    if (!payload.rows.length) {
      window.toast?.({type:'warning', title:'Veri yok', body:'Tabloda satır bulunamadı.'});
      return;
    }
    // API endpoint: gerekcelikarar_writer.php (iddianame yerine)
    const apiUrl = '/api/gerekcelikarar_writer.php';
    const bodyStr = JSON.stringify(payload);
    const exportBtn = document.getElementById('exportDocxBtn');
    if (exportBtn) { exportBtn.disabled = true; exportBtn.classList.add('busy'); }
    console.log('[gerekcelikarar][export:init]', { url: apiUrl, method: 'POST', bytes: bodyStr.length, rowCount: payload.rows.length });

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
      console.log('[gerekcelikarar][export:response]', { status: res.status, durationMs: durMs, redirected: res.redirected, finalUrl: res.url, contentType: res.headers.get('Content-Type'), disposition: res.headers.get('Content-Disposition') });

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
      const a = document.createElement('a'); a.href = url; a.download = '5- GEREKÇELİ KARAR ZAMAN KONTROLÜ.docx';
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
    const count  = state.rows.length;

    const html = `
    <section class="card card-upload" id="exportInfoCard" style="margin-top:12px">
      <div class="card-head">
        <span class="material-symbols-rounded">description</span>
        <strong>Word Çıktısı</strong>
      </div>
      <div class="card-body" style="display:block">
        <div class="muted" style="margin-bottom:8px">
          ${esc(birim)} – <b>${count}</b> satır hazır.
        </div>
        <div style="margin-bottom:10px">
          <label for="minDelayInput" style="display:block;margin-bottom:4px;font-size:13px;color:var(--muted)">
            Minimum Gecikme Süresi (Gün)
          </label>
          <input type="number" id="minDelayInput" class="input" value="0" min="0" step="1" 
                 style="width:100%;max-width:200px" 
                 placeholder="0">
          <small class="muted" style="display:block;margin-top:4px">Bu değer ve üzeri gecikme olanlar aktarılır</small>
        </div>
        <div id="exportPickRow" style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn" id="exportDocxBtn" type="button" style="display:inline-flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded">description</span><span>Word'e Aktar</span>
          </button>
        </div>
      </div>
    </section>`;

    host.insertAdjacentHTML('afterend', html);
    document.getElementById('exportDocxBtn')?.addEventListener('click', exportToDocx);
  }

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
      toast('success','Tablo Yüklendi', `${birim} biriminde yüklenen Gerekçeli Karar tablosunda ${state.rows.length} adet kayda rastlanılmış olup yanda gösterilmektedir.`);
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
    window.setInlineXlsLoading('#xlsInlineSpinnerGk', true);
    Promise.resolve().then(() => processExcel(f)).finally(() => window.setInlineXlsLoading('#xlsInlineSpinnerGk', false));
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
      window.setInlineXlsLoading('#xlsInlineSpinnerGk', true);
      Promise.resolve().then(() => handleFiles(files)).finally(() => window.setInlineXlsLoading('#xlsInlineSpinnerGk', false));
    });
  }
  if (elInput){
    elInput.addEventListener('change', () => {
      const files = elInput.files;
      if (!files || !files.length){ toast('warning','Dosya','Herhangi bir dosya seçilmedi.'); return; }
      window.setInlineXlsLoading('#xlsInlineSpinnerGk', true);
      Promise.resolve().then(() => handleFiles(files)).finally(() => window.setInlineXlsLoading('#xlsInlineSpinnerGk', false));
    });
  }

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
