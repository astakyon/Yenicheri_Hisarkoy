/**
 * maps/KislaMap.js — Yeniçeri Kışlası (Ana Üs)
 * Özgür dolaşım, 7 bölge kapısı, geliştirme & dinlenme
 * v1.00
 */

'use strict';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Bus, EVENTS, CONSTANTS } from '../core/Engine.js';
import { Gold }   from '../systems/GoldSystem.js';
import { Player, WEAPON_DEFS, ARMOR_DEFS, PASSIVE_DEFS, ABILITY_DEFS } from '../systems/PlayerSystem.js';
import { Input }  from '../systems/InputSystem.js';
import { UI }     from '../ui/UIManager.js';
import { Save }   from '../core/SaveSystem.js';
import { Maps }   from './MapManager.js';

// ─── BÖLGE TANIMLARI (Blueprint'e sadık) ─────────────────────
const ZONES = [
  {
    id: 'armory', name: 'Armory', icon: '⚔',
    desc: 'Silahlarını yükselt',
    x: -15, z: -18, w: 10, d: 7,
    color: 0x8B3010,
    doorX: -15, doorZ: -14,
  },
  {
    id: 'cebehane', name: 'Cebehane', icon: '🛡',
    desc: 'Zırh & mühimmat',
    x: 5, z: -12, w: 9, d: 7,
    color: 0x2a4010,
    doorX: 5, doorZ: -8,
  },
  {
    id: 'drill', name: 'Drill Ground', icon: '⚡',
    desc: 'Yetenek geliştir',
    x: -10, z: 5, w: 14, d: 12,
    color: 0x604020,
    doorX: -10, doorZ: -1,
    isOpen: true, // kapısız alan
  },
  {
    id: 'hamam', name: 'Sultan Hamamı', icon: '💧',
    desc: 'Dinlen, canını yenile',
    x: 16, z: -5, w: 10, d: 10,
    color: 0x203040,
    doorX: 16, doorZ: 0,
  },
  {
    id: 'kervansaray', name: 'Kervansaray', icon: '🏠',
    desc: 'Tüccarlar & harita aç',
    x: 18, z: 14, w: 14, d: 9,
    color: 0x3a2800,
    doorX: 18, doorZ: 9,
  },
  {
    id: 'camii', name: 'Orta Camii', icon: '🕌',
    desc: 'Kaydet & buff al',
    x: 0, z: -5, w: 8, d: 8,
    color: 0x202840,
    doorX: 0, doorZ: -1,
  },
  {
    id: 'carsi', name: 'Çarşı Meydanı', icon: '🛒',
    desc: 'Market & sarf malzeme',
    x: 12, z: 5, w: 10, d: 7,
    color: 0x3a1a00,
    doorX: 12, doorZ: 2,
  },
];

export default class KislaMap {
  constructor() {
    this._scene   = null;
    this._cam     = null;
    this._ren     = null;
    this._clock   = null;

    this._pl = { x: 0, z: 15, mesh: null, ang: 0, en: 100, maxEn: 100 };
    this._parts   = [];
    this._torches = [];
    this._paused  = false;
    this._nearZone= null;   // aktif bölge
    this._unsubs  = [];
    this._npcMeshes = [];
  }

  async init() {
    this._initThree();
    this._buildWorld();
    this._buildPlayer();
    this._buildNPCs();
    this._bindEvents();

    const st = Player.stats;
    this._pl.maxEn = st.maxEn;
    this._pl.en    = st.maxEn;

    // Kışlaya giren oyuncuya bir kez ücretsiz iyileştirme
    this._freeHealUsed = false;

    console.log('[KislaMap] başlatıldı');
  }

  // ─── THREE.JS ──────────────────────────────────────────────
  _initThree() {
    const W = window.innerWidth, H = window.innerHeight;
    this._scene = new THREE.Scene();
    this._scene.fog = new THREE.Fog(0x8ab4d8, 40, 90);
    this._scene.background = new THREE.Color(0x8ab4d8);

    this._cam = new THREE.PerspectiveCamera(52, W/H, 0.1, 120);
    this._cam.position.set(0, 14, 15);
    this._cam.lookAt(0, 0, 0);

    const cv = document.getElementById('c3d');
    cv.width = W; cv.height = H;
    this._ren = new THREE.WebGLRenderer({ antialias: true, canvas: cv });
    this._ren.setSize(W, H);
    this._ren.shadowMap.enabled = true;
    this._ren.toneMapping = THREE.ACESFilmicToneMapping;
    this._ren.toneMappingExposure = 1.8;

    window.addEventListener('resize', () => {
      const W2 = window.innerWidth, H2 = window.innerHeight;
      this._ren.setSize(W2, H2);
      this._cam.aspect = W2 / H2;
      this._cam.updateProjectionMatrix();
    });
  }

  _buildWorld() {
    // Işıklar — kışla gündüz
    const sun = new THREE.DirectionalLight(0xFFF5E0, 3.2);
    sun.position.set(10, 30, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left=-40; sun.shadow.camera.right=40;
    sun.shadow.camera.top=40;   sun.shadow.camera.bottom=-40;
    this._scene.add(sun);
    this._scene.add(new THREE.AmbientLight(0xE8F0FF, 1.5));
    this._scene.add(new THREE.HemisphereLight(0x87CEEB, 0xC8B870, 1.0));

    // Zemin — kum/taş
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshLambertMaterial({color:0xD4B870}));
    gnd.rotation.x=-Math.PI/2; gnd.receiveShadow=true; this._scene.add(gnd);
    // Taş döşeme
    for (let i=-8;i<=8;i++) for(let j=-8;j<=8;j++) if((i+j)%2===0) {
      const st=new THREE.Mesh(new THREE.BoxGeometry(4.6,0.05,4.6),new THREE.MeshLambertMaterial({color:0xC8A850}));
      st.position.set(i*5,0.01,j*5); st.receiveShadow=true; this._scene.add(st);
    }

    // Dış çevre yeşil
    const grass=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshLambertMaterial({color:0x6aaa40}));
    grass.rotation.x=-Math.PI/2; grass.position.y=-0.05; this._scene.add(grass);

    // Surlar (kışla dış duvarları)
    this._bx(0,2.5,-30,64,5,2.5,0xC8A870);
    this._bx(0,2.5,30,64,5,2.5,0xC8A870);
    this._bx(-30,2.5,0,2.5,5,64,0xC8A870);
    this._bx(30,2.5,0,2.5,5,64,0xC8A870);
    // Kuleler
    [[29,-29],[29,29],[-29,-29],[-29,29]].forEach(([cx,cz])=>{
      this._bx(cx,3,cz,5,6,5,0xB09060);
    });

    // Tunç Nehri (kuzeyde görünür)
    const river = new THREE.Mesh(new THREE.PlaneGeometry(70,8),new THREE.MeshLambertMaterial({color:0x2050A0}));
    river.rotation.x=-Math.PI/2; river.position.set(0,0.05,-34); this._scene.add(river);

    // Bölgeler
    ZONES.forEach(z => this._buildZone(z));

    // Fenerler
    [[-25,-25],[25,-25],[-25,25],[25,25],[0,-20],[0,20],[-20,0],[20,0]].forEach(([x,z])=>{
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,2,7),new THREE.MeshLambertMaterial({color:0x5a3800}));
      pole.position.set(x,1.4,z); this._scene.add(pole);
      const pt=new THREE.PointLight(0xFF9933,2,12); pt.position.set(x,3,z); this._scene.add(pt);
      this._torches.push({light:pt,phase:Math.random()*Math.PI*2});
      const fl=new THREE.Mesh(new THREE.SphereGeometry(0.2,6,4),new THREE.MeshLambertMaterial({color:0xFF8800,emissive:0xFF5500,emissiveIntensity:2}));
      fl.position.set(x,3,z); this._scene.add(fl);
    });

    // Talim alanı — kukla hedefler
    [[-14,8],[-10,8],[-6,8],[-14,12],[-10,12]].forEach(([x,z])=>{
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,1.8,6),new THREE.MeshLambertMaterial({color:0x6B3A15}));
      pole.position.set(x,0.9,z); this._scene.add(pole);
      const body=new THREE.Mesh(new THREE.BoxGeometry(0.7,1.0,0.3),new THREE.MeshLambertMaterial({color:0xD4A050}));
      body.position.set(x,1.9,z); this._scene.add(body);
    });
  }

  _buildZone(z) {
    // Bina
    const bld = this._bx(z.x, 2.5, z.z, z.w, 5, z.d, z.color);
    // Çatı
    const roof= new THREE.Mesh(new THREE.ConeGeometry(Math.max(z.w,z.d)*0.72,2.5,4),new THREE.MeshLambertMaterial({color:0x8B3010}));
    roof.rotation.y=Math.PI/4; roof.position.set(z.x,5.8,z.z); roof.castShadow=true; this._scene.add(roof);
    // Levha
    const sign= new THREE.Mesh(new THREE.BoxGeometry(3,0.8,0.15),new THREE.MeshLambertMaterial({color:0x5a3800}));
    sign.position.set(z.doorX,4,z.doorZ-0.2); this._scene.add(sign);
    // Kapı
    const door= new THREE.Mesh(new THREE.BoxGeometry(1.6,2.8,0.3),new THREE.MeshLambertMaterial({color:0x3a1800}));
    door.position.set(z.doorX,1.4,z.doorZ); this._scene.add(door);
    // Işık (kapının üstü)
    const zLight= new THREE.PointLight(0xFFCC66,1.5,6); zLight.position.set(z.doorX,3.5,z.doorZ); this._scene.add(zLight);
  }

  // ─── OYUNCU ────────────────────────────────────────────────
  _buildPlayer() {
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.5,0.55),new THREE.MeshLambertMaterial({color:0x9B2020}));
    body.position.y=1.15; body.castShadow=true; g.add(body);
    const skirt=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.62,0.8,8),new THREE.MeshLambertMaterial({color:0x8B1818}));
    skirt.position.y=0.55; g.add(skirt);
    [-0.22,0.22].forEach(ox=>{
      const leg=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.9,0.4),new THREE.MeshLambertMaterial({color:0x501010}));
      leg.position.set(ox,0.45,0); g.add(leg);
    });
    const head=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.58,0.55),new THREE.MeshLambertMaterial({color:0xC8956C}));
    head.position.y=2.15; head.castShadow=true; g.add(head);
    const bork=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.33,0.75,8),new THREE.MeshLambertMaterial({color:0xD4B050}));
    bork.position.set(0,2.65,0); g.add(bork);
    g.castShadow=true; this._scene.add(g);
    this._pl.mesh=g; g.position.set(this._pl.x,0,this._pl.z);
  }

  // ─── NPC'LER ───────────────────────────────────────────────
  _buildNPCs() {
    const npcColors = [0x1a3060, 0x602010, 0x106020];
    [[-15,-14,0],[5,-8,1],[16,0,2]].forEach(([x,z,ci])=>{
      const g=new THREE.Group();
      const body=new THREE.Mesh(new THREE.BoxGeometry(0.85,1.4,0.5),new THREE.MeshLambertMaterial({color:npcColors[ci]}));
      body.position.y=1; g.add(body);
      const head=new THREE.Mesh(new THREE.BoxGeometry(0.58,0.52,0.5),new THREE.MeshLambertMaterial({color:0xC8956C}));
      head.position.y=2; g.add(head);
      g.position.set(x,0,z); this._scene.add(g);
      this._npcMeshes.push(g);
    });
  }

  // ─── OLAYLAR ───────────────────────────────────────────────
  _bindEvents() {
    this._unsubs.push(Bus.on('input:interact', () => {
      if (this._nearZone) this._openZoneMenu(this._nearZone);
    }));
  }

  _openZoneMenu(zone) {
    this._paused = true;
    Bus.emit(EVENTS.UI_SHOW_SCREEN, { screen: `screen-zone-${zone.id}` });
    // Menü açılmadan önce ekrana özel veriyi hazırla
    Bus.emit('zone:open', { zone, gold: Gold.mainGold, save: Save.getData() });
  }

  // ─── GÜNCELLEME ────────────────────────────────────────────
  update(dt) {
    if (this._paused || !this._pl.mesh) return;

    this._updateMovement(dt);
    this._updateTorches();
    this._checkNearZone();
    this._updateCamera();
    this._updateNPCs(dt);
    this._ren.render(this._scene, this._cam);
  }

  _updateMovement(dt) {
    const st  = Player.stats;
    const spd = st.spd * dt;
    const { dx, dz } = Input.getMovement();
    this._pl.x = Math.max(-28, Math.min(28, this._pl.x + dx*spd));
    this._pl.z = Math.max(-28, Math.min(28, this._pl.z + dz*spd));
    this._pl.mesh.position.set(this._pl.x, 0, this._pl.z);
    if (Math.abs(dx)+Math.abs(dz) > 0.1) {
      this._pl.ang = Math.atan2(dz, dx);
      this._pl.mesh.rotation.y = -this._pl.ang + Math.PI/2;
    }
  }

  _checkNearZone() {
    let found = null;
    const NEAR = 3.5;
    for (const z of ZONES) {
      if (Math.hypot(this._pl.x-z.doorX, this._pl.z-z.doorZ) < NEAR) { found=z; break; }
    }
    this._nearZone = found;
    const el = document.getElementById('hud-interact');
    if (el) {
      el.textContent = found ? `[ E ] ${found.icon} ${found.name}` : '';
      el.style.display = found ? 'block' : 'none';
    }
  }

  _updateCamera() {
    const smooth = Input.joy.active ? 0.18 : 0.09;
    this._cam.position.x += (this._pl.x - this._cam.position.x) * smooth;
    this._cam.position.z += (this._pl.z + 14 - this._cam.position.z) * smooth;
    this._cam.lookAt(this._pl.x, 0, this._pl.z);
  }

  _updateTorches() {
    this._torches.forEach(t => {
      t.phase += 0.06;
      t.light.intensity = 2.0 + Math.sin(t.phase)*0.4;
    });
  }

  _updateNPCs(dt) {
    // Basit sallanma animasyonu
    this._npcMeshes.forEach((m, i) => {
      m.rotation.y = Math.sin(Date.now()*0.001 + i) * 0.1;
    });
  }

  // ─── BÖLGE AKSİYONLARI (UI'dan çağrılır) ──────────────────

  // Silah yükselt
  static upgradeWeapon(weaponId) {
    const sd  = Save.getData();
    const w   = sd.weapons[weaponId];
    if (!w || !w.owned || w.level >= 5) return { ok: false, msg: 'Max seviyede!' };
    const def  = WEAPON_DEFS[weaponId];
    const cost = def.upgradeCost[w.level];
    if (!Gold.spendMain(cost)) return { ok: false, msg: 'Yetersiz akçe!' };
    Save.set(`weapons.${weaponId}.level`, w.level + 1);
    Bus.emit(EVENTS.UI_NOTIFICATION, { text: `${def.name} Sv.${w.level+1} oldu! ⚔`, type: 'upgrade' });
    return { ok: true };
  }

  // Zırh al
  static buyArmor(armorId) {
    const def  = ARMOR_DEFS[armorId];
    const owned= Save.get('armor.owned') || ['none'];
    if (owned.includes(armorId)) {
      Save.set('armor.current', armorId);
      Player.init(); // statları yeniden hesapla
      Bus.emit(EVENTS.UI_NOTIFICATION, { text: `${def.name} kuşanıldı!`, type: 'upgrade' });
      return { ok: true };
    }
    if (!Gold.spendMain(def.cost)) return { ok: false, msg: 'Yetersiz akçe!' };
    owned.push(armorId);
    Save.set('armor.owned', owned);
    Save.set('armor.current', armorId);
    Player.init();
    Bus.emit(EVENTS.UI_NOTIFICATION, { text: `${def.name} satın alındı!`, type: 'upgrade' });
    return { ok: true };
  }

  // Pasif yetenek yükselt
  static upgradePassive(passiveId) {
    const def   = PASSIVE_DEFS[passiveId];
    const curLvl= Save.get(`player.abilities.passive.${passiveId}`) || 0;
    if (curLvl >= def.levels.length) return { ok: false, msg: 'Max seviye!' };
    const cost  = def.levels[curLvl].cost;
    if (!Gold.spendMain(cost)) return { ok: false, msg: 'Yetersiz akçe!' };
    Save.set(`player.abilities.passive.${passiveId}`, curLvl+1);
    Player.init();
    Bus.emit(EVENTS.UI_NOTIFICATION, { text: `${def.name} Sv.${curLvl+1}! ${def.icon}`, type: 'upgrade' });
    return { ok: true };
  }

  // Aktif yetenek aç/yükselt
  static upgradeAbility(abilityId) {
    const def   = Object.values(ABILITY_DEFS).find(d => d.id===abilityId || d.name===abilityId);
    if (!def) return { ok: false, msg: 'Bulunamadı' };
    const key   = def.key;
    const saved = Save.get(`player.abilities.active.${key}`) || { level:0, unlocked:false };
    if (!saved.unlocked) {
      if (!Gold.spendMain(def.unlockCost)) return { ok: false, msg: 'Yetersiz akçe!' };
      Save.set(`player.abilities.active.${key}`, { id: abilityId, level:1, unlocked:true });
      Bus.emit(EVENTS.UI_NOTIFICATION, { text: `${def.name} açıldı! ${def.icon}`, type: 'unlock' });
      return { ok: true };
    }
    if (saved.level >= def.levels.length) return { ok: false, msg: 'Max seviye!' };
    const cost = def.levels[saved.level].cost;
    if (!Gold.spendMain(cost)) return { ok: false, msg: 'Yetersiz akçe!' };
    Save.set(`player.abilities.active.${key}.level`, saved.level+1);
    Bus.emit(EVENTS.UI_NOTIFICATION, { text: `${def.name} Sv.${saved.level+1}!`, type: 'upgrade' });
    return { ok: true };
  }

  // Hamam — iyileştir
  static healPlayer() {
    const cost = 50;
    if (!Gold.spendMain(cost)) return { ok: false, msg: 'Yetersiz akçe!' };
    Bus.emit(EVENTS.PLAYER_HEALED, { hp: Player.stats.maxHp, maxHp: Player.stats.maxHp, en: Player.stats.maxEn, maxEn: Player.stats.maxEn });
    Bus.emit(EVENTS.UI_NOTIFICATION, { text: 'Can yenilendi! 💧', type: 'heal' });
    return { ok: true };
  }

  // ─── YARDIMCI ──────────────────────────────────────────────
  _bx(x,y,z,w,h,d,col) {
    const geo=new THREE.BoxGeometry(w,h,d);
    const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:col}));
    m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; this._scene.add(m);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x8B6914})));
    return m;
  }

  pause()  { this._paused=true; }
  resume() { this._paused=false; }

  destroy() {
    this._unsubs.forEach(fn=>fn()); this._unsubs=[];
    this._scene?.traverse(obj=>{
      if(obj.geometry)obj.geometry.dispose();
      if(obj.material){if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material.dispose();}
    });
    this._ren?.dispose();
    console.log('[KislaMap] temizlendi');
  }
}
