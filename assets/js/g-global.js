(function(){
  'use strict';
  // letterToIndex is now in utils.js - use window.letterToIndex
  function pick(row, keys){
    if (!row) return '';
    const map = { B: window.letterToIndex('B'), C: window.letterToIndex('C'), E: window.letterToIndex('E') };
    for (let i = 0;i < keys.length;i++){
      const k = keys[i];
      if (Array.isArray(row) && (k in map)){
        const v = row[map[k]];
        if (v != null && String(v).trim() !== '') return String(v).trim();
      } else if (row && typeof row === 'object'){
        for (const kk in row){
          if (Object.prototype.hasOwnProperty.call(row, kk) && kk.toLowerCase() === k.toLowerCase()){
            const v2 = row[kk];
            if (v2 != null && String(v2).trim() !== '') return String(v2).trim();
          }
        }
      }
    }
    return '';
  }
  function getSicil(r){ return pick(r, ['sicil','hakimId','hakimSicil','hukumHakimBaskanPId']); }
  function getType(r){  return pick(r, ['type','tur','kararTuru','KararTuru']); }
  function pushIndex(map, sicil, type, idx){
    if (!sicil) return;
    const s = String(sicil).trim();
    const t = type ? String(type).trim() : '';
    if (!map[s]) map[s] = {};
    if (!map[s][t]) map[s][t] = [];
    map[s][t].push(idx);
  }
  function buildGlobalG(rows){
    window.G = { rows: Array.isArray(rows) ? rows : [], perSicil: {} };
    for (let i = 0;i < G.rows.length;i++){
      const r = G.rows[i];
      const sicil = getSicil(r);
      const type  = getType(r) || '';
      pushIndex(G.perSicil, sicil, type, i);
    }
    if (!window.TYPES_ORDER || !Array.isArray(window.TYPES_ORDER) || window.TYPES_ORDER.length === 0){
      const found = {};
      for (const s in G.perSicil){
        const map = G.perSicil[s];
        for (const t in map){ if (t) found[t] = 1; }
      }
      window.TYPES_ORDER = Object.keys(found);
    }
    if (!window.modalClick) window.modalClick = {};
    window.modalClick.rows = (rows || []).map(function(r){
      return {
        sicil: getSicil(r),
        type:  getType(r),
        B:     pick(r,['B','No','numara']),
        C:     pick(r,['C','esasNo','esas_no']),
        E:     pick(r,['E','yil','kararYili'])
      };
    });
  }
  window.buildGlobalG = buildGlobalG;
  // letterToIndex is already in utils.js - keeping this line for backward compatibility only
  window.letterToIndex = window.letterToIndex || window.TeftisUtils.letterToIndex;
})();
