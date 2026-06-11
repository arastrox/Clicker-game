// ─── Mochila, detalle de ítem y oro ─────────────────────────────────────────

import { bus } from '@/core/events';
import { getState, hasState, INVENTORY_SIZE } from '@/core/state';
import { equipItem, sellItem } from '@/systems/inventory';
import { RARITY_INFO } from '@/data/items';
import { sfx } from '@/audio/sfx';
import { $, el, iconSrc, itemStatsText } from './dom';

let selectedIndex: number | null = null;

export function initInventoryUi(): void {
  bus.on('state:changed', render);
  bus.on('game:started', render);
  bus.on('gold:gained', () => sfx.gold());
  bus.on('combat:enemyDefeated', ({ loot }) => { if (loot) sfx.loot(); });
}

function render(): void {
  if (!hasState()) return;
  const s = getState();
  $('gold-display').textContent = `🪙 ${s.player.gold}`;

  const grid = $('inventory-grid');
  grid.innerHTML = '';
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const item = s.player.inventory[i];
    const slot = el('div', `inv-slot${item ? ` r-${item.rarity}` : ' empty'}${selectedIndex === i ? ' selected' : ''}`);
    if (item) {
      slot.innerHTML = `<img src="${iconSrc(item.icon)}" alt="${item.name}" title="${item.name}">`;
      slot.addEventListener('click', () => {
        selectedIndex = selectedIndex === i ? null : i;
        render();
      });
    }
    grid.appendChild(slot);
  }

  renderDetail();
}

function renderDetail(): void {
  const s = getState();
  const detail = $('item-detail');
  const item = selectedIndex !== null ? s.player.inventory[selectedIndex] : null;
  if (selectedIndex === null || !item) {
    detail.classList.add('hidden');
    selectedIndex = null;
    return;
  }
  detail.classList.remove('hidden');
  const rar = RARITY_INFO[item.rarity];
  const slotName = item.slot === 'weapon' ? 'Arma' : item.slot === 'armor' ? 'Armadura' : 'Accesorio';
  detail.innerHTML = `
    <div class="id-name t-${item.rarity}">${item.name}</div>
    <div class="id-rarity">${rar.emoji} ${rar.name} · ${slotName} · Nv. ${item.level}</div>
    <div class="id-stats"><div>${itemStatsText(item)}</div></div>
    ${item.unique ? `<div class="id-unique">★ ${item.unique.label}: ${item.unique.desc}</div>` : ''}
    <div class="id-actions">
      <button class="equip-btn">Equipar</button>
      <button class="sell-btn">Vender 🪙 ${item.sellValue}</button>
    </div>`;
  const idx = selectedIndex;
  detail.querySelector('.equip-btn')!.addEventListener('click', () => {
    selectedIndex = null;
    equipItem(idx);
  });
  detail.querySelector('.sell-btn')!.addEventListener('click', () => {
    selectedIndex = null;
    sellItem(idx);
  });
}
