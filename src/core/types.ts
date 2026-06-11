// ─── Tipos compartidos del juego ───────────────────────────────────────────

export type ClassId = 'warrior' | 'mage' | 'rogue';
export type AttrId = 'fuerza' | 'constitucion' | 'destreza' | 'reflejos' | 'agilidad';
export type Rarity = 'comun' | 'raro' | 'epico' | 'legendario';
export type ItemSlot = 'weapon' | 'armor' | 'accessory';
export type NodeType = 'enemy' | 'elite' | 'rest' | 'event' | 'boss';
export type EventType = 'merchant' | 'mimic' | 'trap' | 'altar' | 'moral' | 'spring' | 'blessing';
export type StatusId = 'burn' | 'poison' | 'stun' | 'immune' | 'shield' | 'dodge_up' | 'adrenaline' | 'battlecry' | 'time_warp' | 'last_bastion';

export interface UniqueEffect {
  id: 'lifesteal' | 'pierce' | 'goldfind' | 'xpboost' | 'thorns' | 'executioner';
  label: string;
  desc: string;
  value: number;
}

export interface Item {
  id: string;
  slot: ItemSlot;
  name: string;
  rarity: Rarity;
  level: number;
  icon: string;          // clave de textura/frame
  stats: { clickDmg?: number; maxHp?: number; defense?: number; dps?: number };
  unique?: UniqueEffect;
  sellValue: number;
}

export interface MapNode {
  type: NodeType;
  eventType?: EventType;
  done: boolean;
}

export interface SkillRankDef {
  desc: string;
  mult: number;          // multiplicador genérico del efecto principal
  duration?: number;
  extra?: number;
}

export interface SkillDef {
  id: string;
  classId: ClassId;
  name: string;
  emoji: string;
  unlockLevel: number;
  cooldown: number;
  cost: number;          // coste de recurso de clase
  ultimate?: boolean;
  desc: string;
  ranks: SkillRankDef[]; // índice = rango-1 (máx 3)
}

export interface ClassDef {
  id: ClassId;
  name: string;
  emoji: string;
  desc: string;
  spriteKey: string;     // prefijo de anims: knight_m, wizzard_m, elf_m
  resource: { name: string; emoji: string; max: number; color: string };
  baseMods: { maxHp: number; clickDmg: number; defense: number; dps: number };
  critBase: number;      // % base
  critMult: number;
  attrBonus: Record<AttrId, number>; // valor por punto (ver data/classes)
}

export interface EnemyDef {
  id: string;
  name: string;
  spriteKey: string;     // prefijo de animación 0x72
  scale: number;
  tint?: number;
  hasRunAnim?: boolean;
}

export interface ZoneDef {
  id: number;
  name: string;
  emoji: string;
  levelRange: [number, number];
  enemies: EnemyDef[];
  boss: EnemyDef & { title: string };
  palette: { sky: [number, number]; ground: number; accent: number; fog: number };
  floorTiles: string[];  // tiles kenney/0x72 para el suelo
}

export interface StatusEffect {
  id: StatusId;
  remaining: number;
  value: number;         // daño por tick, % buff, etc.
  tickTimer?: number;
}

export interface TempBuff {
  label: string;
  clickDmgPct?: number;
  defenseFlat?: number;
  critPct?: number;
  dpsPct?: number;
  combatsLeft?: number;  // si se define, dura N combates
  timeLeft?: number;     // si se define, dura en segundos
}

export interface EquipmentState {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
}

export interface PlayerState {
  name: string;
  classId: ClassId;
  level: number;
  xp: number;
  hp: number;
  gold: number;
  attributes: Record<AttrId, number>;
  attrPoints: number;
  skillPoints: number;
  skillRanks: Record<string, number>;
  inventory: (Item | null)[];
  equipment: EquipmentState;
}

export interface RunState {
  zoneIndex: number;
  nodeIndex: number;     // -1 = aún no avanza al primer nodo
  map: MapNode[];
  trapDebuffActive: boolean;
  buffs: TempBuff[];
  endlessTier: number;   // 0 = campaña; >=1 = vueltas del Abismo
}

export interface MetaState {
  muted: boolean;
  seenPrologue: boolean;
  unlockedChapters: number[];
  campaignDone: boolean;
}

export interface GameState {
  version: number;
  player: PlayerState;
  run: RunState;
  meta: MetaState;
}

// Estado de combate en runtime (no se persiste)
export interface CombatEnemy {
  def: EnemyDef;
  name: string;
  level: number;
  maxHp: number;
  hp: number;
  atk: number;
  attackInterval: number;
  attackTimer: number;
  isBoss: boolean;
  isElite: boolean;
  isMimic: boolean;
  statuses: StatusEffect[];
  goldReward: number;
  xpReward: number;
}
