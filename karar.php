<?php
  /* Karar Defteri – Excel yükle, KPI ve ayarlar */
  $pageTitle = "Karar Defteri";
  $active = "karar";
  include __DIR__."/partials/header.php";
  include __DIR__."/partials/navbar.php";
  include __DIR__."/partials/sidebar.php";
?>
<main class="content">
<!-- Sayfa başlığı ve açıklama -->
  <header class="page-header">
    <h1>Karar Defteri Kontrolü</h1>
    <p class="muted">Yüklediğiniz tabloyu işler ve dosya bazlı karar sayılarını hazırlar.</p>
  </header>
<div class="container two-col-8-4">
	<div class="col-left">
  <section class="cards cards--4">
            <div class="card kpi">
                <div class="kpi-head"> <span class="kpi-title">Toplam Kayıt</span> <span class="material-symbols-rounded kpi-icon">work</span> </div>
                <div class="kpi-value" id="kpiTotal">0</div>
                <div class="kpi-sub muted"></div>
            </div>
            <div class="card kpi">
                <div class="kpi-head"> <span class="kpi-title">Hakim Sayısı</span> <span class="material-symbols-rounded kpi-icon">groups</span> </div>
                <div class="kpi-value" id="kpiHakim">0</div>
                <div class="kpi-sub muted"></div>
            </div>
            <div class="card kpi">
                <div class="kpi-head"> <span class="kpi-title">Savcı Sayısı</span> <span class="material-symbols-rounded kpi-icon">lock_person</span> </div>
                <div class="kpi-value" id="kpiSavci">0</div>
                <div class="kpi-sub muted"></div>
            </div>
            <div class="card kpi">
                <div class="kpi-head"> <span class="kpi-title">İşlem Sayısı</span> <span class="material-symbols-rounded kpi-icon">contract_edit</span> </div>
                <div class="kpi-value" id="kpiIslem">0</div>
                <div class="kpi-sub muted">28/10/2025 tarihinden bugüne</div>
            </div>
        </section>
        
    </div>
	<div class="col-right">
			<!-- Reminder alert placeholder -->
			<div id="kararReminderHost"></div>
			<!-- Upload panel moved here (top of right column) with dropzone styling -->
			<section class="panel" id="kararUploadCard">
					<div class="panel-head">
						<div style="display:flex;align-items:center;gap:8px;">
							<span class="material-symbols-rounded">upload</span>
							<strong>Excel Yükle</strong>
						</div>
						<div class="title-actions ta-compact" style="margin-left:auto;display:flex;gap:6px;align-items:center;">
							<button class="btn" id="run" type="button" style="display:inline-flex;align-items:center;gap:6px;"><span class="material-symbols-rounded">calculate</span><span>Hesapla</span></button>
						</div>
					</div>
					<div class="panel-body">
						<form onsubmit="return false;">
							<div id="dropZone" class="dropzone" tabindex="0" aria-label="Excel yükleme alanı">
								<p>Dosyayı buraya sürükleyip bırakın</p>
								<p class="muted">veya</p>
								<label for="excelInput" class="btn"><span class="material-symbols-rounded">file_upload</span> Excel Seç</label>
								<input type="file" id="excelInput" accept=".xls,.xlsx,.csv" hidden multiple>
								<small class="muted">İzin verilen türler: <b>.xls</b>, <b>.xlsx</b>, <b>.csv</b></small>
							</div>
						</form>
					</div>
				</section>
        <details class="settings" open="" style="margin-top:12px;">
            <summary><span class="material-symbols-rounded">settings</span>Ayarlar</summary>
            <div class="content">
			  <div class="row">
				<div>
				  <label for="col_i">Hakim/Başkan (I)</label>
				  <input id="col_i" name="col_i" type="text" value="I">
				</div>
				<div>
				  <label for="col_j">Üye 1 (J)</label>
				  <input id="col_j" name="col_j" type="text" value="J">
				</div>
				<div>
				  <label for="col_k">Üye 2 (K)</label>
				  <input id="col_k" name="col_k" type="text" value="K">
				</div>
			  </div>

			  <div class="row">
				<div>
				  <label for="col_o">Mahkumiyet (O)</label>
				  <input id="col_o" name="col_o" type="text" value="O">
				</div>
				<div>
				  <label for="col_p">HAGB (P)</label>
				  <input id="col_p" name="col_p" type="text" value="P">
				</div>
				<div>
				  <label for="col_t">Gör/Yet/Birleş (T)</label>
				  <input id="col_t" name="col_t" type="text" value="T">
				</div>
				<div>
				  <label for="col_m">Beraat (M)</label>
				  <input id="col_m" name="col_m" type="text" value="M">
				</div>
				<div>
				  <label for="col_q">Red (Q)</label>
				  <input id="col_q" name="col_q" type="text" value="Q">
				</div>
				<div>
				  <label for="col_z">Tazminat (Z)</label>
				  <input id="col_z" name="col_z" type="text" value="Z">
				</div>
			  </div>

			  <div class="row">
				<div>
				  <label for="col_l">C.Savcısı (L)</label>
				  <input id="col_l" name="col_l" type="text" value="L">
				</div>
			  </div>

			  <div class="row">
				<button class="btn ghost small" id="saveBtn" type="button">Ayarları Kaydet</button>
			  </div>
			</div>

        </details>
    </div>
  <!-- Alt bloklar artık iki kolon düzenine taşındı; gerekirse aşağı eklenebilir -->
</div>
</main>
<script>
// Inject reminder alert at page load
document.addEventListener('DOMContentLoaded', function() {
  var host = document.getElementById('kararReminderHost');
  if (host && window.showAlert) {
    window.showAlert(host, {
      type: 'info',
      title: 'Dikkat',
      message: 'Bu sayfayı kullanabilmek için UYAP > Raporlar > Defterler > Defter Sorgu > Karar Defterini Excel formatında ilgili tarihleri kapsayacak şekilde indirip, tümünü indirdikten sonra toplu olarak aşağıya yükleyebilirsiniz',
      dismissible: true
    });
  }
});
</script>
<script src="/assets/js/xlsx-loader.js"></script>
<script defer src="/assets/js/modal-click.js"></script>
<script defer src="/assets/js/karar-excel-kpis.js?v=1"></script>
<?php include __DIR__."/partials/footer.php"; ?>
<script defer src="/assets/js/g-global.js?v=1"></script>
<script defer src="/assets/js/modal-click.compat.js?v=1"></script>
