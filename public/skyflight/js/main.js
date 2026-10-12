// Sky Flight Challenge - file utama (satu-satunya yang memakai Three.js)
import { KeyboardControls } from './controls/keyboard.js';
import { MicrobitControls } from './controls/microbit.js';
import { GameAudio } from './audio.js';

// Semua pengaturan game di satu tempat
const CFG = {
  rings: 10,
  speed: 36,
  turn: 1.2,
  maxPitch: 0.55,
  ringR: 9,
  gap: 95,
  minAlt: 6,
  maxAlt: 85,
  startAlt: 25,
};

const $ = (id) => document.getElementById(id);

function showError(msg) {
  $('errorText').textContent = msg;
  $('errorCard').classList.remove('hidden');
  $('menu').classList.add('hidden');
}

// ---------- Memuat Three.js (lokal dulu, lalu CDN) ----------
let THREE = null;
if (location.protocol === 'file:') {
  showError('Halaman dibuka langsung sebagai file (file://). Browser memblokir modul JavaScript dengan cara ini.');
} else {
  try {
    THREE = await import('./libs/three.module.js').catch(() =>
      import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'));
  } catch (e) {
    THREE = null;
    showError('Three.js tidak bisa dimuat dari folder libs/ maupun dari internet.');
  }
}

if (THREE) startGame(THREE);

function startGame(THREE) {
  // ---------- Penyimpanan aman ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* abaikan */ } },
  };

  // ---------- Kontrol & suara ----------
  const keyboard = new KeyboardControls();
  const microbit = new MicrobitControls({
    invertRoll: store.get('sfc_invertRoll', true),
    invertPitch: store.get('sfc_invertPitch', true),
  });
  window.microbit = microbit; // untuk uji di console: microbit.feed("25,0")
  const audio = new GameAudio();

  microbit.onStatus = (m) => { $('mbStatus').textContent = m; };
  $('chkRoll').checked = microbit.invertRoll;
  $('chkPitch').checked = microbit.invertPitch;
  $('chkRoll').addEventListener('change', (e) => { microbit.invertRoll = e.target.checked; store.set('sfc_invertRoll', e.target.checked); });
  $('chkPitch').addEventListener('change', (e) => { microbit.invertPitch = e.target.checked; store.set('sfc_invertPitch', e.target.checked); });
  if (!MicrobitControls.supported()) $('mbStatus').textContent = 'Browser ini tidak mendukung Web Serial. Pakai Chrome atau Edge.';

  // ---------- Renderer, scene, kamera ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  $('game').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const SKY = 0xcdeaf5;
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 180, 900);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 2000);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6fb7a8, 0.9));
  const sun = new THREE.DirectionalLight(0xfff3dd, 1.6);
  sun.position.set(120, 200, 80);
  scene.add(sun);

  // ---------- Danau ----------
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1400, 64),
    new THREE.MeshStandardMaterial({ color: 0x3fd0c9, roughness: 0.35, metalness: 0.1 })
  );
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  // ---------- Gunung low-poly ----------
  const flat = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9 });
  const greens = [0x7fb85a, 0x6aa84f, 0x8fc46a, 0x5f9b46];
  const sandMat = flat(0xe8d39a);
  const snowMat = flat(0xffffff);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.2;
    const d = 520 + Math.random() * 260;
    const h = 60 + Math.random() * 120;
    const r = 70 + Math.random() * 60;
    const g = new THREE.Group();
    const geo = new THREE.ConeGeometry(r, h, 6 + Math.floor(Math.random() * 3), 2);
    // acak sedikit titik supaya terlihat alami
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      if (pos.getY(k) < h / 2 - 1) {
        pos.setX(k, pos.getX(k) * (0.85 + Math.random() * 0.3));
        pos.setZ(k, pos.getZ(k) * (0.85 + Math.random() * 0.3));
      }
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, flat(greens[i % greens.length]));
    m.position.y = h / 2;
    g.add(m);
    if (h > 130) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.28, h * 0.28, 6), snowMat);
      cap.position.y = h - h * 0.14 + 0.5;
      g.add(cap);
    }
    const beach = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.2, 2, 8), sandMat);
    beach.position.y = 0.5;
    g.add(beach);
    g.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    g.rotation.y = Math.random() * Math.PI;
    scene.add(g);
  }
  // pulau kecil dengan pohon
  const treeMat = flat(0x2f6b3a);
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 250 + Math.random() * 180;
    const isl = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(22, 30, 5, 7), flat(0x8fc46a));
    top.position.y = 2;
    isl.add(top);
    for (let t = 0; t < 5; t++) {
      const tr = new THREE.Mesh(new THREE.ConeGeometry(2.5, 9, 5), treeMat);
      tr.position.set((Math.random() - 0.5) * 30, 9, (Math.random() - 0.5) * 30);
      isl.add(tr);
    }
    isl.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    scene.add(isl);
  }

  // ---------- Awan ----------
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfd6e0, emissiveIntensity: 0.6, flatShading: true, roughness: 1 });
  const clouds = [];
  for (let i = 0; i < 18; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(8 + Math.random() * 6, 0), cloudMat);
      s.position.set(j * 10 - 15, Math.random() * 4, Math.random() * 6);
      c.add(s);
    }
    c.position.set((Math.random() - 0.5) * 1200, 110 + Math.random() * 60, (Math.random() - 0.5) * 1200);
    scene.add(c);
    clouds.push(c);
  }

  // ---------- Pesawat ----------
  const plane = new THREE.Group();
  plane.rotation.order = 'YXZ';
  const orange = flat(0xff6a1a);
  const dark = flat(0x22303c);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 6), orange);
  plane.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.6, 8), orange);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 3.8;
  plane.add(nose);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(10, 0.25, 1.8), orange);
  wing.position.set(0, -0.1, 0.6);
  plane.add(wing);
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 1), orange);
  tailH.position.set(0, 0.2, -2.7);
  plane.add(tailH);
  const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 1.1), orange);
  tailV.position.set(0, 1.1, -2.7);
  plane.add(tailV);
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.6), dark);
  cockpit.position.set(0, 0.95, 0.6);
  plane.add(cockpit);
  const prop = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 0.1), dark);
  prop.add(blade);
  const blade2 = blade.clone();
  blade2.rotation.z = Math.PI / 2;
  prop.add(blade2);
  prop.position.z = 4.65;
  plane.add(prop);
  scene.add(plane);

  // ---------- Ring ----------
  const ringGeo = new THREE.TorusGeometry(CFG.ringR, 0.8, 10, 40);
  const haloGeo = new THREE.TorusGeometry(CFG.ringR, 2.2, 8, 40);
  const activeMat = new THREE.MeshBasicMaterial({ color: 0xffe14d });
  const idleMat = new THREE.MeshStandardMaterial({ color: 0xffe14d, emissive: 0xffc928, emissiveIntensity: 0.45 });
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending });
  const rings = [];

  function buildRings() {
    rings.forEach((r) => scene.remove(r.mesh));
    rings.length = 0;
    let p = new THREE.Vector3(0, CFG.startAlt, 0);
    let dir = 0; // arah sudut di bidang datar
    for (let i = 0; i < CFG.rings; i++) {
      const dist = i === 0 ? 70 : CFG.gap;
      if (i > 0) {
        dir += (Math.random() - 0.5) * 1.3;
        // jika terlalu jauh dari tengah, belokkan ke arah pusat
        const next = p.clone().add(new THREE.Vector3(Math.sin(dir), 0, Math.cos(dir)).multiplyScalar(dist));
        if (Math.hypot(next.x, next.z) > 330) {
          const toC = Math.atan2(-p.x, -p.z);
          let d = toC - dir;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          dir += d * 0.7;
        }
      }
      const fwd = new THREE.Vector3(Math.sin(dir), 0, Math.cos(dir));
      const c = p.clone().add(fwd.clone().multiplyScalar(dist));
      c.y = i === 0 ? CFG.startAlt : 16 + Math.random() * 45;
      const n = c.clone().sub(p).normalize(); // arah lewat ring
      const g = new THREE.Group();
      const ring = new THREE.Mesh(ringGeo, idleMat);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.visible = false;
      g.add(ring, halo);
      g.position.copy(c);
      g.lookAt(c.clone().add(n)); // sumbu +Z ring menghadap arah lewat
      scene.add(g);
      rings.push({ mesh: g, ring, halo, center: c, normal: n, prevSide: -1 });
      p = c;
    }
  }

  // ---------- Partikel ledakan ----------
  const bursts = [];
  function burst(at) {
    const N = 90;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const vel = [];
    for (let i = 0; i < N; i++) {
      pos[i * 3] = at.x; pos[i * 3 + 1] = at.y; pos[i * 3 + 2] = at.z;
      vel.push(new THREE.Vector3().randomDirection().multiplyScalar(10 + Math.random() * 18));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffe14d, size: 1.2, transparent: true, opacity: 1, depthWrite: false });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    bursts.push({ pts, vel, life: 1 });
  }
  function updateBursts(dt) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life -= dt;
      const arr = b.pts.geometry.attributes.position.array;
      b.vel.forEach((v, k) => {
        arr[k * 3] += v.x * dt; arr[k * 3 + 1] += v.y * dt; arr[k * 3 + 2] += v.z * dt;
        v.multiplyScalar(Math.exp(-2 * dt));
      });
      b.pts.geometry.attributes.position.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, b.life);
      if (b.life <= 0) {
        scene.remove(b.pts);
        b.pts.geometry.dispose();
        b.pts.material.dispose();
        bursts.splice(i, 1);
      }
    }
  }

  // ---------- Status game ----------
  let state = 'menu'; // menu | countdown | play | pause | win
  let heading = 0, pitchAngle = 0, bank = 0;
  let time = 0, score = 0, current = 0;
  let countT = 0;
  const camPos = new THREE.Vector3();

  function resetGame() {
    buildRings();
    plane.position.set(0, CFG.startAlt, 0);
    heading = 0; pitchAngle = 0; bank = 0;
    time = 0; score = 0; current = 0;
    plane.rotation.set(0, 0, 0);
    const fwd = new THREE.Vector3(0, 0, 1);
    camPos.copy(plane.position).addScaledVector(fwd, -18).add(new THREE.Vector3(0, 6, 0));
    camera.position.copy(camPos);
    camera.lookAt(plane.position);
    highlightRing();
    updateHud();
  }

  function highlightRing() {
    rings.forEach((r, i) => {
      r.ring.material = i === current ? activeMat : idleMat;
      r.halo.visible = i === current;
      r.mesh.visible = i >= current;
    });
  }

  function showOnly(id) {
    ['menu', 'countdown', 'pauseScreen', 'winScreen'].forEach((x) => $(x).classList.toggle('hidden', x !== id));
    const inGame = id === null || id === 'countdown' || id === 'pauseScreen';
    $('hudTop').classList.toggle('hidden', !inGame);
    $('hudBottom').classList.toggle('hidden', !inGame);
  }

  function begin() {
    audio.init();
    resetGame();
    if (microbit.isAlive()) {
      state = 'countdown';
      countT = 3;
      showOnly('countdown');
    } else {
      state = 'play';
      showOnly(null);
    }
  }

  function pauseToggle() {
    if (state === 'play') { state = 'pause'; showOnly('pauseScreen'); audio.setEngine(false); }
    else if (state === 'pause') { state = 'play'; showOnly(null); }
  }

  function win() {
    state = 'win';
    audio.setEngine(false);
    audio.win();
    const bonus = Math.max(0, Math.round(1500 - time * 20));
    const total = score + bonus;
    let best = store.get('sfc_best', null);
    if (best === null || time < best) { best = time; store.set('sfc_best', time); }
    $('winTime').textContent = fmt(time);
    $('winScore').textContent = score;
    $('winBonus').textContent = bonus;
    $('winTotal').textContent = total;
    $('winBest').textContent = fmt(best);
    showOnly('winScreen');
  }

  function fmt(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return String(m).padStart(2, '0') + ':' + s.toFixed(1).padStart(4, '0');
  }

  function showBest() {
    const b = store.get('sfc_best', null);
    $('bestText').textContent = b === null ? '' : 'Waktu terbaik: ' + fmt(b);
  }
  showBest();

  // ---------- Tombol ----------
  $('btnStart').onclick = begin;
  $('btnRestart').onclick = begin;
  $('btnPauseRestart').onclick = begin;
  $('btnWinRestart').onclick = begin;
  $('btnPause').onclick = pauseToggle;
  $('btnResume').onclick = pauseToggle;
  $('btnMute').onclick = () => { const m = audio.toggleMute(); $('btnMute').textContent = 'Suara: ' + (m ? 'Off' : 'On'); };
  $('btnConnect').onclick = () => microbit.connect();
  $('btnCalib').onclick = () => microbit.calibrate();

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyP' || e.code === 'Escape') pauseToggle();
    else if (e.code === 'KeyR') { if (state !== 'menu') begin(); }
    else if (e.code === 'KeyM') $('btnMute').click();
    else if (e.code === 'KeyC') microbit.calibrate();
    else if (e.code === 'Enter' || e.code === 'Space') {
      if (state === 'menu' || state === 'win') begin();
      else if (state === 'pause') pauseToggle();
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- HUD ----------
  function updateHud() {
    $('hudTime').textContent = fmt(time);
    $('hudRing').textContent = current + '/' + CFG.rings;
    $('hudScore').textContent = score;
    $('hudAlt').textContent = Math.round(plane.position.y) + ' m';
    const r = rings[current];
    if (r) {
      const to = r.center.clone().sub(plane.position);
      $('hudDist').textContent = Math.round(to.length()) + ' m';
      let rel = Math.atan2(to.x, to.z) - heading;
      rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      // rel positif = ring di kiri, CSS rotate positif = kanan, jadi dibalik
      $('arrow').style.transform = 'rotate(' + (-rel * 180 / Math.PI) + 'deg)';
    } else {
      $('hudDist').textContent = '-';
    }
  }

  // ---------- Loop utama ----------
  const clock = new THREE.Clock();
  const fwd = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // Pilih sumber kontrol: micro:bit jika datanya masih mengalir, selain itu keyboard
    const useMb = microbit.isAlive();
    const kb = keyboard.read(dt);
    const input = useMb ? microbit.read() : kb;
    $('hudSource').textContent = useMb ? 'micro:bit' : 'Keyboard';

    // Tes arah di menu: miring kanan -> bar ke kanan, ujung USB naik -> bar ke atas
    const test = microbit.read();
    $('barRoll').style.transform = 'translateX(' + (test.roll * 63) + 'px)';
    $('barPitch').style.transform = 'translateY(' + (-test.pitch * 28) + 'px)';

    // Awan bergeser pelan
    clouds.forEach((c) => { c.position.x += dt * 3; if (c.position.x > 650) c.position.x = -650; });

    // Ring aktif berdenyut
    const r = rings[current];
    if (r) {
      const s = 1 + Math.sin(t * 4) * 0.06;
      r.halo.scale.setScalar(s);
      haloMat.opacity = 0.25 + Math.sin(t * 4) * 0.1;
    }

    prop.rotation.z += dt * (state === 'play' ? 40 : 10);

    if (state === 'countdown') {
      countT -= dt;
      $('countNum').textContent = Math.max(1, Math.ceil(countT));
      if (countT <= 0) {
        microbit.calibrate(); // kalibrasi otomatis di akhir hitung mundur
        state = 'play';
        showOnly(null);
      }
    }

    if (state === 'play') {
      time += dt;
      // ARAH: setelah invert, roll + (kanan) -> heading berkurang (belok kanan) dan bank ke kanan.
      heading -= input.roll * CFG.turn * dt;
      // pitch + (naik) -> sudut hidung naik -> ketinggian bertambah
      const targetPitch = input.pitch * CFG.maxPitch;
      pitchAngle += (targetPitch - pitchAngle) * (1 - Math.exp(-4 * dt));
      bank += (input.roll * 0.7 - bank) * (1 - Math.exp(-5 * dt));

      fwd.set(Math.sin(heading) * Math.cos(pitchAngle), Math.sin(pitchAngle), Math.cos(heading) * Math.cos(pitchAngle));
      plane.position.addScaledVector(fwd, CFG.speed * dt);
      if (plane.position.y < CFG.minAlt) plane.position.y = CFG.minAlt;
      if (plane.position.y > CFG.maxAlt) plane.position.y = CFG.maxAlt;

      plane.rotation.y = heading;
      plane.rotation.x = -pitchAngle; // x negatif = hidung naik
      plane.rotation.z = bank;        // z positif = sayap kanan turun (bank kanan)

      // Cek lolos ring: melintasi bidang ring dan cukup dekat ke pusat
      if (r) {
        const side = tmp.copy(plane.position).sub(r.center).dot(r.normal);
        const dist = plane.position.distanceTo(r.center);
        if (r.prevSide < 0 && side >= 0 && dist < CFG.ringR + 2.5) {
          score += 100;
          burst(r.center);
          audio.ring();
          current++;
          highlightRing();
          if (current >= CFG.rings) win();
        }
        r.prevSide = side;
      }
      audio.setEngine(state === 'play', input.pitch);
      updateHud();
    }

    // Kamera mengikuti dari belakang dengan lerp halus
    const flatFwd = tmp.set(Math.sin(heading), 0, Math.cos(heading));
    const desired = plane.position.clone().addScaledVector(flatFwd, -18);
    desired.y += 6;
    if (state === 'menu') {
      // putar pelan di menu
      desired.copy(plane.position).add(new THREE.Vector3(Math.sin(t * 0.2) * 22, 7, Math.cos(t * 0.2) * 22));
    }
    camPos.lerp(desired, 1 - Math.exp(-4 * dt));
    camera.position.copy(camPos);
    camera.lookAt(plane.position.clone().addScaledVector(flatFwd, state === 'menu' ? 0 : 10));

    updateBursts(dt);
    renderer.render(scene, camera);
  }

  resetGame();
  showOnly('menu');
  frame();
}
