export const REST_MS = 120_000
export const HOLD_MS = 500
export const LAP_COUNT = 20
export const STORAGE_KEY = 'sidesteps:template-v0.3:athlete'
const modes = new Set(['laps', 'stop'])
const validNumber = value => typeof value === 'number' && Number.isFinite(value)
const minimum = attempts => Math.min(...attempts.map(attempt => attempt.ms))

function validAttempt(attempt, mode) {
  if (!validNumber(attempt?.ms) || attempt.ms < HOLD_MS || !Array.isArray(attempt.laps)) return false
  if (mode === 'stop') return attempt.laps.length === 0
  return attempt.laps.length === LAP_COUNT
    && attempt.laps.every(ms => validNumber(ms) && ms >= HOLD_MS)
    && Math.abs(attempt.laps.reduce((sum, ms) => sum + ms, 0) - attempt.ms) < 0.01
}

function validRecord(record) {
  return typeof record?.id === 'string' && modes.has(record.mode)
    && validNumber(record.at) && record.at > 0 && record.at <= 8.64e15
    && Array.isArray(record.attempts) && [1, 2].includes(record.attempts.length)
    && record.attempts.every(attempt => validAttempt(attempt, record.mode))
}

function validDraft(draft) {
  if (draft === null) return true
  if (!draft || !modes.has(draft.mode) || ![1, 2].includes(draft.total)
    || !['ready', 'active', 'rest'].includes(draft.phase) || !Array.isArray(draft.attempts)
    || draft.attempts.length >= draft.total
    || !draft.attempts.every(attempt => validAttempt(attempt, draft.mode))) return false
  return draft.phase !== 'rest' || (
    draft.total === 2 && draft.attempts.length === 1 && validNumber(draft.restUntil)
  )
}

function historyFile(records) {
  return JSON.stringify({ format: 'sidesteps-template-history', version: 1, records }, null, 2)
}

function parseHistory(text) {
  const data = JSON.parse(text)
  if (data?.format !== 'sidesteps-template-history' || data.version !== 1
    || !Array.isArray(data.records) || !data.records.every(validRecord)
    || new Set(data.records.map(record => record.id)).size !== data.records.length) throw Error('invalid-history')
  return [...data.records].sort((a, b) => a.at - b.at)
}

export function createTraining({ storage, now, identify }) {
  let data = { history: [], draft: null, sound: true, interrupted: [] }
  let active = null
  let issue = ''
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const previous = JSON.parse(raw)
      if (!Array.isArray(previous.history) || !previous.history.every(validRecord)
        || !validDraft(previous.draft) || typeof previous.sound !== 'boolean'
        || !Array.isArray(previous.interrupted)) throw Error('invalid-storage')
      data = previous
    }
  } catch {
    issue = 'Не удалось прочитать сохранённые данные.'
  }

  function save(updated) {
    data = updated
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data))
      issue = ''
    } catch {
      issue = 'Не удалось сохранить данные на устройстве. Держите страницу открытой.'
    }
  }

  function update(draft, changes = {}) { save({ ...data, ...changes, draft }) }

  if (data.draft?.phase === 'active') {
    const draft = data.draft
    update({ ...draft, phase: 'ready' }, {
      interrupted: [...data.interrupted, { at: now(), mode: draft.mode, attempt: draft.attempts.length + 1 }],
    })
  }

  function leaveRest() {
    if (data.draft?.phase !== 'rest') return false
    const { restUntil, ...draft } = data.draft
    update({ ...draft, phase: 'ready' })
    return true
  }

  function tick() {
    return data.draft?.phase === 'rest' && now() >= data.draft.restUntil && leaveRest()
  }

  tick()

  function start(total, mode) {
    if (data.draft || ![1, 2].includes(total) || !modes.has(mode)) return false
    update({ total, mode, attempts: [], phase: 'ready' })
    return true
  }

  function tap() {
    const draft = data.draft
    if (!draft || draft.phase === 'rest') return { accepted: false }
    const at = now()
    if (draft.phase === 'ready') {
      active = { start: at, last: at, laps: [] }
      update({ ...draft, phase: 'active' })
      return { accepted: true, flash: true }
    }
    if (!active || at - active.last < HOLD_MS) return { accepted: false }
    const laps = draft.mode === 'laps' ? [...active.laps, at - active.last] : []
    if (draft.mode === 'laps' && laps.length < LAP_COUNT) {
      active = { ...active, last: at, laps }
      return { accepted: true, flash: true }
    }

    const attempts = [...draft.attempts, { ms: at - active.start, laps }]
    active = null
    if (attempts.length < draft.total) {
      update({ ...draft, attempts, phase: 'rest', restUntil: at + REST_MS })
      return { accepted: true, phase: 'rest' }
    }

    const record = { id: identify(), at, mode: draft.mode, attempts }
    update(null, { history: [...data.history, record].sort((a, b) => a.at - b.at) })
    return { accepted: true, phase: 'result', record }
  }

  function snapshot() {
    const rest = data.draft?.phase === 'rest' ? Math.max(0, data.draft.restUntil - now()) : 0
    const elapsed = active ? Math.max(0, now() - active.start) : 0
    return { ...data, rest, elapsed, lapCount: active?.laps.length ?? 0, issue }
  }

  return {
    snapshot, start, tap, leaveRest, tick,
    toggleSound() { save({ ...data, sound: !data.sound }) },
    exportHistory() { return historyFile(data.history) },
    importHistory(text) {
      if (data.draft) throw Error('active-training')
      const history = parseHistory(text)
      save({ ...data, history })
    },
  }
}

export const bestTime = record => minimum(record.attempts)
export function resultInfo(record, history) {
  const index = history.findIndex(entry => entry.id === record.id)
  const previous = history.slice(0, Math.max(0, index))
  const improvement = previous.length ? Math.min(...previous.map(bestTime)) - bestTime(record) : 0
  return { initial: previous.length === 0, record: improvement >= 0, improvement: Math.max(0, improvement) }
}
