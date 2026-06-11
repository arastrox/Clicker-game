import Phaser from 'phaser';
import { bus } from '@/core/events';
import { hasState, getState } from '@/core/state';
import { ZONES } from '@/data/zones';
import { CLASSES } from '@/data/classes';
import { clickAttack, combatUpdate, getCombatRuntime, isPlayerDead } from '@/systems/combat';
import { sfx } from '@/audio/sfx';
import type { CombatEnemy } from '@/core/types';

const FONT = "'Press Start 2P', monospace";

export class ArenaScene extends Phaser.Scene {
  private hero: Phaser.GameObjects.Sprite | null = null;
  private enemy: Phaser.GameObjects.Sprite | null = null;
  private enemyShadow: Phaser.GameObjects.Ellipse | null = null;
  private heroShadow: Phaser.GameObjects.Ellipse | null = null;
  private bgLayer: Phaser.GameObjects.Container | null = null;
  private setPiece: Phaser.GameObjects.Container | null = null; // fuente, cofre, etc.
  private ambient: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private currentZoneIndex = -1;
  private started = false;
  private heroBobTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super('Arena');
  }

  create(): void {
    this.scale.on('resize', () => this.layout());

    bus.on('game:started', () => {
      this.started = true;
      this.drawZone(getState().run.zoneIndex, true);
      this.spawnHero();
    });
    bus.on('zone:enter', ({ zoneIndex }) => {
      if (!this.started) return;
      this.transitionTo(() => this.drawZone(zoneIndex, false));
    });
    bus.on('combat:spawn', ({ enemy }) => this.showEnemy(enemy));
    bus.on('combat:playerHit', ({ amount, crit, source }) => this.onPlayerHit(amount, crit, source));
    bus.on('combat:enemyAttack', ({ amount, dodged }) => this.onEnemyAttack(amount, dodged));
    bus.on('combat:enemyDefeated', ({ enemy }) => this.killEnemy(enemy.isBoss));
    bus.on('player:death', () => this.onPlayerDeath());
    bus.on('player:heal', ({ amount }) => this.floatText(`+${amount}`, this.heroX(), this.groundY() - 130, '#7CFC8E'));
    bus.on('player:levelUp', () => this.onLevelUp());
    bus.on('arena:rest', () => this.showRestPiece());
    bus.on('arena:event', ({ eventType }) => this.showEventPiece(eventType));
    bus.on('node:advance', () => this.nodeTransition());
    bus.on('skill:cast', () => this.flashHero());

    // click en cualquier parte de la arena ataca
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.started || isPlayerDead()) return;
      const rtEnemy = getCombatRuntime().enemy;
      if (rtEnemy && rtEnemy.hp > 0) {
        clickAttack();
        sfx.click();
        this.clickPulse(p.worldX, p.worldY);
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.started || isPlayerDead()) return;
      const rtEnemy = getCombatRuntime().enemy;
      if (rtEnemy && rtEnemy.hp > 0) {
        clickAttack();
        sfx.click();
        if (this.enemy) this.clickPulse(this.enemy.x, this.enemy.y);
      }
    });

    bus.emit('arena:ready');
  }

  update(_time: number, delta: number): void {
    if (!this.started || !hasState()) return;
    combatUpdate(delta / 1000);
    uiTickCallback?.();
  }

  // ─── Geometría ────────────────────────────────────────────────────────────

  private W(): number { return this.scale.width; }
  private H(): number { return this.scale.height; }
  private groundY(): number { return this.H() * 0.74; }
  private heroX(): number { return this.W() * 0.26; }
  private enemyX(): number { return this.W() * 0.68; }

  private layout(): void {
    if (this.currentZoneIndex >= 0) this.drawZone(this.currentZoneIndex, true);
    if (this.hero) {
      this.hero.setPosition(this.heroX(), this.groundY());
      this.heroShadow?.setPosition(this.heroX(), this.groundY() + 6);
    }
    if (this.enemy) {
      this.enemy.setPosition(this.enemyX(), this.groundY());
      this.enemyShadow?.setPosition(this.enemyX(), this.groundY() + 6);
    }
  }

  // ─── Fondo por zona ───────────────────────────────────────────────────────

  private drawZone(zoneIndex: number, instant: boolean): void {
    this.currentZoneIndex = zoneIndex;
    const zone = ZONES[zoneIndex];
    this.bgLayer?.destroy();
    this.ambient?.destroy();

    const c = this.add.container(0, 0).setDepth(-10);
    this.bgLayer = c;
    const W = this.W();
    const H = this.H();

    // cielo degradado
    const sky = this.add.graphics();
    sky.fillGradientStyle(zone.palette.sky[0], zone.palette.sky[0], zone.palette.sky[1], zone.palette.sky[1], 1);
    sky.fillRect(0, 0, W, H);
    c.add(sky);

    // siluetas de fondo (parallax estático estilizado)
    const fog = this.add.graphics();
    fog.fillStyle(zone.palette.fog, 0.55);
    for (let i = 0; i < 7; i++) {
      const bx = (W / 7) * i + (i % 2) * 30;
      const bh = H * (0.22 + ((i * 37) % 17) / 60);
      if (zoneIndex === 0) fog.fillTriangle(bx, H, bx + 90, H - bh, bx + 180, H); // árboles
      else if (zoneIndex === 2) fog.fillTriangle(bx - 20, H, bx + 70, H - bh * 1.1, bx + 200, H); // picos
      else fog.fillRect(bx, H - bh, 70 + (i % 3) * 28, bh); // columnas/estalagmitas
    }
    c.add(fog);

    // suelo
    const ground = this.add.graphics();
    ground.fillStyle(zone.palette.ground, 1);
    ground.fillRect(0, this.groundY() + 8, W, H - this.groundY());
    ground.lineStyle(3, zone.palette.accent, 0.25);
    ground.lineBetween(0, this.groundY() + 8, W, this.groundY() + 8);
    c.add(ground);

    // baldosas de piso pixel art
    const tileScale = 3;
    const tileW = 16 * tileScale;
    for (let x = 0; x < W + tileW; x += tileW) {
      const tile = this.add.image(x, this.groundY() + 10, zone.floorTiles[(x / tileW | 0) % zone.floorTiles.length]);
      tile.setOrigin(0, 0).setScale(tileScale).setAlpha(0.5);
      c.add(tile);
    }

    // partículas ambientales (esporas, cristales, ascuas, magia)
    this.ambient = this.add.particles(0, 0, 'px', {
      x: { min: 0, max: W },
      y: { min: 0, max: H * 0.7 },
      lifespan: 6000,
      speedY: zoneIndex === 2 ? { min: -30, max: -12 } : { min: 6, max: 18 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.5, end: 0 },
      quantity: 1,
      frequency: 320,
      tint: zone.palette.accent,
    }).setDepth(-5);

    if (!instant) this.cameras.main.fadeIn(450, 0, 0, 0);
  }

  // ─── Héroe ────────────────────────────────────────────────────────────────

  private spawnHero(): void {
    this.hero?.destroy();
    this.heroShadow?.destroy();
    const cls = CLASSES[getState().player.classId];
    this.heroShadow = this.add.ellipse(this.heroX(), this.groundY() + 6, 70, 16, 0x000000, 0.35);
    this.hero = this.add.sprite(this.heroX(), this.groundY(), `${cls.spriteKey}_idle_anim_f0`);
    this.hero.setOrigin(0.5, 1).setScale(4.5);
    this.hero.play(`${cls.spriteKey}_idle_anim`);
  }

  private flashHero(): void {
    if (!this.hero) return;
    this.hero.setTintFill(0xaaddff);
    this.time.delayedCall(110, () => this.hero?.clearTint());
    sfx.skill();
  }

  private onLevelUp(): void {
    sfx.levelUp();
    if (!this.hero) return;
    this.floatText('¡NIVEL +!', this.heroX(), this.groundY() - 160, '#FFD54F', 18);
    this.add.particles(this.heroX(), this.groundY() - 60, 'px', {
      speed: { min: 60, max: 160 },
      lifespan: 700,
      scale: { start: 1.2, end: 0 },
      quantity: 24,
      tint: [0xffd54f, 0xfff59d, 0xffffff],
      emitting: false,
    }).explode(24);
  }

  private onPlayerDeath(): void {
    sfx.death();
    this.cameras.main.shake(300, 0.01);
    if (this.hero) {
      this.hero.setTint(0x555566);
      this.tweens.add({ targets: this.hero, angle: -90, y: this.groundY() + 4, duration: 600, ease: 'Quad.easeIn' });
    }
    bus.emit('game:over');
  }

  // ─── Enemigo ─────────────────────────────────────────────────────────────

  private animKeyFor(spriteKey: string, kind: 'idle' | 'run'): string {
    const idle = `${spriteKey}_idle_anim`;
    if (this.anims.exists(idle)) return kind === 'run' && this.anims.exists(`${spriteKey}_run_anim`) ? `${spriteKey}_run_anim` : idle;
    return `${spriteKey}_anim`; // criaturas con una sola animación
  }

  private showEnemy(enemy: CombatEnemy): void {
    this.enemy?.destroy();
    this.enemyShadow?.destroy();
    this.setPiece?.destroy();
    this.setPiece = null;

    const key = this.animKeyFor(enemy.def.spriteKey, 'idle');
    this.enemyShadow = this.add.ellipse(this.enemyX(), this.groundY() + 6, 80 * (enemy.def.scale / 4), 18, 0x000000, 0.35);
    this.enemy = this.add.sprite(this.enemyX() + 120, this.groundY(), `${enemy.def.spriteKey}_idle_anim_f0`);
    this.enemy.setOrigin(0.5, 1).setScale(enemy.def.scale).setFlipX(true).setAlpha(0);
    if (enemy.def.tint) this.enemy.setTint(enemy.def.tint);
    if (this.anims.exists(key)) this.enemy.play(key);

    // entrada: aparece desde la derecha
    this.tweens.add({
      targets: this.enemy,
      x: this.enemyX(),
      alpha: 1,
      duration: 420,
      ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: this.enemyShadow, alpha: { from: 0, to: 0.35 }, duration: 400 });

    if (enemy.isBoss) {
      this.cameras.main.shake(450, 0.012);
      this.floatText(`👑 ${enemy.name}`, this.enemyX(), this.groundY() - 220, '#FF6E6E', 16);
    } else if (enemy.isElite) {
      this.floatText('⭐ ÉLITE', this.enemyX(), this.groundY() - 190, '#FFD54F', 14);
    }
  }

  private onPlayerHit(amount: number, crit: boolean, source: string): void {
    if (!this.enemy) return;
    if (crit) sfx.crit();

    // sacudida del sprite + flash
    this.enemy.setTintFill(crit ? 0xfff3b0 : 0xffffff);
    const e = this.enemy;
    const enemyDef = getCombatRuntime().enemy?.def;
    this.time.delayedCall(70, () => {
      if (e.active) {
        e.clearTint();
        if (enemyDef?.tint) e.setTint(enemyDef.tint);
      }
    });
    this.tweens.add({ targets: e, x: this.enemyX() + (crit ? 16 : 8), duration: 50, yoyo: true });

    const ox = this.enemyX() + Phaser.Math.Between(-30, 30);
    const oy = this.groundY() - 80 * (e.scaleY / 4) - Phaser.Math.Between(0, 50);
    if (source === 'dps') {
      this.floatText(String(amount), ox, oy, '#9ecbff', 10);
    } else if (crit) {
      this.floatText(`¡${amount}!`, ox, oy, '#FFD54F', 18);
      this.cameras.main.shake(90, 0.004);
    } else {
      this.floatText(String(amount), ox, oy, source === 'skill' ? '#c792ff' : '#ffffff', 13);
    }
  }

  private onEnemyAttack(amount: number, dodged: boolean): void {
    if (!this.enemy || !this.hero) return;
    // embestida del enemigo
    this.tweens.add({ targets: this.enemy, x: this.enemyX() - 60, duration: 110, yoyo: true, ease: 'Quad.easeOut' });

    if (dodged) {
      sfx.dodge();
      this.floatText('¡Esquivado!', this.heroX(), this.groundY() - 140, '#80DEEA', 12);
      this.tweens.add({ targets: this.hero, x: this.heroX() - 40, alpha: 0.4, duration: 100, yoyo: true });
      return;
    }
    if (amount <= 0) {
      this.floatText('Bloqueado', this.heroX(), this.groundY() - 140, '#90CAF9', 12);
      return;
    }
    sfx.enemyHit();
    this.cameras.main.shake(140, 0.006);
    this.hero.setTintFill(0xff8888);
    this.time.delayedCall(90, () => this.hero?.clearTint());
    this.floatText(`-${amount}`, this.heroX(), this.groundY() - 140, '#FF6E6E', 14);
  }

  private killEnemy(wasBoss: boolean): void {
    const e = this.enemy;
    const sh = this.enemyShadow;
    this.enemy = null;
    this.enemyShadow = null;
    if (!e) return;

    if (wasBoss) sfx.bossDefeat();

    // explosión de monedas/partículas y desvanecimiento
    this.add.particles(e.x, e.y - 40, 'px', {
      speed: { min: 80, max: 220 },
      lifespan: 600,
      scale: { start: 1.4, end: 0 },
      gravityY: 300,
      quantity: 18,
      tint: [0xffd54f, 0xffffff, 0xff8a65],
      emitting: false,
    }).explode(18);

    this.tweens.add({
      targets: e,
      alpha: 0,
      scaleY: e.scaleY * 0.2,
      y: this.groundY() + 8,
      duration: 380,
      ease: 'Quad.easeIn',
      onComplete: () => e.destroy(),
    });
    if (sh) this.tweens.add({ targets: sh, alpha: 0, duration: 300, onComplete: () => sh.destroy() });
  }

  // ─── Piezas de escenario (descanso / eventos) ────────────────────────────

  private clearSetPiece(): void {
    this.setPiece?.destroy();
    this.setPiece = null;
  }

  private showRestPiece(): void {
    this.enemy?.destroy(); this.enemy = null;
    this.enemyShadow?.destroy(); this.enemyShadow = null;
    this.clearSetPiece();
    const c = this.add.container(this.enemyX(), this.groundY());
    const top = this.add.sprite(0, -16 * 4, 'wall_fountain_mid_blue_anim_f0').setOrigin(0.5, 1).setScale(4);
    const basin = this.add.sprite(0, 0, 'wall_fountain_basin_blue_anim_f0').setOrigin(0.5, 1).setScale(4);
    if (this.anims.exists('wall_fountain_mid_blue_anim')) top.play('wall_fountain_mid_blue_anim');
    if (this.anims.exists('wall_fountain_basin_blue_anim')) basin.play('wall_fountain_basin_blue_anim');
    c.add([top, basin]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 400 });
    this.setPiece = c;
  }

  private showEventPiece(eventType: string): void {
    this.enemy?.destroy(); this.enemy = null;
    this.enemyShadow?.destroy(); this.enemyShadow = null;
    this.clearSetPiece();
    const c = this.add.container(this.enemyX(), this.groundY());

    if (eventType === 'mimic') {
      const chest = this.add.sprite(0, 0, 'chest_mimic_open_anim_f0').setOrigin(0.5, 1).setScale(5);
      c.add(chest);
      this.tweens.add({ targets: chest, y: -4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (eventType === 'merchant') {
      const doc = this.add.sprite(0, 0, 'doc_idle_anim_f0').setOrigin(0.5, 1).setScale(4);
      if (this.anims.exists('doc_idle_anim')) doc.play('doc_idle_anim');
      const crate = this.add.image(70, 0, 'crate').setOrigin(0.5, 1).setScale(4);
      c.add([doc, crate]);
      sfx.merchant();
    } else if (eventType === 'spring') {
      const top = this.add.sprite(0, -16 * 4, 'wall_fountain_mid_blue_anim_f0').setOrigin(0.5, 1).setScale(4);
      const basin = this.add.sprite(0, 0, 'wall_fountain_basin_blue_anim_f0').setOrigin(0.5, 1).setScale(4);
      if (this.anims.exists('wall_fountain_mid_blue_anim')) top.play('wall_fountain_mid_blue_anim');
      if (this.anims.exists('wall_fountain_basin_blue_anim')) basin.play('wall_fountain_basin_blue_anim');
      c.add([top, basin]);
    } else if (eventType === 'trap') {
      const spikes = this.add.sprite(0, 0, 'floor_spikes_anim_f0').setOrigin(0.5, 1).setScale(5);
      if (this.anims.exists('floor_spikes_anim')) spikes.play('floor_spikes_anim');
      c.add(spikes);
      sfx.trap();
    } else {
      // altar, moral, blessing: tótem genérico con aura
      const column = this.add.image(0, 0, 'column_wall').setOrigin(0.5, 1).setScale(4);
      c.add(column);
      this.add.particles(this.enemyX(), this.groundY() - 70, 'px', {
        speed: { min: 8, max: 30 },
        lifespan: 1400,
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        quantity: 1,
        frequency: 160,
        tint: eventType === 'moral' ? 0x80deea : 0xffd54f,
      }).setDepth(1);
    }

    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 400 });
    this.setPiece = c;
  }

  // ─── Transiciones y efectos ──────────────────────────────────────────────

  private nodeTransition(): void {
    sfx.advance();
    this.clearSetPiece();
    if (!this.hero) return;
    const cls = CLASSES[getState().player.classId];
    const runKey = `${cls.spriteKey}_run_anim`;
    if (this.anims.exists(runKey)) this.hero.play(runKey);
    this.heroBobTween?.stop();
    this.heroBobTween = this.tweens.add({
      targets: this.hero,
      x: { from: this.heroX() - 50, to: this.heroX() },
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => {
        const idle = `${cls.spriteKey}_idle_anim`;
        if (this.hero && this.anims.exists(idle)) this.hero.play(idle);
      },
    });
    // parpadeo suave del fondo para sensación de avance
    this.cameras.main.flash(220, 8, 8, 16);
  }

  private transitionTo(fn: () => void): void {
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      fn();
      this.cameras.main.fadeIn(450, 0, 0, 0);
    });
  }

  private clickPulse(x: number, y: number): void {
    const ring = this.add.circle(x, y, 6, 0xffffff, 0);
    ring.setStrokeStyle(2, 0xffffff, 0.8);
    this.tweens.add({
      targets: ring,
      radius: 22,
      alpha: 0,
      duration: 250,
      onComplete: () => ring.destroy(),
    });
  }

  private floatText(text: string, x: number, y: number, color: string, size = 13): void {
    const t = this.add.text(x, y, text, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      color,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: t,
      y: y - 56,
      alpha: { from: 1, to: 0 },
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}

// callback que la UI DOM registra para refrescar barras por frame
let uiTickCallback: (() => void) | null = null;
export function setUiTick(fn: () => void): void {
  uiTickCallback = fn;
}
