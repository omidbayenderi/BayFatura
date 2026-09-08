# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev                  # Web dev server (localhost:5173)
npm run dev -- --host        # Expose to local network (telefon testi için)
npm run dev:preview          # Preview channel env

# Build
npm run build                # Production build → dist/
npm run build:preview        # Preview channel build

# Quality gate (run before any deploy)
npm run check:release        # lint + test + build

# Tests
npm test                     # Vitest unit tests (17 dosya, 98 test)
npm run test:rules           # Firestore security rules (requires Firebase emulator)

# Deploy
npm run deploy:production    # Full production deploy (hosting + functions + firestore + storage)
npm run deploy:preview       # 7-day preview channel
npm run deploy:functions     # Functions only
npm run deploy:rules         # Firestore + Storage rules only
```

**Functions (from `functions/` dir):**
```bash
firebase emulators:start --only functions   # Local functions emulator
firebase deploy --only functions            # Deploy all functions
firebase deploy --only functions:fnName     # Deploy single function

# SEO Agent deploy / manuel tetikleme DCC portal'dan yapılır
npx -y firebase-tools@latest deploy --only functions:seoAgent,functions:triggerSeoAgent
```

**EU veri migration (tek seferlik):**
```bash
gcloud auth application-default login      # Tarayıcıda login
node functions/migrate-to-eu.js --dry-run  # Önizleme
node functions/migrate-to-eu.js            # Çalıştır
```

## Architecture

### Stack
- **Frontend:** React 19 + Vite, React Router v7, Framer Motion, Lucide icons, Recharts
- **Backend:** Firebase Cloud Functions v1 (Node 22, ES modules), Genkit + Gemini 2.5 Flash Lite for AI
- **Database:** Firestore multi-region — `bayfatura-eu` (eur3 Frankfurt, AB kullanıcıları) + `(default)` (nam5 ABD, global)
- **Auth:** Firebase Auth — Email/Password, Google (popup → redirect fallback), Microsoft, Anonymous demo
- **Payments:** Stripe (server-side webhook in `functions/index.js`, no secret keys in frontend)
- **Email:** Resend via Cloud Function (never called directly from browser)
- **Native:** Capacitor 8 with Swift Package Manager (no CocoaPods); appId `com.bayfatura.app`

### Multi-environment
- `VITE_APP_ENV` controls environment. Two Firebase projects: production (`bayfatura-b283c`) and staging.
- `vite.config.js` inlines env vars only in `preview` mode; production reads from hosting environment.
- Auth domain resolution in `src/lib/firebase.js → resolveFirebaseAuthDomain()` handles Safari/WebKit cookie restrictions.
- **App Check:** `VITE_FIREBASE_APP_CHECK_KEY` gerekli. Dev'de kasıtlı kapalı (HMR bozulmasın). Staging için `.env.preview`'e Firebase Console'dan reCAPTCHA v3 key ekle. Public SEO landing route'larında App Check bilerek başlatılmaz; bu sayfalar indexlenebilir public içeriktir.

### Multi-region Firestore
- **EU kullanıcılar** (DE, AT, CH, FR, ES, PT, NL, BE, IT vb.) → `bayfatura-eu` DB (eur3, Frankfurt) — GDPR Art. 46
- **Global kullanıcılar** → `(default)` DB (nam5, ABD)
- Rota belirleme: kayıt sırasında `users/{uid}._db` alanına yazılır; sonraki tüm okumalar bu değere göre yönlendirilir.
- `src/lib/firebase.js → getDb(dbId)` doğru instance'ı döndürür.
- `src/lib/firebase.js → getDbIdForCountry(country)` → `'bayfatura-eu'` veya `'(default)'`
- `InvoiceContext` her işlemde `getDb(currentUser._db)` kullanır.
- EU routing pointer: global DB'de `_routingOnly: true` ile sadece `_db` alanı tutulur.

### Plan system
Plans: `standard` (free) | `elite` | `premium`. No `lifetime` plan.

`users/{uid}` fields that control access:
```
plan: 'standard' | 'elite' | 'premium'
subscriptionType: 'subscription' | 'granted' | null
planGrantedBy, planGrantReason, planActivatedAt, planExpiresAt
_db: 'bayfatura-eu' | '(default)'   ← DB routing
```

- `isPro` in `AuthContext` = `['premium', 'elite'].includes(plan)`
- **Free limit:** 5 invoices+quotes/month — enforced by `checkInvoiceLimit` Cloud Function
- **Elite AI limit:** 50 calls/day — enforced inside `requireElitePlan()` in functions
- **Granted plans with expiry:** `checkGrantedPlanExpiry` scheduled nightly 00:00 Berlin
- Admin grant via DCC: calls `grantElitePlan` (only `omidbayenderi@gmail.com` + `support@bayfatura.com`)

### Cloud Functions (`functions/index.js`)
Single file, ES module exports. ~2550 satır. Key functions:

**Ödeme & Plan:**
- `stripeWebhook` — HTTP, Stripe imza doğrulama, `users/{uid}.plan` güncelleme
- `syncUserPlan` — callable, checkout sonrası plan sync
- `createPortalSession` — callable, Stripe Customer Portal URL üretir (AGB §5 iptal hakkı)
- `checkInvoiceLimit` — callable, free plan aylık limit
- `grantElitePlan` — callable, admin-only Elite grant

**Zamanlanmış:**
- `checkGrantedPlanExpiry` — nightly 00:00, süreli planları düşürür
- `processRecurringTemplates` — nightly 02:00
- `checkOverdueInvoices` — daily 09:00
- `seoAgent` — nightly 03:00, SEO içerik üretimi (bkz. SEO Agent bölümü)

**AI (Elite only):**
- `analyzeBankStatement`, `scanReceipt`, `analyzeFinancials` — Genkit/Gemini

**Email:**
- `sendInvoiceEmail`, `sendInvitationEmail` — Resend

**Auth triggers:**
- `onUserCreated` — Firestore provision
- `onUserDeleted` — **cascade delete**: invoices, quotes, expenses, customers, products, customizations, subcollections hepsi silinir (GDPR Art. 17)

**SEO:**
- `seoAgent` — pubsub nightly 03:00, 6 ülke için içerik + programmatik sayfa üretimi
- `triggerSeoAgent` — callable, admin-only manuel tetikleme
- SEO/Gemini model default: `gemini-2.5-flash-lite`. `gemini-1.5-flash` kullanma; mevcut API'da 404 dönebilir.

Rate limiting: Firestore `rate_limits/{uid}_{scope}` sliding window.

### Frontend data flow
- `AuthContext` — auth state, `currentUser`, `isPro`. `syncFirebaseUser` tek kaynak. Kayıtta ülkeye göre `_db` atar.
- `InvoiceContext` — CRUD. `getDb(currentUser._db)` ile doğru DB'ye yazar.
- `LanguageContext` — i18n. 6 dil: TR, EN, DE, FR, ES, PT. `src/translations/`.
- `PanelContext` — toast, global UI.

### Mobile shell / bottom navigation
- `src/components/MobileBottomNav.jsx` renders the mobile bottom bar and opens the mobile drawer via `onOpenMenu`.
- The active nav item is route-derived, not driven by click state: dashboard → home, archive/invoice/quotes → invoices, `/new` → new invoice, `/expenses` → expenses. The "More/Daha Fazla" button stays plain and only opens the drawer.
- The active notch position is measured from the real DOM item center and passed as CSS variable `--notch-x`; avoid replacing this with hard-coded percentages.
- `src/index.css` `.mobile-bottom-nav::before` is the dark nav surface (`rgb(26, 36, 54)`) and uses a radial mask to cut around the lifted 52px active icon button with about `1.5px` visual gap.
- Each bottom-nav item defines its own `--nav-accent` / `--nav-accent-rgb` token via `nth-child` so active/passive icon colors match the item role.
- Mobile drawer/sidebar must remain completely hidden unless "Daha Fazla" is tapped. In the `max-width: 1024px` sidebar rules, the closed state uses off-screen `transform`, `opacity: 0`, `visibility: hidden`, and `pointer-events: none`; keep these together to prevent a visible/tappable sidebar edge.

### PWA install icons / splash
- The app install icon background is intentionally `#1A2436` (`rgb(26, 36, 54)`). `public/apple-touch-icon.png` is the iOS Safari "Add to Home Screen" source; keep it opaque/dark so the preview does not show a white logo tile.
- `public/logo-192.png`, `public/logo-512.png`, `public/app-icon-1024.png`, `public/play-store-icon-512.png`, and `public/favicon.png` are flattened install assets. Do not change `public/logo.png` just to alter PWA/install appearance because it is also used as an in-app brand asset.

### Profile avatar upload
- `src/pages/settings/ProfileSettings.jsx` must not store avatar images as Firestore Base64 strings. Mobile camera photos can exceed document limits and behave inconsistently across Safari/WebView.
- Avatar changes should normalize the selected file to a small JPEG (currently 512px max dimension), upload it through `uploadToStorage(currentUser.uid, file, filename)`, then persist only the Firebase Storage download URL in `users/{uid}.avatar`.
- Storage rules allow owner-only `users/{uid}/assets/{filename}` uploads for PNG/JPEG/WebP under 5MB. If mobile avatar display fails, check Storage permission/image load errors before changing Firestore profile logic.

### Firestore collections
```
invoices, quotes, expenses, recurring_templates  → userId ile scope'lu
users/{uid}                                       → profil + plan + _db
customizations/{uid}                              → fatura tasarım ayarları
rate_limits/{uid}_{scope}                         → AI/email sliding window
audit_logs                                        → admin işlem geçmişi
agent_logs                                        → email agent logları
users/{uid}/notifications                         → in-app bildirimler
users/{uid}/team                                  → ekip davetleri

# SEO Agent koleksiyonları
seo_content_queue/{id}     → üretilmiş içerik taslakları (blog, programmatik sayfa, keyword gap)
seo_rankings/{id}          → keyword pozisyon takibi (GSC entegrasyonu hazır)
seo_opportunities/{id}     → backlink fırsatları (Capterra, G2, ProductHunt vb.)
seo_reports/{id}           → haftalık SEO çalışma raporları
seo_tasks/{id}             → technical audit durumu
```

### SEO Agent
**Amaç:** BayFatura'yı hedef ülkelerde Google'da üst sıralara taşımak.

**Hedef ülkeler (öncelik sırasıyla):** DE → AT → PT → ES → FR → EN (Global)

**Keyword haritası:** `functions/index.js → SEO_KEYWORD_MAP` — her ülke için primary + longTail keywords, competitors, programmaticTemplates

**Programmatik SEO URL'leri:**
```
/:lang/rechnung-erstellen/:slug   (DE)
/:lang/criar-fatura/:slug         (PT)
/:lang/crear-factura/:slug        (ES)
/:lang/creer-facture/:slug        (FR)
/:lang/invoice-template/:slug     (EN)
```
İçerik Firestore `seo_content_queue`'dan çekilir. `src/pages/seo/SeoLandingPage.jsx`

Public SEO Firestore kuralı yalnızca `seo_content_queue` dokümanlarında `type == 'programmatic_page'` ve `status in ['ready_to_publish', 'published']` için read izni verir. Blog taslakları, keyword gap, rankings, opportunities, reports ve tasks super-admin kapsamındadır.

**Modüller:**
1. Content Intelligence — keyword gap + blog taslağı (Gemini, her gece)
2. Programmatic Page Generator — landing page içeriği (Pzt + Perş)
3. Rank Tracker — keyword pozisyon kaydı (her gece, GSC API hazır)
4. Backlink Scout — dizin/review sitesi fırsatları (Pazartesi)
5. Technical Audit — sitemap, hreflang, schema kontrol (Pazartesi)

**DCC'den yönetim:** `/dcc-portal` → SEO Agent paneli → ülke + modül seç → Manuel Çalıştır

**Sitemap:** `public/sitemap.xml` — hreflang ile tüm programmatik sayfalar dahil
**Robots:** `public/robots.txt` — app route'ları noindex, SEO sayfaları allow

**Rendering guardrails:**
- Gemini cevabı Markdown code fence veya JSON string olarak gelebilir; `functions/index.js` ve `SeoLandingPage.jsx` normalization helper'ları korunmalı.
- Kullanıcıya raw JSON/code fence gösterme. SEO landing UI hero, lead, feature, CTA, FAQ ve related link düzenini korumalı.
- Sitemap XML'in tarayıcıda düz metin/XML olarak görünmesi normaldir.
- Public SEO sayfalarında reCAPTCHA/App Check tetiklenmemeli; aksi halde console'da `recaptcha/api2/pat 401` ve Firestore listen access-control gürültüsü oluşabilir.

### Native / Capacitor
- Platform detection: `src/lib/platform.js → isNativePlatform()`
- Native Google auth: `src/lib/nativeAuth.js`
- iOS PWA install: `src/components/AppInstallPrompt.jsx` — iOS Safari'de bottom sheet + 3 adımlı rehber
- Android: `minSdkVersion=28`, `targetSdkVersion=36`
- Keystore: `android/bayfatura-release.keystore`
- iOS: Swift Package Manager (`ios/App/CapApp-SPM`), no Podfile

### Compliance & Legal
- **Germany:** §19 UStG Kleinunternehmer toggle, Reverse Charge, XRechnung B2G XML
- **Portugal:** ATCUD, QR Code AT, NIF validation, UBL 2.1/CIUS-PT B2G XML. **Uyarı:** AT sertifikalı yazılım değil — dashboard'da PT kullanıcıya bildirim gösterilir.
- **GDPR:** Cascade delete (Art. 17), cookie tercih UI (Art. 7(3)), self-hosted fonts (ePrivacy), multi-region DB
- **Privacy Policy:** `/privacy` — global model + bölgesel ekler (LGPD, KVKK, CCPA, UK GDPR, Australia)
- **Stripe Customer Portal:** `/billing` → aktif abonelik varsa "Abonnement verwalten/kündigen" butonu görünür
- Invoice language (`invoiceLanguage`) is separate from app language (`appLanguage`)

### Key conventions
- All Cloud Functions in `functions/index.js` (ES modules, named exports), ~2550 lines
- `PLANS` constant = single source of truth for limits
- Super-admin: `['support@bayfatura.com', 'omidbayenderi@gmail.com']`
- `firestore.indexes.json` — composite indexes (userId + isDeleted + createdAt)
- Fonts: self-hosted in `public/fonts/` (Inter + Outfit woff2) — Google Fonts kaldırıldı
- Hosting `Content-Security-Policy-Report-Only` header'ı kaldırıldı. Yeni CSP eklenecekse report endpoint/`report-to` stratejisiyle birlikte tasarlanmalı.
- `overflow-x: clip` on `.content-wrapper` (hidden yerine) — child table scroll'ların çalışması için
- Tables: her `<table className="modern-table">` → `<div className="table-scroll">` ile sarılmalı
- `items-editor-table`: 480px'te CSS grid stacked layout (no JS needed)

## Testing

Test framework: Vitest. 17 test dosyası, 98 test.

```bash
npm test                    # Tüm testler
npx vitest run src/__tests__/deleteAccount.test.js  # Tek dosya
```

Test dosyaları: `src/__tests__/`. Conventions: `describe/it`, `vi.fn()` mock, `expect` assertions.

Test coverage beklentileri:
- Yeni fonksiyonlar yazılırken test ekle
- Bug fix'lerde regression test ekle
- `deleteAccount` ve Firestore rules değişikliklerinde ilgili testleri güncelle

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
