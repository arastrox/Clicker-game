import type { ItemSlot, Rarity, UniqueEffect } from '@/core/types';

export const RARITY_INFO: Record<Rarity, { name: string; color: string; emoji: string; statMult: number; sellMult: number }> = {
  comun: { name: 'Común', color: '#b0bec5', emoji: '⚪', statMult: 1, sellMult: 1 },
  raro: { name: 'Raro', color: '#42a5f5', emoji: '🔵', statMult: 1.6, sellMult: 2.2 },
  epico: { name: 'Épico', color: '#ab47bc', emoji: '🟣', statMult: 2.5, sellMult: 5 },
  legendario: { name: 'Legendario', color: '#ffa726', emoji: '🟠', statMult: 4, sellMult: 12 },
};

export const RARITY_ORDER: Rarity[] = ['comun', 'raro', 'epico', 'legendario'];

// Pools de nombres por slot y rareza
export const ITEM_NAMES: Record<ItemSlot, Record<Rarity, string[]>> = {
  weapon: {
    comun: ['Espada Oxidada', 'Daga Mellada', 'Garrote de Leñador', 'Hoja de Aprendiz', 'Machete Gastado', 'Cuchillo de Cocina'],
    raro: ['Espada del Soldado', 'Hacha de Guerra', 'Filo Sombrío', 'Maza Tachonada', 'Katana del Ronin', 'Lanza del Vigía'],
    epico: ['Colmillo del Crepúsculo', 'Hoja del Vendaval', 'Martillo del Juicio', 'Sierra Carmesí', 'Bastón de Llamas Verdes', 'Espada del Duelista'],
    legendario: ['Filo del Dragón Dorado', 'Rompealmas', 'Última Palabra', 'Hoja Gemela del Alba', 'Bastón del Núcleo Rojo', 'Veredicto del Rey Caído'],
  },
  armor: {
    comun: ['Cota Remendada', 'Peto de Cuero', 'Túnica de Viajero', 'Camisa Acolchada', 'Chaleco de Caza'],
    raro: ['Coraza del Centinela', 'Malla de Escamas', 'Manto del Errante', 'Peto Forjado', 'Armadura del Guardabosque'],
    epico: ['Égida del Custodio', 'Coraza de Cristal Tejido', 'Manto del Eclipse', 'Placas del Coloso', 'Vestidura del Archimago'],
    legendario: ['Bastión Eterno', 'Piel del Mundo', 'Coraza del Sol Hundido', 'Sudario del Rey Hechicero', 'Égida del Primer Héroe'],
  },
  accessory: {
    comun: ['Amuleto de Hueso', 'Anillo de Cobre', 'Talismán Agrietado', 'Colgante de Cuarzo', 'Brazalete de Cuero'],
    raro: ['Sello del Mercader', 'Anillo de Jade', 'Amuleto del Búho', 'Gema del Murmullo', 'Insignia del Explorador'],
    epico: ['Ojo de la Tormenta', 'Reliquia del Santuario', 'Anillo del Eco Doble', 'Corazón de Cristal', 'Medallón del Cazador'],
    legendario: ['Lágrima del Abismo', 'Corona Menor del Hechicero', 'Sello del Pacto Antiguo', 'Estrella Encadenada', 'Fragmento del Alba'],
  },
};

// Sprites de arma del 0x72 por tier (se elige según rareza)
export const WEAPON_SPRITES: Record<Rarity, string[]> = {
  comun: ['weapon_rusty_sword', 'weapon_knife', 'weapon_machete', 'weapon_cleaver'],
  raro: ['weapon_regular_sword', 'weapon_axe', 'weapon_mace', 'weapon_spear', 'weapon_katana'],
  epico: ['weapon_duel_sword', 'weapon_saw_sword', 'weapon_big_hammer', 'weapon_waraxe', 'weapon_green_magic_staff', 'weapon_baton_with_spikes'],
  legendario: ['weapon_golden_sword', 'weapon_lavish_sword', 'weapon_red_gem_sword', 'weapon_anime_sword', 'weapon_red_magic_staff'],
};

// Íconos Kenney (tiles 16x16) para armadura/accesorio
export const ARMOR_SPRITE = 'kenney_102';      // escudo
export const ACCESSORY_SPRITE = 'kenney_113';  // poción azul como amuleto base — se tinta por rareza

// Efectos únicos (solo épico/legendario)
export const UNIQUE_EFFECTS: UniqueEffect[] = [
  { id: 'lifesteal', label: 'Sed de Sangre', desc: 'Drena 5% del daño de click como vida', value: 0.05 },
  { id: 'pierce', label: 'Perforante', desc: '15% de prob. de ignorar la defensa enemiga... y la tuya no importa: el golpe es directo', value: 0.15 },
  { id: 'goldfind', label: 'Codicia', desc: '+25% de oro obtenido', value: 0.25 },
  { id: 'xpboost', label: 'Sabiduría', desc: '+15% de experiencia obtenida', value: 0.15 },
  { id: 'thorns', label: 'Espinas', desc: 'Devuelve 20% del daño recibido', value: 0.2 },
  { id: 'executioner', label: 'Verdugo', desc: '+50% de daño a enemigos bajo 25% de vida', value: 0.5 },
];

// Pociones del mercader
export interface PotionDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  desc: string;
  mageOnly?: boolean;
}

export const POTIONS: PotionDef[] = [
  { id: 'potion_hp', name: 'Poción de Vida', emoji: '🧪', price: 15, desc: 'Cura el 50% de la vida máxima al instante' },
  { id: 'potion_str', name: 'Poción de Fuerza', emoji: '💪', price: 20, desc: '+25% Daño de Click durante el próximo combate' },
  { id: 'potion_regen', name: 'Poción de Regeneración', emoji: '💚', price: 25, desc: 'Regenera 5 HP por segundo durante 30s' },
  { id: 'potion_mana', name: 'Poción de Maná', emoji: '🔷', price: 15, desc: 'Restaura todo el Maná', mageOnly: true },
];
