# Hero Clicker RPG v2 — Resumen Completo del Proyecto

Repositorio: https://github.com/arastrox/Clicker-game
Rama de la reconstrucción: `phaser-rebuild` (la rama `main` conserva la versión 1 en vanilla JS)

---

## 🚀 Stack Tecnológico (v2)

| Tecnología | Rol |
|---|---|
| **Phaser 3** (~3.90) | Motor 2D: arena de combate, sprites animados, partículas, cámara, transiciones |
| **TypeScript** (strict) | Todo el código tipado, con alias `@/` → `src/` |
| **Vite 6** | Dev server con HMR y build de producción |
| **HTML/CSS (DOM)** | Paneles RPG con glassmorphism superpuestos al canvas (arquitectura híbrida) |
| **Web Audio API** | Síntesis de sonido retro en tiempo real, sin archivos de audio |

**Arquitectura híbrida**: Phaser renderiza solo la arena (héroe, enemigos, fondo, efectos); toda la UI de paneles (stats, inventario, habilidades, modales) es DOM. Se comunican por un **bus de eventos tipado** (`src/core/events.ts`).

### Comandos
```bash
npm install      # primera vez
npm run dev      # desarrollo → http://localhost:5173
npm run build    # type-check + build de producción (dist/)
```

---

## 📁 Estructura de Archivos

```
index.html                  Layout de 3 columnas + overlay de arena + modales
public/assets/
  sprites/frames/           0x72 DungeonTileset II v1.7 (CC0) — 370 frames animados
  kenney/                   Kenney Tiny Dungeon (CC0) — íconos 16x16
  ATTRIBUTION.md            Créditos de assets
src/
  main.ts                   Punto de entrada: UI + arranque (save o creación)
  styles.css                Estilos completos (glassmorphism, rarezas, modales, responsive)
  core/
    types.ts                Todos los tipos compartidos
    state.ts                Estado global tipado + creación de partida nueva
    save.ts                 localStorage con versionado y migración
    events.ts               Bus de eventos tipado (sistemas ↔ Phaser ↔ DOM)
    ready.ts                Cola de arranque (espera a que Phaser cargue assets)
  data/                     Contenido data-driven (agregar contenido = editar datos)
    classes.ts              3 clases, atributos, stats base
    skills.ts               12 habilidades con 3 rangos cada una
    zones.ts                5 zonas con pools de enemigos, jefes y paletas
    items.ts                Nombres, rarezas, sprites, efectos únicos, pociones
    specialEvents.ts        7 eventos especiales con pesos y textos
    story.ts                Prólogo + 4 capítulos + epílogo del Abismo (ampliada)
  systems/
    stats.ts                Stats derivadas con desglose (tooltips)
    progression.ts          XP, niveles, puntos de atributo/habilidad
    inventory.ts            Generación procedural de loot, equipar, vender
    map.ts                  Generación de mapa (10-20 nodos), nivel de enemigos
    combat.ts               Combate: click, DPS, crítico, esquiva, estados, recursos
    gameflow.ts             Orquestación: nodos, eventos, jefes, capítulos, muerte
    rng.ts                  Utilidades de azar
  scenes/
    createGame.ts           Crea el juego Phaser (con watchdog de arranque)
    BootScene.ts            Carga frames y construye animaciones
    ArenaScene.ts           Arena: sprites, daño flotante, shake, transiciones
    frameNames.ts           Manifiesto generado de los 370 frames
  audio/sfx.ts              Sintetizador retro (17 efectos)
  ui/
    dom.ts                  Helpers DOM
    hud.ts                  Header, panel izquierdo, barra de habilidades, log
    inventoryUi.ts          Mochila 4x4 + detalle de ítem
    arenaUi.ts              Botón avanzar, panel de eventos, tienda del mercader
    modals.ts               Creación de personaje, historia, muerte, confirmaciones
```

---

## 🎮 Concepto del Juego

**Hero Clicker RPG** es un clicker RPG roguelike de navegador. El jugador:

1. Crea un personaje (nombre + 1 de 3 clases, con sprite animado real).
2. Lee un **prólogo narrativo** (historia de Eldoria y el Rey Hechicero).
3. Avanza por un **mapa procedural** (10–20 nodos por zona) con el botón "Avanzar por el Sendero ➡️".
4. En cada nodo: combate, élite, evento especial, descanso o jefe de zona.
5. Sube de nivel, reparte atributos, mejora habilidades y equipa loot procedural.
6. Al completar las 4 zonas de campaña se desbloquea el **Abismo Infinito** (post-game con ciclos de dificultad creciente).

---

## 🗺️ Zonas y Progresión

| Zona | Niveles | Jefe | Sprite |
|---|---|---|---|
| 🌲 Bosque Susurrante | 1–10 | Orco Gigante, Señor de la Espesura | `ogre` |
| 💎 Cueva de Cristal | 11–20 | Gólem de Piedra, Corazón de la Caverna | `big_zombie` (tint gris) |
| 🌋 Volcán de Fuego Eterno | 21–30 | Demonio de Obsidiana, Hijo del Magma | `big_demon` |
| 🏰 Castillo Flotante | 31–40 | Rey Hechicero, Amo del Castillo | `necromancer` (escala 6, tint púrpura) |
| 🕳️ Abismo Infinito | 41+ | Avatar del Abismo (cada ciclo +10 niveles) | `big_demon` (tint violeta) |

- Cada zona tiene paleta de colores propia (cielo degradado, siluetas, partículas ambientales) y pool de 5-6 enemigos animados.
- **Nivel enemigo suavizado**: `min(nivel de zona, nivel del jugador + 4)` para evitar saltos imposibles.
- Tipos de nodo: Enemy 55% · Elite 15% (2×HP, 1.5×ATK) · Rest 15% · Event 15% · Boss (último).

### Eventos Especiales (7 tipos, con pesos)
| Peso | Evento | Efecto |
|---|---|---|
| 28 | 🏪 Mercader | Tienda: 3-4 equipos + pociones (10% de ítem de nivel superior) |
| 18 | 👿 Mimic | Cofre animado: abrirlo = combate con botín garantizado; se puede rodear |
| 14 | 🌿 Trampa | -15% HP + debuff (-20% Daño, -3 Def) hasta **vencer** el próximo combate |
| 12 | 🗿 Altar | +40% de la XP del nivel actual |
| 12 | ⛓️ Elección moral | Liberar espíritu (60% premio / 40% combate) o vender cadena (oro seguro) |
| 10 | ⛲ Manantial | Cura 50% gratis |
| 6 | ✨ Bendición | +15% Daño, +10% Crítico durante 3 combates |

---

## ⚔️ Combate

- **Click / Espacio**: daño activo (toda la arena es clickeable, con pulso visual).
- **DPS automático** por segundo (con acumulación fraccional).
- **Barra de carga enemiga**: al llenarse ataca (mitigado por Defensa; mínimo 1).
- **Críticos** por clase + atributos; **esquiva** (Pícaro 5% base + habilidades).
- **Estados**: Quemadura 🔥, Veneno 🐍, Aturdimiento 💫 (en enemigo); Inmune/Escudo/Esquiva+ (en jugador).
- **Regen fuera de combate**: 2% HP máx/seg.
- **Muerte**: modal de Game Over → revivir al 50% HP (-20% oro) o reiniciar. Tras revivir, el jugador decide cuándo reintentar el nodo (puede equiparse antes).
- **Efectos visuales**: números de daño flotantes (color por fuente/crítico), shake de cámara, flash de impacto, partículas de muerte, entrada animada de enemigos, transición de fundido entre zonas.

## 🏆 Clases (recursos y habilidades idénticas al diseño v1, con rangos 1-3)

- 🛡️ **Guerrero** (`knight_m`) — Ira (al recibir daño): Golpe de Escudo, Grito de Batalla, Indomable, Último Bastión.
- 🔮 **Mago** (`wizzard_m`) — Maná (regen pasiva; +5 máx por punto de Agilidad): Bola de Fuego, Barrera de Hielo, Distorsión Temporal (acelera cooldowns ×2), Tormenta de Meteoros.
- 🗡️ **Pícaro** (`elf_m`) — Combo (por click, 0-5): Hojas Venenosas (escala con combo), Esquiva Sombría, Adrenalina, Danza de Hojas.

Las habilidades se aprenden solas al nivel requerido (3/5/8/12) y se mejoran con Puntos de Habilidad (1 por nivel, igual que atributos).

## 🎒 Ítems

- Mochila 16 ranuras, 3 slots de equipo, 4 rarezas con bordes/glow CSS.
- **Armas**: 27 sprites del tileset, repartidos por rareza. Armadura/accesorio: íconos Kenney.
- **Efectos únicos** (épico 35% / legendario 100%): Sed de Sangre (robo de vida), Perforante, Codicia (+oro), Sabiduría (+XP), Espinas (refleja daño), Verdugo (+daño a enemigos <25% HP).
- Loot: 25% normal / 60% élite / 100% jefe y mimic (con bonus de rareza).

## 📖 Historia

Narrativa ampliada con arco completo: prólogo, 4 capítulos (uno por jefe, con la trama de los 4 sellos del Rey Hechicero), epílogo del Abismo e intros de zona. Releíble desde el botón 📖 del header (solo capítulos desbloqueados). Los textos interpolan `{name}` y `{class}`.

## 💾 Guardado

- localStorage automático en cada acción relevante (clave `hero-clicker-rpg-save`).
- `SAVE_VERSION` con migración de versiones anteriores.
- Reinicio con **modal de confirmación** (ya no borra por accidente).

---

## ✅ Estado actual (qué se hizo en la v2)

Bugs v1 resueltos:
- [x] Debuff de trampa: se aplica al próximo combate y se limpia al vencerlo (y al morir).
- [x] Estilos del mercader: tienda nueva (`.merchant-item`) integrada al panel de eventos.
- [x] `explore-view` eliminada: el flujo es 100% inline en la arena.

Mejoras implementadas:
- [x] Pantalla de muerte con revivir/reiniciar.
- [x] 4 eventos nuevos (altar, elección moral, manantial, bendición).
- [x] Barra de progreso del mapa en el header (nodos + jefe).
- [x] Transiciones de nodo/zona animadas (run del héroe, fundidos, flash).
- [x] Regen de HP fuera de combate.
- [x] Ítems con efectos únicos.
- [x] 5ª zona / modo infinito (Abismo).
- [x] Tooltips con desglose de stats (base/clase/atributos/equipo/efectos).
- [x] Confirmación de reset.
- [x] Historia releíble + volumen narrativo ampliado.
- [x] Responsive: breakpoint <980px apila los paneles.
- [x] Arquitectura modular (24 módulos TS) + contenido data-driven.

Notas técnicas importantes:
- **Phaser se crea recién cuando `#app` es visible** (`createGame.ts`): si el contenedor mide 0×0, el renderer WebGL arranca corrupto. No mover ese orden.
- `?st` en la URL fuerza el bucle por `setTimeout` (útil con ventanas en segundo plano / throttling de RAF).
- `frameNames.ts` es generado desde `public/assets/sprites/frames` — regenerarlo si se agregan sprites.
- Convención de animaciones 0x72: héroes/enemigos grandes tienen `X_idle_anim`/`X_run_anim`/`X_hit_anim`; criaturas simples solo `X_anim`; cofres `chest_*_open_anim` (3 frames). `ArenaScene.animKeyFor()` resuelve automáticamente.

## 🔜 Ideas futuras (pendientes)

- [ ] Sets de ítems con sinergias.
- [ ] Internacionalización (strings centralizados).
- [ ] Atlas de texturas (empaquetar los 370 PNG en uno) para acelerar la carga.
- [ ] Logros / estadísticas de partida.
- [ ] Más jefes únicos para los ciclos del Abismo.
- [ ] Modo táctil/mobile pulido (botón de ataque dedicado).
