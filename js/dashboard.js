/**
 * TECTAK - Teknoloji Trendleri & İstatistikler Mantığı
 * Geliştirici: Abdullah GÜLER & Antigravity
 * Altyapı: Chart.js
 */

(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const dashboardSection = document.getElementById('dashboard-section');
    if (!dashboardSection || typeof Chart === 'undefined') return;

    // IntersectionObserver ile grafiklerin görünür olunca yüklenmesi
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initializeDashboard();
          observer.disconnect(); // Sadece bir kez tetiklensin
        }
      });
    }, { threshold: 0.15 });

    observer.observe(dashboardSection);
  });

  // Kategori isimlerini Türkçe ve şık hallerine eşleştir
  const categoryNames = {
    'savunma': 'Savunma Sanayii',
    'teknoloji': 'Genel Teknoloji',
    'bilisim': 'Bilişim & Yazılım',
    'havacilik': 'Havacılık & Uzay',
    'robotik': 'Robotik & Donanım',
    'girisim': 'Girişimcilik'
  };

  function formatCategory(cat) {
    if (!cat) return 'Diğer';
    const lower = cat.toLowerCase().trim();
    return categoryNames[lower] || cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  function initializeDashboard() {
    // 1. Verileri Çek
    const eventList = window.events || (typeof events !== 'undefined' ? events : []);
    const compList = window.competitions || (typeof competitions !== 'undefined' ? competitions : []);

    // 2. İstatistikleri Hesapla
    const totalEvents = eventList.length;
    const totalComps = compList.length;

    // Aktif Başvurular
    const activeEvents = eventList.filter(e => e.registrationStatus === 'open').length;
    const activeComps = compList.filter(c => c.status === 'open').length;
    const totalActiveRegistrations = activeEvents + activeComps;

    // Ödül Havuzu Hesabı
    let totalPrizePool = 0;
    compList.forEach(c => {
      if (c.prize) {
        // Rakam dışındaki tüm karakterleri silip sayıya çeviriyoruz
        const numericPrize = parseInt(c.prize.replace(/[^0-9]/g, ''), 10) || 0;
        totalPrizePool += numericPrize;
      }
    });

    // Ödül Havuzunu formatla (örn: 1.250.000 ₺)
    const formattedPrizePool = new Intl.NumberFormat('tr-TR').format(totalPrizePool) + ' ₺';

    // 3. Genel Özet HTML'ini oluştur
    const generalStatsContainer = document.getElementById('generalStats');
    if (generalStatsContainer) {
      generalStatsContainer.innerHTML = `
        <div class="stat-box">
          <span class="stat-val">${totalEvents}</span>
          <span class="stat-lbl">Toplam Etkinlik</span>
        </div>
        <div class="stat-box">
          <span class="stat-val accent-purple">${totalComps}</span>
          <span class="stat-lbl">Toplam Yarışma</span>
        </div>
        <div class="stat-box">
          <span class="stat-val accent-green">${formattedPrizePool}</span>
          <span class="stat-lbl">Ödül Havuzu</span>
        </div>
        <div class="stat-box">
          <span class="stat-val accent-yellow">${totalActiveRegistrations}</span>
          <span class="stat-lbl">Aktif Başvuru</span>
        </div>
      `;
    }

    // 4. Grafik Verilerini Hazırla

    // A. Kategori Dağılımı (Etkinlik + Yarışma birleşik)
    const categoryCounts = {};
    eventList.forEach(e => {
      const cat = formatCategory(e.category);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    compList.forEach(c => {
      const cat = formatCategory(c.category);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryLabels = Object.keys(categoryCounts);
    const categoryData = Object.values(categoryCounts);

    // B. Şehir Dağılımı (En çok etkinlik olan ilk 5 şehir)
    const cityCounts = {};
    eventList.forEach(e => {
      if (e.city) {
        cityCounts[e.city] = (cityCounts[e.city] || 0) + 1;
      }
    });
    // Yarışmaları da şehre göre ekleyelim
    compList.forEach(c => {
      if (c.city) {
        cityCounts[c.city] = (cityCounts[c.city] || 0) + 1;
      }
    });

    // Şehirleri sayılarına göre azalan sırala
    const sortedCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const cityLabels = sortedCities.map(entry => entry[0]);
    const cityData = sortedCities.map(entry => entry[1]);

    // C. Ücret Dağılımı
    let freeCount = 0;
    let paidCount = 0;
    eventList.forEach(e => {
      const priceLower = e.price ? e.price.toLowerCase().trim() : '';
      if (priceLower === 'ücretsiz' || priceLower === '0' || priceLower === '0₺' || priceLower === '0 ₺' || priceLower === '') {
        freeCount++;
      } else {
        paidCount++;
      }
    });

    // 5. Chart.js Global Ayarlarını Özelleştir (TECTAK Dark Theme için)
    Chart.defaults.color = 'rgba(240, 240, 245, 0.7)';
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(18, 18, 26, 0.95)';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.08)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
    Chart.defaults.plugins.tooltip.bodyColor = 'rgba(240, 240, 245, 0.85)';
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;

    // Ortak renk paletleri
    const neonColors = [
      'rgba(0, 212, 255, 0.75)',    // Neon Blue
      'rgba(167, 139, 250, 0.75)',   // Purple
      'rgba(0, 255, 136, 0.75)',    // Neon Green
      'rgba(255, 217, 61, 0.75)',    // Yellow
      'rgba(255, 107, 107, 0.75)',   // Red
      'rgba(236, 72, 153, 0.75)'     // Pink
    ];

    const neonBorders = [
      '#00D4FF',
      '#a78bfa',
      '#00FF88',
      '#FFD93D',
      '#FF6B6B',
      '#ec4899'
    ];

    // --- A. KATEGORİ GRAFİĞİ (DOUGHNUT) ---
    const catCtx = document.getElementById('categoryChart');
    if (catCtx) {
      new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: categoryLabels,
          datasets: [{
            data: categoryData,
            backgroundColor: neonColors.slice(0, categoryLabels.length),
            borderColor: neonBorders.slice(0, categoryLabels.length),
            borderWidth: 1.5,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                padding: 15
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // --- B. ŞEHİR GRAFİĞİ (HORIZONTAL BAR) ---
    const cityCtx = document.getElementById('cityChart');
    if (cityCtx) {
      new Chart(cityCtx, {
        type: 'bar',
        data: {
          labels: cityLabels,
          datasets: [{
            label: 'Toplam Etkinlik/Yarışma',
            data: cityData,
            backgroundColor: 'rgba(0, 212, 255, 0.25)',
            borderColor: '#00D4FF',
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
            hoverBackgroundColor: 'rgba(0, 212, 255, 0.45)'
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                stepSize: 1
              }
            },
            y: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }

    // --- C. ÜCRET GRAFİĞİ (PIE) ---
    const priceCtx = document.getElementById('priceChart');
    if (priceCtx) {
      new Chart(priceCtx, {
        type: 'pie',
        data: {
          labels: ['Ücretsiz', 'Ücretli'],
          datasets: [{
            data: [freeCount, paidCount],
            backgroundColor: [
              'rgba(0, 255, 136, 0.75)', // Green
              'rgba(255, 107, 107, 0.75)' // Red
            ],
            borderColor: [
              '#00FF88',
              '#FF6B6B'
            ],
            borderWidth: 1.5,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                padding: 15
              }
            }
          }
        }
      });
    }
  }
})();
