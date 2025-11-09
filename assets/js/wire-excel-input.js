(() => {
  const excelInput = document.getElementById('excelInput');

  function showExcelSpinner(fileName){
    const wrap = document.getElementById('excelStatus') || (function(){
      const el = document.createElement('div');
      el.id = 'excelStatus';
      el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.gap = '8px'; el.style.marginTop = '6px';
      excelInput.parentNode.insertBefore(el, excelInput.nextSibling);
      return el;
    })();
    wrap.innerHTML = '<span class="spinner"></span><span>Veriler okunuyor</span>';
    // also info toast if desired (non-blocking)
  }
  function hideExcelSpinner(){
    const wrap = document.getElementById('excelStatus');
    if (wrap) wrap.innerHTML = '';
  }
  function ensureExtraSummaryCard(){
    const host = document.querySelector('.altsag') || document.querySelector('.container .altsag');
    if (!host) return;
    let card = document.getElementById('extraSummary');
    if (!card){
      card = document.createElement('section');
      card.className = 'card summary-card';
      card.id = 'extraSummary';
      card.style.display = 'block';
      card.innerHTML = '<h2><span class="ms">article</span> Ek Özet</h2>' +
                       '<p id="extraSummaryText" class="muted">Veri bekleniyor…</p>' +
                       '<small>Not: Cumhuriyet Savcısı sicilleri L sütunundan çözümlenir.</small>';
      host.appendChild(card);
    }
  }

  if (!excelInput) return;
  // letterToIndex is now in utils.js - use window.letterToIndex
  function toNumber(v){
    const n = Number(String(v || '').replace(/\./g,'').replace(',', '.'));
    return isFinite(n) ? n : 0;
  }
  function idxDefault(){
    return { m: window.letterToIndex('M'), o: window.letterToIndex('O'), p: window.letterToIndex('P'), q: window.letterToIndex('Q'), t: window.letterToIndex('T'), z: window.letterToIndex('Z') };
  }
  function kararTuruRow(r, idx){
    if (toNumber(r[idx.o]) > 0) return 'Mahkumiyet';
    if (toNumber(r[idx.p]) > 0) return 'HAGB';
    if (toNumber(r[idx.t]) > 0) return 'Gör/Yet/Birleş';
    if (toNumber(r[idx.m]) > 0) return 'Beraat';
    if (toNumber(r[idx.q]) > 0) return 'Red';
    if (toNumber(r[idx.z]) > 0) return 'Tazminat';
    return 'Düşme/Cvyo/Diğer';
  }
  async function readWorkbook(file){
    if (!window.XLSX){ alert('xlsx.min.js bulunamadı (assets/js/vendor/xlsx.min.js). Lütfen ekleyin.'); throw new Error('XLSX missing'); }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header:1, raw:true });
    return data;
  }
  function fallbackBuildMaps(rows, idx, judgeCols){
    const TYPES = ['Mahkumiyet','Beraat','Düşme/Cvyo/Diğer','Zamanaşımı','HAGB','Gör/Yet/Birleş','Red','Tazminat'];
    const perSicil = {};
    const perTypeAll = {}; TYPES.forEach(t => perTypeAll[t] = []);
    const unassigned = [];
    for (let i = 0;i < rows.length;i++){
      const r = rows[i]; if (!r) continue;
      const t = kararTuruRow(r, idx);
      perTypeAll[t].push(i);
      const sics = judgeCols.map(c => String(r[c] || '').replace(/\D/g,'')).filter(Boolean);
      const uniq = [...new Set(sics)];
      if (uniq.length === 0){ unassigned.push(i); continue; }
      uniq.forEach(s => {
        perSicil[s] = perSicil[s] || {};
        perSicil[s][t] = perSicil[s][t] || [];
        perSicil[s][t].push(i);
      });
    }
    return { perSicil, perTypeAll, unassigned };
  }
  function listAllSicils(perSicil){
    return Object.keys(perSicil).sort((a,b) => Number(a) - Number(b));
  }
  function renderMatrixSimple(perSicil){
    const TYPES = ['Mahkumiyet','Beraat','Düşme/Cvyo/Diğer','Zamanaşımı','HAGB','Gör/Yet/Birleş','Red','Tazminat'];
    const table = document.getElementById('summaryTable');
    if (!table) return;
    const cols = listAllSicils(perSicil);
    const thead = table.querySelector('thead tr');
    thead.innerHTML = '<th>Karar Türleri</th>' + cols.map(s => `<th>(${s})</th>`).join('');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    TYPES.forEach(type => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${type}</td>` + cols.map(s => {
        const v = (perSicil[s] && perSicil[s][type]) ? perSicil[s][type].length : 0;
        return `<td class="clickable" data-sicil="${s}" data-type="${type}">${v}</td>`;
      }).join('');
      tbody.appendChild(tr);
    });
    const trSum = document.createElement('tr');
    trSum.innerHTML = '<td><b>Toplam</b></td>' + cols.map(s => {
      const sum = TYPES.reduce((acc,t) => acc + ((perSicil[s] && perSicil[s][t]) ? perSicil[s][t].length : 0), 0);
      return `<td class="clickable" data-sicil="${s}" data-type="__ALL__"><b>${sum}</b></td>`;
    }).join('');
    tbody.appendChild(trSum);
  }
  excelInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    showExcelSpinner();
    const __t0 = Date.now();
    try {
      const matrix = await readWorkbook(file);
      const rows = matrix.slice(1);
      const idx = idxDefault();
      const judgeCols = [window.letterToIndex('I'), window.letterToIndex('J'), window.letterToIndex('K')];
      window.G = window.G || {};
      G.rowsBase = rows;
      G.idx = idx;
      G.judgeCols = judgeCols;
      const builder = (typeof buildMaps === 'function') ? buildMaps : fallbackBuildMaps;
      const maps = builder(rows, idx, judgeCols);
      G.perSicil = maps.perSicil;
      G.perTypeAll = maps.perTypeAll;
      G.unassigned = maps.unassigned;
      if (typeof renderMatrix === 'function') {
        renderMatrix('');
      } else {
        renderMatrixSimple(G.perSicil);
      }
      const warn = document.getElementById('warnNoJudge');
      if (warn) warn.style.display = (G.unassigned && G.unassigned.length > 0) ? 'block' : 'none';
      const dateBar = document.getElementById('dateFilterBar');
      if (dateBar) dateBar.style.display = 'block';
      const att = document.getElementById('attention');
      if (att) att.style.display = 'block';
      ensureExtraSummaryCard();
      const __delay = 1500 - (Date.now() - __t0); if (__delay > 0) { await new Promise(r => setTimeout(r,__delay)); }
      hideExcelSpinner();
      if (window.toast) window.toast({type:'success', title:'Başarılı', body: (file && file.name ? (file.name + ' okundu') : 'Dosya okundu')});
    } catch (err){
      hideExcelSpinner();
      console.error(err);
      alert(err.message || 'Dosya okunamadı.');
    }
  });
})();
