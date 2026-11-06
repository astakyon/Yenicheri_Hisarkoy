// ═══════════════════════════════════════════════════════
// BÖLGE MENÜSÜ SİSTEMİ
// ═══════════════════════════════════════════════════════
function openZone(zoneId){
  const z=ZONES.find(function(z){return z.id===zoneId;});if(!z)return;
  playing=false;
  document.getElementById('zmTitle').textContent=z.icon+' '+z.name;
  updateGoldHud();
  const content=document.getElementById('zmContent');
  if(zoneId==='demirKapi'){
    const wpns=['yatagan','tufek','ok'];const wNames=['Yatağan','Tüfek','Ok-Yay'];
    const maxHp=getBaseMaxHp();const spd=getBaseSpd().toFixed(1);
    const armorName={none:'Zırhsız',leather:'Deri Zırh',chain:'Zincir Zırh',plate:'Plaka Zırh',ottoman:'Osmanlı Plakası'}[SAVE.armor]||'Zırhsız';
    content.innerHTML=`<div style="color:#D4B896;font-size:10px;text-align:center;padding:8px 0;">
      <div style="font-size:28px;margin-bottom:8px;">🚪</div>
      <div style="color:#FFD700;font-size:13px;margin-bottom:6px;">Hisarköy Devriyesi</div>
      <div style="color:#888;font-size:9px;margin-bottom:12px;">Haydutları bertaraf et, akçe kazan.<br>Boss'u öldürmeden dönersen havuz akçesi kaybolur!</div>
      <div style="background:rgba(0,0,0,.4);border:1px solid rgba(139,105,20,.3);border-radius:4px;padding:10px;margin-bottom:12px;text-align:left;">
        <div style="color:#FFD700;font-size:9px;letter-spacing:1px;margin-bottom:6px;">⚔ GÖREV ÖNCESİ DURUM</div>
        <div class="statRow"><span>Ana Akçe</span><span class="statVal">🪙 ${mainGold}</span></div>
        <div class="statRow"><span>Max Can</span><span class="statVal">${maxHp}</span></div>
        <div class="statRow"><span>Hareket Hızı</span><span class="statVal">${spd}</span></div>
        <div class="statRow"><span>Zırh</span><span class="statVal">${armorName}</span></div>
        <div class="statRow"><span>Silah Hasarı</span><span class="statVal">${Math.round(getWeaponDmg('yatagan'))} / ${Math.round(getWeaponDmg('tufek'))} / ${Math.round(getWeaponDmg('ok'))}</span></div>
      </div>
      <button onclick="BEGIN('gorev')" style="width:100%;padding:12px;background:linear-gradient(180deg,#6B0000,#3a0000);border:2px solid #c0392b;border-radius:4px;color:#ff6b6b;font-size:13px;cursor:pointer;font-family:Cinzel,serif;letter-spacing:2px;">
        ⚔ GÖREVE ÇIK
      </button>
    </div>`;
    document.getElementById('zoneMenuBox').style.display='flex';return;
  }
  content.innerHTML=getZoneContent(zoneId);
  document.getElementById('zoneMenuBox').style.display='flex';
}
function closeZoneMenu(){
  document.getElementById('zoneMenuBox').style.display='none';
  if(currentMap==='kisla')playing=true;
}

function getZoneContent(id){
  if(id==='armory')return buildArmoryUI();
  if(id==='cebehane'||id==='cebehaneUst')return buildArmorUI();
  if(id==='drill')return buildDrillUI();
  if(id==='hamam')return buildHamamUI();
  if(id==='kervansaray')return buildKervansarayUI();
  if(id==='camii')return buildCamiiUI();
  if(id==='carsi')return buildCarsiUI();
  return '<p style="color:#888">Bu bölge hazırlanıyor...</p>';
}

// ── ARMORY ──
function buildArmoryUI(){
  const wDefs={
    yatagan:{name:'Yatağan',icon:'🗡',dmgs:[14,20,28,38,50],costs:[0,150,300,600,1200]},
    tufek:{name:'Tüfek',icon:'🔫',dmgs:[36,48,64,84,110],costs:[0,200,400,800,1600]},
    ok:{name:'Ok-Yay',icon:'🏹',dmgs:[22,30,40,52,68],costs:[0,120,240,480,960]}
  };
  let html='<div class="cardGrid">';
  Object.entries(wDefs).forEach(function([wid,wdef]){
    const lvl=SAVE.weapons[wid]?.lvl||1;const isMax=lvl>=5;const nextCost=wdef.costs[lvl];const canAff=mainGold>=nextCost;
    html+=`<div class="itemCard ${isMax?'maxed':''}">
      <div class="cardIcon">${wdef.icon}</div>
      <div class="cardName">${wdef.name}</div>
      <div class="cardDesc">Hasar: ${wdef.dmgs[lvl-1]}${isMax?'':' → '+wdef.dmgs[lvl]}</div>
      <div class="lvlBar"><div class="lvlBarFill" style="width:${lvl/5*100}%"></div></div>
      <div style="margin-top:6px;">
        ${isMax?'<span class="cardBadge maxed">MAX SEVİYE</span>':
          `<span class="cardCost ${canAff?'':'cantAfford'}">💰 ${nextCost} Akçe</span>
           <button onclick="upgradeWeapon('${wid}')" style="margin-top:4px;width:100%;padding:4px;background:${canAff?'rgba(39,174,96,.2)':'rgba(100,0,0,.2)'};border:1px solid ${canAff?'#27ae60':'#7B1414'};border-radius:3px;color:${canAff?'#2ecc71':'#c0392b'};font-size:9px;cursor:${canAff?'pointer':'not-allowed'};font-family:Cinzel,serif;">
             Sv.${lvl} → Sv.${lvl+1}
           </button>`}
      </div>
    </div>`;
  });
  html+='</div>';return html;
}
function upgradeWeapon(wid){
  const wDefs={yatagan:[0,150,300,600,1200],tufek:[0,200,400,800,1600],ok:[0,120,240,480,960]};
  const lvl=SAVE.weapons[wid]?.lvl||1;if(lvl>=5)return;
  const cost=wDefs[wid][lvl];if(!spendMain(cost))return;
  SAVE.weapons[wid].lvl=lvl+1;saveGame();
  lootPop(['Yatağan','Tüfek','Ok-Yay'][['yatagan','tufek','ok'].indexOf(wid)]+' Sv.'+(lvl+1)+'! ⚔');
  openZone('armory');
}

// ── CEBEHANE (ZIRH) ──
function buildArmorUI(){
  const armors=[
    {id:'none',    name:'Zırhsız',        icon:'👕',hp:0,  def:0,   spd:0,   cost:0},
    {id:'leather', name:'Deri Zırh',      icon:'🟤',hp:25, def:10,  spd:0,   cost:200},
    {id:'chain',   name:'Zincir Zırh',    icon:'⛓', hp:50, def:20,  spd:-5,  cost:500},
    {id:'plate',   name:'Plaka Zırh',     icon:'🛡', hp:80, def:35,  spd:-10, cost:1000},
    {id:'ottoman', name:'Osmanlı Plakası',icon:'👑',hp:120,def:50,  spd:-8,  cost:2500},
  ];
  const owned=SAVE.armorOwned||['none'];
  let html='<div class="cardGrid">';
  armors.forEach(function(a){
    const isOwned=owned.includes(a.id)||a.id==='none';
    const equipped=SAVE.armor===a.id;
    const canAff=mainGold>=a.cost;
    html+=`<div class="itemCard ${equipped?'owned':''}">
      <div class="cardIcon">${a.icon}</div>
      <div class="cardName">${a.name}</div>
      <div class="cardDesc">+${a.hp} Can | %${a.def} Savunma${a.spd?'<br>'+a.spd+'% Hız':''}</div>
      ${equipped?'<span class="cardBadge equipped">✓ Kuşanılı</span>':''}
      <div style="margin-top:6px;">
        ${equipped
          ?'<span style="color:#FFD700;font-size:9px;">Aktif zırh</span>'
          :isOwned
            ?`<button onclick="equipArmor('${a.id}')" style="width:100%;padding:4px;background:rgba(39,174,96,.2);border:1px solid #27ae60;border-radius:3px;color:#2ecc71;font-size:9px;cursor:pointer;font-family:Cinzel,serif;">Kuşan</button>`
            :canAff
              ?`<span class="cardCost">💰 ${a.cost}</span><button onclick="buyArmor('${a.id}')" style="margin-top:3px;width:100%;padding:4px;background:rgba(39,174,96,.2);border:1px solid #27ae60;border-radius:3px;color:#2ecc71;font-size:9px;cursor:pointer;font-family:Cinzel,serif;">Satın Al & Kuşan</button>`
              :`<span class="cardCost cantAfford">💰 ${a.cost} Akçe gerekli</span>`
        }
      </div>
    </div>`;
  });
  html+='</div>';return html;
}
function buyArmor(id){
  const costs={leather:200,chain:500,plate:1000,ottoman:2500};
  if(!spendMain(costs[id]))return;
  if(!SAVE.armorOwned)SAVE.armorOwned=['none'];
  if(!SAVE.armorOwned.includes(id))SAVE.armorOwned.push(id);
  SAVE.armor=id;saveGame();
  pl.maxHp=getBaseMaxHp();pl.hp=Math.min(pl.hp,pl.maxHp);
  pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;
  lootPop('Zırh satın alındı ve kuşanıldı! 🛡');openZone('cebehane');
}
function equipArmor(id){
  SAVE.armor=id;saveGame();
  pl.maxHp=getBaseMaxHp();
  pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;
  lootPop('Zırh kuşanıldı! 🛡');openZone('cebehane');
}

// ── DRILL GROUND (YETENEK) ──
function buildDrillUI(){
  const passives=[
    {id:'guc',        name:'Güç',         icon:'⚔', descs:['+%10 Hasar','+%20 Hasar','+%35 Hasar'],        costs:[100,250,500]},
    {id:'hiz',        name:'Hız',         icon:'💨', descs:['+%10 Hız','+%20 Hız','Koşu enerji -%30'],       costs:[100,250,500]},
    {id:'dayaniklilik',name:'Dayanıklılık',icon:'❤',descs:['+25 Max Can','+50 Max Can','Hasar alınca can yenile'],costs:[150,350,700]},
    {id:'loot',       name:'Loot',        icon:'🧲', descs:['Mıknatıs +2m','+%20 Akçe','Nadir item +%15'], costs:[80,200,400]},
  ];
  // Pasif yetenekler
  let html='<div style="color:#FFD700;font-size:9px;letter-spacing:2px;margin-bottom:8px;">PASİF YETENEKler</div>';
  html+='<div class="cardGrid">';
  passives.forEach(function(p){
    const lvl=SAVE.passives[p.id]||0;const isMax=lvl>=3;const nextCost=p.costs[lvl];const canAff=mainGold>=nextCost;
    html+=`<div class="itemCard ${isMax?'maxed':''}">
      <div class="cardIcon">${p.icon}</div>
      <div class="cardName">${p.name}</div>
      <div class="cardDesc">${lvl>0?'Aktif: '+p.descs[lvl-1]:'Pasif yetenek'}</div>
      <div class="lvlBar"><div class="lvlBarFill" style="width:${lvl/3*100}%"></div></div>
      ${isMax?'<span class="cardBadge maxed">MAX</span>':
        `<div style="margin-top:5px;">
          <div style="color:#888;font-size:8px;margin-bottom:3px;">Sv.${lvl+1}: ${p.descs[lvl]}</div>
          <button onclick="upgradePassive('${p.id}')" style="width:100%;padding:4px;background:${canAff?'rgba(52,152,219,.2)':'rgba(100,0,0,.2)'};border:1px solid ${canAff?'#3498db':'#7B1414'};border-radius:3px;color:${canAff?'#5dade2':'#c0392b'};font-size:9px;cursor:${canAff?'pointer':'not-allowed'};font-family:Cinzel,serif;">
            💰 ${nextCost} Akçe
          </button>
        </div>`}
    </div>`;
  });
  html+='</div>';

  // Aktif yetenekler
  html+='<div style="color:#FFD700;font-size:9px;letter-spacing:2px;margin:14px 0 8px;">AKTİF YETENEKler (Q/F/R)</div>';
  html+='<div class="cardGrid">';
  const abDefs=[
    {key:'q',def:ABILITY_DEFS.savasciglik},
    {key:'f',def:ABILITY_DEFS.demir_kalkan},
    {key:'r',def:ABILITY_DEFS.hizli_atis},
  ];
  abDefs.forEach(function(a){
    const ab=SAVE.abilities[a.key]||{lvl:0,unlocked:false};
    const unlocked=ab.unlocked&&ab.lvl>0;
    const lvl=ab.lvl||0;
    const isMax=lvl>=5;
    const canUnlock=mainGold>=a.def.unlockCost;
    const upgCosts=[0,200,400,800,1600];
    const canUpg=unlocked&&!isMax&&mainGold>=upgCosts[lvl];
    const curDesc=unlocked&&lvl>0?a.def.levels[lvl-1].desc:'Kilitli';
    html+=`<div class="itemCard ${unlocked?isMax?'maxed':'owned':''}">
      <div class="cardIcon">${a.def.icon}</div>
      <div class="cardName">${a.def.name}</div>
      <div class="cardDesc" style="font-size:8px;">${curDesc}</div>
      ${unlocked?`<div class="lvlBar"><div class="lvlBarFill" style="width:${lvl/5*100}%"></div></div>`:''}
      <div style="margin-top:6px;">
        ${!unlocked
          ?`<span class="cardCost ${canUnlock?'':'cantAfford'}">💰 ${a.def.unlockCost} Akçe</span>
            <button onclick="unlockAbility('${a.key}')" style="margin-top:3px;width:100%;padding:4px;background:${canUnlock?'rgba(155,89,182,.25)':'rgba(100,0,0,.2)'};border:1px solid ${canUnlock?'#9b59b6':'#7B1414'};border-radius:3px;color:${canUnlock?'#c39bd3':'#c0392b'};font-size:9px;cursor:${canUnlock?'pointer':'not-allowed'};font-family:Cinzel,serif;">Aç (${a.key.toUpperCase()})</button>`
          :isMax?'<span class="cardBadge maxed">MAX SEVİYE</span>'
          :`<div style="font-size:8px;color:#888;margin-bottom:3px;">Sv.${lvl+1}: ${a.def.levels[lvl].desc}</div>
            <span class="cardCost ${canUpg?'':'cantAfford'}">💰 ${upgCosts[lvl]}</span>
            <button onclick="upgradeAbility('${a.key}')" style="margin-top:3px;width:100%;padding:4px;background:${canUpg?'rgba(155,89,182,.25)':'rgba(100,0,0,.2)'};border:1px solid ${canUpg?'#9b59b6':'#7B1414'};border-radius:3px;color:${canUpg?'#c39bd3':'#c0392b'};font-size:9px;cursor:${canUpg?'pointer':'not-allowed'};font-family:Cinzel,serif;">Yükselt</button>`
        }
      </div>
    </div>`;
  });
  html+='</div>';
  return html;
}
function upgradePassive(id){
  const costs={guc:[100,250,500],hiz:[100,250,500],dayaniklilik:[150,350,700],loot:[80,200,400]};
  const lvl=SAVE.passives[id]||0;if(lvl>=3)return;
  if(!spendMain(costs[id][lvl]))return;
  SAVE.passives[id]=lvl+1;saveGame();
  pl.spd=getBaseSpd();pl.rspd=pl.spd*1.8;pl.maxHp=getBaseMaxHp();
  lootPop('Yetenek gelişti! ✨');openZone('drill');
}

// ── HAMAM ──
function buildHamamUI(){
  const healCost=50, maxHpCost=200, maxEnCost=150;
  const curMaxHp=getBaseMaxHp(), curMaxEn=getBaseMaxEn();
  return`<div style="display:flex;flex-direction:column;gap:8px;">
    <div class="itemCard">
      <div class="cardIcon">💊</div>
      <div class="cardName">Can Yenile</div>
      <div class="cardDesc">Canını tamamen yenile (${Math.ceil(pl.hp)}/${curMaxHp})</div>
      <div class="cardCost ${mainGold>=healCost?'':'cantAfford'}">💰 ${healCost} Akçe</div>
      <button onclick="healPlayer()" style="margin-top:5px;width:100%;padding:5px;background:${mainGold>=healCost?'rgba(39,174,96,.2)':'rgba(100,0,0,.1)'};border:1px solid ${mainGold>=healCost?'#27ae60':'#7B1414'};border-radius:3px;color:${mainGold>=healCost?'#2ecc71':'#c0392b'};font-size:10px;cursor:pointer;font-family:Cinzel,serif;">Dinlen & İyileş</button>
    </div>
    <div class="itemCard">
      <div class="cardIcon">❤</div>
      <div class="cardName">Max Can +25</div>
      <div class="cardDesc">Kalıcı can artışı<br>Şu an: ${curMaxHp} → ${curMaxHp+25}</div>
      <div class="cardCost ${mainGold>=maxHpCost?'':'cantAfford'}">💰 ${maxHpCost} Akçe</div>
      <button onclick="buyMaxHp()" style="margin-top:5px;width:100%;padding:5px;background:${mainGold>=maxHpCost?'rgba(52,152,219,.2)':'rgba(100,0,0,.1)'};border:1px solid ${mainGold>=maxHpCost?'#3498db':'#7B1414'};border-radius:3px;color:${mainGold>=maxHpCost?'#5dade2':'#c0392b'};font-size:10px;cursor:pointer;font-family:Cinzel,serif;">Satın Al</button>
    </div>
    <div class="itemCard">
      <div class="cardIcon">⚡</div>
      <div class="cardName">Max Enerji +20</div>
      <div class="cardDesc">Kalıcı enerji artışı<br>Şu an: ${curMaxEn} → ${curMaxEn+20}</div>
      <div class="cardCost ${mainGold>=maxEnCost?'':'cantAfford'}">💰 ${maxEnCost} Akçe</div>
      <button onclick="buyMaxEn()" style="margin-top:5px;width:100%;padding:5px;background:${mainGold>=maxEnCost?'rgba(255,165,0,.2)':'rgba(100,0,0,.1)'};border:1px solid ${mainGold>=maxEnCost?'#f39c12':'#7B1414'};border-radius:3px;color:${mainGold>=maxEnCost?'#f39c12':'#c0392b'};font-size:10px;cursor:pointer;font-family:Cinzel,serif;">Satın Al</button>
    </div>
  </div>`;
}
function healPlayer(){
  if(!spendMain(50))return;
  pl.hp=pl.maxHp;
  lootPop('Can tamamen yenilendi! 💧');
  closeZoneMenu();
}
function buyMaxHp(){
  if(!spendMain(200))return;
  SAVE.maxHpBonus=(SAVE.maxHpBonus||0)+25;
  saveGame();
  pl.maxHp=getBaseMaxHp();
  pl.hp=Math.min(pl.hp+25,pl.maxHp);
  lootPop('+25 Max Can! ❤');
  openZone('hamam');
}
function buyMaxEn(){
  if(!spendMain(150))return;
  SAVE.maxEnBonus=(SAVE.maxEnBonus||0)+20;
  saveGame();
  pl.maxEn=getBaseMaxEn();
  lootPop('+20 Max Enerji! ⚡');
  openZone('hamam');
}

