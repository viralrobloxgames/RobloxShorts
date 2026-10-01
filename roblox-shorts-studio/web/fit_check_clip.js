// Accessory fit check scene, driven by web/fit_check.mjs (not rendered directly).
// ?target=<clip path from studio root> checks exactly what that clip's characters wear (its setup() is run first, with the
// same character options, e.g. hairLift); ?all=1 checks every pack character with every pack accessory.
// Each pair gets four head close-ups (front, three-quarter, side, back); window.fitReport holds the numbers.
import * as THREE from 'three';
import { pose } from './lib/rig.js';
import { loadRobloxCharacter, wear, packActors, ACCESSORY_FIT } from './lib/robloxPack.js';

export const meta = { seconds: 600, fps: 30, width: 400, height: 400, title: 'Fit check' };
export const sky = { zenith: '#6f9fe0', horizon: '#dbe9f7', below: '#eef3f8', fog: '#eef3f8' };
export const VIEWS = [['front', 0], ['three-quarter', 0.8], ['side', Math.PI / 2], ['back', Math.PI]];
const q = new URLSearchParams(location.search);
let pairs = [];

export async function setup(stage) {
  const keep = new Set(stage.scene.children);
  let wardrobe;
  if (q.get('target')) {
    const clip = await import('../' + q.get('target'));
    await clip.setup(stage, THREE);
    wardrobe = packActors.filter((a) => a.worn.length).map((a) => ({ character: a.name, options: a.options, accessories: a.worn.map((w) => w.name) }));
    for (const o of stage.scene.children) if (!keep.has(o)) o.visible = false;      // hide the clip's own set
  } else {
    wardrobe = ['Leo', 'Max', 'Mia', 'Noob', 'Skye'].map((c) => ({ character: c, options: {}, accessories: Object.keys(ACCESSORY_FIT) }));
  }
  let i = 0;
  for (const w of wardrobe) {
    for (const acc of w.accessories) {
      const actor = await loadRobloxCharacter(w.character, { ...w.options, expressions: ['happy'] });
      const fit = await wear(actor, acc);
      pose(actor, {});
      actor.root.position.set(60 + 15 * i++, 0, 300);      // inside the sky dome, away from any clip set
      actor.root.visible = false;
      stage.scene.add(actor.root);
      pairs.push({ character: w.character, accessory: acc, actor, fit });
    }
  }
  window.fitReport = {
    target: q.get('target') || null, wardrobe,
    pairs: pairs.map(({ character, accessory, fit }) => ({ character, accessory, mode: fit.mode, scale: +fit.scale.toFixed(3), stretch: fit.stretch || 1, offset: fit.offset.toArray().map((v) => +v.toFixed(3)), hideHair: fit.hideHair, ...fit.check })),
  };
  window.fitFrames = pairs.length * VIEWS.length;
}

const cur = (t) => { const f = Math.round(t * meta.fps); return { p: pairs[Math.floor(f / VIEWS.length)], v: VIEWS[f % VIEWS.length] }; };

export function update(t, stage) {
  const { p, v } = cur(t);
  pairs.forEach((x) => { x.actor.root.visible = x === p; });
  if (!p) return;
  p.actor.root.updateMatrixWorld(true);                 // world boxes must be current on the very first frame
  // Frame the head plus the whole accessory (its top can be well above the head, e.g. a top hat or halo).
  const box = new THREE.Box3().setFromObject(p.fit.item), head = new THREE.Vector3(); p.actor.bones.Head.getWorldPosition(head);
  const top = Math.max(box.max.y, head.y + 1.4 * p.actor.scale), bottom = head.y - 0.1 * p.actor.scale;
  head.y = (top + bottom) / 2;
  const d = Math.max(5.2 * p.actor.scale, (top - bottom) * 0.62 / Math.tan((15 * Math.PI) / 180)), el = 0.22;
  stage.camera.position.copy(head).add(new THREE.Vector3(Math.sin(v[1]) * Math.cos(el), Math.sin(el), Math.cos(v[1]) * Math.cos(el)).multiplyScalar(d));
  stage.camera.fov = 30; stage.camera.updateProjectionMatrix(); stage.camera.lookAt(head);
  stage.aimSun(head.clone().setY(0), 6);
}

export function samples() { return 2; }

export function overlay(g, s, t) {
  const { p, v } = cur(t);
  if (!p) return;
  const ok = p.fit.check.passed;
  g.save(); g.font = `800 ${17 * s}px Montserrat`; g.textBaseline = 'top';
  const text = `${p.character} + ${p.accessory}  ${v[0]}`, text2 = `${ok ? 'PASS' : 'FAIL'}  depth ${p.fit.check.depth}  x${p.fit.scale.toFixed(2)}${p.fit.stretch ? ` wide x${p.fit.stretch}` : ''}${p.fit.hideHair ? '  hair hidden' : ''}`;
  g.fillStyle = 'rgba(12,18,28,.72)'; g.fillRect(0, 0, 400 * s, 50 * s);
  g.fillStyle = '#ffffff'; g.fillText(text, 10 * s, 6 * s);
  g.fillStyle = ok ? '#7CF29A' : '#FF6B6B'; g.fillText(text2, 10 * s, 27 * s);
  g.restore();
}
