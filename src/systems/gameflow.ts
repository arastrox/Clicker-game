import { createNewState, getState, setState } from '@/core/state';
import { saveGame, deleteSave } from '@/core/save';
import { bus, log } from '@/core/events';
import { generateZoneMap, currentZone, enemyLevelFor } from './map';
import {
  spawnEnemyForNode, setCurrentNode, clearEnemy, revivePlayer, healPlayer,
  applyPotion, addRegenBuff,
} from './combat';
import { generateItem, addToInventory } from './inventory';
import { gainGold, gainXp } from './progression';
import { getMaxHp, xpToNext } from './stats';
import { chance, pick, randInt } from './rng';
import { ZONES, CAMPAIGN_ZONES } from '@/data/zones';
import { POTIONS, RARITY_INFO, type PotionDef } from '@/data/items';
import type { ClassId, EnemyDef, EventType, Item, MapNode } from '@/core/types';

// ─── Inicio / continuación ──────────────────────────────────────────────────

export function startNewGame(name: string, classId: ClassId): void {
  const s = createNewState(name, classId);
  setState(s);
  s.player.hp = getMaxHp();
  s.run.map = generateZoneMap();
  saveGame();
  bus.emit('game:started');
  bus.emit('zone:enter', { zoneIndex: 0 });
  bus.emit('arena:cleared'); // muestra el botón de avanzar bajo el prólogo
  bus.emit('story:show', { chapterIndex: -1 }); // prólogo
  bus.emit('state:changed');
}

export function continueGame(): void {
  const s = getState();
  if (s.run.map.length === 0) s.run.map = generateZoneMap();
  if (s.player.hp <= 0) s.player.hp = Math.round(getMaxHp() * 0.5);
  bus.emit('game:started');
  bus.emit('zone:enter', { zoneIndex: s.run.zoneIndex });
  // re-mostrar el nodo actual (o esperar avance)
  const node = s.run.map[s.run.nodeIndex];
  if (node && !node.done) {
    resolveNode(node);
  } else {
    clearEnemy();
    setCurrentNode(null);
    bus.emit('arena:cleared');
  }
  bus.emit('state:changed');
}

export function resetGame(): void {
  deleteSave();
  location.reload();
}

// ─── Avance por el sendero ──────────────────────────────────────────────────

export function advance(): void {
  const s = getState();
  // si el nodo actual quedó sin resolver (p. ej. tras revivir), se reintenta
  const current = s.run.map[s.run.nodeIndex];
  if (current && !current.done) {
    bus.emit('node:advance', { node: current, index: s.run.nodeIndex, total: s.run.map.length });
    resolveNode(current);
    return;
  }
  if (s.run.nodeIndex >= s.run.map.length - 1) return; // el jefe es el último nodo
  s.run.nodeIndex += 1;
  const node = s.run.map[s.run.nodeIndex];
  bus.emit('node:advance', { node, index: s.run.nodeIndex, total: s.run.map.length });
  resolveNode(node);
  saveGame();
}

function resolveNode(node: MapNode): void {
  setCurrentNode(node);
  const zone = currentZone();

  switch (node.type) {
    case 'enemy':
    case 'elite': {
      const def = pick(zone.enemies);
      spawnEnemyForNode(node, def);
      log(`${node.type === 'elite' ? '⭐ Un enemigo de élite aparece' : '⚔️ Un enemigo bloquea el sendero'}: ${def.name}`, 'combat');
      break;
    }
    case 'boss': {
      spawnEnemyForNode(node, zone.boss, { boss: true });
      log(`👑 ¡JEFE DE ZONA! ${zone.boss.name}, ${zone.boss.title}`, 'danger');
      break;
    }
    case 'rest': {
      clearEnemy();
      bus.emit('arena:rest');
      log('⛺ Encuentras un lugar seguro para descansar', 'event');
      break;
    }
    case 'event': {
      clearEnemy();
      bus.emit('arena:event', { eventType: node.eventType! });
      break;
    }
  }
  bus.emit('state:changed');
}

// ─── Descanso ───────────────────────────────────────────────────────────────

export function restHeal(): void {
  healPlayer(Math.round(getMaxHp() * 0.3));
  finishEventNode();
}

export function skipRest(): void {
  finishEventNode();
}

// ─── Eventos especiales ─────────────────────────────────────────────────────

const SPIRIT_DEF: EnemyDef = { id: 'spirit', name: 'Espíritu Traicionero', spriteKey: 'ice_zombie', scale: 4, tint: 0xaaffee };
const MIMIC_DEF: EnemyDef = { id: 'mimic', name: '¡MIMIC!', spriteKey: 'chest_mimic_open', scale: 5 };
const RIVAL_DEF: EnemyDef = { id: 'rival', name: 'Bigotes de Hierro', spriteKey: 'cat', scale: 3, tint: 0xcc7744, hasRunAnim: true };

export type EventOutcome = { kind: 'text'; text: string } | { kind: 'combat' };

const text = (t: string): EventOutcome => ({ kind: 'text', text: t });
const COMBAT: EventOutcome = { kind: 'combat' };

// Marca el nodo actual como resuelto y muestra el botón de avanzar
export function finishEventNode(): void {
  const s = getState();
  const node = s.run.map[s.run.nodeIndex];
  if (node) node.done = true;
  saveGame();
  bus.emit('arena:cleared');
}

// Resuelve la elección de un evento. Aplica los efectos y devuelve el
// desenlace narrativo (o inicia un combate-variante).
export function resolveEventChoice(type: EventType, choiceId: string): EventOutcome {
  const s = getState();
  const node = s.run.map[s.run.nodeIndex];
  const lvl = enemyLevelFor(s.run.nodeIndex);
  const key = `${type}:${choiceId}`;

  switch (key) {
    // ── Mimic ──
    case 'mimic:open': {
      log('📦 El cofre abre los ojos... ¡ES UN MIMIC!', 'danger');
      if (node) spawnEnemyForNode(node, MIMIC_DEF, { mimic: true, nameOverride: '¡MIMIC!' });
      return COMBAT;
    }
    case 'mimic:ignore':
      log('🚶 Decides no tentar a la suerte', 'event');
      return text('Le das al cofre un rodeo amplio y digno, con la cola en alto. Cuando miras atrás, juras que la cerradura te guiña un ojo. Algunas curiosidades es mejor dejarlas con hambre.');

    // ── Trampa ──
    case 'trap:careful': {
      const dmg = Math.round(getMaxHp() * 0.1);
      s.player.hp = Math.max(1, s.player.hp - dmg);
      s.run.trapDebuffActive = true;
      log(`🪤 Te liberas con cuidado (-${dmg} HP), pero el veneno te debilita`, 'danger');
      return text(`Trabajas el cepo con paciencia felina, diente a diente, y la pata sale casi entera (-${dmg} vida). Pero el polvo de los cazadores ya está en tu sangre: te sientes torpe y lenta (-20% Daño, -3 Defensa) hasta que el calor de una victoria lo queme.`);
    }
    case 'trap:force': {
      const dmg = Math.round(getMaxHp() * 0.25);
      s.player.hp = Math.max(1, s.player.hp - dmg);
      log(`💢 Fuerzas el cepo de un tirón (-${dmg} HP)`, 'danger');
      return text(`Aprietas los dientes y tiras. El cepo se abre con un chasquido horrible y un mechón de tu pelaje se queda en el hierro (-${dmg} vida). Duele como mil escaleras, pero el polvo no llegó a tu sangre: sales cojeando, furiosa y entera.`);
    }

    // ── Altar ──
    case 'altar:pray': {
      const xp = Math.round(xpToNext(s.player.level) * 0.4);
      gainXp(xp);
      log(`🗿 El altar reconoce tu causa. +${xp} XP`, 'event');
      return text(`Te sientas frente al altar y cierras los ojos. Por un momento sueñas el sueño de la Gran Gata: tejados infinitos, cuencos llenos, ratones lentos. Despiertas sabiendo cosas que no sabías (+${xp} XP).`);
    }
    case 'altar:offer': {
      const cost = lvl * 5;
      if (s.player.gold < cost) return text('Vacías tus alforjas frente al altar... y no juntas ni para una vela. Las runas se apagan con algo que se siente sospechosamente como un bostezo divino.');
      s.player.gold -= cost;
      const xp = Math.round(xpToNext(s.player.level) * 0.8);
      gainXp(xp);
      log(`🪙 Ofrendas ${cost} de oro. El altar resplandece: +${xp} XP`, 'event');
      return text(`Dejas ${cost} de oro en el cuenco de ofrendas. Las runas estallan en luz dorada y la voz de mil ronroneos te atraviesa el pecho (+${xp} XP). El oro, comprendes, nunca fue para la diosa: era para medir cuánto estabas dispuesta a soltar.`);
    }

    // ── Espíritu encadenado ──
    case 'moral:free': {
      if (chance(60)) {
        if (chance(50)) {
          const item: Item = generateItem(lvl, { rarityBonus: 25 });
          const added = addToInventory(item);
          log(`⛓️ El espíritu cumple su palabra: ${RARITY_INFO[item.rarity].emoji} ${item.name}`, 'loot');
          return text(`Rompes las cadenas de un zarpazo. El espíritu se estira como quien despierta de una siesta de cien años y, antes de disolverse en luz, deja caer algo a tus pies: ${item.name}${added ? '' : ' (que se pierde — tu mochila está llena)'}. "La verdad paga", susurra. "Tarde, pero paga."`);
        }
        const gold = lvl * 15 + randInt(5, 25);
        gainGold(gold);
        log(`⛓️ El espíritu se desvanece dejando ${gold} de oro`, 'loot');
        return text(`Rompes las cadenas. El espíritu ronronea por primera vez en un siglo y se deshace en motas de luz que, al tocar el suelo, suenan a metal: ${gold} de oro en monedas antiguas. En una de ellas está grabada una gata con tu misma mirada.`);
      }
      log('⛓️ ¡El espíritu era una trampa!', 'danger');
      if (node) spawnEnemyForNode(node, SPIRIT_DEF, { nameOverride: 'Espíritu Traicionero' });
      return COMBAT;
    }
    case 'moral:sell': {
      const gold = lvl * 8 + randInt(0, 10);
      gainGold(gold);
      log(`⛓️ Vendes la cadena rúnica por ${gold} de oro`, 'event');
      return text(`Arrancas la cadena con cuidado de no tocar al espíritu, que te observa hacerlo sin decir palabra. El metal encantado vale ${gold} de oro. Mientras te alejas, oyes su voz de hojas secas: "No te maldigo, cazadora. La memoria lo hará por mí."`);
    }

    // ── Manantial ──
    case 'spring:drink': {
      healPlayer(Math.round(getMaxHp() * 0.5));
      log('⛲ Bebes del manantial de Leche de Luna', 'event');
      return text('Bebes a lengüetazos largos, sin dignidad alguna, y no te importa. La Leche de Luna sabe a infancia y a tejado tibio. Las heridas se cierran solas, y por un momento — solo un momento — vuelves a tener seis vidas por delante.');
    }
    case 'spring:soak': {
      healPlayer(Math.round(getMaxHp() * 0.25));
      addRegenBuff(4, 45);
      log('🛁 Te remojas en el manantial: regeneración prolongada', 'event');
      return text('Contra todos tus instintos felinos, te metes al agua. Y es gloriosa. La Leche de Luna empapa cada herida vieja y deja algo trabajando dentro (+25% vida y regeneración prolongada). Sales chorreando y renovada, con la dignidad sacrificada en el altar de la salud.');
    }

    // ── Bendición ──
    case 'blessing:accept': {
      s.run.buffs.push({ label: 'Bendición del Tejado', clickDmgPct: 0.15, critPct: 10, combatsLeft: 3 });
      log('✨ Bendición: +15% Daño y +10% Crítico por 3 combates', 'event');
      return text('La pata de luz se posa entre tus orejas y el mundo se vuelve más nítido: cada sombra un escondite, cada brillo un blanco. "Caza bien, pequeña", murmura la diosa menor antes de deshacerse en polvo de estrellas (+15% Daño, +10% Crítico durante 3 combates).');
    }

    // ── Gata Errante ──
    case 'stranger:share': {
      const cost = 10 + lvl * 3;
      if (s.player.gold < cost) return text('Revisas tus alforjas: migajas y pelusa. La gata negra te mira sin reproche. "El gesto cuenta", dice, y desaparece sendero abajo. Te quedas con la extraña sensación de haber fallado una prueba... o aprobado otra.');
      s.player.gold -= cost;
      if (chance(70)) {
        s.run.buffs.push({ label: 'Gratitud de la Errante', clickDmgPct: 0.2, critPct: 8, combatsLeft: 4 });
        log(`🐈‍⬛ Compartes provisiones (${cost} 🪙). La Errante te bendice`, 'event');
        return text(`Compartes tu comida (${cost} de oro) y cenan juntas en silencio, como hacen las gatas serias. Al terminar, la Errante te toca la frente con la pata: "Lo que diste vuelve doble. Es la única ley que nunca me falló." Sientes sus años de caminos pasar a tus garras (+20% Daño, +8% Crítico por 4 combates).`);
      }
      const item = generateItem(lvl, { rarityBonus: 30 });
      const added = addToInventory(item);
      log(`🐈‍⬛ La Errante te paga con un tesoro: ${item.name}`, 'loot');
      return text(`Compartes tu comida (${cost} de oro). La Errante come despacio, agradecida, y luego escarba en su morral de viajes: "Esto pesa demasiado para mis años." Te entrega ${item.name}${added ? '' : ' (que se pierde — mochila llena)'} y se va sin despedirse, como las leyendas.`);
    }
    case 'stranger:refuse': {
      if (chance(20)) {
        s.run.buffs.push({ label: 'Mal de Ojo', clickDmgPct: -0.1, combatsLeft: 1 });
        log('🐈‍⬛ La Errante te mira fijo. Sientes un escalofrío...', 'danger');
        return text('Pasas de largo. La gata negra no dice nada — solo te sigue con esos ojos amarillos que no parpadean, y el silencio se te mete bajo el pelaje como humedad (-10% Daño en el próximo combate). Quizás no era una mendiga cualquiera. Quizás nadie lo es.');
      }
      return text('Pasas de largo con un nudo pequeño en el estómago. La Errante no insiste: vuelve a mirar el horizonte como si tú nunca hubieras existido. A veces el camino solo te pide pasar. A veces.');
    }

    // ── Santuario olvidado ──
    case 'shrine:blood': {
      const dmg = Math.round(getMaxHp() * 0.25);
      s.player.hp = Math.max(1, s.player.hp - dmg);
      if (chance(50)) {
        const item = generateItem(lvl, { rarityBonus: 45 });
        const added = addToInventory(item);
        log(`🩸 El santuario acepta tu sangre: ${RARITY_INFO[item.rarity].emoji} ${item.name}`, 'loot');
        return text(`Te muerdes la almohadilla y dejas caer tres gotas en el cuenco (-${dmg} vida). Las velas se encienden solas con llama violeta y la estatua sin rostro GIRA LA CABEZA hacia ti. Cuando el aire vuelve a moverse, hay algo en el cuenco que antes no estaba: ${item.name}${added ? '' : ' (perdido — mochila llena)'}.`);
      }
      log('🩸 El santuario bebe tu sangre... y no responde', 'danger');
      return text(`Te muerdes la almohadilla y ofreces tu sangre (-${dmg} vida). Las velas chisporrotean... y se apagan. El cuenco bebe en silencio y no devuelve nada. Las viejas leyes nunca prometieron justicia: solo hambre. Te vendas la pata y sigues.`);
    }
    case 'shrine:pray': {
      healPlayer(Math.round(getMaxHp() * 0.15));
      return text('Enciendes las velas una a una con chispas de pedernal y rezas bajito, sin pedir nada — las abuelas decían que esos son los únicos rezos que se escuchan. Un calor pequeño y limpio te recorre el lomo (+15% vida). La estatua, jurarías, sonríe.');
    }

    // ── Gatito perdido ──
    case 'kitten:feed': {
      const cost = 10 + lvl * 2;
      if (s.player.gold < cost) {
        const xp = Math.round(xpToNext(s.player.level) * 0.2);
        gainXp(xp);
        return text(`No tienes nada que darle... así que le das lo único que queda: tu calor. Lo acurrucas contra tu pelaje hasta que deja de temblar y le enseñas el camino al refugio del valle, paso a paso, maullando indicaciones. Lo ves partir y algo en ti pesa y brilla a la vez (+${xp} XP).`);
      }
      s.player.gold -= cost;
      const xp = Math.round(xpToNext(s.player.level) * 0.5);
      gainXp(xp);
      s.run.buffs.push({ label: 'Corazón Tibio', clickDmgPct: 0.1, combatsLeft: 3 });
      log(`🐱 Alimentas al gatito (${cost} 🪙). +${xp} XP`, 'event');
      return text(`Gastas tus provisiones (${cost} de oro) en el estómago más agradecido de Felandia. El gatito come, ronronea como un motor diminuto y te sigue con la mirada mientras le señalas el camino al refugio. "Cuando sea grande", maúlla, "voy a ser como tú." Caminas más liviana el resto del día (+${xp} XP, +10% Daño por 3 combates).`);
    }
    case 'kitten:ignore':
      return text('Endureces el corazón y sigues caminando. Es lo táctico. Es lo sensato. El maullido se apaga a tu espalda y no miras atrás, porque las cazadoras no miran atrás. Esa noche, cuando el viento silba, suena exactamente como aquel maullido. El camino no te juzga. Tú sí.');

    // ── Emboscada ──
    case 'ambush:fight': {
      s.run.buffs.push({ label: 'Sorpresa', defenseFlat: -2, combatsLeft: 1 });
      const def = pick(currentZone().enemies);
      log('⚠️ ¡Plantas cara a la emboscada!', 'danger');
      if (node) spawnEnemyForNode(node, def, { elite: true, nameOverride: `${def.name} Emboscador`, lootBonus: 15, guaranteedLoot: true });
      return COMBAT;
    }
    case 'ambush:flee': {
      const lost = Math.round(s.player.gold * 0.1);
      s.player.gold -= lost;
      log(`💨 Huyes por los tejados (-${lost} 🪙)`, 'event');
      return text(`Saltas al tejado más cercano y corres como solo corren los gatos que quieren vivir: sin elegancia y sin vergüenza. Las garras enemigas arañan el aire donde estabas y tu bolsa se engancha en una veleta (-${lost} oro). Caro, pero más barato que un funeral.`);
    }

    // ── Rival ──
    case 'rival:duel': {
      log('😼 ¡Aceptas el duelo contra Bigotes de Hierro!', 'danger');
      if (node) spawnEnemyForNode(node, RIVAL_DEF, { elite: true, nameOverride: 'Bigotes de Hierro', lootBonus: 45, guaranteedLoot: true });
      return COMBAT;
    }
    case 'rival:decline':
      return text('"Otro día, Bigotes", dices, rodeándolo con la cortesía exacta que se le debe a alguien que podría arrancarte una oreja. El duelista se ríe con su risa de lija: "Las leyendas no dicen \'otro día\', pequeña. Pero está bien. Te estaré mirando." Y lo peor es que sabes que es cierto.');

    // ── Bruja del Páramo ──
    case 'curse:pay': {
      const cost = lvl * 5;
      if (s.player.gold < cost) {
        s.run.buffs.push({ label: 'Maldición del Páramo', clickDmgPct: -0.15, combatsLeft: 1 });
        log('🌙 No te alcanza el oro. La bruja cobra en suerte...', 'danger');
        return text(`Vacías la bolsa: no alcanza. La bruja ni se inmuta — mete un cucharón en el caldero y te salpica algo frío que huele a invierno. "Entonces pagas en suerte", grazna (-15% Daño hasta tu próxima victoria). El peaje, comprendes, nunca fue opcional.`);
      }
      s.player.gold -= cost;
      s.run.buffs.push({ label: 'Suerte Comprada', critPct: 6, combatsLeft: 3 });
      log(`🪙 Pagas ${cost} de oro a la bruja`, 'event');
      return text(`Dejas caer ${cost} de oro en el caldero, donde desaparece sin hacer "plop" — mala señal en cualquier caldero. La bruja asiente y te lanza un puñado de polvo plateado que se pega a tus bigotes: "Propina de la casa" (+6% Crítico por 3 combates). Sales del páramo sin mirar atrás.`);
    }
    case 'curse:refuse': {
      s.run.buffs.push({ label: 'Maldición del Páramo', clickDmgPct: -0.15, combatsLeft: 1 });
      log('🌙 La bruja te maldice: -15% Daño hasta vencer un combate', 'danger');
      return text('"No pago peajes inventados", dices, y pasas de largo con la cola en alto. La bruja no grita ni amenaza: solo sonríe con sus tres dientes y remueve el caldero un poco más rápido. Diez pasos después sientes las garras pesadas y el pulso torpe (-15% Daño hasta tu próxima victoria). El orgullo, como todo en el páramo, tiene tarifa.');
    }
  }
  return text('El camino continúa.');
}

// ─── Mercader ───────────────────────────────────────────────────────────────

export interface MerchantStock {
  items: (Item | null)[];
  potions: PotionDef[];
}

let merchantStock: MerchantStock | null = null;

export function getMerchantStock(): MerchantStock {
  const s = getState();
  if (!merchantStock) {
    const lvl = enemyLevelFor(s.run.nodeIndex);
    const count = randInt(3, 4);
    const items: Item[] = [];
    for (let i = 0; i < count; i++) {
      const bonusLvl = chance(10) ? 3 : 0; // 10% de ítem de nivel superior
      items.push(generateItem(lvl + bonusLvl, { rarityBonus: 6 }));
    }
    merchantStock = {
      items,
      potions: POTIONS.filter((p) => !p.mageOnly || s.player.classId === 'mage'),
    };
  }
  return merchantStock;
}

export function merchantItemPrice(item: Item): number {
  return Math.max(5, Math.round(item.sellValue * 2.5));
}

export function buyMerchantItem(index: number): boolean {
  const s = getState();
  const stock = getMerchantStock();
  const item = stock.items[index];
  if (!item) return false;
  const price = merchantItemPrice(item);
  if (s.player.gold < price) return false;
  if (!addToInventory(item)) return false;
  s.player.gold -= price;
  stock.items[index] = null;
  log(`🏪 Compras ${item.name} por ${price} 🪙`, 'loot');
  saveGame();
  bus.emit('state:changed');
  return true;
}

export function buyPotion(potionId: string): boolean {
  const s = getState();
  const potion = POTIONS.find((p) => p.id === potionId);
  if (!potion || s.player.gold < potion.price) return false;
  s.player.gold -= potion.price;
  applyPotion(potionId);
  saveGame();
  bus.emit('state:changed');
  return true;
}

export function leaveMerchant(): void {
  merchantStock = null;
  log('🏪 El mercader recoge su puesto y desaparece sendero abajo', 'event');
  finishEventNode();
}

// ─── Jefes, capítulos y cambio de zona ──────────────────────────────────────

bus.on('combat:bossDefeated', ({ zoneIndex }) => {
  const s = getState();
  if (zoneIndex < CAMPAIGN_ZONES && !s.meta.unlockedChapters.includes(zoneIndex)) {
    s.meta.unlockedChapters.push(zoneIndex);
    if (zoneIndex === CAMPAIGN_ZONES - 1) s.meta.campaignDone = true;
    saveGame();
    bus.emit('story:show', { chapterIndex: zoneIndex });
  } else {
    // jefe del Abismo: siguiente ciclo
    log(`🕳️ Ciclo ${s.run.endlessTier + 1} del Abismo superado. La oscuridad se hace más densa...`, 'danger');
    bus.emit('arena:cleared');
  }
});

// Llamado al cerrar el modal de historia de un capítulo (avance de zona)
export function proceedToNextZone(): void {
  const s = getState();
  if (s.run.zoneIndex < ZONES.length - 1) {
    s.run.zoneIndex += 1;
  } else {
    s.run.endlessTier += 1; // el Abismo se repite, cada vez más letal
  }
  s.run.nodeIndex = -1;
  s.run.map = generateZoneMap();
  clearEnemy();
  setCurrentNode(null);
  const zone = ZONES[s.run.zoneIndex];
  log(`${zone.emoji} Entras en: ${zone.name}`, 'event');
  saveGame();
  bus.emit('zone:enter', { zoneIndex: s.run.zoneIndex });
  bus.emit('arena:cleared');
  bus.emit('state:changed');
}

// El jefe del Abismo también regenera el mapa al avanzar
bus.on('arena:cleared', () => {
  const s = getState();
  const atEnd = s.run.nodeIndex >= s.run.map.length - 1;
  const bossDone = s.run.map[s.run.map.length - 1]?.done;
  if (atEnd && bossDone && s.run.zoneIndex === ZONES.length - 1) {
    s.run.nodeIndex = -1;
    s.run.map = generateZoneMap();
    saveGame();
  }
});

// ─── Muerte ─────────────────────────────────────────────────────────────────

export function reviveAndRetry(): void {
  revivePlayer();
  // la jugadora decide cuándo reintentar: puede equiparse y gastar puntos antes
  log('🔥 Despiertas junto a la fogata. Acicálate y prepárate antes de volver al sendero...', 'event');
  bus.emit('arena:cleared');
}
