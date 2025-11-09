/* ===============================
 * TEFTİŞ: KARAR KPI + RAPOR (tek parça)
 *  - Hakimler sadece Ayarlar/IDX i,j,k (varsayılan I,J,K) üzerinden toplanır (H KULLANILMAZ)
 *  - searchSicil: case-insensitive includes, boşsa filtre yok
 *  - Tarihler kullanıcı yazdığı gibi sabit kalır; başlangıç & bitiş günleri DAHİL
 *  - No-Judge modal, Case modal (pager + yazdır/indir), yatay sürükleme
 * =============================== */

/* ===============================
 * 1) Yardımcılar
 * =============================== */
(function(){
  if(typeof window.letterToIndex!=='function'){
    window.letterToIndex=function(col){
      if(col==null) return 0;
      var s=String(col).trim().toUpperCase(); if(!s) return 0;
      var n=0; for(var i=0;i<s.length;i++){ var c=s.charCodeAt(i); if(c<65||c>90) continue; n=n*26+(c-64); }
      return Math.max(0,n-1);
    };
  }
})();
function $(s){ return document.querySelector(s); }
function text(el,v){ if(el) el.textContent=String(v); }
function nonEmpty(v){ return v!==null && v!==undefined && String(v).trim()!==""; }
function toNum(v){ if(v==null) return 0; var n=parseFloat(String(v).replace(',','.')); return isNaN(n)?0:n; }
function siteAddress(){ try{return location.origin||(location.protocol+'//'+location.host);}catch(_){return 'https://657.com.tr';} }
function yearFromCell(v){
  if(v==null) return '';
  var s=String(v).trim();
  if(/^\d{4}$/.test(s)) return s;
  var m=s.match(/(\d{4})/); if(m) return m[1];
  var n=Number(s.replace(',','.'));
  if(!isNaN(n)&&n>25569&&n<60000){
    var epoch=new Date(Date.UTC(1899,11,30));
    var d=new Date(epoch.getTime()+n*86400*1000);
    return String(d.getUTCFullYear());
  }
  return '';
}
function dateFromCell(v){
  if(v==null) return null;
  var s=String(v).trim();
  var m=s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/); if(m) return new Date(+m[1],+m[2]-1,+m[3]);
  var n=Number(s.replace(',','.')); if(!isNaN(n)&&n>25569&&n<60000){ var epoch=new Date(Date.UTC(1899,11,30)); return new Date(epoch.getTime()+n*86400*1000); }
  var m2=s.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/); if(m2) return new Date(+m2[3],+m2[2]-1,+m2[1]);
  return null;
}
function fmtYMD(d){ if(!d) return ''; var mm=('0'+(d.getMonth()+1)).slice(-2), dd=('0'+d.getDate()).slice(-2); return d.getFullYear()+'-'+mm+'-'+dd; }
function fmtTR(d){ if(!d) return ''; var dd=('0'+d.getDate()).slice(-2), mm=('0'+(d.getMonth()+1)).slice(-2), yy=d.getFullYear(); return dd+'.'+mm+'.'+yy; }
function normalizeHeaderLabel(h){ var s=String(h||'').trim(); var m=s.match(/^\(\s*(.*?)\s*\)$/); return m?m[1]:s; }
function fmtDMYstr(s){
  if(!s) return '';
  var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m) return m[3]+'/'+m[2]+'/'+m[1];
  var d = new Date(s); if(isNaN(d)) return String(s);
  var dd=('0'+d.getDate()).slice(-2), mm=('0'+(d.getMonth()+1)).slice(-2), yy=d.getFullYear();
  return dd+'/'+mm+'/'+yy;
}

// Hakim anahtarlarını (sadece I,J,K) getir
function getJudgeKeysForRow(r, IDX){
  var out=[]; function pushIf(v){ v=(v==null?'':String(v)).trim(); if(v) out.push(v); }
  pushIf(r[IDX.i]); pushIf(r[IDX.j]); pushIf(r[IDX.k]);
  return out;
}

/* ===============================
 * 2) No-Judge (Hakimi olmayan) Modal
 * =============================== */
(function(){
  function ensureNoJudgeModal(){
    var modal=document.getElementById('noJudgeModal'); if(modal) return modal;
    modal=document.createElement('div'); modal.id='noJudgeModal'; modal.className='modal-backdrop';
    var inner=document.createElement('div'); inner.className='modal-card';

    var head=document.createElement('div'); head.className='modal-head';
    head.innerHTML='<span class="material-symbols-rounded">warning</span><h2 style="margin:0;font-size:18px;">Hakim Bilgisi Bulunmayan Dosyalar</h2>';
    var acts=document.createElement('div'); acts.className='modal-actions';
    acts.innerHTML='<input id="noJudgeSearch_missing" type="search" placeholder="Dosya / Esas / Karar No ara..." class="input">'+
                   '<button class="btn" id="btnNoJudgeExport_missing">Excel</button>'+
                   '<button class="btn" id="btnNoJudgePrint_missing">Yazdır</button>'+
                   '<button class="btn ghost" id="btnNoJudgeClose_missing">Kapat</button>';
    head.appendChild(acts);

    var body=document.createElement('div'); body.id='noJudgeTableWrap'; body.className='modal-body';
    body.innerHTML='<table id="noJudgeTable" class="table" style="width:100%;border-collapse:collapse;">'+
                   '<thead><tr><th>#</th><th>Esas No (C)</th><th>Karar No</th></tr></thead><tbody></tbody></table>';
    var foot=document.createElement('div'); foot.className='modal-foot'; foot.textContent='Kaynak: '+siteAddress();

    inner.appendChild(head); inner.appendChild(body); inner.appendChild(foot); modal.appendChild(inner); document.body.appendChild(modal);

    modal.addEventListener('click',e=>{ if(e.target===modal) hideNoJudgeModal(); });
    document.getElementById('btnNoJudgeClose_missing').addEventListener('click', hideNoJudgeModal);
    document.getElementById('noJudgeSearch_missing').addEventListener('input',function(){ filterNoJudgeTable(this.value); });
    document.getElementById('btnNoJudgeExport_missing').addEventListener('click',exportNoJudgeToExcel);
    document.getElementById('btnNoJudgePrint_missing').addEventListener('click',printNoJudgeTable);
    return modal;
  }
  function fillNoJudgeTable(){
    var saved=window.__lastExcelRows; if(!saved||!saved.rowsUsed||!saved.noJudgeRows) return;
    var bIdx=letterToIndex('B'), cIdx=letterToIndex('C'), eIdx=letterToIndex('E');
    var rows=saved.rowsUsed, miss=saved.noJudgeRows;
    var tb=$('#noJudgeTable tbody'); if(!tb) return; tb.innerHTML='';
    var data=[];
    for(var i=0;i<miss.length;i++){
      var idx=miss[i], r=rows[idx]||[];
      var esas=nonEmpty(r[cIdx])?String(r[cIdx]):'';
      var yil=yearFromCell(r[eIdx])||''; var b=nonEmpty(r[bIdx])?String(r[bIdx]):'';
      var karar=(yil?yil:'')+(b?('/'+b):'');
      var tr=document.createElement('tr');
      tr.innerHTML='<td style="padding:8px;border-bottom:1px solid #0001">'+(idx+1)+'</td>'+
                   '<td style="padding:8px;border-bottom:1px solid #0001">'+esas+'</td>'+
                   '<td style="padding:8px;border-bottom:1px solid #0001">'+karar+'</td>';
      tb.appendChild(tr); data.push({sira:(idx+1), esas:esas, karar:karar});
    }
    window.__noJudgeData=data;
    var s=$('#noJudgeSearch_missing'); if(s) s.value='';
  }
  function filterNoJudgeTable(q){
    q=(q||'').toLowerCase(); var tb=$('#noJudgeTable tbody'); if(!tb||!window.__noJudgeData) return; tb.innerHTML='';
    window.__noJudgeData.forEach(function(row){
      var t=(String(row.sira)+' '+row.esas+' '+row.karar).toLowerCase();
      if(q && t.indexOf(q)===-1) return;
      var tr=document.createElement('tr');
      tr.innerHTML='<td style="padding:8px;border-bottom:1px solid #0001">'+row.sira+'</td>'+
                   '<td style="padding:8px;border-bottom:1px solid #0001">'+row.esas+'</td>'+
                   '<td style="padding:8px;border-bottom:1px solid #0001">'+row.karar+'</td>';
      tb.appendChild(tr);
    });
  }
  function printNoJudgeTable(){
    var w=window.open('','_blank'); if(!w) return; var addr=siteAddress();
    var wrap=$('#noJudgeTableWrap'); var html=wrap?wrap.innerHTML:'';
    if(!html || html.indexOf('<table')===-1){
      var tableEl=$('#hakimKararlar')||document.querySelector('.report-table')||document.querySelector('table');
      if(!tableEl){ alert('Yazdırılacak tablo bulunamadı.'); try{w.close();}catch(_){ } return; }
      html=tableEl.outerHTML;
    }
    w.document.write('<html><head><meta charset="utf-8"><title>Hakim Bilgisi Bulunmayan</title>'+
                     '<style>body{font-family:system-ui,Segoe UI,Roboto,Arial;padding:20px} th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}</style></head><body>'+
                     '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h2>Rapor</h2><div class="addr">'+addr+'</div></div>'+
                     html+'</body></html>');
    w.document.close(); try{w.focus(); w.print();}catch(_){}
  }
  function exportNoJudgeToExcel(){
    if(!window.XLSX){ alert('Excel dışa aktarım için XLSX kütüphanesi gerekli.'); return; }
    if(Array.isArray(window.__noJudgeData) && window.__noJudgeData.length){
      var aoa=[['Hakim Bilgisi Bulunmayan Dosyalar','',siteAddress()],[],['#','Esas No (C)','Karar No']];
      window.__noJudgeData.forEach(r=>aoa.push([r.sira,r.esas,r.karar]));
      var wb=XLSX.utils.book_new(); var ws=XLSX.utils.aoa_to_sheet(aoa); XLSX.utils.book_append_sheet(wb, ws, 'Eksik Hakim'); XLSX.writeFile(wb,'hakim-bilgisi-eksik.xlsx'); return;
    }
    var tableEl=$('#hakimKararlar')||document.querySelector('.report-table')||document.querySelector('table');
    if(!tableEl){ alert('Dışa aktarılacak tablo bulunamadı.'); return; }
    var wb=XLSX.utils.book_new(); var ws=XLSX.utils.table_to_sheet(tableEl); XLSX.utils.book_append_sheet(wb, ws, 'Tablo'); XLSX.writeFile(wb,'rapor.xlsx');
  }
  function showNoJudgeModal(){ ensureNoJudgeModal().classList.add('is-open'); fillNoJudgeTable(); }
  function hideNoJudgeModal(){ var m=$('#noJudgeModal'); if(m) m.classList.remove('is-open'); }
  window.showNoJudgeModal=showNoJudgeModal;
  window.hideNoJudgeModal=hideNoJudgeModal;
})();

/* ===============================
 * 3) Case Modal (pager + yazdır/indir)
 * =============================== */
(function(){
  function ensureCaseModal(){
    var m=$('#caseModal'); if(m) return m;
    m=document.createElement('div'); m.id='caseModal'; m.className='modal-backdrop';
    var inner=document.createElement('div'); inner.className='modal-card';

    var head=document.createElement('div'); head.className='modal-head';
    head.innerHTML='<span class="material-symbols-rounded">list_alt</span><h2 id="caseModalTitle" style="margin:0;font-size:18px;">Kayıtlar</h2>';

    var acts=document.createElement('div'); acts.className='modal-actions';
    acts.innerHTML = ''
      + '<button class="btn" id="btnCasePrintAll">Tümünü Yazdır</button>'
      + '<button class="btn" id="btnCaseExportAll">Tümünü İndir (XLS)</button>'
      + '<button class="btn" id="btnCasePrev">Önceki</button>'
      + '<span id="casePager" class="muted" style="min-width:120px;text-align:center"></span>'
      + '<button class="btn" id="btnCaseNext">Sonraki</button>'
      + '<button class="btn ghost" id="btnCaseClose">Kapat</button>';
    head.appendChild(acts);

    var body=document.createElement('div'); body.className='modal-body';
    body.innerHTML='<table class="table" id="caseTable" style="width:100%;border-collapse:collapse">'+
                   '<thead><tr><th>#</th><th>Esas No (C)</th><th>Karar No</th></tr></thead><tbody></tbody></table>';
    var foot=document.createElement('div'); foot.className='modal-foot'; foot.textContent='Kaynak: '+siteAddress();

    inner.appendChild(head); inner.appendChild(body); inner.appendChild(foot); m.appendChild(inner); document.body.appendChild(m);

    m.addEventListener('click',e=>{ if(e.target===m) hideCaseModal(); });
    $('#btnCaseClose').addEventListener('click', hideCaseModal);
    $('#btnCasePrev').addEventListener('click', ()=>pageCase(-1));
    $('#btnCaseNext').addEventListener('click', ()=>pageCase(1));
    $('#btnCasePrintAll').addEventListener('click', printAllCases);
    $('#btnCaseExportAll').addEventListener('click', exportAllCases);
    return m;
  }
  var CASE_STATE={rows:[], page:1, size:20, title:''};
  function renderCaseTable(){
    var tb=$('#caseTable tbody'); if(!tb) return; tb.innerHTML='';
    var start=(CASE_STATE.page-1)*CASE_STATE.size, end=Math.min(start+CASE_STATE.size, CASE_STATE.rows.length);
    for(var i=start;i<end;i++){
      var r=CASE_STATE.rows[i];
      var tr=document.createElement('tr');
      tr.innerHTML='<td style="padding:8px;border-bottom:1px solid #0001">'+r.sira+'</td>'+
                   '<td style="padding:8px;border-bottom:1px solid #0001">'+(r.esas||'')+'</td>'+
                   '<td style="padding:8px;border-bottom:1px solid #0001">'+(r.karar||'')+'</td>';
      tb.appendChild(tr);
    }
    var pager=$('#casePager');
    if(pager){ var total=Math.max(1,Math.ceil(CASE_STATE.rows.length/CASE_STATE.size)); pager.textContent=CASE_STATE.page+' / '+total; }
    var ttl=$('#caseModalTitle'); if(ttl) ttl.textContent=CASE_STATE.title||'Kayıtlar';
  }
  function pageCase(delta){
    var total=Math.max(1,Math.ceil(CASE_STATE.rows.length/CASE_STATE.size));
    CASE_STATE.page=Math.min(total, Math.max(1, CASE_STATE.page+delta));
    renderCaseTable();
  }
  function printAllCases(){
    var w=window.open('','_blank'); if(!w) return;
    var rows=CASE_STATE.rows||[];
    var html='<table style="width:100%;border-collapse:collapse" border="0" cellspacing="0" cellpadding="0"><thead>'+
             '<tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">#</th>'+
             '<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Esas No (C)</th>'+
             '<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Karar No</th></tr></thead><tbody>';
    rows.forEach(function(r){
      html+='<tr><td style="padding:8px;border-bottom:1px solid #eee">'+r.sira+'</td>'+
            '<td style="padding:8px;border-bottom:1px solid #eee">'+(r.esas||'')+'</td>'+
            '<td style="padding:8px;border-bottom:1px solid #eee">'+(r.karar||'')+'</td></tr>';
    });
    html+='</tbody></table>';
    w.document.write('<html><head><meta charset="utf-8"><title>'+ (CASE_STATE.title||'Kayıtlar') +'</title>'+
                     '<style>body{font-family:system-ui,Segoe UI,Roboto,Arial;padding:20px}</style></head><body>'+
                     '<h2 style="margin:0 0 12px 0">'+(CASE_STATE.title||'Kayıtlar')+'</h2>'+html+'</body></html>');
    w.document.close(); try{w.focus(); w.print();}catch(_){}
  }
  function exportAllCases(){
    if(!window.XLSX){ alert('Excel dışa aktarım için XLSX kütüphanesi gerekli.'); return; }
    var aoa=[['Kayıtlar','',''],['#','Esas No (C)','Karar No']];
    (CASE_STATE.rows||[]).forEach(r=>aoa.push([r.sira,r.esas,r.karar]));
    var wb=XLSX.utils.book_new(); var ws=XLSX.utils.aoa_to_sheet(aoa); XLSX.utils.book_append_sheet(wb, ws, 'Kayıtlar');
    XLSX.writeFile(wb, 'sicil-detay.xlsx');
  }
  function showCaseModal(rows, title){ ensureCaseModal().classList.add('is-open'); CASE_STATE.rows=rows||[]; CASE_STATE.page=1; CASE_STATE.title=title||'Kayıtlar'; renderCaseTable(); }
  function hideCaseModal(){ var m=$('#caseModal'); if(m) m.classList.remove('is-open'); }
  window.showCaseModal=showCaseModal; window.hideCaseModal=hideCaseModal;
})();

/* ===============================
 * 4) Hücre Tıklama + Modal Açma
 * =============================== */
function _decideTypeByIDX(r, IDX){
  var o=toNum(r[IDX.o]), p=toNum(r[IDX.p]), t=toNum(r[IDX.t]), m=toNum(r[IDX.m]), q=toNum(r[IDX.q]), z=toNum(r[IDX.z]);
  if(o>0) return "Mahkumiyet";
  if(p>0) return "HAGB";
  if(t>0) return "Gör/Yet/Birleş";
  if(m>0) return "Beraat";
  if(q>0) return "Red";
  if(z>0) return "Tazminat";
  return "Düşme/Cvyo/Diğer";
}
function _hasJudgeForRow(rr, IDX){
  function _ne(x){ return x!=null && String(x).trim()!==''; }
  return _ne(rr[IDX.i]) || _ne(rr[IDX.j]) || _ne(rr[IDX.k]); // SADECE I,J,K
}
function _rowToCaseObj(r, idx){
  var bIdx=letterToIndex('B'), cIdx=letterToIndex('C'), eIdx=letterToIndex('E');
  var esas=nonEmpty(r[cIdx])?String(r[cIdx]):''; var yil=yearFromCell(r[eIdx])||''; var b=nonEmpty(r[bIdx])?String(r[bIdx]):'';
  return {sira:(idx+1), esas:esas, karar:(yil?yil:'')+(b?('/'+b):'')};
}
function cellClickHandler(td){
  var rowType=td.getAttribute('data-type'); var colKey=td.getAttribute('data-col');
  if(colKey==='__EMPTY__'){ openEmptyModalFor(rowType); return; }
  openJudgeSicilModal(colKey,rowType);
}
function openEmptyModalFor(decisionType){
  var ms=window.__matrixSource||{}; var used=(window.__lastExcelRows&&window.__lastExcelRows.rowsUsed)||[]; var IDX=ms.IDX||{};
  var rows=[];
  for(var i=0;i<used.length;i++){
    var r=used[i]; if(_hasJudgeForRow(r,IDX)) continue;
    var t=_decideTypeByIDX(r,IDX); if(decisionType && decisionType!=='Toplam' && t!==decisionType) continue;
    rows.push(_rowToCaseObj(r,i));
  }
  window.showNoJudgeModal();
  var tb=$('#noJudgeTable tbody'); if(!tb) return; tb.innerHTML='';
  rows.forEach(o=>{
    var tr=document.createElement('tr');
    tr.innerHTML='<td style="padding:8px;border-bottom:1px solid #0001">'+o.sira+'</td>'+
                 '<td style="padding:8px;border-bottom:1px solid #0001">'+o.esas+'</td>'+
                 '<td style="padding:8px;border-bottom:1px solid #0001">'+o.karar+'</td>';
    tb.appendChild(tr);
  });
  window.__noJudgeData=rows.slice();
  var head=$('#noJudgeModal .modal-head h2'); if(head) head.textContent='Hakim Bilgisi Bulunmayan Dosyalar'+(decisionType&&decisionType!=='Toplam'?' — '+decisionType:'');
}
// Savcı siciline özel modal (L sütunu)
function openSavciModal(sicil, decisionType){
  var ms = window.__matrixSource || {};
  var used = (window.__lastExcelRows && window.__lastExcelRows.rowsUsed) || [];
  var IDX  = ms.IDX || {};
  var L = (IDX && typeof IDX.l === 'number') ? IDX.l : letterToIndex('L');

  var rows = [];
  for (var i=0;i<used.length;i++){
    var r = used[i];
    if(String(r[L]||'').trim() !== String(sicil)) continue;
    var t = _decideTypeByIDX(r, IDX);
    if(decisionType && decisionType!=='Toplam' && t!==decisionType) continue;
    rows.push(_rowToCaseObj(r, i));
  }
  if(rows.length===0){
    if(window.toast){ window.toast({type:'warning', title:'Kayıt bulunamadı', body:'Bu savcı siciline ait kayıt bulunamadı.'}); }
    return;
  }
  window.showCaseModal(rows, 'Savcı Sicili: '+sicil + (decisionType && decisionType!=='Toplam' ? ' — '+decisionType : ''));
}
function openJudgeSicilModal(sicil, decisionType){
  var ms=window.__matrixSource||{}; var used=(window.__lastExcelRows&&window.__lastExcelRows.rowsUsed)||[]; var IDX=ms.IDX||{};
  var rows=[];
  for(var i=0;i<used.length;i++){
    var r=used[i]; var hit=false;
    if(String(r[IDX.i]||'').trim()===String(sicil)) hit=true;
    if(String(r[IDX.j]||'').trim()===String(sicil)) hit=true;
    if(String(r[IDX.k]||'').trim()===String(sicil)) hit=true;
    if(!hit) continue;
    var t=_decideTypeByIDX(r,IDX);
    if(decisionType && decisionType!=='Toplam' && t!==decisionType) continue;
    rows.push(_rowToCaseObj(r,i));
  }
  if(rows.length===0){ if(window.toast){ window.toast({type:'warning',title:'Kayıt bulunamadı',body:'Bu sicile ait, seçili türde kayıt yok.'}); } return; }
  window.showCaseModal(rows, 'Sicil: '+sicil+(decisionType&&decisionType!=='Toplam'?' — '+decisionType:''));
}

/* ===============================
 * 5) Ek Özet (ikonlu + filtreye duyarlı)
 * =============================== */
function updateExtraSummaryByRows(rows, minD, maxD){
  try{
    var host=document.querySelector('.altsag')||document.querySelector('#altsag')||document.querySelector('[class*="altsag"]');
    if(!host) return;
    var sec=document.getElementById('extraSummary'); if(!sec){ sec=document.createElement('section'); sec.className='card summary-card'; sec.id='extraSummary'; host.appendChild(sec); }

    var eIdx=letterToIndex('E'); var dMin=null, dMax=null;
    for(var i=0;i<rows.length;i++){ var d=dateFromCell(rows[i][eIdx]); if(!d) continue; if(!dMin||d<dMin) dMin=d; if(!dMax||d>dMax) dMax=d; }
    if(minD) dMin=minD; if(maxD) dMax=maxD;

    // Savcı sicilleri L sütunundan
    var IDX=(window.__matrixSource||{}).IDX||{}; var L=IDX.l!=null?IDX.l:letterToIndex('L');
    var map={}, total=0;
    for(var r=0;r<rows.length;r++){ var s=String((rows[r]||[])[L]||'').trim(); if(!s) continue; map[s]=(map[s]||0)+1; total++; }

    var parts=[]; Object.keys(map).sort().forEach(function(sic){
      var c=map[sic];
      parts.push('<a href="#" class="extra-sicil-link" data-sicil="'+sic+'">'+sic+'</a> sicilli Cumhuriyet Savcısının <a href="#" class="extra-sicil-link" data-sicil="'+sic+'"><b>'+c+'</b></a> adet');
    });

    sec.innerHTML =
      '<h2><span class="material-symbols-rounded">article</span> Ek Özet</h2>'+
      '<p id="extraSummaryText">Veriler <b>'+fmtTR(dMin)+'</b> ile <b>'+fmtTR(dMax)+
      '</b> <u>(başlangıç ve bitiş günleri DAHİL)</u> tarihleri arasında, toplam <b>'+rows.length+
      '</b> dosya içermektedir; '+ (parts.length? parts.join(', ') : 'Cumhuriyet Savcısı sicili bulunamadı.') +' karara katıldığı görülmüştür.</p>'+
      '<small>Not: Cumhuriyet Savcısı sicilleri L sütunundan çözümlenir.</small>';

    sec.addEventListener('click', function(e){
      var a=e.target.closest('.extra-sicil-link'); if(!a) return;
      e.preventDefault(); openSavciModal(a.getAttribute('data-sicil'), null);
    });
  }catch(_){}
}

/* ===============================
 * 6) Yükleme Sonrası Uyarı (Hakimi olmayan)
 * =============================== */
function renderNoJudgeAlert_afterUpload(missingCount){
  try{
    var uploadCard=document.querySelector('.card.card-upload'); if(!uploadCard) return;
    if(typeof window.showAlert==='function'){
      window.showAlert({
        containerAfter: uploadCard,
        variant: 'danger',
        title: 'Hakim Bilgisi Eksik',
        body: 'Karar defterinde <b>'+missingCount+'</b> adet dosyada hakim sicili bulunamadı.',
        closable: true,
        link: { text: 'Eksikleri göster', onclick: function(){ window.showNoJudgeModal(); } }
      });
    }
  }catch(_){}
}

/* ===============================
 * 7) Excel İşlemleri + Rapor Render
 * =============================== */
(function(){
  function getLetterFromInput(id,fb){ var el=document.getElementById(id); var v=el&&el.value?(""+el.value).trim():""; return v||fb||""; }
  function getIDXFromSettings(){
    var map={ i:getLetterFromInput("col_i","I"), j:getLetterFromInput("col_j","J"), k:getLetterFromInput("col_k","K"),
      l:getLetterFromInput("col_l","L"), m:getLetterFromInput("col_m","M"), o:getLetterFromInput("col_o","O"),
      p:getLetterFromInput("col_p","P"), q:getLetterFromInput("col_q","Q"), t:getLetterFromInput("col_t","T"),
      z:getLetterFromInput("col_z","Z"), h:getLetterFromInput("col_h","H") /* H okunur ama KULLANILMAZ */ };
    var IDX={},k; for(k in map) IDX[k]=letterToIndex(map[k]); return IDX;
  }
  function allNumeric(arr){ var vals=[],i; for(i=0;i<arr.length;i++){ var v=arr[i]; if(nonEmpty(v)) vals.push(v); } if(vals.length===0) return false; for(i=0;i<vals.length;i++){ if(!(/^\s*\d+(,\d+|\.\d+)?\s*$/.test(String(vals[i])))) return false; } return true; }
  function uniqueNonEmpty(list){ var seen={},c=0,i,s; for(i=0;i<list.length;i++){ s=String(list[i]||"").trim(); if(s && !seen[s]){ seen[s]=1; c++; } } return c; }
  function updateKPIs(total,savciCount,hakimCount){ text($('#kpiTotal'),total); text($('#kpiSavci'),savciCount); text($('#kpiHakim'),hakimCount); }

  function buildResultCard(total,savciCount,hakimCount,info){
    // Karar sayfası yeni düzen: two-col-8-4 -> sol kolon .col-left
    var host=document.querySelector('.col-left')||document.querySelector('.altsol')||document.querySelector('#altsol')||document.querySelector('[class*="altsol"]'); if(!host) return;
    var card=document.getElementById('result-card'); if(!card){ card=document.createElement('section'); card.className='panel'; card.id='result-card'; host.appendChild(card); }
    card.innerHTML='<div class="panel-head" style="display:flex;align-items:center;gap:8px;"><span class="material-symbols-rounded">analytics</span><strong>Rapor Özeti</strong></div>';
  }

  function readAsArrayBuffer(file){
    return new Promise(function(resolve,reject){
      if(file.arrayBuffer){ file.arrayBuffer().then(resolve).catch(reject); return; }
      var r=new FileReader(); r.onload=e=>resolve(e.target.result); r.onerror=()=>reject(new Error('Dosya okunamadı')); r.readAsArrayBuffer(file);
    });
  }
  function readWorkbook(file){
    return readAsArrayBuffer(file).then(function(data){
      if(!window.XLSX||!XLSX.read) throw new Error('XLSX yüklenemedi.');
      var wb=XLSX.read(data,{type:'array'}); var ws=wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json(ws,{header:1,raw:false});
    });
  }
  function validateSameExtension(files){
    if(!files||files.length===0) return {ok:true,ext:null};
    function extOf(n){ var p=String(n).toLowerCase().split('.'); return p[p.length-1]; }
    var first=extOf(files[0].name);
    if(['xls','xlsx'].indexOf(first)===-1) return {ok:false,message:'Lütfen sadece .xls veya .xlsx seçin.'};
    for(var i=1;i<files.length;i++){ var e=extOf(files[i].name); if(e!==first) return {ok:false,message:'Aynı anda sadece tek format: ya .xls ya da .xlsx.'}; if(['xls','xlsx'].indexOf(e)===-1) return {ok:false,message:'Lütfen sadece .xls veya .xlsx seçin.'}; }
    return {ok:true,ext:first};
  }

  function renderNoJudgeAlert(noJudgeRows){
    var uploadCard=document.querySelector('.card.card-upload'); if(!uploadCard) return;
    if(!noJudgeRows||!noJudgeRows.length) return;
    renderNoJudgeAlert_afterUpload(noJudgeRows.length);
  }

  // --- ANA HESAPLAMA ---
  function computeFromRows(rows, filesCount){
    var IDX=getIDXFromSettings();
    var bIdx=letterToIndex('B'), cIdx=letterToIndex('C'), eIdx=letterToIndex('E');

    var used=[], i;
    for(i=0;i<rows.length;i++){
      var r=rows[i]; if(!r) continue;
      if(nonEmpty(r[bIdx]) && nonEmpty(r[cIdx]) && nonEmpty(r[eIdx])) used.push(r);
    }

    // Savcı sayısı (L)
    var savciList=[], s; for(s=0;s<used.length;s++){ var v=used[s][IDX.l]; if(nonEmpty(v)) savciList.push(v); }
    var savciCount=uniqueNonEmpty(savciList);

    // Hakim sayısı -> SADECE I,J,K
    var combined=[];
    for(var x=0;x<used.length;x++){ combined.push(used[x][IDX.i], used[x][IDX.j], used[x][IDX.k]); }
    var hakimCount=uniqueNonEmpty(combined);

    // Hakimi olmayan satırlar -> SADECE I,J,K’e bak
    var noJudgeRows=[], rix;
    for(rix=0; rix<used.length; rix++){
      var hasJudge = nonEmpty(used[rix][IDX.i]) || nonEmpty(used[rix][IDX.j]) || nonEmpty(used[rix][IDX.k]);
      if(!hasJudge) noJudgeRows.push(rix);
    }

    updateKPIs(used.length,savciCount,hakimCount);
    
    // Update kpiIslem counter from API
    fetch('https://sayac.657.com.tr/arttirkarar')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data && typeof data.adet !== 'undefined') {
          var adetRaw = data.adet * 1;
          var sayfasayac = nFormatter(adetRaw, 2);
          var kpiEl = document.getElementById('kpiIslem');
          if (kpiEl) kpiEl.innerHTML = sayfasayac;
        }
      })
      .catch(function(err) {
      });
    
    window.__matrixSource={used:used, IDX:IDX};
    buildResultCard(used.length,savciCount,hakimCount,'Seçilen dosya sayısı: '+filesCount+'. (Toplam, B+C+E dolu satırlardan.)');

    try{ renderDecisionMatrixV5(used, IDX); }catch(_){}

    window.__lastExcelRows=window.__lastExcelRows||{};
    window.__lastExcelRows.rowsUsed=used;
    window.__lastExcelRows.noJudgeRows=noJudgeRows;

    // Ek özet + İlk tarih aralığını kaydet (yalnızca referans)
    (function(){
      var minD=null,maxD=null;
      for(var r=0;r<used.length;r++){
        var d=dateFromCell(used[r][eIdx]); if(!d) continue;
        if(!minD||d<minD) minD=d; if(!maxD||d>maxD) maxD=d;
      }
      window.__initialDateRange = { min: minD, max: maxD };
      updateExtraSummaryByRows(used,minD,maxD);
    })();

    renderNoJudgeAlert(noJudgeRows);
  }
  window.computeFromRows=computeFromRows;

  function handleFiles(fileList){
    var files=[].slice.call(fileList||[]); if(files.length===0) return;
    window.__userExcelLoaded = true;
    var fileNames=files.map(f=>f&&f.name?f.name:'dosya').filter(Boolean);
    var ok=validateSameExtension(files); if(!ok.ok){ if(window.toast) window.toast({type:'error',title:'Yükleme hatası',body:ok.message||''}); else alert(ok.message||''); return; }
    var allRows=[];
    Promise.all(files.map(f=>readWorkbook(f))).then(resArr=>{
      for(var r=0;r<resArr.length;r++){
        var rows=resArr[r];
        for(var i=1;i<rows.length;i++){
          var row=rows[i], empty=true;
          for(var c=0;c<(row?row.length:0);c++){ if(nonEmpty(row[c])){ empty=false; break; } }
          if(!empty) allRows.push(row);
        }
      }
      window.__lastExcelRows=window.__lastExcelRows||{}; window.__lastExcelRows.rows=allRows; window.__lastExcelRows.files=files;
      computeFromRows(allRows, files.length);
      if(window.toast) window.toast({type:'success',title:'Yükleme tamam',body:fileNames.join(', ')+' başarıyla yüklendi — '+allRows.length+' satır işlendi'});
      document.dispatchEvent(new Event('excel-uploaded'));
    }).catch(err=>{
      if(window.toast) window.toast({type:'error',title:'Okuma hatası',body:(err&&err.message)||'Dosya okunamadı.'}); else alert((err&&err.message)||'Dosya okunamadı.');
    });
  }

  function recomputeFromSaved(){
    var s=window.__lastExcelRows;
    if(!s||!Array.isArray(s.rows)||s.rows.length===0){
      if(window.toast){ window.toast({type:'danger',title:'Excel yüklenmedi',body:'Lütfen önce bir veya daha fazla Excel dosyası yükleyin.',delay:5000}); }
      else alert('Önce Excel dosyası yükleyin.');
    } else {
      computeFromRows(s.rows,(s.files?s.files.length:1));
      try{
        var names=(s.files||[]).map(f=>f&&f.name?f.name:'dosya').join(', ');
        if(window.toast) window.toast({type:'info',title:'Yeniden hesaplama tamam',body:'Daha önce yüklenen şu dosyalar ('+names+') içindeki '+s.rows.length+' satır, Ayarlar’daki sütun ayarlarına göre tekrar hesaplandı.',delay:5000});
      }catch(_){}
    }
  }

  function ensureInputSetup(){
    var input=$('#excelInput'); if(!input) return null;
    input.setAttribute('accept','.xls,.xlsx'); input.setAttribute('multiple','true'); return input;
  }

  function wire(){
    var input=ensureInputSetup(); if(input) input.addEventListener('change',e=>handleFiles(e.target.files));
    var runBtn=$('#run'); if(runBtn) runBtn.addEventListener('click',recomputeFromSaved);
    
    // Prevent browser from opening dropped files
    var dropZone = $('#dropZone');
    if (dropZone) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, function(e) {
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });
      
      ['dragenter', 'dragover'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, function() {
          dropZone.classList.add('drag-over');
        }, false);
      });
      
      ['dragleave', 'drop'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, function() {
          dropZone.classList.remove('drag-over');
        }, false);
      });
      
      dropZone.addEventListener('drop', function(e) {
        var files = e.dataTransfer.files;
        if (files && files.length > 0) {
          handleFiles(files);
        }
      }, false);
    }
  }

  // === Rapor grid’i + filtre (tarih dahil, dd/mm/yyyy toast) ===
  window.renderDecisionMatrixV5=function(used,IDX){
    var eIdx=letterToIndex('E');


    function decideType(r){
      var o=toNum(r[IDX.o]), p=toNum(r[IDX.p]), t=toNum(r[IDX.t]), m=toNum(r[IDX.m]), q=toNum(r[IDX.q]), z=toNum(r[IDX.z]);
      if(o>0) return "Mahkumiyet";
      if(p>0) return "HAGB";
      if(t>0) return "Gör/Yet/Birleş";
      if(m>0) return "Beraat";
      if(q>0) return "Red";
      if(z>0) return "Tazminat";
      return "Düşme/Cvyo/Diğer";
    }

    // Kolonları SADECE I,J,K içeriğine göre oluştur
    var cols=[],seen={};
    for(var j=0;j<used.length;j++){
      var keys=getJudgeKeysForRow(used[j], IDX);
      for(var u=0;u<keys.length;u++){
        var key=String(keys[u]||"").trim();
        if(key && !seen[key]){ seen[key]=1; cols.push(key); }
      }
    }

    // İlk min/max referansı
    var minD=null,maxD=null;
    for(var r=0;r<used.length;r++){ var d=dateFromCell(used[r][eIdx]); if(!d) continue; if(!minD||d<minD) minD=d; if(!maxD||d>maxD) maxD=d; }

    function buildGrid(rows){
      var TYPES=["Mahkumiyet","Beraat","Düşme/Cvyo/Diğer","Zamanaşımı","HAGB","Gör/Yet/Birleş","Red","Tazminat"];
      var grid={}; TYPES.forEach(function(t){grid[t]={};}); grid["Toplam"]={};
      var EMPTY="__EMPTY__";
      for(var i=0;i<rows.length;i++){
        var r=rows[i], t=decideType(r), keys=getJudgeKeysForRow(r,IDX);
        if(keys.length===0) keys=[EMPTY];
        for(var u=0;u<keys.length;u++){ var k=keys[u]; grid[t][k]=(grid[t][k]||0)+1; }
      }
      var outCols=cols.slice();
      var hasEmpty=false; for(var ti in grid){ if(grid[ti][EMPTY]){ hasEmpty=true; break; } }
      if(hasEmpty) outCols.push(EMPTY);

      // aktif filtre varsa sıfır sütunları gizle + toast
      (function(){
        var sVal=(($('#startDate')||{}).value)||"", eVal=(($('#endDate')||{}).value)||"", sic=(($('#searchSicil')||{}).value)||"";
        var filtered=!!(sVal||eVal||sic.trim());
        if(filtered && window.toast){
          var parts=[];
          if(sVal||eVal){ parts.push("tarih aralığı ("+ fmtDMYstr(sVal||"") + " - " + fmtDMYstr(eVal||"") + ")"); }
          if(sic) parts.push("sicil ("+sic+")");
          window.toast({type:'info',title:'Filtre uygulandı',body:parts.length?('Filtre: '+parts.join(', ')):'Kriterlere göre filtre uygulandı.'});
        }
        if(!filtered) return;
        var keep=[]; for(var c=0;c<outCols.length;c++){ var key=outCols[c], sum=0; for(var t in grid){ if(t!=="Toplam") sum+=(grid[t][key]||0); } if(sum>0) keep.push(key); }
        if(keep.length) outCols=keep;
      })();

      grid["Toplam"]={}; outCols.forEach(function(k){ var s=0; for(var t in grid){ if(t!=="Toplam") s+=(grid[t][k]||0); } grid["Toplam"][k]=s; });
      return {grid:grid, columns:outCols, EMPTY_KEY:EMPTY};
    }

    function applyFilters(rows){
      var sEl=$('#startDate'), eEl=$('#endDate'), sicEl=$('#searchSicil');
      // GÜN BAŞI / GÜN SONU => dahil
      var sd=sEl&&sEl.value? new Date(sEl.value+'T00:00:00'):null;
      var ed=eEl&&eEl.value? new Date(eEl.value+'T23:59:59.999'):null;
      var sic = (sicEl? String(sicEl.value).trim(): '').toLocaleLowerCase('tr');

      var keep=[];
      for(var r=0;r<rows.length;r++){
        var rr=rows[r]; var d=dateFromCell(rr[eIdx]);
        if(sd && d && d<sd) continue;
        if(ed && d && d>ed) continue;

        if(sic){
          var keys=getJudgeKeysForRow(rr, IDX);
          var hit=false;
          for(var k=0;k<keys.length;k++){
            if(String(keys[k]).toLocaleLowerCase('tr').indexOf(sic)>-1){ hit=true; break; }
          }
          if(!hit) continue;
        }
        keep.push(rr);
      }
      return keep;
    }

    function render(){
      // KULLANICI TARİH GİRDİYSE KORU
      var prevSD = (document.getElementById('startDate') || {}).value || '';
      var prevED = (document.getElementById('endDate')   || {}).value || '';

      var rows=applyFilters(used);
      var built=buildGrid(rows);
      var grid=built.grid, outCols=built.columns, EMPTY=built.EMPTY_KEY;

      var card=document.getElementById("result-card"); if(!card) return;
      var body=document.createElement("div"); body.className="panel-body";

      // başlık ve araçlar
      var h='';
      h+='<div class="report-head"><div class="title-actions">';
      h+='<input id="searchSicil" type="text" placeholder="Sicil ara (örn: 139329)" style="width:200px">';
      h+='<button class="btn ghost" id="filterBtn">Filtrele</button>';
      h+='<button class="btn ghost" id="clearFilterBtn">Temizle</button>';
      h+='<button class="btn ghost" id="saveReportExcel">Kaydet (Excel)</button>';
      h+='</div></div>';
      h+='<div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">';

      var initialMin = (window.__initialDateRange && window.__initialDateRange.min) ? window.__initialDateRange.min : minD;
      var initialMax = (window.__initialDateRange && window.__initialDateRange.max) ? window.__initialDateRange.max : maxD;

      h+='<label for="startDate"><b>İlk tarih</b></label><input id="startDate" type="date" value="'+ (prevSD || fmtYMD(initialMin) || '') +'">';
      h+='<label for="endDate"><b>Son tarih</b></label><input id="endDate" type="date" value="'+ (prevED || fmtYMD(initialMax) || '') +'">';
      h+='<button id="dateFilterBtn" type="button" class="btn">Filtrele</button>';
  // Removed ghost style per design system – use solid btn
  h+='<button id="dateResetBtn" type="button" class="btn">Tümünü Göster</button>';
      h+='</div>';

      // tablo (scroll/drag destekli)
      h+='<div class="table-wrap"><table class="table" style="width:100%;border-collapse:collapse;"><thead><tr><th>Karar Türleri</th>';
      for(var i2=0;i2<outCols.length;i2++){
        var label=(outCols[i2]===EMPTY)?'(boş)':'(' + outCols[i2] + ')';
        var cls=(outCols[i2]===EMPTY)?' class="empty"':'';
        h+='<th'+cls+'>'+label+'</th>';
      }
      h+='</tr></thead><tbody>';
      var ORDER=["Mahkumiyet","Beraat","Düşme/Cvyo/Diğer","Zamanaşımı","HAGB","Gör/Yet/Birleş","Red","Tazminat","Toplam"];
      for(var rix=0; rix<ORDER.length; rix++){
        var rowT=ORDER[rix];
        h+='<tr><td>'+rowT+'</td>';
        for(var cix=0;cix<outCols.length;cix++){
          var key=outCols[cix]; var v=(grid[rowT]&&grid[rowT][key])?grid[rowT][key]:0;
          var tcls=(key===EMPTY)?' class="empty clickable"':' class="clickable"';
          h+='<td'+tcls+' data-type="'+rowT+'" data-col="'+key+'" onclick="cellClickHandler(this)">'+v+'</td>';
        }
        h+='</tr>';
      }
      h+='</tbody></table></div>';

      body.innerHTML=h;

      // body yerleşti -> inputları GERİ YAZ (sabit kalsın)
      var sdEl = document.getElementById('startDate'); if (prevSD && sdEl) sdEl.value = prevSD;
      var edEl = document.getElementById('endDate');   if (prevED && edEl) edEl.value = prevED;

      if (window.enableTableWrapDrag) window.enableTableWrapDrag();
      var old=card.querySelector('.panel-body'); if(old) old.replaceWith(body); else card.appendChild(body);

      // buton davranışları + Ek Özet’i filtreye göre güncelle
      var fBtn=$('#filterBtn'), clrBtn=$('#clearFilterBtn'), dBtn=$('#dateFilterBtn'), dReset=$('#dateResetBtn'), saveBtn=$('#saveReportExcel');

      function updateSummaryFor(currentRows){
        var md=null, xd=null;
        for(var i=0;i<currentRows.length;i++){ var d=dateFromCell(currentRows[i][eIdx]); if(!d) continue; if(!md||d<md) md=d; if(!xd||d>xd) xd=d; }
        updateExtraSummaryByRows(currentRows, md, xd);
      }

      if(fBtn) fBtn.onclick=function(){ render(); var filtered=applyFilters(used); updateSummaryFor(filtered); };
      if(dBtn) dBtn.onclick=function(){ render(); var filtered=applyFilters(used); updateSummaryFor(filtered); };
      if(clrBtn) clrBtn.onclick=function(){ var s=$('#searchSicil'); if(s) s.value=''; render(); updateExtraSummaryByRows(used, minD, maxD); };
      if(dReset) dReset.onclick=function(){ var sd=$('#startDate'), ed=$('#endDate'); if(sd) sd.value=''; if(ed) ed.value=''; render(); updateExtraSummaryByRows(used, minD, maxD); };
      if(saveBtn) saveBtn.onclick=function(){ if(!window.XLSX) return; var table=card.querySelector('table'); if(!table) return; var wb=XLSX.utils.book_new(); var ws=XLSX.utils.table_to_sheet(table); XLSX.utils.book_append_sheet(wb, ws, 'Rapor'); XLSX.writeFile(wb,'rapor.xlsx'); };

      // başlık (sicil) öneri
      (function setupSicilAutocomplete(){
        var input=document.getElementById('searchSicil'); if(!input) return;
        var dl=document.getElementById('sicilSuggestions'); if(!dl){ dl=document.createElement('datalist'); dl.id='sicilSuggestions'; document.body.appendChild(dl); }
        input.setAttribute('list','sicilSuggestions');
        function getHeaders(){
          var headers=[]; var t=document.querySelector('#result-card table')||document.querySelector('.report-table')||document.querySelector('table');
          if(!t) return headers;
          t.querySelectorAll('thead th').forEach(function(th){ var raw=(th.textContent||'').replace(/\s+/g,' ').trim(); var txt=normalizeHeaderLabel(raw); if(txt) headers.push(txt); });
          return Array.from(new Set(headers));
        }
        var headers=getHeaders();
        function refreshList(q){ dl.innerHTML=''; if(!q||q.length<1) return; var ql=q.toLocaleLowerCase('tr'); headers.filter(function(h){return h.toLocaleLowerCase('tr').includes(ql)}).slice(0,50).forEach(function(h){ var opt=document.createElement('option'); opt.value=h; dl.appendChild(opt); }); }
        input.addEventListener('input',function(e){ headers=getHeaders(); refreshList(e.target.value); });
        input.addEventListener('keydown',function(e){
          if(e.key==='Enter'){
            e.preventDefault();
            var val=normalizeHeaderLabel(input.value.trim());
            var ok=headers.some(function(h){return h.toLocaleLowerCase('tr')===val.toLocaleLowerCase('tr')});
            if(!ok){ if(window.toast) window.toast({type:'error',title:'Başlık bulunamadı',body:'Girdiğiniz "'+val+'" sütun başlıkları arasında yok.'}); else alert('Başlık yok'); return; }
            if(fBtn) fBtn.click();
          }
        });
      })();
    }

    // === Masaüstü/mobil yatay sürükleme (drag to scroll) ===
    (function enableHorizontalDrag(){
      window.enableTableWrapDrag = function(){
        var wrap = document.querySelector('#result-card .table-wrap');
        if(!wrap) return;
        if(wrap.__dragBound) return; 
        wrap.__dragBound = true;

        let isDown = false, startX = 0, scrollLeft = 0;

        wrap.style.overflowX = 'auto';
        wrap.addEventListener('mousedown', function(e){
          isDown = true;
          wrap.classList.add('grabbing');
          startX = e.pageX - wrap.offsetLeft;
          scrollLeft = wrap.scrollLeft;
        });
        wrap.addEventListener('mouseleave', function(){
          isDown = false;
          wrap.classList.remove('grabbing');
        });
        wrap.addEventListener('mouseup', function(){
          isDown = false;
          wrap.classList.remove('grabbing');
        });
        wrap.addEventListener('mousemove', function(e){
          if(!isDown) return;
          e.preventDefault();
          const x = e.pageX - wrap.offsetLeft;
          const walk = (x - startX);
          wrap.scrollLeft = scrollLeft - walk;
        });

        wrap.setAttribute('role','region');
        wrap.setAttribute('aria-label','Rapor tablosu yatay kaydırma');
      };
    })();

    render();
  };

  function startWhenReady(){
    function start(){ wire(); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }
  startWhenReady();
})();

/* ===============================
 * 8) Sayaç + Örnek Excel + kpiIslem
 * =============================== */

// Kısaltma
function nFormatter(num, digits){
  var si = [
    {v: 1E9, s: "B"},   // milyar
    {v: 1E6, s: "M"},   // milyon
    {v: 1E3, s: "B."},  // bin
    {v: 1,   s: ""}
  ];
  var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  num = Number(num)||0;
  for (var i = 0; i < si.length; i++) {
    if (num >= si[i].v) return (num / si[i].v).toFixed(digits).replace(rx, "$1") + si[i].s;
  }
  return String(num);
}

// kanca
window.kpiIslem = function(sayfaSayacAdet){
  try{
    // Genişletilebilir kanca
  }catch(_){}
};

// Kullanıcı Excel yüklerse örnek veriyi iptal için bayrak
window.__userExcelLoaded = window.__userExcelLoaded || false;
document.addEventListener('excel-uploaded', function(){ window.__userExcelLoaded = true; });

function loadExampleExcelAndRender(_sayfaSayacRaw){
  if (window.__userExcelLoaded) return;

  fetch('./data/ornek.xls').then(function(res){
    if(!res.ok) throw new Error('Örnek excel bulunamadı.');
    return res.arrayBuffer();
  }).then(function(buf){
    if (!window.XLSX || !XLSX.read) throw new Error('XLSX kütüphanesi hazır değil.');
    var wb = XLSX.read(buf, { type: 'array' });
    var ws = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:false });

    var allRows = [];
    for (var i=1;i<rows.length;i++){
      var row = rows[i];
      var empty = true;
      for (var c=0;c<(row?row.length:0);c++){
        if (row[c] != null && String(row[c]).trim() !== '') { empty=false; break; }
      }
      if (!empty) allRows.push(row);
    }

    if (typeof window.computeFromRows === 'function') {
      window.computeFromRows(allRows, 1);
    }
    window.kpiIslem(_sayfaSayacRaw || 0);

    if (window.toast) {
      window.setTimeout(function(){
        window.toast({
          type: 'warning',
          title: 'Örnek veri',
          body: 'Ekranda görmekte olduğunuz veriler test amaçlıdır. UYAP > Raporlar > Defterler > Defter Sorgu > Karar Defterini Excel formatında yüklediğinizde gerçek verileriniz işlenecektir.',
          delay: 10000
        });
      }, 10000);
    }
  }).catch(function(_e){
    // sessiz
  });
}

function initSayacAndExample(){
  if (!window.jQuery || !jQuery.getJSON) {
    loadExampleExcelAndRender(0);
    return;
  }
  jQuery.getJSON('https://sayac.657.com.tr/arttirkarar', function(response) {
    try {
      var adetRaw = (response && typeof response.adet !== 'undefined') ? (response.adet*1) : 0;
      var sayfasayac = nFormatter(adetRaw, 2);
      var kpiEl = document.getElementById('kpiIslem');
      if(kpiEl) kpiEl.innerHTML = sayfasayac;
      loadExampleExcelAndRender(adetRaw);
    } catch (e) {
      loadExampleExcelAndRender(0);
    }
  }).fail(function() {
    loadExampleExcelAndRender(0);
  });
}
// initSayacAndExample(); // Removed: no longer auto-loading ornek.xls on page load
