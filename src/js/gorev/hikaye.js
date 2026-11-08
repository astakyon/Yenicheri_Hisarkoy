// ═══════════════════════════════════════════════════════
// ANA HİKAYE — "Hisarköy'ün Gölgesi" (v1.76)
// 6 perde; her perde bir haritaya bağlı, ölçülebilir hedefleri var, sırayla açılır.
// İlerleme SAVE.story2 içinde; sayaçlar yalnızca oyun sırasında canlı izlenir.
// Hedef türleri: sayaç anahtarı k (kill_<harita>, av, satis, wave_tarim, zafer_<harita>), n hedef,
// abs=true ise mutlak değer (en yüksek dalga gibi), değilse perde başından beri artış.
// ═══════════════════════════════════════════════════════
const HIKAYE=[
  {no:1,ad:'Hisarköy\'e Atama',harita:'gorev',ikon:'⚔',
   intro:'Yeniçeri Ağası seni kışlaya çağırır:\n"Genç asker, Hisarköy\'ün yolları haydut kaynıyor. Kara Mehmet\'in adamları kervanları soyuyor. Devriyeye çık, ne kadar adam bulduğunu göreyim."',
   hedefler:[{k:'kill_gorev',n:10,ad:'Devriyede 10 haydut öldür'}],
   outro:'"Eli ağır çıkıyorsun. Ama yakalanan bir haydutun üstünden çıkan şu iz, işin bundan büyük olduğunu gösteriyor: ormanda izcilerimiz kayboldu."',
   odul:{gold:150,xp:120,fame:20}},
  {no:2,ad:'Kayıp İzciler',harita:'orman',ikon:'🏹',
   intro:'Orman bekçisi endişeli:\n"İzcimiz Davut üç gündür dönmedi. Av hayvanları da ürkek; birileri ormanı dolaşıyor. Avlan, izlerini sür, ne bulursan getir."',
   hedefler:[{k:'av',n:5,ad:'Ormanda 5 hayvan avla (izleri bul)'}],
   outro:'Avlarken bulduğun yırtık bir izci kuşağı ve demir madenine giden taze tekerlek izleri… "Madene git," diyor bekçi, "kervan demiri orada kayboluyor."',
   odul:{gold:200,xp:180,fame:25}},
  {no:3,ad:'Mühürlü Mektup',harita:'maden',ikon:'⛏',
   intro:'Demirci Hasan fısıldar:\n"Madenin derin galerilerinde yabancı adamlar var. Nöbetçiler susturuldu. İçeri gir, onları temizle; elinde bir şey varsa bulunur."',
   hedefler:[{k:'kill_maden',n:8,ad:'Madende 8 düşman öldür'}],
   outro:'Düşen bir hainin cebinden mühürlü bir mektup çıkar: "Hisarköy\'ün erzağı kesilsin. — V." Mührün sahibi bir vezir olmalı. Önce köylüleri ve ikmali korumalısın.',
   odul:{gold:300,xp:240,fame:30}},
  {no:4,ad:'Ordunun Ekmeği',harita:'tarim',ikon:'🌾',harita2:'ciftlik',
   intro:'Köy muhtarı yalvarır:\n"Baskınlar tarlaları yakıyor, ordu aç kalacak! Ovayı eşkıyadan koru; çiftlikte ekin yetiştirip pazara ver ki ikmal kesilmesin."',
   hedefler:[{k:'wave_tarim',n:3,abs:true,ad:'Tarım Ovası\'nda 3. dalgaya ulaş'},{k:'satis',n:25,ad:'Çiftlikte 25 akçelik ürün sat'}],
   outro:'Ambarlar dolu, askerin karnı tok. Köylüler eşkıyanın dilinden bir isim duymuş: liman şehrindeki bir reis, "Vezir\'in adamı" diye övünüyormuş.',
   odul:{gold:400,xp:300,fame:40}},
  {no:5,ad:'Liman Şehrinin Gölgesi',harita:'sehir',ikon:'🏙',
   intro:'Gizli habercin yazar:\n"Yabancı şehirde çeteleri bir reis yönetiyor. Mektubun mührü onun elinde de var. Sokakları temizle, Çete Reisi\'ni yakala."',
   hedefler:[{k:'zafer_sehir',n:1,ad:'Çete Reisi\'ni yen (Yabancı Şehir)'}],
   outro:'Reis son nefesinde itiraf eder: "Vezir Cafer… Sarayda, padişahın yanında… sizi tek tek yok etmemi istedi." Artık hedef belli.',
   odul:{gold:600,xp:420,fame:60}},
  {no:6,ad:'Hain Vezir',harita:'saray',ikon:'👑',
   intro:'Padişahın muhafız ağası seni sarayda karşılar:\n"Kanıtın var, cesaretin var. Vezir Cafer\'in muhafızları kapıları tuttu. Divan salonuna ulaş, hainin hesabını gör!"',
   hedefler:[{k:'zafer_saray',n:1,ad:'Hain Vezir\'i devir (Osmanlı Sarayı)'}],
   outro:'Padişah huzurunda hain zincire vurulur. "Hisarköy Muhafızı" unvanı sana verilir. Hikâye burada bitmez; ama Hisarköy artık güvende.',
   odul:{gold:1000,xp:800,fame:120}}
];
function hikayeHazirla(){
  if(!SAVE.story2||typeof SAVE.story2!=='object')SAVE.story2={act:1,c:{},c0:{},odul:false,bitti:[]};
  const H=SAVE.story2;
  if(!H.c)H.c={};if(!H.c0)H.c0={};if(!Array.isArray(H.bitti))H.bitti=[];
  if(!H.act||H.act<1)H.act=1;
  return H;
}
function hikayeIlerleme(perde,h){
  const H=hikayeHazirla(),c=H.c[h.k]||0,c0=h.abs?0:(H.c0[h.k]||0);
  return Math.max(0,Math.min(h.n,c-c0));
}
function hikayeTamam(perde){return perde.hedefler.every(function(h){return hikayeIlerleme(perde,h)>=h.n;});}
function hikayeDurum(){const H=hikayeHazirla();return {act:H.act,tam:H.bitti.length,toplam:HIKAYE.length,bitti:H.bitti.length>=HIKAYE.length,odul:H.odul};}
function hikayePerdeDurum(p){
  const H=hikayeHazirla();
  if(H.bitti.indexOf(p.no)>=0)return 'bitti';
  if(p.no===H.act)return 'aktif';
  return 'kilit';
}
// Sayaçlar: oyun ilerledikçe yarım saniyede bir istatistik farkından beslenir
let _hk={kills:SAVE.stats.kills||0,av:SAVE.stats.animalsHunted||0,satis:SAVE.stats.satis||0,sehir:SAVE.stats.sehirZafer||0,saray:SAVE.stats.sarayZafer||0};
function hikayeSay(k,d){const H=hikayeHazirla();H.c[k]=(H.c[k]||0)+d;}
function hikayeTik(){
  if(typeof playing==='undefined'||!playing)return;
  const H=hikayeHazirla(),S=SAVE.stats;
  let ch=false;
  const dk=(S.kills||0)-_hk.kills;if(dk>0){hikayeSay('kill_'+currentMap,dk);ch=true;}_hk.kills=S.kills||0;
  const da=(S.animalsHunted||0)-_hk.av;if(da>0){hikayeSay('av',da);ch=true;}_hk.av=S.animalsHunted||0;
  const ds=(S.satis||0)-_hk.satis;if(ds>0){hikayeSay('satis',ds);ch=true;}_hk.satis=S.satis||0;
  const dh=(S.sehirZafer||0)-_hk.sehir;if(dh>0){hikayeSay('zafer_sehir',dh);ch=true;}_hk.sehir=S.sehirZafer||0;
  const dr=(S.sarayZafer||0)-_hk.saray;if(dr>0){hikayeSay('zafer_saray',dr);ch=true;}_hk.saray=S.sarayZafer||0;
  if(currentMap==='tarim'&&typeof wave!=='undefined'&&wave>(H.c.wave_tarim||0)){H.c.wave_tarim=wave;ch=true;}
  if(!ch)return;
  const perde=HIKAYE[H.act-1];
  if(perde&&!H.odul&&hikayeTamam(perde)){
    H.odul=true;saveGame();
    lootPop('📖 Perde '+perde.no+' tamamlandı! Ana menü → Hikaye\'den ödülünü al');
    if(typeof SES!=='undefined')SES.zafer();
  }else saveGame();
}
setInterval(hikayeTik,500);
function hikayeOdulAl(){
  const H=hikayeHazirla(),perde=HIKAYE[H.act-1];
  if(!perde||!H.odul||!hikayeTamam(perde))return;
  addMainGold(perde.odul.gold);
  SAVE.fame=(SAVE.fame||0)+perde.odul.fame;
  if(typeof addXP==='function'&&typeof playing!=='undefined'&&playing)addXP(perde.odul.xp);else SAVE.xp=(SAVE.xp||0)+perde.odul.xp;
  H.bitti.push(perde.no);H.odul=false;H.act=Math.min(HIKAYE.length+1,perde.no+1);
  H.c0=Object.assign({},H.c);   // sonraki perde sıfırdan sayılır
  saveGame();
  if(typeof SES!=='undefined')SES.zafer();
  hikayeCiz();
}
function hikayeBaslat(no){
  const p=HIKAYE[no-1],H=hikayeHazirla();
  if(!p||hikayePerdeDurum(p)==='kilit')return;
  hikayeKapat();
  BEGIN(p.harita);
  setTimeout(function(){if(typeof lootPop==='function')lootPop('📖 Perde '+p.no+' — '+p.hedefler.map(function(h){return h.ad;}).join(' · '));},1800);
}
let _hkAcik=null;
function hikayeAc(){_hkAcik=hikayeHazirla().act;hikayeCiz();document.getElementById('hikayeBox').style.display='flex';}
function hikayeKapat(){document.getElementById('hikayeBox').style.display='none';}
function hikayeSec(no){_hkAcik=_hkAcik===no?null:no;hikayeCiz();}
function hikayeCiz(){
  const H=hikayeHazirla(),d=hikayeDurum();
  let h='<div class="ovHead"><div><div class="panTitle">📖 HİSARKÖY\'ÜN GÖLGESİ</div><div class="panSub" style="margin:0">PERDE '+Math.min(H.act,HIKAYE.length)+' / '+HIKAYE.length+' · '+d.tam+' TAMAMLANDI</div></div><button class="zmX" onclick="hikayeKapat()" aria-label="Kapat">✕</button></div><div class="ovBody"><div class="hkList">';
  HIKAYE.forEach(function(p){
    const dur=hikayePerdeDurum(p),acik=_hkAcik===p.no&&dur!=='kilit';
    h+='<div class="hkKart '+dur+'"><div class="hkTop" onclick="'+(dur==='kilit'?'':'hikayeSec('+p.no+')')+'" style="cursor:'+(dur==='kilit'?'default':'pointer')+'"><div class="hkIc">'+(dur==='kilit'?'🔒':p.ikon)+'</div><div><div class="hkNo">PERDE '+p.no+'</div><div class="hkAd">'+p.ad+'</div></div><div class="hkDdurum">'+(dur==='bitti'?'✔ Tamamlandı':dur==='aktif'?(H.odul?'🎁 Ödül hazır':'▶ Aktif'):'Önceki perdeyi tamamla')+'</div></div>';
    if(acik){
      h+='<div class="hkMetin">'+p.intro+'</div>';
      p.hedefler.forEach(function(g){const v=dur==='bitti'?g.n:hikayeIlerleme(p,g),y=Math.round(v/g.n*100);h+='<div class="hkHedef">'+(v>=g.n?'✔ ':'◻ ')+g.ad+' <b>('+v+'/'+g.n+')</b><div class="pfBar"><i style="width:'+y+'%"></i></div></div>';});
      h+='<div class="toggleSub">Ödül: 🪙 '+p.odul.gold+' · ✨ '+p.odul.xp+' XP · ⭐ '+p.odul.fame+' ün</div>';
      if(dur==='bitti')h+='<div class="hkMetin hkSoz">'+p.outro+'</div>';
      h+='<div class="hkRow">';
      if(dur==='aktif'&&H.odul)h+='<button class="hkBtn grn" onclick="hikayeOdulAl()">🎁 ÖDÜLÜ AL</button>';
      if(dur!=='kilit')h+='<button class="hkBtn" onclick="hikayeBaslat('+p.no+')">▶ '+(dur==='bitti'?'TEKRAR OYNA':'GÖREVE BAŞLA')+'</button>';
      h+='</div>';
    }
    h+='</div>';
  });
  if(d.bitti)h+='<div class="hkKart bitti"><div class="hkAd">🏅 Hisarköy Muhafızı</div><div class="hkMetin">Ana hikâyeyi tamamladın. "Hisarköy Muhafızı" unvanı Profil\'de seçilebilir. Serbest haritalarda ilerlemeye ve çiftliğini büyütmeye devam et!</div></div>';
  h+='</div></div><div class="ovFoot"><button class="panBtn" onclick="hikayeKapat()">✕ Kapat</button></div>';
  document.getElementById('hikayePanel').innerHTML=h;
}
