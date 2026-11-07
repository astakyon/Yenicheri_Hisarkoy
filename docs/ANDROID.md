# Android: telefonda deneme ve Google Play

Oyun bir **PWA**'dır (`manifest.webmanifest` + `sw.js`). Üç aşamalı yol:

1. **Şimdi, iki telefonda deneme (Play Store gerekmez):** GitHub Pages adresini Android Chrome'da aç → ana menüde **⬇ UYGULAMAYI YÜKLE**
   (ya da Chrome ⋮ → *Uygulamayı yükle*). Ana ekranda simge olur, tam ekran ve yatay açılır, çevrimdışı çalışır.
   Çok oyunculu denemeler (F3) iki telefonda bu yolla yapılır; mobil veride denemek için Wi-Fi'ı kapat.
2. **APK ile deneme:** GitHub → Actions → **Android paketi (Play Store)** → *Run workflow*. İş bitince *Artifacts* altından
   `app-release-signed.apk` indirilir (anahtar yoksa geçici deneme anahtarıyla üretilir; bu paket Play'e yüklenmez).
3. **Google Play:** aşağıdaki "Play'e yükleme" adımları.

## Bilgiler
- Paket adı: `tr.yenicheri.hisarkoy` (**Play'e yüklendikten sonra değiştirilemez**; ilk yüklemeden önce karar ver).
- Yön: yatay, tam ekran. Sürüm kodu `VERSION` dosyasından türetilir: `v1.44` → `appVersionName 1.44`, `appVersionCode 144`.
- Yayın adresi: `https://astakyon.github.io/Yenicheri_Hisarkoy/` (depo adı `Yenicheri_Hisarkoy`; GitHub eski adı yönlendiriyor.
  Adres açılmazsa depo adının büyük/küçük harfini `twa-manifest.json` ve `manifest.webmanifest` ile karşılaştır).

## Play'e yükleme
1. Bir kez imza anahtarı üret ve **yedekle** (kaybolursa güncelleme yapılamaz):
   `keytool -genkeypair -keystore android.keystore -alias yenicheri -keyalg RSA -keysize 2048 -validity 10000`
2. GitHub → Settings → Secrets → Actions: `ANDROID_KEYSTORE_B64` (`base64 -w0 android.keystore`), `ANDROID_KEYSTORE_PASSWORD`,
   `ANDROID_KEY_PASSWORD`.
3. Actions → **Android paketi** çalıştır → `app-release-bundle.aab` ve `assetlinks-yukleme-anahtari.json` indir.
4. **Digital Asset Links:** adres çubuğunun gizlenmesi için `https://astakyon.github.io/.well-known/assetlinks.json` gerekir.
   Bu dosya `astakyon.github.io` adlı kullanıcı sitesi deposunun köküne konur. Kızıl Elma için de aynı dosya kullanılıyorsa
   iki uygulamanın bildirimlerini **aynı JSON dizisine** ekle (her biri ayrı nesne). Play App Signing kullanırsan Play Console'daki
   *uygulama imzalama* parmak izini de ekle.
5. Play Console → yeni uygulama → `.aab` yükle. Gizlilik politikası adresi: `https://astakyon.github.io/Yenicheri_Hisarkoy/privacy.html`.
   İçerik derecelendirmesi ve ekran görüntüleri Play Console'da doldurulur.

## Capacitor (alternatif, bu proje için seçilmedi)
Oyunu uygulamanın içine gömer (internetsiz açılır, her sürümde yeni APK gerekir). İleride çevrimdışı çok oyunculu dışı bir gereksinim
çıkarsa düşünülür; TWA'dan geçiş kolaydır çünkü oyun tek `index.html`.

## Simgeler
`python3 tools/ikonlar.py` tek bir çizimden bütün boyutları üretir (`icon-*.png`, `icons/`). Çizim `tools/ikonlar.py` içindedir.
