// ─── Síntesis de sonido retro con Web Audio API (sin archivos externos) ────

import { getState, hasState } from '@/core/state';

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function isMuted(): boolean {
  return hasState() && getState().meta.muted;
}

interface ToneOpts {
  type?: OscillatorType;
  from: number;
  to?: number;
  duration: number;
  volume?: number;
  delay?: number;
}

function tone({ type = 'triangle', from, to, duration, volume = 0.12, delay = 0 }: ToneOpts): void {
  if (isMuted()) return;
  try {
    const ac = audio();
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  } catch {
    // audio bloqueado por el navegador: silencio
  }
}

function noise(duration: number, volume = 0.08, delay = 0): void {
  if (isMuted()) return;
  try {
    const ac = audio();
    const t0 = ac.currentTime + delay;
    const buffer = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
  } catch {
    // silencio
  }
}

export const sfx = {
  click(): void {
    tone({ from: 520 + Math.random() * 80, to: 180, duration: 0.08, volume: 0.07 });
  },
  crit(): void {
    tone({ from: 880, to: 220, duration: 0.14, volume: 0.12, type: 'square' });
    tone({ from: 1320, to: 440, duration: 0.12, volume: 0.06, delay: 0.02 });
  },
  enemyHit(): void {
    tone({ from: 140, to: 60, duration: 0.22, volume: 0.14, type: 'sawtooth' });
    noise(0.12, 0.05);
  },
  dodge(): void {
    tone({ from: 300, to: 900, duration: 0.12, volume: 0.06, type: 'sine' });
  },
  skill(): void {
    tone({ from: 330, to: 660, duration: 0.15, volume: 0.1, type: 'square' });
    tone({ from: 660, to: 990, duration: 0.15, volume: 0.07, delay: 0.08 });
  },
  ultimate(): void {
    tone({ from: 110, to: 440, duration: 0.4, volume: 0.16, type: 'sawtooth' });
    tone({ from: 220, to: 880, duration: 0.4, volume: 0.1, delay: 0.1 });
    noise(0.5, 0.07, 0.1);
  },
  heal(): void {
    tone({ from: 392, to: 523, duration: 0.18, volume: 0.08, type: 'sine' });
    tone({ from: 523, to: 659, duration: 0.18, volume: 0.08, delay: 0.12, type: 'sine' });
  },
  levelUp(): void {
    [523, 659, 784, 1047].forEach((f, i) => tone({ from: f, duration: 0.18, volume: 0.1, delay: i * 0.11, type: 'square' }));
  },
  loot(): void {
    [659, 784, 988].forEach((f, i) => tone({ from: f, duration: 0.12, volume: 0.09, delay: i * 0.07 }));
  },
  gold(): void {
    tone({ from: 988, to: 1319, duration: 0.09, volume: 0.07, type: 'square' });
  },
  bossDefeat(): void {
    [262, 330, 392, 523, 659, 784].forEach((f, i) => tone({ from: f, duration: 0.25, volume: 0.12, delay: i * 0.14, type: 'square' }));
    noise(0.6, 0.05, 0.3);
  },
  death(): void {
    [392, 330, 262, 196, 131].forEach((f, i) => tone({ from: f, duration: 0.3, volume: 0.12, delay: i * 0.18, type: 'sawtooth' }));
  },
  merchant(): void {
    [523, 659, 523, 784].forEach((f, i) => tone({ from: f, duration: 0.1, volume: 0.07, delay: i * 0.09 }));
  },
  potion(): void {
    tone({ from: 220, to: 660, duration: 0.25, volume: 0.09, type: 'sine' });
  },
  trap(): void {
    tone({ from: 200, to: 80, duration: 0.3, volume: 0.13, type: 'sawtooth' });
    noise(0.2, 0.08);
  },
  advance(): void {
    tone({ from: 196, to: 294, duration: 0.12, volume: 0.06, type: 'triangle' });
  },
};
