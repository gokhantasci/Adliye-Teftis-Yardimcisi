<!--
  ========================================
  ORTAK BAŞLIK ŞABLONU (HEADER.PHP)
  ========================================
  Tüm sayfalarda kullanılan ortak HTML başlığı ve meta bilgileri
  Bu dosya her PHP sayfasının başında include edilir
  ========================================
-->
<!doctype html>
<html lang="tr">
<head>
  <!-- Karakter seti: Türkçe karakterler için UTF-8 -->
  <meta charset="utf-8" />
  
  <!-- Responsive tasarım için viewport ayarı -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  
  <!-- SEO ve sosyal medya meta etiketleri -->
  <meta name="description" content="Adliye teftiş işlemlerini kolaylaştırmak ve hızlandırmak için geliştirilmiş kapsamlı bir web uygulaması" />
  <meta name="keywords" content="adliye, teftiş, judiciary, inspection, turkish" />
  <meta name="author" content="Gökhan TAŞÇI" />
  
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json" />
  
  <!-- PWA Theme colors -->
  <meta name="theme-color" content="#F44336" media="(prefers-color-scheme: dark)" />
  <meta name="theme-color" content="#5b6cff" media="(prefers-color-scheme: light)" />
  
  <!-- Apple specific meta tags for PWA -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Teftiş" />
  <link rel="apple-touch-icon" href="/assets/img/icon-192.png" />
  <link rel="apple-touch-icon" sizes="152x152" href="/assets/img/icon-152.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/img/icon-192.png" />
  
  <!-- Safari pinned tab icon -->
  <link rel="mask-icon" href="/assets/img/favicon.svg" color="#F44336" />
  
  <!-- Microsoft Tiles -->
  <meta name="msapplication-TileColor" content="#F44336" />
  <meta name="msapplication-TileImage" content="/assets/img/icon-144.png" />
  
  <!-- Mobile optimization -->
  <meta name="format-detection" content="telephone=no" />
  <meta name="mobile-web-app-capable" content="yes" />
  
  <?php
    /**
     * Sayfa başlığı oluşturma
     * 
     * Her sayfa kendi $pageTitle değişkenini set eder
     * Format: "Sayfa Adı - Teftiş | 657.com.tr"
     * Örnek: "İddianame Değerlendirme - Teftiş | 657.com.tr"
     */
    $fullTitle = '';
    if (!empty($pageTitle)) {
      // XSS koruması için htmlspecialchars kullanılıyor
      $fullTitle = htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') . ' - Teftiş | 657.com.tr';
    } else {
      // Varsayılan başlık (ana sayfa için)
      $fullTitle = 'Teftiş | 657.com.tr';
    }
  ?>
  <title><?= $fullTitle; ?></title>
  
  <!-- Koyu/Açık tema desteği için color-scheme meta etiketi -->
  <meta name="color-scheme" content="light dark" />
  
  <!-- RSS/Atom Feed Auto-discovery -->
  <link rel="alternate" type="application/rss+xml" title="Teftiş Haberleri (RSS)" href="/api/feed.php" />
  <link rel="alternate" type="application/atom+xml" title="Teftiş Haberleri (Atom)" href="/api/feed.php?format=atom" />
  
  <!-- Favicon: SVG formatında responsive ikon -->
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml" />
  
  <!-- 
    Google Fonts ve Material Symbols yükleme
    - Inter: Modern, okunabilir sans-serif font ailesi
    - Material Symbols: Google'ın ikon seti
  -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:FILL@0..1" rel="stylesheet" />
  
  <!-- Ana stil dosyası (CSS Variables ile tema yönetimi) -->
  <link rel="stylesheet" href="/assets/css/style.css?v=3" />
  <link rel="stylesheet" href="/assets/css/mobile-safari.css?v=1" />
  
  <!-- Preload critical resources for better performance -->
  <link rel="preload" href="/assets/js/utils.js?v=1" as="script" />
  <link rel="preload" href="/assets/css/style.css?v=3" as="style" />
  
  <!-- 
    JavaScript dosyaları
    - utils.js: Ortak yardımcı fonksiyonlar (önce yüklenmeli)
    - app.js: Ana uygulama mantığı (tema, notlar, modaller)
    - xlsx.min.js: Excel dosya işleme kütüphanesi
    - open-modal-bridge.js: Modal açma yardımcı fonksiyonları
    - jQuery: Bazı eski modüller için gerekli
  -->
  <script src="/assets/js/utils.js?v=1"></script>
  <script defer src="/assets/js/app.js?v=9"></script>
  <script defer src="/assets/js/footer-slider.js?v=1"></script>
  <script src="/assets/js/vendor/xlsx.min.js"></script>
  <script defer src="/assets/js/open-modal-bridge.js?v=1"></script>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  
  <!-- Service Worker Registration for PWA -->
  <script>
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
          console.log('ServiceWorker registered:', registration.scope);
        }).catch(function(error) {
          console.log('ServiceWorker registration failed:', error);
        });
      });
    }
  </script>
</head>
<body>
<!-- Accessibility: Skip to main content link -->
<a href="#main-content" class="skip-to-main">Ana içeriğe geç</a>

<!-- Ana uygulama kapsayıcısı: Grid layout ile navbar, sidebar, content düzeni -->
<div id="app" class="layout">

<!-- XLS Loading Overlay (shown while parsing Excel) -->
<div id="xlsLoadingOverlay">
  <div class="box">
    <div class="spinner-icon"></div>
    <h3>Veriler hazırlanıyor…</h3>
    <p>Lütfen bekleyiniz, Excel işleniyor.</p>
  </div>
  <div class="sr-only" aria-live="polite">Veriler hazırlanıyor, lütfen bekleyiniz.</div>
  <script>
    // tiny inline controller to avoid race conditions before page JS loads
      (function(){
        let visibleSince = 0; const MIN_MS = 350; // minimum görünürlük süresi
        function show(){
          const el = document.getElementById('xlsLoadingOverlay'); if(!el) return;
          if(!el.classList.contains('active')){ el.classList.add('active'); visibleSince = performance.now(); }
        }
        function hide(){
          const el = document.getElementById('xlsLoadingOverlay'); if(!el) return;
          const elapsed = performance.now() - visibleSince;
          if (elapsed < MIN_MS){
            setTimeout(()=>{ el.classList.remove('active'); }, MIN_MS - elapsed);
          } else {
            el.classList.remove('active');
          }
        }
        window.XlsSpinner = { show, hide };
      })();
      // inline helper to activate an inline spinner element
      window.setInlineXlsLoading = function(container, active){
        try {
          if(!container) return; const el = (typeof container === 'string') ? document.querySelector(container) : container;
          if(!el) return; el.classList.toggle('active', !!active);
        } catch(e) { /* noop */ }
      };
  </script>
</div>
