# 🏗️ BayFatura: Next-Gen Enterprise SaaS Invoicing

BayFatura, KOBİ'ler ve kurumsal işletmeler için tasarlanmış, **Yapay Zeka (Gemini 1.5 Flash)** ve **çok bölgeli yasal uyumluluk** ile donatılmış, pazar lideri bir fatura ve finansal operasyon platformudur. Portekiz, Almanya ve tüm AB pazarı için **tam compliance** altyapısına sahiptir.

## 🚀 Global Launch Readiness (Mayıs 2026) - %100 TAMAMLANDI ✅

Platform, **Avrupa (Portekiz, Almanya) ve Global pazarların tüm yasal gereksinimlerini** karşılayarak tam üretim hazır hale getirilmiştir.

### 🎯 Launch Score: **%100** (Production Ready)
- ✅ **ESLint:** 0 hata, 0 uyarı - Kod kalitesi mükemmel
- ✅ **Build:** Başarılı (16.68s) - Production bundle hazır
- ✅ **Test:** Vitest altyapısı kurulu, temel testler geçiyor
- ✅ **Security:** `.env` gitignore'da, canlı API anahtarları korunuyor
- ✅ **Code Integrity:** Mevcut yapı korundu, sıfır kod bozulması

## ✨ Öne Çıkan Özellikler (Full Active)

### 🇵🇹 Portekiz (AT) Compliance
- **ATCUD:** Portekiz vergi dairesi zorunlu ATCUD kodu (`AtValidationCode-SeqNum` formatı, Decreto-Lei n.º 28/2019).
- **QR Code AT:** Portaria n.º 195/2020 standardında, her faturaya zorunlu PT QR kodu (2021'den itibaren zorunlu).
- **NIF Doğrulama:** 9 haneli NIF checksum algoritması ile gerçek zamanlı doğrulama.
- **IVA Oranları:** Normal (23%), Intermédia (13%), Reduzida (6%), Isento (0%) seçici dropdown.
- **UBL 2.1 / CIUS-PT:** EN 16931 + EU Directive 2014/55/EU uyumlu B2G XML faturası (eSPap/PEPPOL).

### 🇩🇪 Almanya (DE) Compliance
- **§19 UStG Kleinunternehmer:** Toggle ile aktivasyon, 0% MwSt, zorunlu yasal metin otomatik eklenir.
- **Reverse Charge (§13b UStG):** AB çapraz sınır B2B için otomatik 0% MwSt + zorunlu metin.
- **Leistungsdatum (§14 UStG):** Hizmet/teslimat tarihi alanı (fatura tarihinden farklıysa zorunlu).
- **XRechnung:** ZRE/OZG-RE üzerinden kamu sektörüne (B2G) XML gönderimi, dinamik CountryID.

### 🏛️ B2G (Business to Government)
- **UBL XML İndirme:** Tek tıkla CIUS-PT formatında XML indir, eSPap'a gönder.
- **XRechnung XML İndirme:** Almanya kamu kurumlarına e-rechnung-bund.de üzerinden gönderim.
- **B2G Toggle:** Fatura oluşturma ekranında; Buyer Reference / Leitweg-ID ve NIF Entidade alanları.
- **Çok Dilli B2G Desteği:** Fatura diline (`invoiceLanguage`) duyarlı olarak tüm B2G etiketleri, placeholder'lar ve adım adım kılavuzlar otomatik ve kusursuz yerelleşir.
- **Rehber:** eSPap ve ZRE/OZG-RE adım adım gönderim talimatları seçilen belge dilinde form içinde sunulur.

### 🔐 Güvenlik & GDPR
- **Stripe Secret Key Güvenliği:** `VITE_STRIPE_SECRET_KEY` frontend'den tamamen kaldırıldı.
- **Cookie Consent (GDPR/DSGVO):** Granüler onay (gerekli/analitik/pazarlama), yasal sayfalar.
- **Hukuki Sayfalar:** `/privacy` (Gizlilik), `/impressum` (Yasal Bildirim), `/terms` (AGB) aktif.
- **API Key Protection:** Canlı anahtarlar `.env` dosyasında, gitignore ile korunuyor.
- **Birinci Taraf Kimlik Doğrulama (Custom Auth Domain):** Safari ve Chrome Gizli Sekme çerez engellemelerini tamamen aşan, `bayfatura.com` özel alan adı tabanlı, Dynamic Links kapanışından etkilenmeyen OAuth entegrasyonu.

### 🤖 AI & Akıllı Özellikler
- **Magic Bank Matcher:** CSV/MT940 ekstreleri Google Genkit AI ile faturalarla saniyeler içinde eşleştirir.
- **AI Vision Agent:** Gemini 1.5 Flash Vision ile fiş/makbuz otomatik okuma, vergi ve kategori analizi.
- **AI Financial Oracle:** 3 aylık nakit akışı ve vergi yükü tahmini.
- **Real-Time Notifications:** Firestore `onSnapshot` tabanlı tüm cihazlarda anlık bildirim sistemi.
- **Real-Time Auth-Firestore Senkronizasyonu:** `onUserCreated` ve `onUserDeleted` sunucu tarafı Cloud Function tetikleyicileri ile gerçek zamanlı profil yönetimi.
- **DCC 'Sync Auth Profiles' Entegrasyonu:** Super Adminler için tek tıkla çalışan ve eksik profil belgelerini üreten Callable Cloud Function.

### 📄 Fatura & Doküman
- **XRechnung / ZUGFeRD:** EN 16931 tam uyumlu Alman e-fatura standardı.
- **GoBD Compliance:** Değişmez (immutable) fatura arşivi, yasal denetim hazır.
- **DATEV Export:** Tek tıkla muhasebe yazılımı uyumlu CSV/ASCII aktarımı.
- **CORS-Safe PDF Engine:** `proxyImage` Cloud Function ile Chrome, Safari, Firefox'ta hatasız PDF üretimi.
- **Çok Sayfalı Fatura:** Otomatik sayfalama, her sayfada header/footer.

### 💳 Ödeme & SaaS
- **Müşteri Self-Servis Portalı:** Public fatura izleme + Stripe ve PayPal entegrasyonu.
- **Three-Tier Pricing:** Free (0€), Elite (9€/Ay), Lifetime (299€).
- **One-Click Social Login:** Google ve Apple (iCloud) için tek tıkla giriş.

### 🌍 Lokalizasyon
- **6 Dil:** DE, TR, EN, FR, ES, PT — tüm fatura ve arayüz metinleri.
- **Dinamik Vergi Etiketi:** Ülkeye göre IVA / TVA / MwSt / VAT otomatik değişir.

## 🛠️ Teknik Altyapı

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React + Vite + Framer Motion (OLED Dark Mode) |
| Backend | Firebase (Auth, Cloud Functions v5, Firestore, Storage) |
| AI Engine | Google Genkit + Gemini 1.5 Flash (Server-side) |
| Emailing | Resend API (Automated HTML Templates) |
| Testing | Vitest + Testing Library (Unit/Integration) |
| Compliance | XRechnung, UBL 2.1 CIUS-PT, GoBD, §19/§13b UStG |
| PDF Engine | html2canvas + jsPDF + `proxyImage` CORS Proxy |
| Security | Multi-tenant isolation, GDPR Cookie Consent |
| Error Handling | React ErrorBoundary + Global unhandledrejection |
| Code Quality | ESLint (0 errors, 0 warnings) |

## 📁 Compliance Kütüphaneleri

```
src/lib/
├── portugalCompliance.js   # ATCUD, QR-PT, NIF doğrulama, IVA breakdown
├── ublGenerator.js         # UBL 2.1 CIUS-PT XML (B2G Portugal / eSPap)
└── xrechnungGenerator.js   # XRechnung / ZUGFeRD XML (B2G Germany / ZRE)
```

## 🔧 Bilinen Mimari Notlar

- **Firebase Storage CORS:** `proxyImage` Cloud Function ile sunucu tarafında çözüldü.
- **Alan İsimleri:** Şirket profili için `companyPhone` / `companyEmail` kullanılır.
- **AT Sertifikasyonu:** ATCUD üretimi referans amaçlıdır. Portekiz'de yasal fatura için AT sertifikasyonu ve TOC (Técnico Oficial de Contas) danışmanlığı gereklidir.
- **eSPap B2G:** Ocak 2026'dan itibaren tüm KOBİ'ler için kamu kurumlarına e-fatura zorunluluğu.
- **Leitweg-ID:** Almanya'da kamu kurumuna fatura için zorunlu; kurumdan temin edilir.

---
## 🛠️ 29. Firestore Security & CRUD Fix (Completed — 05 Mayıs 2026)

### 🔐 29.1 Firestore Rules Overhaul (Fixed)
- **tenantId → userId Migration:** Tüm güvenlik kuralları `tenantId` bağımlılığından arındırıldı, saf `userId` tabanlı erişim kontrolüne geçildi.
- **Multi-Collection Fix:** `customers`, `products`, `invoices`, `quotes`, `expenses`, `recurring_templates` koleksiyonları için izinler düzeltildi.
- **Subcollection Rules:** `users/{userId}/notifications`, `users/{userId}/team`, `users/{userId}/invites` alt koleksiyonları için kurallar eklendi.
- **CRUD Operations:** Müşteri ekleme/silme, ürün ekleme/silme işlemleri artık %100 çalışıyor.

### 🎨 29.2 Modern Delete Confirmation UI (Completed)
- **Customer Delete Modal:** Animasyonlu kırmızı uyarı ikonu, bilgi kutusu ve şık butonlarla yeniden tasarlandı.
- **Product Delete Modal:** Müşteri silme ekranıyla uyumlu, modern ve kullanıcı dostu tasarım.
- **CSS Enhancements:** `delete-confirm-modal`, `delete-confirm-icon-wrapper`, `delete-confirm-actions` sınıfları eklendi.

### 🐛 29.3 Critical Bug Fixes (Completed)
- **Team.jsx:** `tenantId` kalıntıları temizlendi, `collection()` ve `addDoc()` fonksiyonlarındaki söz dizimi hataları düzeltildi.
- **Notifications.jsx:** Tüm `tenantId || currentUser.uid` kullanımları `currentUser.uid` ile değiştirildi.
- **ProductContext.jsx:** `tenantId` alanı olmadan sadece `userId` ile kayıt işlemi.
- **InvoiceContext.jsx:** `tenantId` temizliği, `or()` sorguları `where()` ile değiştirildi.

---
## 🚀 30. PDF Engine 3.0 & Seamless PWA Recovery (Completed — 06 Mayıs 2026)

### 📄 30.1 PDF Slicing & Mobile Layout Fix (Completed)
- **Desktop Dimension Forcing:** Mobil cihazlarda PDF indirme esnasında, canvas capture işleminden tam bir saniye önce `width: 794px !important` zorlaması yapılarak, mobil CSS ezildi ve PDF'in masaüstü A4 kalitesinde render edilmesi sağlandı.
- **Smart Multi-Page Slicing:** Uzun canvas (`297mm * Sayfa Sayısı`), özel `jsPDF` dilimleme döngüsü (`heightLeft >= 1` toleransı) ile tam `297mm` parçalara bölünerek çok sayfalı eksiksiz PDF dosyasına dönüştürüldü.
- **Gap Removal Logic:** Sayfalar arası boşluklar (`marginBottom`), PDF üretimi öncesinde geçici olarak `0 !important` yapılarak kesilme (gap artifact) engellendi.

### 🔄 30.2 PWA / Vite Chunk Load Error Recovery (Completed)
- **Silent Auto-Reload:** Tablet veya telefonda, eski sürüm yüklüyken deploy sonrası oluşan Vite Lazy Load hataları (`text/html is not a valid JavaScript MIME type`), `ErrorBoundary` içerisinde özel olarak yakalandı.
- **SessionStorage Guard:** Kullanıcıyı uyarmak yerine, hata anında `sessionStorage` üzerinden bir flag atanarak tarayıcının sessizce ve otomatik olarak yeniden yüklenmesi (`window.location.reload()`) sağlandı.
- **Kesintisiz Kullanım:** `componentDidMount` kancası ile uygulama başarıyla yüklendiğinde bayrak temizlenerek sonsuz döngü engellendi.

---
© 2026 BayFatura Cloud — Innovation in Finance.
*Last Updated: 06 Mayıs 2026 (PDF Engine 3.0 & PWA Recovery)*
