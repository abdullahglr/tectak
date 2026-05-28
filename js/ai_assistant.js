/**
 * TECTAK AI — Akıllı Yapay Zeka Etkinlik Asistanı
 * Geliştirici: Abdullah GÜLER & Antigravity
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const launcher = document.getElementById('ai-chat-launcher');
  const chatWindow = document.getElementById('ai-chat-window');
  const closeBtn = document.getElementById('ai-chat-close');
  const messagesContainer = document.getElementById('ai-chat-messages');
  const chatInput = document.getElementById('ai-chat-input');
  const sendBtn = document.getElementById('ai-chat-send');

  // Assistant State
  let chatHistory = [];
  const MAX_HISTORY = 10;

  // Toggle Chat Window
  if (launcher && chatWindow) {
    launcher.addEventListener('click', () => {
      chatWindow.classList.toggle('open');
      if (chatWindow.classList.contains('open')) {
        chatInput.focus();
        // Clear launcher badge/ping when chat opens
        const ping = launcher.querySelector('.ai-launcher-ping');
        if (ping) ping.style.display = 'none';
      }
    });
  }

  if (closeBtn && chatWindow) {
    closeBtn.addEventListener('click', () => {
      chatWindow.classList.remove('open');
    });
  }

  // Close when clicking outside on desktop
  document.addEventListener('click', (e) => {
    if (chatWindow && chatWindow.classList.contains('open') && window.innerWidth > 768) {
      if (!chatWindow.contains(e.target) && !launcher.contains(e.target)) {
        chatWindow.classList.remove('open');
      }
    }
  });

  // Message Send Actions
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendMessage);
  }

  // Main Send Message Handler
  async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Clear input
    chatInput.value = '';

    // Append User Message
    appendMessage('user', text);

    // Show Typing Indicator
    showTypingIndicator();

    // Add to History
    chatHistory.push({ role: 'user', content: text });
    if (chatHistory.length > MAX_HISTORY * 2) {
      chatHistory = chatHistory.slice(-MAX_HISTORY * 2);
    }

    try {
      // Build Context & Call AI
      const reply = await callAIWithContext(text);
      
      // Hide Typing Indicator
      hideTypingIndicator();

      // Append Assistant Message
      appendMessage('assistant', reply);

      // Add to History
      chatHistory.push({ role: 'assistant', content: reply });

    } catch (error) {
      console.error('TECTAK AI Error:', error);
      hideTypingIndicator();

      // Trigger Local Fallback
      const fallbackReply = runLocalFallback(text);
      appendMessage('assistant', fallbackReply);
      chatHistory.push({ role: 'assistant', content: fallbackReply });
    }
  }

  // Append Message to UI
  function appendMessage(role, content) {
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${role}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'ai-message-bubble';
    bubbleDiv.innerHTML = formatMarkdown(content);
    messageDiv.appendChild(bubbleDiv);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // If assistant, try matching events in the response to render clickable cards
    if (role === 'assistant') {
      renderEventCardsForReply(content, messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    return messageDiv;
  }

  // Show Typing Indicator
  function showTypingIndicator() {
    if (!messagesContainer) return;

    // Check if indicator already exists
    if (document.getElementById('ai-typing-indicator')) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message assistant typing';
    typingDiv.id = 'ai-typing-indicator';

    typingDiv.innerHTML = `
      <div class="ai-message-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide Typing Indicator
  function hideTypingIndicator() {
    const indicator = document.getElementById('ai-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Simple Markdown Formatter
  function formatMarkdown(text) {
    // Escaping HTML
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold (**text** or *text*)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bullet points
    formatted = formatted.replace(/^\s*-\s+(.*?)$/gm, '• $1');

    return formatted;
  }

  // Fetch AI Response using Pollinations.ai (Free OpenAI-compatible endpoint)
  async function callAIWithContext() {
    const todayStr = new Date().toISOString().split('T')[0];
    const dbSummary = getDatabaseSummary();

    const systemPrompt = `Sen TECTAK platformunun resmi akıllı yapay zeka asistanısın. Görevin, sana sağlanan TECTAK etkinlik ve yarışma veritabanını kullanarak kullanıcıların sorularını Türkçe yanıtlamaktır.

Kritik Kurallar:
1. Sadece sana verilen veritabanındaki bilgileri referans al. Veritabanında olmayan etkinlikleri uydurma.
2. Eşleşen etkinliklerden bahsettiğinde, başlığını TAM olarak yaz. (Örn: "SAHA EXPO Savunma Sanayi Fuarı" veya "TEKNOFEST Yapay Zeka Yarışması" gibi). Başlıkları tam yazman arayüzümüzün bunları yakalayıp kart haline getirebilmesi için zorunludur!
3. Yanıtlarında güler yüzlü, samimi ama profesyonel bir üslup kullan.
4. Bugünü baz alarak konuş. Bugünün tarihi: ${todayStr}. Tarihi geçmiş etkinlikler için başvuruların kapandığını söyle.
5. Mesajlarında markdown kalınlaştırma (* veya **) kullanabilirsin. Kısa ve net cevaplar tercih et.

Mevcut Etkinlik ve Yarışma Veritabanı:
${dbSummary}

Kullanıcı sorusuna bu kurallar çerçevesinde Türkçe cevap ver.`;

    const payload = {
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory
      ],
      model: 'openai',
      jsonMode: false
    };

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    return await response.text();
  }

  // Get compressed database summary
  function getDatabaseSummary() {
    const currentEvents = window.events || (typeof events !== 'undefined' ? events : []);
    const currentComps = typeof competitions !== 'undefined' ? competitions : [];

    let summary = "=== ETKİNLİKLER ===\n";
    currentEvents.forEach(e => {
      summary += `- ID: ${e.id}, Başlık: ${e.title}, Kategori: ${e.category}, Şehir: ${e.city}, Konum: ${e.location}, Tarih: ${e.date}, Saat: ${e.time}-${e.endTime}, Ücret: ${e.price}, Düzenleyen: ${e.organizer}, Durum: ${e.registrationStatus || 'open'}\n`;
    });

    summary += "\n=== YARIŞMALAR ===\n";
    currentComps.forEach(c => {
      summary += `- ID: ${c.id}, Başlık: ${c.title}, Kategori: ${c.category}, Şehir: ${c.city}, Son Başvuru: ${c.deadline}, Ödül: ${c.prize}, Takım: ${c.teamSize}, Düzenleyen: ${c.organizer}, Durum: ${c.status || 'open'}\n`;
    });

    return summary;
  }

  // Match event titles in the reply and render clickable cards
  function renderEventCardsForReply(replyText, messageElement) {
    const currentEvents = window.events || (typeof events !== 'undefined' ? events : []);
    const currentComps = typeof competitions !== 'undefined' ? competitions : [];

    const foundEvents = [];
    const foundComps = [];

    // Check events
    currentEvents.forEach(e => {
      // Avoid duplicate cards or matching substring words by matching title properly
      if (replyText.toLowerCase().includes(e.title.toLowerCase()) && !foundEvents.some(x => x.id === e.id)) {
        foundEvents.push(e);
      }
    });

    // Check competitions
    currentComps.forEach(c => {
      if (replyText.toLowerCase().includes(c.title.toLowerCase()) && !foundComps.some(x => x.id === c.id)) {
        foundComps.push(c);
      }
    });

    // Render Events Cards
    foundEvents.forEach(e => {
      const card = document.createElement('a');
      card.href = `pages/event.html?id=${e.id}`;
      card.className = 'ai-chat-card';
      card.innerHTML = `
        <div class="ai-chat-card-icon">📍</div>
        <div class="ai-chat-card-info">
          <div class="ai-chat-card-title">${e.title}</div>
          <div class="ai-chat-card-meta">${e.date} | ${e.city} (${e.price})</div>
        </div>
      `;
      messageElement.appendChild(card);
    });

    // Render Competitions Cards
    foundComps.forEach(c => {
      const card = document.createElement('a');
      card.href = `pages/competition.html?id=${c.id}`;
      card.className = 'ai-chat-card';
      card.innerHTML = `
        <div class="ai-chat-card-icon">${c.icon || '🏆'}</div>
        <div class="ai-chat-card-info">
          <div class="ai-chat-card-title">${c.title}</div>
          <div class="ai-chat-card-meta">Son Başvuru: ${c.deadline} | Ödül: ${c.prize}</div>
        </div>
      `;
      messageElement.appendChild(card);
    });
  }

  // Heuristic Local Fallback Engine (Offline / API Down)
  function runLocalFallback(text) {
    const query = text.toLowerCase();
    const currentEvents = window.events || (typeof events !== 'undefined' ? events : []);
    const currentComps = typeof competitions !== 'undefined' ? competitions : [];

    let matchedEvents = [];
    let matchedComps = [];

    // Match keywords for categories
    let category = '';
    if (query.includes('savunma')) category = 'savunma';
    else if (query.includes('robot') || query.includes('otonom')) category = 'robotik';
    else if (query.includes('yazılım') || query.includes('bilişim') || query.includes('kod') || query.includes('algoritma')) category = 'bilisim';
    else if (query.includes('teknoloji')) category = 'teknoloji';
    else if (query.includes('elektrik') || query.includes('elektronik') || query.includes('enerji')) category = 'elektrik-elektronik';

    // Match cities
    const cities = ['istanbul', 'ankara', 'izmir', 'şanlıurfa', 'erzurum', 'antalya', 'gaziantep', 'bursa'];
    let cityMatch = '';
    cities.forEach(city => {
      if (query.includes(city)) cityMatch = city;
    });

    // Filter events
    currentEvents.forEach(e => {
      let score = 0;
      if (category && e.category === category) score += 3;
      if (cityMatch && e.city.toLowerCase() === cityMatch) score += 3;
      if (query.includes(e.title.toLowerCase())) score += 5;
      if (query.includes('ücretsiz') && e.price === 'Ücretsiz') score += 1;
      if (query.includes('ücretli') && e.price !== 'Ücretsiz') score += 1;
      if (query.includes('fuar') && e.type === 'Fuar') score += 1;
      if (query.includes('seminer') && e.type === 'Seminer') score += 1;

      if (score > 2) matchedEvents.push({ event: e, score });
    });

    // Filter comps
    currentComps.forEach(c => {
      let score = 0;
      if (category && c.category === category) score += 3;
      if (cityMatch && c.city.toLowerCase() === cityMatch) score += 3;
      if (query.includes(c.title.toLowerCase())) score += 5;
      if (query.includes('ödül')) score += 1;

      if (score > 2) matchedComps.push({ comp: c, score });
    });

    // Sort by relevance
    matchedEvents.sort((a, b) => b.score - a.score);
    matchedComps.sort((a, b) => b.score - a.score);

    // Limit outputs
    const topEvents = matchedEvents.slice(0, 3).map(x => x.event);
    const topComps = matchedComps.slice(0, 3).map(x => x.comp);

    if (topEvents.length === 0 && topComps.length === 0) {
      return "Şu anda ağ bağlantısı kurulamadığı için sorunuzu tam olarak cevaplayamadım. Ancak ana sayfadaki filtreleri veya arama kutusunu kullanarak aradığınız etkinlikleri kolayca bulabilirsiniz! 🌐";
    }

    let reply = "Şu anda ağ bağlantısı sınırlı olduğu için lokal arama motorumu kullanarak size en uygun şu etkinlikleri ve yarışmaları listeledim:\n\n";
    
    if (topEvents.length > 0) {
      reply += "**Önerilen Etkinlikler:**\n";
      topEvents.forEach(e => {
        reply += `- **${e.title}** (${e.city} - ${e.date})\n`;
      });
      reply += "\n";
    }

    if (topComps.length > 0) {
      reply += "**Önerilen Yarışmalar:**\n";
      topComps.forEach(c => {
        reply += `- **${c.title}** (Son Başvuru: ${c.deadline} - Ödül: ${c.prize})\n`;
      });
    }

    reply += "\n*Detaylı bilgi için aşağıdaki kartlara tıklayabilirsiniz.*";
    return reply;
  }
});
