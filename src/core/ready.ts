// Cola simple: pospone el arranque del juego hasta que la arena Phaser
// haya cargado sus assets (evita perder los eventos iniciales del bus).

import { bus } from './events';

let arenaReady = false;
let pending: (() => void) | null = null;

bus.on('arena:ready', () => {
  arenaReady = true;
  const fn = pending;
  pending = null;
  fn?.();
});

export function whenArenaReady(fn: () => void): void {
  if (arenaReady) fn();
  else pending = fn;
}
