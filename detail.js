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
    let onClickAction = isClosed ? "onclick='return false;' style='opacity:0.5; cursor:not-allowed; filter:grayscale(100%);'" : (regBtnUrl === '#' ? "onclick='alert(\"Bu etkinlik için 2026 yılı resmi başvuru/kayıt sayfası henüz erişime açılmamıştır. Lütfen daha sonra tekrar deneyiniz.\"); return false;'" : "target='_blank' rel='noopener noreferrer'");

detailCard.innerHTML = `
      <div class="detail-header">
        <div style="margin-bottom: 12px;">
          <span class="event-type-badge" style="background:${typeColor}20;color:${typeColor}">${event.type}</span>
          <span class="event-category-tag" style="margin-left: 8px;">${categories.find(c => c.id === event.category)?.label || event.category}</span>
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
      <div class="detail-footer" style="justify-content: flex-end;">
        <a href="${regBtnUrl}" target="_blank" rel="noopener" class="register-btn-large" ${onClickAction}>${regBtnLabel}</a>
      </div>
    `;

document.title = `${event.title} — TECTAK`;

// Initialize Map for detail page
const map = L.map('detail-map').setView([event.lat, event.lng], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© <a href="https://carto.com/">CARTO</a>'
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
  }

initDetail();
});
