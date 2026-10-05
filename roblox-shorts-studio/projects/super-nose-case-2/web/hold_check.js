// Hold check for The Vampire Case (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './vampire_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [1.0, 'gar', 'R', 'shears (hedge)'], [9.0, 'vlad', 'R', 'puppy (Vlad)'], [9.9, 'kid', 'R', 'puppy (kid)'], [19.0, 'leo', 'R', 'burger'],
  [24.9, 'max', 'R', 'garlic bread at the nose'], [36.5, 'gar', 'R', 'shears (frozen)'], [42.5, 'gar', 'R', 'sad tomato'],
  [47.0, 'gar', 'R', 'cuffs'], [53.0, 'max', 'R', 'evidence bag'],
]);
