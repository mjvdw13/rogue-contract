/**
 * The game's menus, built from content strings so every label can be
 * renamed in src/content/strings.js.
 */

function t(game, key, fallback) {
  return game.registry.strings.menu?.[key] ?? fallback;
}

export function mainMenu(game) {
  return {
    id: 'main',
    y: 74,
    x: 128,
    items: () => {
      const items = [
        { label: t(game, 'newGame', 'NEW GAME'), action: () => game.menu.open(game.registry.episodes.size > 1 ? episodeMenu(game) : skillMenu(game, game.registry.firstEpisode()?.id)) },
      ];
      if (game.savedProgress()) items.push({ label: t(game, 'continue', 'CONTINUE'), action: () => game.continueGame() });
      items.push(
        { label: t(game, 'options', 'OPTIONS'), action: () => game.menu.open(optionsMenu(game)) },
        { label: t(game, 'readThis', 'READ THIS!'), action: () => game.menu.open(helpMenu(game)) },
        { label: t(game, 'quit', 'QUIT GAME'), action: () => game.menu.ask(game.quitMessage(), () => game.quit()) },
      );
      return items;
    },
  };
}

export function pauseMenu(game) {
  return {
    id: 'pause',
    y: 40,
    x: 90,
    title: t(game, 'paused', 'PAUSED'),
    onBack: () => game.resume(),
    items: [
      { label: t(game, 'resume', 'RESUME'), action: () => game.menu.closeAll() },
      { label: t(game, 'options', 'OPTIONS'), action: () => game.menu.open(optionsMenu(game)) },
      { label: t(game, 'readThis', 'READ THIS!'), action: () => game.menu.open(helpMenu(game)) },
      {
        label: t(game, 'restart', 'RESTART LEVEL'),
        action: () => game.menu.ask(t(game, 'restartConfirm', 'Restart this level?'), () => game.restartLevel()),
      },
      {
        label: t(game, 'quitToTitle', 'QUIT TO TITLE'),
        action: () => game.menu.ask(game.quitMessage(), () => game.quitToTitle()),
      },
    ],
  };
}

export function episodeMenu(game) {
  return {
    id: 'episode',
    title: t(game, 'whichEpisode', 'WHICH EPISODE?'),
    y: 40,
    x: 50,
    items: [...game.registry.episodes.values()].map((ep) => ({
      label: ep.name,
      action: () => game.menu.open(skillMenu(game, ep.id)),
    })),
  };
}

export function skillMenu(game, episodeId) {
  const names = game.registry.strings.skills ?? ['EASY', 'NORMAL', 'MEDIUM', 'HARD', 'NIGHTMARE'];
  return {
    id: 'skill',
    title: t(game, 'chooseSkill', 'CHOOSE SKILL LEVEL'),
    y: 58,
    x: 116,
    titleX: 212,
    defaultIndex: 2, // the middle skill, like Doom's "Hurt me plenty"
    items: names.map((name, i) => ({
      label: name,
      action: () => {
        const skill = i + 1;
        if (skill === 5) {
          game.menu.ask(t(game, 'nightmareConfirm', 'Are you sure? This skill level is not even remotely fair.'), () =>
            game.newGame(episodeId, skill),
          );
        } else {
          game.newGame(episodeId, skill);
        }
      },
    })),
  };
}

export function optionsMenu(game) {
  const s = game.settings;
  const set = (key) => (v) => {
    s[key] = v;
    game.applySettings();
  };
  return {
    id: 'options',
    title: t(game, 'options', 'OPTIONS'),
    y: 24,
    x: 40,
    lineHeight: 14,
    items: [
      { label: t(game, 'mouse', 'MOUSE'), slider: { get: () => s.mouseSensitivity, set: set('mouseSensitivity'), min: 1, max: 10 } },
      { label: t(game, 'music', 'MUSIC'), slider: { get: () => s.musicVolume, set: set('musicVolume'), min: 0, max: 10 } },
      { label: t(game, 'sound', 'SOUND'), slider: { get: () => s.sfxVolume, set: set('sfxVolume'), min: 0, max: 10 } },
      {
        label: t(game, 'crt', 'CRT'),
        choice: {
          get: () => s.crt,
          set: set('crt'),
          options: [
            { value: 'off', label: 'OFF' },
            { value: 'subtle', label: 'SUBTLE' },
            { value: 'full', label: 'FULL' },
          ],
        },
      },
      { label: t(game, 'alwaysRun', 'ALWAYS RUN'), toggle: { get: () => s.alwaysRun, set: set('alwaysRun') } },
      { label: t(game, 'mouseLook', 'MOUSE LOOK'), toggle: { get: () => s.mouseLook, set: set('mouseLook') } },
      { label: t(game, 'invertMouse', 'INVERT LOOK'), toggle: { get: () => s.invertMouseY, set: set('invertMouseY') } },
      { label: t(game, 'messages', 'MESSAGES'), toggle: { get: () => s.messages, set: set('messages') } },
      { label: t(game, 'showFps', 'SHOW FPS'), toggle: { get: () => s.showFps, set: set('showFps') } },
      {
        label: t(game, 'touch', 'TOUCH'),
        choice: {
          get: () => s.touchControls,
          set: set('touchControls'),
          options: [
            { value: 'auto', label: 'AUTO' },
            { value: 'on', label: 'ON' },
            { value: 'off', label: 'OFF' },
          ],
        },
      },
    ],
  };
}

export function helpMenu(game) {
  const lines = game.registry.strings.help ?? [];
  return {
    id: 'help',
    title: t(game, 'readThis', 'READ THIS!'),
    y: 14,
    small: true,
    items: lines.map((line) =>
      typeof line === 'string' ? { text: line } : { text: line.text, tint: line.tint, center: line.center },
    ),
    footer: t(game, 'helpFooter', 'PRESS ESC TO GO BACK'),
  };
}
