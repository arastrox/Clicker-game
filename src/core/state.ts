import type { AttrId, ClassId, GameState } from './types';

export const SAVE_VERSION = 2;
export const INVENTORY_SIZE = 16;
export const SAVE_KEY = 'hero-clicker-rpg-save';

export function createNewState(name: string, classId: ClassId): GameState {
  const attributes: Record<AttrId, number> = {
    fuerza: 0, constitucion: 0, destreza: 0, reflejos: 0, agilidad: 0,
  };
  return {
    version: SAVE_VERSION,
    player: {
      name,
      classId,
      level: 1,
      xp: 0,
      hp: 0, // se fija a maxHp al iniciar (ver gameflow)
      gold: 10,
      attributes,
      attrPoints: 0,
      skillPoints: 0,
      skillRanks: {},
      inventory: Array(INVENTORY_SIZE).fill(null),
      equipment: { weapon: null, armor: null, accessory: null },
    },
    run: {
      zoneIndex: 0,
      nodeIndex: -1,
      map: [],
      trapDebuffActive: false,
      buffs: [],
      endlessTier: 0,
    },
    meta: {
      muted: false,
      musicOn: true,
      fontMode: 'pixel',
      seenPrologue: false,
      unlockedChapters: [],
      campaignDone: false,
    },
  };
}

// Estado global único del juego. `null` hasta crear/cargar personaje.
let current: GameState | null = null;

export function getState(): GameState {
  if (!current) throw new Error('El estado del juego no está inicializado');
  return current;
}

export function hasState(): boolean {
  return current !== null;
}

export function setState(s: GameState | null): void {
  current = s;
}
