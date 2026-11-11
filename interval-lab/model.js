/* Interval Lab: pure data model, shared by browser and Node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IntervalModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'interval-lab:data:v1'; // same key for lossless migration from v1
  const DEFAULT_ATHLETE_ID = 'athlete-default';
  const MAX_ATHLETES = 100;
  const MIN_INTERVALS = 1;
  const MAX_INTERVALS = 200;
  const MAX_SESSIONS = 5000;
  function validTarget(n) { return Number.isInteger(n) && n >= MIN_INTERVALS && n <= MAX_INTERVALS; }
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
    if (!Array.isArray(intervals) || !intervals.length || intervals.some(x => !Number.isFinite(x) || x < 0)) throw new TypeError('Некорректные интервалы');
    return { startedAt, endedAt, intervals: intervals.map(x => Math.round(x)) };
  }
  function isISO(value) { return typeof value === 'string' && value.length <= 50 && Number.isFinite(Date.parse(value)); }
  function isExercise(e, target) {
    return !!e && typeof e === 'object' && isISO(e.startedAt) && isISO(e.endedAt) &&
      Array.isArray(e.intervals) && e.intervals.length === target &&
      e.intervals.every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 3600000);
  }
  function createAthlete(name) {
    if (!validAthleteName(name)) throw new Error('Имя спортсмена: от 1 до 50 символов');
    return { id: newId(), name: name.trim() };
  }
  function validAthleteName(name) { return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50; }
  function defaultAthlete() { return { id: DEFAULT_ATHLETE_ID, name: 'Спортсмен 1' }; }
  function isAthlete(a) { return a && typeof a === 'object' && typeof a.id === 'string' && a.id.length >= 3 && a.id.length <= 120 && validAthleteName(a.name); }
  function isSession(s) {
    return !!s && typeof s === 'object' && typeof s.id === 'string' && s.id.length >= 3 && s.id.length <= 120 &&
      isISO(s.createdAt) && validTarget(s.target) && Array.isArray(s.exercises) &&
      s.exercises.length >= 1 && s.exercises.length <= 2 && s.exercises.every(e => isExercise(e, s.target));
  }
  function validateStore(data) {
    if (!data || typeof data !== 'object' || ![1, 2].includes(data.version) || !validTarget(data.target) ||
      !Array.isArray(data.sessions) || data.sessions.length > MAX_SESSIONS) throw new Error('Формат данных не поддерживается');
    if (!data.sessions.every(isSession)) throw new Error('Обнаружены некорректные измерения');
    const ids = data.sessions.map(s => s.id);
    if (new Set(ids).size !== ids.length) throw new Error('Повторяющиеся идентификаторы измерений');
    let athletes, selectedAthleteId;
    if (data.version === 1) {
      athletes = [defaultAthlete()]; selectedAthleteId = DEFAULT_ATHLETE_ID;
    } else {
      athletes = data.athletes; selectedAthleteId = data.selectedAthleteId;
      if (!Array.isArray(athletes) || !athletes.length || athletes.length > MAX_ATHLETES || !athletes.every(isAthlete))
        throw new Error('Некорректные профили спортсменов');
      if (new Set(athletes.map(a => a.id)).size !== athletes.length ||
        !athletes.some(a => a.id === selectedAthleteId)) throw new Error('Несогласованные профили спортсменов');
      const athleteIds = new Set(athletes.map(a => a.id));
      if (!data.sessions.every(s => typeof s.athleteId === 'string' && athleteIds.has(s.athleteId)))
        throw new Error('Сеанс с неизвестным спортсменом');
    }
    return { version: 2, target: data.target, selectedAthleteId,
      athletes: athletes.map(a => ({ id: a.id, name: a.name.trim() })),
      sessions: data.sessions.map(s => ({ id: s.id, createdAt: s.createdAt,
        target: s.target, athleteId: data.version === 1 ? DEFAULT_ATHLETE_ID : s.athleteId,
        exercises: s.exercises.map(e => ({ startedAt: e.startedAt, endedAt: e.endedAt,
          intervals: e.intervals.slice() })) })) };
  }
  function mergeStores(local, imported) {
    const a = validateStore(local), b = validateStore(imported);
    const athleteMap = new Map(a.athletes.map(x => [x.id, x]));
    const toAddAthletes = b.athletes.filter(x => !athleteMap.has(x.id));
    if (a.athletes.length + toAddAthletes.length > MAX_ATHLETES) throw new Error('Слишком много спортсменов');
    const sessionMap = new Map(a.sessions.map(s => [s.id, s]));
    const additions = [];
    for (const s of b.sessions) {
      const existing = sessionMap.get(s.id);
      if (!existing) additions.push(s);
      else if (JSON.stringify(existing) !== JSON.stringify(s)) {
        // A backup of the same session may contain an older version with one exercise;
        // keep the version with two exercises and reject unrelated ID collisions.
        if (existing.athleteId !== s.athleteId || existing.target !== s.target ||
            existing.createdAt !== s.createdAt ||
            JSON.stringify(existing.exercises[0]) !== JSON.stringify(s.exercises[0]))
          throw new Error('Конфликт идентификатора сеанса: импорт не выполнен');
        if (s.exercises.length > existing.exercises.length) {
          sessionMap.set(s.id, s);
        } else if (s.exercises.length === existing.exercises.length) {
          throw new Error('Конфликт измерений: импорт не выполнен');
        }
      }
    }
    if (a.sessions.length + additions.length > MAX_SESSIONS) throw new Error('Слишком много измерений');
    return {data:{...a,athletes:[...a.athletes,...toAddAthletes],sessions:a.sessions.map(s=>sessionMap.get(s.id)).concat(additions)},
      added:additions.length, athletesAdded:toAddAthletes.length};
  }
  function datesDiffer(a, b) { return new Date(a).toLocaleDateString() !== new Date(b).toLocaleDateString(); }
  function findBaseline(sessions, current) {
    const candidates = sessions.filter(s => s.id !== current.id && s.athleteId === current.athleteId && s.target === current.target &&
      Date.parse(s.createdAt) < Date.parse(current.createdAt));
    candidates.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return candidates.find(s => datesDiffer(s.createdAt, current.createdAt)) || candidates[0] || null;
  }
  return { STORAGE_KEY, MIN_INTERVALS, MAX_INTERVALS, requiredPresses, validTarget, formatClock,
    formatSeconds, stats, sum, deltaMs, percentageDelta, createSession, createExercise,
    validateStore, mergeStores, findBaseline, createAthlete, defaultAthlete, DEFAULT_ATHLETE_ID, MAX_ATHLETES };
});
