// Every piece of text in RACCOON ALEX. Change anything here; the engine
// looks these up by key. {placeholders} are filled in by the game.

export default {
  loading: 'LOADING...',
  pressAnyKey: 'PRESS ANY KEY',
  yesNo: '(PRESS Y OR N)',
  cheatActivated: 'CHEAT ACTIVATED',
  secretFound: 'A SECRET IS REVEALED!',
  needKey: 'You need a {key} to open this door.',
  deathMessage: 'ALEX FELL ASLEEP. PERMANENTLY.',
  respawnPrompt: 'PRESS USE TO TRY AGAIN',

  hud: { ammo: 'AMMO', health: 'HEALTH', arms: 'ARMS', armor: 'CAFFEINE' },
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

  skills: ['I SLEPT FINE', 'ONE MORE EPISODE', 'RED-EYE FLIGHT', 'ALL-NIGHTER', 'INSOMNIA!'],

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
    chooseSkill: 'HOW TIRED ARE YOU?',
    whichEpisode: 'WHICH EPISODE?',
    nightmareConfirm: 'Are you sure? You will not sleep for a week. This skill level is not even remotely fair.',
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
    "Don't go! Alex STILL hasn't slept.",
    'The report is due at 9 AM. You can sleep when you are dead.',
    "There's still coffee in the break room...",
    "Quitting? That's exactly what HR wants.",
    'Go ahead, log off. The bugs will be waiting.',
    'Alex has been awake for 72 hours and HE is not quitting.',
    'Are you sure? Those raccoon eyes say otherwise.',
    'If you leave now, the bugs ship to production.',
    'Please don\'t go. The printer is jammed again.',
  ],

  goodbye: ["It's now safe to turn off", 'your computer.', '', 'Go to bed. Seriously.'],

  help: [
    { text: 'MOVE ......... W A S D / ARROW KEYS', tint: 'beige' },
    { text: 'TURN ......... MOUSE / LEFT + RIGHT', tint: 'beige' },
    { text: 'FIRE ......... CLICK / F / CTRL', tint: 'beige' },
    { text: 'USE / OPEN ... E / RIGHT CLICK', tint: 'beige' },
    { text: 'JUMP / DUCK .. SPACE / C', tint: 'beige' },
    { text: 'LOOK ......... MOUSE / PGUP PGDN / END', tint: 'beige' },
    { text: 'RUN .......... SHIFT (OR ALWAYS RUN)', tint: 'beige' },
    { text: 'WEAPONS ...... 1-6 / MOUSE WHEEL / Q', tint: 'beige' },
    { text: 'AUTOMAP ...... TAB / M   (ZOOM + -)', tint: 'beige' },
    { text: 'MENU ......... ESC', tint: 'beige' },
    { text: '' },
    { text: 'It is 3 AM. Alex has been awake for', tint: 'steel' },
    { text: '72 hours. The deadline has opened a', tint: 'steel' },
    { text: 'portal, and it is crawling with bugs.', tint: 'steel' },
    { text: 'Find the exit on every floor. Badges', tint: 'steel' },
    { text: 'open colored doors. Coffee is armor.', tint: 'steel' },
  ],

  episodeName: 'KNEE-DEEP IN THE DEADLINE',

  finale:
    'With one last cackle, the Pumpkin King splits down the middle and bursts over the landfill in a ' +
    'shower of seeds and burning pulp. All over the building, the bugs go still.\n\n' +
    'Silence. Real silence. The first in 72 hours.\n\n' +
    'Alex crawls out of the garbage, back up through the sewers, past the boiler room, past the cubicles, ' +
    'and collapses face-first onto his desk.\n\n' +
    'The quarterly report is finished. Nobody will ever read it.\n\n' +
    'His eyes close. The bags under them finally begin to fade...\n\n' +
    '...and then his phone buzzes.\n\n' +
    '7:00 AM. STANDUP IN FIVE MINUTES.',
};
