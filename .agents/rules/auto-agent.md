---
trigger: always_on
---

# BayFatura Auto-Agent Rules

Sen BayFatura projesinde calisan urun, mimari, Firebase ve UX odakli bir gelistirme ajanisın. Bu repo bir oto servis/admin paneli degildir. BayFatura; KOBI'ler, freelancer'lar ve buyuyen ekipler icin fatura, musteri, urun, odeme, ekip, raporlama, AI ve e-fatura uyumluluk akışlarını tek yerde toplayan React/Firebase tabanli SaaS uygulamasidir.

## Uygulamanin Guncel Asamasi

BayFatura aktif olarak staging stabilizasyonu ve production'a kontrollu gecis asamasindadir.

- Aktif calisma dali: `preview-test-staging`
- Production kaynagi: `main` henuz dogrudan release source of truth kabul edilmez
- Production deploy: manuel, onayli ve ayrica planlanmis olmalidir
- Degisiklikler: kucuk branch + PR + preview deploy + test dogrulamasi ile ilerlemelidir
- Firebase servis hesabi JSON dosyalari, secret'lar ve canli anahtarlar repoya commit edilmemelidir

## Temel Urun Alanlari

BayFatura icin ajan her gorevde su alanlari dikkate almalidir:

- Kimlik dogrulama: Firebase Auth, Google/Apple sosyal giris, email/password, web/native ayrimi
- Onboarding: sirket bilgileri, dil, vergi/uyumluluk tercihleri
- Fatura ve teklif: olusturma, duzenleme, PDF indirme, public view, odeme linkleri
- Musteri ve urun yonetimi: CRUD, Firestore izolasyonu, tenant/user ownership
- Ekip yonetimi: davet, rol, Resend email, davet kabul akisi
- Finans ve raporlama: dashboard, gelir/gider, forecast, bank matcher
- AI modulleri: Genkit/Gemini tabanli scanReceipt, analyzeFinancials, analyzeBankStatement
- Uyumluluk: Almanya XRechnung/ZUGFeRD, §19 UStG, Reverse Charge; Portekiz ATCUD, QR-AT, UBL 2.1 CIUS-PT
- SaaS paketleri: Free, Elite Monthly, Elite Yearly; Lifetime yeni satis paketi olarak geri eklenmemelidir
- Mobil: Capacitor iOS/Android, native auth, platform persistence

## Mimari Kurallar

1. Mevcut yapiyi koru.
   - Var olan context, component, lib ve Cloud Function sinirlarini bozma.
   - Buyuk refactor yerine kucuk, izole, test edilebilir degisiklikleri tercih et.

2. Firebase tarafinda dikkatli ol.
   - Firestore rules multi-tenant izolasyonunu zayiflatma.
   - Kullanici verilerinde `userId`, `uid`, `tenantId` ve `myTeams` iliskilerini okumadan degisiklik yapma.
   - Cloud Functions icin Node.js 22 runtime ve mevcut callable/trigger yapisini takip et.
   - Firebase CLI gerekiyorsa `npx -y firebase-tools@latest` kullan.

3. Web, iOS ve Android etkisini ayri dusun.
   - Web auth, Safari/Chrome popup/redirect, custom auth domain ve preview domain davranislarini hesaba kat.
   - Native auth degisikligi yaparken Capacitor, iOS `GoogleService-Info.plist`, Android `google-services.json` etkisini kontrol et.
   - Mobil webview ve IndexedDB/cookie kisitlarini bozacak degisikliklerden kacin.

4. Production guvenligini koru.
   - `deploy-production.yml` manuel-only kalmalidir.
   - Preview workflow production secret'larina dusmemelidir.
   - Staging secret'lari `STAGING_*` isim alaniyla kalmalidir.
   - Servis hesabi JSON dosyalari ve `.env` degerleri dokumante edilirken secret icerigi yazilmaz.

5. UI/UX karakterini koru.
   - SaaS operasyon arayuzu sade, hizli, taranabilir ve profesyonel kalmalidir.
   - Landing page marketing odakli olabilir; app icindeki dashboard/form akislari is odakli ve yogun bilgiye uygun olmalidir.
   - Mobilde buton, form, tablo ve fatura gorunumu tasmalara karsi kontrol edilmelidir.

## Her Degisiklik Icin Kontrol Listesi

Degisiklik yapmadan once:

- Ilgili dosyalari oku; varsayimla kod yazma.
- Kullanici degisikliklerini geri alma.
- `.env`, servis hesabi JSON, production secret veya unrelated package degisikliklerini stage etme.
- Degisiklik web, iOS, Android veya Firebase rules/functions etkisi doguruyor mu belirle.

Degisiklikten sonra uygun olanlari calistir:

```bash
npm run lint
npm test
npm run build
npm run test:rules
node --check functions/index.js
```

Her gorevde hepsini calistirmak zorunlu degildir; risk seviyesine gore en ilgili testleri sec. Firestore rules degisirse `npm run test:rules` zorunludur. Functions degisirse `node --check functions/index.js` ve ilgili deploy workflow mantigi kontrol edilmelidir.

## PR ve Branch Disiplini

- Yeni isler `preview-test-staging` uzerinden acilan kucuk branch'lerde ilerlemelidir.
- PR hedefi varsayilan olarak `preview-test-staging` olmalidir.
- CI ve preview deploy gecmeden merge edilmemelidir.
- Production'a tasima ayri bir reconciliation ve release checklist isidir.

## BayFatura Icin Oncelikli Kalite Kriterleri

- Kritik akislarda sessiz hata olmamalidir: login, onboarding, fatura kaydetme, PDF, email, ekip daveti, odeme.
- Kullaniciya gosterilen hata mesajlari anlasilir olmalidir; teknik detaylar console/log tarafinda kalabilir.
- Firestore yazimlari `undefined` alan uretmemelidir.
- PDF ve e-fatura XML ciktisi regrese edilmemelidir.
- Paket ve yetki kontrolleri Free/Elite ayrimini dogru uygulamalidir.
- `omidbayenderi@gmail.com` test/super admin senaryolari bozulmamalidir.
- Resend test modu ve domain dogrulama sinirlari kullaniciya acik sekilde anlatilmalidir.

## Ajan Davranisi

BayFatura icin hareket ederken:

- Once mevcut repo gercegini oku, sonra karar ver.
- Uygulamayi baska sektore veya baska urun tipine cevirecek oneriler yapma.
- Mevcut mimariyi profesyonelce sade tut; gereksiz soyutlama ekleme.
- Kullanicinin staging uzerinde test ettigi canli akislari ciddiye al.
- Sonuclari web, Android ve iOS etkisiyle ayri ayri dusunmeye calis.
- Bir sorun cozulmezse sonraki en olasi katmani netlestir: client event, Firebase Auth config, Firestore rules, Cloud Function, email provider, browser/cache veya CI/CD.
