import { getState } from '@/core/state';
import { weightedPick, randInt, chance } from './rng';
import { EVENT_WEIGHTS } from '@/data/specialEvents';
import { ZONES } from '@/data/zones';
import type { MapNode, NodeType, EventType } from '@/core/types';

// Genera el mapa de la zona actual: 10-20 nodos, el último siempre es el jefe.
export function generateZoneMap(): MapNode[] {
  const count = randInt(10, 20);
  const nodes: MapNode[] = [];
  for (let i = 0; i < count - 1; i++) {
    let type: NodeType;
    if (i === 0) {
      type = 'enemy'; // el primer nodo siempre es un combate
    } else {
      type = weightedPick<NodeType>([
        { item: 'enemy', weight: 55 },
        { item: 'elite', weight: 15 },
        { item: 'rest', weight: 15 },
        { item: 'event', weight: 15 },
      ]);
      // evitar dos descansos seguidos
      if (type === 'rest' && nodes[i - 1]?.type === 'rest') type = 'enemy';
    }
    const node: MapNode = { type, done: false };
    if (type === 'event') {
      node.eventType = weightedPick<EventType>(EVENT_WEIGHTS.map((e) => ({ item: e.type, weight: e.weight })));
    }
    nodes.push(node);
  }
  nodes.push({ type: 'boss', done: false });
  return nodes;
}

// Nivel efectivo del enemigo según zona, progreso del mapa y ciclo del Abismo.
// Se suaviza respecto al nivel del jugador para evitar saltos imposibles
// al entrar a una zona nueva con nivel bajo.
export function enemyLevelFor(nodeIndex: number): number {
  const s = getState();
  const zone = ZONES[s.run.zoneIndex];
  const [lo, hi] = zone.levelRange;
  const span = Math.min(hi - lo, 9);
  const progress = s.run.map.length > 1 ? nodeIndex / (s.run.map.length - 1) : 0;
  const abyssBonus = s.run.endlessTier * 10;
  const zoneLevel = Math.round(lo + progress * span + abyssBonus);
  const cap = s.player.level + 4;
  return Math.max(1, Math.min(zoneLevel, cap));
}

export function currentZone() {
  return ZONES[getState().run.zoneIndex];
}

// Probabilidad de botín según el tipo de nodo
export function lootRoll(node: MapNode, isMimic = false): boolean {
  if (isMimic || node.type === 'boss') return true;
  if (node.type === 'elite') return chance(60);
  return chance(25);
}
