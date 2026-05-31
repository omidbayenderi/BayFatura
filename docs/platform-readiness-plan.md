# BayFatura Platform Readiness Plan

Bu plan BayFatura'nin Web App, Android ve iOS surumlerini staging'den production'a profesyonel ve kontrollu sekilde tasimak icin hazirlandi.

## Durum Ozeti

| Platform | Durum | Ana Risk |
|----------|-------|----------|
| Web App | Staging stabilizasyonunda, temel akislari calisiyor | Resend domain, Microsoft provider canli test, observability ve production reconciliation |
| Android | Debug emulator, native Google login, kamera/push kod baglantilari ve mobile shell polish dogrulandi | Gercek cihaz, signed CI release, Play Console ve push/auth smoke testleri |
| iOS | Native proje hazir, SPM/Firebase baglantilari mevcut | Gercek cihaz, Apple Sign In entitlement, TestFlight ve App Store ayarlari |

## Son Otomatik Dogrulama

23-25 Mayis 2026 tarihinde lokal ortamda su kontroller tamamlandi:

- `npm run check:release` gecti.
- `node --check functions/index.js` gecti.
- `npm run test:rules` gecti.
- `npx cap sync android` gecti.
- `npx cap sync ios` gecti.
- `./gradlew assembleDebug` Android icin gecti.
- `./gradlew assembleRelease` Android icin unsigned artifact olarak gecti.
- Android emulator uzerinde Google native login calisti.
- Android alt navigasyon ve acilir menu native app hissi icin yuvarlatildi.
- Firestore WebView realtime listen uyumu icin `experimentalAutoDetectLongPolling` aktif edildi.

Not: `npm run test:rules` ilk denemede sandbox ag kisiti nedeniyle `firebase-tools` paketini indiremedi; ag izniyle tekrar calistirildi ve Firestore emulator testleri basarili tamamlandi.

## Son Manuel Bulgular

- Google ile web girisi staging preview uzerinde basarili test edildi.
- Android emulator uzerinde Google login basarili test edildi.
- iCloud/Apple girisi lansman blokajindan cikarildi; web login ekraninda Apple yerine Microsoft provider kullanilacak.
- Microsoft staging callback URL: `https://bayfatura-staging.firebaseapp.com/__/auth/handler`.
- Microsoft/Entra App Registration ve Firebase Microsoft provider ayarlari tamamlandiktan sonra staging uzerinde Microsoft login smoke test edilecek.
- Chrome console'daki `Cross-Origin-Opener-Policy policy would block the window.closed/window.close call` uyarilari popup tabanli OAuth akislarinda gorulebilir; hosting header'i `same-origin-allow-popups` olacak sekilde duzenlenmelidir.
- Resend domain dogrulamasi henuz yapilmadi. Ucretsiz/test modunda Resend sadece sinirli alicilara mail gonderir; genel ekip daveti icin dogrulanmis domain ve bu domaine ait `from` adresi gerekir.
- Firestore `Listen/channel` access-control hatasi tek basina kritik kabul edilmedi; veri akisi calistigi surece gürültü seviyesindedir. WebView uyumlulugu icin long-polling auto-detect etkinlestirildi.

## Faz 1: Web Staging Stabilizasyonu

### Codex tarafindan yapilacaklar

- [x] `preview-test-staging` uzerinde kucuk PR akisini koru.
- [x] Web kritik akislari icin test kapsamindaki bosluklari tespit et.
- [ ] Sosyal login, onboarding, billing, team invite ve PDF akislari icin regresyon testleri ekle.
- [ ] Firebase Auth redirect/popup davranisini staging ve production domain ayrimina gore dokumante et.
- [x] Sentry/observability entegrasyonu icin environment ve hata yakalama planini hazirla.
- [x] Resend domain dogrulamasi sonrasi `from` adresi mimarisini kesinlestir.

### Omid tarafindan yapilacaklar

- [x] En guncel PR preview linkinde Chrome ve Safari ile Google login test et.
- [ ] Resend'de domain dogrulamasini tamamla.
- [ ] Firebase Console'da staging ve production authorized domains listesini kontrol et.
- [ ] Firebase Console'da Microsoft provider'i etkinlestir ve Azure/Entra Client ID + Client Secret degerlerini ekle.
- [ ] Stripe/PayPal test hesaplariyla odeme akisini manuel test et.

### Cikis kriterleri

- [ ] Email/password login calisiyor.
- [x] Google login Chrome ve Safari'de calisiyor veya net Firebase config hatasi gorunuyor.
- [ ] Microsoft login Firebase provider etkinlestirildikten sonra calisiyor.
- [x] Onboarding tamamlanabiliyor.
- [x] Musteri, urun, fatura ve PDF akislari calisiyor.
- [ ] Team invite email'i dogrulanmis domain ile hedef adrese ulasiyor.
- [ ] Console'da yeni kritik hata yok.

## Faz 2: Firebase ve Backend Sertlestirme

### Codex tarafindan yapilacaklar

- [x] `npm run test:rules` ile Firestore rules emulator suite'i dogrula.
- [x] Functions syntax ve callable akislari icin `node --check functions/index.js` calistir.
- [x] Functions dependency audit risklerini ayri bir hardening listesine ayir: `docs/functions-dependency-hardening.md`.
- [ ] `sendInvitationEmail`, `sendInvoiceEmail`, `syncUserPlan`, `scanReceipt`, `analyzeFinancials` icin loglama ve hata mesajlarini gozden gecir.
- [x] Production secrets ve staging secrets ayrimini dokumanda guncelle.

### Omid tarafindan yapilacaklar

- [ ] Firebase Console yetkileriyle staging functions/rules deploy workflow'larini manuel calistirabilir oldugunu teyit et.
- [ ] Production servis hesabi ve GitHub protected environment onaylarini kontrol et.
- [ ] Resend, Stripe ve Firebase billing durumunu hesap panellerinden dogrula.

### Cikis kriterleri

- [x] Rules testleri geciyor.
- [x] Functions syntax check geciyor.
- [ ] Staging deploy workflow'lari production secret kullanmadan calisiyor.
- [ ] Backend kaynakli hatalar kullaniciya anlasilir mesajlarla donuyor.

## Faz 3: Android Beta Hazirligi

### Codex tarafindan yapilacaklar

- [x] `npm run build` ve `npx cap sync android` akisini dogrula.
- [x] Android manifest, permissions, Firebase config ve release signing mimarisini gozden gecir.
- [x] Release build icin R8/ProGuard ve signing placeholder problemlerini duzelt.
- [x] Native klasorlerin git'e alinmadigi mimariye uygun post-sync Android patch scripti ekle.
- [x] Play Store internal testing icin release checklist hazirla: `docs/android-readiness.md`.
- [x] Android smoke test matrisi hazirla: `docs/android-smoke-test.md`.
- [x] Android Studio/adb cihaz runbook'u hazirla: `docs/android-device-runbook.md`.
- [x] Native kamera davranisini web fallback'i bozmadan Android shell'e bagla.
- [x] Native push notification davranisini kontrollu opt-in mimarisiyle bagla.
- [x] Android emulator Google login sorununu cozumle ve klasik Google hesap secici akisina stabilize et.
- [x] Android mobile shell alt nav/drawer UI polish uygula.

### Omid tarafindan yapilacaklar

- [x] Android Studio'da emulator ile app'i ac.
- [ ] Android Studio'da gercek cihaz ile app'i ac.
- [ ] Google login'i gercek cihazda test et.
- [ ] Kamera ile fis tarama iznini ve AI scan akisini test et.
- [ ] Push notification permission ve token kaydini test et.
- [ ] Play Console veya Firebase App Distribution hesabini hazirla.
- [ ] Release keystore bilgilerini yerel/CI secret olarak guvenli tut.

### Cikis kriterleri

- [x] Debug build lokal olarak uretiliyor.
- [x] Debug build emulator uzerinde aciliyor.
- [x] Google native login emulator uzerinde calisiyor.
- [ ] Debug build gercek cihazda aciliyor.
- [ ] Email/password ve Google native login gercek cihazda calisiyor.
- [ ] Kamera izinleri dogru isliyor.
- [ ] PDF/download/share akisi kullanilabilir.
- [x] Lokal unsigned release artifact uretiliyor.
- [ ] Internal testing icin CI signed APK/AAB uretilebiliyor.

## Faz 4: iOS Beta Hazirligi

### Codex tarafindan yapilacaklar

- [x] `npm run build` ve `npx cap sync ios` akisini dogrula.
- [x] iOS Info.plist, URL schemes, SPM paketleri ve Firebase config mimarisini gozden gecir.
- [x] TestFlight checklist hazirla.
- [x] iOS smoke test matrisi hazirla: `docs/ios-smoke-test.md`.
- [x] Apple Sign In entitlement ve Firebase Apple provider gereksinimlerini dokumante et.

### Omid tarafindan yapilacaklar

- [ ] Apple Developer Program uyeligini aktif et.
- [ ] Xcode'da Team, Bundle ID ve Signing ayarlarini kontrol et.
- [ ] Sign in with Apple capability ekle.
- [ ] Gercek iPhone'da Google ve Microsoft login test et.
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
