
// computeKararNo: B sütunundaki numarayı, Y sütunundaki yıl ile "YIL/B" formatında birleştirir.
function computeKararNo(r){
  try {
    if (!r) return '';
    const bVal = (typeof r[1] !== 'undefined' && r[1] != null) ? String(r[1]).trim() : ''; // B sütunu (0=A,1=B)
    const yearIdx = 24; // Y sütunu (0=A..24=Y)
    const yVal = (typeof r[yearIdx] !== 'undefined' && r[yearIdx] != null) ? String(r[yearIdx]).trim() : '';
    const year = (/^\d{4}$/.test(yVal) ? yVal : String(new Date().getFullYear()));
    if (!bVal) return year; // sadece yıl
    return year + '/' + bVal;
  } catch (e){ return ''; }
}

(function bindToplamExcelModal(){
  if (window.__bindToplamExcelModal) return;
  window.__bindToplamExcelModal = true;
  const YEAR_RX = /\b(20\d{2}|19\d{2})\b/;
  const NUM_RX  = /\d+/g;
  const text = n => (n && (n.textContent || '').trim()) || '';
  const findRow = el => el.closest('tr, .result-row, .row, .grid-row');
  const findScope = el => el.closest('table, .result-card, .matrix-wrap, .grid, main, body') || document;
  const TABLE_HTML = `
    <div class="cm-body">
      <table id="noJudgeTable" class="table" style="width:100%;border-collapse:collapse;">
        <thead><tr><th>#</th><th>Esas No (C)</th><th>Karar No (YIL(E)/B)</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>`.trim();
  function ensureModal(){
    let modal = document.getElementById('caseModal');
    if (!modal) {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
<div id="caseModal" class="cmodal" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="cm-backdrop" data-close></div>
  <div class="modal-card" role="document" aria-labelledby="cmTitle">
    <div class="modal-head">
      <span class="material-symbols-rounded" aria-hidden="true">warning</span>
      <h2 id="cmTitle" style="margin:0;font-size:18px;">Toplam Satırı Detayları</h2>
      <div class="modal-actions">
        <input id="noJudgeSearch" type="search" placeholder="Ara..." class="input">
        <button class="btn ghost cm-close" type="button" data-close aria-label="Kapat">Kapat</button>
      </div>
    </div>
    ${TABLE_HTML}
    <div class="modal-foot">Kaynak: <span id="cmSource">—</span></div>
  </div>
</div>`;
      document.body.appendChild(wrap.firstElementChild);
      modal = document.getElementById('caseModal');
    }
    if (!modal.__closersBound){
      modal.addEventListener('click', e => { if (e.target.matches('[data-close], .cm-close, .cm-backdrop')) closeModal(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
      modal.__closersBound = true;
    }
    return modal;
  }
  function normalizeTable(modal){
    let cmBody = modal.querySelector('.cm-body');
    if (!cmBody){
      const old = modal.querySelector('.modal-body');
      if (old) old.outerHTML = TABLE_HTML;
      else {
        const card = modal.querySelector('.modal-card') || modal;
        const div = document.createElement('div');
        div.innerHTML = TABLE_HTML;
        card.appendChild(div.firstElementChild);
      }
      cmBody = modal.querySelector('.cm-body');
    } else {
      cmBody.innerHTML = TABLE_HTML.replace('<div class="cm-body">','').replace('</div>','');
    }
    return cmBody.querySelector('#noJudgeTable tbody');
  }
  function openModal(){ const m = ensureModal(); m.classList.add('is-open'); m.setAttribute('aria-hidden','false'); }
  function closeModal(){ const m = document.getElementById('caseModal'); if (!m) return; m.classList.remove('is-open'); m.setAttribute('aria-hidden','true'); }
  function esasFromRow(r){ return text(r.querySelector('[data-col="C"], [data-col="c"]')) || ''; }
  function kararFromRow(r){
    const eTxt = text(r.querySelector('[data-col="E"], [data-col="e"]'));
    const bTxt = text(r.querySelector('[data-col="B"], [data-col="b"]'));
    const y = (eTxt.match(YEAR_RX) || [])[1] || '';
    const b = (bTxt.match(NUM_RX) || []).join('') || '';
    return (y && b) ? `${y}/${b}` : '';
  }
  document.addEventListener('click', function(e){
    const cell = e.target.closest('[data-type="Toplam"]');
    if (!cell) return;
    if (e.target.closest('#caseModal')) return;
    const modal = ensureModal();
    const tbody = normalizeTable(modal);
    const source = modal.querySelector('#cmSource');
    if (source) source.textContent = location.href;
    let dataRows = window._rows || window.__rows || null;
    if (!Array.isArray(dataRows) || !dataRows.length){
      const scope = findScope(cell);
      dataRows = Array.from(scope.querySelectorAll('tbody>tr, .result-row')).map(r => ({
        C: esasFromRow(r),
        karar: kararFromRow(r)
      })).filter(r => r.C || r.karar);
    }
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    let i = 0;
    for (const r of dataRows){
      i++;
      const esas = r.C || r.esas || '—';
      const karar = r.karar || kararFromRow(r) || '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i}</td><td>${esas}</td><td>${karar}</td>`;
      tbody.appendChild(tr);
    }
    openModal();
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
})();
