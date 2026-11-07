# Harita analizi (v1.52)

Ölçüm: başsız Chrome, 800×400, tek kare çizim. Telefon süreleri değil, **çizim yükü** ölçülür (çizim çağrısı, mesh, ışık). Gerçek telefonda kare süresi hâlâ ölçülmedi.

| Harita | Alan | Çarpışma | Kapalı alan | Mesh önce → sonra | Çizim çağrısı önce → sonra | Işık önce → sonra |
|---|---|---|---|---|---|---|
| Kışla | 96×96 | 44 | %24 | 479 → 145 | 110 → 62 | 23 → 9 |
| Görev (Devriye) | 56×56 | 28 | %44 | 200 → 88 | 132 → 62 | 12 → 9 |
| Av Ormanı | 92×92 | 53 | %9 | 136 → 132 | 76 → 65 | 6 → 11* |
| Demir Madeni | 76×76 | 11 | %25 | 135 → 135 | 96 → 82 | 12 → 8 |

\* Orman ölçümünde hayvan/oyuncu ışığı da sayılıyor; fener havuzu en çok 5 gerçek ışık kullanır (test sınırı 8).

## Bu sürümde yapılanlar
- **Fener havuzu:** haritadaki bütün fenerler "sanal" ışıktır; oyuncuya en yakın 5'i gerçek `PointLight` olur. Kışla'da 19 gerçek ışık vardı; ışık sayısı her pikselin maliyetini artırdığı için telefonda en büyük kazanç beklenen yer burası.
- **Zemin tek parça:** Kışla'da 313, Görev'de 113 ayrı taş döşeme karesi tek modele (`zemin_tas`) toplandı. Cadde `zemin_sokak`, levhalar `cevre_levha`, Kışla ve Görev surları `yapi_sur` oldu.
- Altın test (davranış) değişmedi; çarpışma kutuları aynı.

## Bulgular (henüz yapılmadı)
1. **Görev haritası sıkışık:** alanın %44'ü çarpışmayla kapalı, 56×56 içinde 6 ev, cami, hamam, kervansaray. Dalgada düşman sıkışabilir; sokak genişliği ve devriye yolları elden geçirilmeli.
2. **Orman ve maden:** 41–42 ayrı daire (su birikintisi, leke) ve çok sayıda küçük mesh; birleştirilirse çizim çağrısı ≈ 20 azalır.
3. **Orman/maden dış duvarları** hâlâ düz kutu (çalılık/kaya modeli yok).
4. **Orman sahnesinde 55 ağaç ayrı mesh;** tek bir birleşik "koru" modeline çevrilebilir.
5. **Şeffaf yüzey** (su, ışık huzmesi) sırayla çizilir; telefonda alan dolgusu maliyeti ölçülmeli.
6. Gölge: tek yönlü ışık gölge haritası bütün haritayı kapsıyor; çözünürlük/kapsama telefonda ayarlanabilir.
7. Kışla'da 11 bölge, hepsi aynı anda sahnede; uzak bölgeler görünmezken gizlenebilir (frustum zaten kırpıyor, mesh sayısı sorun değil).

## Nasıl yeniden ölçülür
`tests/smoke.py` içindeki "Harita performans bütçesi" bölümü her haritanın çizim çağrısı, mesh ve gerçek ışık sayısını sınırlar; bütçe aşılırsa test kırılır.

## Demir Madeni — v1.58 yeniden tasarımı
Eski düzende "kollar" dolu kaya bloğuydu, koridor iki yandan kapalıydı, düşmanlar ve boss kayanın içinde doğuyordu. Yeni düzen `MADEN_ODALAR` listesinden üretilir (açık dikdörtgenler); kalan her 2×2 hücre kaya, yatay/dikey birleştirilmiş kutular olarak çizilir.

| Oda | Alan (x0..x1, z0..z1) |
|---|---|
| Giriş + Ana Koridor | -6..6, 2..37 |
| Ana Kavşak | -16..16, -14..2 |
| Bakır Damarı (batı kol) → Eski Ocak | -30..-14, -10..-2 → -36..-26, -30..4 |
| Demir Ocağı (doğu kol) → Yeni Kanal | 14..30, -10..-2 → 26..36, -30..4 |
| Kuzey Geçidi → Gizli Oda (boss) | -4..4, -24..-14 → -14..14, -36..-24 |
| Batı / Doğu Bağlantısı (halka) | -30..-14 / 14..30, -30..-26 |

Doğrulama: doğma noktasından tüm odalara ulaşılır, doğma ve tuzak noktaları açık alanda (`tests/smoke.py` → "Demir Madeni: bağlı mağara ağı").


## Tarım Ovası — v1.61
Açık hava haritası (±46). Alanlar `src/js/haritalar/tarim-sahne.js` içindeki veri listelerinde: `TARIM_TARLALAR` (4 tarla), `TARIM_KOY`, `TARIM_EVLER`, `TARIM_BASKIN` (eşkıya giriş noktaları), `TARIM_CIKIS`.

| Alan | x0..x1, z0..z1 |
|---|---|
| Kuzeybatı / Kuzeydoğu tarla | -40..-12 / 12..40, -40..-16 |
| Batı / Doğu tarla | -40..-14 / 14..40, -10..10 |
| Köy (6 ev, kuyu) | -24..24, 14..36 |
| Ana yol | x -3..3, tüm harita; çıkış z=41.5 |

Mantık `tarim-guncelleme.js`: köylüler (40 can) eşkıyadan kaçar, eşkıyalar en yakın köylüye saldırır; tahıl demetleri 3×3 sabit konumda. Doğrulama: `tests/smoke.py` → "Tarım Ovası: köylüler, tahıl, baskın" (BFS ulaşılabilirlik).
