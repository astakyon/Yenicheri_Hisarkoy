# Model kütüphanesi

Oyundaki tüm 3B modeller tek bir kayıttan (`src/js/modeller/kayit.js`, `modelTanimla`) gelir. Tek kişilik oyun, çok oyunculu istemci ve kütüphane aynı kaydı kullanır; bir modeli değiştirmek her yerde değiştirir.

## Modeller (14)
| Grup | Kimlikler |
|---|---|
| Karakter | `yeniceri` |
| Düşman | `dusman`, `dusman_boss`, `eskiya`, `eskiya_boss` |
| Hayvan | `geyik`, `kurt`, `domuz`, `ayi` |
| Eşya | `mermi_tufek`, `mermi_ok`, `ganimet_akce`, `ganimet_deri`, `ganimet_metal` |

## Kütüphane ekranı
Ana menü → **🧰 MODEL KÜTÜPHANESİ**. Listeden model seçilir; önizlemede döndürme, tel kafes, can çubuğu, vuruş parlaması, yürüme, karşılaştırma (gerçek boy), üçgen/nesne sayısı, **.glb indir**, **.glb içe aktar**, boy uygulama, 90° döndürme, sıfırlama ve JSON kopyalama vardır.

## Model kaynağı ve öncelik
1. **cihaz** (kütüphaneden içe aktarılan `.glb`, tarayıcıda IndexedDB'de kalır)
2. **models.json** (`assets/models.json` içindeki dosya)
3. **kod** (varsayılan, koddan çizilen model)

Her `.glb` gerçek boyuna (`boy`) ölçeklenir ve ayakları zemine oturtulur. Can çubuğu ve vuruş parlaması `.glb` modellerde de çalışır. `.glb` yükleyicileri (GLTFLoader/Exporter) yalnızca gerektiğinde jsDelivr'den indirilir.

## Testler
`tests/smoke.py`: her model çiziliyor, üçgeni var, gövde/can çubuğu tanımlı; kurt `.glb` olarak dışa aktarılıp içe aktarılıyor, boyutu doğru, oyunda kullanılıyor, yenilemeden sonra geri geliyor, sıfırlanıyor. Altın test değişmedi.
