/**
 * Tiny localStorage wrapper. Storage can be missing or throw (private mode,
 * blocked cookies), so every access is guarded and falls back to defaults.
 */
export class Storage {
  constructor(prefix) {
    this.prefix = prefix;
  }

  load(name, defaults) {
    try {
      const raw = globalThis.localStorage?.getItem(`${this.prefix}:${name}`);
      if (!raw) return structuredClone(defaults);
      const parsed = JSON.parse(raw);
      if (defaults && typeof defaults === 'object' && !Array.isArray(defaults)) {
        return { ...structuredClone(defaults), ...parsed };
      }
      return parsed;
    } catch {
      return structuredClone(defaults);
    }
  }

  save(name, value) {
    try {
      globalThis.localStorage?.setItem(`${this.prefix}:${name}`, JSON.stringify(value));
    } catch {
      /* storage unavailable: settings just won't persist */
    }
  }
}

export const DEFAULT_SETTINGS = {
  mouseSensitivity: 5, // 1..10
  musicVolume: 6, // 0..10
  sfxVolume: 8, // 0..10
  crt: 'subtle', // 'off' | 'subtle' | 'full'
  widescreen: true, // fill wide windows instead of bars at the sides
  alwaysRun: true,
  showFps: false,
  messages: true,
  invertMouseY: false,
  mouseLook: true,
  autoAim: true,
};
