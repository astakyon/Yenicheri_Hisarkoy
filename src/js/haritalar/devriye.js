// ═══════════════════════════════════════════════════════
// GÖREV HARİTASI
// ═══════════════════════════════════════════════════════
function buildGorev(){
  clearScene();
  S3.fog=new THREE.Fog(0x4a3010,30,78);S3.background=new THREE.Color(0x8ab4d8);
  const sun=new THREE.DirectionalLight(0xFFF5E0,2.8);sun.position.set(15,30,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;S3.add(sun);
  S3.add(new THREE.AmbientLight(0xC8E0FF,1.2));const fill=new THREE.DirectionalLight(0xFFE0A0,.8);fill.position.set(-10,8,-5);S3.add(fill);S3.add(new THREE.HemisphereLight(0x87CEEB,0xC8A060,.9));
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshLambertMaterial({color:0xD4A96A}));gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;S3.add(gnd);
  for(let i=-7;i<=7;i++)for(let j=-7;j<=7;j++)if((i+j)%2===0){const st=new THREE.Mesh(new THREE.BoxGeometry(4.8,.06,4.8),new THREE.MeshLambertMaterial({color:0xC89858}));st.position.set(i*5,.02,j*5);st.receiveShadow=true;S3.add(st);}
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshLambertMaterial({color:0x6aaa40}));grass.rotation.x=-Math.PI/2;grass.position.y=-.05;S3.add(grass);
  bx(0,2.5,-30,64,5,2.5,0xB09060);bx(0,2.5,30,64,5,2.5,0xB09060);bx(-30,2.5,0,2.5,5,64,0xB09060);bx(30,2.5,0,2.5,5,64,0xB09060);
  [[29,-29],[29,29],[-29,-29],[-29,29]].forEach(([cx,cz])=>{const k=bx(cx,3,cz,5,6,5,0xA08050);for(let i=0;i<3;i++){const mg=new THREE.Mesh(new THREE.BoxGeometry(.7,1.1,.3),new THREE.MeshLambertMaterial({color:0x3a2800}));mg.position.set(-.9+i*.9,2.2,2.6);k.add(mg);}});
  bx(18,2.8,-18,9,5.6,8,0xB8A060);const cRoof=new THREE.Mesh(new THREE.ConeGeometry(6,2.5,4),new THREE.MeshLambertMaterial({color:0x8B6914}));cRoof.rotation.y=Math.PI/4;cRoof.position.set(18,6,-18);S3.add(cRoof);
  bx(0,3.5,0,12,7,12,0xE0D0A0);const dome=new THREE.Mesh(new THREE.SphereGeometry(5,20,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:0xC0B080}));dome.position.set(0,9,0);S3.add(dome);
  const mn=bx(-7,6,0,1.4,12,1.4,0xD0C080);const mTop=new THREE.Mesh(new THREE.ConeGeometry(1,2.5,8),new THREE.MeshLambertMaterial({color:0x4a8840}));mTop.position.y=7;mn.add(mTop);
  bx(-19,2.5,-8,10,5,10,0xD4C090);const hd=new THREE.Mesh(new THREE.SphereGeometry(4,14,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:0xC8B878}));hd.position.set(-19,6.5,-8);S3.add(hd);
  bx(12,2.5,20,14,5,9,0xB8A060);bx(-18,2.5,-20,11,5,7,0xB0A060);
  [[-10,-15,5,4],[5,-20,4,4],[-20,5,4,5],[15,8,5,4],[20,-8,4,4],[-5,15,5,4]].forEach(([x,z,w,d])=>{bx(x,2,z,w,4,d,0xC8A870);const r=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.75,2.5,4),new THREE.MeshLambertMaterial({color:0x8B3010}));r.rotation.y=Math.PI/4;r.position.set(x,4.5,z);r.castShadow=true;S3.add(r);});
  [[-29,0],[29,0],[0,-29],[0,29],[18,-14],[0,0],[12,20],[-19,-8]].forEach(([x,z])=>{const pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.8,7),new THREE.MeshLambertMaterial({color:0x4a2800}));pole.position.set(x,1.4,z);S3.add(pole);const pt=new THREE.PointLight(0xFF9933,3,10);pt.position.set(x,2.9,z);S3.add(pt);torches.push({light:pt,phase:Math.random()*Math.PI*2});const fl=new THREE.Mesh(new THREE.SphereGeometry(.2,6,4),new THREE.MeshLambertMaterial({color:0xFF8800,emissive:0xFF5500,emissiveIntensity:2}));fl.position.set(x,2.9,z);S3.add(fl);});
  [[-5,-8],[6,-13],[13,-5],[-8,8],[16,-16],[-16,5],[9,16],[-11,-21]].forEach(([x,z])=>{const bm=new THREE.Mesh(new THREE.CylinderGeometry(.55,.6,1.2,10),new THREE.MeshLambertMaterial({color:0x6B3A15}));bm.position.set(x,.6,z);bm.castShadow=true;S3.add(bm);const rg=new THREE.TorusGeometry(.59,.07,6,12);const rm1=new THREE.Mesh(rg,new THREE.MeshLambertMaterial({color:0x8B6914}));rm1.rotation.x=Math.PI/2;rm1.position.y=.25;bm.add(rm1);const rm2=rm1.clone();rm2.position.y=-.25;bm.add(rm2);const bc={x:x,z:z,r:0.62};colliders.push(bc);barrelsArr.push({mesh:bm,hp:2,x:x,z:z,collider:bc});});
  [[-25,5],[-25,-5],[25,5],[25,-5],[0,-32],[0,32],[-32,0],[32,0]].forEach(([x,z])=>{const tr=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,2.5,8),new THREE.MeshLambertMaterial({color:0x5a3800}));tr.position.set(x,1.25,z);tr.castShadow=true;S3.add(tr);const lv=new THREE.Mesh(new THREE.SphereGeometry(2,10,8),new THREE.MeshLambertMaterial({color:0x3a7030}));lv.position.set(x,4,z);lv.castShadow=true;S3.add(lv);});
}

