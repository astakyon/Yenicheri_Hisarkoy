# Model kütüphanesi

Oyundaki tüm 3B modeller tek bir kayıttan (`src/js/modeller/kayit.js`, `modelTanimla`) gelir. Tek kişilik oyun, çok oyunculu istemci ve kütüphane aynı kaydı kullanır; bir modeli değiştirmek her yerde değiştirir.

## Modeller (14)
| Grup | Kimlikler |
|---|---|
| Karakter | `yeniceri`, `npc_halk` |
| Düşman | `dusman`, `dusman_boss`, `eskiya`, `eskiya_boss` |
| Hayvan | `geyik`, `kurt`, `domuz`, `ayi` |
| Eşya | `mermi_tufek`, `mermi_ok`, `ganimet_akce`, `ganimet_deri`, `ganimet_metal` |
| Yapı | `yapi_ev`, `yapi_kisla`, `yapi_cami`, `yapi_hamam`, `yapi_kervansaray`, `yapi_dukkan`, `yapi_kule`, `yapi_sur`, `yapi_cit`, `yapi_talim` |
| Çevre | `cevre_agac`, `cevre_cam`, `cevre_kaya`, `cevre_cadir`, `cevre_mesale`, `cevre_varil`, `cevre_sandik`, `cevre_magara`, `cevre_destek`, `cevre_nehir` |

## Model yapısı (v1.47)
Kod modelleri insan ve dört ayaklı iki kalıptan üretilir (`_insanYap`, `_hayvanYap`). Parçalar köşe renkli tek geometride **birleştirilir** (`_birles`): bir model ≈ 5 çizim çağrısı (gövde, iki bacak, iki kol) ve ≈ 1.000 üçgen; geometri tipe göre önbelleklenir, malzeme her kopyada ayrıdır (vuruş parlaması `emissive` ile). Yürüme ve saldırı savurması `modelAnim(model,faz,hareket,saldiri)` ile oynar; kütüphanede **Yürü** düğmesi bunu gösterir. Yeni insan/hayvan türü için `_OD` / `_HKURT` gibi tek bir tanım nesnesi yazmak yeter.

## Kütüphane ekranı
Ana menü → **🧰 MODEL KÜTÜPHANESİ**. Listeden model seçilir; önizlemede döndürme, tel kafes, can çubuğu, vuruş parlaması, yürüme, karşılaştırma (gerçek boy), üçgen/nesne sayısı, **.glb indir**, **.glb içe aktar**, boy uygulama, 90° döndürme, sıfırlama ve JSON kopyalama vardır.

## Model kaynağı ve öncelik
1. **cihaz** (kütüphaneden içe aktarılan `.glb`, tarayıcıda IndexedDB'de kalır)
2. **models.json** (`assets/models.json` içindeki dosya)
3. **kod** (varsayılan, koddan çizilen model)

Her `.glb` gerçek boyuna (`boy`) ölçeklenir ve ayakları zemine oturtulur. Can çubuğu ve vuruş parlaması `.glb` modellerde de çalışır. `.glb` yükleyicileri (GLTFLoader/Exporter) yalnızca gerektiğinde jsDelivr'den indirilir.

## Testler
`tests/smoke.py`: her model çiziliyor, üçgeni var, gövde/can çubuğu tanımlı; kurt `.glb` olarak dışa aktarılıp içe aktarılıyor, boyutu doğru, oyunda kullanılıyor, yenilemeden sonra geri geliyor, sıfırlanıyor. Altın test değişmedi.
