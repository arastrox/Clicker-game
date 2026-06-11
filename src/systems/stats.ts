import { getState } from '@/core/state';
import { BASE_STATS, CLASSES } from '@/data/classes';
import type { Item } from '@/core/types';

// Penalización activa mientras dura el debuff de trampa
const TRAP_DEBUFF = { clickDmgPct: -0.2, defenseFlat: -3 };

function equippedItems(): Item[] {
  const eq = getState().player.equipment;
  return [eq.weapon, eq.armor, eq.accessory].filter((i): i is Item => i !== null);
}

export interface StatBreakdown {
  base: number;
  classMod: number;
  attrs: number;
  equipment: number;
  buffs: number;
  total: number;
}

export function getMaxHp(): number {
  return breakdownMaxHp().total;
}

export function breakdownMaxHp(): StatBreakdown {
  const s = getState();
  const cls = CLASSES[s.player.classId];
  const base = BASE_STATS.maxHp + (s.player.level - 1) * 10;
  const classMod = cls.baseMods.maxHp;
  const attrs = s.player.attributes.constitucion * cls.attrBonus.constitucion;
  const equipment = equippedItems().reduce((sum, i) => sum + (i.stats.maxHp ?? 0), 0);
  const total = Math.max(10, Math.round(base + classMod + attrs + equipment));
  return { base, classMod, attrs, equipment, buffs: 0, total };
}

export function getClickDmg(): number {
  return breakdownClickDmg().total;
}

export function breakdownClickDmg(): StatBreakdown {
  const s = getState();
  const cls = CLASSES[s.player.classId];
  const base = BASE_STATS.clickDmg + (s.player.level - 1) * 1;
  const classMod = cls.baseMods.clickDmg;
  const attrs = s.player.attributes.fuerza * cls.attrBonus.fuerza;
  const equipment = equippedItems().reduce((sum, i) => sum + (i.stats.clickDmg ?? 0), 0);
  let subtotal = base + classMod + attrs + equipment;

  let buffPct = 0;
  for (const b of s.run.buffs) buffPct += b.clickDmgPct ?? 0;
  if (s.run.trapDebuffActive) buffPct += TRAP_DEBUFF.clickDmgPct;
  const buffs = subtotal * buffPct;

  const total = Math.max(1, Math.round((subtotal + buffs) * 10) / 10);
  return { base, classMod, attrs, equipment, buffs, total };
}

export function getDefense(): number {
  return breakdownDefense().total;
}

export function breakdownDefense(): StatBreakdown {
  const s = getState();
  const cls = CLASSES[s.player.classId];
  const base = BASE_STATS.defense;
  const classMod = cls.baseMods.defense;
  const attrs = s.player.attributes.reflejos * cls.attrBonus.reflejos;
  const equipment = equippedItems().reduce((sum, i) => sum + (i.stats.defense ?? 0), 0);
  let buffs = 0;
  for (const b of s.run.buffs) buffs += b.defenseFlat ?? 0;
  if (s.run.trapDebuffActive) buffs += TRAP_DEBUFF.defenseFlat;
  const total = Math.max(0, Math.round((base + classMod + attrs + equipment + buffs) * 10) / 10);
  return { base, classMod, attrs, equipment, buffs, total };
}

export function getDps(): number {
  return breakdownDps().total;
}

export function breakdownDps(): StatBreakdown {
  const s = getState();
  const cls = CLASSES[s.player.classId];
  const base = BASE_STATS.dps + Math.floor((s.player.level - 1) / 2);
  const classMod = cls.baseMods.dps;
  const attrs = s.player.attributes.destreza * cls.attrBonus.destreza;
  const equipment = equippedItems().reduce((sum, i) => sum + (i.stats.dps ?? 0), 0);
  let buffPct = 0;
  for (const b of s.run.buffs) buffPct += b.dpsPct ?? 0;
  const subtotal = base + classMod + attrs + equipment;
  const buffs = subtotal * buffPct;
  const total = Math.max(0, Math.round((subtotal + buffs) * 10) / 10);
  return { base, classMod, attrs, equipment, buffs, total };
}

export function getCritChance(): number {
  const s = getState();
  const cls = CLASSES[s.player.classId];
  let crit = cls.critBase + s.player.attributes.agilidad * cls.attrBonus.agilidad;
  for (const b of s.run.buffs) crit += b.critPct ?? 0;
  return Math.min(100, crit);
}

export function getCritMult(): number {
  return CLASSES[getState().player.classId].critMult;
}

// Efectos únicos del equipo
export function uniqueEffectValue(effectId: string): number {
  return equippedItems().reduce((sum, i) => (i.unique?.id === effectId ? sum + i.unique.value : sum), 0);
}

// XP necesaria para subir del nivel dado al siguiente
export function xpToNext(level: number): number {
  return Math.round(25 * Math.pow(level, 1.45));
}
