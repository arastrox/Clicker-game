# Hero Clicker RPG - Resumen del Proyecto

Este documento proporciona una visión general de la arquitectura, mecánicas y archivos que componen el videojuego web **Hero Clicker RPG**.

---

## 📁 Estructura del Proyecto

El proyecto está diseñado de forma compacta e independiente usando tecnologías web nativas, sin necesidad de frameworks pesados o dependencias externas:

*   **`index.html`**: Estructura semántica del juego. Define las tres columnas del diseño (Estadísticas/Mejoras, Arena de Combate, e Inventario/Bitácora), el reproductor de sonido, las ranuras de equipamiento y los modales de la historia.
*   **`styles.css`**: Hoja de estilos basada en una temática de fantasía oscura. Utiliza un diseño de paneles translúcidos (*glassmorphism*), animaciones de combate (sacudidas al recibir daño, rebotes al hacer click, números flotantes de daño) y soporte responsivo para móviles.
*   **`game.js`**: El motor del juego. Controla el bucle principal de renderizado (`requestAnimationFrame`), el sistema de combate activo y pasivo, la generación de botines procedimentales, la tienda, el guardado de partida en `localStorage` y el sintetizador de sonido retro de 8 bits.

---

## ⚔️ Mecánicas Principales

### 1. Sistema de Combate y Progreso
*   **Combate Activo**: Al hacer click en el sprite del enemigo (o presionar la tecla `Espacio`), infliges daño de forma activa basado en tu estadística de **Daño Click**.
*   **Combate Pasivo (DPS)**: Tus mercenarios contratados atacan automáticamente cada segundo infligiendo daño pasivo.
*   **Ataque Enemigo**: Los monstruos tienen una barra de carga de ataque. Al llenarse, golpean al héroe. El daño sufrido es mitigado por la **Defensa** del jugador.
*   **Progreso de Zonas**: El juego avanza a través de distintas zonas (Bosque Susurrante, Cueva de Cristal, Volcán de Fuego Eterno, Castillo Flotante). Cada zona consta de 10 enemigos; el último es un **Jefe de Zona** con estadísticas potenciadas.

### 2. Generación Procedimental de Botín (Loot)
Al derrotar monstruos normales (25% de probabilidad) o jefes (100% de probabilidad), cae un equipamiento aleatorio en una de las tres ranuras:
*   **Arma (Weapon)**: Incrementa el Daño Click.
*   **Armadura (Armor)**: Incrementa la Vida Máxima y otorga Defensa plana.
*   **Accesorio (Accessory)**: Incrementa el daño automático (DPS).

Los ítems se clasifican en cuatro rarezas que escalan sus estadísticas exponencialmente:
*   ⚪ **Común** (Gris)
*   🔵 **Raro** (Azul)
*   🟣 **Épico** (Morado)
*   🟠 **Legendario** (Naranja con brillo especial)

### 3. Tienda de Mejoras
El jugador puede gastar el oro recolectado para mejorar permanentemente sus atributos base:
*   **Entrenamiento de Fuerza**: +1 Daño Click.
*   **Armadura de Malla**: +10 Vida Máxima.
*   **Escudo de Madera**: +1 Defensa.
*   **Reclutar Mercenario**: +0.5 DPS (Daño Auto).

### 4. Sintetizador de Audio Retro (Web Audio API)
No requiere archivos de audio externos. El juego sintetiza ondas de sonido en tiempo real para generar efectos de 8-bits:
*   *Click/Golpe*: Ráfaga corta de ruido blanco.
*   *Daño a Jugador*: Tono descendente.
*   *Nivel Superior / Jefe Derrotado*: Fanfarria ascendente.
*   *Caída de Objeto / Botín*: Breve arpegio alegre.

---

## 📖 Novedades de la Fase 2 (Historia e Interfaz)

1.  **Modales de Historia (Progreso de Capítulos)**:
    Al derrotar al jefe de cada zona (niveles 10, 20, 30 y 40), el juego se pausa temporalmente y se despliega un modilo narrativo de la campaña para contextualizar el viaje del héroe. La aventura se reanuda tras pulsar "Continuar".
2.  **Bitácora Colapsable (Acordeón)**:
    La sección del **Registro de Batalla** ahora cuenta con una cabecera interactiva que permite colapsar y expandir la consola de texto para maximizar el espacio en la mochila del inventario.
3.  **Deselección de Objetos**:
    Ahora es posible ocultar la descripción del objeto seleccionado y liberar la pantalla de detalles de dos formas intuitivas:
    *   Haciendo click en el botón de cerrar (`×`) en la esquina superior del panel de detalles.
    *   Haciendo click de nuevo en la misma ranura del ítem seleccionado en la mochila.

---

## 🚀 Instrucciones para Ejecutar Localmente

Para iniciar el servidor de desarrollo y jugar:
1. Abre una consola en la carpeta raíz del juego (`c:\webgame`).
2. Ejecuta un servidor local rápido. Por ejemplo, con Python:
   ```bash
   python -m http.server 8000
   ```
3. Abre en tu navegador la dirección:
   👉 **http://localhost:8000**
