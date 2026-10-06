// STUB (kit-sets-a): a simple box room so the template can import it; the full set replaces this shortly.
import * as THREE from 'three';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const OFFSET = V(0, 0, 0);
export function build(scene) {
  const group = new THREE.Group(); group.position.copy(OFFSET); scene.add(group);
  const m = new THREE.MeshStandardMaterial({ color: '#c9b79a', roughness: 0.8, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 18), m); floor.position.y = -0.2; floor.receiveShadow = true; group.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(22, 11, 0.4), m); back.position.set(0, 5.5, -9); group.add(back);
  group.userData.walls = { back };
  const w = (x, y, z) => V(x, y, z).add(OFFSET);
  return { id: 'bedroom', group, marks: { center: { pos: w(0, 0, 0), heading: 0 } }, cams: { wide: { pos: w(0, 7, 20), target: w(0, 3, 0), fov: 45 } }, lights: {}, setState() {} };
}
