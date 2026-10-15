import test from 'node:test';
import assert from 'node:assert/strict';
import { noteToFreq, parsePattern, compileSong } from '../src/engine/audio/music.js';
import { renderSynth, SYNTH_RATE } from '../src/engine/audio/synth.js';
import fs from 'node:fs';
import { AudioSystem, leadingSilence } from '../src/engine/audio/audio.js';
import { registry } from './helpers.js';

test('note names map to frequencies', () => {
  assert.ok(Math.abs(noteToFreq('A4') - 440) < 1e-9);
  assert.ok(Math.abs(noteToFreq('A5') - 880) < 1e-9);
  assert.ok(Math.abs(noteToFreq('C4') - 261.6256) < 1e-3);
});

test('patterns parse notes, rests and holds', () => {
  const steps = parsePattern('C4 . - E4');
  assert.equal(steps.length, 4);
  assert.ok(steps[0]);
});

test('every song compiles', () => {
  for (const song of registry.songs.values()) {
    if (song.src) continue;
    assert.doesNotThrow(() => compileSong(song), song.id);
  }
});

test('every synth sound renders audible samples of a sane length', () => {
  for (const s of registry.sounds.values()) {
    if (!s.synth) continue;
    const buf = renderSynth(s.synth, SYNTH_RATE, s.id);
    const data = buf.data ?? buf;
    assert.ok(data.length > SYNTH_RATE * 0.02 && data.length < SYNTH_RATE * 8, `${s.id}: ${data.length} samples`);
    let peak = 0;
    for (const v of data) peak = Math.max(peak, Math.abs(v));
    assert.ok(peak > 0.01, `${s.id} is not silent`);
    assert.ok(peak <= 1.0001, `${s.id} does not clip`);
  }
});

test('leading silence is found and trimmed to 2 ms before the sound', () => {
  const rate = 10000;
  const samples = new Float32Array(1000);
  for (let i = 300; i < 1000; i++) samples[i] = i % 2 ? 0.5 : -0.5;
  samples[100] = 0.004; // MP3 noise below 1% of the peak
  assert.equal(leadingSilence(samples, rate), 280);
  assert.equal(leadingSilence(new Float32Array(50), rate), 0);
});

test('a sound override swaps in its file and keeps the synth as a stand-in', () => {
  const audio = new AudioSystem(registry);
  audio.setOverrides({ 'blaster-fire': { src: 'x/PISTOL-1.mp3', volume: 0.7 }, 'no-such-sound': { src: 'x/y.mp3' } });
  assert.deepEqual([...audio.overrides.keys()], ['blaster-fire']);
  const def = audio.soundDef('blaster-fire');
  assert.equal(def.src, 'x/PISTOL-1.mp3');
  assert.equal(def.volume, 0.7);
  assert.equal(def.synth, undefined);
  assert.equal(def.standIn, registry.sounds.get('blaster-fire'));
  assert.equal(audio.soundDef('explode'), registry.sounds.get('explode'));
});

test('an override whose file fails to load falls back to the synth', async () => {
  const audio = new AudioSystem(registry);
  audio.setOverrides({ 'blaster-fire': { src: 'x/missing.mp3' } });
  audio.ctx = {};
  audio._fetch = () => Promise.reject(new Error('404'));
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(audio._buffer(audio.soundDef('blaster-fire')), null);
    await new Promise((r) => setTimeout(r, 0));
  } finally {
    console.warn = warn;
  }
  assert.equal(audio.overrides.size, 0);
  assert.equal(audio.soundDef('blaster-fire'), registry.sounds.get('blaster-fire'));
});

test('the committed sound overrides name known sounds and existing files', () => {
  const map = JSON.parse(fs.readFileSync('assets/custom/sound-overrides.json', 'utf8'));
  for (const [id, o] of Object.entries(map)) {
    assert.ok(registry.sounds.has(id), `unknown sound "${id}"`);
    assert.ok(fs.existsSync(o.src), `${id}: no file ${o.src}`);
    assert.ok(o.volume > 0 && o.volume <= 2, `${id}: volume ${o.volume}`);
  }
});
