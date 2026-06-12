// ─── Overlay de la arena: botón de avanzar, eventos y mercader ──────────────

import { bus } from '@/core/events';
import { getState } from '@/core/state';
import {
  advance, restHeal, skipRest,
  resolveEventChoice, finishEventNode,
  getMerchantStock, merchantItemPrice, buyMerchantItem, buyPotion, leaveMerchant,
} from '@/systems/gameflow';
import { EVENT_COPY } from '@/data/specialEvents';
import { RARITY_INFO } from '@/data/items';
import { sfx } from '@/audio/sfx';
import { $, el, iconSrc, itemStatsText } from './dom';
import type { EventType } from '@/core/types';

export function initArenaUi(): void {
  $('btn-advance').addEventListener('click', () => {
    hideAll();
    advance();
  });

  bus.on('arena:cleared', () => {
    hideEventPanel();
    showAdvance();
  });
  bus.on('combat:spawn', () => hideAll());
  bus.on('node:advance', () => hideAll());
  bus.on('arena:rest', () => showRest());
  bus.on('arena:event', ({ eventType }) => showEvent(eventType as EventType));
  bus.on('player:death', () => hideAll());
}

function showAdvance(): void {
  $('advance-container').classList.remove('hidden');
}

function hideAll(): void {
  $('advance-container').classList.add('hidden');
  hideEventPanel();
}

function hideEventPanel(): void {
  $('event-panel').classList.add('hidden');
  $('merchant-shop').classList.add('hidden');
}

// ─── Descanso ────────────────────────────────────────────────────────────────

function showRest(): void {
  openPanel('⛺', 'Fogata del Sendero',
    'Alguien dejó esta fogata encendida para los que vienen detrás — una vieja costumbre de los caminos de Felandia. Las llamas crepitan con calidez y hay espacio justo para una gata cansada. Es buen momento para lamerse las heridas y vigilar las sombras con un solo ojo.');
  addChoice('🔥 Descansar junto al fuego (+30% Vida)', () => {
    sfx.heal();
    hideEventPanel();
    restHeal();
  });
  addChoice('🚶 Seguir sin descansar', () => { hideEventPanel(); skipRest(); }, true);
}

// ─── Eventos especiales ──────────────────────────────────────────────────────

function showEvent(type: EventType): void {
  const copy = EVENT_COPY[type];
  openPanel(copy.emoji, copy.title, copy.text);

  if (type === 'merchant') {
    renderMerchant();
    addChoice('👋 Despedirse del mercader', () => { hideEventPanel(); leaveMerchant(); }, true);
    return;
  }

  for (const choice of copy.choices) {
    addChoice(choice.label, () => {
      const outcome = resolveEventChoice(type, choice.id);
      if (outcome.kind === 'combat') {
        hideEventPanel();
      } else {
        showOutcome(copy.emoji, copy.title, outcome.text);
      }
    }, choice.ghost, choice.danger);
  }
}

// Desenlace narrativo del evento + botón para continuar
function showOutcome(emoji: string, title: string, outcomeText: string): void {
  openPanel(emoji, title, outcomeText);
  addChoice('🐾 Continuar el camino', () => {
    hideEventPanel();
    finishEventNode();
  });
}

function openPanel(emoji: string, title: string, text: string): void {
  $('advance-container').classList.add('hidden');
  $('event-emoji').textContent = emoji;
  $('event-title').textContent = title;
  $('event-text').textContent = text;
  $('event-choices').innerHTML = '';
  $('merchant-shop').classList.add('hidden');
  $('event-panel').classList.remove('hidden');
}

function addChoice(label: string, fn: () => void, ghost = false, danger = false): void {
  const btn = el('button', `choice-btn${danger ? ' danger' : ''}${ghost ? ' ghost' : ''}`, label);
  btn.addEventListener('click', fn);
  $('event-choices').appendChild(btn);
}

// ─── Mercader ────────────────────────────────────────────────────────────────

function renderMerchant(): void {
  const s = getState();
  const stock = getMerchantStock();
  const shop = $('merchant-shop');
  shop.classList.remove('hidden');
  shop.innerHTML = '';

  shop.appendChild(el('div', 'merchant-section-title', '⚔️ Equipo en venta'));
  const grid = el('div', 'merchant-grid');
  stock.items.forEach((item, i) => {
    if (!item) {
      grid.appendChild(el('div', 'merchant-item sold', '<span class="mi-emoji">✔️</span><div class="mi-info"><div class="mi-name">Vendido</div></div>'));
      return;
    }
    const price = merchantItemPrice(item);
    const card = el('div', 'merchant-item');
    card.innerHTML = `
      <img src="${iconSrc(item.icon)}" alt="">
      <div class="mi-info">
        <div class="mi-name t-${item.rarity}">${RARITY_INFO[item.rarity].emoji} ${item.name}</div>
        <div class="mi-stats">${itemStatsText(item)}${item.unique ? ` · ★${item.unique.label}` : ''}</div>
      </div>`;
    const buy = el('button', 'buy-btn', `🪙 ${price}`) as HTMLButtonElement;
    buy.disabled = s.player.gold < price;
    buy.addEventListener('click', () => {
      if (buyMerchantItem(i)) { sfx.gold(); renderMerchant(); }
    });
    card.appendChild(buy);
    grid.appendChild(card);
  });
  shop.appendChild(grid);

  shop.appendChild(el('div', 'merchant-section-title', '🧪 Pociones'));
  const pgrid = el('div', 'merchant-grid');
  for (const potion of stock.potions) {
    const card = el('div', 'merchant-item');
    card.innerHTML = `
      <span class="mi-emoji">${potion.emoji}</span>
      <div class="mi-info">
        <div class="mi-name">${potion.name}</div>
        <div class="mi-stats">${potion.desc}</div>
      </div>`;
    const buy = el('button', 'buy-btn', `🪙 ${potion.price}`) as HTMLButtonElement;
    buy.disabled = s.player.gold < potion.price;
    buy.addEventListener('click', () => {
      if (buyPotion(potion.id)) { sfx.potion(); renderMerchant(); }
    });
    card.appendChild(buy);
    pgrid.appendChild(card);
  }
  shop.appendChild(pgrid);
}
