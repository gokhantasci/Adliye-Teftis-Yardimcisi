(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);

  // ---- DOM elemanları
  const dropZone = $('#dropZone');
  const fileInput = $('#fileInput');
  const hintEl = $('#selectedFilesHint');
  const statsBody = $('#cardUstSol .panel-body'); // KPI & karar türleri (üst sağ)

  // ---- Sabitler
  const REQUIRED_SHEET = 'czmIstinafDefteriRaporu';
  const pageSize = 20;

  // ---- Durum
  let ozetData = [];
  let currentPage = 1;

  // ---- Yardımcılar
  const escapeHtml = s => String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [m]));
  const normalize = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  const letterToIndex = L => {
    L = String(L).toUpperCase().trim();
    let n = 0;
    for (let i = 0; i < L.length; i++) n = n * 26 + (L.charCodeAt(i) - 64);
    return n - 1;
  };

  function iconFor(type) {
    return type === 'success' ? 'check_circle' : type === 'warning' ? 'warning' : type === 'danger' ? 'error' : 'info';
  }

  function toastWithIcon(type, title, msg, delay = 5000) {
    const bodyHtml = `<div style="display:flex;align-items:flex-start;gap:.5rem;">
      <span class="material-symbols-rounded" style="font-size:22px;">${iconFor(type)}</span>
      <div>${msg}</div></div>`;
    window.toast({
      type,
      title,
      body: bodyHtml,
      delay
    });
  }

  function isExcelFile(f) {
    if (!f || !f.name) return false;
    const n = f.name.toLowerCase();
    return n.endsWith('.xls') || n.endsWith('.xlsx');
  }

  function isRedOrRet(netice){
	  return /^\s*re[dt]\s*-\s*/i.test(String(netice || ''));
  }

  function extractReasonFromNetice(netice){
	  const m = String(netice || '').match(/^\s*re[dt]\s*-\s*(.+)$/i);
	  return m ? m[1].trim() : '';
  }

  function renderKesinKararTablo(items){
	  // Filtre: "Red - …" veya "Ret - …"
	  const rows = (items || []).filter(it => isRedOrRet(it.netice));

	  // Kart konumu: KPI grid’in hemen altı (Alt Sol kartının body’si)
	  const hostCard = document.querySelector('#cardAltSol .card-body');
	  if (!hostCard) return;

	  // Eski kartı sil, temiz kur
	  let card = document.getElementById('kesinKararCard');
	  if (card) card.remove();

	  card = document.createElement('section');
	  card.className = 'panel';
	  card.id = 'kesinKararCard';
	  card.style.marginTop = '0.5rem'; // 🔹 üstten boşluk

	  const labelText = '1-  Karar kesin olmasına veya öngörülen süre dolmasına rağmen kanun yolu merciine (Yargıtay veya Bölge Adliye Mahkemesi) gönderilen dosyalar';

	  card.innerHTML = `
	  <div class="panel-head" style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;">
		<h3 style="margin:0;">1-  Karar kesin olmasına veya öngörülen süre dolmasına rağmen kanun yolu merciine (Yargıtay veya Bölge Adliye Mahkemesi) gönderilen dosyalar</h3>
		<div class="title-actions">
		  <button id="btnCopyKesin" class="btn btn--sm" type="button">Kopyala</button>
		</div>
	  </div>
	  <div class="panel-body">
		<table class="table" id="kesinKararTable" style="width:100%;border-collapse:collapse">
		  <thead>
			<tr>
			  <th>SIRA</th>
			  <th>ESAS NO</th>
			  <th>KARAR NO</th>
			  <th>KARARIN KESİN OLMA SEBEBİ AÇIKLAMA</th>
			</tr>
		  </thead>
		  <tbody></tbody>
		</table>
		${rows.length ? '' : `<div class="muted">Uygun kayıt bulunamadı.</div>`}
	  </div>
	`;

	  // KPI grid'in hemen altına yerleştir; yoksa body'nin sonuna ekle
	  //const kpiGrid = hostCard.querySelector(".kpi-grid");
	  //if (kpiGrid) kpiGrid.insertAdjacentElement("afterend", card);
	  //else hostCard.appendChild(card);
	  const gokhan = document.getElementById('gokhan');
	  gokhan.insertAdjacentElement('afterend', card);

	  if (!rows.length) return;

	  const tbody = card.querySelector('#kesinKararTable tbody');
	  tbody.innerHTML = rows.map((it, idx) => {
      const reason = extractReasonFromNetice(it.netice) || it.netice || '';
      return `
		  <tr>
			<td class="num">${idx + 1}</td>
			<td>${(it.esasNo || '')}</td>
			<td>${(it.kararNo || '')}</td>
			<td>${reason}</td>
		  </tr>`;
	  }).join('');
	  const btnCopyKesin = card.querySelector('#btnCopyKesin');
    if (btnCopyKesin){
		  btnCopyKesin.addEventListener('click', () => copyTableBodyToClipboard('kesinKararTable'));
    }
  }


  const isEsasOrKararNo = v => /^\s*\d{4}\/\d{1,6}\s*$/.test(String(v || ''));
  const isDateLike = v => {
    const s = String(v || '').trim();
    return /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.test(s) || /^\d{4}-\d{2}-\d{2}$/.test(s);
  };

  function toDate(v) {
    if (!v) return null;
    if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(+v) ? null : v;
    const s = String(v).trim();
    let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) {
      const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
      return isNaN(+d) ? null : d;
    }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
      return isNaN(+d) ? null : d;
    }
    return null;
  }

  function extractDosyaNoFromD(text) {
    const m = String(text || '').match(/(\d{4}\/\d{1,6})/);
    return m ? m[1] : '';
  }

  async function copyTableBodyToClipboard(tableId){
	  const tbl = document.getElementById(tableId);
	  if (!tbl){ window.toast?.({type:'warning', title:'Bulunamadı', body:'Tablo bulunamadı.'}); return; }

	  const tbody = tbl.tBodies && tbl.tBodies[0];
	  if (!tbody){ window.toast?.({type:'warning', title:'Boş', body:'Kopyalanacak satır yok.'}); return; }

	  // tbody satırlarını TSV olarak hazırla
	  const lines = [];
	  for (const tr of Array.from(tbody.rows)){
      const cols = Array.from(tr.cells).map(td => String(td.textContent || '').trim());
      lines.push(cols.join('\t'));
	  }
	  const text = lines.join('\n');
	  if (!text){
      window.toast?.({type:'warning', title:'Boş', body:'Kopyalanacak satır yok.'});
      return;
	  }

	  try {
      if (navigator.clipboard && navigator.clipboard.writeText){
		  await navigator.clipboard.writeText(text);
      } else {
		  // Eski tarayıcı için fallback
		  const ta = document.createElement('textarea');
		  ta.value = text;
		  ta.style.position = 'fixed';
		  ta.style.left = '-9999px';
		  document.body.appendChild(ta);
		  ta.select();
		  document.execCommand('copy');
		  ta.remove();
      }
      window.toast?.({type:'success', title:'Kopyalandı', body:'Kopyalama işlemi başarılı.'});
	  } catch (e){
      window.toast?.({type:'danger', title:'Hata', body:'Panoya kopyalanamadı.'});
	  }
  }


  function renderNotSentTablo(items){
	  // KPI "Henüz Gönderilmemiş" ile aynı küme: classifyItem(...) => bucket === "not_sent"
	  const notSentRows = (items || []).filter(it => {
      // net kontrol: mevcut classifyItem ile uyuşsun
      const c = classifyItem({ oRaw: it.oRaw, netice: it.netice });
      return c && c.bucket === 'not_sent';
	  });

	  // Hedef: kesinKararCard'ın hemen altı; yoksa Alt Sol kart body
	  const hostBody = document.querySelector('#cardAltSol .card-body');
	  if (!hostBody) return;

	  // Eski kart varsa temizle
	  let card = document.getElementById('notSentCard');
	  if (card) card.remove();

	  // Yeni kart
	  card = document.createElement('section');
	  card.className = 'panel';
	  card.id = 'notSentCard';
	  card.style.marginTop = '1rem'; // KPI/üst karttan nefes payı

	  const label = '2- Kanun yolu merciine (Yargıtay veya Bölge Adliye Mahkemesi) henüz gönderilmeyen dosyalar;';

	  card.innerHTML = `
	  <div class="panel-head" style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;">
		<h3 style="margin:0;">2- Kanun yolu merciine (Yargıtay veya Bölge Adliye Mahkemesi) henüz gönderilmeyen dosyalar;</h3>
		<div class="title-actions">
		  <button id="btnCopyNotSent" class="btn btn--sm" type="button">Kopyala</button>
		</div>
	  </div>
	  <div class="panel-body">
		<table class="table" id="notSentTable" style="width:100%;border-collapse:collapse">
		  <thead>
			<tr>
			  <th>SIRA</th>
			  <th>ESAS NO</th>
			  <th>KARAR NO</th>
			  <th>KANUN YOLUNA BAŞVURMA TARİHİ</th>
			</tr>
		  </thead>
		  <tbody></tbody>
		</table>
		${notSentRows.length ? '' : `<div class="muted">Uygun kayıt bulunamadı.</div>`}
	  </div>
	`;

	  // kesinKararCard'ın hemen altına yerleştir
	  const kesin = document.getElementById('gokhan');
	  if (kesin) kesin.insertAdjacentElement('afterend', card);
	  else hostBody.appendChild(card);

	  if (!notSentRows.length) return;

	  const tbody = card.querySelector('#notSentTable tbody');
	  tbody.innerHTML = notSentRows.map((it, idx) => `
		<tr>
		  <td class="num">${idx + 1}</td>
		  <td>${escapeHtml(it.esasNo || '')}</td>
		  <td>${escapeHtml(it.kararNo || '')}</td>
		  <td>${escapeHtml(it.istinafDilekceTarihi || '')}</td>
		</tr>
	  `).join('');

	  const btnCopyNotSent = card.querySelector('#btnCopyNotSent');
    if (btnCopyNotSent){
		  btnCopyNotSent.addEventListener('click', () => copyTableBodyToClipboard('notSentTable'));
    }
  }


  // O sütununu okunabilir, standart netice cümlesine çevirir
  function deriveNeticeFromO(text) {
    const raw = String(text || '').trim();
    if (!raw) {return 'İstinaf Dilekçesi verilmiş, başvuru değerlendirilmemiş';}

    // 1) Tam "Kabul"
    if (/^\s*kabul\s*$/i.test(raw)) {return 'İstinaf Dilekçesi verilmiş, başvuru kabul edilmiş';}

    // 2) "Kabul - ... Ceza Dairesi'ne Gönderilmiştir." → incelemede
    if (/^\s*kabul\s*-\s*/i.test(raw) && /ceza\s*dairesi.*gönderilmiştir/i.test(raw)) {
      const m = raw.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+bölge\s+adliye\s+mahkemesi\s+(\d+)\.\s*ceza\s*dairesi/i);
      if (m) {
        const il = m[1].trim();
        const daire = m[2];
        return `${il} Bölge Adliye Mahkemesi ${daire}. Ceza Dairesinde incelemede`;
      }
      return 'Bölge Adliye Mahkemesinde incelemede';
    }

    // 3) Red - ... (sebep değişken olabilir) → olduğu gibi döndür
    if (/^\s*red\s*-\s*/i.test(raw)) {
      return raw.trim();
    }

    // 4) “<il> BAM <n>. Ceza Dairesi ... ile ... kararına bağlanmıştır.” → normalize et
    //    (tarih, esas, karar no gibi kısımlar aradaki “ile … kararına” dışında yok sayılır)
    const reNorm = /([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+bölge\s+adliye\s+mahkemesi\s+(\d+)\.\s*ceza\s*dairesi[\s\S]*?\bile\s+(.+?)\s+karar(?:ına|ina)\b[\s\S]*?bağlanmıştır\.?/i;
    const m2 = raw.match(reNorm);
    if (m2) {
      const il = m2[1].trim();
      const daire = m2[2];
      const kararMetni = m2[3].replace(/\s+/g, ' ').trim();
      return `${il} Bölge Adliye Mahkemesi ${daire}. Ceza Dairesi ${kararMetni} kararı vermiştir.`;
    }

    // 4.5) “<il> BAM <n>. Ceza Dairesi İstinaf Başvurusunun Reddi kararı vermiştir.” → Red - ...
    if (/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+bölge\s+adliye\s+mahkemesi\s*\d+\.\s*ceza\s*dairesi.*istinaf\s*başvurusunun\s*reddi\s*kararı\s*vermiştir/i.test(raw)) {
      return 'Red - İstinaf Başvurusunun Reddi';
    }

    // 5) Bilinen kısa kalıplar
    if (/hükmün\s*bozulması/i.test(raw)) {return 'Hükmün Bozulması kararı verilmiş';}

    if (/esastan\s*reddi/i.test(raw)) {return 'İstinaf Başvurusunun Esastan Reddine kararı verilmiş';}

    if (/düzelterek\s*onama/i.test(raw)) {return 'Düzelterek Onama kararı verilmiş';}

    if (/\bonama\b/i.test(raw)) {return 'Onama kararı verilmiş';}

    // 6) Varsayılan olarak metni olduğu gibi döndür
    return raw;
  }


  function parseDosyaNoKey(s) {
    const m = String(s || '').match(/(\d{4})\/(\d{1,6})/);
    return m ? [parseInt(m[1]), parseInt(m[2])] : [0, 0];
  }

  function renderRaporOzet(stats, fileCount, totalRows, emptyRows, duplicateRows) {
    const el = document.getElementById('raporOzetBody');
    if (!el) return;

    // 1. temel rakamlar
    const satirOkunan = totalRows ?? 0;
    const bosAtlanan = emptyRows ?? 0;
    const mukerrerAtlanan = duplicateRows ?? 0;
    const incelenen = satirOkunan - bosAtlanan - mukerrerAtlanan;
    const dosyaAdedi = fileCount ?? 1;

    // 2. En çok gönderilen daire
    let mostCourt = '-';
    if (stats.courtCount && Object.keys(stats.courtCount).length) {
      const sorted = Object.entries(stats.courtCount)
        .sort((a, b) => b[1] - a[1]);
      mostCourt = `${sorted[0][0]} (${sorted[0][1]} dosya)`;
    }

    // 3. En çok verilen karar türü
    let mostDecision = '-';
    if (stats.decisions && Object.keys(stats.decisions).length) {
      const sorted = Object.entries(stats.decisions)
        .sort((a, b) => b[1] - a[1]);
      mostDecision = `${sorted[0][0]} (${sorted[0][1]} karar)`;
    }

    // 4. Ek istatistik öneriler
    const total = stats.total || 0;
    const decided = stats.decided || 0;
    const pending = stats.pending_review || 0;
    const notSent = stats.not_sent || 0;
    const decidedRate = total ? ((decided / total) * 100).toFixed(1) : 0;
    const pendingRate = total ? ((pending / total) * 100).toFixed(1) : 0;

    // 5. Rapor özeti metni
    const html = `
		<ul class="report-summary">
		  <li><b>${dosyaAdedi}</b> XLS dosyasından toplam <b>${satirOkunan.toLocaleString('tr-TR')}</b> satır okundu.</li>
		  <li><b>${bosAtlanan.toLocaleString('tr-TR')}</b> satır boş olması nedeniyle, <b>${mukerrerAtlanan.toLocaleString('tr-TR')}</b> satır mükerrer olması nedeniyle atlandı.</li>
		  <li>İncelenen <b>${incelenen.toLocaleString('tr-TR')}</b> satırdan:</li>
		  <ul>
			<li>📂 En çok dosya <b>${mostCourt}</b>’ye gönderilmiş.</li>
			<li>⚖️ En çok <b>${mostDecision}</b> türünden karar verilmiş.</li>
			<li>📊 Karar verilen oran: <b>%${decidedRate}</b></li>
			<li>⏳ İncelemede olan oran: <b>%${pendingRate}</b></li>
			<li>📥 Henüz gönderilmemiş dosya sayısı: <b>${notSent.toLocaleString('tr-TR')}</b></li>
		  </ul>
		</ul>
	  `;

    el.innerHTML = html;
  }

  // Şehir + Daire ayıklama (gerekiyorsa üstte tanımlı olanı kullanın)
  function extractCourtFromO(oRaw) {
    const s = String(oRaw || '');
    const re = /([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+bölge\s+adliye\s+mahkemesi\s+(\d+)\.\s*ceza\s*dairesi/i;
    const m = s.match(re);
    if (!m) return null;
    const il = m[1].trim();
    const daireNo = m[2].trim();
    return `${il} Bölge Adliye Mahkemesi ${daireNo}. Ceza Dairesi`;
  }

  // Daire bazlı özet tablo + sıralama
  function renderDaireOzetTablo(items) {

    const counts = {}; // { court: { incelemede, esastanRed, bozma, kismen } }
    function normTR(s) {
      return String(s || '')
        .toLocaleLowerCase('tr')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // KISMEN: "Kısmen Hükmün Bozulması" / "Kısmen Esastan Ret" (öncelik!)
    function isKismen(neticeRaw, oRaw) {
      const t = normTR(neticeRaw || oRaw);
      return /kısmen.*hükmün.*bozulmas[ıi]/i.test(t) ||
                /kısmen.*esastan.*ret/i.test(t);
    }

    // İNCELEMEDE
    function isIncelemede(neticeRaw, oRaw) {
      const t = normTR(neticeRaw || oRaw);
      return /incelemede/i.test(t);
    }

    // ESASTAN RED (reddi/reddine/ret varyantları)
    function isEsastanRed(neticeRaw, oRaw) {
      const t = normTR(neticeRaw || oRaw);
      return /esastan\s*red(d[iı]|i)?/i.test(t) || /esastan.*ret/i.test(t);
    }

    // BOZMA: "Hükmün Bozulması ... kararı verilmiş/vermiştir/bağlanmıştır."
    // DİKKAT: Kısmen değilse!
    function isBozma(neticeRaw, oRaw) {
      const t = normTR(neticeRaw || oRaw);
      if (/kısmen/i.test(t)) return false; // kısmenler ayrı sütuna
      // çekirdek: "hükmün bozulması" + (kararı verilmiş|vermiştir|bağlanmıştır)
      const hasBozulma = /hükmün\s*bozulmas[ıi]/i.test(t);
      const hasKararCekimi = /(karar[ıi]\s*(veril(mi[şs]|miştir)|bağlanmıştır))/i.test(t) ||
                /karar[ıi]/i.test(t); // deriveNeticeFromO "kararı vermiştir" / "verilmiş" varyantı
      return hasBozulma && hasKararCekimi;
    }

    for (const it of (items || [])) {
      const court = extractCourtFromO(it.oRaw);
      if (!court) continue;

      const neticeRaw = String(deriveNeticeFromO(it.oRaw) || '');
      const oRaw = String(it.oRaw || '');

      if (!counts[court]) {
        counts[court] = {
          incelemede: 0,
          esastanRed: 0,
          bozma: 0,
          kismen: 0
        };
      }

      if (isKismen(neticeRaw, oRaw)) {
        counts[court].kismen++;
      } else if (isIncelemede(neticeRaw, oRaw)) {
        counts[court].incelemede++;
      } else if (isEsastanRed(neticeRaw, oRaw)) {
        counts[court].esastanRed++;
      } else if (isBozma(neticeRaw, oRaw)) {
        counts[court].bozma++;
      }
    }

    // Satır dizisi
    const rows = Object.entries(counts).map(([court, c]) => ({
      court,
      incelemede: c.incelemede | 0,
      esastanRed: c.esastanRed | 0,
      bozma: c.bozma | 0,
      kismen: c.kismen | 0
    }));

    // Toplamlar
    const totals = rows.reduce((acc, r) => {
      acc.incelemede += r.incelemede;
      acc.esastanRed += r.esastanRed;
      acc.bozma += r.bozma;
      acc.kismen += r.kismen;
      return acc;
    }, {
      incelemede: 0,
      esastanRed: 0,
      bozma: 0,
      kismen: 0
    });

    // Tablonun konacağı yer
    const panel = document.querySelector('#raporOzetBody') || document.getElementById('raporOzetBody');
    if (!panel) return;

    // Tablo iskeleti
    panel.innerHTML = `
		<table class="table table-ozet" id="daireOzetTable" style="width:100%;border-collapse:collapse">
		  <thead>
			<tr>
			  <th data-key="court"       class="orderable">Daire</th>
			  <th data-key="incelemede"  class="orderable">İncelemede</th>
			  <th data-key="esastanRed"  class="orderable">Esastan Red</th>
			  <th data-key="bozma"       class="orderable">Bozma</th>
			  <th data-key="kismen"      class="orderable">Kısmen</th>
			</tr>
		  </thead>
		  <tbody></tbody>
		  <tfoot>
			<tr class="total-row">
			  <td><b>Toplam</b></td>
			  <td><b>${totals.incelemede}</b></td>
			  <td><b>${totals.esastanRed}</b></td>
			  <td><b>${totals.bozma}</b></td>
			  <td><b>${totals.kismen}</b></td>
			</tr>
		  </tfoot>
		</table>
	  `;

    const tbody = panel.querySelector('#daireOzetTable tbody');

    function drawBody(data) {
      tbody.innerHTML = data.map(r => `
		  <tr>
			<td>${r.court}</td>
			<td class="num">${r.incelemede}</td>
			<td class="num">${r.esastanRed}</td>
			<td class="num">${r.bozma}</td>
			<td class="num">${r.kismen}</td>
		  </tr>
		`).join('');
    }

    // İlk çizim
    drawBody(rows);

    // Sıralama
    const thead = panel.querySelector('#daireOzetTable thead');
    const sortState = {
      key: null,
      dir: 1
    }; // 1: asc, -1: desc

    thead.addEventListener('click', (e) => {
      const th = e.target.closest('.orderable');
      if (!th) return;
      const key = th.getAttribute('data-key');
      if (!key) return;

      // yönü değiştir
      if (sortState.key === key) sortState.dir *= -1;
      else {
        sortState.key = key;
        sortState.dir = 1;
      }

      const dir = sortState.dir;

      // oku güncelle
      thead.querySelectorAll('.orderable').forEach(thEl => thEl.classList.remove('asc', 'desc'));
      th.classList.add(dir === 1 ? 'asc' : 'desc');

      const sorted = rows.slice().sort((a, b) => {
        if (key === 'court') {
          return a.court.localeCompare(b.court, 'tr') * dir;
        } else {
          return ((a[key] || 0) - (b[key] || 0)) * dir;
        }
      });

      drawBody(sorted);
    });

  }


  async function readSheetRowsArray(file, requiredSheetName) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {
      type: 'array',
      cellDates: true,
      raw: false
    });
    const target = wb.SheetNames.find(n => n.toLowerCase().trim() === requiredSheetName.toLowerCase());
    if (!target) throw new Error(`Hatalı dosya yüklendi <b>${requiredSheetName}</b> sayfası bulunamadı`);
    const ws = wb.Sheets[target];
    const rows = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: false
    });
    return {
      sheetName: target,
      rows
    };
  }

  // ---- Sınıflandırma / İstatistik
  function classifyItem(item) {
    const o = normalize(item.oRaw || ''); // O sütunun ham metni
    const t = normalize(item.netice || ''); // türetilmiş açıklama

    // 1) Henüz Gönderilmemiş: O boş ya da tam "kabul"
    if (!o || o === 'kabul') {
      return {
        bucket: 'not_sent'
      };
    }

    // 2) İncelemede: "Kabul - ... Ceza Dairesi'ne Gönderilmiştir."
    if (o.startsWith('kabul -') && o.includes('ceza dairesi')) {
      return {
        bucket: 'pending_review'
      };
    }

    // 3) Red - ... (sebep değişken olabilir) → Karar Verilmiş (Red kararı)
    //    Örnek: "Red - Kesin Kararın İstinafının Reddi"
    if (o.startsWith('red -')) {
      return {
        bucket: 'decided',
        decision: 'Red'
      };
    }

    // 4) Karar Verilmiş: netice metninden karar türlerini yakala
    if (
      t.includes('kararı vermiş') ||
            t.includes('kararına bağlanmıştır') ||
            t.includes('karar verilmiş')
    ) {
      if (t.includes('hükmün bozulması')) {
        return {
          bucket: 'decided',
          decision: 'Bozma'
        };
      }
      if (t.includes('esastan red')) {
        return {
          bucket: 'decided',
          decision: 'Esastan Red'
        };
      }
      if (t.includes('düzelterek onama')) {
        return {
          bucket: 'decided',
          decision: 'Düzelterek Onama'
        };
      }
      if (t.includes('onama')) {
        return {
          bucket: 'decided',
          decision: 'Onama'
        };
      }
      return {
        bucket: 'decided',
        decision: 'Diğer'
      };
    }

    // 5) Ek güvenlik: netice cümlesinde “değerlendirilmemiş” varsa yine not_sent say
    if (t.includes('değerlendirilmemiş')) {
      return {
        bucket: 'not_sent'
      };
    }

    // 6) Diğer her şey
    return {
      bucket: 'other'
    };
  }

  function computeStats(items) {
    const s = {
      total: items.length,
      not_sent: 0,
      pending_review: 0,
      decided: 0,
      other: 0,
      decisions: {}
    };
    for (const it of items) {
      const c = classifyItem(it);
      if (c.bucket === 'decided') {
        s.decided++;
        const k = c.decision || 'Diğer';
        s.decisions[k] = (s.decisions[k] || 0) + 1;
      } else s[c.bucket]++;
    }
    return s;
  }

  // ---- Üst Sağ (detay) ve Üst Sol (KPI) render
  function renderStatsPanels(stats) {
    // ÜST SAĞ: detay + karar türleri (eski düzen)
    if (statsBody) {
      statsBody.innerHTML = `
        <section class="panel">
          <div class="panel-head"><h3>Karar Türleri</h3></div>
          <div class="panel-body">
            <table class="table"><thead><tr><th>Tür</th><th>Adet</th></tr></thead><tbody>
              ${
  Object.keys(stats.decisions).length
    ? Object.keys(stats.decisions).sort().map(k => `<tr><td>${escapeHtml(k)}</td><td class="num">${stats.decisions[k]}</td></tr>`).join('')
    : `<tr><td colspan="2" class="muted">Henüz karar yok</td></tr>`
  }
            </tbody></table>
          </div>
        </section>`;
    }

    // ÜST SOL: KPI kartları
    ensureKpiCards();
    $('#kpiIstinafEdilen') && ($('#kpiIstinafEdilen').textContent = stats.total.toLocaleString('tr-TR'));
    $('#kpiNotSent') && ($('#kpiNotSent').textContent = stats.not_sent.toLocaleString('tr-TR'));
    $('#kpiPending') && ($('#kpiPending').textContent = stats.pending_review.toLocaleString('tr-TR'));
    $('#kpiDecided') && ($('#kpiDecided').textContent = stats.decided.toLocaleString('tr-TR'));
  }

  // ---- Dedupe: (Esas No + Karar No + Karar Tarihi), en eski İstinaf Dilekçesi
  function dedupeByEarliestIstinaf(items) {
    const map = new Map();
    let removed = 0;
    for (const it of items) {
      const key = [String(it.esasNo || ''), String(it.kararNo || ''), String(it.kararTarihi || '')].join('||');
      const cur = map.get(key);
      if (!cur) map.set(key, it);
      else {
        const d1 = toDate(it.istinafDilekceTarihi) || new Date(8640000000000000);
        const d0 = toDate(cur.istinafDilekceTarihi) || new Date(8640000000000000);
        if (d1 < d0) {
          map.set(key, it);
          removed++;
        } else {
          removed++;
        }
      }
    }
    return {
      items: Array.from(map.values()),
      removed
    };
  }

  // ---- Üst Sol KPI: card-head'i kaldır, KPI grid ekle
  function ensureKpiCards() {
    const ustSol = $('#cardAltSol');
    if (!ustSol) return;

    const ch = ustSol.querySelector('.card-head');
    if (ch) ch.remove();

    let body = ustSol.querySelector('.card-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'card-body';
      ustSol.appendChild(body);
    }

    if (body.querySelector('.kpi-grid')) return;

    body.innerHTML = `
		<section class="kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem;">
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">İstinaf Edilen</span><span class="material-symbols-rounded kpi-icon">work</span></div>
			<div class="kpi-value" id="kpiIstinafEdilen">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Henüz Gönderilmemiş</span><span class="material-symbols-rounded kpi-icon">outgoing_mail</span></div>
			<div class="kpi-value" id="kpiNotSent">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">İstinaf İncelemesinde</span><span class="material-symbols-rounded kpi-icon">assignment</span></div>
			<div class="kpi-value" id="kpiPending">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Karar Verilmiş</span><span class="material-symbols-rounded kpi-icon">gavel</span></div>
			<div class="kpi-value" id="kpiDecided">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>

		  <!-- YENİ: İşlem Sayısı -->
		  <div class="card kpi">
			<div class="kpi-head">
			  <span class="kpi-title">İşlem Sayısı</span>
			  <span class="material-symbols-rounded kpi-icon">contract_edit</span>
			</div>
			<div class="kpi-value" id="kpiIslem">0</div>
			<div class="kpi-sub muted">28/10/2025 tarihinden bugüne</div>
		  </div>
		</section>
	  `;
  }


  // ---- Modal: gerçek overlay + backdrop (benzersiz id’ler)
  (function injectModalStyles() {
    if (document.getElementById('kanunyolu-modal-style')) return;
    const css = `
      body.modal-open { overflow: hidden; }
      .ozet-backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,.45);
        z-index: 9998; display:none;
      }
      .modal-card.ozet-modal {
        position: fixed; z-index: 9999;
        inset: 50% auto auto 50%; transform: translate(-50%,-50%);
        width: min(1100px, 96vw);
        max-height: 86vh; display: none;
        background: var(--surface, #101418); color: inherit;
        border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,.5);
        overflow: hidden;
      }
      .modal-head, .modal-foot { padding: .8rem 1rem; background: rgba(255,255,255,.04); }
      .modal-body { padding: 1rem; overflow: auto; max-height: calc(86vh - 110px); }
      .modal-head h2 { margin: 0; font-size: 1.1rem; }
      .title-actions { display:flex; gap:.5rem; align-items:center; }
      .pager { display:flex; align-items:center; gap:.5rem; }
      #ozet-table td, #ozet-table th { white-space: nowrap; }
    `;
    const style = document.createElement('style');
    style.id = 'kanunyolu-modal-style';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  const backdrop = document.createElement('div');
  backdrop.className = 'ozet-backdrop';
  document.body.appendChild(backdrop);

  const modal = document.createElement('div');
  modal.id = 'ozet-modal';
  modal.className = 'modal-card ozet-modal';
  modal.innerHTML = `
    <div class="modal-head">
      <h2>İstinaf Özet Tablosu</h2>
      <div class="title-actions">
        <input id="ozet-search" class="input input--sm" placeholder="Ara...">
        <button id="ozet-export-xls" class="btn btn--sm">Excel'e Aktar</button>
        <button id="ozet-print-all" class="btn btn--sm">Yazdır</button>
        <button id="ozet-close-top" class="btn btn--sm btn--icon" aria-label="Kapat">✕</button>
      </div>
    </div>
    <div class="modal-body">
      <div id="ozet-pager-meta" class="muted" style="margin-bottom:.5rem;"></div>
      <table id="ozet-table" class="table">
        <thead><tr>
          <th>Esas No</th><th>Karar No</th><th>Karar Tarihi</th>
          <th>İstinaf Dilekçesi Tarihi</th><th>Netice</th><th>Hakim</th>
        </tr></thead><tbody></tbody>
      </table>
    </div>
    <div class="modal-foot" style="display:flex;justify-content:space-between;align-items:center;">
      <div class="pager">
        <button id="ozet-page-prev" class="btn btn--sm">◀ Önceki</button>
        <span id="ozet-page-info" class="muted" style="margin:0 .5rem;"></span>
        <button id="ozet-page-next" class="btn btn--sm">Sonraki ▶</button>
      </div>
      <button id="ozet-close-foot" class="btn btn--sm">Kapat</button>
    </div>`;
  document.body.appendChild(modal);

  // Modal scoped elemanlar (ID çakışması önlendi)
  const modalTbody = modal.querySelector('#ozet-table tbody');
  const pagerInfo = modal.querySelector('#ozet-page-info');
  const pagerMeta = modal.querySelector('#ozet-pager-meta');
  const searchBox = modal.querySelector('#ozet-search');
  const btnPrev = modal.querySelector('#ozet-page-prev');
  const btnNext = modal.querySelector('#ozet-page-next');
  const btnClose1 = modal.querySelector('#ozet-close-top');
  const btnClose2 = modal.querySelector('#ozet-close-foot');
  const btnExport = modal.querySelector('#ozet-export-xls');
  const btnPrint = modal.querySelector('#ozet-print-all');

  function openModal() {
    document.body.classList.add('modal-open');
    backdrop.style.display = 'block';
    modal.style.display = 'block';
    renderModalPage();
  }

  function closeModal() {
    modal.style.display = 'none';
    backdrop.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
  backdrop.addEventListener('click', closeModal);
  btnClose1.addEventListener('click', closeModal);
  btnClose2.addEventListener('click', closeModal);

  function renderModalPage() {
    const term = searchBox.value.trim().toLowerCase();
    const filtered = term ?
      ozetData.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(term))) :
      ozetData;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    modalTbody.innerHTML = pageItems.map(it => `
      <tr>
        <td>${escapeHtml(it.esasNo || '')}</td>
        <td>${escapeHtml(it.kararNo || '')}</td>
        <td>${escapeHtml(it.kararTarihi || '')}</td>
        <td>${escapeHtml(it.istinafDilekceTarihi || '')}</td>
        <td>${escapeHtml(it.netice || '')}</td>
        <td>${escapeHtml(it.hakim || '')}</td>
      </tr>
    `).join('');

    pagerInfo.textContent = `Sayfa ${currentPage}/${totalPages}`;
    pagerMeta.textContent = `${filtered.length} kayıt gösteriliyor (toplam ${ozetData.length})`;
  }

  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderModalPage();
    }
  });
  btnNext.addEventListener('click', () => {
    const term = searchBox.value.trim().toLowerCase();
    const filteredLen = term ?
      ozetData.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(term))).length :
      ozetData.length;
    const totalPages = Math.max(1, Math.ceil(filteredLen / pageSize));
    if (currentPage < totalPages) {
      currentPage++;
      renderModalPage();
    }
  });
  searchBox.addEventListener('input', () => {
    currentPage = 1;
    renderModalPage();
  });

  btnExport.addEventListener('click', () => {
    // Export kolonları sabit sırada
    const exportRows = ozetData.map(it => ({
      'Esas No': it.esasNo,
      'Karar No': it.kararNo,
      'Karar Tarihi': it.kararTarihi,
      'İstinaf Dilekçesi Tarihi': it.istinafDilekceTarihi,
      'Netice': it.netice,
      'Hakim': it.hakim
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Özet');
    XLSX.writeFile(wb, 'istinaf_ozet.xlsx');
  });

  btnPrint.addEventListener('click', () => {
    const w = window.open('', '_blank');
    const exportRows = ozetData.map(it => `
      <tr>
        <td>${escapeHtml(it.esasNo || '')}</td>
        <td>${escapeHtml(it.kararNo || '')}</td>
        <td>${escapeHtml(it.kararTarihi || '')}</td>
        <td>${escapeHtml(it.istinafDilekceTarihi || '')}</td>
        <td>${escapeHtml(it.netice || '')}</td>
        <td>${escapeHtml(it.hakim || '')}</td>
      </tr>`).join('');
    w.document.write(`
      <html><head><title>İstinaf Özet Tablosu</title>
      <style>
        body{font:14px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell;}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;white-space:nowrap}
        thead{background:#eee}
      </style></head>
      <body>
        <h2>İstinaf Özet Tablosu</h2>
        <table>
          <thead><tr>
            <th>Esas No</th><th>Karar No</th><th>Karar Tarihi</th>
            <th>İstinaf Dilekçesi Tarihi</th><th>Netice</th><th>Hakim</th>
          </tr></thead>
          <tbody>${exportRows}</tbody>
        </table>
      </body></html>`);
    w.document.close();
    w.print();
  });

  function showOzetButton() {
    if (!$('#btnOpenOzet')) {
      const btn = document.createElement('button');
      btn.id = 'btnOpenOzet';
      btn.className = 'btn btn--sm';
      btn.textContent = '📊 Özet Tabloyu Aç';
      btn.addEventListener('click', openModal);
      if (hintEl) hintEl.insertAdjacentElement('afterend', btn);
      else document.body.appendChild(btn);
    }
  }

  function getDateRangeFromRows(rowsInput) {
    // Her koşulda diziye normalize et
    const rows = Array.isArray(rowsInput) ?
      rowsInput :
      (window.__lastExcelRows && (window.__lastExcelRows.rowsUsed || window.__lastExcelRows.rows)) || [];

    if (!Array.isArray(rows) || rows.length === 0) return null;

    const eIdx = letterToIndex('E'); // Karar Tarihi
    const dates = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!Array.isArray(r)) continue;
      const d = dateFromCell(r[eIdx]);
      if (d instanceof Date && !isNaN(d)) dates.push(d);
    }

    if (dates.length === 0) return null;

    const minDate = new Date(Math.min.apply(null, dates));
    const maxDate = new Date(Math.max.apply(null, dates));
    return {
      min: minDate,
      max: maxDate
    };
  }

  function getDateRangeFromItems(items) {
    if (!Array.isArray(items) || !items.length) return null;
    const ds = [];
    for (const it of items) {
      const d = dateFromCell(it.kararTarihi);
      if (d instanceof Date && !isNaN(d)) ds.push(d);
    }
    if (!ds.length) return null;
    return {
      min: new Date(Math.min.apply(null, ds)),
      max: new Date(Math.max.apply(null, ds))
    };
  }


  function renderDateFilterZone() {
    const dz = document.getElementById('dropZone');
    if (!dz) return;

    // Eski zone varsa kaldır
    let wrap = document.getElementById('dateFilterZone');
    if (wrap) wrap.remove();

    wrap = document.createElement('div');
    wrap.id = 'dateFilterZone';
    wrap.className = 'date-filter-wrap';

    // Varsayılan min/max: ozetData içindeki Karar Tarihi'nden
    let minVal = '',
      maxVal = '';
    const rangeItems = getDateRangeFromItems(ozetData);
    if (rangeItems) {
      const fmt = (d) => d.toISOString().slice(0, 10);
      minVal = fmt(rangeItems.min);
      maxVal = fmt(rangeItems.max);
    }

    wrap.innerHTML = `
		<div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-top:10px;">
		  <label for="startDate"><b>İlk tarih</b></label>
		  <input id="startDate" type="date" value="${minVal}">
		  <label for="endDate"><b>Son tarih</b></label>
		  <input id="endDate" type="date" value="${maxVal}">
		  <button id="dateFilterBtn" type="button" class="btn">Filtrele</button>
          <button id="dateResetBtn" type="button" class="btn">Tümünü Göster</button>
		</div>
	  `;
    dz.insertAdjacentElement('afterend', wrap);

    const btnFilter = document.getElementById('dateFilterBtn');
    const btnReset = document.getElementById('dateResetBtn');

    btnFilter.addEventListener('click', () => {
      const sVal = document.getElementById('startDate').value;
      const eVal = document.getElementById('endDate').value;

      if (!Array.isArray(ozetData) || !ozetData.length) {
        window.toast?.({
          type: 'warning',
          title: 'Veri yok',
          body: 'Önce Excel yükleyin.'
        });
        return;
      }

      const start = sVal ? new Date(sVal + 'T00:00:00') : null;
      const end = eVal ? new Date(eVal + 'T23:59:59') : null;

      const filteredItems = ozetData.filter(it => {
        const d = dateFromCell(it.kararTarihi);
        if (!(d instanceof Date) || isNaN(d)) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });

      if (filteredItems.length) {
        window.toast?.({
          type: 'info',
          title: 'Filtre uygulandı',
          body: `${filteredItems.length} kayıt ${sVal || '?'} - ${eVal || '?'} aralığında`
        });
        // 🔁 Daire özet tablosunu FİLTRELENMİŞ item’larla yeniden oluştur
        // ✅ KPI + Karar Türleri panelini filtreye göre güncelle
        const statsFiltered = computeStats(filteredItems);
        renderStatsPanels(statsFiltered);

        // ✅ Daire özet tablosunu da filtreye göre yeniden çiz
        renderDaireOzetTablo(filteredItems);
        renderNotSentTablo(filteredItems);
        renderKesinKararTablo(filteredItems);
      } else {
        window.toast?.({
          type: 'warning',
          title: 'Kayıt bulunamadı',
          body: 'Bu tarih aralığında uygun kayıt yok.'
        });
      }
    });

    btnReset.addEventListener('click', () => {
      // Varsayılan item aralığına dön
      const r = getDateRangeFromItems(ozetData);
      const fmt = (d) => d && !isNaN(d) ? d.toISOString().slice(0, 10) : '';
      document.getElementById('startDate').value = r ? fmt(r.min) : '';
      document.getElementById('endDate').value = r ? fmt(r.max) : '';

      const all = ozetData; // tüm kayıtlar
      if (Array.isArray(all) && all.length) {
        // ✅ KPI + Karar Türleri panelini tam veriyle güncelle
        const statsAll = computeStats(all);
        renderStatsPanels(statsAll);

        // ✅ Tabloyu tam veriyle geri getir
        renderDaireOzetTablo(all);
        renderKesinKararTablo(all);
        renderNotSentTablo(all);

        window.toast?.({
          type: 'primary',
          title: 'Filtre sıfırlandı',
          body: 'Tüm kayıtlar gösteriliyor.'
        });
      }
    });
  }


  // Excel hücresinden JS Date üretir (dd/mm/yyyy, yyyy-mm-dd, Excel seri vs.)
  function dateFromCell(v) {
    if (v == null || v === '') return null;

    // Zaten Date ise
    if (Object.prototype.toString.call(v) === '[object Date]') {
      return isNaN(+v) ? null : v;
    }

    // Sayı veya sayısal string: Excel seri numarası desteği
    if (typeof v === 'number' || (/^\d+([.,]\d+)?$/.test(String(v).trim()))) {
      const n = Number(String(v).replace(',', '.'));
      // Excel seri tarih aralığı (yaklaşık): 1899-12-30 tabanlı
      if (!isNaN(n) && n > 25569 && n < 60000) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(epoch.getTime() + n * 86400 * 1000);
      }
      // sayısal ama seri değilse düşmeye devam etsin
    }

    const s = String(v).trim();

    // yyyy-mm-dd / yyyy.mm.dd / yyyy/mm/dd
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

    // dd.mm.yyyy / dd-mm-yyyy / dd/mm/yyyy
    m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);

    // Son çare: native parse (ISO vs.)
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }


  // ---- Ana akış
  async function processFiles(files) {
    const excelFiles = files.filter(isExcelFile);
    if (!excelFiles.length) {
      toastWithIcon('warning', 'Uyarı', 'Yalnızca <b>.xls</b> / <b>.xlsx</b> dosyalarına izin verilir.');
      return;
    }

    const allItems = [];
    let totalRowsRead = 0;
    let skippedEmpty = 0;
    const rowsUsedRaw = [];

    const COL = {
      D: letterToIndex('D'),
      E: letterToIndex('E'),
      F: letterToIndex('F'),
      J: letterToIndex('J'),
      O: letterToIndex('O'),
      Q: letterToIndex('Q') // HAKİM
    };

    for (const f of excelFiles) {
      try {
        const {
          rows
        } = await readSheetRowsArray(f, REQUIRED_SHEET);
        if (rows.length <= 1) continue;
        totalRowsRead += (rows.length - 1);

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const esasNo = extractDosyaNoFromD(row[COL.D]);
          const kararNo = row[COL.F] || '';
          const kararTrh = row[COL.E] || '';
          const dilekce = row[COL.J] || '';
          const netice = deriveNeticeFromO(row[COL.O]);
          const hakim = row[COL.Q] || '';
          const oHam = row[COL.O] || ''; // O sütunun HAM metni

          if (!(isEsasOrKararNo(esasNo) || isEsasOrKararNo(kararNo) || isDateLike(kararTrh))) {
            skippedEmpty++;
            continue;
          }

          rowsUsedRaw.push(row);

          allItems.push({
            esasNo,
            kararNo,
            kararTarihi: kararTrh,
            istinafDilekceTarihi: dilekce,
            netice, // deriveNeticeFromO ile ürettiğimiz açıklama
            hakim,
            oRaw: String(oHam) // <-- YENİ: ham O sütunu
          });
        }
      } catch (err) {
        toastWithIcon('danger', 'Hatalı Dosya', err.message || 'Okuma/validasyon hatası.');
      }
    }

    const beforeDedupe = allItems.length;
    const {
      items: deduped,
      removed: dupRemoved
    } = dedupeByEarliestIstinaf(allItems);

    deduped.sort((a, b) => {
      const [ya, na] = parseDosyaNoKey(a.esasNo);
      const [yb, nb] = parseDosyaNoKey(b.esasNo);
      return ya !== yb ? ya - yb : na - nb;
    });

    // Özet data ve buton
    ozetData = deduped;
    // ✔ Ham satırları globalde de saklayalım (opsiyonel ama faydalı)
    window.__lastExcelRows = window.__lastExcelRows || {};
    window.__lastExcelRows.rowsUsed = rowsUsedRaw;

    // ✔ 3) Çağrı noktası — tarih alanlarını otomatik doldur
    renderDateFilterZone(rowsUsedRaw);

    // mevcutlar:
    showOzetButton();
    const stats = computeStats(deduped);
    renderStatsPanels(stats);
    renderDaireOzetTablo(ozetData);
    renderKesinKararTablo(ozetData);
    renderNotSentTablo(ozetData);

    // Toast
    const bodyTxt = `<span class=\"material-symbols-rounded\" style=\"vertical-align:middle;font-size:20px;\">task_alt</span> ${totalRowsRead} satır okundu; ${skippedEmpty} boş; ${dupRemoved} mükerrer temizlendi. Kalan: ${deduped.length}. Özet tabloyu açabilirsiniz.`;
    toastWithIcon('success', 'Rapor Hazır', bodyTxt, 7500);

  }

  // ---- Olaylar
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.style.opacity = '0.9';
    }));
    ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.style.opacity = '1';
    }));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      processFiles(files);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      processFiles(files);
    });
  }

  // Kısa sayı formatlayıcı (1.2K, 3.4M...)
  function nFormatter(num, digits = 1) {
    const abs = Math.abs(num);
    const units = [{
      v: 1e9,
      s: 'B'
    }, // milyar
    {
      v: 1e6,
      s: 'M'
    }, // milyon
    {
      v: 1e3,
      s: 'K'
    } // bin
    ];
    for (const u of units) {
      if (abs >= u.v) {
        const val = (num / u.v).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1');
        return `${val}${u.s}`;
      }
    }
    return String(num);
  }


  // Dış kaynaktan "İşlem Sayısı" çeker, KPI'yı günceller.
  // jQuery varsa jQuery.getJSON ile; yoksa fetch ile dener.
  function updateIslemSayaci() {
    const updateDom = (adetRaw) => {
      const kpiEl = document.getElementById('kpiIslem');
      if (kpiEl) kpiEl.textContent = nFormatter(adetRaw, 2);
      if (typeof window.loadExampleExcelAndRender === 'function') {
        try {
          window.loadExampleExcelAndRender(adetRaw);
        } catch (_) {}
      }
    };

    const onError = () => updateDom(0);

    // jQuery varsa
    if (window.jQuery && typeof window.jQuery.getJSON === 'function') {
      window.jQuery.getJSON('https://sayac.657.com.tr/arttirkarar', function(response) {
        try {
          const adetRaw = (response && typeof response.adet !== 'undefined') ? (response.adet * 1) : 0;
          updateDom(adetRaw);
        } catch (e) {
          onError();
        }
      }).fail(onError);
      return;
    }

    // jQuery yoksa fetch fallback
    fetch('https://sayac.657.com.tr/arttirkarar', {
      method: 'GET'
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(json => {
        const adetRaw = (json && typeof json.adet !== 'undefined') ? (json.adet * 1) : 0;
        updateDom(adetRaw);
      })
      .catch(onError);
  }

  // Sayfa açılışında bir kere çağır
  ensureKpiCards(); // grid hazır değilse oluştursun
  updateIslemSayaci();

})();
