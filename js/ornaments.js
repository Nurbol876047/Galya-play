/* Қазақ ою-өрнектері: қошқар мүйіз, шаңырақ, кезең белгілері (SVG + canvas) */
(function () {
  'use strict';

  // Қошқар мүйіз — 100×100 ұяшықта, сабағы төменде (50,70)
  const HORN =
    'M50 70 L50 62 C50 42 62 30 74 30 C86 30 93 40 89 50 C86 58 75 58 73 50 C71 44 77 40 81 44 ' +
    'M50 62 C50 42 38 30 26 30 C14 30 7 40 11 50 C14 58 25 58 27 50 C29 44 23 40 19 44';

  // Төрт жақты өрнек (мүйіздер жоғары және төмен + ортасында ромб)
  function quad(color, sw) {
    return (
      `<g fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="${HORN}" transform="translate(0,-20)"/>` +
      `<path d="${HORN}" transform="translate(0,120) scale(1,-1)"/>` +
      `</g><path d="M50 40 L60 50 L50 60 L40 50Z" fill="${color}"/>`
    );
  }

  function svgUrl(svg) {
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  }

  // Көлденең өрнек жолағы (тақтайшалардың жоғарғы шеті)
  function band(color = '#e8b04a', bg = 'none') {
    const s =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 24 100 50" width="56" height="28">` +
      (bg !== 'none' ? `<rect x="0" y="24" width="100" height="50" fill="${bg}"/>` : '') +
      `<path d="${HORN}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M0 72 H100" stroke="${color}" stroke-width="3"/>` +
      `<path d="M0 50 L6 56 L0 62 M100 50 L94 56 L100 62" fill="${color}"/>` +
      `</svg>`;
    return svgUrl(s);
  }

  // Фонға арналған қайталанатын өрнек торы
  function tile(color = 'rgba(232,176,74,.08)') {
    const s =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120">` +
      quad(color, 4) +
      `<circle cx="0" cy="0" r="6" fill="${color}"/><circle cx="100" cy="0" r="6" fill="${color}"/>` +
      `<circle cx="0" cy="100" r="6" fill="${color}"/><circle cx="100" cy="100" r="6" fill="${color}"/>` +
      `</svg>`;
    return svgUrl(s);
  }

  // Бұрыштық өрнек (тақтайша бұрыштары)
  function corner(color = '#e8b04a') {
    return (
      `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round">` +
      `<path d="M6 94 V20 Q6 6 20 6 H94"/>` +
      `<path d="M18 70 C18 40 40 18 70 18"/>` +
      `<path d="M30 54 C30 40 40 30 54 30 C64 30 68 40 60 46 C54 50 48 44 52 40"/>` +
      `</g><path d="M6 6 L16 6 L6 16Z" fill="${color}"/></svg>`
    );
  }

  // Шаңырақ (жоғарыдан қарағанда)
  function shanyrak(color = '#e8b04a', stroke = 6) {
    let rays = '';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const x1 = 100 + Math.cos(a) * 74, y1 = 100 + Math.sin(a) * 74;
      const x2 = 100 + Math.cos(a) * 94, y2 = 100 + Math.sin(a) * 94;
      rays += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }
    return (
      `<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round">` +
      `<circle cx="100" cy="100" r="68"/><circle cx="100" cy="100" r="58" stroke-width="${stroke / 2}"/>` +
      `<path d="M58 54 Q100 100 58 146 M100 32 V168 M142 54 Q100 100 142 146"/>` +
      `<path d="M54 58 Q100 100 146 58 M32 100 H168 M54 142 Q100 100 146 142"/>` +
      `<g stroke-width="${stroke / 2}">${rays}</g></g></svg>`
    );
  }

  // Кезең белгілері
  const ICONS = {
    // Темірқазық — бағыт беретін жұлдыз
    star: (c = '#e8b04a') =>
      `<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="${c}">` +
      `<path d="M100 8 L114 86 L192 100 L114 114 L100 192 L86 114 L8 100 L86 86Z"/>` +
      `<path d="M100 40 L108 92 L160 100 L108 108 L100 160 L92 108 L40 100 L92 92Z" fill="#0d1b38" opacity=".55"/>` +
      `<path d="M100 52 L106 94 L148 100 L106 106 L100 148 L94 106 L52 100 L94 94Z" transform="rotate(45 100 100)"/>` +
      `</g><circle cx="100" cy="100" r="10" fill="#fff6dc"/></svg>`,
    // Жеті жарғы — шиыршық заң
    scroll: (c = '#e8b04a') =>
      `<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M50 40 H150 Q166 40 166 56 V150 Q166 166 150 166 H60"/>` +
      `<path d="M50 40 Q34 40 34 56 Q34 72 50 72 H62 V160 Q62 176 46 176 Q30 176 30 160 V150"/>` +
      `<path d="M86 72 H140 M86 92 H140 M86 112 H122"/></g>` +
      `<circle cx="128" cy="140" r="16" fill="#c8323c"/><path d="M120 140 L128 132 L136 140 L128 148Z" fill="${c}"/></svg>`,
    shanyrak: (c = '#e8b04a') => shanyrak(c, 7),
    // Домбыра — дәстүр
    dombra: (c = '#e8b04a') =>
      `<svg viewBox="0 0 200 200" aria-hidden="true"><g transform="rotate(-35 100 100)">` +
      `<path d="M100 104 C70 104 56 130 60 156 C64 182 84 194 100 194 C116 194 136 182 140 156 C144 130 130 104 100 104Z" fill="${c}"/>` +
      `<circle cx="100" cy="150" r="9" fill="#0d1b38"/>` +
      `<rect x="93" y="10" width="14" height="100" rx="5" fill="${c}"/>` +
      `<path d="M96 14 V186 M104 14 V186" stroke="#0d1b38" stroke-width="1.6"/>` +
      `<g fill="#0d1b38">${[30, 46, 62, 78, 94].map((y) => `<rect x="92" y="${y}" width="16" height="2.4"/>`).join('')}</g>` +
      `<path d="M86 10 L114 10 L108 2 L92 2Z" fill="#c8323c"/></g></svg>`,
    // Шешендік — сөз
    speech: (c = '#e8b04a') =>
      `<svg viewBox="0 0 200 200" aria-hidden="true">` +
      `<path d="M24 40 H120 Q136 40 136 56 V104 Q136 120 120 120 H70 L44 144 V120 H40 Q24 120 24 104 V56 Q24 40 40 40Z" fill="${c}"/>` +
      `<path d="M80 136 H160 Q176 136 176 120 V86 Q176 70 160 70 H148 V112 Q148 136 124 136Z" fill="#2bb3a6"/>` +
      `<path d="M150 150 L160 172 L136 150Z" fill="#2bb3a6"/>` +
      `<g fill="none" stroke="#0d1b38" stroke-width="6" stroke-linecap="round"><path d="M80 98 C80 80 88 70 98 70 C106 70 110 78 104 84 M80 98 C80 80 72 70 62 70 C54 70 50 78 56 84"/></g></svg>`,
  };

  // Canvas-қа өрнек салу (киіз үй текстурасы үшін)
  function drawHorn(ctx, x, y, s, color, lw) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw / s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(new Path2D(HORN));
    ctx.restore();
  }

  window.ORN = { HORN, quad, band, tile, corner, shanyrak, ICONS, drawHorn, svgUrl };

  // CSS айнымалылары
  const root = document.documentElement.style;
  root.setProperty('--orn-band', band('#e8b04a'));
  root.setProperty('--orn-band-red', band('#c8323c'));
  root.setProperty('--orn-tile', tile());
})();
