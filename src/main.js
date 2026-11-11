// ROGUE CONTRACT entry point: build the game from the content pack and boot it.
import { Game } from './engine/game.js';
import content from './content/index.js';

const canvas = document.getElementById('screen');
const status = document.getElementById('boot-message');

function showError(err) {
  status.hidden = false;
  status.classList.add('error');
  status.textContent = `ROGUE CONTRACT crashed while loading.\n\n${err?.stack ?? err}`;
}

/**
 * The renderer draws on several threads where it may share memory with
 * them, which takes two headers GitHub Pages can't send: a service worker
 * adds them (sw.js). It only does so for pages loaded once it's in, so the
 * first visit reloads here, once, before anything is loaded (a second try
 * in the same tab carries on without: one thread, as ever). `?threads=0`
 * leaves it out.
 */
async function isolate() {
  const within = (promise, ms) => Promise.race([promise, new Promise((done) => setTimeout(done, ms))]);
  try {
    if (globalThis.crossOriginIsolated || !window.isSecureContext || !navigator.serviceWorker) return;
    if (new URLSearchParams(location.search).get('threads') === '0') return;
    const tried = sessionStorage.getItem('isolating');
    sessionStorage.setItem('isolating', '1');
    const registered = navigator.serviceWorker.register('sw.js');
    if (tried) return;
    await within(registered.then(() => navigator.serviceWorker.ready), 3000);
    if (!navigator.serviceWorker.controller) {
      await within(new Promise((done) => navigator.serviceWorker.addEventListener('controllerchange', done, { once: true })), 1000);
    }
    if (!navigator.serviceWorker.controller) return;
    location.reload();
    await new Promise(() => {});
  } catch {
    // (No service workers here, or no storage: one thread.)
  }
}

try {
  await isolate();
  const game = new Game({ canvas, content, params: new URLSearchParams(location.search) });
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
