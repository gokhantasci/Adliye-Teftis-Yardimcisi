(function(){
  "use strict";
  // letterToIndex is now in utils.js - use window.letterToIndex
  function pick(row, keys){
    if (!row) return "";
    var map = { B: window.letterToIndex("B"), C: window.letterToIndex("C"), E: window.letterToIndex("E") };
    for (var i=0;i<keys.length;i++){
      var k = keys[i];
      if (Array.isArray(row) && (k in map)){
        var v = row[map[k]];
        if (v != null && String(v).trim() !== "") return String(v).trim();
      } else if (row && typeof row === "object"){
        for (var kk in row){
          if (Object.prototype.hasOwnProperty.call(row, kk) && kk.toLowerCase() === k.toLowerCase()){
            var v2 = row[kk];
            if (v2 != null && String(v2).trim() !== "") return String(v2).trim();
          }
        }
      }
    }
    return "";
  }
  function getSicil(r){ return pick(r, ["sicil","hakimId","hakimSicil","hukumHakimBaskanPId"]); }
  function getType(r){  return pick(r, ["type","tur","kararTuru","KararTuru"]); }
  function pushIndex(map, sicil, type, idx){
    if(!sicil) return;
    var s = String(sicil).trim();
    var t = type ? String(type).trim() : "";
    if (!map[s]) map[s] = {};
    if (!map[s][t]) map[s][t] = [];
    map[s][t].push(idx);
  }
  function buildGlobalG(rows){
    window.G = { rows: Array.isArray(rows) ? rows : [], perSicil: {} };
    for (var i=0;i<G.rows.length;i++){
      var r = G.rows[i];
      var sicil = getSicil(r);
      var type  = getType(r) || "";
      pushIndex(G.perSicil, sicil, type, i);
    }
    if (!window.TYPES_ORDER || !Array.isArray(window.TYPES_ORDER) || window.TYPES_ORDER.length===0){
      var found = {};
      for (var s in G.perSicil){
        var map = G.perSicil[s];
        for (var t in map){ if (t) found[t] = 1; }
      }
      window.TYPES_ORDER = Object.keys(found);
    }
    if (!window.modalClick) window.modalClick = {};
    window.modalClick.rows = (rows || []).map(function(r){
      return {
        sicil: getSicil(r),
        type:  getType(r),
        B:     pick(r,["B","No","numara"]),
        C:     pick(r,["C","esasNo","esas_no"]),
        E:     pick(r,["E","yil","kararYili"])
      };
    });
  }
  window.buildGlobalG = buildGlobalG;
  // letterToIndex is already in utils.js - keeping this line for backward compatibility only
  window.letterToIndex = window.letterToIndex || window.TeftisUtils.letterToIndex;
})();
