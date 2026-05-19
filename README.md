# 🏗️ BayFatura: AI Destekli Fatura ve Finans Operasyon Platformu

BayFatura, KOBİ'ler ve büyüyen ekipler için tasarlanmış; fatura, müşteri, ürün, ödeme, ekip yönetimi ve finansal içgörü akışlarını tek yerde toplayan React/Firebase tabanlı bir SaaS uygulamasıdır. Uygulama; Gemini destekli AI modülleri, Almanya/Portekiz odaklı e-fatura ve vergi uyumluluğu, native mobil hazırlığı ve staging odaklı CI/CD altyapısıyla geliştirilmektedir.

## 🚀 Mevcut Durum (19 Mayıs 2026)

BayFatura aktif olarak **staging stabilizasyonu** aşamasındadır. Uygulama kodu, Firebase güvenlik kuralları ve Cloud Functions dağıtımı için GitHub Actions tabanlı profesyonel bir önizleme hattı kurulmuştur. Production'a geçiş kontrollü, manuel ve ayrı bir onay süreciyle yapılmalıdır.

### 🎯 Operasyonel Durum
- ✅ **Aktif geliştirme dalı:** `preview-test-staging`
- ✅ **CI doğrulamaları:** `npm run lint`, `npm test`, `npm run build`
- ✅ **Firestore rules testleri:** Emulator destekli `npm run test:rules`
- ✅ **Staging rules deploy:** Manuel GitHub Actions workflow ile doğrulanmış
- ✅ **Staging functions deploy:** Manuel GitHub Actions workflow ile doğrulanmış
- ✅ **Deploy edilen staging functions:** `stripeWebhook`, `proxyImage`, `scanReceipt`, `sendInvoiceEmail`, `sendInvitationEmail`, `syncUserPlan`, `syncAllAuthUsers`, `analyzeFinancials`, `analyzeBankStatement`, `acceptTeamInvitation`, `checkOverdueInvoices`, `processRecurringTemplates`
- ⚠️ **Production:** Henüz ana kaynak olarak ele alınmamalı; `main` dalı bilinçli şekilde reconcile edilmeden production deploy yapılmamalı

## ✨ Öne Çıkan Özellikler

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

### 📱 Native Mobile (iOS & Android)
- **Native Authentication:** Firebase Auth ve `@capacitor-firebase/authentication` ile tarayıcısız native FaceID/TouchID ve Google Play girişleri.
- **Platform Persistence:** WKWebView cookie blokajlarını aşan IndexedDB Local Persistence.


## 🛠️ Teknik Altyapı

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + Vite 7 + Framer Motion |
| Mobile Native | Capacitor 8 + iOS (SPM) + Android (Gradle) |
| Backend | Firebase Auth, Cloud Functions, Firestore, Storage |
| Cloud Functions Runtime | Node.js 22 |
| AI Engine | Google Genkit + Gemini (server-side functions) |
| Emailing | Resend API (Automated HTML Templates) |
| Testing | Vitest + Testing Library (Unit/Integration) |
| Security Rules Testing | Firebase Emulator + `@firebase/rules-unit-testing` |
| CI/CD | GitHub Actions + Firebase CLI (`npx -y firebase-tools@latest`) |
| Compliance | XRechnung, UBL 2.1 CIUS-PT, GoBD, §19/§13b UStG |
| PDF Engine | html2canvas + jsPDF + `proxyImage` CORS Proxy |
| Security | Multi-tenant isolation, GDPR Cookie Consent |
| Error Handling | React ErrorBoundary + Global unhandledrejection |
| Code Quality | ESLint (0 errors, 0 warnings) |

## 🚦 Geliştirme ve Deploy Akışı

### Aktif Branch Stratejisi
- Güncel çalışma dalı: `preview-test-staging`
- Yeni özellik, düzeltme ve altyapı değişiklikleri bu daldan açılan küçük PR'larla ilerlemelidir.
- `main`, şu an doğrudan production kaynağı kabul edilmemelidir. Production öncesi bilinçli reconciliation yapılmalıdır.

### Lokal Doğrulama

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:rules
node --check functions/index.js
```

### Staging Deploy

Staging deploy işlemleri GitHub Actions üzerinden manuel ve kontrollü yürütülür:

| Workflow | Amaç |
|----------|------|
| `preview-deploy.yml` | PR/preview hosting doğrulaması |
| `deploy-staging-rules.yml` | Firestore rules emulator doğrulama + Firestore/Storage rules staging deploy |
| `deploy-staging-functions.yml` | App doğrulama + Functions syntax check + staging functions deploy |

Gerekli staging secret'ları `STAGING_*` isim alanında tutulur. Firebase servis hesabı JSON dosyaları repoya commit edilmemelidir.

## 🔐 Firebase / IAM Notları

Staging functions deploy için GitHub Actions servis hesabında şu proje seviyeli yetkiler doğrulanmıştır:

- Firebase/Cloud Functions deploy yetkileri
- Service Account User (`iam.serviceAccounts.actAs`)
- Artifact Registry erişimi
- Cloud Run görüntüleme/listeleme
- Cloud Functions Admin (`cloudfunctions.functions.setIamPolicy` dahil)

Cloud Functions servis ajanı için Artifact Registry Reader rolü verilmiştir. Bu izinler staging deploy hattının çalışması için gereklidir; production ortamında aynı yapı ayrı servis hesabı ve ayrı onay süreciyle kurulmalıdır.

## 📁 Compliance Kütüphaneleri

```
src/lib/
├── portugalCompliance.js   # ATCUD, QR-PT, NIF doğrulama, IVA breakdown
├── ublGenerator.js         # UBL 2.1 CIUS-PT XML (B2G Portugal / eSPap)
└── xrechnungGenerator.js   # XRechnung / ZUGFeRD XML (B2G Germany / ZRE)
```

## 🔧 Bilinen Mimari Notlar

- **Firebase Storage CORS:** `proxyImage` Cloud Function ile sunucu tarafında çözüldü.
- **Staging kaynak dalı:** `preview-test-staging`, aktif geliştirme ve test dalıdır.
- **Firebase CLI kullanımı:** CI ve lokal komutlarda `npx -y firebase-tools@latest` tercih edilir.
- **Alan İsimleri:** Şirket profili için `companyPhone` / `companyEmail` kullanılır.
- **AT Sertifikasyonu:** ATCUD üretimi referans amaçlıdır. Portekiz'de yasal fatura için AT sertifikasyonu ve TOC (Técnico Oficial de Contas) danışmanlığı gereklidir.
- **eSPap B2G:** Ocak 2026'dan itibaren tüm KOBİ'ler için kamu kurumlarına e-fatura zorunluluğu.
- **Leitweg-ID:** Almanya'da kamu kurumuna fatura için zorunlu; kurumdan temin edilir.
- **Bilinen teknik borç:** Functions bağımlılıklarında npm audit uyarıları bulunmaktadır; deploy'u engellemez fakat ayrı bir dependency hardening adımı olarak ele alınmalıdır.

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
## 🚀 31. Native Mobile Evolution (iOS & Android Native) (Completed — 15 Mayıs 2026)

### 🔐 31.1 Native Auth & Persistency (iOS & Android)
- **IndexedDB Persistence:** iOS WKWebView ITP engelini aşan platform duyarlı yetkilendirme yönetimi.
- **Native Sheet Engine:** Google ve Apple butonlarında native iOS ve Google Play Services doğrulama alt ekranları aktif edildi.
- **Hybrid Context Bridge:** `AuthContext.jsx` üzerinden akıllı web/native fallback yönlendirmesi kuruldu.

### 🍎 31.2 iOS & Xcode Infrastructure (Fixed)
- **Xcode project.pbxproj Repair:** Xcode üzerinde kaybolan `GoogleService-Info.plist` bağlantıları dinamik olarak düzeltildi.
- **URL Scheme Sync:** OAuth Deep-Link URL şemaları güncel `REVERSED_CLIENT_ID` ile senkronize edildi.
- **SPM Resolver:** `xcodebuild -resolvePackageDependencies` ile Swift Package Manager kütüphanesi başarıyla derlendi.

### 🤖 31.3 Android Hardening (Completed)
- **Firebase Assets:** Canlı `google-services.json` dosyası app modülüne kilitlendi.
- **Gradle Injection:** `rgcfaIncludeGoogle` bayrağı Gradle yapılandırmasına enjekte edilerek derleme sağlandı (`BUILD SUCCESSFUL`).

---

## ☁️ 32. Cloud Infrastructure & Team Workflow (Completed — 17 Mayıs 2026)

### 🛠️ 32.1 Functions Stability & Node.js 22 Upgrade
- **Module Not Found Fix:** `functions/node_modules` dizinindeki kopmalar çözülerek, paketler güvenle yeniden kuruldu.
- **Node Engine Upgrade:** Firebase Functions çalışma ortamı (runtime) Node 20'den (deprecated) Node 22 sürümüne yükseltildi.
- **Successful Deployment:** Tüm Cloud Functions (AI, Stripe, Email, Auth) sorunsuz olarak production'a aktarıldı.

### 📧 32.2 Team Invitation Architecture
- **Cloud Execution:** `sendInvitationEmail` ve `acceptTeamInvitation` Cloud Function'ları Resend entegrasyonuyla aktif edildi.
- **Client Routing:** Davetiyelerin güvenli bir şekilde kabul edilmesi için `AcceptInvite.jsx` UI bileşeni oluşturuldu ve `/accept-invite` rotası `App.jsx` üzerinden tanımlandı.

### 🛡️ 32.3 CSP & AdSense Hardening
- **Content Security Policy (CSP):** `index.html` içerisindeki CSP meta etiketi güncellendi.
- **Allowed Domains:** Google AdSense reklam ağı (`pagead2.googlesyndication.com`) ve Google Profil Görselleri (`lh3.googleusercontent.com`) güvenli (`img-src`, `connect-src`, `frame-src`) listelerine eklendi.

---
## 🧪 33. Staging CI/CD Stabilization (Completed — 19 Mayıs 2026)

### 🌿 33.1 Branch & Release Guardrails
- **Aktif dal netleştirildi:** `preview-test-staging`, staging geliştirme ve test kaynağı olarak belirlendi.
- **Production koruması:** `main` dalı bilinçli şekilde reconcile edilmeden production kaynağı olarak kullanılmamalıdır.
- **Dokümantasyon:** `docs/branch-strategy.md`, `docs/ci-cd.md`, `docs/testing-strategy.md` ve staging rehberleri eklendi/güncellendi.

### 🔒 33.2 Staging Rules Pipeline
- **Rules workflow:** `deploy-staging-rules.yml` manuel çalıştırılabilir hale getirildi.
- **Emulator guard:** Deploy öncesi `npm run test:rules` ile Firestore rules emulator testleri çalıştırılır.
- **Doğrulama:** Staging rules deploy hattı GitHub Actions üzerinde başarıyla doğrulandı.

### ☁️ 33.3 Staging Functions Pipeline
- **Functions workflow:** `deploy-staging-functions.yml` eklendi.
- **Deploy öncesi kontroller:** `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npm ci --prefix functions`, `node --check functions/index.js`.
- **Staging deploy:** `npx -y firebase-tools@latest deploy --only functions --project bayfatura-staging` GitHub Actions üzerinden başarıyla çalıştı.
- **Deploy doğrulama:** Staging projesinde 12 Cloud Function listelendi ve Node.js 22 runtime ile aktif hale geldi.

### 📌 33.4 Sıradaki Teknik Öncelikler
- Staging üzerinde kritik kullanıcı akışlarını canlı test etmek.
- Functions npm audit uyarılarını ayrı bir dependency hardening adımı olarak ele almak.
- Production servis hesabı, secret ve IAM modelini staging'den ayrı ve kontrollü şekilde planlamak.
- `main` dalı reconciliation sürecini küçük ve denetlenebilir PR'larla yürütmek.

---
© 2026 BayFatura Cloud — Innovation in Finance.
*Last Updated: 19 Mayıs 2026 (Staging CI/CD Stabilization)*
