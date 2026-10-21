import { initEngine } from './engine.js';
import { initUI } from './ui.js';

const $ = (id) => document.getElementById(id);
const boot = $('boot-screen');
const progress = $('boot-progress');
const status = $('boot-status');
const intro = $('intro');
const menu = $('menu');
const gameView = $('game-view');
const fatal = $('fatal-error');
const fatalMessage = $('fatal-message');

function showFatal(error) {
  console.error('[ISB Street Legacy]', error);
  boot.classList.add('hidden');
  fatalMessage.textContent = error?.message || String(error);
  fatal.classList.remove('hidden');
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
  try {
    progress.style.width = '18%';
    status.textContent = 'Loading local 3D engine…';
    const engine = await initEngine($('game-canvas'), {
      onStats: ({ fps, frameMs, renderer }) => {
        $('fps-readout').textContent = `FPS ${fps}`;
        $('menu-performance').textContent = `FPS ${fps}`;
        $('renderer-readout').textContent = `${frameMs} ms · ${renderer}`;
      }
    });
    progress.style.width = '72%';
    status.textContent = 'Preparing interface…';
    initUI({ engine, intro, menu, gameView });
    await wait(250);
    progress.style.width = '100%';
    status.textContent = 'Ready';
    await wait(250);
    boot.classList.add('hidden');
    intro.classList.remove('hidden');
    window.setTimeout(() => {
      if (!intro.classList.contains('hidden')) {
        intro.classList.add('hidden');
        menu.classList.remove('hidden');
      }
    }, 6200);
  } catch (error) {
    showFatal(error);
  }
}

start();
