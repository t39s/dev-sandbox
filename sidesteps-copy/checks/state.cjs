const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../iteration-02/app.js'), 'utf8');
function browser(initial = {}, pathname = '/sidesteps-copy/iteration-01/') {
  const clock = initial.clock || {value: 1700000000000, elapsed: 0};
  const storage = initial.storage || new Map();
  const events = {};
  const app = {innerHTML: '', addEventListener: (name, callback) => { events[name] = callback; }};
  const fields = {'#app': app, '#count': {value: '2'}, '#mode': {value: 'laps'}};
  class ControlledDate extends Date { static now() { return clock.value; } }
  const context = vm.createContext({
    URL, Intl, Date: ControlledDate, performance: {now: () => clock.elapsed},
    document: {querySelector: (selector) => fields[selector] || null},
    location: {href: 'https://example.test' + pathname, hash: ''},
    localStorage: {getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value)},
    window: {addEventListener() {}, scrollTo() {}}, requestAnimationFrame() {}
  });
  vm.runInContext(source, context);
  return {
    app, fields, session: {storage, clock}, value: (key) => vm.runInContext(key, context),
    advance(ms) { clock.elapsed += ms; clock.value += ms; },
    click(action) { events.click({target: {closest: () => ({dataset: {action}})}, preventDefault() {}}); },
    reload() { return browser({storage, clock}, pathname); }
  };
}

test('20 интервалов, отдых, две попытки и перезагрузка', () => {
  const first = browser();
  assert.match(first.app.innerHTML, /Пока нет тренировок/);
  first.click('exercise');
  assert.match(first.app.innerHTML, /2 попытки \(по умолчанию\)/);
  first.click('workout');
  first.click('measure');
  for (let i = 0; i < 19; i++) { first.advance(1000); first.click('measure'); }
  assert.match(first.app.innerHTML, /19 \/ 20 интервалов/);
  first.advance(1000);
  first.click('measure');
  assert.match(first.app.innerHTML, /02:00/);
  first.advance(2000);
  const second = first.reload();
  assert.match(second.app.innerHTML, /01:58/);
  second.click('resume');
  assert.match(second.app.innerHTML, /Попытка 2 из 2/);
  second.click('measure');
  for (let i = 0; i < 20; i++) { second.advance(800); second.click('measure'); }
  assert.match(second.app.innerHTML, /Тренировка завершена/);
  assert.match(second.app.innerHTML, /16,000 с/);
  assert.equal(second.value('history[0].attempts[0].splits.length'), 20);
  assert.equal(second.value('history[0].attempts[1].splits.reduce((a,b) => a+b, 0)'), 16000);
  assert.match(second.reload().app.innerHTML, /последних 1 завершённых/);
});

test('Старт–Стоп, звук, прерванный замер и новый рекорд', () => {
  let state = browser();
  state.fields['#count'].value = '1';
  state.fields['#mode'].value = 'stop';
  state.click('workout');
  state.click('measure');
  state.click('settings');
  state.click('sound');
  state.advance(4000);
  state.click('back');
  assert.match(state.app.innerHTML, /4.00 с/);
  state.click('measure');
  state.click('home');
  state.click('workout');
  state.click('measure');
  state = state.reload();
  assert.match(state.app.innerHTML, /КОСНИСЬ ДЛЯ СТАРТА/);
  assert.equal(state.value('sound'), false);
  assert.equal(state.value('interruptions.length'), 1);
  state.click('measure');
  state.advance(2000);
  state.click('measure');
  assert.match(state.app.innerHTML, /Новый рекорд/);
  assert.match(state.app.innerHTML, /Улучшение на 2,000 с/);
});

test('Версии изолируют историю на одном origin', () => {
  const first = browser();
  first.click('settings');
  first.click('sound');
  assert.equal(first.reload().value('sound'), false);
  assert.equal(browser(first.session, '/sidesteps-copy/iteration-02/').value('sound'), true);
});

test('График короткого замера имеет пять разных отметок', () => {
  const state = browser();
  state.fields['#count'].value = '1';
  state.fields['#mode'].value = 'stop';
  state.click('workout');
  state.click('measure');
  state.advance(123);
  state.click('measure');
  const labels = [...state.app.innerHTML.matchAll(/text-anchor="end" font-size="15">([^<]+)/g)].map((match) => match[1]);
  assert.deepEqual(labels, ['0', '0,25', '0,5', '0,75', '1']);
});
