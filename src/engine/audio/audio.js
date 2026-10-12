import { renderSynth, SYNTH_RATE } from './synth.js';
import { MusicPlayer } from './music.js';

const MAX_VOICES = 18;
const NEAR = 3.2; // full volume inside this distance (tiles)
const FAR = 48; // silent beyond this distance

/**
 * Sound effects and music. Synthesized sounds are rendered on first use;
 * file sounds are fetched and decoded in the background. Browsers only allow
 * audio after a user gesture, so call unlock() from a key/click handler.
 */
export class AudioSystem {
  /** @param {import('../registry.js').Registry} registry */
  constructor(registry, settings = {}) {
    this.registry = registry;
    this.ctx = null;
    this.buffers = new Map();
    this.pending = new Set();
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

  _buffer(def) {
    if (this.buffers.has(def.id)) return this.buffers.get(def.id);
    if (def.synth) {
      const samples = renderSynth(def.synth, SYNTH_RATE, def.id);
      const buf = this.ctx.createBuffer(1, samples.length, SYNTH_RATE);
      buf.getChannelData(0).set(samples);
      this.buffers.set(def.id, buf);
      return buf;
    }
    if (def.src && !this.pending.has(def.id)) {
      this.pending.add(def.id);
      fetch(def.src)
        .then((r) => r.arrayBuffer())
        .then((data) => this.ctx.decodeAudioData(data))
        .then((buf) => this.buffers.set(def.id, buf))
        .catch((err) => console.warn(`Could not load sound "${def.id}"`, err));
    }
    return null;
  }

  /** Pre-render every synthesized sound (avoids hitches the first time each plays). */
  warmUp() {
    if (!this.ctx) return;
    for (const def of this.registry.sounds.values()) this._buffer(def);
  }

  /**
   * Play a sound. opts: { volume, pan (-1..1), rate, fallback (id if missing) }
   */
  play(id, opts = {}) {
    if (!this.ctx || this.muted) return;
    const def = this.registry.sounds.get(id) ?? (opts.fallback ? this.registry.sounds.get(opts.fallback) : null);
    if (!def) return;
    const buf = this._buffer(def);
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
