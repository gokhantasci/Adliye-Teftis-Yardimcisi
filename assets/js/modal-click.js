(function(){
  function $(s,r){ return (r || document).querySelector(s); }
  window.addEventListener('unhandledrejection', function(ev){
    const reason = String(ev && ev.reason || '');
    if (reason.indexOf('A listener indicated an asynchronous response') !== -1 &&
        reason.indexOf('the message channel closed') !== -1) {
      ev.preventDefault();
    }
  });
  function notify(body, type, title, delay){
    if (!body) return;
    if (typeof window.toast === 'function'){
      window.toast({ type: type || 'info', title: title || 'Bilgi', body: body, delay: delay || 2500 });
    } else {
      console.log((title || 'Bilgi') + ': ' + body);
    }
  }
  function ensureModal(){
    if (document.getElementById('judgeModal')) return;
    const div = document.createElement('div');
    div.innerHTML = '' +
      '<div id="judgeModal" class="modal-backdrop" hidden>' +
      '  <div class="modal-card">' +
      '    <div class="modal-head">' +
      '      <h3 id="judgeModalTitle">—</h3>' +
      '      <button class="icon-btn" data-close="judgeModal" aria-label="Kapat">×</button>' +
      '    </div>' +
      '    <div class="modal-body">' +
      '      <div class="table-wrap">' +
      '        <table class="table" id="judgeModalTable">' +
      '          <thead><tr><th>#</th><th>Esas No</th><th>Karar No</th></tr></thead>' +
      '          <tbody></tbody>' +
      '        </table>' +
      '      </div>' +
      '      <div class="muted" id="modalInfo"></div>' +
      '    </div>' +
      '    <div class="modal-foot">' +
      '      <button class="btn" data-export="judgeModalTable">Excel\'e Aktar (CSV)</button>' +
      '      <button class="btn btn-outline" data-print="judgeModal">Yazdır</button>' +
      '      <button class="btn btn-danger" data-close="judgeModal">Kapat</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(div.firstElementChild);
  }
  function closeModalById(id){
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('is-open');
    setTimeout(function(){ el.hidden = true; }, 160);
    document.body.classList.remove('modal-open');
  }
  document.addEventListener('click', function(e){
    const c = e.target.closest ? e.target.closest('[data-close]') : null;
    if (c) closeModalById(c.getAttribute('data-close'));
  });
  // letterToIndex is now in utils.js - use window.letterToIndex
  function openModal(rowsOrIdxs, title){
    ensureModal();
    const modal = $('#judgeModal');
    const tbody = $('#judgeModalTable tbody');
    tbody.innerHTML = '';
    $('#judgeModalTitle').textContent = title || 'Detaylı Liste';
    const B = window.letterToIndex('B'), C = window.letterToIndex('C'), E = window.letterToIndex('E');
    const src = (window.G && Array.isArray(G.rows)) ? G.rows : [];
    let count = 0;
    for (let i = 0; i < (rowsOrIdxs || []).length; i++){
      let r = rowsOrIdxs[i];
      if (typeof r === 'number') r = src[r] || [];
      const Cval = (r[C] || r.C || '').toString().trim();
      const Bval = (r[B] || r.B || '').toString().trim();
      const Eval = (r[E] || r.E || '').toString().trim();
      const m = Eval.match(/\b(\d{4})\b/);
      const yil = m ? m[1] : (Eval.length >= 4 ? Eval.slice(0,4) : 'YYYY');
      const kararNo = (yil || 'YYYY') + '/' + (Bval || '?');
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (++count) + '</td><td>' + (Cval || '-') + '</td><td>' + kararNo + '</td>';
      tbody.appendChild(tr);
    }
    $('#modalInfo').textContent = 'Toplam ' + count + ' kayıt listelendi.';
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
  }
  function _normStr(x){
    x = String(x == null ? '' : x).trim();
    x = x.replace(/İ/g,'i').replace(/I/g,'ı').toLowerCase();
    x = x.replace(/\s+/g,' ');
    return x;
  }
  function _stripZeros(x){
    x = String(x == null ? '' : x).trim();
    return x.replace(/^0+/, '');
  }
  function resolveSicilKey(sic){
    if (!window.G || !G.perSicil) return sic;
    if (G.perSicil[sic] != null) return sic;
    const keys = Object.keys(G.perSicil || {});
    const s1 = _normStr(sic);
    const sNum = _stripZeros(sic);
    for (let i = 0;i < keys.length;i++){
      const k = keys[i];
      if (String(k) === sic) return k;
      if (_stripZeros(k) === sNum) return k;
      if (_normStr(k) === s1) return k;
    }
    return sic;
  }
  function openJudgeModalFromCell(td){
    const countText = (td.textContent || '').trim();
    const sicilRaw  = (td.dataset.col || td.dataset.sicil || '').trim();
    const type      = (td.dataset.type || '').trim();
    if (!sicilRaw){ notify('Sicil bulunamadı.','warning','Eksik Veri'); return; }
    const expected = parseInt(countText, 10);
    if (!expected || expected <= 0){ notify('Bu tablo herhangi bir veri barındırmıyor.','info','Boş Tablo'); return; }
    const sicil = resolveSicilKey(sicilRaw);
    if (window.G && G.perSicil && G.perSicil[sicil]){
      const map = G.perSicil[sicil];
      let rowsIdxs = [];
      if (type === 'Toplam' || type === '__ALL__' || !type){
        const keys = window.TYPES_ORDER || Object.keys(map);
        for (let i = 0;i < keys.length;i++){ if (map[keys[i]]) rowsIdxs = rowsIdxs.concat(map[keys[i]]); }
      } else {
        rowsIdxs = map[type] ? map[type] : [];
      }
      if (!rowsIdxs.length){ notify('Kayıt bulunamadı.','info','Bilgi'); return; }
      openModal(rowsIdxs, sicil + ' - ' + (type || 'Toplam'));
      return;
    }
    notify('Veri bulunamadı.','warning','Sonuç Yok');
  }
  window.modalClick = { ensureModal: ensureModal, openModal: openModal };
  window.openJudgeModalFromCell = openJudgeModalFromCell;
})();
