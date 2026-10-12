// Every piece of text in ROGUE CONTRACT. Change anything here; the engine
// looks these up by key. {placeholders} are filled in by the game.

export default {
  loading: 'LOADING...',
  pressAnyKey: 'PRESS ANY KEY',
  yesNo: '(PRESS Y OR N)',
  cheatActivated: 'CHEAT ACTIVATED',
  secretFound: 'A SECRET IS REVEALED!',
  needKey: 'You need a {key} to open this door.',
  deathMessage: 'CONTRACT TERMINATED.',
  respawnPrompt: 'PRESS USE TO TRY AGAIN',

  hud: { ammo: 'ENERGY', health: 'HEALTH', arms: 'ARMS', armor: 'SHIELD' },
  automap: { kills: 'KILLS', items: 'ITEMS', secrets: 'SECRETS' },
  intermission: {
    finished: 'FINISHED',
    kills: 'KILLS',
    items: 'ITEMS',
    secrets: 'SECRET',
    time: 'TIME',
    par: 'PAR',
    entering: 'NOW ENTERING',
    youAreHere: 'YOU ARE HERE',
  },

  skills: ['RECRUIT', 'SMUGGLER', 'MERCENARY', 'BOUNTY HUNTER', 'NO WITNESSES'],

  menu: {
    newGame: 'NEW GAME',
    continue: 'CONTINUE',
    options: 'OPTIONS',
    readThis: 'READ THIS!',
    quit: 'QUIT GAME',
    paused: 'PAUSED',
    resume: 'RESUME',
    restart: 'RESTART LEVEL',
    quitToTitle: 'QUIT TO TITLE',
    chooseSkill: 'CHOOSE YOUR RATE:',
    whichEpisode: 'WHICH MISSION?',
    nightmareConfirm: 'Are you sure? The Empire sends everything it has. This level is not even remotely fair.',
    restartConfirm: 'Restart this level from the beginning?',
    mouse: 'MOUSE',
    music: 'MUSIC',
    sound: 'SOUND',
    crt: 'CRT',
    alwaysRun: 'ALWAYS RUN',
    mouseLook: 'MOUSE LOOK',
    invertMouse: 'INVERT LOOK',
    autoAim: 'AUTO AIM',
    messages: 'MESSAGES',
    showFps: 'SHOW FPS',
    touch: 'TOUCH PAD',
    helpFooter: 'PRESS ESC TO GO BACK',
  },

  quitMessages: [
    'Walk away now and the contract goes to someone else.',
    'The Rebellion pays on completion. Not on retreat.',
    'The garrison will still be there tomorrow. So will the stormtroopers.',
    'Leaving? The Empire will be relieved.',
    'You came all this way across the canyon for this?',
  ],

  goodbye: ["It's now safe to turn off", 'your computer.', '', 'The contract will keep.'],

  help: [
    { text: 'MOVE ......... W A S D / ARROW KEYS', tint: 'beige' },
    { text: 'TURN ......... MOUSE / LEFT + RIGHT', tint: 'beige' },
    { text: 'FIRE ......... CLICK / F / CTRL', tint: 'beige' },
    { text: 'USE / OPEN ... E / RIGHT CLICK', tint: 'beige' },
    { text: 'JUMP / DUCK .. SPACE / C', tint: 'beige' },
    { text: 'LOOK ......... MOUSE / PGUP PGDN / END', tint: 'beige' },
    { text: 'RUN .......... SHIFT (OR ALWAYS RUN)', tint: 'beige' },
    { text: 'WEAPONS ...... 1-2 / MOUSE WHEEL / Q', tint: 'beige' },
    { text: 'AUTOMAP ...... TAB / M   (ZOOM + -)', tint: 'beige' },
    { text: 'MENU ......... ESC', tint: 'beige' },
    { text: '' },
    { text: 'You are a mercenary. The Rebellion has', tint: 'steel' },
    { text: 'hired you to break into an Imperial', tint: 'steel' },
    { text: 'garrison hidden in a desert canyon.', tint: 'steel' },
    { text: 'Find the exit switch. Keycards open', tint: 'steel' },
    { text: 'colored doors. Shield units absorb hits.', tint: 'steel' },
  ],

  episodeName: 'THE CANYON GARRISON',

  finale:
    'The exit door seals behind you, and the canyon wind carries the sound of alarms back down the ' +
    'corridors.\n\n' +
    'Somewhere above the mesas, a Rebel transport is already on its way. Your contact said the job would ' +
    'be simple. They always say that.\n\n' +
    'The data you came for is still inside. This was only the way in.',
};
