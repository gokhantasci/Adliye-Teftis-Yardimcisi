(function(){
  'use strict';
  function norm(s){ return String(s == null ? '' : s).trim(); }
  function lc(s){ s = norm(s); s = s.replace(/İ/g,'i').replace(/I/g,'ı').toLowerCase(); return s; }
  function resolveSicilKey(sic){
    if (!window.G || !G.perSicil) return sic;
    if (G.perSicil[sic]) return sic;
    const keys = Object.keys(G.perSicil);
    const sNum = norm(sic).replace(/^0+/, '');
    const sLc  = lc(sic);
    for (let i = 0;i < keys.length;i++){
      const k = keys[i];
      if (k === sic) return k;
      if (norm(k).replace(/^0+/, '') === sNum) return k;
      if (lc(k) === sLc) return k;
    }
    return sic;
  }
  function resolveTypeKey(type, map){
    if (!type || type === '__ALL__') return '__ALL__';
    if (map[type]) return type;
    const tLc = lc(type);
    const keys = Object.keys(map || {});
    for (let i = 0;i < keys.length;i++){ if (lc(keys[i]) === tLc) return keys[i]; }
    for (let j = 0;j < keys.length;j++){
      const nk = lc(keys[j]);
      if (nk.indexOf(tLc) !== -1 || tLc.indexOf(nk) !== -1) return keys[j];
    }
    if (tLc === 'toplam' || tLc === 'genel toplam' || tLc === 'hepsi') return '__ALL__';
    return type;
  }
  window.openJudgeModalFromCell = function(td){
    const sicilRaw = norm(td && td.dataset && (td.dataset.col || td.dataset.sicil));
    const typeRaw  = norm(td && td.dataset && td.dataset.type);
    const textVal  = norm(td && td.textContent);
    const count    = parseInt(textVal, 10);
    if (!sicilRaw){ if (window.toast) toast({type:'warning', title:'Eksik Veri', body:'Sicil bulunamadı.', delay:2500}); return; }
    if (!count || count <= 0){ if (window.toast) toast({type:'info', title:'Bilgi', body:'Bu tablo herhangi bir veri barındırmıyor.', delay:2500}); return; }
    if (!window.G || !Array.isArray(G.rows) || !G.perSicil){ if (window.toast) toast({type:'warning', title:'Hazır Değil', body:'Rapor haritası yok (G.perSicil).', delay:2500}); return; }
    if (typeof window.openModal !== 'function'){ if (window.toast) toast({type:'error', title:'Hata', body:'openModal bulunamadı.', delay:2500}); return; }
    const sicil = resolveSicilKey(sicilRaw);
    const map   = G.perSicil[sicil];
    if (!map){ if (window.toast) toast({type:'info', title:'Bilgi', body:'Bu sicile ait kayıt yok.', delay:2500}); return; }
    const tk = resolveTypeKey(typeRaw, map);
    let rowIdxs = [];
    if (tk === '__ALL__'){
      const keys = (window.TYPES_ORDER && TYPES_ORDER.length) ? TYPES_ORDER.filter(function(k){return map[k];}) : Object.keys(map);
      for (let i = 0;i < keys.length;i++){
        const a = map[keys[i]];
        if (Array.isArray(a)) rowIdxs = rowIdxs.concat(a);
      }
    } else {
      rowIdxs = map[tk] || [];
    }
    if (!rowIdxs.length){ if (window.toast) toast({type:'info', title:'Bilgi', body:'Kayıt bulunamadı.', delay:2500}); return; }
    const title = sicil + ' - ' + (tk === '__ALL__' ? 'Toplam' : (typeRaw || tk));
    window.openModal(rowIdxs, title);
  };
})();
