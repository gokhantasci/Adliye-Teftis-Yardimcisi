<?php
  $pageTitle = "Kesinleşme Hesapla";
  $active = "kesinlesme";
  include __DIR__."/partials/header.php";
  include __DIR__."/partials/navbar.php";
  include __DIR__."/partials/sidebar.php";
?>
<main class="content" id="main-content">
  <div class="page-header">
    <h1>Kesinleşme Hesapla</h1>
    <p class="muted">Girilen tarihlere göre mevzuata uygun hesaplama yapılır.</p>
  </div>

  <div class="container two-col-9-3"><!-- Sol 9/12, Sağ 3/12 -->
    <div class="col-left">
      <!-- Form -->
      <section class="panel" id="kesFormPanel">
        <div class="panel-head">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded">schedule</span>
            <strong>Tebliğ ve Süre</strong>
          </div>
          <div class="title-actions" style="margin-left:auto;display:flex;gap:6px;align-items:center;">
            <button id="btnCalc" class="btn btn-primary" type="button" style="display:inline-flex;align-items:center;gap:4px;">
              <span class="material-symbols-rounded">calculate</span><span>Hesapla</span>
            </button>
            <button id="btnClear" class="btn" type="button">Temizle</button>
          </div>
        </div>
        <div class="panel-body" id="formMount"><!-- JS doldurur --></div>
      </section>

      <!-- Tatiller -->
      <section class="panel" id="kesTatillerPanel" style="margin-top:16px;">
        <div class="panel-head">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded">event</span>
            <strong>Tatil Günleri</strong>
          </div>
          <div class="title-actions" style="margin-left:auto;display:flex;align-items:center;gap:6px;">
            <span id="holidayInfo" class="muted"></span>
          </div>
        </div>
        <div class="panel-body" id="holidayMount"><!-- JS doldurur --></div>
      </section>

    </div>
    <div class="col-right">
      <!-- Kesinleşme Tarihi -->
      <section class="panel" id="kesResultPanel">
        <div class="panel-head">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded">task_alt</span>
            <strong>Kesinleşme Tarihi</strong>
          </div>
        </div>
        <div class="panel-body">
          <div id="resultBox" class="kpi">
            <div class="kpi-value muted">—</div>
            <div class="kpi-label">Hesap sonrası burada görünecek</div>
          </div>
        </div>
      </section>
      <!-- Açıklamalar (sağ sütun 3/12) -->
      <section class="panel" id="kesAciklamaPanel" style="margin-top:16px;">
        <div class="panel-head">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded">help</span>
            <strong>Açıklamalar</strong>
          </div>
        </div>
        <div class="panel-body">
          <ul id="explainList" class="list"></ul>
        </div>
      </section>
    </div>
  </div>
</main>
<?php include __DIR__."/partials/footer.php"; ?>
<script src="/assets/js/kesinlesme.js?v=2"></script>
