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
  [[29,-29],[29,29],[-29,-29],[-29,29]].forEach(([cx,cz])=>{yapiKoy('yapi_kule',cx,cz,{r:2.2,h:9},[5,5]);});
  yapiKoy('yapi_ev',18,-18,{w:9,d:8},[9,8]);
  yapiKoy('yapi_cami',0,0,{w:12,d:12},[12,12]);addCollider(-7.5,0,1.4,1.4);
  yapiKoy('yapi_hamam',-19,-8,{w:10,d:10},[10,10]);
  yapiKoy('yapi_kervansaray',12,20,{w:14,d:9},[14,9]);yapiKoy('yapi_kisla',-18,-20,{w:11,d:7},[11,7]);
  [[-10,-15,5,4],[5,-20,4,4],[-20,5,4,5],[15,8,5,4],[20,-8,4,4],[-5,15,5,4]].forEach(([x,z,w,d])=>{yapiKoy('yapi_ev',x,z,{w:w,d:d},[w,d]);});
  [[-29,0],[29,0],[0,-29],[0,29],[18,-14],[0,0],[12,20],[-19,-8]].forEach(([x,z])=>{yapiKoy('cevre_mesale',x,z);const pt=new THREE.PointLight(0xFF9933,3,10);pt.position.set(x,3,z);S3.add(pt);torches.push({light:pt,phase:Math.random()*Math.PI*2});});
  [[-5,-8],[6,-13],[13,-5],[-8,8],[16,-16],[-16,5],[9,16],[-11,-21]].forEach(([x,z])=>{const bm=modelYap('cevre_varil');bm.position.set(x,0,z);S3.add(bm);const bc={x:x,z:z,r:0.62};colliders.push(bc);barrelsArr.push({mesh:bm,hp:2,x:x,z:z,collider:bc});});
  [[-25,5],[-25,-5],[25,5],[25,-5],[0,-32],[0,32],[-32,0],[32,0]].forEach(([x,z],i)=>{const ag=modelYap(i%2?'cevre_cam':'cevre_agac',{h:5});ag.position.set(x,0,z);ag.rotation.y=i*1.7;S3.add(ag);});
}

