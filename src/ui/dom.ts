import type { Item } from '@/core/types';

export function $(id: string): HTMLElement {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Elemento #${id} no encontrado`);
  return e;
}

export function el(tag: string, className = '', html = ''): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

// Ruta del ícono de un ítem (frames 0x72 o tiles Kenney)
export function iconSrc(icon: string): string {
  if (icon.startsWith('kenney_')) {
    const n = icon.slice('kenney_'.length).padStart(4, '0');
    return `assets/kenney/tile_${n}.png`;
  }
  return `assets/sprites/frames/${icon}.png`;
}

export function itemStatsText(item: Item): string {
  const parts: string[] = [];
  if (item.stats.clickDmg) parts.push(`+${item.stats.clickDmg} Daño`);
  if (item.stats.maxHp) parts.push(`+${item.stats.maxHp} Vida`);
  if (item.stats.defense) parts.push(`+${item.stats.defense} Def`);
  if (item.stats.dps) parts.push(`+${item.stats.dps} DPS`);
  return parts.join(' · ');
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}
