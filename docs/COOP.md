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

## Bilinen eksikler (sırada)
- İstemcide düşmanlar sade kutu modeliyle çizilir (gerçek modeller yok), mini harita boş, saldırı efektleri yalnızca host'ta görünür.
- Yetenekler (Q/F/R) istemcide henüz çalışmaz. Ganimet, akçe ve XP şimdilik host'un kaydına yazılır (oyuncu başına paylaşım F4).
- Oyuncu ölünce yeniden doğma yok. Yeniden bağlanma yok (F3).
- Bağlantı güvenilir/sıralı kanaldan akar; mobilde kayıp çoksa gecikme birikebilir. F3'te ölçülecek, gerekirse ikinci (güvenilmez) kanal eklenir.
- Yalnızca Kışla, Devriye, Av Ormanı, Demir Madeni odaları; özel (editör) haritalar yok.

## Testler
`tests/coop.py`: iki ayrı tarayıcı sayfası + yerel PeerServer + gerçek WebRTC. Oda kur/katıl, hareket ve tahmin uyumu, düşman görüntüsü,
kılıç ve ateş, 150 ms gecikme ve özet kaybı, ayrılma ve host'un odayı kapatması. Çalıştırmak için `npm i peer@1.0.2 peerjs@1.5.4` ve
`PEER_MODULES=<node_modules> PEER_JS=<peerjs.min.js>` (yoksa test atlanır).
