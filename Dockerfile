# Adliye Teftiş Yardımcısı - Docker Image
FROM php:8.2-apache

# Sistem bağımlılıklarını yükle
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

# Apache mod_rewrite'ı etkinleştir (.htaccess için gerekli)
RUN a2enmod rewrite

# Apache AllowOverride ayarını yapılandır
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' \
    /etc/apache2/apache2.conf

# Çalışma dizinini ayarla
WORKDIR /var/www/html

# Uygulama dosyalarını kopyala
COPY . /var/www/html/

# Data dizinine yazma izni ver
RUN chown -R www-data:www-data /var/www/html/data && \
    chmod -R 775 /var/www/html/data

# Port 80'i aç
EXPOSE 80

# Apache'yi başlat
CMD ["apache2-foreground"]
