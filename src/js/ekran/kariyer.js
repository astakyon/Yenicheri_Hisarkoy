// ═══ KARİYER (v1.81): rütbe, seviye ve haritaların seviye kapıları ═══
function kariyerAc(){kariyerCiz();document.getElementById('kariyerBox').style.display='flex';}
function kariyerKapat(){document.getElementById('kariyerBox').style.display='none';}
function kariyerCiz(){
  const lv=SAVE.level||1,fame=SAVE.fame||0;
  let sonraki=null,onceki=FAME_TITLES[0];
  FAME_TITLES.forEach(function(t){if(fame>=t.min)onceki=t;else if(!sonraki)sonraki=t;});
  const xy=Math.min(100,Math.round((SAVE.xp||0)/(SAVE.xpNext||100)*100));
  const fy=sonraki?Math.min(100,Math.round((fame-onceki.min)/(sonraki.min-onceki.min)*100)):100;
  let h='<div class="ovHead"><div><div class="panTitle">🏅 KARİYER</div><div class="panSub" style="margin:0">RÜTBE · SEVİYE · HARİTALAR</div></div><button class="zmX" onclick="kariyerKapat()">✕</button></div><div class="ovBody">';
  h+='<div class="hkKart aktif"><div class="hkAd">'+getFameTitle()+' · Seviye '+lv+'</div>'
   +'<div class="toggleSub">XP '+(SAVE.xp||0)+' / '+(SAVE.xpNext||100)+'</div><div class="pfBar"><i style="width:'+xy+'%"></i></div>'
   +'<div class="toggleSub" style="margin-top:6px">Ün '+fame+(sonraki?' / '+sonraki.min+' → '+sonraki.title:' (en yüksek rütbe)')+'</div><div class="pfBar"><i style="width:'+fy+'%"></i></div></div>';
  if(lv>=10&&!SAVE.class)h+='<div class="hkKart aktif"><div class="hkAd">🎖 Sınıfını seç</div><div class="toggleSub">Seviye 10\'a ulaştın; sınıf bonusunu seçebilirsin.</div><div class="hkRow"><button class="hkBtn grn" onclick="kariyerKapat();document.getElementById(\'classBox\').style.display=\'flex\'">SEÇ</button></div></div>';
  h+='<div class="panSub" style="margin:10px 0 4px">HARİTALAR</div>';
  WORLD_MAPS.forEach(function(m){
    const gerek=haritaSv(m.id),acik=lv>=gerek,pr=(typeof HIKAYE!=='undefined')?HIKAYE.find(function(x){return x.harita===m.id;}):null;
    h+='<div class="hkKart '+(acik?'aktif':'kilit')+'"><div class="hkTop" style="cursor:default"><div class="hkIc">'+(acik?m.icon:'🔒')+'</div><div><div class="hkAd">'+m.name+'</div>'
     +'<div class="toggleSub">'+(acik?'✔ Açık':'Sv '+gerek+' gerekli ('+(gerek-lv)+' seviye kaldı)')+' · Önerilen Sv '+gerek+(pr?' · 📖 Perde '+pr.no:'')+'</div></div></div>'
     +(acik?'<div class="hkRow"><button class="hkBtn" onclick="haritayaGir(\''+m.id+'\')">▶ GİR</button></div>':'')+'</div>';
  });
  h+='<div class="panSub" style="margin:10px 0 4px">RÜTBELER</div>';
  FAME_TITLES.forEach(function(t){h+='<div class="toggleSub" style="padding:3px 2px;'+(fame>=t.min?'color:#ffd36b':'opacity:.6')+'">'+(fame>=t.min?'✔ ':'◻ ')+t.title+' — '+t.min+' ün</div>';});
  h+='</div><div class="ovFoot"><button class="panBtn" onclick="kariyerKapat()">✕ Kapat</button></div>';
  document.getElementById('kariyerPanel').innerHTML=h;
}
