// TECTAK - Etkinlik Detay Mantığı

document.addEventListener('DOMContentLoaded', () => {
  const detailCard = document.getElementById('detail-card');
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = parseInt(urlParams.get('id'));

  const icons = {
    clock: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    location: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    org: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  };

  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  async function initDetail() {
    let eventDataList = typeof events !== 'undefined' ? events : [];

    if (window.events) {
      eventDataList = window.events;
    } else if (window.location.protocol !== 'file:') {
      try {
        const resp = await fetch('./events.json');
        if (resp.ok) {
          eventDataList = await resp.json();
          window.events = eventDataList;
        }
      } catch (e) {
        console.warn('Local events.json could not be fetched:', e);
      }
    }

    const event = eventDataList.find(e => e.id === eventId);

    if (isNaN(eventId) || !event) {
      detailCard.innerHTML = `<div style="text-align:center; padding: 40px;">
        <h3 style="color: var(--accent-red); margin-bottom: 16px;">Etkinlik bulunamadı veya hatalı bağlantı!</h3>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Lütfen geçerli bir etkinlik seçin.</p>
        <a href="index.html" class="register-btn-large" style="display:inline-block;">Ana Sayfaya Dön</a>
      </div>`;
      setTimeout(() => {
        if (window.location.pathname.includes('event')) {
          window.location.href = 'index.html';
        }
      }, 4000);
      return;
    }

    const d = new Date(event.date);
    const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    const typeColor = typeColors[event.type] || '#888';
    const isFree = event.price === 'Ücretsiz';

    let isClosed = event.registrationStatus === 'closed';
    let regBtnUrl = isClosed ? '#' : (event.registrationUrl || '#');
    let regBtnLabel = isClosed ? 'Başvurular Kapandı' : ((regBtnUrl === '#') ? 'Başvuru Sayfası Aktif Değil' : 'Resmi Sitesinden Kayıt Ol');
    
    let onClickAction = isClosed
      ? "onclick='return false;' style='opacity:0.5; cursor:not-allowed; filter:grayscale(100%);'"
      : (regBtnUrl === '#'
          ? "onclick='alert(\"Bu etkinlik için 2026 yılı resmi başvuru/kayıt sayfası henüz erişime açılmamıştır. Lütfen daha sonra tekrar deneyiniz.\"); return false;'"
          : "target='_blank' rel='noopener noreferrer'");

    // Generate Google Calendar Link
    const dateClean = event.date.replace(/-/g, '');
    const startClean = (event.time || "09:00").replace(/:/g, '') + '00';
    const endClean = (event.endTime || "18:00").replace(/:/g, '') + '00';
    const datesStr = `${dateClean}T${startClean}/${dateClean}T${endClean}`;
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${datesStr}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location + ', ' + event.city)}&sprop=website:tectak.co&sf=true&output=xml`;

    detailCard.innerHTML = `
      <div class="detail-header">
        <div style="margin-bottom: 12px;">
          <span class="event-type-badge" style="background:${typeColor}20;color:${typeColor}">${event.type}</span>
          <span class="event-category-tag" style="margin-left: 8px;">${(typeof categories !== 'undefined' ? categories.find(c => c.id === event.category)?.label : null) || event.category}</span>
        </div>
        <h1>${event.title}</h1>
        <div class="detail-meta">
          <div>${icons.calendar} ${dateStr}</div>
          <div>${icons.clock} ${event.time} - ${event.endTime}</div>
          <div>${icons.location} ${event.location} (${event.city})</div>
          <div>${icons.org} ${event.organizer}</div>
        </div>
      </div>
      <div class="detail-description">
        ${event.description}
      </div>
      <div id="detail-map" class="detail-map"></div>
      <div class="detail-footer" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="gcal-btn" style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            font-weight: 600;
            font-size: 0.9rem;
            text-decoration: none;
            transition: all 0.3s;
          " onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='var(--accent-blue)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='var(--glass-border)';">
            📅 Takvime Ekle
          </a>
          
          <div class="share-group" style="display: flex; align-items: center; gap: 8px;">
            <button class="share-btn" data-platform="x" title="X'te Paylaş" style="width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; font-weight: 700;">𝕏</button>
            <button class="share-btn" data-platform="facebook" title="Facebook'ta Paylaş" style="width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; font-weight: 700;">f</button>
            <button class="share-btn" data-platform="linkedin" title="LinkedIn'de Paylaş" style="width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; font-weight: 700;">in</button>
            <button class="share-btn" data-platform="copy" title="Bağlantıyı Kopyala" style="width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; font-weight: 700;">🔗</button>
          </div>
        </div>
        
        <a href="${regBtnUrl}" class="register-btn-large" ${onClickAction}>${regBtnLabel}</a>
      </div>
    `;

    document.title = `${event.title} — TECTAK`;

    // Initialize Map for detail page
    const isMobile = window.innerWidth <= 768;
    const map = L.map('detail-map', {
      dragging: !isMobile,
      tap: !isMobile
    }).setView([event.lat, event.lng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO'
    }).addTo(map);

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
            width:16px;height:16px;border-radius:50%;
            background:${typeColor};
            box-shadow:0 0 16px ${typeColor}80;
            border:2px solid #fff;
          "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    L.marker([event.lat, event.lng], { icon })
      .bindPopup(`<b>${event.title}</b><br>${event.location}`)
      .addTo(map)
      .openPopup();

    // Map gesture lock for mobile viewports
    if (isMobile) {
      const mapEl = document.getElementById('detail-map');
      if (mapEl) {
        mapEl.style.position = 'relative';
        const overlay = document.createElement('div');
        overlay.id = 'map-lock-overlay';
        overlay.innerHTML = `
          <div class="map-lock-content" style="
            background: rgba(20, 25, 45, 0.85);
            border: 1px solid var(--glass-border);
            padding: 12px 24px;
            border-radius: 50px;
            color: var(--text-primary);
            font-weight: 600;
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          ">
            <span class="map-lock-icon">📍</span>
            <span class="map-lock-text">Haritada gezinmek için dokunun</span>
          </div>
        `;
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(10, 15, 30, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          cursor: pointer;
          transition: opacity 0.4s ease, visibility 0.4s ease;
          border-radius: var(--radius-sm);
        `;

        mapEl.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.style.opacity = '0';
          overlay.style.visibility = 'hidden';
          map.dragging.enable();
          if (map.tap) map.tap.enable();
          setTimeout(() => overlay.remove(), 400);
        });
      }
    }

    // Handle Sharing
    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const platform = btn.dataset.platform;
        const pageUrl = window.location.href;
        const pageTitle = event.title;
        
        let shareUrl = '';
        if (platform === 'x') {
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(pageUrl)}`;
        } else if (platform === 'facebook') {
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
        } else if (platform === 'linkedin') {
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
        } else if (platform === 'copy') {
          navigator.clipboard.writeText(pageUrl).then(() => {
            btn.innerHTML = '✔️';
            btn.style.borderColor = 'var(--accent-green)';
            btn.style.color = 'var(--accent-green)';
            setTimeout(() => {
              btn.innerHTML = '🔗';
              btn.style.borderColor = 'var(--glass-border)';
              btn.style.color = 'var(--text-secondary)';
            }, 2000);
          }).catch(err => console.error('Copy failed:', err));
          return;
        }
        
        if (shareUrl) {
          window.open(shareUrl, '_blank', 'width=600,height=400');
        }
      });
    });

    // Render Related Events Section
    const relatedEvents = eventDataList.filter(e => e.category === event.category && e.id !== event.id).slice(0, 3);
    if (relatedEvents.length > 0) {
      const relatedSection = document.createElement('div');
      relatedSection.id = 'related-section';
      relatedSection.style.cssText = 'margin-top: 50px;';
      
      let relatedCardsHtml = relatedEvents.map(e => {
        const typeColor = typeColors[e.type] || '#888';
        const ed = new Date(e.date);
        const edDay = ed.getDate();
        const edMonth = months[ed.getMonth()].slice(0, 3);
        
        return `
          <div class="event-card" onclick="window.location.href='event.html?id=${e.id}'" style="cursor: pointer; display: flex; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); overflow: hidden; transition: all 0.3s; margin-top: 15px;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0, 212, 255, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            <div class="event-date-block" style="background: rgba(255,255,255,0.02); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; min-width: 80px; text-align: center; border-right: 1px solid var(--glass-border);">
              <div class="event-day" style="font-size: 1.6rem; font-weight: 700; color: var(--accent-blue); line-height: 1.1;">${edDay}</div>
              <div class="event-month" style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-top: 2px;">${edMonth}</div>
            </div>
            <div class="event-info" style="padding: 16px; flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
              <div class="event-info-top" style="margin-bottom: 6px; display: flex; gap: 8px; align-items: center;">
                <span class="event-type-badge" style="background:${typeColor}15; color:${typeColor}; border: 1px solid ${typeColor}30; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;">${e.type}</span>
                <span class="event-meta-item" style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">📍 ${e.city}</span>
              </div>
              <h4 style="font-size: 1.05rem; margin: 0 0 4px 0; color: var(--text-primary); font-weight: 600; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;">${e.title}</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; margin: 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${e.description}</p>
            </div>
          </div>
        `;
      }).join('');

      relatedSection.innerHTML = `
        <h3 style="font-size: 1.4rem; color: var(--text-primary); margin-bottom: 20px; border-left: 3px solid var(--accent-blue); padding-left: 12px;">Benzer Etkinlikler</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
          ${relatedCardsHtml}
        </div>
      `;
      
      const container = document.querySelector('.detail-container');
      if (container) {
        container.appendChild(relatedSection);
      }
    }
  }

initDetail();
});
