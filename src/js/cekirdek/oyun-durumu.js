// ═══════════════════════════════════════════════════════
// OYUN STATE
// ═══════════════════════════════════════════════════════
let S3=null,CAM=null,REN=null,CLK=null,RC=null,GP=null;
let torches=[],barrelsArr=[],npcArr=[];
let pl={x:0,z:8,hp:100,maxHp:100,en:100,maxEn:100,mesh:null,ang:0,spd:4,rspd:7,atkCd:0,ifr:0,nearZone:null,radius:0.45,ab:{cd:{q:0,f:0,r:0},active:{q:false,f:false,r:false},timer:{q:0,f:0,r:0}}};
let MAP_HALF=28;
let enemies=[],bullets=[],loots=[],parts=[];
let keys={},mousePos={x:0,y:0};
let selWeapon=0,pwr=0,pwrOn=false;
let akce=0,kills=0,deri=0,metal=0;
let wave=1,waveTimer=180,waveActive=false;
let gt=0,playing=false,paused=false;
let worldAim={x:0,z:0};
let joyActive=false,joyId=-1,joyOX=0,joyOY=0;
let camYaw=0,camYawS=0; // kamera yönü (radyan): hedef ve ekranda görünen (yumuşatılmış)
let camZoom=1; // 1=normal, <1 yakın, >1 uzak. Sınır: 0.5 - 2.2
let isTestMode=false; // editörden "Test Et" ile açılan oturum mu?
const JOY_DEAD=10,JOY_MAX=50;
let currentMap=''; // 'kisla' | 'gorev'

