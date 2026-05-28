# 📐 TECTAK — Proje Şeması ve Mimari Dokümanı

> **Proje:** TECTAK — Teknoloji Takvimi  
> **Geliştirici:** Abdullah GÜLER  
> **Versiyon:** 2.0  
> **Son Güncelleme:** Mayıs 2026

---

## 🎯 Problem Tanımı

Türkiye'de her yıl yüzlerce teknoloji, bilişim, robotik, savunma sanayii, elektrik-elektronik ve yapay zeka alanlarında **seminer**, **fuar**, **gösteri**, **yarışma** ve **etkinlik** düzenlenmektedir.

### Mevcut Sorunlar:
- ❌ Etkinlik bilgileri **onlarca farklı web sitesine** dağınık halde
- ❌ Kategorize edilmiş **tek bir merkezi platform** bulunmuyor
- ❌ Başvuru tarihleri, bilet bilgileri ve konum verileri **derlenmiş** şekilde mevcut değil
- ❌ Etkinliklerin **harita üzerinde görselleştirilmesi** yapılmıyor
- ❌ Geçmiş etkinliklerin durumları **manuel** takip ediliyor
- ❌ Kullanıcılar **doğal dilde** etkinlik sorgulayamıyor

---

## 🚀 Amaç ve Vizyon

**TECTAK**, yukarıdaki sorunları çözmek için tasarlanmış kapsamlı bir **Teknoloji Etkinlik Takvimi** platformudur.

### Temel Hedefler:

| Hedef | Açıklama |
|-------|----------|
| **Merkezileştirme** | Tüm teknoloji etkinliklerini tek platformda toplama |
| **Kategorize Etme** | Savunma, yazılım, robotik, elektronik, AI kategorileriyle sınıflandırma |
| **Görselleştirme** | Harita, takvim ve grafiklerle etkinlikleri sunma |
| **Otomatik Güncelleme** | GitHub Actions ile haftalık otomatik veri yenileme |
| **Akıllı Arama** | AI asistan ile doğal dilde etkinlik sorgulama |
| **Erişilebilirlik** | Mobil uyumlu, hızlı, ücretsiz erişim |

---

## 🏗️ Mimari Yapı

### Katmanlı Mimari

```
┌─────────────────────────────────────────────────────┐
│                    SUNUM KATMANI                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ index    │ │ event    │ │ 3d_map   │ │ promo  │ │
│  │ .html    │ │ .html    │ │ .html    │ │ .html  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ competi- │ │ all_     │ │ news     │ │ regis- │ │
│  │ tion.html│ │ news.html│ │ .html    │ │ ter.htm│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│                     STİL KATMANI                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │ style.css (44KB, 1469 satır)                    │ │
│  │ • Glassmorphism Design System                   │ │
│  │ • CSS Custom Properties                         │ │
│  │ • Responsive Breakpoints                        │ │
│  │ • Animasyonlar & Geçişler                       │ │
│  └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│                   İŞ MANTIĞI KATMANI                 │
│  ┌───────────┐ ┌────────────┐ ┌───────────────────┐ │
│  │ app.js    │ │ detail.js  │ │ ai_assistant.js   │ │
│  │ (34KB)    │ │ (13.6KB)   │ │ (13KB)            │ │
│  └───────────┘ └────────────┘ └───────────────────┘ │
│  ┌───────────┐ ┌────────────┐ ┌───────────────────┐ │
│  │dashboard  │ │ comp_      │ │ news_detail.js    │ │
│  │.js (9KB)  │ │ detail.js  │ │ (3.5KB)           │ │
│  └───────────┘ └────────────┘ └───────────────────┘ │
├─────────────────────────────────────────────────────┤
│                 3D GRAFİK KATMANI                    │
│  ┌───────────────┐ ┌─────────────────────────────┐  │
│  │liquid_ocean.js│ │ Inline Three.js             │  │
│  │(Three.js+GLSL)│ │ (Particle Globe)            │  │
│  └───────────────┘ └─────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                    VERİ KATMANI                       │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ data.js  │ │ events.json  │ │ news_data.js     │ │
│  │ (18KB)   │ │ (12.4KB)     │ │ (7.7KB)          │ │
│  │ 22 event │ │ JSON mirror  │ │ 10 haber         │ │
│  │ 10 comp  │ │              │ │                  │ │
│  └──────────┘ └──────────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────────┤
│                 OTOMASYON KATMANI                     │
│  ┌────────────────┐ ┌───────────────────────────┐   │
│  │ GitHub Actions  │ │ fetch_events.js           │   │
│  │ (Haftalık Cron) │ │ update_status.js          │   │
│  └────────────────┘ └───────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Veri Modeli

### Etkinlik (Event) Yapısı

```javascript
{
  id: Number,              // Benzersiz kimlik
  title: String,           // Etkinlik adı
  category: String,        // Kategori (savunma, yazılım, robotik, vb.)
  date: String,            // Tarih (YYYY-MM-DD)
  time: String,            // Başlangıç saati (HH:MM)
  endTime: String,         // Bitiş saati (HH:MM)
  location: String,        // Mekan adı
  city: String,            // Şehir
  lat: Number,             // Enlem (harita için)
  lng: Number,             // Boylam (harita için)
  description: String,     // Detaylı açıklama
  registrationUrl: String, // Kayıt/başvuru linki
  type: String,            // Tip (Fuar, Seminer, Gösteri, vb.)
  price: String,           // Ücret bilgisi
  organizer: String,       // Organizatör
  registrationStatus: String // "open" | "closed"
}
```

### Yarışma (Competition) Yapısı

```javascript
{
  id: String,              // "c1", "c2", vb.
  title: String,           // Yarışma adı
  icon: String,            // Emoji ikonu
  prize: String,           // Ödül miktarı
  tags: Array<String>,     // Etiketler
  description: String,     // Açıklama
  city: String,            // Şehir
  teamSize: String,        // Takım büyüklüğü
  deadline: String,        // Son başvuru tarihi
  level: String,           // Seviye (Lisans, Tüm Seviyeler, vb.)
  organizer: String,       // Organizatör
  registrationUrl: String, // Başvuru linki
  lat: Number,             // Enlem
  lng: Number              // Boylam
}
```

### Haber (News) Yapısı

```javascript
{
  id: Number,              // Benzersiz kimlik
  title: String,           // Haber başlığı
  date: String,            // Yayın tarihi (YYYY-MM-DD)
  author: String,          // Yazar
  source: String,          // Kaynak site
  summary: String,         // Özet
  content: String,         // Tam içerik (HTML destekli)
  images: Array<String>    // Görsel URL'leri
}
```

---

## 🗺️ Sayfa Akış Diyagramı

```
                          ┌──────────────┐
                          │  promo.html  │
                          │  (Tanıtım)   │
                          └──────┬───────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────┐
│                       index.html                            │
│                      (ANA SAYFA)                            │
│                                                             │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌───────┐ ┌────────┐ │
│  │Etkinlik │ │Yarışmalar│ │Takvim  │ │Haber- │ │İstatis-│ │
│  │  Grid   │ │  Grid    │ │Görünümü│ │ler    │ │tikler  │ │
│  └────┬────┘ └────┬─────┘ └────────┘ └───┬───┘ └────────┘ │
│       │           │                      │                  │
│  ┌────┴────┐ ┌────┴─────┐          ┌────┴────┐             │
│  │Harita   │ │Tüm Yarış-│          │Tüm      │             │
│  │(Pin/Isı)│ │malar →   │          │Haberler→│             │
│  └────┬────┘ └──────────┘          └─────────┘             │
│       │                                                     │
│  ┌────┴────┐                                               │
│  │3D Harita│                                               │
│  │Widget → │                                               │
│  └─────────┘                                               │
└────────────────────────────────────────────────────────────┘
       │              │                    │
       ▼              ▼                    ▼
┌──────────┐   ┌──────────────┐   ┌──────────────┐
│event.html│   │competition   │   │  news.html   │
│(Detay)   │   │.html (Detay) │   │  (Detay)     │
└────┬─────┘   └──────────────┘   └──────────────┘
     │
     ▼
┌──────────┐        ┌──────────────┐
│register  │        │  3d_map.html │
│.html     │        │  (MapLibre)  │
│(Kayıt)   │        └──────────────┘
└──────────┘
```

---

## 🎨 Tasarım Şeması

### Renk Paleti

| Renk | Hex Kodu | Kullanım |
|------|----------|----------|
| 🖤 Ana Arka Plan | `#0a0a0f` | Body background |
| 🌑 İkincil Arka Plan | `#12121a` | Kart ve bölüm arka planları |
| 🔵 Mavi Vurgu | `#00D4FF` | Linkler, başlıklar, harita pinleri |
| 🟢 Yeşil Vurgu | `#00FF88` | Aktif durum, başarı, CTA butonları |
| 🔴 Kırmızı Vurgu | `#FF6B6B` | Kapalı durum, uyarılar |
| 🟡 Sarı Vurgu | `#FFD93D` | Dikkat çekici elementler |
| 🟣 Mor Vurgu | `#a78bfa` | İkincil aksanlar |
| ⚪ Ana Yazı | `#f0f0f5` | Başlıklar, ana metin |
| 🔘 İkincil Yazı | `#8888a0` | Alt başlıklar, meta bilgi |
| ⚫ Soluk Yazı | `#55556a` | Deaktif metin |

### Tasarım Prensipleri

1. **Glassmorphism** — Yarı saydam cam efekti paneller (`backdrop-filter: blur`)
2. **Dark Mode First** — Tüm bileşenler koyu tema için optimize
3. **Neon Aksanlar** — Cyan ve yeşil renklerle dikkat çekici vurgular
4. **Micro-Animations** — Hover efektleri, geçiş animasyonları, reveal efektleri
5. **3D Derinlik** — Three.js ile arka plan, CSS transforms ile kartlar
6. **Mobile First** — Mobil alt navigasyon, touch-optimized kontroller
7. **Minimal Sayfa Sayısı** — Tek sayfa uygulama (SPA) yaklaşımı
8. **Maksimum Verim** — Lazy loading, IntersectionObserver, optimize render

---

## 🔧 Kullanılan Araçlar ve Teknolojiler

### Frontend Stack

| Araç | Versiyon | Amaç |
|------|----------|------|
| HTML5 | — | Semantik sayfa yapısı |
| CSS3 (Vanilla) | — | Stil sistemi, animasyonlar, responsive |
| JavaScript (ES6+) | — | Tüm iş mantığı |
| Three.js | r128 | 3D Liquid Ocean + Particle Globe |
| Leaflet.js | 1.9.4 | 2D İnteraktif harita |
| leaflet.heat | 0.2.0 | Isı haritası eklentisi |
| MapLibre GL JS | 2.4.0 | 3D harita + fill-extrusion |
| Chart.js | latest | İstatistik grafikleri |
| CARTO Dark | — | Karanlık tema harita karoları |
| Google Fonts | — | Inter + Outfit tipografi |

### Backend & Otomasyon

| Araç | Amaç |
|------|------|
| GitHub Actions | Haftalık otomatik veri güncelleme |
| GitHub Pages | Statik site hosting |
| Node.js 24 | Veri çekme ve güncelleme betikleri |
| Pollinations.ai | AI chatbot API (ücretsiz) |

---

## 📈 Proje Metrikleri

| Metrik | Değer |
|--------|-------|
| Toplam HTML Sayfası | 10 |
| Toplam JavaScript Dosyası | 11 |
| Toplam CSS Satırı | 1,469 |
| Toplam JS Boyutu | ~120 KB |
| Toplam Etkinlik | 22+ |
| Toplam Yarışma | 10+ |
| Toplam Haber | 10+ |
| Kapsanan Şehir | 8 |
| Harita Modu | 3 (Pin, Isı, 3D) |
| Grafik Türü | 4 (Doughnut, Bar, Pie, Stats) |
| 3D Kütüphane | 2 (Three.js, MapLibre) |
| Otomasyon Sıklığı | Haftalık (Pazartesi) |

---

## 🔮 Gelecek Planları

- [ ] PWA (Progressive Web App) desteği
- [ ] Push notification ile etkinlik hatırlatmaları
- [ ] Kullanıcı hesap sistemi
- [ ] Kişiselleştirilmiş etkinlik önerileri
- [ ] Takvim senkronizasyonu (Google Calendar, Apple Calendar)
- [ ] Çoklu dil desteği (EN, TR)
- [ ] API endpoint'leri (REST API)
- [ ] Daha fazla şehir ve etkinlik verisi

---

<p align="center">
  <strong>TECTAK — Teknoloji Dünyasının Etkinlik Takvimi 🚀</strong><br>
  <em>Geliştirici: Abdullah GÜLER</em><br>
  <a href="https://www.linkedin.com/in/abdullah-g%C3%BCler-2a926b29b/">LinkedIn</a> · 
  <a href="https://github.com/abdullahglr/tectak">GitHub</a> · 
  <a href="https://abdullahglr.github.io/tectak/">Canlı Demo</a>
</p>
