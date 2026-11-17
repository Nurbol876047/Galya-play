/* Тапсырмаларға арналған SVG иллюстрациялар */
(function () {
  'use strict';
  const O = window.ORN;

  // Адам бейнесі (жалпақ стиль). x,y — аяқ астындағы нүкте
  function person(x, y, s = 1, o = {}) {
    const skin = o.skin || '#e7b48a';
    const shirt = o.shirt || '#2b5fa8';
    const hair = o.hair || '#2a1a12';
    const pants = o.pants || '#1d2b4a';
    const arms = o.arms || 'down'; // down | up | wave
    const fem = !!o.fem;
    const armL = arms === 'up' ? 'M-16 -78 L-30 -112' : arms === 'wave' ? 'M-16 -78 L-34 -64' : 'M-16 -78 L-22 -44';
    const armR = arms === 'up' ? 'M16 -78 L30 -112' : arms === 'wave' ? 'M16 -78 L34 -110' : 'M16 -78 L22 -44';
    return (
      `<g transform="translate(${x},${y}) scale(${s})">` +
      `<ellipse cx="0" cy="0" rx="22" ry="5" fill="rgba(0,0,0,.18)"/>` +
      `<path d="M-9 -40 L-10 -2 M9 -40 L10 -2" stroke="${pants}" stroke-width="10" stroke-linecap="round"/>` +
      `<g stroke="${skin}" stroke-width="7" stroke-linecap="round" fill="none"><path d="${armL}"/><path d="${armR}"/></g>` +
      (fem
        ? `<path d="M-15 -84 Q0 -90 15 -84 L22 -34 L-22 -34Z" fill="${shirt}"/>`
        : `<rect x="-16" y="-86" width="32" height="50" rx="10" fill="${shirt}"/>`) +
      (o.badge ? `<circle cx="-7" cy="-74" r="4.2" fill="#e8b04a" stroke="#fff" stroke-width="1"/>` : '') +
      (o.tie ? `<path d="M0 -84 L-3 -72 L0 -58 L3 -72Z" fill="${o.tie}"/>` : '') +
      `<rect x="-4" y="-94" width="8" height="10" fill="${skin}"/>` +
      `<circle cx="0" cy="-104" r="13" fill="${skin}"/>` +
      (fem
        ? `<path d="M-14 -104 Q-15 -121 0 -120 Q15 -121 14 -104 L16 -86 Q8 -92 10 -106 Q0 -112 -10 -106 Q-8 -92 -16 -86Z" fill="${hair}"/>`
        : `<path d="M-13 -106 Q-13 -120 0 -119 Q13 -120 13 -106 Q8 -112 0 -111 Q-8 -112 -13 -106Z" fill="${hair}"/>`) +
      `<circle cx="-4.5" cy="-104" r="1.6" fill="#222"/><circle cx="4.5" cy="-104" r="1.6" fill="#222"/>` +
      `<path d="M-4 -98 Q0 -95 4 -98" stroke="#7a3b2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
      `</g>`
    );
  }

  const svg = (vb, inner, cls = '') => `<svg class="ill ${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  /* ---------- 3-кезең: кеңседен рәміздерді тап (hotspot) ---------- */
  function officeScene() {
    const g = [];
    // қабырға мен еден
    g.push(`<rect width="960" height="540" fill="#f2e6cf"/>`);
    g.push(`<rect y="380" width="960" height="160" fill="#c8a272"/>`);
    g.push(`<path d="M0 380 H960" stroke="#a9824f" stroke-width="6"/>`);
    for (let i = 0; i < 12; i++) g.push(`<path d="M${i * 90} 380 L${i * 90 - 60} 540" stroke="#b8925f" stroke-width="2"/>`);
    // қабырғадағы ою жолағы
    g.push(`<rect y="34" width="960" height="18" fill="#c8323c" opacity=".85"/>`);
    for (let i = 0; i < 20; i++) g.push(`<path d="M${i * 50 + 25} 37 L${i * 50 + 33} 43 L${i * 50 + 25} 49 L${i * 50 + 17} 43Z" fill="#f2e6cf"/>`);

    // ДЕКОЙ: терезе
    g.push(
      `<g class="hs-decoy" data-id="window"><rect x="40" y="90" width="170" height="200" rx="6" fill="#8fc3e8" stroke="#7a5a35" stroke-width="10"/>` +
        `<path d="M40 230 L90 170 L130 210 L170 150 L210 210 V290 H40Z" fill="#6e86a8"/><path d="M150 168 L170 150 L188 174Z" fill="#fff"/>` +
        `<path d="M125 90 V290 M40 190 H210" stroke="#7a5a35" stroke-width="8"/></g>`
    );
    // ДЕКОЙ: сағат
    g.push(
      `<g class="hs-decoy" data-id="clock"><circle cx="300" cy="110" r="38" fill="#fff" stroke="#3a3a3a" stroke-width="7"/>` +
        `<path d="M300 110 V84 M300 110 L318 120" stroke="#222" stroke-width="5" stroke-linecap="round"/></g>`
    );
    // НЫСАНА: логотип (шаңырақ)
    g.push(
      `<g class="hs-target" data-id="logo"><rect x="400" y="70" width="170" height="150" rx="14" fill="#13284f"/>` +
        `<g transform="translate(435,80) scale(.5)">${O.shanyrak('#e8b04a', 9).replace(/<\/?svg[^>]*>/g, '')}</g>` +
        `<text x="485" y="208" text-anchor="middle" font-family="Unbounded,Montserrat,sans-serif" font-weight="800" font-size="20" fill="#e8b04a">АҚЖОЛ</text></g>`
    );
    // НЫСАНА: ұран
    g.push(
      `<g class="hs-target" data-id="slogan"><rect x="610" y="78" width="300" height="64" rx="8" fill="#c8323c"/>` +
        `<rect x="618" y="86" width="284" height="48" rx="5" fill="none" stroke="#f7d58b" stroke-width="2" stroke-dasharray="6 4"/>` +
        `<text x="760" y="119" text-anchor="middle" font-family="Unbounded,Montserrat,sans-serif" font-weight="800" font-size="22" fill="#fff6dc">БІРГЕ — БИІККЕ!</text></g>`
    );
    // НЫСАНА: құрмет тақтасы
    let photos = '';
    [[650, 186], [730, 186], [810, 186]].forEach(([x, y], i) => {
      photos += `<rect x="${x}" y="${y}" width="62" height="74" rx="4" fill="#fff"/>` +
        `<circle cx="${x + 31}" cy="${y + 28}" r="14" fill="${['#e7b48a', '#c99470', '#f0c49e'][i]}"/>` +
        `<path d="M${x + 10} ${y + 70} Q${x + 31} ${y + 40} ${x + 52} ${y + 70}Z" fill="${['#2b5fa8', '#2bb3a6', '#7a4fb8'][i]}"/>`;
    });
    g.push(
      `<g class="hs-target" data-id="board"><rect x="632" y="160" width="258" height="140" rx="8" fill="#7a4a24"/>` +
        `<rect x="640" y="168" width="242" height="124" rx="4" fill="#e9dcc0"/>` +
        `<text x="761" y="182" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="13" fill="#7a4a24">АЙДЫҢ ҮЗДІКТЕРІ</text>${photos}</g>`
    );
    // үстел
    g.push(`<rect x="300" y="330" width="380" height="22" rx="6" fill="#8a5a2b"/><rect x="320" y="352" width="14" height="90" fill="#6d4420"/><rect x="646" y="352" width="14" height="90" fill="#6d4420"/>`);
    // ноутбук
    g.push(`<path d="M360 330 L372 268 H470 L482 330Z" fill="#3c4a63"/><rect x="350" y="326" width="142" height="8" rx="3" fill="#55627a"/>`);
    // ДЕКОЙ: кофе
    g.push(
      `<g class="hs-decoy" data-id="coffee"><rect x="520" y="296" width="34" height="34" rx="5" fill="#fff" stroke="#c9b18d" stroke-width="3"/>` +
        `<path d="M554 304 Q568 306 566 318 Q564 326 554 324" stroke="#c9b18d" stroke-width="4" fill="none"/>` +
        `<path d="M530 288 Q526 278 532 270 M542 288 Q538 278 544 270" stroke="#bbb" stroke-width="2.4" fill="none"/></g>`
    );
    // НЫСАНА: кубок
    g.push(
      `<g class="hs-target" data-id="cup"><rect x="590" y="322" width="70" height="8" fill="#6d4420"/>` +
        `<path d="M600 262 H650 Q650 300 625 304 Q600 300 600 262Z" fill="#e8b04a"/>` +
        `<path d="M600 270 Q584 270 586 284 Q588 294 602 292 M650 270 Q666 270 664 284 Q662 294 648 292" stroke="#e8b04a" stroke-width="5" fill="none"/>` +
        `<rect x="619" y="302" width="12" height="12" fill="#c99230"/><rect x="606" y="312" width="38" height="10" rx="2" fill="#c99230"/>` +
        `<path d="M625 272 l4 8 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 l9 -1z" fill="#fff6dc"/></g>`
    );
    // ДЕКОЙ: гүл
    g.push(
      `<g class="hs-decoy" data-id="plant"><path d="M70 470 L80 400 H140 L150 470Z" fill="#b5653a"/>` +
        `<g fill="#3f9a5a"><ellipse cx="96" cy="370" rx="16" ry="38" transform="rotate(-25 96 370)"/><ellipse cx="124" cy="366" rx="16" ry="40" transform="rotate(22 124 366)"/>` +
        `<ellipse cx="110" cy="350" rx="14" ry="44"/></g></g>`
    );
    // НЫСАНА: корпоративтік киімдегі қызметкер
    g.push(
      `<g class="hs-target" data-id="uniform">` +
        person(800, 500, 1.55, { shirt: '#13284f', badge: true, tie: '#c8323c', hair: '#1d120c' }) +
        `<rect x="767" y="345" width="66" height="34" fill="transparent"/></g>`
    );
    // қарапайым қызметкер (бейтарап, басуға болмайды)
    g.push(person(230, 500, 1.4, { shirt: '#6a8f4e', fem: true, arms: 'wave', hair: '#3a2214' }));
    return svg('0 0 960 540', g.join(''), 'scene');
  }

  /* ---------- Кеңсе жоспарлары (жоғарыдан) ---------- */
  const deskTop = (x, y, w = 34, h = 22, c = '#c08a4a') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}"/>`;
  const chair = (x, y, c = '#2b5fa8') => `<circle cx="${x}" cy="${y}" r="7" fill="${c}"/>`;
  const frame = (inner) => svg('0 0 400 260', `<rect width="400" height="260" rx="14" fill="#efe3c9"/>${inner}<rect x="6" y="6" width="388" height="248" rx="10" fill="none" stroke="#5a4630" stroke-width="8"/>`, 'card');

  function layoutClosed() {
    let r = '<path d="M6 120 H394 M6 152 H394" stroke="#5a4630" stroke-width="6"/>';
    for (let i = 0; i < 4; i++) {
      const x = 6 + i * 97;
      r += `<path d="M${x} 6 V120 M${x} 152 V254" stroke="#5a4630" stroke-width="6"/>`;
      r += `<path d="M${x + 30} 120 h28" stroke="#efe3c9" stroke-width="7"/><path d="M${x + 30} 120 a28 28 0 0 1 28 -28" stroke="#5a4630" stroke-width="2" fill="none" stroke-dasharray="3 3"/>`;
      r += `<path d="M${x + 30} 152 h28" stroke="#efe3c9" stroke-width="7"/>`;
      r += deskTop(x + 28, 36) + chair(x + 45, 70) + deskTop(x + 28, 196) + chair(x + 45, 186);
    }
    r += `<text x="200" y="141" text-anchor="middle" font-size="12" font-family="Montserrat" font-weight="700" fill="#5a4630">ДӘЛІЗ</text>`;
    return frame(r);
  }
  function layoutOpen() {
    let r = '';
    const round = (cx, cy) => {
      let s = `<circle cx="${cx}" cy="${cy}" r="30" fill="#c08a4a"/>`;
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; s += chair(cx + Math.cos(a) * 42, cy + Math.sin(a) * 42, ['#2bb3a6', '#e8b04a', '#c8323c', '#2b5fa8', '#7a4fb8', '#3f9a5a'][k]); }
      return s;
    };
    r += round(100, 90) + round(230, 170) + round(110, 200);
    r += `<rect x="300" y="40" width="70" height="34" rx="12" fill="#c8323c"/><circle cx="320" cy="100" r="13" fill="#e8b04a"/><circle cx="352" cy="104" r="13" fill="#2bb3a6"/>`;
    r += `<rect x="270" y="20" width="110" height="8" rx="3" fill="#fff" stroke="#888"/>`;
    r += `<circle cx="350" cy="214" r="18" fill="#3f9a5a"/><circle cx="40" cy="236" r="12" fill="#3f9a5a"/>`;
    return frame(r);
  }
  function layoutHierarchy() {
    let r = `<rect x="6" y="6" width="388" height="78" fill="#d9c49c"/><path d="M6 84 H160 M240 84 H394" stroke="#5a4630" stroke-width="6"/>`;
    r += deskTop(150, 26, 100, 34, '#7a4a24') + `<circle cx="200" cy="18" r="9" fill="#7a4a24"/>`;
    r += `<text x="200" y="76" text-anchor="middle" font-size="11" font-family="Montserrat" font-weight="800" fill="#5a4630">ДИРЕКТОР</text>`;
    for (let row = 0; row < 3; row++) for (let c = 0; c < 6; c++) r += deskTop(28 + c * 60, 112 + row * 48, 34, 18) + chair(45 + c * 60, 140 + row * 48, '#6b7a99');
    return frame(r);
  }
  function layoutCubicle() {
    let r = '';
    for (let row = 0; row < 3; row++) for (let c = 0; c < 5; c++) {
      const x = 26 + c * 72, y = 24 + row * 76;
      r += `<path d="M${x} ${y} H${x + 60} V${y + 60} M${x} ${y} V${y + 60}" stroke="#7d6a50" stroke-width="5" fill="none"/>`;
      r += deskTop(x + 6, y + 6, 48, 14, '#a9a9a9') + chair(x + 30, y + 36, '#6b7a99');
    }
    return frame(r);
  }

  /* ---------- Логотиптер ---------- */
  const logoFrame = (inner, name, c = '#13284f') =>
    svg('0 0 400 260', `<rect width="400" height="260" rx="14" fill="#f6ecd8"/><g>${inner}</g><text x="200" y="236" text-anchor="middle" font-family="Unbounded,Montserrat,sans-serif" font-weight="800" font-size="22" fill="${c}">${name}</text>`, 'card');
  function logoHorse() {
    return logoFrame(
      `<defs><linearGradient id="lg-h" x1="0" x2="1"><stop offset="0" stop-color="#f7d58b"/><stop offset="1" stop-color="#c8862a"/></linearGradient></defs>` +
        `<g stroke="#2bb3a6" stroke-width="7" stroke-linecap="round"><path d="M40 92 H120 M24 122 H112 M52 152 H118"/></g>` +
        `<path d="M150 200 C150 160 160 128 186 102 L204 60 L214 92 C244 96 272 112 288 142 C296 156 288 170 272 166 L238 158 C226 172 212 186 206 206 Z" fill="url(#lg-h)"/>` +
        `<path d="M200 70 C176 84 164 104 156 132 M206 84 C186 100 178 122 172 146 M214 96 C198 116 192 136 190 160" stroke="#13284f" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<circle cx="248" cy="124" r="6" fill="#13284f"/>`,
      'ТҰЛПАР'
    );
  }
  function logoCastle() {
    return logoFrame(
      `<path d="M130 200 V80 H150 V60 H170 V80 H190 V60 H210 V80 H230 V60 H250 V80 H270 V200Z" fill="#6b6b78"/>` +
        `<rect x="178" y="130" width="44" height="70" rx="22" fill="#3a3a44"/>` +
        `<rect x="184" y="150" width="32" height="26" rx="4" fill="#e8b04a"/><path d="M190 150 V140 Q200 128 210 140 V150" stroke="#e8b04a" stroke-width="5" fill="none"/>`,
      'ҚАМАЛ', '#3a3a44'
    );
  }
  function logoTurtle() {
    let hex = '';
    [[180, 120], [220, 120], [200, 96], [200, 144], [160, 140], [240, 140]].forEach(([x, y]) => (hex += `<path d="M${x} ${y - 12} l10 6 v12 l-10 6 l-10 -6 v-12z" fill="#5f8a3e"/>`));
    return logoFrame(
      `<ellipse cx="200" cy="130" rx="80" ry="54" fill="#7aa64f"/>${hex}` +
        `<ellipse cx="292" cy="140" rx="22" ry="16" fill="#9ccf6b"/><circle cx="298" cy="134" r="3" fill="#222"/>` +
        `<g fill="#9ccf6b"><ellipse cx="150" cy="182" rx="14" ry="10"/><ellipse cx="250" cy="182" rx="14" ry="10"/></g>`,
      'БАЯУ ЖҮРІС', '#4f7a2e'
    );
  }
  function logoPapers() {
    let s = '';
    for (let i = 0; i < 5; i++) s += `<rect x="${140 - i * 4}" y="${60 + i * 8}" width="110" height="130" rx="4" fill="#fff" stroke="#b9b0a0" stroke-width="2"/>`;
    s += `<g stroke="#b9b0a0" stroke-width="4">${[100, 116, 132, 148].map((y) => `<path d="M134 ${y + 14} H226"/>`).join('')}</g>`;
    s += `<circle cx="262" cy="170" r="30" fill="none" stroke="#c8323c" stroke-width="6"/><text x="262" y="176" font-size="15" font-weight="800" text-anchor="middle" fill="#c8323c" font-family="Montserrat">БЕКІТ</text>`;
    return logoFrame(s, 'ҚАҒАЗ-ПРО', '#7a6a50');
  }

  /* ---------- 4-кезең: жаңа қызметкерді қарсы алу ---------- */
  function onboardingScene() {
    let g = `<rect width="640" height="360" fill="#f2e6cf"/><rect y="290" width="640" height="70" fill="#c8a272"/>`;
    g += `<rect x="150" y="30" width="340" height="56" rx="10" fill="#13284f"/>` +
      `<text x="320" y="68" text-anchor="middle" font-family="Unbounded,Montserrat,sans-serif" font-size="24" font-weight="800" fill="#e8b04a">ҚОШ КЕЛДІҢІЗ!</text>`;
    g += `<g fill="#c8323c">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M${60 + i * 65} 100 l14 26 l14 -26z" fill="${['#c8323c', '#e8b04a', '#2bb3a6'][i % 3]}"/>`).join('')}</g>`;
    g += `<path d="M60 100 Q320 120 600 100" stroke="#5a4630" stroke-width="2" fill="none"/>`;
    g += person(120, 330, 1.25, { shirt: '#2bb3a6', arms: 'up', fem: true });
    g += person(210, 330, 1.25, { shirt: '#7a4fb8', arms: 'up' });
    g += person(475, 330, 1.25, { shirt: '#c8323c', arms: 'up', fem: true, hair: '#5a3416' });
    g += person(560, 330, 1.25, { shirt: '#3f9a5a', arms: 'up' });
    // жаңа қызметкер — ортада, қолында сәлемдеме қорабы
    g += person(320, 340, 1.45, { shirt: '#f6ecd8', tie: '#13284f', arms: 'down', hair: '#1d120c' });
    g += `<rect x="296" y="240" width="48" height="36" rx="4" fill="#e8b04a"/><path d="M320 240 V276 M296 254 H344" stroke="#c8323c" stroke-width="5"/>`;
    g += `<path d="M310 240 Q300 226 314 228 Q320 232 320 240 Q320 232 326 228 Q340 226 330 240" fill="none" stroke="#c8323c" stroke-width="4"/>`;
    // ментор — иығына қол қояды
    g += `<g opacity=".95">${person(392, 336, 1.32, { shirt: '#13284f', badge: true, arms: 'wave', hair: '#6b6b6b' })}</g>`;
    return svg('0 0 640 360', g, 'scene');
  }

  /* ---------- Жағдаят кейіпкерлері (аватар) ---------- */
  function avatar(o = {}) {
    return svg('-60 -150 120 140', `<circle cx="0" cy="-80" r="66" fill="${o.bg || '#1d3566'}"/>` + person(0, 0, 1, o), 'avatar');
  }

  /* ---------- Хаттар (5-кезең) ---------- */
  function mail(from, subj, body, tone = 'ok') {
    return (
      `<div class="mail ${tone}"><div class="mail-top"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><b>${subj}</b></div>` +
      `<div class="mail-from">${from}</div><div class="mail-body">${body}</div></div>`
    );
  }

  window.ILL = { person, officeScene, layoutClosed, layoutOpen, layoutHierarchy, layoutCubicle, logoHorse, logoCastle, logoTurtle, logoPapers, onboardingScene, avatar, mail };
})();
