# iOS Readiness & Auth Setup — BayFatura

> iOS Capacitor setup after CocoaPods installation and platform sync.

## Current Status

| Item | Status |
|------|--------|
| CocoaPods | ✅ Installed |
| `npx cap sync ios` | ✅ Completed |
| Xcode project | ✅ `ios/App/App.xcodeproj` exists |
| Development team | ✅ `5LU83P6F5P` configured |
| Code signing | ✅ Automatic |
| `CFBundleURLSchemes` | ✅ Google OAuth redirect scheme configured |
| AppDelegate URL handling | ✅ `application(_:open:options:)` implemented |
| `GoogleService-Info.plist` | ✅ Present (pointing to **staging** Firebase) |
| Sign in with Apple entitlement | ❌ Not configured |
| Real device test | ❌ Not yet run |

## Google Sign-In Neden Çalışmıyor?

Uygulamanız Firebase Web SDK (`signInWithRedirect`) kullanıyor. iOS'ta bu akış şöyle çalışır:

```
1. Kullanıcı "Google ile giriş yap" butonuna tıklar
2. Firebase Web SDK Safari'yi açar (popup değil, çünkü isNative=true)
3. Kullanıcı Google hesabına giriş yapar
4. Google, uygulamanın custom URL scheme'ine yönlendirir:
   com.googleusercontent.apps.45718250387-...://callback
5. iOS, bu scheme'i tanır ve uygulamayı açar
6. AppDelegate.urlHandler event'i işler
7. Firebase SDK, getRedirectResult() ile sonucu yakalar
```

**Bunun için gerekenler:**

| Gereksinim | Durum |
|------------|-------|
| `REVERSED_CLIENT_ID` URL scheme | ✅ Info.plist'te tanımlı |
| AppDelegate URL handler | ✅ Mevcut |
| GoogleService-Info.plist | ✅ Mevcut (staging projesi) |
| Firebase Console'da Authorized redirect URI | ❓ Kontrol edilmeli |
| Gerçek cihazda test (simulator çalışmaz) | ❓ |

### Firebase Console'da Kontrol Edilmesi Gerekenler:

Firebase Console → Staging projesi → Authentication → Settings → Authorized domains:

- [ ] `localhost` — ✅ otomatik eklenir
- [ ] `bayfatura-staging.firebaseapp.com` — ✅ otomatik
- [ ] `bayfatura-b283c.firebaseapp.com` — varsa kalabilir
- [ ] Custom scheme `com.googleusercontent.apps.45718250387-fpm823scpaclvo05mb0j8d5602e5prkq`

Firebase Console → Authentication → Sign-in providers → Google:
- [ ] Google provider **ENABLED** mi?
- [ ] Proje support email girilmiş mi?

**Önemli:** iOS simulator'de `signInWithRedirect` çalışmaz. Gerçek cihazda test edin.

## Apple (Sign in with Apple) Neden Çalışmıyor?

Aynı mekanizma (`signInWithRedirect`) Apple için de geçerli. Firebase Web SDK, OAuth 2.0 flow'u Safari'de açar.

Detayli staging ve production kurulum adimlari icin: `docs/apple-sign-in-setup.md`.

İhtiyaç duyulanlar:

- [ ] **Apple Developer üyeliği** ($99/yıl) — gerekli
- [ ] **Sign in with Apple capability** Xcode'da enabled
- [ ] **Service ID** Apple Developer Portal'da oluşturulmuş
- [ ] **Return URL** Firebase Console'da doğru yapılandırılmış

### Sign in with Apple Entitlement Ekleme

Xcode'da:
1. `ios/App/App.xcodeproj`'u Xcode ile açın
2. Target → App → Signing & Capabilities
3. "+" butonu → "Sign in with Apple" ekleyin
4. Bu otomatik olarak `.entitlements` dosyası oluşturur

### Apple Developer Portal'da Service ID

1. Apple Developer → Certificates, Identifiers & Profiles → Identifiers → "+" → Services ID
2. Identifier: `com.bayfatura.app.service`
3. "Sign in with Apple" checkbox'ını işaretleyin
4. Primary App ID: `com.bayfatura.app`
5. Return URL: `https://bayfatura-staging.firebaseapp.com/__/auth/handler`

### Firebase Console'da Apple Provider

Firebase Console → Authentication → Sign-in providers → Apple:
- [ ] Apple provider **ENABLED** mi?
- [ ] Service ID girilmiş mi? (`com.bayfatura.app.service`)
- [ ] Apple Team ID girilmiş mi?

## Demo Hesap Neden Çalışmıyor?

```js
const demoEmail = 'demo@bayfatura.com';
const demoPassword = 'DemoPassword123!';
await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
```

Bu hata alıyorsa:

- [ ] **`demo@bayfatura.com` kullanıcısı Firebase Auth'da var mı?**  
      Firebase Console → Authentication → Add user → `demo@bayfatura.com` / `DemoPassword123!`
- [ ] Web'te çalışıyor ama iOS'ta çalışmıyorsa → Firebase init hatası (apiKey boş/yetersiz)
- [ ] iOS'ta demo hesap için özel bir engel yok, `signInWithEmailAndPassword` WKWebView'de sorunsuz çalışır

## iOS Uygulamayı Build Etme

```bash
# 1. Web assets'i build et (staging config ile)
npm run build:preview

# 2. Native projeyi senkronize et
npx cap sync ios

# 3. Xcode'da aç
npx cap open ios

# 4. Xcode'da:
#    - Hedef cihaz: Gerçek iPhone (simulator değil)
#    - Build & Run (Cmd+R)
```

## Sık Karşılaşılan Hatalar

| Hata | Sebep | Çözüm |
|------|-------|-------|
| `auth/operation-not-supported` | Simulator'de sign-in denemesi | Gerçek cihazda test edin |
| `auth/admin-restricted-operation` | Firebase Auth'da provider enabled değil | Firebase Console → Authentication → Providers → Enable |
| Sign in with Apple hiç açılmıyor | Entitlement eksik | Xcode'da Sign in with Apple capability ekleyin |
| Google Sign-In açılıp geri dönmüyor | URL scheme veya redirect URI yanlış | Firebase Console'da authorized domains'i kontrol edin |
| Demo hesap "user not found" | Kullanıcı Auth'da yok | Firebase Console'dan `demo@bayfatura.com` hesabını oluşturun |
| Uygulama açılır açılmaz çöküyor | Firebase config yanlış | `GoogleService-Info.plist`'in doğru projeye ait olduğunu kontrol edin |
