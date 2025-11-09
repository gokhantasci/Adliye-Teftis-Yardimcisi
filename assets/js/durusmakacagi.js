(() => {
  'use strict';
  if (window.__durusmaBooted) return; window.__durusmaBooted = true;

  const btn = document.getElementById('downloadDurusmaBtn');
  const statusEl = document.getElementById('durusmaStatus');

  function toast(type,title,body){
    if (typeof window.toast === 'function') window.toast({type,title,body});
    else console[type === 'danger' ? 'error' : type === 'warning' ? 'warn' : 'log'](`${title}: ${body}`);
  }

  async function downloadTemplate(){
    if (!btn) return;
    btn.disabled = true; btn.classList.add('busy');
    statusEl && (statusEl.textContent = 'İndiriliyor…');
    // Direct access to /data is forbidden by .htaccess; use secure API endpoint
    const url = '/api/dursusma_template.php';
    try {
      const res = await fetch(url, { method:'GET' });
      if (!res.ok){ throw new Error('Sunucu yanıtı başarısız (' + res.status + ')'); }
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl; a.download = '3- DURUŞMA KAÇAĞI KONTROLÜ.docx';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
      toast('success','İndirildi','Şablon dosyası indiriliyor.');
      statusEl && (statusEl.textContent = 'İndirme başlatıldı.');
    } catch (e){
      toast('danger','Hata', String(e));
      statusEl && (statusEl.textContent = 'İndirme başarısız: ' + e.message);
    } finally {
      btn.disabled = false; btn.classList.remove('busy');
    }
  }

  btn?.addEventListener('click', downloadTemplate);
})();
