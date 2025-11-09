
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

(function attachCaseModalUniversalPLUS(){
  const YEAR_RX = /\b(20\d{2}|19\d{2})\b/;
  const NUM_RX  = /\d+/g;
  function ensureModal(){
    if (document.getElementById('caseModal')) return;
    const tpl = document.createElement('div');
    tpl.innerHTML = `
<div id="caseModal" class="cmodal" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="cm-backdrop" data-close></div>
  <div class="modal-card" role="document" aria-labelledby="cmTitle">
    <div class="modal-head">
      <span class="material-symbols-rounded" aria-hidden="true">warning</span>
      <h2 id="cmTitle" style="margin:0;font-size:18px;">Hakim Bilgisi Bulunmayan Dosyalar</h2>
      <div class="modal-actions">
        <input id="noJudgeSearch" type="search" placeholder="Dosya / Esas / Karar No ara..." class="input">
        <button class="btn" id="btnNoJudgeExport" type="button">Excel</button>
        <button class="btn" id="btnNoJudgePrint" type="button">Yazdır</button>
        <button class="btn ghost" id="btnNoJudgeClose" type="button" data-close>Kapat</button>
      </div>
    </div>
    <div class="cm-body"><table id="noJudgeTable" class="table" style="width:100%;border-collapse:collapse;"><thead><tr><th>#</th><th>Esas No (C)</th><th>Karar No (YIL(E)/B)</th></tr></thead><tbody></tbody></table></div>
    <div class="modal-foot">Kaynak: <span id="cmSource">—</span></div>
  </div>
</div>`;
    document.body.appendChild(tpl.firstElementChild);
    const modal = document.getElementById('caseModal');
    modal.addEventListener('click', (e) => { if (e.target.matches('[data-close]')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    function close(){ modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); }
    modal.__close = close;
    const search = modal.querySelector('#noJudgeSearch');
    search?.addEventListener('input', (e) => {
      const term = (e.target.value || '').toLowerCase();
      modal.querySelectorAll('#noJudgeTable tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    });
    const btnCSV = modal.querySelector('#btnNoJudgeExport');
    btnCSV?.addEventListener('click', () => {
      const rows = [['#','Esas No (C)','Karar No (YIL(E)/B)']];
      modal.querySelectorAll('#noJudgeTable tbody tr').forEach(tr => {
        const t = tr.querySelectorAll('td'); if (t.length >= 3) rows.push([t[0].textContent.trim(), t[1].textContent.trim(), t[2].textContent.trim()]);
      });
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
      const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dosyalar.csv';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href),500);
    });
    const btnPrn = modal.querySelector('#btnNoJudgePrint');
    btnPrn?.addEventListener('click', () => {
      const w = window.open('','_blank','width=900,height=700'); if (!w) return;
      const css = '<style>body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:16px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}thead th{font-weight:700;position:sticky;top:0;background:#fff}</style>';
      const inner = document.querySelector('#caseModal .cm-body').innerHTML;
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Tablo</title>${css}</head><body>${inner}</body></html>`);
      w.document.close(); w.focus(); w.print(); w.close();
    });
  }
  function findRow(node){ return node.closest('tr, .result-row, .row, .grid-row'); }
  function findScope(node){ return node.closest('table, .result-card, .matrix-wrap, .grid, main, body') || document; }
  function idxVisible(row, scope){
    const rows = scope.querySelectorAll('tbody>tr, .result-row, tr');
    let i = 0; for (const r of rows){ if (r.offsetParent === null) continue; i++; if (r === row) return i; }
    return i || 1;
  }
  const text = n => (n && (n.textContent || '').trim()) || '';
  function esasC(row){ return text(row.querySelector('[data-col="C"], [data-col="c"]')) || ''; }
  function kararEoverB(row){
    const eTxt = text(row.querySelector('[data-col="E"], [data-col="e"]'));
    const bTxt = text(row.querySelector('[data-col="B"], [data-col="b"]'));
    const y = (eTxt.match(YEAR_RX) || [])[1] || '';
    const b = (bTxt.match(NUM_RX) || []).join('') || '';
    return (y && b) ? `${y}/${b}` : '';
  }
  document.addEventListener('click', function(e){
    const cell = e.target.closest('.clickable, [data-col]');
    if (!cell) return;
    if (e.target.closest('button, a, [data-close]')) return;
    ensureModal();
    const modal = document.getElementById('caseModal');
    const tbody = modal.querySelector('#noJudgeTable tbody');
    const source = modal.querySelector('#cmSource');
    const row   = findRow(cell); if (!row) return;
    const scope = findScope(row);
    const sira  = idxVisible(row, scope);
    const esas  = esasC(row) || '—';
    const karar = kararEoverB(row) || '—';
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${sira}</td><td>${esas}</td><td class="aga">${karar}</td>`;
    tbody.appendChild(tr);
    if (source) source.textContent = location.href;
    modal.classList.add('is-open'); modal.classList.remove('active'); modal.setAttribute('aria-hidden','false');
  }, true);
})();
