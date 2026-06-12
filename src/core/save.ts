import { SAVE_KEY, SAVE_VERSION, INVENTORY_SIZE, getState, hasState, setState } from './state';
import type { GameState } from './types';

export function saveGame(): void {
  if (!hasState()) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(getState()));
  } catch {
    // almacenamiento lleno o bloqueado: el juego sigue sin persistir
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GameState;
    const migrated = migrate(data);
    setState(migrated);
    return migrated;
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
  setState(null);
}

// Migración de versiones de save anteriores
function migrate(data: GameState): GameState {
  if (data.version === SAVE_VERSION) return data;

  // v1 (juego original) o estructuras parciales: completar campos faltantes
  data.version = SAVE_VERSION;
  data.player.skillRanks ??= {};
  data.player.skillPoints ??= 0;
  data.player.attrPoints ??= 0;
  data.player.attributes ??= { fuerza: 0, constitucion: 0, destreza: 0, reflejos: 0, agilidad: 0 };
  data.player.inventory ??= Array(INVENTORY_SIZE).fill(null);
  while (data.player.inventory.length < INVENTORY_SIZE) data.player.inventory.push(null);
  data.player.equipment ??= { weapon: null, armor: null, accessory: null };
  data.run ??= { zoneIndex: 0, nodeIndex: -1, map: [], trapDebuffActive: false, buffs: [], endlessTier: 0 };
  data.run.buffs ??= [];
  data.run.endlessTier ??= 0;
  data.meta ??= { muted: false, musicOn: true, fontMode: 'pixel', seenPrologue: true, unlockedChapters: [], campaignDone: false };
  data.meta.unlockedChapters ??= [];
  data.meta.musicOn ??= true;
  data.meta.fontMode ??= 'pixel';
  // las mejoras de habilidad ahora se ganan desde el nivel 13
  data.player.skillPoints = Math.max(0, Math.min(data.player.skillPoints, data.player.level - 12));
  return data;
}
