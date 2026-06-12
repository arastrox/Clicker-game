import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { ArenaScene } from './ArenaScene';

let game: Phaser.Game | null = null;
let usedCanvasFallback = false;

function buildGame(renderType: number): Phaser.Game {
  const g = new Phaser.Game({
    type: renderType,
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
  (window as unknown as { __game: Phaser.Game }).__game = g;
  return g;
}

// Crea el juego Phaser. Debe llamarse con #app ya visible: si el contenedor
// mide 0x0 el renderer WebGL arranca corrupto (framebuffer incompleto).
// Si aún no hay tamaño (ventana minimizada), se espera a que lo haya.
export function bootArena(): void {
  if (game) return;
  const parent = document.getElementById('arena-canvas');
  const rect = parent?.getBoundingClientRect();
  if (parent && rect && (rect.width < 50 || rect.height < 50)) {
    const ro = new ResizeObserver(() => {
      const r = parent.getBoundingClientRect();
      if (r.width >= 50 && r.height >= 50) {
        ro.disconnect();
        bootArenaNow();
      }
    });
    ro.observe(parent);
    return;
  }
  bootArenaNow();
}

function bootArenaNow(): void {
  if (game) return;

  game = buildGame(Phaser.AUTO);

  // refrescar escala cuando el contenedor cambie de tamaño
  const parent = document.getElementById('arena-canvas');
  if (parent) new ResizeObserver(() => game?.scale.refresh()).observe(parent);

  // Watchdog 1: si el evento `ready` del TextureManager se pierde (pestaña en
  // segundo plano), las escenas quedan en cola. Destrabar.
  const watchdog = window.setInterval(() => {
    if (!game || game.isRunning) {
      clearInterval(watchdog);
      return;
    }
    const tm = game.textures as unknown as { _pending: number };
    if (game.isBooted && tm._pending === 0) game.textures.emit('ready');
  }, 300);

  // Watchdog 2: si WebGL falló al bootear (p. ej. "Framebuffer incomplete"
  // en ventanas ocultas o GL por software), reintentar con renderer Canvas.
  window.setTimeout(() => {
    if (!game || game.isRunning || usedCanvasFallback) return;
    usedCanvasFallback = true;
    console.warn('Arena: WebGL no arrancó, reintentando con renderer Canvas...');
    try {
      game.destroy(true);
    } catch {
      // el juego roto puede lanzar al destruirse: limpiar el DOM a mano
      document.getElementById('arena-canvas')?.querySelectorAll('canvas').forEach((c) => c.remove());
    }
    game = buildGame(Phaser.CANVAS);
  }, 1500);
}
