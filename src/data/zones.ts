import type { ZoneDef } from '@/core/types';

// Las claves de sprite corresponden a los prefijos de animación del
// 0x72 DungeonTileset II v1.7 (public/assets/sprites/frames/).

export const ZONES: ZoneDef[] = [
  {
    id: 0,
    name: 'Bosque Susurrante',
    emoji: '🌲',
    levelRange: [1, 10],
    enemies: [
      { id: 'goblin', name: 'Goblin Salvaje', spriteKey: 'goblin', scale: 4, hasRunAnim: true },
      { id: 'imp', name: 'Diablillo del Bosque', spriteKey: 'imp', scale: 4, hasRunAnim: true },
      { id: 'tiny_zombie', name: 'Zombi Putrefacto', spriteKey: 'tiny_zombie', scale: 4, hasRunAnim: true },
      { id: 'slug', name: 'Babosa Gigante', spriteKey: 'slug', scale: 4 },
      { id: 'orc_warrior', name: 'Orco Guerrero', spriteKey: 'orc_warrior', scale: 4, hasRunAnim: true },
    ],
    boss: { id: 'ogre', name: 'Orco Gigante', title: 'Señor de la Espesura', spriteKey: 'ogre', scale: 5, hasRunAnim: true },
    palette: { sky: [0x0b2818, 0x1a4a2e], ground: 0x143620, accent: 0x4caf50, fog: 0x0a1f12 },
    floorTiles: ['floor_1', 'floor_2', 'floor_3'],
  },
  {
    id: 1,
    name: 'Cueva de Cristal',
    emoji: '💎',
    levelRange: [11, 20],
    enemies: [
      { id: 'skelet', name: 'Esqueleto Cristalino', spriteKey: 'skelet', scale: 4, hasRunAnim: true },
      { id: 'muddy', name: 'Limo de las Profundidades', spriteKey: 'muddy', scale: 4 },
      { id: 'swampy', name: 'Moho Luminoso', spriteKey: 'swampy', scale: 4, tint: 0x88ddff },
      { id: 'tiny_slug', name: 'Caracol de Cuarzo', spriteKey: 'tiny_slug', scale: 4, tint: 0xaaccff },
      { id: 'ice_zombie', name: 'Zombi de Escarcha', spriteKey: 'ice_zombie', scale: 4 },
    ],
    boss: { id: 'big_zombie', name: 'Gólem de Piedra', title: 'Corazón de la Caverna', spriteKey: 'big_zombie', scale: 5, tint: 0x9fb6c9, hasRunAnim: true },
    palette: { sky: [0x0a1230, 0x1c2a5e], ground: 0x141c40, accent: 0x4fc3f7, fog: 0x080d22 },
    floorTiles: ['floor_4', 'floor_5', 'floor_6'],
  },
  {
    id: 2,
    name: 'Volcán de Fuego Eterno',
    emoji: '🌋',
    levelRange: [21, 30],
    enemies: [
      { id: 'chort', name: 'Chort Ígneo', spriteKey: 'chort', scale: 4, hasRunAnim: true },
      { id: 'wogol', name: 'Wogol Ardiente', spriteKey: 'wogol', scale: 4, hasRunAnim: true },
      { id: 'masked_orc', name: 'Orco Enmascarado', spriteKey: 'masked_orc', scale: 4, hasRunAnim: true },
      { id: 'imp_fire', name: 'Imp de Magma', spriteKey: 'imp', scale: 4, tint: 0xff8866, hasRunAnim: true },
      { id: 'zombie_ash', name: 'Caminante de Ceniza', spriteKey: 'zombie', scale: 4, tint: 0xcc9988 },
    ],
    boss: { id: 'big_demon', name: 'Demonio de Obsidiana', title: 'Hijo del Magma', spriteKey: 'big_demon', scale: 5, hasRunAnim: true },
    palette: { sky: [0x2a0a08, 0x57201a], ground: 0x3a120e, accent: 0xff5722, fog: 0x1c0604 },
    floorTiles: ['floor_7', 'floor_8', 'floor_1'],
  },
  {
    id: 3,
    name: 'Castillo Flotante',
    emoji: '🏰',
    levelRange: [31, 40],
    enemies: [
      { id: 'necromancer', name: 'Necrómante de la Corte', spriteKey: 'necromancer', scale: 4 },
      { id: 'zombie_noble', name: 'Noble No-Muerto', spriteKey: 'zombie', scale: 4, tint: 0xbb99ff },
      { id: 'pumpkin', name: 'Guardián Calabaza', spriteKey: 'pumpkin_dude', scale: 4, hasRunAnim: true },
      { id: 'angel_dark', name: 'Ángel Caído', spriteKey: 'angel', scale: 4, tint: 0xccaaff, hasRunAnim: true },
      { id: 'orc_shaman', name: 'Chamán de la Torre', spriteKey: 'orc_shaman', scale: 4, hasRunAnim: true },
    ],
    boss: { id: 'wizard_king', name: 'Rey Hechicero', title: 'Amo del Castillo Flotante', spriteKey: 'necromancer', scale: 6, tint: 0xb388ff },
    palette: { sky: [0x16082e, 0x32175e], ground: 0x231244, accent: 0xba68c8, fog: 0x0e051f },
    floorTiles: ['floor_2', 'floor_4', 'floor_8'],
  },
  {
    id: 4,
    name: 'Abismo Infinito',
    emoji: '🕳️',
    levelRange: [41, 999],
    enemies: [
      { id: 'a_chort', name: 'Sombra del Abismo', spriteKey: 'chort', scale: 4, tint: 0x8899ff, hasRunAnim: true },
      { id: 'a_skelet', name: 'Eco Esquelético', spriteKey: 'skelet', scale: 4, tint: 0x99ffee, hasRunAnim: true },
      { id: 'a_necro', name: 'Heraldo del Vacío', spriteKey: 'necromancer', scale: 4, tint: 0x77ccff },
      { id: 'a_angel', name: 'Serafín Roto', spriteKey: 'angel', scale: 4, tint: 0xff99cc, hasRunAnim: true },
      { id: 'a_doc', name: 'Alquimista Perdido', spriteKey: 'doc', scale: 4, hasRunAnim: true },
      { id: 'a_wogol', name: 'Devorador Pálido', spriteKey: 'wogol', scale: 4, tint: 0xccccff, hasRunAnim: true },
    ],
    boss: { id: 'abyss_lord', name: 'Avatar del Abismo', title: 'Lo que Espera Debajo', spriteKey: 'big_demon', scale: 6, tint: 0x7766ff, hasRunAnim: true },
    palette: { sky: [0x05050d, 0x12122e], ground: 0x0c0c1e, accent: 0x7c4dff, fog: 0x030308 },
    floorTiles: ['floor_3', 'floor_5', 'floor_7'],
  },
];

export const CAMPAIGN_ZONES = 4; // las primeras 4 son la campaña; la 5ª es post-game
