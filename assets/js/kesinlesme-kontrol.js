(() => {
  'use strict';

  // =========================
  // Küçük yardımcılar
  // =========================
  const $ = (s, r = document) => r.querySelector(s);
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  const fmtInt = n => new Intl.NumberFormat('tr-TR').format(n || 0);
  const setText = (el, html) => { if (el) el.innerHTML = html; };

  function exportCombinedToXLS() {
	  try {
      // 1) Kaynak: filtrelenmiş tüm satırlar (pager yok!)
      const rows = Array.isArray(COMB?.filtered) ? COMB.filtered : [];

      // 2) Başlıklar
      const headers = ['#', 'Esas No', 'Karar No (UDF)', 'Statü (UDF)', 'Öneri'];

      // 3) AOArray: headers + data
      const data = [headers];
      for (let i = 0; i < rows.length; i++) {
		  const r = rows[i] || {};
		  data.push([
          i + 1,
          String(r.esasNo || ''),
          String(r.kararNo || ''),
          String(r.statu || ''),
          String(r.oneri || '') // plain text (ikon değil)
		  ]);
      }

      // 4) XLSX mevcutsa .xlsx üret
      if (window.XLSX && XLSX.utils && XLSX.writeFile) {
		  const ws = XLSX.utils.aoa_to_sheet(data);
		  // Kolon genişlikleri (opsiyonel)
		  ws['!cols'] = [{wch:6},{wch:16},{wch:18},{wch:24},{wch:60}];
		  const wb = XLSX.utils.book_new();
		  XLSX.utils.book_append_sheet(wb, ws, 'Birlesik');
		  const fname = `harc_tahsil_birlesik_${formatNowForFile()}.xlsx`;
		  XLSX.writeFile(wb, fname);
		  window.toast?.({type:'success', title:'Dışa aktarıldı', body:`${fname} oluşturuldu`});
		  return;
      }

      // 5) Yedek: CSV kaydet
      const csv = data.map(row =>
		  row.map(v => {
          const s = String(v ?? '');
          return /[",;\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
		  }).join(';')
      ).join('\n');

      const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
      const fname = `harc_tahsil_birlesik_${formatNowForFile()}.csv`;
      saveBlobAs(blob, fname);
      window.toast?.({type:'info', title:'CSV olarak kaydedildi', body:`XLSX kütüphanesi bulunamadı, CSV verildi: ${fname}`});
	  } catch (e) {
      console.error(e);
      window.toast?.({type:'danger', title:'Dışa aktarma hatası', body:String(e?.message || e)});
	  }
  }

  // Basit zaman damgası: YYYYMMDD_HHMM
  function formatNowForFile() {
	  const d = new Date();
	  const pad = n => String(n).padStart(2,'0');
	  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  function saveBlobAs(blob, filename) {
	  const url = URL.createObjectURL(blob);
	  const a = document.createElement('a');
	  a.href = url;
	  a.download = filename;
	  document.body.appendChild(a);
	  a.click();
	  a.remove();
	  setTimeout(() => URL.revokeObjectURL(url), 1000);
  }


  // ---- Öneri üretimi için yardımcılar ----
  const todayYear = new Date().getFullYear();

  function extractYearFromKararNo(kararNo) {
	  const m = String(kararNo || '').match(/\b(19|20)\d{2}\b/);
	  return m ? parseInt(m[0], 10) : NaN;
  }

  function normStatus(s) {
	  return String(s || '').trim().toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\s+/g,' ')
      .replace(/ğ/g,'g')
      .replace(/ü/g,'u')
      .replace(/ş/g,'s')
      .replace(/ı/g,'i')
      .replace(/ö/g,'o')
      .replace(/ç/g,'c');

  }

  function iconHtml(kind) {
	  // kind: 'red' | 'green' | 'yellow'
	  const map = {
      red:   { name: 'error',        color: 'var(--danger, #d32f2f)'  },
      green: { name: 'check_circle', color: 'var(--success, #2e7d32)' },
      yellow:{ name: 'warning',      color: 'var(--warning, #f9a825)' }
	  };
	  const k = map[kind] || map.yellow;
	  return `<span class="material-symbols-rounded" style="vertical-align:middle;margin-right:6px;color:${k.color}">${k.name}</span>`;
  }

  /**
	 * Karar Numarası olan kayıtlar için "Öneri" üretir.
	 * Dönen değer: { oneri, oneriHtml } (oneri plain text, oneriHtml ikonlu)
	 */
  function computeOneriForRecord(rec) {
	  const statuRaw  = rec.statu || '';
	  const kararNo   = rec.kararNo || '';
	  if (!kararNo) return { oneri: '', oneriHtml: '' };

	  // --- Normalleştirme: Türkçe karakter + küçük harf + trim ---
	  const st = String(statuRaw)
      .toLowerCase()
      .replace(/\s+/g,' ')
      .replace(/ı/g,'i')
      .replace(/İ/g,'i')
      .replace(/ü/g,'u')
      .replace(/ö/g,'o')
      .replace(/ş/g,'s')
      .replace(/ç/g,'c')
      .replace(/ğ/g,'g')
      .replace(/[^\w\s]/g,'') // noktalama, aksan vs temizle
      .trim();

	  const todayYear = new Date().getFullYear();
	  const extractYearFromKararNo = (kararNo) => {
      const m = String(kararNo || '').match(/\b(19|20)\d{2}\b/);
      return m ? +m[0] : NaN;
	  };
	  const kYear = extractYearFromKararNo(kararNo);
	  const isOlderThanThisYear = Number.isFinite(kYear) && (todayYear - kYear > 0);

	  const iconHtml = (kind) => {
      const map = {
		  red:    {name:'error',   color:'var(--danger,#d32f2f)'},
		  yellow: {name:'warning', color:'var(--warning,#f9a825)'},
		  green:  {name:'check_circle', color:'var(--success,#2e7d32)'}
      };
      const k = map[kind] || map.yellow;
      return `<span class="material-symbols-rounded" style="vertical-align:middle;margin-right:6px;color:${k.color}">${k.name}</span>`;
	  };

	  // --- Kurallar ---

	  // 1) "İlk Duruşma Yapıldı"
	  if (st.includes('ilk durusma yapildi')) {
      const txt = 'Bu dosyanın karar durumunu kontrol et';
      return { oneri: txt, oneriHtml: iconHtml('red') + txt };
	  }

	  // 2) "Ara Duruşma Yapıldı" veya "Basit Yargılama Usulune İtirazın Kabulü Üzerine Açılış"
	  if (st.includes('ara durusma yapildi') || st.includes('basit yargilama usulune itirazin kabulu uzerine acilis')) {
      const txt = 'Bu dosyanın karar durumunu kontrol et';
      return { oneri: txt, oneriHtml: iconHtml('red') + txt };
	  }

	  // 4) "Kapalı"
	  if (st.includes('kapali')) {
      const txt = 'Kesinleşme durumu kontrol edilecek';
      return { oneri: txt, oneriHtml: iconHtml('red') + txt };
	  }

	  // 5) "Birleştirilmek Üzere Kapatıldı", "Yetkisizlik Üzerine", "Görevsizlik Üzerine Kapatıldı", "Kapatıldı"
	  if (
      st.includes('birlestirilmek uzere kapatildi') ||
		st.includes('yetkisizlik uzerine') ||
		st.includes('gorevsizlik uzerine kapatildi') ||
		(st === 'kapatildi' || st.includes(' kapatildi'))
	  ) {
      const txt = 'Kesinleşme durumu kontrol edilecek.';
      return { oneri: txt, oneriHtml: iconHtml('yellow') + txt };
	  }

	  // 6) "Nihayi Karar Kaydedildi", "Son Duruşma yapıldı"
	  if (st.includes('nihayi karar kaydedildi') || st.includes('son durusma yapildi')) {
      const txt = 'Gerekçeli karar yazıldı mı?';
      return { oneri: txt, oneriHtml: iconHtml('yellow') + txt };
	  }

	  // 7) "Gerekçeli Karar Yazıldı" ve karar yılı bu yıldan eski ise
	  if (st.includes('gerekceli karar yazildi') && isOlderThanThisYear) {
      const txt = 'Bu dosya işlemsiz kalmış olabilir mi?';
      return { oneri: txt, oneriHtml: iconHtml('yellow') + txt };
	  }

	  // --- Yeni 4 özel durum ---
	  if (st.includes('istinaftan kismi dondu')) {
      const txt = 'Bu dosya istinaftan kısmi dönmüş, kesinleşmeleri gözden geçirelim.';
      return { oneri: txt, oneriHtml: iconHtml('yellow') + txt };
	  }

	  if (st.includes('istinaftan dondu')) {
      const txt = 'Kesinleşme EKSİK olabilir mi? Değilse dosya TEVDİ olabilir.';
      return { oneri: txt, oneriHtml: iconHtml('red') + txt };
	  }

	  if (st.includes('yargitaydan kismi dondu')) {
      const txt = 'Bu dosya istinaftan kısmi dönmüş, kesinleşmeleri gözden geçirelim.';
      return { oneri: txt, oneriHtml: iconHtml('yellow') + txt };
	  }

	  if (st.includes('yargitaydan dondu')) {
      const txt = 'Kesinleşme EKSİK olabilir mi? Değilse dosya TEVDİ olabilir.';
      return { oneri: txt, oneriHtml: iconHtml('red') + txt };
	  }

	  // default: öneri yok
	  return { oneri: '', oneriHtml: '' };
  }


  // Esas/Dosya numarası normalize (örn: "2024/123")
  const norm = s => String(s ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[^\d/]/g, m => (m === '/' ? '/' : ''))
    .trim()
    .toUpperCase();

  // Satırdan ilk "YYYY/NNN" esas no'yu çıkar (bulamazsa "")
  function getFirstEsasFromRow(row) {
	  const yearSlash = /\b(19|20)\d{2}\s*\/\s*\d+\b/;
	  for (const cell of row) {
      const txt = String(cell ?? '');
      const m = txt.match(yearSlash);
      if (m) return m[0];
	  }
	  return '';
  }

  // UDF satırı için heuristik: Karar No/Statü/Açılış Türü türet
  function extractUdfHeuristics(row, esasNorm) {
	  let kararNo = '';
	  let statu = '';
	  let acilisTuru = '';

	  // Karar No: satırdaki YYYY/NNN desenlerinden Esas'a eşit olmayanı al
	  const yearSlashG = /\b(19|20)\d{2}\s*\/\s*\d+\b/g;
	  const cands = [];
	  for (const cell of row) {
      const txt = String(cell ?? '');
      let m; while ((m = yearSlashG.exec(txt))) cands.push(m[0]);
	  }
	  const k = cands.find(c => norm(c) !== esasNorm);
	  if (k) kararNo = k;

	  // Statü: anahtar kelimeler
	  const line = row.map(v => String(v ?? '').toLowerCase()).join(' ');
	  const statusKeys = [
      'kabul','red','ret','onama','bozma','kaldır','kaldirma','iade','düşme','dusme','hagb',
      'esastan','usulden','istinaf','temyiz','duruşma','durusma'
	  ];
	  const hit = statusKeys.find(w => line.includes(w));
	  if (hit) statu = hit.toUpperCase();

	  // Açılış Türü: tür kelimeleri
	  const lineU = row.map(v => String(v ?? '').toUpperCase()).join(' ');
	  const typeWords = ['CEZA','HUKUK','KOVUŞTURMA','KOVUSTURMA','İCRA','ICRA','İSTİNAF','ISTINAF','İNFAZ','INFAZ','DAVA'];
	  const tHit = typeWords.find(w => lineU.includes(w));
	  if (tHit) acilisTuru = tHit[0] + tHit.slice(1).toLowerCase();

	  return { kararNo, statu, acilisTuru };
  }


  // =========================
  // Alert (window.showAlert target, opts)
  // =========================
  function showExcelAlert(message, type = 'info') {
    const host = document.querySelector('#excelUploadMount');
    let hook = document.querySelector('#excelAlertHook');
    if (host && !hook) {
      hook = document.createElement('div');
      hook.id = 'excelAlertHook';
      host.parentNode.insertBefore(hook, host); // excelUploadMount'un üstü
    }
    const target = hook || document.body;

    if (typeof window.showAlert === 'function') {
      window.showAlert(target, {
        type,
        title: '',
        message,
        icon: 'info',
        dismissible: true
      });
      return;
    }
    // yedek
    if (window.toast) window.toast({ type, title: 'Bilgi', body: message });
    else alert(message);
  }

  function renderMissingUdfAlert() {
	  // Eşleşemeyen yoksa alert temizle
	  const old = document.querySelector('#combinedMissingAlertWrap');
	  if (old) old.remove();

	  if (!COMB.unmatchedList.length || !COMB.unmatchedYears.length) return;

	  // combinedSummaryCard'ın üstüne bir hook
	  const card = document.querySelector('#combinedSummaryCard');
	  if (!card || !card.parentNode) return;

	  const hook = document.createElement('div');
	  hook.id = 'combinedMissingAlertWrap';
	  card.parentNode.insertBefore(hook, card);

	  // Mesaj
	  const yearsText = COMB.unmatchedYears.join(', ');
	  const count = COMB.unmatchedList.length;
	  const msg = `${yearsText} yıllarına (esas) ait UDF dosyalarınız eksik, bu nedenle ${fmtInt(count)} adet dosya yorumlanamadı, dosya numaralarını görmek için tıklayınız`;

	  // Sizin app.js imzanızla Alert
	  if (typeof window.showAlert === 'function') {
      const wrap = window.showAlert(hook, {
		  type: 'warning',
		  title: '',
		  message: msg,
		  icon: 'warning',
		  dismissible: true
      });

      // Tıklayınca listeyi aç/kapat
      wrap.style.cursor = 'pointer';
      wrap.addEventListener('click', () => {
		  let list = document.querySelector('#combinedMissingEsasList');
		  if (list) { list.remove(); return; }
		  list = document.createElement('div');
		  list.id = 'combinedMissingEsasList';
		  list.className = 'card';
		  list.style.margin = '8px 0 16px 0';
		  list.innerHTML = `
			<div class="card-head"><strong>Eşleşemeyen Esas Noları (${fmtInt(count)})</strong></div>
			<div class="card-body" style="max-height:260px;overflow:auto">
			  <div class="mono" style="font-size:12px;line-height:1.6">${COMB.unmatchedList.map(r => escapeHtml(r.esasNo)).join(', ')}</div>
			</div>
		  `;
		  hook.appendChild(list);
      });
	  }
  }


  // =========================
  // Drop area bağlayıcı
  // =========================
  function bindDropArea(dropSel, inputSel, onFiles) {
    const drop = $(dropSel);
    const input = $(inputSel);
    if (!drop || !input) return;

    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer?.files || []).filter(Boolean);
      if (files.length) onFiles(files);
    });
    input.addEventListener('change', () => {
      const files = Array.from(input.files || []).filter(Boolean);
      if (files.length) onFiles(files);
    });
  }

  // =========================
  // UDF okuma (UDFKit -> JSZip -> düz XML)
  // =========================
  async function readUDFFile(file) {
    // 1) varsa UDFKit
    if (window.UDFKit?.readFile) return await window.UDFKit.readFile(file);
    if (window.UDF?.readFile) return await window.UDF.readFile(file);

    // 2) ZIP mi?
    const ab = await file.arrayBuffer();
    const sig = new Uint8Array(ab, 0, 2);
    const isZip = sig[0] === 0x50 && sig[1] === 0x4B; // 'PK'
    if (!isZip) {
      const xml = new TextDecoder('utf-8').decode(ab);
      return parseUDFXML(xml);
    }

    // 3) JSZip ile aç
    if (typeof JSZip === 'undefined') throw new Error('ZIP’li UDF algılandı fakat JSZip yüklü değil.');
    const zip = await JSZip.loadAsync(ab);
    const entry = zip.file('content.xml');
    if (!entry) throw new Error('UDF içinde content.xml bulunamadı.');
    const xml = await entry.async('string');
    return parseUDFXML(xml);
  }

  function parseUDFXML(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('UDF XML parse hatası.');

    const contentNode = Array.from(doc.documentElement.children).find(n => n.tagName === 'content');
    const mainContent = contentNode?.textContent ?? '';
    const tables = Array.from(doc.querySelectorAll('table'));
    const outTables = [];

    for (const t of tables) {
      const rows = [];
      for (const r of Array.from(t.querySelectorAll(':scope > row'))) {
        const cells = [];
        for (const c of Array.from(r.querySelectorAll(':scope > cell'))) {
          const inner = c.querySelector('content');
          if (inner) {
            const so = Number(inner.getAttribute('startOffset') || '0');
            const ln = Number(inner.getAttribute('length') || '0');
            cells.push(mainContent.slice(so, so + ln).trim());
          } else cells.push('');
        }
        rows.push(cells);
      }
      outTables.push({ name: t.getAttribute('name') || 'Tablo', rows });
    }
    return { tables: outTables, meta: { xmlLength: xml.length } };
  }

  // =========================
  // Başlık alias’ları + güvenli find
  // =========================
  const HEADER_ALIASES = {
	  // Excel tarafı: "Dosya No" = Esas No
	  ESAS: ['DOSYA NO','DOSYANO','DOSYA','ESAS NO','ESASNO','ESAS','DOSYA NUMARASI','DOSYA NUM'],

	  // UDF tarafı (genişletilmiş)
	  KARAR: [
      'KARAR NO','KARAR NO.','KARARNO','KARAR NUMARASI','KARAR NUM','KARAR SAYISI','KARAR SAYI','KARAR'
	  ],
	  STATU: [
      'STATÜ','STATU','DURUM','DURUM/STATÜ','DOSYA STATÜSÜ','STATÜSÜ','KARAR DURUMU','SON DURUM','STATÜ/DURUM'
	  ],
	  ACILIS_TURU: [
      'DOSYA AÇILIŞ TÜRÜ','DOSYA AÇILIŞ TURU','AÇILIŞ TÜRÜ','ACILIS TURU','AÇILIŞ','DOSYA TÜRÜ'
	  ],

	  // Kontrol amaçlı
	  SNO: ['S.NO','SNO','SIRA','SIRA NO','SIRA NO.'],
	  DOSYA_TURU: ['DOSYA TÜRÜ','DOSYA TURU','TÜR','TUR']
  };


  function findColIdx(headerRow, wantedList) {
    if (!Array.isArray(headerRow) || !Array.isArray(wantedList) || !wantedList.length) return -1;
    const H = headerRow.map(h => { try { return String(h ?? '').trim().toUpperCase(); } catch { return ''; } });
    const W = wantedList.map(w => { try { return String(w ?? '').trim().toUpperCase(); } catch { return ''; } }).filter(Boolean);

    // Tam eşleşme
    for (const w of W) {
      const j = H.indexOf(w);
      if (j >= 0) return j;
    }
    // includes ile gevşek eşleşme
    for (let i = 0; i < H.length; i++) {
      const cell = H[i] ?? '';
      for (const w of W) {
        if (w && cell.includes(w)) return i;
      }
    }
    return -1;
  }

  // =========================
  // Excel başlık dedektörü
  // =========================
  function detectHeaderRowAndCols(rows) {
    const maxScan = Math.min(rows.length, 50);
    let headerIdx = -1;
    let colSno = -1, colDosyaNo = -1, colDosyaTuru = -1;

    for (let i = 0; i < maxScan; i++) {
      const r = rows[i] || [];
      if (!r.length) continue;

      const idxDosyaNo = findColIdx(r, HEADER_ALIASES.ESAS);
      const idxSno = findColIdx(r, HEADER_ALIASES.SNO);
      const idxDosyaTuru = findColIdx(r, HEADER_ALIASES.DOSYA_TURU);

      if (idxDosyaNo >= 0 && (idxSno >= 0 || idxDosyaTuru >= 0)) {
        headerIdx = i;
        colSno = idxSno;
        colDosyaNo = idxDosyaNo;
        colDosyaTuru = idxDosyaTuru;
        break;
      }
    }

    // Bulunamazsa heuristik: B,C,F dolu + C "YYYY/NNN"
    if (headerIdx < 0) {
      const yearSlash = /^\d{4}\s*\/\s*\d+$/;
      for (let i = 0; i < maxScan; i++) {
        const r = rows[i] || [];
        if (r.length < 6) continue;
        const b = (r[1] ?? '').toString().trim();
        const c = (r[2] ?? '').toString().trim();
        const f = (r[5] ?? '').toString().trim();
        if (b && c && f && yearSlash.test(c)) {
          headerIdx = Math.max(0, i - 1);
          colSno = 1; colDosyaNo = 2; colDosyaTuru = 5;
          break;
        }
      }
    }
    return { headerIdx, colSno, colDosyaNo, colDosyaTuru };
  }

  function sliceTableFrom(rows, headerIdx) {
    if (headerIdx < 0) return rows;
    return rows.slice(headerIdx);
  }

  // =========================
  // Global durum
  // =========================
  let udfIndex = new Map();   // Esas -> {kararNo, statu, acilisTuru}
  let mergedCombined = [];    // [{ esasNo, kararNo, statu, acilisTuru, dosyaTuru? }]
  // === Birleşik tablo durumları ===
  const COMB = {
	  all: [],          // tüm birleşmiş kayıtlar (mükerrersiz)
	  filtered: [],     // filtre/pager sonrası görünen
	  unmatchedList: [],// UDF eşleşemeyen (kararNo, statu, acilisTuru boş)
	  unmatchedYears: [],// eşleşemeyenlerin esas yıl seti
	  showUnmatched: false, // varsayılan: gizle
	  q: '',            // arama
	  status: '__ALL__',// statü filtresi
	  oneri: '__ALL__', // öneri filtresi (şimdilik boş)
	  page: 1,
	  pageSize: 20
  };

  // yıl çıkar (Esas No → YYYY)
  const yearFromEsas = esas => {
	  const m = String(esas || '').match(/^(\d{4})/);
	  return m ? m[1] : '';
  };

  // UDF eşleşmesi olmayan kayıt mı? (üçü de boş)
  const isUnmatched = r => !(r.kararNo || r.statu || r.acilisTuru);

  // Benzersiz/temiz liste
  const uniq = arr => Array.from(new Set(arr));


  // =========================
  // UDF akışı
  // =========================
  async function onUdfFilesPicked(files) {
	  const hint = $('#udfChosen');
	  if (hint) hint.innerHTML = files.map(f => `• ${escapeHtml(f.name)}`).join(' ');

	  udfIndex = new Map();
	  let totalRows = 0, tableCount = 0;

	  for (const f of files) {
      try {
		  const doc = await readUDFFile(f);
		  const tables = Array.isArray(doc?.tables) ? doc.tables : [];
		  tableCount += tables.length;

		  for (const t of tables) {
          const tRows = Array.isArray(t?.rows) ? t.rows : [];
          if (!tRows.length) continue;

          const header = tRows[0] || [];
          const iEsas  = findColIdx(header, HEADER_ALIASES.ESAS);
          const iKarar = findColIdx(header, HEADER_ALIASES.KARAR);
          const iStatu = findColIdx(header, HEADER_ALIASES.STATU);
          const iAcil  = findColIdx(header, HEADER_ALIASES.ACILIS_TURU);

          for (let r = 1; r < tRows.length; r++) {
			  const row = tRows[r] || [];

			  // ===== Esas No (zorunlu) =====
			  let esas = (iEsas >= 0) ? norm(row[iEsas]) : '';
			  if (!esas) esas = norm(getFirstEsasFromRow(row));
			  if (!esas) continue; // Esas yoksa kaydı at

			  // ===== Karar/Statü/Açılış (başlık veya heuristik) =====
			  let kararNo   = (iKarar >= 0) ? String(row[iKarar] ?? '').trim() : '';
			  let statu     = (iStatu >= 0) ? String(row[iStatu] ?? '').trim() : '';
			  let acilisTur = (iAcil  >= 0) ? String(row[iAcil]  ?? '').trim() : '';

			  if (!kararNo || !statu || !acilisTur) {
              const guessed = extractUdfHeuristics(row, esas);
              if (!kararNo)   kararNo   = guessed.kararNo;
              if (!statu)     statu     = guessed.statu;
              if (!acilisTur) acilisTur = guessed.acilisTuru;
			  }

			  udfIndex.set(esas, {
              kararNo: kararNo,
              statu: statu,
              acilisTuru: acilisTur
			  });
          }

          totalRows += Math.max(0, tRows.length - 1);
		  }

		  window.toast?.({ type:'success', title:'UDF okundu', body:`${escapeHtml(f.name)} işlendi` });
      } catch (e) {
		  console.error(e);
		  window.toast?.({ type:'danger', title:'UDF okunamadı', body:`${escapeHtml(f.name)} — ${e.message || e}` });
      }
	  }

	  // Excel kartını hazırla + alert + bilgilendirme kartını gizle
	  ensureExcelCard();

	  window.toast?.({
      type:'success',
      title:'İşlem tamam',
      body:`UDF’den ${fmtInt(tableCount)} tablo, toplam ${fmtInt(totalRows)} satır endekslendi.`
	  });
  }


  // =========================
  // Excel okuma + birleştirme
  // =========================
  async function parseExcelFile(file) {
    if (!(window.XLSX && XLSX.read)) throw new Error('XLS(X) kütüphanesi yüklenmemiş.');
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type:'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:false });
    return { sheet: sheetName, rows };
  }

  // Excel dosyalarını okuyup UDF ile birleştirir, COMB durumunu kurar ve UI'yı yeniler
  async function onExcelFilesPicked(files) {
	  const hint = $('#excelChosen');
	  if (hint) hint.innerHTML = files.map(f => `• ${escapeHtml(f.name)}`).join('<br>');

	  const allRows = [];
	  let totalFiles = 0, totalRows = 0;

	  // 1) Tüm Excel dosyalarını oku
	  for (const f of files) {
      try {
		  const doc = await parseExcelFile(f);
		  const rows = Array.isArray(doc.rows) ? doc.rows : [];
		  if (rows.length) {
          if (allRows.length === 0) allRows.push(...rows);
          else allRows.push(...rows.slice(1));
		  }
		  totalFiles++;
		  totalRows += rows.length;
		  window.toast?.({ type:'success', title:'Excel okundu', body:`${escapeHtml(f.name)} — ${fmtInt(rows.length)} satır` });
      } catch (e) {
		  console.error(e);
		  window.toast?.({ type:'danger', title:'Excel okunamadı', body:`${escapeHtml(f.name)} — ${e.message || e}` });
      }
	  }

	  // 2) Satır var mı?
	  if (!allRows.length) {
      window.toast?.({ type:'warning', title:'Excel boş', body:'Herhangi bir satır bulunamadı.' });
      return;
	  }

	  // 3) Baştaki tamamen boş satırları buda
	  while (
      allRows.length &&
		Array.isArray(allRows[0]) &&
		allRows[0].every(v => (v == null || String(v).trim() === ''))
	  ) {
      allRows.shift();
	  }

	  // 4) Başlık tespiti
	  const { headerIdx, colDosyaNo } = detectHeaderRowAndCols(allRows);
	  if (headerIdx < 0 || colDosyaNo < 0) {
      window.toast?.({ type:'danger', title:'Başlık bulunamadı', body:"Excel’de 'Dosya No' (Esas No) kolonunu tespit edemedik." });
      return;
	  }

	  // 5) Tabloyu başlıktan itibaren kes
	  const table = sliceTableFrom(allRows, headerIdx);
	  const idxEsasExcel = colDosyaNo;

	  // 6) Esas No bazında mükerrersiz birleştir (UDF eşleşmeleriyle)
	  const combinedMap = new Map();

	  for (let i = 1; i < table.length; i++) {
      const row = table[i] || [];
      const esas = norm(row[idxEsasExcel]);
      if (!esas) continue;

      const udf = udfIndex.get(esas) || { kararNo: '', statu: '' };

      const baseRec = {
		  esasNo: esas,
		  kararNo: udf.kararNo,
		  statu: udf.statu
      };

      const { oneri, oneriHtml } = computeOneriForRecord(baseRec);

      if (!combinedMap.has(esas)) {
		  combinedMap.set(esas, {
          ...baseRec,
          oneri,
          oneriHtml
		  });
      }
	  }

	  // 7) COMB durumu
	  mergedCombined = Array.from(combinedMap.values());
	  COMB.all = mergedCombined.map(r => ({ ...r }));
	  COMB.unmatchedList = COMB.all.filter(r => !(r.kararNo || r.statu));
	  COMB.unmatchedYears = uniq(COMB.unmatchedList
      .map(r => (String(r.esasNo || '').match(/^(\d{4})/) || [,''])[1])
      .filter(Boolean));
	  COMB.showUnmatched = false;
	  COMB.q = '';
	  COMB.status = '__ALL__';
	  COMB.oneri = '__ALL__';
	  COMB.page = 1;
	  COMB.pageSize = 15;

	  // 8) Eşleşmeyen varsa uyarı alert’i göster
	  renderMissingUdfAlert();

	  // 9) Listeyi çiz (filtre+pager içeride)
	  renderCombinedSummary();

	  // 10) Bildirim
	  window.toast?.({
      type:'success',
      title:'Birleştirildi',
      body:`Excel: ${fmtInt(totalFiles)} dosya, ${fmtInt(totalRows)} satır • Birleşik benzersiz kayıt: ${fmtInt(COMB.all.length)}`
	  });

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

  }


  // =========================
  // Birleşik özet tablo
  // =========================
  function renderCombinedSummary() {
	  const card = document.querySelector('#combinedSummaryCard');
	  if (!card) return;
	  card.style.display = '';
	  card.style.marginTop = '0';

	  let toolbar = document.querySelector('#combinedToolbar');
	  if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'combinedToolbar';
      toolbar.className = 'toolbar';
      toolbar.style.display = 'flex';
      toolbar.style.flexWrap = 'wrap';
      toolbar.style.gap = '8px';
      toolbar.style.margin = '0 0 8px 0';
      toolbar.innerHTML = `
		  <input id="combSearch" class="input" type="search" placeholder="Ara (Esas/Karar/Statü)" style="min-width:260px">
		  <select id="combStatus" class="input"></select>
		  <select id="combOneri" class="input"></select>
		  <button id="combToggleUnmatched" class="btn btn-ghost"></button>
		  <button id="combReset" class="btn">Tümünü Göster</button>
		  <button id="combExportXls" class="btn">
			<span class="material-symbols-rounded" style="vertical-align:middle;margin-right:6px">download</span>
			Tümünü XLS Kaydet
		  </button>
		`;
      const wrap = document.querySelector('#combinedTableWrap');
      wrap?.parentNode?.insertBefore(toolbar, wrap);
	  }

	  const statusList = ['__ALL__', ...uniq(COMB.all.map(r => String(r.statu || '').trim()).filter(Boolean)).sort()];
	  const oneriList  = ['__ALL__', ...uniq(COMB.all.map(r => String(r.oneri || '').trim()).filter(Boolean)).sort()];

	  const stSel = document.querySelector('#combStatus');
	  const onSel = document.querySelector('#combOneri');
	  document.querySelector('#combExportXls').onclick = () => exportCombinedToXLS();
	  stSel.innerHTML = statusList.map(v => `<option value="${escapeHtml(v)}">${v === '__ALL__' ? 'Statü: Tümü' : escapeHtml(v)}</option>`).join('');
	  onSel.innerHTML = oneriList.map(v => `<option value="${escapeHtml(v)}">${v === '__ALL__' ? 'Öneri: Tümü' : escapeHtml(v)}</option>`).join('');
	  stSel.value = COMB.status;
	  onSel.value = COMB.oneri;

	  const tgBtn = document.querySelector('#combToggleUnmatched');
	  tgBtn.textContent = COMB.showUnmatched ? 'Eşleşmeyenleri Gösteriliyor' : 'Eşleşmeyenleri Gizle';
	  tgBtn.className = COMB.showUnmatched ? 'btn' : 'btn btn-ghost';

	  const qEl = document.querySelector('#combSearch');
	  qEl.value = COMB.q;

	  // 👉 TEK NOKTADAN YENİDEN ÇİZİM
	  const refresh = () => {
      applyCombinedFilters();
      renderCombinedTable();
      renderCombinedPager();
      const stats = document.querySelector('#combinedStats');
      if (stats) stats.innerHTML = `<span class=\"badge\">${fmtInt(COMB.filtered.length)} / ${fmtInt(COMB.all.length)} kayıt</span>`;
	  };

	  // Eventler
	  qEl.oninput = () => { COMB.q = qEl.value.trim(); COMB.page = 1; refresh(); };
	  stSel.onchange = () => { COMB.status = stSel.value; COMB.page = 1; refresh(); };
	  onSel.onchange = () => { COMB.oneri  = onSel.value;  COMB.page = 1; refresh(); };
	  tgBtn.onclick = () => { COMB.showUnmatched = !COMB.showUnmatched; COMB.page = 1; refresh(); };
	  document.querySelector('#combReset').onclick = () => {
      COMB.q = ''; COMB.status = '__ALL__'; COMB.oneri = '__ALL__'; COMB.page = 1; COMB.showUnmatched = false;
      refresh();
	  };

	  // İlk çizim
    refresh();
    // UDF okunduysa sağdaki bilgi kartını gizle
    if (COMB.all.length > 0){
      const infoCard = document.querySelector('#col2 > section.card:first-of-type');
      infoCard && (infoCard.style.display = 'none');
    }
  }


  // Filtreleri uygula
  function applyCombinedFilters() {
	  const q = COMB.q.toLowerCase();
	  const wantStatus = COMB.status !== '__ALL__';
	  const wantOneri  = COMB.oneri  !== '__ALL__';

	  // Varsayılan: eşleşemeyenler gizli
	  // Boş öneri içeren kayıtları tamamen gizle
	  let arr = COMB.all.filter(r => (r.oneri || r.oneriHtml || '').trim() !== '').filter(r => COMB.showUnmatched || !isUnmatched(r));

	  if (q) {
      arr = arr.filter(r => {
		  const blob = `${r.esasNo} ${r.kararNo || ''} ${r.statu || ''} ${r.acilisTuru || ''}`.toLowerCase();
		  return blob.includes(q);
      });
	  }
	  if (wantStatus) arr = arr.filter(r => String(r.statu || '') === COMB.status);
	  if (wantOneri)  arr = arr.filter(r => String(r.oneri || '') === COMB.oneri);

	  COMB.filtered = arr;
  }

  // Tabloyu çiz (Öneri sütunu eklendi)
  function renderCombinedTable() {
	  const wrap = document.querySelector('#combinedTableWrap');
	  if (!wrap) return;

	  const start = (COMB.page - 1) * COMB.pageSize;
	  const pageRows = COMB.filtered.slice(start, start + COMB.pageSize);

	  const html = `
		<table class="table report-table">
		  <thead>
			<tr>
			  <th>#</th>
			  <th>Esas No</th>
			  <th>Karar No (UDF)</th>
			  <th>Statü (UDF)</th>
			  <th>Öneri</th>
			</tr>
		  </thead>
		  <tbody>
			${pageRows.map((r,i) => `
			  <tr>
				<td class="num">${start + i + 1}</td>
				<td>${escapeHtml(r.esasNo)}</td>
				<td>${escapeHtml(r.kararNo || '-')}</td>
				<td>${escapeHtml(r.statu || '-')}</td>
				<td>${r.oneriHtml || ''}</td>
			  </tr>
			`).join('')}
		  </tbody>
		</table>
	  `;
	  wrap.innerHTML = html;
  }


  // 20'li pager
  function renderCombinedPager() {
	  const wrap = document.querySelector('#combinedTableWrap');
	  if (!wrap) return;

	  // Eski pager'ı kaldır
	  let pg = document.querySelector('#combinedPager');
	  if (pg) pg.remove();

	  const total = COMB.filtered.length;
	  const pages = Math.max(1, Math.ceil(total / COMB.pageSize));
	  if (COMB.page > pages) COMB.page = pages;

	  pg = document.createElement('div');
	  pg.id = 'combinedPager';
	  pg.className = 'pager';
	  pg.style.display = 'flex';
	  pg.style.justifyContent = 'space-between';
	  pg.style.alignItems = 'center';
	  pg.style.margin = '8px 0 0 0';

	  pg.innerHTML = `
		<div class="muted">Toplam: ${fmtInt(total)} kayıt • Sayfa ${COMB.page}/${pages}</div>
		<div class="pager-buttons" style="display:flex; gap:6px">
		  <button id="pgFirst" class="btn btn-ghost" ${COMB.page === 1 ? 'disabled' : ''}>« İlk</button>
		  <button id="pgPrev"  class="btn btn-ghost" ${COMB.page === 1 ? 'disabled' : ''}>‹ Önceki</button>
		  <button id="pgNext"  class="btn btn-ghost" ${COMB.page === pages ? 'disabled' : ''}>Sonraki ›</button>
		  <button id="pgLast"  class="btn btn-ghost" ${COMB.page === pages ? 'disabled' : ''}>Son »</button>
		</div>
	  `;
	  wrap.parentNode.appendChild(pg);

	  // Eventler
	  const goto = p => { COMB.page = p; renderCombinedTable(); renderCombinedPager(); };
	  document.querySelector('#pgFirst').onclick = () => goto(1);
	  document.querySelector('#pgPrev').onclick  = () => goto(Math.max(1, COMB.page - 1));
	  document.querySelector('#pgNext').onclick  = () => goto(Math.min(pages, COMB.page + 1));
	  document.querySelector('#pgLast').onclick  = () => goto(pages);
  }


  // =========================
  // Excel kartını dinamik oluştur
  // =========================
  function ensureExcelCard() {
    if ($('#excelUploadCard')) {
      // UDF tekrar yüklense bile uyarıyı yine göster
      showExcelAlert("UYAP'tan Harç Tahsil Müzekkeresi yazılmayanlar raporunu EXCEL formatında alıp buradan yükleyiniz", 'info');
      const info = $('#udfInfoCard'); if (info) info.style.display = 'none';
      return;
    }

    const host = $('#excelUploadMount');
    if (!host) return;

    // Bilgilendir + info kartını gizle
    showExcelAlert("UYAP'tan Harç Tahsil Müzekkeresi yazılmayanlar raporunu EXCEL formatında alıp buradan yükleyiniz", 'info');
    const info = $('#udfInfoCard'); if (info) info.style.display = 'none';

    const wrap = document.createElement('section');
    wrap.className = 'card card-upload';
    wrap.id = 'excelUploadCard';
    wrap.innerHTML = `
      <div class="card-head">
        <span class="material-symbols-rounded">description</span>
        <strong>EXCEL Yükleme</strong>
      </div>
      <div class="card-body" style="display:block">
        <div id="excelDrop" class="placeholder" style="text-align:center;padding:18px;cursor:pointer">
          <span class="material-symbols-rounded">drive_folder_upload</span>
          <div>Excel dosyalarını buraya sürükleyip bırakın</div>
          <small class="muted">veya tıklayıp seçin</small>
        </div>
        <input id="excelInput" type="file" accept=".xls,.xlsx" multiple hidden>
        <div id="excelPickRow" style="margin-top:10px;text-align:right">
          <label class="btn" for="excelInput">
            <span class="material-symbols-rounded">folder_open</span> Dosya Seç
          </label>
        </div>
        <div id="excelChosen" class="muted" style="margin-top:8px"></div>
      </div>
    `;
    host.appendChild(wrap);
    bindDropArea('#excelDrop', '#excelInput', onExcelFilesPicked);
  }

  // =========================
  // Init
  // =========================
  function init() {
    // Yalnız UDF drop bağla; Excel kartı UDF sonrası oluşacak
    bindDropArea('#udfDrop', '#udfInput', async (files) => {
      await onUdfFilesPicked(files);
      window.toast?.({ type:'success', title:'UDF tamam', body:'UDF dosyaları işlendi. Excel yüklemeye geçebilirsiniz.' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
