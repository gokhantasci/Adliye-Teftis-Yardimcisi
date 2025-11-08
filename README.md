# Adliye Teftiş Yardımcısı

## 📋 Proje Hakkında

**Adliye Teftiş Yardımcısı**, adliye teftiş işlemlerini kolaylaştırmak ve hızlandırmak için geliştirilmiş kapsamlı bir web uygulamasıdır. Uygulama, adliye personelinin günlük işlemlerini daha verimli yönetmesine yardımcı olmak amacıyla çeşitli modüller ve araçlar sunar.

## ✨ Özellikler

### 📊 Ana Modüller

1. **Panel (Ana Sayfa)**
   - Uygulama güncellemeleri ve duyurular
   - E-posta bırakma kutusu
   - Kişisel notlar yönetimi

2. **İddianame Değerlendirme Kontrolü**
   - Excel dosyası yükleme ve işleme
   - Zaman kontrolü ve denetim cetveli oluşturma
   - Otomatik analiz ve raporlama

3. **İstinaf İşlemleri**
   - İstinaf dosyalarının yönetimi
   - Excel tabanlı veri işleme
   - Detaylı raporlama

4. **Temyiz İşlemleri**
   - Temyiz dosyalarının takibi
   - Excel veri analizi
   - Kapsamlı raporlama araçları

5. **Kesinleşme Kontrolü**
   - Karar kesinleşme süre takibi
   - Otomatik hesaplama
   - Detaylı sonuç raporları

6. **Kesinleşmek**
   - Kesinleşme işlemlerinin yönetimi
   - Tarih hesaplamaları
   - Resmi tatil günleri entegrasyonu

7. **Karar Yönetimi**
   - Karar dosyalarının yüklenmesi
   - Excel tabanlı analiz
   - KPI göstergeleri

8. **Harç Tahsil Kontrolü**
   - Harç işlemlerinin kontrolü
   - Excel dosya işleme
   - Özet raporlar

9. **Yargılama Gideri**
   - Yargılama gideri hesaplamaları
   - Detaylı form girişleri
   - Otomatik toplam hesaplama

10. **Kanun Yolu**
    - Kanun yolu işlemleri
    - Görsel arayüz
    - Bilgilendirme ekranı

11. **J-Robot**
    - JSON dosya yükleme ve işleme
    - Vaka listesi yönetimi
    - Hatırlatma sistemi

12. **Personel Hesap**
    - Personel bilgilerinin yönetimi
    - Hesap işlemleri
    - Kullanıcı profili

## 🚀 Kurulum

### Gereksinimler

- PHP 7.4 veya üzeri
- Web sunucusu (Apache/Nginx)
- Modern web tarayıcısı (Chrome, Edge, Firefox önerilir)

### Kurulum Adımları

1. **Projeyi İndirin**
   ```bash
   git clone https://github.com/gokhantasci/Adliye-Teftis-Yardimcisi.git
   cd Adliye-Teftis-Yardimcisi
   ```

2. **Web Sunucusunu Yapılandırın**
   - Proje klasörünü web sunucunuzun root dizinine kopyalayın
   - Apache için `.htaccess` dosyasının çalıştığından emin olun

3. **Dizin İzinlerini Ayarlayın**
   ```bash
   chmod 755 -R .
   chmod 777 data/
   ```

4. **Uygulamayı Başlatın**
   - Tarayıcınızda `http://localhost/Adliye-Teftis-Yardimcisi` adresine gidin
   - veya doğrudan `teftis.657.com.tr` adresini kullanın

## 📁 Proje Yapısı

```
Adliye-Teftis-Yardimcisi/
├── index.php                 # Ana sayfa
├── iddianame.php            # İddianame modülü
├── istinaf.php              # İstinaf modülü
├── temyiz.php               # Temyiz modülü
├── kesinlesme.php           # Kesinleşme modülü
├── kesinlesmek.php          # Kesinleşmek modülü
├── kesinlesme-kontrol.php   # Kesinleşme kontrolü
├── karar.php                # Karar yönetimi
├── harctahsilkontrol.php    # Harç tahsil kontrolü
├── yargilamagideri.php      # Yargılama gideri
├── jrobot.php               # J-Robot modülü
├── personel_hesap.php       # Personel hesap modülü
├── assets/                  # Statik dosyalar
│   ├── css/                 # Stil dosyaları
│   │   ├── style.css        # Ana stil dosyası
│   │   ├── modal-card.css   # Modal stilleri
│   │   ├── modal-click.css  # Modal etkileşim stilleri
│   │   └── hide-demo-actions.css
│   └── js/                  # JavaScript dosyaları
│       ├── app.js           # Ana uygulama scripti
│       ├── g-global.js      # Global fonksiyonlar
│       ├── iddianame.js     # İddianame işlemleri
│       ├── istinaf.js       # İstinaf işlemleri
│       ├── temyiz.js        # Temyiz işlemleri
│       ├── kesinlesme.js    # Kesinleşme işlemleri
│       ├── kesinlesme-kontrol.js
│       ├── karar-upload.js  # Karar yükleme
│       ├── karar-excel-kpis.js
│       ├── harc-tahsil.js   # Harç tahsil
│       ├── yargilamagideri.js
│       ├── kanunyolu.js     # Kanun yolu
│       ├── jrobot.js        # J-Robot
│       ├── modal-card.js    # Modal yönetimi
│       ├── modal-click.js   # Modal etkileşimler
│       ├── wire-excel-input.js
│       ├── xlsx-loader.js   # Excel yükleyici
│       └── vendor/          # Üçüncü parti kütüphaneler
│           ├── xlsx.min.js
│           └── jszip.min.js
├── partials/                # PHP parçaları
│   ├── header.php           # Sayfa başlığı
│   ├── navbar.php           # Üst menü
│   ├── sidebar.php          # Yan menü
│   └── footer.php           # Sayfa alt bilgisi
├── data/                    # Veri dosyaları
│   ├── tatiller.json        # Resmi tatil günleri
│   └── teftis.json          # Teftiş duyuruları
├── api/                     # API endpoint'leri
│   ├── notes.php            # Notlar API'si
│   └── send-mail.php        # E-posta gönderme API'si
└── README.md                # Bu dosya
```

## 💡 Kullanım

### Temel İşlevler

#### 1. Tema Değiştirme
- Sağ üst köşedeki ay/güneş ikonuna tıklayarak koyu ve açık tema arasında geçiş yapabilirsiniz

#### 2. Excel Dosyası Yükleme
- İlgili modüle gidin
- "Dosya Seç" butonuna tıklayın veya dosyayı sürükle-bırak alanına bırakın
- Excel dosyası (.xls veya .xlsx) seçin
- Uygulama otomatik olarak dosyayı işleyecektir

#### 3. Not Ekleme
- Ana sayfada "Yeni Not" butonuna tıklayın
- Notunuzu yazın ve kaydedin
- Notlar yerel depolama alanında saklanır

#### 4. E-posta Bırakma
- Ana sayfada e-posta bırakma kutusuna @adalet.gov.tr uzantılı e-posta adresinizi girin
- "Mesajı Gönder" butonuna tıklayın
- Site adresi e-posta adresinize gönderilecektir

### Modül Bazlı Kullanım

#### İddianame Modülü
1. İddianame sayfasına gidin
2. Excel dosyanızı yükleyin
3. Sistem otomatik olarak zaman kontrolü yapacaktır
4. Denetim cetvelini görüntüleyin

#### Kesinleşme Kontrolü
1. Kesinleşme kontrol sayfasına gidin
2. Excel dosyanızı yükleyin
3. Tarih bilgilerini kontrol edin
4. Resmi tatil günleri otomatik olarak hesaplanır
5. Sonuç raporunu görüntüleyin

#### Yargılama Gideri
1. Form alanlarını doldurun
2. Gerekli değerleri girin
3. Otomatik hesaplamalar yapılacaktır
4. Dökümü kopyalayabilirsiniz

## 🎨 Tema ve Tasarım

Uygulama, modern ve kullanıcı dostu bir arayüze sahiptir:
- **Material Design** ikonu seti
- **Responsive** tasarım (mobil, tablet ve masaüstü uyumlu)
- **Koyu/Açık tema** desteği
- **Erişilebilirlik** odaklı tasarım
- **Smooth animasyonlar** ve geçişler

### Renk Paleti

#### Koyu Tema (Varsayılan)
- Arka Plan: `#0f1216`
- Panel: `#171b21`
- Metin: `#e6e8eb`
- Vurgu: `#F44336` (Material Red)

#### Açık Tema
- Arka Plan: `#f7f8fa`
- Panel: `#ffffff`
- Metin: `#0b1020`
- Vurgu: `#5b6cff`

## 🔧 Teknik Detaylar

### Kullanılan Teknolojiler

- **Frontend:**
  - Vanilla JavaScript (ES6+)
  - CSS3 (CSS Variables, Grid, Flexbox)
  - Material Symbols (Icon Set)

- **Backend:**
  - PHP 7.4+
  - JSON veri depolama

- **Kütüphaneler:**
  - SheetJS (xlsx.js) - Excel dosya işleme
  - JSZip - Zip dosya işleme

### Tarayıcı Desteği

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## 📝 Geliştirme

### Kod Yapısı

Proje, modüler ve bakımı kolay bir yapıya sahiptir:

- **PHP Dosyaları**: Her modül için ayrı PHP dosyası
- **JavaScript Modülleri**: Her özellik için ayrı JS dosyası
- **CSS Yapısı**: CSS değişkenleri ile tema yönetimi
- **Partials**: Yeniden kullanılabilir PHP parçaları

### Katkıda Bulunma

1. Projeyi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'i push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

### Kod Standartları

- **JavaScript**: ESLint kurallarına uygun, açıklayıcı değişken isimleri
- **PHP**: PSR-12 standartları
- **CSS**: BEM metodolojisi benzeri sınıf isimlendirme
- **Yorum Satırları**: Türkçe, açıklayıcı ve anlaşılır

## 🐛 Sorun Bildirme

Bir hata veya öneri bildirmek için [GitHub Issues](https://github.com/gokhantasci/Adliye-Teftis-Yardimcisi/issues) sayfasını kullanabilirsiniz.

## 📄 Lisans

Bu proje açık kaynak olarak geliştirilmiştir.

## 👤 Yazar

**Gökhan TAŞÇI**
- Yazı İşleri Müdürü - 139329
- Sakarya

## 📞 İletişim

Sorularınız için e-posta: gkhntasci@gmail.com

## 🙏 Teşekkürler

Bu uygulama, adliye teftiş süreçlerini kolaylaştırmak için tüm meslektaşlarımızın kullanımına sunulmuştur.

---

**Not:** Uygulama sürekli geliştirilmektedir. Güncellemeler için düzenli olarak kontrol edin.

## 🔄 Sürüm Geçmişi

### v1.0 (Mevcut)
- ✅ Tüm temel modüller
- ✅ Excel dosya işleme
- ✅ Tema desteği
- ✅ Responsive tasarım
- ✅ Modal sistemi
- ✅ Not yönetimi
- ✅ E-posta entegrasyonu

### Gelecek Sürümler
- 🔜 Gelişmiş raporlama
- 🔜 PDF export özelliği
- 🔜 Kullanıcı yetkilendirme sistemi
- 🔜 Veritabanı entegrasyonu
- 🔜 REST API

---

**Son Güncelleme:** 2025-11-08