/**
 * TECTAK - Haber Detay Mantığı
 * Geliştirici: Abdullah GÜLER
 * LinkedIn: https://www.linkedin.com/in/abdullah-g%C3%BCler-2a926b29b/
 */

console.log("%c📰 TECTAK Haber Sistemi Aktif", "color: #00D4FF; font-weight: bold;");
console.log("%c👨‍💻 Geliştirici: Abdullah GÜLER", "color: #00FF88;");

document.addEventListener('DOMContentLoaded', () => {
  const contentArea = document.getElementById('blog-content-area');
  
  const urlParams = new URLSearchParams(window.location.search);
  const newsId = parseInt(urlParams.get('id'));

  if (!newsId || !window.news) {
    contentArea.innerHTML = `<div style="text-align:center; padding: 100px;">Haber bulunamadı. <a href="index.html" style="color:var(--accent-blue)">Geri dön</a></div>`;
    return;
  }

  const item = window.news.find(n => n.id === newsId);

  if (!item) {
    contentArea.innerHTML = `<div style="text-align:center; padding: 100px;">Haber bulunamadı. <a href="index.html" style="color:var(--accent-blue)">Geri dön</a></div>`;
    return;
  }

  // Update title
  document.title = `${item.title} — TECTAK`;

  let imagesHtml = '';
  if (item.images && item.images.length > 0) {
    // Only use the first image and center it
    imagesHtml = `<div class="blog-single-image-wrapper">
      <img src="${item.images[0]}" class="blog-img-centered" alt="Haber Görseli">
    </div>`;
  }

  contentArea.innerHTML = `
    <article class="reveal revealed blog-article-centered">
      <header class="blog-header-centered">
        <div class="news-card-date" style="margin-bottom:12px;">${item.date}</div>
        <h1 class="blog-title-centered">${item.title}</h1>
        <div class="blog-meta">
          <span>✍️ ${item.author}</span>
          <span>📂 Teknoloji</span>
          <span>🔗 Kaynak: <strong>${item.source}</strong></span>
        </div>
      </header>

      ${imagesHtml}

      <div class="blog-content-centered">
        ${item.content}
      </div>

      <footer class="blog-post-footer">
        <div class="share-group">
          <span>Paylaş:</span>
          <button class="share-btn" data-platform="x" title="X'te Paylaş">𝕏</button>
          <button class="share-btn" data-platform="facebook" title="Facebook'ta Paylaş">f</button>
          <button class="share-btn" data-platform="linkedin" title="LinkedIn'de Paylaş">in</button>
        </div>
        <div class="blog-tags">
          <span class="tag">#teknoloji</span>
          <span class="tag">#${item.source.toLowerCase().replace('.', '')}</span>
          <span class="tag">#tectak</span>
        </div>
      </footer>
    </article>
  `;

  // --- Share Logic ---
  const shareButtons = document.querySelectorAll('.share-btn');
  const pageUrl = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(item.title);

  shareButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      let shareUrl = '';

      if (platform === 'x') {
        shareUrl = `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`;
      } else if (platform === 'facebook') {
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
      } else if (platform === 'linkedin') {
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    });
  });
});
