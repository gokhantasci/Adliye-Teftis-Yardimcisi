<?php
  /* Kesinleştirme ve İnfaza Verme Kontrolü */
  $pageTitle = "Kesinleştirme/İnfaz";
  $active = "kesinlestirme";
  include __DIR__."/partials/header.php";
  include __DIR__."/partials/navbar.php";
  include __DIR__."/partials/sidebar.php";
?>
<main class="content" id="main-content">
  <!-- Sayfa başlığı ve açıklama -->
  <header class="page-header">
    <h1>Kesinleştirme ve İnfaza Verme Kontrolü</h1>
    <p class="muted">Karar Defteri ve diğer verileri yükleyerek kesinleşme ve infaz sürelerini kontrol edin.</p>
  </header>

  <div class="container two-col-8-4">
    <div class="col-left">
      <!-- Results Panel (will be populated by JS) -->
      <div id="resultsContainer"></div>
    </div>

    <div class="col-right">
      <!-- TODO List Panel -->
      <div id="todoListContainer"></div>

      <!-- Reminder Alert -->
      <div id="kesinlestirmeReminderHost"></div>

      <!-- Step 1: Karar Defteri Upload -->
      <section class="panel" id="kararDefteriPanel">
        <div class="panel-head">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="material-symbols-rounded">upload</span>
            <strong>1. Adım: Karar Defteri</strong>
          </div>
        </div>
        <div class="panel-body">
          <p class="muted" style="margin-bottom:12px;">UYAP > Raporlar > Defterler > Karar Defteri dosyasını yükleyin.</p>
          <form onsubmit="return false;">
            <div id="dropZoneKarar" class="dropzone" tabindex="0" aria-label="Karar Defteri yükleme alanı">
              <p>Dosyayı buraya sürükleyip bırakın</p>
              <p class="muted">veya</p>
              <label for="kararInput" class="btn">
                <span class="material-symbols-rounded">file_upload</span> Excel Seç
              </label>
              <input type="file" id="kararInput" accept=".xls,.xlsx" hidden multiple>
              <small class="muted">İzin verilen türler: <b>.xls</b>, <b>.xlsx</b></small>
            </div>
          </form>
          <div id="kararStatus" style="margin-top:12px;"></div>
        </div>
      </section>

      <!-- Step 2: Additional uploads (will be shown after Karar Defteri is loaded) -->
      <div id="additionalSteps" style="display:none;">
        <!-- Future steps will be added here -->
      </div>
    </div>
  </div>
</main>

<script src="/assets/js/xlsx-loader.js"></script>
<script defer src="/assets/js/kesinlestirme.js"></script>
<?php include __DIR__."/partials/footer.php"; ?>
