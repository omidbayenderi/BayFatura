# BayFatura Android Smoke Test

Bu liste Android beta oncesi her build icin ayni sirayla uygulanir. Amac, WebView icinde calisan temel SaaS akislari ile native Capacitor ozelliklerinin birlikte sorunsuz calistigini dogrulamaktir.

## Test Ortami

- Build tipi: Debug APK veya internal testing AAB
- Paket adi: `com.bayfatura.app`
- Firebase proje: staging
- Test kullanicisi: `omidbayenderi@gmail.com`
- Cihaz: En az bir Android 12+ gercek cihaz, mumkunse bir emulator

## 1. Ilk Acilis

- Uygulama aciliyor ve splash screen takilmadan login ekranina geciyor.
- Web App icinde yanlis domain veya beyaz ekran gorunmuyor.
- Android back tusu login/onboarding/dashboard akisini bozacak sekilde cikisa zorlamiyor.
- Console/logcat tarafinda tekrarlayan kritik hata yok.

## 2. Auth

- Email/password ile giris calisiyor.
- Google ile giris native akistan tamamlanip uygulamaya geri donuyor.
- Cikis yapildiktan sonra tekrar giris yapilabiliyor.
- Apple/iCloud girisi Android icin kritik beta kriteri degil; web/iOS lansman oncesi Apple Developer + Firebase provider ayariyla tamamlanacak.

## 3. Onboarding ve Hesap Durumu

- Kurulum sihirbazi tamamlanabiliyor.
- Sirket adi kaydediliyor.
- Telefon ve adres alanlari varsa bos birakildiginda akisi bloklamiyor.
- `omidbayenderi@gmail.com` test kullanicisinda premium ozellikler gorunuyor.

## 4. Fatura Temel Akislari

- Musteri ekleniyor.
- Urun/hizmet ekleniyor.
- Yeni fatura olusturuluyor.
- Fatura detayi aciliyor.
- PDF olusturma ve indirme/paylasma akisi calisiyor.
- Teklif/fatura public view linki aciliyor.

## 5. Native Kamera ve Fis Tarama

- Gider veya fis tarama ekranindan kamera secilebiliyor.
- Android kamera izni isteniyor.
- Izin verildiginde fotograf alinip uygulamaya donuyor.
- Izin reddedildiginde uygulama kilitlenmiyor, kullanici tekrar deneyebiliyor.
- AI scan akisi sonuc veya anlasilir hata mesaji donduruyor.

## 6. Native Paylasim

- PDF veya public link paylasiminda Android share sheet aciliyor.
- Paylasim iptal edilirse uygulama hata durumunda kalmiyor.
- Paylasim sonrasi ayni sayfada isleme devam edilebiliyor.

## 7. Push Notification

- Bildirim izni isteniyor.
- Izin verilirse FCM token alinip kullanici kaydina yaziliyor.
- Izin reddedilirse uygulama normal kullanima devam ediyor.
- Firebase App Distribution/Play internal build ile token kaydi tekrar kontrol ediliyor.

## 8. Offline ve Oturum Dayanikliligi

- Uygulama arka plana alinip geri getirildiginde oturum korunuyor.
- Kisa sureli internet kesintisinde veri ekranlari tamamen kilitlenmiyor.
- Uygulama kapatilip acildiginda kullanici tekrar login ekranina dusmuyorsa beklenen davranis korunuyor.

## 9. Hata Kaydi

- Kritik crash varsa Crashlytics veya logcat cikisi not edilir.
- Hata tekrarlanabiliyorsa su bilgiler kaydedilir:
  - Build tipi ve commit SHA
  - Cihaz modeli ve Android surumu
  - Test kullanicisi
  - Ekran/akis
  - Beklenen davranis
  - Gozlenen davranis

## Kabul Kriteri

Android beta build'i dagitilabilir saymak icin 1-4. bolumler gecmeli, 5-7. bolumlerdeki native ozellikler ise en az bir gercek cihazda dogrulanmalidir.

