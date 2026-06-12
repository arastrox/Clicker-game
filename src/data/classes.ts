import type { ClassDef, ClassId, AttrId } from '@/core/types';

// Bonus por punto de atributo, por clase (según diseño original)
const attrBonus = (vals: [number, number, number, number, number]): Record<AttrId, number> => ({
  fuerza: vals[0],
  constitucion: vals[1],
  destreza: vals[2],
  reflejos: vals[3],
  agilidad: vals[4],
});

// Las tres heroínas felinas comparten el sprite `cat` con pelajes distintos.
export const CLASSES: Record<ClassId, ClassDef> = {
  warrior: {
    id: 'warrior',
    name: 'Guerrera',
    emoji: '🛡️',
    desc: 'Una gata de pelaje atigrado y corazón de león. Gana Ira al recibir daño y la descarga en zarpazos devastadores. Más vida y defensa.',
    spriteKey: 'cat',
    tint: 0xffb070,
    heroScale: 2.8,
    resource: { name: 'Ira', emoji: '🔥', max: 100, color: '#ff6b81' },
    baseMods: { maxHp: 30, clickDmg: -1, defense: 2, dps: 0 },
    critBase: 5,
    critMult: 1.8,
    attrBonus: attrBonus([1.0, 20, 0.4, 0.8, 1.0]),
  },
  mage: {
    id: 'mage',
    name: 'Hechicera',
    emoji: '🔮',
    desc: 'Una gata lila que aprendió magia mirando la luna. Su maná se regenera en combate y alimenta hechizos devastadores. Frágil pero terrible.',
    spriteKey: 'cat',
    tint: 0xcf9fff,
    heroScale: 2.8,
    resource: { name: 'Maná', emoji: '💧', max: 100, color: '#b388ff' },
    baseMods: { maxHp: -15, clickDmg: -2, defense: 0, dps: 2 },
    critBase: 5,
    critMult: 2.0,
    attrBonus: attrBonus([0.5, 8, 1.5, 0.3, 1.0]),
  },
  rogue: {
    id: 'rogue',
    name: 'Pícara',
    emoji: '🗡️',
    desc: 'Una gata gris que camina entre sombras y tejados. Acumula Combo con cada zarpazo y lo gasta en ráfagas letales. Críticos altísimos y esquiva.',
    spriteKey: 'cat',
    tint: 0x9fb4cc,
    heroScale: 2.8,
    resource: { name: 'Combo', emoji: '⚡', max: 5, color: '#ffd54f' },
    baseMods: { maxHp: -10, clickDmg: 1, defense: 0, dps: 0 },
    critBase: 15,
    critMult: 2.2,
    attrBonus: attrBonus([1.2, 10, 0.8, 0.4, 2.5]),
  },
};

export const ATTR_INFO: Record<AttrId, { name: string; emoji: string; desc: string }> = {
  fuerza: { name: 'Fuerza', emoji: '💪', desc: 'Aumenta el Daño por Click' },
  constitucion: { name: 'Constitución', emoji: '❤️', desc: 'Aumenta la Vida Máxima' },
  destreza: { name: 'Destreza', emoji: '⚡', desc: 'Aumenta el DPS Automático' },
  reflejos: { name: 'Reflejos', emoji: '🛡️', desc: 'Aumenta la Defensa' },
  agilidad: { name: 'Agilidad', emoji: '🎯', desc: 'Aumenta la prob. de Crítico' },
};

export const ATTR_IDS: AttrId[] = ['fuerza', 'constitucion', 'destreza', 'reflejos', 'agilidad'];

// Stats base de la heroína (antes de clase, atributos y equipo)
export const BASE_STATS = {
  maxHp: 100,
  clickDmg: 5,
  defense: 0,
  dps: 0,
};
