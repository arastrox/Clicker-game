// ─── HUD: header, panel izquierdo, barra de habilidades, placas de combate ──

import { bus, log } from '@/core/events';
import { getState, hasState } from '@/core/state';
import { saveGame } from '@/core/save';
import { CLASSES, ATTR_INFO, ATTR_IDS } from '@/data/classes';
import { skillsForClass, MAX_SKILL_RANK } from '@/data/skills';
import { ZONES } from '@/data/zones';
import { ZONE_INTROS, formatStory } from '@/data/story';
import {
  breakdownClickDmg, breakdownDefense, breakdownDps, breakdownMaxHp,
  getCritChance, getMaxHp, xpToNext, type StatBreakdown,
} from '@/systems/stats';
import { spendAttrPoint, upgradeSkill, SKILL_UPGRADE_LEVEL } from '@/systems/progression';
import { castSkill, getCombatRuntime, getCooldown, getResourceMax } from '@/systems/combat';
import { setUiTick } from '@/scenes/ArenaScene';
import { toggleMusic } from '@/audio/music';
import { $, el, iconSrc, itemStatsText, fmt } from './dom';
import { RARITY_INFO } from '@/data/items';

const STATUS_EMOJI: Record<string, string> = {
  burn: '🔥', poison: '🐍', stun: '💫', immune: '🛡️', shield: '❄️',
  dodge_up: '👣', time_warp: '⏳', last_bastion: '👑', adrenaline: '⚡', battlecry: '📣',
};

export function initHud(): void {
  bus.on('state:changed', renderAll);
  bus.on('game:started', () => { applyFontMode(); renderAll(); });

  // alternar fuente pixel / suave (persistida en el save si existe)
  $('btn-font').addEventListener('click', () => {
    if (hasState()) {
      const meta = getState().meta;
      meta.fontMode = meta.fontMode === 'soft' ? 'pixel' : 'soft';
      saveGame();
      applyFontMode();
    } else {
      document.body.classList.toggle('font-soft');
    }
  });

  $('btn-music').addEventListener('click', () => {
    if (hasState()) toggleMusic();
  });
  bus.on('zone:enter', ({ zoneIndex }) => {
    renderAll();
    if (hasState()) {
      const s = getState();
      const intro = ZONE_INTROS[zoneIndex];
      if (intro) log(`${ZONES[zoneIndex].emoji} ${formatStory(intro, s.player.name, CLASSES[s.player.classId].name)}`, 'event');
    }
  });
  bus.on('log', ({ msg, kind }) => addLogEntry(msg, kind));
  bus.on('combat:spawn', () => { $('enemy-plate').classList.remove('hidden'); renderAll(); });
  bus.on('combat:enemyDefeated', () => $('enemy-plate').classList.add('hidden'));
  bus.on('arena:rest', () => $('enemy-plate').classList.add('hidden'));
  bus.on('arena:event', () => $('enemy-plate').classList.add('hidden'));

  // pestañas
  $('tab-btn-attributes').addEventListener('click', () => switchTab('attributes'));
  $('tab-btn-skills').addEventListener('click', () => switchTab('skills'));

  // log colapsable
  $('log-toggle').addEventListener('click', () => {
    $('battle-log').classList.toggle('hidden');
    $('log-arrow').textContent = $('battle-log').classList.contains('hidden') ? '▸' : '▾';
  });

  // teclas 1-4 para habilidades
  window.addEventListener('keydown', (ev) => {
    if (!hasState()) return;
    if ((ev.target as HTMLElement)?.tagName === 'INPUT') return;
    const idx = ['1', '2', '3', '4'].indexOf(ev.key);
    if (idx >= 0) trySkillByIndex(idx);
  });

  // tooltips de stats: posicionados en fixed junto a la fila (por delegación,
  // sobrevive a los re-render del panel)
  $('stats-list').addEventListener('mouseover', (ev) => {
    const row = (ev.target as HTMLElement).closest('.stat-row');
    const tip = row?.querySelector('.stat-tip') as HTMLElement | null;
    if (!row || !tip) return;
    const r = row.getBoundingClientRect();
    tip.style.left = `${r.right + 10}px`;
    const top = Math.min(Math.max(r.top + r.height / 2, 90), window.innerHeight - 110);
    tip.style.top = `${top}px`;
  });

  // refresco por frame (barras de combate y cooldowns)
  setUiTick(uiTick);
}

function switchTab(tab: 'attributes' | 'skills'): void {
  $('tab-btn-attributes').classList.toggle('active', tab === 'attributes');
  $('tab-btn-skills').classList.toggle('active', tab === 'skills');
  $('pane-attributes').classList.toggle('hidden', tab !== 'attributes');
  $('pane-skills').classList.toggle('hidden', tab !== 'skills');
}

function trySkillByIndex(idx: number): void {
  const s = getState();
  const skills = skillsForClass(s.player.classId);
  const skill = skills[idx];
  if (skill) castSkill(skill.id);
}

// ─── Render principal ────────────────────────────────────────────────────────

function renderAll(): void {
  if (!hasState()) return;
  renderHeader();
  renderHero();
  renderEquip();
  renderAttributes();
  renderSkillUpgrades();
  renderSkillBar();
  renderBuffs();
}

function renderHeader(): void {
  const s = getState();
  const zone = ZONES[s.run.zoneIndex];
  const tierTag = s.run.endlessTier > 0 ? ` · Ciclo ${s.run.endlessTier + 1}` : '';
  $('zone-name').textContent = `${zone.emoji} ${zone.name}${tierTag}`;

  // barra de progreso del mapa (fila de nodos)
  const prog = $('map-progress');
  prog.innerHTML = '';
  s.run.map.forEach((node, i) => {
    const cls = ['map-node'];
    if (node.type === 'boss') cls.push('boss');
    if (node.done) cls.push('done');
    if (i === s.run.nodeIndex) cls.push('current');
    const icon = node.type === 'boss' ? '👑' : '';
    prog.appendChild(el('div', cls.join(' '), icon));
  });

  $('level-badge').textContent = `Nv. ${s.player.level}`;
  const need = xpToNext(s.player.level);
  ($('xp-fill') as HTMLElement).style.width = `${Math.min(100, (s.player.xp / need) * 100)}%`;
  $('xp-text').textContent = `${fmt(s.player.xp)} / ${fmt(need)} XP`;

  $('btn-mute').textContent = s.meta.muted ? '🔇' : '🔊';
  $('btn-music').classList.toggle('off', s.meta.musicOn === false);
  $('btn-font').classList.toggle('off', s.meta.fontMode === 'soft');
}

function applyFontMode(): void {
  if (!hasState()) return;
  document.body.classList.toggle('font-soft', getState().meta.fontMode === 'soft');
}

function tipHtml(label: string, b: StatBreakdown): string {
  const row = (k: string, v: number) => (v !== 0 ? `<div><span>${k}</span><span>${v > 0 ? '+' : ''}${Math.round(v * 10) / 10}</span></div>` : '');
  return `<div class="stat-tip">
    <div><b>${label}</b></div>
    ${row('Base', b.base)}${row('Clase', b.classMod)}${row('Atributos', b.attrs)}${row('Equipo', b.equipment)}${row('Efectos', Math.round(b.buffs * 10) / 10)}
    <div class="tip-total"><span>Total</span><span>${b.total}</span></div>
  </div>`;
}

function renderHero(): void {
  const s = getState();
  const cls = CLASSES[s.player.classId];
  $('hero-emoji').textContent = cls.emoji;
  $('hero-name').textContent = s.player.name;
  $('hero-class').textContent = `${cls.name} · Nivel ${s.player.level}`;
  $('player-plate-name').textContent = `${cls.emoji} ${s.player.name}`;

  const hp = breakdownMaxHp();
  const atk = breakdownClickDmg();
  const dps = breakdownDps();
  const def = breakdownDefense();
  $('stats-list').innerHTML = `
    <div class="stat-row">❤️ Vida <b>${Math.ceil(s.player.hp)} / ${hp.total}</b>${tipHtml('Vida Máxima', hp)}</div>
    <div class="stat-row">⚔️ Daño Click <b>${atk.total}</b>${tipHtml('Daño por Click', atk)}</div>
    <div class="stat-row">🤖 DPS Auto <b>${dps.total}</b>${tipHtml('Daño por Segundo', dps)}</div>
    <div class="stat-row">🛡️ Defensa <b>${def.total}</b>${tipHtml('Defensa', def)}</div>
    <div class="stat-row">🎯 Crítico <b>${Math.round(getCritChance())}%</b></div>
  `;
}

function renderEquip(): void {
  const s = getState();
  const cont = $('equip-slots');
  cont.innerHTML = '';
  const slots: { key: 'weapon' | 'armor' | 'accessory'; label: string; emoji: string }[] = [
    { key: 'weapon', label: 'Arma', emoji: '🗡️' },
    { key: 'armor', label: 'Armadura', emoji: '🛡️' },
    { key: 'accessory', label: 'Accesorio', emoji: '💍' },
  ];
  for (const slot of slots) {
    const item = s.player.equipment[slot.key];
    const div = el('div', `equip-slot${item ? ' filled' : ''}`);
    if (item) {
      const rar = RARITY_INFO[item.rarity];
      div.style.borderColor = rar.color;
      div.innerHTML = `
        <div class="slot-icon"><img src="${iconSrc(item.icon)}" alt=""></div>
        <div class="slot-info">
          <div class="slot-name t-${item.rarity}">${item.name}</div>
          <div class="slot-stats">${itemStatsText(item)}${item.unique ? ` · <i>${item.unique.label}</i>` : ''}</div>
        </div>`;
    } else {
      div.innerHTML = `
        <div class="slot-icon">${slot.emoji}</div>
        <div class="slot-info"><div class="equip-empty">${slot.label} — vacío</div></div>`;
    }
    cont.appendChild(div);
  }
}

function renderAttributes(): void {
  const s = getState();
  const cls = CLASSES[s.player.classId];
  const pane = $('pane-attributes');
  pane.innerHTML = '';
  if (s.player.attrPoints > 0) {
    pane.appendChild(el('div', 'points-banner', `✨ ${s.player.attrPoints} punto(s) de atributo disponible(s)`));
  }
  for (const attr of ATTR_IDS) {
    const info = ATTR_INFO[attr];
    const row = el('div', 'attr-row');
    row.innerHTML = `
      <span title="${info.desc} (+${cls.attrBonus[attr]} por punto)">${info.emoji}</span>
      <span class="attr-name" title="${info.desc}">${info.name}</span>
      <span class="attr-val">${s.player.attributes[attr]}</span>`;
    const btn = el('button', 'plus-btn', '+') as HTMLButtonElement;
    btn.disabled = s.player.attrPoints <= 0;
    btn.addEventListener('click', () => spendAttrPoint(attr));
    row.appendChild(btn);
    pane.appendChild(row);
  }
  $('attr-dot').classList.toggle('hidden', s.player.attrPoints <= 0);
}

function renderSkillUpgrades(): void {
  const s = getState();
  const pane = $('pane-skills');
  const canUpgrade = s.player.level >= SKILL_UPGRADE_LEVEL;
  pane.innerHTML = '';
  if (!canUpgrade) {
    pane.appendChild(el('div', 'gate-banner', `🔒 Las mejoras de rango se desbloquean en Nv. ${SKILL_UPGRADE_LEVEL}`));
  } else if (s.player.skillPoints > 0) {
    pane.appendChild(el('div', 'points-banner', `🌟 ${s.player.skillPoints} punto(s) de habilidad disponible(s)`));
  }
  for (const skill of skillsForClass(s.player.classId)) {
    const rank = s.player.skillRanks[skill.id] ?? 0;
    const locked = rank === 0;
    const row = el('div', `skill-up-row${locked ? ' skill-locked' : ''}`);
    const rankText = locked ? `🔒 Nv. ${skill.unlockLevel}` : `Rango ${rank}/${MAX_SKILL_RANK}`;
    const desc = locked ? skill.desc : skill.ranks[rank - 1].desc;
    row.innerHTML = `
      <span>${skill.emoji}</span>
      <span class="sk-name">${skill.name}</span>
      <span class="sk-rank">${rankText}</span>`;
    if (canUpgrade && !locked && rank < MAX_SKILL_RANK) {
      const btn = el('button', 'plus-btn', '+') as HTMLButtonElement;
      btn.disabled = s.player.skillPoints <= 0;
      btn.title = `Mejorar a rango ${rank + 1}: ${skill.ranks[rank].desc}`;
      btn.addEventListener('click', () => upgradeSkill(skill.id));
      row.appendChild(btn);
    }
    row.appendChild(el('div', 'sk-desc', desc));
    pane.appendChild(row);
  }
  $('skill-dot').classList.toggle('hidden', !canUpgrade || s.player.skillPoints <= 0);
}

function renderSkillBar(): void {
  const s = getState();
  const cls = CLASSES[s.player.classId];
  $('resource-label').textContent = `${cls.resource.emoji} ${cls.resource.name}`;
  ($('resource-fill') as HTMLElement).style.background = cls.resource.color;

  const isRogue = s.player.classId === 'rogue';
  $('combo-pips').classList.toggle('hidden', !isRogue);
  document.querySelector('#resource-box .bar')?.classList.toggle('hidden', isRogue);

  const grid = $('skills-grid');
  grid.innerHTML = '';
  skillsForClass(s.player.classId).forEach((skill, i) => {
    const rank = s.player.skillRanks[skill.id] ?? 0;
    const locked = rank === 0;
    const btn = el('button', `skill-btn${locked ? ' locked' : ''}${skill.ultimate ? ' ultimate' : ''}`) as HTMLButtonElement;
    btn.dataset.skill = skill.id;
    btn.innerHTML = `<span class="key-hint">${i + 1}</span>${skill.emoji}
      ${locked ? `<span class="lock-lvl">Nv.${skill.unlockLevel}</span>` : ''}
      <div class="cd-overlay" style="height:0"></div><div class="cd-text"></div>`;
    const rankDesc = locked ? skill.desc : skill.ranks[rank - 1].desc;
    btn.title = `${skill.name}${locked ? ` (se desbloquea al nivel ${skill.unlockLevel})` : ` — Rango ${rank}`}\n${rankDesc}\nCoste: ${skill.cost} ${cls.resource.name} · CD ${skill.cooldown}s`;
    if (!locked) btn.addEventListener('click', () => castSkill(skill.id));
    grid.appendChild(btn);
  });
}

function renderBuffs(): void {
  const s = getState();
  const row = $('buffs-row');
  row.innerHTML = '';
  if (s.run.trapDebuffActive) {
    row.appendChild(el('div', 'buff-chip debuff', '🌿 Trampa: -20% Daño, -3 Def'));
  }
  for (const b of s.run.buffs) {
    const time = b.timeLeft !== undefined ? ` (${Math.ceil(b.timeLeft)}s)` : b.combatsLeft !== undefined ? ` (${b.combatsLeft} combates)` : '';
    row.appendChild(el('div', 'buff-chip', `✨ ${b.label}${time}`));
  }
}

// ─── Refresco por frame ──────────────────────────────────────────────────────

function uiTick(): void {
  if (!hasState()) return;
  const s = getState();
  const rt = getCombatRuntime();

  // HP del jugador
  const maxHp = getMaxHp();
  ($('player-hp-fill') as HTMLElement).style.width = `${Math.max(0, (s.player.hp / maxHp) * 100)}%`;
  $('player-hp-text').textContent = `${Math.ceil(Math.max(0, s.player.hp))} / ${maxHp}`;

  // recurso de clase
  const resMax = getResourceMax();
  if (s.player.classId === 'rogue') {
    const pips = $('combo-pips');
    if (pips.childElementCount !== resMax) {
      pips.innerHTML = '';
      for (let i = 0; i < resMax; i++) pips.appendChild(el('div', 'pip'));
    }
    Array.from(pips.children).forEach((pip, i) => pip.classList.toggle('on', i < Math.floor(rt.resource)));
    $('resource-text').textContent = '';
  } else {
    ($('resource-fill') as HTMLElement).style.width = `${(rt.resource / resMax) * 100}%`;
    $('resource-text').textContent = `${Math.floor(rt.resource)} / ${resMax}`;
  }

  // placa del enemigo
  if (rt.enemy) {
    $('enemy-name').innerHTML = `${rt.enemy.isBoss ? '👑 ' : rt.enemy.isElite ? '⭐ ' : ''}${rt.enemy.name} <span style="color:var(--text-dim)">· Nv. ${rt.enemy.level}</span>`;
    ($('enemy-hp-fill') as HTMLElement).style.width = `${(rt.enemy.hp / rt.enemy.maxHp) * 100}%`;
    $('enemy-hp-text').textContent = `${fmt(Math.ceil(rt.enemy.hp))} / ${fmt(rt.enemy.maxHp)}`;
    ($('enemy-atk-fill') as HTMLElement).style.width = `${(rt.enemy.attackTimer / rt.enemy.attackInterval) * 100}%`;
    $('enemy-status-row').innerHTML = rt.enemy.statuses
      .map((st) => `<span title="${st.id} (${Math.ceil(st.remaining)}s)">${STATUS_EMOJI[st.id] ?? '✨'}</span>`)
      .join('');
  }

  // cooldowns de habilidades
  document.querySelectorAll<HTMLButtonElement>('.skill-btn[data-skill]').forEach((btn) => {
    const id = btn.dataset.skill!;
    const skill = skillsForClass(s.player.classId).find((sk) => sk.id === id);
    if (!skill) return;
    const cd = getCooldown(id);
    const overlay = btn.querySelector('.cd-overlay') as HTMLElement;
    const text = btn.querySelector('.cd-text') as HTMLElement;
    if (cd > 0) {
      overlay.style.height = `${(cd / skill.cooldown) * 100}%`;
      text.textContent = cd >= 1 ? String(Math.ceil(cd)) : '';
    } else {
      overlay.style.height = '0';
      text.textContent = '';
    }
    btn.classList.toggle('no-resource', rt.resource < skill.cost);
  });

  // estados temporales del jugador junto a los buffs (refrescados con menos frecuencia ya en renderBuffs)
}

// ─── Registro de batalla ────────────────────────────────────────────────────

const MAX_LOG = 80;

function addLogEntry(msg: string, kind: string): void {
  const logEl = $('battle-log');
  const entry = el('div', `log-entry ${kind}`, msg);
  logEl.prepend(entry);
  while (logEl.childElementCount > MAX_LOG) logEl.lastElementChild?.remove();
}

export function toggleMute(): void {
  const s = getState();
  s.meta.muted = !s.meta.muted;
  saveGame();
  bus.emit('state:changed');
}
