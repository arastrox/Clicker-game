# Hero Clicker RPG — Resumen Completo del Proyecto

Repositorio: https://github.com/arastrox/Clicker-game

---

## 📁 Estructura de Archivos

| Archivo | Descripción |
|---|---|
| `index.html` | Estructura HTML del juego: tres columnas (panel izquierdo, arena central, panel derecho) + modales |
| `styles.css` | Hoja de estilos completa: glassmorphism, animaciones, sistema de pestañas, raridades, eventos |
| `game.js` | Motor principal del juego: ~2600 líneas. Estado, clases, mapa, combate, loot, guardado |
| `resumen.md` | Este documento. Contexto del proyecto para trabajo futuro con agentes/modelos |

---

## 🎮 Concepto del Juego

**Hero Clicker RPG** es un juego de navegador (HTML/CSS/JS puro, sin frameworks) de estilo RPG roguelike con progresión guiada por niveles. El jugador:

1. Crea un personaje eligiendo **nombre** y una de las 3 **clases** disponibles.
2. Lee un **prólogo narrativo** antes de iniciar.
3. Avanza por un **mapa generado aleatoriamente** (10–20 nodos por zona) presionando el botón "Avanzar por el Sendero ➡️".
4. En cada nodo puede encontrar un **combate**, un **evento especial**, un **descanso** o un **jefe de zona**.
5. Sube de nivel, distribuye atributos y desbloquea habilidades de clase.

El juego utiliza **Web Audio API** para síntesis de sonido retro en tiempo real (sin archivos externos).

---

## 🗺️ Sistema de Mapa y Progresión

### Zonas (4 en total)
| Zona | Niveles | Jefe |
|---|---|---|
| 🌲 Bosque Susurrante | 1–10 | Orco Gigante 👹 |
| 💎 Cueva de Cristal | 11–20 | Gólem de Piedra 🪨 |
| 🌋 Volcán de Fuego Eterno | 21–30 | Dragón de Obsidiana 🐲 |
| 🏰 Castillo Flotante | 31+ | Rey Hechicero 🧙‍♂️ |

### Tipos de Nodo (por zona)
- **Enemy** (55%): Combate contra enemigo normal de la zona.
- **Elite** (15%): Enemigo con 2× HP y 1.5× ATK. Mayor recompensa.
- **Rest** (15%): Fogata. Permite curar 30% HP.
- **Event** (15%): Evento especial aleatorio (ver abajo).
- **Boss** (último nodo): Jefe de zona, desbloquea historia y siguiente zona.

### Eventos Especiales (15% de los nodos)
| Probabilidad | Tipo | Descripción |
|---|---|---|
| 40% | 🏪 Mercader | Tienda emergente con 3–4 equipos + pociones |
| 30% | 👿 Mimic | Cofre falso que se convierte en combate |
| 30% | 🌿 Trampa | -15% HP + debuff (-20% Daño Click, -3 Defensa) hasta próximo combate |

---

## ⚔️ Sistema de Combate

- **Combate activo**: Click sobre el sprite del enemigo (o tecla `Espacio`) para hacer daño.
- **Combate pasivo (DPS)**: Daño automático cada segundo basado en estadística DPS.
- **Ataque enemigo**: Barra de carga que al llenarse inflige daño al héroe (mitigado por Defensa).
- **Críticos**: Probabilidad y multiplicador dependientes de clase y atributos.
- **Esquiva**: Pícaro puede esquivar ataques en ciertos rangos con habilidades.
- **Estados alterados**: Quemadura (🔥), Veneno (🐍), Aturdimiento (💫), Inmunidad (🛡️).
- **Debuffs de trampa**: Se limpian al vencer el siguiente combate.

### Flujo de combate (inline, sin cambio de vista)
1. El nodo de combate se muestra en la arena central.
2. El jugador hace click para atacar hasta derrotar al enemigo.
3. Al derrotarlo, aparece el botón **"Avanzar por el Sendero ➡️"** directamente en la zona de combate.
4. Al clickear avanza al siguiente nodo sin vistas intermedias.

---

## 🏆 Sistema de Clases

### 🛡️ Guerrero
- **Recurso**: Ira (0–100). Generada al recibir daño.
- **Modificadores base**: +30 Vida Máx, +2 Defensa, -1 Daño Click.
- **Habilidades**:
  | Nivel | Habilidad | Efecto |
  |---|---|---|
  | 3 | 💥 Golpe de Escudo | 3× Daño + aturde 3s |
  | 5 | 📣 Grito de Batalla | +Def +8, +Atk 30% por 8s |
  | 8 | ❤️ Indomable | Cura 25% HP máximo |
  | 12 | 👑 Último Bastión *(Ultimate)* | Consume 50 Ira. Inmunidad + ×2 Daño por 6s |

### 🔮 Mago
- **Recurso**: Maná (0–100). Regeneración pasiva.
- **Modificadores base**: -15 Vida Máx, -2 Daño Click, +2 DPS Auto.
- **Habilidades**:
  | Nivel | Habilidad | Efecto |
  |---|---|---|
  | 3 | 🔥 Bola de Fuego | 6× Daño instantáneo + Quemadura 4s |
  | 5 | ❄️ Barrera de Hielo | Escudo: absorbe 100% daño por 5s |
  | 8 | ⏳ Distorsión Temporal | DPS +150%, cooldowns al doble por 6s |
  | 12 | ☄️ Tormenta de Meteoros *(Ultimate)* | 25× Daño masivo + aturde 4s. Cuesta 80 Maná |

### 🗡️ Pícaro
- **Recurso**: Combo (0–5 puntos). Generado al hacer click.
- **Modificadores base**: -10 Vida Máx, +1 Daño Click. +15% base crítico.
- **Habilidades**:
  | Nivel | Habilidad | Efecto |
  |---|---|---|
  | 3 | 🐍 Hojas Venenosas | 2× Daño + veneno 5s (escala con combo) |
  | 5 | 👣 Esquiva Sombría | +60% probabilidad de esquiva por 5s |
  | 8 | ⚡ Adrenalina | 100% crítico + doble velocidad de ataque por 6s |
  | 12 | 🌪️ Danza de Hojas *(Ultimate)* | Consume 5 combos. 10 golpes rápidos de 2.5× Daño |

### Mejora de Habilidades (Rangos)
- Cada habilidad puede mejorar hasta **Rango 3** usando **Puntos de Habilidad**.
- Los Puntos de Habilidad se obtienen al subir de nivel (igual que atributos).
- Los rangos aumentan daño, duración o efectos secundarios de la habilidad.

---

## 📊 Sistema de Atributos

Al subir de nivel el jugador recibe **1 Punto de Atributo** para distribuir entre 5 estadísticas. Los bonuses varían ligeramente por clase:

| Atributo | Guerrero | Mago | Pícaro |
|---|---|---|---|
| 💪 Fuerza | +1.0 Daño Click | +0.5 Daño Click | +1.2 Daño Click |
| ❤️ Constitución | +20 Vida Máx | +8 Vida Máx | +10 Vida Máx |
| ⚡ Destreza | +0.4 DPS Auto | +1.5 DPS Auto | +0.8 DPS Auto |
| 🛡️ Reflejos | +0.8 Defensa | +0.3 Defensa | +0.4 Defensa |
| 🎯 Agilidad | +1.0% Crítico | +1.0% Crítico + 5 Maná | +2.5% Crítico |

Los atributos y las habilidades están accesibles desde el **panel izquierdo** bajo un sistema de **pestañas** ("Atributos" / "Habilidades").

---

## 🎒 Sistema de Inventario y Equipamiento

- **Mochila**: 16 ranuras de inventario. El oro se muestra en la cabecera de la mochila.
- **Ranuras de equipo** (panel izquierdo): Arma, Armadura, Accesorio.
- **Rareza de ítems**: Común ⚪ → Raro 🔵 → Épico 🟣 → Legendario 🟠.
- **Generación procedural**: Estadísticas escaladas por nivel del enemigo y rareza.
  - Arma: +Daño Click
  - Armadura: +Vida Máx + Defensa
  - Accesorio: +DPS Auto
- **Loot al combate**: 25% de probabilidad para enemigos normales, 100% para jefes.
- **Vender ítems**: Los ítems del inventario se pueden vender por oro desde el panel de detalle.

### Mercader (Evento)
- 3–4 equipos a la venta (rareza acorde al nivel actual, con 10% de probabilidad de ítem de nivel superior).
- Pociones disponibles siempre:
  - 🧪 Poción de Vida: Cura 50% HP (15🪙)
  - 🧪 Poción de Fuerza: +25% Daño Click para el próximo combate (20🪙)
  - 🧪 Poción de Regeneración: +5 HP/s por 30s (25🪙)
  - 🧪 Poción de Maná *(solo Mago)*: +100 Maná (15🪙)

---

## 📖 Sistema de Historia

- **Prólogo**: Modal narrativo que aparece al crear el personaje, antes del primer nodo.
- **Capítulos (4 en total)**: Se desbloquean al derrotar al jefe de cada zona. Pausa el juego y presenta un texto narrativo.
  - Capítulo I: El despertar en el Bosque Susurrante
  - Capítulo II: Las profundidades de Cristal
  - Capítulo III: El aliento del Volcán
  - Capítulo IV: Las Sombras del Castillo Flotante (final de campaña)

---

## 💾 Sistema de Guardado

- **localStorage**: El estado del juego se guarda automáticamente en cada acción relevante.
- **Datos guardados**: Clase, nombre, nivel, XP, estadísticas, atributos, habilidades, inventario, equipamiento, oro, progreso de zona/mapa.
- **Migración de saves**: El código incluye lógica para convertir saves antiguas al nuevo formato de atributos y habilidades.
- **Reinicio**: Botón 🔄 en la cabecera borra el save y recarga la página.

---

## 🖥️ Interfaz (Layout de 3 Columnas)

### Panel Izquierdo (`panel-left`)
1. **Estadísticas**: HP, Daño Click, DPS Auto, Defensa.
2. **Equipamiento Activo**: Arma, Armadura, Accesorio (con slots vacíos estilizados).
3. **Pestañas RPG**:
   - `Atributos`: Lista de los 5 atributos con botones `+` y puntos disponibles.
   - `Habilidades`: Lista de habilidades de clase con rango actual y botón de mejora.
   - Indicadores de puntos disponibles (✨/🌟) en las pestañas si hay puntos pendientes.

### Panel Central (`panel-center`)
- **Barra de HP del jugador** (flotante arriba).
- **Arena de combate** con 3 subvistas exclusivas:
  - `combat-view`: Sprite del enemigo, barras de HP y carga de ataque, botón inline de avanzar.
  - `explore-view`: Vista de camino despejado (prácticamente no usada en el flujo actual).
  - `event-view`: Contexto del evento + opciones de elección + tienda del mercader.
- **Panel de habilidades activas**: 4 slots (teclas 1–4), barra de recurso de clase, puntos combo (Pícaro).
- **Panel de instrucciones**: Pequeña guía de controles.

### Panel Derecho (`panel-right`)
- **Mochila**: 16 ranuras de inventario en grid 4×4. Oro en la cabecera.
- **Detalle de ítem**: Panel emergente con nombre, rareza, estadísticas, descripción, botones Equipar/Vender.
- **Registro de Batalla**: Log colapsable con historial de eventos (daño, loot, niveles, etc.).

### Header
- Logo + Nombre del juego.
- Navegador de zonas con nombre de zona actual y progreso.
- Barra de XP + nivel del jugador.
- Controles: Silenciar 🔊 y Reiniciar 🔄.

---

## 🔊 Sistema de Audio (Web Audio API)

Sin archivos externos. Síntesis en tiempo real:
- `click`: Golpe al enemigo (onda triangular descendente).
- `enemy_hit`: Daño recibido por el jugador (tono grave).
- `level_up`: Fanfarria ascendente al subir de nivel.
- `loot`: Arpegio alegre al obtener ítem.
- `boss_defeat`: Secuencia dramática al derrotar jefe.

---

## ❗ Tareas Pendientes / Mejoras Futuras

### 🔴 Bugs conocidos / Correcciones críticas
- [ ] **Debuff de trampa no se limpia correctamente**: El debuff de ataque/defensa de la trampa debe limpiarse al iniciar el siguiente combate, no solo al terminar. Revisar la función `resolveNode`.
- [ ] **Merchant wares rendering**: El grid del mercader usa clases `merchant-ware-card` que no tienen estilos definidos en `styles.css` (hay estilos para `.merchant-item` en cambio). Revisar inconsistencia de nombres de clase CSS.
- [ ] **explore-view nunca se muestra**: Con el flujo actual de combate inline, la vista `#explore-view` quedó sin uso funcional real. Puede eliminarse o reaprovecharse.

### 🟡 Mejoras de jugabilidad
- [ ] **Sistema de muerte/game over**: Actualmente si el héroe llega a 0 HP no hay pantalla de game over, solo el HP queda en 0. Implementar modal de muerte con opción de reiniciar o continuar desde save.
- [ ] **Más tipos de eventos**: Ampliar los 3 eventos actuales. Ideas posibles:
  - Evento de XP extra (altar, reliquia).
  - Evento de elección moral (riesgo/recompensa variable).
  - Evento de curación parcial gratuita (manantial mágico).
  - Evento de mejora temporal de stats (bendición).
- [ ] **Barra de progreso del mapa**: Mostrar visualmente en cuántos nodos del total va el jugador en la zona (por ejemplo una barra o una fila de íconos).
- [ ] **Animación de transición entre nodos**: Un pequeño fundido o animación al avanzar entre nodos para dar sensación de movimiento.
- [ ] **Regen de HP fuera de combate**: Entre combates el jugador debería recuperar HP pasivamente (o hay que indicar claramente que no regenera).

### 🟡 Mejoras de contenido
- [ ] **Más ítems en la pool**: Ampliar los arrays `ITEM_NAMES` con más nombres creativos por rareza y slot.
- [ ] **Ítems especiales con efectos únicos**: Actualmente todos los ítems dan stats planos. Se podría agregar efectos especiales como "5% de drenar vida en cada golpe" o "10% de chance de ignorar defensa".
- [ ] **Sets de ítems o sinergias**: Bonus adicional al llevar ciertos ítems combinados.
- [ ] **Zona adicional / Post-game**: Una 5ª zona o modo infinito con dificultad escalada para contenido post-campaña.

### 🟢 Mejoras de interfaz / UX
- [ ] **Tooltips en atributos del panel izquierdo**: Al pasar el ratón sobre los valores de estadísticas (HP, ATK, etc.) mostrar un breakdown de cómo se calculó ese valor.
- [ ] **Confirmación de reset**: El botón 🔄 de reinicio actualmente no pide confirmación. Se podría agregar un modal de confirmación para evitar pérdidas accidentales.
- [ ] **Indicador visual de nivel requerido en habilidades bloqueadas**: Actualmente el cover de habilidad bloqueada muestra el nivel requerido, pero podría mejorarse visualmente.
- [ ] **Historia accesible desde el menú**: Permitir releer los capítulos de historia desbloqueados desde algún lugar del UI.
- [ ] **Responsive / mobile**: El layout de 3 columnas no está optimizado para pantallas pequeñas. Se podría agregar un breakpoint mobile que apile o reorganice los paneles.

### 🔵 Técnico / Arquitectura
- [ ] **Refactorizar `game.js`**: El archivo tiene ~2600 líneas en un solo archivo. Sería beneficioso dividirlo en módulos: `state.js`, `combat.js`, `map.js`, `skills.js`, `items.js`, `ui.js`, `audio.js`.
- [ ] **Internacionalización**: Todo el texto está en español hardcodeado. Si se quisiera publicar para más audiencias, centralizar strings sería el primer paso.
- [ ] **Persistencia mejorada**: En lugar de serializar todo el `state` en localStorage, se podría usar IndexedDB para mayor capacidad y robustez.

---

## 🚀 Cómo ejecutar localmente

```bash
# Opción 1: Python (sin instalación extra si ya tienes Python 3)
cd c:\webgame
python -m http.server 8000
# Luego abre: http://localhost:8000

# Opción 2: Node.js con npx
npx serve c:\webgame
```

---

## 📌 Contexto técnico relevante para agentes

- **Sin frameworks**: HTML/CSS/JS puro. Todo en 3 archivos.
- **Estado del juego**: Variable global `state` en `game.js` (línea 2). Todo el estado vive ahí.
- **Bucle principal**: `requestAnimationFrame` con delta time. En `game.js` buscar `gameLoop`.
- **IDs HTML clave**:
  - `#combat-view`, `#explore-view`, `#event-view`: Subvistas de la arena (solo una visible a la vez, controlada por `.hidden`).
  - `#combat-advance-container` / `#btn-combat-advance`: Botón de avanzar inline en combate.
  - `#event-choices-container`: Donde se inyectan dinámicamente los botones de eventos.
  - `#merchant-shop-container`: Tienda del mercader (dentro de `#event-view`).
  - `#pane-attributes`, `#pane-skills`: Paneles de pestañas del sidebar izquierdo.
  - `#tab-btn-attributes`, `#tab-btn-skills`: Botones de pestaña.
  - `#inventory-grid-container`: Grid de la mochila.
  - `#skill-upgrades-container`: Lista de mejoras de habilidades (generada dinámicamente).
  - `#skills-grid-container`: Botones de habilidades activas en el panel central.
- **Funciones clave en `game.js`**:
  - `generateMap()`: Genera los nodos de la zona actual.
  - `advanceNode()`: Avanza al siguiente nodo del mapa.
  - `resolveNode(node)`: Decide qué mostrar según el tipo de nodo.
  - `spawnEnemyForNode(node)`: Genera estadísticas del enemigo.
  - `setupRestNode()` / `setupSpecialEventNode()`: Configuran los eventos de descanso y eventos especiales.
  - `openMerchantShop()` / `renderMerchantShop()`: Lógica de la tienda.
  - `getPlayerAtk()`, `getPlayerDef()`, `getPlayerDps()`, `getPlayerMaxHp()`: Calculan stats totales del jugador.
  - `renderAttributesUI()` / `renderSkillUpgradesUI()`: Renderizan los paneles de atributos y habilidades.
  - `updateUI()`: Función principal de refresco de toda la UI.
  - `saveGame()` / `loadGame()`: Persistencia en localStorage.
  - `addLog(msg, type)`: Añade entrada al registro de batalla.
  - `showSubview(name)`: Muestra `combat`, `explore` o `event` ocultando los demás.
  - `showAdvanceButtonInEvent()`: Inyecta el botón de avanzar dentro del contenedor de eventos.
- **CSS importante**:
  - `.hidden { display: none !important; }`: Clase utilitaria global. Su ausencia causaría bugs de vistas superpuestas.
  - `.rpg-tabs-container`, `.rpg-tab-btn.active`, `.rpg-tab-content-pane`: Sistema de pestañas del sidebar.
  - `.arena-subview`: Clase base de todas las subvistas de la arena.
  - Raridades: `.rarity-comun`, `.rarity-raro`, `.rarity-epico`, `.rarity-legendario`.
