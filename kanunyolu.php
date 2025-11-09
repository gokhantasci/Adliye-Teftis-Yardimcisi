<?php
  /**
   * KANUN YOLU KONTROLÜ
   * Duruşma Kaçağı sayfasının sade bir türevi; Excel yükleme yerine mevcut kayıtlar/rapor mantığı.
   * JS dosyası: /assets/js/kanunyolu.js (ozet tablo, KPI, filtreler)
   * Bu sayfada JS'in beklediği DOM iskeleleri (ID'ler) hazırlanır:
   *  - #dropZone, #fileInput, #selectedFilesHint (yükleme alanı)
   *  - #cardAltSol (KPI kartlarını JS doldurur)
   *  - #cardUstSol .panel-body (Karar Türleri paneli için)
   *  - #raporOzetBody (Daire / özet tabloları için gövde)
   *  - #gokhan (bazı ek panellerin referans noktası)
   */
  $pageTitle = 'Kanun Yolu Kontrolü';
  $active = 'kanun_yolu';
  include __DIR__.'/partials/header.php';
  include __DIR__.'/partials/navbar.php';
  include __DIR__.'/partials/sidebar.php';
?>
<main class="content" id="main-content">
  <header class="page-header">
    <h1>Kanun Yolu Kontrolü</h1>
    <p class="muted">İstinaf / Yargıtay süreçleri için UYAP kayıtları üzerinden tetkik notları ve yönlendirmeler.</p>
  </header>

  <!-- Bilgi Paneli -->
  <section style="display:flex;justify-content:center;align-items:flex-start;padding:20px 0;">
    <div class="panel" style="max-width:860px;width:100%;">
      <div class="panel-head" style="justify-content:center;">
        <div class="card-title" style="display:flex;align-items:center;gap:8px;">
          <span class="material-symbols-rounded">info</span>
          <strong>Bilgi</strong>
        </div>
      </div>
      <div class="panel-body" style="font-size:15px;line-height:1.6;">
        <p>Teftişlerde <strong>Kanun Yolu</strong> için herhangi bir Excel dosyası gönderilmediği için kayıtların <b>UYAP üzerinden tetkiki</b> gerekmektedir.</p>
  <p><b>1-  Karar kesin olmasına veya öngörülen süre dolmasına rağmen kanun yolu merciine (Yargıtay veya Bölge Adliye Mahkemesi) gönderilen dosyalar</b><br>
  Bu madde için sitede bulunan <a href="/istinaf.php" class="link">İstinaf</a> menüsünü kullanabilirsiniz.</p>
  <p><b>2-  Kanun yolu merciine (Yargıtay veya Bölge Adliye Mahkemesi) henüz gönderilmeyen dosyalar;</b><br>
  Bu madde için yine <a href="/istinaf.php" class="link">İstinaf</a> menüsünü kullanabilirsiniz.</p>
  <p><b>3-  Kanun yolu merciine (Yargıtay veya Bölge Adliye Mahkemesi) geç gönderilen dosyalar;</b><br>
  Bu madde için <a href="/istinaf.php" class="link">İstinaf</a> menüsü içerisinde yer alan <b>Özet Tablo</b>dan faydalanabilirsiniz.</p>
        <p><b>4-  Kanun yolu (Yargıtay veya Bölge Adliye Mahkemesi) incelemesi için görevli dairenin hatalı belirlendiği dosyalar;</b><br>
        Ceza Mahkemelerinde görevli daire seçimi yapılmadığı için dosyalar otomatik tevzi edilmektedir; bu tablo genellikle boş olur. Ancak İstinaf çevreniz yeni değişmiş ve dosya evvelce başka İstinaf Mahkemesinde incelenmiş ise sehven yeni İstinaf Mahkemesine gönderilen dosyalar yazılmalıdır.</p>
        <div style="margin-top:24px;text-align:center">
          <button class="btn" id="downloadKanunYoluBtn" type="button" style="display:inline-flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded">download</span>
            <span>Şablonu İndir</span>
          </button>
        </div>
        <div id="kanunYoluStatus" class="muted" style="margin-top:12px;text-align:center"></div>
      </div>
    </div>
  </section>

  <!-- JS'in ihtiyaç duyduğu iskelet alanlar (gizli / boş başlangıç) -->
  <section style="display:none;" aria-hidden="true">
    <div id="dropZone" class="placeholder" style="padding:12px;border:1px dashed var(--border);text-align:center;cursor:pointer;">
      Kanun Yolu için XLS yükleme beklenmiyor.
    </div>
    <input id="fileInput" type="file" multiple accept=".xls,.xlsx" hidden>
    <div id="selectedFilesHint" class="muted" style="margin-top:4px;"></div>
  </section>

  <section style="display:none;" aria-hidden="true">
    <div id="cardAltSol" class="card">
      <div class="card-body"></div>
    </div>
    <div id="cardUstSol" class="panel"><div class="panel-body"></div></div>
    <div id="raporOzetBody"></div>
    <div id="gokhan"></div>
  </section>
</main>

<script>
document.addEventListener('DOMContentLoaded', function(){
  const btn = document.getElementById('downloadKanunYoluBtn');
  if (btn){
    btn.addEventListener('click', function(){
      try {
        const a = document.createElement('a');
        a.href = '/kanunyolu.docx'; // Sunucuda saklanan dosya adı
        a.download = '6- KANUN YOLU KONTROLÜ.docx'; // İndirilen dosya adı
        document.body.appendChild(a); a.click(); a.remove();
        window.toast?.({ type:'success', title:'İndiriliyor', body:'Kanun Yolu şablonu indiriliyor.' });
      } catch(e){ window.toast?.({ type:'warning', title:'Hata', body:'Şablon indirilemedi.' }); }
    });
  }
});
</script>
<script src="/assets/js/jszip.min.js"></script>
<script src="/assets/js/xlsx-loader.js"></script>
<script src="/assets/js/kanunyolu.js?v=1"></script>
<?php include __DIR__.'/partials/footer.php'; ?>
