# Deployment and Setup Guide
## Adliye Teftiş Yardımcısı

### System Requirements

#### Server Requirements
- **PHP:** 8.0 or higher (tested with PHP 8.3)
- **Web Server:** Apache or Nginx
- **PHP Extensions Required:**
  - `json` (for JSON handling)
  - `zip` (for DOCX file generation)
  - `dom` (for XML/DOCX processing)
  - `mbstring` (for Turkish character handling)
  - `fileinfo` (for file type detection)
  - `openssl` (for secure email sending)

#### Optional Extensions
- `opcache` (for performance)
- `zlib` (for compression)

### Installation Steps

#### 1. Clone or Download Repository
```bash
git clone https://github.com/gokhantasci/Adliye-Tefti-Yard-mc-s-.git
cd Adliye-Tefti-Yard-mc-s-
```

#### 2. Set Up Environment Variables
```bash
# Copy the environment template
cp .env.example .env

# Edit .env and configure your Gmail credentials
nano .env
```

**Required Environment Variables:**
- `GMAIL_USER`: Gmail address for sending emails
- `GMAIL_APP_PASSWORD`: App-specific password from Gmail

**How to Get Gmail App Password:**
1. Go to Google Account settings
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Use this password in `.env` file

#### 3. Set Directory Permissions
```bash
# Ensure data directory is writable
chmod 755 data/
chmod 644 data/*.json

# If running as www-data user (Apache/Nginx)
chown -R www-data:www-data data/
```

#### 4. Configure Web Server

**Apache (.htaccess)**
```apache
# Enable rewrite engine if needed
# RewriteEngine On

# Set PHP options
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value max_execution_time 300
php_value memory_limit 256M

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
```

**Nginx (server block)**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/Adliye-Tefti-Yard-mc-s-;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Security: Deny access to data files
    location ^~ /data/ {
        location ~ \.json$ {
            deny all;
        }
    }

    # Security: Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

#### 5. Verify PHP Configuration
```bash
php -v  # Check PHP version
php -m  # List installed modules
```

Ensure these extensions are enabled:
- [x] json
- [x] zip
- [x] dom
- [x] mbstring
- [x] openssl

### Required Data Files

The application requires these JSON files in the `data/` directory:

1. **tatiller.json** - Holiday definitions
2. **teftis.json** - Inspection data (use `teftis.example.json` as template)
3. **tebligatlar.json** - Notification records
4. **notes.json** - User notes (auto-created)
5. **mail_guard.json** - Rate limiting data (auto-created)
6. **iddianame.docx** - Template for indictment documents

### Security Considerations

#### Production Deployment
1. **Environment Variables**
   - Never commit `.env` file to version control
   - Use secure app-specific passwords
   - Rotate credentials regularly

2. **File Permissions**
   - Data directory: 755 (drwxr-xr-x)
   - Data files: 644 (-rw-r--r--)
   - PHP files: 644 (-rw-r--r--)

3. **Email Security**
   - Email sending is restricted to `@adalet.gov.tr` domain only
   - Rate limiting is enforced (1 req/min, 5 req/10min)
   - Honeypot protection enabled

4. **Network Security**
   - Deploy behind firewall for internal use
   - Consider VPN access for remote users
   - Use HTTPS in production (SSL/TLS certificate)

#### HTTPS Configuration (Recommended)
```bash
# Using Let's Encrypt (Certbot)
sudo certbot --nginx -d your-domain.com
```

### Backup and Maintenance

#### Backup Data Files
```bash
# Create backup of data directory
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Backup to remote location
rsync -avz data/ backup-server:/backups/teftis/
```

#### Update Application
```bash
# Pull latest changes
git pull origin main

# Clear any cached data if needed
rm -f data/*.tmp
```

### Monitoring and Logs

#### Check Error Logs
```bash
# Apache logs
tail -f /var/log/apache2/error.log

# Nginx logs
tail -f /var/log/nginx/error.log

# PHP-FPM logs
tail -f /var/log/php8.3-fpm.log
```

#### Monitor Application
- Check `data/mail_guard.json` for email sending activity
- Monitor disk space for JSON file growth
- Review error logs regularly

### Troubleshooting

#### Common Issues

**1. Email Not Sending**
```bash
# Check environment variables
printenv | grep GMAIL

# Test PHP mail functionality
php -r "var_dump(class_exists('PHPMailer\\PHPMailer\\PHPMailer'));"
```

**2. DOCX Generation Fails**
```bash
# Verify ZipArchive is available
php -r "var_dump(class_exists('ZipArchive'));"

# Check template file exists
ls -la data/iddianame.docx
```

**3. Permission Denied Errors**
```bash
# Fix data directory permissions
sudo chown -R www-data:www-data data/
chmod 755 data/
chmod 644 data/*.json
```

**4. JSON Parse Errors**
```bash
# Validate JSON files
cat data/teftis.json | python3 -m json.tool
```

### Performance Optimization

#### PHP-FPM Configuration
```ini
; /etc/php/8.3/fpm/pool.d/www.conf
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
```

#### Enable OPcache
```ini
; /etc/php/8.3/mods-available/opcache.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### Support and Documentation

- **Code Review Report:** See `CODE_REVIEW_REPORT.md`
- **Security Assessment:** No critical vulnerabilities found
- **License:** Check repository for license information
- **Issues:** Report to repository issue tracker

### Testing Deployment

#### Health Check
Visit: `https://your-domain.com/api/iddianame_writer.php?ping`

Expected response:
```json
{
  "ok": true,
  "cwd": "/path/to/app",
  "script": "/path/to/app/api/iddianame_writer.php",
  "temp": "/tmp",
  "hasZip": true,
  "tplExists": true
}
```

#### Test Email Sending
1. Navigate to homepage
2. Enter email address in "E-posta Bırakma Kutusu"
3. Check for successful send confirmation

### Intended Use

This application is designed for:
- Internal use within Turkish Ministry of Justice network
- Court inspection and management workflows
- Personnel calculation and document generation
- Email notifications to government addresses only

**Deployment Environment:** Internal government network with restricted access

---

**Last Updated:** 2025-11-08  
**Version:** 1.0  
**Maintainer:** See repository for contact information
