// ─── Bus de eventos tipado: comunica sistemas, Phaser y la UI DOM ──────────

import type { CombatEnemy, Item, MapNode } from './types';

export interface EventMap {
  'state:changed': void;                       // refresco general de UI
  'log': { msg: string; kind: 'info' | 'combat' | 'loot' | 'level' | 'event' | 'danger' };

  'node:advance': { node: MapNode; index: number; total: number };
  'zone:enter': { zoneIndex: number };

  'combat:spawn': { enemy: CombatEnemy };
  'combat:playerHit': { amount: number; crit: boolean; source: 'click' | 'dps' | 'skill' };
  'combat:enemyAttack': { amount: number; dodged: boolean };
  'combat:enemyDefeated': { enemy: CombatEnemy; loot: Item | null };
  'combat:bossDefeated': { zoneIndex: number };

  'player:levelUp': { level: number };
  'player:death': void;
  'player:heal': { amount: number };

  'skill:cast': { skillId: string };
  'item:equipped': { item: Item };
  'gold:gained': { amount: number };

  'arena:rest': void;                          // mostrar fuente de descanso
  'arena:event': { eventType: string };        // mostrar escena de evento
  'arena:cleared': void;                       // nodo terminado, esperar avance

  'story:show': { chapterIndex: number };      // -1 = prólogo
  'game:started': void;
  'game:over': void;
  'arena:ready': void;                         // Phaser cargó los assets y la escena existe
}

type Handler<T> = (payload: T) => void;

class EventBus {
  private handlers = new Map<string, Set<Handler<unknown>>>();

  on<K extends keyof EventMap>(event: K, fn: Handler<EventMap[K]>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(fn as Handler<unknown>);
    return () => this.handlers.get(event)?.delete(fn as Handler<unknown>);
  }

  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K] extends void ? [] : [EventMap[K]]): void {
    this.handlers.get(event)?.forEach((fn) => fn(args[0]));
  }
}

export const bus = new EventBus();

export function log(msg: string, kind: EventMap['log']['kind'] = 'info'): void {
  bus.emit('log', { msg, kind });
}
