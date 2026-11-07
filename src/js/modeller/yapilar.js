// ═══════════════════════════════════════════════════════
// YAPI VE ÇEVRE MODELLERİ — model kütüphanesinde "Yapı" ve "Çevre" grupları
// Her yapı tek birleşik geometridir (köşe renkli, 1 çizim çağrısı). Boyutlar opsiyonla verilir:
// modelYap('yapi_ev',{w:6,d:5}). Kışla haritası bu modelleri kullanır; çarpışma kutusu haritada ayrıca eklenir.
// ═══════════════════════════════════════════════════════
const _YG=[];   // geçici parça listesi (her yapi fonksiyonu başında sıfırlanır)
function _yk(w,h,d,c,x,y,z,rx,ry,rz){_YG.push([_g('BoxGeometry',w,h,d),c,x,y,z,rx||0,ry||0,rz||0]);}
function _ysil(r1,r2,h,c,x,y,z,n,sx,sz){_YG.push([_g('CylinderGeometry',r1,r2,h,n||12),c,x,y,z,0,0,0,sx||1,1,sz||1]);}
function _yk2(r,c,x,y,z,sx,sy,sz,yarim){_YG.push([yarim?_g('SphereGeometry',r,16,8,0,Math.PI*2,0,Math.PI/2):_g('SphereGeometry',r,12,8),c,x,y,z,0,0,0,sx||1,sy||1,sz||1]);}
function _ykoni(r,h,c,x,y,z,n,ry,sx,sz){_YG.push([_g('ConeGeometry',r,h,n||8),c,x,y,z,0,ry||0,0,sx||1,1,sz||1]);}
function _ybitir(){const gm=_birles(_YG);_YG.length=0;const m=new THREE.Mesh(gm,_vm());m.castShadow=true;m.receiveShadow=true;const g=new THREE.Group();g.add(m);g.userData.govde=m;g.userData.yapi=true;return g;}
// duvar yüzeyine pencere (ön:+z, arka:-z, yan:±x). yon: 0 ön, 1 arka, 2 sağ, 3 sol
function _ypencere(x,y,w,h,yon,d,hw,hd,kasa){
  const k=kasa||0x6a4a2a,z0=yon===0?hd+.03:-hd-.03;
  if(yon<2){const z=yon===0?hd+.04:-hd-.04;_yk(w+.16,h+.16,.06,k,x,y,z);_yk(w,h,.08,0x1a2433,x,y,z+(yon===0?.02:-.02));_yk(w+.3,.1,.14,0xC9B79A,x,y-h/2-.1,z);_yk(.05,h,.1,k,x,y,z+(yon===0?.04:-.04));}
  else{const xx=yon===2?hw+.04:-hw-.04;_yk(.06,h+.16,w+.16,k,xx,y,x);_yk(.08,h,w,0x1a2433,xx+(yon===2?.02:-.02),y,x);}
}
function _ykapi(x,z,yon,w,h,renk){const zz=yon>0?z+.05:z-.05;_yk(w+.4,h+.2,.12,0xC9B79A,x,h/2+.1,zz);_yk(w,h,.14,renk||0x3a1a08,x,h/2,zz+yon*.02);_ysil(w/2,w/2,.14,renk||0x3a1a08,x,h,zz+yon*.02,12,1,1);_YG[_YG.length-1][5]=Math.PI/2;_YG[_YG.length-1][7]=0;_yk(.08,.1,.1,0xD4A82A,x+w*.3,h*.5,zz+yon*.1);}
function _ykrenel(w,d,y,c,dc){ // kale burç dişleri
  const n=Math.max(2,Math.round(w/1.1));for(let i=0;i<n;i++){const x=-w/2+(i+.5)*w/n;_yk(.55,.7,.5,c,x,y+.35,d/2-.25);_yk(.55,.7,.5,c,x,y+.35,-d/2+.25);}
  const m=Math.max(2,Math.round(d/1.1));for(let i=1;i<m-1;i++){const z=-d/2+(i+.5)*d/m;_yk(.5,.7,.55,c,w/2-.25,y+.35,z);_yk(.5,.7,.55,c,-w/2+.25,y+.35,z);}
}

function _yapiEv(o){
  const w=o.w||6,d=o.d||5,h=o.h||3.2,duvar=o.duvar||0xE2CFA6,cati=o.cati||0x9a3a1a;
  _yk(w+.2,.6,d+.2,0x8a8478,0,.3,0);                             // taş temel
  _yk(w,h,d,duvar,0,.6+h/2,0);                                    // zemin kat
  for(let i=0;i<4;i++){_yk(w+.04,.12,.06,0x6a4a2a,0,1.2+i*.9,d/2+.04);}                // hatıl
  _yk(w+.7,1.5,d+.7,0xB89060,0,.6+h+.75,0);                       // cumba (üst kat çıkması)
  [-1,1].forEach(function(s){for(let i=0;i<3;i++)_yk(.14,.9,.14,0x6a4a2a,s*(w/2+.2),.6+h-.1,-d/2+.6+i*(d-1.2)/2,0,0,s*.5);});
  const rh=Math.max(1.6,Math.min(w,d)*.55),ry=.6+h+1.5;
  _yk(w+1.2,.18,d+1.2,0x6a3a1a,0,ry,0);                           // saçak
  _YG.push([_g('ConeGeometry',1,rh,4),cati,0,ry+rh/2,0,0,Math.PI/4,0,(w+1.0)*.7071,1,(d+1.0)*.7071]);
  for(let i=1;i<4;i++)_YG.push([_g('ConeGeometry',1,rh,4),0x7a2a10,0,ry+rh/2-.02,0,0,Math.PI/4,0,(w+1.04)*.7071*(1-.0),1,(d+1.04)*.7071*(1)]); _YG.length-=3;
  _yk(.6,1.4,.6,0x7a7468,w*.28,ry+rh*.7,-d*.15);                  // baca
  _yk(.75,.12,.75,0x5a544a,w*.28,ry+rh*.7+.74,-d*.15);
  _ykapi(o.kapiX!==undefined?o.kapiX:-w*.2,d/2,1,1.1,2.1);
  [w*.22,-w*.34].forEach(function(x){_ypencere(x,.6+h*.55,.8,1.0,0,d,w/2,d/2);});
  [w*.25,-w*.25].forEach(function(x){_ypencere(x,.6+h+.75,.7,.7,0,d,w/2,d/2);});
  [-d*.18,d*.2].forEach(function(z){_ypencere(z,.6+h*.55,.7,.9,2,d,w/2,d/2);_ypencere(z,.6+h*.55,.7,.9,3,d,w/2,d/2);});
  return _ybitir();
}
function _yapiKisla(o){   // kışla/cebehane/ordu binası: kalın duvar, burç dişleri, kapı kemeri, sancak
  const w=o.w||12,d=o.d||9,h=o.h||5,duvar=o.duvar||0x8B6048,tas=0x6a5a48;
  _yk(w+.4,.8,d+.4,tas,0,.4,0);
  _yk(w,h,d,duvar,0,h/2+.4,0);
  _yk(w+.5,.4,d+.5,0x4a3a2c,0,h+.6,0);
  _ykrenel(w+.4,d+.4,h+.8,tas);
  for(let i=0;i<Math.floor(w/3.2);i++){const x=-w/2+(i+.5)*w/Math.floor(w/3.2);_yk(.5,.9,.1,0x120c06,x,h*.62,d/2+.02);_yk(.5,.9,.1,0x120c06,x,h*.62,-d/2-.02);}
  [-1,1].forEach(function(sx){[-1,1].forEach(function(sz){_yk(1.2,h+1.4,1.2,tas,sx*(w/2),(h+1.4)/2+.4,sz*(d/2));});});
  _ykapi(o.kapiX!==undefined?o.kapiX:0,d/2,1,1.8,2.9,0x2a1408);
  _yk(3.2,.6,.14,0x5a2800,o.kapiX||0,4.0,d/2+.14);
  _ysil(.05,.05,3.2,0x4a3a2a,-w/2+.4,h+2.6,0,6);_yk(1.3,.8,.04,0xB01818,-w/2+1.05,h+3.3,0);
  return _ybitir();
}
function _yapiCami(o){
  const w=o.w||9,d=o.d||9,h=o.h||5,tas=0xE8DCC0,kubbe=0x6a7a8a;
  _yk(w+.5,.6,d+.5,0xB8AC90,0,.3,0);
  _yk(w,h,d,tas,0,h/2+.6,0);
  for(let i=0;i<3;i++){_yk(.9,1.8,.1,0x2a3a5a,-w*.3+i*w*.3,h*.55+.6,d/2+.04);_ysil(.45,.45,.1,0x2a3a5a,-w*.3+i*w*.3,h*.55+1.5,d/2+.04,10);_YG[_YG.length-1][5]=Math.PI/2;}
  const r=Math.min(w,d)*.36;
  _ysil(r*1.05,r*1.05,1.1,tas,0,h+1.15,0,20);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;_yk(.35,.5,.1,0x2a3a5a,Math.sin(a)*r*1.06,h+1.2,Math.cos(a)*r*1.06,0,a,0);}
  _yk2(r,kubbe,0,h+1.7,0,1,1.05,1,true);
  _ysil(.05,.05,1.1,0xD4A82A,0,h+1.7+r*1.05+.5,0,6);_yk2(.16,0xD4A82A,0,h+1.7+r*1.05+1.05,0,1,1,1);
  [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(function(s){_yk2(r*.42,kubbe,s[0]*w*.36,h+.6,s[1]*d*.36,1,1,1,true);});
  const mx=-w/2-1.5,mz=0,mh=h+8;
  _ysil(.55,.62,mh,0xE8DCC0,mx,mh/2+.3,mz,12);
  _ysil(.95,.95,.22,0xC9B79A,mx,h+4.2,mz,12);_ysil(.8,.8,.16,0xB8AC90,mx,h+4.0,mz,12);       // şerefe
  _ysil(.5,.5,2.6,0xE8DCC0,mx,h+5.6,mz,12);
  _ykoni(.72,3.2,kubbe,mx,h+8.9,mz,12);
  _yk2(.1,0xD4A82A,mx,h+10.6,mz,1,1,1);
  _ykapi(0,d/2,1,1.6,2.8,0x3a1a08);
  return _ybitir();
}
function _yapiHamam(o){
  const w=o.w||16,d=o.d||16,h=o.h||4.2,tas=0xB8AC90,kub=0xC8B878;
  _yk(w+.4,.6,d+.4,0x8a8478,0,.3,0);
  _yk(w,h,d,tas,0,h/2+.6,0);
  const r=Math.min(w,d)*.3;
  _ysil(r*1.08,r*1.08,.7,tas,0,h+.95,0,20);
  _yk2(r,kub,0,h+1.3,0,1,1,1,true);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;_yk2(.09,0x1a1a1a,Math.sin(a)*r*.55,h+1.3+r*.82,Math.cos(a)*r*.55,1,1,1);}   // ışık delikleri
  _yk2(.18,0xD4A82A,0,h+1.3+r,0,1,1,1);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){_ysil(1.5,1.5,.5,tas,s[0]*w*.3,h+.85,s[1]*d*.3,14);_yk2(1.45,kub,s[0]*w*.3,h+1.1,s[1]*d*.3,1,1,1,true);_yk2(.1,0xD4A82A,s[0]*w*.3,h+2.55,s[1]*d*.3,1,1,1);});
  _yk(.9,3.2,.9,0x7a7468,w*.4,h+2.1,-d*.38);
  for(let i=0;i<4;i++)_yk(1.4,1.1,.1,0x1a2a3a,-w*.3+i*w*.2,h*.55+.6,d/2+.04);
  _ykapi(o.kapiX!==undefined?o.kapiX:0,d/2,1,1.8,2.8,0x3a1800);
  return _ybitir();
}
function _yapiKervansaray(o){
  const w=o.w||25,d=o.d||14,h=o.h||5,duvar=0x6a5230;
  _yk(w,.2,d,0xC8B080,0,.1,0);                                  // avlu zemini
  _yk(w,h,1.5,duvar,0,h/2,-d/2+.75);_yk(w,h,1.5,duvar,0,h/2,d/2-.75);
  _yk(1.5,h,d,duvar,-w/2+.75,h/2,0);_yk(1.5,h,d,duvar,w/2-.75,h/2,0);
  _yk(w+.4,.4,1.9,0x4a3a2a,0,h+.2,-d/2+.75);_yk(w+.4,.4,1.9,0x4a3a2a,0,h+.2,d/2-.75);
  _yk(1.9,.4,d,0x4a3a2a,-w/2+.75,h+.2,0);_yk(1.9,.4,d,0x4a3a2a,w/2-.75,h+.2,0);
  for(let i=0;i<Math.floor(w/3.4);i++){const x=-w/2+2+i*(w-4)/(Math.floor(w/3.4)-1);_ysil(.18,.18,3,0xB8AC90,x,1.7,-d/2+2.1,8);_yk2(.4,0x8a7a5a,x,3.3,-d/2+2.1,1,.5,1);}
  _yk(w-3,.4,1.2,0x8B3010,0,3.4,-d/2+2.1);
  _yk(3.4,h+1.6,2,0xA89060,0,(h+1.6)/2,d/2-.75);                // portal
  _ysil(1.1,1.1,2.1,0x2a1408,0,3.0,d/2+.35,16,1,.1);_YG[_YG.length-1][5]=Math.PI/2;
  _yk(1.8,2.8,.2,0x2a1408,0,1.4,d/2+.3);
  _yk(4.2,.7,.2,0x5a2800,0,h+.2,d/2+.4);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){_ysil(1.2,1.4,h+3,0x8a7250,s[0]*(w/2-.4),(h+3)/2,s[1]*(d/2-.4),8);_ykoni(1.5,1.8,0x4a3828,s[0]*(w/2-.4),h+3.9,s[1]*(d/2-.4),8);});
  for(let i=0;i<6;i++){_yk(1,.8,.7,0x8a6a3a,-w*.3+i*2.1,.5,d*.1);}      // yük balyaları
  return _ybitir();
}
function _yapiDukkan(o){   // çarşı tezgâhı
  const w=o.w||3.4,d=o.d||1.8,h=o.h||2.8,ren=o.renk||[0xB02020,0xE8DCC0];
  _yk(w,.9,d*.6,0x6B4A28,0,.45,d*.2);
  _yk(w,.1,d*.7,0x8a6a3a,0,.95,d*.2);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){_yk(.14,h,.14,0x4a3018,s[0]*(w/2-.07),h/2,s[1]*(d/2-.07));});
  const n=8;for(let i=0;i<n;i++)_yk(w/n,.06,d+.5,ren[i%2],-w/2+(i+.5)*w/n,h+.12-(.0),0.05,.35,0,0);
  _yk(w,.05,.5,0x4a3018,0,h-.2,-d/2-.1);
  for(let i=0;i<4;i++)_yk2(.22,[0xC83030,0xE0A020,0x4a8030,0xD06020][i],-w*.3+i*w*.2,1.2,d*.2,1,.9,1);
  _yk(.5,.5,.5,0x8a6a3a,w*.38,.25,d*.55);_yk(.45,.4,.45,0x7a5a2a,-w*.4,.2,d*.55);
  return _ybitir();
}
function _yapiKule(o){
  const r=o.r||2.2,h=o.h||9;
  _ysil(r*1.15,r*1.25,1.2,0x7a7468,0,.6,0,16);
  _ysil(r,r*1.1,h,0xB09060,0,h/2+.6,0,16);
  _ysil(r*1.3,r*1.15,.9,0x8a7250,0,h+1.05,0,16);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;_yk(.7,.8,.5,0x8a7250,Math.sin(a)*r*1.2,h+1.9,Math.cos(a)*r*1.2,0,a,0);}
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;_yk(.22,1,.15,0x120c06,Math.sin(a)*r*1.0,h*.6,Math.cos(a)*r*1.0,0,a,0);}
  _ykoni(r*1.1,3,0x8B3010,0,h+3,0,16);
  _ysil(.04,.04,2,0x4a3a2a,0,h+5.4,0,6);_yk(1,.6,.04,0xB01818,.5,h+6,0);
  return _ybitir();
}
function _yapiSur(o){
  const w=o.w||10,h=o.h||5,d=o.d||2.4;
  _yk(w,h,d,0xC8A870,0,h/2,0);_yk(w+.1,.3,d+.4,0xB09060,0,h+.15,0);
  const n=Math.max(2,Math.round(w/1.4));for(let i=0;i<n;i++)_yk(.8,.8,d*.5,0xC8A870,-w/2+(i+.5)*w/n,h+.7,-d*.2);
  for(let i=0;i<Math.max(2,Math.round(w/3));i++)_yk(.14,.7,.1,0x1a1208,-w/2+1.5+i*3,h*.5,d/2+.02);
  return _ybitir();
}
function _yapiCit(o){
  const w=o.w||6;_yk(w,.12,.12,0x6B4A0C,0,.8,0);_yk(w,.12,.12,0x6B4A0C,0,.45,0);
  const n=Math.max(2,Math.round(w/.9));for(let i=0;i<=n;i++){const x=-w/2+i*w/n;_yk(.14,1.2,.14,0x5a3a10,x,.6,0);_ykoni(.1,.2,0x5a3a10,x,1.3,0,4);}
  return _ybitir();
}
function _yapiMasa(o){ // talim kuklası
  _ysil(.08,.08,1.9,0x6B3A15,0,.95,0,6);_yk(.7,1.0,.3,0xD4A050,0,1.9,0);_yk(1.2,.14,.14,0x6B3A15,0,2.15,0);_yk2(.33,0xD4A050,0,2.7,0);_yk(.5,.1,.5,0x4a3010,0,.05,0);
  return _ybitir();
}
function _yapiAgac(o){   // meşe/çınar
  const h=o.h||5;
  _ysil(.28,.42,h*.55,0x5a3a1a,0,h*.275,0,8);
  [[0,h*.78,0,1.9],[1.1,h*.62,.3,1.3],[-1.0,h*.66,-.4,1.35],[.2,h*.95,-.9,1.1],[-.3,h*.9,.9,1.2]].forEach(function(b,i){_yk2(b[3],[0x3a7a2a,0x2f6a22,0x4a8a32,0x336f26,0x3d7d2c][i],b[0],b[1],b[2],1,.85,1);});
  _ysil(.1,.12,1,0x5a3a1a,.55,h*.5,.2,5);_YG[_YG.length-1][7]=-.9;
  return _ybitir();
}
function _yapiCam(o){    // çam
  const h=o.h||6.5;
  _ysil(.2,.3,h*.3,0x5a3a1a,0,h*.15,0,7);
  for(let i=0;i<4;i++)_ykoni(1.9-i*.4,h*.32,[0x1f5a2a,0x266a30,0x2d7a38,0x347f3c][i],0,h*.32+i*h*.17,0,8);
  return _ybitir();
}
function _yapiKaya(o){
  const s=o.s||1.2;_YG.push([_g('DodecahedronGeometry',s,0),0x787068,0,s*.55,0,.3,.5,.1,1.1,.8,.95]);_YG.push([_g('DodecahedronGeometry',s*.55,0),0x6a645c,s*.9,s*.3,s*.3,.6,.2,.9]);_YG.push([_g('DodecahedronGeometry',s*.4,0),0x8a8278,-s*.8,s*.22,-s*.4,.1,.7,.3]);
  return _ybitir();
}
function _yapiCadir(o){
  const r=o.r||2.2;_YG.push([_g('ConeGeometry',r,r*1.2,8),0xD8C8A0,0,r*.6+.3,0,0,.4,0]);_ysil(r,r,.3,0x8a7a5a,0,.15,0,8);_yk(.8,1.5,.1,0x2a1a0a,0,.9,r*.9,.3);_ysil(.04,.04,2,0x4a3a2a,0,r*1.5,0,5);_yk(.7,.4,.03,0xB01818,.4,r*1.9,0);
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;_ysil(.03,.03,1.1,0x6a5a3a,Math.sin(a)*r*1.1,.4,Math.cos(a)*r*1.1,5);}
  return _ybitir();
}
function _yapiMesale(o){
  _ysil(.06,.08,2.4,0x4a3018,0,1.2,0,6);_yk(.36,.14,.36,0x2a2a2a,0,2.45,0);_ykoni(.2,.5,0xFF8a20,0,2.8,0,6);_ykoni(.12,.3,0xFFD060,0,2.85,0,6);
  return _ybitir();
}
function _yapiVaril(o){
  _ysil(.45,.45,.95,0x6a4a22,0,.5,0,12);for(let i=0;i<3;i++)_ysil(.47,.47,.07,0x2a2a2a,0,.15+i*.35,0,12);_ysil(.4,.4,.04,0x4a3012,0,.99,0,12);
  return _ybitir();
}
function _yapiSandik(o){
  _yk(1.0,.6,.7,0x6a4a22,0,.3,0);_yk(1.04,.18,.74,0x5a3a14,0,.68,0);_yk(1.06,.08,.1,0x3a3a3a,0,.4,.3);_yk(1.06,.08,.1,0x3a3a3a,0,.4,-.3);_yk(.14,.2,.06,0xD4A82A,0,.55,.37);
  return _ybitir();
}

// ── Mağara: kaya kütlesi + karanlık ağız (ağız -x yönüne bakar) ──
function _yapiMagara(o){
  const w=o.w||10,d=o.d||12,h=o.h||7;
  _yk(w*.8,h*.9,d*.9,0x5a5248,.2,h*.45,0);
  [[-.2,.5,-.35,.34],[.15,.6,.3,.3],[.1,.8,0,.38],[-.25,.35,.38,.26],[.3,.4,-.2,.3]].forEach(function(r,i){
    _yk2(Math.min(w,d)*r[3]*1.5,i%2?0x6B6258:0x7a7066,r[0]*w,r[1]*h,r[2]*d,1.1,.85+i*.06,1.2);});
  _yk(.8,h*.78,d*.55,0x0c0a08,-w/2+.5,h*.39,0);                                   // karanlık ağız
  _yk(1.3,h*.12,d*.7,0x4a4438,-w/2+.2,h*.82,0);                                    // alın taşı
  _yk(1.2,h*.8,1.3,0x4a4438,-w/2+.3,h*.4,d*.34);_yk(1.2,h*.8,1.3,0x4a4438,-w/2+.3,h*.4,-d*.34);   // ağız sütunları
  for(let i=0;i<5;i++){_ykoni(.28,.9+i%3*.3,0x4a4438,-w/2+.9,h*.78,-d*.2+i*d*.1,5,0,1,1);}      // sarkıtlar
  return _ybitir();
}
// ── Maden ahşap desteği: iki direk + kiriş + çapraz payanda ──
function _yapiDestek(o){
  const w=o.w||18,h=o.h||7;
  [-1,1].forEach(function(sg){_yk(.6,h,.6,0x4a3018,sg*(w/2-.4),h/2,0);_yk(.9,.4,.9,0x2a1c10,sg*(w/2-.4),.2,0);
    _yk(.2,2.2,.2,0x3a2410,sg*(w/2-1.6),h-1.2,0,0,0,sg*.8);});
  _yk(w,.6,.7,0x4a3018,0,h,0);_yk(w-2,.25,.5,0x5a3c20,0,h-.55,0);
  return _ybitir();
}
// ── Akarsu: su yüzeyi + taş kıyılar + kamışlar (uzunluk z boyunca) ──
function _yapiNehir(o){
  const L=o.L||96,w=o.w||6;
  [-1,1].forEach(function(sg){
    _yk(.9,.18,L,0x6a5c40,sg*(w/2+.45),.05,0);_yk(.5,.12,L,0x4a7a3a,sg*(w/2+1.1),.04,0);
    for(let i=0;i<L/2.2;i++){const z=-L/2+i*2.2+((i*7)%5)*.2;const r=.25+((i*13)%5)*.07;
      _yk2(r,i%2?0x787068:0x8a8478,sg*(w/2+.2+((i*3)%4)*.18),r*.35,z,1.3,.6,1);
      if(i%3===0){_yk(.05,.8+(i%4)*.15,.05,0x6a8a3a,sg*(w/2+.9),.45,z+.3);_yk(.05,.7,.05,0x7a9a4a,sg*(w/2+.97),.4,z+.4);}}
  });
  const g=_ybitir();
  const su=new THREE.Mesh(new THREE.PlaneGeometry(w,L),new THREE.MeshLambertMaterial({color:0x3070b0,transparent:true,opacity:.78}));
  su.rotation.x=-Math.PI/2;su.position.y=.04;g.add(su);
  const iz=new THREE.Mesh(new THREE.PlaneGeometry(w*.35,L),new THREE.MeshLambertMaterial({color:0x6aa8d8,transparent:true,opacity:.35}));
  iz.rotation.x=-Math.PI/2;iz.position.y=.06;g.add(iz);
  return g;
}

// ── Zemin ve levha ──
// Dama taş döşeme: yüzlerce kare tek parçada (tek çizim)
function _yapiZemin(o){
  const n=o.n||12,ad=o.adim||5,k=o.kare||4.6,yk=o.yuk||.05,c=o.renk||0xC8A850;
  for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++)if((i+j)%2===0)_yk(k,yk,k,c,i*ad,o.y||.01,j*ad);
  return _ybitir();
}
// Cadde: düz yüzey + taş döşeme şeritleri
function _yapiSokak(o){
  const w=o.w||7,L=o.L||90;
  _yk(w,.02,L,o.renk||0xC0A870,0,.03,0);
  for(let j=-L/2+3;j<=L/2-3;j+=4)_yk(w-1,.04,3.4,0xB89858,0,.04,j);
  [-1,1].forEach(function(sg){_yk(.35,.14,L,0x8a8478,sg*(w/2+.17),.07,0);});    // bordür
  return _ybitir();
}
// Levha: çerçeveli tahta, kenarlıkta metal köşebentler (orijin merkezde)
function _yapiLevha(o){
  const w=o.w||4,h=o.h||.8,d=o.d||.2,c=o.renk||0x5a2800,Y=o.ayak||0;   // ayak: direk boyu (0 = asılı levha)
  if(Y){[-1,1].forEach(function(sg){_yk(.16,Y+h/2,.16,0x3a2410,sg*(w/2-.3),(Y+h/2)/2,0);});}
  _yk(w,h,d,c,0,Y,0);_yk(w+.2,.1,d+.06,0x2a1808,0,Y+h/2,0);_yk(w+.2,.1,d+.06,0x2a1808,0,Y-h/2,0);
  _yk(.1,h+.1,d+.06,0x2a1808,-w/2,Y,0);_yk(.1,h+.1,d+.06,0x2a1808,w/2,Y,0);
  _yk(w*.7,h*.28,d+.04,0xD4A82A,0,Y,0);        // yazı bandı
  [-1,1].forEach(function(sg){_yk(.12,.12,.12,0x8a8a8a,sg*(w/2-.15),Y+h/2-.1,d/2+.04);});
  return _ybitir();
}

// ── Sur kapısı: iki burç, lento, kanatlar (o.demir: demir kaplı kanat) ──
function _yapiKapiSur(o){
  const w=o.w||6,h=o.h||6,dm=!!o.demir,tas=0xC8A870,koyu=0x9a8050;
  [-1,1].forEach(function(sg){
    const x=sg*(w/2+2.2);_yk(3.6,h+3,3.2,tas,x,(h+3)/2,0);_yk(4,.4,3.6,koyu,x,h+3.2,0);
    for(let i=0;i<3;i++)_yk(.9,.7,.7,tas,x-1.2+i*1.2,h+3.75,-1.3);
    _yk(.5,1.2,.1,0x120c06,x,h*.7,1.65);
  });
  _yk(w+1,2.2,3,tas,0,h+1.9,0);_yk(w+1.4,.35,3.4,koyu,0,h+3.1,0);                  // lento
  _yk(w,h,.5,dm?0x2a2a30:0x5a3a1a,0,h/2,.2);                                         // kapı kanatları
  for(let i=0;i<4;i++)_yk(w,.18,.58,dm?0x6a6a74:0x2a1c10,0,.9+i*1.4,.2);              // bantlar
  _yk(.12,h,.6,0x1a1a1a,0,h/2,.2);_ysil(.18,.18,.2,0xD4A82A,-.5,h*.45,.55,8);_ysil(.18,.18,.2,0xD4A82A,.5,h*.45,.55,8);
  return _ybitir();
}

const _YD=[
  ['yapi_ev','Konut evi (cumbalı)',_yapiEv,{w:6,d:5},5.6],['yapi_kisla','Kışla / cebehane binası',_yapiKisla,{w:12,d:9},8.2],
  ['yapi_cami','Cami (kubbe ve minare)',_yapiCami,{w:9,d:9},15],['yapi_hamam','Sultan Hamamı',_yapiHamam,{w:16,d:16},9],
  ['yapi_kervansaray','Kervansaray',_yapiKervansaray,{w:25,d:14},9],['yapi_dukkan','Çarşı tezgâhı',_yapiDukkan,{w:3.4,d:1.8},3.1],
  ['yapi_kule','Gözetleme kulesi',_yapiKule,{r:2.2,h:9},13],['yapi_sur','Sur parçası',_yapiSur,{w:10},6],['yapi_cit','Tahta çit',_yapiCit,{w:6},1.5],
  ['yapi_talim','Talim kuklası',_yapiMasa,{},3],
  ['cevre_agac','Meşe ağacı',_yapiAgac,{h:5},6],['cevre_cam','Çam ağacı',_yapiCam,{h:6.5},6.5],['cevre_kaya','Kaya',_yapiKaya,{s:1.2},1.7],
  ['yapi_kapi','Sur kapısı',_yapiKapiSur,{w:6,h:6},9.5],['zemin_tas','Taş döşeme zemin',_yapiZemin,{n:12,adim:5,kare:4.6},.1],['zemin_sokak','Cadde',_yapiSokak,{w:7,L:90},.2],['cevre_levha','Levha',_yapiLevha,{w:4,h:.8},.9],['cevre_cadir','Çadır',_yapiCadir,{r:2.2},4.4],['cevre_magara','Mağara',_yapiMagara,{w:10,d:12,h:7},7],['cevre_destek','Maden desteği',_yapiDestek,{w:18,h:7},7],['cevre_nehir','Akarsu',_yapiNehir,{L:96,w:6},.5],['cevre_mesale','Meşale',_yapiMesale,{},3.2],['cevre_varil','Varil',_yapiVaril,{},1],['cevre_sandik','Sandık',_yapiSandik,{},.75]
];
_YD.forEach(function(d){
  modelTanimla(d[0],{ad:d[1],grup:d[0].indexOf('yapi_')===0?'Yapı':(d[0].indexOf('zemin_')===0?'Zemin':'Çevre'),boy:d[4],varsayilan:d[3],yap:function(op){return d[2](Object.assign({},d[3],op||{}));}});
});

// Haritada kullanım: yapıyı sahneye koyar ve (verildiyse) çarpışma kutusu ekler
function yapiKoy(id,x,z,op,carp,rot){
  const g=modelYap(id,op);g.position.set(x,0,z);if(rot)g.rotation.y=rot;S3.add(g);
  if(carp)addCollider(x,z,carp[0],carp[1]);
  if(id.indexOf('yapi_')===0||id==='cevre_magara'){g.updateMatrixWorld(true);kapatanKaydet(g,4);}
  return g;
}
