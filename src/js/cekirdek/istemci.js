// ═══════════════════════════════════════════════════════
// ISTEMCI / BAĞLANTI KATMANI (F2)
// PairTransport : iki uç arasında bellek içi taşıma (test ve yerel deneme). PeerJS aynı arayüzü sunacak: send(msg), poll().
// SESSION.addPeer: host bir uzak oyuncuyu kabul eder; girdisi taşımadan gelir, kimliği host damgalar.
// ClientView    : istemcinin gördüğü dünya — host özetlerini (snapshot) alır, ~100 ms geriden interpolasyonla gösterir.
// ═══════════════════════════════════════════════════════
const SNAP_ARALIK=4;            // her 4 tikte bir özet = 15 Hz
const GORUNTU_GECIKME=100;      // ms: istemci dünyayı bu kadar geriden gösterir

class PairTransport{
  constructor(){this.kuyruk=[];this.es=null;}
  send(msg){if(this.es)this.es.kuyruk.push(JSON.parse(JSON.stringify(msg)));}  // gerçek ağ gibi: kopya gider
  poll(){const m=this.kuyruk;this.kuyruk=[];return m;}
}
function makePair(){const a=new PairTransport(),b=new PairTransport();a.es=b;b.es=a;return [a,b];}

// ── Host tarafı ──
SESSION.peers=new Map();         // oyuncu id -> taşıma
SESSION.addPeer=function(id,transport){
  const sp=localPlayer();
  const p={x:sp.x+1.5,z:sp.z,hp:100,maxHp:100,en:100,maxEn:100,mesh:null,ang:0,spd:sp.spd,rspd:sp.rspd,atkCd:0,ifr:0,nearZone:null,radius:0.45,
    weapon:0,armor:'none',ab:{cd:{q:0,f:0,r:0},active:{q:false,f:false,r:false},timer:{q:0,f:0,r:0}}};
  WORLD.players.set(id,p);this.peers.set(id,transport);return p;
};
SESSION.removePeer=function(id){WORLD.players.delete(id);this.peers.delete(id);this.inputs.delete(id);};
SESSION.pollPeers=function(){
  this.peers.forEach(function(tr,id){
    tr.poll().forEach(function(m){if(m.t==='input')SESSION.inputs.set(id,m.cmd);});   // id'yi taşıma belirler, mesaj değil
  });
};
SESSION.afterTick=function(){
  if(this.peers.size===0||gt%SNAP_ARALIK!==0)return;
  const msg={t:'snap',s:snapshot()};
  this.peers.forEach(function(tr){tr.send(msg);});
};

// ── İstemci tarafı ──
class ClientView{
  constructor(transport){this.tr=transport;this.buf=[];this.last=null;}
  sendInput(cmd){this.tr.send({t:'input',cmd:cmd});}
  poll(nowMs){
    const self=this;
    this.tr.poll().forEach(function(m){if(m.t==='snap'){self.buf.push({at:nowMs,s:m.s});self.last=m.s;}});
    while(this.buf.length>20)this.buf.shift();
  }
  // Çizim anı için dünya: iki özet arasında doğrusal geçiş
  view(nowMs){
    const target=nowMs-GORUNTU_GECIKME,b=this.buf;
    if(b.length===0)return null;
    let i=b.length-1;while(i>0&&b[i].at>target)i--;
    const a=b[i],c=b[Math.min(i+1,b.length-1)];
    const k=(c.at===a.at)?0:Math.max(0,Math.min(1,(target-a.at)/(c.at-a.at)));
    function mix(la,lc){
      const map=new Map(lc.map(function(o){return [o.id,o];}));
      return la.filter(function(o){return map.has(o.id);}).map(function(o){const n=map.get(o.id);return Object.assign({},n,{x:o.x+(n.x-o.x)*k,z:o.z+(n.z-o.z)*k});});
    }
    return {t:c.s.t,wave:c.s.wave,kills:c.s.kills,map:c.s.map,p:mix(a.s.p,c.s.p),e:mix(a.s.e,c.s.e),b:c.s.b,l:c.s.l};
  }
}
