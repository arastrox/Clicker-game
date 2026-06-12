// ─── Música de fondo chiptune (Web Audio, sin archivos externos) ────────────
// Secuenciador por pasos (corcheas) con lead cuadrado, bajo triangular y
// hi-hats de ruido. La pista cambia según zona, jefe o evento.

import { bus } from '@/core/events';
import { getState, hasState } from '@/core/state';
import { saveGame } from '@/core/save';

type TrackName = 'forest' | 'cave' | 'volcano' | 'castle' | 'abyss' | 'boss' | 'merchant';

interface TrackDef {
  bpm: number;
  lead: number[];   // notas MIDI por corchea (0 = silencio)
  bass: number[];
  leadVol: number;
  bassVol: number;
  hats: boolean;
}

const TRACKS: Record<TrackName, TrackDef> = {
  forest: {
    bpm: 92, leadVol: 0.028, bassVol: 0.045, hats: true,
    lead: [69, 0, 72, 0, 76, 0, 72, 0, 74, 0, 72, 0, 69, 0, 67, 0, 69, 0, 72, 0, 76, 0, 79, 0, 77, 0, 76, 0, 72, 0, 0, 0],
    bass: [45, 0, 0, 0, 40, 0, 0, 0, 43, 0, 0, 0, 40, 0, 0, 0],
  },
  cave: {
    bpm: 78, leadVol: 0.025, bassVol: 0.04, hats: false,
    lead: [62, 0, 0, 65, 0, 0, 69, 0, 0, 67, 0, 0, 65, 0, 0, 0, 62, 0, 0, 65, 0, 0, 70, 0, 0, 69, 0, 0, 67, 0, 0, 0],
    bass: [38, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0],
  },
  volcano: {
    bpm: 118, leadVol: 0.027, bassVol: 0.05, hats: true,
    lead: [64, 64, 0, 65, 64, 0, 62, 0, 64, 64, 0, 67, 65, 0, 62, 0, 64, 64, 0, 65, 69, 0, 67, 0, 65, 64, 62, 0, 64, 0, 0, 0],
    bass: [40, 40, 0, 40, 40, 0, 38, 0, 40, 40, 0, 40, 36, 0, 38, 0],
  },
  castle: {
    bpm: 100, leadVol: 0.026, bassVol: 0.042, hats: false,
    lead: [71, 0, 74, 0, 78, 0, 74, 0, 76, 0, 73, 0, 74, 0, 71, 0, 71, 0, 74, 0, 79, 0, 78, 0, 76, 0, 74, 0, 73, 0, 0, 0],
    bass: [35, 0, 0, 0, 42, 0, 0, 0, 43, 0, 0, 0, 42, 0, 0, 0],
  },
  abyss: {
    bpm: 70, leadVol: 0.024, bassVol: 0.045, hats: false,
    lead: [57, 0, 0, 0, 0, 0, 56, 0, 0, 0, 57, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 56, 0, 0, 0, 55, 0, 0, 0, 0, 0],
    bass: [33, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0],
  },
  boss: {
    bpm: 144, leadVol: 0.03, bassVol: 0.055, hats: true,
    lead: [69, 0, 69, 72, 69, 0, 74, 72, 69, 0, 69, 72, 76, 74, 72, 71, 69, 0, 69, 72, 69, 0, 77, 76, 74, 0, 72, 0, 71, 72, 74, 0],
    bass: [33, 33, 33, 33, 33, 33, 33, 33, 31, 31, 31, 31, 33, 33, 36, 35],
  },
  merchant: {
    bpm: 108, leadVol: 0.026, bassVol: 0.04, hats: true,
    lead: [72, 0, 76, 0, 79, 0, 76, 0, 77, 76, 74, 0, 72, 0, 74, 0, 72, 0, 76, 0, 81, 0, 79, 0, 77, 76, 77, 0, 79, 0, 0, 0],
    bass: [36, 0, 43, 0, 36, 0, 43, 0, 41, 0, 45, 0, 43, 0, 43, 0],
  },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let current: TrackName | null = null;
let zoneTrack: TrackName = 'forest';
let step = 0;
let nextTime = 0;
let timer: number | null = null;
let unlocked = false;

const ZONE_TRACKS: TrackName[] = ['forest', 'cave', 'volcano', 'castle', 'abyss'];

function midiFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function audible(): boolean {
  if (!hasState()) return false;
  const meta = getState().meta;
  return !meta.muted && meta.musicOn !== false;
}

function ensureCtx(): boolean {
  if (!unlocked) return false;
  if (!ctx) {
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    } catch {
      return false;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return true;
}

function note(midi: number, at: number, dur: number, type: OscillatorType, vol: number): void {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = midiFreq(midi);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(master);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function hat(at: number): void {
  if (!ctx || !master) return;
  const len = 0.04;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.012, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + len);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;
  src.connect(filter).connect(gain).connect(master);
  src.start(at);
}

function scheduleStep(at: number, tr: TrackDef): void {
  const stepDur = 60 / tr.bpm / 2;
  const lead = tr.lead[step % tr.lead.length];
  const bass = tr.bass[step % tr.bass.length];
  if (lead > 0) note(lead, at, stepDur * 0.85, 'square', tr.leadVol);
  if (bass > 0) note(bass, at, stepDur * 1.7, 'triangle', tr.bassVol);
  if (tr.hats && step % 2 === 0) hat(at);
}

function tick(): void {
  if (!ctx || !current) return;
  if (!audible()) { nextTime = ctx.currentTime + 0.1; return; }
  const tr = TRACKS[current];
  const stepDur = 60 / tr.bpm / 2;
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
  while (nextTime < ctx.currentTime + 0.3) {
    scheduleStep(nextTime, tr);
    nextTime += stepDur;
    step += 1;
  }
}

function play(name: TrackName): void {
  current = name;
  step = 0;
  if (!ensureCtx()) return; // sonará cuando haya interacción del usuario
  nextTime = ctx!.currentTime + 0.08;
  if (timer === null) timer = window.setInterval(tick, 110);
}

function stopMusic(): void {
  current = null;
}

// ─── API y wiring ────────────────────────────────────────────────────────────

export function toggleMusic(): void {
  const s = getState();
  s.meta.musicOn = s.meta.musicOn === false ? true : false;
  saveGame();
  bus.emit('state:changed');
}

export function initMusic(): void {
  // el audio del navegador se desbloquea con el primer gesto del usuario
  const unlock = () => {
    unlocked = true;
    if (current) play(current);
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  bus.on('zone:enter', ({ zoneIndex }) => {
    zoneTrack = ZONE_TRACKS[Math.min(zoneIndex, ZONE_TRACKS.length - 1)];
    play(zoneTrack);
  });
  bus.on('combat:spawn', ({ enemy }) => {
    if (enemy.isBoss && current !== 'boss') play('boss');
  });
  bus.on('combat:bossDefeated', () => play(zoneTrack));
  bus.on('arena:event', ({ eventType }) => {
    if (eventType === 'merchant') play('merchant');
  });
  bus.on('arena:cleared', () => {
    if (current === 'merchant' || current === 'boss') play(zoneTrack);
  });
  bus.on('player:death', () => stopMusic());
  bus.on('game:over', () => stopMusic());
}
