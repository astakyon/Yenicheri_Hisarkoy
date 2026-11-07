# Yeni model ekleme

**Koddan:** `src/js/modeller/kayit.js` içine
`modelTanimla('kimlik',{ad:'Ad',grup:'Düşman',boy:2.0,bar:{w:1,y:2.6,renk:0x22cc55},yap:function(){ return ...THREE.Group; }});`
Kütüphanede kendiliğinden görünür. Mermi/ganimet gibi tek parçalı modeller `Group` değil `Mesh` döndürmeli (altın test rastgele akışı nesne sayısına bağlı).

**Dosyadan (.glb):**
1. Kütüphanede modeli seç → **.glb içe aktar** (yalnız bu cihazda), ya da
2. Dosyayı `assets/models/` içine koy ve `assets/models.json` içine `"kurt": {"file":"assets/models/kurt.glb","boy":1.6,"rotY":0}` yaz; sunucuya gönder.

Bir modelin özgün Blender çıktısını almak için önce kütüphaneden mevcut modelin `.glb`'sini indirip ölçü olarak kullan. Sonra `sh tests/run.sh`.
