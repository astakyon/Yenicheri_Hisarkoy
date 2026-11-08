# Yapılacaklar — UI, Ayarlar, Profil, Ana Hikaye (planlama, v1.75 sonrası)

## A. Denetimde bulunan hatalar
1. Ayarlar penceresinde eski sürüm yazısı: "v1.03" (gerçek sürüm v1.75) — VERSION'dan okunmalı.
2. Ayarlar yalnızca 4 seçenek içeriyor (ses, grafik, dil, kontrol düzeni, titreşim yok).
3. Telefon yatay: ana menü 2 sütunda, uzun etiketler iki satıra kırılıyor ("OYUNA / BAŞLA").
4. Telefon dikey: "Telefonu yatay çevir" uyarısı üst başlıkla (3D OSMANLI AKSİYON RPG) üst üste biniyor; oyunda üst bara biniyor.
5. Telefon yatay oyun: oyuncu paneli + görev satırı ekranın üstünün yarısını kaplıyor; ortada başlık ile çakışıyor.
6. Bölümler: ilerleme/kilit durumu ve hikaye bağı yok; ⚔ ⛏ simgeleri koyu/soluk render oluyor; 6+ kart küçük ekranda kaydırma gerektiriyor.
7. Ana menüde 7 buton aynı ağırlıkta; ikincil araçlar (Model Kütüphanesi, Harita Editörü) oyuncu menüsünü kalabalıklaştırıyor.
8. Çiftlik/Şehir/Saray HUD'ında envanter düğmesi alt ortada joystick ve silah çubuğuyla çakışabilir (telefonda denenmedi).
9. Co-op: yeniden bağlanmada çift oyuncu kontrolü testte ara sıra kırmızı — kök neden araştırılmalı.

## B. Ana menü (AAA tarzı)
- Büyük "DEVAM ET" (son oyun) + "YENİ OYUN"; Bölümler → "HİKAYE"; Çok Oyunculu; Karakter; Mağaza/Kışla kısayolu.
- Araçlar (Model Kütüphanesi, Harita Editörü) → "Atölye" alt menüsüne.
- Alt çubuk: Profil, Ayarlar, Başarımlar, Skor, Nasıl Oynanır (ikon + etiket).
- Sol üstte profil rozeti (avatar, ad, seviye) — dokununca Profil.
- Telefon yatay: tek sütun, büyük dokunma alanı (min 48px), kısa etiketler; dikey: alt sıra butonlar.
- Giriş animasyonu, odak/hover sesi, kaydırmalı arka plan, sürüm + oyuncu kimliği altta.

## C. Ayarlar (AAA sekmeli)
Sekmeler: Oyun | Ses | Grafik | Kontroller | Hesap/Profil | Hakkında
- Ses: ana, müzik, efekt, ses; sessiz mod.
- Grafik: kalite (Düşük/Orta/Yüksek), gölge aç/kapa, çözünürlük ölçeği, FPS göstergesi, pil tasarrufu.
- Kontroller: joystick boyutu/konumu, düğme boyutu/saydamlık, soldaki mod, hassasiyet, nişan yardımı, titreşim.
- Oyun: dil (TR/EN), hasar sayıları, kamera dönüş hızı, otomatik kaydet bilgisi.
- Hakkında: sürüm (VERSION'dan), değişiklik notları, kayıt dışa/içe aktar (JSON), kayıt sıfırla (onaylı).

## D. Profil sistemi
- Oyuncu adı, avatar (başlık/bork rozetleri), unvan/rütbe, seviye ve XP.
- İstatistikler: oynama süresi, öldürme, boss, hasat, satış, hazine, en yüksek dalga, bölüm tamamlama.
- Başarım rozet vitrini, seçili unvan, favori silah.
- Profil kimliği (kısa kod) — co-op'ta oda içinde ad+rozet; kayıt dışa aktarım.
- Çok oyunculuda ad/rozet eşitleme (görünüm eşitleme zaten var).

## E. Ana hikaye ve bölümlerin bağlanması (taslak)
Ad: "Hisarköy'ün Gölgesi".
Perde 1 — Kışla: Genç yeniçeri hisarköy'e atanır; kışla ve eğitim; ilk uyarı (kervan haberleri).
Perde 2 — Devriye ve Orman: haydut baskınları; Av Ormanı'nda kaybolan izciler; haydutların başında "Kara Mehmet"in adamları.
Perde 3 — Demir Madeni: kervanların demirini çalan çetenin yatağı; madendeki hain nöbetçi; ilk ipucu: mühürlü mektup.
Perde 4 — Tarım Ovası ve Çiftlik: köylüleri koruma, erzak yetiştirme — ordunun ikmali; mektup, bir vezirin mühürünü taşıyor.
Perde 5 — Yabancı Şehir: mektubun izi liman şehrine; Çete Reisi ile yüzleşme; reis, "Vezir"in ajanı olduğunu söyler.
Perde 6 — Osmanlı Sarayı: Hain Vezir ile final; padişah huzurunda ödül, "Hisarköy Muhafızı" unvanı.
Teknik: STORY dizisi (perde, hedef harita, koşul, diyalog), bölümler menüsünde sıralı kilit + "Aktif görev", harita girişinde kısa hikaye kartı, bitişte sonuç kartı, SAVE.story ilerlemesi.

## F. Mobil kontrol listesi (baştan sona)
- Menü, bölümler, ayarlar, profil, co-op, karakter paneli: 844×390, 667×375, 390×844, 360×640, 1024×768 (tablet).
- Güvenli alan (çentik) için safe-area-inset; HUD katmanı çakışma testi (joystick / yetenek / silah çubuğu / envanter).
- Dokunma hedefi ≥ 44px; panel taşma/kaydırma testi; yatay-dikey geçişte durum koruma.
- Test: viewport döngüsü + taşma/çakışma otomatik denetimi (smoke.py'a).

## G. Önerilen sıra
1. Hatalar A1–A8 + mobil ölçek düzeltmeleri.
2. Ayarlar sekmeleri + profil + kayıt dışa/içe aktarma.
3. Ana menü yenileme.
4. Ana hikaye + bölüm bağlantıları + hikaye kartları.
5. Mobil tam geçiş + otomatik UI testleri.
6. Co-op yeniden bağlanma hatası (A9).
