/* Ойын қозғалтқышы: командалар, кезеңдер, миссиялар, таймер, ұпай, жәрдемшілер, блиц, жеңіс */
(function () {
  'use strict';
  const D = window.GAME_DATA, O = window.ORN, A = window.AudioFX, S3 = window.Scene3D;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const screen = $('#screen'), hud = $('#hud'), modal = $('#modal');
  const SAVE_KEY = 'umd-save-v1';
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  const TEAM_PRESETS = [
    { name: 'Бүркіт', emoji: '🦅', color: '#c8323c' },
    { name: 'Тұлпар', emoji: '🐎', color: '#2b5fa8' },
    { name: 'Барыс', emoji: '🐆', color: '#1f9d90' },
    { name: 'Бөрі', emoji: '🐺', color: '#c98d2c' },
    { name: 'Арқар', emoji: '🐏', color: '#7a4fb8' },
    { name: 'Нар', emoji: '🐫', color: '#3f8a4a' },
  ];
  const TYPE_LABEL = {
    logic: '🧠 Логикалық сұрақ', situation: '🎭 Жағдаяттық тапсырма', choice: '✅ Дұрыс жауапты таңда', image: '🖼 Сурет арқылы тап',
    imagechoice: '🖼 Сурет арқылы тап', mail: '✉️ Дұрыс жауапты таңда', match: '🔗 Сәйкестендіру', word: '🔤 Жасырын сөз',
    category: '🗂 Топтастыру', sort: '🗂 Топтастыру', rules: '⚖️ Ережені бұзба', order: '🔢 Ретін тап', hotspot: '🔍 Суреттен тап', tf: '⚖️ Ақиқат па, жалған ба?',
  };
  const BASE_TIME = { choice: 45, imagechoice: 50, match: 100, category: 90, order: 70, word: 60, hotspot: 80 };
  const PAIR_COLORS = ['#e8b04a', '#2bd3c0', '#ff7a6b', '#9d8bff', '#7fd36b', '#ff9de1'];

  let G = null; // ойын күйі (сақталады)
  let R = null; // ағымдағы миссия күйі

  /* ================== Көмекшілер ================== */
  const corners = () => ['tl', 'tr', 'bl', 'br'].map((c) => `<span class="corner ${c}">${O.corner()}</span>`).join('');
  const panel = (html, cls = '') => `<div class="panel ${cls}">${corners()}${html}</div>`;
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const emb = (t, cls = '') => `<div class="emb ${cls}" style="background:${t.color}">${t.emoji}</div>`;
  const basePts = () => 100 + G.stage * 25;
  const blitzPts = () => 50 + G.stage * 10;
  const speed = () => G.settings.speed;

  function view(html, opts = {}) {
    screen.classList.toggle('full', !!opts.full);
    screen.innerHTML = `<div class="view ${opts.cls || ''}">${html}</div>`;
    screen.scrollTop = 0;
  }
  function toast(msg, ms = 2200) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) {} }
  function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && s.teams ? s : null; } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

  function crumbs() {
    $('#crumbs').innerHTML = G ? D.stages.map((s, i) => `<span class="crumb ${i < G.done ? 'done' : i === G.stage ? 'cur' : ''}" title="${i + 1}. ${s.name}"></span>`).join('') : '';
  }

  /* ================== Ұпай тақтасы ================== */
  function renderHud(activeIdx = -1) {
    if (!G) { hud.innerHTML = ''; return; }
    const max = Math.max(...G.teams.map((t) => t.score));
    const leaders = G.teams.filter((t) => t.score === max).length;
    hud.innerHTML = G.teams
      .map((t, i) => `<div class="chip ${i === activeIdx ? 'active' : ''} ${t.score === max && max > 0 && leaders === 1 ? 'lead' : ''}" data-i="${i}">${emb(t)}<div><div class="cname">${esc(t.name)}</div><div class="cscore" data-score="${i}">${t.score}</div></div></div>`)
      .join('');
  }
  function award(i, pts, opts = {}) {
    const t = G.teams[i];
    t.score += pts;
    t.stage[G.stage] += pts;
    renderHud(opts.active != null ? opts.active : -1);
    if (pts !== 0) {
      const chip = hud.querySelector(`.chip[data-i="${i}"]`);
      if (chip) {
        const d = document.createElement('div');
        d.className = 'delta ' + (pts > 0 ? 'pos' : 'neg');
        d.textContent = (pts > 0 ? '+' : '') + pts;
        chip.appendChild(d);
      }
    }
  }

  /* ================== Таймер ================== */
  const C = 2 * Math.PI * 44;
  const Timer = {
    total: 0, left: 0, id: null, paused: false, onEnd: null, infinite: false,
    html() {
      return `<div class="timer" id="timer"><svg viewBox="0 0 100 100"><circle class="t-bg" cx="50" cy="50" r="44" fill="none" stroke-width="8"/>` +
        `<circle class="t-fg" cx="50" cy="50" r="44" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><div class="t-num">–</div></div>`;
    },
    start(sec, onEnd) {
      this.stop();
      this.infinite = !sec;
      this.total = sec || 1;
      this.left = sec || 0;
      this.onEnd = onEnd;
      this.paused = false;
      this.render();
      if (!this.infinite) this.id = setInterval(() => this.tick(), 1000);
    },
    tick() {
      if (this.paused) return;
      this.left--;
      if (this.left <= 5 && this.left > 0) A.play('tick');
      this.render();
      if (this.left <= 0) { this.stop(); A.play('timeup'); this.onEnd && this.onEnd(); }
    },
    add(s) { if (this.infinite) return; this.left += s; this.total = Math.max(this.total, this.left); this.render(); },
    stop() { clearInterval(this.id); this.id = null; },
    render() {
      const el = $('#timer');
      if (!el) return;
      const n = el.querySelector('.t-num'), fg = el.querySelector('.t-fg');
      if (this.infinite) { n.textContent = '∞'; fg.style.strokeDashoffset = 0; return; }
      n.textContent = Math.max(0, this.left);
      fg.style.strokeDashoffset = C * (1 - Math.max(0, this.left) / this.total);
      el.classList.toggle('warn', this.left <= 10 && this.left > 0 && !this.paused);
      el.classList.toggle('paused', this.paused);
    },
  };

  /* ================== Басты экран ================== */
  function showTitle() {
    G = null;
    crumbs();
    renderHud();
    S3.go && S3.go('title');
    S3.victory && S3.victory(false);
    const saved = loadSave();
    view(
      `<div class="title-view">
        <div class="kicker">Интерактивті командалық ойын</div>
        <h1 class="gold-text">${D.title}</h1>
        <div class="orn-divider"></div>
        <p class="sub">5 кезең · 20 миссия · 15 шапшаң сұрақ. Ұйымдық мәдениеттің негізгі элементтерін қазақ даласының даналығы арқылы аш — бес киіз үй-бекеттен өтіп, ең көп ұпай жинаған команда жеңеді!</p>
        <div class="title-badges">${D.stages.map((s, i) => `<span class="tbadge"><i>${O.ICONS[s.icon](s.color)}</i>${i + 1}. ${s.name}</span>`).join('')}</div>
        <div class="row center" style="margin-top:8px">
          <button class="btn big" id="bStart">🐎 Саяхатты бастау</button>
          ${saved ? `<button class="btn ghost big" id="bResume">↻ Жалғастыру (${saved.stage + 1}-кезең)</button>` : ''}
          <button class="btn ghost big" id="bRules">📜 Ойын ережесі</button>
        </div>
      </div>`,
      { full: true }
    );
    $('#bStart').onclick = () => { A.unlock(); A.play('click'); showSetup(); };
    $('#bRules').onclick = () => { A.unlock(); showRules(); };
    if (saved) $('#bResume').onclick = () => { A.unlock(); G = saved; resume(); };
  }

  /* ================== Баптау ================== */
  let setupTeams = null;
  let setupOpts = { speed: 1, blitz: true, steal: true };
  function showSetup() {
    if (!setupTeams) setupTeams = TEAM_PRESETS.slice(0, 4).map((t) => ({ ...t }));
    S3.go('map');
    const teamsHtml = setupTeams
      .map((t, i) => `<div class="team-edit">${emb(t)}<input value="${esc(t.name)}" data-i="${i}" maxlength="18" aria-label="Команда атауы"/>${setupTeams.length > 1 ? `<button class="x-btn" data-del="${i}" title="Өшіру">✕</button>` : ''}</div>`)
      .join('');
    const seg = (key, opts) => `<div class="seg" data-key="${key}">${opts.map(([v, l]) => `<button data-v="${v}" class="${setupOpts[key] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    view(
      panel(`<div class="setup">
        <div>
          <h2 class="gold-text">Командаларды жасақта</h2>
          <p class="muted" style="margin:0">Аудиторияны 2–6 командаға бөліңіз. Атауларын өзгертуге болады — басып, жаңа атау жазыңыз.</p>
          <div class="team-list">${teamsHtml}</div>
          <div class="row" style="margin-top:14px">
            <button class="btn ghost sm" id="bAdd" ${setupTeams.length >= 6 ? 'disabled' : ''}>＋ Команда қосу</button>
            <span class="muted" style="font-size:.85em">Командалар саны: <b>${setupTeams.length}</b></span>
          </div>
          <div class="opt-group"><label class="lbl">⏱ Таймер</label>${seg('speed', [[0.75, 'Жылдам'], [1, 'Қалыпты'], [1.5, 'Баяу'], [0, 'Таймерсіз']])}</div>
          <div class="opt-group"><label class="lbl">⚡ Әр кезең соңындағы шапшаң сайыс (барлық командалар)</label>${seg('blitz', [[true, 'Қосулы'], [false, 'Өшірулі']])}</div>
          <div class="opt-group"><label class="lbl">🎯 Қате жауаптан кейін басқа командаға «ұрлау» мүмкіндігі</label>${seg('steal', [[true, 'Қосулы'], [false, 'Өшірулі']])}</div>
        </div>
        <div class="howto">
          <h2 class="gold-text" style="font-size:1.2em;margin-bottom:10px">Қалай ойналады?</h2>
          <ul>
            <li>Командалар миссияларды <b>кезекпен</b> орындайды. Кезектегі команда ақылдасып, жауабын айтады — жүргізуші экранда таңдайды.</li>
            <li>Дұрыс жауап: <b>${100}–${200} ұпай</b> + қалған әр секунд үшін бонус. Кейінгі кезеңдердің бағасы жоғары!</li>
            <li>Әр командада 3 жәрдемші бар: <b>🧓 Ақсақал кеңесі</b> (екі қате жауапты алып тастайды), <b>⏳ Құмсағат</b> (+20 сек), <b>🔥 Тәуекел</b> (ұпай ×2, қате болса — айып).</li>
            <li>Кезектегі команда қателессе, басқа команда жауапты <b>«ұрлап»</b>, жарты ұпай ала алады.</li>
            <li>Кезең соңында <b>⚡ шапшаң сайыс</b>: барлық командалар бір мезетте жауап береді (қол көтеріп немесе A/B/C/D карточкасымен).</li>
            <li>Ұзақтығы: шамамен <b>70–100 минут</b>. Кез келген сәтте ⏸ үзіліс жасауға болады, прогресс автоматты сақталады.</li>
          </ul>
          <div class="row" style="margin-top:16px"><button class="btn big" id="bGo">Саяхатқа аттану →</button><button class="btn ghost" id="bBack">← Артқа</button></div>
        </div>
      </div>`)
    );
    $$('.team-edit input').forEach((inp) => (inp.oninput = () => (setupTeams[+inp.dataset.i].name = inp.value)));
    $$('[data-del]').forEach((b) => (b.onclick = () => { setupTeams.splice(+b.dataset.del, 1); showSetup(); }));
    $('#bAdd').onclick = () => {
      const used = setupTeams.map((t) => t.emoji);
      const p = TEAM_PRESETS.find((t) => !used.includes(t.emoji));
      if (p) setupTeams.push({ ...p });
      A.play('click');
      showSetup();
    };
    $$('.seg').forEach((s) =>
      s.querySelectorAll('button').forEach((b) => (b.onclick = () => {
        const v = b.dataset.v;
        setupOpts[s.dataset.key] = v === 'true' ? true : v === 'false' ? false : parseFloat(v);
        A.play('click');
        showSetup();
      }))
    );
    $('#bBack').onclick = showTitle;
    $('#bGo').onclick = () => {
      const teams = setupTeams.map((t, i) => ({ ...t, name: (t.name || '').trim() || TEAM_PRESETS[i].name }));
      newGame(teams, { ...setupOpts });
      A.play('stage');
      showMap();
    };
  }

  function newGame(teams, settings) {
    G = {
      teams: teams.map((t) => ({ name: t.name, emoji: t.emoji, color: t.color, score: 0, correct: 0, attempts: 0, stage: [0, 0, 0, 0, 0], jokers: { fifty: 1, time: 1, risk: 1 } })),
      settings, stage: 0, task: 0, blitz: 0, active: 0, done: 0, phase: 'map',
    };
    save();
  }

  function resume() {
    crumbs();
    renderHud();
    S3.setProgress(G.done, G.stage);
    if (G.phase === 'results') showStageResults();
    else if (G.phase === 'blitz') showBlitz();
    else showMap();
  }

  /* ================== Саяхат картасы ================== */
  function showMap() {
    G.phase = 'map';
    save();
    crumbs();
    renderHud();
    S3.setProgress(G.done, G.stage);
    S3.go('map');
    view(
      `<div class="map-view">
        <div class="map-head"><div class="stage-no">САЯХАТ КАРТАСЫ</div><h2 class="gold-text">Бес бекет — бес элемент</h2>
        <p class="muted" style="margin:6px 0 0">Әр киіз үй — ұйымдық мәдениеттің бір элементі. Келесі бекетке өту үшін алдыңғысын аяқтаңыз.</p></div>
        <div class="track">${D.stages
          .map((s, i) => {
            const st = i < G.done ? 'done' : i === G.stage ? 'cur' : 'locked';
            const label = st === 'done' ? '✓ Өтілді' : st === 'cur' ? (G.task > 0 ? 'Жалғастыру →' : 'Бастау →') : '🔒 Жабық';
            return `<div class="station ${st}" data-i="${i}"><div class="medal">${O.ICONS[s.icon](st === 'done' ? '#13284f' : s.color)}</div>
              <div class="num">${i + 1}-КЕЗЕҢ</div><h3>${s.name}</h3><div class="el">${s.element}</div><div class="state">${label}</div></div>`;
          })
          .join('')}</div>
        <button class="btn big" id="bEnter">${G.stage + 1}-бекетке аттану →</button>
      </div>`
    );
    $$('.station.cur').forEach((el) => (el.onclick = () => { A.play('click'); showIntro(); }));
    $('#bEnter').onclick = () => { A.play('click'); showIntro(); };
  }

  /* ================== Кезеңге кіріспе ================== */
  function showIntro() {
    const s = D.stages[G.stage];
    S3.setProgress(G.done, G.stage);
    S3.go('stage', G.stage);
    A.play('stage');
    crumbs();
    const kinds = s.tasks.map((t) => TYPE_LABEL[t.kind] || TYPE_LABEL[t.type]);
    view(
      `<div class="intro-view">
        <div class="intro-left">
          <div class="big-icon">${O.ICONS[s.icon](s.color)}</div>
          <div class="stage-no">${G.stage + 1}-КЕЗЕҢ · ${G.stage + 1}-БЕКЕТ</div>
          <h1 class="gold-text">«${s.name}»</h1>
          <span class="el-tag">Элемент: ${s.element}</span>
        </div>
        ${panel(`<div class="intro-card">
          <div class="stage-no" style="margin-bottom:8px">📚 БІЛІМ ҚОРЖЫНЫ</div>
          <p class="lead">${s.intro.lead}</p>
          <ul>${s.intro.points.map((p) => `<li>${p}</li>`).join('')}</ul>
          <div class="wisdom"><div class="wi">${O.ICONS[s.icon]('#e8b04a')}</div><div><h4>${s.intro.wisdom.title}</h4><p>${s.intro.wisdom.text}</p></div></div>
          <div class="mission-list">${kinds.map((k, i) => `<span>${i + 1}. ${k}</span>`).join('')}${G.settings.blitz ? '<span>⚡ Шапшаң сайыс</span>' : ''}</div>
          <div class="row"><button class="btn big" id="primary">${G.task > 0 ? 'Миссияларды жалғастыру →' : 'Миссияларды бастау →'}</button><button class="btn ghost" id="bMap">← Карта</button></div>
        </div>`)}
      </div>`
    );
    $('#primary').onclick = () => { A.play('click'); startTask(); };
    $('#bMap').onclick = showMap;
  }

  /* ================== Миссия ================== */
  function startTask() {
    if (G.task >= D.stages[G.stage].tasks.length) { if (G.settings.blitz && G.blitz < D.stages[G.stage].blitz.length) showBlitz(); else finishStage(); return; }
    G.phase = 'task';
    save();
    const st = D.stages[G.stage], def = st.tasks[G.task];
    R = { def, teamIdx: G.active, phase: 'answer', risk: false, hint: 0, state: {}, firstWrong: null };
    S3.go('task', G.stage);
    renderTaskView();
    const H = Handlers[def.type];
    H.init(def, R.state);
    H.draw();
    const secs = speed() ? Math.round((BASE_TIME[def.type] || 50) * speed()) : 0;
    Timer.start(secs, () => submit(true));
  }

  function renderTaskView() {
    const def = R.def, team = G.teams[R.teamIdx];
    const label = TYPE_LABEL[def.kind] || TYPE_LABEL[def.type];
    const j = team.jokers;
    const fiftyOk = (def.type === 'choice' || def.type === 'imagechoice') && def.options.length > 2;
    view(
      panel(`<div class="task-view">
        <div class="task-head">
          ${Timer.html()}
          <div class="task-meta">
            <div class="tm-top"><span class="pill">${G.stage + 1}-кезең · Миссия ${G.task + 1}/${D.stages[G.stage].tasks.length}</span><span class="pill type">${label}</span><span class="pill pts">🏅 ${basePts()} ұпай${speed() ? ' + уақыт бонусы' : ''}</span></div>
            <div class="turn" id="turn">${emb(team)}<div><small>Кезектегі команда</small>${esc(team.name)}</div></div>
          </div>
          <div class="jokers" id="jokers">
            <button class="joker" data-j="fifty" ${!j.fifty || !fiftyOk ? 'disabled' : ''} title="Екі қате жауапты алып тастайды"><span>🧓</span>Ақсақал кеңесі</button>
            <button class="joker" data-j="time" ${!j.time || !speed() ? 'disabled' : ''} title="+20 секунд"><span>⏳</span>Құмсағат</button>
            <button class="joker" data-j="risk" ${!j.risk ? 'disabled' : ''} title="Дұрыс болса ұпай ×2, қате болса айып"><span>🔥</span>Тәуекел</button>
          </div>
          <button class="icon-btn" id="bPause" title="Үзіліс (P)">⏸</button>
        </div>
        <div class="task-body" id="tbody"></div>
        <div id="fbox"></div>
        <div class="task-foot" id="tfoot">
          <span class="hint-txt" id="hintTxt"></span>
          <div class="row" id="tactions"><button class="btn" id="primary">Жауап беру ✓</button></div>
        </div>
      </div>`)
    );
    renderHud(R.teamIdx);
    $$('#jokers .joker').forEach((b) => (b.onclick = () => useJoker(b.dataset.j)));
    $('#bPause').onclick = pause;
    $('#primary').onclick = () => submit(false);
  }

  function useJoker(kind) {
    if (R.phase !== 'answer') return;
    const t = G.teams[R.teamIdx];
    if (!t.jokers[kind]) return;
    if (kind === 'fifty') {
      const wrong = shuffle(R.def.options.map((_, i) => i).filter((i) => i !== R.def.answer && i !== R.state.sel)).slice(0, 2);
      wrong.forEach((i) => { const b = $(`.opt[data-i="${i}"]`); if (b) { b.classList.add('gone'); b.disabled = true; } });
      toast('🧓 Ақсақал кеңесі: екі қате жауап алынып тасталды');
    } else if (kind === 'time') {
      Timer.add(20);
      toast('⏳ Құмсағат: +20 секунд');
    } else if (kind === 'risk') {
      R.risk = true;
      toast('🔥 Тәуекел! Дұрыс болса ұпай ×2, қате болса айып салынады');
    }
    t.jokers[kind] = 0;
    const b = $(`.joker[data-j="${kind}"]`);
    b.disabled = true;
    if (kind === 'risk') { b.classList.add('active'); b.disabled = true; }
    A.play('joker');
    save();
  }

  function pause() {
    Timer.paused = true;
    Timer.render();
    openModal(
      `<div class="pause-screen"><div class="shan">${O.shanyrak('#e8b04a', 6)}</div><h1 class="gold-text">ҮЗІЛІС</h1>
        <p class="muted">Командалар ақылдасып алсын. Таймер тоқтатылды.</p><button class="btn big" id="bResumeP">Жалғастыру ▶</button></div>`,
      () => { Timer.paused = false; Timer.render(); }
    );
    $('#bResumeP').onclick = closeModal;
  }

  /* ---------- Жауапты тексеру ---------- */
  const STEALABLE = { choice: 1, imagechoice: 1, word: 1 };

  function submit(timeout) {
    if (!R || (R.phase !== 'answer' && R.phase !== 'steal')) return;
    const H = Handlers[R.def.type];
    if (!timeout && H.ready && !H.ready()) { toast(H.notReady || 'Алдымен жауап таңдаңыз'); A.play('wrong'); return; }
    Timer.stop();
    const res = H.evaluate();
    const base = basePts();
    $$('#jokers .joker').forEach((b) => (b.disabled = true));

    if (R.phase === 'steal') {
      const j = R.steal, half = Math.round(base / 2);
      G.teams[j].attempts++;
      if (res.ratio === 1) { G.teams[j].correct++; award(j, half, { active: R.teamIdx }); A.play('correct'); }
      else A.play('wrong');
      R.phase = 'done';
      H.reveal(true);
      feedback(res.ratio === 1 ? 'ok' : 'bad', res.ratio === 1 ? `«${G.teams[j].name}» жауапты ұрлады!` : 'Бұл жолы да қате', res.ratio === 1 ? half : 0, R.def.explain);
      return;
    }

    const team = G.teams[R.teamIdx];
    team.attempts++;
    let pts, perfect = res.ratio === 1;
    const bonus = perfect && speed() ? Math.max(0, Timer.left) : 0;
    if (perfect) pts = base + bonus;
    else pts = Math.round(base * res.ratio * 0.6);
    if (R.hint) pts = Math.round(pts * Math.max(0, 1 - 0.25 * R.hint));
    pts -= res.penalty || 0;
    if (R.risk) pts = perfect ? pts * 2 : -Math.round(base / 2);
    if (perfect) team.correct++;
    award(R.teamIdx, pts, { active: R.teamIdx });
    A.play(perfect ? 'correct' : res.ratio > 0 ? 'reveal' : 'wrong');

    const canSteal = !perfect && G.settings.steal && G.teams.length > 1 && STEALABLE[R.def.type];
    if (canSteal) {
      R.phase = 'offer';
      H.reveal(false);
      stealOffer(pts, timeout);
      return;
    }
    R.phase = 'done';
    H.reveal(true);
    const parts = [];
    if (perfect && bonus) parts.push(`уақыт бонусы +${bonus}`);
    if (R.risk) parts.push(perfect ? 'тәуекел ×2' : 'тәуекел айыбы');
    if (res.penalty) parts.push(`қате басу −${res.penalty}`);
    if (R.hint) parts.push('кеңес алынды');
    const title = perfect ? pick(['Тамаша! Дұрыс!', 'Керемет, дұп-дұрыс!', 'Жарайсыңдар!', 'Нағыз шебер!']) : res.ratio > 0 ? `Жартылай дұрыс: ${Math.round(res.ratio * 100)}%` : timeout ? 'Уақыт бітті!' : 'Қате жауап';
    feedback(perfect ? 'ok' : res.ratio > 0 ? 'mid' : 'bad', title + (parts.length ? ` <span class="muted" style="font-size:.7em">(${parts.join(', ')})</span>` : ''), pts, R.def.explain);
  }
  const pick = (a) => a[(Math.random() * a.length) | 0];

  function stealOffer(pts, timeout) {
    const half = Math.round(basePts() / 2);
    const others = G.teams.map((t, i) => ({ t, i })).filter((o) => o.i !== R.teamIdx);
    $('#tactions').innerHTML = '';
    $('#hintTxt').textContent = '';
    $('#fbox').innerHTML =
      `<div class="feedback bad"><div class="fb-icon">${timeout ? '⌛' : '✗'}</div><div><div class="fb-title">${timeout ? 'Уақыт бітті!' : 'Қате жауап!'}</div><div class="fb-text">Дұрыс жауап әзірге жасырын. Басқа командалар білсе — қол көтерсін!</div></div><div class="fb-pts ${pts < 0 ? 'neg' : ''}">${pts > 0 ? '+' : ''}${pts}</div></div>` +
      `<div class="steal"><h4>🎯 Жауапты ұрлау мүмкіндігі (+${half} ұпай). Қай команда бірінші қол көтерді?</h4><div class="row">` +
      others.map((o) => `<button class="team-pick" data-t="${o.i}">${emb(o.t)}${esc(o.t.name)}</button>`).join('') +
      `<button class="btn ghost sm" id="bNoSteal">Ешкім — жауапты көрсет</button></div></div>`;
    $$('.team-pick').forEach((b) => (b.onclick = () => startSteal(+b.dataset.t)));
    $('#bNoSteal').onclick = () => {
      R.phase = 'done';
      Handlers[R.def.type].reveal(true);
      feedback('bad', timeout ? 'Уақыт бітті!' : 'Қате жауап', null, R.def.explain);
    };
    scrollFb();
  }

  function startSteal(j) {
    R.phase = 'steal';
    R.steal = j;
    A.play('joker');
    const t = G.teams[j];
    $('#turn').innerHTML = `${emb(t)}<div><small>🎯 Ұрлау кезегі</small>${esc(t.name)}</div>`;
    renderHud(j);
    $('#fbox').innerHTML = '';
    $('#tactions').innerHTML = `<button class="btn" id="primary">Жауап беру ✓</button>`;
    $('#primary').onclick = () => submit(false);
    Handlers[R.def.type].unlockForSteal();
    Timer.start(speed() ? Math.round(25 * speed()) : 0, () => submit(true));
  }

  function feedback(kind, title, pts, text) {
    const icon = kind === 'ok' ? '✓' : kind === 'mid' ? '◐' : '✗';
    $('#fbox').innerHTML = `<div class="feedback ${kind}"><div class="fb-icon">${icon}</div><div><div class="fb-title">${title}</div><div class="fb-text">${text}</div></div>${pts == null ? '<div></div>' : `<div class="fb-pts ${pts < 0 ? 'neg' : ''}">${pts > 0 ? '+' : ''}${pts}</div>`}</div>`;
    const last = G.task >= D.stages[G.stage].tasks.length - 1;
    const label = !last ? 'Келесі миссия →' : G.settings.blitz ? '⚡ Шапшаң сайысқа →' : 'Кезең қорытындысы →';
    $('#tactions').innerHTML = `<button class="btn" id="primary">${label}</button>`;
    $('#primary').onclick = nextTask;
    $('#hintTxt').textContent = '';
    renderHud(-1);
    scrollFb();
    save();
  }
  function scrollFb() { const b = $('#tbody'); const f = $('#fbox'); if (f && f.scrollIntoView) setTimeout(() => f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60); if (b) b.style.maxHeight = ''; }

  function nextTask() {
    A.play('click');
    G.active = (R.teamIdx + 1) % G.teams.length;
    G.task++;
    R = null;
    save();
    if (G.task < D.stages[G.stage].tasks.length) startTask();
    else if (G.settings.blitz) { G.blitz = 0; showBlitz(); }
    else finishStage();
  }

  /* ================== Миссия түрлері ================== */
  const Handlers = {};

  /* --- Таңдау (мәтін немесе сурет) --- */
  Handlers.choice = Handlers.imagechoice = {
    init(def, s) { s.sel = null; },
    draw() {
      const def = R.def;
      let h = '';
      if (def.story) h += `<div class="story">${ILL.avatar(def.avatar)}<div><div class="who">${def.who}</div><p>${def.story}</p></div></div>`;
      let q = `<p class="question">${def.q}</p>`;
      const cls = def.type === 'imagechoice' ? (def.kind === 'mail' ? 'mails' : 'img') : def.image ? 'one' : def.options.length === 2 ? 'tf' : '';
      q += `<div class="options ${cls}">` + def.options.map((o, i) => {
        if (def.type === 'imagechoice' && def.kind === 'mail') return `<button class="opt" data-i="${i}"><div class="cap"><span class="key">${LETTERS[i]}</span></div>${o}</button>`;
        if (def.type === 'imagechoice') return `<button class="opt" data-i="${i}">${o}<div class="cap"><span class="key">${LETTERS[i]}</span>${def.labels ? def.labels[i] : ''}</div></button>`;
        return `<button class="opt" data-i="${i}"><span class="key">${LETTERS[i]}</span><span>${o}</span></button>`;
      }).join('') + '</div>';
      h += def.image ? `<div class="img-split"><div class="task-image">${def.image()}</div><div>${q}</div></div>` : q;
      $('#tbody').innerHTML = h;
      $$('.opt').forEach((b) => (b.onclick = () => this.select(+b.dataset.i)));
      $('#hintTxt').textContent = 'Нұсқаны таңдап, «Жауап беру» батырмасын басыңыз (пернетақта: 1–4, Enter)';
    },
    select(i) {
      if (R.phase !== 'answer' && R.phase !== 'steal') return;
      const b = $(`.opt[data-i="${i}"]`);
      if (!b || b.disabled) return;
      R.state.sel = i;
      $$('.opt').forEach((x) => x.classList.toggle('sel', +x.dataset.i === i));
      A.play('select');
    },
    ready() { return R.state.sel != null; },
    evaluate() { return { ratio: R.state.sel === R.def.answer ? 1 : 0 }; },
    reveal(full) {
      const s = R.state.sel;
      $$('.opt').forEach((b) => { b.disabled = true; b.classList.remove('sel'); });
      if (s != null && s !== R.def.answer) $(`.opt[data-i="${s}"]`).classList.add('wrong');
      if (R.firstWrong != null) $(`.opt[data-i="${R.firstWrong}"]`).classList.add('wrong');
      if (full) $(`.opt[data-i="${R.def.answer}"]`).classList.add('right');
    },
    unlockForSteal() {
      R.firstWrong = R.state.sel;
      R.state.sel = null;
      $$('.opt').forEach((b) => {
        const i = +b.dataset.i;
        if (i !== R.firstWrong && !b.classList.contains('gone')) { b.disabled = false; b.classList.remove('wrong'); }
      });
    },
  };

  /* --- Сәйкестендіру --- */
  Handlers.match = {
    init(def, s) {
      s.perm = shuffle(def.right.map((_, i) => i));
      if (s.perm.every((v, i) => v === i)) s.perm.reverse();
      s.pairs = {}; // leftIdx -> rightIdx (бастапқы индекс)
      s.selL = null; s.selR = null;
    },
    draw() {
      const def = R.def, s = R.state;
      $('#tbody').innerHTML = `<p class="question">${def.q}</p>
        <div class="match" id="match"><svg class="lines" id="mlines"></svg>
          <div class="mcol left">${def.left.map((l, i) => `<button class="mitem" data-l="${i}"><span class="tag"></span><span>${l}</span></button>`).join('')}</div>
          <div class="mcol right">${s.perm.map((r) => `<button class="mitem" data-r="${r}"><span class="tag"></span><span>${def.right[r]}</span></button>`).join('')}</div>
        </div>`;
      $$('.mitem[data-l]').forEach((b) => (b.onclick = () => this.clickL(+b.dataset.l)));
      $$('.mitem[data-r]').forEach((b) => (b.onclick = () => this.clickR(+b.dataset.r)));
      $('#hintTxt').textContent = 'Сол жақтағы ұғымды, содан кейін оң жақтағы сипаттаманы басыңыз. Жұпты өшіру үшін қайта басыңыз.';
      this.paint();
      this._rs = () => this.lines();
      window.addEventListener('resize', this._rs);
    },
    clickL(l) {
      if (R.phase !== 'answer') return;
      const s = R.state;
      if (s.pairs[l] != null && s.selR == null) { delete s.pairs[l]; s.selL = null; A.play('click'); return this.paint(); }
      if (s.selR != null) { this.link(l, s.selR); return; }
      s.selL = s.selL === l ? null : l;
      A.play('select');
      this.paint();
    },
    clickR(r) {
      if (R.phase !== 'answer') return;
      const s = R.state;
      const owner = Object.keys(s.pairs).find((k) => s.pairs[k] === r);
      if (owner != null && s.selL == null) { delete s.pairs[owner]; A.play('click'); return this.paint(); }
      if (s.selL != null) { this.link(s.selL, r); return; }
      s.selR = s.selR === r ? null : r;
      A.play('select');
      this.paint();
    },
    link(l, r) {
      const s = R.state;
      Object.keys(s.pairs).forEach((k) => { if (s.pairs[k] === r) delete s.pairs[k]; });
      s.pairs[l] = r;
      s.selL = s.selR = null;
      A.play('select');
      this.paint();
    },
    paint() {
      const s = R.state;
      const order = Object.keys(s.pairs).map(Number).sort((a, b) => a - b);
      $$('.mitem[data-l]').forEach((b) => {
        const l = +b.dataset.l, idx = order.indexOf(l);
        b.classList.toggle('sel', s.selL === l);
        const tag = b.querySelector('.tag');
        tag.style.background = idx >= 0 ? PAIR_COLORS[l % PAIR_COLORS.length] : '';
        tag.textContent = idx >= 0 ? l + 1 : '';
      });
      $$('.mitem[data-r]').forEach((b) => {
        const r = +b.dataset.r, owner = Object.keys(s.pairs).find((k) => s.pairs[k] === r);
        b.classList.toggle('sel', s.selR === r);
        const tag = b.querySelector('.tag');
        tag.style.background = owner != null ? PAIR_COLORS[owner % PAIR_COLORS.length] : '';
        tag.textContent = owner != null ? +owner + 1 : '';
      });
      this.lines();
    },
    lines(statusMap) {
      const box = $('#match'), svgEl = $('#mlines');
      if (!box || !svgEl) return;
      const br = box.getBoundingClientRect();
      let h = '';
      Object.keys(R.state.pairs).forEach((l) => {
        const a = $(`.mitem[data-l="${l}"]`), b = $(`.mitem[data-r="${R.state.pairs[l]}"]`);
        if (!a || !b) return;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const x1 = ra.right - br.left, y1 = ra.top + ra.height / 2 - br.top, x2 = rb.left - br.left, y2 = rb.top + rb.height / 2 - br.top;
        const col = statusMap ? (statusMap[l] ? '#3fbf7f' : '#e2574c') : PAIR_COLORS[l % PAIR_COLORS.length];
        h += `<path d="M${x1} ${y1} C${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}" stroke="${col}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
          `<circle cx="${x1}" cy="${y1}" r="6" fill="${col}"/><circle cx="${x2}" cy="${y2}" r="6" fill="${col}"/>`;
      });
      svgEl.innerHTML = h;
    },
    ready() { return Object.keys(R.state.pairs).length > 0; },
    notReady: 'Кем дегенде бір жұп құрыңыз',
    evaluate() {
      const n = R.def.left.length;
      let ok = 0;
      for (let i = 0; i < n; i++) if (R.state.pairs[i] === i) ok++;
      return { ratio: ok / n };
    },
    reveal() {
      const s = R.state, status = {};
      $$('.mitem').forEach((b) => (b.disabled = true));
      R.def.left.forEach((_, l) => {
        const b = $(`.mitem[data-l="${l}"]`), ok = s.pairs[l] === l;
        status[l] = ok;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) b.querySelector('span:last-child').insertAdjacentHTML('beforeend', `<span class="fix">→ ${R.def.right[l]}</span>`);
      });
      $$('.mitem[data-r]').forEach((b) => { const r = +b.dataset.r; const owner = Object.keys(s.pairs).find((k) => s.pairs[k] === r); if (owner != null) b.classList.add(+owner === r ? 'right' : 'wrong'); });
      setTimeout(() => this.lines(status), 30);
      window.removeEventListener('resize', this._rs);
    },
  };

  /* --- Топтастыру --- */
  Handlers.category = {
    init(def, s) { s.order = shuffle(def.items.map((_, i) => i)); s.where = {}; s.sel = null; },
    draw() {
      const def = R.def;
      $('#tbody').innerHTML = `<p class="question">${def.q}</p><div id="catzone"></div>`;
      $('#hintTxt').textContent = 'Карточканы басып, содан кейін тиісті себетті басыңыз (немесе сүйреп апарыңыз).';
      this.paint();
    },
    paint(reveal) {
      const def = R.def, s = R.state;
      const card = (i) => {
        const [txt, ans] = def.items[i];
        let cls = s.sel === i ? 'sel' : '';
        let extra = '';
        if (reveal) { cls = s.where[i] === ans ? 'right' : 'wrong'; if (s.where[i] !== ans) extra = `<br><small>→ ${def.baskets[ans]}</small>`; }
        return `<button class="card ${cls}" draggable="${!reveal}" data-c="${i}" ${reveal ? 'disabled' : ''}>${txt}${extra}</button>`;
      };
      const pool = s.order.filter((i) => s.where[i] == null);
      const missing = reveal ? pool.map((i) => card(i)).join('') : '';
      $('#catzone').innerHTML =
        `<div class="cat-pool" id="pool">${reveal ? missing : pool.map(card).join('')}</div>` +
        `<div class="baskets">${def.baskets.map((b, k) => `<div class="basket" data-b="${k}" role="button" tabindex="0"><h4>${['📘', '📙', '📗'][k] || '📦'} ${b}</h4><div class="bitems">${s.order.filter((i) => s.where[i] === k).map(card).join('')}</div></div>`).join('')}</div>`;
      if (reveal) return;
      $$('#catzone .card').forEach((c) => {
        const i = +c.dataset.c;
        c.onclick = (e) => {
          e.stopPropagation();
          if (R.phase !== 'answer') return;
          if (s.where[i] != null) { delete s.where[i]; s.sel = null; A.play('click'); }
          else { s.sel = s.sel === i ? null : i; A.play('select'); }
          this.paint();
        };
        c.ondragstart = (e) => { e.dataTransfer.setData('text/plain', i); s.sel = i; };
      });
      $$('#catzone .basket').forEach((b) => {
        const k = +b.dataset.b;
        const put = (i) => { if (i == null || R.phase !== 'answer') return; s.where[i] = k; s.sel = null; A.play('select'); this.paint(); };
        b.onclick = () => put(s.sel);
        b.ondragover = (e) => { e.preventDefault(); b.classList.add('hot'); };
        b.ondragleave = () => b.classList.remove('hot');
        b.ondrop = (e) => { e.preventDefault(); put(+e.dataTransfer.getData('text/plain')); };
        if (s.sel != null) b.classList.add('hot');
      });
    },
    ready() { return Object.keys(R.state.where).length > 0; },
    notReady: 'Кем дегенде бір карточканы себетке салыңыз',
    evaluate() {
      const n = R.def.items.length;
      let ok = 0;
      R.def.items.forEach(([, ans], i) => { if (R.state.where[i] === ans) ok++; });
      return { ratio: ok / n };
    },
    reveal() { this.paint(true); },
  };

  /* --- Реттеу --- */
  Handlers.order = {
    init(def, s) {
      do s.arr = shuffle(def.items.map((_, i) => i)); while (s.arr.every((v, i) => v === i));
    },
    draw() {
      $('#tbody').innerHTML = `<p class="question">${R.def.q}</p><div class="order" id="olist"></div>`;
      $('#hintTxt').textContent = '▲ / ▼ батырмаларымен қадамдарды жылжытыңыз.';
      this.paint();
    },
    paint(reveal) {
      const s = R.state, def = R.def;
      $('#olist').innerHTML = s.arr.map((it, pos) => {
        const cls = reveal ? (it === pos ? 'right' : 'wrong') : '';
        const fix = reveal && it !== pos ? `<small style="color:#ffd27a"> · дұрыс орны: ${it + 1}</small>` : '';
        return `<div class="oitem ${cls}"><span class="n">${pos + 1}</span><span class="txt">${def.items[it]}${fix}</span>` +
          (reveal ? '' : `<span class="arr"><button data-up="${pos}" ${pos === 0 ? 'disabled' : ''} aria-label="Жоғары">▲</button><button data-dn="${pos}" ${pos === s.arr.length - 1 ? 'disabled' : ''} aria-label="Төмен">▼</button></span>`) + '</div>';
      }).join('');
      $$('[data-up]').forEach((b) => (b.onclick = () => this.swap(+b.dataset.up, -1)));
      $$('[data-dn]').forEach((b) => (b.onclick = () => this.swap(+b.dataset.dn, 1)));
    },
    swap(p, d) {
      if (R.phase !== 'answer') return;
      const a = R.state.arr;
      [a[p], a[p + d]] = [a[p + d], a[p]];
      A.play('select');
      this.paint();
    },
    evaluate() { const a = R.state.arr; return { ratio: a.filter((v, i) => v === i).length / a.length }; },
    reveal() { this.paint(true); },
  };

  /* --- Жасырын сөз --- */
  Handlers.word = {
    init(def, s) {
      const letters = (def.answer + (def.decoys || '')).split('');
      s.tiles = shuffle(letters.map((ch, i) => ({ ch, id: i })));
      s.slots = def.answer.split('').map(() => null); // tile id
      s.locked = def.answer.split('').map(() => false);
    },
    draw() {
      const def = R.def;
      $('#tbody').innerHTML = `<div class="word-wrap">
        <div class="clue"><span class="q-ico">🔎</span><span>${def.clue}</span></div>
        <div class="slots" id="slots"></div>
        <div class="tiles" id="tiles"></div>
        <div class="row center"><button class="btn ghost sm" id="bClear">↺ Тазалау</button><button class="btn ghost sm" id="bHint">💡 Кеңес (−25% ұпай)</button></div>
      </div>`;
      $('#hintTxt').textContent = `Сөз ${def.answer.length} әріптен тұрады. Әріптерді ретімен басыңыз; артықтары да бар!`;
      $('#bClear').onclick = () => { if (!this.can()) return; R.state.slots = R.state.slots.map((v, i) => (R.state.locked[i] ? v : null)); A.play('click'); this.paint(); };
      $('#bHint').onclick = () => this.hint();
      this.paint();
    },
    can() { return R.phase === 'answer' || R.phase === 'steal'; },
    paint(reveal) {
      const s = R.state, def = R.def;
      const used = new Set(s.slots.filter((v) => v != null));
      $('#slots').innerHTML = s.slots.map((id, i) => {
        let ch = id != null ? s.tiles.find((t) => t.id === id).ch : '';
        let cls = id != null ? 'filled' : '';
        if (s.locked[i]) cls += ' hint';
        if (reveal === 'right') { cls = 'right'; ch = def.answer[i]; }
        if (reveal === 'wrong') { cls = 'wrong'; }
        if (reveal === 'show') { cls = 'right'; ch = def.answer[i]; }
        return `<button class="slot ${cls}" data-s="${i}">${ch}</button>`;
      }).join('');
      $('#tiles').innerHTML = s.tiles.map((t) => `<button class="tile ${used.has(t.id) ? 'used' : ''}" data-t="${t.id}" ${reveal ? 'disabled' : ''}>${t.ch}</button>`).join('');
      if (reveal) return;
      $$('.tile').forEach((b) => (b.onclick = () => {
        if (!this.can()) return;
        const k = s.slots.indexOf(null);
        if (k < 0) return;
        s.slots[k] = +b.dataset.t;
        A.play('select');
        this.paint();
      }));
      $$('.slot').forEach((b) => (b.onclick = () => {
        if (!this.can()) return;
        const i = +b.dataset.s;
        if (s.locked[i] || s.slots[i] == null) return;
        s.slots[i] = null;
        A.play('click');
        this.paint();
      }));
    },
    hint() {
      if (!this.can()) return;
      const s = R.state, ans = R.def.answer;
      const i = s.locked.findIndex((l, k) => !l && !(s.slots[k] != null && s.tiles.find((t) => t.id === s.slots[k]).ch === ans[k]));
      if (i < 0) return toast('Барлық әріп орнында сияқты!');
      // қажетті әріпті бос плиткалардан табу (немесе басқа ұяшықтан алу)
      let tile = s.tiles.find((t) => t.ch === ans[i] && !s.slots.includes(t.id));
      if (!tile) {
        const k = s.slots.findIndex((id, kk) => !s.locked[kk] && id != null && s.tiles.find((t) => t.id === id).ch === ans[i]);
        tile = s.tiles.find((t) => t.id === s.slots[k]);
        s.slots[k] = null;
      }
      s.slots[i] = tile.id;
      s.locked[i] = true;
      if (R.phase === 'answer') R.hint++;
      A.play('joker');
      this.paint();
    },
    ready() { return R.state.slots.every((v) => v != null); },
    notReady: 'Барлық ұяшықты толтырыңыз',
    word() { return R.state.slots.map((id) => (id == null ? '_' : R.state.tiles.find((t) => t.id === id).ch)).join(''); },
    evaluate() { return { ratio: this.word() === R.def.answer ? 1 : 0 }; },
    reveal(full) {
      const ok = this.word() === R.def.answer;
      this.paint(ok ? 'right' : full ? 'show' : 'wrong');
      $('#bClear').disabled = $('#bHint').disabled = true;
    },
    unlockForSteal() {
      const s = R.state;
      s.slots = s.slots.map((v, i) => (s.locked[i] ? v : null));
      this.paint();
      $('#bClear').disabled = $('#bHint').disabled = false;
    },
  };

  /* --- Суреттен табу --- */
  Handlers.hotspot = {
    init(def, s) { s.found = []; s.miss = 0; },
    draw() {
      const def = R.def, keys = Object.keys(def.targets);
      $('#tbody').innerHTML = `<p class="question">${def.q}</p><div class="hotspot" id="hs">${def.scene()}</div><div class="hs-status" id="hsStatus"></div>`;
      $('#hintTxt').textContent = 'Барлық 5 рәмізді тапқанда миссия автоматты түрде аяқталады.';
      $('#primary').textContent = 'Аяқтау ✓';
      $$('#hs .hs-target').forEach((g) => (g.onclick = () => this.hit(g)));
      $$('#hs .hs-decoy').forEach((g) => (g.onclick = () => this.miss(g)));
      this.status(keys);
    },
    status(keys, reveal) {
      const s = R.state, def = R.def;
      $('#hsStatus').innerHTML = keys.map((k, i) => {
        const f = s.found.includes(k);
        return `<span class="hs-chip ${f ? 'on' : reveal ? 'miss' : ''}">${f || reveal ? (f ? '✓ ' : '◌ ') + def.targets[k] : '❓ Рәміз ' + (i + 1)}</span>`;
      }).join('') + `<span class="hs-chip" style="border-style:solid">Қате басу: ${s.miss}</span>`;
    },
    label(g, txt) {
      const bb = g.getBBox();
      const svgEl = g.ownerSVGElement;
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', bb.x + bb.width / 2);
      t.setAttribute('y', Math.max(18, bb.y - 6));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'hs-label');
      t.textContent = txt;
      svgEl.appendChild(t);
    },
    hit(g) {
      if (R.phase !== 'answer') return;
      const id = g.dataset.id, s = R.state;
      if (s.found.includes(id)) return;
      s.found.push(id);
      g.classList.add('found');
      this.label(g, '✓ ' + R.def.targets[id]);
      A.play('correct');
      this.status(Object.keys(R.def.targets));
      if (s.found.length === Object.keys(R.def.targets).length) setTimeout(() => submit(false), 600);
    },
    miss(g) {
      if (R.phase !== 'answer') return;
      R.state.miss++;
      g.classList.remove('miss');
      void g.getBBox();
      g.classList.add('miss');
      A.play('wrong');
      toast(`✗ «${R.def.decoys[g.dataset.id]}» — мәдениет рәмізі емес (−10)`);
      this.status(Object.keys(R.def.targets));
    },
    evaluate() {
      const n = Object.keys(R.def.targets).length;
      return { ratio: R.state.found.length / n, penalty: R.state.miss * 10 };
    },
    reveal() {
      const keys = Object.keys(R.def.targets);
      $$('#hs .hs-target').forEach((g) => { if (!R.state.found.includes(g.dataset.id)) { g.classList.add('missed'); this.label(g, '◌ ' + R.def.targets[g.dataset.id]); } });
      $$('#hs g').forEach((g) => (g.onclick = null));
      this.status(keys, true);
    },
  };

  /* ================== Шапшаң сайыс ================== */
  let blitzSelect = null; // пернетақтадан 1–4 үшін
  function showBlitz() {
    G.phase = 'blitz';
    save();
    const st = D.stages[G.stage], q = st.blitz[G.blitz];
    S3.go('task', G.stage);
    renderHud();
    const pts = blitzPts();
    const ans = G.teams.map(() => null); // әр команданың таңдаған нұсқасы
    let focus = 0, revealed = false;
    view(
      panel(`<div class="task-view">
        <div class="blitz-head">${Timer.html()}<span class="bolt">⚡</span>
          <div class="flex1"><div class="stage-no">${G.stage + 1}-КЕЗЕҢ · ШАПШАҢ САЙЫС · ${G.blitz + 1}/${st.blitz.length}</div><h2 class="gold-text">Барлық командалар жауап береді!</h2>
          <div class="muted" style="font-size:.85em">Командалар A/B/C/D карточкасын көтереді, жүргізуші әр команданың жауабын белгілейді · дұрыс жауап үшін +${pts} ұпай</div></div>
          <button class="icon-btn" id="bPause" title="Үзіліс (P)">⏸</button></div>
        <div class="task-body" id="tbody">
          <p class="blitz-q">${q.q}</p>
          <div class="options ${q.options.length === 2 ? 'tf' : ''}">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${LETTERS[i]}</span><span>${o}</span><span class="who-picked" data-w="${i}"></span></button>`).join('')}</div>
          <div class="blitz-teams" id="bteams"></div>
          <div id="bres"></div>
        </div>
        <div class="task-foot"><span class="hint-txt" id="hintTxt"></span><div class="row" id="tactions"><button class="btn" id="primary">Жауапты ашу 👁</button></div></div>
      </div>`)
    );

    const paint = () => {
      const n = G.teams.length;
      $('#hintTxt').textContent = revealed ? '' : n > 1
        ? `Нұсқаны бассаңыз — ол жарқыраған командаға жазылады (кезекпен ауысады). Пернетақта: 1–${q.options.length}.`
        : 'Нұсқаны таңдап, «Жауапты ашу» батырмасын басыңыз.';
      $('#bteams').innerHTML = `<h4>${revealed ? 'Командалардың жауаптары:' : 'Командалардың жауаптары (команданы басып, жауабын өзгертуге болады):'}</h4><div class="row">` +
        G.teams.map((t, i) => {
          const a = ans[i], ok = revealed && a === q.answer, bad = revealed && a !== q.answer;
          return `<button class="team-pick ${!revealed && i === focus ? 'focus' : ''} ${ok ? 'on' : ''} ${bad ? 'off' : ''}" data-t="${i}" ${revealed ? 'disabled' : ''}>${emb(t)}${esc(t.name)}` +
            `<span class="ans-badge">${a == null ? '—' : LETTERS[a]}</span>${revealed ? `<span class="ans-res">${ok ? '+' + pts : '✗'}</span>` : ''}</button>`;
        }).join('') + '</div>';
      $$('#bteams .team-pick').forEach((b) => (b.onclick = () => { focus = +b.dataset.t; A.play('click'); paint(); }));
      $$('.who-picked').forEach((el) => {
        const i = +el.dataset.w;
        el.innerHTML = G.teams.map((t, k) => (ans[k] === i ? `<i style="background:${t.color}" title="${esc(t.name)}">${t.emoji}</i>` : '')).join('');
      });
      $$('.opt').forEach((b) => b.classList.toggle('sel', !revealed && ans[focus] === +b.dataset.i));
    };

    blitzSelect = (i) => {
      if (revealed || i >= q.options.length) return;
      ans[focus] = i;
      A.play('select');
      // келесі жауапсыз командаға өту
      const n = G.teams.length;
      for (let k = 1; k <= n; k++) { const j = (focus + k) % n; if (ans[j] == null) { focus = j; break; } }
      paint();
    };

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      blitzSelect = null;
      Timer.stop();
      $$('.opt').forEach((b) => (b.disabled = true));
      $(`.opt[data-i="${q.answer}"]`).classList.add('right');
      $$('.opt').forEach((b) => { const i = +b.dataset.i; if (i !== q.answer && ans.includes(i)) b.classList.add('wrong'); });
      let any = false;
      G.teams.forEach((t, i) => {
        t.attempts++;
        if (ans[i] === q.answer) { t.correct++; award(i, pts); any = true; }
      });
      A.play(any ? 'correct' : 'wrong');
      paint();
      $('#bres').innerHTML = `<div class="feedback ok" style="grid-template-columns:auto 1fr"><div class="fb-icon">${LETTERS[q.answer]}</div><div><div class="fb-title">Дұрыс жауап: ${q.options[q.answer]}</div><div class="fb-text">${q.explain}</div></div></div>`;
      const last = G.blitz >= st.blitz.length - 1;
      $('#tactions').innerHTML = `<button class="btn" id="primary">${last ? 'Кезең қорытындысы →' : 'Келесі сұрақ →'}</button>`;
      $('#primary').onclick = () => { A.play('click'); G.blitz++; save(); G.blitz < st.blitz.length ? showBlitz() : finishStage(); };
      setTimeout(() => { const f = $('#bres'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
    };

    $$('.opt').forEach((b) => (b.onclick = () => blitzSelect && blitzSelect(+b.dataset.i)));
    $('#primary').onclick = () => {
      const missing = ans.filter((a) => a == null).length;
      if (missing && !confirm(`${missing} команданың жауабы белгіленбеді. Жауапты ашу керек пе? (белгіленбеген = қате)`)) return;
      reveal();
    };
    $('#bPause').onclick = pause;
    paint();
    Timer.start(speed() ? Math.round(25 * speed()) : 0, () => toast('⌛ Уақыт бітті! Жауаптарды белгілеп, «Жауапты ашу» басыңыз', 3500));
  }

  /* ================== Кезең қорытындысы ================== */
  function finishStage() {
    G.done = Math.max(G.done, G.stage + 1);
    G.phase = 'results';
    save();
    showStageResults();
  }

  function showStageResults() {
    const si = G.stage, st = D.stages[si];
    crumbs();
    renderHud();
    S3.setProgress(G.done, -1);
    S3.go('stage', si);
    A.play('fanfare');
    S3.burst();
    const sorted = G.teams.map((t, i) => ({ t, i })).sort((a, b) => b.t.score - a.t.score);
    const max = Math.max(1, ...G.teams.map((t) => t.score));
    const last = si >= D.stages.length - 1;
    view(
      panel(`<div class="results">
        <div class="stage-no center" style="display:block;text-align:center">${si + 1}-КЕЗЕҢ АЯҚТАЛДЫ</div>
        <h2 class="gold-text">«${st.name}» бекетінен өттіңдер!</h2>
        <p class="muted center" style="text-align:center;margin:4px 0 0">Түйін: ${st.intro.lead}</p>
        <div class="res-list">${sorted.map(({ t }, k) => `<div class="res-row" style="animation-delay:${k * 0.1}s"><div class="place">${['🥇', '🥈', '🥉'][k] || k + 1}</div>${emb(t)}<div class="name">${esc(t.name)}<small>Осы кезеңде: ${t.stage[si] >= 0 ? '+' : ''}${t.stage[si]}</small></div><div class="bar"><i data-w="${Math.max(2, (t.score / max) * 100)}"></i></div><div class="score">${t.score}<small>ұпай</small></div></div>`).join('')}</div>
        <div class="row center"><button class="btn big" id="primary">${last ? '🏆 Жеңіс тұғырына!' : `Келесі кезеңге өту → ${si + 2}. «${D.stages[si + 1].name}»`}</button></div>
      </div>`)
    );
    requestAnimationFrame(() => setTimeout(() => $$('.bar i').forEach((b) => (b.style.width = b.dataset.w + '%')), 50));
    $('#primary').onclick = () => {
      A.play('click');
      if (last) { showVictory(); return; }
      G.stage++;
      G.task = 0;
      G.blitz = 0;
      G.phase = 'map';
      save();
      showMap();
    };
  }

  /* ================== Жеңіс ================== */
  function rankTitle(t) {
    const p = t.attempts ? t.correct / t.attempts : 0;
    if (p >= 0.85) return 'Дана би';
    if (p >= 0.65) return 'Мәдениет батыры';
    if (p >= 0.45) return 'Сардар';
    return 'Талапты шәкірт';
  }
  function showVictory() {
    G.phase = 'victory';
    S3.setProgress(5, -1);
    S3.go('victory');
    S3.victory(true);
    A.play('fanfare');
    setTimeout(() => A.play('fanfare'), 1400);
    crumbs();
    renderHud();
    const sorted = G.teams.map((t, i) => ({ t, i })).sort((a, b) => b.t.score - a.t.score);
    const podOrder = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
    const cls = (o) => 'p' + (sorted.indexOf(o) + 1);
    const medal = ['🥇', '🥈', '🥉'];
    view(
      `<div class="victory">
        <div class="stage-no">САЯХАТ АЯҚТАЛДЫ</div>
        <h1 class="gold-text">Жеңіс! «${esc(sorted[0].t.name)}» командасы!</h1>
        <p class="muted" style="margin:0">Бес бекеттен өтіп, ұйымдық мәдениеттің бес элементін меңгердіңдер.</p>
        <div class="podium">${podOrder.map((o) => `<div class="pod ${cls(o)}">${emb(o.t)}<div class="pname">${esc(o.t.name)}</div><div class="ptitle">${rankTitle(o.t)}</div><div class="block"><span class="medal">${medal[sorted.indexOf(o)]}</span><span class="pts">${o.t.score}</span></div></div>`).join('')}</div>
        ${panel(`<table class="v-table"><thead><tr><th>Орын</th><th>Команда</th><th>Атақ</th><th style="text-align:right">Дұрыс жауап</th><th style="text-align:right">Дәлдік</th><th style="text-align:right">Ұпай</th></tr></thead><tbody>
          ${sorted.map(({ t }, k) => `<tr><td>${medal[k] || k + 1}</td><td><b>${t.emoji} ${esc(t.name)}</b></td><td>${rankTitle(t)}</td><td class="num">${t.correct}/${t.attempts}</td><td class="num">${t.attempts ? Math.round((t.correct / t.attempts) * 100) : 0}%</td><td class="num">${t.score}</td></tr>`).join('')}
        </tbody></table>
        <div class="stage-no" style="margin-bottom:8px">🧭 ҰЙЫМДЫҚ МӘДЕНИЕТТІҢ 5 ЭЛЕМЕНТІ — ЕСТЕ САҚТА</div>
        <div class="takeaways">${D.stages.map((s) => `<div><i>${O.ICONS[s.icon](s.color)}</i><b>${s.element}</b><br>${s.intro.wisdom.title.replace('Дала даналығы: ', '')}</div>`).join('')}</div>
        <div class="row center"><button class="btn big" id="bAgain">↻ Қайта ойнау</button><button class="btn ghost big" id="bHome">⌂ Басты бет</button></div>`)}
      </div>`,
      { full: true }
    );
    hud.innerHTML = '';
    clearSave();
    $('#bAgain').onclick = () => {
      S3.victory(false);
      newGame(G.teams.map((t) => ({ name: t.name, emoji: t.emoji, color: t.color })), G.settings);
      showMap();
    };
    $('#bHome').onclick = () => { S3.victory(false); showTitle(); };
  }

  /* ================== Модальдар ================== */
  let onModalClose = null;
  function openModal(html, onClose) {
    modal.innerHTML = panel(html);
    modal.classList.add('open');
    onModalClose = onClose || null;
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.innerHTML = '';
    const f = onModalClose;
    onModalClose = null;
    f && f();
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  function showRules() {
    openModal(`<h2 class="gold-text">📜 Ойын ережесі</h2>
      <div class="rules-grid">
        <div><h4>🎯 Мақсат</h4><p>Бес киіз үй-бекеттен өтіп, ұйымдық мәдениеттің 5 элементін (құндылықтар, нормалар, рәміздер, дәстүрлер, қарым-қатынас) меңгеру және ең көп ұпай жинау.</p></div>
        <div><h4>👥 Командалар</h4><p>1–6 команда. Миссиялар кезекпен беріледі: кезектегі команда ақылдасып, жауабын жүргізушіге айтады.</p></div>
        <div><h4>🧩 Миссия түрлері</h4><p>Логикалық сұрақ, жағдаят, сурет арқылы табу, сәйкестендіру, топтастыру, ретін табу, жасырын сөз, суреттен рәміз іздеу.</p></div>
        <div><h4>🏅 Ұпай</h4><p>Дұрыс жауап: 100 (1-кезең) → 200 (5-кезең) + қалған секундтар бонусы. Жартылай дұрыс жауапқа жартылай ұпай беріледі.</p></div>
        <div><h4>🧓⏳🔥 Жәрдемшілер</h4><p>Әр команда ойын бойы әрқайсысын бір рет қолдана алады: Ақсақал кеңесі (2 қате жауап жойылады), Құмсағат (+20 сек), Тәуекел (×2 немесе айып).</p></div>
        <div><h4>🎯 Ұрлау</h4><p>Кезектегі команда қателессе, бірінші қол көтерген басқа команда жауап беріп, жарты ұпайды ала алады.</p></div>
        <div><h4>⚡ Шапшаң сайыс</h4><p>Әр кезең соңында 3 сұрақ — барлық командалар бір мезетте жауап береді. Жүргізуші дұрыс жауап бергендерді белгілейді.</p></div>
        <div><h4>🎙 Жүргізушіге</h4><p><b>F</b> — толық экран, <b>P</b> — үзіліс, <b>1–4</b> — нұсқа таңдау, <b>Enter</b> — негізгі батырма, <b>M</b> — дыбыс. ⚙ панелінде ұпайды түзетуге, кезекті ауыстыруға, миссияны өткізуге болады. Прогресс автоматты сақталады.</p></div>
      </div>
      <div class="row center" style="margin-top:18px"><button class="btn" id="bCloseM">Түсінікті!</button><a class="btn ghost" href="answers.html" target="_blank" rel="noopener" style="text-decoration:none">📋 Жауаптар кілті (жүргізушіге)</a></div>`);
    $('#bCloseM').onclick = closeModal;
  }

  function showHost() {
    if (!G) { showRules(); return; }
    const wasPaused = Timer.paused;
    Timer.paused = true;
    const canSwitch = R && R.phase === 'answer';
    const render = () => {
      openModal(`<h2 class="gold-text">⚙ Жүргізуші панелі</h2>
        <p class="muted" style="margin-top:0">Ұпайды қолмен түзету (мысалы, жақсы түсіндірме немесе тәртіп үшін).${canSwitch ? ' Команда атауын бассаңыз — кезек соған ауысады.' : ''}</p>
        ${G.teams.map((t, i) => `<div class="host-team">${emb(t)}<span class="nm" ${canSwitch ? `data-sw="${i}" style="cursor:pointer;text-decoration:underline dotted"` : ''}>${esc(t.name)}</span>
          <button data-a="${i}" data-v="-50">−50</button><button data-a="${i}" data-v="-10">−10</button><button data-a="${i}" data-v="10">+10</button><button data-a="${i}" data-v="50">+50</button><span class="sc">${t.score}</span></div>`).join('')}
        <div class="row" style="margin-top:18px">
          ${R && R.phase !== 'done' ? '<button class="btn ghost sm" id="hSkip">⏭ Миссияны өткізу</button>' : ''}
          ${G.phase !== 'victory' ? '<button class="btn ghost sm" id="hMap">🗺 Картаға оралу</button>' : ''}
          <a class="btn ghost sm" href="answers.html#s${G.stage}" target="_blank" rel="noopener" style="text-decoration:none">📋 Жауаптар кілті</a>
          <button class="btn red sm" id="hNew">⟲ Жаңа ойын</button>
          <span style="flex:1"></span><button class="btn sm" id="hClose">Жабу</button>
        </div>`, () => { Timer.paused = wasPaused; Timer.render(); });
      $$('[data-a]').forEach((b) => (b.onclick = () => {
        award(+b.dataset.a, +b.dataset.v, { active: R && R.phase !== 'done' ? (R.phase === 'steal' ? R.steal : R.teamIdx) : -1 });
        save();
        render();
      }));
      $$('[data-sw]').forEach((el) => (el.onclick = () => {
        R.teamIdx = +el.dataset.sw;
        G.active = R.teamIdx;
        const t = G.teams[R.teamIdx];
        $('#turn').innerHTML = `${emb(t)}<div><small>Кезектегі команда</small>${esc(t.name)}</div>`;
        const j = t.jokers, def = R.def, fiftyOk = (def.type === 'choice' || def.type === 'imagechoice') && def.options.length > 2;
        const jb = (k) => $(`.joker[data-j="${k}"]`);
        if (!R.risk) { jb('fifty').disabled = !j.fifty || !fiftyOk; jb('time').disabled = !j.time || !speed(); jb('risk').disabled = !j.risk; }
        renderHud(R.teamIdx);
        save();
        toast(`Кезек «${t.name}» командасына берілді`);
        closeModal();
      }));
      const sk = $('#hSkip');
      if (sk) sk.onclick = () => { onModalClose = null; closeModal(); Timer.stop(); R.phase = 'done'; nextTask(); };
      const hm = $('#hMap');
      if (hm) hm.onclick = () => { onModalClose = null; closeModal(); Timer.stop(); R = null; showMap(); };
      $('#hNew').onclick = () => {
        if (!confirm('Ойынды басынан бастау керек пе? Ағымдағы ұпайлар өшіріледі.')) return;
        onModalClose = null; closeModal(); Timer.stop(); R = null; clearSave(); S3.victory(false); showTitle();
      };
      $('#hClose').onclick = closeModal;
    };
    render();
  }

  /* ================== Жоғарғы батырмалар мен пернетақта ================== */
  function toggleFull() {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    } catch (e) {}
  }
  function syncSound() { $('#btnSound').textContent = A.muted ? '🔇' : '🔊'; }
  $('#btnFull').onclick = toggleFull;
  $('#btnSound').onclick = () => { A.toggle(); syncSound(); A.play('click'); };
  $('#btnRules').onclick = showRules;
  $('#btnHost').onclick = showHost;
  $('#brandLogo').innerHTML = O.shanyrak('#e8b04a', 8);
  syncSound();

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (k === 'escape' && modal.classList.contains('open')) return closeModal();
    if (modal.classList.contains('open')) return;
    if (k === 'f' || k === 'а') toggleFull();
    else if (k === 'm' || k === 'ь') { A.toggle(); syncSound(); }
    else if ((k === 'p' || k === 'з') && R && R.phase !== 'done' && $('#bPause')) pause();
    else if (/^[1-6]$/.test(e.key) && R && R.def && Handlers[R.def.type].select) Handlers[R.def.type].select(+e.key - 1);
    else if (/^[1-6]$/.test(e.key) && G && G.phase === 'blitz' && blitzSelect) blitzSelect(+e.key - 1);
    else if (k === 'enter') { const p = $('#primary'); if (p && document.activeElement !== p) { e.preventDefault(); p.click(); } }
  });
  document.addEventListener('pointerdown', () => A.unlock(), { once: true });

  /* ================== Іске қосу ================== */
  const ok = S3.init ? S3.init($('#bg3d')) : false;
  if (!ok) document.body.classList.add('no-webgl');
  if (!ok) { S3.go = () => {}; S3.setProgress = () => {}; S3.victory = () => {}; S3.burst = () => {}; }
  showTitle();

  // тест үшін
  window.__game = { get G() { return G; }, get R() { return R; }, Handlers, Timer, get blitzSelect() { return blitzSelect; }, submit, showVictory, showStageResults, showBlitz, startTask, showMap };
})();
