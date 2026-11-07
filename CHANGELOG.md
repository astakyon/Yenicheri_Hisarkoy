# Güncelleme notları — Yeniçeri: Hisarköy Muhafızı

## v1.64 — Karakter paneli düzeltmesi
- Karakter paneli ekrana sığar (telefonda taşıyordu): sabit başlık + ✕, kaydırılan seçenekler, hep görünen Sıfırla / Tamam.
- Panelin dışındaki boş alanda sürükleyerek karakteri sağa sola istediğin kadar döndürebilirsin.

## v1.63 — Çiftlik haritası (ek, biç, sat)
- **Çiftlik** (🌱): düşmansız tarım haritası, 12 parsel. Tohum rafında ekin seç (Arpa 3 akçe/30 sn, Buğday 5/60 sn, Pamuk 9/100 sn, Üzüm 14/150 sn), parsele ek, olgunlaşınca [E] ile biç, pazar tezgâhında sat (satış 8 / 16 / 30 / 48 akçe). Doğrudan ana akçeye yazılır.
- Parseller gerçek zamanla büyür ve kayıtlıdır: oyundan çıksan da büyümeye devam eder.
- Test: ulaşılabilirlik, ek/büyü/biç/sat/çıkış akışı, performans bütçesi.

## v1.62 — Karakter özelleştirme, silah gösterimi, Tarım dengesi
- **Karakterim** (ana menü): kıyafet, kemer, şalvar, yaka, düğme, toka, börk, kaşık ve bıyık rengi; 6 bıyık/sakal tipi (yok, klasik, kalın, sivri, uzun, sakallı); 4 başlık (börk, kısa börk, sarık, fes). Seçimler kayıtlıdır ve canlı önizlenir. Co-op'ta diğer oyuncular şimdilik varsayılan görünümü görür.
- **Silahlar:** sırttaki tahta (tüfek) ve elde sürekli duran kılıç kaldırıldı. Kılıç kınında belde; tüfek/yay seçiliyken sırtta; saldırınca, yakında düşman varken ya da silah seçince ele gelir, ~5 sn sonra geri takılır.
- **Tarım Ovası:** eşkıyalar 2 kat yavaş ve tek tek gelir (uyarı + yön: "kuzeyden geliyor"), ilk eşkıya 4 sn sonra; baskın başına sayı azaldı; köylüler 70 can ve yanındaki eşkıyaya tırmıkla vurur, eşkıyadan daha geç kaçmaya başlar.

## v1.61 — Yeni harita: Tarım Ovası
- **Tarım Ovası açıldı** (🌾 haritalar listesinde ve büyük haritada): 4 tarla (buğday sıraları, çit ve geçitlerle), ortada köy yolu, 6 ev, kuyu, ağaçlar. Harita `TARIM_TARLALAR` / `TARIM_EVLER` verisinden üretilir.
- **Görev:** 6 köylüyü eşkıya baskınlarından koru. Eşkıyalar 7 kenar noktasından girer, en yakın köylüye ya da sana saldırır; köylüler eşkıyadan kaçar. Her baskın sonunda hayatta kalan köylü başına 6 akçe ve biraz can yenilenmesi. 5. baskın Eşkıya Başı. Tüm köylüler ölürse "Köy Yandı" ve havuzdaki akçe kaybolur.
- **Tahıl toplama:** her tarlada 9 demet (toplam 36); üstüne yürüyerek toplanır, akçe verir, her baskında yenilenir.
- **Çıkış:** yolun güney ucunda yeşil halka; [E] ile Kışla'ya dönülür, akçe aktarılır.
- Bilinen sınır: Tarım Ovası şimdilik yalnızca tek oyunculu; ortak oyun (co-op) odalarına eklenmedi (köylüler ve tahıllar istemciye eşlenmiyor).
- Test: ulaşılabilirlik (tahıl, köylü, çıkış, baskın noktaları), tahıl toplama, köylüye saldırı, görev başarısızlığı, çıkış; performans ve altın (golden) testlerine eklendi.

## v1.60 — Maden: kazma ile kazılabilir damarlar, çıkış
- **Kazılabilir damarlar:** 22 nokta; Kaya (akçe), Bakır, Demir, Gümüş ve Altın damarı. Yakın saldırı kazma gibi vurur (kaya 3, bakır 4, demir 5, gümüş 5, altın 7 vuruş); kazılınca ganimet düşer (bakır/demir 3'er, gümüş 3, altın 6 akçe). Yaklaşınca ipucu yazısı ad ve kalan dayanıklılığı gösterir. Her dalgada yenilenir. Eski süs kaya yığınları artık kazılabilir kaya.
- **Çıkış:** giriş koridorunun ucunda yeşil çıkış halkası ve "ÇIKIŞ — KIŞLA" yazısı; yaklaşınca [E] / "Çık" düğmesi. Sağ çıkınca havuzdaki akçe kışlaya aktarılır (duraklat menüsündeki "Kışlaya Dön" havuzu kaybettirir).
- Test: damar türleri, ulaşılabilirlik, kazma, çıkış.

## v1.59 — Maden: toplanabilir cevher, kamera görüşü
- **Cevherler artık toplanır:** bakır, demir ve mor taşlar yerde ganimet olarak durur (yaklaşınca toplanır, mıknatısla çekilir); 23 nokta, her dalgada yenilenir. Önceden yalnızca süstü.
- **Kamera:** kaya blokları 7 → 4.6 yükseklik; saydamlaşma daha belirgin (%20 → %12); ahşap destek kirişleri de oyuncunun önüne geçince saydamlaşır; Maden'de sis kameraya uzaklığa göre ayarlanır (uzaklaşınca oyuncu kararmaz).
- Test: cevher sayısı ve toplama, kayada değil, sis.

## v1.58 — Demir Madeni baştan, kapat düğmeleri
- **Demir Madeni yeniden tasarlandı:** eski haritada "kollar" dolu kaya bloklarıydı ve koridor iki yandan kapalıydı; düşmanlar ve boss kayanın içinde doğuyordu. Yeni harita oda listesinden (`MADEN_ODALAR`) üretilir, kalan her yer kaya: giriş koridoru → ana kavşak → batı (Bakır Damarı, Eski Ocak) ve doğu (Demir Ocağı, Yeni Kanal) kolları → kuzey geçidi → Gizli Oda; batı ve doğu odalardan Gizli Oda'ya ikinci bir halka yolu. Cevher, meşale, tuzak ve düşman doğma noktaları yeni odalara taşındı; büyük harita çizimi aynı listeyi kullanır.
- **Kapat düğmeleri:** bölge menülerinde üstte sabit ✕ ve altta sabit Kapat (içerik uzasa da); büyük harita paneli `zoom` yüzünden ekrandan taşıyordu, düzeltildi. Bölge başlığındaki çift ikon kaldırıldı.
- **Yatay telefon:** kısa ekranda mini harita küçülür, kamera düğmeleri eylem düğmelerine binmez (≤380 px yükseklikte haritanın soluna).
- Test: kapat düğmeleri 3 ekran boyutunda, düğme çakışması, Maden'de tüm odalara ulaşım ve doğma noktaları. Altın referans Maden için yenilendi.

## v1.57 — Harita denetimi
- Dört harita ölçüldü (açık alan, doğmadan ulaşılabilirlik, dar geçit) ve görüntüsü incelendi; Kışla, Devriye, Orman sorunsuz.
- Demir Madeni: pozlama düşünce fazla kararan tünel aydınlatıldı (ortam ışığı 1.0→1.9).
- Küçük bildirim yazısı görev çubuğuna binmiyor.
- Test: her haritada doğma noktası ulaşılabilir, açık alan ve ulaşılabilir hücre alt sınırı.

## v1.56 — Av Ormanı ve Demir Madeni baştan açık
- Satın alma kilidi kalktı; eski kayıtlarda da açık yüklenir. Tarım Ovası, Yabancı Şehir ve Osmanlı Sarayı henüz yapılmadı ("yakında").

## v1.55 — Telefon: dikey menü, kamera düğmeleri, sürükleyerek kamera
- Dikey telefon ana menüsü: başlık sığar, kahraman başlıkla düğmeler arasında, düğmeler alta.
- Kamera döndürme düğmeleri mini haritanın hemen altında (can panelinin üstüne binmez).
- Telefonda ilk dokunuşta tam ekran + yatay kilit istenir (manifest zaten yatay); kilit olmazsa dikeyde "Telefonu yatay çevir" uyarısı çıkar.
- Bilinen: `tests/coop.py` yeniden bağlanma adımı ara sıra (≈5'te 1) düşüyor; v1.54'te de var, bağlantı yarım kalıyor — incelenecek.
- Tek parmakla ekranı sürükleyince kamera döner (kısa dokunuş saldırı/nişan olarak kalır).

## v1.54 — Binalar caddeye bakar, kapalı talim alanı, ölçek
- **Kışla:** bina kapıları artık orta caddeye açılır (batı sütunu doğuya, doğu sütunu batıya); görevliler kapıların önünde, caddede durur. Binalar arası dar boşluklar kalktı.
- **Talim alanı:** dört kenarı kapalı çit; caddeye bakan kenarda 5 birimlik kapı, direkler ve kiriş.
- **Levhalar:** havada asılı duran yazısız levhalar kaldırıldı; çarşı levhası direkli (`cevre_levha` `ayak` seçeneği).
- **Arayüz ölçeği** PC'de küçüldü (1.0–1.2), yatay telefonda 1.12.
- Test: etkileşim noktaları ve görevliler, talim alanı kapısı.

## v1.53 — AAA arayüz ve ana menü, ferah Kışla, börk/silah
- **Ana menü:** sol hizalı büyük altın başlık, soldan vurgulu düğme listesi, sağda model kütüphanesinden dönen 3B yeniçeri (ayrı çizim alanı), alt sağda Ayarlar/Skor.
- **HUD:** yuvarlak portre, kalın can/enerji/XP çubukları (değer çubuğun içinde), görev kartı, dairesel büyük mini harita, büyük duyuru ve ipucu yazıları. Ölçek `--ui/--uiP/--uiT` (yatay telefon ≥1.12, PC ≤1.8, dikey telefon genişliğe göre); paneller `zoom` ile büyür.
- **Kışla yeniden düzenlendi:** 96×96 harita bölgelere yayıldı (ana cadde, çarşı, kışla, tekke, Demir/Artisan kapıları); eski dikey ayraç duvarı ve ortadaki "levha bloğu" kalktı, kapılar güney suruna gerçek `yapi_kapi` modeliyle oturdu; çarşı tezgâhları iki sıra, aralıklı. NPC'ler ve bölge girişleri yeni yerleşime göre.
- **Karakter:** gerçekçi börk (keçe gövde, altın alın plakası, sırt kuyruğu, kaşıklık), sırtta kayışlı tüfek, çelik yatağan.
- **Can çubukları** daha büyük, kamera dönüşünden bağımsız.
- Işık/pozlama kısıldı (sahne beyaza yıkanmıyor). Altın referans yalnızca Kışla için yenilendi.
- Test: arayüz ölçeği, çubuk/harita boyutu, ferah doğma noktası, ince duvar yok.

## v1.52 — Zemin/sur/levha modelleri, fener havuzu, harita analizi
- **Modeller:** `zemin_tas` (dama taş döşeme, tek parça), `zemin_sokak`, `cevre_levha`; Kışla ve Görev surları `yapi_sur`, levhalar `cevre_levha`.
- **Fener havuzu:** haritadaki feneri sanal ışık yapar, en yakın 5'i gerçek ışık. Kışla'da ışık 23 → 9, mesh 479 → 145, çizim çağrısı 110 → 62; Görev'de mesh 200 → 88.
- **Test:** harita başına çizim/mesh/ışık bütçesi.
- **docs/HARITALAR.md:** harita analizi ve bulgular.

## v1.51 — Oyun içi modeller = model kütüphanesi (tek kaynak)
- Oyundaki her varlık artık `modelYap()` ile kütüphaneden gelir: oyuncu, düşman, boss, hayvan, ganimet, mermi, **NPC'ler** (yeni `npc_halk`), Kışla ağaçları ve fenerleri, **Görev (Devriye) haritasının** kuleleri, evleri, camisi, hamamı, kervansarayı, variller, ağaçları ve meşaleleri, editördeki NPC.
- Kütüphanede ayarlanan **boy** (Uygula) kalıcı olur ve oyunda da uygulanır; `.glb` ile değiştirilen model oyunda da onu kullanır.
- Test: oyundaki oyuncu/düşman/boss/ganimet/hayvan/varil kütüphane geometrisiyle aynı mı, boy ayarı oyuna yansıyor mu.
- Kalan düz kutular: zemin, duvarlar, sokak şeritleri, levhalar (model değil, zemin/ara parça).

## v1.50 — Bina saydamlaşması, mağara/maden/nehir modelleri, editör küçük resimleri
- **Saydamlaşma:** kamera ile oyuncu arasına giren yüksek yapı (bina, kule, mağara, uzun duvar) yarı saydam olur, çıkınca geri döner. Kamera döndürme ile birlikte çalışır.
- **Yeni modeller:** mağara (kaya kütlesi, karanlık ağız, sarkıt), maden ahşap desteği (direk, kiriş, payanda), akarsu (su, taş kıyı, kamış). Av Ormanı mağarası ve akarsuyu, Demir Madeni kirişleri bunlarla kuruldu; maden koridoruna kaya yığınları eklendi.
- **Editör:** palet ve ızgara artık model küçük resimlerini gösterir (gerçek modelden çizilir); her varlıkta ızgara boyutu yazar.
- Testler: saydamlaşma, yeni modeller, editör küçük resmi. Altın test değişmedi.

## v1.49 — Editör ve haritalar yeni modellerle, karakter ayrıntıları
- **Harita editörü:** bina, ağaç, çam, kaya, meşale, cami, hamam, kervansaray varlıkları model kütüphanesinden çizilir; yeni varlıklar: gözetleme kulesi, sur, çarşı tezgâhı, çit, çadır, talim kuklası, varil, sandık. Özel haritalar bu modellerle kurulur.
- **Av Ormanı:** ağaçlar (meşe/çam karışık), kayalar ve avcı kulübesi; **Demir Madeni:** meşaleler model kütüphanesinden. Çarpışmalar ve rastgelelik sırası aynı (altın test değişmedi).
- **Karakterler:** burun, kaş, kulak, etek şeridi, kuşak uçları, kemer tokası, düğmeler, kol manşeti, çizme burnu ve tabanı; yeniçeride fişeklik ve börk kaşıklığı.

## v1.48 — Döner kamera, harekete bakan karakter, yürüme/saldırı animasyonu, yapı modelleri
- **Döner kamera:** fare sağ/orta tuşu basılı sürükle, Z / C tuşları (X sıfırlar), ekrandaki ⟲ ⟳ düğmeleri, dokunmatikte iki parmak döndürme (sıkıştırma yakınlaştırması ile birlikte). W/A/S/D, joystick, fare nişanı ve mini harita kameraya göre döner; ağa dünya koordinatı gider, çok oyunculu uyumu bozulmaz.
- **Yüz yönü ayrı, nişan ayrı:** karakter yürürken hareket yönüne bakar (`face`); saldırı/ateş anında nişan yönüne döner ve yarım sn kilitli kalır (`aimLock`), sonra yürüyüş yönüne döner. Yüz yönü özetle (`f`) diğer oyunculara da gider; hayalet oyuncular yumuşak döner.
- **Animasyon:** adıma bağlı yürüme fazı (kayma yok), nefes, öne eğilme, gövde bükülmesi; saldırıda hazırlık-savurma-toparlanma; vuruş geri tepmesi. Kütüphanede ⚔ Saldır düğmesi.
- **Yapı ve çevre modelleri (kütüphane):** ev, kışla, cami, hamam, kervansaray, dükkân, kule, sur, çit, talim kuklası, ağaç, çam, kaya, çadır, meşale, fıçı, sandık (toplam 31 model). Kışla haritasındaki binalar artık bu modellerle kurulur; çarpışma kutuları aynı.
- Testler: kamera dönüşü matrisi, yüz yönü ve nişan kilidi eklendi; altın test değişmedi.
- Açık: bina arkasında saydamlaşma (occlusion fade) yol haritasında.

## v1.47 — Kooperatif tamamlanıyor: canlandırma, yeniden bağlanma, yetenek/ganimet payı, gerçekçi modeller
- **Ölme ve canlandırma:** odada düşen oyuncu yerde kalır; yoldaşı 2 sn yanında dururse %50 canla kalkar, 30 sn içinde kimse gelmezse kendiliğinden kalkar. Herkes düşünce oyun biter. Ekranda "YERE DÜŞTÜN" göstergesi. Tek kişilik oyun aynı.
- **Yeniden bağlanma:** bağlantı kopunca host oyuncuyu 60 sn bekletir; istemci aynı odaya gizli anahtarla geri döner ve kaldığı yerden devam eder. Üstte "yeniden bağlanılıyor" şeridi.
- **Harita değişimi:** host başka haritaya geçince istemci de geçer (önceden istemci eski haritada kalıyordu). Host artık uzak oyuncuları ekranında görür (önceden görünmüyorlardı).
- **Oyuncu başına pay:** Q/F/R yetenekleri istemciden çalışır; ganimeti en yakın canlı oyuncu toplar (uzak oyuncu ganimet toplayamıyordu); XP herkesin kendi kaydına, akçe oyuncunun kendi kışlasına yazılır.
- **Ağ şeridi:** özet 4,3 KB → 2,0 KB (4 oyuncu + 40 düşman). 15 Hz'de istemci başına ≈ 30 KB/sn.
- **Gerçekçi modeller:** yeniçeri (börk, kaftan, kuşak, tüfek, yatağan), düşman askeri ve komutan (sarık/miğfer, kalkan, pelerin, omuz zırhı), eşkıya ve ocakbaşı (maden başlığı, kazma, balta), geyik (boynuz), kurt, yaban domuzu (diş, kıl), ayı. Hepsi ~1.000 üçgen, ~5 çizim çağrısı; yürüme ve saldırı animasyonu (host, istemci ve kütüphanede).
- **Test altyapısı:** altın test artık THREE nesne kimliklerini sayaçtan alır; model ayrıntısı davranış referansını bozmaz. Referans v1.46 koduyla yeniden üretildi ve bu sürümle birebir aynı çıktı verdi. Çok oyunculu test: harita değişimi, yetenek/ganimet/XP, ölme/canlandırma, bağlantı kopup dönme, oyun sonu eklendi.
- Yol haritasına F1 kapanışı ve güncel iş listesi işlendi.

## v1.46 — Model kütüphanesi (oynanış aynı)
- **🧰 MODEL KÜTÜPHANESİ** (ana menü): 14 modelin (oyuncu, düşmanlar, hayvanlar, mermi, ganimet) önizlemesi, tel kafes, can çubuğu, vuruş denemesi, gerçek boy karşılaştırma, üçgen sayısı, **.glb indir / içe aktar** (cihazda kalıcı), `assets/models.json`.
- Tüm modeller tek kayıttan (`modeller/kayit.js`) gelir; tek kişilik oyun ve çok oyunculu istemci artık aynı gerçek modelleri çizer (istemcideki sade kutular kalktı).
- Yeni testler: her model çiziliyor, `.glb` dışa/içe aktarma, boyut, kalıcılık, sıfırlama. Altın ve çok oyunculu testler değişmedi.
- Yol haritasına bilinen eksikler eklendi. Belgeler: `docs/MODELLER.md`, `docs/MODEL-EKLEME.md`.

## v1.45 — Çok oyunculu: oda kur, odaya katıl (F2)
- **👥 ÇOK OYUNCULU** (ana menü): **Oda Kur** 5 harfli kod verir ve Kışla'da oyunu başlatır; **Odaya Katıl** koda bağlanır. En çok 4 oyuncu. Bağlantı PeerJS (WebRTC) ile doğrudan cihazlar arasında.
- Host dünyayı hesaplar; katılan oyuncu kendi karakterini anında hareket ettirir (**yerel tahmin**) ve host'un onayıyla düzeltilir. Diğer oyuncular, düşmanlar, mermiler ve ganimet 15 Hz özetten, 100 ms geriden yumuşatılarak çizilir.
- Uzak oyuncunun kılıç ve ateşi host'ta işlenir; düşmanlar en yakın oyuncuyu hedefler. Herkesin bekleme ve dokunulmazlık sayaçları artık işliyor (önceden yalnızca yerel oyuncunun).
- Bağlantı kopunca ya da host odayı kapatınca istemciye "Bağlantı koptu" iletisi.
- `LagTransport`: gecikme ve kayıp benzetimi (test için).
- **Testler:** `tests/coop.py` iki ayrı sayfayı gerçek WebRTC ile bağlar (yerel sinyal sunucusuyla). 150 ms gecikmede tahmin ile host durunca 0,000 birim fark. Tek kişilik altın test değişmedi.
- Bilinen eksikler `docs/COOP.md` içinde (istemcide sade düşman modelleri, yetenekler yok, yeniden doğma yok).

## v1.44 — Telefona uygulama gibi yükleme (PWA) ve TWA hazırlığı (oynanış aynı)
- **PWA:** `manifest.webmanifest`, `sw.js` (çevrimdışı önbellek, sürüm değişince yenilenir), özgün simge seti (`tools/ikonlar.py` ile üretilir: normal, maskable, tek renk). Android Chrome'da ana menüde **⬇ UYGULAMAYI YÜKLE** düğmesi çıkar; yüklenince tam ekran ve yatay açılır.
- **TWA (Google Play) hazırlığı:** `twa-manifest.json` (paket adı `tr.yenicheri.hisarkoy`), GitHub Actions iş akışı **Android paketi** (imzalı `.aab` ve denemelik `.apk`), `privacy.html`, `docs/ANDROID.md` (adımlar, Digital Asset Links).
- Yeni testler: manifest ve simgeler, TWA tutarlılığı, `sw.js` söz dizimi, servis çalışanı kurulumu ve ağ yokken açılış. Altın test değişmedi.

## v1.43 — Host ve istemci arasında ilk bağlantı katmanı (oynanış aynı)
- Yeni `cekirdek/istemci.js`: `PairTransport` (bellek içi taşıma; mesajlar gerçek ağ gibi kopyalanır), `SESSION.addPeer/removePeer` (host uzak oyuncuyu kabul eder, kimliği taşıma damgalar; istemci başkasının kimliğine bürünemez), her 4 tikte (15 Hz) özet yayını, `ClientView` (özetleri alır, 100 ms geriden doğrusal interpolasyonla gösterir).
- Hareket kodu görüntü nesnesi olmayan (uzak) oyuncularla da çalışır.
- Yeni test: host + istemci aynı sayfada 3 sn. Görüntü hosttan en çok 0,4 birim geride, geriye sıçrama yok, sahte kimlik işe yaramadı. Altın test değişmedi.

## v1.42 — Durum özeti (snapshot) ve test düzeltmesi (oynanış aynı)
- Yeni `snapshot()` (`cekirdek/oturum.js`): oyuncuları, düşmanları, mermileri ve ganimeti yalnızca sayı ve metinden oluşan, JSON'a çevrilebilir bir pakete döker (3D nesne yok). Çok oyunculuda host bunu istemcilere yollayacak. Ölçüm: 2 oyuncu + 4 düşman ≈ 500 bayt.
- **Test düzeltmesi:** Günlük görevler bugünün tarihinden seçildiği için altın test her gün farklı sonuç verebiliyordu (7 Kasım'da `gorev` haritasında fazladan 100 akçe). Testte tarih artık sabit. Oyunda hata yoktu; referans değişmedi.

## v1.41 — Maden tuzağı tüm oyuncular için (oynanış aynı)
- Patlama tuzağını menzildeki herhangi bir oyuncu tetikler; patlama menzildeki herkese kendi zırhına göre hasar verir. Tek kişilik davranış aynı (altın test değişmedi). Ölüm ekranı yalnızca yerel oyuncu için açılır.

## v1.40 — Silah ve zırh oyuncu başına (oynanış aynı)
- Zırh (`p.armor`) ve silah seçimi (`p.weapon`) oyuncuya ait. Düşman hasarı hedef oyuncunun zırhına, `doMelee(p)` / `doRanged(p, nişan)` saldıran oyuncuya göre çalışır. Yerel oyuncuda eski değerler (`SAVE.armor`, `selWeapon`) aynen geçerli.
- Altın test değişmedi. Yeni test: zırh, silah ve mermi çıkışı oyuncuya göre.
- Bilinen kalan: Maden patlama tuzağı yalnızca yerel oyuncuya hasar veriyor (F2'de tüm oyuncular).

## v1.39 — Yetenekler oyuncu başına (oynanış aynı)
- Savaş Çığlığı, Demir Kalkan ve Hızlı Atış durumu (bekleme, süre, etkin) artık oyuncunun kendisinde (`p.ab`). Düşmanın hasar kontrolü hedef oyuncunun kalkanına bakıyor; silah hasarı da oyuncunun Hızlı Atış etkisini kullanıyor.
- Eski global adlar (`abilityCDs` vb.) yerel oyuncuya bağlı kalıyor, mevcut kod aynen çalışıyor. Altın test değişmedi.

## v1.38 — Oturum ve LoopbackTransport (oynanış aynı)
- Yeni `cekirdek/oturum.js`: `SESSION` + `LoopbackTransport`. Yerel oyuncunun girdisi artık bir taşıma kuyruğundan geçip host koduna ulaşıyor ("sıfır eşli host"). Çok oyunculuda uzak oyuncuların girdisi aynı yoldan gelecek.
- Altın test değişmedi; yeni test: taşımadan gelen uzak girdi ikinci oyuncuyu hareket ettiriyor.

## v1.37 — Girdi komutu katmanı (oynanış aynı)
- Hareket, klavye/joystick'i doğrudan okumak yerine bir **girdi komutundan** (`readLocalInput` → `movePlayer`) geçiyor. Uzak oyuncuların komutları ağdan gelince aynı koddan geçecek. Altın test değişmedi.
- Kalan `setTimeout`'lar yalnızca arayüz içindir; oyun mantığı zamanlayıcıları tamamen tik tabanlı.

## v1.36 — Her ekranda aynı oyun hızı
- **Düzeltme:** Oyun mantığı kare sayısına bağlıydı; 90/120/144 Hz ekranlı telefonlarda düşman yapay zekâsı ve dalgalar 1,5–2,4 kat hızlı akıyordu. Artık mantık sabit **60 tik/sn** çalışır, çizim ekranın hızında yapılır. Ekran hızı ne olursa olsun oyun hızı aynıdır.
- **Demir Madeni tuzakları:** 8 saniyelik yeniden kurulum artık oyun süresiyle sayılır (duraklatınca durur).
- **Altyapı:** Mermi ve ganimetler de benzersiz `id` alıyor (düşmanlarla birlikte ağda anılacak).
- Yeni testler: 30/60/120/144 Hz'te eşit tik sayısı, tuzak yeniden kurulumu, id benzersizliği. Altın test değişmedi.

## v1.35 — Çok oyunculu altyapının ilk adımı (oynanış aynı)
Oyuncular için görünür bir değişiklik yok; bu sürüm, tek ve çok oyunculu mod için ortak altyapıyı hazırlıyor.
- **Oyuncu kaydı:** Oyun artık oyuncuları bir listede tutuyor (şimdilik tek yerel oyuncu). Düşmanlar hedeflerini bu listeden, **en yakın canlı oyuncuyu** seçerek belirliyor ve hasar da hedef oyuncuya uygulanıyor. Dört haritada da (Kışla/Devriye, Av Ormanı, Demir Madeni).
- **Düşman kimlikleri:** Her düşman kararlı ve benzersiz bir `id` alıyor; çok oyunculuda düşmanlar ağda bu kimlikle anılacak.
- **Altın test:** Tek kişilik oyunun davranışını kilitleyen referans test eklendi (`tests/altin.py`). Dört haritayı sabit tohum ve betikli girdiyle 1.500 kare çalıştırıp durumu referansla karşılaştırır; bu değişiklikte referansla birebir aynı çıktı.
- Yeni testler: benzersiz düşman id'leri, iki oyuncu varken en yakına yönelme, uzaktaki oyuncu ölünce yerel oyuncuya dönme.
- Belgeler güncellendi: `docs/MIMARI.md` (dünya modeli, altın test) ve `docs/YOL-HARITASI.md` (F1 ilerleme günlüğü).

## v1.34 — Modüler kaynak yapısı
Oyun artık tek dosyadan değil, `src/` altındaki 35 modülden üretiliyor. **Oynanış aynı**: derlenen oyun, v1.33 ile bayt bayt aynı (yalnızca sürüm numarası değişti).
- Kaynak konuya göre bölündü: `cekirdek`, `karakter`, `savas`, `haritalar`, `editor`, `ekran`, `gorev`, `kontrol`.
- `tools/build.py` modülleri `SIRA.txt` sırasıyla tek `index.html`'e birleştiriyor; eksik veya listede olmayan modülde derlemeyi durduruyor.
- Testler eklendi (`sh tests/run.sh`): `index.html` güncel mi, söz dizimi, çift tanımlı fonksiyon, olmayan ID'ye erişim; ayrıca gerçek tarayıcıda menü düğmeleri, dört harita, Demir Madeni savaşı ve HUD çakışma kontrolü (25 kontrol).
- Belgeler: `docs/MIMARI.md` (yapı, yeni harita ekleme adımları, hata ayıklama dersleri), `docs/YOL-HARITASI.md` (tek ve çok oyunculu altyapı planı).
- `index.html` artık doğrudan düzenlenmez; `src/` içinde değiştirilip `python3 tools/build.py` ile üretilir.

## v1.33 — Yenilenen ana menü
Menü, tasarım görseline göre yeniden yapıldı.
- Yıldızlı koyu lacivert gece gökyüzü ve ufukta sıcak parıltı.
- Ekranın tamamını kaplayan, üç katmanlı Osmanlı silueti: kale surları, kuleler, kubbeli camiler, minareler; bazı pencereleri yanıyor.
- Hilal ve yıldız süslü başlık; telefonda "YENİÇERİ:" ve "HİSARKÖY MUHAFIZI" iki satır.
- Deri kenarlık, dikiş çizgisi ve pirinç perçinler.
- Butonlar telefonda dikey ortalandı; ilk buton "OYUNA BAŞLA" adıyla altın parlıyor (Kışla'yı açar).
- Fener tam görünür hâle geldi, etrafında sıcak ışık var. Ayarlar simgesi altın renge çevrildi.
- Düzeltme: siluet yarıda kesiliyordu ve altında sert bir çizgi vardı.

## v1.32 — Demir Madeni düzeltmeleri
- **Düzeltme:** Her karede tekrarlanan `lookAt` hatası giderildi. Eşkıyalar saldırmıyor, ölmüyor, dalga ilerlemiyordu.
- **Düzeltme:** Giriş dolu bir blok olduğu için kamera karakterin önünü kapatıyordu, karakter görünmüyordu. Giriş açık bir geçit (kemer) oldu.
- Ortam ışığı ve karakterin feneri artırıldı; karanlık havası duruyor ama zemin ve karakter seçilebiliyor.

## v1.31 — Demir Madeni haritası
- Yeni harita: karanlık tünel, oyuncuyu takip eden fener, 9 meşale, 6 patlama tuzağı (8 sn sonra yeniden kurulur).
- Eşkıya Madenci yapay zekâsı; her 5. dalgada **Ocakbaşı Eşkıya** boss'u.
- Kervansaray'dan **400 Akçe** ile açılır; Bölümler ekranında ve Büyük Harita'da yer alır; Harita Editörü'ne aktarıldı.

## v1.30 — Harita Editörü ana menüde
- "🛠 HARİTA EDİTÖRÜ" ana menüye buton olarak eklendi; versiyon numarasına 5 kez dokunarak açma kaldırıldı.

## v1.29 — Haritalar editöre aktarıldı
- Kışla ve Av Ormanı, gerçek konum ve boyutlarıyla Harita Editörü formatına otomatik çevrildi ve editörde düzenlenebilir.
- Editöre 10 yeni yapı eklendi: Armory, Cami, Meydan, Cebehane, Büyük Kapı, Hamam, Kervansaray, Konut Bloğu, Mağara, Büyük Nehir.
- Yeni haritalar için editöre kaydetme şablonu hazırlandı.

## v1.28 — HUD yeniden tasarlandı
- Üstte boydan boya tek bar: ortada harita adı, sağda altın ve duraklat.
- Karakter paneli (can, enerji, XP) ve görev satırı solda; mini harita sağda bağımsız kutuda.
- Düzeltme: Duraklat ve altın göstergesi mini haritanın arkasında kalıyordu. Kök neden, kaldırılmış bir elemana erişen kod ve canvas boyutlandırmasıydı; dolu flex akışına geçilerek giderildi.

## v1.27 — HUD yaması
- Sağ üst HUD'un JavaScript ile yeniden kurulması denendi; v1.28'de yerini yeni üst bar aldı.

## v1.14 – v1.26 (önceki yayınlardan özet)
- HUD yeniden düzenlendi: Q/F/R yetenekleri, koşu, saldırı sağ altta; tek butonla açılan yarım daire silah seçici.
- **Harita Editörü** (geliştirici modu): 2D ızgara, asset paleti, çoklu hücre yerleşimi ve çakışma engeli, kaydet, "Test Et" ve test modundan çıkış butonu.
- Oyun içi kamera yakınlaştırma / uzaklaştırma (fare tekerleği ve iki parmakla).
- Mini harita görünür hâle getirildi ve tıklayınca büyük harita açılıyor.
- Düzeltmeler: haritada hareket edememe, `null.style` konsol hataları, test modunda çıkış.
