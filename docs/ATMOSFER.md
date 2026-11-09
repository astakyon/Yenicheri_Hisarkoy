# Menü atmosferi (v1.85)

Ana menünün gökyüzü, ışığı ve yıldız yoğunluğu `#menuLayer[data-atm="…"]` ile seçilir.
Oyuncu seçimi: **Ayarlar → Grafik → Menü Atmosferi** (`SETTINGS.atmosfer`, varsayılan `aksam`).

## Yeni atmosfer eklemek (2 adım)
1. `src/js/cekirdek/ayarlar.js` içindeki `ATMOSFERLER` nesnesine bir satır ekle: `anahtar:'Görünen Ad'`.
2. `src/css/main.css` içinde (v1.85 bloğunda) şu şablonla bir kural ekle:

```css
#menuLayer[data-atm="anahtar"]{
  --atm-sky:linear-gradient(180deg,#...,#...);  /* gökyüzü degradesi (üstten alta) */
  --atm-glow:rgba(255,170,90,.30);              /* ufuk parıltısı */
  --atm-star:1;                                 /* yıldız saydamlığı 0–1 */
  --atm-vig:rgba(0,0,0,.65);                    /* kenar karartması */
}
```

Varsayılan değerler `#menuLayer{…}` kuralındadır (mevcut oyun arka planı = `aksam`).
Silüet (şehir) ve karakter `ekran/menu-animasyon.js` içinde çizilir; renkleri bu değişkenlerden etkilenmez.
