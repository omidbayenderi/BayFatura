# BayFatura Platform Readiness Plan

Bu plan BayFatura'nin Web App, Android ve iOS surumlerini staging'den production'a profesyonel ve kontrollu sekilde tasimak icin hazirlandi.

## Durum Ozeti

| Platform | Durum | Ana Risk |
|----------|-------|----------|
| Web App | Staging stabilizasyonunda, CI/build/test geciyor | Sosyal login, Resend domain, observability ve production reconciliation |
| Android | Native proje hazir, Firebase/Capacitor baglantilari mevcut | Gercek cihaz, signed release, Play Console ve push/auth testleri |
| iOS | Native proje hazir, SPM/Firebase baglantilari mevcut | Gercek cihaz, Apple Sign In entitlement, TestFlight ve App Store ayarlari |

## Son Otomatik Dogrulama

23 Mayis 2026 tarihinde lokal ortamda su kontroller tamamlandi:

- `npm run check:release` gecti.
- `node --check functions/index.js` gecti.
- `npm run test:rules` gecti.
- `npx cap sync android` gecti.
- `npx cap sync ios` gecti.

Not: `npm run test:rules` ilk denemede sandbox ag kisiti nedeniyle `firebase-tools` paketini indiremedi; ag izniyle tekrar calistirildi ve Firestore emulator testleri basarili tamamlandi.

## Son Manuel Bulgular

- Google ile web girisi staging preview uzerinde basarili test edildi.
- Apple/iCloud girisi `auth/operation-not-allowed` hatasi veriyor. Bu, Firebase Authentication tarafinda Apple provider'in henuz etkin olmadigini veya Apple provider ayarlarinin tamamlanmadigini gosterir.
- Apple staging callback URL: `https://bayfatura-staging.firebaseapp.com/__/auth/handler`. Kurulum rehberi: `docs/apple-sign-in-setup.md`.
- Chrome console'daki `Cross-Origin-Opener-Policy policy would block the window.closed/window.close call` uyarilari popup tabanli OAuth akislarinda gorulebilir; hosting header'i `same-origin-allow-popups` olacak sekilde duzenlenmelidir.
- Resend domain dogrulamasi henuz yapilmadi. Ucretsiz/test modunda Resend sadece sinirli alicilara mail gonderir; genel ekip daveti icin dogrulanmis domain ve bu domaine ait `from` adresi gerekir.

## Faz 1: Web Staging Stabilizasyonu

### Codex tarafindan yapilacaklar

- [x] `preview-test-staging` uzerinde kucuk PR akisini koru.
- [ ] Web kritik akislari icin test kapsamindaki bosluklari tespit et.
- [ ] Sosyal login, onboarding, billing, team invite ve PDF akislari icin regresyon testleri ekle.
- [ ] Firebase Auth redirect/popup davranisini staging ve production domain ayrimina gore dokumante et.
- [ ] Sentry/observability entegrasyonu icin environment ve hata yakalama planini hazirla.
- [ ] Resend domain dogrulamasi sonrasi `from` adresi mimarisini kesinlestir.

### Omid tarafindan yapilacaklar

- [x] En guncel PR preview linkinde Chrome ve Safari ile Google login test et.
- [ ] Resend'de domain dogrulamasini tamamla.
- [ ] Firebase Console'da staging ve production authorized domains listesini kontrol et.
- [ ] Firebase Console'da Apple provider'i etkinlestir ve Apple Developer ayarlarini tamamla.
- [ ] Stripe/PayPal test hesaplariyla odeme akisini manuel test et.

### Cikis kriterleri

- [ ] Email/password login calisiyor.
- [x] Google login Chrome ve Safari'de calisiyor veya net Firebase config hatasi gorunuyor.
- [ ] Apple/iCloud login Firebase provider etkinlestirildikten sonra calisiyor.
- [ ] Onboarding tamamlanabiliyor.
- [ ] Musteri, urun, fatura ve PDF akislari calisiyor.
- [ ] Team invite email'i dogrulanmis domain ile hedef adrese ulasiyor.
- [ ] Console'da yeni kritik hata yok.

## Faz 2: Firebase ve Backend Sertlestirme

### Codex tarafindan yapilacaklar

- [x] `npm run test:rules` ile Firestore rules emulator suite'i dogrula.
- [x] Functions syntax ve callable akislari icin `node --check functions/index.js` calistir.
- [ ] Functions dependency audit risklerini ayri bir hardening listesine ayir.
- [ ] `sendInvitationEmail`, `sendInvoiceEmail`, `syncUserPlan`, `scanReceipt`, `analyzeFinancials` icin loglama ve hata mesajlarini gozden gecir.
- [ ] Production secrets ve staging secrets ayrimini dokumanda guncelle.

### Omid tarafindan yapilacaklar

- [ ] Firebase Console yetkileriyle staging functions/rules deploy workflow'larini manuel calistirabilir oldugunu teyit et.
- [ ] Production servis hesabi ve GitHub protected environment onaylarini kontrol et.
- [ ] Resend, Stripe ve Firebase billing durumunu hesap panellerinden dogrula.

### Cikis kriterleri

- [ ] Rules testleri geciyor.
- [ ] Functions syntax check geciyor.
- [ ] Staging deploy workflow'lari production secret kullanmadan calisiyor.
- [ ] Backend kaynakli hatalar kullaniciya anlasilir mesajlarla donuyor.

## Faz 3: Android Beta Hazirligi

### Codex tarafindan yapilacaklar

- [x] `npm run build` ve `npx cap sync android` akisini dogrula.
- [ ] Android manifest, permissions, Firebase config ve release signing mimarisini gozden gecir.
- [ ] Play Store internal testing icin release checklist hazirla.
- [ ] Android smoke test matrisi hazirla: login, camera, PDF, push, invoice, team invite.
- [ ] Native feature flag davranisini kontrol et.

### Omid tarafindan yapilacaklar

- [ ] Android Studio'da gercek cihaz veya emulator ile app'i ac.
- [ ] Google login'i gercek cihazda test et.
- [ ] Kamera ile fis tarama iznini ve AI scan akisini test et.
- [ ] Push notification permission ve token kaydini test et.
- [ ] Play Console veya Firebase App Distribution hesabini hazirla.
- [ ] Release keystore bilgilerini yerel/CI secret olarak guvenli tut.

### Cikis kriterleri

- [ ] Debug build gercek cihazda aciliyor.
- [ ] Email/password ve Google native login calisiyor.
- [ ] Kamera izinleri dogru isliyor.
- [ ] PDF/download/share akisi kullanilabilir.
- [ ] Internal testing icin signed APK/AAB uretilebiliyor.

## Faz 4: iOS Beta Hazirligi

### Codex tarafindan yapilacaklar

- [x] `npm run build` ve `npx cap sync ios` akisini dogrula.
- [ ] iOS Info.plist, URL schemes, SPM paketleri ve Firebase config mimarisini gozden gecir.
- [ ] TestFlight checklist hazirla.
- [ ] iOS smoke test matrisi hazirla: login, Apple Sign In, camera, PDF/share, push.
- [ ] Apple Sign In entitlement ve Firebase Apple provider gereksinimlerini dokumante et.

### Omid tarafindan yapilacaklar

- [ ] Apple Developer Program uyeligini aktif et.
- [ ] Xcode'da Team, Bundle ID ve Signing ayarlarini kontrol et.
- [ ] Sign in with Apple capability ekle.
- [ ] Gercek iPhone'da Google ve Apple login test et.
- [ ] Push Notifications capability ve APNs ayarlarini kontrol et.
- [ ] App Store Connect'te app kaydini ve TestFlight internal testing'i hazirla.

### Cikis kriterleri

- [ ] Xcode real device build calisiyor.
- [ ] Google login app'e geri donebiliyor.
- [ ] Apple Sign In entitlement ve Firebase provider aktif.
- [ ] Kamera, PDF/share ve push temel akislari test edildi.
- [ ] TestFlight'a build yuklenebilir durumda.

## Faz 5: Production Reconciliation ve Release

### Codex tarafindan yapilacaklar

- [ ] `preview-test-staging` ile `main` farkini kucuk PR'lara bol.
- [ ] Production release checklist'i guncelle.
- [ ] Production deploy oncesi `npm run check:release`, `npm run test:rules`, `node --check functions/index.js` gate'lerini calistir.
- [ ] Rollback ve post-deploy smoke test dokumanlarini guncelle.

### Omid tarafindan yapilacaklar

- [ ] GitHub production environment required reviewers ayarlarini yap.
- [ ] Production deploy workflow'unu manuel calistirmadan once onay ver.
- [ ] Production sonrasi gercek hesapla login, fatura, PDF, email ve odeme smoke testlerini yap.

### Cikis kriterleri

- [ ] `main` bilincli sekilde guncel mimariye yaklasti.
- [ ] Production deploy sadece manuel onayla calisti.
- [ ] Post-deploy kritik akislarda hata yok.
- [ ] Rollback plani uygulanabilir ve dokumante.
