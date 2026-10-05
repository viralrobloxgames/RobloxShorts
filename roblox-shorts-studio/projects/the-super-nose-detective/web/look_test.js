// Look test: the cast in their 70s outfits, Max's Super Nose, sunglasses, props. Frames: 1 lineup, 2 Max three-quarter,
// 3 Max side, 4 Max back, 5 Noob/Mia close, 6 props.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { part } from '../../../web/lib/world.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { wearOutfit, makeNose, setNose, makeSunglasses, donut, sock, evidenceBag, convertible, policeCar, flashLights, palm } from './kit.js';

export const meta = { seconds: 6 / 30, fps: 30, width: 1080, height: 1920 };
export const sky = { zenith: '#3a2a6e', horizon: '#ff9a8a', below: '#f3d0c0', fog: '#e8b0b0' };
let cast = {}, A = {}, nose, car, cop;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export async function setup(stage) {
  stage.scene.add(part(200, 1, 200, '#cdbfae'));
  const ex = ['neutral', 'smug', 'love', 'cool', 'determined'];
  const names = ['Leo', 'Skye', 'Max', 'Mia', 'Noob'];
  const actors = await Promise.all(names.map((n) => loadRobloxCharacter(n, { expressions: ex, hairLift: n === 'Leo' ? 0.16 : 0 })));
  names.forEach((n, i) => { cast[n] = actors[i]; actors[i].root.position.set((i - 2) * 4.2, 0, 0); stage.scene.add(actors[i].root); });
  await wearOutfit(cast.Max, 'max_miami.png'); await wearOutfit(cast.Leo, 'leo_chief.png'); await wearOutfit(cast.Skye, 'skye_70s.png');
  nose = makeNose(cast.Max);
  makeSunglasses(cast.Noob); makeSunglasses(cast.Mia, '#ffffff', '#ff5d9a');
  A.idle = await loadAnimation('idle');
  const d = donut(); d.position.set(-6, 1.5, 8); stage.scene.add(d);
  const h1 = donut('L'); h1.position.set(-3, 1.5, 8); stage.scene.add(h1);
  const b = evidenceBag(sock(0.8)); b.position.set(1, 0, 8); stage.scene.add(b);
  car = convertible(); car.position.set(-8, 0, 22); car.rotation.y = 0.6; stage.scene.add(car);
  cop = policeCar(); cop.position.set(8, 0, 22); cop.rotation.y = -0.6; stage.scene.add(cop);
  const p = palm(); p.position.set(0, 0, -12); stage.scene.add(p);
}

export function update(t, stage) {
  const f = Math.round(t * 30);
  for (const a of Object.values(cast)) { robloxPose(a, [[A.idle, 0.5]]); setExpression(a, 'smug'); }
  setExpression(cast.Skye, 'love'); setExpression(cast.Max, 'determined');
  setNose(nose, { glow: f === 1 ? 0.6 : 0 });
  flashLights(cop, 0);
  const cam = stage.camera, M = cast.Max.root.position;
  const look = (p, tg, fov) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(tg); stage.aimSun(tg, 20); };
  for (const [n, a] of Object.entries(cast)) a.root.visible = f === 0 || f >= 4 || n === 'Max';
  if (f === 0) look(V(0, 6, 30), V(0, 3, 0), 40);
  else if (f === 1) look(M.clone().add(V(0, 4.6, 7)), M.clone().add(V(0, 4.3, 0)), 40);
  else if (f === 2) look(M.clone().add(V(7, 4.6, 0.3)), M.clone().add(V(0, 4.4, 0.3)), 40);
  else if (f === 3) look(M.clone().add(V(4, 5.4, 5)), M.clone().add(V(0, 4.4, 0.3)), 34);
  else if (f === 4) look(V(6.5, 5, 6), V(6.3, 4.3, 0), 40);
  else look(V(0, 9, 38), V(0, 2, 12), 44);
}
