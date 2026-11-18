// Tiny synthesized sounds (Web Audio, no audio files): a pluck for an orb, a warm
// chime for a lit lantern, a low thud for a hit and a rising arpeggio for the win.
// Everything is guarded: with no user gesture yet the context stays suspended
// and play() simply does nothing.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context !== null) return context;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      return null;
    }
    return context;
  }

  function tone(freq, when, length, type, gain) {
    const ctx = ensure();
    if (ctx === null || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(0, ctx.currentTime + when);
      amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + when + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + length);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + length + 0.05);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  return {
    unlock() {
      const ctx = ensure();
      if (ctx !== null && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    collect(combo) {
      tone(660 + Math.min(combo, 12) * 30, 0, 0.14, 'sine', 0.12);
      tone(990 + Math.min(combo, 12) * 30, 0.05, 0.12, 'sine', 0.08);
    },
    light() {
      tone(523, 0, 0.25, 'triangle', 0.14);
      tone(659, 0.08, 0.25, 'triangle', 0.14);
      tone(784, 0.16, 0.35, 'triangle', 0.14);
    },
    hit() {
      tone(160, 0, 0.25, 'sawtooth', 0.12);
      tone(110, 0.08, 0.25, 'sawtooth', 0.1);
    },
    shield() {
      tone(440, 0, 0.18, 'sine', 0.12);
      tone(880, 0.1, 0.22, 'sine', 0.1);
    },
    dash() {
      tone(300, 0, 0.1, 'square', 0.05);
      tone(520, 0.05, 0.1, 'square', 0.05);
    },
    win() {
      [523, 659, 784, 1047].forEach((freq, i) => tone(freq, i * 0.12, 0.4, 'triangle', 0.14));
    },
  };
}
