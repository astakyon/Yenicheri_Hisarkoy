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
  p.key=Math.random().toString(36).slice(2,12)+Math.random().toString(36).slice(2,8);p.mesh=modelYap('yeniceri');p.mesh.position.set(p.x,0,p.z);if(typeof S3!=='undefined'&&S3)S3.add(p.mesh);
  WORLD.players.set(id,p);this.peers.set(id,transport);return p;
};
SESSION.offline=new Map();      // bağlantısı kopan ama yeniden bağlanmasını beklediğimiz oyuncular (id -> {at})
SESSION.removePeer=function(id){this.offline.delete(id);const q=WORLD.players.get(id);if(q&&q.mesh&&typeof S3!=='undefined'&&S3)S3.remove(q.mesh);WORLD.players.delete(id);this.peers.delete(id);this.inputs.delete(id);this.cmdQ.delete(id);this.acks.delete(id);};
SESSION.cmdQ=new Map();          // oyuncu id -> bekleyen girdi komutları (sıralı)
SESSION.acks=new Map();          // oyuncu id -> işlenen son girdi numarası (istemci tahmini bununla düzeltilir)
SESSION.actions=[];              // saldırı gibi tek seferlik eylemler
SESSION.nextPeer=1;
SESSION.pollPeers=function(){
  this.peers.forEach(function(tr,id){
    tr.poll().forEach(function(m){
      // id'yi taşıma belirler, mesaj değil
      if(m.t==='input'){let q=SESSION.cmdQ.get(id);if(!q){q=[];SESSION.cmdQ.set(id,q);}if(q.length<30)q.push({seq:m.seq,cmd:m.cmd});}
      else if(m.t==='act'){if(SESSION.actions.length<60)SESSION.actions.push({id:id,m:m});}
      else if(m.t==='bye'){SESSION.byeId=SESSION.byeId||[];SESSION.byeId.push(id);}
      else if(m.t==='hi')SESSION.hello(id,m);
      else if(m.t==='rejoin')SESSION.rejoin(id,m);
    });
  });
};
// Bir tikte her uzak oyuncunun bir (birikmişse iki) komutunu uygular; sonra eylemleri işler
SESSION.stepPeers=function(dt){
  this.cmdQ.forEach(function(q,id){
    const p=WORLD.players.get(id);if(!p){return;}
    let n=q.length>4?2:1;
    while(n-->0&&q.length){const c=q.shift();if(p.hp>0)movePlayer(p,c.cmd,dt);if(c.seq!==undefined)SESSION.acks.set(id,c.seq);}
  });
  const acts=this.actions;this.actions=[];
  acts.forEach(function(a){
    const p=WORLD.players.get(a.id);if(!p||p.hp<=0)return;
    if(a.m.k==='melee')doMelee(p);
    else if(a.m.k==='ab'&&['q','f','r'].indexOf(a.m.key)>=0)useAbility(a.m.key,p);
    else if(a.m.k==='ranged'){p.weapon=a.m.w|0;doRanged(p,{x:+a.m.ax||p.x,z:+a.m.az||p.z});}
  });
};
// İstemcinin el sıkışma bilgisi: yetenek seviyeleri, zırh, azami can (host sınırlar içinde kabul eder)
SESSION.hello=function(id,m){
  const p=WORLD.players.get(id);if(!p)return;
  const ab={};['q','f','r'].forEach(function(k){ab[k]=Math.max(0,Math.min(5,((m.ab&&m.ab[k])|0)));});
  p.abLv=ab;
  if(['none','leather','chain','plate','ottoman'].indexOf(m.armor)>=0)p.armor=m.armor;
  const mh=Math.max(60,Math.min(500,+m.mh||100));p.maxHp=mh;p.hp=mh;
  if(m.g){
    p.gor=gorunumTemizle(m.g);
    if(p.mesh&&typeof S3!=='undefined'&&S3){try{S3.remove(p.mesh);}catch(e){}p.mesh=modelYap('yeniceri',{g:p.gor});p.mesh.position.set(p.x,0,p.z);S3.add(p.mesh);}
  }
  SESSION.gorunumYay();
};
// Herkesin görünümünü tüm istemcilere yollar (katılma / yeniden bağlanma anında)
SESSION.gorunumYay=function(){
  const l={};
  WORLD.players.forEach(function(p,id){l[id]=p.gor||(p===pl?gorunumOku():null);});
  this.peers.forEach(function(tr){try{tr.send({t:'look',l:l});}catch(e){}});
};
// Bağlantı kopunca oyuncu hemen silinmez: 60 sn dokunulmaz ve hareketsiz bekler, aynı anahtarla dönerse devam eder
// Host yeni bir haritaya geçti (veya sahne yenilendi): uzak oyuncular başlangıç noktasına yakın, tam canla, yeni sahnede
SESSION.haritaDegisti=function(){
  let k=0;
  WORLD.players.forEach(function(p,id){
    if(p===pl)return;
    k++;p.x=pl.x+1.5*k;p.z=pl.z;p.hp=p.maxHp;p.en=p.maxEn;p.ifr=120;p.downT=0;p.rev=0;
    if(p.mesh&&typeof S3!=='undefined'&&S3)try{S3.remove(p.mesh);}catch(e){}
    p.mesh=modelYap('yeniceri',{g:p.gor});p.mesh.position.set(p.x,0,p.z);S3.add(p.mesh);
    SESSION.cmdQ.delete(id);
  });
};
SESSION.dusur=function(id){
  const p=WORLD.players.get(id);this.peers.delete(id);this.cmdQ.delete(id);
  if(!p){return;}
  p.ifr=4000;this.offline.set(id,{at:gt});
  lootPop('📡 '+id+' bağlantısı koptu — 60 sn beklenir');
};
// Yeni bir bağlantı eski oyuncunun anahtarını getirirse onun yerine geçer
SESSION.rejoin=function(yeniId,m){
  const tr=this.peers.get(yeniId),p=WORLD.players.get(String(m.id));
  if(!tr)return;
  if(!p||String(m.id)===yeniId||!p.key||p.key!==m.key||this.peers.size>8&&false){tr.send({t:'rj',ok:false});return;}
  const eski=this.peers.get(m.id);if(eski&&eski!==tr){try{eski.close();}catch(e){}}
  // geçici yeni oyuncuyu sil
  const g=WORLD.players.get(yeniId);if(g&&g.mesh&&typeof S3!=='undefined'&&S3)S3.remove(g.mesh);
  WORLD.players.delete(yeniId);this.peers.delete(yeniId);this.cmdQ.delete(yeniId);this.acks.delete(yeniId);this.inputs.delete(yeniId);
  this.peers.set(m.id,tr);this.offline.delete(m.id);this.cmdQ.delete(m.id);
  p.ifr=120;
  tr.send({t:'rj',ok:true,id:m.id,x:p.x,z:p.z,hp:p.hp,mh:p.maxHp});
  lootPop('📶 '+m.id+' yeniden bağlandı');SESSION.gorunumYay();
};
SESSION.acceptPeer=function(transport){
  if(WORLD.players.size>=4){transport.send({t:'dolu'});return null;}
  const id='c'+(this.nextPeer++);
  const p=this.addPeer(id,transport);
  const sp=localPlayer();
  transport.send({t:'hos',id:id,key:p.key,map:currentMap,spd:sp.spd,rspd:sp.rspd,x:p.x,z:p.z});
  return id;
};
SESSION.afterTick=function(){
  if(this.byeId){const b=this.byeId;this.byeId=null;b.forEach(function(id){if(WORLD.players.has(id)){SESSION.removePeer(id);lootPop('👥 Oyuncu ayrıldı: '+id);}});}
  this.peers.forEach(function(tr,id){if(tr.kapali)SESSION.dusur(id);});
  this.offline.forEach(function(o,id){if(gt-o.at>3600){SESSION.removePeer(id);lootPop('👥 Oyuncu ayrıldı: '+id);}});
  if(this.peers.size===0||gt%SNAP_ARALIK!==0)return;
  const msg={t:'snap',s:ozetPakla(snapshot())};
  this.peers.forEach(function(tr){tr.send(msg);});
};

// ── İstemci tarafı ──
class ClientView{
  constructor(transport){this.tr=transport;this.buf=[];this.last=null;}
  sendInput(cmd){this.tr.send({t:'input',cmd:cmd});}
  poll(nowMs){
    const self=this;
    this.tr.poll().forEach(function(m){if(m.t==='snap'){const o=ozetAc(m.s);self.buf.push({at:nowMs,s:o});self.last=o;}else if(m.t==='look'){self.looks=m.l||{};self.lookYeni=true;}else if(m.t==='over')self.over=m;else if(m.t==='bye')self.bye=true;});
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
