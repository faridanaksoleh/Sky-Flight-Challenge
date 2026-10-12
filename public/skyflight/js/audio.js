// Suara dibuat langsung dengan WebAudio (tanpa file suara).
export class GameAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this.engineGain = null;
  }

  // Harus dipanggil setelah klik/tombol (aturan browser)
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;
    this.master.connect(this.ctx.destination);

    // Dengung mesin: gelombang gergaji + filter
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 85;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    osc.connect(lp).connect(this.engineGain).connect(this.master);
    osc.start();
    this.engineOsc = osc;
  }

  setEngine(on, pitch = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(on ? 0.12 : 0, t, 0.15);
    this.engineOsc.frequency.setTargetAtTime(85 + pitch * 15, t, 0.2);
  }

  tone(freq, start, dur, type = 'sine', vol = 0.3) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + start;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  ring() {
    this.tone(880, 0, 0.15, 'triangle');
    this.tone(1320, 0.08, 0.25, 'triangle');
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.15, 0.35, 'square', 0.15));
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
    return this.muted;
  }
}
