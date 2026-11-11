/* Interval Lab: versioned, validated, pure data model. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IntervalModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'interval-lab:data:v1'; // Keep key to migrate existing on-device history.
  const DEFAULT_ATHLETE_ID = 'athlete-default';
  const MAX_ATHLETES = 100, MIN_INTERVALS = 1, MAX_INTERVALS = 200, MAX_SESSIONS = 5000, MAX_ARCHIVED = 5000;
  const MODE_INTERVALS = 'intervals', MODE_STOPWATCH = 'stopwatch';
  const validMode = mode => mode === MODE_INTERVALS || mode === MODE_STOPWATCH;
  const validTarget = n => Number.isInteger(n) && n >= MIN_INTERVALS && n <= MAX_INTERVALS;
  function requiredPresses(n) { if (!validTarget(n)) throw new RangeError('Некорректное число интервалов'); return n + 1; }
  function formatClock(ms) {
    ms = Math.max(0, Number.isFinite(ms) ? ms : 0);
    const cs = Math.floor((ms + 0.00001) / 10);
    const m = Math.floor(cs / 6000), s = Math.floor(cs / 100) % 60, c = cs % 100;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(c).padStart(2, '0');
  }
  function formatSeconds(ms) { return (ms / 1000).toFixed(3); }
  function sum(xs) { return xs.reduce((a, b) => a + b, 0); }
  function stats(xs) {
    if (!xs || !xs.length) return null;
    const total = sum(xs), avg = total / xs.length;
    const variance = sum(xs.map(x => (x - avg) ** 2)) / xs.length;
    const delta = xs.length < 2 ? null : xs[xs.length - 1] - xs[0];
    return { count: xs.length, total, avg, min: Math.min(...xs), max: Math.max(...xs),
      std: Math.sqrt(variance), cv: avg ? 100 * Math.sqrt(variance) / avg : 0,
      first: xs[0], last: xs[xs.length - 1], delta,
      deltaPercent: delta !== null && xs[0] !== 0 ? 100 * delta / xs[0] : null };
  }
  function deltaMs(current, baseline) { return current - baseline; }
  function percentageDelta(current, baseline) { return baseline ? (current - baseline) * 100 / baseline : null; }
  function newId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return 's-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }
  function createSession(target, when, athleteId = DEFAULT_ATHLETE_ID) {
    if (!validTarget(target)) throw new RangeError('Некорректное число интервалов');
    return { id: newId(), createdAt: when || new Date().toISOString(), target, athleteId, exercises: [] };
  }
  function createExercise(intervals, startedAt, endedAt) {
    if (!Array.isArray(intervals) || !intervals.length || intervals.some(x => !Number.isFinite(x) || x < 0))
      throw new TypeError('Некорректные интервалы');
    const times = intervals.map(Math.round);
    return { mode: MODE_INTERVALS, startedAt, endedAt, intervals: times, totalMs: sum(times) };
  }
  function createStopwatchExercise(totalMs, startedAt, endedAt) {
    if (!Number.isFinite(totalMs) || totalMs < 1000 || totalMs > 24 * 60 * 60 * 1000)
      throw new TypeError('Некорректное время Старт–Стоп');
    return { mode: MODE_STOPWATCH, startedAt, endedAt, intervals: [], totalMs: Math.round(totalMs) };
  }
  function exerciseTotal(e) { return e.mode === MODE_STOPWATCH ? e.totalMs : sum(e.intervals); }
  function bestTotal(s) { return s.exercises.length === 2 ? Math.min(...s.exercises.map(exerciseTotal)) : null; }
  function isISO(value) { return typeof value === 'string' && value.length <= 50 && Number.isFinite(Date.parse(value)); }
  function validAthleteName(name) { return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50; }
  function createAthlete(name) { if (!validAthleteName(name)) throw new Error('Имя спортсмена: от 1 до 50 символов'); return { id: newId(), name: name.trim() }; }
  function defaultAthlete() { return { id: DEFAULT_ATHLETE_ID, name: 'Спортсмен 1' }; }
  function isAthlete(a) { return !!a && typeof a === 'object' && typeof a.id === 'string' && a.id.length >= 3 && a.id.length <= 120 && validAthleteName(a.name); }
  function validDate(date) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const d = new Date(date + 'T00:00:00Z');
    return Number.isFinite(d.valueOf()) && d.toISOString().slice(0, 10) === date;
  }
  function createArchived(athleteId, date, bestMs) {
    if (typeof athleteId !== 'string' || !validDate(date) || !Number.isInteger(bestMs) || bestMs < 1 || bestMs > 86400000)
      throw new TypeError('Некорректный архивный результат');
    return { id: newId(), athleteId, date, bestMs };
  }
  function normalExercise(e, target, version) {
    if (!e || typeof e !== 'object' || !isISO(e.startedAt) || !isISO(e.endedAt)) throw new Error('Некорректные даты упражнения');
    const mode = version < 3 ? MODE_INTERVALS : e.mode;
    if (!validMode(mode)) throw new Error('Неизвестный режим упражнения');
    if (mode === MODE_INTERVALS) {
      if (!Array.isArray(e.intervals) || e.intervals.length !== target ||
        !e.intervals.every(x => Number.isInteger(x) && x >= 0 && x <= 3600000)) throw new Error('Некорректные интервалы');
      const totalMs = sum(e.intervals);
      if (version === 3 && e.totalMs !== totalMs) throw new Error('Несогласованное общее время');
      return { mode, startedAt: e.startedAt, endedAt: e.endedAt, intervals: e.intervals.slice(), totalMs };
    }
    if (!Array.isArray(e.intervals) || e.intervals.length !== 0 || !Number.isInteger(e.totalMs) || e.totalMs < 1000 || e.totalMs > 86400000)
      throw new Error('Некорректная попытка Старт–Стоп');
    return { mode, startedAt: e.startedAt, endedAt: e.endedAt, intervals: [], totalMs: e.totalMs };
  }
  function validateStore(data) {
    if (!data || typeof data !== 'object' || ![1, 2, 3].includes(data.version) || !validTarget(data.target) ||
      !Array.isArray(data.sessions) || data.sessions.length > MAX_SESSIONS) throw new Error('Формат данных не поддерживается');
    let athletes, selectedAthleteId;
    if (data.version === 1) { athletes = [defaultAthlete()]; selectedAthleteId = DEFAULT_ATHLETE_ID; }
    else { athletes = data.athletes; selectedAthleteId = data.selectedAthleteId; }
    if (!Array.isArray(athletes) || !athletes.length || athletes.length > MAX_ATHLETES || !athletes.every(isAthlete) ||
      new Set(athletes.map(a => a.id)).size !== athletes.length || !athletes.some(a => a.id === selectedAthleteId))
      throw new Error('Несогласованные профили спортсменов');
    const athleteIds = new Set(athletes.map(a => a.id));
    const sessions = data.sessions.map(s => {
      if (!s || typeof s !== 'object' || typeof s.id !== 'string' || s.id.length < 3 || s.id.length > 120 ||
        !isISO(s.createdAt) || !validTarget(s.target) || !Array.isArray(s.exercises) ||
        s.exercises.length < 1 || s.exercises.length > 2) throw new Error('Некорректная пара упражнений');
      const athleteId = data.version === 1 ? DEFAULT_ATHLETE_ID : s.athleteId;
      if (!athleteIds.has(athleteId)) throw new Error('Сеанс с неизвестным спортсменом');
      return { id: s.id, createdAt: s.createdAt, target: s.target, athleteId,
        exercises: s.exercises.map(e => normalExercise(e, s.target, data.version)) };
    });
    const archivedInput = data.version === 3 ? data.archived : [];
    if (!Array.isArray(archivedInput) || archivedInput.length > MAX_ARCHIVED) throw new Error('Некорректный архив');
    const archived = archivedInput.map(a => {
      if (!a || typeof a !== 'object' || typeof a.id !== 'string' || a.id.length < 3 || a.id.length > 120 ||
        !athleteIds.has(a.athleteId) || !validDate(a.date) || !Number.isInteger(a.bestMs) ||
        a.bestMs < 1 || a.bestMs > 86400000) throw new Error('Некорректный архивный результат');
      return { id: a.id, athleteId: a.athleteId, date: a.date, bestMs: a.bestMs };
    });
    const ids = sessions.map(s => s.id).concat(archived.map(a => a.id));
    if (new Set(ids).size !== ids.length) throw new Error('Повторяющиеся идентификаторы');
    const mode = data.version === 3 ? data.mode : MODE_INTERVALS;
    if (!validMode(mode)) throw new Error('Неизвестный режим');
    return { version: 3, target: data.target, mode, selectedAthleteId,
      athletes: athletes.map(a => ({ id: a.id, name: a.name.trim() })), sessions, archived };
  }
  function mergeStores(local, imported) {
    const a = validateStore(local), b = validateStore(imported);
    const athleteMap = new Map(a.athletes.map(x => [x.id, x]));
    const additionsAthletes = b.athletes.filter(x => !athleteMap.has(x.id));
    if (a.athletes.length + additionsAthletes.length > MAX_ATHLETES) throw new Error('Слишком много спортсменов');
    const sessionMap = new Map(a.sessions.map(s => [s.id, s]));
    const additions = [];
    for (const s of b.sessions) {
      const existing = sessionMap.get(s.id);
      if (!existing) { additions.push(s); continue; }
      if (JSON.stringify(existing) === JSON.stringify(s)) continue;
      if (existing.athleteId !== s.athleteId || existing.target !== s.target || existing.createdAt !== s.createdAt ||
        JSON.stringify(existing.exercises[0]) !== JSON.stringify(s.exercises[0])) throw new Error('Конфликт идентификатора сеанса');
      if (s.exercises.length > existing.exercises.length) sessionMap.set(s.id, s);
      else if (s.exercises.length === existing.exercises.length) throw new Error('Конфликт измерений');
    }
    if (a.sessions.length + additions.length > MAX_SESSIONS) throw new Error('Слишком много измерений');
    const archiveMap = new Map(a.archived.map(x => [x.id, x]));
    const archivedAdditions = [];
    for (const item of b.archived) {
      const existing = archiveMap.get(item.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(item)) throw new Error('Конфликт архивного результата');
      if (!existing) archivedAdditions.push(item);
    }
    if (a.archived.length + archivedAdditions.length > MAX_ARCHIVED) throw new Error('Слишком много архивных результатов');
    const ids = new Set(a.sessions.map(s => s.id).concat(a.archived.map(a => a.id)));
    if (additions.some(s => ids.has(s.id)) || archivedAdditions.some(a => ids.has(a.id) || additions.some(s => s.id === a.id))) throw new Error('Конфликт идентификаторов');
    return { data: { ...a, athletes: [...a.athletes, ...additionsAthletes], sessions: a.sessions.map(s => sessionMap.get(s.id)).concat(additions),
      archived: a.archived.concat(archivedAdditions) },
      added: additions.length, athletesAdded: additionsAthletes.length, archivedAdded: archivedAdditions.length };
  }
  function datesDiffer(a, b) { return new Date(a).toLocaleDateString() !== new Date(b).toLocaleDateString(); }
  function findBaseline(sessions, current) {
    const candidates = sessions.filter(s => s.id !== current.id && s.athleteId === current.athleteId &&
      s.exercises.length === 2 && Date.parse(s.createdAt) < Date.parse(current.createdAt));
    candidates.sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return candidates.find(s => datesDiffer(s.createdAt, current.createdAt)) || candidates[0] || null;
  }
  return { STORAGE_KEY, MIN_INTERVALS, MAX_INTERVALS, MAX_ATHLETES, MAX_SESSIONS, MAX_ARCHIVED,
    MODE_INTERVALS, MODE_STOPWATCH, validMode, requiredPresses, validTarget, formatClock,
    formatSeconds, stats, sum, deltaMs, percentageDelta, createSession, createExercise,
    createStopwatchExercise, exerciseTotal, bestTotal, createArchived, validDate,
    validateStore, mergeStores, findBaseline, createAthlete, defaultAthlete, DEFAULT_ATHLETE_ID };
});
