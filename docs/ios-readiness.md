# iOS Readiness & Auth Setup — BayFatura

> iOS Capacitor setup, Apple/Firebase auth readiness, and TestFlight preparation.

## Current Status

| Item | Status |
|------|--------|
| CocoaPods | ✅ Installed |
| `npx cap sync ios` | ✅ Completed |
| Xcode project | ✅ `ios/App/App.xcodeproj` exists |
| Development team | ✅ `5LU83P6F5P` configured locally |
| Code signing | ✅ Automatic locally |
| `CFBundleURLSchemes` | ✅ Google OAuth redirect scheme configured |
| AppDelegate URL handling | ✅ `application(_:open:options:)` implemented |
| `GoogleService-Info.plist` | ✅ Present locally, points to staging Firebase |
| Sign in with Apple entitlement | ❌ Not configured |
| APNs / Push Notifications capability | ❌ Not configured |
| Real iPhone test | ❌ Not yet run |
| TestFlight upload | ❌ Not yet run |

## Google Sign-In

BayFatura auth katmani web ve native ortamlari ayirir. iOS shell icinde hedef, `@capacitor-firebase/authentication` ile native Google/Apple oturum penceresini kullanmak ve sonucu Firebase Web SDK `signInWithCredential` tarafina aktarmaktir.

Gerekli kontroller:

| Gereksinim | Durum |
|------------|-------|
| `REVERSED_CLIENT_ID` URL scheme | ✅ Info.plist'te tanimli |
| AppDelegate URL handler | ✅ Mevcut |
| `GoogleService-Info.plist` | ✅ Mevcut |
| Firebase Console iOS app config | ❓ Kontrol edilmeli |
| Gercek iPhone test | ❓ Bekliyor |

Firebase Console → Staging projesi → Authentication → Settings → Authorized domains:

- [ ] `localhost`
- [ ] `bayfatura-staging.firebaseapp.com`
- [ ] `bayfatura.com` production auth domain

Firebase Console → Authentication → Sign-in providers → Google:

- [ ] Google provider enabled
- [ ] Project support email girilmis

Firebase Console → Project settings → iOS app:

- [ ] Bundle ID `com.bayfatura.app` dogru
- [ ] `GoogleService-Info.plist` staging/prod hedefiyle tutarli

## Apple Sign-In

Apple tarafinda kod kontrollu hata mesaji verecek sekilde hazirdir, fakat provider/capability ayarlari tamamlanmadan aktif kabul edilmemelidir.

Detayli staging ve production kurulum adimlari: `docs/apple-sign-in-setup.md`.

Gerekenler:

- [ ] Apple Developer Program uyeligi aktif
- [ ] App Identifier `com.bayfatura.app` olusturulmus veya dogrulanmis
- [ ] Sign in with Apple capability etkin
- [ ] Service ID olusturulmus
- [ ] Return URL: `https://bayfatura-staging.firebaseapp.com/__/auth/handler`
- [ ] Firebase Console Apple provider enabled
- [ ] Firebase Console Apple provider icinde Service ID, Team ID, Key ID ve private key girilmis
- [ ] Xcode Signing & Capabilities icinde Sign in with Apple eklenmis
- [ ] Gercek iPhone smoke test tamamlanmis

## Push Notifications

Push notification kod tarafi Android icin kontrollu opt-in olarak baglandi. iOS beta icin asagidaki dis ayarlar gerekir:

- [ ] Apple Developer App Identifier icinde Push Notifications capability aktif
- [ ] APNs key veya certificate olusturulmus
- [ ] Firebase Console Cloud Messaging tarafina APNs bilgileri girilmis
- [ ] Xcode Signing & Capabilities icinde Push Notifications eklenmis
- [ ] Gercek iPhone uzerinde izin isteme/token kaydi test edilmis

## Local iOS Build

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Xcode'da:

- Hedef cihaz: Gercek iPhone
- Team: BayFatura Apple Developer team
- Bundle ID: `com.bayfatura.app`
- Build & Run: Cmd+R

## TestFlight Hazirlik Sirasi

1. Apple Developer Program uyeligini aktif et.
2. App Identifier `com.bayfatura.app` icin Sign in with Apple ve Push Notifications capability'lerini ac.
3. Firebase Console Apple provider'i staging callback ile etkinlestir.
4. Xcode Signing & Capabilities tarafinda Team, Bundle ID, Sign in with Apple ve Push Notifications ayarlarini dogrula.
5. `npx cap sync ios` sonrasi Xcode real-device debug build al.
6. GitHub secrets tarafinda iOS distribution certificate, App Store Connect API key ve `APPLE_TEAM_ID` degerlerini gir.
7. `ios-build.yml` workflow'unu manuel calistir ve TestFlight artifact yuklemesini dogrula.

## GitHub Secrets

| Secret | Amac |
|--------|------|
| `IOS_DISTRIBUTION_CERT_BASE64` | Apple Distribution `.p12` sertifikasi |
| `IOS_DISTRIBUTION_CERT_PASSWORD` | `.p12` sifresi |
| `APPSTORE_ISSUER_ID` | App Store Connect API issuer |
| `APPSTORE_KEY_ID` | App Store Connect API key id |
| `APPSTORE_PRIVATE_KEY` | App Store Connect `.p8` private key |
| `APPLE_TEAM_ID` | Apple Developer team id |

## Sık Karşılaşılan Hatalar

| Hata | Sebep | Cozum |
|------|-------|-------|
| `auth/admin-restricted-operation` | Firebase Auth provider enabled degil | Firebase Console → Authentication → Providers |
| Apple login disabled mesaji | Apple provider/capability eksik | Apple Developer + Firebase provider ayarlarini tamamla |
| Google login geri donmuyor | URL scheme veya plist uyumsuz | `GoogleService-Info.plist` ve URL scheme'i kontrol et |
| Uygulama acilir acilmaz cokuyor | Firebase config yanlis | Staging/prod plist dosyasini dogrula |
| TestFlight upload hata veriyor | Sertifika/provisioning/API key eksik | iOS GitHub secrets ve App Store Connect API key'i kontrol et |
