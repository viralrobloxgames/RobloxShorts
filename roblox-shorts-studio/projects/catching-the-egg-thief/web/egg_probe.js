// Egg lineup for Catching the Egg Thief (each scaled to 3 studs tall). Not part of the short.
import * as THREE from 'three';
import { part } from '../../../web/lib/world.js';
import { packItem } from '../../../web/lib/robloxPack.js';
export const meta = { seconds: 0.1, fps: 30, width: 1080, height: 1920, title: 'eggs' };
const NAMES = ['egg_spinosaurus', 'egg_hyper', 'egg_prismatic', 'egg_basic', 'egg_rare', 'egg_epic', 'egg_super_rare', 'egg_ultra', 'egg_prism', 'egg_magic_rabbit', 'egg_fennec_fox', 'egg_ninja_dog', 'egg_cowboy_cow', 'egg_little_monster', 'egg_dumbo', 'egg_digital_saurus'];
export async function setup(stage) {
  stage.scene.add(part(300, 2, 300, '#6aa84f'));
  for (let i = 0; i < NAMES.length; i++) {
    const o = await packItem('props', NAMES[i]); const b = new THREE.Box3().setFromObject(o), h = b.max.y - b.min.y; o.scale.setScalar(3 / h);
    o.position.set((i % 4) * 4.5 - 6.75, 0, Math.floor(i / 4) * 5); stage.scene.add(o);
  }
}
export function update(t, stage) { const c = stage.camera; c.position.set(0, 34, 30); c.fov = 62; c.updateProjectionMatrix(); c.lookAt(0, 0, 7); stage.aimSun(new THREE.Vector3(0, 0, 7), 20); }
export function overlay(g, s) { g.font = `${34 * s}px "Luckiest Guy"`; g.fillStyle = '#fff'; NAMES.forEach((n, i) => g.fillText(`${i}:${n.slice(4)}`, 40 * s, (200 + i * 40) * s)); }
