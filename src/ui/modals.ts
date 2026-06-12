// ─── Modales: creación de personaje, historia, muerte, confirmaciones ──────

import { bus } from '@/core/events';
import { getState, hasState } from '@/core/state';
import { startNewGame, resetGame, proceedToNextZone, reviveAndRetry } from '@/systems/gameflow';
import { whenArenaReady } from '@/core/ready';
import { bootArena } from '@/scenes/createGame';
import { CLASSES } from '@/data/classes';
import { PROLOGUE, CHAPTERS, ABYSS_INTRO, formatStory, type StoryEntry } from '@/data/story';
import { CAMPAIGN_ZONES } from '@/data/zones';
import { sfx } from '@/audio/sfx';
import { toggleMute } from './hud';
import { $, el } from './dom';
import type { ClassId } from '@/core/types';

export function initModals(): void {
  bus.on('story:show', ({ chapterIndex }) => {
    if (chapterIndex === -1) showStory(PROLOGUE, 'Comenzar la aventura ⚔️', null);
    else {
      const entry = CHAPTERS[chapterIndex];
      const isLast = chapterIndex === CAMPAIGN_ZONES - 1;
      showStory(entry, isLast ? 'Descender al Abismo 🕳️' : 'Continuar el viaje ➡️', () => {
        if (isLast) showStory(ABYSS_INTRO, 'Entrar al Abismo Infinito', () => proceedToNextZone());
        else proceedToNextZone();
      });
    }
  });

  bus.on('game:over', () => showDeathModal());

  $('btn-reset').addEventListener('click', showResetConfirm);
  $('btn-story').addEventListener('click', showChapterList);
  $('btn-mute').addEventListener('click', toggleMute);
}

function openModal(): HTMLElement {
  const root = $('modal-root');
  root.innerHTML = '';
  const backdrop = el('div', 'modal-backdrop');
  const modal = el('div', 'modal');
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  return modal;
}

export function closeModal(): void {
  $('modal-root').innerHTML = '';
}

// ─── Creación de personaje ───────────────────────────────────────────────────

const CLASS_FUR_FILTER: Record<ClassId, string> = {
  warrior: 'sepia(1) saturate(2.4) hue-rotate(-12deg) brightness(1.04)',
  mage: 'sepia(1) saturate(1.8) hue-rotate(214deg) brightness(1.05)',
  rogue: 'sepia(0.5) saturate(0.9) hue-rotate(170deg) brightness(0.96)',
};

export function showCharacterCreation(): void {
  const modal = openModal();
  modal.innerHTML = `
    <h2>🐱 Hero Clicker RPG<br><span style="font-size:9px;color:var(--accent2)">Crónicas de Felandia</span></h2>
    <p style="text-align:center;color:var(--text-dim);margin-bottom:18px;font-size:var(--t-sm)">
      Felandia agoniza bajo el dominio del Lince Hechicero.<br>
      Elige a tu gata heroína: te queda una sola vida de las siete... que cuente.
    </p>
    <input id="name-input" maxlength="16" placeholder="Nombre de tu gata..." autocomplete="off">
    <div class="class-grid"></div>
    <div class="modal-actions">
      <button class="primary-btn" id="btn-create" disabled style="opacity:.4">Despertar en Felandia</button>
    </div>`;

  let selected: ClassId | null = null;
  const grid = modal.querySelector('.class-grid')!;
  const createBtn = modal.querySelector('#btn-create') as HTMLButtonElement;
  const nameInput = modal.querySelector('#name-input') as HTMLInputElement;

  const refresh = () => {
    const ok = selected !== null && nameInput.value.trim().length >= 2;
    createBtn.disabled = !ok;
    createBtn.style.opacity = ok ? '1' : '.4';
  };

  (Object.keys(CLASSES) as ClassId[]).forEach((id) => {
    const cls = CLASSES[id];
    const card = el('div', 'class-card');
    card.innerHTML = `
      <div class="cc-sprite"><img src="assets/sprites/frames/${cls.spriteKey}_idle_anim_f0.png" alt="${cls.name}" style="filter:${CLASS_FUR_FILTER[id]}"></div>
      <div class="cc-name">${cls.emoji} ${cls.name}</div>
      <div class="cc-desc">${cls.desc}</div>`;
    card.addEventListener('click', () => {
      grid.querySelectorAll('.class-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      selected = id;
      refresh();
    });
    grid.appendChild(card);
  });

  nameInput.addEventListener('input', refresh);
  nameInput.focus();

  createBtn.addEventListener('click', () => {
    if (!selected) return;
    const cls = selected;
    const name = nameInput.value.trim();
    closeModal();
    $('app').classList.remove('hidden');
    bootArena();
    whenArenaReady(() => startNewGame(name, cls));
  });
}

// ─── Historia ────────────────────────────────────────────────────────────────

function showStory(entry: StoryEntry, buttonLabel: string, onClose: (() => void) | null): void {
  const s = hasState() ? getState() : null;
  const name = s?.player.name ?? 'héroe';
  const className = s ? CLASSES[s.player.classId].name : 'aventurero';

  const modal = openModal();
  modal.innerHTML = `
    <h2>${entry.emoji} ${entry.title}</h2>
    <div class="story-text">
      ${entry.paragraphs.map((p) => `<p>${formatStory(p, name, className)}</p>`).join('')}
    </div>
    <div class="modal-actions"><button class="primary-btn">${buttonLabel}</button></div>`;
  modal.querySelector('.primary-btn')!.addEventListener('click', () => {
    closeModal();
    onClose?.();
  });
}

// Releer historia desde el botón 📖 (no avanza zona)
function showChapterList(): void {
  if (!hasState()) return;
  const s = getState();
  const modal = openModal();
  modal.innerHTML = `<h2>📖 Crónicas de Eldoria</h2><div class="chapter-list"></div>
    <div class="modal-actions"><button class="ghost-btn">Cerrar</button></div>`;
  const list = modal.querySelector('.chapter-list')!;

  const addEntry = (entry: StoryEntry, unlocked: boolean) => {
    const btn = el('button', 'chapter-item', `${entry.emoji} ${unlocked ? entry.title : '??? — Aún por descubrir'}`) as HTMLButtonElement;
    btn.disabled = !unlocked;
    if (unlocked) btn.addEventListener('click', () => showStory(entry, 'Volver a las crónicas 📖', showChapterList));
    list.appendChild(btn);
  };

  addEntry(PROLOGUE, true);
  CHAPTERS.forEach((ch, i) => addEntry(ch, s.meta.unlockedChapters.includes(i)));
  if (s.meta.campaignDone) addEntry(ABYSS_INTRO, true);

  modal.querySelector('.ghost-btn')!.addEventListener('click', closeModal);
}

// ─── Muerte ──────────────────────────────────────────────────────────────────

function showDeathModal(): void {
  const s = getState();
  const modal = openModal();
  modal.innerHTML = `
    <div class="death-skull">🙀</div>
    <h2>Has Caído</h2>
    <p style="text-align:center;color:var(--text-dim);font-size:var(--t-md);line-height:1.7">
      La oscuridad te envuelve, ${s.player.name}... pero las gatas de leyenda no mueren tan fácil:<br>
      la Gran Gata aún no quiere verte en sus tejados.<br><br>
      Despertarás junto a la última fogata con la mitad de tu vida<br>
      (y 20% menos oro en los bolsillos — los cuervos no perdonan).
    </p>
    <div class="modal-actions">
      <button class="primary-btn" id="btn-revive">🔥 Aferrarte a tu séptima vida</button>
      <button class="ghost-btn" id="btn-give-up">⚰️ Abandonar (borrar partida)</button>
    </div>`;
  modal.querySelector('#btn-revive')!.addEventListener('click', () => {
    closeModal();
    sfx.heal();
    reviveAndRetry();
  });
  modal.querySelector('#btn-give-up')!.addEventListener('click', () => showResetConfirm());
}

// ─── Confirmación de reinicio ────────────────────────────────────────────────

function showResetConfirm(): void {
  const modal = openModal();
  modal.innerHTML = `
    <h2>🔄 ¿Reiniciar partida?</h2>
    <p style="text-align:center;color:var(--text-dim);font-size:13px;line-height:1.7">
      Se borrará TODO el progreso: nivel, equipo, oro e historia.<br>Esta acción no se puede deshacer.
    </p>
    <div class="modal-actions">
      <button class="ghost-btn" id="btn-cancel">Cancelar</button>
      <button class="primary-btn" id="btn-confirm" style="border-color:var(--hp);color:var(--hp)">Sí, borrar todo</button>
    </div>`;
  modal.querySelector('#btn-cancel')!.addEventListener('click', () => {
    // si el jugador está muerto, volver al modal de muerte
    closeModal();
    if (hasState() && getState().player.hp <= 0) showDeathModal();
  });
  modal.querySelector('#btn-confirm')!.addEventListener('click', () => resetGame());
}
