(function(){
  if (window.__xlsxLoaderInit) return; window.__xlsxLoaderInit = true;
  function load(src){
    return new Promise(function(resolve,reject){
      var s=document.createElement('script'); s.src=src; s.async=true;
      s.onload=function(){ resolve(src); }; s.onerror=function(){ reject(new Error('Yüklenemedi: '+src)); };
      document.head.appendChild(s);
    });
  }
  function ready(ok){ try{ document.dispatchEvent(new CustomEvent('xlsx-ready',{detail:{ok:!!ok}})); }catch(e){} }
  function hasX(){ return !!(window.XLSX && typeof XLSX.read==='function'); }
  if (hasX()) { ready(true); return; }
  load('/assets/js/xlsx.full.min.js').catch(function(){}).then(function(){
    if (hasX()) { ready(true); return; }
    return load('https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js').then(function(){
      ready(hasX());
    }).catch(function(){
      ready(false);
    });
  });
})();
