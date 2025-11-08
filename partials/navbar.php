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

