// Kontrol micro:bit V2 lewat USB (Web Serial API, 115200 baud).
// micro:bit mengirim baris "roll,pitch" (derajat) dari akselerometer.
// read() mengembalikan {roll, pitch} antara -1 dan 1 (roll + = kanan, pitch + = naik).

// Selisih sudut terpendek, supaya tidak melompat dari +180 ke -180
function angDiff(a, b) {
  return ((a - b + 540) % 360) - 180;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export class MicrobitControls {
  constructor(opts = {}) {
    this.maxAngle = 28;
    this.deadzone = 0.1;
    this.invertRoll = true;   // bawaan teruji di perangkat pengguna, jangan diubah
    this.invertPitch = true;  // bawaan teruji di perangkat pengguna, jangan diubah
    this.timeout = 1000;
    this.smooth = 0.2;
    Object.assign(this, opts);
    this.raw = { roll: 0, pitch: 0 };
    this.sm = null;               // nilai yang sudah dihaluskan
    this.offset = { roll: 0, pitch: 0 };
    this.lastTime = 0;
    this.port = null;
    this.connected = false;
    this.onStatus = null;
  }

  static supported() { return typeof navigator !== 'undefined' && 'serial' in navigator; }

  status(msg) { if (this.onStatus) this.onStatus(msg); }

  async connect() {
    if (!MicrobitControls.supported()) {
      this.status('Browser ini tidak mendukung Web Serial. Pakai Chrome atau Edge.');
      return false;
    }
    if (this.connected) { this.status('Sudah tersambung.'); return true; }
    try {
      this.port = await navigator.serial.requestPort();
    } catch (e) {
      this.status('Tidak ada port dipilih.');
      return false;
    }
    // Coba buka beberapa kali (port kadang masih sibuk sesaat)
    let lastErr = null;
    for (let i = 0; i < 3; i++) {
      try {
        if (this.port.readable) { lastErr = null; break; } // sudah terbuka
        await this.port.open({ baudRate: 115200 });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        if (e && e.name === 'InvalidStateError') { lastErr = null; break; } // sudah terbuka
        try { await this.port.close(); } catch (_) {}
        await new Promise(r => setTimeout(r, 400));
      }
    }
    if (lastErr) {
      this.status('Port micro:bit sedang dipakai aplikasi lain. Tutup tab game lain, tab MakeCode (serial console), atau aplikasi serial lain, lalu cabut-colok kabel USB dan coba lagi.');
      return false;
    }
    this.connected = true;
    this.status('Tersambung. Menunggu data...');
    this.readLoop();
    return true;
  }

  async readLoop() {
    const decoder = new TextDecoderStream();
    this.port.readable.pipeTo(decoder.writable).catch(() => {});
    const reader = decoder.readable.getReader();
    let buf = '';
    let first = true;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i);
          buf = buf.slice(i + 1);
          if (this.feed(line) && first) {
            first = false;
            this.status('Tersambung, data masuk.');
          }
        }
      }
    } catch (e) {
      // kabel dicabut atau port ditutup
    }
    this.connected = false;
    this.status('Sambungan terputus. Klik Sambung micro:bit lagi.');
  }

  // Masukkan satu baris data (juga bisa dipakai untuk uji tanpa hardware)
  feed(line) {
    const s = String(line).trim();
    let r, p;
    const m = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/.exec(s);
    if (m) {
      r = parseFloat(m[1]);
      p = parseFloat(m[2]);
    } else if (s.startsWith('{')) {
      try {
        const o = JSON.parse(s);
        r = Number(o.roll);
        p = Number(o.pitch);
      } catch (e) { return false; }
    } else {
      return false;
    }
    if (!isFinite(r) || !isFinite(p)) return false;
    this.raw = { roll: r, pitch: p };
    if (!this.sm) {
      this.sm = { roll: r, pitch: p };
    } else {
      // penghalusan eksponensial dengan selisih sudut terpendek
      this.sm.roll = angDiff(this.sm.roll + angDiff(r, this.sm.roll) * this.smooth, 0);
      this.sm.pitch = angDiff(this.sm.pitch + angDiff(p, this.sm.pitch) * this.smooth, 0);
    }
    this.lastTime = performance.now();
    return true;
  }

  isAlive() { return performance.now() - this.lastTime < this.timeout; }

  // Simpan posisi sekarang sebagai posisi "datar"
  calibrate() {
    if (this.sm) this.offset = { roll: this.sm.roll, pitch: this.sm.pitch };
    this.status('Kalibrasi tersimpan.');
  }

  axis(v) {
    let x = clamp(v / this.maxAngle, -1, 1);
    const a = Math.abs(x);
    if (a < this.deadzone) return 0;
    return Math.sign(x) * (a - this.deadzone) / (1 - this.deadzone);
  }

  read() {
    if (!this.sm) return { roll: 0, pitch: 0 };
    let roll = this.axis(angDiff(this.sm.roll, this.offset.roll));
    let pitch = this.axis(angDiff(this.sm.pitch, this.offset.pitch));
    if (this.invertRoll) roll = -roll;
    if (this.invertPitch) pitch = -pitch;
    return { roll, pitch };
  }
}
