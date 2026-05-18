document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const compId = params.get('id');

  if (!compId || typeof competitions === 'undefined') {
    document.getElementById('detail-card').innerHTML = '<div style="padding:40px; text-align:center; color:var(--accent-red);">Yarışma bulunamadı.</div>';
    return;
  }

  const comp = competitions.find(c => c.id == compId);

  if (!comp) {
    document.getElementById('detail-card').innerHTML = '<div style="padding:40px; text-align:center; color:var(--accent-red);">Yarışma bulunamadı.</div>';
    return;
  }

  // Generate Tags HTML
  let tagsHtml = '';
  if (comp.tags && comp.tags.length > 0) {
    tagsHtml = comp.tags.map(tag => `<span style="background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:50px; font-size:0.8rem; color:var(--text-secondary); margin-right:8px;">${tag}</span>`).join('');
  }

  const html = `
    <div class="detail-header">
      <div style="font-size:3rem; margin-bottom:12px;">${comp.icon}</div>
      <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
        ${tagsHtml}
      </div>
      <h1>${comp.title}</h1>
      
      <div class="detail-meta">
        <div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Son Başvuru: <strong style="color:var(--text-primary)">${comp.deadline}</strong>
        </div>
        <div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
          ${comp.city}
        </div>
        <div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Takım: ${comp.teamSize}
        </div>
        <div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Düzenleyen: ${comp.organizer}
        </div>
        <div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          Seviye: ${comp.level}
        </div>
      </div>
    </div>
    
    <div class="detail-description">
      ${comp.description}
    </div>
    
    <div id="comp-map" class="detail-map"></div>
    
    <div class="detail-footer">
      <div>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Ödül / Destek</div>
        <div class="detail-prize">${comp.prize}</div>
      </div>
      
      <div style="text-align: right;">
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Tahmini Başvuru Adresi</div>
        <a href="${comp.registrationUrl}" target="_blank" class="register-btn-large">Başvuru Sayfasına Git</a>
      </div>
    </div>
  `;

  document.getElementById('detail-card').innerHTML = html;

  // Initialize Map
  if (comp.lat && comp.lng) {
    const map = L.map('comp-map').setView([comp.lat, comp.lng], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `<div style="background:var(--accent-blue); width:20px; height:20px; border-radius:50%; box-shadow:0 0 15px var(--accent-blue); border:3px solid #fff;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker([comp.lat, comp.lng], { icon: customIcon }).addTo(map)
      .bindPopup(`<b>${comp.title}</b><br>${comp.city}`)
      .openPopup();
  } else {
    document.getElementById('comp-map').style.display = 'none';
  }
});
