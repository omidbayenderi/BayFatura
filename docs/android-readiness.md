# BayFatura Android Readiness

Bu dokuman BayFatura Android surumunun beta ve release oncesi durumunu takip eder.

## Mimari Durum

- Android paket adi: `com.bayfatura.app`
- Capacitor app adi: `BayFatura`
- Web build cikisi: `dist`
- Capacitor native klasoru repo stratejisinde uretilen klasor olarak kabul ediliyor; `android/` git'e alinmiyor.
- Kalici Android ozel ayarlari `scripts/patch-android-capacitor.mjs` ile `npx cap sync android` sonrasinda uygulanir.
- CI workflow'u temiz checkout ortaminda `android/` yoksa `npx cap add android` calistirir, sonra sync ve patch adimlarini uygular.

## Son Lokal Dogrulama

24 Mayis 2026 tarihinde su kontroller tamamlandi:

- `npm run build` basarili.
- `npx cap sync android` basarili.
- `./gradlew assembleDebug` basarili.
- `./gradlew assembleRelease` unsigned release artifact olarak basarili.

Not: Lokal release signing icin gercek keystore sifreleri yoksa build unsigned uretilir. CI ortaminda GitHub secrets ile keystore ve signing bilgileri verilince AAB signed uretilmelidir.

## Uygulanan Android Patchleri

- Release signing guard eklendi:
  - `CHANGE_ME` placeholder degerleri signing olarak kabul edilmez.
  - Keystore dosyasi yoksa release build unsigned uretilir.
  - CI secrets dogruysa signed release build calisir.
- R8/ProGuard icin Facebook auth `dontwarn` kurallari eklendi:
  - Capacitor Firebase Auth plugini Facebook siniflarina referans verebiliyor.
  - BayFatura su anda Google ve Apple provider kullandigi icin bu siniflar release build'i bloklamamali.

## Codex Tarafinda Tamamlananlar

- Web build ve Android sync zinciri dogrulandi.
- Debug APK build dogrulandi.
- Release build R8 hatasi giderildi.
- Release signing placeholder degerlerinin build'i kirmamasi saglandi.
- GitHub Actions Android workflow'u native klasor stratejisine uyumlu hale getirildi.

## Omid Tarafindan Gerekli Dis Adimlar

- Firebase Console'da Android app icin SHA-1 ve SHA-256 fingerprint kayitlarini kontrol et.
- `google-services.json` dosyasinin Firebase Android app ile ayni package name'e sahip oldugunu dogrula.
- GitHub secrets tarafinda su degerlerin dolu oldugunu kontrol et:
  - `ANDROID_KEYSTORE_BASE64`
  - `ANDROID_KEYSTORE_PASSWORD`
  - `ANDROID_KEY_ALIAS`
  - `ANDROID_KEY_PASSWORD`
  - `ANDROID_GOOGLE_SERVICES_JSON`
  - `FIREBASE_ANDROID_APP_ID`
  - `FIREBASE_SERVICE_ACCOUNT`
- Android Studio'da emulator veya gercek cihaz ile uygulamayi ac.
- Gercek cihazda email/password ve Google login test et.
- Kamera izni ve fis tarama akislarini test et.
- PDF indirme/paylasma akisini test et.
- Push notification permission ve token kaydini test et.
- Firebase App Distribution veya Play Console internal testing grubunu hazirla.

## Beta Cikis Kriterleri

- Debug build gercek cihazda aciliyor.
- Google native login app'e geri donebiliyor.
- Onboarding, musteri, urun, fatura ve PDF akislari Android'de calisiyor.
- Kamera izni ve AI fis tarama akisi calisiyor.
- Push notification token'i kaydediliyor.
- CI signed AAB uretiyor.
- Internal testing build'i Firebase App Distribution veya Play Console'a yukleniyor.

