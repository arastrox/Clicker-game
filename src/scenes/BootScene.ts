import Phaser from 'phaser';
import { FRAME_NAMES } from './frameNames';

// Tiles Kenney usados como íconos (se cargan aparte de los frames 0x72)
export const KENNEY_TILES = [89, 102, 103, 104, 105, 113, 114, 115, 116, 117, 118, 119, 129];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const name of FRAME_NAMES) {
      this.load.image(name, `assets/sprites/frames/${name}.png`);
    }
    for (const n of KENNEY_TILES) {
      const id = String(n).padStart(4, '0');
      this.load.image(`kenney_${String(n)}`, `assets/kenney/tile_${id}.png`);
    }
  }

  create(): void {
    // Agrupa frames "<prefijo>_f<N>" y crea una animación por prefijo
    const groups = new Map<string, string[]>();
    for (const name of FRAME_NAMES) {
      const m = /^(.+)_f(\d+)$/.exec(name);
      if (!m) continue;
      if (!groups.has(m[1])) groups.set(m[1], []);
      groups.get(m[1])!.push(name);
    }
    for (const [prefix, frames] of groups) {
      frames.sort();
      const oneShot = ['hit', 'open', 'attack', 'die'].some((k) => prefix.includes(k));
      const frameRate = prefix.includes('attack') ? 16 : prefix.includes('die') ? 10 : frames.length <= 3 ? 5 : 7;
      this.anims.create({
        key: prefix,
        frames: frames.map((f) => ({ key: f })),
        frameRate,
        repeat: oneShot ? 0 : -1,
      });
    }

    // textura de 1 píxel para partículas (canvas 2D: generateTexture usa el
    // renderer WebGL y falla si aún no se renderizó ningún frame)
    const pxCanvas = document.createElement('canvas');
    pxCanvas.width = 4;
    pxCanvas.height = 4;
    const pctx = pxCanvas.getContext('2d')!;
    pctx.fillStyle = '#ffffff';
    pctx.fillRect(0, 0, 4, 4);
    this.textures.addCanvas('px', pxCanvas);

    this.scene.start('Arena');
  }
}
