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
    - Sol: Haber/Güncelleme kartı
    - Sağ: E-posta bırakma kartı
  -->
  <section class="cards cards--2">
    
    <!-- ============ HABER/GÜNCELLEME KARTI ============ -->
    <article class="card news-drop" id="newsCard" role="region" aria-labelledby="newsTitle">
      <div class="news-drop__body">
        <!-- Haber ikonu -->
        <div class="news-drop__icon" aria-hidden="true">📰</div>
        
        <div class="news-drop__texts">
          <!-- Kart başlığı -->
          <h3 id="newsTitle" class="news-drop__title">Uygulama Güncellemeleri / Haber</h3>
          <p class="news-drop__hint">Platformdaki duyuru ve değişiklikler.</p>
          
          <!-- Haber içeriği bölümü -->
          <div class="news-drop__content">
            <!-- Meta bilgiler (toplam haber sayısı, son güncelleme tarihi) -->
            <div id="newsMeta" class="news-meta muted" aria-live="polite"></div>
            
            <!-- Haber listesi (JavaScript ile dinamik doldurulur) -->
            <div id="newsList" class="news-list"></div>
          </div>
        </div>
      </div>
    </article>
    
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
            <!-- 
              E-posta input alanı
              Sadece @adalet.gov.tr uzantılı e-postalar kabul edilir
              Sürükle-bırak (drag & drop) özelliği desteklenir
            -->
            <input 
              id="mailDropInput" 
              type="email" 
              placeholder="ab139329@adalet.gov.tr" 
              autocomplete="email" 
              inputmode="email" 
              aria-label="E-posta adresi">
            
            <!-- Gönder butonu (başlangıçta devre dışı) -->
            <button id="mailDropSendBtn" class="btn btn-primary" type="button" disabled>
              Mesajı Gönder
            </button>
          </div>
          
          <!-- Toast mesajları için alan (başarı/hata mesajları) -->
          <div id="mailDropToast" class="mail-drop__toast" aria-live="polite"></div>
          
          <!-- 
            Honeypot alanı (bot koruması için)
            Gerçek kullanıcılar bu alanı görmez ve doldurmaz
            Botlar doldurursa form reddedilir
          -->
          <input 
            id="mailHp" 
            class="hp" 
            type="text" 
            aria-hidden="true" 
            tabindex="-1" 
            autocomplete="off" 
            style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;" />
          
          <!-- E-posta önizleme alanı (debug/test için, normalde gizli) -->
          <div class="mail-drop__preview">
            <pre id="mailPreview" class="mail-drop__pre" aria-hidden="true" hidden></pre>
          </div>
          
          <!-- 
            Sayfalama kontrolü (haber kartı için)
            Not: Bu alan mail kartında yer alıyor ama aslında haber kartı için
            Bu bir düzen hatası olabilir, düzeltilmesi gerekebilir
          -->
          <nav id="newsPager" class="pager" role="navigation" aria-label="Haber sayfalama"></nav>
        </div>
      </div>
    </article>
    
  </section>
</main>

<!-- Ortak footer'ı dahil et -->
<?php include __DIR__."/partials/footer.php"; ?>
