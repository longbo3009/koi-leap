// WebAudio sounds only — no audio files, no network. A tiny synth: a chime for
// pearls (pitch climbs with the combo), a splash for hits, a warm arpeggio for
// winning. The context is created on the first user gesture, so headless runs and
// the title screen stay silent; M toggles mute.

export function createAudio() {
  let context = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return true;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      context = new Ctor();
      master = context.createGain();
      master.gain.value = 0.22;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when = 0) {
    if (muted || !ensure()) return;
    const t0 = context.currentTime + when;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol) {
    if (muted || !ensure()) return;
    const len = Math.floor(context.sampleRate * dur);
    const buffer = context.createBuffer(1, len, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = context.createBufferSource();
    src.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = vol;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    pearl(combo) {
      const base = 520 * 2 ** (Math.min(combo, 12) / 12);
      tone(base, 0.18, 'sine', 0.5);
      tone(base * 1.5, 0.22, 'sine', 0.3, 0.05);
    },
    lotus() { tone(392, 0.25, 'triangle', 0.5); tone(587, 0.3, 'triangle', 0.4, 0.07); },
    dash() { tone(300, 0.12, 'sawtooth', 0.18); tone(660, 0.16, 'sawtooth', 0.18, 0.06); },
    hit() { noise(0.25, 0.6); tone(140, 0.3, 'sine', 0.5); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.45, i * 0.12)); },
    over() { [392, 330, 262].forEach((f, i) => tone(f, 0.4, 'triangle', 0.4, i * 0.15)); },
  };
}
