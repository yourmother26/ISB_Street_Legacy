export function initUI({ engine, intro, menu, gameView }) {
  const $ = (id) => document.getElementById(id);
  const settings = $('settings-panel');
  const credits = $('credits-panel');

  const showMenu = () => {
    gameView.classList.add('hidden');
    menu.classList.remove('hidden');
  };
  const enterWorld = () => {
    intro.classList.add('hidden');
    menu.classList.add('hidden');
    settings.classList.add('hidden');
    credits.classList.add('hidden');
    gameView.classList.remove('hidden');
  };
  $('skip-intro').addEventListener('click', () => {
    intro.classList.add('hidden');
    menu.classList.remove('hidden');
  });
  $('start-game').addEventListener('click', enterWorld);
  $('back-to-menu').addEventListener('click', showMenu);
  $('open-settings').addEventListener('click', () => settings.classList.remove('hidden'));
  $('open-credits').addEventListener('click', () => credits.classList.remove('hidden'));
  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => $(button.dataset.close).classList.add('hidden'));
  });
  $('quality').addEventListener('change', (event) => engine.setQuality(event.target.value));
}
