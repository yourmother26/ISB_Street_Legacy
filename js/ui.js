export function initUI({ engine, intro, menu, gameView }) {
  const $ = (id) => document.getElementById(id);
  const settings = $('settings-panel');
  const socials = $('socials-panel');
  const continuePanel = $('continue-panel');
  const pausePanel = $('pause-panel');
  const joystickZone = $('move-stick-zone');
  const joystickKnob = $('move-stick-knob');
  let joystickPointer = null;

  const showMenu = () => {
    engine.setPaused(false);
    pausePanel?.classList.add('hidden');
    gameView.classList.add('hidden');
    menu.classList.remove('hidden');
  };
  const pauseGame = () => { engine.setPaused(true); pausePanel?.classList.remove('hidden'); };
  const resumeGame = () => { pausePanel?.classList.add('hidden'); engine.setPaused(false); };
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
  $('skip-intro')?.addEventListener('click', () => {
    intro.classList.add('hidden');
    menu.classList.remove('hidden');
  });
  $('start-game')?.addEventListener('click', enterWorld);
  $('continue-game')?.addEventListener('click', () => continuePanel.classList.remove('hidden'));
  $('pause-game')?.addEventListener('click', pauseGame);
  $('resume-game')?.addEventListener('click', resumeGame);
  $('exit-to-menu')?.addEventListener('click', showMenu);
  const resetJoystick = () => {
    joystickPointer = null;
    if (joystickKnob) joystickKnob.style.transform = 'translate(-50%, -50%)';
    engine.setMoveInput(0, 0);
  };
  function updateJoystick(event) {
    if (joystickPointer !== event.pointerId || !joystickZone) return;
    event.preventDefault();
    const rect = joystickZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = Math.min(rect.width, rect.height) * 0.34;
    let dx = event.clientX - cx;
    let dy = event.clientY - cy;
    const distance = Math.hypot(dx, dy);
    if (distance > max) {
      dx = (dx / distance) * max;
      dy = (dy / distance) * max;
    }
    if (joystickKnob) {
      joystickKnob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    }
    // X = strafe, negative Y = forward; engine rotates this input by camera yaw.
    engine.setMoveInput(dx / max, dy / max);
  }
  joystickZone?.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    joystickPointer = event.pointerId;
    try { joystickZone.setPointerCapture(event.pointerId); } catch (_) {}
    updateJoystick(event);
  }, { passive: false });
  joystickZone?.addEventListener('pointermove', updateJoystick, { passive: false });
  joystickZone?.addEventListener('pointerup', event => {
    if (joystickPointer === event.pointerId) resetJoystick();
  });
  joystickZone?.addEventListener('pointercancel', event => {
    if (joystickPointer === event.pointerId) resetJoystick();
  });
  joystickZone?.addEventListener('lostpointercapture', resetJoystick);
  $('open-settings')?.addEventListener('click', () => settings.classList.remove('hidden'));
  $('open-socials')?.addEventListener('click', () => socials.classList.remove('hidden'));
  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => $(button.dataset.close)?.classList.add('hidden'));
  });
  $('quality')?.addEventListener('change', (event) => engine.setQuality(event.target.value));
}
