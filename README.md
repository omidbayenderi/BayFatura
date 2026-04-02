# 🚀 BayFatura - Çok Rollü Şantiye ve Finans Yönetim Uygulaması

**BayFatura**, inşaat firmaları ve serbest çalışanlar için tasarlanmış, çok dilli, sektör odaklı, modern bir faturalandırma ve şantiye yönetim platformudur. Supabase altyapısından Firebase'e başarıyla taşınmış olup, gerçek zamanlı veri senkronizasyonu ile çalışmaktadır.

---

## 🛠️ Teknoloji Yığını

- **Frontend:** React 19 + Vite + React Router 7
- **Görsel Tasarım:** Vanilla CSS (Glassmorphism & Premium UI Principles)
- **Animasyon:** Framer Motion
- **Grafik & Raporlama:** Recharts
- **Backend:** Firebase (Aktif: Cloud Firestore, Auth, Storage, Analytics)
- **Gelecek Veri Yapısı:** Firebase Data Connect (PostgreSQL / SQL Desteği)

---

## ✨ Ana Özellikler

- **🎨 Modern Arayüz:** Göz alıcı glassmorphism tasarımı ve dinamik mikro-animasyonlar.
- **🌍 Çok Dilli Destek:** TR, DE, EN, FR, ES, PT (6 dil tam senkronizasyon).
- **📂 Sektörel Esneklik:** Otomotiv, İnşaat ve Genel sektörler için özelleştirilmiş veri alanları.
- **📑 Akıllı Belge Yönetimi:** PDF Üretimi (jsPDF), HTML2Canvas ile önizleme ve paylaşım.
- **📊 Finansal Takip:** Gelir/gider takibi, vergi hesaplamaları ve gerçek zamanlı finansal dashboardlar.

---

## 🏗️ Admin Paneli & Yönetim Akışı (MVP Yol Haritası)

İşverenler ve üst düzey yöneticiler için tasarlanan yeni Admin Paneli şu modülleri içermektedir:

### 1. Kullanıcı Yönetimi (HR & Roles)
- Çalışan listesi, arama ve filtreleme.
- Rol atama (Admin, Şantiye Şefi, Muhasebe vb.).
- Şantiye bazlı yetkilendirme sistemi.

### 2. Raporlar Merkezi
- Günlük şantiye raporları.
- Gelir-gider ve nakit akış raporları.
- Stok ve demirbaş durumu.
- Proje ilerleme yüzdeleri (Gantt/Progress).

### 3. Finansal Dashboard (Executive View)
- Toplam ciro, bekleyen ödemeler ve güncel borç durumu.
- Sektörel bazlı finansal performans grafikleri.
- Vergi ve yasal ödeme planlayıcı.

### 4. Şantiye ve İş Akışı İzleme
- Tüm projelerin kanban/liste görünümü.
- Şantiye bazlı ilerleme durumları ve aşama takibi.
- Kaynak (işçi/makine) dağılımı.

### 5. Mesajlar & Bildirimler
- Yöneticilere özel not iletme ve sistem bildirimleri.
- Kritik durum uyarıları (Geciken ödemeler, iş kazası bildirimleri vb.).

---

## 🚀 Başlangıç

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Gerekli araçları yükle
npm install -g firebase-tools
```

### Geliştirme Modu

```bash
npm run dev
```

### Dağıtım (GitHub Pages / Firebase Hosting)

```bash
# GitHub Pages Deployment
npm run deploy

# Firebase Hosting Deployment
npm run firebase-deploy
```

---

## 🔐 DB ve Güvenlik
Proje şu anda **Cloud Firestore**'u ana veritabanı olarak kullanmaktadır. `/dataconnect` dizini altında bulunan PostgreSQL şemasıyla gelecekteki SQL geçişi için mimari altyapısı hazır durumdadır.

---

*Tasarlayan: Omid Bayenderi / BayFatura Ürün & UX Ekibi*
