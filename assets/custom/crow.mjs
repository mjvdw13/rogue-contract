// Copies Jedi Knight's Moldy Crow textures (jk-crow/, from the "PC _
// Computer - Star Wars_ Jedi Knight - Dark Forces II - Ships - The Moldy
// Crow" zip) into textures/ under names that say what they cover
// (src/content/models/crow.js). They're used as they are: JK's grey paint
// with orange rust is the Crow of Dark Forces' cutscenes. See DISCLAIMER.md.
//
//   node assets/custom/crow.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** JK's name → ours. */
export const CROW = {
  crowlhul: 'crow-hull-side', // the nose's flanks, with the cockpit windows (nose to the left)
  crowthul: 'crow-hull-top', // the deck, nose at the top
  crowbsds: 'crow-side', // the flanks behind the nose
  crowupsd: 'crow-belly', // the underside
  crowtshp: 'crow-rear', // the back of the hull, its tail lights and grille
  crownose: 'crow-nose',
  crowsdgn: 'crow-ribs', // ribbed: the sponsons' tops
  crowsdp2: 'crow-panel', // a panel with lights: the sponsons' sides
  crowbgun: 'crow-gun', // the belly gun's pod
  crowbarl: 'crow-barrel',
  crowmwng: 'crow-wing', // the wings' faces
  crowwngr: 'crow-fin', // the fins' faces
  crowwfnt: 'crow-grille', // the wings' leading edges
  crowwft2: 'crow-ladder', // the fins' edges and the wings' tips
  crowmwbk: 'crow-engine', // the wings' engines, glowing
};

for (const [from, to] of Object.entries(CROW)) {
  fs.copyFileSync(path.join(here, 'jk-crow', `${from}.png`), path.join(here, 'textures', `${to}.png`));
}
console.log(`Copied ${Object.keys(CROW).length} Moldy Crow textures to textures/`);
