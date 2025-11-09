// computeKararNo: B sütunundaki numarayı, E/Y sütunundan çıkan YIL ile "YIL/B" formatında birleştirir.
function computeKararNo(r){
  try {
    if (!r) return '';
    const bVal = (typeof r[1] !== 'undefined' && r[1] != null) ? String(r[1]).trim() : ''; // B sütunu (0=A,1=B)
    // E sütunundan yıl dene; yoksa Y sütunu, en sonda mevcut yıl
    const eIdx = (typeof letterToIndex === 'function') ? letterToIndex('E') : 4;
    const yIdx = (typeof letterToIndex === 'function') ? letterToIndex('Y') : 24;
    const eVal = (Array.isArray(r) ? (r[eIdx] || '') : (r && r.E) || '').toString().trim();
    const yVal = (Array.isArray(r) ? (r[yIdx] || '') : (r && r.Y) || '').toString().trim();
    const year = (eVal.match(/\b(\d{4})\b/) || [])[1] || (yVal.match(/\b(\d{4})\b/) || [])[1] || String(new Date().getFullYear());
    if (!bVal) return year;
    return year + '/' + bVal;
  } catch (e){ return ''; }
}

(function(){
  if (typeof window.openModal === 'function') return;

  function ensureModal(){
    let modal = document.getElementById('caseModal');
    if (!modal){
      const tpl = document.createElement('template');
      tpl.innerHTML = `
<div id="caseModal" class="modal-backdrop" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="cm-backdrop" data-close></div>
  <div class="modal-card" role="document" aria-labelledby="cmTitle">
    <div class="modal-head">
      <span class="material-symbols-rounded" aria-hidden="true">warning</span>
      <h2 id="cmTitle" style="margin:0;font-size:18px;">Detay</h2>
      <div class="modal-actions">
        <input id="noJudgeSearch" type="search" placeholder="Ara..." class="input">
        <button class="btn" id="btnNoJudgeExport" type="button">Excel</button>
        <button class="btn" id="btnNoJudgePrint" type="button">Yazdır</button>
        <button class="btn ghost" id="btnNoJudgeClose" type="button" data-close>Kapat</button>
      </div>
    </div>
    <div class="cm-body"></div>
    <div class="modal-foot"><div class="muted" id="cmSource"></div></div>
  </div>
</div>`;
      document.body.appendChild(tpl.content);
      modal = document.getElementById('caseModal');

      function close(){ modal.classList.remove('is-open','active'); modal.setAttribute('aria-hidden','true'); }
      modal.__close = close;

      // Sadece backdrop veya modal-card dışı tıkta kapat
      modal.addEventListener('click', function(e){
        const isBackdrop = e.target.classList && e.target.classList.contains('cm-backdrop');
        const insideCard = !!e.target.closest('.modal-card');
        if (isBackdrop || !insideCard) close();
      });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });

      // --- BUTONLAR: Kapat / Excel / Yazdır (tam tablo) ---
      const btnClose  = modal.querySelector('#btnNoJudgeClose');
      const btnExport = modal.querySelector('#btnNoJudgeExport');
      const btnPrint  = modal.querySelector('#btnNoJudgePrint');

      function cloneTableShowAllRows(table){
        const clone = table.cloneNode(true);
        clone.querySelectorAll('tr').forEach(tr => { tr.style.display = ''; });
        return clone;
      }
      function exportTableToExcelFull(table, filename){
        const safeName = (filename || 'detaylar.xls').replace(/[^\w\-.]+/g, '_');
        const clone = cloneTableShowAllRows(table);
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${clone.outerHTML}</body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
      }
      function printFullTable(table){
        const clone = cloneTableShowAllRows(table);
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) return;
        const css = `
          <style>
            body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:16px}
            table{border-collapse:collapse;width:100%}
            th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
            th{background:#f7f7f7}
          </style>`;
        w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${css}</head><body>${clone.outerHTML}</body></html>`);
        w.document.close(); w.focus(); w.print();
      }

      if (btnClose){
        btnClose.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (typeof modal.__close === 'function') modal.__close();
          else { modal.classList.remove('is-open','active'); modal.setAttribute('aria-hidden','true'); }
        });
      }
      if (btnExport){
        btnExport.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const table = modal.querySelector('table');
          if (table) exportTableToExcelFull(table, 'detaylar.xls');
        });
      }
      if (btnPrint){
        btnPrint.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const table = modal.querySelector('table');
          if (table) printFullTable(table);
        });
      }

      // Arama inputu
      const search = modal.querySelector('#noJudgeSearch');
      if (search){
        search.addEventListener('input', (ev) => {
          ev.stopPropagation();
          const q = search.value.toLowerCase();
          modal.querySelectorAll('tbody tr').forEach(tr => {
            const t = tr.textContent.toLowerCase();
            tr.style.display = t.includes(q) ? '' : 'none';
          });
        });
      }
    }
    return modal;
  }

  function buildTableFromRows(rows){
    function idxFromLetter(letter){
      if (typeof letterToIndex === 'function') return letterToIndex(letter);
      const L = (letter || '').toUpperCase().charCodeAt(0) - 65;
      return (L >= 0 && L < 26) ? L : NaN;
    }
    const iB = idxFromLetter('B');
    const iC = idxFromLetter('C');
    const iE = idxFromLetter('E');

    function getByAliases(obj, aliases){
      for (const k of aliases){
        if (k in obj && obj[k] != null && String(obj[k]).trim() !== '') return String(obj[k]);
        const key = Object.keys(obj).find(x => x.toLowerCase() === String(k).toLowerCase());
        if (key && obj[key] != null && String(obj[key]).trim() !== '') return String(obj[key]);
      }
      return '';
    }
    function val(row, letter, aliases){
      if (Array.isArray(row)){
        const i = letter === 'B' ? iB : letter === 'C' ? iC : iE;
        if (!isNaN(i) && row[i] != null) return String(row[i]);
        return '';
      } else if (row && typeof row === 'object'){
        return getByAliases(row, aliases);
      }
      return '';
    }

    const tbl = document.createElement('table');
    tbl.className = 'table report-table';
    tbl.id = 'hakimKararlar';
    tbl.innerHTML = '<thead><tr><th>#</th><th>Esas No (C)</th><th>Karar No</th></tr></thead><tbody></tbody>';
    const tb = tbl.querySelector('tbody');

    (rows || []).forEach((r, i) => {
      const Cval = val(r,'C', ['C','c','esas','Esas','Esas No','esasNo','esas_no','ESAS_NO']);
      const kararNo = computeKararNo(r);
      if (!Cval && !kararNo) return;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="num">${i + 1}</td><td>${Cval || ''}</td><td>${kararNo || ''}</td>`;
      tb.appendChild(tr);
    });

    // Pager'ı DOM’a eklendikten hemen sonra dene
    setTimeout(() => { if (window.__obApplyPager) window.__obApplyPager(tbl, 20); }, 0);
    return tbl;
  }

  window.openModal = function(data, title){
    const modal = ensureModal();
    modal.querySelector('#cmTitle').textContent = title || 'Detay';
    const body = modal.querySelector('.cm-body');
    body.innerHTML = '';

    if (Array.isArray(data)){
      const tbl = buildTableFromRows(data);
      body.appendChild(tbl);
      setTimeout(() => { if (window.__obApplyPager) window.__obApplyPager(tbl, 20); }, 0);
    } else if (data instanceof Node){
      body.appendChild(data);
    } else {
      body.innerHTML = data || '<p>İçerik bulunamadı.</p>';
    }

    const source = modal.querySelector('#cmSource');
    if (source) source.textContent = location.href;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
  };
})();

(function(){
  if (window.__openModalTeftisPatch) return;
  window.__openModalTeftisPatch = true;

  function hasDetailScaffold(){
    return document.getElementById('detail-modal') &&
           document.querySelector('#modal-table tbody') &&
           document.getElementById('modal-title');
  }

  function renderIntoDetailModal(rowIdxs, title){
    const modal = document.getElementById('detail-modal');
    const tbody = document.querySelector('#modal-table tbody');
    const titleEl = document.getElementById('modal-title');
    if (!modal || !tbody || !titleEl) return false;

    const B = (typeof letterToIndex === 'function') ? letterToIndex('B') : 1;
    const C = (typeof letterToIndex === 'function') ? letterToIndex('C') : 2;
    const E = (typeof letterToIndex === 'function') ? letterToIndex('E') : 4;

    titleEl.textContent = 'Detaylı Liste — ' + (title || 'Detay');
    tbody.innerHTML = '';

    if (!Array.isArray(rowIdxs)) rowIdxs = [];
    const uniq = Array.from(new Set(rowIdxs));
    const rows = (window.G && Array.isArray(window.G.rows)) ? window.G.rows : [];

    uniq.forEach((ri, ix) => {
      const r = rows[ri] || [];
      const siraNo = ix + 1;
      const esas = (Array.isArray(r) ? (r[C] || '') : (r && r.C)) || '';
      const tarih = String(Array.isArray(r) ? (r[E] || '') : (r && r.E) || '');
      const yil = (tarih.match(/\b(\d{4})\b/) || [])[1] || 'YYYY';
      const siraGercek = String(Array.isArray(r) ? (r[B] || '') : (r && r.B) || '').trim();
      const kararNo = `${yil}/${siraGercek || '?'}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${siraNo}</td><td>${esas || '-'}</td><td>${kararNo}</td>`;
      tbody.appendChild(tr);
    });

    // Detay modal tablosu için emniyet çağrısı
    setTimeout(() => {
      const t = document.querySelector('#modal-table');
      if (t && window.__obApplyPager) window.__obApplyPager(t,20);
    }, 0);

    modal.classList.add('active');
    return true;
  }

  const origOpenModal = window.openModal;
  window.openModal = function(data, title){
    if (Array.isArray(data) && data.every(x => typeof x === 'number')){
      if (hasDetailScaffold()){
        if (renderIntoDetailModal(data, title)) return;
      }
      const rows = (window.G && Array.isArray(window.G.rows)) ? window.G.rows : [];
      const picked = Array.from(new Set(data)).map(i => rows[i]).filter(Boolean);
      return (origOpenModal || (function(x,t){ if (window.openModalBridgeFallback) window.openModalBridgeFallback(x,t); }))(picked, title);
    }
    return (origOpenModal || (function(x,t){ if (window.openModalBridgeFallback) window.openModalBridgeFallback(x,t); }))(data, title);
  };
})();

// === OB local pager (non-destructive: rows show/hide) ===
(function(){
  if (window.__obLocalPagerBound2) return; window.__obLocalPagerBound2 = true;

  // sadece satırları gizle/göster; tbody içeriğini yeniden yazma
  function obApplyPager(table, pageSize){
    try {
      if (!table || table.__pagerApplied) return;
      pageSize = pageSize || 20;

      const tbody = table.tBodies && table.tBodies[0] ? table.tBodies[0] : table.querySelector('tbody');
      if (!tbody) return;
      const rows = Array.from(tbody.rows || tbody.querySelectorAll('tr'));
      const total = rows.length;
      if (total <= pageSize) return;

      rows.forEach((tr, i) => { tr.dataset.pgIndex = i; });

      let page = 1;
      const pages = Math.ceil(total / pageSize);

      // Find appropriate footer: modal-foot or card-footer/card-foot
      const modal = table.closest('.cmodal, .modal-card');
      let footer = modal ? modal.querySelector('.modal-foot') : null;

      if (!footer) {
        const card = table.closest('.card');
        footer = card ? (card.querySelector('.card-footer') || card.querySelector('.card-foot')) : null;
      }

      const pagerId = (table.id || 'table') + '_pager';
      let pager = footer ? footer.querySelector('#' + pagerId) : table.parentElement.querySelector('#' + pagerId);

      if (!pager){
        pager = document.createElement('div');
        pager.id = pagerId;
        pager.className = 'pager';
        pager.style.display = 'flex';
        pager.style.alignItems = 'center';
        pager.style.gap = '12px';
        pager.style.justifyContent = 'space-between';
        // modal kapanmasın
        pager.addEventListener('click', (ev) => ev.stopPropagation());

        if (footer) {
          footer.appendChild(pager);
        } else {
          pager.style.marginTop = '10px';
          table.parentElement.appendChild(pager);
        }
      }

      function render(){
        const start = (page - 1) * pageSize;
        const end   = page * pageSize;
        rows.forEach((tr, i) => {
          tr.style.display = (i >= start && i < end) ? '' : 'none';
        });

        pager.innerHTML = '';
        const left = document.createElement('div');
        const center = document.createElement('div');
        const right = document.createElement('div');
        center.className = 'muted';
        center.textContent = `Sayfa ${page} / ${pages} — ${total} kayıt`;

        function mkBtn(label, disabled, on){
          const b = document.createElement('button');
          b.className = 'btn ghost';
          b.type = 'button';
          b.textContent = label;
          b.disabled = !!disabled;
          b.addEventListener('click', (ev) => ev.stopPropagation());
          if (on) b.addEventListener('click', on);
          return b;
        }

        left.appendChild(mkBtn('Önceki', page === 1, () => { page--; render(); }));
        right.appendChild(mkBtn('Sonraki', page === pages, () => { page++; render(); }));
        pager.appendChild(left);
        pager.appendChild(center);
        pager.appendChild(right);
      }

      render();
      table.__pagerApplied = true;
    } catch (e){ console.error('ob pager error', e); }
  }
  window.__obApplyPager = obApplyPager;

  function applyPagerToVisibleTables(){
    ['#modal-table','#noJudgeTable','#hakimKararlar'].forEach(sel => {
      const t = document.querySelector(sel);
      if (t) obApplyPager(t, 20);
    });
    document.querySelectorAll('.cm-body table').forEach(t => {
      obApplyPager(t, 20);
    });
  }

  (function hookModalOpen(){
    ['detail-modal','caseModal'].forEach(id => {
      const m = document.getElementById(id);
      if (!m) return;
      const onOpen = () => {
        const opened = m.classList.contains('is-open') || m.classList.contains('active') || m.getAttribute('aria-hidden') === 'false';
        if (!opened) return;
        setTimeout(applyPagerToVisibleTables, 0);
      };
      new MutationObserver(onOpen).observe(m, {attributes:true, attributeFilter:['class','aria-hidden']});
      onOpen();
    });
  })();

  setTimeout(applyPagerToVisibleTables, 0);
})();
