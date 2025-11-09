<?php
  $pageTitle = "Kesinleşme Zamanı Kontrol";
  $active = "kesinlesmekontrol";
  include __DIR__."/partials/header.php";
  include __DIR__."/partials/navbar.php";
  include __DIR__."/partials/sidebar.php";
?>
 <main class="content">
    <header class="page-header">
      <h1>Kesinleşme Zamanı Kontrol</h1>
      <p class="muted">UDF ve EXCEL dosyalarından özet üreterek Kesinleşme Zamanı Gelen Dosyalar Raporunu analiz eder.</p>
    </header>

    <!-- 10/12 - 2/12 grid -->
    <section id="htkGrid" style="display:grid;grid-template-columns:5fr 1fr;gap:16px;align-items:start">
      <!-- Sol (10/12) -->
      <div id="col10">
        <section class="panel" id="combinedSummaryCard" style="display:none; margin-top:0">
          <div class="panel-head">
            <div class="card-title">
              <span class="material-symbols-rounded">dataset</span> Birleştirilmiş Özet
            </div>
            <!-- JS burada KPI chip'lerini oluşturur (UDF/Excel/Eşleşme/Kontrole tabi) -->
            <div class="title-actions muted" id="combinedStats"></div>
          </div>
          <div class="panel-body">
            <div class="table-wrap" id="combinedTableWrap">
              <div class="placeholder">Henüz veri yok.</div>
            </div>
          </div>
        </section>
      </div>

      <!-- Sağ (2/12) -->
      <aside id="col2">
        <!-- Uyarı metni -->
        <section class="card" style="margin-bottom:12px">
          <div class="card-header" style="color:var(--muted)">
            <span class="material-symbols-rounded">info</span>
            <strong>Bilgi</strong>
          </div>
          <div class="card-body">
            <p>Dosya Sorgulama Ekranından <strong>açılış tarihine göre 6 aylık dönem</strong> için sorgulama yapıp, “<em>sorgulama sonuçlarını tablo üzerinde Sağ Tuş ve Editöre Aktar</em>” diyerek bilgisayarınıza kayıt edip, buraya birden fazla <code>.udf</code> halinde yükleyebilirsiniz.</p>
          </div>
        </section>

        <!-- UDF yükleme -->
        <section class="card card-upload" id="udfUploadCard">
          <div class="card-header">
            <span class="material-symbols-rounded">upload_file</span>
            <strong>UDF Yükleme</strong>
          </div>
          <div class="card-body" style="display:block">
            <div id="udfDrop" class="placeholder" style="text-align:center;padding:18px;cursor:pointer">
              <span class="material-symbols-rounded">drive_folder_upload</span>
              <div>UDF dosyalarını buraya sürükleyip bırakın</div>
              <small class="muted">veya tıklayıp seçin</small>
            </div>
            <input id="udfInput" type="file" accept=".udf" multiple hidden>
            <div id="udfPickRow" style="margin-top:10px;text-align:right">
              <label class="btn" for="udfInput">
                <span class="material-symbols-rounded">folder_open</span> Dosya Seç
              </label>
            </div>
            <div id="udfChosen" class="muted" style="margin-top:8px"></div>
          </div>
        </section>

        <!-- EXCEL yükleme kartı: UDF başarılı olunca dinamik eklenecek -->
        <div id="excelUploadMount"></div>
      </aside>
    </section>
  </main>

<!-- Sayfaya özel JS -->
<script src="/assets/js/jszip.min.js"></script>
<script src="/assets/js/xlsx-loader.js"></script>
<script src="/assets/js/kesinlesme-kontrol.js?v=1"></script>
<?php include __DIR__."/partials/footer.php"; ?>
