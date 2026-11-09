// ═══════════════════════════════════════════════════════
// MENÜ ANİMASYON
// ═══════════════════════════════════════════════════════
const starCv=document.getElementById('starCv'),silCv=document.getElementById('silCv'),lanCv=document.getElementById('lanCv');
const starX=starCv.getContext('2d'),silX=silCv.getContext('2d'),lanX=lanCv.getContext('2d');
let silDrawn=false,lanT=0;
function resizeMCvs(){starCv.width=window.innerWidth;starCv.height=window.innerHeight;silCv.width=window.innerWidth;silCv.height=window.innerHeight;silDrawn=false;}
window.addEventListener('resize',resizeMCvs);resizeMCvs();
const stars=Array.from({length:95},()=>({x:Math.random(),y:Math.random()*.55,r:Math.random()<.14?1.3:Math.random()<.4?.8:.5,a:Math.random(),da:(Math.random()-.5)*.015}));

// Osmanlı siluet çizimi: uzak / orta / yakın üç katman (kale surları, kuleler, camiler, minareler)
function drawSkyline(c,W,H){
  c.clearRect(0,0,W,H);
  let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const s=Math.min(1.15,Math.max(.8,H/760));
  function merlons(x,w,top,mw,mh){const n=Math.max(1,Math.floor(w/(mw*2)));const g=w/n;for(let i=0;i<n;i++)c.fillRect(x+i*g+g*.15,top-mh,g*.55,mh+1);}
  function minaret(mx,baseY,h,w){c.fillRect(mx,baseY-h,w,h+H);c.fillRect(mx-w*.45,baseY-h*.72,w*1.9,w*.55);c.beginPath();c.moveTo(mx-w*.2,baseY-h);c.lineTo(mx+w*.5,baseY-h-w*3.6);c.lineTo(mx+w*1.2,baseY-h);c.closePath();c.fill();}
  function layer(baseY,fill,alpha,hMin,hMax,lit){
    c.save();c.globalAlpha=alpha;c.fillStyle=fill;const wins=[];let x=-24*s;
    while(x<W+40){
      const t=rnd();
      if(t<.22){const bw=(74+rnd()*40)*s,bh=(36+rnd()*22)*s,r=bw*.34;c.fillRect(x,baseY-bh,bw,bh+H);
        c.beginPath();c.ellipse(x+bw/2,baseY-bh,r,r*.95,0,Math.PI,0);c.fill();c.fillRect(x+bw/2-s,baseY-bh-r*.95-10*s,2*s,10*s);
        minaret(x-7*s,baseY,(hMax+18)*s,5*s);if(rnd()<.7)minaret(x+bw+3*s,baseY,(hMax+8)*s,5*s);
        if(lit)for(let k=0;k<3;k++)wins.push([x+bw*(.2+k*.28),baseY-bh*.55,3*s,5*s]);x+=bw+20*s;}
      else if(t<.5){const tw=(26+rnd()*12)*s,th=(hMin+rnd()*(hMax-hMin))*s;c.fillRect(x,baseY-th,tw,th+H);merlons(x-2*s,tw+4*s,baseY-th,4*s,5*s);
        if(rnd()<.45){c.beginPath();c.moveTo(x-2*s,baseY-th-5*s);c.lineTo(x+tw/2,baseY-th-24*s);c.lineTo(x+tw+2*s,baseY-th-5*s);c.closePath();c.fill();}
        if(lit)wins.push([x+tw*.4,baseY-th*.7,3*s,6*s]);x+=tw+5*s;}
      else if(t<.8){const ww=(58+rnd()*58)*s,wh=Math.max(14,hMin*.55)*s;c.fillRect(x,baseY-wh,ww,wh+H);merlons(x,ww,baseY-wh,4*s,5*s);x+=ww;}
      else{const hw=(34+rnd()*18)*s,hh=(20+rnd()*14)*s;c.fillRect(x,baseY-hh,hw,hh+H);c.beginPath();c.ellipse(x+hw/2,baseY-hh,hw*.34,hw*.3,0,Math.PI,0);c.fill();
        if(lit)wins.push([x+hw*.4,baseY-hh*.7,3*s,5*s]);x+=hw+7*s;}
    }
    c.restore();
    if(lit){c.save();c.fillStyle='rgba(255,190,90,.8)';wins.forEach(w=>c.fillRect(w[0],w[1],w[2],w[3]));c.restore();}
  }
  layer(H*.60,'#34406c',.55,60,100,false);
  layer(H*.69,'#161c3c',.93,48,84,true);
  layer(H*.79,'#0a0d1f',1,30,54,false);
  c.fillStyle='#0a0d1f';c.fillRect(0,H*.79,W,H);
}
function drawMenu(){
  const W=starCv.width,H=starCv.height;
  starX.clearRect(0,0,W,H);
  stars.forEach(s=>{s.a=Math.max(.08,Math.min(1,s.a+s.da));if(Math.random()<.008)s.da=-s.da;starX.fillStyle=`rgba(255,248,210,${s.a})`;starX.beginPath();starX.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);starX.fill();});
  if(!silDrawn){silDrawn=true;drawSkyline(silX,silCv.width,silCv.height);}
  lanT+=.06;const f=.7+Math.sin(lanT)*.3+Math.sin(lanT*1.7)*.15;
  lanX.clearRect(0,0,66,106);
  lanX.fillStyle=`rgba(255,140,20,${.06*f})`;lanX.beginPath();lanX.arc(33,70,30,0,Math.PI*2);lanX.fill();
  lanX.fillStyle='#6B4010';lanX.fillRect(30,6,5,18);lanX.strokeStyle='#8B5A10';lanX.lineWidth=2;lanX.beginPath();lanX.ellipse(33,6,7,3.5,0,0,Math.PI*2);lanX.stroke();
  lanX.fillStyle='#8B5A10';lanX.beginPath();lanX.moveTo(20,24);lanX.quadraticCurveTo(33,16,46,24);lanX.lineTo(48,36);lanX.quadraticCurveTo(33,28,18,36);lanX.closePath();lanX.fill();
  lanX.fillStyle='#6B3A08';lanX.beginPath();lanX.roundRect(18,36,30,46,4);lanX.fill();
  lanX.strokeStyle='#8B5A10';lanX.lineWidth=1.4;lanX.beginPath();lanX.moveTo(33,36);lanX.lineTo(33,82);lanX.stroke();lanX.beginPath();lanX.moveTo(18,59);lanX.lineTo(48,59);lanX.stroke();
  const G=Math.floor(180+f*50);lanX.fillStyle=`rgba(255,${G},20,${.88*f})`;lanX.beginPath();lanX.ellipse(33,55,7,10,0,0,Math.PI*2);lanX.fill();
  lanX.fillStyle=`rgba(255,230,100,${.9*f})`;lanX.beginPath();lanX.ellipse(33,59,4.5,7,0,0,Math.PI*2);lanX.fill();
  lanX.fillStyle='#8B5A10';lanX.beginPath();lanX.moveTo(18,82);lanX.quadraticCurveTo(33,92,48,82);lanX.lineTo(46,90);lanX.quadraticCurveTo(33,99,20,90);lanX.closePath();lanX.fill();
  lanX.fillStyle='#6B3A08';lanX.beginPath();lanX.ellipse(33,90,11,3.5,0,0,Math.PI*2);lanX.fill();
}



// ── Arayüz ölçeği: ekran yüksekliğine göre (telefon ≥1.12, bilgisayar 1.5–1.8) ──
function uiOlcekle(){
  const h=window.innerHeight,w=window.innerWidth,r=document.documentElement.style;
  // yatay: yüksekliğe göre (telefon 1.12, PC 1.0–1.2); dikey telefon: genişliğe göre, HUD sığsın
  const m=(typeof SETTINGS!=='undefined'&&SETTINGS.uiBoyut?SETTINGS.uiBoyut:100)/100;
  // yatay telefon: yükseklikle orantılı küçülür (340px'te ~0.65); PC 1.0–1.2; dikey telefon genişliğe göre
  const u0=w>=h?(h<500?Math.max(.6,Math.min(.95,h/520)):Math.max(1.0,Math.min(1.2,h/640))):Math.max(.8,Math.min(1.4,w/560));
  const u=Math.max(.45,u0*m);
  r.setProperty('--ui',u.toFixed(3));
  r.setProperty('--uiP',(Math.max(1,Math.min(1.2,h/640))*Math.min(1,m)).toFixed(3));   // paneller (zoom)
  r.setProperty('--uiT',Math.max(.7,Math.min(1.15,u*1.05)).toFixed(3));  // dokunmatik düğmeler
}
window.addEventListener('resize',uiOlcekle);uiOlcekle();

// ── Menü kahramanı: model kütüphanesindeki yeniçeri, yavaşça dönen sahnede ──
const HERO={r:null,s:null,c:null,g:null,t:0,w:0,h:0};
function menuKahramanCiz(){
  const cv=document.getElementById('heroCv');if(!cv||typeof THREE==='undefined'||typeof modelYap!=='function')return;
  if(!HERO.r){
    try{HERO.r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});}catch(e){HERO.r=false;return;}
    HERO.r.setClearColor(0,0);HERO.r.shadowMap.enabled=false;
    HERO.s=new THREE.Scene();
    HERO.s.add(new THREE.AmbientLight(0xffe2c0,.9));
    const key=new THREE.DirectionalLight(0xffc880,2.2);key.position.set(-4,6,5);HERO.s.add(key);
    const rim=new THREE.DirectionalLight(0x6a8cff,1.4);rim.position.set(5,3,-4);HERO.s.add(rim);
    HERO.c=new THREE.PerspectiveCamera(28,1,.1,50);
    HERO.g=modelYap('yeniceri');HERO.s.add(HERO.g);
    const zem=new THREE.Mesh(new THREE.CircleGeometry(1.6,40),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35}));zem.rotation.x=-Math.PI/2;zem.position.y=.01;HERO.s.add(zem);
  }
  if(HERO.r===false)return;
  const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  if(w!==HERO.w||h!==HERO.h){HERO.w=w;HERO.h=h;HERO.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));HERO.r.setSize(w,h,false);HERO.c.aspect=w/h;HERO.c.updateProjectionMatrix();}
  HERO.t+=.016;
  HERO.g.rotation.y=(HERO.manuel!=null)?HERO.manuel:-.5+Math.sin(HERO.t*.5)*.45;
  modelAnim(HERO.g,0,0,0,0);
  HERO.c.position.set(0,1.9,7.2);HERO.c.lookAt(0,1.55,0);
  HERO.r.render(HERO.s,HERO.c);
}

// ── Telefonda yatay mod: tam ekran + yatay kilit (her dokunuşta başarana kadar denenir); dikeyde tam ekran "çevir" perdesi ──
(function(){
  const dokunmatik=window.matchMedia&&matchMedia('(pointer:coarse)').matches;if(!dokunmatik)return;
  const uyari=document.createElement('div');uyari.id='yatayUyari';
  uyari.innerHTML='<div class="yuIc"><div class="yuIk">📱⟳</div><b>Telefonu yatay çevir</b><small>Oyun yatay ekran içindir</small><button id="yuBtn" type="button">TAM EKRAN + YATAY</button><a id="yuDikey" href="#">Yine de dikey oyna</a></div>';
  document.body.appendChild(uyari);
  let kilitli=false;
  function kil(){try{const o=screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape');if(o&&o.then)o.then(function(){kilitli=true;}).catch(function(){});}catch(e){}}
  function kilitle(){
    if(kilitli)return;
    try{
      const el=document.documentElement,fs=el.requestFullscreen||el.webkitRequestFullscreen;
      const p=fs&&!document.fullscreenElement?fs.call(el):null;
      if(p&&p.then)p.then(kil).catch(kil);else kil();
    }catch(e){}
  }
  document.addEventListener('touchend',kilitle,{passive:true});document.addEventListener('click',kilitle);
  document.getElementById('yuBtn').addEventListener('click',function(e){e.stopPropagation();kilitle();});
  let dikeyOk=false;try{dikeyOk=sessionStorage.getItem('yc_dikey')==='1';}catch(e){}
  document.getElementById('yuDikey').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();dikeyOk=true;try{sessionStorage.setItem('yc_dikey','1');}catch(x){}guncelle();});
  function guncelle(){uyari.style.display=(window.innerHeight>window.innerWidth&&!dikeyOk)?'flex':'none';}
  window.addEventListener('resize',guncelle);window.addEventListener('orientationchange',guncelle);guncelle();
  kil();
})();
