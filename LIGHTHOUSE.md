# Lighthouse Optimization Guide

This guide provides recommendations for achieving high Lighthouse scores across all categories.

## Current Optimizations

### ✅ Already Implemented

1. **Performance**
   - ✅ Preload critical resources (CSS, JS)
   - ✅ Service Worker for caching
   - ✅ Minified vendor libraries
   - ✅ GPU acceleration for animations
   - ✅ Defer non-critical JavaScript

2. **Accessibility**
   - ✅ Semantic HTML structure
   - ✅ ARIA labels and roles
   - ✅ Color contrast (dark/light themes)
   - ✅ Focus visible indicators
   - ✅ Touch-friendly tap targets (44x44px)

3. **Best Practices**
   - ✅ HTTPS (when deployed)
   - ✅ No mixed content
   - ✅ Secure HTTP headers (.htaccess)
   - ✅ No JavaScript errors (tested)

4. **SEO**
   - ✅ Meta descriptions
   - ✅ Viewport meta tag
   - ✅ Semantic headings
   - ✅ Readable font sizes
   - ✅ PWA manifest

5. **PWA**
   - ✅ Web app manifest
   - ✅ Service worker
   - ✅ Offline support
   - ✅ Installable
   - ✅ Apple touch icons

## Additional Recommendations

### 🎯 Performance Optimizations

#### 1. Image Optimization

**Current Status**: Using SVG for favicon  
**Recommendation**: Optimize all images

```bash
# Install image optimization tools
npm install --save-dev imagemin imagemin-mozjpeg imagemin-pngquant

# Create optimization script
```

**Add to package.json**:
```json
{
  "scripts": {
    "optimize-images": "node scripts/optimize-images.js"
  }
}
```

#### 2. Lazy Loading

Add lazy loading to images:

```html
<!-- Before -->
<img src="large-image.jpg" alt="Description">

<!-- After -->
<img src="large-image.jpg" alt="Description" loading="lazy">
```

#### 3. Font Loading Optimization

Current font loading can be improved:

```html
<!-- Add font-display to Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Add to CSS:
```css
@font-face {
  font-family: 'Inter';
  font-display: swap;
}
```

#### 4. Resource Hints

Already implemented:
- ✅ `preconnect` for Google Fonts
- ✅ `preload` for critical CSS/JS

Additional recommendations:
```html
<!-- Add dns-prefetch for external resources -->
<link rel="dns-prefetch" href="https://code.jquery.com">
```

#### 5. Code Splitting

For larger applications, consider splitting JavaScript:

```javascript
// Dynamic imports for route-specific code
if (currentPage === 'iddianame') {
  import('./iddianame.js').then(module => {
    module.init();
  });
}
```

### ♿ Accessibility Improvements

#### 1. Skip to Main Content

Already added in mobile-safari.css, now add to HTML:

```html
<!-- Add at the top of body in header.php -->
<a href="#main-content" class="skip-to-main">Ana içeriğe geç</a>

<!-- Add id to main content -->
<main class="content" id="main-content">
```

#### 2. Form Labels

Ensure all form inputs have associated labels:

```html
<!-- Good -->
<label for="email-input">E-posta</label>
<input type="email" id="email-input" name="email">

<!-- Also good -->
<label>
  E-posta
  <input type="email" name="email">
</label>
```

#### 3. Button Accessibility

```html
<!-- Add descriptive aria-labels -->
<button aria-label="Temayı değiştir" id="themeToggle">
  <span class="material-symbols-rounded" aria-hidden="true">dark_mode</span>
</button>
```

#### 4. Focus Management

For modals and dynamic content:

```javascript
// When opening a modal
modal.addEventListener('shown', function() {
  const firstFocusable = modal.querySelector('button, input, a');
  firstFocusable?.focus();
});
```

### 🔍 SEO Enhancements

#### 1. Structured Data

Add JSON-LD structured data:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Adliye Teftiş Yardımcısı",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "TRY"
  }
}
</script>
```

#### 2. Open Graph Tags

Add social media sharing tags:

```html
<meta property="og:title" content="Adliye Teftiş Yardımcısı">
<meta property="og:description" content="Adliye teftiş işlemlerini kolaylaştırmak için geliştirilmiş web uygulaması">
<meta property="og:image" content="/assets/img/og-image.png">
<meta property="og:url" content="https://teftis.657.com.tr">
<meta property="og:type" content="website">
```

#### 3. Sitemap

Create a sitemap.xml:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://teftis.657.com.tr/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://teftis.657.com.tr/iddianame</loc>
    <priority>0.8</priority>
  </url>
  <!-- Add all pages -->
</urlset>
```

#### 4. robots.txt

Create robots.txt:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /data/

Sitemap: https://teftis.657.com.tr/sitemap.xml
```

### 📱 PWA Improvements

#### 1. Install Prompt

Add install prompt handler:

```javascript
// Add to app.js
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.style.display = 'block';
    installBtn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installed');
        }
        deferredPrompt = null;
      });
    });
  }
});
```

#### 2. Update Notification

Add service worker update notification:

```javascript
// In sw.js registration
navigator.serviceWorker.register('/sw.js').then(reg => {
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Show update available notification
        showToast({
          type: 'info',
          title: 'Güncelleme Mevcut',
          body: 'Yeni bir sürüm hazır. Sayfayı yenileyebilirsiniz.'
        });
      }
    });
  });
});
```

## Testing Lighthouse Scores

### Local Testing

1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select categories to test
4. Click "Generate report"

### CI/CD Testing

Add to GitHub Actions:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [ main ]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:8080
            http://localhost:8080/iddianame
          uploadArtifacts: true
```

## Target Scores

### Current Baseline
- Performance: TBD (needs testing)
- Accessibility: 90+ (target)
- Best Practices: 95+ (target)
- SEO: 90+ (target)
- PWA: 100 (target with icons)

### Improvements Timeline

**Phase 1 (Completed)**
- ✅ Basic PWA setup
- ✅ Mobile optimization
- ✅ Safari compatibility

**Phase 2 (Recommended)**
- 🎯 Generate PWA icons
- 🎯 Add structured data
- 🎯 Implement lazy loading
- 🎯 Add install prompt

**Phase 3 (Optional)**
- 📋 Image optimization pipeline
- 📋 Code splitting
- 📋 Advanced caching strategies
- 📋 Performance monitoring

## Monitoring

Consider adding performance monitoring:

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- Google PageSpeed Insights

## Resources

- [Lighthouse Scoring Guide](https://web.dev/performance-scoring/)
- [Web.dev](https://web.dev/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Accessibility Guide](https://web.dev/accessible/)
