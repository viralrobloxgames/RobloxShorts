# Shared kit (API reference)

Chapters import only the kit: `import * as K from './kit/index.js';` (from `web/chNN.js`). Every chapter starts from
`web/ch_template.js`. Contract: `production/KIT_SPEC.md`. All roles append their section here; one example per function.

## index.js / sets/index.js (kit-pipeline)

`index.js` re-exports `stage.js`, `lighting.js`, `camera.js`, `overlay.js`, `cast.js`, `props.js`, and the set modules as
`K.sets.bedroom`, `K.sets.hallway`, `K.sets.attic`, `K.sets.kitchen`, `K.sets.classroom`, `K.sets.exterior` (each with
`build(scene) -> { id, group, marks, cams, lights, setState(state) }`).

(stage / lighting / camera / overlay sections follow as they land.)
