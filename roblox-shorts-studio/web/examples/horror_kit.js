// Review sheet for the After Hours horror kit: one frame per check, render with --frames and tile the PNGs.
// Frames: every model in daylight, the entity (+ Leo for scale), moving parts at their end states, the 12 motions,
// then the night lighting presets.
import * as THREE from 'three';
import { soleHeight, pose, actionPose } from '../lib/rig.js';
import { part } from '../lib/world.js';
import { loadRobloxCharacter, robloxPose } from '../lib/robloxPack.js';
import { horrorManifest, horrorAsset, horrorEntity, horrorMotions, horrorLighting, attachHorrorProp, torchBeam } from '../lib/horror.js';

export const meta = { seconds: 3, fps: 30, width: 600, height: 800 };
export function samples() { return 1; }

const shots = [], assets = {}, shown = new Set();
let leo, entity, forest, statue, floor, defaults, stageRef;

function ground(actor) { actor.root.updateMatrixWorld(true); actor.root.position.y -= soleHeight(actor); }
function frameOn(stage, objs, az = 0.6, el = 0.32, pad = 1.15) {
  const box = new THREE.Box3();
  for (const o of objs) { o.updateMatrixWorld(true); box.expandByObject(o); }
  const c = box.getCenter(new THREE.Vector3()), r = box.getBoundingSphere(new THREE.Sphere()).radius;
  const cam = stage.camera; cam.fov = 35; cam.updateProjectionMatrix();
  const d = (r * pad) / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2) * Math.min(1, cam.aspect));
  cam.position.set(c.x + Math.sin(az) * Math.cos(el) * d, c.y + Math.sin(el) * d, c.z + Math.cos(az) * Math.cos(el) * d);
  cam.lookAt(c); stage.aimSun(c, Math.max(8, r * 1.5));
}
function show(...objs) { for (const o of shown) o.visible = false; shown.clear(); for (const o of objs) { o.visible = true; shown.add(o); } }
function restoreLight(stage) {
  const d = defaults; stage.hemi.intensity = d.hemi; stage.hemi.color.copy(d.hemiC); stage.hemi.groundColor.copy(d.hemiG);
  stage.sun.intensity = d.sun; stage.sun.color.copy(d.sunC); stage.fill.intensity = d.fill; stage.fill.color.copy(d.fillC);
  stage.rim.intensity = d.rim; stage.rim.color.copy(d.rimC); stage.scene.environmentIntensity = d.env; stage.scene.fog = d.fog;
  for (const k of ['zenith', 'horizon', 'below']) stage.skyMesh.material.uniforms[k].value.copy(d.sky[k]);
}
function resetControls() { for (const a of Object.values(assets)) for (const [id, set] of Object.entries(a.controls)) set(id === 'fire' ? 'high' : 0); }
function place(o, x = 0, z = 0, ry = 0) { o.position.set(x, 0, z); o.rotation.y = ry; return o; }

export async function setup(stage) {
  stageRef = stage;
  const u = stage.skyMesh.material.uniforms;
  defaults = { hemi: stage.hemi.intensity, hemiC: stage.hemi.color.clone(), hemiG: stage.hemi.groundColor.clone(), sun: stage.sun.intensity,
    sunC: stage.sun.color.clone(), fill: stage.fill.intensity, fillC: stage.fill.color.clone(), rim: stage.rim.intensity, rimC: stage.rim.color.clone(),
    env: stage.scene.environmentIntensity, fog: stage.scene.fog, sky: { zenith: u.zenith.value.clone(), horizon: u.horizon.value.clone(), below: u.below.value.clone() } };
  floor = part(80, 1, 80, '#c3cbdb'); floor.position.y = -0.5; stage.scene.add(floor);

  const man = await horrorManifest();
  for (const m of man.models) if (m.kind !== 'characters') {
    const a = await horrorAsset(m.name); a.root.visible = false; stage.scene.add(a.root); assets[m.name] = a;
  }
  leo = await loadRobloxCharacter('Leo', { expressions: ['happy', 'scared', 'nervous'] });
  entity = await horrorEntity({ revealed: false });
  const revealedFaces = await horrorEntity({ revealed: true }); // second instance keeps both faces loaded
  forest = await horrorEntity({ forest: true });
  statue = await horrorEntity({ statue: true });
  for (const a of [leo, entity, revealedFaces, forest, statue]) { a.root.visible = false; stage.scene.add(a.root); }
  const motions = await horrorMotions();
  const idle = actionPose('Idle', 0);
  const stand = (a, x = 0, z = 0, ry = 0) => { pose(a, idle); place(a.root, x, z, ry); ground(a); };

  // 1. Every model on its own, daylight.
  for (const [name, a] of Object.entries(assets)) shots.push({ label: name, run(s) {
    show(floor, a.root); place(a.root); frameOn(s, [a.root]);
  } });
  // 2. Entity: front neutral, front revealed, back, forest variant, statue; Leo beside for scale.
  const ent = (label, actor, ry, az) => shots.push({ label, run(s) {
    stand(actor, 1.6, 0, ry); stand(leo, -1.6, 0, 0); leo.setFace('nervous'); show(floor, actor.root, leo.root); frameOn(s, [actor.root, leo.root], az, 0.12);
  } });
  ent('Unlisted neutral', entity, 0, 0.25); ent('Unlisted revealed', revealedFaces, 0, 0.25); ent('Unlisted back', entity, Math.PI, 0.25);
  ent('UnlistedForest', forest, 0, 0.25); ent('statue variant', statue, 0, 0.25);
  // 3. Moving parts at their end states (Leo in the door/shutter for clearance and reach).
  const ctl = (label, name, id, value, withLeo, az = 0.6) => shots.push({ label, run(s) {
    resetControls(); const a = assets[name]; place(a.root); a.controls[id](value); const objs = [floor, a.root];
    if (withLeo) { stand(leo, ...withLeo); leo.setFace('scared'); objs.push(leo.root); }
    show(...objs); frameOn(s, objs.slice(1), az, 0.2);
  } });
  ctl('door closed + Leo', 'horror_door', 'door', 0, [0, 1.5, Math.PI]); ctl('door open + Leo in gap', 'horror_door', 'door', 1, [0, 0, 0]);
  ctl('locker open', 'horror_locker', 'door', 1, null); ctl('shutter open + Leo', 'horror_service_counter', 'shutter', 1, [0, -2.6, 0], 0.3);
  ctl('shutter closed', 'horror_service_counter', 'shutter', 0, null, 0.3);
  for (const st of ['high', 'low', 'out']) ctl(`campfire ${st}`, 'horror_campfire', 'fire', st, null);
  ctl('bell pressed', 'horror_bell', 'press', 1, null);
  // 4. Motions, sampled at 55% of their length; handheld ones get their prop.
  const PROP = { torch_hold: 'horror_flashlight', radio_hold: 'horror_radio', handoff: 'horror_takeaway_bag' };
  const held = {};
  for (const [k, prop] of Object.entries(PROP)) { held[k] = (await horrorAsset(prop)).root; attachHorrorProp(leo, held[k]); held[k].visible = false; }
  for (const [name, anim] of Object.entries(motions)) shots.push({ label: `motion ${name}`, run(s) {
    const who = name.startsWith('entity') || name.startsWith('statue') ? entity : leo;
    place(who.root); robloxPose(who, [[anim, anim.length * 0.55, 1, false]]); ground(who); leo.setFace('scared');
    const objs = [floor, who.root]; if (held[name]) objs.push(held[name]);
    show(...objs); frameOn(s, [who.root], 0.7, 0.12, 1.25);
  } });
  // 5. Night: lobby with Leo and the entity under each preset; forest clearing; torch beam.
  for (const preset of ['normal', 'warning', 'emergency']) shots.push({ label: `lobby ${preset}`, night: preset, run(s) {
    resetControls(); const lobby = assets.horror_lobby.root; place(lobby);
    stand(leo, -2.5, 2, 0.3); leo.setFace('scared'); stand(entity, 3.5, -4, -0.3);
    show(floor, lobby, leo.root, entity.root);
    s.camera.fov = 45; s.camera.updateProjectionMatrix(); s.camera.position.set(0, 6, 22); s.camera.lookAt(0, 3.2, 0); s.aimSun(new THREE.Vector3(), 14);
  } });
  const beam = torchBeam(held.torch_hold);
  shots.push({ label: 'forest + torch', night: 'forest', run(s) {
    resetControls(); const g = assets.horror_forest_ground.root; place(g);
    const objs = [g, place(assets.horror_cabin.root, 0, -9), place(assets.horror_campfire.root, -3, 2),
      place(assets.horror_pine_tall.root, -10, -6), place(assets.horror_pine_small.root, 9, -4), place(assets.horror_dead_tree.root, 11, -10)];
    robloxPose(leo, [[motions.torch_hold, motions.torch_hold.length * 0.55, 1, false]]); place(leo.root, 2.5, 3, -0.4); ground(leo); leo.setFace('scared');
    beam('on'); show(...objs, leo.root, held.torch_hold, forest.root); stand(forest, -6, -7, 0.4);
    s.camera.fov = 45; s.camera.updateProjectionMatrix(); s.camera.position.set(2, 7, 24); s.camera.lookAt(0, 2.5, -3); s.aimSun(new THREE.Vector3(), 18);
  } });
}

export function update(t, stage) {
  const shot = shots[Math.min(shots.length - 1, Math.round(t * meta.fps))];
  restoreLight(stage); if (shot.night) horrorLighting(stage, shot.night);
  shot.run(stage);
}
export const labels = () => shots.map((s) => s.label);
