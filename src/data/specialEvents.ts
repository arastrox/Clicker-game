import type { EventType } from '@/core/types';

// Pesos de aparición de cada evento especial (nodo tipo "event")
export const EVENT_WEIGHTS: { type: EventType; weight: number }[] = [
  { type: 'merchant', weight: 28 },
  { type: 'mimic', weight: 18 },
  { type: 'trap', weight: 14 },
  { type: 'altar', weight: 12 },
  { type: 'moral', weight: 12 },
  { type: 'spring', weight: 10 },
  { type: 'blessing', weight: 6 },
];

export interface EventCopy {
  title: string;
  emoji: string;
  text: string;
}

export const EVENT_COPY: Record<EventType, EventCopy> = {
  merchant: {
    title: 'Mercader Errante', emoji: '🏪',
    text: 'Un mercader encapuchado monta su puesto en mitad del sendero. "Todo héroe necesita acero y pociones", sonríe. "Y todo acero tiene su precio."',
  },
  mimic: {
    title: 'Un Cofre Solitario', emoji: '📦',
    text: 'Un cofre reluciente descansa en mitad del camino. Nadie deja un cofre así sin razón... ¿verdad?',
  },
  trap: {
    title: '¡Una Trampa!', emoji: '🌿',
    text: 'El suelo cede bajo tus pies: púas, redes y un polvo extraño que te nubla los sentidos. Sales malherido y debilitado hasta que la sangre vuelva a hervir en combate.',
  },
  altar: {
    title: 'Altar Olvidado', emoji: '🗿',
    text: 'Un altar de piedra cubierto de musgo emana una calidez antigua. Las runas talladas parecen reconocerte.',
  },
  moral: {
    title: 'El Espíritu Encadenado', emoji: '⛓️',
    text: 'Un espíritu pálido te observa, atado al tronco de un árbol con cadenas rúnicas. "Libérame", susurra, "y compartiré mi tesoro... o quédate mi cadena, y véndela. Tú eliges, mortal."',
  },
  spring: {
    title: 'Manantial Encantado', emoji: '⛲',
    text: 'Un manantial de aguas cristalinas brota entre las rocas. El agua brilla con una luz suave y huele a amanecer.',
  },
  blessing: {
    title: 'Bendición del Viajero', emoji: '✨',
    text: 'Una figura translúcida —quizás un dios menor, quizás un recuerdo del mundo de antes— posa su mano sobre tu hombro y murmura palabras en un idioma que ya nadie habla.',
  },
};
