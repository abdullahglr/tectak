/**
 * TECTAK - Teknoloji Takvimi Uygulama Mantığı
 * Abdullah GÜLER tarafından geliştirilmiştir.
 */

// Load events from local JSON or fallback to data.js
async function loadEvents() {
  try {
    const resp = await fetch('./events.json');
    if (resp.ok) {
      window.events = await resp.json();
      return;
    }
  } catch (e) {
    // silence fetch error (likely CORS on file://)
  }
  // Fallback to data.js content
  window.events = typeof events !== 'undefined' ? events : [];
}

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    activeCategory: 'tumu',
    searchQuery: '',
    mapInstance: null,
    markers: [],
    heatLayer: null,
    showHeat: false,
    priceFilter: 'all',
    calendarDate: new Date()
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
    renderCalendar();
    renderNews();
    initMap();
    updateStats();

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderEvents();
        renderCalendar();
      });
    }

    document.querySelectorAll('input[name="priceFilter"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.priceFilter = e.target.value;
        renderEvents();
        renderCalendar();
      });
    });

    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
        renderCalendar();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
        renderCalendar();
      });
    }
  }

  // --- Filter ---
  function getFilteredEvents() {
    let currentEvents = window.events || (typeof events !== 'undefined' ? events : []);
    let filtered = [...currentEvents];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = filtered.filter(e => new Date(e.date) >= today);

    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (state.activeCategory !== 'tumu') {
      filtered = filtered.filter(e => e.category === state.activeCategory);
    }

    if (state.searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(state.searchQuery) ||
        e.description.toLowerCase().includes(state.searchQuery) ||
        e.city.toLowerCase().includes(state.searchQuery) ||
        e.location.toLowerCase().includes(state.searchQuery)
      );
    }

    if (state.priceFilter === 'free') {
      filtered = filtered.filter(e => e.price === 'Ücretsiz');
    } else if (state.priceFilter === 'paid') {
      filtered = filtered.filter(e => e.price !== 'Ücretsiz');
    }

    return filtered;
  }

  // --- Tabs ---
  function renderTabs() {
    if (!tabsContainer) return;
    const currentEvents = window.events || (typeof events !== 'undefined' ? events : []);
    const cats = typeof categories !== 'undefined' ? categories : [];
    
    tabsContainer.innerHTML = cats.map(cat => {
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

  const icons = {
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    org: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  };

  // --- Events ---
  function renderEvents() {
    if (!eventsGrid) return;
    const filtered = getFilteredEvents();
    if (eventsCount) eventsCount.textContent = `${filtered.length} etkinlik`;

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
      const typeColor = (typeof typeColors !== 'undefined' && typeColors[event.type]) || '#888';
      const isFree = event.price === 'Ücretsiz';
      
      const statusBadge = isClosed ? 
        '<span class="event-type-badge" style="background:rgba(255,0,0,0.1);color:#ff4444;border:1px solid rgba(255,0,0,0.3);">Kapalı</span>' : 
        '<span class="event-type-badge" style="background:rgba(0,255,136,0.1);color:#00ff88;border:1px solid rgba(0,255,136,0.3);">Açık</span>';

      const priceBadge = isFree ? 
        '<span class="event-type-badge" style="background:rgba(0,212,255,0.1);color:var(--accent-blue);border:1px solid rgba(0,212,255,0.3);">Ücretsiz</span>' : 
        '<span class="event-type-badge" style="background:rgba(255,217,61,0.1);color:#FFD93D;border:1px solid rgba(255,217,61,0.3);">Ücretli</span>';

      const catLabel = typeof categories !== 'undefined' ? (categories.find(c => c.id === event.category)?.label || event.category) : event.category;
      const catIcon = typeof categories !== 'undefined' ? (categories.find(c => c.id === event.category)?.icon || '') : '';

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
            <span class="event-category-tag">${catIcon} ${catLabel}</span>
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
    const currentEvents = window.events || (typeof events !== 'undefined' ? events : []);
    if (totalCount) totalCount.textContent = currentEvents.length;
  }

  // --- Map ---
  function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    state.mapInstance = L.map('map', { zoomControl: false }).setView([39.0, 32.0], 6);
    L.control.zoom({ position: 'topright' }).addTo(state.mapInstance);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO', maxZoom: 18
    }).addTo(state.mapInstance);

    updateMapMarkers();

    document.querySelectorAll('.map-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.showHeat = btn.dataset.mode === 'heat';
        updateMapMarkers();
      });
    });
  }

  function updateMapMarkers() {
    if (!state.mapInstance) return;
    state.markers.forEach(m => state.mapInstance.removeLayer(m));
    state.markers = [];
    if (state.heatLayer) {
      state.mapInstance.removeLayer(state.heatLayer);
      state.heatLayer = null;
    }

    const filtered = getFilteredEvents();

    if (state.showHeat && typeof L.heatLayer === 'function') {
      const heatData = filtered.map(e => [e.lat, e.lng, 0.8]);
      state.heatLayer = L.heatLayer(heatData, {
        radius: 35, blur: 25, maxZoom: 10,
        gradient: { 0.2: '#00D4FF', 0.5: '#00FF88', 0.8: '#FFD93D', 1: '#FF6B6B' }
      }).addTo(state.mapInstance);
    } else {
      filtered.forEach(event => {
        const typeColor = (typeof typeColors !== 'undefined' && typeColors[event.type]) || '#888';
        const isClosed = event.registrationStatus === 'closed';
        const ringColor = isClosed ? '#ff4444' : '#00ff88';

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${typeColor};box-shadow:0 0 12px ${typeColor}80;border:2px solid ${ringColor};opacity:${isClosed ? '0.5' : '1'};"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7]
        });

        const statusText = isClosed ? '<span style="color:#ff4444;font-size:0.75rem;font-weight:bold;">🔴 BAŞVURULAR KAPALI</span>' : '<span style="color:#00ff88;font-size:0.75rem;font-weight:bold;">🟢 BAŞVURULAR AÇIK</span>';

        const marker = L.marker([event.lat, event.lng], { icon })
          .bindPopup(`
            <div class="popup-title">${event.title}</div>
            <div class="popup-detail" style="margin-bottom:8px;">${statusText}</div>
            <div class="popup-detail">📍 ${event.location}</div>
            <div class="popup-detail">📅 ${new Date(event.date).getDate()} ${fullMonths[new Date(event.date).getMonth()]} ${new Date(event.date).getFullYear()}</div>
            <div class="popup-detail">🕐 ${event.time}</div>
            <a href="event.html?id=${event.id}" style="display:block; margin-top:12px; padding:8px; background:linear-gradient(135deg, var(--accent-blue), rgba(0,212,255,0.7)); color:#000; text-align:center; border-radius:4px; text-decoration:none; font-weight:bold; transition:all 0.3s;">Detaylara Git</a>
          `)
          .addTo(state.mapInstance);
        state.markers.push(marker);
      });
    }
  }

  // --- Calendar ---
  function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('current-month-year');
    const detailsContainer = document.getElementById('calendar-event-details');
    if (!grid || !monthYearLabel) return;

    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();
    monthYearLabel.textContent = `${fullMonths[month]} ${year}`;

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = (firstDay === 0) ? 6 : firstDay - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    let html = '';

    for (let i = 0; i < firstDay; i++) {
      html += `<div class="calendar-day other-month"></div>`;
    }

    const allEvents = window.events || (typeof events !== 'undefined' ? events : []);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayEvents = allEvents.filter(e => e.date === dateStr);
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
      const hasEvent = dayEvents.length > 0;

      let dotsHtml = '';
      if (hasEvent) {
        dotsHtml = `<div class="event-dots">` + 
          dayEvents.slice(0, 3).map(e => {
            const color = (typeof typeColors !== 'undefined' && typeColors[e.type]) || 'var(--accent-blue)';
            return `<span class="event-dot" style="background:${color}"></span>`;
          }).join('') + `</div>`;
      }

      html += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dateStr}">${day}${dotsHtml}</div>`;
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.calendar-day').forEach(el => {
      if (el.classList.contains('other-month')) return;
      el.addEventListener('click', () => {
        grid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
        el.classList.add('active');
        const selectedDate = el.dataset.date;
        const dayEvents = allEvents.filter(e => e.date === selectedDate);
        if (dayEvents.length > 0) {
          detailsContainer.innerHTML = dayEvents.map(e => `
            <div class="cal-detail-card" style="border-left-color: ${(typeof typeColors !== 'undefined' && typeColors[e.type]) || 'var(--accent-blue)'}">
              <div class="cal-detail-info"><h4>${e.title}</h4><p>${e.time} - ${e.location}</p></div>
              <a href="event.html?id=${e.id}" class="cal-detail-btn">Detay</a>
            </div>`).join('');
        } else {
          detailsContainer.innerHTML = `<p class="empty-msg">${new Date(selectedDate).getDate()} ${fullMonths[new Date(selectedDate).getMonth()]} tarihinde etkinlik bulunmuyor.</p>`;
        }
      });
    });
  }

  // --- Countdown Logic ---
  function startCountdown() {
    const timerElement = document.getElementById('countdown-timer');
    if (!timerElement) return;
    function update() {
      const now = new Date();
      const nextUpdate = new Date();
      nextUpdate.setDate(now.getDate() + 1);
      nextUpdate.setHours(0, 0, 0, 0);
      const diff = nextUpdate - now;
      if (diff <= 0) { timerElement.textContent = "Güncelleniyor..."; return; }
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      timerElement.textContent = `${hours.toString().padStart(2, '0')}s ${mins.toString().padStart(2, '0')}d ${secs.toString().padStart(2, '0')}sn`;
    }
    update();
    setInterval(update, 1000);
  }

  // --- News Section ---
  function renderNews() {
    const newsGrid = document.getElementById('news-grid');
    const viewAllLink = document.querySelector('.view-all-link');
    const currentNews = window.news || [];
    if (!newsGrid || currentNews.length === 0) return;

    if (viewAllLink) viewAllLink.href = 'all_news.html';

    const now = new Date();
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(now.getDate() - 21);

    const filteredHomeNews = currentNews
      .filter(item => new Date(item.date) >= threeWeeksAgo)
      .slice(0, 6);

    if (filteredHomeNews.length === 0) {
      newsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Son 3 haftaya ait güncel haber bulunamadı.</p>`;
      return;
    }

    newsGrid.innerHTML = filteredHomeNews.map(item => `
      <div class="news-card reveal" onclick="window.location.href='news.html?id=${item.id}'">
        <img src="${item.images[0]}" class="news-card-img" alt="${item.title}">
        <div class="news-card-content">
          <div class="news-card-date">${item.date} | ${item.source}</div>
          <h3 class="news-card-title">${item.title}</h3>
          <p class="news-card-summary">${item.summary}</p>
          <div class="news-card-footer"><span>Devamını Oku →</span><span>📂 Blog</span></div>
        </div>
      </div>`).join('');

    newsGrid.querySelectorAll('.reveal').forEach(card => { if (revealObserver) revealObserver.observe(card); });
  }

  function startNewsTimer() {
    const newsTimerEl = document.getElementById('news-timer');
    if (!newsTimerEl) return;
    function updateTimer() {
      const now = new Date();
      const target = new Date();
      target.setHours(now.getHours() + (2 - (now.getHours() % 2)), 0, 0, 0);
      const diff = target - now;
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      newsTimerEl.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // --- Start ---
  loadEvents().then(() => {
    init();
    startCountdown();
    startNewsTimer();
    observeReveals();
  });

  // --- Scroll & Nav ---
  const navLinks = document.querySelectorAll('.nav-link');
  const navIndicator = document.getElementById('nav-indicator');

  function updateNavIndicator() {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink && navIndicator) {
      navIndicator.style.width = `${activeLink.offsetWidth}px`;
      navIndicator.style.left = `${activeLink.offsetLeft}px`;
    }
  }

  setTimeout(updateNavIndicator, 200);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const offset = 72;
        window.scrollTo({ top: targetEl.offsetTop - offset, behavior: 'smooth' });
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        updateNavIndicator();
      }
    });
  });

  window.addEventListener('scroll', () => {
    const sections = ['events-section', 'calendar-section', 'news-section', 'map-section'];
    let current = '';
    const scrollPos = window.scrollY;
    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section && scrollPos >= section.offsetTop - 120) current = id;
    });
    if (current) {
      const targetLink = document.querySelector(`.nav-link[data-target="${current}"]`);
      if (targetLink && !targetLink.classList.contains('active')) {
        navLinks.forEach(l => l.classList.remove('active'));
        targetLink.classList.add('active');
        updateNavIndicator();
      }
    }
  });

  // Reveal logic
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        if (entry.target.classList.contains('reveal')) revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  function observeReveals() {
    document.querySelectorAll('.reveal:not(.revealed), .reveal-stagger:not(.revealed)').forEach(el => revealObserver.observe(el));
  }
});
