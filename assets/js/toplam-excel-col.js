(function bindToplamExcelColFilter(){
  if (window.__bindToplamExcelColFilter) return;
  window.__bindToplamExcelColFilter = true;
  const YEAR_RX = /\b(20\d{2}|19\d{2})\b/;
  const NUM_RX  = /\d+/g;
  const text = v => (v ?? '').toString().trim();
  const isNum = v => /^\d+$/.test(text(v));
  function getRows(){
    return (window._rows && Array.isArray(window._rows) && window._rows.length && window._rows)
        || (window.__rows && Array.isArray(window.__rows) && window.__rows.length && window.__rows)
        || [];
  }
  function col(r, l){const L = String(l).toUpperCase();return r[L] ?? r[L.toLowerCase()] ?? r[`col_${L}`] ?? '';}
  function esas(r){return text(col(r,'C'));}
  function karar(r){const e = text(col(r,'E')),y = (e.match(YEAR_RX) || [])[1] || '',b = (text(col(r,'B')).match(NUM_RX) || []).join('');return (y && b) ? `${y}/${b}` : '';}
  const TABLE_HTML = `<div class="cm-body"><table id="noJudgeTable" class="table" style="width:100%;border-collapse:collapse;"><thead><tr><th>#</th><th>Esas No (C)</th><th>Karar No (YIL(E)/B)</th></tr></thead><tbody></tbody></table></div>`;
  function ensureModal(){
    let m = document.getElementById('caseModal');
    if (!m){
      const w = document.createElement('div');
      w.innerHTML = `<div id="caseModal" class="cmodal" aria-hidden="true" role="dialog" aria-modal="true"><div class="cm-backdrop" data-close></div><div class="modal-card" role="document"><div class="modal-head"><span class="material-symbols-rounded">warning</span><h2 style="margin:0;font-size:18px;">Toplam Satırı Detayları</h2><div class="modal-actions"><button class="btn ghost cm-close" data-close>Kapat</button></div></div>${TABLE_HTML}<div class="modal-foot">Kaynak: <span id="cmSource">—</span></div></div></div>`;
      document.body.appendChild(w.firstElementChild);
      m = document.getElementById('caseModal');
      m.addEventListener('click',e => {if (e.target.matches('[data-close],.cm-close,.cm-backdrop'))close();});
      document.addEventListener('keydown',e => {if (e.key === 'Escape')close();});
    }
    function close(){m.classList.remove('is-open');m.setAttribute('aria-hidden','true');}
    return m;
  }
  function normalizeTable(modal){
    let cm = modal.querySelector('.cm-body');if (!cm){const card = modal.querySelector('.modal-card') || modal;const d = document.createElement('div');d.innerHTML = TABLE_HTML;card.appendChild(d.firstElementChild);cm = modal.querySelector('.cm-body');}
    cm.innerHTML = TABLE_HTML.replace('<div class="cm-body">','').replace('</div>','');
    return cm.querySelector('#noJudgeTable tbody');
  }
  function openModal(){const m = ensureModal();m.classList.add('is-open');m.setAttribute('aria-hidden','false');}
  document.addEventListener('click',e => {
    const cell = e.target.closest('[data-type="Toplam"]');
    if (!cell) return;if (e.target.closest('#caseModal')) return;
    const key = text(cell.getAttribute('data-col'));if (!key) return;
    const rows = getRows();if (!rows.length) return;
    const matched = [];
    for (const r of rows){
      const H = col(r,'H'),I = col(r,'I'),J = col(r,'J'),K = col(r,'K');
      const targets = isNum(H) ? [H,I,J,K] : [I,J,K];
      if (targets.some(v => text(v) === key))matched.push(r);
    }
    const m = ensureModal(),tb = normalizeTable(m),src = m.querySelector('#cmSource');
    if (src)src.textContent = location.href;
    while (tb.firstChild)tb.removeChild(tb.firstChild);
    let i = 0;for (const r of matched){const tr = document.createElement('tr');tr.innerHTML = `<td>${++i}</td><td>${esas(r) || '—'}</td><td>${karar(r) || '—'}</td>`;tb.appendChild(tr);}
    openModal();
    e.preventDefault();e.stopImmediatePropagation();
  },true);
})();
