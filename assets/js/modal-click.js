(function(){
  function $(s,r){ return (r||document).querySelector(s); }
  window.addEventListener('unhandledrejection', function(ev){
    var reason = String(ev && ev.reason || '');
    if (reason.indexOf('A listener indicated an asynchronous response') !== -1 &&
        reason.indexOf('the message channel closed') !== -1) {
      ev.preventDefault();
    }
  });
  function notify(body, type, title, delay){
    if (!body) return;
    if (typeof window.toast === "function"){
      window.toast({ type: type || 'info', title: title || 'Bilgi', body: body, delay: delay || 2500 });
    } else {
    }
  }
  function ensureModal(){
    if (document.getElementById("judgeModal")) return;
    var div = document.createElement("div");
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
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("is-open");
    setTimeout(function(){ el.hidden = true; }, 160);
    document.body.classList.remove("modal-open");
  }
  document.addEventListener("click", function(e){
    var c = e.target.closest ? e.target.closest("[data-close]") : null;
    if (c) closeModalById(c.getAttribute("data-close"));
  });
  // letterToIndex is now in utils.js - use window.letterToIndex
  function openModal(rowsOrIdxs, title){
    ensureModal();
    var modal = $("#judgeModal");
    var tbody = $("#judgeModalTable tbody");
    tbody.innerHTML = "";
    $("#judgeModalTitle").textContent = title || "Detaylı Liste";
    var B = window.letterToIndex("B"), C = window.letterToIndex("C"), E = window.letterToIndex("E");
    var src = (window.G && Array.isArray(G.rows)) ? G.rows : [];
    var count = 0;
    for (var i=0; i<(rowsOrIdxs||[]).length; i++){
      var r = rowsOrIdxs[i];
      if (typeof r === "number") r = src[r] || [];
      var Cval = (r[C] || r.C || "").toString().trim();
      var Bval = (r[B] || r.B || "").toString().trim();
      var Eval = (r[E] || r.E || "").toString().trim();
      var m = Eval.match(/\b(\d{4})\b/);
      var yil = m ? m[1] : (Eval.length>=4 ? Eval.slice(0,4) : "YYYY");
      var kararNo = (yil || "YYYY") + "/" + (Bval || "?");
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>"+(++count)+"</td><td>"+(Cval||"-")+"</td><td>"+kararNo+"</td>";
      tbody.appendChild(tr);
    }
    $("#modalInfo").textContent = "Toplam " + count + " kayıt listelendi.";
    modal.hidden = false;
    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
  }
  function _normStr(x){
    x = String(x==null?"":x).trim();
    x = x.replace(/İ/g,'i').replace(/I/g,'ı').toLowerCase();
    x = x.replace(/\s+/g,' ');
    return x;
  }
  function _stripZeros(x){
    x = String(x==null?"":x).trim();
    return x.replace(/^0+/, '');
  }
  function resolveSicilKey(sic){
    if (!window.G || !G.perSicil) return sic;
    if (G.perSicil[sic] != null) return sic;
    var keys = Object.keys(G.perSicil||{});
    var s1 = _normStr(sic);
    var sNum = _stripZeros(sic);
    for (var i=0;i<keys.length;i++){
      var k = keys[i];
      if (String(k) === sic) return k;
      if (_stripZeros(k) === sNum) return k;
      if (_normStr(k) === s1) return k;
    }
    return sic;
  }
  function openJudgeModalFromCell(td){
    var countText = (td.textContent||"").trim();
    var sicilRaw  = (td.dataset.col || td.dataset.sicil || "").trim();
    var type      = (td.dataset.type || "").trim();
    if (!sicilRaw){ notify("Sicil bulunamadı.","warning","Eksik Veri"); return; }
    var expected = parseInt(countText, 10);
    if (!expected || expected <= 0){ notify("Bu tablo herhangi bir veri barındırmıyor.","info","Boş Tablo"); return; }
    var sicil = resolveSicilKey(sicilRaw);
    if (window.G && G.perSicil && G.perSicil[sicil]){
      var map = G.perSicil[sicil];
      var rowsIdxs = [];
      if (type === "Toplam" || type === "__ALL__" || !type){
        var keys = window.TYPES_ORDER || Object.keys(map);
        for (var i=0;i<keys.length;i++){ if (map[keys[i]]) rowsIdxs = rowsIdxs.concat(map[keys[i]]); }
      } else {
        rowsIdxs = map[type] ? map[type] : [];
      }
      if (!rowsIdxs.length){ notify("Kayıt bulunamadı.","info","Bilgi"); return; }
      openModal(rowsIdxs, sicil + " - " + (type||"Toplam"));
      return;
    }
    notify("Veri bulunamadı.","warning","Sonuç Yok");
  }
  window.modalClick = { ensureModal: ensureModal, openModal: openModal };
  window.openJudgeModalFromCell = openJudgeModalFromCell;
})();
