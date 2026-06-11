import { createNewState, getState, setState } from '@/core/state';
import { saveGame, deleteSave } from '@/core/save';
import { bus, log } from '@/core/events';
import { generateZoneMap, currentZone, enemyLevelFor } from './map';
import { spawnEnemyForNode, setCurrentNode, clearEnemy, revivePlayer, healPlayer, applyPotion } from './combat';
import { generateItem, addToInventory } from './inventory';
import { gainGold, gainXp } from './progression';
import { getMaxHp, xpToNext } from './stats';
import { chance, pick, randInt } from './rng';
import { ZONES, CAMPAIGN_ZONES } from '@/data/zones';
import { POTIONS, RARITY_INFO, type PotionDef } from '@/data/items';
import type { ClassId, EnemyDef, Item, MapNode } from '@/core/types';

// ─── Inicio / continuación ──────────────────────────────────────────────────

export function startNewGame(name: string, classId: ClassId): void {
  const s = createNewState(name, classId);
  setState(s);
  s.player.hp = getMaxHp();
  s.run.map = generateZoneMap();
  saveGame();
  bus.emit('game:started');
  bus.emit('zone:enter', { zoneIndex: 0 });
  bus.emit('arena:cleared'); // muestra el botón de avanzar bajo el prólogo
  bus.emit('story:show', { chapterIndex: -1 }); // prólogo
  bus.emit('state:changed');
}

export function continueGame(): void {
  const s = getState();
  if (s.run.map.length === 0) s.run.map = generateZoneMap();
  if (s.player.hp <= 0) s.player.hp = Math.round(getMaxHp() * 0.5);
  bus.emit('game:started');
  bus.emit('zone:enter', { zoneIndex: s.run.zoneIndex });
  // re-mostrar el nodo actual (o esperar avance)
  const node = s.run.map[s.run.nodeIndex];
  if (node && !node.done) {
    resolveNode(node);
  } else {
    clearEnemy();
    setCurrentNode(null);
    bus.emit('arena:cleared');
  }
  bus.emit('state:changed');
}

export function resetGame(): void {
  deleteSave();
  location.reload();
}

// ─── Avance por el sendero ──────────────────────────────────────────────────

export function advance(): void {
  const s = getState();
  // si el nodo actual quedó sin resolver (p. ej. tras revivir), se reintenta
  const current = s.run.map[s.run.nodeIndex];
  if (current && !current.done) {
    bus.emit('node:advance', { node: current, index: s.run.nodeIndex, total: s.run.map.length });
    resolveNode(current);
    return;
  }
  if (s.run.nodeIndex >= s.run.map.length - 1) return; // el jefe es el último nodo
  s.run.nodeIndex += 1;
  const node = s.run.map[s.run.nodeIndex];
  bus.emit('node:advance', { node, index: s.run.nodeIndex, total: s.run.map.length });
  resolveNode(node);
  saveGame();
}

function resolveNode(node: MapNode): void {
  setCurrentNode(node);
  const zone = currentZone();

  switch (node.type) {
    case 'enemy':
    case 'elite': {
      const def = pick(zone.enemies);
      spawnEnemyForNode(node, def);
      log(`${node.type === 'elite' ? '⭐ Un enemigo de élite aparece' : '⚔️ Un enemigo bloquea el sendero'}: ${def.name}`, 'combat');
      break;
    }
    case 'boss': {
      spawnEnemyForNode(node, zone.boss, { boss: true });
      log(`👑 ¡JEFE DE ZONA! ${zone.boss.name}, ${zone.boss.title}`, 'danger');
      break;
    }
    case 'rest': {
      clearEnemy();
      bus.emit('arena:rest');
      log('⛺ Encuentras un lugar seguro para descansar', 'event');
      break;
    }
    case 'event': {
      clearEnemy();
      bus.emit('arena:event', { eventType: node.eventType! });
      break;
    }
  }
  bus.emit('state:changed');
}

// ─── Descanso ───────────────────────────────────────────────────────────────

export function restHeal(): void {
  healPlayer(Math.round(getMaxHp() * 0.3));
  const s = getState();
  const node = s.run.map[s.run.nodeIndex];
  if (node) node.done = true;
  saveGame();
  bus.emit('arena:cleared');
}

export function skipRest(): void {
  const s = getState();
  const node = s.run.map[s.run.nodeIndex];
  if (node) node.done = true;
  saveGame();
  bus.emit('arena:cleared');
}

// ─── Eventos especiales ─────────────────────────────────────────────────────

const MIMIC_DEF: EnemyDef = { id: 'mimic', name: '¡MIMIC!', spriteKey: 'chest_mimic_open', scale: 5 };
const SPIRIT_DEF: EnemyDef = { id: 'spirit', name: 'Espíritu Encadenado', spriteKey: 'ice_zombie', scale: 4, tint: 0xaaffee };

function finishEventNode(): void {
  const s = getState();
  const node = s.run.map[s.run.nodeIndex];
  if (node) node.done = true;
  saveGame();
  bus.emit('arena:cleared');
}

export function eventOpenChest(): void {
  const s = getState();
  const node = s.run.map[s.run.nodeIndex];
  if (!node) return;
  log('📦 El cofre abre los ojos... ¡ES UN MIMIC!', 'danger');
  spawnEnemyForNode(node, MIMIC_DEF, { mimic: true, nameOverride: '¡MIMIC!' });
}

export function eventIgnoreChest(): void {
  log('🚶 Decides no tentar a la suerte y rodeas el cofre', 'event');
  finishEventNode();
}

export function eventTrapResolve(): void {
  const s = getState();
  const dmg = Math.round(getMaxHp() * 0.15);
  s.player.hp = Math.max(1, s.player.hp - dmg);
  s.run.trapDebuffActive = true;
  log(`🌿 La trampa te hiere (-${dmg} HP) y te debilita: -20% Daño, -3 Def hasta vencer en combate`, 'danger');
  finishEventNode();
}

export function eventAltarResolve(): void {
  const s = getState();
  const xp = Math.round(xpToNext(s.player.level) * 0.4);
  log(`🗿 El altar reconoce tu causa. +${xp} XP`, 'event');
  gainXp(xp);
  finishEventNode();
}

export function eventSpringResolve(): void {
  healPlayer(Math.round(getMaxHp() * 0.5));
  log('⛲ Las aguas del manantial restauran tu cuerpo y tu ánimo', 'event');
  finishEventNode();
}

export function eventBlessingResolve(): void {
  const s = getState();
  s.run.buffs.push({ label: 'Bendición del Viajero', clickDmgPct: 0.15, critPct: 10, combatsLeft: 3 });
  log('✨ Te sientes bendecido: +15% Daño y +10% Crítico durante 3 combates', 'event');
  finishEventNode();
}

// Elección moral: liberar al espíritu (riesgo) o vender su cadena (seguro)
export function eventFreeSpirit(): void {
  const s = getState();
  const node = s.run.map[s.run.nodeIndex];
  if (!node) return;
  if (chance(60)) {
    const lvl = enemyLevelFor(s.run.nodeIndex);
    if (chance(50)) {
      const item: Item = generateItem(lvl, { rarityBonus: 25 });
      if (addToInventory(item)) {
        log(`⛓️ El espíritu cumple su palabra: ${RARITY_INFO[item.rarity].emoji} ${item.name}`, 'loot');
      }
    } else {
      const gold = lvl * 15 + randInt(5, 25);
      gainGold(gold);
      log(`⛓️ El espíritu se desvanece dejando ${gold} de oro`, 'loot');
    }
    finishEventNode();
  } else {
    log('⛓️ El espíritu suelta una carcajada hueca... ¡era una trampa!', 'danger');
    spawnEnemyForNode(node, SPIRIT_DEF, { nameOverride: 'Espíritu Traicionero' });
  }
}

export function eventSellChain(): void {
  const s = getState();
  const gold = enemyLevelFor(s.run.nodeIndex) * 8 + randInt(0, 10);
  gainGold(gold);
  log(`⛓️ Vendes la cadena rúnica por ${gold} de oro. El espíritu te maldice en voz baja.`, 'event');
  finishEventNode();
}

// ─── Mercader ───────────────────────────────────────────────────────────────

export interface MerchantStock {
  items: (Item | null)[];
  potions: PotionDef[];
}

let merchantStock: MerchantStock | null = null;

export function getMerchantStock(): MerchantStock {
  const s = getState();
  if (!merchantStock) {
    const lvl = enemyLevelFor(s.run.nodeIndex);
    const count = randInt(3, 4);
    const items: Item[] = [];
    for (let i = 0; i < count; i++) {
      const bonusLvl = chance(10) ? 3 : 0; // 10% de ítem de nivel superior
      items.push(generateItem(lvl + bonusLvl, { rarityBonus: 6 }));
    }
    merchantStock = {
      items,
      potions: POTIONS.filter((p) => !p.mageOnly || s.player.classId === 'mage'),
    };
  }
  return merchantStock;
}

export function merchantItemPrice(item: Item): number {
  return Math.max(5, Math.round(item.sellValue * 2.5));
}

export function buyMerchantItem(index: number): boolean {
  const s = getState();
  const stock = getMerchantStock();
  const item = stock.items[index];
  if (!item) return false;
  const price = merchantItemPrice(item);
  if (s.player.gold < price) return false;
  if (!addToInventory(item)) return false;
  s.player.gold -= price;
  stock.items[index] = null;
  log(`🏪 Compras ${item.name} por ${price} 🪙`, 'loot');
  saveGame();
  bus.emit('state:changed');
  return true;
}

export function buyPotion(potionId: string): boolean {
  const s = getState();
  const potion = POTIONS.find((p) => p.id === potionId);
  if (!potion || s.player.gold < potion.price) return false;
  s.player.gold -= potion.price;
  applyPotion(potionId);
  saveGame();
  bus.emit('state:changed');
  return true;
}

export function leaveMerchant(): void {
  merchantStock = null;
  log('🏪 El mercader recoge su puesto y desaparece sendero abajo', 'event');
  finishEventNode();
}

// ─── Jefes, capítulos y cambio de zona ──────────────────────────────────────

bus.on('combat:bossDefeated', ({ zoneIndex }) => {
  const s = getState();
  if (zoneIndex < CAMPAIGN_ZONES && !s.meta.unlockedChapters.includes(zoneIndex)) {
    s.meta.unlockedChapters.push(zoneIndex);
    if (zoneIndex === CAMPAIGN_ZONES - 1) s.meta.campaignDone = true;
    saveGame();
    bus.emit('story:show', { chapterIndex: zoneIndex });
  } else {
    // jefe del Abismo: siguiente ciclo
    log(`🕳️ Ciclo ${s.run.endlessTier + 1} del Abismo superado. La oscuridad se hace más densa...`, 'danger');
    bus.emit('arena:cleared');
  }
});

// Llamado al cerrar el modal de historia de un capítulo (avance de zona)
export function proceedToNextZone(): void {
  const s = getState();
  if (s.run.zoneIndex < ZONES.length - 1) {
    s.run.zoneIndex += 1;
  } else {
    s.run.endlessTier += 1; // el Abismo se repite, cada vez más letal
  }
  s.run.nodeIndex = -1;
  s.run.map = generateZoneMap();
  clearEnemy();
  setCurrentNode(null);
  const zone = ZONES[s.run.zoneIndex];
  log(`${zone.emoji} Entras en: ${zone.name}`, 'event');
  saveGame();
  bus.emit('zone:enter', { zoneIndex: s.run.zoneIndex });
  bus.emit('arena:cleared');
  bus.emit('state:changed');
}

// El jefe del Abismo también regenera el mapa al avanzar
bus.on('arena:cleared', () => {
  const s = getState();
  const atEnd = s.run.nodeIndex >= s.run.map.length - 1;
  const bossDone = s.run.map[s.run.map.length - 1]?.done;
  if (atEnd && bossDone && s.run.zoneIndex === ZONES.length - 1) {
    s.run.nodeIndex = -1;
    s.run.map = generateZoneMap();
    saveGame();
  }
});

// ─── Muerte ─────────────────────────────────────────────────────────────────

export function reviveAndRetry(): void {
  revivePlayer();
  // el jugador decide cuándo reintentar: puede equiparse y gastar puntos antes
  log('🔥 Despiertas junto a la fogata. Prepárate antes de volver al sendero...', 'event');
  bus.emit('arena:cleared');
}
