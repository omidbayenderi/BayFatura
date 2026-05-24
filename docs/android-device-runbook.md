# BayFatura Android Device Runbook

Bu runbook Android native beta testine baslamak icin kullanilir. Kod tarafi build alabiliyor; sonraki esik uygulamayi emulator veya gercek cihazda calistirmaktir.

## Mevcut Lokal Durum

- Android Studio kurulu: `/Applications/Android Studio.app`
- Android SDK mevcut: `~/Library/Android/sdk`
- Debug APK mevcut: `android/app/build/outputs/apk/debug/app-debug.apk`
- `adb` PATH icinde degil; tam yolu:
  `~/Library/Android/sdk/platform-tools/adb`

## Android Studio ile Calistirma

1. Android Studio'yu ac.
2. `Open` ile su klasoru sec: `BayFatura/android`
3. Gradle sync tamamlanana kadar bekle.
4. Ust cihaz menüsünden emulator veya bagli Android telefonu sec.
5. Run tusuna bas.
6. Uygulama acilinca `docs/android-smoke-test.md` listesini sirayla uygula.

## Terminal ile Cihaz Kontrolu

```bash
~/Library/Android/sdk/platform-tools/adb devices
```

Beklenen cikti:

```text
List of devices attached
<device-id>    device
```

Liste bos ise:

- Emulator acik degildir veya telefon bagli degildir.
- Telefonda Developer Options ve USB Debugging aktif olmayabilir.
- Telefonda USB debugging izin popup'i onaylanmamis olabilir.

## Debug APK Kurma

Cihaz listede `device` olarak gorundukten sonra:

```bash
~/Library/Android/sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Logcat ile Hata Takibi

```bash
~/Library/Android/sdk/platform-tools/adb logcat | grep -i BayFatura
```

Google login, kamera, push veya crash hatasi gorulurse cihaz modeli, Android surumu ve log parcasi not edilir.

## Ilk Native Test Sirasi

1. Uygulamayi ac.
2. Email/password login test et.
3. Google login test et.
4. Giderler ekraninda manuel kamera ile fis fotografi ekle.
5. AI scan ile fis fotografi cek ve sonuc/hata mesajini kontrol et.
6. Fatura olustur ve PDF indir/paylas.
7. Uygulamayi kapat/ac ve oturumun korundugunu kontrol et.

