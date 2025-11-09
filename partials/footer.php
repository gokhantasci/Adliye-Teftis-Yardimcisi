<!--
  ========================================
  ALT BİLGİ / FOOTER (FOOTER.PHP)
  ========================================
  Sayfanın en altında gösterilen footer bilgileri
  
  İçerik:
  - Telif hakkı bilgisi
  - Geliştirici bilgisi
  - (Opsiyonel) Footer linkleri (şu an gizli)
  ========================================
-->
<footer class="footer">
  <!-- Telif hakkı -->
  <div class="footer-center">© <?= date('Y'); ?> Gökhan TAŞCI - 139329 - Sakarya Yazı İşleri Müdürü</div>
  <!-- Footer Slider -->
  <div class="footer-slider" aria-label="bilgilendirme">
    <button class="fs-btn fs-prev" type="button" title="Önceki" aria-label="Önceki">
      <span class="material-symbols-rounded" aria-hidden="true">chevron_left</span>
    </button>
    <div class="fs-viewport">
      <div class="fs-track">
        <div class="fs-item"><a href="#" id="openPrivacyModal">Gizlilik bildirimi</a></div>
        <div class="fs-item">Dosyalar sunucuya yüklenmez; işlemler kendi bilgisayarınızda yapılır.</div>
      </div>
    </div>
    <button class="fs-btn fs-next" type="button" title="Sonraki" aria-label="Sonraki">
      <span class="material-symbols-rounded" aria-hidden="true">chevron_right</span>
    </button>
  </div>
</footer>

<!-- 
  ========================================
  GİZLİLİK MODALI
  ========================================
  Footer'daki "Gizlilik" linkine tıklandığında açılan modal
  Kullanıcıya dosyaların sunucuya yüklenmediğini bildirir
-->
<div id="privacyModal" class="modal-backdrop" aria-hidden="true" role="dialog" aria-modal="true" style="display:none; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
  <div class="modal-content" style="max-width:600px; background:var(--card-bg,#111); color:var(--fg,#fff); border-radius:16px; border:1px solid rgba(255,255,255,.08); box-shadow:0 20px 60px rgba(0,0,0,.35); padding:0; margin:0;">
    <div class="modal-head" style="padding:12px 16px; display:flex; align-items:center; gap:12px; border-bottom:1px solid rgba(255,255,255,.08);">
      <span class="material-symbols-rounded" aria-hidden="true" style="opacity:.85;">info</span>
      <h2 id="privacyTitle" style="margin:0;font-size:18px;">Hatırlatma</h2>
    </div>
    <div class="modal-body" style="padding:16px;">
      <p style="margin:0;line-height:1.6;">
        Bu uygulamada hesaplamalar ve raporlamalar için seçtiğiniz dosyaların hiçbiri sunucuya yüklenmemekte, 
        tümü kendi tarayıcınız üzerinden hesaplanmaktadır.
      </p>
    </div>
    <div class="modal-foot" style="padding:12px 16px; display:flex; justify-content:flex-end; border-top:1px solid rgba(255,255,255,.08);">
      <button class="btn" id="btnPrivacyClose" type="button" style="padding:8px 16px; border-radius:10px; border:0; cursor:pointer; background:var(--md-sys-color-primary,#4f46e5); color:#fff; font-weight:600;">Anladım</button>
    </div>
  </div>
</div>

<!-- Ana layout div'ini kapat (header.php'de açıldı) -->
</div><!-- /layout -->

<script>
// Footer ve Gizlilik modalı global scriptlere taşındı (assets/js/footer-slider.js)
</script>

<!-- Body ve HTML etiketlerini kapat -->
</body>
</html>

