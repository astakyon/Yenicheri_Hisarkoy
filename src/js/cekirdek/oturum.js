// ═══════════════════════════════════════════════════════
// OTURUM (Session) — tek ve çok oyunculu için ortak host yolu
// Tek kişilik = "sıfır eşli host": girdi LoopbackTransport'tan geçip aynı host koduna ulaşır.
// Çok oyunculuda aynı arayüzü PeerJS taşıması sağlayacak (F2).
// ═══════════════════════════════════════════════════════
class LoopbackTransport{
  constructor(){this.kuyruk=[];}
  send(msg){this.kuyruk.push(msg);}            // yerel host'a teslim
  poll(){const m=this.kuyruk;this.kuyruk=[];return m;}
}
const SESSION={
  isHost:true,
  transport:new LoopbackTransport(),
  inputs:new Map(),                              // oyuncu id -> son girdi komutu
  submitLocal:function(cmd){this.transport.send({t:'input',id:WORLD.localId,cmd:cmd});},
  // Bir tik: gelen girdileri al, her oyuncuyu kendi komutuyla hareket ettir
  step:function(dt){
    this.transport.poll().forEach(function(m){if(m.t==='input')SESSION.inputs.set(m.id,m.cmd);});
    WORLD.players.forEach(function(p,id){
      const c=SESSION.inputs.get(id);
      if(c&&p.mesh)movePlayer(p,c,dt);
    });
  }
};

// ── DURUM ÖZETİ (snapshot) ──────────────────────────────
// Host'un dünyayı istemciye anlatma biçimi: yalnızca düz sayı ve metin, THREE nesnesi yok.
// F2'de bu paket 15 Hz ağdan gidecek; istemci kendi görüntü nesnelerini id'ye göre oluşturur/günceller.
function snapshot(){
  const r=function(v){return Math.round(v*100)/100;};
  const ps=[];
  WORLD.players.forEach(function(p,id){
    ps.push({id:id,x:r(p.x),z:r(p.z),a:r(p.ang),hp:Math.ceil(p.hp),mh:p.maxHp,en:Math.ceil(p.en),w:p.weapon,ar:armorOf(p),sh:p.ab&&p.ab.active.f?1:0});
  });
  return {
    t:gt,map:currentMap,wave:wave,kills:kills,
    p:ps,
    e:enemies.map(function(e){return {id:e.id,k:e.animalType||'d',x:r(e.x),z:r(e.z),hp:Math.ceil(e.hp),mh:e.maxHp,b:e.isBoss?1:0};}),
    b:bullets.map(function(b){return {id:b.id,x:r(b.mesh.position.x),z:r(b.mesh.position.z),vx:r(b.vx),vz:r(b.vz)};}),
    l:loots.filter(function(l){return !l.collected;}).map(function(l){return {id:l.id,k:l.type,x:r(l.x),z:r(l.z)};})
  };
}
