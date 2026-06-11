import { getState } from '@/core/state';
import { bus, log } from '@/core/events';
import { saveGame } from '@/core/save';
import { gainGold } from './progression';
import { getMaxHp } from './stats';
import { chance, pick, randInt } from './rng';
import {
  ITEM_NAMES, RARITY_INFO, RARITY_ORDER, UNIQUE_EFFECTS,
  WEAPON_SPRITES, ARMOR_SPRITE, ACCESSORY_SPRITE,
} from '@/data/items';
import type { Item, ItemSlot, Rarity } from '@/core/types';

let itemSeq = 0;

function rollRarity(level: number, bonus = 0): Rarity {
  // a mayor nivel, mejores probabilidades
  const lvlBoost = Math.min(20, level * 0.5);
  const roll = Math.random() * 100 - bonus - lvlBoost;
  if (roll < 3) return 'legendario';
  if (roll < 13) return 'epico';
  if (roll < 38) return 'raro';
  return 'comun';
}

export function generateItem(level: number, opts: { slot?: ItemSlot; rarityBonus?: number } = {}): Item {
  const slot: ItemSlot = opts.slot ?? pick(['weapon', 'armor', 'accessory'] as const);
  const rarity = rollRarity(level, opts.rarityBonus ?? 0);
  const info = RARITY_INFO[rarity];
  const power = (level * 1.2 + randInt(0, 3)) * info.statMult;

  const stats: Item['stats'] = {};
  if (slot === 'weapon') {
    stats.clickDmg = Math.max(1, Math.round(power * 0.9));
  } else if (slot === 'armor') {
    stats.maxHp = Math.max(5, Math.round(power * 4));
    stats.defense = Math.max(1, Math.round(power * 0.35));
  } else {
    stats.dps = Math.max(1, Math.round(power * 0.7));
  }

  // Épicos: 35% de efecto único. Legendarios: siempre.
  let unique;
  if (rarity === 'legendario' || (rarity === 'epico' && chance(35))) {
    unique = pick(UNIQUE_EFFECTS);
  }

  const icon = slot === 'weapon' ? pick(WEAPON_SPRITES[rarity]) : slot === 'armor' ? ARMOR_SPRITE : ACCESSORY_SPRITE;

  return {
    id: `item_${Date.now()}_${itemSeq++}`,
    slot,
    name: pick(ITEM_NAMES[slot][rarity]),
    rarity,
    level,
    icon,
    stats,
    unique,
    sellValue: Math.max(2, Math.round(level * 2 * info.sellMult)),
  };
}

export function addToInventory(item: Item): boolean {
  const inv = getState().player.inventory;
  const idx = inv.findIndex((x) => x === null);
  if (idx === -1) {
    log('🎒 ¡Mochila llena! El objeto se pierde...', 'danger');
    return false;
  }
  inv[idx] = item;
  saveGame();
  bus.emit('state:changed');
  return true;
}

export function equipItem(invIndex: number): void {
  const s = getState();
  const item = s.player.inventory[invIndex];
  if (!item) return;
  const prev = s.player.equipment[item.slot];
  s.player.equipment[item.slot] = item;
  s.player.inventory[invIndex] = prev; // intercambio con lo equipado
  s.player.hp = Math.min(s.player.hp, getMaxHp());
  log(`${RARITY_INFO[item.rarity].emoji} Equipado: ${item.name}`, 'loot');
  bus.emit('item:equipped', { item });
  saveGame();
  bus.emit('state:changed');
}

export function sellItem(invIndex: number): void {
  const s = getState();
  const item = s.player.inventory[invIndex];
  if (!item) return;
  s.player.inventory[invIndex] = null;
  gainGold(item.sellValue);
  log(`🪙 Vendido ${item.name} por ${item.sellValue} de oro`, 'loot');
  saveGame();
  bus.emit('state:changed');
}

export function rarityAtLeast(r: Rarity, min: Rarity): boolean {
  return RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf(min);
}
