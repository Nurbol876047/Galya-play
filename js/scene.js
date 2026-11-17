/* 3D әлем: кешкі дала, 5 киіз үй-бекет, алтын шаңырақ, жұлдыздар, отшашу (three.js r160, window.THREE) */
(function () {
  'use strict';
  const T = window.THREE;
  const API = { ok: false };
  window.Scene3D = API;
  if (!T) return;

  let renderer, scene, camera, clock;
  const yurts = [];
  let shanyrak, trail, trailMat, dust, stars, ringMeshes = [];
  const fireworks = [];
  let fwOn = false, fwTimer = 0;
  const cam = { from: null, to: null, t: 1, dur: 2.2, pos: new T.Vector3(), look: new T.Vector3(), drift: 1, orbit: 0 };

  // Бекеттердің орны (жолмен ирелеңдеп алысқа кетеді)
  const SITES = [
    new T.Vector3(-26, 0, 10),
    new T.Vector3(-13, 0, -2),
    new T.Vector3(0, 0, 6),
    new T.Vector3(13, 0, -4),
    new T.Vector3(26, 0, 6),
  ];

  /* ---------- Текстуралар ---------- */
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  function wallTexture(accent) {
    return canvasTex(1024, 256, (g, w, h) => {
      g.fillStyle = '#efe2c6'; g.fillRect(0, 0, w, h);
      // киіз бетінің бұдыры
      for (let i = 0; i < 2500; i++) {
        g.fillStyle = `rgba(120,90,50,${Math.random() * 0.06})`;
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      // жоғарғы басқұр — қызыл жолақ, мүйіз өрнегімен
      g.fillStyle = accent; g.fillRect(0, 18, w, 74);
      g.fillStyle = '#e8b04a'; g.fillRect(0, 14, w, 6); g.fillRect(0, 90, w, 6);
      for (let x = 0; x < w; x += 64) window.ORN.drawHorn(g, x, 12, 0.64, '#f6ecd8', 5);
      // төменгі жолақ — ромбтар
      g.fillStyle = '#13284f'; g.fillRect(0, 200, w, 40);
      g.fillStyle = '#e8b04a';
      for (let x = 16; x < w; x += 32) { g.beginPath(); g.moveTo(x, 206); g.lineTo(x + 10, 220); g.lineTo(x, 234); g.lineTo(x - 10, 220); g.fill(); }
    });
  }
  function roofTexture() {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#f3e8d0'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(150,110,60,.25)'; g.lineWidth = 3;
      for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      g.fillStyle = '#c8323c'; g.fillRect(0, h - 70, w, 36);
      for (let x = 0; x < w; x += 48) window.ORN.drawHorn(g, x, h - 92, 0.48, '#e8b04a', 4);
    });
  }
  function doorTexture() {
    return canvasTex(128, 256, (g, w, h) => {
      g.fillStyle = '#b2262f'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#e8b04a'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
      window.ORN.drawHorn(g, 14, 40, 1.0, '#e8b04a', 6);
      window.ORN.drawHorn(g, 14, 150, 1.0, '#e8b04a', 6);
    });
  }
  function badgeTexture(n, done) {
    return canvasTex(256, 256, (g) => {
      g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2);
      g.fillStyle = done ? '#e8b04a' : '#13284f'; g.fill();
      g.lineWidth = 12; g.strokeStyle = done ? '#fff3cf' : '#e8b04a'; g.stroke();
      g.fillStyle = done ? '#13284f' : '#f7d58b';
      g.font = '800 130px Unbounded, Montserrat, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(done ? '✓' : String(n), 128, 138);
    });
  }

  /* ---------- Нысандар ---------- */
  function makeYurt(i) {
    const grp = new T.Group();
    const accents = ['#c8323c', '#b2262f', '#1f7a72', '#5b3a94', '#234f94'];
    const felt = new T.MeshStandardMaterial({ map: wallTexture(accents[i]), roughness: 0.95, side: T.DoubleSide });
    const wall = new T.Mesh(new T.CylinderGeometry(3, 3, 2.2, 48, 1, true), felt);
    wall.position.y = 1.1;
    grp.add(wall);

    const roof = new T.Mesh(
      new T.SphereGeometry(3.05, 48, 18, 0, Math.PI * 2, 0, Math.PI * 0.42),
      new T.MeshStandardMaterial({ map: roofTexture(), roughness: 0.9 })
    );
    roof.scale.y = 0.7;
    roof.position.y = 2.2 - 3.05 * Math.cos(Math.PI * 0.42) * 0.7;
    grp.add(roof);

    const gold = new T.MeshStandardMaterial({ color: 0xe8b04a, metalness: 0.8, roughness: 0.3, emissive: 0x3a2400 });
    const topY = roof.position.y + 3.05 * 0.7;
    const ring = new T.Mesh(new T.TorusGeometry(0.62, 0.09, 10, 32), gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = topY - 0.05;
    grp.add(ring);
    for (let k = 0; k < 2; k++) {
      const bar = new T.Mesh(new T.TorusGeometry(0.6, 0.05, 6, 20, Math.PI), gold);
      bar.scale.y = 0.45;
      bar.rotation.y = k * Math.PI / 2;
      bar.position.y = topY - 0.05;
      grp.add(bar);
    }

    const door = new T.Mesh(new T.BoxGeometry(1.0, 1.7, 0.14), new T.MeshStandardMaterial({ map: doorTexture(), roughness: 0.6 }));
    door.position.set(0, 0.85, 2.98);
    grp.add(door);

    // Нөмір белгісі
    const badge = new T.Sprite(new T.SpriteMaterial({ map: badgeTexture(i + 1, false), depthTest: true }));
    badge.scale.set(1.6, 1.6, 1);
    badge.position.y = topY + 1.4;
    grp.add(badge);

    // Жердегі нұрлы шеңбер
    const glow = new T.Mesh(
      new T.RingGeometry(3.6, 4.3, 64),
      new T.MeshBasicMaterial({ color: 0xe8b04a, transparent: true, opacity: 0.0, side: T.DoubleSide, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.05;
    grp.add(glow);

    const light = new T.PointLight(0xffb45a, 0, 14, 2);
    light.position.set(0, 2.2, 4.4);
    grp.add(light);

    grp.position.copy(SITES[i]);
    // Есігі камера жаққа (+z) және сәл ортаға қарайды
    grp.rotation.y = -SITES[i].x * 0.012;
    scene.add(grp);
    return { grp, badge, glow, light, done: false, current: false, idx: i };
  }

  function makeShanyrak() {
    const g = new T.Group();
    const gold = new T.MeshStandardMaterial({ color: 0xf0bd55, metalness: 0.9, roughness: 0.22, emissive: 0x4a2c00, emissiveIntensity: 0.6 });
    const R = 5;
    const ring = new T.Mesh(new T.TorusGeometry(R, 0.34, 16, 96), gold);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const ring2 = new T.Mesh(new T.TorusGeometry(R + 0.75, 0.12, 10, 96), gold);
    ring2.rotation.x = Math.PI / 2;
    g.add(ring2);
    // Күлдіреуіштер: екі бағытта үш-үштен иілген арқалық
    [-1.8, 0, 1.8].forEach((d) => {
      const r = Math.sqrt(R * R - d * d);
      for (let k = 0; k < 2; k++) {
        const arch = new T.Mesh(new T.TorusGeometry(r, 0.18, 10, 48, Math.PI), gold);
        arch.scale.y = 0.42;
        const piv = new T.Group();
        piv.rotation.y = k * Math.PI / 2;
        arch.position.z = d;
        piv.add(arch);
        g.add(piv);
      }
    });
    // Уықтар — шеңберден тарайтын сәулелер
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const rod = new T.Mesh(new T.CylinderGeometry(0.06, 0.1, 2.6, 6), gold);
      rod.position.set(Math.cos(a) * (R + 1.6), -0.55, Math.sin(a) * (R + 1.6));
      rod.rotation.z = Math.PI / 2;
      rod.rotation.y = -a;
      rod.rotateZ(-0.42);
      g.add(rod);
    }
    g.position.set(0, 24, -16);
    g.rotation.x = 0.5;
    g.scale.setScalar(1.25);
    scene.add(g);
    return g;
  }

  function makeSky() {
    const geo = new T.SphereGeometry(450, 32, 16);
    const mat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color('#06112a') }, mid: { value: new T.Color('#1b2f60') }, hor: { value: new T.Color('#d4824a') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader:
        'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; varying vec3 vP;' +
        'void main(){ float h = vP.y; vec3 c = mix(hor, mid, smoothstep(-0.02, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.7, h));' +
        ' float glow = pow(max(0.0, 1.0 - abs(h) * 6.0), 3.0) * max(0.0, -vP.z) * 0.35; c += vec3(1.0,0.6,0.3) * glow; gl_FragColor = vec4(c,1.0); }',
    });
    return new T.Mesh(geo, mat);
  }

  function makeGround() {
    const geo = new T.PlaneGeometry(700, 700, 180, 180);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, col = [];
    const c1 = new T.Color('#5d5a34'), c2 = new T.Color('#8a7745'), c3 = new T.Color('#3c4a2c'), tmp = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      let y = Math.sin(x * 0.045) * Math.cos(z * 0.05) * 2.2 + Math.sin(x * 0.11 + z * 0.07) * 0.8 + Math.sin(z * 0.02) * 3;
      // бекеттер маңын тегістеу
      let near = 1;
      SITES.forEach((s) => { const d = Math.hypot(x - s.x, z - s.z); near = Math.min(near, Math.min(1, Math.max(0, (d - 6) / 10))); });
      const far = Math.min(1, Math.max(0, (Math.hypot(x, z) - 60) / 120));
      y = y * near * (0.25 + far * 1.6) + far * far * 18;
      pos.setY(i, y - 0.02);
      const n = (Math.sin(x * 0.3) * Math.cos(z * 0.27) + 1) * 0.5;
      tmp.copy(c1).lerp(c2, n).lerp(c3, far * 0.6);
      col.push(tmp.r, tmp.g, tmp.b);
    }
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    return new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  }

  function makeMountains() {
    const g = new T.Group();
    const rock = new T.MeshStandardMaterial({ color: 0x2c3a66, roughness: 1, flatShading: true });
    const snow = new T.MeshStandardMaterial({ color: 0xe9eef8, roughness: 0.8, flatShading: true });
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * 0.95 + (i / 25) * Math.PI * 0.9 + (Math.random() - 0.5) * 0.05;
      const r = 200 + Math.random() * 60;
      const h = 30 + Math.random() * 45, w = 26 + Math.random() * 26;
      const m = new T.Mesh(new T.ConeGeometry(w, h, 6), rock);
      m.position.set(Math.cos(a) * r, h / 2 + 8, Math.sin(a) * r);
      m.rotation.y = Math.random() * 3;
      g.add(m);
      const s = new T.Mesh(new T.ConeGeometry(w * 0.3, h * 0.3, 6), snow);
      s.position.set(m.position.x, h + 8 - h * 0.15 + 0.2, m.position.z);
      s.rotation.y = m.rotation.y;
      g.add(s);
    }
    return g;
  }

  function makeTrail() {
    const curve = new T.CatmullRomCurve3([new T.Vector3(-40, 0, 22), ...SITES, new T.Vector3(36, 0, -6)]);
    const N = 220, p = new Float32Array(N * 3), c = new Float32Array(N * 3), u = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), v = curve.getPoint(t);
      p[i * 3] = v.x; p[i * 3 + 1] = 0.25; p[i * 3 + 2] = v.z;
      u.push(t);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(p, 3));
    geo.setAttribute('color', new T.BufferAttribute(c, 3));
    trailMat = new T.PointsMaterial({ size: 0.42, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    const pts = new T.Points(geo, trailMat);
    pts.userData.u = u;
    // Әр бекеттің қисық бойындағы параметрі
    pts.userData.siteT = SITES.map((s) => {
      let best = 0, bd = 1e9;
      for (let i = 0; i < 400; i++) { const t = i / 399, d = curve.getPoint(t).distanceTo(s); if (d < bd) { bd = d; best = t; } }
      return best;
    });
    return pts;
  }

  function makeStars() {
    const N = 1600, p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.92 + 0.08);
      p[i * 3] = Math.sin(ph) * Math.cos(th) * 420;
      p[i * 3 + 1] = Math.cos(ph) * 420;
      p[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 420;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(p, 3));
    return new T.Points(geo, new T.PointsMaterial({ color: 0xfff3d6, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 }));
  }

  function makeDust() {
    const N = 380, p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { p[i * 3] = (Math.random() - 0.5) * 90; p[i * 3 + 1] = Math.random() * 22; p[i * 3 + 2] = (Math.random() - 0.5) * 70; }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(p, 3));
    return new T.Points(geo, new T.PointsMaterial({ color: 0xf7d58b, size: 0.16, transparent: true, opacity: 0.75, depthWrite: false, blending: T.AdditiveBlending }));
  }

  function makeGrass() {
    const geo = new T.ConeGeometry(0.12, 0.7, 4);
    geo.translate(0, 0.35, 0);
    const N = 900, mesh = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: 0xb59a52, roughness: 1, flatShading: true }), N);
    const m = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), v = new T.Vector3();
    let k = 0;
    while (k < N) {
      const x = (Math.random() - 0.5) * 110, z = (Math.random() - 0.5) * 70;
      if (SITES.some((st) => Math.hypot(x - st.x, z - st.z) < 4.8)) continue;
      v.set(x, 0, z);
      q.setFromAxisAngle(new T.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(), Math.random() * 0.4);
      const sc = 0.6 + Math.random() * 1.2;
      s.set(sc, sc, sc);
      m.compose(v, q, s);
      mesh.setMatrixAt(k++, m);
    }
    return mesh;
  }

  /* ---------- Отшашу ---------- */
  const FW_COLORS = [0xe8b04a, 0xff5a4a, 0x2bd3c0, 0xfff3cf, 0x8f7bff];
  function burst(at) {
    const N = 140, p = new Float32Array(N * 3), vel = [];
    const center = at || new T.Vector3((Math.random() - 0.5) * 40, 14 + Math.random() * 10, -10 - Math.random() * 14);
    for (let i = 0; i < N; i++) {
      p[i * 3] = center.x; p[i * 3 + 1] = center.y; p[i * 3 + 2] = center.z;
      const d = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(6 + Math.random() * 6);
      vel.push(d);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(p, 3));
    const mat = new T.PointsMaterial({ color: FW_COLORS[(Math.random() * FW_COLORS.length) | 0], size: 0.45, transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending, fog: false });
    const pts = new T.Points(geo, mat);
    scene.add(pts);
    fireworks.push({ pts, vel, life: 0 });
  }

  /* ---------- Камера ---------- */
  function preset(name, i) {
    const aspect = innerWidth / innerHeight;
    const k = Math.max(1, 1.6 / aspect); // тар экранда алыстау
    if (name === 'title') return { pos: new T.Vector3(0, 7 * k, 40 * k), look: new T.Vector3(0, 8, -8) };
    if (name === 'map') return { pos: new T.Vector3(0, 26 * k, 40 * k), look: new T.Vector3(0, 0, 0) };
    if (name === 'victory') return { pos: new T.Vector3(0, 4, 34 * k), look: new T.Vector3(0, 21, -16) };
    const s = SITES[i || 0];
    if (name === 'stage') return { pos: new T.Vector3(s.x + 0.5, 3.4, s.z + 10 * k), look: new T.Vector3(s.x + 4, 2.4, s.z) };
    if (name === 'task') return { pos: new T.Vector3(s.x - 2, 2.8, s.z + 13 * k), look: new T.Vector3(s.x, 3.2, s.z) };
    return { pos: camera.position.clone(), look: cam.look.clone() };
  }

  API.go = function (name, i, instant) {
    if (!API.ok) return;
    const p = preset(name, i);
    cam.name = name; cam.idx = i;
    cam.from = { pos: camera.position.clone(), look: cam.look.clone() };
    cam.to = p;
    cam.t = instant ? 1 : 0;
    cam.dur = name === 'stage' ? 2.6 : 2.0;
    cam.orbit = name === 'victory' ? 1 : 0;
    cam.t0 = null;
    if (instant) { camera.position.copy(p.pos); cam.look.copy(p.look); }
  };

  API.setProgress = function (doneCount, current) {
    if (!API.ok) return;
    yurts.forEach((y, i) => {
      const done = i < doneCount;
      if (done !== y.done) { y.badge.material.map = badgeTexture(i + 1, done); y.badge.material.needsUpdate = true; y.done = done; }
      y.current = i === current;
    });
    trail.userData.progress = doneCount;
  };

  API.victory = function (on) { fwOn = on; if (on) for (let i = 0; i < 4; i++) setTimeout(() => burst(), i * 250); };
  API.burst = function () { if (API.ok) burst(); };

  /* ---------- Іске қосу ---------- */
  API.init = function (canvas) {
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      return false;
    }
    if (!renderer.getContext()) return false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    scene = new T.Scene();
    scene.fog = new T.Fog(0x2a2f50, 40, 260);
    camera = new T.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1200);

    const sky = makeSky();
    scene.add(sky);

    // Метал жылтыры үшін аспаннан қоршау картасы
    try {
      const pm = new T.PMREMGenerator(renderer);
      const envScene = new T.Scene();
      envScene.add(makeSky());
      const l = new T.Mesh(new T.SphereGeometry(30, 16, 8), new T.MeshBasicMaterial({ color: 0xffd9a0 }));
      l.position.set(200, 120, -200);
      envScene.add(l);
      scene.environment = pm.fromScene(envScene, 0.04).texture;
    } catch (e) {}

    scene.add(new T.HemisphereLight(0x8fa8ff, 0x4a3a20, 0.9));
    const sun = new T.DirectionalLight(0xffb070, 1.8);
    sun.position.set(-60, 30, -80);
    scene.add(sun);
    const fill = new T.DirectionalLight(0x9db4ff, 0.5);
    fill.position.set(40, 50, 60);
    scene.add(fill);

    // Ай
    const moon = new T.Mesh(new T.SphereGeometry(7, 24, 16), new T.MeshBasicMaterial({ color: 0xfff1cc, fog: false }));
    moon.position.set(140, 120, -300);
    scene.add(moon);

    scene.add(makeGround());
    scene.add(makeMountains());
    scene.add(makeGrass());
    stars = makeStars(); scene.add(stars);
    dust = makeDust(); scene.add(dust);
    trail = makeTrail(); scene.add(trail);
    for (let i = 0; i < SITES.length; i++) yurts.push(makeYurt(i));
    shanyrak = makeShanyrak();

    clock = new T.Clock();
    API.ok = true;
    const p = preset('title');
    camera.position.copy(p.pos);
    cam.look.copy(p.look);
    API.go('title', 0, true);

    addEventListener('resize', () => {
      renderer.setSize(innerWidth, innerHeight, false);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      if (cam.to) API.go(cam.name, cam.idx, true);
    });
    loop();
    return true;
  };

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const gold = new T.Color(0xe8b04a), dim = new T.Color(0x6a6040), bright = new T.Color(0xfff0c0);

  function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;

    // камера ауысуы
    if (cam.t < 1 && cam.to) {
      cam.t = Math.min(1, cam.t + dt / cam.dur);
      const e = ease(cam.t);
      camera.position.lerpVectors(cam.from.pos, cam.to.pos, e);
      cam.look.lerpVectors(cam.from.look, cam.to.look, e);
      // ұшып бара жатқанда аздап жоғары көтерілу
      camera.position.y += Math.sin(e * Math.PI) * 4;
    } else if (cam.to) {
      // жеңіл тербеліс
      const b = cam.to.pos;
      if (cam.orbit) {
        if (cam.t0 == null) cam.t0 = t;
        const r = Math.hypot(b.x, b.z - cam.to.look.z), a = Math.sin((t - cam.t0) * 0.06) * 0.6;
        camera.position.set(Math.sin(a) * r, b.y + Math.sin(t * 0.3) * 1.2, cam.to.look.z + Math.cos(a) * r);
      } else {
        camera.position.set(b.x + Math.sin(t * 0.25) * 0.8, b.y + Math.sin(t * 0.33) * 0.35, b.z + Math.cos(t * 0.2) * 0.6);
      }
    }
    camera.lookAt(cam.look);

    shanyrak.rotation.y = t * 0.12;
    shanyrak.position.y = 24 + Math.sin(t * 0.6) * 0.5;
    stars.material.opacity = 0.75 + Math.sin(t * 1.3) * 0.15;
    const dp = dust.geometry.attributes.position;
    for (let i = 0; i < dp.count; i++) {
      let y = dp.getY(i) + dt * 0.35;
      if (y > 22) y = 0;
      dp.setY(i, y);
      dp.setX(i, dp.getX(i) + Math.sin(t + i) * dt * 0.1);
    }
    dp.needsUpdate = true;

    // бекеттер
    yurts.forEach((y) => {
      const pulse = 0.5 + Math.sin(t * 3) * 0.5;
      y.glow.material.opacity = y.current ? 0.35 + pulse * 0.45 : y.done ? 0.28 : 0.0;
      y.glow.material.color.set(y.current ? 0xf7d58b : 0xe8b04a);
      y.light.intensity = y.current ? 18 + pulse * 10 : y.done ? 10 : 0;
      y.badge.position.y = 5.3 + (y.current ? Math.sin(t * 2.5) * 0.25 : 0);
    });

    // жол жарығы: өтілген бөлік алтын
    const prog = trail.userData.progress || 0, st = trail.userData.siteT, u = trail.userData.u, colA = trail.geometry.attributes.color;
    const lit = prog <= 0 ? st[0] * 0.98 : st[Math.min(prog, 4)];
    const tmp = new T.Color();
    for (let i = 0; i < u.length; i++) {
      if (u[i] <= lit) tmp.copy(gold).lerp(bright, (Math.sin(t * 4 - u[i] * 60) + 1) * 0.25);
      else tmp.copy(dim);
      colA.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    colA.needsUpdate = true;

    // отшашу
    if (fwOn) { fwTimer -= dt; if (fwTimer <= 0) { burst(); fwTimer = 0.45 + Math.random() * 0.5; } }
    for (let k = fireworks.length - 1; k >= 0; k--) {
      const f = fireworks[k];
      f.life += dt;
      const pa = f.pts.geometry.attributes.position;
      for (let i = 0; i < f.vel.length; i++) {
        f.vel[i].y -= 5 * dt;
        f.vel[i].multiplyScalar(0.985);
        pa.setXYZ(i, pa.getX(i) + f.vel[i].x * dt, pa.getY(i) + f.vel[i].y * dt, pa.getZ(i) + f.vel[i].z * dt);
      }
      pa.needsUpdate = true;
      f.pts.material.opacity = Math.max(0, 1 - f.life / 2.2);
      if (f.life > 2.2) { scene.remove(f.pts); f.pts.geometry.dispose(); f.pts.material.dispose(); fireworks.splice(k, 1); }
    }

    renderer.render(scene, camera);
  }
})();
