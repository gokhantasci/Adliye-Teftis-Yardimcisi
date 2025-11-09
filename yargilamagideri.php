<?php
  $pageTitle = "Yargılama Gideri";
  $active = "yargilama";
  include __DIR__."/partials/header.php";
  include __DIR__."/partials/navbar.php";
  include __DIR__."/partials/sidebar.php";
?>
<main class="content">
  <div class="page-header">
    <h1>Yargılama Gideri Hesaplama</h1>
  </div>

  <div class="container two-col-9-3">
    <div class="col-left">
    <!-- Üst Sol: Tebligatlar + E-Tebligatlar (JS buraya basar) -->
    <section class="ustsol">
	<!-- Bilgi Kartı -->
		<div class="alert alert-info" id="uploadInfoCard">
		  <span class="material-symbols-rounded alert-icon">info</span>
		  <div class="alert-body">
			<div class="alert-title">Bilgi</div>
			<div>
			  UYAP &gt; Tebligat sorgulanması ekranından temin edeceğiniz tebligatların listesini
			  <strong>sağ tuş ile "Dışa Aktar"</strong> dediğiniz <strong>EXCEL dosyasını</strong> yükleyerek
			  tüm tebligatların hesaplanmasını sağlayabilirsiniz.
			</div>
		  </div>
		  <button type="button" class="btn-close" onclick="this.parentElement.remove()" aria-label="Kapat">&times;</button>
		</div>
      <div class="card">
        <div class="card-body" id="yg-form">
          <div id="yg-ustsol"></div> <!-- JS mount -->
        </div>
      </div>
    </section>

    <!-- Alt Sol: Kontroller -->
    <section class="altsol">
      <div class="card">
        <div class="card-body">
          <div class="form-grid">
            <div class="form-field">
              <label for="tebligatlarbir">Tebligat/E-Tebligat ayrı ayrı gösterilsin mi?</label>
              <input id="tebligatlarbir" type="checkbox">
            </div>
            <div class="form-field">
              <label for="postagideri">Posta Gideri</label>
              <input id="postagideri" class="input" type="text" value="0" placeholder="0">
            </div>
            <div class="form-field">
              <label for="ilangideri">İlan Gideri</label>
              <input id="ilangideri" class="input" type="text" value="0" placeholder="0">
            </div>
            <div class="form-field">
              <label for="yasagideri">Yasa Yolu Gidiş-Dönüş</label>
              <input id="yasagideri" class="input" type="text" value="0" placeholder="0">
            </div>
            <div class="form-field">
              <label for="atkgideri">ATK Gideri</label>
              <input id="atkgideri" class="input" type="text" value="0" placeholder="0">
            </div>
            <div class="form-field">
              <label for="kesifgideri">Keşif Gideri</label>
              <input id="kesifgideri" class="input" type="text" value="0" placeholder="0">
            </div>
            <div class="form-field">
              <label for="uzlasmagideri">Uzlaştırmacı</label>
              <input id="uzlasmagideri" class="input" type="text" value="0" placeholder="0">
            </div>
            <div class="form-field">
              <label for="bilirkisigideri">Bilirkişi</label>
              <input id="bilirkisigideri" class="input" type="text" value="0" placeholder="0">
            </div>
          </div>

          <div id="liveAlertPlaceholder" style="margin-top:.5rem;"></div>
          <input id="opencount" type="hidden" value="0">
        </div>
      </div>
    </section>
    </div>

    <!-- Üst Sağ: İşlemler + KPI/Döküm -->
	<div class="col-right">
	<section class="ustsag">	

		<!-- Dosya Yükleme Kartı -->
		<section class="card card-tebligat" id="tebligatUploadCard">
      <div class="card-header">
			<span class="material-symbols-rounded">upload_file</span>
			<h3>Tebligat Dosyası Yükle</h3>
		  </div>
		  <div class="card-body">
			<!-- Drop zone -->
			<div id="dropZone" class="placeholder">
			  <span class="material-symbols-rounded" style="font-size:36px;">cloud_upload</span>
			  <p>Buraya XLS veya XLSX dosyalarınızı sürükleyip bırakın<br>ya da aşağıdan dosya seçin.</p>
			  <input type="file" id="fileInput" accept=".xls,.xlsx,.udf" hidden>
			</div>
		  </div>
		</section>

	  <div class="ustsag-stack">
		<!-- İşlemler (ikonlu, büyük, flex) -->
		<div class="card">
		  <div class="card-body">
			<div class="title-actions actions-row">
			  <button id="giderhesapla" class="btn btn-xl">
				<span class="material-symbols-rounded btn-ic">calculate</span>
				<span>Hesapla</span>
			  </button>
			  <button id="btnClear" class="btn btn-xl">
				<span class="material-symbols-rounded btn-ic">backspace</span>
				<span>Temizle</span>
			  </button>
			</div>
		  </div>
		</div>

		
	</section>

    <!-- Sağ Alt: Sayaç kartı (h2 boyutunda, header yok) -->
    <section class="altsag">
	<!-- KPI + Döküm -->
		<div class="card">
      <div class="card-header"><h2 style="margin:0;">Özet</h2></div>
		  <div class="card-body">
			<div class="kpis" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
			  <div class="kpi"><div class="muted">Tebligat Toplam</div><div id="kpiTeb" style="font-size:20px;font-weight:700">—</div></div>
			  <div class="kpi"><div class="muted">E-Tebligat Toplam</div><div id="kpiETeb" style="font-size:20px;font-weight:700">—</div></div>
			  <div class="kpi"><div class="muted">Genel Toplam</div><div id="kpiGenel" style="font-size:22px;font-weight:800">—</div></div>
			</div>
			<hr style="opacity:.2;margin:.75rem 0;">
			<pre id="yargilamadokum" style="white-space:pre-wrap;margin:0;font-size:1.2rem;"></pre>
			<div class="title-actions actions-row" style="margin-top:.75rem;">
			  <button id="btnCopyDokum" class="btn btn-xl">
				<span class="material-symbols-rounded btn-ic">content_copy</span>
				<span>Kopyala</span>
			  </button>
			</div>
		  </div>
		</div>
	  </div>
      <div class="card" id="sayacAltCard" style="display:none;">
        <div class="card-body">
          <div id="sayac" style="font-size:1.5rem; font-weight:200; line-height:1.35;"></div>
        </div>
      </div>
    </section>
    </div>
  </div>
</main>
<?php include __DIR__."/partials/footer.php"; ?>

<style>
  /* Üst sağdaki kartlar arasına dikey gap */
  .ustsag .ustsag-stack { display:flex; flex-direction:column; gap:12px; }
</style>

<script src="/assets/js/xlsx-loader.js"></script>
<script src="/assets/js/yargilamagideri.js?v=1"></script>
