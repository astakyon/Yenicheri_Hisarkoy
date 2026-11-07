# Yol haritası — tek ve çok oyunculu altyapı

Hedef: **aynı kod tabanında hem tek kişilik hem çok oyunculu** (ilk adım 2–4 kişilik kooperatif PvE).
Referans: "Ay Yıldız: Hedef Kızıl Elma" projesi (astakyon/Turkiye_Hava_Simulasyonu) — modüler `src/`, `build.py`,
PeerJS host-relay oda sistemi, Supabase hesap/kayıt, misafir modu, testler.

## Kararlar (araştırma, Kasım 2026)
- **Model:** host-otoriter. Host düşmanları, dalgaları, ganimeti, hasarı ve XP'yi simüle eder; istemciler **girdi** gönderir,
  host 15–20 Hz **snapshot** yayınlar, istemciler diğerlerini ~100 ms geriden interpolasyonla çizer, yalnızca kendi karakterini tahmin eder.
- **Tek kişilik = "sıfır eşli host":** aynı host kodu, hiç bağlı istemci yok (`LoopbackTransport`). İki modda tek kod.
- **Taşıma (başlangıç):** PeerJS (WebRTC DataChannel, host-relay, iki kanal: güvenilir olaylar + güvenilmez snapshot/girdi)
  + Cloudflare TURN (kısa ömürlü kimlikleri ücretsiz bir Worker üretir; ayda 1.000 GB ücretsiz). İkincil TURN: Metered Open Relay.
- **Yedek:** Cloudflare Workers + Durable Objects WebSocket röle odası, aynı mesaj zarfı.
- **Supabase:** yalnızca hesap ve kayıt. Oyun trafiği için değil (ücretsiz katman 100 mesaj/sn).
- **Hile:** host-otoriter modelde istemci hasar uyduramaz; kayıt için Postgres CHECK kısıtları yeterli. PvP/liderlik tablosu gelince otorite sunucuya taşınır.

## Aşamalar (yarı zamanlı tek geliştirici)
| Aşama | Kapsam | Süre | Durum |
|---|---|---|---|
| **F0 Modülerleştirme** | `src/` yapısı, `build.py`, testler (kaynak + tarayıcı) | 1–2 hafta | **TAMAM (v1.34)** |
| **F1 Simülasyon/render ayrımı** | `World`/`Entity`/`Player` modeli, `netId`, sabit tik, `player` uyumluluk katmanı, `Session` + `LoopbackTransport`, tek kişilik "altın test" | 3–4 hafta | **sürüyor** (altın test ✔, oyuncu kaydı ✔, düşman kimlikleri ✔, mermi/ganimet id ✔, sabit 60 Hz tik ✔, tuzak zamanlayıcısı tik tabanlı ✔) |
| **F2 İlk co-op (minimum kilometre taşı)** | tek harita, 2 oyuncu, PeerJS iki kanal, lobi/oda kodu, girdi→host, JSON snapshot 15 Hz, interpolasyon + yerel tahmin | 3–4 hafta | |
| **F3 Saha doğrulaması** | Cloudflare TURN + Worker, yeniden bağlanma, `LagSimTransport`, Playwright iki sayfa testi, **iki gerçek cihazla mobil veride test** | 1–2 hafta | |
| **F4 Tam co-op** | 4 oyuncu, tüm haritalar, boss telegraph olayları, oyuncu başına ganimet, canlandırma, ikili kodlama | 4–6 hafta | |
| **F5 Hesap/kayıt** | Supabase `profiles`/`saves` + RLS, misafir modu, birleştirme diyaloğu | 1–2 hafta | |
| **F6 Yedek taşıma** | Durable Object röle odası, otomatik geri düşüş | 1–2 hafta | |
| **F7 Sonrası** | ortak kışla hub'ı, PvP, liderlik tablosu | 6+ hafta | |

## F1 için ilk bilinenler (bu kodun şu anki hâli)
- Oyun durumu `cekirdek/oyun-durumu.js` içindeki globallerde: `pl` (tek oyuncu), `enemies`, `bullets`, `loots`, `parts`, `wave`, `kills`, `akce` …
- Düşman AI'ları `pl`'yi doğrudan hedefliyor (`ana güncelleme`, `orman-guncelleme`, `maden-guncelleme`, `gorev` güncellemesi).
- Düşman/mermi/ganimet nesneleri `THREE.Mesh`'i içinde taşıyor (simülasyon ve görüntü iç içe). F1'de ayrılacak.
- Zamanlayıcılar kare sayacıyla (`waveTimer--`) ve bir yerde `setTimeout` ile (tuzak yeniden kurulması, 8 sn). Tik tabanlıya çevrilecek.
- Duraklatma `playing=false` ile dünyayı durduruyor; çok oyunculuda yalnızca eş yokken gerçek duraklatma olmalı.

## Riskler
1. Refaktör oyunu bozar → F1 başında tek kişilik "altın test" (sabit tohumla aynı sonuç), özellik bayrağı.
2. NAT/CGNAT ile bağlanamama → F3'te TURN şart; bağlantı tipi (`relay`/`srflx`) kaydedilsin.
3. PeerJS sinyal kesintisi → zaman aşımı + röle yedeği.
4. Mobil host performansı / sekme arka plana alınınca durma → düşman sınırı, `visibilitychange` bildirimi.
5. Erken kapsam kayması (PvP/hub) → F4 bitmeden başlama.
6. Ücretsiz katman değişiklikleri → tüm sağlayıcılar adaptör arkasında.

## Belirsizler
- Türkiye mobil operatörlerinde ne kadar bağlantının TURN gerektireceği ölçülmedi (F3'te ölçülecek).
- Bant genişliği ve kota rakamları tahmin; F2'de gerçek paket boyutları loglanıp yeniden hesaplanmalı.
- Ay Yıldız projesinde de "iki gerçek cihazla internet üzerinden çok oyunculu" hâlâ bekleyen bir deneme; oradaki kod tam saha doğrulaması görmedi.

## F1 ilerleme günlüğü
- [x] **Altın test** (`tests/altin.py`): 4 harita × 1.500 kare, sabit tohum, betikli girdi; küçük bir davranış değişikliğini (düşman hasarı 3→4) yakaladığı doğrulandı.
- [x] **Oyuncu kaydı ve `nearestPlayer`**: düşman yapay zekâsı (Kışla/Devriye, Av Ormanı, Demir Madeni) hedefi ve hasarı artık hedef oyuncuya uyguluyor. Altın test birebir aynı çıktı.
- [x] **Düşman `id`'leri** (`newNetId`).
- [ ] Mermi ve ganimet için `id`; ölü varlıkları "işaretle, tik sonunda temizle" düzenine al.
- [ ] Simülasyon durumunu görüntüden ayır: düşman/mermi/ganimet nesnelerinden `THREE.Mesh` çıkar, ayrı bir `View` katmanı `id` ile mesh'i bulsun.
- [ ] Bekleme süreleri ve `setTimeout` tabanlı oyun zamanlayıcılarını tik sayacına çevir (tuzak yeniden kurulumu vb.).
- [ ] `pl` globalini modül modül `localPlayer()`/`forEachPlayer()`'a taşı; yetenekler ve zırh oyuncu başına olsun.
- [ ] `Session` + `LoopbackTransport`: yerel girdi de aynı `InputCommand` kuyruğundan geçsin.
- v1.36: sabit zaman adımı (`tikBirikim`, 60 tik/sn); çizim `renderFrame()` ile ayrıldı; mermi/ganimet `id`; `setTimeout` tuzağı tik tabanlı. Kalan: mesh/simülasyon ayrımı, `pl` → `localPlayer()` geçişi, `Session`+`LoopbackTransport`.
- v1.37–v1.38: girdi komutu (`readLocalInput`/`movePlayer`), `SESSION` + `LoopbackTransport`. Kalan F1: mesh/simülasyon ayrımı, `pl` → `localPlayer()` geçişi (yetenekler, silah, zırh oyuncu başına).
- v1.39: yetenekler oyuncu başına (`p.ab`). Kalan F1: silah/zırh seçimi oyuncu başına, mesh/simülasyon ayrımı, `pl` kullanımlarının `localPlayer()`e taşınması.
- v1.40: silah ve zırh oyuncu başına. Kalan F1: mesh/simülasyon ayrımı, tuzakların tüm oyunculara etkisi, `pl` → `localPlayer()`.
- v1.41: Maden tuzağı tüm oyuncular. `pl` kalan kullanımları çoğunlukla yerel arayüz/başlatma (oyun-baslat, menüler, girdi); simülasyon tarafı oyuncu listesine geçti. Kalan F1: mesh/simülasyon ayrımı (View katmanı).
- v1.42: `snapshot()` (düz veri; 2 oyuncu+4 düşman ≈ 500 bayt JSON). Altın test tarihi sabitledi (günlük görevler tarihe bağlı). Kalan F1: `applySnapshot` + istemci görüntü katmanı (F2 ile birlikte), düşman/mermi mesh ayrımı.
