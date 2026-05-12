// fetch_events.js
// This script downloads a JSON feed of technology events and writes it to ./events.json
// It can be scheduled to run weekly (e.g., via cron, GitHub Actions, or Windows Task Scheduler)

const https = require('https');
const fs = require('fs');
const path = require('path');

// Replace this URL with the real public API endpoint that provides events in the expected format
const REMOTE_URL = 'https://example.com/tectak/events.json';

// Bypass if placeholder to avoid GitHub Action failure
if (REMOTE_URL.includes('example.com')) {
  console.log('⚠️ Placeholder URL detected. Skipping remote fetch to avoid 404.');
  process.exit(0);
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
        res.resume();
        return;
      }
      let rawData = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => resolve(rawData));
    }).on('error', (e) => reject(e));
  });
}

(async () => {
  try {
    console.log('Downloading events from remote source...');
    const data = await download(REMOTE_URL);
    const json = JSON.parse(data);
    const outPath = path.resolve(__dirname, 'events.json');
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2), 'utf8');
    console.log('✅ Events saved to events.json');
  } catch (err) {
    console.error('❌ Failed to fetch events:', err.message);
    process.exit(1);
  }
})();
