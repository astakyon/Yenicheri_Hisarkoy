# Güncelleme notları — Yeniçeri: Hisarköy Muhafızı

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
