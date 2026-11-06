// ═══════════════════════════════════════════════════════
// DÜNYA MODELİ — oyuncu kaydı ve kararlı kimlikler (F1)
// Şimdilik tek yerel oyuncu var; F2'de uzak oyuncular da WORLD.players'a eklenecek.
// Düşman yapay zekâsı hedefi artık `pl` değişkeninden değil nearestPlayer()'dan alır.
// ═══════════════════════════════════════════════════════
const WORLD={players:new Map(),localId:'local',nextNetId:1};
WORLD.players.set(WORLD.localId,pl);       // `pl` = yerel oyuncu (uyumluluk için hâlâ global)

// Her varlığa (düşman, mermi, ganimet…) host'ta artan, kararlı bir kimlik verilir; ağda bu kimlik kullanılacak.
function newNetId(){return WORLD.nextNetId++;}
function localPlayer(){return WORLD.players.get(WORLD.localId);}
function forEachPlayer(fn){WORLD.players.forEach(fn);}
// (x,z) noktasına en yakın canlı oyuncu; canlı yoksa yerel oyuncu
function nearestPlayer(x,z){
  let best=null,bd=Infinity;
  WORLD.players.forEach(function(p){
    if(p.hp<=0)return;
    const d=(p.x-x)*(p.x-x)+(p.z-z)*(p.z-z);
    if(d<bd){bd=d;best=p;}
  });
  return best||localPlayer();
}
// Yerel oyuncunun yetenek durumuna takma adlar (yetenekler.js'deki eski adlar çalışmaya devam eder)
// Silah seçimi oyuncuya aittir (p.weapon); yerel oyuncuda eski selWeapon ile aynı değer
Object.defineProperty(pl,'weapon',{get:function(){return selWeapon;},set:function(v){selWeapon=v;},enumerable:true});
abilityCDs=pl.ab.cd;abilityActive=pl.ab.active;abilityTimer=pl.ab.timer;
