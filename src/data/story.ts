// ─── Historia de la campaña ────────────────────────────────────────────────
// {name} se sustituye por el nombre del héroe y {class} por su clase.

export interface StoryEntry {
  id: string;
  title: string;
  emoji: string;
  paragraphs: string[];
}

export const PROLOGUE: StoryEntry = {
  id: 'prologue',
  title: 'Prólogo — La Llamada',
  emoji: '📜',
  paragraphs: [
    'Dicen que el mundo de Eldoria fue hermoso una vez. Que sus bosques cantaban con el viento, que sus cuevas guardaban luz en vez de sombras, y que el gran Castillo de Aether flotaba sobre las nubes como una promesa de paz.',
    'Eso fue antes del Rey Hechicero. Antes de que su pacto con el Abismo torciera las raíces de los árboles, despertara a los muertos en las profundidades y encendiera el corazón dormido del volcán.',
    'Tú, {name}, no eras nadie especial. Un {class} de pueblo, con deudas, callos en las manos y una cama que dejaste sin hacer. Pero cuando el último farol de tu aldea se apagó —y con él la última risa—, comprendiste algo que los héroes de las canciones nunca confiesan: nadie más va a venir.',
    'Tomaste lo que tenías. Cerraste la puerta. Y caminaste hacia el Bosque Susurrante, donde los árboles pronuncian tu nombre con voces que no son de este mundo.',
    'El sendero solo avanza hacia adelante. Que los dioses olvidados guarden tus pasos.',
  ],
};

// Texto breve al entrar a cada zona (interludios)
export const ZONE_INTROS: string[] = [
  'Los árboles se cierran sobre el sendero. Algo te observa desde la espesura... y tiene hambre.',
  'El aire se vuelve frío y mineral. Los cristales de la cueva brillan con una luz que no deberían tener.',
  'El suelo quema bajo tus botas. El Volcán de Fuego Eterno ruge como una bestia que sueña con despertar.',
  'Escaleras de mármol roto ascienden hacia las nubes. El Castillo Flotante te esperaba, {name}. Siempre te esperó.',
  'No hay mapa para este lugar. El Abismo no termina: solo se hace más profundo. ¿Cuánto resistirás?',
];

export const CHAPTERS: StoryEntry[] = [
  {
    id: 'chapter1',
    title: 'Capítulo I — El Despertar del Bosque',
    emoji: '🌲',
    paragraphs: [
      'El Orco Gigante cae con un estruendo que sacude los nidos de los árboles muertos. Durante un instante, el bosque entero contiene la respiración... y entonces lo oyes: el susurro se detiene. Por primera vez en años, el Bosque Susurrante guarda silencio.',
      'Entre los restos del coloso encuentras un fragmento de piedra tallada con runas que arden con luz tenue. No sabes leerlas, pero al tocarlas ves un destello: un trono de obsidiana, una corona flotando sobre un rostro sin cara, y cuatro sellos rompiéndose uno a uno.',
      'Una anciana sale de entre los árboles. Dice llamarse Maeve, y dice también que llevaba veinte años esperando a "alguien lo bastante terco para no morirse en el primer recodo".',
      '"El Orco era solo el perro guardián", advierte, señalando hacia las montañas. "El primer sello está roto, {name}. Los otros tres esperan: bajo la piedra, dentro del fuego, y sobre las nubes. Date prisa. El Rey Hechicero ya sabe tu nombre."',
    ],
  },
  {
    id: 'chapter2',
    title: 'Capítulo II — El Corazón de la Caverna',
    emoji: '💎',
    paragraphs: [
      'El Gólem de Piedra se desmorona grieta a grieta, y con su último aliento mineral, los cristales de la cueva cambian de color: del azul enfermo del hechizo... al blanco limpio de la luz de luna. La caverna respira de nuevo.',
      'En el centro de la cámara del Gólem encuentras el segundo fragmento rúnico. Esta vez la visión es más larga: ves al Rey Hechicero joven, mortal todavía, arrodillado ante una grieta en el mundo. Ves la voz del Abismo ofrecerle eternidad. Y ves el precio: cuatro sellos, cuatro guardianes, cuatro pedazos de su alma escondidos lejos de su cuerpo.',
      'Comprendes entonces lo que Maeve no se atrevió a decirte: no estás matando monstruos. Estás matando al Rey, pieza por pieza.',
      'Al salir de la cueva, el cielo nocturno te parece distinto. Más rojo. En el horizonte, el Volcán de Fuego Eterno ha empezado a humear. Sabe que vas hacia él.',
    ],
  },
  {
    id: 'chapter3',
    title: 'Capítulo III — El Aliento del Volcán',
    emoji: '🌋',
    paragraphs: [
      'El Demonio de Obsidiana estalla en mil esquirlas de vidrio negro que llueven siseando sobre la lava. El tercer fragmento flota sobre el cráter, intacto, esperándote como si tuviera voluntad propia.',
      'La visión esta vez no es del pasado. Es del presente: el Rey Hechicero, en su trono sobre las nubes, abre los ojos. Te ve. A través del fragmento, a través de la distancia, sus ojos sin fondo se clavan en los tuyos y su voz suena dentro de tu cráneo como una campana rota:',
      '"Tres pedazos de mí cargas, pequeño {class}. ¿Sientes ya el peso? Tráemelos. Sube a mi castillo. Termina lo que empezaste... o quédate a vivir para siempre en el fuego, como prefieras. De un modo u otro, nos veremos pronto."',
      'Maeve te alcanza en la falda del volcán con provisiones y una mirada que no le habías visto antes: miedo. "El castillo ha bajado", dice. "Por primera vez en un siglo, el Castillo Flotante ha descendido de las nubes. Te está abriendo la puerta, {name}. Los reyes no abren la puerta a sus verdugos... a menos que crean que pueden ganar."',
    ],
  },
  {
    id: 'chapter4',
    title: 'Capítulo IV — Las Sombras del Castillo',
    emoji: '👑',
    paragraphs: [
      'La corona del Rey Hechicero rueda por el mármol y se detiene a tus pies. Sin ella, lo que queda en el trono no es un tirano inmortal: es un hombre viejo, agotado, casi agradecido. "Cuatro sellos", murmura con lo que le queda de voz. "Cuatrocientos años. ¿Sabes cuánto pesa la eternidad, héroe? Más que tu espada. Mucho más."',
      'Cuando su cuerpo se deshace en ceniza plateada, los cuatro fragmentos rúnicos se alzan de tu morral y se funden en uno: una llave pequeña, fría, que vibra como un pájaro asustado.',
      'El Castillo Flotante desciende suavemente hasta posarse en el valle, manso como un animal domado. Abajo, en los caminos de Eldoria, ya se encienden faroles. La gente vuelve. El mundo, lentamente, recuerda cómo respirar.',
      'Maeve te espera en las puertas con una sonrisa torcida y la mirada puesta en la llave. "No celebres tan rápido", dice. "El Rey no inventó el Abismo. Solo le abrió la puerta... y las puertas, {name}, se abren hacia ambos lados."',
      'Has completado la campaña de Eldoria. Pero bajo el castillo, una grieta antigua sigue respirando. El Abismo Infinito te espera, para quienes se atreven a mirar hacia abajo. 🕳️',
    ],
  },
];

export const ABYSS_INTRO: StoryEntry = {
  id: 'abyss',
  title: 'Epílogo — El Abismo Infinito',
  emoji: '🕳️',
  paragraphs: [
    'La llave del Rey Hechicero encaja en la grieta bajo el castillo como si hubiera sido forjada para ello. Quizás lo fue.',
    'La piedra se abre a una escalera que baja en espiral más allá de donde la luz tiene sentido. De las profundidades sube un eco de voces: todas las criaturas que venciste, todas las que vendrán, hablando a la vez.',
    'Aquí no hay sellos que romper ni reinos que salvar. Solo la pregunta que el Abismo le hace a todos los héroes que llegan hasta su borde: ¿qué tan profundo puedes llegar?',
    'Cada ciclo del Abismo es más letal que el anterior. No hay final. Solo leyenda. Buena suerte, {name}.',
  ],
};

export function formatStory(text: string, name: string, className: string): string {
  return text.replaceAll('{name}', name).replaceAll('{class}', className);
}
