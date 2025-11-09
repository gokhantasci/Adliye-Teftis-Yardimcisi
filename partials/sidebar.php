<!--
  ========================================
  YAN MENÜ / SIDEBAR (SIDEBAR.PHP)
  ========================================
  Sol tarafta sabit konumda duran navigasyon menüsü
  
  Özellikler:
  - Responsive: Mobilde gizli, buton ile açılır
  - Aktif sayfa vurgulama: $active değişkeni ile kontrol
  - Gruplandırılmış menü öğeleri
  - Material Icons ile görsel zenginlik
  
  Menü Grupları:
  1. Ana Sayfa
  2. Teftiş Modülleri (Karar, İstinaf, İddianame)
  3. Kontrol Modülleri (Harç, Kesinleşme, J-Robot)
  4. Araçlar (Hesaplama araçları)
  5. Diğer Uygulamalarımız (Harici linkler)
  ========================================
-->
<aside id="sidebar" class="sidebar">
  <nav class="menu">
    <!-- 
      ANA SAYFA 
      Aktif sayfa kontrolü: PHP'de set edilen $active değişkeni ile yapılır
      Örnek: $active = 'dashboard' olduğunda bu link 'active' class'ını alır
    -->
    <a class="menu-item <?= ($active ?? '')==='dashboard'?'active':'' ?>" href="/index.php">
      <span class="material-symbols-rounded">space_dashboard</span>
      <span class="label">Anasayfa</span>
    </a>

    <!-- ========== TEFTİŞ MODÜLLER GRUBU ========== -->
    <h4 class="menu-group-title">Teftiş</h4>
    
    <!-- Karar Defteri: Karar verilerinin analizi ve raporlanması -->
    <a class="menu-item <?= ($active ?? '')==='karar'?'active':'' ?>" href="/karar.php">
      <span class="material-symbols-rounded">bar_chart_4_bars</span>
      <span class="label">Karar Defteri</span>
    </a>
    
    <!-- İstinaf Defteri: İstinaf işlemlerinin takibi -->
    <a class="menu-item <?= ($active ?? '')==='istinaf'?'active':'' ?>" href="/istinaf.php">
      <span class="material-symbols-rounded">checklist</span>
      <span class="label">İstinaf Defteri</span>
    </a>
    
    <!-- ========== DENETİM CETVELLERİ GRUBU ========== -->
    <h4 class="menu-group-title">Denetim Cetvelleri</h4>

    <!-- İddianame Değerlendirme: Zaman kontrolü ve analiz -->
    <a class="menu-item <?= ($active ?? '')==='iddianame'?'active':'' ?>" href="/iddianame.php">
      <span class="material-symbols-rounded">counter_1</span>
      <span class="label">İddianame Değ.</span>
    </a>

    <!-- Tensip: Zaman kontrolü ve analiz -->
    <a class="menu-item <?= ($active ?? '')==='tensip'?'active':'' ?>" href="/tensip.php">
      <span class="material-symbols-rounded">counter_2</span>
      <span class="label">Tensip</span>
    </a>

    <!-- Duruşma Kaçağı kontrolü ve analiz -->
    <a class="menu-item <?= ($active ?? '')==='durusmakacagi'?'active':'' ?>" href="/durusmakacagi.php">
      <span class="material-symbols-rounded">counter_3</span>
      <span class="label">Duruşma Kaçağı</span>
    </a>

    <!-- BYU: Zaman kontrolü ve analiz -->
    <a class="menu-item <?= ($active ?? '')==='byu'?'active':'' ?>" href="/byu.php">
      <span class="material-symbols-rounded">counter_4</span>
      <span class="label">Basit Yargılama</span>
    </a>

    <!-- Gerekçeli Karar: Zaman kontrolü ve analiz -->
    <a class="menu-item <?= ($active ?? '')==='gerekcelikarar'?'active':'' ?>" href="/gerekcelikarar.php">
      <span class="material-symbols-rounded">counter_5</span>
      <span class="label">Gerekçeli Karar</span>
    </a>

    <!-- Kanun Yolu kontrolü ve analiz -->
    <a class="menu-item <?= ($active ?? '')==='kanun_yolu'?'active':'' ?>" href="/kanunyolu.php">
      <span class="material-symbols-rounded">counter_6</span>
      <span class="label">Kanun Yolu</span>
    </a>

    <!-- Kesinleştirme ve İnfaza Verme: Zaman kontrolü ve analiz -->
    <a class="menu-item <?= ($active ?? '')==='kesinlestirme'?'active':'' ?>" href="/kesinlestirme.php">
      <span class="material-symbols-rounded">counter_7</span>
      <span class="label">Kesinleştirme/İnfaz</span>
    </a>

    <!-- ========== KONTROL MODÜLLER GRUBU ========== -->
    <h4 class="menu-group-title">Kontrol</h4>
    
    <!-- Harç Tahsil Kontrolü: Harç işlemlerinin denetimi -->
    <a class="menu-item <?= ($active ?? '')==='harctahsil'?'active':'' ?>" href="/harctahsilkontrol.php">
      <span class="material-symbols-rounded">request_quote</span>
      <span class="label">Harç Tahsil</span>
    </a>
    
    <!-- Kesinleşme Kontrolü: Karar kesinleşme sürelerinin takibi -->
    <a class="menu-item <?= ($active ?? '')==='kesinlesmekontrol'?'active':'' ?>" href="/kesinlesmek.php">
      <span class="material-symbols-rounded">event_available</span>
      <span class="label">Kesinleşme Kontrol</span>
    </a>
    
    <!-- JSON Robot: JSON dosyalarının işlenmesi ve analizi -->
    <a class="menu-item <?= ($active ?? '')==='jrobot'?'active':'' ?>" href="/jrobot.php">
      <span class="material-symbols-rounded" style="color:#F48FB1">smart_toy</span>
      <span class="label">JSON Robot</span>
    </a>

    <!-- ========== ARAÇLAR GRUBU ========== -->
    <h4 class="menu-group-title">Araçlar</h4>
    
    <!-- Kesinleşme Hesaplama: Karar kesinleşme tarihi hesaplama aracı -->
    <a class="menu-item <?= ($active ?? '')==='kesinlesme'?'active':'' ?>" href="/kesinlesme.php">
      <span class="material-symbols-rounded">work_history</span>
      <span class="label">Kesinleşme Hesapla</span>
    </a>
    
    <!-- Yargılama Gideri: Yargılama gideri hesaplama aracı -->
    <a class="menu-item <?= ($active ?? '')==='yargilama'?'active':'' ?>" href="/yargilamagideri.php">
      <span class="material-symbols-rounded">calculate</span>
      <span class="label">Yargılama Gideri</span>
    </a>

    <!-- ========== DİĞER UYGULAMALAR (HARİCİ LİNKLER) ========== -->
    <h4 class="menu-group-title">Diğer Uygulamalarımız</h4>
    <div class="menu">
      <!-- 657.com.tr - Devlet Memurları Ana Sitesi -->
      <a class="menu-item" href="https://657.com.tr/" target="_blank" rel="noopener noreferrer">
        <span class="material-symbols-rounded" aria-hidden="true" style="color:#F44336">badge</span>
        <span class="label">657 - Devlet Memurları</span>
      </a>
      
      <!-- Müdürün Dolabı - Dosya takip ve hatırlatma programı -->
      <a class="menu-item" href="https://657.com.tr/mudurun-dolabi-adliye-dosya-takip-hatirlatma-programi/" target="_blank" rel="noopener noreferrer">
        <span class="material-symbols-rounded" aria-hidden="true" style="color:#3F51B5">inventory_2</span>
        <span class="label">Müdürün Dolabı</span>
      </a>
      
      <!-- Yargılama Gideri Hesap Makinesi (Harici Versiyon) -->
      <a class="menu-item" href="https://657.com.tr/yargilama-gideri-hesap-makinesi/" target="_blank" rel="noopener noreferrer">
        <span class="material-symbols-rounded" aria-hidden="true" style="color:#4CAF50">request_quote</span>
        <span class="label">Yargılama Gideri</span>
      </a>
      
      <!-- Kesinleşme Hesaplama (Harici Versiyon) -->
      <a class="menu-item" href="https://657.com.tr/kesinlesme-hesaplama/" target="_blank" rel="noopener noreferrer">
        <span class="material-symbols-rounded" aria-hidden="true" style="color:#FF9800">check_circle</span>
        <span class="label">Kesinleşme Hesapla</span>
      </a>
    </div>
  </nav>
</aside>

