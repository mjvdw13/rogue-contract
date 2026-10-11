// ROGUE CONTRACT entry point: build the game from the content pack and boot it.
import { Game } from './engine/game.js';
import content from './content/index.js';

const canvas = document.getElementById('screen');
const stage = document.getElementById('stage');
const status = document.getElementById('boot-message');

function showError(err) {
  status.hidden = false;
  status.classList.add('error');
  status.textContent = `ROGUE CONTRACT crashed while loading.\n\n${err?.stack ?? err}`;
}

try {
  const game = new Game({ canvas, stage, content, params: new URLSearchParams(location.search) });
  // Handy for poking at the game from the browser console.
  window.game = game;
  await game.boot((state) => {
    if (state === 'fonts') status.hidden = true;
  });
  canvas.focus();
} catch (err) {
  console.error(err);
  showError(err);
}
