/**
 * TECTAK - Tarih Bazlı Etkinlik ve Haber Durumu Güncelleyici
 * GitHub Actions tarafından haftalık olarak tetiklenir.
 */

const fs = require('fs');

try {
  const today = new Date().toISOString().split('T')[0];
  console.log('Güncelleme tarihi:', today);

  // 1. events.json güncelle
  const eventsPath = './events.json';
  if (fs.existsSync(eventsPath)) {
    const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    let changed = false;
    events.forEach(e => {
      if (e.date < today && e.registrationStatus === 'open') {
        e.registrationStatus = 'closed';
        changed = true;
        console.log('Kapatıldı:', e.title, e.date);
      }
    });

    if (changed) {
      fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf8');
      console.log('events.json güncellendi.');

      // 2. data.js güncelle (lokal fallback için events senkronu)
      const dataPath = './data.js';
      if (fs.existsSync(dataPath)) {
        let dataContent = fs.readFileSync(dataPath, 'utf8');
        const dataEventsMatch = dataContent.match(/const\s+events\s*=\s*(\[[\s\S]*?\]);\s*\/\/\s*Kategori/);
        if (dataEventsMatch) {
          const updatedEventsString = JSON.stringify(events, null, 2).replace(/"([^"]+)":/g, '$1:');
          dataContent = dataContent.replace(dataEventsMatch[1], updatedEventsString);
          fs.writeFileSync(dataPath, dataContent, 'utf8');
          console.log('data.js içindeki events dizisi güncellendi.');
        }
      }
    }
  }

  // 3. news_data.js lastUpdated timestamp güncelle
  const newsPath = './news_data.js';
  if (fs.existsSync(newsPath)) {
    let newsContent = fs.readFileSync(newsPath, 'utf8');
    const tsLine = '// lastUpdated: ' + today;
    if (newsContent.startsWith('// lastUpdated:')) {
      newsContent = newsContent.replace(/^\/\/ lastUpdated:.*\n/, tsLine + '\n');
    } else {
      newsContent = tsLine + '\n' + newsContent;
    }
    fs.writeFileSync(newsPath, newsContent, 'utf8');
    console.log('news_data.js lastUpdated güncellendi.');
  }

  console.log('Tüm güncellemeler başarıyla tamamlandı.');
} catch (error) {
  console.error('Güncelleme sırasında hata oluştu:', error);
  process.exit(1);
}
