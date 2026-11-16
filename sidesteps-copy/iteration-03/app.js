'use strict';

const app = document.querySelector('#app');
const key = 'sidesteps-copy:v1:' + new URL('.', location.href).pathname;
const target = 20;
const minTapInterval = 500;
const flashDuration = 180;
const restDuration = 120000;
const dateFormat = new Intl.DateTimeFormat('ru-RU', {dateStyle: 'short', timeStyle: 'short'});
const dayFormat = new Intl.DateTimeFormat('ru-RU', {day: '2-digit', month: '2-digit'});
const seconds = (ms, precision = 3) => (ms / 1000).toFixed(precision).replace('.', ',') + ' с';
const date = (ms) => dateFormat.format(ms);
const clock = (ms) => {
  const value = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
};

function read() {
  try { return JSON.parse(localStorage.getItem(key)) || {}; }
  catch { return {}; }
}
const saved = read();
let history = saved.history || [];
let interruptions = saved.interruptions || [];
let sound = saved.sound !== false;
let workout = saved.workout || null;
let page = workout ? (workout.attempts.length && workout.restUntil > Date.now() ? 'rest' : 'attempt') : 'home';
let tab = 'history';
let previousPage = 'home';
let latest = null;
let started = null;
let splits = [];
let recoveredRest = page === 'rest';
let notice = '';
let flashUntil = 0;
let allHistory = false;

if (workout?.running) {
  interruptions.unshift({at: Date.now(), attempt: workout.attempts.length + 1, mode: workout.mode});
  workout.running = false;
  workout.restUntil = 0;
}
persist();

function persist() {
  try { localStorage.setItem(key, JSON.stringify({history, interruptions, sound, workout})); }
  catch { /* The current session still works if browser storage is unavailable. */ }
}

function button(label, action, kind = '') {
  return '<button type="button" class="action ' + kind + '" data-action="' + action + '">' + label + '</button>';
}
function panel(content, kind = '') {
  return '<section class="panel ' + kind + '">' + content + '</section>';
}
function heading(title) {
  return panel('<h1>' + title + '</h1>', 'heading');
}
function line(label, value) {
  return '<div class="line"><span>' + label + '</span><strong>' + value + '</strong></div>';
}
function best(record) {
  return Math.min(...record.attempts.map((attempt) => attempt.total));
}
function details(record) {
  const attempts = record.attempts.map((attempt, index) => {
    const star = record.attempts.length > 1 && attempt.total === best(record) ? ' ★' : '';
    const list = attempt.splits.map((split, i) => line('Интервал ' + (i + 1), seconds(split))).join('');
    const intervals = list ? '<details><summary>Время каждого интервала (' + attempt.splits.length + ')</summary>' + list + '</details>' : '';
    return '<div class="attempt">' + line('Попытка ' + (index + 1), seconds(attempt.total) + star) + intervals + '</div>';
  }).join('');
  return '<details><summary>Подробнее</summary><div class="muted small">' + date(record.at) + '</div>' + attempts + '</details>';
}

function resultCard(record, asHeading) {
  const earlier = history.slice(history.indexOf(record) + 1);
  const value = best(record);
  const prior = earlier.length ? Math.min(...earlier.map(best)) : value;
  const improved = earlier.length && value < prior;
  const title = 'Тренировка ' + date(record.at);
  const dateText = asHeading ? '<h2 class="date">' + title + '</h2>' : '<div class="date">' + title + '</div>';
  const improvement = improved ? '<div class="record">★ Новый рекорд!</div><div>Улучшение на ' + seconds(prior - value) + '</div>' : '';
  return panel(dateText + '<div>Лучшее время</div><strong class="value">' + seconds(value) + '</strong>' + improvement +
    line(earlier.length ? 'Рекорд' : 'Исходный результат', seconds(Math.min(prior, value))) + details(record));
}

function chart(showAverage) {
  const records = (showAverage ? history.slice() : history.slice(0, 5)).reverse();
  if (!records.length) return '<div class="muted small">Пока нет завершённых тренировок.</div>';

  const values = records.map(best);
  const fastest = values.reduce((minimum, value) => Math.min(minimum, value), Infinity);
  const average = history.reduce((sum, record) => sum + best(record), 0) / history.length;
  const peak = values.reduce((maximum, value) => Math.max(maximum, value), showAverage ? average : 0);
  const maximum = Math.max(1000, Math.ceil(peak * 1.12 / 1000) * 1000);
  const base = showAverage ? 168 : 225;
  const top = showAverage ? 19 : 37;
  const y = (value) => base - value / maximum * (base - top);
  const tickLabel = new Intl.NumberFormat('ru-RU', {maximumFractionDigits: maximum >= 4000 ? 0 : 2});
  const ticks = Array.from({length: 5}, (_, index) => index * maximum / 4);
  const label = 'Столбчатый график последних ' + records.length + ' завершённых тренировок, в секундах, ось от нуля' +
    (showAverage ? ', среднее по всем тренировкам ' + seconds(average) : '');
  const axis = '<text class="axis" x="7" y="13" font-size="12">с</text>' + ticks.map((v) =>
    '<text class="axis" x="' + (showAverage ? 36 : 35) + '" y="' + (y(v) + 4) +
      '" text-anchor="end" font-size="' + (showAverage ? 12 : 15) + '">' + tickLabel.format(v / 1000) + '</text>').join('');
  const grid = ticks.map((v) => '<line class="grid" x1="' + (showAverage ? 0 : 41) + '" x2="' +
    (showAverage ? '100%' : 366) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>').join('');
  const bars = records.map((record, index) => {
    const value = values[index];
    const step = showAverage ? 76 : 64;
    const width = showAverage ? 47 : 40;
    const x = (showAverage ? 15 : 53) + index * step;
    const middle = x + width / 2;
    const barTop = y(value);
    return '<g><title>' + date(record.at) + ': ' + seconds(value) + '</title><rect class="bar' +
      (value === fastest ? ' best' : '') + '" x="' + x + '" y="' + barTop + '" width="' + width +
      '" height="' + (base - barTop) + '" rx="' + (showAverage ? 2 : 4) + '"/><text class="bar-label" x="' +
      middle + '" y="' + (barTop - 6) + '" text-anchor="middle" font-size="' + (showAverage ? 10 : 13) + '">' +
      (value / 1000).toFixed(1).replace('.', ',') + '</text><text class="axis" x="' + middle + '" y="' +
      (showAverage ? 190 : 246) + '" text-anchor="middle" font-size="' + (showAverage ? 10 : 12) + '">' +
      dayFormat.format(record.at) + '</text></g>';
  }).join('');
  if (!showAverage) {
    return '<svg class="chart" role="img" aria-label="' + label + '" viewBox="0 0 376 260">' + grid + axis + bars + '</svg>';
  }

  const averageLine = '<g><title>Среднее по всем тренировкам: ' + seconds(average) + '</title><line class="average" x1="0" x2="100%" y1="' +
    y(average) + '" y2="' + y(average) + '"/></g>';
  return '<div class="chart-layout"><svg class="chart-axis" width="40" height="208" aria-hidden="true">' + axis +
    '</svg><div class="chart-scroll" tabindex="0" aria-label="Прокрутка графика"><svg class="history-chart" height="208" style="min-width:' +
    (records.length * 76 + 8) + 'px" role="img" aria-label="' + label + '">' + grid + averageLine + bars +
    '</svg></div></div>';
}
function progress(showAverage) {
  return panel('<h2>Мой прогресс</h2><div' + (showAverage ? ' role="region" aria-label="Диаграмма прогресса"' : '') + '>' + chart(showAverage) + '</div>');
}
function home() {
  const selected = (name) => String(tab === name);
  const tabs = '<div class="tabs" role="tablist" aria-label="Разделы приложения"><button role="tab" data-action="history" aria-selected="' +
    selected('history') + '">История</button><button role="tab" data-action="exercise" aria-selected="' + selected('exercise') + '">Новое упражнение</button></div>';
  if (tab === 'exercise') {
    return tabs + '<div role="tabpanel" aria-label="Новое упражнение">' + panel(
      '<label for="count">Попыток в тренировке</label><select id="count"><option value="2">2 попытки (по умолчанию)</option><option value="1">1 попытка</option></select>' +
      '<label for="mode">Режим измерения</label><select id="mode"><option value="laps">20 отсечек (по умолчанию)</option><option value="stop">Старт–Стоп</option></select>' +
      button('Начать тренировку', 'workout', 'primary'), 'form') + '</div>';
  }
  const previous = history.slice(1, allHistory ? undefined : 6).map((record) =>
    '<div class="previous">' + line(dayFormat.format(record.at), seconds(best(record))) + details(record) + '</div>').join('');
  const toggle = history.length > 6
    ? '<button class="action history-toggle" data-action="history-toggle" aria-expanded="' + allHistory + '">' +
      (allHistory ? '5 тренировок' : 'Все тренировки (' + history.length + ')') + '</button>'
    : '';
  return tabs + '<div role="tabpanel" aria-label="История">' +
    (history.length ? resultCard(history[0], true) : panel('<h2>Пока нет тренировок</h2>')) +
    progress(true) + panel('<h2>Тренировки</h2>' + (previous || '<div class="muted small">Нет предыдущих тренировок</div>') + toggle) + '</div>';
}

function settings() {
  const controls = panel('<h2>Звук</h2><div role="status" class="sound' + (sound ? '' : ' off') + '">' +
    (sound ? 'Включён' : 'Выключен') + '</div>' + button(sound ? 'Выключить' : 'Включить', 'sound'));
  let data = '';
  if (!workout && (history.length || interruptions.length)) {
    data = panel('<h2>Мои данные</h2>' + button('Сохранить', 'save') + button('Загрузить', 'load') +
      '<input id="backup" type="file" accept=".json,application/json" hidden><p class="small muted">Данные хранятся на устройстве.</p><output id="notice" role="status"></output>') +
      panel('<h2>Прерванные попытки</h2>' + (interruptions.map((record) => line(date(record.at), 'Попытка ' + record.attempt)).join('') ||
        '<div class="small muted">Прерванных попыток нет</div>'));
  }
  return '<div class="settings"><h1 class="strip">Настройки</h1>' + controls + data + button('Назад', 'back', 'confirm') + '</div>';
}

function attempt() {
  const isRunning = started !== null;
  const count = splits.length;
  const mode = workout.mode;
  const time = '<span class="elapsed" id="elapsed">' + (isRunning ? ((performance.now() - started) / 1000).toFixed(2) : '0.00') + ' с</span>';
  const content = mode === 'laps'
    ? '<span class="count">' + count + '</span><span class="interval">' + count + ' / ' + target + ' интервалов</span>' + time
    : '<span class="hint">СТАРТ–СТОП</span>' + time + '<span class="hint">КОСНИСЬ ДЛЯ ' + (isRunning ? 'СТОПА' : 'СТАРТА') + '</span>';
  return heading('Попытка ' + (workout.attempts.length + 1) + ' из ' + workout.count) +
    '<button class="board ' + (mode === 'stop' ? 'stop-mode ' : '') + (performance.now() < flashUntil ? 'flash' : '') +
    '" data-action="measure" aria-label="' + (isRunning ? 'Отсечка или стоп' : 'Начать измерение') + '">' + content + '</button>';
}

function rest() {
  const last = workout.attempts[workout.attempts.length - 1];
  const summary = recoveredRest ? '' : heading('Попытка ' + workout.attempts.length) +
    panel('<strong class="finished-time">' + seconds(last.total, 2) + '</strong>', 'finished');
  const headingText = recoveredRest ? '<h1>Отдых</h1>' : '<h2>Отдых</h2>';
  return summary + panel(headingText + '<time class="rest-time" id="rest-time">' +
    clock(workout.restUntil - Date.now()) + '</time>' + button('Начать раньше', 'resume', 'primary'), 'rest');
}

function login() {
  return panel('<h2>Вход администратора</h2><form id="login"><label for="pin">PIN-код</label>' +
    '<input type="password" id="pin" placeholder="PIN" inputmode="numeric" autocomplete="off"><output class="error" role="status" id="pin-error"></output>' +
    '<button class="action primary" type="submit">Войти</button></form>') + button('Назад', 'leave-login');
}

function render() {
  const previousChart = document.querySelector('.chart-scroll');
  const chartPosition = previousChart?.scrollLeft;
  const signIn = page === 'login';
  const brand = page === 'result'
    ? '<a class="brand completed" href="./" data-action="home">Приставные шаги<br>на время</a>'
    : '<div class="brand">Приставные шаги<br>на время</div>';
  const gear = '<button class="gear" type="button" data-action="settings" aria-label="' +
    (page === 'settings' ? 'Назад из настроек' : 'Настройки') + '">⚙️</button>';
  const content = {
    home, settings, attempt, rest, login,
    result: () => heading('Тренировка завершена') + resultCard(latest, false) + progress(false) + button('На главную', 'home', 'confirm')
  };
  app.innerHTML = '<header>' + brand + (signIn ? button((sound ? '🔊' : '🔇') + ' Звук', 'sound', 'pill') : gear) +
    '</header>' + content[page]() + '<footer>sidesteps v. 0.2.6' +
    (signIn ? '' : ' · <a href="#admin-login" title="Для администратора">Войти</a>') + '</footer>';
  const scroller = document.querySelector('.chart-scroll');
  if (scroller) scroller.scrollLeft = chartPosition ?? scroller.scrollWidth;
  if (notice && document.querySelector('#notice')) document.querySelector('#notice').textContent = notice;
}

function resume() {
  page = 'attempt';
  if (workout.restUntil <= Date.now()) workout.restUntil = 0;
  persist();
  render();
}
function measure() {
  const now = performance.now();
  if (started === null) {
    started = now;
    flashUntil = now + flashDuration;
    workout.running = true;
    workout.restUntil = 0;
    persist();
  } else {
    const elapsed = now - started;
    const lastAccepted = splits[splits.length - 1] ?? 0;
    if (elapsed - lastAccepted < minTapInterval) return;
    flashUntil = now + flashDuration;
    if (workout.mode === 'laps') splits.push(elapsed);
    if (workout.mode === 'stop' || splits.length === target) {
      const intervals = splits.map((mark, index) => mark - (splits[index - 1] || 0));
      workout.attempts.push({total: elapsed, splits: intervals});
      workout.running = false;
      started = null;
      flashUntil = 0;
      splits = [];
      if (workout.attempts.length === workout.count) {
        latest = {at: Date.now(), mode: workout.mode, attempts: workout.attempts};
        history.unshift(latest);
        workout = null;
        page = 'result';
      } else {
        workout.restUntil = Date.now() + restDuration;
        recoveredRest = false;
        page = 'rest';
      }
      persist();
    }
  }
  render();
}

function saveData() {
  const payload = JSON.stringify({format: 'sidesteps-copy-1', history, interruptions}, null, 2);
  const url = URL.createObjectURL(new Blob([payload], {type: 'application/json'}));
  const link = Object.assign(document.createElement('a'), {href: url, download: 'sidesteps-' + new Date().toISOString().slice(0, 10) + '.json'});
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function validAttempt(attempt) {
  return Number.isFinite(attempt?.total) && attempt.total >= 0 && Array.isArray(attempt.splits) &&
    attempt.splits.every((duration) => Number.isFinite(duration) && duration >= 0);
}
function validRecord(record) {
  return Number.isFinite(record?.at) && Math.abs(record.at) <= 8640000000000000 &&
    Array.isArray(record.attempts) && record.attempts.length > 0 && record.attempts.length <= 2 && record.attempts.every(validAttempt);
}
app.addEventListener('change', async (event) => {
  if (event.target.id !== 'backup' || !event.target.files.length) return;
  try {
    const data = JSON.parse(await event.target.files[0].text());
    if (data?.format !== 'sidesteps-copy-1' || !Array.isArray(data.history) || !data.history.every(validRecord) ||
        !Array.isArray(data.interruptions) || !data.interruptions.every((record) =>
          Number.isFinite(record?.at) && Math.abs(record.at) <= 8640000000000000 && [1, 2].includes(record.attempt))) {
      throw new Error('Unexpected backup format');
    }
    const combine = (incoming, stored) => [...new Map([...incoming, ...stored].map((item) => [item.at, item])).values()]
      .sort((a, b) => b.at - a.at);
    history = combine(data.history, history);
    interruptions = combine(data.interruptions, interruptions);
    persist();
    notice = 'Данные загружены.';
  } catch {
    notice = 'Не удалось загрузить данные.';
  }
  render();
});

app.addEventListener('submit', (event) => {
  if (event.target.id !== 'login') return;
  event.preventDefault();
  document.querySelector('#pin-error').textContent = 'Неверный PIN-код';
});

app.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  switch (action) {
    case 'measure': measure(); return;
    case 'resume': resume(); return;
    case 'history':
    case 'exercise': tab = action; allHistory = false; break;
    case 'history-toggle':
      allHistory = !allHistory;
      render();
      document.querySelector('.history-toggle')?.focus({preventScroll: true});
      return;
    case 'home': event.preventDefault(); page = 'home'; tab = 'history'; allHistory = false; window.scrollTo(0, 0); break;
    case 'workout':
      workout = {count: Number(document.querySelector('#count').value), mode: document.querySelector('#mode').value, attempts: [], restUntil: 0, running: false};
      page = 'attempt';
      persist();
      break;
    case 'settings':
      if (page === 'settings') page = previousPage;
      else { previousPage = page; page = 'settings'; notice = ''; }
      break;
    case 'back': page = previousPage; break;
    case 'sound': sound = !sound; persist(); break;
    case 'save': saveData(); return;
    case 'load': document.querySelector('#backup').click(); return;
    case 'leave-login': location.hash = ''; return;
  }
  render();
});

function route() {
  if (location.hash === '#admin-login') {
    if (page !== 'login') previousPage = page;
    page = 'login';
  } else if (page === 'login') {
    page = previousPage;
  }
  render();
}
window.addEventListener('hashchange', route);
route();

function animate() {
  const elapsed = document.querySelector('#elapsed');
  if (elapsed && started !== null) {
    const now = performance.now();
    elapsed.textContent = ((now - started) / 1000).toFixed(2) + ' с';
    if (flashUntil && now >= flashUntil) {
      flashUntil = 0;
      document.querySelector('.board')?.classList.remove('flash');
    }
  }
  if ((page === 'rest' || (page === 'settings' && previousPage === 'rest')) && workout.restUntil) {
    const remaining = workout.restUntil - Date.now();
    const time = document.querySelector('#rest-time');
    if (time) time.textContent = clock(remaining);
    if (remaining <= 0 && page === 'rest') resume();
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
