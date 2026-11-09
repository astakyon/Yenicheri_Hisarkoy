// ═══════════════════════════════════════════════════════
// BAĞLANTI VE LOBİ — PeerJS taşıması, oda kur / odaya katıl
// Host tarayıcısı oda kodunu alır (yenicheri-KOD), katılan tarayıcı bu koda bağlanır. Oyun trafiği doğrudan
// cihazlar arasında (WebRTC) akar; eşleştirme için PeerJS bulutu, zor ağlar için TURN (window.YC_ICE) kullanılır.
// Test için kendi sinyal sunucusu: adres sonuna ?peer=127.0.0.1:9000
// ═══════════════════════════════════════════════════════
const ODA={host:false,kod:null,peer:null,durum:'yok',baglantiTipi:null};
const KOD_HARFLERI='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 0/O, 1/I karışmasın

function yeniOdaKodu(){let k='';for(let i=0;i<5;i++)k+=KOD_HARFLERI[Math.floor(Math.random()*KOD_HARFLERI.length)];return k;}
function peerSecenekleri(){
  const m=/[?&]peer=([^:&]+):(\d+)/.exec(location.search);
  const o={debug:0,config:{iceServers:window.YC_ICE||[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}};
  if(m){o.host=m[1];o.port=+m[2];o.path='/';o.secure=false;}
  return o;
}

class PeerTransport{
  constructor(conn){
    this.conn=conn;this.kuyruk=[];this.kapali=false;
    const self=this;
    conn.on('data',function(d){self.kuyruk.push(d);});
    conn.on('close',function(){self.kapali=true;});
    conn.on('error',function(){self.kapali=true;});
  }
  send(msg){if(this.conn.open)this.conn.send(msg);}
  poll(){const m=this.kuyruk;this.kuyruk=[];return m;}
  close(){try{this.conn.close();}catch(e){}this.kapali=true;}
}

// Gecikme ve kayıp benzetimi: gerçek taşımayı sarar. Yalnızca test ve ayar içindir (F3'te gerçek cihazla doğrulanır).
class LagTransport{
  constructor(ic,gecikmeMs,kayip){this.ic=ic;this.g=gecikmeMs||0;this.kayip=kayip||0;this.gelen=[];this.giden=[];this.kapali=false;this.kuyruk=[];}
  send(m){if(Math.random()<this.kayip)return;this.giden.push({at:performance.now()+this.g,m:m});}
  poll(){
    const t=performance.now();
    while(this.giden.length&&this.giden[0].at<=t)this.ic.send(this.giden.shift().m);
    this.ic.poll().forEach(function(m){if(Math.random()<this.kayip&&m.t==='snap')return;this.gelen.push({at:t+this.g,m:m});},this);
    const out=[];
    while(this.gelen.length&&this.gelen[0].at<=t)out.push(this.gelen.shift().m);
    return out;
  }
  get kapaliMi(){return this.ic.kapali;}
  close(){this.ic.close();}
}

function coopDurum(t,renk){const e=document.getElementById('coopDurum');if(e){e.textContent=t;e.style.color=renk||'#D4B896';}}

// ── HOST: oda kur ──
function odaKur(deneme){
  if(typeof Peer==='undefined'||typeof RTCPeerConnection==='undefined'){coopDurum('Çok oyunculu bu sayfada çalışmıyor. GitHub Pages adresinde ya da yüklenmiş uygulamada dene.','#ff8a7a');return;}
  if(ODA.peer){coopDurum('Oda zaten açık: '+ODA.kod,'#FFD700');return;}
  deneme=deneme||0;
  const kod=yeniOdaKodu();
  coopDurum('Oda kuruluyor…');
  const peer=new Peer('yenicheri-'+kod,peerSecenekleri());
  ODA.peer=peer;
  peer.on('open',function(){
    ODA.host=true;ODA.kod=kod;ODA.durum='acik';
    document.getElementById('coopKod').textContent=kod;
    document.getElementById('coopKodSatiri').style.display='block';
    coopDurum('Oda açık. Arkadaşların bu kodu "Odaya Katıl"a yazsın.','#9fe39f');
    if(!playing)BEGIN('kisla');
    lootPop('👥 Oda kodu: '+kod);
  });
  peer.on('connection',function(conn){
    conn.on('open',function(){
      const tr=new PeerTransport(conn);
      const id=SESSION.acceptPeer(tr);
      if(id){lootPop('👥 Oyuncu katıldı: '+id);ODA.durum='dolu';}
      else setTimeout(function(){tr.close();},500);
    });
  });
  peer.on('error',function(e){
    if(e&&e.type==='unavailable-id'&&deneme<5){try{peer.destroy();}catch(x){}ODA.peer=null;odaKur(deneme+1);return;}
    const t=e&&e.type;
    coopDurum(t==='network'||t==='server-error'||t==='socket-error'?'Eşleştirme sunucusuna ulaşılamadı. İnternet bağlantını kontrol et (bu sayfada kısıtlı olabilir).':'Oda kurulamadı: '+(t||e),'#ff8a7a');ODA.peer=null;
  });
  peer.on('disconnected',function(){ODA.durum='sinyalsiz';try{peer.reconnect();}catch(x){}});
}

function odaKapat(){
  if(ODA.peer){const pe=ODA.peer;setTimeout(function(){try{pe.destroy();}catch(e){}},400);}
  SESSION.peers.forEach(function(tr,id){try{tr.send({t:'bye'});}catch(e){}setTimeout(function(){try{tr.close();}catch(e){}},300);SESSION.removePeer(id);});
  SESSION.offline.forEach(function(o,id){SESSION.removePeer(id);});
  ODA.peer=null;ODA.host=false;ODA.kod=null;ODA.durum='yok';
}

// ── İSTEMCİ: odaya katıl ──
function odayaKatil(kod){
  kod=String(kod||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(kod.length!==5){coopDurum('Oda kodu 5 karakter olmalı.','#ff8a7a');return;}
  if(typeof Peer==='undefined'||typeof RTCPeerConnection==='undefined'){coopDurum('Çok oyunculu bu sayfada çalışmıyor. GitHub Pages adresinde ya da yüklenmiş uygulamada dene.','#ff8a7a');return;}
  coopDurum('Bağlanılıyor…');
  const peer=new Peer(peerSecenekleri());
  ODA.peer=peer;
  let bitti=false;
  const hata=function(t){if(bitti)return;bitti=true;coopDurum(t,'#ff8a7a');try{peer.destroy();}catch(e){}ODA.peer=null;};
  const zaman=setTimeout(function(){hata('Zaman aşımı: oda bulunamadı ya da bağlantı kurulamadı.');},15000);
  peer.on('error',function(e){clearTimeout(zaman);hata(e&&e.type==='peer-unavailable'?'Böyle bir oda yok: '+kod:'Bağlantı hatası: '+(e&&e.type||e));});
  peer.on('open',function(){
    const conn=peer.connect('yenicheri-'+kod,{reliable:true,serialization:'json'});
    conn.on('open',function(){
      const tr=new PeerTransport(conn);
      const bekle=setInterval(function(){
        const ms=tr.poll();
        for(let i=0;i<ms.length;i++){
          if(ms[i].t==='dolu'){clearInterval(bekle);clearTimeout(zaman);hata('Oda dolu (en çok 4 oyuncu).');return;}
          if(ms[i].t==='hos'){
            clearInterval(bekle);clearTimeout(zaman);bitti=true;
            // hoş geldin'den sonra gelen mesajları kaybetme
            for(let j=i+1;j<ms.length;j++)tr.kuyruk.push(ms[j]);
            document.getElementById('coopBox').style.display='none';
            ODA.host=false;ODA.kod=kod;ODA.durum='bagli';
            joinAsClient(tr,ms[i]);
            return;
          }
        }
        if(tr.kapali){clearInterval(bekle);clearTimeout(zaman);hata('Oda bağlantıyı kapattı.');}
      },50);
    });
  });
}

function coopAc(){
  document.getElementById('coopBox').style.display='flex';
  document.getElementById('coopKodSatiri').style.display=ODA.kod&&ODA.host?'block':'none';
  coopDurum(ODA.host?'Oda açık.':'Bir oda kur ya da bir koda katıl.');
}
function coopKapat(){document.getElementById('coopBox').style.display='none';}

// ── İSTEMCİ: koparsa aynı odaya anahtarıyla geri dön (8 deneme, her biri biraz daha uzun) ──
function ag_goster(g,t){const k=document.getElementById('netBox');if(!k)return;k.style.display=g?'block':'none';if(t)k.textContent=t;}
function clientYenidenBaglan(){
  if(CLIENT.baglaniyor)return true;
  if(!CLIENT.key||!ODA.kod||typeof Peer==='undefined')return false;
  CLIENT.baglaniyor=true;CLIENT.kopuk=true;
  try{if(CLIENT.tr&&CLIENT.tr.close)CLIENT.tr.close();}catch(e){}
  try{if(ODA.peer)ODA.peer.destroy();}catch(e){}
  let deneme=0;
  const dene=function(){
    if(!CLIENT.aktif||!CLIENT.baglaniyor)return;
    deneme++;
    if(deneme>8){CLIENT.baglaniyor=false;clientBaglantiKoptu();return;}
    ag_goster(true,'📡 Bağlantı koptu — yeniden bağlanılıyor… ('+deneme+'/8)');
    let bitti=false;
    const sonraki=function(){if(bitti)return;bitti=true;try{peer.destroy();}catch(e){}setTimeout(dene,800);};
    const peer=new Peer(peerSecenekleri());
    ODA.peer=peer;
    const zaman=setTimeout(sonraki,6000+deneme*2500);
    peer.on('error',function(){clearTimeout(zaman);sonraki();});
    peer.on('open',function(){
      const conn=peer.connect('yenicheri-'+ODA.kod,{reliable:true,serialization:'json'});
      conn.on('open',function(){
        const tr=new PeerTransport(conn);
        const bekle=setInterval(function(){
          if(bitti){clearInterval(bekle);return;}
          const ms=tr.poll();
          for(let i=0;i<ms.length;i++){
            if(ms[i].t==='dolu'){clearInterval(bekle);clearTimeout(zaman);sonraki();return;}
            if(ms[i].t==='hos')tr.send({t:'rejoin',id:CLIENT.id,key:CLIENT.key});
            if(ms[i].t==='rj'){
              clearInterval(bekle);clearTimeout(zaman);
              if(!ms[i].ok){bitti=true;CLIENT.baglaniyor=false;CLIENT.key=null;clientBaglantiKoptu();return;}
              bitti=true;
              for(let j=i+1;j<ms.length;j++)tr.kuyruk.push(ms[j]);
              CLIENT.tr=tr;CLIENT.gorunum=new ClientView(tr);CLIENT.bekleyen=[];CLIENT.kopuk=false;CLIENT.baglaniyor=false;
              pl.x=ms[i].x;pl.z=ms[i].z;ag_goster(false);lootPop('📶 Yeniden bağlandın');
              return;
            }
          }
          if(tr.kapali){clearInterval(bekle);clearTimeout(zaman);sonraki();}
        },50);
      });
    });
  };
  dene();
  return true;
}
