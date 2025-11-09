<?php
  $pageTitle = "Duruşma Kaçağı Kontrolü";
  $active = "durusmakacagi";
  include __DIR__ . '/partials/header.php';
  include __DIR__ . '/partials/navbar.php';
  include __DIR__ . '/partials/sidebar.php';
?>
<main class="content" id="main-content">
  <header class="page-header">
    <h1>Duruşma Kaçağı Kontrolü</h1>
    <p class="muted">Teftiş kayıtları için bilgilendirme ve şablon indirme.</p>
  </header>
  <section style="display:flex;justify-content:center;align-items:flex-start;padding:20px 0;">
    <div class="panel" style="max-width:760px;width:100%;">
      <div class="panel-head" style="justify-content:center;">
        <div class="card-title" style="display:flex;align-items:center;gap:8px;">
          <span class="material-symbols-rounded">info</span>
          <strong>Bilgi</strong>
        </div>
      </div>
      <div class="panel-body" style="font-size:15px;line-height:1.55;">
        <p>
          Teftişlerde <strong>Duruşma Kaçağı Kontrolü</strong> için gönderilen kayıtlar genellikle esas
          defterine yeni kayıt edilmiş ve henüz <em>tensibi yapılmamış</em> dosyaları gösterdiği için buna ilişkin bir tablo oluşturucu eklenmemiştir.
        </p>
        <p>
          Teftişte kullanılacak düzeltilmiş şablonu indirmek için aşağıdaki butonu kullanabilirsiniz.
        </p>
        <div style="margin-top:24px;text-align:center">
          <button class="btn" id="downloadDurusmaBtn" type="button" style="display:inline-flex;align-items:center;gap:6px;">
            <span class="material-symbols-rounded">download</span>
            <span>Şablonu İndir</span>
          </button>
        </div>
        <div id="durusmaStatus" class="muted" style="margin-top:12px;text-align:center"></div>
      </div>
    </div>
  </section>
</main>
<script src="/assets/js/durusmakacagi.js?v=1"></script>
<?php include __DIR__ . '/partials/footer.php'; ?>
