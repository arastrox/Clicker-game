import type { SkillDef } from '@/core/types';

// Las habilidades escalan por rango (1-3). `mult` multiplica el daño de click
// base del jugador salvo que la descripción indique otra cosa.

export const SKILLS: SkillDef[] = [
  // ── Guerrero ──────────────────────────────────────────────────────────────
  {
    id: 'shield_bash', classId: 'warrior', name: 'Golpe de Escudo', emoji: '💥',
    unlockLevel: 3, cooldown: 8, cost: 15,
    desc: 'Golpea con el escudo, infligiendo daño y aturdiendo al enemigo.',
    ranks: [
      { desc: '3× Daño + aturde 2s', mult: 3, duration: 2 },
      { desc: '4× Daño + aturde 3s', mult: 4, duration: 3 },
      { desc: '5.5× Daño + aturde 4s', mult: 5.5, duration: 4 },
    ],
  },
  {
    id: 'battle_cry', classId: 'warrior', name: 'Grito de Batalla', emoji: '📣',
    unlockLevel: 5, cooldown: 15, cost: 20,
    desc: 'Un rugido que refuerza defensa y ataque durante unos segundos.',
    ranks: [
      { desc: '+8 Def, +30% Daño por 8s', mult: 0.3, duration: 8, extra: 8 },
      { desc: '+12 Def, +45% Daño por 10s', mult: 0.45, duration: 10, extra: 12 },
      { desc: '+18 Def, +65% Daño por 12s', mult: 0.65, duration: 12, extra: 18 },
    ],
  },
  {
    id: 'indomable', classId: 'warrior', name: 'Indomable', emoji: '❤️',
    unlockLevel: 8, cooldown: 25, cost: 30,
    desc: 'La voluntad del guerrero cierra sus heridas.',
    ranks: [
      { desc: 'Cura 25% de la vida máxima', mult: 0.25 },
      { desc: 'Cura 35% de la vida máxima', mult: 0.35 },
      { desc: 'Cura 50% de la vida máxima', mult: 0.5 },
    ],
  },
  {
    id: 'last_bastion', classId: 'warrior', name: 'Último Bastión', emoji: '👑',
    unlockLevel: 12, cooldown: 45, cost: 50, ultimate: true,
    desc: 'ULTIMATE — Inmunidad total y daño doblado. Consume 50 de Ira.',
    ranks: [
      { desc: 'Inmune + ×2 Daño por 6s', mult: 2, duration: 6 },
      { desc: 'Inmune + ×2.5 Daño por 7s', mult: 2.5, duration: 7 },
      { desc: 'Inmune + ×3 Daño por 8s', mult: 3, duration: 8 },
    ],
  },

  // ── Mago ──────────────────────────────────────────────────────────────────
  {
    id: 'fireball', classId: 'mage', name: 'Bola de Fuego', emoji: '🔥',
    unlockLevel: 3, cooldown: 6, cost: 20,
    desc: 'Proyectil ígneo que quema al objetivo durante unos segundos.',
    ranks: [
      { desc: '6× Daño + quemadura 4s', mult: 6, duration: 4 },
      { desc: '8× Daño + quemadura 5s', mult: 8, duration: 5 },
      { desc: '11× Daño + quemadura 6s', mult: 11, duration: 6 },
    ],
  },
  {
    id: 'ice_barrier', classId: 'mage', name: 'Barrera de Hielo', emoji: '❄️',
    unlockLevel: 5, cooldown: 18, cost: 25,
    desc: 'Un escudo de hielo absorbe todo el daño entrante.',
    ranks: [
      { desc: 'Absorbe 100% del daño por 4s', mult: 1, duration: 4 },
      { desc: 'Absorbe 100% del daño por 6s', mult: 1, duration: 6 },
      { desc: 'Absorbe 100% del daño por 8s', mult: 1, duration: 8 },
    ],
  },
  {
    id: 'time_warp', classId: 'mage', name: 'Distorsión Temporal', emoji: '⏳',
    unlockLevel: 8, cooldown: 30, cost: 35,
    desc: 'Acelera el flujo del tiempo: el daño automático se dispara.',
    ranks: [
      { desc: 'DPS +150% por 6s', mult: 1.5, duration: 6 },
      { desc: 'DPS +225% por 8s', mult: 2.25, duration: 8 },
      { desc: 'DPS +300% por 10s', mult: 3, duration: 10 },
    ],
  },
  {
    id: 'meteor_storm', classId: 'mage', name: 'Tormenta de Meteoros', emoji: '☄️',
    unlockLevel: 12, cooldown: 50, cost: 80, ultimate: true,
    desc: 'ULTIMATE — Llueve fuego del cielo. Cuesta 80 de Maná.',
    ranks: [
      { desc: '25× Daño masivo + aturde 4s', mult: 25, duration: 4 },
      { desc: '35× Daño masivo + aturde 5s', mult: 35, duration: 5 },
      { desc: '50× Daño masivo + aturde 6s', mult: 50, duration: 6 },
    ],
  },

  // ── Pícaro ────────────────────────────────────────────────────────────────
  {
    id: 'poison_blades', classId: 'rogue', name: 'Hojas Venenosas', emoji: '🐍',
    unlockLevel: 3, cooldown: 8, cost: 1,
    desc: 'Unta veneno en las dagas. El daño escala con el Combo acumulado.',
    ranks: [
      { desc: '2× Daño + veneno 5s (escala con combo)', mult: 2, duration: 5 },
      { desc: '3× Daño + veneno 6s (escala con combo)', mult: 3, duration: 6 },
      { desc: '4× Daño + veneno 8s (escala con combo)', mult: 4, duration: 8 },
    ],
  },
  {
    id: 'shadow_dodge', classId: 'rogue', name: 'Esquiva Sombría', emoji: '👣',
    unlockLevel: 5, cooldown: 16, cost: 2,
    desc: 'Se funde con las sombras, esquivando la mayoría de los ataques.',
    ranks: [
      { desc: '+60% esquiva por 5s', mult: 0.6, duration: 5 },
      { desc: '+75% esquiva por 6s', mult: 0.75, duration: 6 },
      { desc: '+90% esquiva por 8s', mult: 0.9, duration: 8 },
    ],
  },
  {
    id: 'adrenaline', classId: 'rogue', name: 'Adrenalina', emoji: '⚡',
    unlockLevel: 8, cooldown: 28, cost: 3,
    desc: 'El pulso se dispara: todo golpe es crítico.',
    ranks: [
      { desc: '100% crítico por 6s', mult: 1, duration: 6 },
      { desc: '100% crítico por 8s', mult: 1, duration: 8 },
      { desc: '100% crítico + 20% daño por 10s', mult: 1.2, duration: 10 },
    ],
  },
  {
    id: 'blade_dance', classId: 'rogue', name: 'Danza de Hojas', emoji: '🌪️',
    unlockLevel: 12, cooldown: 40, cost: 5, ultimate: true,
    desc: 'ULTIMATE — Ráfaga de cortes. Consume 5 puntos de Combo.',
    ranks: [
      { desc: '10 golpes de 2.5× Daño', mult: 2.5, extra: 10 },
      { desc: '12 golpes de 3× Daño', mult: 3, extra: 12 },
      { desc: '15 golpes de 3.5× Daño', mult: 3.5, extra: 15 },
    ],
  },
];

export const MAX_SKILL_RANK = 3;

export function skillsForClass(classId: string): SkillDef[] {
  return SKILLS.filter((s) => s.classId === classId);
}

export function getSkill(id: string): SkillDef {
  const s = SKILLS.find((x) => x.id === id);
  if (!s) throw new Error(`Skill desconocida: ${id}`);
  return s;
}
