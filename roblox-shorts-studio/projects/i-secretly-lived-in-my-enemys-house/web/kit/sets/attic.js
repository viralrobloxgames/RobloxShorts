// STUB (kit-sets-b): a simple attic room so the template can import it; the full set replaces this shortly.
import * as THREE from 'three';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const OFFSET = V(600, 0, 0);
export function build(scene) {
  const group = new THREE.Group(); group.position.copy(OFFSET); scene.add(group);
  const m = new THREE.MeshStandardMaterial({ color: '#8a6a4a', roughness: 0.85, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(26, 0.4, 24), m); floor.position.set(0, -0.2, 2); floor.receiveShadow = true; group.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(26, 12, 0.4), m); back.position.set(0, 6, -10); group.add(back);
  group.userData.walls = { back };
  const w = (x, y, z) => V(x, y, z).add(OFFSET);
  return { id: 'attic', group, marks: { nest: { pos: w(0, 0, -7.6), heading: 0 }, hatch_top: { pos: w(4.5, 0, 6.6), heading: Math.PI } },
    cams: { wide: { pos: w(0, 6, 13), target: w(0, 3, -5), fov: 50 } }, lights: {}, setState() {} };
}
