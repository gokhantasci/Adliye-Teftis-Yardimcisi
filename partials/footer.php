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
  <!-- 
    Telif hakkı ve geliştirici bilgisi
    PHP date() fonksiyonu ile dinamik yıl gösterimi
  -->
  <div>© <?= date('Y'); ?> Gökhan TAŞCI - 139329 - Sakarya Yazı İşleri Müdürü</div>
  
  <!-- 
    Footer linkleri (şu an gizli - hidden attribute)
    Gelecekte Gizlilik Politikası ve Kullanım Şartları için kullanılabilir
  -->
  <div class="footer-links" hidden>
    <a href="#">Gizlilik</a>
    <a href="#">Şartlar</a>
  </div>
</footer>

<!-- Ana layout div'ini kapat (header.php'de açıldı) -->
</div><!-- /layout -->

<!-- Body ve HTML etiketlerini kapat -->
</body>
</html>

