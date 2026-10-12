// Game-wide settings the engine reads from content.
export default {
  /** Font ids used by the engine for each role. */
  fonts: { small: 'small', big: 'big', hud: 'hud', tiny: 'tiny', gold: 'gold' },
  /** Keys (keycards). `icon` is the frame in assets/ui/hud-icons.png; `ramp` colours the automap. */
  keys: [
    { id: 'blue', name: 'BLUE KEYCARD', icon: 0, ramp: 'steel' },
    { id: 'yellow', name: 'YELLOW KEYCARD', icon: 1, ramp: 'yellow' },
    { id: 'red', name: 'RED KEYCARD', icon: 2, ramp: 'blood' },
  ],
  colors: { message: 'beige' },
  titleMusic: 'title',
  intermissionMusic: 'intermission',
};
