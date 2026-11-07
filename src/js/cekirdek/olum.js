// ═══════════════════════════════════════════════════════
// ÖLÜM, CANLANDIRMA, YENİDEN DOĞMA (kooperatif)
// Tek kişilik: oyuncu ölünce oyun biter (eskisi gibi).
// Çok oyunculu: düşen oyuncu yerde kalır; hayattaki yoldaş 2 sn yanında durursa canlanır (%50 can),
// 30 sn içinde canlandırılmazsa kendiliğinden %40 canla kalkar. Herkes düşerse oyun biter.
// Yalnızca host çalıştırır; durum özete (d, rv) yazılır.
// ═══════════════════════════════════════════════════════
const OLUM={CANLANDIRMA_TIK:120,BEKLEME_TIK:1800,MESAFE:2.4};

function oyuncuKimligi(p){let r=null;WORLD.players.forEach(function(q,id){if(q===p)r=id;});return r;}
function hayattaOyuncuVar(){let v=false;WORLD.players.forEach(function(q){if(q.hp>0)v=true;});return v;}

// Bir oyuncunun canı 0'a düştüğünde çağrılır (hasar veren her yer)
function oyuncuOldu(p){
  if(p.hp>0)return;
  p.hp=0;p.downT=0;p.rev=0;
  if(!hayattaOyuncuVar()){oyunBitti();return;}
  if(p===pl)lootPop('☠ Yere düştün! Yoldaşın seni canlandırabilir');
  else lootPop('☠ '+oyuncuKimligi(p)+' yere düştü — yanına git!');
}

function oyunBitti(){
  if(SESSION.peers)SESSION.peers.forEach(function(tr){try{tr.send({t:'over',k:kills,w:wave});}catch(e){}});
  playing=false;showDeath();
}

function oyuncuCanlandir(p,oran){
  p.hp=Math.max(1,Math.round(p.maxHp*oran));p.ifr=120;p.downT=0;p.rev=0;
  if(p.mesh){p.mesh.rotation.x=0;p.mesh.position.y=0;}
  addFX(p.x,p.z,0x66ff99,10);
  lootPop(p===pl?'✚ Canlandın!':'✚ '+oyuncuKimligi(p)+' canlandı');
}

// Her tikte (host): düşenleri say, yanında hayattaki varsa canlandırma ilerler
function canlandirmaTik(){
  WORLD.players.forEach(function(p){
    if(p.hp>0)return;
    p.downT=(p.downT||0)+1;
    let yakin=false;
    WORLD.players.forEach(function(q){if(q!==p&&q.hp>0&&Math.hypot(q.x-p.x,q.z-p.z)<OLUM.MESAFE)yakin=true;});
    p.rev=yakin?(p.rev||0)+1:Math.max(0,(p.rev||0)-2);
    if(p.rev>=OLUM.CANLANDIRMA_TIK)oyuncuCanlandir(p,.5);
    else if(p.downT>=OLUM.BEKLEME_TIK)oyuncuCanlandir(p,.4);
    else if(p.mesh){p.mesh.rotation.x=-1.4;p.mesh.position.y=.35;}
  });
}

// "Düştün" göstergesi (yerel oyuncu için; host kendi p'sinden, istemci özetten besler)
function dususGoster(dusmus,ilerleme){
  const kutu=document.getElementById('downBox');if(!kutu)return;
  kutu.style.display=dusmus?'block':'none';
  const f=document.getElementById('downFl');if(f)f.style.width=Math.min(100,ilerleme/OLUM.CANLANDIRMA_TIK*100)+'%';
}
