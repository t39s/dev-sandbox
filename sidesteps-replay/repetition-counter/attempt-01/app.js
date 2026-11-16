import {
  button, disclosure, panel, progressChart, resultCard, scoreboard, shell, tabs,
} from './ui/components.js'

export const storageKey = 'sidesteps-replay:repetition-counter:v1'

function readSeries(storage) {
  const raw = storage.getItem(storageKey)
  if (raw === null) return []
  const records = JSON.parse(raw)
  if (!Array.isArray(records) || !records.every((record, index) =>
    record?.number === index + 1 && Number.isSafeInteger(record.count) && record.count > 0)) {
    throw new Error('Invalid series data')
  }
  return records
}

function repetitions(count) {
  const plural = new Intl.PluralRules('ru').select(count)
  const ending = { one: 'повтор', few: 'повтора', many: 'повторов', other: 'повтора' }[plural]
  return `${count} ${ending}`
}

function card(record, latest = false) {
  return resultCard({
    title: latest ? 'Последняя завершённая серия' : `Серия ${record.number}`,
    value: repetitions(record.count),
    detail: latest ? `Серия ${record.number}` : '',
  })
}

export function mountCounter(target, getStorage = () => window.localStorage) {
  let count = 0
  let series = []
  let historyDirty = true
  const status = document.createElement('p')
  status.className = 'ssui-muted'
  status.setAttribute('role', 'status')
  status.hidden = true

  const announcement = document.createElement('div')
  announcement.className = 'app-announcement'
  announcement.setAttribute('role', 'status')

  function setError(message) {
    status.textContent = message
    status.hidden = !message
  }

  try {
    series = readSeries(getStorage())
  } catch {
    setError('Не удалось загрузить историю.')
  }

  const board = scoreboard({
    label: 'Повторы', value: 0, detail: 'Коснись для добавления', actionLabel: 'Добавить повтор',
    onAction() {
      count += 1
      updateCount()
      board.flash()
    },
  })
  const finish = button({ label: 'Завершить серию', variant: 'confirm', disabled: true, onClick: finishSeries })
  const last = document.createElement('div')
  last.hidden = true
  const seriesPane = panel({ content: [board.root, finish, last] })
  const historyPane = panel()
  const historyList = document.createElement('div')
  historyList.className = 'app-stack'
  const navigation = tabs({
    label: 'Режим работы',
    items: [
      { id: 'series', label: 'Серия', content: seriesPane },
      { id: 'history', label: 'История', content: historyPane },
    ],
    onChange(id) {
      if (id === 'history' && historyDirty) renderHistory()
    },
  })
  const { root, main } = shell({ title: 'Счётчик повторов', content: navigation.root })
  main.append(status, announcement)
  target.replaceChildren(root)
  updateCount()
  updateLatest()

  function updateCount() {
    board.update({ value: count, actionLabel: `Добавить повтор. Сейчас: ${count}` })
    finish.disabled = count === 0
  }

  function updateLatest() {
    const record = series.at(-1)
    last.hidden = !record
    last.replaceChildren(...(record ? [card(record, true)] : []))
  }

  function finishSeries() {
    if (count === 0) return
    let record
    try {
      const storage = getStorage()
      const latest = readSeries(storage)
      record = { number: (latest.at(-1)?.number ?? 0) + 1, count }
      const updated = [...latest, record]
      storage.setItem(storageKey, JSON.stringify(updated))
      series = updated
    } catch {
      setError('Не удалось сохранить серию. Повторы остались на табло.')
      return
    }
    const hadFocus = document.activeElement === finish
    count = 0
    historyDirty = true
    setError('')
    updateCount()
    updateLatest()
    announcement.textContent = `Серия ${record.number} сохранена: ${repetitions(record.count)}.`
    if (hadFocus) board.root.focus({ preventScroll: true })
  }

  function renderHistory() {
    historyDirty = false
    const chartName = 'Прогресс по сериям'
    if (!series.length) {
      historyPane.replaceChildren(progressChart({ label: chartName, emptyLabel: 'Пока нет завершённых серий' }))
      return
    }
    const best = series.reduce((current, record) => record.count >= current.count ? record : current)
    const mean = series.reduce((sum, record) => sum + record.count, 0) / series.length
    const chart = progressChart({
      label: chartName,
      points: series.map(record => ({
        label: `Серия ${record.number}`,
        value: record.count,
        highlighted: record.number === best.number,
      })),
      reference: { label: 'Среднее', value: mean },
    })
    const newestFirst = [...series].reverse()
    historyList.replaceChildren(...newestFirst.slice(0, 3).map(record => card(record)))
    if (newestFirst.length > 3) {
      const older = document.createElement('div')
      older.className = 'app-stack'
      older.append(...newestFirst.slice(3).map(record => card(record)))
      historyList.append(disclosure({ label: 'Ранние серии', content: older }))
    }
    historyPane.replaceChildren(chart, historyList)
  }
}

const target = document.querySelector('#app')
if (target) mountCounter(target)
