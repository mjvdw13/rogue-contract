import { renderSynth, SYNTH_RATE } from './synth.js';
import { MusicPlayer } from './music.js';

const MAX_VOICES = 18;
const NEAR = 3.2; // full volume inside this distance (tiles)
const FAR = 48; // silent beyond this distance

/**
 * Where a recorded sound really starts: the first sample above 1% of its
 * peak, less 2 ms. MP3s carry 25 ms or more of silence before the sound.
 */
export function leadingSilence(samples, rate) {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  const threshold = peak * 0.01;
  let i = 0;
  while (i < samples.length && Math.abs(samples[i]) <= threshold) i++;
  if (i >= samples.length) return 0;
  return Math.max(0, i - Math.round(rate * 0.002));
}

/**
 * Sound effects and music. Synthesized sounds are rendered on first use;
 * file sounds are fetched and decoded in the background. Browsers only allow
 * audio after a user gesture, so call unlock() from a key/click handler.
 *
 * Sound overrides: `assets/custom/sound-overrides.json` maps a sound id to a
 * recorded file, `{ src, volume? }`. The file plays instead of the synth (the
 * synth stands in until the file is decoded, and for good if it fails to
 * load). Skipped under test automation, so tests hear the synthesized sounds.
 */
export class AudioSystem {
  /** @param {import('../registry.js').Registry} registry */
  constructor(registry, settings = {}) {
    this.registry = registry;
    this.ctx = null;
    this.buffers = new Map();
    this.pending = new Set();
    this.overrides = new Map();
    this.files = new Map();
    this.voices = [];
    this.muted = false;
    this.sfxLevel = 0.8;
    this.musicLevel = 0.6;
    this.music = new MusicPlayer(this);
    this.wantedSong = null;
    this.setVolumes(settings);
  }

  get unlocked() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp);
    comp.connect(ctx.destination);
    this.sfxGain = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.sfxGain.connect(this.master);
    this.musicGain.connect(this.master);
    this._applyVolumes();
    this._decodeOverrides();
    if (this.wantedSong) {
      const song = this.wantedSong;
      this.wantedSong = null;
      this.playMusic(song);
    }
  }

  /** Settings volumes are 0..10. */
  setVolumes({ sfxVolume = 8, musicVolume = 6 } = {}) {
    this.sfxLevel = Math.pow(sfxVolume / 10, 1.6);
    this.musicLevel = Math.pow(musicVolume / 10, 1.6) * 0.9;
    this._applyVolumes();
  }

  setMuted(m) {
    this.muted = m;
    this._applyVolumes();
  }

  _applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(this.muted ? 0 : this.sfxLevel, t, 0.02);
    this.musicGain.gain.setTargetAtTime(this.muted ? 0 : this.musicLevel, t, 0.02);
    this.music.setVolume(this.muted ? 0 : this.musicLevel);
  }

  /** Fetch `assets/custom/sound-overrides.json` and start downloading its files. */
  async loadOverrides() {
    if (globalThis.navigator?.webdriver) return;
    let map = {};
    try {
      const res = await fetch('assets/custom/sound-overrides.json', { cache: 'no-store' });
      if (res.ok) map = await res.json();
    } catch {
      // No overrides.
    }
    this.setOverrides(map);
    for (const o of this.overrides.values()) this._fetch(o.src).catch(() => {});
    if (this.ctx) this._decodeOverrides();
  }

  /** Use recorded files for sound ids: `{ id: { src, volume? } }`. */
  setOverrides(map) {
    this.overrides.clear();
    for (const [id, o] of Object.entries(map ?? {})) {
      if (!this.registry.sounds.has(id)) console.warn(`Sound override for unknown sound "${id}"`);
      else if (o?.src) {
        this.overrides.set(id, o);
        console.info(`Sound override: ${id} -> ${o.src}`);
      }
    }
  }

  /** The sound definition to play for an id: its override's file if it has one. */
  soundDef(id) {
    const def = this.registry.sounds.get(id);
    const o = this.overrides.get(id);
    if (!def || !o) return def ?? null;
    return { ...def, src: o.src, synth: undefined, volume: o.volume ?? def.volume, standIn: def.synth ? def : null };
  }

  _fetch(src) {
    if (!this.files.has(src)) {
      this.files.set(src, fetch(src).then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${src}`);
        return r.arrayBuffer();
      }));
    }
    return this.files.get(src);
  }

  _decodeOverrides() {
    for (const id of this.overrides.keys()) this._buffer(this.soundDef(id));
  }

  _buffer(def) {
    const key = def.src ?? def.id;
    if (this.buffers.has(key)) return this.buffers.get(key);
    if (def.synth) {
      const samples = renderSynth(def.synth, SYNTH_RATE, def.id);
      const buf = this.ctx.createBuffer(1, samples.length, SYNTH_RATE);
      buf.getChannelData(0).set(samples);
      this.buffers.set(key, buf);
      return buf;
    }
    if (def.src && !this.pending.has(key)) {
      this.pending.add(key);
      this._fetch(def.src)
        .then((data) => this.ctx.decodeAudioData(data.slice(0)))
        .then((buf) => this.buffers.set(key, this._trim(buf)))
        .catch((err) => {
          console.warn(`Could not load sound "${def.id}" (${def.src})`, err);
          // An override that won't load falls back to the synth for good.
          for (const [id, o] of this.overrides) if (o.src === def.src) this.overrides.delete(id);
        });
    }
    return null;
  }

  /** A copy of a decoded file without its leading silence. */
  _trim(buf) {
    const skip = leadingSilence(buf.getChannelData(0), buf.sampleRate);
    if (!skip) return buf;
    const out = this.ctx.createBuffer(buf.numberOfChannels, buf.length - skip, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) out.getChannelData(c).set(buf.getChannelData(c).subarray(skip));
    return out;
  }

  /** Pre-render every synthesized sound (avoids hitches the first time each plays). */
  warmUp() {
    if (!this.ctx) return;
    for (const id of this.registry.sounds.keys()) this._buffer(this.soundDef(id));
  }

  /**
   * Play a sound. opts: { volume, pan (-1..1), rate, fallback (id if missing) }
   */
  play(id, opts = {}) {
    if (!this.ctx || this.muted) return;
    let def = this.soundDef(id) ?? (opts.fallback ? this.soundDef(opts.fallback) : null);
    if (!def) return;
    let buf = this._buffer(def);
    // A recorded sound still loading: the synth plays meanwhile.
    if (!buf && def.standIn) buf = this._buffer((def = def.standIn));
    if (!buf) return;
    const ctx = this.ctx;
    // Same sound from the same origin cuts itself off; otherwise steal the oldest voice.
    if (opts.origin !== undefined) {
      for (const v of this.voices) if (v.origin === opts.origin && v.id === id) v.stop();
    }
    while (this.voices.length >= MAX_VOICES) this.voices.shift().stop();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const variance = def.pitchVariance ?? 0;
    src.playbackRate.value = (opts.rate ?? 1) * (1 + (Math.random() * 2 - 1) * variance);
    const g = ctx.createGain();
    g.gain.value = (opts.volume ?? 1) * (def.volume ?? 1);
    src.connect(g);
    let tail = g;
    if (ctx.createStereoPanner && opts.pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      g.connect(p);
      tail = p;
    }
    tail.connect(this.sfxGain);
    const voice = {
      id,
      origin: opts.origin,
      stop: () => {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
      },
    };
    src.onended = () => {
      const i = this.voices.indexOf(voice);
      if (i >= 0) this.voices.splice(i, 1);
    };
    this.voices.push(voice);
    src.start();
  }

  /** Positional sound: volume falls off with distance, panned by direction. */
  playAt(id, x, y, lx, ly, langle) {
    const dx = x - lx;
    const dy = y - ly;
    const d = Math.hypot(dx, dy);
    const volume = d <= NEAR ? 1 : d >= FAR ? 0 : 1 - (d - NEAR) / (FAR - NEAR);
    if (volume <= 0.02) return;
    const rel = Math.atan2(dy, dx) - langle;
    this.play(id, { volume: volume * volume * 0.8 + volume * 0.2, pan: Math.sin(rel) * 0.8 * Math.min(1, d / 2) });
  }

  /** Start a song by id (or song definition). Remembered until audio unlocks. */
  playMusic(idOrSong) {
    const song = typeof idOrSong === 'string' ? this.registry.songs.get(idOrSong) : idOrSong;
    if (!this.ctx) {
      this.wantedSong = song ?? null;
      return;
    }
    if (!song) {
      this.music.stop();
      return;
    }
    this.music.play(song);
  }

  stopMusic() {
    this.wantedSong = null;
    this.music.stop();
  }
}
