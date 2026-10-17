// Levels and episodes. To add a level: create a file like m3.js, import it
// here and add its id to an episode's `levels` list (or make a new episode).
import { defineEpisode } from '../../engine/defs.js';
import strings from '../strings.js';
import m1 from './m1.js';
import m3 from './m3.js';
import sandbox from './sandbox.js';

// The sandbox is a test map for the height engine (?map=sandbox), outside the episode.
export const levels = [m1, m3, sandbox];

export const episodes = [
  defineEpisode({
    id: 'e1',
    name: strings.episodeName,
    levels: ['m3'],
    // Where each level is on the intermission picture.
    map: { spots: { m3: [160, 100] } },
    finale: { text: strings.finale, background: 'intermission', endImage: 'title', endText: 'TO BE CONTINUED', music: 'title' },
  }),
];
