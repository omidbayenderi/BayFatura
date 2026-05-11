# 🔐 BayFatura — GitHub Secrets Kurulum Rehberi
> **Oluşturma Tarihi:** 11 Mayıs 2026  
> GitHub → Settings → Secrets and variables → Actions → New repository secret

---

## 🌐 Mevcut Web Deploy Secrets (Zaten Tanımlı)

| Secret Adı | Açıklama |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin Service Account JSON |
| `FIREBASE_DEPLOY_TOKEN` | Firebase CI Deploy Token |

---

## 🤖 FAZ 5 — Android Build için Yeni Secrets

### ANDROID_KEYSTORE_BASE64
Keystore'u Base64'e çevir:
```bash
base64 -i android/bayfatura-release.keystore | pbcopy
# Panodan yapıştır → Secret değeri olarak kaydet
```

### ANDROID_KEYSTORE_PASSWORD
Değer: `BayFatura2026!Secure`
> ⚠️ Bu şifreyi güvenli bir yerde de saklayın (1Password, Bitwarden).

### ANDROID_KEY_ALIAS
Değer: `bayfatura`

### ANDROID_KEY_PASSWORD
Değer: `BayFatura2026!Secure`

### FIREBASE_ANDROID_APP_ID
Firebase Console → Project Settings → Your Apps → Android app → App ID  
Format: `1:123456789:android:abc123def456`

### ANDROID_GOOGLE_SERVICES_JSON
Firebase Console → Project Settings → Your Apps → Android (com.bayfatura.app) → google-services.json → tüm içeriği kopyala

---

## 🍎 FAZ 4+5 — iOS Build için Yeni Secrets

### IOS_DISTRIBUTION_CERT_BASE64
Apple Developer → Certificates → Apple Distribution → İndir → Base64:
```bash
base64 -i Certificates.p12 | pbcopy
```

### IOS_DISTRIBUTION_CERT_PASSWORD
.p12 ihraç sırasında belirlenen şifre

### APPSTORE_ISSUER_ID
App Store Connect → Users & Access → Integrations → App Store Connect API → Issuer ID

### APPSTORE_KEY_ID
App Store Connect → Users & Access → Integrations → API Key → Key ID

### APPSTORE_PRIVATE_KEY
.p8 dosyasının içeriği (tek seferlik indirme!):
```bash
cat AuthKey_XXXXXXXX.p8 | pbcopy
```

### APPLE_TEAM_ID
Apple Developer → Membership → Team ID (10 karakterlik string, örn: ABC123DEF4)

---

## 🎮 FAZ 5 — Google Play için Yeni Secrets

### GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
Google Play Console → Setup → API access → Create service account  
JSON key dosyasının tüm içeriği

---

## ✅ Secrets Ekleme Sırası

1. **Hemen Ekle (Android Build için):**
   - [ ] `ANDROID_KEYSTORE_BASE64`
   - [ ] `ANDROID_KEYSTORE_PASSWORD`  
   - [ ] `ANDROID_KEY_ALIAS`
   - [ ] `ANDROID_KEY_PASSWORD`
   - [ ] `FIREBASE_ANDROID_APP_ID`
   - [ ] `ANDROID_GOOGLE_SERVICES_JSON`

2. **FAZ 4 Sonrası (iOS Build için):**
   - [ ] `IOS_DISTRIBUTION_CERT_BASE64`
   - [ ] `IOS_DISTRIBUTION_CERT_PASSWORD`
   - [ ] `APPSTORE_ISSUER_ID`
   - [ ] `APPSTORE_KEY_ID`
   - [ ] `APPSTORE_PRIVATE_KEY`
   - [ ] `APPLE_TEAM_ID`

3. **Play Store Push için:**
   - [ ] `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

---

## 🔑 Keystore Base64 Komutları

```bash
# Keystore'u Base64'e çevir (macOS)
base64 -i "/Users/omidbayanadarimoghaddam/iki proje/BayFatura/android/bayfatura-release.keystore" | pbcopy
echo "✅ Panoya kopyalandı — GitHub Secret'a yapıştır"

# Keystore bilgilerini doğrula
keytool -list -v \
  -keystore "/Users/omidbayanadarimoghaddam/iki proje/BayFatura/android/bayfatura-release.keystore" \
  -alias bayfatura \
  -storepass "BayFatura2026!Secure"
```

---

*Son Güncelleme: 11 Mayıs 2026 — FAZ 5 CI/CD kurulumu*
