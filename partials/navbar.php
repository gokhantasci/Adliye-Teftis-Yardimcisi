<!--
  ========================================
  ÜST GEZİNME ÇUBUĞU (NAVBAR.PHP)
  ========================================
  Sayfanın en üstünde sabit (sticky) konumda duran navbar
  İçerik:
  - Sol: Menü açma butonu (mobilde sidebar açar)
  - Orta: Logo ve site başlığı  
  - Sağ: Tema değiştirme butonu (koyu/açık)
  ========================================
-->
<header class="navbar">
  <!-- Sidebar açma/kapama butonu (özellikle mobil cihazlarda kullanılır) -->
  <button id="sidebarToggle" class="icon-btn" aria-label="Menüyü aç/kapat">
    <span class="material-symbols-rounded">menu</span>
  </button>
  
  <!-- Marka/Logo bölümü -->
  <div class="brand">
    <!-- SVG logo ikonu -->
    <img src="/assets/img/favicon.svg" alt="" width="24" height="24" />
    <!-- Site başlığı -->
    <span class="brand-title">Teftiş - 657.com.tr</span>
  </div>
  
  <!-- Navbar sağ taraf işlem butonları -->
  <div class="navbar-actions">
    <!-- Log Kayıtları Butonu -->
    <button id="logToggle" class="icon-btn" aria-label="Log kayıtlarını göster" title="Log Kayıtları">
      <span class="material-symbols-rounded" aria-hidden="true">list_alt</span>
    </button>
    <!-- 
      Tema değiştirme butonu
      JavaScript (app.js) ile kontrol edilir
      Koyu tema ↔ Açık tema geçişi yapar
      İkon otomatik olarak güncellenir (dark_mode / light_mode)
    -->
    <button id="themeToggle" class="icon-btn" aria-label="Tema değiştir">
      <span class="material-symbols-rounded" id="themeIcon">dark_mode</span>
    </button>
  </div>
  
</header>

<!-- Log Kayıtları Paneli -->
<div id="logPanel" class="log-panel" hidden>
  <div class="log-panel-head">
    <span class="material-symbols-rounded" aria-hidden="true">list_alt</span>
    <strong>Log Kayıtları</strong>
    <button type="button" class="log-clear-btn" id="logClearBtn" aria-label="Logları temizle">
      <span class="material-symbols-rounded" aria-hidden="true">delete</span>
    </button>
  </div>
  <div class="log-panel-body" id="logPanelBody" aria-live="polite"></div>
  <div class="log-panel-foot">
    <div class="pager" id="logPager" aria-label="Log sayfalama">
      <div>
        <button type="button" class="btn ghost" id="logPrevBtn">Önceki</button>
      </div>
      <div class="muted" id="logPagerInfo">Sayfa 1/1 — 0 kayıt</div>
      <div>
        <button type="button" class="btn ghost" id="logNextBtn">Sonraki</button>
      </div>
    </div>
    <small id="logStats" class="muted">0 kayıt</small>
  </div>
</div>

