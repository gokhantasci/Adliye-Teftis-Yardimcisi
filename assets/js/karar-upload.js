(function(){
  const $ = (s) => document.querySelector(s);
  const input = $('#excelInput');
  const runBtn = $('#run');
  if (!input) return;
  const dropZone = document.getElementById('dropZone');
  let resultCard = $('#resultCard');
  if (!resultCard){
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.id = 'resultCard';
    panel.style.marginTop = '14px';
    panel.innerHTML = `
      <div class="panel-head"><h3><span class="material-symbols-rounded" style="vertical-align:-4px;margin-right:6px;">analytics</span> Sonuçlar</h3></div>
      <div class="panel-body">
        <div class="cards cards--3" style="margin-bottom: 14px;">
          <div class="card kpi"><div class="kpi-head"><span class="kpi-title">Toplam</span></div><div class="kpi-value" id="kpiTotal">0</div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-title">Mahkumiyet</span></div><div class="kpi-value" id="kpiMah">0</div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-title">HAGB</span></div><div class="kpi-value" id="kpiHagb">0</div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-title">Gör/Yet/Birleş</span></div><div class="kpi-value" id="kpiGyb">0</div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-title">BERAAT</span></div><div class="kpi-value" id="kpiBer">0</div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-title">RED</span></div><div class="kpi-value" id="kpiRed">0</div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-title">Tazminat</span></div><div class="kpi-value" id="kpiTaz">0</div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-title">Düşme/Cvyo/Diğer</span></div><div class="kpi-value" id="kpiDgr">0</div></div>
        </div>
        <div class="table-wrap" style="overflow:auto;max-height:420px;border:1px dashed var(--border,#e7eaf0); border-radius:12px;">
          <table class="table report-table" id="resultTable">
            <thead><tr id="resultHead"></tr></thead>
            <tbody id="resultBody"></tbody>
          </table>
        </div>
      </div>`;
    const host = document.querySelector('.panel-body');
    (host && host.parentElement ? host.parentElement.after(panel) : document.body.appendChild(panel));
    resultCard = panel;
  }
  const headEl = $('#resultHead');
  const bodyEl = $('#resultBody');
  function parseCSV(text){
    const hasSemicolon = text.indexOf(';') > -1;
    const hasComma = text.indexOf(',') > -1;
    const sep = hasSemicolon && !hasComma ? ';' : ',';
    const rows = text.split(/\r?\n/).filter(r => r.trim().length > 0).map(r => r.split(sep).map(c => c.replace(/^\uFEFF/, '').trim()));
    return {header: rows[0] || [], rows: rows.slice(1)};
  }
  async function parseXLSX(file){
    if (window.XLSX){
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, {type:'array'});
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, {header:1, raw:true});
      const header = (json[0] || []).map(String);
      const rows = json.slice(1).map(r => r.map(v => (v == null ? '' : v)));
      return {header, rows};
    } else {
      throw new Error('xlsx.min.js bulunamadı (assets/js/vendor/xlsx.min.js). Lütfen .csv kullanın veya vendor dosyasını ekleyin.');
    }
  }
  function toNumber(v){
    const n = Number(String(v).replace(/\./g,'').replace(',','.'));
    return isFinite(n) ? n : 0;
  }
  function resolveIndexes(header){
    const upper = header.map(h => String(h).trim().toUpperCase());
    const letterToIndex = (L) => {
      L = L.toUpperCase();
      let idx = 0;
      for (let i = 0;i < L.length;i++){ idx = idx * 26 + (L.charCodeAt(i) - 64); }
      return idx - 1;
    };
    const byName = (names) => {
      for (const n of names){
        const i = upper.indexOf(n.toUpperCase());
        if (i > -1) return i;
      }
      return -1;
    };
    const idx = {
      M: byName(['BERAAT','BER']),
      O: byName(['MAHKUMIYET','MAHKUMİYET','HÜKÜM','HUKUM','CEZA']),
      P: byName(['HAGB','HÜKMÜN AÇIKLANMASININ GERİ BIRAKILMASI']),
      Q: byName(['RED','RET']),
      T: byName(['GÖR/YET/BİRLEŞ','GÖREV','YETKİ','BİRLEŞ']),
      Z: byName(['TAZMİNAT','TAZMINAT'])
    };
    const fallback = {M:'M', O:'O', P:'P', Q:'Q', T:'T', Z:'Z'};
    for (const k of Object.keys(fallback)){
      if (idx[k] < 0) idx[k] = letterToIndex(fallback[k]);
    }
    return idx;
  }
  function classifyRow(row, idx){
    const vO = toNumber(row[idx.O]);
    const vP = toNumber(row[idx.P]);
    const vT = toNumber(row[idx.T]);
    const vM = toNumber(row[idx.M]);
    const vQ = toNumber(row[idx.Q]);
    const vZ = toNumber(row[idx.Z]);
    if (vO > 0) return 'Mahkumiyet';
    if (vP > 0) return 'HAGB';
    if (vT > 0) return 'Gör/Yet/Birleş';
    if (vM > 0) return 'BERAAT';
    if (vQ > 0) return 'RED';
    if (vZ > 0) return 'Tazminat';
    return 'Düşme/Cvyo/Diğer';
  }
  function render(header, rows, idx){
    headEl.innerHTML = '';
    const head = document.createDocumentFragment();
    header.forEach(h => { const th = document.createElement('th'); th.textContent = h; head.appendChild(th); });
    { const th = document.createElement('th'); th.textContent = 'Tür'; head.appendChild(th); }
    headEl.appendChild(head);
    const counts = { total:0, Mahkumiyet:0, HAGB:0, 'Gör/Yet/Birleş':0, BERAAT:0, RED:0, Tazminat:0, 'Düşme/Cvyo/Diğer':0 };
    bodyEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    rows.forEach(r => {
      if (r.every(c => String(c).trim() === '')) return;
      const typ = classifyRow(r, idx);
      counts.total++; counts[typ] = (counts[typ] || 0) + 1;
      const tr = document.createElement('tr');
      header.forEach((_,i) => { const td = document.createElement('td'); td.textContent = r[i] ?? ''; tr.appendChild(td); });
      const td = document.createElement('td'); td.textContent = typ; tr.appendChild(td);
      frag.appendChild(tr);
    });
    bodyEl.appendChild(frag);
    const set = (id,v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('kpiTotal', counts.total);
    set('kpiMah', counts.Mahkumiyet || 0);
    set('kpiHagb', counts.HAGB || 0);
    set('kpiGyb', counts['Gör/Yet/Birleş'] || 0);
    set('kpiBer', counts.BERAAT || 0);
    set('kpiRed', counts.RED || 0);
    set('kpiTaz', counts.Tazminat || 0);
    set('kpiDgr', counts['Düşme/Cvyo/Diğer'] || 0);
    resultCard.style.display = '';
  }
  async function runFromFile(f){
    let parsed;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (ext === 'xlsx' || ext === 'xls'){
      parsed = await parseXLSX(f);
    } else if (ext === 'csv'){
      parsed = parseCSV(await f.text());
    } else {
      alert('Desteklenen uzantılar: .xlsx, .xls, .csv');
      return;
    }
    const idx = resolveIndexes(parsed.header);
    render(parsed.header, parsed.rows, idx);
  }
  function onInputChanged(e){
    const f = e.target.files && e.target.files[0];
    if (f) runFromFile(f).catch(err => { console.error(err); alert(err.message || 'Dosya okunamadı.'); });
  }
  input.addEventListener('change', onInputChanged);
  if (runBtn){
    runBtn.addEventListener('click', () => {
      const f = input.files && input.files[0];
      if (!f) { alert('Lütfen bir dosya seçin.'); return; }
      onInputChanged({target: {files:[f]}});
    });
  }

  // Dropzone etkileşimi (sürükle-bırak)
  if (dropZone){
    dropZone.addEventListener('click', () => input && input.click());
    ['dragenter','dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('is-over'); }));
    ['dragleave','drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('is-over'); }));
    dropZone.addEventListener('drop', e => {
      const dt = e.dataTransfer; if (!dt || !dt.files || dt.files.length === 0) return;
      const f = dt.files[0];
      runFromFile(f).catch(err => { console.error(err); alert(err.message || 'Dosya okunamadı.'); });
    });
  }
})();
