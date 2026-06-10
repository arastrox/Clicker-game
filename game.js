// Game State configuration
let state = {
    player: {
        name: "Héroe",
        class: null, // warrior, mage, rogue
        classResource: 0,
        hp: 100,
        maxHp: 100,
        baseAtk: 5,
        baseDps: 0,
        baseDef: 0,
        gold: 0,
        xp: 0,
        maxXp: 100,
        lvl: 1,
        // Equipped items
        weapon: null,      // Stat bonus: attack
        armor: null,       // Stat bonus: maxHp, defense
        accessory: null,   // Stat bonus: dps, extra gold, hp-regen
        skillsState: {
            skill1_cd: 0,
            skill2_cd: 0,
            skill3_cd: 0,
            skill4_cd: 0
        },
        activeBuffs: {
            stunDuration: 0,
            battleCryDuration: 0,
            immunityDuration: 0,
            dodgeDuration: 0,
            adrenalineDuration: 0,
            burnDuration: 0,
            burnDmg: 0,
            poisonDuration: 0,
            poisonDmg: 0,
            warpDuration: 0
        },
        // Phase 4 RPG attributes
        attributePoints: 0,
        skillPoints: 0,
        stats: {
            str: 0,
            con: 0,
            dex: 0,
            ref: 0,
            agi: 0
        },
        skillRanks: {
            skill1: 1,
            skill2: 1,
            skill3: 1,
            skill4: 1
        },
        debuffs: {
            atkDebuff: 0, // percentage click damage reduction (e.g. 0.20 for -20%)
            defDebuff: 0  // flat defense reduction
        }
    },
    enemy: {
        name: "Babosa",
        hp: 40,
        maxHp: 40,
        lvl: 1,
        atk: 4,
        isBoss: false,
        goldReward: 5,
        xpReward: 10,
        sprite: "🐌",
        atkSpeed: 2.0, // seconds per attack
        atkCooldown: 0 // current progress
    },
    currentZone: 0,
    zoneProgress: 0, // current node number (1 to maxNodes)
    highestZone: 0,
    highestLvl: 1,
    inventory: [],
    maxInventorySlots: 16,
    isMuted: false,
    isPaused: false,
    
    // Phase 4 Roguelike Map
    map: {
        maxNodes: 12, // Randomly rolled 10-20
        currentNode: 0,
        nodeType: "explore", // explore, combat, event
        pathClear: true,
        currentEvent: null
    },
    merchantWares: []
};

// Global Timers for class dot ticks
let dotTimer = 0;
let manaRegenTimer = 0;

// RPG Classes & Skills configuration - LEVELS UPDATED TO 3, 5, 8, 12
const CLASSES_CONFIG = {
    warrior: {
        name: "Guerrero",
        icon: "🛡️",
        statMods: { maxHp: 30, baseDef: 2, baseAtk: -1 },
        resourceName: "Ira",
        maxResource: 100,
        skills: [
            { id: "shield_slam", name: "Golpe Escudo", icon: "💥", lvl: 3, cost: 0, cooldown: 12, desc: "Inflige 3x Daño (+20% por Rango) y aturde al enemigo por 3s." },
            { id: "battle_cry", name: "Grito Batalla", icon: "📣", lvl: 5, cost: 0, cooldown: 20, desc: "Aumenta la Defensa en +8 (+2 por Rango) y Daño Click en +30% (+10% por Rango) por 8s." },
            { id: "indomitable", name: "Indomable", icon: "❤️", lvl: 8, cost: 0, cooldown: 25, desc: "Restaura instantáneamente el 25% (+5% por Rango) de tu Vida Máxima." },
            { id: "last_stand", name: "Último Bastión", icon: "👑", lvl: 12, cost: 50, cooldown: 40, desc: "Consume 50 de Ira. Inmunidad total y +100% (+30% por Rango) Daño Click por 6s." }
        ]
    },
    mage: {
        name: "Mago",
        icon: "🔮",
        statMods: { maxHp: -15, baseAtk: -2, baseDps: 2 },
        resourceName: "Maná",
        maxResource: 100,
        skills: [
            { id: "fireball", name: "Bola Fuego", icon: "🔥", lvl: 3, cost: 25, cooldown: 8, desc: "Daño instantáneo (6x Daño, +1x por Rango) y quemadura (1.5x, +0.5x por Rango Daño/s) por 4s." },
            { id: "ice_barrier", name: "Barrera Hielo", icon: "❄️", lvl: 5, cost: 35, cooldown: 22, desc: "Crea un escudo mágico que absorbe el 100% del daño por 5s (+1s por Rango)." },
            { id: "time_warp", name: "Distorsión Temp", icon: "⏳", lvl: 8, cost: 40, cooldown: 28, desc: "DPS Auto +150% (+30% por Rango) y cooldowns acelerados al doble por 6s (+1s por Rango)." },
            { id: "meteor_storm", name: "Meteoro", icon: "☄️", lvl: 12, cost: 80, cooldown: 45, desc: "Inflige 25x Daño (+5x por Rango) y aturde al enemigo por 4s." }
        ]
    },
    rogue: {
        name: "Pícaro",
        icon: "🗡️",
        statMods: { maxHp: -10, baseAtk: 1 },
        resourceName: "Combo",
        maxResource: 5,
        skills: [
            { id: "poison_blades", name: "Hojas Venenosas", icon: "🐍", lvl: 3, cost: 0, cooldown: 10, desc: "Daño 2x (+0.5x por Rango) y veneno (0.5x, +0.1x por Rango Daño/s por combo) por 5s. Consume combo." },
            { id: "shadow_step", name: "Esquiva Sombría", icon: "👣", lvl: 5, cost: 0, cooldown: 18, desc: "Aumenta la probabilidad de esquivar ataques en +60% (+5% por Rango) por 5s." },
            { id: "adrenaline_rush", name: "Adrenalina", icon: "⚡", lvl: 8, cost: 0, cooldown: 25, desc: "Otorga +100% de Crítico y atacas el doble de rápido por 6s (+1s por Rango)." },
            { id: "blade_dance", name: "Danza Hojas", icon: "🌪️", lvl: 12, cost: 5, cooldown: 35, desc: "Consume 5 combos. Realiza 10 golpes rápidos (hacen 2.5x Daño, +0.5x por Rango cada uno)." }
        ]
    }
};

// Zone Configurations
const ZONES = [
    {
        name: "Bosque Susurrante",
        minLvl: 1,
        maxLvl: 10,
        enemies: [
            { name: "Babosa Verde", sprite: "🐌", type: "normal" },
            { name: "Murciélago de Caza", sprite: "🦇", type: "normal" },
            { name: "Duendecillo", sprite: "👺", type: "normal" },
            { name: "Lobo Gris", sprite: "🐺", type: "normal" }
        ],
        boss: { name: "Orco Gigante", sprite: "👹", type: "boss" }
    },
    {
        name: "Cueva de Cristal",
        minLvl: 11,
        maxLvl: 20,
        enemies: [
            { name: "Esqueleto de Mina", sprite: "💀", type: "normal" },
            { name: "Araña de Cristal", sprite: "🕷️", type: "normal" },
            { name: "Zombi Errante", sprite: "🧟", type: "normal" },
            { name: "Sombra Acechante", sprite: "👤", type: "normal" }
        ],
        boss: { name: "Gólem de Piedra Tallada", sprite: "🪨", type: "boss" }
    },
    {
        name: "Volcán de Fuego Eterno",
        minLvl: 21,
        maxLvl: 30,
        enemies: [
            { name: "Elemental Ígneo", sprite: "🔥", type: "normal" },
            { name: "Serpiente de Lava", sprite: "🐍", type: "normal" },
            { name: "Rana de Ceniza", sprite: "🐸", type: "normal" },
            { name: "Lagarto de Fuego", sprite: "🦎", type: "normal" }
        ],
        boss: { name: "Dragón de Obsidiana", sprite: "🐲", type: "boss" }
    },
    {
        name: "Castillo Flotante",
        minLvl: 31,
        maxLvl: 999,
        enemies: [
            { name: "Gárgola Imperial", sprite: "👿", type: "normal" },
            { name: "Espectro del Trono", sprite: "👻", type: "normal" },
            { name: "Caballero Caído", sprite: "🛡️", type: "normal" },
            { name: "Quimera del Vacío", sprite: "🦁", type: "normal" }
        ],
        boss: { name: "Rey Hechicero de las Sombras", sprite: "🧙‍♂️", type: "boss" }
    }
];

// Item templates for random generation
const ITEM_NAMES = {
    weapon: {
        comun: ["Cuchillo Oxidado", "Daga Corta", "Garrote de Madera", "Espada de Hierro Viejo"],
        raro: ["Hoja de Acero Templado", "Martillo de Guerra", "Hacha de Asalto"],
        epico: ["Filo del Viento", "Espada Rúnica", "Cetro de Cristal"],
        legendario: ["Matadragones", "Hoja de Luz Divina", "Destructor Astral"]
    },
    armor: {
        comun: ["Harapos Sucios", "Chaqueta de Cuero Curtido", "Cota de Malla Simple"],
        raro: ["Armadura de Placas de Hierro", "Peto de Cuero Reforzado", "Malla Rúnica"],
        epico: ["Coraza de Placas Pesadas", "Armadura de Corazón de Cristal", "Capa del Hechicero"],
        legendario: ["Armadura del Rey Caído", "Égida Imperial", "Piel de Dragón Dorado"]
    },
    accessory: {
        comun: ["Anillo de Hueso", "Amuleto de Cobre", "Cinturón Desgastado"],
        raro: ["Anillo de Plata Antigua", "Talismán de Sabiduría", "Piedra de la Suerte"],
        epico: ["Amuleto del Fénix", "Sello de Poder Elemental", "Reliquia Sagrada"],
        legendario: ["Ojo de la Eternidad", "Anillo del Infinito", "Emblema del Héroe Legendario"]
    }
};

const ITEM_DESCS = {
    weapon: "Un arma robusta que aumenta tu daño al hacer click.",
    armor: "Un blindaje defensivo que incrementa tu vida máxima y reduce el daño recibido.",
    accessory: "Una reliquia cargada de magia que incrementa el daño automático (DPS) e influye en otras estadísticas."
};

// Story database for narratives unlocked at zone boss defeats
const STORY_EVENTS = {
    0: {
        title: "Capítulo I: El despertar en el Bosque Susurrante",
        text: "Al derrotar al gran Orco Gigante, un pesado silencio cae sobre el Bosque Susurrante. De sus garras sin vida rueda un fragmento de cristal que parpadea con una fría luz violácea. Al tocarlo, una visión cruza tu mente: una cueva antigua, repleta de cristales que cantan con magia inestable y un eco lejano que te desafía. Reúnes tus pertenencias; la Cueva de Cristal aguarda, y con ella, misterios aún más profundos..."
    },
    1: {
        title: "Capítulo II: Las profundidades de Cristal",
        text: "El gigantesco Gólem de Piedra se desmorona en cientos de fragmentos cristalinos. En lo que fue su pecho, descubres un portal tallado en roca volcánica que vibra con un calor insoportable. Una antigua inscripción advierte: 'Solo aquel que domine las llamas del dragón podrá reclamar las alturas'. El aire se vuelve sofocante y el suelo tiembla bajo tus pies. Debes descender al Volcán de Fuego Eterno..."
    },
    2: {
        title: "Capítulo III: El aliento del Volcán",
        text: "El temible Dragón de Obsidiana suelta un último rugido antes de colapsar, disolviéndose en ríos de magma. De sus cenizas se eleva un torrente de energía térmica que activa un ascensor rúnico gigante. Miras hacia arriba: más allá de las densas nubes de ceniza, un Castillo Flotante suspendido por cadenas doradas flota en el firmamento. El Rey Hechicero de las Sombras sabe que te acercas..."
    },
    3: {
        title: "Capítulo IV: Las Sombras del Castillo Flotante",
        text: "El Rey Hechicero es derrotado. Sus ropajes oscuros se desvanecen en la brisa y la barrera mágica que asolaba el reino se rompe. La luz del amanecer baña el castillo flotante por primera vez en siglos. Has cumplido la profecía, liberado al reino de la tiranía y te has coronado como el Héroe Legendario. ¡Tu hazaña principal está completa! Sin embargo, la brecha dimensional sigue abierta, y monstruos infinitamente más peligrosos se avecinan..."
    }
};

function triggerStory(zoneIndex) {
    const story = STORY_EVENTS[zoneIndex];
    if (story) {
        state.isPaused = true;
        document.getElementById("txt-story-title").innerText = story.title;
        document.getElementById("txt-story-content").innerText = story.text;
        document.getElementById("story-modal").classList.remove("hidden");
    }
}

// Web Audio API Setup for Synthesized Retro Sound Effects
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (state.isMuted) return;
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') {
        // Attempt to resume audio context if suspended
        audioCtx.resume();
    }
    
    try {
        const now = audioCtx.currentTime;
        
        if (type === 'click') {
            // Player hits enemy: quick punchy sound
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            
            osc.start(now);
            osc.stop(now + 0.1);
            
        } else if (type === 'enemyHit') {
            // Enemy hits player: deep crash sound
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(20, now + 0.15);
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            
            osc.start(now);
            osc.stop(now + 0.15);
            
        } else if (type === 'loot') {
            // Item drops: shiny arpeggio
            const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
            notes.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
                
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.08, now + (idx * 0.08) + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.08) + 0.12);
                
                osc.start(now + (idx * 0.08));
                osc.stop(now + (idx * 0.08) + 0.15);
            });
            
        } else if (type === 'lvlup') {
            // Player level up: epic ascending notes
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + (idx * 0.07));
                
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.05, now + (idx * 0.07) + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.005, now + (idx * 0.07) + 0.15);
                
                osc.start(now + (idx * 0.07));
                osc.stop(now + (idx * 0.07) + 0.18);
            });
            
        } else if (type === 'faint') {
            // Player faints: sad descending slide
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.6);
            
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            
            osc.start(now);
            osc.stop(now + 0.6);
        }
    } catch (e) {
        console.error("Error al reproducir audio:", e);
    }
}

// Stats Calculation Helpers
function getStatFromAttributes(statName) {
    const stats = state.player.stats || { str: 0, con: 0, dex: 0, ref: 0, agi: 0 };
    const cl = state.player.class;
    if (!cl) return 0;
    
    if (cl === "warrior") {
        switch (statName) {
            case "atk": return stats.str * 1.0;
            case "hp": return stats.con * 20;
            case "dps": return stats.dex * 0.4;
            case "def": return stats.ref * 0.8;
            case "crit": return stats.agi * 0.01;
        }
    } else if (cl === "mage") {
        switch (statName) {
            case "atk": return stats.str * 0.5;
            case "hp": return stats.con * 8;
            case "dps": return stats.dex * 1.5;
            case "def": return stats.ref * 0.3;
            case "crit": return stats.agi * 0.01;
            case "mana": return stats.agi * 5;
        }
    } else if (cl === "rogue") {
        switch (statName) {
            case "atk": return stats.str * 1.2;
            case "hp": return stats.con * 10;
            case "dps": return stats.dex * 0.8;
            case "def": return stats.ref * 0.4;
            case "crit": return stats.agi * 0.025;
        }
    }
    return 0;
}

function getPlayerClassStatMod(stat) {
    if (!state.player.class) return 0;
    const config = CLASSES_CONFIG[state.player.class];
    if (config && config.statMods && config.statMods[stat]) {
        return config.statMods[stat];
    }
    return 0;
}

function getPlayerCritRate() {
    let rate = 0.05; // 5% base
    if (state.player.class === "rogue") {
        rate = 0.20; // 20% base for Rogue
    }
    rate += getStatFromAttributes("crit");
    if (state.player.activeBuffs && state.player.activeBuffs.adrenalineDuration > 0) {
        rate = 1.0; // 100% crit rate under Adrenaline Rush
    }
    return rate;
}

function getPlayerCritMultiplier() {
    if (state.player.class === "rogue") {
        return 2.5; // Rogue does 250% critical damage
    }
    return 2.0; // Others do 200%
}

// Main Stats Calculations
function getPlayerAtk() {
    let bonus = 0;
    if (state.player.weapon) {
        bonus += state.player.weapon.statValue;
    }
    const classMod = getPlayerClassStatMod("baseAtk");
    const attrBonus = getStatFromAttributes("atk");
    let atk = state.player.baseAtk + classMod + attrBonus + bonus;
    
    // Apply temporary trap debuff
    if (state.player.debuffs && state.player.debuffs.atkDebuff > 0) {
        atk = Math.floor(atk * (1 - state.player.debuffs.atkDebuff));
    }
    // Apply temporary potion damage buff
    if (state.player.activeBuffs && state.player.activeBuffs.potionAtkBuff > 0) {
        atk = Math.floor(atk * (1 + state.player.activeBuffs.potionAtkBuff));
    }
    // Battle Cry (+30% click damage base, +10% per rank)
    if (state.player.activeBuffs && state.player.activeBuffs.battleCryDuration > 0) {
        const rank = state.player.skillRanks?.skill2 || 1;
        const multiplier = 1.30 + (rank - 1) * 0.10;
        atk = Math.floor(atk * multiplier);
    }
    // Last Stand (+100% click damage base, +30% per rank)
    if (state.player.activeBuffs && state.player.activeBuffs.immunityDuration > 0 && state.player.class === "warrior") {
        const rank = state.player.skillRanks?.skill4 || 1;
        const multiplier = 2.0 + (rank - 1) * 0.30;
        atk = Math.floor(atk * multiplier);
    }
    return Math.max(1, atk);
}

function getPlayerMaxHp() {
    let bonus = 0;
    if (state.player.armor) {
        bonus += state.player.armor.statValue;
    }
    const classMod = getPlayerClassStatMod("maxHp");
    const attrBonus = getStatFromAttributes("hp");
    return state.player.maxHp + classMod + attrBonus + bonus;
}

function getPlayerDef() {
    let bonus = 0;
    if (state.player.armor && state.player.armor.defenseValue) {
        bonus += state.player.armor.defenseValue;
    }
    const classMod = getPlayerClassStatMod("baseDef");
    const attrBonus = getStatFromAttributes("def");
    let def = state.player.baseDef + classMod + attrBonus + bonus;
    
    // Battle Cry (+8 def base, +2 per rank)
    if (state.player.activeBuffs && state.player.activeBuffs.battleCryDuration > 0) {
        const rank = state.player.skillRanks?.skill2 || 1;
        def += 8 + (rank - 1) * 2;
    }
    // Apply temporary trap defense debuff
    if (state.player.debuffs && state.player.debuffs.defDebuff > 0) {
        def = Math.max(0, def - state.player.debuffs.defDebuff);
    }
    return def;
}

function getPlayerDps() {
    let bonus = 0;
    if (state.player.accessory) {
        bonus += state.player.accessory.statValue;
    }
    const classMod = getPlayerClassStatMod("baseDps");
    const attrBonus = getStatFromAttributes("dps");
    let dps = state.player.baseDps + classMod + attrBonus + bonus;
    
    // Time Warp (+150% dps base, +30% per rank)
    if (state.player.activeBuffs && state.player.activeBuffs.warpDuration > 0) {
        const rank = state.player.skillRanks?.skill3 || 1;
        const multiplier = 2.5 + (rank - 1) * 0.30;
        dps = Math.floor(dps * multiplier);
    }
    return dps;
}

// Subview switching
function showSubview(viewName) {
    const combat = document.getElementById("combat-view");
    const explore = document.getElementById("explore-view");
    const event = document.getElementById("event-view");
    
    if (combat) combat.classList.add("hidden");
    if (explore) explore.classList.add("hidden");
    if (event) event.classList.add("hidden");
    
    if (viewName === "combat" && combat) combat.classList.remove("hidden");
    else if (viewName === "explore" && explore) explore.classList.remove("hidden");
    else if (viewName === "event" && event) event.classList.remove("hidden");
}

function showAdvanceButtonInEvent() {
    const choicesContainer = document.getElementById("event-choices-container");
    if (!choicesContainer) return;
    choicesContainer.innerHTML = "";
    
    const advBtn = document.createElement("button");
    advBtn.className = "btn-action btn-gold";
    advBtn.style.margin = "10px auto";
    advBtn.style.display = "block";
    advBtn.style.width = "100%";
    advBtn.style.maxWidth = "260px";
    advBtn.innerText = "Avanzar por el Sendero ➡️";
    advBtn.addEventListener("click", () => {
        advanceNode();
    });
    choicesContainer.appendChild(advBtn);
}

// Map generation and node resolution
function generateMap() {
    const maxNodes = Math.floor(Math.random() * 11) + 10; // 10 to 20 nodes
    state.map.maxNodes = maxNodes;
    state.map.currentNode = 0;
    state.map.pathClear = true;
    state.map.nodes = [];
    
    for (let i = 1; i < maxNodes; i++) {
        const roll = Math.random();
        let nodeType = "enemy";
        if (roll < 0.55) {
            nodeType = "enemy";
        } else if (roll < 0.70) {
            nodeType = "elite";
        } else if (roll < 0.85) {
            nodeType = "rest";
        } else {
            nodeType = "event";
        }
        
        state.map.nodes.push({
            id: i,
            type: nodeType,
            resolved: false
        });
    }
    
    // Boss node
    state.map.nodes.push({
        id: maxNodes,
        type: "boss",
        resolved: false
    });
}

function advanceNode() {
    if (!state.map.pathClear) {
        addLog("El camino está obstruido por una situación actual.", "system-log");
        return;
    }
    
    initAudio();
    playSound('click');
    
    state.map.currentNode++;
    state.map.pathClear = false;
    state.zoneProgress = state.map.currentNode;
    
    const nodeIndex = state.map.currentNode - 1;
    const node = state.map.nodes[nodeIndex];
    
    if (!node) {
        // Fallback safety
        state.map.currentNode = state.map.maxNodes;
        state.map.pathClear = true;
        showSubview("explore");
        updateUI();
        return;
    }
    
    resolveNode(node);
}

function resolveNode(node) {
    if (node.type === "enemy" || node.type === "elite" || node.type === "boss") {
        state.map.nodeType = "combat";
        showSubview("combat");
        spawnEnemyForNode(node);
    } else {
        state.map.nodeType = node.type;
        showSubview("event");
        if (node.type === "rest") {
            setupRestNode(node);
        } else if (node.type === "event") {
            setupSpecialEventNode(node);
        }
    }
}

function spawnEnemyForNode(node) {
    const zoneIndex = state.currentZone;
    const zone = ZONES[zoneIndex];
    const enemyLvl = zone.minLvl + Math.floor((zone.maxLvl - zone.minLvl) * (state.map.currentNode / state.map.maxNodes));
    
    let enemyTemplate;
    let isBoss = false;
    let isElite = false;
    let isMimic = false;
    
    if (node.type === "boss") {
        enemyTemplate = zone.boss;
        isBoss = true;
    } else if (node.type === "mimic") {
        enemyTemplate = { name: "Mimic Cofre Hambriento", sprite: "📦", type: "normal" };
        isMimic = true;
    } else {
        const randIdx = Math.floor(Math.random() * zone.enemies.length);
        enemyTemplate = zone.enemies[randIdx];
        if (node.type === "elite") {
            isElite = true;
        }
    }
    
    // Base stats calculations
    let hpScale = 30 + Math.pow(enemyLvl, 1.45) * 12;
    let atkScale = 3 + Math.pow(enemyLvl, 1.1) * 2;
    
    if (isBoss) {
        hpScale *= 3.5;
        atkScale *= 1.8;
    } else if (isElite) {
        hpScale *= 2.0;
        atkScale *= 1.5;
    } else if (isMimic) {
        hpScale *= 1.8;
        atkScale *= 1.4;
    }
    
    state.enemy = {
        name: isBoss ? `⚔️ JEFE: ${enemyTemplate.name}` : isElite ? `💀 ELITE: ${enemyTemplate.name}` : isMimic ? `👿 MIMIC: ${enemyTemplate.name}` : enemyTemplate.name,
        hp: Math.floor(hpScale),
        maxHp: Math.floor(hpScale),
        lvl: enemyLvl,
        atk: Math.floor(atkScale),
        isBoss: isBoss,
        isElite: isElite,
        isMimic: isMimic,
        goldReward: Math.floor((enemyLvl * 3 + 4) * (isBoss ? 5 : isElite ? 2.5 : isMimic ? 3 : 1)),
        xpReward: Math.floor((enemyLvl * 5 + 6) * (isBoss ? 4 : isElite ? 2.0 : isMimic ? 2.5 : 1.2)),
        sprite: isMimic ? "📦" : enemyTemplate.sprite,
        atkSpeed: Math.max(0.8, 2.5 - (enemyLvl * 0.02)),
        atkCooldown: 0
    };
    
    const tag = document.getElementById("txt-enemy-tag");
    if (tag) {
        tag.innerText = isBoss ? "Jefe de Zona" : isElite ? "Elite" : isMimic ? "Mimic" : "Normal";
        tag.className = `enemy-tag ${isBoss ? 'boss' : isElite ? 'elite' : isMimic ? 'mimic' : ''}`;
    }
    
    updateUI();
}

function setupRestNode(node) {
    const titleEl = document.getElementById("txt-event-title");
    const descEl = document.getElementById("txt-event-desc");
    const choicesContainer = document.getElementById("event-choices-container");
    const merchantShop = document.getElementById("merchant-shop-container");
    
    if (merchantShop) merchantShop.classList.add("hidden");
    if (choicesContainer) choicesContainer.innerHTML = "";
    
    if (titleEl) titleEl.innerText = "⛺ Fogata de Descanso";
    if (descEl) descEl.innerText = "Encuentras un claro tranquilo en el sendero con los restos de una fogata. Es un buen momento para descansar, curar tus heridas y recuperar energía.";
    
    const restBtn = document.createElement("button");
    restBtn.className = "btn-action btn-gold";
    restBtn.innerText = "Descansar y Recuperar Energía (Cura 30% HP)";
    restBtn.addEventListener("click", () => {
        const healAmt = Math.floor(getPlayerMaxHp() * 0.30);
        state.player.hp = Math.min(getPlayerMaxHp(), state.player.hp + healAmt);
        spawnFloatingText(`+${healAmt}`, 100, 30, "hp-color");
        addLog(`Descansas en la fogata y recuperas +${healAmt} de vida.`, "system-log");
        
        state.map.pathClear = true;
        showAdvanceButtonInEvent();
        updateUI();
        saveGame();
    });
    
    if (choicesContainer) choicesContainer.appendChild(restBtn);
}

function setupSpecialEventNode(node) {
    const titleEl = document.getElementById("txt-event-title");
    const descEl = document.getElementById("txt-event-desc");
    const choicesContainer = document.getElementById("event-choices-container");
    const merchantShop = document.getElementById("merchant-shop-container");
    
    if (merchantShop) merchantShop.classList.add("hidden");
    if (choicesContainer) choicesContainer.innerHTML = "";
    
    const roll = Math.random();
    
    if (roll < 0.40) {
        // Merchant
        if (titleEl) titleEl.innerText = "❗ Evento: La Cueva del Comerciante";
        if (descEl) descEl.innerText = "Luego de caminar por unas horas, descubres una cueva cerca. Al ingresar, encuentras una pequeña tienda misteriosa iluminada por velas. Un anciano encapuchado te ofrece mercancías a cambio de tu oro.";
        
        const enterBtn = document.createElement("button");
        enterBtn.className = "btn-action btn-gold";
        enterBtn.innerText = "Revisar Mercancías";
        enterBtn.addEventListener("click", () => {
            choicesContainer.innerHTML = "";
            openMerchantShop();
        });
        if (choicesContainer) choicesContainer.appendChild(enterBtn);
        
        const ignoreBtn = document.createElement("button");
        ignoreBtn.className = "btn-action btn-danger";
        ignoreBtn.innerText = "Ignorar y Seguir";
        ignoreBtn.addEventListener("click", () => {
            addLog("Decides ignorar la tienda y continúas por el sendero.", "system-log");
            state.map.pathClear = true;
            showAdvanceButtonInEvent();
            updateUI();
            saveGame();
        });
        if (choicesContainer) choicesContainer.appendChild(ignoreBtn);
        
    } else if (roll < 0.70) {
        // Mimic
        if (titleEl) titleEl.innerText = "❗ Evento: El Cofre Brillante";
        if (descEl) descEl.innerText = "Después de avanzar un rato ves un ligero reflejo de algo brillante a lo lejos. Al acercarte encuentras un cofre pequeño tallado como si estuviera recién pulido. Ves que no tiene candado ni cerradura. ¿Intentas abrirlo?";
        
        const openBtn = document.createElement("button");
        openBtn.className = "btn-action btn-gold";
        openBtn.innerText = "Abrir el Cofre";
        openBtn.addEventListener("click", () => {
            choicesContainer.innerHTML = "";
            addLog("¡Al intentar abrir el cofre, este abre sus fauces repletas de dientes afilados! ¡Es un Mimic!", "system-log");
            
            state.map.nodeType = "combat";
            showSubview("combat");
            spawnEnemyForNode({ type: "mimic" });
        });
        if (choicesContainer) choicesContainer.appendChild(openBtn);
        
        const leaveBtn = document.createElement("button");
        leaveBtn.className = "btn-action btn-danger";
        leaveBtn.innerText = "Ignorarlo y Seguir";
        leaveBtn.addEventListener("click", () => {
            addLog("Prefieres no tentar al peligro y sigues de largo.", "system-log");
            state.map.pathClear = true;
            showAdvanceButtonInEvent();
            updateUI();
            saveGame();
        });
        if (choicesContainer) choicesContainer.appendChild(leaveBtn);
        
    } else {
        // Trap
        if (titleEl) titleEl.innerText = "❗ Evento: Trampa de Plantas Venenosas";
        if (descEl) descEl.innerText = "Decides seguir tu camino en línea recta, cuando caminando pisas una rama falsa. Una hilera de espinas cargadas con toxinas brota de las plantas y se clava en tu pierna.";
        
        const continueBtn = document.createElement("button");
        continueBtn.className = "btn-action btn-gold";
        continueBtn.innerText = "Quitar Espinas y Avanzar";
        continueBtn.addEventListener("click", () => {
            choicesContainer.innerHTML = "";
            
            const damage = Math.floor(getPlayerMaxHp() * 0.15);
            state.player.hp = Math.max(1, state.player.hp - damage);
            
            state.player.debuffs.atkDebuff = 0.20; // -20% Click Damage
            state.player.debuffs.defDebuff = 3;    // -3 Defense
            
            spawnFloatingText(`-${damage}`, 100, 30, "player-dmg");
            addLog(`La trampa te causó ${damage} de daño y te debilitó (-20% Daño Click, -3 Defensa para tu próximo combate).`, "damage-take");
            
            state.map.pathClear = true;
            showAdvanceButtonInEvent();
            updateUI();
            saveGame();
        });
        if (choicesContainer) choicesContainer.appendChild(continueBtn);
    }
}

function openMerchantShop() {
    const merchantShop = document.getElementById("merchant-shop-container");
    if (merchantShop) merchantShop.classList.remove("hidden");
    
    state.merchantWares = [];
    
    // Generate 3 to 4 pieces of equipment
    const numEquipment = Math.floor(Math.random() * 2) + 3;
    for (let i = 0; i < numEquipment; i++) {
        const lvlBonus = Math.random() < 0.10 ? 2 : 0;
        const item = generateItem(state.enemy.lvl + lvlBonus, false);
        const cost = Math.floor(item.value * 2.5);
        state.merchantWares.push({
            type: "equipment",
            item: item,
            cost: cost,
            name: item.name,
            icon: item.icon,
            desc: `${item.statName} +${item.statValue}${item.defenseValue ? ' | Def +' + item.defenseValue : ''}. ${item.desc}`
        });
    }
    
    // Potions
    state.merchantWares.push({
        type: "potion",
        potionType: "health",
        cost: 15,
        name: "Poción de Vida",
        icon: "🧪",
        desc: "Cura instantáneamente el 50% de tu Vida Máxima."
    });
    
    state.merchantWares.push({
        type: "potion",
        potionType: "damage",
        cost: 20,
        name: "Poción de Fuerza",
        icon: "🧪",
        desc: "Incrementa tu Daño Click en +25% para el próximo combate."
    });
    
    state.merchantWares.push({
        type: "potion",
        potionType: "regen",
        cost: 25,
        name: "Poción de Regeneración",
        icon: "🧪",
        desc: "Otorga regeneración de salud (+5 HP/s) para el próximo combate."
    });
    
    if (state.player.class === "mage") {
        state.merchantWares.push({
            type: "potion",
            potionType: "mana",
            cost: 15,
            name: "Poción de Maná",
            icon: "🧪",
            desc: "Restaura instantáneamente 100 de Maná."
        });
    }
    
    renderMerchantShop();
}

function renderMerchantShop() {
    const grid = document.getElementById("merchant-wares-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    state.merchantWares.forEach((ware, idx) => {
        const itemEl = document.createElement("div");
        itemEl.className = `merchant-ware-card ${ware.type === 'equipment' ? 'rarity-' + ware.item.rarity : ''}`;
        
        itemEl.innerHTML = `
            <div class="ware-icon">${ware.icon}</div>
            <div class="ware-details">
                <span class="ware-name">${ware.name}</span>
                <span class="ware-desc">${ware.desc}</span>
            </div>
            <button class="btn-buy-ware btn-action btn-gold" id="btn-buy-ware-${idx}">
                Comprar (${ware.cost} 🪙)
            </button>
        `;
        
        const buyBtn = itemEl.querySelector(`#btn-buy-ware-${idx}`);
        if (buyBtn) {
            buyBtn.disabled = (state.player.gold < ware.cost);
            buyBtn.addEventListener("click", () => {
                buyMerchantWare(idx);
            });
        }
        
        grid.appendChild(itemEl);
    });
}

function buyMerchantWare(index) {
    const ware = state.merchantWares[index];
    if (!ware || state.player.gold < ware.cost) return;
    
    initAudio();
    
    if (ware.type === "equipment") {
        if (state.inventory.length >= state.maxInventorySlots) {
            addLog("Mochila llena. No puedes comprar este equipamiento.", "system-log");
            return;
        }
        state.player.gold -= ware.cost;
        state.inventory.push(ware.item);
        playSound('loot');
        addLog(`Compraste [${ware.name}] por ${ware.cost} 🪙.`, "system-log");
        renderInventory();
    } else if (ware.type === "potion") {
        state.player.gold -= ware.cost;
        playSound('click');
        
        if (ware.potionType === "health") {
            const healAmt = Math.floor(getPlayerMaxHp() * 0.50);
            state.player.hp = Math.min(getPlayerMaxHp(), state.player.hp + healAmt);
            spawnFloatingText(`+${healAmt}`, 100, 30, "hp-color");
            addLog(`Bebiste Poción de Vida. Recuperas +${healAmt} HP.`, "system-log");
        } else if (ware.potionType === "damage") {
            state.player.activeBuffs.potionAtkBuff = 0.25;
            addLog("Bebiste Poción de Fuerza. +25% Daño Click para el próximo combate.", "system-log");
        } else if (ware.potionType === "regen") {
            state.player.activeBuffs.potionRegenDuration = 30;
            addLog("Bebiste Poción de Regeneración. Recuperas +5 HP/s por 30s.", "system-log");
        } else if (ware.potionType === "mana") {
            const maxMana = 100 + getStatFromAttributes("mana");
            state.player.classResource = Math.min(maxMana, state.player.classResource + 100);
            addLog("Bebiste Poción de Maná. Recuperas +100 Maná.", "system-log");
        }
    }
    
    if (ware.type === "equipment") {
        state.merchantWares.splice(index, 1);
    }
    
    renderMerchantShop();
    updateUI();
    saveGame();
}

// Procedural Item Generation
function generateItem(enemyLvl, isBoss) {
    // Determine rarity
    // Common: 60%, Rare: 30%, Epic: 9%, Legendary: 1% (non-boss)
    // Common: 10%, Rare: 40%, Epic: 40%, Legendary: 10% (boss)
    const roll = Math.random() * 100;
    let rarity = "comun";
    
    if (isBoss) {
        if (roll < 10) rarity = "comun";
        else if (roll < 50) rarity = "raro";
        else if (roll < 90) rarity = "epico";
        else rarity = "legendario";
    } else {
        if (roll < 60) rarity = "comun";
        else if (roll < 90) rarity = "raro";
        else if (roll < 99) rarity = "epico";
        else rarity = "legendario";
    }
    
    // Determine slot
    const slots = ["weapon", "armor", "accessory"];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    
    // Choose item details
    const namesList = ITEM_NAMES[slot][rarity];
    const name = namesList[Math.floor(Math.random() * namesList.length)];
    
    // Rarity multiplier for stats
    let multiplier = 1.0;
    if (rarity === "raro") multiplier = 1.6;
    else if (rarity === "epico") multiplier = 2.4;
    else if (rarity === "legendario") multiplier = 4.0;
    
    // Stats calculation based on enemy level
    let statValue = 0;
    let defenseValue = 0;
    let statName = "";
    let icon = "📦";
    
    if (slot === "weapon") {
        icon = rarity === "legendario" ? "⚔️" : "🗡️";
        statName = "Daño Click";
        statValue = Math.max(1, Math.floor(enemyLvl * 1.5 * multiplier));
    } else if (slot === "armor") {
        icon = rarity === "legendario" ? "👑" : "🛡️";
        statName = "Vida Máxima";
        statValue = Math.max(10, Math.floor(enemyLvl * 10 * multiplier));
        // Armors also give flat defense
        defenseValue = Math.max(1, Math.floor(enemyLvl * 0.3 * multiplier));
    } else if (slot === "accessory") {
        icon = rarity === "legendario" ? "🧿" : "💍";
        statName = "Daño Auto (DPS)";
        statValue = parseFloat((enemyLvl * 0.5 * multiplier).toFixed(1));
    }
    
    // Sell Value
    const baseVal = enemyLvl * 3;
    const rarityValMult = { comun: 1, raro: 3, epico: 7, legendario: 15 };
    const value = Math.floor(baseVal * rarityValMult[rarity]);
    
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    
    return {
        id,
        name,
        rarity,
        slot,
        statName,
        statValue,
        defenseValue,
        value,
        desc: ITEM_DESCS[slot],
        icon
    };
}

// Add logs helper
const logConsole = document.getElementById("log-console-container");
function addLog(text, className = "") {
    const entry = document.createElement("div");
    entry.className = `log-entry ${className}`;
    entry.innerText = text;
    logConsole.appendChild(entry);
    logConsole.scrollTop = logConsole.scrollHeight;
    
    // Keep logs under 50 items
    while (logConsole.childElementCount > 50) {
        logConsole.removeChild(logConsole.firstChild);
    }
}

// Flying numbers helper
const damageContainer = document.getElementById("damage-numbers-container");
function spawnFloatingText(text, x, y, className = "enemy-dmg") {
    const el = document.createElement("div");
    el.className = `damage-number ${className}`;
    el.innerText = text;
    // Slight random offset
    const randomX = x + (Math.random() * 40 - 20);
    const randomY = y + (Math.random() * 20 - 10);
    el.style.left = `${randomX}px`;
    el.style.top = `${randomY}px`;
    
    damageContainer.appendChild(el);
    setTimeout(() => {
        el.remove();
    }, 800);
}

// Generate enemy stats based on current zone and level progress
function spawnEnemy() {
    const zoneIndex = state.currentZone;
    const zone = ZONES[zoneIndex];
    
    // Level scales within the zone's min and max level range
    const step = state.zoneProgress; // 0 to 10
    const isBoss = (step === 10);
    
    const zoneLvlSpan = zone.maxLvl - zone.minLvl;
    const enemyLvl = isBoss ? zone.minLvl + 10 : zone.minLvl + step;
    
    let enemyTemplate;
    if (isBoss) {
        enemyTemplate = zone.boss;
    } else {
        const randIdx = Math.floor(Math.random() * zone.enemies.length);
        enemyTemplate = zone.enemies[randIdx];
    }
    
    // Scale HP and attack exponentially with level
    let hpScale = 30 + Math.pow(enemyLvl, 1.45) * 12;
    let atkScale = 3 + Math.pow(enemyLvl, 1.1) * 2;
    
    if (isBoss) {
        hpScale *= 3.5;
        atkScale *= 1.8;
    }
    
    state.enemy = {
        name: isBoss ? `⚔️ JEFE: ${enemyTemplate.name}` : enemyTemplate.name,
        hp: Math.floor(hpScale),
        maxHp: Math.floor(hpScale),
        lvl: enemyLvl,
        atk: Math.floor(atkScale),
        isBoss: isBoss,
        goldReward: Math.floor((enemyLvl * 3 + 4) * (isBoss ? 5 : 1)),
        xpReward: Math.floor((enemyLvl * 5 + 6) * (isBoss ? 4 : 1.2)),
        sprite: enemyTemplate.sprite,
        atkSpeed: Math.max(0.8, 2.5 - (enemyLvl * 0.02)), // enemies attack faster at higher levels
        atkCooldown: 0
    };
    
    // Visual indicators
    const tag = document.getElementById("txt-enemy-tag");
    tag.innerText = isBoss ? "Jefe de Zona" : "Normal";
    tag.className = `enemy-tag ${isBoss ? 'boss' : ''}`;
    
    updateUI();
}

// Combat loop updates
let lastTime = 0;
let autoAttackTimer = 0;
let saveTimer = 0;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    if (state.isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    saveTimer += dt;
    if (saveTimer >= 10) {
        saveGame();
        saveTimer = 0;
    }
    
    if (state.player.class) {
        const warpMult = (state.player.activeBuffs && state.player.activeBuffs.warpDuration > 0) ? 2.0 : 1.0;
        if (state.player.skillsState) {
            if (state.player.skillsState.skill1_cd > 0) state.player.skillsState.skill1_cd = Math.max(0, state.player.skillsState.skill1_cd - dt * warpMult);
            if (state.player.skillsState.skill2_cd > 0) state.player.skillsState.skill2_cd = Math.max(0, state.player.skillsState.skill2_cd - dt * warpMult);
            if (state.player.skillsState.skill3_cd > 0) state.player.skillsState.skill3_cd = Math.max(0, state.player.skillsState.skill3_cd - dt * warpMult);
            if (state.player.skillsState.skill4_cd > 0) state.player.skillsState.skill4_cd = Math.max(0, state.player.skillsState.skill4_cd - dt * warpMult);
        }
    }
    
    if (state.player.activeBuffs) {
        if (state.player.activeBuffs.stunDuration > 0) {
            state.player.activeBuffs.stunDuration = Math.max(0, state.player.activeBuffs.stunDuration - dt);
            document.getElementById("enemy-click-target").classList.add("stunned");
        } else {
            document.getElementById("enemy-click-target").classList.remove("stunned");
        }
        
        if (state.player.activeBuffs.battleCryDuration > 0) state.player.activeBuffs.battleCryDuration = Math.max(0, state.player.activeBuffs.battleCryDuration - dt);
        if (state.player.activeBuffs.immunityDuration > 0) state.player.activeBuffs.immunityDuration = Math.max(0, state.player.activeBuffs.immunityDuration - dt);
        if (state.player.activeBuffs.dodgeDuration > 0) state.player.activeBuffs.dodgeDuration = Math.max(0, state.player.activeBuffs.dodgeDuration - dt);
        if (state.player.activeBuffs.adrenalineDuration > 0) state.player.activeBuffs.adrenalineDuration = Math.max(0, state.player.activeBuffs.adrenalineDuration - dt);
        if (state.player.activeBuffs.warpDuration > 0) state.player.activeBuffs.warpDuration = Math.max(0, state.player.activeBuffs.warpDuration - dt);
        
        if (state.player.activeBuffs.potionRegenDuration > 0) {
            state.player.activeBuffs.potionRegenDuration = Math.max(0, state.player.activeBuffs.potionRegenDuration - dt);
        }
    }
    
    if (state.player.class === "mage" && state.player.hp > 0) {
        manaRegenTimer += dt;
        if (manaRegenTimer >= 1.0) {
            const maxMana = 100 + getStatFromAttributes("mana");
            state.player.classResource = Math.min(maxMana, state.player.classResource + 4);
            manaRegenTimer = 0;
        }
    }
    
    dotTimer += dt;
    if (dotTimer >= 1.0) {
        if (state.player.activeBuffs) {
            if (state.player.activeBuffs.burnDuration > 0) {
                state.player.activeBuffs.burnDuration = Math.max(0, state.player.activeBuffs.burnDuration - 1);
                dealDamageToEnemy(state.player.activeBuffs.burnDmg, false);
                spawnFloatingText(`🔥 ${state.player.activeBuffs.burnDmg}`, 100, 80, "player-dmg");
                document.getElementById("enemy-sprite-elem").classList.add("burned");
            } else {
                document.getElementById("enemy-sprite-elem").classList.remove("burned");
            }
            
            if (state.player.activeBuffs.poisonDuration > 0) {
                state.player.activeBuffs.poisonDuration = Math.max(0, state.player.activeBuffs.poisonDuration - 1);
                dealDamageToEnemy(state.player.activeBuffs.poisonDmg, false);
                spawnFloatingText(`🤢 ${state.player.activeBuffs.poisonDmg}`, 100, 80, "hp-color");
                document.getElementById("enemy-sprite-elem").classList.add("poisoned");
            } else {
                document.getElementById("enemy-sprite-elem").classList.remove("poisoned");
            }
            
            if (state.player.activeBuffs.potionRegenDuration > 0) {
                const regenAmt = 5;
                state.player.hp = Math.min(getPlayerMaxHp(), state.player.hp + regenAmt);
                spawnFloatingText(`+${regenAmt}`, 100, 30, "hp-color");
                updateUI();
            }
        }
        dotTimer = 0;
    }
    
    let dpsSpeedMult = 1.0;
    if (state.player.activeBuffs) {
        if (state.player.activeBuffs.adrenalineDuration > 0) dpsSpeedMult *= 2.0;
        if (state.player.activeBuffs.warpDuration > 0) dpsSpeedMult *= 2.5;
    }
    
    autoAttackTimer += dt * dpsSpeedMult;
    if (autoAttackTimer >= 1.0) {
        const dps = getPlayerDps();
        if (dps > 0) {
            dealDamageToEnemy(dps, false);
        }
        autoAttackTimer = 0;
    }
    
    if (state.enemy.hp > 0 && state.player.hp > 0 && state.map && !state.map.pathClear && state.map.nodeType === "combat") {
        const isStunned = (state.player.activeBuffs && state.player.activeBuffs.stunDuration > 0);
        if (!isStunned) {
            state.enemy.atkCooldown += dt;
            const ratio = Math.min(100, (state.enemy.atkCooldown / state.enemy.atkSpeed) * 100);
            document.getElementById("bar-enemy-atk").style.width = `${ratio}%`;
            
            if (state.enemy.atkCooldown >= state.enemy.atkSpeed) {
                state.enemy.atkCooldown = 0;
                dealDamageToPlayer(state.enemy.atk);
            }
        }
    } else {
        const enemyAtkBar = document.getElementById("bar-enemy-atk");
        if (enemyAtkBar) enemyAtkBar.style.width = "0%";
    }
    
    updateCooldownsUI();
    requestAnimationFrame(gameLoop);
}

// Separate real-time updates for cooldowns and resource to prevent UI lag
function updateCooldownsUI() {
    if (!state.player.class) return;
    
    // Update Resource Bar/Combos
    const resBarInner = document.getElementById("bar-class-resource");
    const resVal = document.getElementById("txt-resource-value");
    const comboContainer = document.getElementById("combo-points-container");
    const config = CLASSES_CONFIG[state.player.class];
    
    if (state.player.class === "rogue") {
        if (comboContainer) {
            comboContainer.classList.remove("hidden");
            const bubbles = comboContainer.querySelectorAll(".combo-point");
            bubbles.forEach((bubble, idx) => {
                if (idx < state.player.classResource) {
                    bubble.classList.add("active");
                } else {
                    bubble.classList.remove("active");
                }
            });
        }
        if (resVal) resVal.innerText = `${state.player.classResource} / 5`;
    } else {
        if (comboContainer) comboContainer.classList.add("hidden");
        if (resBarInner) {
            const maxRes = config.maxResource;
            const resPercent = Math.min(100, (state.player.classResource / maxRes) * 100);
            resBarInner.style.width = `${resPercent}%`;
            resBarInner.className = `resource-bar-inner ${state.player.class}`;
        }
        if (resVal) resVal.innerText = `${state.player.classResource} / ${config.maxResource}`;
    }
    
    // Update Skill Cooldowns
    for (let i = 1; i <= 4; i++) {
        const cdKey = `skill${i}_cd`;
        const cdVal = state.player.skillsState ? state.player.skillsState[cdKey] : 0;
        const overlay = document.getElementById(`skill-cd-overlay-${i}`);
        const text = document.getElementById(`skill-cd-text-${i}`);
        const btn = document.getElementById(`btn-skill-${i}`);
        
        if (overlay && text) {
            if (cdVal > 0) {
                overlay.classList.add("active");
                text.innerText = Math.ceil(cdVal);
                if (btn) btn.disabled = true;
            } else {
                overlay.classList.remove("active");
                // Enable if unlocked and resource matches
                const skill = config.skills[i - 1];
                const isLocked = state.player.lvl < skill.lvl;
                let hasResource = true;
                if (skill.cost > 0 && state.player.classResource < skill.cost) {
                    hasResource = false;
                }
                if (btn) btn.disabled = isLocked || !hasResource;
            }
        }
    }
}

// Actions
function dealDamageToEnemy(amount, isClick = true) {
    if (state.isPaused) return;
    if (state.enemy.hp <= 0 || state.player.hp <= 0) return;
    
    let isCrit = false;
    let finalAmount = amount;
    
    if (isClick) {
        const critRate = getPlayerCritRate();
        if (Math.random() < critRate) {
            isCrit = true;
            finalAmount = Math.floor(amount * getPlayerCritMultiplier());
        }
    }
    
    state.enemy.hp = Math.max(0, state.enemy.hp - finalAmount);
    
    if (isClick && state.player.hp > 0) {
        if (state.player.class === "warrior") {
            state.player.classResource = Math.min(100, state.player.classResource + 2);
        } else if (state.player.class === "rogue") {
            state.player.classResource = Math.min(5, state.player.classResource + 1);
        }
    }
    
    if (isClick) {
        playSound('click');
        const sprite = document.getElementById("enemy-sprite-elem");
        if (sprite) {
            sprite.classList.remove("shake-element");
            void sprite.offsetWidth;
            sprite.classList.add("shake-element");
        }
        
        if (isCrit) {
            spawnFloatingText(`💥 ${Math.floor(finalAmount)}!`, 100, 80, "crit-dmg");
        } else {
            spawnFloatingText(`-${Math.floor(finalAmount)}`, 100, 100, "enemy-dmg");
        }
    } else {
        if (amount === getPlayerDps()) {
            spawnFloatingText(`${amount}`, 100, 120, "gold-gain");
        }
    }
    
    if (state.enemy.hp <= 0) {
        enemyDefeated();
    }
    
    updateUI();
}

function dealDamageToPlayer(amount) {
    if (state.player.hp <= 0) return;
    
    if (state.player.activeBuffs && state.player.activeBuffs.immunityDuration > 0) {
        spawnFloatingText("Absorbido", 100, 30, "dmg-absorbed");
        addLog("El escudo protector absorbió el ataque enemigo.", "system-log");
        return;
    }
    
    if (state.player.activeBuffs && state.player.activeBuffs.dodgeDuration > 0) {
        const rank = state.player.skillRanks?.skill2 || 1;
        const dodgeChance = 0.60 + (rank - 1) * 0.05;
        if (Math.random() < dodgeChance) {
            spawnFloatingText("Esquivado", 100, 30, "dmg-dodged");
            addLog("Esquivaste el ataque del enemigo.", "system-log");
            return;
        }
    }
    
    const def = getPlayerDef();
    const finalDmg = Math.max(1, amount - def);
    
    state.player.hp = Math.max(0, state.player.hp - finalDmg);
    
    if (state.player.class === "warrior" && state.player.hp > 0) {
        state.player.classResource = Math.min(100, state.player.classResource + 5);
    }
    
    playSound('enemyHit');
    
    const arena = document.getElementById("arena-zone");
    if (arena) {
        arena.classList.remove("shake-element");
        void arena.offsetWidth;
        arena.classList.add("shake-element");
    }
    
    spawnFloatingText(`-${finalDmg}`, 100, 30, "player-dmg");
    addLog(`El enemigo te infligió ${finalDmg} de daño. (Defensa absorbió: ${Math.min(def, amount)})`, "damage-take");
    
    if (state.player.hp <= 0) {
        playerFainted();
    }
    
    updateUI();
}

function enemyDefeated() {
    const goldGained = state.enemy.goldReward;
    const xpGained = state.enemy.xpReward;
    
    state.player.gold += goldGained;
    state.player.xp += xpGained;
    
    addLog(`¡Derrotaste a ${state.enemy.name}! Recibes +${goldGained} 🪙 y +${xpGained} XP.`, "damage-deal");
    
    checkLevelUp();
    
    const dropChance = state.enemy.isBoss ? 1.0 : (state.enemy.isElite ? 0.6 : 0.25);
    if (Math.random() < dropChance) {
        if (state.inventory.length < state.maxInventorySlots) {
            const newItem = generateItem(state.enemy.lvl, state.enemy.isBoss);
            state.inventory.push(newItem);
            playSound('loot');
            addLog(`¡Botín encontrado! Obtuviste: [${newItem.name}] (${newItem.rarity.toUpperCase()})`, "loot-drop");
            renderInventory();
        } else {
            addLog("Mochila llena. No pudiste recoger el botín.", "system-log");
        }
    }
    
    state.map.pathClear = true;
    
    if (state.player.debuffs) {
        state.player.debuffs.atkDebuff = 0;
        state.player.debuffs.defDebuff = 0;
    }
    if (state.player.activeBuffs) {
        state.player.activeBuffs.potionAtkBuff = 0;
    }
    
    state.player.hp = Math.min(getPlayerMaxHp(), state.player.hp + Math.floor(getPlayerMaxHp() * 0.15));
    
    const isBossDefeated = (state.map.currentNode >= state.map.maxNodes);
    
    if (isBossDefeated) {
        addLog(`¡Felicidades! Completaste la zona [${ZONES[state.currentZone].name}].`, "level-up");
        triggerStory(state.currentZone);
        
        if (state.currentZone < ZONES.length - 1) {
            state.currentZone++;
            if (state.currentZone > state.highestZone) {
                state.highestZone = state.currentZone;
            }
        }
        
        generateMap();
        showSubview("explore");
    }
    
    updateUI();
    saveGame();
}

function playerFainted() {
    playSound('faint');
    const goldLost = Math.floor(state.player.gold * 0.1);
    state.player.gold = Math.max(0, state.player.gold - goldLost);
    
    addLog(`¡Has caído debilitado! Pierdes ${goldLost} 🪙 y regresas al inicio del sendero.`, "system-log");
    
    state.map.currentNode = 0;
    state.map.pathClear = true;
    state.zoneProgress = 0;
    
    state.player.hp = getPlayerMaxHp();
    
    if (state.player.debuffs) {
        state.player.debuffs.atkDebuff = 0;
        state.player.debuffs.defDebuff = 0;
    }
    if (state.player.activeBuffs) {
        state.player.activeBuffs.potionAtkBuff = 0;
    }
    
    showSubview("explore");
    updateUI();
    saveGame();
}

function checkLevelUp() {
    let leveled = false;
    while (state.player.xp >= state.player.maxXp) {
        state.player.xp -= state.player.maxXp;
        state.player.lvl++;
        state.player.maxXp = Math.floor(state.player.maxXp * 1.5);
        
        state.player.baseAtk += 1;
        state.player.maxHp += 8;
        
        state.player.attributePoints = (state.player.attributePoints || 0) + 3;
        
        if (state.player.lvl === 12) {
            state.player.skillPoints = (state.player.skillPoints || 0) + 1;
        } else if (state.player.lvl > 12 && (state.player.lvl - 12) % 3 === 0) {
            state.player.skillPoints = (state.player.skillPoints || 0) + 1;
        }
        
        leveled = true;
    }
    
    if (leveled) {
        playSound('lvlup');
        state.player.hp = getPlayerMaxHp();
        if (state.player.lvl > state.highestLvl) {
            state.highestLvl = state.player.lvl;
        }
        addLog(`¡¡NUEVO NIVEL ALCANZADO!! Eres Nivel ${state.player.lvl}. Obtienes +3 Puntos de Atributo.`, "level-up");
        if (state.player.lvl >= 12 && (state.player.lvl === 12 || (state.player.lvl - 12) % 3 === 0)) {
            addLog(`¡Obtienes +1 Punto de Mejora de Habilidad!`, "level-up");
        }
    }
}

// ==========================================================================
// Fase 3: RPG Classes & Skills Engine Functions
// ==========================================================================

function checkCharacterCreation() {
    if (!state.player.name) state.player.name = "Héroe";
    if (!state.player.skillsState) state.player.skillsState = { skill1_cd: 0, skill2_cd: 0, skill3_cd: 0, skill4_cd: 0 };
    if (!state.player.activeBuffs) {
        state.player.activeBuffs = {
            stunDuration: 0,
            battleCryDuration: 0,
            immunityDuration: 0,
            dodgeDuration: 0,
            adrenalineDuration: 0,
            burnDuration: 0,
            burnDmg: 0,
            poisonDuration: 0,
            poisonDmg: 0,
            warpDuration: 0
        };
    }
    if (state.player.classResource === undefined) state.player.classResource = 0;

    if (!state.player.class) {
        state.isPaused = true;
        document.getElementById("char-creation-modal").classList.remove("hidden");
    } else {
        document.getElementById("char-creation-modal").classList.add("hidden");
        renderSkills();
        updateUI();
    }
}

function renderSkills() {
    const container = document.getElementById("skills-grid-container");
    if (!container) return;
    container.innerHTML = "";
    
    if (!state.player.class) return;
    
    const config = CLASSES_CONFIG[state.player.class];
    if (!config) return;
    
    config.skills.forEach((skill, idx) => {
        const btn = document.createElement("button");
        btn.className = "skill-btn";
        if (idx === 3) btn.classList.add("ultimate");
        btn.id = `btn-skill-${idx + 1}`;
        
        const isLocked = state.player.lvl < skill.lvl;
        btn.disabled = isLocked;
        
        const rank = state.player.skillRanks ? (state.player.skillRanks[`skill${idx + 1}`] || 1) : 1;
        const starsText = rank > 1 ? " " + "⭐".repeat(rank - 1) : "";
        
        let htmlContent = `
            <div class="skill-keybind">${idx + 1}</div>
            <div class="skill-icon-wrap">${skill.icon}</div>
            <div class="skill-name">${skill.name}${starsText}</div>
            
            <div class="skill-cooldown-overlay" id="skill-cd-overlay-${idx + 1}">
                <span class="skill-cooldown-time" id="skill-cd-text-${idx + 1}">0</span>
            </div>
        `;
        
        if (isLocked) {
            htmlContent += `
                <div class="skill-locked-cover">
                    <span class="skill-locked-icon">🔒</span>
                    <span class="skill-locked-level">Lvl ${skill.lvl}</span>
                </div>
            `;
        }
        
        let costText = "";
        if (skill.cost > 0) {
            costText = `<span class="cost">${skill.cost} ${config.resourceName}</span>`;
        } else {
            costText = `<span class="cost">Gratis</span>`;
        }
        
        htmlContent += `
            <div class="skill-tooltip">
                <div class="skill-tooltip-name">
                    <span>${skill.name} (Rango ${rank})</span>
                    <span>${skill.icon}</span>
                </div>
                <div class="skill-tooltip-meta">
                    <span>Recarga: ${skill.cooldown}s</span>
                    ${costText}
                </div>
                <div class="skill-tooltip-desc">${skill.desc}</div>
            </div>
        `;
        
        btn.innerHTML = htmlContent;
        
        if (!isLocked) {
            btn.addEventListener("click", () => {
                castSkill(idx + 1);
            });
        }
        
        container.appendChild(btn);
    });
}

function castSkill(index) {
    if (state.isPaused) return;
    if (state.player.hp <= 0 || state.enemy.hp <= 0) return;
    
    const config = CLASSES_CONFIG[state.player.class];
    if (!config) return;
    
    const skill = config.skills[index - 1];
    if (!skill || state.player.lvl < skill.lvl) return;
    
    // Check cooldown
    const cdKey = `skill${index}_cd`;
    if (state.player.skillsState[cdKey] > 0) {
        addLog(`La habilidad ${skill.name} aún está en recarga.`, "system-log");
        return;
    }
    
    // Check cost
    if (skill.cost > 0 && state.player.classResource < skill.cost) {
        addLog(`No tienes suficiente ${config.resourceName} para usar ${skill.name}. (Requiere ${skill.cost})`, "system-log");
        return;
    }
    
    // Spend resource
    if (skill.cost > 0) {
        state.player.classResource -= skill.cost;
    }
    
    // Set cooldown
    state.player.skillsState[cdKey] = skill.cooldown;
    
    // Trigger skill effect
    triggerSkillEffect(skill.id);
    
    // Audio and UI update
    initAudio();
    playSound('click');
    updateUI();
}

function triggerSkillEffect(skillId) {
    const atk = getPlayerAtk();
    const maxHp = getPlayerMaxHp();
    
    switch (skillId) {
        // Warrior
        case "shield_slam": {
            const rank = state.player.skillRanks?.skill1 || 1;
            const slamDmg = Math.floor(atk * 3 * (1 + (rank - 1) * 0.20));
            dealDamageToEnemy(slamDmg, true);
            state.player.activeBuffs.stunDuration = 3;
            addLog(`¡Golpe Escudo (Rango ${rank})! Infliges ${slamDmg} de daño y aturdes al enemigo por 3s.`, "damage-deal");
            break;
        }
        case "battle_cry": {
            const rank = state.player.skillRanks?.skill2 || 1;
            state.player.activeBuffs.battleCryDuration = 8;
            addLog(`¡Grito Batalla (Rango ${rank})! Aumentas tu Defensa (+${8 + (rank - 1) * 2}) y tu Daño Click (+${30 + (rank - 1) * 10}%) por 8s.`, "system-log");
            break;
        }
        case "indomitable": {
            const rank = state.player.skillRanks?.skill3 || 1;
            const healPercent = 0.25 + (rank - 1) * 0.05;
            const healVal = Math.floor(maxHp * healPercent);
            state.player.hp = Math.min(maxHp, state.player.hp + healVal);
            spawnFloatingText(`+${healVal}`, 100, 30, "hp-color");
            addLog(`¡Indomable (Rango ${rank})! Te curas ${healVal} de Vida.`, "system-log");
            break;
        }
        case "last_stand": {
            const rank = state.player.skillRanks?.skill4 || 1;
            state.player.activeBuffs.immunityDuration = 6;
            addLog(`¡ÚLTIMO BASTIÓN (Rango ${rank})! Eres inmune al daño e infliges +${100 + (rank - 1) * 30}% Daño Click por 6s.`, "level-up");
            break;
        }
        
        // Mage
        case "fireball": {
            const rank = state.player.skillRanks?.skill1 || 1;
            const fireballDmg = Math.floor(atk * (6 + (rank - 1) * 1));
            dealDamageToEnemy(fireballDmg, true);
            state.player.activeBuffs.burnDuration = 4;
            state.player.activeBuffs.burnDmg = Math.max(1, Math.floor(atk * (1.5 + (rank - 1) * 0.5)));
            addLog(`¡Bola Fuego (Rango ${rank})! Infliges ${fireballDmg} de daño e incendias al enemigo por 4s.`, "damage-deal");
            break;
        }
        case "ice_barrier": {
            const rank = state.player.skillRanks?.skill2 || 1;
            state.player.activeBuffs.immunityDuration = 5 + (rank - 1) * 1;
            addLog(`¡Barrera Hielo (Rango ${rank})! Absorberás todo el daño por ${5 + (rank - 1) * 1}s.`, "system-log");
            break;
        }
        case "time_warp": {
            const rank = state.player.skillRanks?.skill3 || 1;
            state.player.activeBuffs.warpDuration = 6 + (rank - 1) * 1;
            addLog(`¡Distorsión Temp (Rango ${rank})! DPS Auto +${150 + (rank - 1) * 30}% y cooldowns acelerados al doble por ${6 + (rank - 1) * 1}s.`, "system-log");
            break;
        }
        case "meteor_storm": {
            const rank = state.player.skillRanks?.skill4 || 1;
            const meteorDmg = Math.floor(atk * (25 + (rank - 1) * 5));
            dealDamageToEnemy(meteorDmg, true);
            state.player.activeBuffs.stunDuration = 4;
            addLog(`¡METEORO (Rango ${rank})! Haces caer una roca por ${meteorDmg} de daño y aturdes al enemigo por 4s.`, "damage-deal");
            break;
        }
        
        // Rogue
        case "poison_blades": {
            const rank = state.player.skillRanks?.skill1 || 1;
            const comboPoints = state.player.classResource;
            const poisonDmgPerSec = Math.floor(atk * (0.5 + (rank - 1) * 0.1) * comboPoints);
            const initialDmg = Math.floor(atk * (2 + (rank - 1) * 0.5));
            
            state.player.classResource = 0;
            dealDamageToEnemy(initialDmg, true);
            if (comboPoints > 0) {
                state.player.activeBuffs.poisonDuration = 5;
                state.player.activeBuffs.poisonDmg = poisonDmgPerSec;
                addLog(`¡Hojas Venenosas (Rango ${rank})! Infliges ${initialDmg} de daño y aplicas veneno (${poisonDmgPerSec}/s, combos: ${comboPoints}) por 5s.`, "damage-deal");
            } else {
                addLog(`¡Hojas Venenosas (Rango ${rank})! Infliges ${initialDmg} de daño (sin combo para veneno).`, "damage-deal");
            }
            break;
        }
        case "shadow_step": {
            state.player.activeBuffs.dodgeDuration = 5;
            const rank = state.player.skillRanks?.skill2 || 1;
            addLog(`¡Esquiva Sombría (Rango ${rank})! Aumentas tu probabilidad de esquivar en +${60 + (rank - 1) * 5}% por 5s.`, "system-log");
            break;
        }
        case "adrenaline_rush": {
            const rank = state.player.skillRanks?.skill3 || 1;
            state.player.activeBuffs.adrenalineDuration = 6 + (rank - 1) * 1;
            addLog(`¡Adrenalina (Rango ${rank})! +100% de Crítico y ataque auto-DPS acelerado por ${6 + (rank - 1) * 1}s.`, "system-log");
            break;
        }
        case "blade_dance": {
            const rank = state.player.skillRanks?.skill4 || 1;
            state.player.classResource = 0;
            addLog(`¡DANZA HOJAS (Rango ${rank})! Ejecutas 10 cortes relámpago consecutivos.`, "level-up");
            
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    if (state.enemy.hp > 0 && state.player.hp > 0 && !state.isPaused) {
                        const danceAtk = Math.max(1, Math.floor(atk * (2.5 + (rank - 1) * 0.5)));
                        dealDamageToEnemy(danceAtk, true);
                    }
                }, i * 80);
            }
            break;
        }
    }
}

function addStatPoint(stat) {
    if ((state.player.attributePoints || 0) > 0) {
        state.player.attributePoints--;
        if (!state.player.stats) {
            state.player.stats = { str: 0, con: 0, dex: 0, ref: 0, agi: 0 };
        }
        state.player.stats[stat] = (state.player.stats[stat] || 0) + 1;
        
        if (stat === "con") {
            const cl = state.player.class;
            let hpGain = 10;
            if (cl === "warrior") hpGain = 20;
            else if (cl === "mage") hpGain = 8;
            state.player.hp += hpGain;
        }
        
        initAudio();
        playSound('click');
        renderAttributesUI();
        updateUI();
        saveGame();
    }
}

function renderAttributesUI() {
    const points = state.player.attributePoints || 0;
    const indicator = document.getElementById("attr-points-indicator");
    const pointsSpan = document.getElementById("txt-attr-points");
    
    if (pointsSpan) pointsSpan.innerText = points;
    if (indicator) {
        if (points > 0) {
            indicator.classList.remove("hidden");
        } else {
            indicator.classList.add("hidden");
        }
    }
    
    const stats = state.player.stats || { str: 0, con: 0, dex: 0, ref: 0, agi: 0 };
    const strVal = document.getElementById("txt-val-str");
    const conVal = document.getElementById("txt-val-con");
    const dexVal = document.getElementById("txt-val-dex");
    const refVal = document.getElementById("txt-val-ref");
    const agiVal = document.getElementById("txt-val-agi");
    
    if (strVal) strVal.innerText = stats.str || 0;
    if (conVal) conVal.innerText = stats.con || 0;
    if (dexVal) dexVal.innerText = stats.dex || 0;
    if (refVal) refVal.innerText = stats.ref || 0;
    if (agiVal) agiVal.innerText = stats.agi || 0;
    
    const statsList = ["str", "con", "dex", "ref", "agi"];
    statsList.forEach(stat => {
        const btn = document.getElementById(`btn-add-${stat}`);
        if (btn) {
            btn.disabled = (points <= 0);
        }
    });
    
    const cl = state.player.class;
    if (cl) {
        const descStr = document.getElementById("txt-desc-str");
        const descCon = document.getElementById("txt-desc-con");
        const descDex = document.getElementById("txt-desc-dex");
        const descRef = document.getElementById("txt-desc-ref");
        const descAgi = document.getElementById("txt-desc-agi");
        
        if (cl === "warrior") {
            if (descStr) descStr.innerText = "+1.0 Daño Click";
            if (descCon) descCon.innerText = "+20 Vida Máx";
            if (descDex) descDex.innerText = "+0.4 DPS Auto";
            if (descRef) descRef.innerText = "+0.8 Defensa";
            if (descAgi) descAgi.innerText = "+1.0% Crítico";
        } else if (cl === "mage") {
            if (descStr) descStr.innerText = "+0.5 Daño Click";
            if (descCon) descCon.innerText = "+8 Vida Máx";
            if (descDex) descDex.innerText = "+1.5 DPS Auto";
            if (descRef) descRef.innerText = "+0.3 Defensa";
            if (descAgi) descAgi.innerText = "+1.0% Crítico | +5 Maná";
        } else if (cl === "rogue") {
            if (descStr) descStr.innerText = "+1.2 Daño Click";
            if (descCon) descCon.innerText = "+10 Vida Máx";
            if (descDex) descDex.innerText = "+0.8 DPS Auto";
            if (descRef) descRef.innerText = "+0.4 Defensa";
            if (descAgi) descAgi.innerText = "+2.5% Crítico";
        }
    }
}

function renderSkillUpgradesUI() {
    const container = document.getElementById("skill-upgrades-container");
    if (!container) return;
    container.innerHTML = "";
    
    const points = state.player.skillPoints || 0;
    const indicator = document.getElementById("skill-points-indicator");
    const pointsSpan = document.getElementById("txt-skill-points");
    
    if (pointsSpan) pointsSpan.innerText = points;
    if (indicator) {
        if (points > 0) {
            indicator.classList.remove("hidden");
        } else {
            indicator.classList.add("hidden");
        }
    }
    
    if (!state.player.class) return;
    const config = CLASSES_CONFIG[state.player.class];
    if (!config) return;
    
    const r1 = state.player.skillRanks?.skill1 || 1;
    const r2 = state.player.skillRanks?.skill2 || 1;
    const r3 = state.player.skillRanks?.skill3 || 1;
    const normalUpgrades = (r1 - 1) + (r2 - 1) + (r3 - 1);
    
    config.skills.forEach((skill, idx) => {
        const skillId = `skill${idx + 1}`;
        const rank = state.player.skillRanks ? (state.player.skillRanks[skillId] || 1) : 1;
        const isLocked = state.player.lvl < skill.lvl;
        
        const row = document.createElement("div");
        row.className = `skill-upgrade-row ${isLocked ? 'locked' : ''}`;
        
        let rankStars = "";
        for (let r = 0; r < rank; r++) {
            rankStars += "⭐";
        }
        
        let upgradeDesc = "";
        if (idx === 0) upgradeDesc = "+20% Daño";
        else if (idx === 1) upgradeDesc = "+10% Efecto / +2s Duración";
        else if (idx === 2) upgradeDesc = "+10% Efecto / +1s Duración";
        else if (idx === 3) upgradeDesc = "+30% Efecto (Ultimate)";
        
        row.innerHTML = `
            <div class="skill-upgrade-info">
                <span class="skill-upgrade-name">${skill.icon} ${skill.name}</span>
                <span class="skill-upgrade-rank">${rankStars} (Rango ${rank})</span>
                <span class="skill-upgrade-desc">${isLocked ? 'Bloqueado' : upgradeDesc}</span>
            </div>
            <button class="btn-skill-upgrade btn-action" id="btn-upgrade-skill-${idx + 1}">Mejorar</button>
        `;
        
        const upBtn = row.querySelector(`#btn-upgrade-skill-${idx + 1}`);
        if (upBtn) {
            let canUpgrade = true;
            if (points <= 0) canUpgrade = false;
            if (isLocked) canUpgrade = false;
            if (rank >= 3) canUpgrade = false;
            if (idx === 3 && normalUpgrades < 3) canUpgrade = false;
            
            upBtn.disabled = !canUpgrade;
            if (rank >= 3) {
                upBtn.innerText = "MÁX";
                upBtn.classList.add("btn-maxed");
            }
            
            upBtn.addEventListener("click", () => {
                upgradeSkill(idx + 1);
            });
        }
        
        container.appendChild(row);
    });
}

function upgradeSkill(skillIndex) {
    if ((state.player.skillPoints || 0) > 0) {
        const skillKey = `skill${skillIndex}`;
        if (!state.player.skillRanks) {
            state.player.skillRanks = { skill1: 1, skill2: 1, skill3: 1, skill4: 1 };
        }
        const currentRank = state.player.skillRanks[skillKey] || 1;
        
        if (currentRank < 3) {
            state.player.skillPoints--;
            state.player.skillRanks[skillKey] = currentRank + 1;
            
            initAudio();
            playSound('lvlup');
            
            const config = CLASSES_CONFIG[state.player.class];
            const skill = config.skills[skillIndex - 1];
            addLog(`¡Mejoraste [${skill.name}] a Rango ${currentRank + 1}!`, "level-up");
            
            renderSkills();
            renderSkillUpgradesUI();
            updateUI();
            saveGame();
        }
    }
}

// Inventory management
let selectedItem = null;

function renderInventory() {
    const container = document.getElementById("inventory-grid-container");
    container.innerHTML = "";
    
    // Render inventory item slots
    for (let i = 0; i < state.maxInventorySlots; i++) {
        const slotEl = document.createElement("div");
        slotEl.className = "inv-slot";
        
        if (state.inventory[i]) {
            const item = state.inventory[i];
            slotEl.innerText = item.icon;
            slotEl.classList.add(`rarity-${item.rarity}`);
            slotEl.title = `${item.name} (${item.rarity})`;
            
            if (selectedItem && selectedItem.id === item.id) {
                slotEl.classList.add("selected");
            }
            
            slotEl.addEventListener("click", () => {
                selectInventoryItem(item);
            });
        } else {
            slotEl.classList.add("empty");
        }
        
        container.appendChild(slotEl);
    }
    
    // Update inventory counter
    document.getElementById("txt-inv-count").innerText = `${state.inventory.length} / ${state.maxInventorySlots}`;
}

function deselectItem() {
    selectedItem = null;
    document.getElementById("item-detail-card").classList.add("hidden");
    renderInventory();
}

function selectInventoryItem(item) {
    initAudio();
    
    if (selectedItem && selectedItem.id === item.id) {
        deselectItem();
        return;
    }
    
    selectedItem = item;
    
    // Update details card
    const card = document.getElementById("item-detail-card");
    card.classList.remove("hidden");
    
    const nameEl = document.getElementById("txt-detail-name");
    nameEl.innerText = item.name;
    // Remove previous rarity classes
    nameEl.className = "item-detail-name";
    nameEl.classList.add(`rarity-${item.rarity}`);
    
    const rarityEl = document.getElementById("txt-detail-rarity");
    rarityEl.innerText = item.rarity.toUpperCase();
    rarityEl.className = "item-detail-rarity";
    rarityEl.classList.add(`rarity-${item.rarity}`);
    
    let slotNameTranslated = "Arma";
    if (item.slot === "armor") slotNameTranslated = "Armadura";
    else if (item.slot === "accessory") slotNameTranslated = "Accesorio";
    document.getElementById("txt-detail-slot").innerText = `Ranura: ${slotNameTranslated}`;
    
    let statsText = `+${item.statValue} ${item.statName}`;
    if (item.defenseValue) {
        statsText += ` | +${item.defenseValue} Defensa`;
    }
    document.getElementById("txt-detail-stats").innerText = statsText;
    document.getElementById("txt-detail-desc").innerText = item.desc;
    document.getElementById("txt-detail-value").innerText = item.value;
    
    // Change button equip/unequip labels
    const btnEquip = document.getElementById("btn-item-equip");
    
    // Check if item is equipped
    const isEquipped = (
        (state.player.weapon && state.player.weapon.id === item.id) ||
        (state.player.armor && state.player.armor.id === item.id) ||
        (state.player.accessory && state.player.accessory.id === item.id)
    );
    
    btnEquip.innerText = isEquipped ? "Desequipar" : "Equipar";
    
    renderInventory();
}

function equipItem(item) {
    const slot = item.slot;
    
    // If already equipped in that slot, unequip
    if (state.player[slot] && state.player[slot].id === item.id) {
        state.player[slot] = null;
        addLog(`Te desequipaste ${item.name}.`, "system-log");
    } else {
        // Equip item (replaces previous item in slot)
        const prevItem = state.player[slot];
        state.player[slot] = item;
        addLog(`Te equipaste ${item.name}.`, "system-log");
    }
    
    // Recalculate current health caps
    state.player.hp = Math.min(state.player.hp, getPlayerMaxHp());
    
    initAudio();
    playSound('click');
    renderEquipment();
    
    // Refresh selected item display
    selectInventoryItem(item);
    updateUI();
}

function sellItem(item) {
    // Check if it is equipped, unequip it first
    const slot = item.slot;
    if (state.player[slot] && state.player[slot].id === item.id) {
        state.player[slot] = null;
        renderEquipment();
    }
    
    // Add gold
    state.player.gold += item.value;
    
    // Remove from inventory
    state.inventory = state.inventory.filter(i => i.id !== item.id);
    addLog(`Vendiste [${item.name}] por +${item.value} 🪙.`, "system-log");
    
    deselectItem();
}

function renderEquipment() {
    const slots = ["weapon", "armor", "accessory"];
    slots.forEach(slotKey => {
        const item = state.player[slotKey];
        const contentEl = document.getElementById(`eq-${slotKey}-content`);
        const slotEl = document.getElementById(`slot-${slotKey}`);
        
        // Clear old rarity
        slotEl.className = "eq-slot";
        
        if (item) {
            contentEl.innerText = `${item.icon} ${item.name}`;
            contentEl.className = "slot-content";
            slotEl.classList.add(`rarity-${item.rarity}`);
            
            // Allow clicking equipped slot to select it in the tooltip
            slotEl.onclick = () => {
                selectInventoryItem(item);
            };
        } else {
            contentEl.innerText = "Vacío";
            contentEl.className = "slot-content empty";
            
            slotEl.onclick = null;
        }
    });
}

// UI Rendering loop helper (Text boxes, meters)
function updateUI() {
    document.getElementById("txt-stat-hp").innerText = `${state.player.hp} / ${getPlayerMaxHp()}`;
    document.getElementById("txt-stat-atk").innerText = getPlayerAtk();
    document.getElementById("txt-stat-dps").innerText = getPlayerDps();
    document.getElementById("txt-stat-def").innerText = getPlayerDef();
    document.getElementById("txt-stat-gold").innerText = `${state.player.gold} 🪙`;
    
    const combatNameEl = document.querySelector(".player-combat-name");
    if (combatNameEl && state.player.name) {
        const className = state.player.class ? (CLASSES_CONFIG[state.player.class]?.name || "") : "";
        combatNameEl.innerText = `${state.player.name}${className ? ' (' + className + ')' : ' (Tú)'}`;
    }

    document.getElementById("txt-player-lvl").innerText = `Nivel ${state.player.lvl}`;
    document.getElementById("txt-player-xp").innerText = `XP: ${state.player.xp} / ${state.player.maxXp}`;
    const xpPercent = Math.min(100, (state.player.xp / state.player.maxXp) * 100);
    document.getElementById("bar-player-xp").style.width = `${xpPercent}%`;
    
    const playerHpPercent = Math.min(100, (state.player.hp / getPlayerMaxHp()) * 100);
    document.getElementById("bar-player-hp").style.width = `${playerHpPercent}%`;
    document.querySelectorAll("#txt-player-hp").forEach(el => {
        el.innerText = `${state.player.hp} / ${getPlayerMaxHp()}`;
    });
    
    const zone = ZONES[state.currentZone];
    document.getElementById("txt-zone-name").innerText = zone.name;
    
    if (state.map) {
        document.getElementById("txt-zone-progress").innerText = 
            state.map.currentNode === state.map.maxNodes ? "Combate de Jefe 💀" : `Nodo: ${state.map.currentNode} / ${state.map.maxNodes}`;
    }
    
    document.getElementById("btn-prev-zone").disabled = (state.currentZone === 0);
    document.getElementById("btn-next-zone").disabled = (state.currentZone >= state.highestZone || state.currentZone >= ZONES.length - 1);
    
    document.getElementById("txt-enemy-name").innerText = state.enemy.name;
    document.getElementById("txt-enemy-lvl").innerText = `Lvl ${state.enemy.lvl}`;
    document.getElementById("txt-enemy-hp").innerText = `${state.enemy.hp} / ${state.enemy.maxHp}`;
    
    const enemyHpPercent = Math.min(100, (state.enemy.hp / state.enemy.maxHp) * 100);
    document.getElementById("bar-enemy-hp").style.width = `${enemyHpPercent}%`;
    
    document.getElementById("enemy-sprite-elem").innerText = state.enemy.sprite;
    
    const inCombat = (state.map && state.map.nodeType === "combat");
    const pathClear = (state.map && state.map.pathClear);
    
    const enemyBars = document.querySelector(".enemy-bars");
    const enemySpriteContainer = document.getElementById("enemy-click-target");
    const combatAdvance = document.getElementById("combat-advance-container");
    
    if (inCombat && pathClear) {
        if (enemyBars) enemyBars.classList.add("hidden");
        if (enemySpriteContainer) {
            enemySpriteContainer.style.opacity = "0.3";
            enemySpriteContainer.style.pointerEvents = "none";
        }
        if (combatAdvance) {
            combatAdvance.classList.remove("hidden");
        }
        const tag = document.getElementById("txt-enemy-tag");
        if (tag) {
            tag.innerText = "Derrotado";
            tag.className = "enemy-tag";
        }
    } else {
        if (enemyBars) enemyBars.classList.remove("hidden");
        if (enemySpriteContainer) {
            enemySpriteContainer.style.opacity = "1";
            enemySpriteContainer.style.pointerEvents = "auto";
        }
        if (combatAdvance) {
            combatAdvance.classList.add("hidden");
        }
    }

    renderAttributesUI();
    renderSkillUpgradesUI();
}

// Local Storage Save/Load logic
function saveGame() {
    try {
        localStorage.setItem("hero_clicker_save", JSON.stringify(state));
        // Sparkle message without cluttering console too much
        console.log("Juego guardado automáticamente.");
    } catch (e) {
        console.error("Error al guardar la partida:", e);
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem("hero_clicker_save");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.player) {
                state = parsed;
                state.isPaused = false;
                
                if (!state.player.name) state.player.name = "Héroe";
                
                state.player.skillsState = { skill1_cd: 0, skill2_cd: 0, skill3_cd: 0, skill4_cd: 0 };
                state.player.activeBuffs = {
                    stunDuration: 0,
                    battleCryDuration: 0,
                    immunityDuration: 0,
                    dodgeDuration: 0,
                    adrenalineDuration: 0,
                    burnDuration: 0,
                    burnDmg: 0,
                    poisonDuration: 0,
                    poisonDmg: 0,
                    warpDuration: 0,
                    potionAtkBuff: 0,
                    potionRegenDuration: 0
                };
                
                if (!state.player.stats) {
                    state.player.stats = { str: 0, con: 0, dex: 0, ref: 0, agi: 0 };
                }
                if (!state.player.skillRanks) {
                    state.player.skillRanks = { skill1: 1, skill2: 1, skill3: 1, skill4: 1 };
                }
                if (state.player.attributePoints === undefined) {
                    const totalEarnedAttr = (state.player.lvl - 1) * 3;
                    const spentAttr = (state.player.stats.str || 0) + (state.player.stats.con || 0) + (state.player.stats.dex || 0) + (state.player.stats.ref || 0) + (state.player.stats.agi || 0);
                    state.player.attributePoints = Math.max(0, totalEarnedAttr - spentAttr);
                }
                if (state.player.skillPoints === undefined) {
                    let totalEarnedSkills = 0;
                    if (state.player.lvl >= 12) {
                        totalEarnedSkills = 1 + Math.floor((state.player.lvl - 12) / 3);
                    }
                    const spentSkills = ((state.player.skillRanks.skill1 || 1) - 1) + ((state.player.skillRanks.skill2 || 1) - 1) + ((state.player.skillRanks.skill3 || 1) - 1) + ((state.player.skillRanks.skill4 || 1) - 1);
                    state.player.skillPoints = Math.max(0, totalEarnedSkills - spentSkills);
                }
                if (!state.player.debuffs) {
                    state.player.debuffs = { atkDebuff: 0, defDebuff: 0 };
                }
                
                if (!state.map || !state.map.nodes || state.map.nodes.length === 0) {
                    state.map = {
                        maxNodes: 12,
                        currentNode: 0,
                        nodeType: "explore",
                        pathClear: true,
                        currentEvent: null
                    };
                    generateMap();
                }
                
                state.player.hp = Math.min(state.player.hp, getPlayerMaxHp());
                addLog("Partida cargada exitosamente.", "system-log");
                return true;
            }
        }
    } catch (e) {
        console.error("Error al cargar la partida:", e);
    }
    return false;
}

function resetGame() {
    if (confirm("¿Estás seguro de que deseas reiniciar tu progreso? Perderás todas tus mejoras e inventario.")) {
        localStorage.removeItem("hero_clicker_save");
        location.reload();
    }
}

// Listeners Setup
function setupEventListeners() {
    // Enemy Click
    document.getElementById("enemy-click-target").addEventListener("click", (e) => {
        dealDamageToEnemy(getPlayerAtk());
    });
    
    // Inventory panel actions
    document.getElementById("btn-item-equip").addEventListener("click", () => {
        if (selectedItem) {
            equipItem(selectedItem);
        }
    });
    
    document.getElementById("btn-item-sell").addEventListener("click", () => {
        if (selectedItem) {
            sellItem(selectedItem);
        }
    });
    
    document.getElementById("btn-item-close").addEventListener("click", () => {
        deselectItem();
    });

    // Battle log accordion toggle
    document.getElementById("btn-toggle-logs").addEventListener("click", () => {
        const logsSection = document.getElementById("logs-container-section");
        const consoleEl = document.getElementById("log-console-container");
        const iconEl = document.getElementById("txt-logs-collapse-icon");
        
        const isCollapsed = consoleEl.classList.toggle("collapsed");
        logsSection.classList.toggle("collapsed", isCollapsed);
        
        iconEl.innerText = isCollapsed ? "▲" : "▼";
        initAudio();
        playSound('click');
    });

    // Story continue button
    document.getElementById("btn-story-continue").addEventListener("click", () => {
        document.getElementById("story-modal").classList.add("hidden");
        state.isPaused = false;
        initAudio();
        playSound('click');
    });
    
    // Zone Navigation
    document.getElementById("btn-prev-zone").addEventListener("click", () => {
        if (state.currentZone > 0) {
            state.currentZone--;
            generateMap();
            showSubview("explore");
            updateUI();
            saveGame();
        }
    });
    
    document.getElementById("btn-next-zone").addEventListener("click", () => {
        if (state.currentZone < state.highestZone && state.currentZone < ZONES.length - 1) {
            state.currentZone++;
            generateMap();
            showSubview("explore");
            updateUI();
            saveGame();
        }
    });
    
    // Sound control
    document.getElementById("btn-sound-toggle").addEventListener("click", () => {
        state.isMuted = !state.isMuted;
        const iconPath = document.querySelector("#btn-sound-toggle path");
        if (state.isMuted) {
            iconPath.setAttribute("d", "M3,9H7L12,4V20L7,15H3V9M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.77 16.5,12M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23Z");
            document.getElementById("btn-sound-toggle").style.color = "var(--text-muted)";
            addLog("Sonido silenciado.", "system-log");
        } else {
            iconPath.setAttribute("d", "M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z");
            document.getElementById("btn-sound-toggle").style.color = "var(--accent)";
            addLog("Sonido activado.", "system-log");
            initAudio();
            playSound('click');
        }
    });
    
    // Reset Game button
    document.getElementById("btn-reset-game").addEventListener("click", () => {
        resetGame();
    });
    
    // Character creation card selection
    const classCards = document.querySelectorAll(".class-card");
    let selectedClass = "warrior";
    
    classCards.forEach(card => {
        card.addEventListener("click", () => {
            classCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedClass = card.getAttribute("data-class");
            initAudio();
            playSound('click');
        });
    });
    
    // Character creation button click
    const btnCreate = document.getElementById("btn-create-character");
    if (btnCreate) {
        btnCreate.addEventListener("click", () => {
            const nameInput = document.getElementById("input-char-name").value.trim();
            const heroName = nameInput ? nameInput : "Héroe";
            
            state.player.name = heroName;
            state.player.class = selectedClass;
            
            state.player.classResource = (selectedClass === "mage") ? 100 : 0;
            state.player.skillsState = { skill1_cd: 0, skill2_cd: 0, skill3_cd: 0, skill4_cd: 0 };
            state.player.activeBuffs = {
                stunDuration: 0,
                battleCryDuration: 0,
                immunityDuration: 0,
                dodgeDuration: 0,
                adrenalineDuration: 0,
                burnDuration: 0,
                burnDmg: 0,
                poisonDuration: 0,
                poisonDmg: 0,
                warpDuration: 0,
                potionAtkBuff: 0,
                potionRegenDuration: 0
            };
            
            state.player.stats = { str: 0, con: 0, dex: 0, ref: 0, agi: 0 };
            state.player.skillRanks = { skill1: 1, skill2: 1, skill3: 1, skill4: 1 };
            state.player.attributePoints = 0;
            state.player.skillPoints = 0;
            state.player.lvl = 1;
            state.player.xp = 0;
            state.player.maxXp = 100;
            state.player.gold = 0;
            state.inventory = [];
            state.player.weapon = null;
            state.player.armor = null;
            state.player.accessory = null;
            state.player.debuffs = { atkDebuff: 0, defDebuff: 0 };
            
            state.player.hp = getPlayerMaxHp();
            
            const config = CLASSES_CONFIG[selectedClass];
            addLog(`¡Comienza la leyenda de ${state.player.name} el ${config.name}!`, "level-up");
            
            state.currentZone = 0;
            generateMap();
            
            document.getElementById("char-creation-modal").classList.add("hidden");
            document.getElementById("prologue-modal").classList.remove("hidden");
            state.isPaused = true;
            
            renderSkills();
            renderAttributesUI();
            renderSkillUpgradesUI();
            renderEquipment();
            renderInventory();
            updateUI();
            saveGame();
            
            initAudio();
            playSound('lvlup');
        });
    }

    // Prologue start button
    const btnPrologueStart = document.getElementById("btn-prologue-start");
    if (btnPrologueStart) {
        btnPrologueStart.addEventListener("click", () => {
            document.getElementById("prologue-modal").classList.add("hidden");
            state.isPaused = false;
            initAudio();
            playSound('click');
            showSubview("explore");
            saveGame();
        });
    }
    
    // Advance node button
    const btnAdvance = document.getElementById("btn-advance-node");
    if (btnAdvance) {
        btnAdvance.addEventListener("click", () => {
            advanceNode();
        });
    }
    
    // Close merchant button
    const btnCloseMerchant = document.getElementById("btn-close-merchant");
    if (btnCloseMerchant) {
        btnCloseMerchant.addEventListener("click", () => {
            const merchantShop = document.getElementById("merchant-shop-container");
            if (merchantShop) merchantShop.classList.add("hidden");
            
            state.map.pathClear = true;
            showAdvanceButtonInEvent();
            updateUI();
            saveGame();
        });
    }
    
    // Attribute plus buttons
    const statsList = ["str", "con", "dex", "ref", "agi"];
    statsList.forEach(stat => {
        const btn = document.getElementById(`btn-add-${stat}`);
        if (btn) {
            btn.addEventListener("click", () => {
                addStatPoint(stat);
            });
        }
    });

    // Tab switching listeners
    const tabBtnAttributes = document.getElementById("tab-btn-attributes");
    const tabBtnSkills = document.getElementById("tab-btn-skills");
    const paneAttributes = document.getElementById("pane-attributes");
    const paneSkills = document.getElementById("pane-skills");
    
    if (tabBtnAttributes && tabBtnSkills && paneAttributes && paneSkills) {
        tabBtnAttributes.addEventListener("click", () => {
            tabBtnAttributes.classList.add("active");
            tabBtnSkills.classList.remove("active");
            paneAttributes.classList.remove("hidden");
            paneSkills.classList.add("hidden");
            initAudio();
            playSound('click');
        });
        
        tabBtnSkills.addEventListener("click", () => {
            tabBtnSkills.classList.add("active");
            tabBtnAttributes.classList.remove("active");
            paneSkills.classList.remove("hidden");
            paneAttributes.classList.add("hidden");
            initAudio();
            playSound('click');
        });
    }

    // Combat advance button listener
    const btnCombatAdvance = document.getElementById("btn-combat-advance");
    if (btnCombatAdvance) {
        btnCombatAdvance.addEventListener("click", () => {
            advanceNode();
        });
    }

    // Keyboard shortcuts
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            const clickTarget = document.getElementById("enemy-click-target");
            if (clickTarget && !document.getElementById("combat-view").classList.contains("hidden")) {
                clickTarget.click();
            }
        } else if (e.key === "1") {
            castSkill(1);
        } else if (e.key === "2") {
            castSkill(2);
        } else if (e.key === "3") {
            castSkill(3);
        } else if (e.key === "4") {
            castSkill(4);
        }
    });
}

// Initialization
window.addEventListener("DOMContentLoaded", () => {
    // Set up listeners
    setupEventListeners();
    
    // Load local save if exists
    const hasSave = loadGame();
    
    if (!hasSave) {
        // Fresh start
        spawnEnemy();
    } else {
        // Redraw lists
        renderInventory();
        renderEquipment();
        spawnEnemy(); // resets current enemy to the loaded state
    }
    
    // Verify name and class creation overlay
    checkCharacterCreation();
    
    // Start combat ticking loop
    requestAnimationFrame(gameLoop);
});
