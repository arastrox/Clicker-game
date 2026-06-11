import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { ArenaScene } from './ArenaScene';

let game: Phaser.Game | null = null;

// Crea el juego Phaser. Debe llamarse con #app ya visible: si el contenedor
// mide 0x0 el renderer WebGL arranca corrupto (pipelines a null).
export function bootArena(): void {
  if (game) return;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'arena-canvas',
    pixelArt: true,
    transparent: false,
    backgroundColor: '#05060f',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // ?st fuerza bucle por setTimeout (ventanas ocultas/throttling de RAF)
    fps: location.search.includes('st') ? { forceSetTimeOut: true, target: 60 } : undefined,
    scene: [BootScene, ArenaScene],
  });

  // referencia para depuración en consola
  (window as unknown as { __game: Phaser.Game }).__game = game;

  // refrescar escala cuando el contenedor cambie de tamaño
  const parent = document.getElementById('arena-canvas');
  if (parent) new ResizeObserver(() => game?.scale.refresh()).observe(parent);

  // Watchdog de arranque: si el evento `ready` del TextureManager se pierde
  // (pestaña en segundo plano), las escenas quedan en cola. Destrabar.
  const watchdog = window.setInterval(() => {
    if (!game || game.isRunning) {
      clearInterval(watchdog);
      return;
    }
    const tm = game.textures as unknown as { _pending: number };
    if (game.isBooted && tm._pending === 0) game.textures.emit('ready');
  }, 300);
}
