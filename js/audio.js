/* Дыбыстар: домбыра шертпесіне ұқсас синтез (WebAudio, файлсыз) */
(function () {
  'use strict';
  let ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem('umd-muted') === '1'; } catch (e) {}

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Карплюс–Стронг: шуды қысқа кідіріс арқылы сүзу — шертпелі ішекті аспап дыбысы
  const cache = {};
  function stringBuffer(freq, dur) {
    const key = Math.round(freq) + ':' + dur;
    if (cache[key]) return cache[key];
    const sr = ctx.sampleRate, n = Math.floor(sr * dur), N = Math.max(2, Math.round(sr / freq));
    const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      const nx = (idx + 1) % N;
      const v = (ring[idx] + ring[nx]) * 0.5 * 0.996;
      d[i] = ring[idx];
      ring[idx] = v;
      idx = nx;
    }
    return (cache[key] = buf);
  }

  function pluck(freq, when = 0, dur = 1.2, vol = 0.7) {
    if (muted || !ensure()) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = stringBuffer(freq, dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 3200;
    src.connect(f).connect(g).connect(master);
    src.start(t);
  }

  function tone(freq, when, dur, type = 'sine', vol = 0.2) {
    if (muted || !ensure()) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // Домбыраның екі ішегі (кварта): ре–соль
  const N = { D3: 146.8, G3: 196, A3: 220, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, C5: 523.3, D5: 587.3 };

  const SFX = {
    click() { pluck(N.D4, 0, 0.35, 0.35); },
    select() { pluck(N.G4, 0, 0.4, 0.4); },
    correct() { [N.D4, N.G4, N.A4, N.D5].forEach((f, i) => pluck(f, i * 0.09, 1.1, 0.6)); },
    wrong() { pluck(N.A3, 0, 0.8, 0.6); pluck(N.F4 / 2, 0.16, 1.0, 0.6); tone(110, 0.0, 0.35, 'triangle', 0.12); },
    tick() { tone(1200, 0, 0.05, 'square', 0.05); },
    timeup() { tone(330, 0, 0.25, 'sawtooth', 0.08); tone(220, 0.25, 0.45, 'sawtooth', 0.08); },
    reveal() { pluck(N.D4, 0, 0.6, 0.4); pluck(N.G4, 0.06, 0.6, 0.4); },
    joker() { [N.C5, N.A4, N.D5].forEach((f, i) => pluck(f, i * 0.06, 0.6, 0.5)); },
    // Күйге ұқсас қысқа сарын (кезең басталғанда)
    stage() {
      const seq = [N.D4, N.D4, N.G4, N.A4, N.G4, N.F4, N.G4, N.D4];
      seq.forEach((f, i) => { pluck(f, i * 0.14, 0.9, 0.55); if (i % 2 === 0) pluck(N.D3, i * 0.14, 0.9, 0.3); });
    },
    fanfare() {
      const seq = [N.D4, N.G4, N.A4, N.C5, N.D5, N.C5, N.D5, N.G4, N.A4, N.D5];
      seq.forEach((f, i) => { pluck(f, i * 0.12, 1.2, 0.6); pluck(f / 2, i * 0.12, 1.2, 0.3); });
    },
  };

  window.AudioFX = {
    play(name) { try { SFX[name] && SFX[name](); } catch (e) {} },
    unlock() { try { ensure(); } catch (e) {} },
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem('umd-muted', muted ? '1' : '0'); } catch (e) {}
      return muted;
    },
  };
})();
