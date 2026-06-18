/**
 * maps/GorevMap.js — Hisarköy Devriye Haritası
 * Savaş haritası: dalga sistemi, düşmanlar, loot, boss
 * v1.00
 */

'use strict';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Bus, EVENTS, CONSTANTS, Loop } from '../core/Engine.js';
import { Gold }      from '../systems/GoldSystem.js';
import { Player }    from '../systems/PlayerSystem.js';
import { Input }     from '../systems/InputSystem.js';
import { AbilitySystem } from '../systems/AbilitySystem.js';
import { WaveSystem as Wave } from '../systems/WaveSystem.js';
import { UI }        from '../ui/UIManager.js';
import { Save }      from '../core/SaveSystem.js';

// ─── HARITA SABİTLERİ ────────────────────────────────────────
const MAP = {
  SIZE:     60,
  CAM_H:    14,
  CAM_DIST: 15,
};

export default class GorevMap {
  constructor() {
    this._scene    = null;
    this._cam      = null;
    this._ren      = null;
    this._clock    = null;

    // Oyuncu 3D state
    this._pl = {
      mesh:  null,
      x: 0, z: 8,
      hp: 100, maxHp: 100,
      en: 100, maxEn: 100,
      ang: 0,
      atkCd: 0, ifr: 0,
      nearInteract: null,
      shieldActive: false,
      speedMult: 1, dmgMult: 1, buffTimer: 0,
    };

    this._enemies    = [];
    this._bullets    = [];
    this._loots      = [];
    this._parts      = [];
    this._torches    = [];
    this._barrels    = [];
    this._worldAim   = { x: 0, z: 0 };
    this._raycaster  = null;
    this._groundPlane= null;
    this._gt         = 0;   // frame sayacı
    this._paused     = false;
    this._kills      = 0;
    this._selWeapon  = 0;  // 0=yatagan 1=tufek 2=ok
    this._pwr        = 0;
    this._pwrOn      = false;
    this._xpGained   = 0;

    // Olay dinleyici temizleyiciler
    this._unsubs = [];
  }

  // ─── BAŞLAT ────────────────────────────────────────────────
  async init() {
    this._initThree();
    this._buildWorld();
    this._buildPlayer();
    this._bindEvents();
    Wave.reset();
    this._kills = 0;
    this._xpGained = 0;

    // Oyuncu statlerini PlayerSystem'den al
    const st = Player.stats;
    this._pl.maxHp = st.maxHp;
    this._pl.maxEn = st.maxEn;
    this._pl.hp    = st.maxHp;
    this._pl.en    = st.maxEn;

    UI.updateHUD(this._pl);
    console.log('[GorevMap] başlatıldı');
  }

  // ─── THREE.JS ──────────────────────────────────────────────
  _initThree() {
    const W = window.innerWidth, H = window.innerHeight;
    this._scene = new THREE.Scene();
    this._scene.fog = new THREE.Fog(0x4a3010, 30, 78);
    this._scene.background = new THREE.Color(0x8ab4d8);

    this._cam = new THREE.PerspectiveCamera(52, W/H, 0.1, 120);
    this._cam.position.set(0, MAP.CAM_H, MAP.CAM_DIST);
    this._cam.lookAt(0, 0, 0);

    const cv = document.getElementById('c3d');
    cv.width = W; cv.height = H;
    this._ren = new THREE.WebGLRenderer({ antialias: true, canvas: cv });
    this._ren.setSize(W, H);
    this._ren.shadowMap.enabled = true;
    this._ren.shadowMap.type = THREE.PCFSoftShadowMap;
    this._ren.toneMapping = THREE.ACESFilmicToneMapping;
    this._ren.toneMappingExposure = 1.6;

    this._clock      = new THREE.Clock();
    this._raycaster  = new THREE.Raycaster();
    this._groundPlane= new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    window.addEventListener('resize', () => {
      const W2 = window.innerWidth, H2 = window.innerHeight;
      this._ren.setSize(W2, H2);
      this._cam.aspect = W2 / H2;
      this._cam.updateProjectionMatrix();
    });
  }

  _buildWorld() {
    // Işıklar
    const sun = new THREE.DirectionalLight(0xFFF5E0, 2.8);
    sun.position.set(15, 30, 10); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
    sun.shadow.camera.top  =  40; sun.shadow.camera.bottom = -40;
    this._scene.add(sun);
    this._scene.add(new THREE.AmbientLight(0xC8E0FF, 1.2));
    const fill = new THREE.DirectionalLight(0xFFE0A0, 0.8);
    fill.position.set(-10, 8, -5); this._scene.add(fill);
    this._scene.add(new THREE.HemisphereLight(0x87CEEB, 0xC8A060, 0.9));

    // Zemin
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshLambertMaterial({ color: 0xD4A96A })
    );
    gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true;
    this._scene.add(gnd);

    for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) {
      if ((i + j) % 2 === 0) {
        const st = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.06, 4.8),
          new THREE.MeshLambertMaterial({ color: 0xC89858 })
        );
        st.position.set(i*5, 0.02, j*5); st.receiveShadow = true;
        this._scene.add(st);
      }
    }
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshLambertMaterial({ color: 0x6aaa40 })
    );
    grass.rotation.x = -Math.PI / 2; grass.position.y = -0.05;
    this._scene.add(grass);

    // Surlar
    this._bx(0,2.5,-30,64,5,2.5,0xB09060); this._bx(0,2.5,30,64,5,2.5,0xB09060);
    this._bx(-30,2.5,0,2.5,5,64,0xB09060); this._bx(30,2.5,0,2.5,5,64,0xB09060);
    [[29,-29],[29,29],[-29,-29],[-29,29]].forEach(([cx,cz]) => {
      const k = this._bx(cx,3,cz,5,6,5,0xA08050);
      for (let i = 0; i < 3; i++) {
        const mg = new THREE.Mesh(new THREE.BoxGeometry(0.7,1.1,0.3), new THREE.MeshLambertMaterial({color:0x3a2800}));
        mg.position.set(-0.9+i*0.9, 2.2, 2.6); k.add(mg);
      }
    });

    // Binalar
    this._bx(18,2.8,-18,9,5.6,8,0xB8A060);
    const cRoof = new THREE.Mesh(new THREE.ConeGeometry(6,2.5,4),new THREE.MeshLambertMaterial({color:0x8B6914}));
    cRoof.rotation.y=Math.PI/4; cRoof.position.set(18,6,-18); this._scene.add(cRoof);
    this._bx(0,3.5,0,12,7,12,0xE0D0A0);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(5,20,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:0xC0B080}));
    dome.position.set(0,9,0); this._scene.add(dome);
    this._bx(-19,2.5,-8,10,5,10,0xD4C090);
    this._bx(12,2.5,20,14,5,9,0xB8A060);
    this._bx(-18,2.5,-20,11,5,7,0xB0A060);
    [[-10,-15,5,4],[5,-20,4,4],[-20,5,4,5],[15,8,5,4],[20,-8,4,4],[-5,15,5,4]].forEach(([x,z,w,d]) => {
      this._bx(x,2,z,w,4,d,0xC8A870);
      const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*0.75,2.5,4),new THREE.MeshLambertMaterial({color:0x8B3010}));
      r.rotation.y=Math.PI/4; r.position.set(x,4.5,z); r.castShadow=true; this._scene.add(r);
    });

    // Fenerler
    [[-29,0],[29,0],[0,-29],[0,29],[18,-14],[0,0],[12,20],[-19,-8]].forEach(([x,z]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,1.8,7),new THREE.MeshLambertMaterial({color:0x4a2800}));
      pole.position.set(x,1.4,z); this._scene.add(pole);
      const pt = new THREE.PointLight(0xFF9933, 3, 10);
      pt.position.set(x, 2.9, z); this._scene.add(pt);
      this._torches.push({ light: pt, phase: Math.random()*Math.PI*2 });
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.2,6,4),new THREE.MeshLambertMaterial({color:0xFF8800,emissive:0xFF5500,emissiveIntensity:2}));
      fl.position.set(x,2.9,z); this._scene.add(fl);
    });

    // Variller
    [[-5,-8],[6,-13],[13,-5],[-8,8],[16,-16],[-16,5],[9,16],[-11,-21]].forEach(([x,z]) => {
      const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.6,1.2,10),new THREE.MeshLambertMaterial({color:0x6B3A15}));
      bm.position.set(x,0.6,z); bm.castShadow=true; this._scene.add(bm);
      const rg = new THREE.TorusGeometry(0.59,0.07,6,12);
      const rm1= new THREE.Mesh(rg,new THREE.MeshLambertMaterial({color:0x8B6914}));
      rm1.rotation.x=Math.PI/2; rm1.position.y=0.25; bm.add(rm1);
      const rm2= rm1.clone(); rm2.position.y=-0.25; bm.add(rm2);
      this._barrels.push({ mesh: bm, hp: 2, x, z });
    });

    // Ağaçlar
    [[-25,5],[-25,-5],[25,5],[25,-5],[0,-32],[0,32],[-32,0],[32,0]].forEach(([x,z]) => {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.3,2.5,8),new THREE.MeshLambertMaterial({color:0x5a3800}));
      tr.position.set(x,1.25,z); tr.castShadow=true; this._scene.add(tr);
      const lv = new THREE.Mesh(new THREE.SphereGeometry(2,10,8),new THREE.MeshLambertMaterial({color:0x3a7030}));
      lv.position.set(x,4,z); lv.castShadow=true; this._scene.add(lv);
    });
  }

  // ─── OYUNCU MODELI ─────────────────────────────────────────
  _buildPlayer() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.5,0.55),new THREE.MeshLambertMaterial({color:0x9B2020}));
    body.position.y=1.15; body.castShadow=true; g.add(body);
    const skirt= new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.62,0.8,8),new THREE.MeshLambertMaterial({color:0x8B1818}));
    skirt.position.y=0.55; g.add(skirt);
    [-0.22,0.22].forEach(ox => {
      const leg= new THREE.Mesh(new THREE.BoxGeometry(0.36,0.9,0.4),new THREE.MeshLambertMaterial({color:0x501010}));
      leg.position.set(ox,0.45,0); g.add(leg);
      const bt = new THREE.Mesh(new THREE.BoxGeometry(0.36,0.3,0.5),new THREE.MeshLambertMaterial({color:0x2a1000}));
      bt.position.set(ox,0.15,0.05); g.add(bt);
    });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.62,0.58,0.55),new THREE.MeshLambertMaterial({color:0xC8956C}));
    head.position.y=2.15; head.castShadow=true; g.add(head);
    const must = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.08,0.1),new THREE.MeshLambertMaterial({color:0x3a2000}));
    must.position.set(0,2.05,0.28); g.add(must);
    const bork = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.33,0.75,8),new THREE.MeshLambertMaterial({color:0xD4B050}));
    bork.position.set(0,2.65,0); g.add(bork);
    const borkT= new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.2,0.5,6),new THREE.MeshLambertMaterial({color:0xFFD700}));
    borkT.position.y=0.62; bork.add(borkT);
    const wpn = new THREE.Mesh(new THREE.BoxGeometry(0.07,1.1,0.05),new THREE.MeshLambertMaterial({color:0xD0D0D0}));
    wpn.name='wpn'; wpn.position.set(0.58,1.4,0); wpn.rotation.z=-0.28; g.add(wpn);
    g.castShadow=true;
    this._scene.add(g);
    this._pl.mesh = g;
    g.position.set(this._pl.x, 0, this._pl.z);
  }

  // ─── OLAY BAĞLAYICILARI ────────────────────────────────────
  _bindEvents() {
    // Dalga başladı → düşman spawn et
    this._unsubs.push(Bus.on(EVENTS.WAVE_START, d => this._onWaveStart(d)));
    // Milestone (5'in katı) → mola
    this._unsubs.push(Bus.on(EVENTS.WAVE_MILESTONE, d => {
      this._paused = true;
      UI.showMilestone({ wave: d.wave, poolGold: Gold.poolGold });
    }));
    // Yetenek kullan
    this._unsubs.push(Bus.on('input:ability', ({ key }) => {
      AbilitySystem.use(key, this._makeAbilityCtx());
    }));
    // Etkileşim
    this._unsubs.push(Bus.on('input:interact', () => {
      if (this._pl.nearInteract === 'cebehane') {
        Bus.emit(EVENTS.UI_SHOW_SCREEN, { screen: 'screen-shop' });
        this._paused = true;
      }
    }));
    // Saldırı (mouse/dokunmatik)
    this._unsubs.push(Bus.on('input:attack', () => {
      if (this._selWeapon === 0) this._doMelee();
      else { this._pwrOn = true; this._pwr = 0; }
    }));
    this._unsubs.push(Bus.on('input:attackEnd', () => {
      if (this._pwrOn) { this._doRanged(); this._pwrOn = false; this._pwr = 0; }
    }));
  }

  _makeAbilityCtx() {
    return {
      px: this._pl.x, pz: this._pl.z,
      enemies: this._enemies,
      setShield:    (dur) => { this._pl.shieldActive = true; setTimeout(() => this._pl.shieldActive=false, dur*1000); },
      setSpeedBuff: (sm, dm, dur) => { this._pl.speedMult=sm; this._pl.dmgMult=dm; this._pl.buffTimer=dur; },
    };
  }

  // ─── DÜŞMAN SPAWN ──────────────────────────────────────────
  _onWaveStart({ count, isBoss }) {
    for (let i = 0; i < count; i++) this._spawnEnemy(isBoss && i === 0);
    Wave.setAliveCount(count);
  }

  _spawnEnemy(isBoss) {
    const g   = new THREE.Group();
    const eCol= isBoss ? 0x7B0000 : 0x4a2000;
    const bw  = isBoss ? 1.3 : 0.88, bh = isBoss ? 1.7 : 1.35;
    const body= new THREE.Mesh(new THREE.BoxGeometry(bw,bh,isBoss?0.75:0.48),new THREE.MeshLambertMaterial({color:eCol}));
    body.position.y = isBoss?1.25:1; body.castShadow=true; g.add(body);
    const head= new THREE.Mesh(new THREE.BoxGeometry(isBoss?0.78:0.58,isBoss?0.65:0.52,isBoss?0.65:0.5),new THREE.MeshLambertMaterial({color:0xA06840}));
    head.position.y = isBoss?2.25:2; g.add(head);
    if (isBoss) {
      const crown= new THREE.Mesh(new THREE.ConeGeometry(0.5,0.5,6),new THREE.MeshLambertMaterial({color:0xFFD700}));
      crown.position.y=0.75; head.add(crown);
    }
    const hpBg= new THREE.Mesh(new THREE.PlaneGeometry(isBoss?1.6:1.1,0.14),new THREE.MeshBasicMaterial({color:0x330000,side:THREE.DoubleSide,depthTest:false}));
    hpBg.position.set(0,isBoss?3.1:2.9,0); g.add(hpBg);
    const hpFl= new THREE.Mesh(new THREE.PlaneGeometry(isBoss?1.6:1.1,0.14),new THREE.MeshBasicMaterial({color:isBoss?0xFFD700:0x22cc55,side:THREE.DoubleSide,depthTest:false}));
    hpFl.position.set(0,isBoss?3.1:2.9,0.01); g.add(hpFl);
    const ang = Math.random()*Math.PI*2, dist = 28+Math.random()*3;
    const ex  = Math.cos(ang)*dist, ez = Math.sin(ang)*dist;
    g.position.set(ex,0,ez); this._scene.add(g);
    const maxHp = isBoss ? 160 : 18 + Wave.wave*4;
    this._enemies.push({ mesh:g, hpFl, hp:maxHp, maxHp, x:ex, z:ez, spd:0.055+Wave.wave*0.005, isBoss, hurtT:0, stunned:0 });
  }

  // ─── SAVAŞ ─────────────────────────────────────────────────
  _doMelee() {
    if (this._pl.atkCd > 0) return;
    this._pl.atkCd = 22;
    const ax = this._pl.x + Math.cos(this._pl.ang)*2.6;
    const az = this._pl.z + Math.sin(this._pl.ang)*2.6;
    this._addFX(ax, az, 0xFFD700, 7);

    const dmg = Player.getWeaponDamage('yatagan') * this._pl.dmgMult;
    this._enemies.forEach(en => {
      if (Math.hypot(en.x-ax, en.z-az) < 2.9) { en.hp -= dmg; en.hurtT=9; this._addFX(en.x,en.z,0xcc2222,4); }
    });
    this._barrels.forEach(b => {
      if (b.hp > 0 && Math.hypot(b.x-ax, b.z-az) < 2.2) {
        b.hp--; this._addFX(b.x,b.z,0x8B4513,4);
        if (b.hp <= 0) { this._scene.remove(b.mesh); this._dropLoot(b.x,b.z,3); Bus.emit(EVENTS.UI_NOTIFICATION,{text:'Varil patladı! 💥',type:'info'}); }
      }
    });
    this._barrels = this._barrels.filter(b => b.hp > 0);
  }

  _doRanged() {
    const st = Player.stats;
    if (this._pl.en < 8) return;
    const wid  = ['yatagan','tufek','ok'][this._selWeapon];
    const dmg  = Player.getWeaponDamage(wid) * this._pl.dmgMult + Math.floor(this._pwr/100*28);
    const rCol = this._selWeapon===1 ? 0xFFFDE7 : 0x8B4513;
    const m    = new THREE.Mesh(new THREE.SphereGeometry(this._selWeapon===1?0.1:0.09,5,4),new THREE.MeshBasicMaterial({color:rCol}));
    m.position.set(this._pl.x,1.1,this._pl.z); this._scene.add(m);
    const dx= this._worldAim.x-this._pl.x, dz= this._worldAim.z-this._pl.z;
    const l = Math.hypot(dx,dz)||1, sp= this._selWeapon===1?0.44:0.28;
    this._bullets.push({ mesh:m, vx:dx/l*sp, vz:dz/l*sp, dmg, life:85 });
    this._pl.en = Math.max(0, this._pl.en-8);
    this._addFX(this._pl.x, this._pl.z, rCol, 3);
  }

  // ─── LOOT ──────────────────────────────────────────────────
  _dropLoot(x, z, n=2) {
    const types = ['akce','deri','metal','akce','akce'];
    const goldMult = Player.stats.goldMult || 1;
    for (let i=0; i<n; i++) {
      const t   = types[Math.floor(Math.random()*types.length)];
      const lCol= t==='akce'?0xFFD700: t==='deri'?0x8B4513:0xAAAAAA;
      const m   = new THREE.Mesh(new THREE.SphereGeometry(0.2,7,5),new THREE.MeshLambertMaterial({color:lCol,emissive:lCol,emissiveIntensity:0.6}));
      m.position.set(x+(Math.random()-0.5)*2,0.3,z+(Math.random()-0.5)*2);
      this._scene.add(m);
      this._loots.push({ mesh:m, type:t, col:lCol, goldMult, x:m.position.x, z:m.position.z, vx:(Math.random()-0.5)*0.08, vz:(Math.random()-0.5)*0.08, collected:false });
    }
  }

  _addFX(x, z, col, n=7) {
    for (let i=0; i<n; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07+Math.random()*0.07,4,4),new THREE.MeshBasicMaterial({color:col}));
      m.position.set(x, 0.4+Math.random()*0.5, z); this._scene.add(m);
      const a = Math.random()*Math.PI*2;
      this._parts.push({ mesh:m, vx:Math.cos(a)*0.11, vy:0.1+Math.random()*0.08, vz:Math.sin(a)*0.11, life:20, maxLife:20 });
    }
  }

  // ─── ANA GÜNCELLEME ────────────────────────────────────────
  update(dt) {
    if (this._paused || !this._pl.mesh) return;
    this._gt++;

    // Dalga sistemi güncelle
    Wave.update();

    // Yetenekler
    AbilitySystem.update(dt);

    // Buff timer
    if (this._pl.buffTimer > 0) {
      this._pl.buffTimer -= dt;
      if (this._pl.buffTimer <= 0) { this._pl.speedMult=1; this._pl.dmgMult=1; }
    }

    this._updateMovement(dt);
    this._updateAim();
    this._updatePower(dt);
    this._updateLoot();
    this._updateBullets();
    this._updateEnemies(dt);
    this._updateParticles();
    this._updateTorches();
    this._checkInteract();
    this._updateCamera();
    this._updateHUD();

    // Render
    this._ren.render(this._scene, this._cam);
  }

  _updateMovement(dt) {
    const st  = Player.stats;
    const run = Input.keys.shift && this._pl.en > 1;
    const spd = (run ? st.rspd : st.spd) * this._pl.speedMult * dt;
    const { dx, dz } = Input.getMovement();
    const mov = dx!==0||dz!==0;

    this._pl.x = Math.max(-28, Math.min(28, this._pl.x + dx*spd));
    this._pl.z = Math.max(-28, Math.min(28, this._pl.z + dz*spd));
    this._pl.mesh.position.set(this._pl.x, 0, this._pl.z);

    // Enerji
    if (run && mov)  this._pl.en = Math.max(0, this._pl.en - 0.42 * (st.runCostMult||1));
    else if (!mov)   this._pl.en = Math.min(this._pl.maxEn, this._pl.en + 0.48);
    else             this._pl.en = Math.min(this._pl.maxEn, this._pl.en + 0.20);

    if (this._pl.atkCd > 0) this._pl.atkCd--;
    if (this._pl.ifr   > 0) this._pl.ifr--;

    // Silah rengi
    const wpnM = this._pl.mesh.getObjectByName('wpn');
    if (wpnM) wpnM.material.color.setHex([0xD0D0D0,0x505050,0x8B4513][this._selWeapon]);
  }

  _updateAim() {
    // Joystick aktifse fare kullanma
    const joyDir = Input.getJoyAimDir();
    if (joyDir) {
      this._worldAim.x = this._pl.x + joyDir.dx * 20;
      this._worldAim.z = this._pl.z + joyDir.dz * 20;
    } else if (this._ren) {
      const rect = this._ren.domElement.getBoundingClientRect();
      const nx = ((Input.mouse.x - rect.left) / rect.width)  * 2 - 1;
      const ny = -((Input.mouse.y - rect.top)  / rect.height) * 2 + 1;
      this._raycaster.setFromCamera({ x: nx, y: ny }, this._cam);
      const t = new THREE.Vector3();
      if (this._raycaster.ray.intersectPlane(this._groundPlane, t)) {
        this._worldAim.x = t.x; this._worldAim.z = t.z;
      }
    }
    const adx = this._worldAim.x - this._pl.x;
    const adz = this._worldAim.z - this._pl.z;
    if (Math.abs(adx)+Math.abs(adz) > 0.4) {
      this._pl.ang = Math.atan2(adz, adx);
      this._pl.mesh.rotation.y = -this._pl.ang + Math.PI/2;
    }
    // Joystick hareket ediyorken worldAim oyuncuyla kayar
    if (Input.joy.active) {
      this._worldAim.x = this._pl.x + Math.cos(this._pl.ang)*20;
      this._worldAim.z = this._pl.z + Math.sin(this._pl.ang)*20;
    }
  }

  _updatePower(dt) {
    if (!this._pwrOn) return;
    this._pwr = Math.min(100, this._pwr + 2.4);
    Bus.emit('ui:powerUpdate', { pct: this._pwr/100 });
  }

  _updateLoot() {
    const st      = Player.stats;
    const magDist = st.magnetDist || CONSTANTS.MAGNET_DIST;
    this._loots.forEach(l => {
      if (l.collected) return;
      const d = Math.hypot(this._pl.x-l.x, this._pl.z-l.z);
      if (d < CONSTANTS.COLLECT_DIST) {
        this._scene.remove(l.mesh); l.collected = true;
        if (l.type === 'akce') {
          const amt = Math.floor((4+Math.random()*7) * (l.goldMult||1));
          Gold.addPool(amt);
          // XP
          this._xpGained += 2;
        } else if (l.type === 'deri') {
          const prev = Save.get('stats.totalGoldEarned') || 0; // hammadde için slot yok şimdilik
          Bus.emit(EVENTS.UI_NOTIFICATION, { text: '+Deri 🟤', type: 'loot' });
        } else {
          Bus.emit(EVENTS.UI_NOTIFICATION, { text: '+Metal ⚙', type: 'loot' });
        }
        this._addFX(l.x, l.z, l.col, 4);
      } else if (d < magDist) {
        l.vx += (this._pl.x-l.x)/d*0.1; l.vz += (this._pl.z-l.z)/d*0.1;
        l.vx *= 0.82; l.vz *= 0.82;
      } else { l.vx *= 0.9; l.vz *= 0.9; }
      l.x += l.vx; l.z += l.vz;
      l.mesh.position.set(l.x, 0.28+Math.sin(this._gt*0.09+l.x)*0.07, l.z);
      l.mesh.rotation.y += 0.05;
    });
    this._loots = this._loots.filter(l => !l.collected);
  }

  _updateBullets() {
    this._bullets.forEach(b => {
      b.mesh.position.x += b.vx; b.mesh.position.z += b.vz; b.life--;
      const bx = b.mesh.position.x, bz = b.mesh.position.z;
      this._enemies.forEach(en => {
        if (Math.hypot(en.x-bx, en.z-bz) < 1.1 && b.life > 0) {
          en.hp -= b.dmg; b.life = 0; en.hurtT = 9; this._addFX(en.x,en.z,0xcc2222,4);
        }
      });
      if (b.life <= 0) this._scene.remove(b.mesh);
    });
    this._bullets = this._bullets.filter(b => b.life > 0);
  }

  _updateEnemies(dt) {
    this._enemies.forEach(en => {
      // Sersem kontrolü
      if (en.stunned > 0) { en.stunned -= dt; return; }
      if (en.hurtT > 0) { en.hurtT--; en.mesh.children[0].material.color.setHex(0xff3333); }
      else en.mesh.children[0].material.color.setHex(en.isBoss ? 0x7B0000 : 0x4a2000);

      const ex2= this._pl.x-en.x, ez2= this._pl.z-en.z;
      const d2 = Math.hypot(ex2, ez2);
      if (d2 > 0.5) { en.x+=ex2/d2*en.spd; en.z+=ez2/d2*en.spd; en.mesh.position.set(en.x,0,en.z); }
      en.mesh.rotation.y = Math.atan2(ex2, ez2);

      // HP bar billboard
      en.hpFl.scale.x = en.hp/en.maxHp;
      en.hpFl.position.x = (en.hp/en.maxHp-1)*(en.isBoss?0.8:0.55);
      en.mesh.children[2].lookAt(this._cam.position);
      en.mesh.children[3].lookAt(this._cam.position);

      // Oyuncuya hasar
      if (d2 < 1.1 && this._pl.ifr === 0 && !this._pl.shieldActive) {
        const def    = Player.stats.defense || 0;
        const damage = (en.isBoss ? 6 : 2) * (1 - def);
        this._pl.hp  = Math.max(0, this._pl.hp - damage);
        this._pl.ifr = 28;
        this._addFX(this._pl.x, this._pl.z, 0xcc2222, 5);
        Bus.emit(EVENTS.PLAYER_DAMAGED, { hp: this._pl.hp, maxHp: this._pl.maxHp, en: this._pl.en, maxEn: this._pl.maxEn });
        if (this._pl.hp <= 0) {
          this._paused = true;
          Bus.emit(EVENTS.PLAYER_DIED, { kills: this._kills, wave: Wave.wave });
        }
      }
    });

    // Ölen düşmanlar
    this._enemies = this._enemies.filter(en => {
      if (en.hp > 0) return true;
      this._scene.remove(en.mesh);
      this._dropLoot(en.x, en.z, en.isBoss ? 5 : 2);
      this._kills++;
      this._xpGained += en.isBoss ? 200 : 10;
      const statKills = (Save.get('stats.totalEnemiesKilled')||0) + 1;
      Save.set('stats.totalEnemiesKilled', statKills);

      if (en.isBoss) {
        Save.set('stats.totalBossKilled', (Save.get('stats.totalBossKilled')||0)+1);
        Bus.emit(EVENTS.BOSS_DIED);
        Bus.emit(EVENTS.UI_NOTIFICATION, { text: 'İsyancı Reis Yenildi! ✦', type: 'boss' });
      }
      Wave.onEnemyKilled(en.isBoss);
      return false;
    });
  }

  _updateParticles() {
    this._parts = this._parts.filter(p => {
      p.mesh.position.x += p.vx; p.mesh.position.y += p.vy; p.mesh.position.z += p.vz;
      p.vy -= 0.006; p.vx *= 0.9; p.vz *= 0.9; p.life--;
      p.mesh.material.opacity = p.life/p.maxLife; p.mesh.material.transparent = true;
      if (p.life <= 0) { this._scene.remove(p.mesh); return false; }
      return true;
    });
  }

  _updateTorches() {
    this._torches.forEach(t => {
      t.phase += 0.06;
      t.light.intensity = 2.4+Math.sin(t.phase)*0.5+Math.sin(t.phase*1.8)*0.2;
    });
  }

  _checkInteract() {
    const nearCebe = Math.hypot(this._pl.x-18, this._pl.z+18) < 3.5;
    this._pl.nearInteract = nearCebe ? 'cebehane' : null;
    const el = document.getElementById('hud-interact');
    if (el) el.style.display = nearCebe ? 'block' : 'none';
  }

  _updateCamera() {
    const smooth = Input.joy.active ? CONSTANTS.CAMERA_SMOOTH_JOY : CONSTANTS.CAMERA_SMOOTH;
    this._cam.position.x += (this._pl.x - this._cam.position.x) * smooth;
    this._cam.position.z += (this._pl.z + CONSTANTS.CAMERA_DISTANCE - this._cam.position.z) * smooth;
    this._cam.lookAt(this._pl.x, 0, this._pl.z);
  }

  _updateHUD() {
    UI.updateHUD({ hp: this._pl.hp, maxHp: this._pl.maxHp, en: this._pl.en, maxEn: this._pl.maxEn });
    ['q','f','r'].forEach(k => UI.updateAbilityCooldown(k, AbilitySystem.getCooldownPct(k)));
    // Miniharita
    this._drawMinimap();
  }

  _drawMinimap() {
    const mc = document.getElementById('hud-minimap');
    if (!mc) return;
    const mx = mc.getContext('2d');
    const SZ=84, WS=32, sc=SZ/(WS*2);
    const tw = v => (v+WS)*sc;
    mx.fillStyle='rgba(4,2,0,.92)'; mx.fillRect(0,0,SZ,SZ);
    mx.fillStyle='rgba(180,160,80,.22)';
    [[0,0,12,12],[-19,-8,10,10],[18,-18,9,8],[12,20,14,9]].forEach(a => mx.fillRect(tw(a[0]-a[2]/2),tw(a[1]-a[3]/2),a[2]*sc,a[3]*sc));
    mx.fillStyle='rgba(255,50,50,.9)';
    this._enemies.forEach(en => mx.fillRect(tw(en.x)-1.5,tw(en.z)-1.5,3,3));
    mx.fillStyle='rgba(255,215,0,.65)';
    this._loots.forEach(l => mx.fillRect(tw(l.x)-1,tw(l.z)-1,2,2));
    mx.fillStyle='#FFD700'; mx.fillRect(tw(this._pl.x)-2.5,tw(this._pl.z)-2.5,5,5);
    mx.strokeStyle='rgba(139,105,20,.5)'; mx.lineWidth=1; mx.strokeRect(0,0,SZ,SZ);
  }

  // ─── YARDIMCI ──────────────────────────────────────────────
  _bx(x,y,z,w,h,d,col) {
    const geo = new THREE.BoxGeometry(w,h,d);
    const m   = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({color:col}));
    m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true;
    this._scene.add(m);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x6B4A0C})));
    return m;
  }

  // ─── DURAKLAT / DEVAM ──────────────────────────────────────
  pause()  { this._paused = true; }
  resume() { this._paused = false; }

  // Mola sonrası devam
  continueWave() { Wave.continueAfterMilestone(); this._paused = false; }

  // ─── TEMİZLE ───────────────────────────────────────────────
  destroy() {
    // XP kaydet
    if (this._xpGained > 0) Player.addXP(this._xpGained);

    // Tüm event dinleyicilerini kaldır
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];

    // Three.js temizliği
    this._scene?.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    this._ren?.dispose();
    this._enemies  = [];
    this._bullets  = [];
    this._loots    = [];
    this._parts    = [];
    console.log('[GorevMap] temizlendi');
  }
}
