<?php
  /**
   * ========================================
   * TENSİP ZAMAN KONTROLÜ
   * ========================================
   * 
   * Bu modül, tensip tarihleri ile iddianame kabul tarihleri arasındaki süreleri
   * Excel'den okuyup denetim cetveli oluşturur.
   * 
   * İşlevler:
   * - XLS/XLSX dosya yükleme (drag & drop + file picker)
   * - Otomatik veri işleme ve analiz
   * - Birleştirilmiş özet tablo
   * - Minimum süre filtresi ile Word'e aktarım
   * 
   */
  $pageTitle = "Tensip Zaman Kontrolü";
  $active = "tensip";
  include __DIR__ . "/partials/header.php";
  include __DIR__ . "/partials/navbar.php";
  include __DIR__ . "/partials/sidebar.php";
?>

<main class="content">
  <header class="page-header">
    <h1>Tensip Zaman Kontrolü</h1>
    <p class="muted">Yüklediğiniz tabloyu işler ve denetim cetvelini hazırlar.</p>
  </header>

  <section id="htkGrid" style="display:grid;grid-template-columns:5fr 1fr;gap:16px;align-items:start">
    <div id="col10">
      <section class="panel" id="combinedSummaryCard" style="display:none; margin-top:0">
        <div class="panel-head">
          <div class="card-title">
            <span class="material-symbols-rounded">dataset</span> Birleştirilmiş Özet
          </div>
          <div class="title-actions muted" id="combinedStats"></div>
          
          <!-- Arama input -->
          <div class="title-actions">
            <input type="text" id="searchInput" placeholder="Ara..." style="padding:6px 12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);font-size:14px;width:200px;">
          </div>
        </div>
        <div class="panel-body">
          <div class="table-wrap" id="combinedTableWrap">
            <div class="placeholder">Henüz veri yok.</div>
          </div>
        </div>
      </section>
    </div>

    <aside id="col2">
      <section class="card" style="margin-bottom:12px">
        <div class="card-header" style="color:var(--muted)">
          <span class="material-symbols-rounded">info</span>
          <strong>Bilgi</strong>
        </div>
        <div class="card-body">
          <p>
            <strong>Tensip Zaman Kontrolü</strong> tablonuzu yükleyin; sistem süreleri hesaplayıp denetim cetvelini üretir.
          </p>
        </div>
      </section>

      <section class="card card-upload" id="udfUploadCard">
        <div class="card-header">
          <span class="material-symbols-rounded">upload_file</span>
          <strong>XLS Yükleme</strong>
        </div>
        <div class="card-body" style="display:block">
          <div id="udfDrop" class="placeholder" style="text-align:center;padding:18px;cursor:pointer">
            <span class="material-symbols-rounded">drive_folder_upload</span>
            <div>XLS/XLSX dosyalarını buraya sürükleyip bırakın</div>
            <small class="muted">veya tıklayıp seçin</small>
            <div class="xls-loading-inline" id="xlsInlineSpinnerTen" aria-hidden="true" style="margin-top:8px">
              <div class="spinner-icon"></div>
              <span class="muted" style="font-size:12px">İşleniyor…</span>
            </div>
          </div>
          <input id="udfInput" type="file" accept=".xls,.xlsx" hidden>
          <div id="udfPickRow" style="margin-top:10px;text-align:right">
            <label class="btn" for="udfInput">
              <span class="material-symbols-rounded">folder_open</span> Dosya Seç
            </label>
          </div>
          <div id="xlsChosen" class="muted" style="margin-top:8px"></div>
        </div>
      </section>
    </aside>
  </section>
</main>

<script src="/assets/js/jszip.min.js"></script>
<script src="/assets/js/xlsx-loader.js"></script>
<script src="/assets/js/tensip.js?v=1"></script>
<?php include __DIR__ . "/partials/footer.php"; ?>
