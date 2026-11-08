// ═══════════════════════════════════════════════════════
// ÇİFTLİK — etkileşim ve güncelleme (v1.63)
// ═══════════════════════════════════════════════════════
function ciftlikCik(){if(currentMap!=='ciftlik'||pl.hp<=0)return;ciftlikPanelKapat();ciftlikEnvBtn(false);BEGIN('kisla');}
function ciftlikAltin(d){mainGold+=d;SAVE.mainGold=mainGold;saveGame();updateGoldHud();}

function ciftlikSulamaFiyat(lv){return 300*(lv+1)*(lv+1);}
function ciftlikSat(){
  const c=ciftlikHazirla();let top=0,adet=0;
  CIFTLIK_SIRA.forEach(function(k){top+=c.depo[k]*CIFTLIK_EKIN[k].deger;adet+=c.depo[k];c.depo[k]=0;});
  if(!adet){lootPop('Çantada satacak ürün yok');return;}
  ciftlikAltin(top);SAVE.stats.satis=(SAVE.stats.satis||0)+top;saveGame();
  lootPop('💰 '+adet+' ürün satıldı: +'+top+' Akçe');addFX(CIFTLIK_PAZAR.x,CIFTLIK_PAZAR.z,0xFFD700,8);
}
function ciftlikEtkilesim(z){
  const c=ciftlikHazirla();
  if(z.id==='ciftlikCikis'){ciftlikCik();return;}
  if(z.id==='ciftlikPazar'){ciftlikPanelAc('pazar');return;}
  if(z.id==='ciftlikSandik'){ciftlikPanelAc('sandik');return;}
  if(z.id==='ciftlikRaf'){ciftlikPanelAc('envanter');return;}
  if(z.id==='ciftlikParsel'){
    const p=c.parsel[z.i],o=ciftlikOran(p);
    if(!p.e){
      const e=CIFTLIK_EKIN[c.secili];
      if(c.tohum[c.secili]<1){lootPop(e.ad+' tohumun yok — Pazar\'dan al veya Sandık\'tan çıkar');return;}
      c.tohum[c.secili]--;p.e=c.secili;p.t=Date.now();saveGame();ciftlikGorselYenile();addFX(CIFTLIK_PARSELLER[z.i].x,CIFTLIK_PARSELLER[z.i].z,0x8a6a3a,6);lootPop('🌱 '+e.ad+' ekildi');
    }else if(o>=1){
      if(ciftlikCantaDolu(c)>=CIFTLIK_CANTA){lootPop('🎒 Çanta dolu — Sandık\'a bırak veya sat');return;}
      const k=p.e;c.depo[k]++;p.e=null;saveGame();ciftlikGorselYenile();SAVE.stats.hasat=(SAVE.stats.hasat||0)+1;
      addFX(CIFTLIK_PARSELLER[z.i].x,CIFTLIK_PARSELLER[z.i].z,CIFTLIK_EKIN[k].renk,8);lootPop('✂ '+CIFTLIK_EKIN[k].ad+' biçildi (depoda '+c.depo[k]+')');
    }
  }
}
function ciftlikDepoMetin(c){return CIFTLIK_SIRA.filter(function(k){return c.depo[k]>0;}).map(function(k){return CIFTLIK_EKIN[k].ad+' '+c.depo[k];}).join(', ')||'boş';}

function ciftlikYakin(){
  const c=ciftlikHazirla();
  [CIFTLIK_CIKIS,CIFTLIK_RAF,CIFTLIK_PAZAR,CIFTLIK_SANDIK].forEach(function(z){z._d=Math.hypot(pl.x-z.x,pl.z-z.z);});
  if(CIFTLIK_CIKIS._d<3.8)return{z:CIFTLIK_CIKIS,t:'[ E ] 🏰 Çiftlikten Çık'};
  if(CIFTLIK_RAF._d<3.4)return{z:CIFTLIK_RAF,t:'[ E ] 🌰 Envanteri aç — ekilecek: '+CIFTLIK_EKIN[c.secili].ad+' (tohum '+c.tohum[c.secili]+')'};
  if(CIFTLIK_SANDIK._d<3.2)return{z:CIFTLIK_SANDIK,t:'[ E ] 📦 Sandık — ürün ve tohum sakla'};
  if(CIFTLIK_PAZAR._d<3.6)return{z:CIFTLIK_PAZAR,t:'[ E ] 💰 Pazar — tohum al, ürün sat'};
  for(let i=0;i<CIFTLIK_PARSELLER.length;i++){
    const q=CIFTLIK_PARSELLER[i];
    if(Math.abs(pl.x-q.x)<q.w/2+.6&&Math.abs(pl.z-q.z)<q.d/2+.6){
      const p=c.parsel[i],o=ciftlikOran(p),zz={id:'ciftlikParsel',i:i,name:'Parsel'};
      if(!p.e)return{z:zz,t:'[ E ] 🌱 '+CIFTLIK_EKIN[c.secili].ad+' ek (tohum: '+c.tohum[c.secili]+')'};
      if(o>=1)return{z:zz,t:'[ E ] ✂ '+CIFTLIK_EKIN[p.e].ad+' olgun — biç'};
      return{z:null,t:'🌱 '+CIFTLIK_EKIN[p.e].ad+' büyüyor — %'+Math.floor(o*100)+' (kalan '+Math.ceil((1-o)*CIFTLIK_EKIN[p.e].sure)+' sn)'};
    }
  }
  return null;
}

function updateCiftlik(dt){
  updateMovement(dt);
  if(ciftlikPanelTur&&ciftlikPanelTur!=='envanter'&&(Math.hypot(pl.x-(ciftlikPanelTur==='pazar'?CIFTLIK_PAZAR.x:CIFTLIK_SANDIK.x),pl.z-(ciftlikPanelTur==='pazar'?CIFTLIK_PAZAR.z:CIFTLIK_SANDIK.z))>6))ciftlikPanelKapat();
  if(window._ciftlikHalka)window._ciftlikHalka.material.opacity=.5+Math.sin(gt*.08)*.2;
  if(gt%30===0)ciftlikGorselYenile();
  const intH=document.getElementById('intH'),zBtn=document.getElementById('zoneBtn'),y=ciftlikYakin();
  if(y){
    intH.textContent=y.t;intH.style.display='block';
    if(y.z){pl.nearZone=y.z;zBtn.innerHTML=(y.z.icon||'🌱')+'<br>Yap';zBtn.style.display='flex';}else{pl.nearZone=null;zBtn.style.display='none';}
  }else{pl.nearZone=null;zBtn.style.display='none';intH.style.display='none';}
  parts=parts.filter(function(p){p.mesh.position.x+=p.vx;p.mesh.position.y+=p.vy;p.mesh.position.z+=p.vz;p.vy-=.006;p.vx*=.9;p.vz*=.9;p.life--;p.mesh.material.opacity=p.life/p.maxLife;p.mesh.material.transparent=true;if(p.life<=0){S3.remove(p.mesh);return false;}return true;});
  const c=ciftlikHazirla();
  document.getElementById('gorevT').textContent='Çiftlik — 🌰 '+CIFTLIK_EKIN[c.secili].ad+' ('+c.tohum[c.secili]+') — 🎒 '+ciftlikDepoMetin(c);
}
