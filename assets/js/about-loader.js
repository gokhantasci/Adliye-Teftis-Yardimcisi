/* ===============================
 * HAKKINDA KARTI - README.MD LOADER
 * =============================== */
(function(){
  'use strict';

  function loadAboutContent() {
    const aboutContent = document.getElementById('aboutContent');
    if (!aboutContent) return;

    // README.md dosyasını fetch ile oku
    fetch('/README.md')
      .then(function(response) {
        if (!response.ok) throw new Error('README.md bulunamadı');
        return response.text();
      })
      .then(function(markdown) {
        // Basit markdown -> HTML dönüşümü
        const html = parseMarkdown(markdown);
        aboutContent.innerHTML = html;
      })
      .catch(function(error) {
        console.error('README yükleme hatası:', error);
        aboutContent.innerHTML = '<p class="muted">Hakkında bilgisi yüklenemedi.</p>';
      });
  }

  // Basit markdown parser
  function parseMarkdown(md) {
    if (!md) return '';

    const html = md
      // Kod blokları (```)
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, function(match, lang, code) {
        return '<pre style="background:var(--bg-secondary,#f5f5f5);color:var(--text,inherit);padding:12px;border-radius:6px;overflow-x:auto;margin:16px 0;"><code style="font-family:monospace;font-size:0.9em;">' +
          code.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
          '</code></pre>';
      })

      // Başlıklar
      .replace(/^### (.*$)/gim, '<h3 style="margin:24px 0 12px 0;font-size:1.25rem;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="margin:32px 0 16px 0;font-size:1.5rem;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="margin:40px 0 20px 0;font-size:2rem;">$1</h1>')

      // Kalın metin
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')

      // İtalik metin
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')

      // Satır içi kod
      .replace(/`(.*?)`/gim, '<code style="background:var(--bg-secondary,#f5f5f5);color:var(--text,inherit);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em;">$1</code>')

      // Linkler
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--primary,#4f46e5);text-decoration:none;">$1</a>')

      // Liste öğeleri (unordered)
      .replace(/^\- (.*$)/gim, '<li style="margin:4px 0;">$1</li>')

      // Yatay çizgi
      .replace(/^---$/gim, '<hr style="margin:24px 0;border:0;border-top:1px solid var(--border-color,#ddd);">')

      // Paragraflar (iki satır arası boşluk)
      .split('\n\n')
      .map(function(para) {
        para = para.trim();
        if (!para) return '';

        // Liste öğelerini algıla
        if (para.indexOf('<li') !== -1) {
          return '<ul style="margin:12px 0;padding-left:24px;list-style-type:disc;">' + para + '</ul>';
        }

        // Başlık veya HR ise olduğu gibi bırak
        if (para.indexOf('<h') === 0 || para.indexOf('<hr') === 0 || para.indexOf('<pre') === 0) {
          return para;
        }

        // Diğer durumlarda paragraf yap
        return '<p style="margin:12px 0;">' + para + '</p>';
      })
      .join('\n');

    return html;
  }

  // Sayfa yüklendiğinde çalıştır
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAboutContent);
  } else {
    loadAboutContent();
  }
})();
