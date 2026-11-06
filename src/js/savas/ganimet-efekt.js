// ═══════════════════════════════════════════════════════
// LOOT & FX
// ═══════════════════════════════════════════════════════
function dropLoot(x,z,n){n=n||2;const types=['akce','deri','metal','akce','akce'];for(let i=0;i<n;i++){const t=types[Math.floor(Math.random()*types.length)];const lCol=t==='akce'?0xFFD700:t==='deri'?0x8B4513:0xAAAAAA;const m=new THREE.Mesh(new THREE.SphereGeometry(.2,7,5),new THREE.MeshLambertMaterial({color:lCol,emissive:lCol,emissiveIntensity:.6}));m.position.set(x+(Math.random()-.5)*2,.3,z+(Math.random()-.5)*2);S3.add(m);loots.push({id:newNetId(),mesh:m,type:t,col:lCol,x:m.position.x,z:m.position.z,vx:(Math.random()-.5)*.08,vz:(Math.random()-.5)*.08,collected:false});}}
function addFX(x,z,fxCol,n){n=n||7;for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.07+Math.random()*.07,4,4),new THREE.MeshBasicMaterial({color:fxCol}));m.position.set(x,.4+Math.random()*.5,z);S3.add(m);const a=Math.random()*Math.PI*2;parts.push({mesh:m,vx:Math.cos(a)*.11,vy:.1+Math.random()*.08,vz:Math.sin(a)*.11,life:20,maxLife:20});}}

