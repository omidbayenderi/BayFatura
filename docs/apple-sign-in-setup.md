# Apple Sign-In Setup — BayFatura

Bu dokuman BayFatura Web App ve ileride iOS native surumu icin Apple/iCloud girisini etkinlestirme adimlarini anlatir.

## Mevcut Durum

Uygulama kodu Apple provider'i kullanmaya hazir:

- Web tarafinda `OAuthProvider('apple.com')` mevcut.
- Login ekraninda Apple/iCloud butonu mevcut.
- Apple provider kapaliyken kullaniciya anlasilir mesaj gosteriliyor.
- Google login staging preview uzerinde basarili test edildi.

Su an alinan mesaj:

```text
Apple sign-in is not enabled yet. Please use Google or email/password for now.
```

Bu mesaj uygulama hatasi degil; Firebase Authentication tarafinda Apple provider'in henuz etkin olmadigini veya Apple Developer ayarlarinin tamamlanmadigini gosterir.

## Gerekli Hesaplar

- Apple Developer Program uyeligi gerekir.
- Firebase Console'da staging projesine erisim gerekir.
- iOS native icin Xcode Signing & Capabilities ayarlarina erisim gerekir.

## Staging Web Callback URL

Apple Developer Portal'da Service ID web authentication ayarina girilecek staging return/callback URL:

```text
https://bayfatura-staging.firebaseapp.com/__/auth/handler
```

Bu URL, Firebase Authentication OAuth handler adresidir. Staging web Apple login'i icin Apple tarafinda Return URL olarak izin verilmelidir.

## Production Callback URL

Production'a gecildiginde production auth domain'e gore ayrica eklenmelidir:

```text
https://bayfatura.com/__/auth/handler
```

Eger production Firebase default auth domain kullanilacaksa ilgili production proje domain'i de eklenmelidir:

```text
https://bayfatura-b283c.firebaseapp.com/__/auth/handler
```

Production URL'leri staging dogrulamasi bitmeden etkin release karari gibi ele alinmamalidir.

## Apple Developer Portal Adimlari

### 1. App ID

Apple Developer → Certificates, Identifiers & Profiles → Identifiers:

- App ID / Bundle ID: `com.bayfatura.app`
- Capability: `Sign in with Apple` aktif olmali.

### 2. Service ID

Apple Developer → Identifiers → `+` → Services ID:

- Service ID onerisi: `com.bayfatura.app.service`
- Sign in with Apple aktif olmali.
- Primary App ID: `com.bayfatura.app`

Service ID web authentication ayarlarinda:

- Domain/Subdomain:

```text
bayfatura-staging.firebaseapp.com
```

- Return URL:

```text
https://bayfatura-staging.firebaseapp.com/__/auth/handler
```

Production icin daha sonra:

```text
bayfatura.com
https://bayfatura.com/__/auth/handler
```

### 3. Apple Key

Apple Developer → Keys:

- Sign in with Apple icin bir key olustur.
- Key ID'yi kaydet.
- Private key dosyasini indir.

Dikkat:

- Private key repoya commit edilmemelidir.
- Key icerigi sadece Firebase Console provider ayarina girilmelidir.

## Firebase Console Adimlari

Firebase Console → Staging projesi → Authentication → Sign-in method → Apple:

- Provider: Enabled
- Service ID: Apple Developer'da olusturulan Service ID
- Apple Team ID: Apple Developer hesabi Team ID
- Key ID: Apple key ID
- Private key: Apple'dan indirilen key icerigi

Firebase Console'da Apple provider aktif edildikten sonra staging preview linkinde iCloud/Apple girisi tekrar test edilmelidir.

## iOS Native Ek Adimlari

Xcode:

1. `ios/App/App.xcodeproj` ac.
2. Target → App → Signing & Capabilities.
3. `+ Capability` → `Sign in with Apple` ekle.
4. Gercek iPhone uzerinde test et.

Not: Apple Sign-In ve Firebase web/native redirect davranislari simulator'da eksik veya farkli davranabilir. Son karar gercek cihaz testiyle verilmelidir.

## Test Kontrol Listesi

- [ ] Firebase Apple provider enabled.
- [ ] Apple Service ID girildi.
- [ ] Team ID girildi.
- [ ] Key ID girildi.
- [ ] Private key girildi.
- [ ] Apple Developer Service ID return URL staging handler'a ayarlandi.
- [ ] Chrome'da Apple login test edildi.
- [ ] Safari'de Apple login test edildi.
- [ ] iOS native icin Sign in with Apple capability eklendi.
- [ ] Gercek iPhone'da Apple login test edildi.

## Beklenen Hatalar

| Hata | Anlam | Cozum |
|------|-------|-------|
| `auth/operation-not-allowed` | Firebase Apple provider kapali veya eksik | Firebase Console'da Apple provider'i etkinlestir |
| `invalid_client` | Service ID, Team ID, Key ID veya private key uyumsuz | Apple Developer ve Firebase provider alanlarini karsilastir |
| `redirect_uri_mismatch` | Return URL Apple tarafinda yok veya yanlis | Apple Service ID Return URL alanina Firebase handler URL'ini ekle |
| Popup kapanir ama giris olmaz | Provider config eksik veya popup/redirect engeli | Console hata kodunu kontrol et, Safari/Chrome ayri test et |
