<?php
  /**
   * ========================================
   * ANA SAYFA (INDEX.PHP)
   * ========================================
   * 
   * Panel / Dashboard Sayfası
   * 
   * Bu sayfa uygulamanın ana ekranıdır ve şu bileşenleri içerir:
   * 1. Uygulama güncellemeleri ve haber kartı
   * 2. E-posta bırakma kutusu (Mail Drop)
   * 3. (Opsiyonel) Kişisel notlar bölümü
   * 
   * Özellikler:
   * - 2 sütunlu responsive grid düzeni
   * - Dinamik haber yükleme (JSON'dan)
   * - E-posta doğrulama ve gönderme
   * - LocalStorage ile veri saklama
   * 
   * @author Gökhan TAŞCI
   * @version 1.0
   * ========================================
   */
  
  // Sayfa başlığını ayarla (header.php'de kullanılacak)
  $active = "dashboard";
  
  // Ortak header, navbar ve sidebar'ı dahil et
  include __DIR__."/partials/header.php";
  include __DIR__."/partials/navbar.php";
  include __DIR__."/partials/sidebar.php";
?>

<!-- Ana içerik alanı -->
<main class="content">
  <!-- Sayfa başlığı bölümü -->
  <div class="page-header">
    <h1>Panel</h1>
    <p class="muted">Uygulama güncellemeleri ve e-posta bırakma kutusu</p>
  </div>
  
  <!-- 
    İki sütunlu kart düzeni
    - Sol: E-posta bırakma kartı
    - Sağ: Haber/Güncelleme kartı
  -->
  <section class="cards cards--2">
    
    <!-- ============ E-POSTA BIRAKMA KUTUSU ============ -->
    <article class="card mail-drop" id="mailDropBox" role="region" aria-labelledby="mailDropTitle">
      <div class="mail-drop__body">
        <!-- Mail ikonu -->
        <div class="mail-drop__icon" aria-hidden="true">✉️</div>
        
        <div class="mail-drop__texts">
          <!-- Kart başlığı -->
          <h3 id="mailDropTitle" class="mail-drop__title">E-posta Adresini bırak</h3>
          <p class="mail-drop__hint">Buraya e-posta adresini <b>bırak</b>, sana site adresini mail atalım.</p>
          
          <!-- E-posta giriş formu -->
          <div class="mail-drop__input">
            <input 
              id="mailDropInput" 
              type="email" 
              placeholder="ab139329@adalet.gov.tr" 
              autocomplete="email" 
              inputmode="email" 
              aria-label="E-posta adresi">
            
            <button id="mailDropSendBtn" class="btn btn-primary" type="button" disabled>
              Mesajı Gönder
            </button>
          </div>
          
          <div id="mailDropToast" class="mail-drop__toast" aria-live="polite"></div>
          
          <input 
            id="mailHp" 
            class="hp" 
            type="text" 
            aria-hidden="true" 
            tabindex="-1" 
            autocomplete="off" 
            style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;" />
          
          <div class="mail-drop__preview">
            <pre id="mailPreview" class="mail-drop__pre" aria-hidden="true" hidden></pre>
          </div>
        </div>
      </div>
    </article>
    
    <!-- ============ HABER/GÜNCELLEME KARTI ============ -->
    <article class="card news-drop" id="newsCard" role="region" aria-labelledby="newsTitle">
      <div class="news-drop__body">
        <div class="news-drop__icon" aria-hidden="true">📰</div>
        
        <div class="news-drop__texts">
          <h3 id="newsTitle" class="news-drop__title">Uygulama Güncellemeleri / Haber</h3>
          <p class="news-drop__hint">Platformdaki duyuru ve değişiklikler.</p>
          
          <div class="news-drop__content">
            <div id="newsMeta" class="news-meta muted" aria-live="polite"></div>
            <div id="newsList" class="news-list"></div>
          </div>
          
          <nav id="newsPager" class="pager" role="navigation" aria-label="Haber sayfalama"></nav>
        </div>
      </div>
    </article>
    
  </section>

  <!-- ============ HAKKINDA KARTI ============ -->
  <section class="cards cards--1" style="margin-top: 24px;">
    <article class="card" id="aboutCard" role="region" aria-labelledby="aboutTitle">
      <div class="card-body" style="padding: 24px;">
        <h3 id="aboutTitle" style="display:flex;align-items:center;gap:8px;margin:0 0 16px 0;">
          <span class="material-symbols-rounded">info</span>
          Hakkında
        </h3>
        <div id="aboutContent" class="about-content" style="line-height:1.8;">
          <p class="muted">Yükleniyor...</p>
        </div>
      </div>
    </article>
  </section>
</main>

<script src="/assets/js/about-loader.js" defer></script>

<!-- Ortak footer'ı dahil et -->
<?php include __DIR__."/partials/footer.php"; ?>
