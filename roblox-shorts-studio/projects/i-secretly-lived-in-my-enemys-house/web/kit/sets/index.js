// The six sets. Each module exports build(scene) -> { id, group, marks, cams, lights, setState(state) } (KIT_SPEC.md "Sets").
// World offsets: bedroom (0,0,0), hallway (300,0,0), attic (600,0,0), kitchen (900,0,0), classroom (1200,0,0), exterior (1500,0,0).
// Loaded so that a missing or broken set module does not break the whole kit: it comes back null (with a console
// warning) and stage.js buildSets() uses a box room for it.
const load = async (id) => {
  try { return await import(`./${id}.js`); }
  catch (e) { console.warn(`kit: sets/${id}.js not loaded (${e.message})`); return null; }
};
export const [bedroom, hallway, attic, kitchen, classroom, exterior] = await Promise.all(
  ['bedroom', 'hallway', 'attic', 'kitchen', 'classroom', 'exterior'].map(load));
