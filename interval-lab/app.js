(() => {
  'use strict';
  const M = window.IntervalModel;
  const $ = id => document.getElementById(id);
  const storage = { version: 1, target: 10, sessions: [] };
  let activeId = null, viewingId = null, baselineId = null;
  let currentView = 'capture', run = null, frameId = null, wakeLock = null;
  let toastTimer = null, restStart = null, restFrame = null;

  const html = {
    capture: $('capture'), review: $('review'), history: $('history'), settings: $('settings'),
    tapZone: $('tapZone'), time: $('timeDisplay'), phase: $('phaseLabel'), state: $('stateLabel'),
    instruction: $('tapInstruction'), progress: $('progressTrack'), count: $('intervalText'),
    presses: $('pressText'), last: $('lastInterval')
  };

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
      if (raw) Object.assign(storage, M.validateStore(JSON.parse(raw)));
    } catch (error) { toast('Не удалось прочитать историю. Старые данные не перезаписаны.');
      // Never overwrite unreadable storage automatically.
      storage.readOnly = true;
    }
  }
  function persist() { if (!storage.readOnly) save(); else toast('Хранилище недоступно: экспортируйте результат вручную.'); }
  function activeSession() { return storage.sessions.find(s => s.id === activeId) || null; }
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
    for (const name of ['capture', 'review', 'history', 'settings']) html[name].classList.toggle('hidden', name !== view);
    if (view === 'capture') renderCapture();
    if (view === 'review') renderReview();
    if (view === 'history') renderHistory();
    if (view === 'settings') renderSettings();
    window.scrollTo(0, 0);
  }
  function currentTarget() { return activeSession()?.exercises.length === 1 ? activeSession().target : storage.target; }
  function capturePhase() { return activeSession()?.exercises.length === 1 ? 2 : 1; }
  function renderCapture() {
    const n = run ? run.target : currentTarget();
    const phase = run ? run.phase : capturePhase();
    html.capture.classList.toggle('running', !!run);
    html.phase.textContent = `УПРАЖНЕНИЕ 0${phase} / 02`;
    html.state.textContent = run ? 'ИДЁТ ИЗМЕРЕНИЕ' : 'ГОТОВ К ИЗМЕРЕНИЮ';
    html.instruction.textContent = run ? 'КОСНИТЕСЬ ДЛЯ ОТСЕЧКИ' : phase === 2 ? 'КОСНИТЕСЬ ДЛЯ 2-ГО УПРАЖНЕНИЯ' : 'КОСНИТЕСЬ ДЛЯ СТАРТА';
    html.time.textContent = run ? M.formatClock(performance.now() - run.start) : '00:00.00';
    html.count.textContent = `${run ? run.intervals.length : 0} / ${n} интервалов`;
    html.presses.textContent = `${run ? run.intervals.length + 2 : 1}-е из ${M.requiredPresses(n)} нажатий`;
    html.last.textContent = run && run.intervals.length ? sec(run.intervals[run.intervals.length - 1]) : '—';
    drawProgress(n, run ? run.intervals.length : 0);
    html.tapZone.setAttribute('aria-label', run ? `Отсечь интервал ${run.intervals.length + 1} из ${n}` : `Начать упражнение ${phase}. ${n} интервалов`);
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
    frameId = requestAnimationFrame(tick);
  }
  async function acquireWakeLock() {
    if (!('wakeLock' in navigator) || !run) return;
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch (error) { /* unsupported or denied */ }
  }
  async function releaseWakeLock() { const lock = wakeLock; wakeLock = null; if (lock) try { await lock.release(); } catch (error) {} }
  function recordTap() {
    const now = performance.now();
    if (!run) {
      let session = activeSession();
      if (!session || session.exercises.length !== 1) session = null;
      const target = session ? session.target : storage.target;
      const phase = session ? 2 : 1;
      run = { start: now, last: now, target, phase, intervals: [], startedAt: new Date().toISOString(), sessionId: session?.id || null };
      acquireWakeLock();
      renderCapture();
      cancelAnimationFrame(frameId); tick();
      return;
    }
    const interval = Math.max(0, now - run.last);
    run.intervals.push(interval);
    run.last = now;
    if (run.intervals.length === run.target) {
      finishRun();
    } else {
      html.last.textContent = sec(interval);
      html.count.textContent = `${run.intervals.length} / ${run.target} интервалов`;
      html.presses.textContent = `${run.intervals.length + 2}-е из ${M.requiredPresses(run.target)} нажатий`;
      drawProgress(run.target, run.intervals.length);
      html.tapZone.setAttribute('aria-label', `Отсечь интервал ${run.intervals.length + 1} из ${run.target}`);
    }
  }
  function finishRun() {
    const finished = run;
    run = null; cancelAnimationFrame(frameId); releaseWakeLock();
    const exercise = M.createExercise(finished.intervals, finished.startedAt, new Date().toISOString());
    let session = finished.sessionId ? findSession(finished.sessionId) : null;
    if (!session) { session = M.createSession(finished.target, finished.startedAt); storage.sessions.push(session); }
    if (session.exercises.length < 2) session.exercises.push(exercise);
    activeId = session.exercises.length === 1 ? session.id : null;
    viewingId = session.id; baselineId = null;
    persist();
    show('review'); toast('Упражнение сохранено');
  }
  html.tapZone.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault(); recordTap();
  });
  html.tapZone.addEventListener('keydown', event => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); recordTap(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && run) acquireWakeLock(); });
  window.addEventListener('pagehide', () => { if (run) releaseWakeLock(); });
  $('historyBtn').addEventListener('click', () => show('history'));
  $('settingsBtn').addEventListener('click', () => show('settings'));
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));

  function metric(label, value, note, highlighted) {
    const m = make('div', 'metric' + (highlighted ? ' highlight' : ''));
    m.append(make('div', 'metric-label', label), make('strong', '', value), make('small', '', note));
    return m;
  }
  function renderReview() {
    const session = findSession(viewingId) || sortedSessions()[0];
    if (!session) return show('history');
    viewingId = session.id;
    const ex = session.exercises, complete = ex.length === 2;
    $('reviewTitle').textContent = complete ? 'Сравнение упражнений' : 'Первое упражнение';
    $('reviewSub').textContent = `${dateLabel(session.createdAt)} · ${session.target} интервалов · ${complete ? 'пара завершена' : 'ожидает второе упражнение'}`;
    const summary = clear($('reviewSummary'));
    const metrics = make('div', 'metrics');
    const a = M.stats(ex[0].intervals), b = complete ? M.stats(ex[1].intervals) : null;
    metrics.append(metric('Упражнение 1 · всего', sec(a.total), `Средний интервал ${sec(a.avg)}`, true));
    if (b) metrics.append(metric('Упражнение 2 · всего', sec(b.total), `Средний интервал ${sec(b.avg)}`, true));
    else metrics.append(metric('Быстрый интервал', sec(a.min), `Медленный ${sec(a.max)}`));
    if (b) {
      const d = b.avg - a.avg;
      metrics.append(metric('Изменение среднего', signed(d), `${signedPct(M.percentageDelta(b.avg, a.avg))} относительно 1-го`));
      const rest = Math.max(0, Date.parse(ex[1].startedAt) - Date.parse(ex[0].endedAt));
      metrics.append(metric('Пауза между упражнениями', sec(rest), 'Не входит во время упражнений'));
    } else {
      metrics.append(metric('Первый → последний', a.delta === null ? '—' : signed(a.delta), `Динамика ${signedPct(a.deltaPercent)}`));
      metrics.append(metric('Разброс (CV)', `${a.cv.toFixed(1)}%`, 'Относительная вариативность интервалов'));
    }
    summary.append(metrics);
    const actions = clear($('reviewActions'));
    if (!complete && activeId === session.id) {
      actions.append(action('Запустить упражнение 2 →', 'primary-button', () => show('capture')));
      const rest = make('span', 'muted small'); rest.id = 'restIndicator'; actions.append(rest);
    } else if (!complete) {
      actions.append(action('Продолжить эту пару →', 'primary-button', () => { activeId = session.id; show('capture'); }));
    }
    actions.append(action('Новая пара', complete ? 'primary-button' : 'secondary-button', () => { activeId = null; show('capture'); }));
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
    drawChart($('chartWrap'), ex.map((e, i) => ({ name: `Упражнение ${i + 1}`, values: e.intervals.map(x => x / 1000), color: i ? '#77a9ff' : '#66e3c4' })));
    renderIntervalTable(ex, session.target);
    renderBaseline(session);
  }
  function renderIntervalTable(ex, count) {
    const table = make('table');
    const head = make('thead'), h = make('tr');
    ['№', 'Упр. 1', ...(ex.length === 2 ? ['Упр. 2', 'Δ (2 − 1)'] : [])].forEach(v => h.append(make('th', '', v)));
    head.append(h); table.append(head);
    const body = make('tbody');
    for (let i = 0; i < count; i++) {
      const tr = make('tr'); tr.append(make('td', '', String(i + 1)), make('td', '', M.formatSeconds(ex[0].intervals[i])));
      if (ex[1]) {
        tr.append(make('td', '', M.formatSeconds(ex[1].intervals[i])));
        const diff = ex[1].intervals[i] - ex[0].intervals[i];
        tr.append(make('td', diff > 0 ? 'positive' : diff < 0 ? 'negative' : '', signed(diff).replace(' с', '')));
      }
      body.append(tr);
    }
    table.append(body); clear($('intervalTable')).append(table);
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
  function renderBaseline(session) {
    const wrap = clear($('baselineWrap'));
    const earlier = sortedSessions().filter(s => s.id !== session.id && s.target === session.target && Date.parse(s.createdAt) < Date.parse(session.createdAt));
    const defaultBaseline = M.findBaseline(storage.sessions, session);
    if (!earlier.length) {
      wrap.append(make('p','muted small','Пока нет предыдущих измерений с таким же числом интервалов. После следующих тренировок здесь появится сравнение.'));
      return;
    }
    let baseline = earlier.find(s => s.id === baselineId) || defaultBaseline || earlier[0];
    const label = make('label','muted small','Выберите предыдущий сеанс (предпочтительно другой день)');
    const select = make('select','baseline-select'); select.setAttribute('aria-label','Сеанс для сравнения');
    for (const s of earlier) {
      const option = make('option','',`${dateLabel(s.createdAt)} · ${s.exercises.length} упр.`); option.value = s.id; option.selected = s.id === baseline.id;
      select.append(option);
    }
    select.addEventListener('change', () => { baselineId = select.value; renderBaseline(session); });
    wrap.append(label, select);
    const g = make('div','compare-grid');
    session.exercises.forEach((e,i) => {
      if (!baseline.exercises[i]) return;
      const current = M.stats(e.intervals), past = M.stats(baseline.exercises[i].intervals);
      const d = current.avg - past.avg;
      const item = make('div','compare-item'); item.append(make('small','',`Упр. ${i+1} · средний интервал`), make('strong', d > 0 ? 'positive' : d < 0 ? 'negative' : '', signed(d)));
      item.append(make('small','',signedPct(M.percentageDelta(current.avg, past.avg)) + ' к выбранному сеансу')); g.append(item);
    });
    wrap.append(g);
    const p = make('p','muted small','Отрицательная разница означает более короткие интервалы. Сравниваются только сеансы с одинаковым числом интервалов.');
    p.style.marginTop='13px'; wrap.append(p);
    const plot = make('div');
    const series = session.exercises.map((e,i) => ({name:`Сейчас · упр. ${i+1}`,values:e.intervals.map(x=>x/1000),color:i?'#77a9ff':'#66e3c4'}));
    baseline.exercises.forEach((e,i) => series.push({name:`Ранее · упр. ${i+1}`,values:e.intervals.map(x=>x/1000),color:i?'#77a9ff':'#66e3c4',dashed:true}));
    drawChart(plot,series);wrap.append(plot);
  }
  function renderHistory() {
    const list = clear($('historyList'));
    const sessions = sortedSessions();
    if (!sessions.length) { list.append(make('div','empty-state','История пока пуста. Начните первое упражнение.')); return; }
    for (const s of sessions) {
      const card = action('', 'history-card', () => { viewingId = s.id; baselineId = null; show('review'); });
      const head = make('div','history-head'); head.append(make('strong','',dateLabel(s.createdAt)),make('span','pill',`${s.exercises.length}/2 упражнения`));
      const details = make('p','muted',`${s.target} интервалов · ${M.requiredPresses(s.target)} нажатий на упражнение`);
      const stats = make('div','history-stats');
      s.exercises.forEach((e,i)=>{const d=make('div');d.append(document.createTextNode(`Упр. ${i+1}: `),make('span','',sec(M.sum(e.intervals))));stats.append(d);});
      card.append(head,details,stats);list.append(card);
    }
  }
  function renderSettings() {
    $('targetInput').value=storage.target;
    $('settingsNotice').textContent=''; updatePressExplanation();
  }
  function updatePressExplanation() {
    const n=Number($('targetInput').value);
    $('pressExplanation').textContent=M.validTarget(n) ? `${n} интервалов = ${M.requiredPresses(n)} нажатий (1 стартовое + ${n} отсечек).` : 'Допустимо от 1 до 200 интервалов.';
  }
  $('targetInput').addEventListener('input',updatePressExplanation);
  $('settingsForm').addEventListener('submit', event => {
    event.preventDefault(); const n=Number($('targetInput').value);
    if (!M.validTarget(n)) return toast('Введите целое число от 1 до 200');
    storage.target = n; persist();
    const pending = activeSession();
    $('settingsNotice').textContent = pending?.exercises.length === 1 ? `Настройка сохранена для новой пары. Второе упражнение текущей пары содержит ${pending.target} интервалов.` : 'Настройка сохранена.';
    toast('Настройка сохранена');
  });
  function download(name,mime,data) {
    const blob = new Blob([data],{type:mime}); const url=URL.createObjectURL(blob);
    const a=make('a'); a.href=url; a.download=name; document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function backupName(ext) {return `interval-lab-${new Date().toISOString().slice(0,10)}.${ext}`;}
  $('exportBtn').addEventListener('click',()=>download(backupName('json'),'application/json',JSON.stringify({version:1,target:storage.target,sessions:storage.sessions},null,2)));
  function csvCell(v) {let s=String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  $('csvBtn').addEventListener('click',()=>{
    const rows=[['session_id','date','exercise','interval_number','interval_ms','interval_sec','total_ms']];
    for(const s of sortedSessions()) s.exercises.forEach((e,i)=>e.intervals.forEach((ms,j)=>rows.push([s.id,s.createdAt,i+1,j+1,ms,(ms/1000).toFixed(3),M.sum(e.intervals)])));
    download(backupName('csv'),'text/csv;charset=utf-8','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'));
  });
  $('importInput').addEventListener('change',async event=>{
    const file=event.target.files?.[0]; event.target.value='';if(!file)return;
    if(file.size>5*1024*1024)return toast('Слишком большой файл (максимум 5 МБ)');
    try{
      const imported=JSON.parse(await file.text());
      const merged=M.mergeStores({version:1,target:storage.target,sessions:storage.sessions},imported);
      storage.sessions=merged.data.sessions;persist();toast(`Импорт завершён: добавлено ${merged.added} сеансов`);
    }catch(error){toast('Импорт отклонён: '+(error.message||'некорректный JSON'));}
  });
  $('clearBtn').addEventListener('click',()=>{
    if(!window.confirm('Удалить ВСЕ измерения на этом устройстве? Отменить нельзя. Сначала экспортируйте JSON.'))return;
    if(!window.confirm('Подтвердите безвозвратное удаление истории.'))return;
    storage.sessions=[];activeId=null;viewingId=null;baselineId=null;persist();show('settings');toast('История удалена');
  });
  window.addEventListener('storage',event=>{
    if(event.key!==M.STORAGE_KEY || run)return;
    try {const incoming=M.validateStore(JSON.parse(event.newValue));Object.assign(storage,incoming);activeId=sortedSessions().find(s=>s.exercises.length===1)?.id||null;
      if(currentView==='history')renderHistory();if(currentView==='capture')renderCapture();if(currentView==='review'&&viewingId)renderReview();}
    catch(error){/* Another tab has transient/invalid data; do not overwrite. */}
  });
  load();
  activeId=sortedSessions().find(s=>s.exercises.length===1)?.id||null;
  renderCapture();
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
