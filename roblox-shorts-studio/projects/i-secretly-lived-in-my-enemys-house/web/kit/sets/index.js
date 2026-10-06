// The six sets. Each module exports build(scene) -> { id, group, marks, cams, lights, setState(state) } (KIT_SPEC.md "Sets").
// World offsets: bedroom (0,0,0), hallway (300,0,0), attic (600,0,0), kitchen (900,0,0), classroom (1200,0,0), exterior (1500,0,0).
export * as bedroom from './bedroom.js';
export * as hallway from './hallway.js';
export * as attic from './attic.js';
export * as kitchen from './kitchen.js';
export * as classroom from './classroom.js';
export * as exterior from './exterior.js';
