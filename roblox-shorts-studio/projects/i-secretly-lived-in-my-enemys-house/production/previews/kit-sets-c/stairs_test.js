// kit-sets-c test: Skye walks down the kitchen stairs with stairsPath + stairsGait (clip_check target).
import * as K from '../../../web/kit/index.js';
export const meta = { seconds: 6, fps: 30, width: 1920, height: 1080 };
let C, set;
export async function setup(stage) {
  await K.buildSets(stage, ['kitchen']); C = await K.loadCast(stage.scene);
  for (const k of Object.keys(C)) if (C[k]?.root) C[k].root.visible = k === 'skye';
  set = K.showSet('kitchen'); set.setState({ chapter: 11 });
}
export function update(t, stage) {
  const u = Math.min(1, t / 5.5), p = set.stairsPath(u);
  K.posture(C.skye, set.stairsGait(u));
  C.skye.root.position.copy(p.pos); C.skye.root.rotation.y = p.heading;
  K.applyLight(stage, 'sunday_morning', { set });
  K.setCam(stage, set.cams.stairs_wide);
}
