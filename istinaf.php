<?php
  $pageTitle = "İstinaf Defteri";
  $active = "istinaf";
  include __DIR__."/partials/header.php";
  include __DIR__."/partials/navbar.php";
  include __DIR__."/partials/sidebar.php";
?>
<main class="content">
  <div class="page-header">
    <h1>İstinaf Defteri</h1>  
	<p class="muted">Yüklediğiniz istinaf defterini işler ve teftişe esas olabilecek değerler gösterir.</p>  
  </div>

  <div class="container">
    <!-- Üst Sol -->
    

    <!-- Üst Sağ -->
		<section id="cardUstSag" class="ustsag">
			<!-- Hatırlatma alert'i için yer tutucu -->
			<div id="istinafReminderHost"></div>
			<div class="card card-upload" id="istinafUploadCard">
				<div class="card-head">
					<span class="material-symbols-rounded">upload</span>
					<strong>Dosya Yükle</strong>
					<div class="title-actions ta-compact" style="margin-left:auto;display:flex;align-items:center;gap:6px;">
						<button id="istinafHelpBtn" type="button" class="btn ghost" title="Yardım" aria-label="Yükleme kuralları">
							<span class="material-symbols-rounded">help</span>
						</button>
					</div>
				</div>
				<div class="card-body">
					<form id="uploadBox" enctype="multipart/form-data" onsubmit="return false;" aria-describedby="istinafUploadDesc">
						<div id="dropZone" class="dropzone" tabindex="0" aria-label="Dosya yükleme alanı">
							<p>Dosyaları buraya sürükleyip bırakın</p>
							<p class="muted">veya</p>
							<input id="fileInput" name="files[]" type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple />
							<small id="istinafUploadDesc" class="muted">İzin verilen türler: <b>.xls</b>, <b>.xlsx</b> · Çoklu seçim desteklenir · Gerekli sayfa: <b>czmIstinafDefteriRaporu</b></small>
						</div>
						<div id="selectedFilesHint" class="muted" style="margin-top:.5rem;"></div>
					</form>
				</div>
			</div>
		</section>

    <!-- Alt Sol -->
    <section id="cardAltSol" class="altsol" style="grid-area: ustsol;">
      <div class="card" id="gokhan">        
        <div class="card-body">          
        </div>
      </div>
	  <div class="card" style="margin-top: 1rem;">
        <div class="panel-head"><h3>Rapor Özeti</h3></div>
		  <div class="panel-body" id="raporOzetBody">
			<p class="muted">Henüz dosya yüklenmedi.</p>
		  </div>
      </div>
    </section>

    <!-- Alt Sağ -->
    <section id="cardAltSag" class="altsag" style="grid-area: altsag;" hidden>
      <div class="card">
        <div class="panel-head"><h3>Rapor Özeti</h3></div>
		  <div class="panel-body" id="raporOzetBody">
			<p class="muted">Henüz dosya yüklenmedi.</p>
		  </div>
      </div>
    </section>
  </div>
  
  <!-- Özet Tablo Modal -->
	<div id="ozetModal" class="modal-card" style="display:none;">
	  <div class="modal-head">
		<h3>İstinaf Özet Tablosu</h3>
		<div class="actions">
		  <input type="text" id="ozetSearch" placeholder="Tabloda ara..." class="input input--sm" style="width:180px;">
		  <button id="btnExportXLS" class="btn btn--sm">XLS Kaydet</button>
		  <button id="btnPrintAll" class="btn btn--sm">Yazdır</button>
		  <button id="btnCloseOzet" class="btn btn--sm btn--icon">×</button>
		</div>
	  </div>
	  <div class="modal-body">
		<div id="ozetPagerInfo" class="muted"></div>
		<table id="ozetTable" class="table">
		  <thead>
			<tr>
			  <th>Esas No</th>
			  <th>Karar No</th>
			  <th>Karar Tarihi</th>
			  <th>İstinaf Dilekçesi Tarihi</th>
			  <th>Netice</th>
			  <th>Düşünceler</th>
			</tr>
		  </thead>
		  <tbody></tbody>
		</table>
		<div class="pager">
		  <div><button id="pagePrev" class="btn ghost">◀ Önceki</button></div>
		  <div class="muted"><span id="pageInfo"></span></div>
		  <div><button id="pageNext" class="btn ghost">Sonraki ▶</button></div>
		</div>
	  </div>
	</div>
	<!-- Kanun Yolu Detay Modal -->
	<div id="kanunYoluModal" class="modal-card" style="display:none; max-width:1100px; z-index:10000;">
	  <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;">
		<h2>Kanun Yolu Rapor Detayı</h2>
		<button id="btnCloseKanunYolu" class="btn btn--sm btn--icon" aria-label="Kapat">×</button>
	  </div>

	  <div class="modal-body" style="max-height:80vh; overflow:auto;">
		<section id="kesinKararSection" style="margin-bottom:1rem;">
		  <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;">
			<h3 style="margin:0;">1- Karar kesin olmasına veya öngörülen süre dolmasına rağmen kanun yolu merciine (Yargıtay veya Bölge Adliye Mahkemesi) gönderilen dosyalar</h3>
			<button id="btnCopyKesinModal" class="btn btn--sm">Kopyala</button>
		  </div>
		  <table class="table" id="kesinKararTableModal">
			<thead>
			  <tr><th>SIRA</th><th>ESAS NO</th><th>KARAR NO</th><th>KARARIN KESİN OLMA SEBEBİ AÇIKLAMA</th></tr>
			</thead>
			<tbody></tbody>
		  </table>
		</section>

		<section id="notSentSection">
		  <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;">
			<h3 style="margin:0;">2- Kanun yolu merciine (Yargıtay veya Bölge Adliye Mahkemesi) henüz gönderilmeyen dosyalar</h3>
			<button id="btnCopyNotSentModal" class="btn btn--sm">Kopyala</button>
		  </div>
		  <table class="table" id="notSentTableModal">
			<thead>
			  <tr><th>SIRA</th><th>ESAS NO</th><th>KARAR NO</th><th>KANUN YOLUNA BAŞVURMA TARİHİ</th></tr>
			</thead>
			<tbody></tbody>
		  </table>
		</section>
	  </div>

	  <div class="modal-foot d-flex justify-content-end align-items-center gap-2">
		<button id="btnCloseKanunYoluFoot" class="btn btn--sm">Kapat</button>
	  </div>
	</div>
	<div id="kanunYoluBackdrop" class="ozet-backdrop"></div>


</main>
<?php include __DIR__."/partials/footer.php"; ?>

<!-- Şu an JS boş; ileride bağlarız -->
<script src="/assets/js/xlsx-loader.js"></script>
<script src="/assets/js/istinaf.js?v=1"></script>
<script>
	// Sayfa yüklenince üst sağ karta hatırlatma alert'i ekle
	(function(){
		function injectReminder(){
			try{
				var host = document.getElementById('istinafReminderHost') || document.querySelector('#cardUstSag');
				if (!host || typeof window.showAlert !== 'function') return;
				// Eğer daha önce eklendiyse tekrar eklemeyelim
				if (document.getElementById('istinafReminderAlert')) return;
				var wrap = document.createElement('div');
				wrap.id = 'istinafReminderAlert';
				// İlk elemana ekle (üstte görünsün)
				if (host.firstChild) host.insertBefore(wrap, host.firstChild); else host.appendChild(wrap);
				window.showAlert(wrap, {
					type: 'info',
					title: 'Hatırlatma',
					message: 'Bu sayfayı kullanabilmek için UYAP > Raporlar > Defterler > İstinaf Defteri\'ni teftiş aralığı içerisinden sorgulayabiliriz, bu ekranda 1-250 olarak sorgulama yapabiliyoruz, tümünü indirdikten sonra toplu olarak aşağıya yükleyebilirsiniz',
					icon: 'info',
					dismissible: true
				});
			} catch(e){ /* noop */ }
		}
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectReminder); else injectReminder();
	})();
</script>
