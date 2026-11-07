# Çok oyunculu (v1.45): nasıl denenir, nasıl çalışır

## İki telefonla deneme
1. İki telefonda da oyunu aç (GitHub Pages adresi ya da yüklenmiş uygulama). Çok oyunculu, Claude'un önizleme sayfasında çalışmaz (WebRTC yok).
2. Telefon A: ana menü → **👥 ÇOK OYUNCULU** → **ODA KUR**. Ekranda 5 harfli kod çıkar ve Kışla'da oyun başlar.
3. Telefon B: **👥 ÇOK OYUNCULU** → kodu yaz → **ODAYA KATIL**. B, A'nın dünyasına girer.
4. Mobil veriyle denemek için telefonlardan birinin Wi-Fi'ını kapat. Bağlanamazsan not al: hangi operatör, hangi ağ. (Bu, TURN'e ne kadar ihtiyaç olduğunu gösterecek.)
5. En çok 4 oyuncu (host + 3). Host menüye dönerse oda kapanır.

## Nasıl çalışıyor
- **Host her şeyi hesaplar** (düşman, dalga, hasar, ganimet). İstemci yalnızca girdi gönderir (`input` + numara) ve saldırı eylemi (`act`).
- Host her 4 tikte (15 Hz) bir **özet** (`snapshot`) yollar. İstemci başkalarını 100 ms geriden yumuşatarak çizer.
- İstemci kendi karakterini **tahmin eder** (anında tepki) ve her özette host'un onayladığı konumdan, onaylanmamış girdileri yeniden uygulayarak düzeltir.
- Bağlantı: PeerJS (WebRTC). Eşleştirme için PeerJS bulutu; zor ağlar için `window.YC_ICE` ile TURN sunucusu verilebilir (F3).
- Test için kendi sinyal sunucusu: adres sonuna `?peer=127.0.0.1:9000`.

## Ölme, canlandırma, yeniden bağlanma (v1.47)
- Tek kişilik: oyuncu ölünce oyun biter (eskisi gibi). Odada: düşen oyuncu yerde kalır; hayattaki yoldaş 2 sn yanında dururse %50 canla kalkar, 30 sn canlandırılmazsa kendiliğinden %40 canla kalkar. **Herkes düşünce** oyun biter (host ve istemcide ölüm ekranı).
- Bağlantı kopunca host oyuncuyu 60 sn bekletir (dokunulmaz, hareketsiz). İstemci aynı odaya **anahtarıyla** (host'un verdiği gizli kod) 8 kez yeniden dener; dönünce aynı kimlikle (c1…) kaldığı yerden devam eder. Temiz çıkış (`bye`) oyuncuyu hemen siler; host odayı kapatınca istemci beklemeden "Bağlantı koptu" görür.
- Host haritayı değiştirince (Bölümler → harita) istemci de yeni haritaya geçer ve oyuncular başlangıçta yan yana doğar. Özel (editör) haritalar hâlâ odada yok.
- Oyuncu başına pay: yeteneğin seviyesi, zırh ve azami can katılırken istemciden alınır (`hi` mesajı, host sınırlar içinde kabul eder). Ganimeti en yakın canlı oyuncu toplar; akçe/deri/metal onun payına yazılır, öldürme XP'si herkesin kendi kaydına eklenir. İstemci akçesini sağ çıkarsa kışlaya aktarır, ölürse kaybeder (tek kişilik kuralı).
- Q/F/R yetenekleri istemciden `act:ab` ile host'a gider; bekleme süresi özetle istemci ekranına döner.

## Ağ şeridi
`snapshot()` okunaklı nesne üretir; ağda `ozetPakla()` ile dizilere çevrilir (alıcıda `ozetAc()`). 4 oyuncu + 40 düşman + 16 mermi + 12 ganimet: 4,3 KB → **2,0 KB** özet; 15 Hz'de istemci başına ≈ 30 KB/sn (host 3 istemciye ≈ 90 KB/sn). Düşman ve ganimet konumu 0,1 birime yuvarlanır. Daha da küçültmek gerekirse: yalnızca yakındaki düşmanlar, ya da ikili paket.

## Bilinen eksikler (sırada)
- Mini harita istemcide boş; saldırı efektleri (vuruş parıltısı, patlama) yalnızca host'ta görünür.
- Yetenek efektleri (savaş çığlığı vb.) istemcide çizilmez; etkisi düşman konumundan görünür.
- Bağlantı güvenilir/sıralı kanaldan akar; mobilde kayıp çoksa gecikme birikebilir. F3'te ölçülecek, gerekirse ikinci (güvenilmez) kanal eklenir.
- Özel (editör) haritalar odada yok. TURN henüz yok (zor ağlarda bağlanamayabilir).

## Testler
`tests/coop.py`: iki ayrı tarayıcı sayfası + yerel PeerServer + gerçek WebRTC. Oda kur/katıl, hareket ve tahmin uyumu, düşman görüntüsü,
kılıç ve ateş, 150 ms gecikme ve özet kaybı, harita değişimi, yetenek/ganimet/XP payı, ölme ve canlandırma, bağlantı kopup geri dönme, ayrılma, host'un odayı kapatması, herkes düşünce oyun sonu. Çalıştırmak için `npm i peer@1.0.2 peerjs@1.5.4` ve
`PEER_MODULES=<node_modules> PEER_JS=<peerjs.min.js>` (yoksa test atlanır).
