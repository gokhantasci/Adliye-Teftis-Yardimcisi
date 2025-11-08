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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  
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
  
  <!-- 
    JavaScript dosyaları
    - app.js: Ana uygulama mantığı (tema, notlar, modaller)
    - xlsx.min.js: Excel dosya işleme kütüphanesi
    - open-modal-bridge.js: Modal açma yardımcı fonksiyonları
    - jQuery: Bazı eski modüller için gerekli
  -->
  <script defer src="/assets/js/app.js?v=8"></script>
  <script src="/assets/js/vendor/xlsx.min.js"></script>
  <script defer src="/assets/js/open-modal-bridge.js?v=1"></script>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body>
<!-- Ana uygulama kapsayıcısı: Grid layout ile navbar, sidebar, content düzeni -->
<div id="app" class="layout">
