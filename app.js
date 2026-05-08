// TECTAK - Teknoloji Takvimi Uygulama Mantığı

// Load events from a local JSON file (events.json). If it fails, fall back to built‑in mock data.
async function loadEvents() {
  // If the page is loaded via file:// protocol, skip fetch to avoid CORS errors.
  if (window.location.protocol === 'file:') {
    console.warn('Running from file:// – using built‑in mock data');
    return;
  }

  const localUrl = './events.json'; // static JSON placed in project root
  const remoteUrl = 'https://example.com/tectak/events.json'; // replace with real API if available

  // Try local file first
  try {
    const resp = await fetch(localUrl);
    if (resp.ok) {
      window.events = await resp.json();
      console.log('Loaded events from local events.json, count:', window.events.length);
      return;
    }
    console.warn('Local events.json not found (status', resp.status, '), trying remote...');
  } catch (e) {
    console.warn('Error fetching local events.json:', e);
  }

  // Remote fallback (optional)
  try {
    const resp = await fetch(remoteUrl);
    if (resp.ok) {
      window.events = await resp.json();
      console.log('Loaded events from remote URL, count:', window.events.length);
    } else {
      console.warn('Remote fetch failed (status', resp.status, ') – using built‑in mock data');
    }
  } catch (e) {
    console.warn('Error fetching remote events:', e);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const state = {
    activeCategory: 'tumu',
    searchQuery: '',
    mapInstance: null,
    markers: [],
    heatLayer: null,
    showHeat: false,
    priceFilter: 'all'
  };

  // --- DOM Refs ---
  const tabsContainer = document.getElementById('tabs-container');
  const eventsGrid = document.getElementById('events-grid');
  const searchInput = document.getElementById('search-input');
  const eventsCount = document.getElementById('events-count');
  const totalCount = document.getElementById('total-count');

  // --- Turkish month names ---
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const fullMonths = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  // --- Init ---
  function init() {
    renderTabs();
    renderEvents();
    initMap();
    updateStats();

    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      renderEvents();
    });

    document.querySelectorAll('input[name="priceFilter"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.priceFilter = e.target.value;
        renderEvents();
      });
    });
  }

  // --- Filter ---
  function getFilteredEvents() {
    let currentEvents = window.events || events;
    let filtered = [...currentEvents];

    // Filter out past events (keep today and future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = filtered.filter(e => new Date(e.date) >= today);

    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Category filter
    if (state.activeCategory !== 'tumu') {
      filtered = filtered.filter(e => e.category === state.activeCategory);
    }

    // Search filter
    if (state.searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(state.searchQuery) ||
        e.description.toLowerCase().includes(state.searchQuery) ||
        e.city.toLowerCase().includes(state.searchQuery) ||
        e.location.toLowerCase().includes(state.searchQuery)
      );
    }

    // Price filter
    if (state.priceFilter === 'free') {
      filtered = filtered.filter(e => e.price === 'Ücretsiz');
    } else if (state.priceFilter === 'paid') {
      filtered = filtered.filter(e => e.price !== 'Ücretsiz');
    }

    return filtered;
  }

  // --- Tabs ---
  function renderTabs() {
    const currentEvents = window.events || events;
    tabsContainer.innerHTML = categories.map(cat => {
      const count = cat.id === 'tumu' ? currentEvents.length : currentEvents.filter(e => e.category === cat.id).length;
      return `<button class="tab-btn ${cat.id === state.activeCategory ? 'active' : ''}"
                data-category="${cat.id}">
                <span>${cat.icon}</span>
                <span>${cat.label}</span>
                <span class="tab-count">${count}</span>
              </button>`;
    }).join('');

    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.category;
        tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderEvents();
        updateMapMarkers();
      });
    });
  }

  // --- SVG Icons ---
  const icons = {
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    org: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  };

  // Helper to avoid placeholder/example.com URLs
function safeUrl(url) {
  return url && !url.includes('example.com') ? url : '#';
}
function safeLabel(url) {
  return url && !url.includes('example.com') ? 'Kayıt Ol' : 'Bilgi Yok';
}

  // --- Events ---
  function renderEvents() {
    const filtered = getFilteredEvents();
    eventsCount.textContent = `${filtered.length} etkinlik`;

    if (filtered.length === 0) {
      eventsGrid.innerHTML = `
        <div class="no-results">
          <div class="icon">🔍</div>
          <h3>Etkinlik bulunamadı</h3>
          <p>Farklı bir kategori veya arama terimi deneyin.</p>
        </div>`;
      return;
    }

    const renderCard = (event, i, isClosed = false) => {
      const d = new Date(event.date);
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const typeColor = typeColors[event.type] || '#888';
      const isFree = event.price === 'Ücretsiz';
      
      const statusBadge = isClosed ? 
        '<span class="event-type-badge" style="background:rgba(255,0,0,0.1);color:#ff4444;border:1px solid rgba(255,0,0,0.3);">Kapalı</span>' : 
        '<span class="event-type-badge" style="background:rgba(0,255,136,0.1);color:#00ff88;border:1px solid rgba(0,255,136,0.3);">Açık</span>';

      const priceBadge = isFree ? 
        '<span class="event-type-badge" style="background:rgba(0,212,255,0.1);color:var(--accent-blue);border:1px solid rgba(0,212,255,0.3);">Ücretsiz</span>' : 
        '<span class="event-type-badge" style="background:rgba(255,217,61,0.1);color:#FFD93D;border:1px solid rgba(255,217,61,0.3);">Ücretli</span>';

      return `<div class="event-card" style="animation-delay:${i * 0.06}s; ${isClosed ? 'opacity:0.6;' : ''}"
                   data-id="${event.id}" data-url="event.html?id=${event.id}">
        <div class="event-date-block">
          <div class="event-day">${day}</div>
          <div class="event-month">${month}</div>
          <div class="event-year">${year}</div>
        </div>
        <div class="event-info">
          <div class="event-info-top">
            ${statusBadge}
            ${priceBadge}
            <span class="event-type-badge" style="background:${typeColor}20;color:${typeColor}">${event.type}</span>
            <span class="event-category-tag">${categories.find(c => c.id === event.category)?.icon || ''} ${categories.find(c => c.id === event.category)?.label || event.category}</span>
          </div>
          <div class="event-title">${event.title}</div>
          <div class="event-description">${event.description}</div>
          <div class="event-meta">
            <span class="event-meta-item">${icons.clock} ${event.time} - ${event.endTime}</span>
            <span class="event-meta-item">${icons.location} ${event.city}</span>
            <span class="event-meta-item">${icons.org} ${event.organizer}</span>
          </div>
        </div>
        <div class="event-actions">
          <a href="event.html?id=${event.id}" class="register-btn" onclick="event.stopPropagation()">Detaylı Bilgi</a>
        </div>
      </div>`;
    };

    const openEvents = filtered.filter(e => e.registrationStatus !== 'closed');
    const closedEvents = filtered.filter(e => e.registrationStatus === 'closed');

    let html = '';
    
    if (openEvents.length > 0) {
      html += `<div style="margin-bottom: 8px; font-size: 1.2rem; font-weight: bold; color: var(--text-primary); border-bottom: 1px solid var(--glass-border); padding-bottom: 12px; display: flex; align-items: center; gap: 8px;"><span style="color:#00ff88">●</span> Başvuruları Açık Etkinlikler</div>`;
      html += openEvents.map((e, i) => renderCard(e, i, false)).join('');
    }
    
    if (closedEvents.length > 0) {
      html += `<div style="margin-top: 32px; margin-bottom: 8px; font-size: 1.2rem; font-weight: bold; color: var(--text-muted); border-bottom: 1px solid var(--glass-border); padding-bottom: 12px; display: flex; align-items: center; gap: 8px;"><span style="color:#ff4444">●</span> Başvuruları Kapanan Etkinlikler</div>`;
      html += closedEvents.map((e, i) => renderCard(e, i, true)).join('');
    }

    eventsGrid.innerHTML = html;
  }

  // --- Stats ---
  function updateStats() {
    const currentEvents = window.events || events;
    if (totalCount) totalCount.textContent = currentEvents.length;
  }

  // --- Map ---
  function initMap() {
    state.mapInstance = L.map('map', {
      zoomControl: false
    }).setView([39.0, 32.0], 6);

    L.control.zoom({ position: 'topright' }).addTo(state.mapInstance);

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18
    }).addTo(state.mapInstance);

    updateMapMarkers();

    // Map toggle buttons
    document.querySelectorAll('.map-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        state.showHeat = mode === 'heat';
        updateMapMarkers();
      });
    });
  }

  function updateMapMarkers() {
    // Clear existing
    state.markers.forEach(m => state.mapInstance.removeLayer(m));
    state.markers = [];
    if (state.heatLayer) {
      state.mapInstance.removeLayer(state.heatLayer);
      state.heatLayer = null;
    }

    const filtered = getFilteredEvents();

    if (state.showHeat) {
      // Heat map
      const heatData = filtered.map(e => [e.lat, e.lng, 0.8]);
      if (typeof L.heatLayer === 'function') {
        state.heatLayer = L.heatLayer(heatData, {
          radius: 35, blur: 25, maxZoom: 10,
          gradient: { 0.2: '#00D4FF', 0.5: '#00FF88', 0.8: '#FFD93D', 1: '#FF6B6B' }
        }).addTo(state.mapInstance);
      }
    } else {
      // Pin markers
      filtered.forEach(event => {
        const typeColor = typeColors[event.type] || '#888';
        const isClosed = event.registrationStatus === 'closed';
        const ringColor = isClosed ? '#ff4444' : '#00ff88';

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width:14px;height:14px;border-radius:50%;
            background:${typeColor};
            box-shadow:0 0 12px ${typeColor}80;
            border:2px solid ${ringColor};
            opacity: ${isClosed ? '0.5' : '1'};
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const statusText = isClosed ? '<span style="color:#ff4444;font-size:0.75rem;font-weight:bold;">🔴 BAŞVURULAR KAPALI</span>' : '<span style="color:#00ff88;font-size:0.75rem;font-weight:bold;">🟢 BAŞVURULAR AÇIK</span>';

        const marker = L.marker([event.lat, event.lng], { icon })
          .bindPopup(`
            <div class="popup-title">${event.title}</div>
            <div class="popup-detail" style="margin-bottom:8px;">${statusText}</div>
            <div class="popup-detail">📍 ${event.location}</div>
            <div class="popup-detail">📅 ${new Date(event.date).getDate()} ${fullMonths[new Date(event.date).getMonth()]} ${new Date(event.date).getFullYear()}</div>
            <div class="popup-detail">🕐 ${event.time}</div>
            <a href="event.html?id=${event.id}" style="display:block; margin-top:12px; padding:8px; background:linear-gradient(135deg, var(--accent-blue), rgba(0,212,255,0.7)); color:#000; text-align:center; border-radius:4px; text-decoration:none; font-weight:bold; transition:all 0.3s; font-family:inherit;">Detaylara Git</a>
          `)
          .addTo(state.mapInstance);

        state.markers.push(marker);
      });
    }
  }

  // --- Countdown Logic ---
  function startCountdown() {
    const timerElement = document.getElementById('countdown-timer');
    if (!timerElement) return;

    function update() {
      const now = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);

      const diff = nextMonday - now;
      if (diff <= 0) {
        timerElement.textContent = "Güncelleniyor...";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      timerElement.textContent = `${days}g ${hours.toString().padStart(2, '0')}s ${mins.toString().padStart(2, '0')}d ${secs.toString().padStart(2, '0')}sn`;
    }

    update();
    setInterval(update, 1000);
  }

  loadEvents().then(() => {
    init();
    startCountdown();
  });
  // Add card click navigation
  document.addEventListener('click', function(e) {
    const card = e.target.closest('.event-card');
    if (card && card.dataset.url) {
      window.location.href = card.dataset.url;
    }
  });
});
