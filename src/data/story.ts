// ─── Historia de la campaña (crónica felina de Felandia) ───────────────────
// {name} se sustituye por el nombre de la heroína y {class} por su clase.

export interface StoryEntry {
  id: string;
  title: string;
  emoji: string;
  paragraphs: string[];
}

export const PROLOGUE: StoryEntry = {
  id: 'prologue',
  title: 'Prólogo — La Séptima Vida',
  emoji: '📜',
  paragraphs: [
    'Dicen que Felandia fue hermosa una vez. Que sus tejados estaban siempre tibios de sol, que los cuencos de leche nunca se vaciaban, y que el gran Castillo de las Nubes flotaba sobre el reino como un ovillo de luz que nadie alcanzaba a desenredar.',
    'Eso fue antes del Lince Hechicero. Antes de que su pacto con el Abismo marchitara la hierba gatuna de los prados, despertara a los muertos bajo las cuevas y encendiera el corazón dormido del volcán. Los gatos del reino dejaron de ronronear, y un reino felino que no ronronea es un reino que se apaga.',
    'Tú, {name}, no eras nadie especial. Una {class} de aldea, con las garras sin afilar, una manta favorita y seis vidas ya gastadas en travesuras que no vienen al caso. Pero cuando el último farol de tu callejón se apagó —y con él, el último ronroneo—, comprendiste lo que los héroes de las canciones nunca confiesan: nadie más va a venir.',
    'Te lamiste el pelaje una última vez. Afilaste las uñas contra el poste de la plaza. Y caminaste hacia el Bosque Susurrante con la cola en alto, como se debe partir a las guerras que nadie te pidió pelear.',
    'Te queda una sola vida, {name}. La séptima. El sendero solo avanza hacia adelante: que la Gran Gata que duerme tras la luna guarde tus pasos.',
  ],
};

// Texto breve al entrar a cada zona (interludios)
export const ZONE_INTROS: string[] = [
  'Los árboles se cierran sobre el sendero y tus bigotes vibran: algo te observa desde la espesura... y no es un ratón.',
  'El aire se vuelve frío y mineral. Los cristales de la cueva brillan con una luz que eriza el lomo de cualquier gata sensata.',
  'El suelo quema bajo tus almohadillas. El Volcán de Fuego Eterno ruge como un perro gigante que sueña con despertar.',
  'Escaleras de mármol roto ascienden hacia las nubes. El Castillo Flotante te esperaba, {name}. Los linces siempre saben quién viene a matarlos.',
  'No hay mapa para este lugar. El Abismo no termina: solo se hace más profundo. ¿Cuántas vidas pagarías por saber qué hay al fondo?',
];

export const CHAPTERS: StoryEntry[] = [
  {
    id: 'chapter1',
    title: 'Capítulo I — El Despertar del Bosque',
    emoji: '🌲',
    paragraphs: [
      'El Orco Gigante cae con un estruendo que vacía todos los nidos del bosque. Durante un instante, la espesura entera contiene la respiración... y entonces lo oyes: el susurro se detiene. Por primera vez en años, el Bosque Susurrante guarda silencio, y en ese silencio tu ronroneo suena como un trueno pequeño y valiente.',
      'Entre los restos del coloso, tus bigotes detectan algo enterrado: un fragmento de piedra tallada con runas que arden con luz tenue. Al tocarlo con la pata ves un destello: un trono de obsidiana, una corona flotando sobre un rostro de lince sin ojos, y cuatro sellos rompiéndose uno a uno.',
      'Una gata anciana baja de un árbol sin hacer ruido, como solo las abuelas saben hacerlo. Se presenta como Mau, Decana de los Tejados, y dice que llevaba veinte años esperando a "alguien con la cabeza lo bastante dura para no morirse en el primer recodo".',
      '"El Orco era solo el perro guardián", maúlla, señalando las montañas con la cola. "El primer sello está roto, {name}. Los otros tres esperan: bajo la piedra, dentro del fuego, y sobre las nubes. Corre, pequeña. El Lince Hechicero ya conoce tu olor."',
    ],
  },
  {
    id: 'chapter2',
    title: 'Capítulo II — El Corazón de la Caverna',
    emoji: '💎',
    paragraphs: [
      'El Gólem de Piedra se desmorona grieta a grieta, y con su último aliento mineral los cristales de la cueva cambian de color: del azul enfermo del hechizo... al blanco limpio de la luz de luna. La caverna respira de nuevo, y tú te sacudes el polvo del lomo con la dignidad de quien acaba de derribar una montaña.',
      'En el centro de la cámara flota el segundo fragmento rúnico. Esta vez la visión es más larga: ves al Lince Hechicero joven, mortal todavía, con el pelaje brillante y los ojos tristes, arrodillado ante una grieta en el mundo. Ves a la voz del Abismo ofrecerle lo que ningún felino debería aceptar: vidas infinitas. Y ves el precio: cuatro sellos, cuatro guardianes, cuatro pedazos de su alma escondidos lejos de su cuerpo.',
      'Comprendes entonces lo que Mau no se atrevió a decirte: no estás cazando monstruos. Estás cazando a un gato que tuvo miedo de morir, pieza por pieza. La idea te eriza el lomo y no sabes si es de rabia o de lástima.',
      'Al salir de la cueva, el cielo nocturno te parece distinto. Más rojo. En el horizonte, el Volcán de Fuego Eterno ha empezado a humear. Sabe que vas hacia él, y tú sabes que él lo sabe. Así son estas cosas entre cazadores.',
    ],
  },
  {
    id: 'chapter3',
    title: 'Capítulo III — El Aliento del Volcán',
    emoji: '🌋',
    paragraphs: [
      'El Demonio de Obsidiana estalla en mil esquirlas de vidrio negro que llueven siseando sobre la lava. Aterrizas de pie —siempre de pie— y el tercer fragmento flota sobre el cráter, intacto, esperándote como un juguete que ya no quieres.',
      'La visión esta vez no es del pasado. Es del presente: el Lince Hechicero, en su trono sobre las nubes, abre sus ojos sin fondo. Te ve. A través del fragmento, a través de la distancia, su voz suena dentro de tu cráneo como un cascabel roto:',
      '"Tres pedazos de mí cargas, pequeña {class}. ¿Sientes ya el peso? Yo también empecé con seis vidas gastadas y una causa justa. Sube a mi castillo. Termina lo que empezaste... o quédate a dormir junto al fuego, como prefieras. De un modo u otro, nos veremos pronto."',
      'Mau te alcanza en la falda del volcán con provisiones, hierba gatuna fresca y una mirada que no le habías visto antes: miedo. "El castillo ha bajado", dice. "Por primera vez en un siglo, el Castillo Flotante ha descendido de las nubes. Te está abriendo la puerta, {name}. Y los reyes no abren la puerta a sus verdugos... a menos que crean que pueden ganar."',
    ],
  },
  {
    id: 'chapter4',
    title: 'Capítulo IV — Las Sombras del Castillo',
    emoji: '👑',
    paragraphs: [
      'La corona del Lince Hechicero rueda por el mármol y se detiene contra tu pata. Sin ella, lo que queda en el trono no es un tirano inmortal: es un gato viejo, flaco, con el pelaje opaco de quien lleva siglos sin que nadie lo acicale. "Cuatro sellos", ronronea con lo que le queda de voz, y es un ronroneo agrietado, casi agradecido. "Cuatrocientos años. ¿Sabes cuánto pesa la eternidad, cazadora? Más que tus garras. Mucho más."',
      'Cuando su cuerpo se deshace en ceniza plateada, los cuatro fragmentos rúnicos salen de tu morral y se funden en uno: una llave pequeña, fría, que vibra entre tus patas como un pájaro asustado.',
      'El Castillo Flotante desciende suavemente hasta posarse en el valle, manso como un cachorro regañado. Abajo, en los caminos de Felandia, ya se encienden faroles. Los cuencos vuelven a llenarse. Los tejados recuperan el sol. Y por todo el reino, de callejón en callejón, se oye algo que llevaba años sin oírse entero: un ronroneo de miles.',
      'Mau te espera en las puertas con una sonrisa torcida y la mirada puesta en la llave. "No celebres tan rápido, pequeña", maúlla. "El Lince no inventó el Abismo. Solo le abrió la puerta... y las puertas, {name}, se abren hacia ambos lados."',
      'Has completado la campaña de Felandia. Pero bajo el castillo, una grieta antigua sigue respirando. El Abismo Infinito espera a quien se atreva a mirar hacia abajo. 🕳️',
    ],
  },
];

export const ABYSS_INTRO: StoryEntry = {
  id: 'abyss',
  title: 'Epílogo — El Abismo Infinito',
  emoji: '🕳️',
  paragraphs: [
    'La llave del Lince Hechicero encaja en la grieta bajo el castillo como si hubiera sido forjada para ello. Quizás lo fue. Los gatos sabemos que las puertas cerradas son una ofensa personal, y aun así... dudas un instante.',
    'La piedra se abre a una escalera que baja en espiral más allá de donde la luz tiene sentido. De las profundidades sube un eco de voces: todas las criaturas que venciste, todas las que vendrán, maullando a la vez.',
    'Aquí no hay sellos que romper ni reinos que salvar. Solo la pregunta que el Abismo le hace a todo felino que se asoma a su borde, la misma que perdió al Lince: ¿qué tan profundo puede llegar tu curiosidad?',
    'Cada ciclo del Abismo es más letal que el anterior. No hay final. Solo leyenda. Y una sola vida en tu haber, {name}. Que sea la mejor de las siete.',
  ],
};

export function formatStory(text: string, name: string, className: string): string {
  return text.replaceAll('{name}', name).replaceAll('{class}', className);
}
