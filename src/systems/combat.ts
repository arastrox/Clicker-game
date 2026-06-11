import { getState } from '@/core/state';
import { bus, log } from '@/core/events';
import { saveGame } from '@/core/save';
import { CLASSES } from '@/data/classes';
import { getSkill } from '@/data/skills';
import { RARITY_INFO } from '@/data/items';
import {
  getClickDmg, getCritChance, getCritMult, getDefense, getDps, getMaxHp, uniqueEffectValue,
} from './stats';
import { gainGold, gainXp } from './progression';
import { generateItem, addToInventory } from './inventory';
import { lootRoll, enemyLevelFor } from './map';
import { chance, randInt } from './rng';
import type { CombatEnemy, EnemyDef, MapNode, StatusEffect, StatusId, Item } from '@/core/types';

// ─── Estado de combate en runtime (no persistido) ──────────────────────────

interface CombatRuntime {
  enemy: CombatEnemy | null;
  node: MapNode | null;
  resource: number;
  cooldowns: Record<string, number>;
  playerStatuses: StatusEffect[];
  regenBuffs: { rate: number; remaining: number }[];
  dpsCarry: number;
  bladeDance: { hits: number; mult: number; timer: number } | null;
  playerDead: boolean;
}

const rt: CombatRuntime = {
  enemy: null,
  node: null,
  resource: 0,
  cooldowns: {},
  playerStatuses: [],
  regenBuffs: [],
  dpsCarry: 0,
  bladeDance: null,
  playerDead: false,
};

export function getCombatRuntime(): Readonly<CombatRuntime> {
  return rt;
}

export function getResourceMax(): number {
  const s = getState();
  const cls = CLASSES[s.player.classId];
  if (s.player.classId === 'mage') return cls.resource.max + s.player.attributes.agilidad * 5;
  return cls.resource.max;
}

function hasPlayerStatus(id: StatusId): boolean {
  return rt.playerStatuses.some((st) => st.id === id);
}

function addPlayerStatus(id: StatusId, duration: number, value = 0): void {
  const existing = rt.playerStatuses.find((st) => st.id === id);
  if (existing) {
    existing.remaining = Math.max(existing.remaining, duration);
    existing.value = Math.max(existing.value, value);
  } else {
    rt.playerStatuses.push({ id, remaining: duration, value });
  }
}

function addEnemyStatus(id: StatusId, duration: number, value = 0): void {
  if (!rt.enemy) return;
  const existing = rt.enemy.statuses.find((st) => st.id === id);
  if (existing) {
    existing.remaining = Math.max(existing.remaining, duration);
    existing.value = Math.max(existing.value, value);
  } else {
    rt.enemy.statuses.push({ id, remaining: duration, value, tickTimer: 0 });
  }
}

// ─── Aparición de enemigos ──────────────────────────────────────────────────

export function spawnEnemyForNode(node: MapNode, def: EnemyDef, opts: { boss?: boolean; mimic?: boolean; nameOverride?: string } = {}): void {
  const s = getState();
  const lvl = enemyLevelFor(s.run.nodeIndex);
  const isElite = node.type === 'elite';
  const isBoss = opts.boss ?? node.type === 'boss';
  const isMimic = opts.mimic ?? false;

  let hp = Math.round((20 + lvl * 12) * Math.pow(1.045, Math.min(lvl, 60)));
  let atk = Math.round(3 + lvl * 1.6);
  let interval = 3.0;
  if (isElite) { hp *= 2; atk = Math.round(atk * 1.5); interval = 2.6; }
  if (isBoss) { hp *= 6; atk = Math.round(atk * 2); interval = 2.4; }
  if (isMimic) { hp = Math.round(hp * 1.5); atk = Math.round(atk * 1.2); }

  let xp = Math.round(lvl * 8 * (isElite ? 1.8 : 1) * (isBoss ? 5 : 1));
  let gold = Math.round((lvl * 3 + randInt(0, lvl)) * (isElite ? 2 : 1) * (isBoss ? 6 : 1) * (isMimic ? 3 : 1));

  rt.enemy = {
    def,
    name: opts.nameOverride ?? (isElite ? `${def.name} de Élite` : def.name),
    level: lvl,
    maxHp: hp,
    hp,
    atk,
    attackInterval: interval,
    attackTimer: 0,
    isBoss,
    isElite,
    isMimic,
    statuses: [],
    goldReward: gold,
    xpReward: xp,
  };
  rt.playerDead = false;
  rt.dpsCarry = 0;
  bus.emit('combat:spawn', { enemy: rt.enemy });
  bus.emit('state:changed');
}

export function clearEnemy(): void {
  rt.enemy = null;
  rt.bladeDance = null;
}

// ─── Daño del jugador ───────────────────────────────────────────────────────

interface DamageOpts {
  canCrit?: boolean;
  source?: 'click' | 'dps' | 'skill';
  lifestealOk?: boolean;
}

export function dealDamageToEnemy(raw: number, opts: DamageOpts = {}): number {
  if (!rt.enemy || rt.enemy.hp <= 0 || rt.playerDead) return 0;
  const { canCrit = true, source = 'click', lifestealOk = source === 'click' } = opts;

  let dmg = raw;
  let crit = false;
  if (canCrit && chance(getCritChance())) {
    dmg *= getCritMult();
    crit = true;
  }
  // Perforante: prob. de golpe directo amplificado
  const pierce = uniqueEffectValue('pierce');
  if (pierce > 0 && chance(pierce * 100)) dmg *= 1.75;
  // Verdugo: más daño a enemigos casi muertos
  const exec = uniqueEffectValue('executioner');
  if (exec > 0 && rt.enemy.hp / rt.enemy.maxHp < 0.25) dmg *= 1 + exec;

  dmg = Math.max(1, Math.round(dmg));
  rt.enemy.hp = Math.max(0, rt.enemy.hp - dmg);

  // Sed de Sangre
  const ls = uniqueEffectValue('lifesteal');
  if (ls > 0 && lifestealOk) healPlayer(Math.max(1, Math.round(dmg * ls)), true);

  bus.emit('combat:playerHit', { amount: dmg, crit, source });

  if (rt.enemy.hp <= 0) onEnemyDefeated();
  return dmg;
}

export function clickAttack(): void {
  const s = getState();
  if (!rt.enemy || rt.playerDead) return;

  let dmg = getClickDmg();
  // Último Bastión / buffs multiplicativos de habilidad
  const bastion = rt.playerStatuses.find((st) => st.id === 'last_bastion');
  if (bastion) dmg *= bastion.value;

  dealDamageToEnemy(dmg, { source: 'click' });

  // Recursos por click
  if (s.player.classId === 'rogue') {
    rt.resource = Math.min(getResourceMax(), rt.resource + 1);
    bus.emit('state:changed');
  }
}

// ─── Curación y daño recibido ───────────────────────────────────────────────

export function healPlayer(amount: number, silent = false): void {
  const s = getState();
  const before = s.player.hp;
  s.player.hp = Math.min(getMaxHp(), s.player.hp + amount);
  const healed = s.player.hp - before;
  if (healed > 0 && !silent) {
    bus.emit('player:heal', { amount: healed });
    log(`💚 Recuperas ${healed} de vida`, 'info');
  }
  bus.emit('state:changed');
}

function enemyAttacks(): void {
  const s = getState();
  if (!rt.enemy || rt.playerDead) return;

  // Esquiva: Pícaro 5% base + Esquiva Sombría
  let dodgeChance = s.player.classId === 'rogue' ? 5 : 0;
  const dodgeBuff = rt.playerStatuses.find((st) => st.id === 'dodge_up');
  if (dodgeBuff) dodgeChance += dodgeBuff.value * 100;
  if (chance(dodgeChance)) {
    bus.emit('combat:enemyAttack', { amount: 0, dodged: true });
    return;
  }

  if (hasPlayerStatus('immune') || hasPlayerStatus('last_bastion') || hasPlayerStatus('shield')) {
    bus.emit('combat:enemyAttack', { amount: 0, dodged: false });
    return;
  }

  const dmg = Math.max(1, Math.round(rt.enemy.atk - getDefense()));
  s.player.hp = Math.max(0, s.player.hp - dmg);
  bus.emit('combat:enemyAttack', { amount: dmg, dodged: false });

  // Espinas: devuelve parte del daño
  const thorns = uniqueEffectValue('thorns');
  if (thorns > 0) dealDamageToEnemy(Math.max(1, Math.round(dmg * thorns)), { canCrit: false, source: 'dps', lifestealOk: false });

  // El Guerrero genera Ira al ser golpeado
  if (s.player.classId === 'warrior') {
    rt.resource = Math.min(getResourceMax(), rt.resource + Math.round(dmg * 0.8));
  }

  if (s.player.hp <= 0) {
    rt.playerDead = true;
    log('💀 Has caído en combate...', 'danger');
    bus.emit('player:death');
  }
  bus.emit('state:changed');
}

// ─── Habilidades ────────────────────────────────────────────────────────────

export function getCooldown(skillId: string): number {
  return rt.cooldowns[skillId] ?? 0;
}

export function castSkill(skillId: string): boolean {
  const s = getState();
  const rank = s.player.skillRanks[skillId] ?? 0;
  if (rank === 0 || rt.playerDead) return false;
  const skill = getSkill(skillId);
  if ((rt.cooldowns[skillId] ?? 0) > 0) return false;
  if (rt.resource < skill.cost) return false;
  const r = skill.ranks[rank - 1];
  const clickDmg = getClickDmg();
  const needsTarget = ['shield_bash', 'fireball', 'meteor_storm', 'poison_blades', 'blade_dance'].includes(skillId);
  if (needsTarget && (!rt.enemy || rt.enemy.hp <= 0)) return false;

  rt.resource -= skill.cost;
  rt.cooldowns[skillId] = skill.cooldown;

  switch (skillId) {
    case 'shield_bash':
      dealDamageToEnemy(clickDmg * r.mult, { source: 'skill' });
      addEnemyStatus('stun', r.duration ?? 2);
      log(`💥 ¡Golpe de Escudo! El enemigo queda aturdido ${r.duration}s`, 'combat');
      break;
    case 'battle_cry':
      s.run.buffs.push({ label: 'Grito de Batalla', clickDmgPct: r.mult, defenseFlat: r.extra, timeLeft: r.duration });
      log(`📣 ¡Grito de Batalla! +${r.extra} Def, +${Math.round(r.mult * 100)}% Daño`, 'combat');
      break;
    case 'indomable':
      healPlayer(Math.round(getMaxHp() * r.mult));
      break;
    case 'last_bastion':
      addPlayerStatus('last_bastion', r.duration ?? 6, r.mult);
      log(`👑 ¡ÚLTIMO BASTIÓN! Inmune y daño ×${r.mult} por ${r.duration}s`, 'combat');
      break;

    case 'fireball':
      dealDamageToEnemy(clickDmg * r.mult, { source: 'skill' });
      addEnemyStatus('burn', r.duration ?? 4, Math.max(1, Math.round(clickDmg * 0.5)));
      log('🔥 ¡Bola de Fuego! El enemigo arde', 'combat');
      break;
    case 'ice_barrier':
      addPlayerStatus('shield', r.duration ?? 4);
      log(`❄️ Barrera de Hielo activa por ${r.duration}s`, 'combat');
      break;
    case 'time_warp':
      s.run.buffs.push({ label: 'Distorsión Temporal', dpsPct: r.mult, timeLeft: r.duration });
      addPlayerStatus('time_warp', r.duration ?? 6);
      log(`⏳ ¡Distorsión Temporal! DPS +${Math.round(r.mult * 100)}%`, 'combat');
      break;
    case 'meteor_storm':
      dealDamageToEnemy(clickDmg * r.mult, { source: 'skill', canCrit: false });
      addEnemyStatus('stun', r.duration ?? 4);
      log('☄️ ¡TORMENTA DE METEOROS!', 'combat');
      break;

    case 'poison_blades': {
      const comboBonus = 1 + rt.resource * 0.15; // escala con el combo restante
      dealDamageToEnemy(clickDmg * r.mult * comboBonus, { source: 'skill' });
      addEnemyStatus('poison', r.duration ?? 5, Math.max(1, Math.round(clickDmg * 0.4 * comboBonus)));
      log('🐍 ¡Hojas Venenosas! El veneno corroe al enemigo', 'combat');
      break;
    }
    case 'shadow_dodge':
      addPlayerStatus('dodge_up', r.duration ?? 5, r.mult);
      log(`👣 Esquiva Sombría: +${Math.round(r.mult * 100)}% esquiva`, 'combat');
      break;
    case 'adrenaline':
      s.run.buffs.push({ label: 'Adrenalina', critPct: 100, clickDmgPct: r.mult > 1 ? r.mult - 1 : 0, timeLeft: r.duration });
      log('⚡ ¡Adrenalina! Todo golpe es crítico', 'combat');
      break;
    case 'blade_dance':
      rt.bladeDance = { hits: r.extra ?? 10, mult: r.mult, timer: 0 };
      log('🌪️ ¡DANZA DE HOJAS!', 'combat');
      break;
  }

  bus.emit('skill:cast', { skillId });
  bus.emit('state:changed');
  return true;
}

// ─── Pociones ───────────────────────────────────────────────────────────────

export function applyPotion(potionId: string): void {
  const s = getState();
  switch (potionId) {
    case 'potion_hp':
      healPlayer(Math.round(getMaxHp() * 0.5));
      break;
    case 'potion_str':
      s.run.buffs.push({ label: 'Poción de Fuerza', clickDmgPct: 0.25, combatsLeft: 1 });
      log('💪 Fuerza embotellada: +25% daño el próximo combate', 'event');
      break;
    case 'potion_regen':
      rt.regenBuffs.push({ rate: 5, remaining: 30 });
      log('💚 Regeneración activa: +5 HP/s por 30s', 'event');
      break;
    case 'potion_mana':
      rt.resource = getResourceMax();
      log('🔷 Maná restaurado por completo', 'event');
      break;
  }
  bus.emit('state:changed');
}

// ─── Derrota del enemigo ────────────────────────────────────────────────────

function onEnemyDefeated(): void {
  const s = getState();
  const enemy = rt.enemy;
  if (!enemy || !rt.node) return;

  rt.node.done = true;

  // La victoria limpia el debuff de trampa (fix del diseño original)
  if (s.run.trapDebuffActive) {
    s.run.trapDebuffActive = false;
    log('🌿 El debuff de la trampa se disipa', 'info');
  }

  // Buffs que duran N combates se consumen
  s.run.buffs = s.run.buffs.filter((b) => {
    if (b.combatsLeft === undefined) return true;
    b.combatsLeft -= 1;
    return b.combatsLeft > 0;
  });

  gainGold(enemy.goldReward);
  log(`⚔️ ${enemy.name} derrotado. +${enemy.goldReward} 🪙, +${enemy.xpReward} XP`, 'combat');

  let loot: Item | null = null;
  if (lootRoll(rt.node, enemy.isMimic)) {
    const bonus = enemy.isBoss ? 18 : enemy.isElite ? 8 : enemy.isMimic ? 12 : 0;
    loot = generateItem(enemy.level, { rarityBonus: bonus });
    if (addToInventory(loot)) {
      log(`${RARITY_INFO[loot.rarity].emoji} Botín: ${loot.name} [${RARITY_INFO[loot.rarity].name}]`, 'loot');
    }
  }

  const wasBoss = enemy.isBoss;
  rt.enemy = null;
  rt.bladeDance = null;
  bus.emit('combat:enemyDefeated', { enemy, loot });
  gainXp(enemy.xpReward); // al final: puede subir de nivel y refrescar UI

  if (wasBoss) {
    bus.emit('combat:bossDefeated', { zoneIndex: s.run.zoneIndex });
  } else {
    bus.emit('arena:cleared');
  }
  saveGame();
}

// ─── Bucle de actualización (lo llama la escena de Phaser) ─────────────────

export function combatUpdate(dt: number): void {
  const s = getState();

  // cooldowns (Distorsión Temporal los acelera ×2)
  const cdRate = hasPlayerStatus('time_warp') ? 2 : 1;
  for (const k of Object.keys(rt.cooldowns)) {
    rt.cooldowns[k] = Math.max(0, rt.cooldowns[k] - dt * cdRate);
  }

  // estados del jugador
  rt.playerStatuses = rt.playerStatuses.filter((st) => {
    st.remaining -= dt;
    return st.remaining > 0;
  });

  // buffs temporales persistidos
  let buffsChanged = false;
  s.run.buffs = s.run.buffs.filter((b) => {
    if (b.timeLeft === undefined) return true;
    b.timeLeft -= dt;
    if (b.timeLeft <= 0) { buffsChanged = true; return false; }
    return true;
  });
  if (buffsChanged) bus.emit('state:changed');

  // regeneración embotellada
  rt.regenBuffs = rt.regenBuffs.filter((rb) => {
    rb.remaining -= dt;
    healPlayer(rb.rate * dt > 1 ? Math.round(rb.rate * dt) : (Math.random() < rb.rate * dt ? 1 : 0), true);
    return rb.remaining > 0;
  });

  // recursos pasivos
  if (s.player.classId === 'mage') {
    rt.resource = Math.min(getResourceMax(), rt.resource + 4 * dt);
  } else if (s.player.classId === 'warrior' && !rt.enemy) {
    rt.resource = Math.max(0, rt.resource - 3 * dt);
  }

  if (rt.playerDead) return;

  if (rt.enemy && rt.enemy.hp > 0) {
    // DPS automático
    const dps = getDps();
    if (dps > 0) {
      rt.dpsCarry += dps * dt;
      if (rt.dpsCarry >= 1) {
        const dmg = Math.floor(rt.dpsCarry);
        rt.dpsCarry -= dmg;
        dealDamageToEnemy(dmg, { canCrit: false, source: 'dps', lifestealOk: false });
      }
    }

    if (!rt.enemy || rt.enemy.hp <= 0) return; // el DPS pudo rematarlo

    // estados del enemigo (quemadura, veneno, aturdimiento)
    let stunned = false;
    rt.enemy.statuses = rt.enemy.statuses.filter((st) => {
      st.remaining -= dt;
      if (st.id === 'stun') stunned = st.remaining > 0;
      if ((st.id === 'burn' || st.id === 'poison') && st.remaining > 0) {
        st.tickTimer = (st.tickTimer ?? 0) + dt;
        if (st.tickTimer >= 1) {
          st.tickTimer -= 1;
          dealDamageToEnemy(st.value, { canCrit: false, source: 'dps', lifestealOk: false });
        }
      }
      return st.remaining > 0;
    });

    if (!rt.enemy || rt.enemy.hp <= 0) return;

    // Danza de Hojas: ráfaga de golpes
    if (rt.bladeDance) {
      rt.bladeDance.timer -= dt;
      if (rt.bladeDance.timer <= 0) {
        rt.bladeDance.timer = 0.13;
        rt.bladeDance.hits -= 1;
        dealDamageToEnemy(getClickDmg() * rt.bladeDance.mult, { source: 'skill' });
        if (rt.bladeDance && rt.bladeDance.hits <= 0) rt.bladeDance = null;
      }
    }

    if (!rt.enemy || rt.enemy.hp <= 0) return;

    // barra de ataque enemigo
    if (!stunned) {
      rt.enemy.attackTimer += dt;
      if (rt.enemy.attackTimer >= rt.enemy.attackInterval) {
        rt.enemy.attackTimer = 0;
        enemyAttacks();
      }
    }
  } else if (!rt.enemy) {
    // regeneración pasiva fuera de combate: 2% de la vida máxima por segundo
    const max = getMaxHp();
    if (s.player.hp > 0 && s.player.hp < max) {
      const before = Math.floor(s.player.hp);
      s.player.hp = Math.min(max, s.player.hp + max * 0.02 * dt);
      if (Math.floor(s.player.hp) !== before) bus.emit('state:changed');
    }
  }
}

// ─── Utilidades para flujo de juego ────────────────────────────────────────

export function setCurrentNode(node: MapNode | null): void {
  rt.node = node;
}

export function revivePlayer(): void {
  const s = getState();
  rt.playerDead = false;
  rt.enemy = null;
  rt.bladeDance = null;
  rt.playerStatuses = [];
  s.player.hp = Math.round(getMaxHp() * 0.5);
  // penalización por caer: 20% del oro
  const lost = Math.round(s.player.gold * 0.2);
  s.player.gold -= lost;
  if (lost > 0) log(`💸 Pierdes ${lost} de oro al despertar...`, 'danger');
  saveGame();
  bus.emit('state:changed');
}

export function isPlayerDead(): boolean {
  return rt.playerDead;
}
