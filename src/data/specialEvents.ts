import type { EventType } from '@/core/types';

// Pesos de aparición de cada evento especial (nodo tipo "event")
export const EVENT_WEIGHTS: { type: EventType; weight: number }[] = [
  { type: 'merchant', weight: 20 },
  { type: 'mimic', weight: 10 },
  { type: 'trap', weight: 9 },
  { type: 'altar', weight: 8 },
  { type: 'moral', weight: 8 },
  { type: 'spring', weight: 8 },
  { type: 'blessing', weight: 5 },
  { type: 'stranger', weight: 7 },
  { type: 'shrine', weight: 6 },
  { type: 'kitten', weight: 6 },
  { type: 'ambush', weight: 7 },
  { type: 'rival', weight: 6 },
  { type: 'curse', weight: 5 },
];

export interface EventChoiceDef {
  id: string;
  label: string;
  danger?: boolean;
  ghost?: boolean;
}

export interface EventCopy {
  title: string;
  emoji: string;
  text: string;
  choices: EventChoiceDef[];
}

export const EVENT_COPY: Record<EventType, EventCopy> = {
  merchant: {
    title: 'El Último Mercader', emoji: '🏪',
    text: 'Entre la niebla del sendero aparece un puesto de madera tirado por un burro flaco. Lo atiende un humano viejo de manos amables — dicen que es el último de su especie que aún les vende a los gatos, porque una gata le salvó la vida cuando era niño. "Acero, pociones y hierba gatuna fresca", anuncia con una sonrisa desdentada. "Y para ti, cazadora, precio de amiga."',
    choices: [{ id: 'leave', label: '👋 Despedirse del mercader', ghost: true }],
  },
  mimic: {
    title: 'Un Cofre Solitario', emoji: '📦',
    text: 'Un cofre reluciente descansa en mitad del camino, con la tapa entreabierta y un brillo dorado asomando por la rendija. Tus bigotes vibran con una advertencia antigua: en Felandia nadie abandona un tesoro... a menos que el tesoro tenga dientes. Pero la curiosidad ronronea dentro de ti, y ya sabes lo que dicen sobre la curiosidad y los gatos.',
    choices: [
      { id: 'open', label: '📦 Abrir el cofre', danger: true },
      { id: 'ignore', label: '🚶 Rodearlo con cuidado', ghost: true },
    ],
  },
  trap: {
    title: 'Trampa de Cazadores', emoji: '🪤',
    text: '¡CLAC! El suelo cede y un cepo de hierro oxidado se cierra sobre tu pata trasera. Los cazadores del Lince siembran el sendero con estas cosas, untadas en un polvo que nubla los sentidos felinos. El dolor es agudo, pero el cepo es viejo: puedes liberarte. La pregunta es cómo.',
    choices: [
      { id: 'careful', label: '🐾 Liberarte con cuidado (daño leve + debilidad)', danger: false },
      { id: 'force', label: '💢 Forzar el cepo de un tirón (mucho daño, sin secuelas)', danger: true },
    ],
  },
  altar: {
    title: 'Altar de la Gran Gata', emoji: '🗿',
    text: 'Un altar de piedra cubierto de musgo se alza entre los helechos, tallado con la silueta de una gata enorme que duerme enroscada alrededor de una luna. Es un santuario de la Gran Gata, la que según las abuelas teje los destinos con estambre de estrellas. Las runas talladas parecen reconocerte: se encienden tenuemente al acercarte.',
    choices: [
      { id: 'pray', label: '🙏 Rezar ante el altar (+XP)' },
      { id: 'offer', label: '🪙 Ofrendar oro (+XP doble)' },
    ],
  },
  moral: {
    title: 'El Espíritu Encadenado', emoji: '⛓️',
    text: 'Un espíritu pálido con forma de gato translúcido te observa desde el tronco de un árbol muerto, atado con cadenas rúnicas que zumban de magia vieja. "Cazadora", susurra con voz de hojas secas, "el Lince me ató aquí hace cien años por decirle la verdad. Libérame y compartiré mi tesoro... o arranca la cadena y véndela, que el metal encantado vale buen oro. Tú eliges. No te juzgaré. Mucho."',
    choices: [
      { id: 'free', label: '⛓️ Liberar al espíritu (riesgo)', danger: true },
      { id: 'sell', label: '🪙 Arrancar la cadena y venderla (seguro)' },
    ],
  },
  spring: {
    title: 'Manantial de Leche de Luna', emoji: '⛲',
    text: 'Entre las rocas brota un manantial de aguas blancas y tibias que huelen a amanecer y a leche dulce. Las leyendas lo llaman Leche de Luna: dicen que la Gran Gata derramó su cuenco aquí cuando el mundo era joven, y que sus aguas curan todo menos la melancolía. Un sorbo bastaría. Quedarte a beber con calma, mejor aún.',
    choices: [
      { id: 'drink', label: '⛲ Beber a lengüetazos (+50% Vida)' },
      { id: 'soak', label: '🛁 Remojarte entera (+25% Vida y regeneración)' },
    ],
  },
  blessing: {
    title: 'La Bendición del Tejado', emoji: '✨',
    text: 'Una figura translúcida se materializa sobre una rama: una gata hecha de polvo de estrellas, con ojos como dos lunas pequeñas. No dice su nombre — los dioses menores nunca lo hacen — pero posa una pata de luz sobre tu cabeza y murmura palabras en el idioma que los gatos solo recuerdan cuando duermen. Sientes las garras más afiladas y el pulso más certero.',
    choices: [{ id: 'accept', label: '✨ Aceptar la bendición' }],
  },
  stranger: {
    title: 'La Gata Errante', emoji: '🐈‍⬛',
    text: 'Junto al sendero, sentada sobre una piedra como si la hubieran esculpido ahí, hay una gata negra de ojos amarillos que no parpadea. Su pelaje está sucio de caminos y tiene una oreja mordida. "Llevo tres lunas sin comer", dice sin dramatismo, como quien comenta el clima. "Comparte tus provisiones conmigo, cazadora, y te pagaré como pagamos las gatas viejas: con lo que de verdad vale." Algo en su mirada te dice que esta gata ha visto cosas.',
    choices: [
      { id: 'share', label: '🍖 Compartir tus provisiones (cuesta oro)' },
      { id: 'refuse', label: '🚶 Seguir de largo', ghost: true },
    ],
  },
  shrine: {
    title: 'El Santuario Olvidado', emoji: '🕯️',
    text: 'Medio enterrado entre raíces encuentras un santuario diminuto: velas que nadie enciende hace décadas, un cuenco de ofrendas vacío y la estatua de una gata con la pata alzada cuya cara ha borrado la lluvia. El aire aquí pesa distinto. Las viejas leyes son claras: los santuarios olvidados conceden favores enormes... a cambio de sangre, y nunca prometen nada.',
    choices: [
      { id: 'blood', label: '🩸 Ofrendar tu sangre (-25% Vida, premio incierto)', danger: true },
      { id: 'pray', label: '🕯️ Encender las velas y rezar (+Vida leve)', ghost: true },
    ],
  },
  kitten: {
    title: 'El Gatito Perdido', emoji: '🐱',
    text: 'Un maullido diminuto te detiene en seco. Bajo un helecho, empapado y temblando, hay un gatito de semanas con los ojos apenas abiertos. No debería estar aquí — nada tan pequeño debería estar aquí. A lo lejos se oye el eco de los monstruos del Lince. Llevarlo contigo es imposible; dejarlo sin más, impensable. Pero tus provisiones podrían darle fuerzas para llegar al refugio del valle, si le enseñas el camino.',
    choices: [
      { id: 'feed', label: '🍼 Darle tus provisiones y guiarlo (cuesta oro)' },
      { id: 'ignore', label: '💔 Endurecer el corazón y seguir', ghost: true },
    ],
  },
  ambush: {
    title: '¡Emboscada!', emoji: '⚠️',
    text: 'Los arbustos explotan en movimiento: te han estado siguiendo. Las criaturas del Lince conocen este recodo del sendero y lo usan de matadero — el suelo está sembrado de huesos pequeños que prefieres no mirar demasiado. Tienes medio segundo de ventaja gracias a tus bigotes. La pregunta de siempre, cazadora: ¿garras o patas?',
    choices: [
      { id: 'fight', label: '⚔️ Plantar cara (élite, botín extra)', danger: true },
      { id: 'flee', label: '💨 Huir por los tejados (pierdes algo de oro)', ghost: true },
    ],
  },
  rival: {
    title: 'El Rival de los Tejados', emoji: '😼',
    text: 'Un gato enorme de pelaje cobrizo te corta el paso, con cicatrices de cien peleas y una sonrisa torcida que conoces bien: es Bigotes de Hierro, el duelista que recorre Felandia retando a cualquiera que huela a leyenda. "Así que tú eres la que va a matar al Lince", ronronea, desenvainando las garras con teatralidad. "Demuéstramelo. Si me vences, te doy mi tesoro. Si te venzo... bueno, tendrás una cicatriz con estilo."',
    choices: [
      { id: 'duel', label: '⚔️ Aceptar el duelo (botín épico)', danger: true },
      { id: 'decline', label: '🙀 Declinar con elegancia', ghost: true },
    ],
  },
  curse: {
    title: 'La Bruja del Páramo', emoji: '🌙',
    text: 'Una figura encorvada remueve un caldero en mitad del sendero, como si el sendero fuera suyo. Es la Bruja del Páramo — mitad gata, mitad otra cosa, vieja como las piedras y el doble de amarga. "Peaje", grazna sin levantar la vista. "Todo viajero paga. En oro... o en suerte. A mí me da igual cuál, pequeña: el caldero acepta ambos."',
    choices: [
      { id: 'pay', label: '🪙 Pagar el tributo en oro' },
      { id: 'refuse', label: '🐾 Negarte y pasar de largo (maldición)', danger: true },
    ],
  },
};
