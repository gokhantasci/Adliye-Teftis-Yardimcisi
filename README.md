# Adliye Teftiş Yardımcısı

**Court Inspection Assistant** - A web application for managing court inspection workflows and administrative tasks within the Turkish Ministry of Justice.

## 🎯 Purpose

This application provides tools for court inspection staff to:
- Manage inspection records (Teftiş Defterleri)
- Track legal proceedings (Karar, İstinaf, Temyiz)
- Calculate personnel status and promotions
- Generate indictment evaluation documents
- Monitor case finalization timelines
- Calculate court fees and expenses
- Send email notifications

## 🚀 Features

### Core Modules
- **📊 Karar Defteri** - Decision registry and tracking
- **📋 İstinaf Defteri** - Appeal records management
- **📄 İddianame Değerlendirme** - Indictment evaluation and document generation
- **💰 Harç Tahsil Kontrol** - Fee collection verification
- **⏱️ Kesinleşme Hesaplama** - Case finalization calculation
- **🧮 Yargılama Gideri** - Litigation expense calculator
- **👤 Personel Hesap** - Personnel status and promotion calculations
- **🤖 JSON Robot** - Automated JSON data processing

### Technical Features
- ✅ Email notifications (restricted to @adalet.gov.tr)
- ✅ DOCX document generation
- ✅ Excel file import/export (XLSX)
- ✅ Rate limiting and abuse prevention
- ✅ Dark/Light theme support
- ✅ Responsive design
- ✅ File-based JSON data storage

## 📋 Requirements

- **PHP:** 8.0+ (tested with 8.3)
- **Web Server:** Apache or Nginx
- **PHP Extensions:**
  - json, zip, dom, mbstring, openssl, fileinfo

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed requirements.

## 🔧 Installation

```bash
# Clone repository
git clone https://github.com/gokhantasci/Adliye-Tefti-Yard-mc-s-.git
cd Adliye-Tefti-Yard-mc-s-

# Configure environment
cp .env.example .env
# Edit .env with your Gmail credentials

# Set permissions
chmod 755 data/
chmod 644 data/*.json

# Deploy on web server
# See DEPLOYMENT.md for detailed instructions
```

## 🔒 Security

- ✅ **No critical vulnerabilities** (verified by automated security scan)
- ✅ XSS protection via output escaping
- ✅ Rate limiting on email endpoints
- ✅ Domain-restricted email sending
- ✅ Input validation and sanitization
- ✅ Honeypot protection

**Security Score:** 8.5/10 - See [CODE_REVIEW_REPORT.md](CODE_REVIEW_REPORT.md)

## 📚 Documentation

- [🚀 Deployment Guide](DEPLOYMENT.md) - Installation and configuration
- [🔍 Code Review Report](CODE_REVIEW_REPORT.md) - Security and quality analysis
- [⚙️ Environment Variables](.env.example) - Configuration template

## 🏗️ Architecture

### Backend (PHP)
- API endpoints in `/api`
- Partials for reusable components
- File-based JSON storage in `/data`
- PHPMailer for email functionality

### Frontend (JavaScript)
- Vanilla JavaScript (no framework)
- jQuery for AJAX operations
- XLSX.js for Excel processing
- Material Symbols for icons

### Data Storage
- JSON files for data persistence
- No database required
- File locking for concurrent access

## 📊 Project Statistics

- **PHP Files:** 25
- **JavaScript Files:** 24
- **Lines of Code:** ~30,000+
- **Code Quality:** 8/10
- **Test Coverage:** Manual testing

## 🤝 Contributing

This is an internal government application. For issues or suggestions:
1. Check existing issues
2. Create detailed bug reports
3. Follow code style guidelines
4. Test thoroughly before submitting

## 📄 License

See repository for license information.

## 👨‍💻 Author

Gökhan TAŞÇI - [657.com.tr](https://657.com.tr)

## 🔗 Related Projects

- [657 - Devlet Memurları](https://657.com.tr/)
- [Müdürün Dolabı](https://657.com.tr/mudurun-dolabi-adliye-dosya-takip-hatirlatma-programi/)
- [Yargılama Gideri Hesap Makinesi](https://657.com.tr/yargilama-gideri-hesap-makinesi/)
- [Kesinleşme Hesaplama](https://657.com.tr/kesinlesme-hesaplama/)

## 📝 Changelog

### Latest Updates
- ✅ Added comprehensive code review documentation
- ✅ Created deployment guide
- ✅ Added environment configuration template
- ✅ Implemented .gitignore for better version control
- ✅ Security audit completed - No critical issues found

---

**Status:** ✅ Production Ready  
**Environment:** Internal Government Network  
**Language:** Turkish (TR)  
**Last Updated:** November 2025