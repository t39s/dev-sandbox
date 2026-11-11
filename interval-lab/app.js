(() => {
  'use strict';
  const M = window.IntervalModel;
  const $ = id => document.getElementById(id);
  const storage = { version: 4, target: 10, mode: M.MODE_INTERVALS, athletes: [M.defaultAthlete()], selectedAthleteId: M.DEFAULT_ATHLETE_ID, sessions: [], archived: [], incomplete: [] };
  let activeId = null, viewingId = null, baselineId = null;
  let currentView = 'capture', run = null, frameId = null, wakeLock = null;
  const MAX_CONFIGURED_TAP_GAP_MS = 60000;
  let minTapGapMs = null;
  let intervalCount = null;
  let configurationState = 'loading';
  const TAP_FLASH_MS = 150;
  const FINAL_DISPLAY_MS = 650;
  let toastTimer = null, restStart = null, restFrame = null;
  let finishing = null, flashTimer = null;

  const html = {
    capture: $('capture'), review: $('review'), history: $('history'), settings: $('settings'), athletes: $('athletes'), modes: $('modes'),
    tapZone: $('tapZone'), time: $('timeDisplay'), digit: $('intervalDigit'), phase: $('phaseLabel'), state: $('stateLabel'),
    instruction: $('tapInstruction'), progress: $('progressTrack'), count: $('intervalText')
  };

  function parseConfiguration(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config) ||
        !Number.isSafeInteger(config.minTapGapMs) ||
        config.minTapGapMs < 0 || config.minTapGapMs > MAX_CONFIGURED_TAP_GAP_MS) {
      throw new Error('config.json: minTapGapMs должен быть целым числом от 0 до 60000 мс');
    }
    if (!M.validTarget(config.intervalCount)) {
      throw new Error('config.json: intervalCount должен быть целым числом от 1 до 200');
    }
    return { minTapGapMs: config.minTapGapMs, intervalCount: config.intervalCount };
  }
  async function loadConfiguration() {
    try {
      const response = await fetch('./config.json', {cache: 'no-cache'});
      if (!response.ok) throw new Error('config.json: HTTP ' + response.status);
      const configuration = parseConfiguration(await response.json());
      minTapGapMs = configuration.minTapGapMs;
      intervalCount = configuration.intervalCount;
      configurationState = 'ready';
      // Keep the legacy storage schema valid without using it as a settings source.
      // Any pending two-exercise session retains its own target.
      if (storage.target !== intervalCount) {
        storage.target = intervalCount;
        persist();
      }
    } catch (error) {
      minTapGapMs = null;
      intervalCount = null;
      configurationState = 'error';
      console.error('Interval Lab: конфигурация не загружена; измерение заблокировано.', error);
    }
    renderCapture();
  }

  function toast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
  }
  function save() {
    try { localStorage.setItem(M.STORAGE_KEY, JSON.stringify(storage)); return true; }
    catch (error) { toast('Сохранение недоступно. Экспортируйте результаты до закрытия приложения.'); return false; }
  }
  function load() {
    try {
      const raw = localStorage.getItem(M.STORAGE_KEY);
      if (raw) { const parsed = JSON.parse(raw); Object.assign(storage, M.validateStore(parsed));
        if (parsed.version < 4) save(); // v1/v2/v3 → v4, preserving original measurements
      }
    } catch (error) { toast('Не удалось прочитать историю. Старые данные не перезаписаны.');
      // Never overwrite unreadable storage automatically.
      storage.readOnly = true;
    }
  }
  function persist() { if (!storage.readOnly) save(); else toast('Хранилище недоступно: экспортируйте результат вручную.'); }
  function selectedAthlete() { return storage.athletes.find(a => a.id === storage.selectedAthleteId) || storage.athletes[0]; }
  function athleteName(id) { return storage.athletes.find(a => a.id === id)?.name || 'Неизвестный спортсмен'; }
  function pendingFor(id) { return sortedSessions().find(s => s.athleteId === id && s.status === 'pending' && s.exercises.length === 1) || null; }
  function activeSession() { return storage.sessions.find(s => s.id === activeId && s.athleteId === storage.selectedAthleteId && s.status === 'pending') || null; }
  function switchAthlete(id) {
    if (run || finishing) return toast('Переключение доступно только между упражнениями');
    if (!storage.athletes.some(a => a.id === id)) return;
    storage.selectedAthleteId = id; activeId = pendingFor(id)?.id || null; viewingId = null; baselineId = null;
    persist(); show('capture');
  }
  function findSession(id) { return storage.sessions.find(s => s.id === id) || null; }
  function sortedSessions() { return [...storage.sessions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)); }
  function dateLabel(value) { return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
  function sec(ms) { return M.formatSeconds(ms) + ' с'; }
  function signed(ms) { return (ms > 0 ? '+' : ms < 0 ? '−' : '') + M.formatSeconds(Math.abs(ms)) + ' с'; }
  function signedPct(v) { return v === null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%'; }
  function make(tag, cls, text) {
    const el = document.createElement(tag); if (cls) el.className = cls;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }
  function clear(el) { el.replaceChildren(); return el; }
  function action(text, cls, handler) { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', handler); return b; }
  function show(view) {
    currentView = view;
    if (run || finishing) { if (view !== 'capture') return; }
    for (const name of ['capture', 'review', 'history', 'settings', 'athletes', 'modes']) html[name].classList.toggle('hidden', name !== view);
    if (view === 'capture') renderCapture();
    if (view === 'review') renderReview();
    if (view === 'history') renderHistory();
    if (view === 'athletes') renderAthletes();
    if (view === 'modes') renderModes();
    window.scrollTo(0, 0);
  }
  function currentTarget() { return activeSession()?.exercises.length === 1 ? activeSession().target : (intervalCount ?? storage.target); }
  function capturePhase() { return activeSession()?.exercises.length === 1 ? 2 : 1; }
  function renderCapture() {
    const measured = run || finishing;
    const mode = measured?.mode || storage.mode;
    const stopwatch = mode === M.MODE_STOPWATCH;
    const n = measured ? measured.target : currentTarget();
    const phase = measured ? measured.phase : capturePhase();
    const done = measured ? measured.intervals.length : 0;
    html.capture.classList.toggle('running', !!measured);
    html.capture.classList.toggle('mode-stopwatch', stopwatch);
    $('earlyFinishBtn').classList.toggle('hidden', !run || stopwatch);
    $('athleteBtn').textContent = selectedAthlete().name + ' ▾';
    $('modeBtn').setAttribute('title', stopwatch ? 'Старт–Стоп · сменить режим' : 'С отсечками · сменить режим');
    $('modeBtn').setAttribute('aria-label', stopwatch ? 'Сменить режим Старт–Стоп' : 'Сменить режим с отсечками');
    $('modeBtn').textContent = stopwatch ? '◷' : '▥';
    html.phase.textContent = `${selectedAthlete().name.toUpperCase()} · ПОПЫТКА 0${phase} / 02 · ${stopwatch ? 'СТАРТ–СТОП' : 'С ОТСЕЧКАМИ'}`;
    html.state.textContent = stopwatch ? (finishing ? 'ВРЕМЯ ЗАФИКСИРОВАНО' : run ? 'ИДЁТ ИЗМЕРЕНИЕ' : 'ГОТОВ К СТАРТУ') :
      (finishing ? 'ИНТЕРВАЛЫ ЗАВЕРШЕНЫ' : run ? 'ИДЁТ ИЗМЕРЕНИЕ' : 'ГОТОВ К ИЗМЕРЕНИЮ');
    html.instruction.textContent = finishing ? 'ИЗМЕРЕНИЕ ЗАВЕРШЕНО' : run ?
      (stopwatch ? 'КОСНИТЕСЬ ДЛЯ СТОПА' : 'КОСНИТЕСЬ ДЛЯ ОТСЕЧКИ') :
      (stopwatch ? 'КОСНИТЕСЬ ДЛЯ СТАРТА' : phase === 2 ? 'КОСНИТЕСЬ ДЛЯ 2-ГО УПРАЖНЕНИЯ' : 'КОСНИТЕСЬ ДЛЯ СТАРТА');
    if (configurationState !== 'ready') {
      html.state.textContent = configurationState === 'loading' ? 'ЧТЕНИЕ КОНФИГУРАЦИИ' : 'ОШИБКА КОНФИГУРАЦИИ';
      html.instruction.textContent = configurationState === 'loading' ? 'ПОДГОТОВКА СЕКУНДОМЕРА' : 'ПРОВЕРЬТЕ config.json И ОБНОВИТЕ';
    }
    html.tapZone.disabled = configurationState !== 'ready';
    html.digit.textContent = stopwatch ? '' : String(done);
    html.digit.classList.toggle('digits-3', done >= 100);
    html.time.textContent = run ? M.formatClock(performance.now() - run.start) : finishing ?
      M.formatClock(M.sum(finishing.intervals)) : '00:00.00';
    html.time.classList.toggle('long-clock', html.time.textContent.length > 8);
    html.count.textContent = `${done} / ${n} интервалов`;
    if (!stopwatch) drawProgress(n, done);
    html.tapZone.setAttribute('aria-label', finishing ? 'Измерение завершено' : run ?
      (stopwatch ? 'Остановить секундомер' : `Отсечь интервал ${done + 1} из ${n}`) :
      (stopwatch ? `Начать попытку ${phase}, режим Старт–Стоп` : `Начать упражнение ${phase}. ${n} интервалов`));
  }
  function flashAcceptedTap() {
    clearTimeout(flashTimer);
    html.capture.classList.add('tap-flash');
    flashTimer = setTimeout(() => html.capture.classList.remove('tap-flash'), TAP_FLASH_MS);
  }
  function drawProgress(n, complete) {
    clear(html.progress);
    // Large interval plans are shown proportionally without creating hundreds of tiny DOM nodes.
    const bars = Math.min(n, 40);
    for (let i = 0; i < bars; i++) {
      const bar = make('span', Math.floor((i + 1) * n / bars) <= complete ? 'done' : '');
      html.progress.append(bar);
    }
  }
  function tick() {
    if (!run) return;
    html.time.textContent = M.formatClock(performance.now() - run.start);
    html.time.classList.toggle('long-clock', html.time.textContent.length > 8);
    frameId = requestAnimationFrame(tick);
  }
  async function acquireWakeLock() {
    if (!('wakeLock' in navigator) || !run) return;
    try { const lock = await navigator.wakeLock.request('screen'); if (run) wakeLock = lock; else await lock.release(); } catch (error) { /* unsupported or denied */ }
  }
  async function releaseWakeLock() { const lock = wakeLock; wakeLock = null; if (lock) try { await lock.release(); } catch (error) {} }
  function recordTap() {
    if (finishing || configurationState !== 'ready') return;
    const now = performance.now();
    if (!run) {
      clearTimeout(toastTimer); $('toast').classList.remove('show'); // Never cover the early-finish control during timing.
      let session = activeSession();
      if (!session || session.exercises.length !== 1) session = null;
      const target = session ? session.target : intervalCount;
      const phase = session ? 2 : 1;
      run = { start: now, last: now, minTapGapMs, target: storage.mode === M.MODE_STOPWATCH ? 1 : target, sessionTarget: target, mode: storage.mode, phase, intervals: [], startedAt: new Date().toISOString(), sessionId: session?.id || null, athleteId: storage.selectedAthleteId };
      flashAcceptedTap();
      acquireWakeLock();
      renderCapture();
      cancelAnimationFrame(frameId); tick();
      return;
    }
    const interval = now - run.last;
    // Strictly more than 1 second between two accepted taps; rejected taps do not reset the clock.
    if (interval <= run.minTapGapMs) return;
    run.intervals.push(interval);
    run.last = now;
    flashAcceptedTap();
    if (run.intervals.length === run.target) {
      finishRun();
    } else {
      renderCapture();
    }
  }
  function finishRun() {
    finishing = run;
    run = null;
    cancelAnimationFrame(frameId);
    releaseWakeLock();
    // Keep the last number and the final confirmation flash visible before opening analysis.
    renderCapture();
    const exercise = finishing.mode === M.MODE_STOPWATCH ? M.createStopwatchExercise(M.sum(finishing.intervals), finishing.startedAt, new Date().toISOString()) :
      M.createExercise(finishing.intervals, finishing.startedAt, new Date().toISOString());
    let session = finishing.sessionId ? findSession(finishing.sessionId) : null;
    if (!session) { session = M.createSession(finishing.sessionTarget, finishing.startedAt, finishing.athleteId); storage.sessions.push(session); }
    if (session.exercises.length < 2) session.exercises.push(exercise);
    if (session.exercises.length === 2) session.status = 'closed';
    activeId = session.exercises.length === 1 ? session.id : null;
    viewingId = session.id; baselineId = null;
    persist();
    setTimeout(() => {
      finishing = null;
      html.capture.classList.remove('tap-flash');
      show('review');
      toast('Упражнение сохранено');
    }, FINAL_DISPLAY_MS);
  }
  function finishIncomplete() {
    if (!run || run.mode !== M.MODE_INTERVALS) return;
    if (!window.confirm('Завершить попытку досрочно? Она сохранится как неполная и не будет учитываться в зачёте.')) return;
    const current = run;
    const elapsed = performance.now() - current.start;
    run = null;
    cancelAnimationFrame(frameId);
    releaseWakeLock();
    clearTimeout(flashTimer);
    html.capture.classList.remove('tap-flash');
    if (storage.incomplete.length >= M.MAX_INCOMPLETE) {
      renderCapture(); return toast('Достигнут предел неполных попыток. Экспортируйте историю.');
    }
    storage.incomplete.push(M.createIncomplete(current.athleteId, current.sessionTarget,
      current.intervals, elapsed, current.startedAt, new Date().toISOString()));
    persist();
    show('history');
    toast('Неполная попытка сохранена — без зачёта. Повторите попытку при необходимости.');
  }
  // This button is a sibling of the timing surface. Its press must never count as an interval.
  $('earlyFinishBtn').addEventListener('pointerdown', event => event.stopPropagation());
  $('earlyFinishBtn').addEventListener('click', event => { event.stopPropagation(); finishIncomplete(); });
  html.tapZone.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault(); recordTap();
  });
  html.tapZone.addEventListener('keydown', event => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); recordTap(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && run) acquireWakeLock(); });
  window.addEventListener('pagehide', () => { if (run) releaseWakeLock(); });
  $('athleteBtn').addEventListener('click', () => show('athletes'));
  $('historyBtn').addEventListener('click', () => show('history'));
  $('settingsBtn').addEventListener('click', () => show('settings'));
  $('modeBtn').addEventListener('click', () => show('modes'));
  $('settingsModeBtn').addEventListener('click', () => show('modes'));
  function chooseMode(mode) {
    if (run || finishing || !M.validMode(mode)) return;
    storage.mode = mode; persist(); show('capture');
  }
  $('selectIntervals').addEventListener('click', () => chooseMode(M.MODE_INTERVALS));
  $('selectStopwatch').addEventListener('click', () => chooseMode(M.MODE_STOPWATCH));
  function renderModes() {
    for (const [id,mode,stateId] of [['selectIntervals',M.MODE_INTERVALS,'modeIntervalsState'],['selectStopwatch',M.MODE_STOPWATCH,'modeStopwatchState']]) {
      const selected = storage.mode === mode;
      $(id).classList.toggle('selected', selected); $(stateId).textContent = selected ? 'ВЫБРАН' : 'ВЫБРАТЬ';
    }
  }
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));

  function metric(label, value, note, highlighted) {
    const m = make('div', 'metric' + (highlighted ? ' highlight' : ''));
    m.append(make('div', 'metric-label', label), make('strong', '', value), make('small', '', note));
    return m;
  }
  function modeLabel(mode) { return mode === M.MODE_STOPWATCH ? 'Старт–Стоп' : 'С отсечками'; }
  function renderReview() {
    const session = findSession(viewingId) || sortedSessions()[0];
    if (!session) return show('history');
    viewingId = session.id;
    const ex = session.exercises, complete = session.status === 'closed', two = ex.length === 2;
    $('reviewTitle').textContent = two ? 'Сравнение упражнений' : complete ? 'Серия завершена' : 'Первое упражнение';
    $('reviewSub').textContent = `${athleteName(session.athleteId)} · ${dateLabel(session.createdAt)} · ${two ? 'две попытки' : complete ? '1 зачётная попытка · отказ от второй' : 'ожидает вторую попытку'}`;
    const summary = clear($('reviewSummary'));
    const metrics = make('div', 'metrics');
    metrics.append(metric('Попытка 1 · всего', sec(M.exerciseTotal(ex[0])), modeLabel(ex[0].mode), true));
    if (two) {
      metrics.append(metric('Попытка 2 · всего', sec(M.exerciseTotal(ex[1])), modeLabel(ex[1].mode), true));
      const best = M.bestTotal(session);
      metrics.append(metric('ЛУЧШИЙ РЕЗУЛЬТАТ ПАРЫ', sec(best), `Попытка ${M.exerciseTotal(ex[0]) <= M.exerciseTotal(ex[1]) ? 1 : 2} · меньше — лучше`, true));
      const rest = Math.max(0, Date.parse(ex[1].startedAt) - Date.parse(ex[0].endedAt));
      metrics.append(metric('Пауза между попытками', sec(rest), 'Не входит во время упражнений'));
    } else if (!complete) {
      metrics.append(metric('Вторая попытка', '—', 'Ожидает выполнения'));
      if (ex[0].mode === M.MODE_INTERVALS) {
        const a = M.stats(ex[0].intervals);
        metrics.append(metric('Быстрый интервал', sec(a.min), `Медленный ${sec(a.max)}`));
        metrics.append(metric('Разброс (CV)', `${a.cv.toFixed(1)}%`, 'Вариативность интервалов'));
      }
    }
    if (complete && !two) {
      metrics.append(metric('ЛУЧШЕЕ ВРЕМЯ СЕРИИ',sec(M.bestTotal(session)),'Одна зачётная попытка · отказ от второй',true));
    }
    summary.append(metrics);
    const actions = clear($('reviewActions'));
    if (!complete && activeId === session.id) {
      actions.append(action('Запустить упражнение 2 →', 'primary-button', () => show('capture')));
      const rest = make('span', 'muted small'); rest.id = 'restIndicator'; actions.append(rest);
    } else if (!complete) {
      actions.append(action('Продолжить эту пару →', 'primary-button', () => {
        storage.selectedAthleteId = session.athleteId; activeId = session.id; persist(); show('capture');
      }));
    }
    if (!complete) {
      actions.append(action('Завершить серию без второй попытки', 'danger-button', () => {
        if (!window.confirm('Отказаться от второй попытки? Серия завершится с результатом первой попытки и будет учитываться в сравнении лучших времён.')) return;
        session.status = 'closed';
        if (activeId === session.id) activeId = null;
        persist(); renderReview(); toast('Серия завершена с одной попыткой');
      }));
    } else {
      actions.append(action('Новая пара', 'primary-button', () => {
        storage.selectedAthleteId = session.athleteId; activeId = null; persist(); show('capture');
      }));
    }
    actions.append(action('Сменить спортсмена', 'secondary-button', () => show('athletes')));
    actions.append(action('История', 'secondary-button', () => show('history')));
    if (restFrame) cancelAnimationFrame(restFrame);
    if (!complete && activeId === session.id) {
      const restTick = () => {
        if (currentView !== 'review' || viewingId !== session.id) return;
        const label = $('restIndicator');
        if (label) label.textContent = 'Пауза: ' + M.formatClock(Math.max(0, Date.now() - Date.parse(ex[0].endedAt)));
        restFrame = requestAnimationFrame(restTick);
      }; restTick();
    }
    const detailed = ex.filter(e => e.mode === M.MODE_INTERVALS);
    $('chartPanel').classList.toggle('hidden', !detailed.length);
    $('tablePanel').classList.toggle('hidden', !detailed.length);
    if (detailed.length) {
      drawChart($('chartWrap'), ex.filter(e => e.mode === M.MODE_INTERVALS).map(e => ({
        name: `Попытка ${ex.indexOf(e)+1}`, values: e.intervals.map(x=>x/1000), color: ex.indexOf(e) ? '#77a9ff' : '#66e3c4'
      })));
      renderIntervalTable(ex, session.target);
    } else { clear($('chartWrap')); clear($('intervalTable')); }
    renderBaseline(session);
  }
  function renderIntervalTable(ex, count) {
    const indexed = ex.map((e,i)=>({e,i})).filter(x=>x.e.mode === M.MODE_INTERVALS);
    const table = make('table'), head = make('thead'), h = make('tr');
    ['№', ...indexed.map(x=>`Попытка ${x.i+1}`), ...(indexed.length === 2 ? ['Δ (2 − 1)'] : [])].forEach(v=>h.append(make('th','',v)));
    head.append(h);table.append(head);
    const body = make('tbody');
    for (let i=0;i<count;i++) {
      const tr=make('tr');tr.append(make('td','',String(i+1)));
      for (const x of indexed) tr.append(make('td','',M.formatSeconds(x.e.intervals[i])));
      if (indexed.length===2) {
        const diff=indexed[1].e.intervals[i]-indexed[0].e.intervals[i];
        tr.append(make('td',diff>0?'positive':diff<0?'negative':'',signed(diff).replace(' с','')));
      }
      body.append(tr);
    }
    table.append(body);clear($('intervalTable')).append(table);
  }
  function svgEl(tag, attrs = {}, textContent) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if (textContent !== undefined) e.textContent = textContent;
    return e;
  }
  function drawChart(target, series) {
    clear(target);
    const points = series.flatMap(s => s.values);
    if (!points.length) return;
    const n = Math.max(...series.map(s => s.values.length));
    const W = 620, H = 275, left = 47, right = 16, top = 22, bottom = 38;
    const w = W - left - right, h = H - top - bottom;
    const min = Math.min(...points), max = Math.max(...points);
    const padding = Math.max(.025, (max - min) * .16);
    const yMin = Math.max(0, min - padding), yMax = max + padding;
    const xAt = i => left + (n === 1 ? w / 2 : i * w / (n - 1));
    const yAt = v => top + h - (v - yMin) * h / (yMax - yMin || 1);
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': 'График изменения длительности интервалов по номеру' });
    for (let k = 0; k <= 4; k++) {
      const v = yMin + (yMax - yMin) * k / 4, y = yAt(v);
      svg.append(svgEl('line', { x1:left, y1:y, x2:W-right, y2:y, stroke:'#334c5a', 'stroke-width':1 }));
      svg.append(svgEl('text', { x:left-9, y:y+4, fill:'#9eb5c0', 'text-anchor':'end', 'font-size':11 }, v.toFixed(2)));
    }
    const step = Math.max(1, Math.ceil(n / 12));
    for (let i = 0; i < n; i += step) svg.append(svgEl('text', {x:xAt(i),y:H-13,fill:'#9eb5c0','text-anchor':'middle','font-size':11},String(i+1)));
    if (n > 1 && (n-1) % step !== 0) svg.append(svgEl('text', {x:xAt(n-1),y:H-13,fill:'#9eb5c0','text-anchor':'middle','font-size':11},String(n)));
    for (const s of series) {
      const pts = s.values.map((v, i) => [xAt(i), yAt(v)]);
      svg.append(svgEl('polyline', { points:pts.map(([x,y])=>`${x},${y}`).join(' '), fill:'none', stroke:s.color,
        'stroke-width':2.8, 'stroke-linecap':'round','stroke-linejoin':'round', ...(s.dashed ? {'stroke-dasharray':'6 5', opacity:.7} : {}) }));
      if (n <= 35) for (const [x, y] of pts) svg.append(svgEl('circle', {cx:x,cy:y,r:s.dashed?2.7:4,fill:s.color,stroke:'#132332','stroke-width':1.5}));
    }
    const legend = make('div','chart-legend');
    for (const s of series) {
      const l = make('div'); const key = make('span','legend-key'); key.style.background = s.color;
      if(s.dashed) key.style.opacity='.5'; l.append(key, document.createTextNode(s.name));legend.append(l);
    }
    target.append(svg, legend);
  }
  function historicalBestRecords(athleteId) {
    const measured = storage.sessions.filter(s => s.athleteId === athleteId && M.bestTotal(s) !== null).map(s=>({
      id:s.id, timestamp:Date.parse(s.createdAt), date:new Date(s.createdAt).toLocaleDateString('ru-RU'),
      bestMs:M.bestTotal(s), label:'Измерение · '+dateLabel(s.createdAt)
    }));
    const archive = storage.archived.filter(a=>a.athleteId===athleteId).map(a=>({
      id:a.id, timestamp:Date.parse(a.date+'T12:00:00Z'), date:a.date.split('-').reverse().join('.'),
      bestMs:a.bestMs, label:'Архив · '+a.date.split('-').reverse().join('.')
    }));
    return [...measured,...archive].sort((a,b)=>a.timestamp-b.timestamp);
  }
  function renderBaseline(session) {
    const wrap=clear($('baselineWrap'));
    if(M.bestTotal(session) === null){
      wrap.append(make('p','muted small','Сравнение доступно после завершения серии. Можно выполнить вторую попытку или отказаться от неё.'));
      return;
    }
    const records=historicalBestRecords(session.athleteId);
    const previous=records.filter(x=>x.id!==session.id && x.timestamp<Date.parse(session.createdAt));
    if(!previous.length){wrap.append(make('p','muted small','Предыдущих завершённых пар или архивных результатов пока нет.'));return;}
    const reference=previous.find(x=>x.id===baselineId)||previous[previous.length-1];
    const select=make('select','baseline-select');select.setAttribute('aria-label','Предыдущий результат для сравнения');
    for(const entry of [...previous].reverse()){
      const opt=make('option','',`${entry.label} · ${sec(entry.bestMs)}`);opt.value=entry.id;opt.selected=entry.id===reference.id;select.append(opt);
    }
    select.addEventListener('change',()=>{baselineId=select.value;renderBaseline(session);});
    const diff=M.bestTotal(session)-reference.bestMs;
    const g=make('div','compare-grid');
    const old=make('div','compare-item');old.append(make('small','','Ранее · лучший результат'),make('strong','',sec(reference.bestMs)));
    const newer=make('div','compare-item');newer.append(make('small','','Разница (сейчас − ранее)'),make('strong',diff>0?'positive':diff<0?'negative':'',signed(diff)));
    g.append(old,newer);wrap.append(make('p','muted small','Сравнивается лучшее общее время завершённой серии (одна или две попытки) с выбранным предыдущим результатом. Архивные записи также участвуют.'),select,g);
    const plot=make('div');const plotted=[...previous,{id:session.id,timestamp:Date.parse(session.createdAt),bestMs:M.bestTotal(session)}].sort((a,b)=>a.timestamp-b.timestamp);
    drawChart(plot,[{name:'Лучшее время серии / архива',values:plotted.map(x=>x.bestMs/1000),color:'#66e3c4'}]);wrap.append(plot);
    wrap.append(make('p','muted small','Точки графика упорядочены по дате (включая архив). Меньшее время — лучший результат.'));
  }
  function deleteHistoryRecord(type, id) {
    if (storage.readOnly) return toast('Хранилище недоступно: удаление заблокировано');
    const labels = { session:'автоматическую запись серии', archive:'ручную архивную запись', incomplete:'неполную попытку' };
    if (!window.confirm(`Удалить ${labels[type]} выбранного спортсмена? Действие нельзя отменить.`)) return;
    try {
      const next = M.deleteRecord(storage, storage.selectedAthleteId, type, id);
      // Persist the deletion before updating the UI so a failed write cannot be reported as success.
      localStorage.setItem(M.STORAGE_KEY, JSON.stringify(next));
      Object.assign(storage, next);
      if (type === 'session' && activeId === id) activeId = null;
      if (type === 'session' && viewingId === id) viewingId = null;
      if (baselineId === id) baselineId = null;
      renderHistory(); toast('Запись удалена');
    } catch (error) { toast('Не удалось удалить запись: ' + error.message); }
  }
  function renderHistory() {
    const list = clear($('historyList'));
    $('historyAthlete').textContent = selectedAthlete().name;
    const records = [
      ...sortedSessions().filter(s => s.athleteId === storage.selectedAthleteId).map(s => ({type:'session',s,time:Date.parse(s.createdAt)})),
      ...storage.incomplete.filter(x => x.athleteId === storage.selectedAthleteId).map(x => ({type:'incomplete',x,time:Date.parse(x.startedAt)})),
      ...storage.archived.filter(a => a.athleteId === storage.selectedAthleteId).map(a => ({type:'archive',a,time:Date.parse(a.date+'T12:00:00Z')}))
    ].sort((a,b) => b.time-a.time);
    if (!records.length) list.append(make('div','empty-state','У этого спортсмена пока нет результатов.'));
    for (const r of records) {
      if (r.type === 'session') {
        const s = r.s, finalized = M.bestTotal(s) !== null;
        const wrap = make('div','history-entry');
        const card = action('','history-card',() => {viewingId=s.id;baselineId=null;show('review');});
        const head = make('div','history-head');
        head.append(make('strong','',dateLabel(s.createdAt)),make('span','pill',
          finalized ? `Завершено · ${s.exercises.length === 1 ? '1 попытка' : '2 попытки'}` : 'Ожидает вторую попытку'));
        const details = make('p','muted',s.exercises.map((e,i) => `Попытка ${i+1} · ${modeLabel(e.mode)}`).join(' · '));
        const stat = make('div','history-stats');
        s.exercises.forEach((e,i) => {const x = make('div');x.append(document.createTextNode(`Попытка ${i+1}: `),make('span','',sec(M.exerciseTotal(e))));stat.append(x);});
        card.append(head,details,stat);
        if (finalized) {const best=make('p','muted');best.append(document.createTextNode('Лучшее время серии: '),make('strong','',sec(M.bestTotal(s))));card.append(best);}
        else card.append(make('p','muted small','Незавершённая серия · ещё не участвует в сравнении.'));
        wrap.append(card,action('Удалить запись', 'small-button danger-outline',()=>deleteHistoryRecord('session',s.id)));
        list.append(wrap);
      } else if (r.type === 'incomplete') {
        const x = r.x, card = make('div','archive-entry incomplete-entry');
        const header=make('div','archive-title');header.append(make('strong','',dateLabel(x.startedAt)),make('span','pill','Неполная попытка'));
        card.append(header,make('div','archive-time',sec(x.elapsedMs)),
          make('p','muted small',`${x.intervals.length} из ${x.target} интервалов · не участвует в сравнении лучших времён`));
        if (x.intervals.length) {
          const details=make('details','incomplete-details');const summary=make('summary','','Показать отсечки');
          const ol=make('ol');x.intervals.forEach((ms,i)=>ol.append(make('li','',`Интервал ${i+1}: ${sec(ms)}`)));
          details.append(summary,ol);card.append(details);
        }
        card.append(action('Удалить неполную попытку','small-button danger-outline',()=>deleteHistoryRecord('incomplete',x.id)));
        list.append(card);
      } else {
        const a=r.a,card=make('div','archive-entry');
        const header=make('div','archive-title');header.append(make('strong','',a.date.split('-').reverse().join('.')),make('span','pill','Внесено вручную'));
        card.append(header,make('div','archive-time',sec(a.bestMs)),make('p','muted small','Лучшее общее время · без детализации попыток'));
        card.append(action('Удалить архивную запись','small-button danger-outline',()=>deleteHistoryRecord('archive',a.id)));
        list.append(card);
      }
    }
    const date=$('archiveDate');if(!date.value){const d=new Date();date.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  }
  $('archiveForm').addEventListener('submit',event=>{
    event.preventDefault();
    const date=$('archiveDate').value;
    const raw=$('archiveSeconds').value.trim().replace(',','.');
    if(!/^\d+(?:\.\d{1,3})?$/.test(raw))return toast('Укажите время в секундах: например, 12,345');
    const ms=Math.round(Number(raw)*1000);
    if(!M.validDate(date)||!Number.isSafeInteger(ms)||ms<1||ms>86400000)return toast('Проверьте дату и время (от 0,001 до 86400 с)');
    if(storage.archived.length>=M.MAX_ARCHIVED)return toast('Достигнут предел архивных записей');
    storage.archived.push(M.createArchived(storage.selectedAthleteId,date,ms));
    $('archiveSeconds').value='';persist();renderHistory();toast('Архивный результат сохранён');
  });
  function renderAthletes() {
    const list = clear($('athleteList'));
    $('athleteCount').textContent = `${storage.athletes.length} из ${M.MAX_ATHLETES} профилей`;
    for (const athlete of storage.athletes) {
      const isSelected = athlete.id === storage.selectedAthleteId;
      const pending = pendingFor(athlete.id);
      const card = make('div', 'athlete-card' + (isSelected ? ' athlete-current' : ''));
      const choose = action('', 'athlete-choose', () => switchAthlete(athlete.id));
      choose.append(make('strong','',athlete.name), make('small','',pending ? 'Первое упражнение готово · ожидает второе' : 'Следующая пара · упражнение 1'));
      const count = storage.sessions.filter(s => s.athleteId === athlete.id).length;
      const archiveCount = storage.archived.filter(a => a.athleteId === athlete.id).length;
      const incompleteCount = storage.incomplete.filter(a => a.athleteId === athlete.id).length;
      choose.append(make('small','',`${count} серий · ${archiveCount} архивных · ${incompleteCount} неполных${isSelected ? ' · выбран' : ''}`));
      const controls = make('div','athlete-controls');
      controls.append(action('Переименовать', 'small-button', () => {
        const value = window.prompt('Новое имя спортсмена', athlete.name);
        if (value === null) return;
        if (!value.trim() || value.trim().length > 50) return toast('Имя должно содержать от 1 до 50 символов');
        athlete.name = value.trim(); persist(); renderAthletes();
      }));
      const remove = action('Удалить', 'small-button danger-outline', () => {
        if (storage.athletes.length === 1) return toast('Нельзя удалить единственный профиль');
        const sessions = storage.sessions.filter(s => s.athleteId === athlete.id);
        const archived = storage.archived.filter(a => a.athleteId === athlete.id);
        const incomplete = storage.incomplete.filter(a => a.athleteId === athlete.id);
        if ((sessions.length || archived.length || incomplete.length) && !window.confirm(`Удалить «${athlete.name}»: ${sessions.length} серий, ${archived.length} архивных и ${incomplete.length} неполных попыток? Сделайте резервную копию.`)) return;
        if (!window.confirm(`Подтвердите удаление профиля «${athlete.name}» вместе с его результатами. Отменить нельзя.`)) return;
        storage.athletes = storage.athletes.filter(a => a.id !== athlete.id);
        storage.sessions = storage.sessions.filter(s => s.athleteId !== athlete.id);
        storage.archived = storage.archived.filter(a => a.athleteId !== athlete.id);
        storage.incomplete = storage.incomplete.filter(a => a.athleteId !== athlete.id);
        if (isSelected) { storage.selectedAthleteId = storage.athletes[0].id; activeId = pendingFor(storage.selectedAthleteId)?.id || null; }
        if (viewingId && !findSession(viewingId)) viewingId = null;
        persist(); renderAthletes();
      });
      controls.append(remove); card.append(choose,controls); list.append(card);
    }
  }
  $('athleteForm').addEventListener('submit', event => {
    event.preventDefault();
    const input = $('athleteNameInput'); const name = input.value.trim();
    if (!name || name.length > 50) return toast('Имя должно содержать от 1 до 50 символов');
    if (storage.athletes.length >= M.MAX_ATHLETES) return toast('Достигнут предел профилей');
    const athlete = M.createAthlete(name); storage.athletes.push(athlete);
    input.value=''; persist(); switchAthlete(athlete.id);
  });
  $('historyChangeAthlete').addEventListener('click', () => show('athletes'));
  $('settingsManageAthletes').addEventListener('click', () => show('athletes'));
  function download(name,mime,data) {
    const blob = new Blob([data],{type:mime}); const url=URL.createObjectURL(blob);
    const a=make('a'); a.href=url; a.download=name; document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function backupName(ext) {return `interval-lab-${new Date().toISOString().slice(0,10)}.${ext}`;}
  $('exportBtn').addEventListener('click',()=>download(backupName('json'),'application/json',JSON.stringify(M.validateStore(storage),null,2)));
  function csvCell(v) {let s=String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  $('csvBtn').addEventListener('click',()=>{
    const rows=[['athlete_id','athlete_name','record_id','date','record_type','exercise','mode','interval_number','interval_ms','total_ms','best_ms','status']];
    for(const s of sortedSessions())s.exercises.forEach((e,i)=>{
      const base=[s.athleteId,athleteName(s.athleteId),s.id,s.createdAt,'measured',i+1,e.mode];
      if(e.mode===M.MODE_INTERVALS)e.intervals.forEach((ms,j)=>rows.push([...base,j+1,ms,M.exerciseTotal(e),M.bestTotal(s)??'',s.status]));
      else rows.push([...base,'','',M.exerciseTotal(e),M.bestTotal(s)??'',s.status]);
    });
    for(const a of storage.archived)rows.push([a.athleteId,athleteName(a.athleteId),a.id,a.date,'manual_archive','','','','','',a.bestMs,'archive']);
    for(const x of storage.incomplete){
      const base=[x.athleteId,athleteName(x.athleteId),x.id,x.startedAt,'incomplete','','intervals'];
      if(x.intervals.length)x.intervals.forEach((ms,i)=>rows.push([...base,i+1,ms,x.elapsedMs,'','incomplete']));
      else rows.push([...base,'','',x.elapsedMs,'','incomplete']);
    }
    download(backupName('csv'),'text/csv;charset=utf-8','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'));
  });
  $('importInput').addEventListener('change',async event=>{
    const file=event.target.files?.[0]; event.target.value='';if(!file)return;
    if(file.size>5*1024*1024)return toast('Слишком большой файл (максимум 5 МБ)');
    try{
      const imported=JSON.parse(await file.text());
      const merged=M.mergeStores(storage,imported);
      Object.assign(storage,merged.data);
      // Imported legacy target is compatibility metadata, not the active configuration.
      if (configurationState === 'ready') storage.target = intervalCount;
      activeId=pendingFor(storage.selectedAthleteId)?.id || null;
      persist();toast(`Импорт: ${merged.added} серий, ${merged.archivedAdded} архивных, ${merged.incompleteAdded} неполных, ${merged.athletesAdded} спортсменов`);
    }catch(error){toast('Импорт отклонён: '+(error.message||'некорректный JSON'));}
  });
  $('clearBtn').addEventListener('click',()=>{
    if(!window.confirm('Удалить ВСЕ измерения на этом устройстве? Отменить нельзя. Сначала экспортируйте JSON.'))return;
    if(!window.confirm('Подтвердите безвозвратное удаление истории.'))return;
    storage.sessions=[];storage.archived=[];storage.incomplete=[];activeId=null;viewingId=null;baselineId=null;persist();show('settings');toast('История удалена');
  });
  window.addEventListener('storage',event=>{
    if(event.key!==M.STORAGE_KEY || run || finishing)return;
    try {const incoming=M.validateStore(JSON.parse(event.newValue));Object.assign(storage,incoming);
      if (configurationState === 'ready') storage.target = intervalCount;
      activeId=pendingFor(storage.selectedAthleteId)?.id||null;
      if(currentView==='history')renderHistory();if(currentView==='capture')renderCapture();if(currentView==='review'&&viewingId)renderReview();if(currentView==='athletes')renderAthletes();if(currentView==='modes')renderModes();}
    catch(error){/* Another tab has transient/invalid data; do not overwrite. */}
  });
  load();
  activeId=pendingFor(storage.selectedAthleteId)?.id||null;
  renderCapture();
  loadConfiguration();
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
