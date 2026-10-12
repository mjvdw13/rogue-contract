// Levels and episodes. To add a level: create a file like sandbox.js, import
// it here and add its id to an episode's `levels` list (or make a new episode).
import { defineEpisode } from '../../engine/defs.js';
import strings from '../strings.js';
import sandbox from './sandbox.js';

export const levels = [sandbox];

export const episodes = [
  defineEpisode({
    id: 'e1',
    name: strings.episodeName,
    levels: ['sandbox'],
    // Where each level is on the intermission picture.
    map: { spots: { sandbox: [160, 100] } },
    finale: { text: strings.finale, background: 'intermission', endImage: 'title', endText: 'TO BE CONTINUED', music: 'title' },
  }),
];
