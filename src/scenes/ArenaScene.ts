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
  private bgLayer: Phaser.GameObjects.Container | null = null;   // cielo + lejano
  private midLayer: Phaser.GameObjects.Container | null = null;  // props medios
  private decorLayer: Phaser.GameObjects.Container | null = null; // props a nivel de suelo
  private floorLayer: Phaser.GameObjects.Container | null = null; // baldosas (scroll envolvente)
  private fgLayer: Phaser.GameObjects.Container | null = null;   // viñeta frontal
  private decorProps: Phaser.GameObjects.Image[] = [];
  private setPiece: Phaser.GameObjects.Container | null = null; // fuente, cofre, etc.
  private ambient: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private currentZoneIndex = -1;
  private started = false;
  private heroBobTween: Phaser.Tweens.Tween | null = null;
  private heroAttacking = false;

  constructor() {
    super('Arena');
  }

  create(): void {
    try {
      this.createInner();
    } catch (err) {
      console.error('ArenaScene.create error:', err);
      throw err;
    }
  }

  private createInner(): void {
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
    bus.on('skill:cast', ({ skillId }) => this.skillFx(skillId));

    // click en cualquier parte de la arena ataca
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.started || isPlayerDead()) return;
      const rtEnemy = getCombatRuntime().enemy;
      if (rtEnemy && rtEnemy.hp > 0) {
        clickAttack();
        sfx.click();
        this.clickPulse(p.worldX, p.worldY);
        this.heroAttackAnim();
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.started || isPlayerDead()) return;
      const rtEnemy = getCombatRuntime().enemy;
      if (rtEnemy && rtEnemy.hp > 0) {
        clickAttack();
        sfx.click();
        if (this.enemy) this.clickPulse(this.enemy.x, this.enemy.y - 40);
        this.heroAttackAnim();
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
  private groundY(): number { return this.H() * 0.72; }
  private heroX(): number { return this.W() * 0.26; }
  private enemyX(): number { return this.W() * 0.68; }
  // profundidad: la heroína está más cerca (más abajo), el enemigo más lejos
  private heroY(): number { return this.groundY() + 26; }
  private enemyY(): number { return this.groundY() + 4; }

  private layout(): void {
    if (this.currentZoneIndex >= 0) this.drawZone(this.currentZoneIndex, true);
    if (this.hero) {
      this.hero.setPosition(this.heroX(), this.heroY());
      this.heroShadow?.setPosition(this.heroX(), this.heroY() + 5);
    }
    if (this.enemy) {
      this.enemy.setPosition(this.enemyX(), this.enemyY());
      this.enemyShadow?.setPosition(this.enemyX(), this.enemyY() + 5);
    }
  }

  // ─── Fondo por zona ───────────────────────────────────────────────────────

  private drawZone(zoneIndex: number, instant: boolean): void {
    this.currentZoneIndex = zoneIndex;
    const zone = ZONES[zoneIndex];
    this.bgLayer?.destroy();
    this.midLayer?.destroy();
    this.decorLayer?.destroy();
    this.floorLayer?.destroy();
    this.fgLayer?.destroy();
    this.ambient?.destroy();
    this.decorProps = [];

    const W = this.W();
    const H = this.H();
    const gy = this.groundY();

    // ── capa lejana: cielo + elemento celeste + siluetas ──
    const bg = this.add.container(0, 0).setDepth(-12);
    this.bgLayer = bg;

    const sky = this.add.graphics();
    sky.fillGradientStyle(zone.palette.sky[0], zone.palette.sky[0], zone.palette.sky[1], zone.palette.sky[1], 1);
    sky.fillRect(0, 0, W, H);
    bg.add(sky);

    // elemento celeste por zona
    if (zoneIndex === 0 || zoneIndex === 3) {
      // luna con halo (la Gran Gata vigila)
      const halo = this.add.circle(W * 0.8, H * 0.18, 46, 0xfff4d6, 0.08);
      const moon = this.add.circle(W * 0.8, H * 0.18, 26, 0xfff4d6, 0.85);
      const crater = this.add.circle(W * 0.8 - 8, H * 0.18 - 5, 6, zone.palette.sky[1], 0.5);
      bg.add([halo, moon, crater]);
    }
    if (zoneIndex === 3 || zoneIndex === 4) {
      // estrellas
      const stars = this.add.graphics();
      for (let i = 0; i < 26; i++) {
        const sxr = (i * 131) % W;
        const syr = ((i * 73) % Math.floor(H * 0.45));
        stars.fillStyle(0xffffff, 0.25 + ((i * 7) % 10) / 22);
        stars.fillRect(sxr, syr, 2, 2);
      }
      bg.add(stars);
    }
    if (zoneIndex === 2) {
      // resplandor de lava en el horizonte
      const glow = this.add.graphics();
      glow.fillGradientStyle(0xff5722, 0xff5722, 0xff5722, 0xff5722, 0, 0, 0.35, 0.35);
      glow.fillRect(0, gy - 60, W, 68);
      bg.add(glow);
    }

    // siluetas lejanas en dos planos (parallax al avanzar)
    const farA = this.add.graphics();
    farA.fillStyle(zone.palette.fog, 0.4);
    const farB = this.add.graphics();
    farB.fillStyle(zone.palette.fog, 0.66);
    for (let i = -1; i < 9; i++) {
      const bx = (W / 7) * i + (i % 2) * 30;
      const bh = H * (0.2 + ((i * 37 + 700) % 17) / 60);
      const bh2 = H * (0.3 + ((i * 53 + 700) % 13) / 50);
      if (zoneIndex === 0) {
        farA.fillTriangle(bx, gy + 10, bx + 70, gy + 10 - bh, bx + 140, gy + 10);
        farB.fillTriangle(bx + 50, gy + 12, bx + 110, gy + 12 - bh2 * 0.8, bx + 170, gy + 12);
      } else if (zoneIndex === 1) {
        // cristales gigantes
        farA.fillTriangle(bx, gy + 10, bx + 34, gy + 10 - bh, bx + 68, gy + 10);
        farB.fillTriangle(bx + 60, gy + 12, bx + 82, gy + 12 - bh2 * 0.7, bx + 104, gy + 12);
      } else if (zoneIndex === 2) {
        farA.fillTriangle(bx - 20, gy + 10, bx + 60, gy + 10 - bh * 1.1, bx + 180, gy + 10);
        farB.fillTriangle(bx + 40, gy + 12, bx + 120, gy + 12 - bh2 * 0.7, bx + 220, gy + 12);
      } else {
        farA.fillRect(bx, gy + 10 - bh, 56 + (i % 3) * 24, bh);
        farB.fillRect(bx + 70, gy + 12 - bh2 * 0.75, 40 + (i % 2) * 30, bh2 * 0.75);
      }
    }
    // brillos en los cristales de la cueva
    if (zoneIndex === 1) {
      for (let i = 0; i < 8; i++) {
        farB.fillStyle(zone.palette.accent, 0.5);
        farB.fillRect(((i * 167) % W), gy - 40 - ((i * 91) % Math.floor(H * 0.3)), 3, 3);
      }
    }
    bg.add([farA, farB]);

    // ── suelo con perspectiva: baldosas en cuadrícula (contenedor con scroll
    // envolvente: el patrón se repite cada 3 baldosas, 144px en pantalla) ──
    const floorH = H - gy;
    const tilePx = 48; // 16px × escala 3
    const floor = this.add.container(0, 0).setDepth(-9);
    this.floorLayer = floor;
    const cols = Math.ceil(W / tilePx) + 4; // margen para el scroll
    const rows = Math.ceil(floorH / tilePx) + 1;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const key = zone.floorTiles[(col + r) % zone.floorTiles.length];
        const tile = this.add.image(col * tilePx, gy + r * tilePx, key).setOrigin(0, 0).setScale(3);
        floor.add(tile);
      }
    }

    const floorShade = this.add.graphics().setDepth(-8);
    // más oscuro al fondo (lejos), más claro al frente (cerca)
    floorShade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.5, 0.5, 0.05, 0.05);
    floorShade.fillRect(0, gy, W, floorH);
    floorShade.lineStyle(3, zone.palette.accent, 0.35);
    floorShade.lineBetween(0, gy, W, gy);

    // ── props medios (detrás del combate) ──
    const mid = this.add.container(0, 0).setDepth(-7);
    this.midLayer = mid;
    const midDefs: { key: string; scale: number; tint: number }[] = [
      { key: 'column_wall', scale: 3.2, tint: 0x777799 },
      { key: zoneIndex === 3 ? 'wall_banner_red' : 'wall_banner_blue', scale: 3.2, tint: 0xbbbbdd },
      { key: 'column_wall', scale: 3.2, tint: 0x777799 },
    ];
    if (zoneIndex !== 0) {
      midDefs.forEach((d, i) => {
        const px = W * (0.16 + i * 0.3) + ((i * 53) % 40);
        const img = this.add.image(px, gy + 2, d.key).setOrigin(0.5, 1).setScale(d.scale).setTint(d.tint).setAlpha(0.85);
        mid.add(img);
      });
    }

    // ── decoración a nivel de suelo (se recicla al avanzar) ──
    const decor = this.add.container(0, 0).setDepth(-6);
    this.decorLayer = decor;
    const decorPool = this.decorPoolFor(zoneIndex);
    for (let i = 0; i < 5; i++) {
      const key = decorPool[i % decorPool.length];
      const dx = (W / 5) * i + ((i * 97) % 60) + 30;
      const dy = gy + 14 + ((i * 31) % Math.max(10, floorH - 40));
      const img = this.add.image(dx, dy, key).setOrigin(0.5, 1).setScale(2.6).setTint(0xccccdd).setAlpha(0.9);
      decor.add(img);
      this.decorProps.push(img);
    }

    // ── viñeta frontal (profundidad) ──
    const fg = this.add.container(0, 0).setDepth(35);
    this.fgLayer = fg;
    const vig = this.add.graphics();
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.4, 0.4);
    vig.fillRect(0, H - 64, W, 64);
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.32, 0, 0, 0);
    vig.fillRect(0, 0, W, 46);
    fg.add(vig);

    // partículas ambientales (esporas, cristales, ascuas, magia)
    this.ambient = this.add.particles(0, 0, 'px', {
      x: { min: 0, max: W },
      y: { min: 0, max: H * 0.7 },
      lifespan: 6000,
      speedY: zoneIndex === 2 ? { min: -30, max: -12 } : { min: 6, max: 18 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.5, end: 0 },
      quantity: 1,
      frequency: 300,
      tint: zone.palette.accent,
    }).setDepth(-5);

    if (!instant) this.cameras.main.fadeIn(450, 0, 0, 0);
  }

  private decorPoolFor(zoneIndex: number): string[] {
    switch (zoneIndex) {
      case 0: return ['crate', 'skull', 'crate'];
      case 1: return ['skull', 'crate', 'skull'];
      case 2: return ['skull', 'skull', 'crate'];
      case 3: return ['crate', 'skull', 'hole'];
      default: return ['skull', 'hole', 'skull'];
    }
  }

  // desplazamiento parallax al avanzar: el mundo "camina" hacia atrás
  private parallaxStep(): void {
    const W = this.W();
    if (this.floorLayer) {
      // se desplaza exactamente un período del patrón y se reinicia: scroll continuo
      const floor = this.floorLayer;
      this.tweens.add({
        targets: floor,
        x: floor.x - 144,
        duration: 650,
        ease: 'Quad.easeOut',
        onComplete: () => { floor.x = 0; },
      });
    }
    if (this.bgLayer) this.tweens.add({ targets: this.bgLayer, x: this.bgLayer.x - 18, duration: 650, ease: 'Quad.easeOut' });
    if (this.midLayer) this.tweens.add({ targets: this.midLayer, x: this.midLayer.x - 64, duration: 650, ease: 'Quad.easeOut' });
    if (this.decorLayer) {
      const decor = this.decorLayer;
      this.tweens.add({
        targets: decor, x: decor.x - 150, duration: 650, ease: 'Quad.easeOut',
        onComplete: () => {
          // reciclar props que salieron por la izquierda
          for (const img of this.decorProps) {
            if (img.x + decor.x < -50) {
              img.x = W - decor.x + 60 + Math.random() * 80;
              const pool = this.decorPoolFor(this.currentZoneIndex);
              img.setTexture(pool[Math.floor(Math.random() * pool.length)]);
              img.y = this.groundY() + 14 + Math.random() * Math.max(10, this.H() - this.groundY() - 44);
            }
          }
        },
      });
    }
    // los planos lejanos se reinician si se alejan demasiado (invisible al jugador)
    if (this.bgLayer && this.bgLayer.x < -W) this.bgLayer.x = 0;
    if (this.midLayer && this.midLayer.x < -W) this.midLayer.x = 0;
  }

  // ─── Heroína ──────────────────────────────────────────────────────────────

  private heroTint(): number {
    return CLASSES[getState().player.classId].tint ?? 0xffffff;
  }

  private spawnHero(): void {
    this.hero?.destroy();
    this.heroShadow?.destroy();
    const cls = CLASSES[getState().player.classId];
    this.heroShadow = this.add.ellipse(this.heroX(), this.heroY() + 5, 80, 16, 0x000000, 0.4).setDepth(1);
    this.hero = this.add.sprite(this.heroX(), this.heroY(), `${cls.spriteKey}_idle_anim_f0`);
    this.hero.setOrigin(0.5, 1).setScale(cls.heroScale).setDepth(2);
    this.hero.setFlipX(cls.faceLeft === true);
    if (cls.tint) this.hero.setTint(cls.tint);
    this.hero.play(`${cls.spriteKey}_idle_anim`);
    this.heroAttacking = false;
  }

  private heroIdle(): void {
    const cls = CLASSES[getState().player.classId];
    const idle = `${cls.spriteKey}_idle_anim`;
    if (this.hero && this.anims.exists(idle)) this.hero.play(idle);
  }

  // Animación de zarpazo al atacar (vuelve a idle al terminar).
  // Las gatas sin anim de ataque hacen una embestida rápida.
  private heroAttackAnim(): void {
    if (!this.hero || this.heroAttacking) return;
    const cls = CLASSES[getState().player.classId];
    const atk = `${cls.spriteKey}_attack_anim`;
    if (!this.anims.exists(atk)) {
      this.heroAttacking = true;
      this.tweens.add({
        targets: this.hero,
        x: this.heroX() + 34,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => { this.heroAttacking = false; },
      });
      return;
    }
    this.heroAttacking = true;
    this.hero.play(atk);
    this.hero.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.heroAttacking = false;
      if (!isPlayerDead()) this.heroIdle();
    });
  }

  private onLevelUp(): void {
    sfx.levelUp();
    if (!this.hero) return;
    this.floatText('¡NIVEL +!', this.heroX(), this.groundY() - 160, '#FFD54F', 18);
    this.burst(this.heroX(), this.groundY() - 60, [0xffd54f, 0xfff59d, 0xffffff], 24, 160);
  }

  private onPlayerDeath(): void {
    sfx.death();
    this.cameras.main.shake(300, 0.01);
    if (this.hero) {
      const cls = CLASSES[getState().player.classId];
      const die = `${cls.spriteKey}_die_anim`;
      this.hero.setTint(0x9999aa);
      if (this.anims.exists(die)) {
        this.hero.play(die);
      } else {
        this.tweens.add({ targets: this.hero, angle: -90, y: this.heroY() + 2, duration: 600, ease: 'Quad.easeIn' });
      }
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
    const shadowW = enemy.def.spriteKey === 'cat' ? 60 * (enemy.def.scale / 2.5) : 80 * (enemy.def.scale / 4);
    // el enemigo está "más lejos": algo más arriba, algo más pequeño y con sombra suave
    const depthScale = 0.93;
    this.enemyShadow = this.add.ellipse(this.enemyX(), this.enemyY() + 5, shadowW * depthScale, 16, 0x000000, 0.3).setDepth(1);
    this.enemy = this.add.sprite(this.enemyX() + 120, this.enemyY(), `${enemy.def.spriteKey}_idle_anim_f0`);
    this.enemy.setOrigin(0.5, 1).setScale(enemy.def.scale * depthScale).setFlipX(true).setAlpha(0).setDepth(2);
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
    const oy = this.enemyY() - 80 * (e.scaleY / 4) - Phaser.Math.Between(0, 50);
    if (source === 'dps') {
      this.floatText(String(amount), ox, oy, '#9ecbff', 10);
    } else if (crit) {
      this.floatText(`¡${amount}!`, ox, oy, '#FFD54F', 18);
      this.cameras.main.shake(90, 0.004);
    } else {
      this.floatText(String(amount), ox, oy, source === 'skill' ? '#ff9ee0' : '#ffffff', 13);
    }
  }

  private onEnemyAttack(amount: number, dodged: boolean): void {
    if (!this.enemy || !this.hero) return;
    // embestida del enemigo
    this.tweens.add({ targets: this.enemy, x: this.enemyX() - 60, duration: 110, yoyo: true, ease: 'Quad.easeOut' });

    if (dodged) {
      sfx.dodge();
      this.floatText('¡Esquivado!', this.heroX(), this.groundY() - 140, '#80DEEA', 12);
      this.afterimages(2);
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
    this.time.delayedCall(90, () => {
      if (this.hero && !isPlayerDead()) {
        this.hero.clearTint();
        this.hero.setTint(this.heroTint());
      }
    });
    this.floatText(`-${amount}`, this.heroX(), this.groundY() - 140, '#FF6E6E', 14);
  }

  private killEnemy(wasBoss: boolean): void {
    const e = this.enemy;
    const sh = this.enemyShadow;
    this.enemy = null;
    this.enemyShadow = null;
    if (!e) return;

    if (wasBoss) sfx.bossDefeat();

    this.burst(e.x, e.y - 40, [0xffd54f, 0xffffff, 0xff8a65], 18, 220, 300);

    this.tweens.add({
      targets: e,
      alpha: 0,
      scaleY: e.scaleY * 0.2,
      y: this.enemyY() + 6,
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

  private clearEnemySprites(): void {
    this.enemy?.destroy(); this.enemy = null;
    this.enemyShadow?.destroy(); this.enemyShadow = null;
  }

  private fountainPiece(c: Phaser.GameObjects.Container): void {
    const top = this.add.sprite(0, -16 * 4, 'wall_fountain_mid_blue_anim_f0').setOrigin(0.5, 1).setScale(4);
    const basin = this.add.sprite(0, 0, 'wall_fountain_basin_blue_anim_f0').setOrigin(0.5, 1).setScale(4);
    if (this.anims.exists('wall_fountain_mid_blue_anim')) top.play('wall_fountain_mid_blue_anim');
    if (this.anims.exists('wall_fountain_basin_blue_anim')) basin.play('wall_fountain_basin_blue_anim');
    c.add([top, basin]);
  }

  private catPiece(c: Phaser.GameObjects.Container, tint: number, scale: number): void {
    const cat = this.add.sprite(0, 4, 'cat_idle_anim_f0').setOrigin(0.5, 1).setScale(scale).setFlipX(true).setTint(tint);
    if (this.anims.exists('cat_idle_anim')) cat.play('cat_idle_anim');
    c.add(cat);
  }

  private showRestPiece(): void {
    this.clearEnemySprites();
    this.clearSetPiece();
    const c = this.add.container(this.enemyX(), this.enemyY()).setDepth(2);
    this.fountainPiece(c);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 400 });
    this.setPiece = c;
  }

  private showEventPiece(eventType: string): void {
    this.clearEnemySprites();
    this.clearSetPiece();
    const c = this.add.container(this.enemyX(), this.enemyY()).setDepth(2);

    switch (eventType) {
      case 'mimic': {
        const chest = this.add.sprite(0, 0, 'chest_mimic_open_anim_f0').setOrigin(0.5, 1).setScale(5);
        c.add(chest);
        this.tweens.add({ targets: chest, y: -4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'merchant': {
        const doc = this.add.sprite(0, 0, 'doc_idle_anim_f0').setOrigin(0.5, 1).setScale(4);
        if (this.anims.exists('doc_idle_anim')) doc.play('doc_idle_anim');
        const crate = this.add.image(70, 0, 'crate').setOrigin(0.5, 1).setScale(4);
        c.add([doc, crate]);
        sfx.merchant();
        break;
      }
      case 'spring':
        this.fountainPiece(c);
        break;
      case 'trap':
      case 'ambush': {
        const spikes = this.add.sprite(0, 0, 'floor_spikes_anim_f0').setOrigin(0.5, 1).setScale(5);
        if (this.anims.exists('floor_spikes_anim')) spikes.play('floor_spikes_anim');
        c.add(spikes);
        sfx.trap();
        break;
      }
      case 'stranger':
        this.catPiece(c, 0x444455, 2.5);
        break;
      case 'kitten':
        this.catPiece(c, 0xffcc99, 1.5);
        break;
      case 'rival':
        this.catPiece(c, 0xcc7744, 3);
        break;
      case 'curse': {
        const bruja = this.add.sprite(0, 0, 'necromancer_anim_f0').setOrigin(0.5, 1).setScale(4).setFlipX(true);
        if (this.anims.exists('necromancer_anim')) bruja.play('necromancer_anim');
        c.add(bruja);
        break;
      }
      case 'shrine': {
        const column = this.add.image(0, 0, 'column_wall').setOrigin(0.5, 1).setScale(4);
        c.add(column);
        this.add.particles(this.enemyX(), this.groundY() - 70, 'px', {
          speed: { min: 4, max: 16 }, lifespan: 1600, scale: { start: 0.7, end: 0 },
          alpha: { start: 0.8, end: 0 }, quantity: 1, frequency: 200, tint: 0xffaa66,
        }).setDepth(1);
        break;
      }
      default: {
        // altar, moral, blessing: tótem genérico con aura
        const column = this.add.image(0, 0, 'column_wall').setOrigin(0.5, 1).setScale(4);
        c.add(column);
        this.add.particles(this.enemyX(), this.groundY() - 70, 'px', {
          speed: { min: 8, max: 30 }, lifespan: 1400, scale: { start: 0.8, end: 0 },
          alpha: { start: 0.8, end: 0 }, quantity: 1, frequency: 160,
          tint: eventType === 'moral' ? 0x80deea : 0xffd54f,
        }).setDepth(1);
      }
    }

    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 400 });
    this.setPiece = c;
  }

  // ─── FX de habilidades ────────────────────────────────────────────────────

  private skillFx(skillId: string): void {
    if (!this.hero) return;
    const hx = this.heroX();
    const hy = this.heroY() - 55;
    const ex = this.enemyX();
    const ey = this.enemyY() - 65;
    sfx.skill();
    this.heroAttackAnim();

    switch (skillId) {
      case 'shield_bash':
        this.ring(ex, ey, 0xffffff, 60, 300);
        this.slash(ex, ey, 0xffeeaa, -0.5);
        this.cameras.main.shake(120, 0.007);
        this.floatText('💫', ex, ey - 60, '#fff3b0', 22);
        break;

      case 'battle_cry':
        this.ring(hx, hy, 0xff6b81, 90, 450);
        this.ring(hx, hy, 0xffd54f, 60, 350);
        this.tintHero(0xffaaaa, 500);
        break;

      case 'indomable':
        this.burst(hx, hy, [0x7cfc8e, 0xd0ffd8], 20, 90, 100);
        break;

      case 'last_bastion': {
        this.ring(hx, hy, 0xffd54f, 110, 600);
        this.tintHero(0xffe082, 5500);
        const dome = this.add.circle(hx, hy, 70, 0xffd54f, 0.12).setStrokeStyle(2, 0xffd54f, 0.8);
        this.tweens.add({ targets: dome, alpha: 0, duration: 5800, onComplete: () => dome.destroy() });
        sfx.ultimate();
        break;
      }

      case 'fireball': {
        const ball = this.add.circle(hx + 20, hy, 8, 0xff7043).setDepth(20);
        const trail = this.add.particles(0, 0, 'px', {
          lifespan: 350, speed: { min: 10, max: 40 }, scale: { start: 1.1, end: 0 },
          tint: [0xff7043, 0xffca28], quantity: 2, frequency: 16, follow: ball,
        }).setDepth(19);
        this.tweens.add({
          targets: ball, x: ex, y: ey, duration: 320, ease: 'Quad.easeIn',
          onComplete: () => {
            this.burst(ex, ey, [0xff7043, 0xffca28, 0xffffff], 26, 200, 380);
            this.cameras.main.shake(110, 0.006);
            ball.destroy();
            this.time.delayedCall(350, () => trail.destroy());
          },
        });
        break;
      }

      case 'ice_barrier': {
        const bubble = this.add.circle(hx, hy, 64, 0x81d4fa, 0.16).setStrokeStyle(2, 0xb3e5fc, 0.9).setDepth(15);
        this.tweens.add({ targets: bubble, scale: { from: 0.4, to: 1 }, duration: 250, ease: 'Back.easeOut' });
        this.tweens.add({ targets: bubble, alpha: 0, delay: 3800, duration: 600, onComplete: () => bubble.destroy() });
        this.burst(hx, hy, [0xb3e5fc, 0xffffff], 14, 80, 70);
        break;
      }

      case 'time_warp':
        this.cameras.main.flash(300, 120, 80, 220);
        this.afterimages(4);
        this.ring(hx, hy, 0xb388ff, 120, 700);
        break;

      case 'meteor_storm': {
        sfx.ultimate();
        for (let i = 0; i < 7; i++) {
          this.time.delayedCall(i * 160, () => {
            const mx = ex + Phaser.Math.Between(-70, 70);
            const meteor = this.add.rectangle(mx + 60, -20, 10, 18, 0xff7043).setAngle(25).setDepth(25);
            const trail = this.add.particles(0, 0, 'px', {
              lifespan: 300, scale: { start: 1, end: 0 }, tint: [0xff7043, 0xffca28],
              quantity: 2, frequency: 14, follow: meteor,
            }).setDepth(24);
            this.tweens.add({
              targets: meteor, x: mx, y: this.enemyY() - 8, duration: 260, ease: 'Quad.easeIn',
              onComplete: () => {
                this.burst(mx, this.enemyY() - 12, [0xff7043, 0xffca28], 12, 150, 240);
                this.cameras.main.shake(70, 0.005);
                meteor.destroy();
                this.time.delayedCall(300, () => trail.destroy());
              },
            });
          });
        }
        break;
      }

      case 'poison_blades':
        this.slash(ex, ey, 0x9ccc65, -0.6);
        this.slash(ex, ey, 0x66bb6a, 0.6);
        this.add.particles(ex, ey + 30, 'px', {
          lifespan: 900, speedY: { min: 20, max: 60 }, scale: { start: 0.9, end: 0 },
          tint: 0x9ccc65, quantity: 1, frequency: 60, duration: 1000,
        }).setDepth(18);
        break;

      case 'shadow_dodge':
        this.afterimages(4);
        this.tintHero(0x9fb4cc, 600);
        break;

      case 'adrenaline': {
        this.tintHero(0xfff176, 500);
        for (let i = 0; i < 6; i++) {
          const line = this.add.rectangle(hx - 90 - i * 14, hy + Phaser.Math.Between(-40, 40), 26, 3, 0xfff176, 0.8).setDepth(16);
          this.tweens.add({ targets: line, x: hx + 110, alpha: 0, duration: 280 + i * 35, onComplete: () => line.destroy() });
        }
        break;
      }

      case 'blade_dance': {
        sfx.ultimate();
        const swirl = this.add.circle(ex, ey, 70, 0xffffff, 0).setStrokeStyle(3, 0xffd54f, 0.7).setDepth(18);
        this.tweens.add({ targets: swirl, angle: 360, scale: { from: 0.7, to: 1.1 }, alpha: 0, duration: 1600, onComplete: () => swirl.destroy() });
        for (let i = 0; i < 8; i++) {
          this.time.delayedCall(i * 140, () => this.slash(ex + Phaser.Math.Between(-25, 25), ey + Phaser.Math.Between(-30, 30), 0xffffff, Phaser.Math.FloatBetween(-1, 1)));
        }
        break;
      }
    }
  }

  // ─── Helpers de efectos ───────────────────────────────────────────────────

  private tintHero(color: number, ms: number): void {
    if (!this.hero) return;
    this.hero.setTint(color);
    this.time.delayedCall(ms, () => {
      if (this.hero && !isPlayerDead()) this.hero.setTint(this.heroTint());
    });
  }

  private burst(x: number, y: number, tints: number[], qty: number, speed: number, gravity = 150): void {
    this.add.particles(x, y, 'px', {
      speed: { min: speed * 0.4, max: speed },
      lifespan: 650,
      scale: { start: 1.3, end: 0 },
      gravityY: gravity,
      quantity: qty,
      tint: tints,
      emitting: false,
    }).setDepth(30).explode(qty);
  }

  private ring(x: number, y: number, color: number, maxR: number, ms: number): void {
    const r = this.add.circle(x, y, 8, color, 0).setStrokeStyle(3, color, 0.9).setDepth(22);
    this.tweens.add({ targets: r, radius: maxR, alpha: 0, duration: ms, ease: 'Quad.easeOut', onComplete: () => r.destroy() });
  }

  private slash(x: number, y: number, color: number, angle: number): void {
    const g = this.add.graphics({ x, y }).setDepth(26);
    g.lineStyle(4, color, 0.95);
    g.lineBetween(-34, -34, 34, 34);
    g.setRotation(angle);
    g.setScale(0.3);
    this.tweens.add({ targets: g, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 240, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
  }

  private afterimages(count: number): void {
    if (!this.hero) return;
    for (let i = 0; i < count; i++) {
      const ghost = this.add.sprite(this.hero.x - (i + 1) * 18, this.hero.y, this.hero.texture.key)
        .setOrigin(0.5, 1).setScale(this.hero.scaleX).setAlpha(0.45 - i * 0.08).setTint(0xbbaaff).setDepth(5);
      this.tweens.add({ targets: ghost, alpha: 0, duration: 350 + i * 90, onComplete: () => ghost.destroy() });
    }
  }

  // ─── Transiciones y efectos ──────────────────────────────────────────────

  private nodeTransition(): void {
    sfx.advance();
    this.clearSetPiece();
    this.parallaxStep(); // el escenario se desplaza: se aprecia el avance
    if (!this.hero) return;
    const cls = CLASSES[getState().player.classId];
    const runKey = `${cls.spriteKey}_run_anim`;
    if (this.anims.exists(runKey) && !this.heroAttacking) this.hero.play(runKey);
    this.heroBobTween?.stop();
    this.heroBobTween = this.tweens.add({
      targets: this.hero,
      x: { from: this.heroX() - 50, to: this.heroX() },
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.heroAttacking) this.heroIdle();
      },
    });
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
    ring.setStrokeStyle(2, 0xff9ee0, 0.85);
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
