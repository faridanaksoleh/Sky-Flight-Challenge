// Kontrol keyboard. read() mengembalikan {roll, pitch} antara -1 dan 1.
// roll + = kanan, pitch + = naik. Nilai naik/turun pelan (ramp) supaya halus.
export class KeyboardControls {
  constructor() {
    this.keys = new Set();
    this.roll = 0;
    this.pitch = 0;
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  has(...codes) { return codes.some((c) => this.keys.has(c)); }

  read(dt = 0.016) {
    const tRoll = (this.has('ArrowRight', 'KeyD') ? 1 : 0) - (this.has('ArrowLeft', 'KeyA') ? 1 : 0);
    const tPitch = (this.has('ArrowUp', 'KeyW') ? 1 : 0) - (this.has('ArrowDown', 'KeyS') ? 1 : 0);
    const k = 1 - Math.exp(-7 * dt); // ramp eksponensial
    this.roll += (tRoll - this.roll) * k;
    this.pitch += (tPitch - this.pitch) * k;
    return { roll: this.roll, pitch: this.pitch };
  }
}
