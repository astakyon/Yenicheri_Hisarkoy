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
    if(this.pollPeers)this.pollPeers();
    WORLD.players.forEach(function(p,id){
      if(SESSION.peers&&SESSION.peers.has(id))return;      // uzak oyuncular komut kuyruğundan (stepPeers)
      const c=SESSION.inputs.get(id);
      if(c)movePlayer(p,c,dt);
    });
    if(this.stepPeers)this.stepPeers(dt);
  }
};

// ── DURUM ÖZETİ (snapshot) ──────────────────────────────
// Host'un dünyayı istemciye anlatma biçimi: yalnızca düz sayı ve metin, THREE nesnesi yok.
// F2'de bu paket 15 Hz ağdan gidecek; istemci kendi görüntü nesnelerini id'ye göre oluşturur/günceller.
function snapshot(){
  const r=function(v){return Math.round(v*100)/100;};
  const ps=[];
  WORLD.players.forEach(function(p,id){
    ps.push({id:id,x:r(p.x),z:r(p.z),a:r(p.ang),f:r(p.face===undefined?p.ang:p.face),hp:Math.ceil(p.hp),mh:p.maxHp,d:p.hp<=0?1:0,cd:p.ab?[p.ab.cd.q,p.ab.cd.f,p.ab.cd.r]:[0,0,0],ak:p.akce|0,de:p.deri|0,me:p.metal|0,xp:p.xp|0,rv:p.hp<=0?(p.rev||0):0,en:Math.ceil(p.en),w:p.weapon,ar:armorOf(p),sh:p.ab&&p.ab.active.f?1:0,q:(SESSION.acks&&SESSION.acks.get(id))||0});
  });
  return {
    t:gt,map:currentMap,wave:wave,kills:kills,
    p:ps,
    e:enemies.map(function(e){return {id:e.id,k:e.animalType||'d',x:r(e.x),z:r(e.z),hp:Math.ceil(e.hp),mh:e.maxHp,b:e.isBoss?1:0};}),
    b:bullets.map(function(b){return {id:b.id,x:r(b.mesh.position.x),z:r(b.mesh.position.z),vx:r(b.vx),vz:r(b.vz)};}),
    l:loots.filter(function(l){return !l.collected;}).map(function(l){return {id:l.id,k:l.type,x:r(l.x),z:r(l.z)};})
  };
}

// ── AĞ ŞERİDİ (kompakt biçim) ───────────────────────────
// snapshot() okunaklı nesneler üretir; ağda anahtar adları yerine diziler gider (yaklaşık yarı boyut).
// Düşman/ganimet konumu 0,1 birime yuvarlanır; oyuncu ve mermi 0,01 birim kalır (tahmin ve çarpışma için).
function ozetPakla(s){
  const r1=function(v){return Math.round(v*10)/10;};
  return {z:1,t:s.t,map:s.map,wave:s.wave,kills:s.kills,
    p:s.p.map(function(q){return [q.id,q.x,q.z,q.a,q.hp,q.mh,q.en,q.w,q.ar,q.sh,q.q,q.d,q.rv,q.cd[0],q.cd[1],q.cd[2],q.ak,q.de,q.me,q.xp,q.f];}),
    e:s.e.map(function(e){return [e.id,e.k,r1(e.x),r1(e.z),e.hp,e.mh,e.b];}),
    b:s.b.map(function(b){return [b.id,b.x,b.z,b.vx,b.vz];}),
    l:s.l.map(function(l){return [l.id,l.k,r1(l.x),r1(l.z)];})};
}
function ozetAc(w){
  if(!w||!w.z)return w;
  return {t:w.t,map:w.map,wave:w.wave,kills:w.kills,
    p:w.p.map(function(a){return {id:a[0],x:a[1],z:a[2],a:a[3],hp:a[4],mh:a[5],en:a[6],w:a[7],ar:a[8],sh:a[9],q:a[10],d:a[11],rv:a[12],cd:[a[13],a[14],a[15]],ak:a[16],de:a[17],me:a[18],xp:a[19],f:a[20]};}),
    e:w.e.map(function(a){return {id:a[0],k:a[1],x:a[2],z:a[3],hp:a[4],mh:a[5],b:a[6]};}),
    b:w.b.map(function(a){return {id:a[0],x:a[1],z:a[2],vx:a[3],vz:a[4]};}),
    l:w.l.map(function(a){return {id:a[0],k:a[1],x:a[2],z:a[3]};})};
}
