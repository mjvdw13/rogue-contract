// Levels and episodes. To add a level: create a file like e1m1.js, import it
// here and add its id to an episode's `levels` list (or make a new episode).
import { defineEpisode } from '../../engine/defs.js';
import strings from '../strings.js';
import e1m1 from './e1m1.js';
import e1m2 from './e1m2.js';
import e1m3 from './e1m3.js';
import e1m4 from './e1m4.js';
import e1m5 from './e1m5.js';
import sandbox from './sandbox.js';

// The sandbox is a test map for the height engine (?map=sandbox), outside any episode.
export const levels = [e1m1, e1m2, e1m3, e1m4, e1m5, sandbox];

export const episodes = [
  defineEpisode({
    id: 'e1',
    name: strings.episodeName,
    levels: ['e1m1', 'e1m2', 'e1m3', 'e1m4', 'e1m5'],
    // Where each level is on the intermission picture (an evacuation plan of the building).
    map: { spots: { e1m1: [82, 34], e1m2: [234, 70], e1m3: [92, 108], e1m4: [212, 142], e1m5: [146, 180] } },
    finale: { text: strings.finale, background: 'finale-bg', endImage: 'finale-end', endText: 'THE END?', music: 'finale' },
  }),
];
