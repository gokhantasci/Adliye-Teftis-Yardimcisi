<?php
  /**
   * ========================================
   * İDDİANAME DEĞERLENDİRME ZAMAN KONTROLÜ
   * ========================================
   * 
   * Bu modül, iddianame değerlendirme sürelerinin kontrolü için
   * Excel dosyalarını yükleyip analiz eder ve denetim cetveli oluşturur.
   * 
   * İşlevler:
   * - XLS/XLSX dosya yükleme (drag & drop + file picker)
   * - Otomatik veri işleme ve analiz
   * - Birleştirilmiş özet tablo oluşturma
   * - Zaman kontrolü ve uyumsuzluk tespiti
   * 
   * Kullanılan kütüphaneler:
   * - JSZip: Excel dosyalarını açmak için
   * - xlsx-loader.js: Excel verilerini JavaScript'e aktarma
   * - iddianame.js: İş mantığı ve veri işleme
   * 
   * @package Adliye-Teftiş-Yardımcısı
   * @subpackage İddianame Modülü
   * @author Gökhan TAŞCI
   * @version 1.0
   * ========================================
   */
  
  // Sayfa yapılandırması
  $pageTitle = "İddianame Değerlendirme Zaman Kontrolü";
  $active = "iddianame";
  
  // Ortak bileşenleri dahil et
  include __DIR__."/partials/header.php";
  include __DIR__."/partials/navbar.php";
  include __DIR__."/partials/sidebar.php";
?>

<!-- Ana içerik alanı -->
<main class="content" id="main-content">
  <!-- Sayfa başlığı ve açıklama -->
  <header class="page-header">
    <h1>İddianame Değerlendirme Zaman Kontrolü</h1>
    <p class="muted">Yüklediğiniz tabloyu işler ve denetim cetvelini hazırlar.</p>
  </header>

  <!-- 
    İki sütunlu grid düzeni
    Sol: 5fr (geniş) - Sonuç tablosu için
    Sağ: 1fr (dar) - Bilgi ve yükleme alanları için
  -->
  <section id="htkGrid" style="display:grid;grid-template-columns:5fr 1fr;gap:16px;align-items:start">
    
    <!-- ============ SOL SÜTUN (10/12) ============ -->
    <div id="col10">
      <!-- 
        Birleştirilmiş özet kartı
        Başlangıçta gizli, veri yüklenince JavaScript ile gösterilir
      -->
      <section class="panel" id="combinedSummaryCard" style="display:none; margin-top:0">
        <!-- Panel başlığı -->
        <div class="panel-head">
          <!-- Başlık ve ikon -->
          <div class="card-title">
            <span class="material-symbols-rounded">dataset</span> Birleştirilmiş Özet
          </div>
          
          <!-- 
            İstatistik bilgileri
            JavaScript tarafından dinamik olarak doldurulur
            Örnek: "Toplam: 150 kayıt | Uygun: 120 | Sorunlu: 30"
          -->
          <div class="title-actions muted" id="combinedStats"></div>
          
          <!-- Arama input -->
          <div class="title-actions">
            <input type="text" id="searchInput" placeholder="Ara..." style="padding:6px 12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-size:14px;width:200px;">
          </div>
        </div>
        
        <!-- Panel içeriği - Tablo alanı -->
        <div class="panel-body">
          <div class="table-wrap" id="combinedTableWrap">
            <!-- Placeholder: Veri yokken gösterilir -->
            <div class="placeholder">Henüz veri yok.</div>
          </div>
        </div>
      </section>
    </div>

    <!-- ============ SAĞ SÜTUN (2/12) ============ -->
    <aside id="col2">
      
      <!-- ========== BİLGİ KARTI ========== -->
      <section class="card" style="margin-bottom:12px">
  <div class="card-header" style="color:var(--muted)">
          <span class="material-symbols-rounded">info</span>
          <strong>Bilgi</strong>
        </div>
        <div class="card-body">
          <p>
            Tarafınıza gönderilen <strong>İddianame Değerlendirme Zaman Kontrolü</strong> 
            dosyasını yüklerseniz, işleyip size denetim cetveli olarak teslim edebiliriz.
          </p>
        </div>
      </section>

      <!-- ========== EXCEL YÜKLEME KARTI ========== -->
      <section class="card card-upload" id="udfUploadCard">
        <!-- Kart başlığı -->
  <div class="card-header">
          <span class="material-symbols-rounded">upload_file</span>
          <strong>XLS Yükleme</strong>
        </div>
        
        <!-- Kart içeriği -->
        <div class="card-body" style="display:block">
          <!-- 
            Sürükle-bırak alanı (Drop Zone)
            Kullanıcı buraya dosya sürükleyip bırakabilir
            Tıklayınca da dosya seçici açılır
          -->
          <div id="udfDrop" class="placeholder" style="text-align:center;padding:18px;cursor:pointer">
            <span class="material-symbols-rounded">drive_folder_upload</span>
            <div>XLS/XLSX dosyalarını buraya sürükleyip bırakın</div>
            <small class="muted">veya tıklayıp seçin</small>
            <div class="xls-loading-inline" id="xlsInlineSpinnerIdd" aria-hidden="true" style="margin-top:8px">
              <div class="spinner-icon"></div>
              <span class="muted" style="font-size:12px">İşleniyor…</span>
            </div>
          </div>
          
          <!-- 
            Gizli dosya input elementi
            Programatik olarak tetiklenir
            Sadece .xls ve .xlsx dosyaları kabul eder
          -->
          <input id="udfInput" type="file" accept=".xls,.xlsx" hidden>
          
          <!-- Dosya seçme butonu -->
          <div id="udfPickRow" style="margin-top:10px;text-align:right">
            <label class="btn" for="udfInput">
              <span class="material-symbols-rounded">folder_open</span> Dosya Seç
            </label>
          </div>
          
          <!-- 
            Seçilen dosya bilgisi
            Dosya seçilince JavaScript tarafından doldurulur
            Örnek: "secilen-dosya.xlsx (123 KB)"
          -->
          <div id="xlsChosen" class="muted" style="margin-top:8px"></div>
        </div>
      </section>
      
    </aside>
  </section>
</main>

<!-- 
  ========================================
  SAYFA ÖZEL JAVASCRIPT DOSYALARI
  ========================================
  Bu dosyalar sadece bu sayfada kullanılır
-->

<!-- JSZip: Excel dosyalarını açmak için gerekli -->
<script src="/assets/js/jszip.min.js"></script>

<!-- Excel yükleme yardımcı fonksiyonları -->
<script src="/assets/js/xlsx-loader.js"></script>

<!-- İddianame modülü ana mantık dosyası -->
<script src="/assets/js/iddianame.js?v=1"></script>

<!-- Ortak footer -->
<?php include __DIR__."/partials/footer.php"; ?>

