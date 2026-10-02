// Original After Hours kit. All time/state arguments are deterministic for offline rendering.
import * as THREE from 'three';
import {PACK, packItem, loadRobloxCharacter, loadAnimation, robloxPose} from './robloxPack.js';
const clamp = (x) => Math.max(0, Math.min(1, x));
let manifestPromise;
export const horrorManifest = () => manifestPromise ||= fetch(PACK+'horror/manifest.json').then(r=>r.json());

export async function horrorAsset(name) {
  const def=(await horrorManifest()).models.find(m=>m.name===name);
  if (!def) throw new Error(`Unknown horror asset: ${name}`);
  const root=await packItem(def.kind,name), controls={};
  for (const [id,c] of Object.entries(def.controls||{})) {
    if (!c.groups) continue; // data such as the door's clearance [width, height], not a moving part
    const pivot=new THREE.Group(); pivot.name=`control_${id}`;
    const p=c.pivot||[0,0,0]; pivot.position.set(-p[0],p[1],-p[2]);
    root.add(pivot);
    for (const group of c.groups) {
      const mesh=root.getObjectByName(group);
      if(mesh) { root.updateMatrixWorld(true); pivot.attach(mesh); }
    }
    const rest=pivot.position.clone();
    controls[id]=(value)=>{
      if(c.states) { pivot.visible=value!=='out'; pivot.scale.setScalar(value==='low'?.43:1); return; }
      const amount=THREE.MathUtils.lerp(...c.range,clamp(value));
      if(c.pivot) pivot.rotation[c.axis]=THREE.MathUtils.degToRad(amount);
      else pivot.position[c.axis]=rest[c.axis]+amount;
    };
  }
  root.userData.horror={def,controls};
  return {root,controls,def};
}

export async function horrorEntity({forest=false,statue=false,revealed=false}={}) {
  const actor=await loadRobloxCharacter(forest?'UnlistedForest':'Unlisted',{expressions:['neutral','revealed']});
  actor.setFace(revealed?'revealed':'neutral');
  if(statue) actor.root.traverse(o=>{
    if(!o.isMesh||o.name==='Face') return;
    for(const m of [].concat(o.material)) {m.color.set('#849292');m.emissive?.set(0);m.roughness=.95;}
  });
  return actor;
}

export async function horrorMotions() {
  const data=await horrorManifest();
  return Object.fromEntries(await Promise.all(data.motions.map(async name=>[name.replace('horror_',''),await loadAnimation(name)])));
}

// Authored imitations re-sample the source timeline; they do not depend on frame order.
export function delayedImitation(actor,animation,t,delay=.45) {robloxPose(actor,[[animation,Math.max(0,t-delay),1,false]]);}
export function statueAdvance(actor,from,to,observed,progress) {actor.root.position.fromArray(observed?from:from.map((x,i)=>THREE.MathUtils.lerp(x,to[i],clamp(progress))));}

// Custom props are authored upright at the grip. The older holdItem() tool rotation is unnecessary.
export function attachHorrorProp(actor,item,hand='right') {
  const side=hand==='right'?-1:1, bone=actor.bones[hand==='right'?'Arm.R':'Arm.L'];
  item.position.set(side*.5*actor.scale,-1.5*actor.scale,0); item.rotation.set(0,0,0);item.scale.setScalar(actor.scale);bone.add(item);return item;
}
export function handWorld(actor,hand='right') {
  actor.root.updateMatrixWorld(true);
  const side=hand==='right'?-1:1;
  return actor.bones[hand==='right'?'Arm.R':'Arm.L'].localToWorld(new THREE.Vector3(side*.5*actor.scale,-1.5*actor.scale,0));
}
// Put this marker against a handle/counter surface after posing, then review the whole approach.
export function alignHand(actor,target,hand='right') {actor.root.position.add(target.clone().sub(handWorld(actor,hand)));}

export const HORROR_LIGHTING={
  normal:{ambient:.8,key:2.0,fill:1.0,rim:1.3,fog:'#273a46',keyColor:'#ffce8c'},
  warning:{ambient:.65,key:1.8,fill:.9,rim:1.5,fog:'#303641',keyColor:'#ffaf73'},
  emergency:{ambient:.6,key:1.5,fill:.85,rim:1.4,fog:'#392c36',keyColor:'#ff796a'},
  forest:{ambient:.65,key:1.6,fill:1.0,rim:1.8,fog:'#243c36',keyColor:'#a8d3ea'},
  daylight:{ambient:.9,key:2.7,fill:.8,rim:.7,fog:'#91afaa',keyColor:'#ffebc4'}
};
export function horrorLighting(stage,name='normal') {
  const p=HORROR_LIGHTING[name];if(!p) throw new Error(`Unknown preset ${name}`);
  stage.hemi.intensity=p.ambient;stage.hemi.color.set('#aacbd6');stage.hemi.groundColor.set('#364553');
  stage.sun.intensity=p.key;stage.sun.color.set(p.keyColor);stage.fill.intensity=p.fill;stage.fill.color.set('#abd9ed');
  stage.rim.intensity=p.rim;stage.rim.color.set('#76e6db');stage.scene.environmentIntensity=.25;
  stage.scene.fog=new THREE.Fog(p.fog,35,100);stage.skyMesh.material.uniforms.zenith.value.set(p.fog);
  stage.skyMesh.material.uniforms.horizon.value.set(p.fog);stage.skyMesh.material.uniforms.below.value.set(p.fog);
}

export function torchBeam(root) {
  const lamp=new THREE.SpotLight('#ffe1a2',18,28,.28,.7,1.5),target=new THREE.Object3D();
  lamp.position.set(0,.45,1);target.position.set(0,.45,15);root.add(lamp,target);lamp.target=target;
  return state=>{lamp.intensity=state==='off'?0:state==='weak'?4:18;};
}
export function replacePanel(root,name,text,{background='#142b35',foreground='#d9f5ed'}={}) {
  const mesh=root.getObjectByName(name); if(!mesh) throw new Error(`Panel ${name} not found`);
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const g=canvas.getContext('2d');
  g.fillStyle=background;g.fillRect(0,0,1024,512);g.fillStyle=foreground;g.textAlign='center';g.textBaseline='middle';
  const lines=text.split('\n');g.font=`bold ${Math.min(90,1400/Math.max(...lines.map(x=>x.length)))}px monospace`;
  lines.forEach((s,i)=>g.fillText(s,512,256+(i-(lines.length-1)/2)*112));
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  // Some panel groups include both frame and front, so use the face material by name.
  const mats=[].concat(mesh.material);const mat=mats.at(-1);mat.map?.dispose();mat.map=tex;mat.color.set('white');mat.needsUpdate=true;return tex;
}
// Feed texture can be a CanvasTexture, VideoTexture or authored still. Per-prop materials stay independent.
export function screenFeed(root,texture,name='ScreenFace') {const mesh=root.getObjectByName(name);mesh.material.map=texture;mesh.material.color.set('white');mesh.material.needsUpdate=true;}
export function extraShadow(scene) {
  const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:'#081319',transparent:true,opacity:.35,depthWrite:false});
  const body=new THREE.Mesh(new THREE.PlaneGeometry(1.9,5),mat);body.rotation.x=-Math.PI/2;body.position.set(0,.025,1.8);g.add(body);
  const head=new THREE.Mesh(new THREE.CircleGeometry(.7,16),mat);head.rotation.x=-Math.PI/2;head.position.set(0,.028,4.5);g.add(head);scene.add(g);return g;
}
