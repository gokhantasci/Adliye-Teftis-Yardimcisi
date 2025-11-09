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
   - Word belgesi oluşturma

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

7. **Kesinleştirme**
   - Karar kesinleştirme işlemleri
   - Tarih ve süre hesaplamaları
   - İtiraz süreleri takibi

8. **Karar Yönetimi**
   - Karar dosyalarının yüklenmesi
   - Excel tabanlı analiz
   - KPI göstergeleri

9. **Harç Tahsil Kontrolü**
   - Harç işlemlerinin kontrolü
   - Excel dosya işleme
   - Özet raporlar

10. **Yargılama Gideri**
    - Yargılama gideri hesaplamaları
    - Detaylı form girişleri
    - Otomatik toplam hesaplama

11. **Kanun Yolu**
    - Kanun yolu işlemleri
    - Görsel arayüz
    - Bilgilendirme ekranı

12. **J-Robot**
    - JSON dosya yükleme ve işleme
    - Vaka listesi yönetimi
    - Hatırlatma sistemi

13. **Personel Hesap**
    - Personel bilgilerinin yönetimi
    - Hesap işlemleri
    - Kullanıcı profili

14. **BYU (Büro Yönetim Usulü)**
    - BYU işlemlerinin yönetimi
    - Excel veri analizi
    - Rapor oluşturma

15. **Duruşma Kaçağı**
    - Duruşma kaçağı takibi
    - Veri analizi ve raporlama

16. **Tensip**
    - Tensip işlemlerinin yönetimi
    - Excel dosya işleme
    - Detaylı analiz

17. **Gerekçeli Karar**
    - Gerekçeli karar takibi
    - Excel veri analizi
    - Word belgesi oluşturma

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
├── gerekcelikarar.php       # Gerekçeli karar modülü
├── istinaf.php              # İstinaf modülü
├── temyiz.php               # Temyiz modülü
├── kesinlesme.php           # Kesinleşme modülü
├── kesinlesmek.php          # Kesinleşmek modülü
├── kesinlesme-kontrol.php   # Kesinleşme kontrolü
├── kesinlestirme.php        # Kesinleştirme modülü
├── karar.php                # Karar yönetimi
├── harctahsilkontrol.php    # Harç tahsil kontrolü
├── yargilamagideri.php      # Yargılama gideri
├── kanunyolu.php            # Kanun yolu modülü
├── jrobot.php               # J-Robot modülü
├── byu.php                  # BYU modülü
├── durusmakacagi.php        # Duruşma kaçağı modülü
├── tensip.php               # Tensip modülü
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
│       ├── utils.js         # Merkezi yardımcı fonksiyonlar
│       ├── iddianame.js     # İddianame işlemleri
│       ├── gerekcelikarar.js # Gerekçeli karar işlemleri
│       ├── istinaf.js       # İstinaf işlemleri
│       ├── temyiz.js        # Temyiz işlemleri
│       ├── kesinlesme.js    # Kesinleşme işlemleri
│       ├── kesinlesme-kontrol.js
│       ├── kesinlestirme.js # Kesinleştirme işlemleri
│       ├── karar-upload.js  # Karar yükleme
│       ├── karar-excel-kpis.js
│       ├── harc-tahsil.js   # Harç tahsil
│       ├── yargilamagideri.js
│       ├── kanunyolu.js     # Kanun yolu
│       ├── byu.js           # BYU işlemleri
│       ├── durusmakacagi.js # Duruşma kaçağı
│       ├── tensip.js        # Tensip işlemleri
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

## 🔗 Temiz URL'ler ve Feed Desteği

### Temiz URL'ler

Uygulama artık `.htaccess` ile temiz URL'leri desteklemektedir:

```
Eski: https://teftis.657.com.tr/iddianame.php
Yeni: https://teftis.657.com.tr/iddianame

Eski: https://teftis.657.com.tr/istinaf.php
Yeni: https://teftis.657.com.tr/istinaf
```

Tüm sayfalara `.php` uzantısı olmadan erişilebilir.

### RSS/Atom Feed Desteği

Uygulama güncellemeleri ve duyurularını takip etmek için RSS veya Atom feed kullanabilirsiniz:

- **RSS Feed**: `https://teftis.657.com.tr/feed` veya `https://teftis.657.com.tr/rss`
- **Atom Feed**: `https://teftis.657.com.tr/atom`

RSS okuyucunuza bu adresleri ekleyerek güncel duyurulardan haberdar olabilirsiniz.

#### Popüler RSS Okuyucular
- Feedly (Web, Mobil)
- Inoreader (Web, Mobil)
- NewsBlur (Web, Mobil)
- Outlook (Masaüstü - RSS klasörü)

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
  - TeftisUtils (utils.js) - Merkezi yardımcı fonksiyonlar

### Yeni Özellikler (v1.1)

#### Merkezi Yardımcı Kütüphaneler

**JavaScript Utilities (`assets/js/utils.js`)**
- `letterToIndex(col)` - Excel sütun harfini indekse çevirir
- `escapeHtml(str)` - XSS koruması için HTML escape
- `normalizeTurkish(str)` - Türkçe metin normalizasyonu
- `showToast(opts)` - Bildirim gösterme
- `toastWithIcon(type, title, msg)` - İkonlu bildirim
- `formatNumber(n)` - Türkçe sayı formatlama
- `formatDate(d)` - Türkçe tarih formatlama
- `debounce(fn, delay)` - Fonksiyon debounce
- `isExcelFile(file)` - Excel dosya kontrolü
- `isValidAdaletEmail(email)` - @adalet.gov.tr email kontrolü
- `extractEmail(text)` - Metinden email çıkarma
- `formatRetryMessage(sec)` - Bekleme mesajı formatlama
- `createElement(tag, attrs, html)` - DOM element oluşturma

**PHP API Utilities (`api/utils.php`)**
- `api_respond($ok, $data, $code)` - JSON yanıt gönder
- `api_error($error, $code)` - Hata yanıtı gönder
- `api_read_json($path)` - JSON dosya oku (kilit ile)
- `api_write_json($path, $data)` - JSON dosya yaz (atomik)
- `api_get_json_body()` - İstek gövdesinden JSON al
- `api_generate_id($length)` - Benzersiz ID üret
- `api_validate_required($data, $required)` - Zorunlu alanları kontrol et
- `api_sanitize($str)` - Güvenli string temizleme
- `api_check_method($method)` - HTTP metod kontrolü
- `api_require_method($method)` - HTTP metod zorunluluğu
- `api_get_client_ip()` - İstemci IP adresi al
- `api_log($message, $level)` - API loglama
- `api_enable_cors($origins)` - CORS başlıkları ekle

#### .htaccess Performans Optimizasyonları

- **Gzip Sıkıştırma**: HTML, CSS, JS, JSON, XML ve fontlar için otomatik sıkıştırma
- **Tarayıcı Önbelleği**:
  - HTML/PHP: 10 dakika
  - CSS/JS: 1 hafta
  - Görseller: 1 ay
  - Fontlar: 1 yıl
  - JSON/Feed: 10 dakika - 1 saat
- **Güvenlik Başlıkları**:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
- **Dizin Listelemesi**: Kapalı
- **Hassas Dosya Koruması**: `.git`, `.env`, `.log` dosyaları korumalı

### Kod Kalitesi ve Standartları

#### ESLint Konfigürasyonu

Proje artık ESLint ile kod kalitesi kontrolü yapmaktadır:

```bash
# JavaScript dosyalarını kontrol et
npm run lint

# Otomatik düzeltme
npm run lint:fix
```

**Kurallar:**
- ES6+ standartları
- Tek tırnak kullanımı (strings)
- 2 boşluk indentasyon
- Noktalı virgül zorunlu
- console.log kullanımı uyarı
- debugger kullanımı yasak
- Kullanılmayan değişkenler uyarı

#### Güvenlik

- ✅ **Şifre ve Kimlik Bilgileri**: Tüm hassas bilgiler environment variables ile yönetilir
- ✅ **XSS Koruması**: HTML escape fonksiyonları (`escapeHtml`)
- ✅ **CSRF Koruması**: API isteklerinde token doğrulama
- ✅ **Rate Limiting**: E-posta gönderimi için sıkı limit (60 saniye ve 10 dakika pencereleri)
- ✅ **Input Sanitization**: Tüm kullanıcı girişleri temizlenir
- ✅ **Güvenli E-posta**: Sadece @adalet.gov.tr adresleri kabul edilir

#### Performans Optimizasyonları

- ✅ **Gzip Sıkıştırma**: Tüm metin tabanlı dosyalar sıkıştırılır
- ✅ **Browser Caching**: Statik dosyalar için uzun süreli önbellekleme
- ✅ **Async Loading**: JavaScript dosyaları asenkron yüklenir
- ✅ **Lazy Loading**: Görseller ve ağır içerikler gerektiğinde yüklenir
- ✅ **Minification**: Üretim için minified kütüphaneler kullanılır


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

### v1.2 (Güncel - 2025-11-09)
- ✅ **ESLint Entegrasyonu**: JavaScript kod kalitesi kontrolü
  - Flat config (ESLint v9+) kullanımı
  - 0 hata, 243 uyarı (optimum seviye)
  - Otomatik kod düzeltme desteği
- ✅ **Güvenlik İyileştirmeleri**:
  - Tüm proje tarandı, şifre/kimlik bilgisi yok
  - Environment variables kullanımı doğrulandı
  - XSS koruması güçlendirildi
- ✅ **Kod Kalitesi**:
  - Syntax hataları düzeltildi (wire-excel-input.js, yargilamagideri.js)
  - 385+ stil sorunu otomatik düzeltildi
  - Tutarlı kod stili (quotes, spacing, indentation)
- ✅ **Performans**:
  - Kod optimizasyonları
  - Gereksiz console.log ifadeleri işaretlendi
- ✅ **Dokümantasyon**:
  - README tam güncellendi
  - Tüm modüller listelendi (BYU, Duruşma Kaçağı, Tensip, vb.)
  - Kod kalitesi standartları eklendi

### v1.1 (2025-11-08)
- ✅ Merkezi JavaScript yardımcı kütüphanesi (`utils.js`)
- ✅ Merkezi PHP API yardımcı kütüphanesi (`api/utils.php`)
- ✅ RSS/Atom feed desteği (`/api/feed.php`, `/feed`, `/rss`, `/atom`)
- ✅ .htaccess ile temiz URL'ler (`.php` uzantısı olmadan)
- ✅ Performans optimizasyonları:
  - Gzip sıkıştırma
  - Tarayıcı önbelleği (caching)
  - Güvenlik başlıkları
- ✅ Kod tekrarlarının azaltılması ve okunabilirlik iyileştirmeleri

### v1.0 (Önceki)
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

**Son Güncelleme:** 2025-11-09