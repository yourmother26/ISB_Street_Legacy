export function initUI({ engine, intro, menu, gameView }) {
  const $ = (id) => document.getElementById(id);
  const settings = $('settings-panel');
  const socials = $('socials-panel');
  const continuePanel = $('continue-panel');

  const showMenu = () => {
    gameView.classList.add('hidden');
    menu.classList.remove('hidden');
  };
  const enterWorld = () => {
    // Mobile browsers may only permit orientation locking after a user gesture.
    try {
      const lock = screen.orientation?.lock;
      if (typeof lock === 'function') lock.call(screen.orientation, 'landscape').catch(() => {});
    } catch (_) {}
    intro.classList.add('hidden');
    menu.classList.add('hidden');
    settings.classList.add('hidden');
    socials.classList.add('hidden');
    continuePanel.classList.add('hidden');
    gameView.classList.remove('hidden');
  };
  $('skip-intro').addEventListener('click', () => {
    intro.classList.add('hidden');
    menu.classList.remove('hidden');
  });
  $('start-game').addEventListener('click', enterWorld);
  $('continue-game').addEventListener('click', () => continuePanel.classList.remove('hidden'));
  $('back-to-menu').addEventListener('click', showMenu);
  $('open-settings').addEventListener('click', () => settings.classList.remove('hidden'));
  $('open-socials').addEventListener('click', () => socials.classList.remove('hidden'));
  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => $(button.dataset.close).classList.add('hidden'));
  });
  $('quality').addEventListener('change', (event) => engine.setQuality(event.target.value));
}
