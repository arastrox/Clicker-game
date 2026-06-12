import './styles.css';
import { loadGame } from './core/save';
import { initHud } from './ui/hud';
import { initInventoryUi } from './ui/inventoryUi';
import { initArenaUi } from './ui/arenaUi';
import { initModals, showCharacterCreation } from './ui/modals';
import { initMusic } from './audio/music';
import { continueGame } from './systems/gameflow';
import { whenArenaReady } from './core/ready';
import { bootArena } from './scenes/createGame';
import { $ } from './ui/dom';

// los errores no capturados se reflejan en consola (diagnóstico)
window.addEventListener('error', (e) => console.error('[uncaught]', e.message, e.filename?.split('/').pop(), e.lineno));
window.addEventListener('unhandledrejection', (e) => console.error('[promise]', (e.reason as Error)?.message ?? e.reason));

// ─── UI DOM ─────────────────────────────────────────────────────────────────

initHud();
initInventoryUi();
initArenaUi();
initModals();
initMusic();

// ─── Arranque: continuar partida o crear personaje ─────────────────────────
// Phaser se crea recién cuando #app es visible (el canvas necesita tamaño real).

const save = loadGame();
if (save) {
  $('app').classList.remove('hidden');
  bootArena();
  whenArenaReady(() => continueGame());
} else {
  showCharacterCreation();
}
