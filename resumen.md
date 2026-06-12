# Hero Clicker RPG v2.1 — Crónicas de Felandia 🐱

Repositorio: https://github.com/arastrox/Clicker-game
Rama activa: `phaser-rebuild` (la rama `main` conserva la v1 en vanilla JS)

---

## 🚀 Stack Tecnológico

| Tecnología | Rol |
|---|---|
| **Phaser 3** (~3.90) | Motor 2D: arena de combate, sprites animados, partículas, FX de habilidades, transiciones |
| **TypeScript** (strict) | Todo el código tipado, con alias `@/` → `src/` |
| **Vite 6** | Dev server con HMR y build de producción |
| **HTML/CSS (DOM)** | Paneles RPG pixel morado/rosado superpuestos al canvas (arquitectura híbrida) |
| **Web Audio API** | SFX retro **y música chiptune secuenciada**, sin archivos de audio |

**Arquitectura híbrida**: Phaser renderiza la arena (heroína, enemigos, fondo, efectos); la UI de paneles es DOM. Se comunican por un **bus de eventos tipado** (`src/core/events.ts`).

### Comandos
```bash
npm install      # primera vez
npm run dev      # desarrollo → http://localhost:5173
npm run build    # type-check + build de producción (dist/)
```

---

## 📁 Estructura de Archivos

```
index.html                  Layout 3 columnas + overlay de arena + modales
public/assets/
  sprites/frames/           0x72 DungeonTileset II v1.7 (CC0) + cat_*.png (CC-BY dogchicken)
  kenney/                   Kenney Tiny Dungeon (CC0) — íconos 16x16
  ATTRIBUTION.md            Créditos de assets (la atribución CC-BY es obligatoria)
src/
  main.ts                   Punto de entrada: UI + música + arranque
  styles.css                Tema pixel morado/rosado; fuente intercambiable (VT323/Quicksand)
  core/                     types, state, save (migraciones), events (bus), ready
  data/
    classes.ts              3 gatas heroínas (Guerrera/Hechicera/Pícara) con tints de pelaje
    skills.ts               12 habilidades con 3 rangos
    zones.ts                5 zonas + enemigos felinos + jefes (final: Lince Hechicero)
    items.ts                Nombres, rarezas, sprites, efectos únicos, pociones
    specialEvents.ts        13 eventos con narrativa profunda, pesos y elecciones
    story.ts                Prólogo "La Séptima Vida" + 4 capítulos + epílogo (Felandia)
  systems/
    stats.ts                Stats derivadas con desglose (tooltips)
    progression.ts          XP/niveles; mejoras de habilidad desde Nv. 13 (SKILL_UPGRADE_LEVEL)
    inventory.ts            Loot procedural, equipar, vender
    map.ts                  Mapa 10-20 nodos; nivel enemigo ≤ jugador+4
    combat.ts               Combate; SIN regen pasiva; maná solo EN combate
    gameflow.ts             Nodos, eventos (resolveEventChoice), jefes, capítulos, muerte
  scenes/
    createGame.ts           Boot de Phaser (solo con #app visible) + watchdog
    BootScene.ts            Carga frames y anims (attack/die one-shot, 16/10 fps)
    ArenaScene.ts           Arena + FX por habilidad + anim de zarpazo al click
    frameNames.ts           Manifiesto generado (398 frames)
  audio/
    sfx.ts                  17 efectos sintetizados
    music.ts                Secuenciador chiptune: 7 pistas (zona/jefe/mercader)
  ui/
    hud.ts                  Header, panel izq., skillbar, toggles fuente/música/mute
    inventoryUi.ts          Mochila 4x4 + detalle
    arenaUi.ts              Avanzar, eventos data-driven con desenlaces, tienda
    modals.ts               Creación (gatas), historia, muerte (7 vidas), confirmaciones
```

---

## 🎮 Concepto

Eres una **gata heroína** en el reino felino de **Felandia**, arrasado por el **Lince Hechicero** (un gato que pactó con el Abismo por vidas infinitas). Te queda **una sola de tus siete vidas**. Avanzas por un mapa procedural de 4 zonas + post-game, con combate clicker, eventos narrativos con decisiones, loot, niveles y jefes. Mentora: la abuela gata **Mau, Decana de los Tejados**.

## 🗺️ Zonas

| Zona | Niveles | Jefe |
|---|---|---|
| 🌲 Bosque Susurrante | 1–10 | Orco Gigante |
| 💎 Cueva de Cristal | 11–20 | Gólem de Piedra |
| 🌋 Volcán de Fuego Eterno | 21–30 | Demonio de Obsidiana |
| 🏰 Castillo Flotante | 31–40 | **Lince Hechicero** (gato, escala 4.6, tint púrpura) |
| 🕳️ Abismo Infinito | 41+ | Avatar del Abismo (ciclos +10 niveles) |

Cada zona suma un **enemigo felino** (sprite `cat` con tint): Gato Montés Embrujado, Lince de Cristal, Pantera de Magma, Gata Espectral, Felino del Vacío.

- Nivel enemigo: `min(nivel de zona, jugador + 4)`.
- Nodos: Enemy 55% · Elite 15% · Rest 15% · Event 15% · Boss (último).

## 🎭 Eventos (13 tipos, narrativa profunda con desenlaces)

Cada evento tiene historia contextualizada, elecciones y **texto de desenlace** (panel → elección → narración del resultado → continuar). Definidos en `specialEvents.ts` (copy + choices) y resueltos en `gameflow.resolveEventChoice()`.

| Evento | Decisión / desenlaces |
|---|---|
| 🏪 El Último Mercader | Tienda (3-4 equipos + pociones) |
| 📦 Cofre Solitario | Abrir (¡mimic!) / rodear |
| 🪤 Trampa de Cazadores | Con cuidado (-10% HP + debuff) / forzar (-25% HP sin debuff) |
| 🗿 Altar de la Gran Gata | Rezar (+XP) / ofrendar oro (+XP doble) |
| ⛓️ Espíritu Encadenado | Liberar (60% premio / 40% combate) / vender cadena |
| ⛲ Manantial de Leche de Luna | Beber (+50% HP) / remojarse (+25% + regen 45s) |
| ✨ Bendición del Tejado | +15% Daño, +10% Crít por 3 combates |
| 🐈‍⬛ La Gata Errante | Compartir oro (70% bendición / 30% ítem) / negarse (20% mal de ojo) |
| 🕯️ Santuario Olvidado | Sangre -25% HP (50% ítem épico / nada) / rezar (+15% HP) |
| 🐱 El Gatito Perdido | Alimentarlo (XP + buff; sin oro da XP menor) / ignorarlo |
| ⚠️ ¡Emboscada! | Pelear (élite, -2 Def, botín garantizado) / huir (-10% oro) |
| 😼 El Rival (Bigotes de Hierro) | Duelo (élite gato, botín épico garantizado) / declinar |
| 🌙 La Bruja del Páramo | Pagar (+6% crít) / negarse (-15% Daño hasta vencer; sin oro: maldición igual) |

## ⚔️ Combate y reglas clave

- Click/Espacio ataca (la gata hace **animación de zarpazo**); DPS automático; barra de carga enemiga; críticos/esquiva/estados.
- **SIN regeneración pasiva fuera de combate** — curarse depende de fogatas, manantiales, pociones y habilidades.
- **El maná solo regenera EN combate** (la Ira decae fuera de combate).
- **Mejoras de habilidad desde Nv. 13**: las habilidades se aprenden a Nv. 3/5/8/12 (rango 1); los puntos de mejora se ganan 1/nivel **a partir del 13** (UI muestra el candado antes). Migración de saves incluida.
- Muerte: modal felino (séptima vida) → revivir al 50% (-20% oro) y reintentar cuando quieras, o reiniciar.

## 🏆 Clases (gatas)

- 🛡️ **Guerrera** (pelaje naranja) — Ira al recibir daño.
- 🔮 **Hechicera** (pelaje lila) — Maná (regen en combate; +5 máx por Agilidad).
- 🗡️ **Pícara** (pelaje gris) — Combo por click.

Habilidades y FX propios por habilidad en `ArenaScene.skillFx()`: proyectil de Bola de Fuego con estela, lluvia de 7 meteoros, burbuja de Barrera de Hielo, anillos de Grito de Batalla, afterimages de Esquiva Sombría, líneas de velocidad de Adrenalina, remolino + cortes de Danza de Hojas, cúpula dorada de Último Bastión, etc.

## 🎨 HUD (tema "Crónicas de Felandia")

- Paleta **morado/rosado** femenina con estilo pixel (bordes 2px, sombras chunky, glow rosa). Colores de rareza intactos.
- **Fuente intercambiable** (botón `Aa`): pixel (VT323) ↔ suave (Quicksand), persistida en el save (`meta.fontMode`). Tamaños por modo vía variables CSS (`--t-sm/md/lg`).
- **Barra de vida de la heroína grande y notoria** (26px + ❤️) en la arena, además de los dígitos del panel.
- **Progreso de escenario centrado y más grande** en el header (nodos 18px, jefe 24px 👑).
- Botones: Aa (fuente), 📖 (releer historia), 🎵 (música), 🔊 (todo el audio), 🔄 (reset con confirmación).

## 🎵 Música (Web Audio, sin archivos)

`src/audio/music.ts`: secuenciador por corcheas (lead cuadrada + bajo triangular + hats de ruido). **7 pistas**: bosque, cueva, volcán, castillo, abismo, **jefe** (se activa al aparecer un boss y vuelve al tema de zona al vencerlo) y **mercader**. Se silencia al morir. Toggle 🎵 independiente (`meta.musicOn`); el audio se desbloquea con el primer click (política de navegadores).

## 💾 Guardado

localStorage con `SAVE_VERSION` y migraciones (incluye recorte de skillPoints pre-Nv13 y defaults de musicOn/fontMode).

---

## ✅ Historial

### v2.2 — Escenarios con profundidad y modelos por clase (esta versión)
- [x] **Escenarios remodelados**: cielo con elementos celestes por zona (luna, estrellas, resplandor de lava, brillos de cristal), siluetas lejanas en dos planos, props medios (columnas/estandartes), piso completamente embaldosado con sombreado de perspectiva, decoración a nivel de suelo y viñeta frontal.
- [x] **Sensación de avance**: al avanzar de nodo, todo el mundo se desplaza con parallax (fondo lento, props medios, suelo rápido con scroll envolvente y decoración reciclada).
- [x] **Profundidad de combate**: la heroína está más cerca (abajo, escala completa) y el enemigo más lejos (arriba, 93% de escala, sombra suave); el suelo se oscurece hacia el fondo.
- [x] **Fix del personaje flotando**: los frames del gato bípedo tenían 9 filas transparentes bajo las patas (recortadas); todas las posiciones se anclan a la banda de suelo.
- [x] **Modelos por clase**: Guerrera = gata luchadora bípeda; Pícara = gata callejera cuadrúpeda (CC0); Hechicera = la cuadrúpeda con sombrero de bruja compuesto por frame (anclado a la cabeza). Embestida como ataque para las cuadrúpedas.
- [x] **Fix tooltip de stats**: ahora usa posición fija con z-index alto — ya no queda oculto bajo la arena.
- [x] **Balance**: enemigos +40% vida y ataques 30% más rápidos (intervalos 2.3/2.0/1.85s).
- [x] **Robustez de arranque**: boot diferido hasta que el contenedor tenga tamaño real (ventanas minimizadas), watchdog de texturas, fallback a renderer Canvas, texturas utilitarias por canvas 2D (sin depender del primer frame WebGL) y hook global de errores.

### v2.1 — Crónicas de Felandia
- [x] Re-tematización total a gatos: heroínas, historia (7 vidas, Lince Hechicero, Mau), enemigos felinos, eventos.
- [x] Sprites de gata con animaciones idle/run/**attack**/die (Cat Fighter, CC-BY dogchicken; extraídos de GIF, fondo transparente).
- [x] Sin regen pasiva fuera de combate · maná solo en combate · mejoras de habilidad desde Nv. 13.
- [x] HUD pixel morado/rosado + fuente elegible persistida + barra de HP grande + progreso centrado/grande.
- [x] Música chiptune dinámica (zona/jefe/mercader/muerte).
- [x] 13 eventos con narrativa profunda, decisiones morales, desenlaces múltiples y variantes de combate (emboscada, rival, espíritu, mimic).
- [x] FX visuales propios por cada una de las 12 habilidades + zarpazo al click.

### v2.0 — Reconstrucción Phaser
- [x] Migración completa de vanilla JS a Phaser 3 + TS + Vite; bugs v1 resueltos; game over; Abismo; tooltips; etc.

## 📌 Notas técnicas para agentes

- **Phaser se crea solo cuando `#app` es visible** (`createGame.ts`) — con contenedor 0×0 el renderer WebGL queda corrupto. No cambiar ese orden.
- `?st` en la URL fuerza bucle por `setTimeout` (ventanas en segundo plano).
- `frameNames.ts` se regenera desde `public/assets/sprites/frames` (PowerShell en el historial del repo).
- Convención de anims: `X_idle_anim`/`X_run_anim` (loop), `X_attack_anim` (16fps, one-shot), `X_die_anim` (10fps, one-shot), `X_anim` (criaturas simples). `ArenaScene.animKeyFor()` resuelve.
- Las 3 clases comparten el sprite `cat` con `ClassDef.tint`; las tarjetas de creación usan filtros CSS (`CLASS_FUR_FILTER`).
- Eventos: agregar uno = copy+choices en `specialEvents.ts` + casos en `gameflow.resolveEventChoice()` (+ pieza opcional en `ArenaScene.showEventPiece`).

## 🔜 Ideas futuras

- [ ] Sets de ítems con sinergias · logros · i18n · atlas de texturas · más jefes del Abismo · modo táctil pulido.
