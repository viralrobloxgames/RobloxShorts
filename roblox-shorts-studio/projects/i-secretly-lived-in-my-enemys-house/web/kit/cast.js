// kit-cast (STUB, being filled in): the four characters + extras, wardrobe, faces, speak().
import * as THREE from 'three';
import { loadRobloxCharacter, wear } from '../../../../web/lib/robloxPack.js';

export const FACES = ['scared', 'suspicious', 'scheming', 'nervous', 'happy', 'annoyed', 'shocked', 'smug', 'surprised', 'determined', 'crying', 'sad', 'shouting', 'laugh', 'talking', 'mouth_o', 'neutral'];
export const WARDROBE = ['skye_hoodie', 'skye_sheet', 'backpack', 'max_school', 'max_pjs', 'dad_cardigan', 'dad_apron', 'dad_robe', 'lily_day', 'lily_pjs', 'extras'];

export async function loadCast(scene) {
  const [skye, max, dad, lily] = await Promise.all([
    loadRobloxCharacter('Skye', { expressions: FACES }), loadRobloxCharacter('Max', { expressions: FACES }),
    loadRobloxCharacter('Leo', { expressions: FACES, scale: 1.12 }), loadRobloxCharacter('Mia', { expressions: FACES, scale: 0.78 }),
  ]);
  const extras = [];
  for (let i = 0; i < 4; i++) extras.push(await loadRobloxCharacter('Noob', { expressions: FACES }));
  for (const a of [skye, max, dad, lily, ...extras]) scene.add(a.root);
  return { skye, max, dad, lily, extras };
}
export function dress(actor, id, on = true) { actor.wardrobe = id; return actor; }
export function speak(actor, baseFace, t, words = []) {
  const w = words.find((x) => t >= x.start && t < x.end);
  actor.setFace(w ? (Math.floor((t - w.start) / 0.12) % 2 ? 'mouth_o' : 'talking') : baseFace);
}
