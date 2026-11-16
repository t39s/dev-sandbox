import {
  button, choice, disclosure, panel, progressChart, resultCard, scoreboard, shell, tabs,
} from './ui/components.js'
import { createTraining, bestTime, resultInfo, LAP_COUNT } from './training.js'

const fixed = ms => (ms / 1000).toFixed(3).replace('.', ',')
const resultTime = ms => `${fixed(ms)} с`
const liveTime = ms => `${(ms / 1000).toFixed(2)} с`
const date = new Intl.DateTimeFormat('ru', { dateStyle: 'short', timeStyle: 'short' })
const chartNumber = new Intl.NumberFormat('ru', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const shortDate = new Intl.DateTimeFormat('ru', { month: '2-digit', day: '2-digit' })
const safeClock = () => performance.timeOrigin + performance.now()

function el(tag, text, className) {
  const node = document.createElement(tag)
  if (text != null) node.textContent = text
  if (className) node.className = className
  return node
}

export function mountSideSteps(target, {
  now = safeClock,
  identify = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  storage = {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  },
} = {}) {
  const training = createTraining({ storage, now, identify })
  let screen = training.snapshot().draft ? 'training' : 'home'
  let previous = 'home'
  let homeTab = 'history'
  let completed = null
  let board = null
  let restValue = null
  let soundButton = null
  let message = ''
  let pinMessage = null
  let tabState = { attempts: '2', mode: 'laps' }
  const settings = button({ label: '⚙', variant: 'secondary', onClick: openSettings })
  settings.setAttribute('aria-label', 'Настройки')
  settings.classList.add('gear')
  const title = el('span')
  title.append('Приставные шаги', el('br'), 'на время')
  const { root, main } = shell({ title, actions: [settings] })
  const headerControls = settings.parentNode
  const status = el('p', '', 'status ssui-muted')
  status.setAttribute('role', 'status')
  const footer = el('footer', null, 'footer')
  const signIn = el('a', 'Войти')
  signIn.href = '#login'
  signIn.addEventListener('click', event => {
    event.preventDefault()
    if (screen === 'home') show('login', true)
  })
  footer.append(el('span', 'sidesteps v. 0.2.6'), signIn)
  root.append(footer)
  target.replaceChildren(root)

  function show(next, focus = false) {
    screen = next
    message = ''
    render()
    if (focus) main.querySelector('h2, [role="tab"]')?.focus({ preventScroll: true })
  }

  function openSettings() {
    if (screen === 'settings') {
      show(previous, true)
      return
    }
    if (screen === 'login') return
    previous = screen
    show('settings', true)
  }

  function makeSoundButton() {
    return button({
      label: training.snapshot().sound ? 'Выключить' : 'Включить',
      variant: 'secondary',
      onClick() {
        training.toggleSound()
        const sound = training.snapshot().sound
        soundButton.textContent = sound ? 'Выключить' : 'Включить'
        soundButton.setAttribute('aria-label', sound ? 'Выключить звук' : 'Включить звук')
        if (screen === 'settings') main.querySelector('[data-sound-status]').textContent = sound ? 'Включён' : 'Выключен'
        updateStatus()
      },
    })
  }

  function makeForm(attemptsControl, modeControl) {
    const start = button({
      label: 'Начать тренировку',
      onClick() {
        if (training.start(Number(attemptsControl.value), modeControl.value)) show('training', true)
      },
    })
    return start
  }

  function home() {
    const attempts = choice({
      label: 'Попыток в тренировке', value: tabState.attempts,
      options: [{ value: '2', label: '2 попытки (по умолчанию)' }, { value: '1', label: '1 попытка' }],
      onChange(value) { tabState.attempts = value },
    })
    const mode = choice({
      label: 'Режим измерения', value: tabState.mode,
      options: [{ value: 'laps', label: '20 отсечек (по умолчанию)' }, { value: 'stop', label: 'Старт–Стоп' }],
      onChange(value) { tabState.mode = value },
    })
    const form = panel({ content: [attempts.root, mode.root, makeForm(attempts.control, mode.control)] })
    const history = el('div', null, 'stack')
    history.append(...historyView())
    return tabs({
      label: 'Разделы',
      selected: homeTab,
      items: [
        { id: 'history', label: 'История', content: history },
        { id: 'exercise', label: 'Новое упражнение', content: form },
      ],
      onChange(id) {
        homeTab = id
        if (id === 'exercise') {
          tabState = { attempts: '2', mode: 'laps' }
          attempts.control.value = '2'
          mode.control.value = 'laps'
        }
      },
    }).root
  }

  function attemptDetails(record) {
    const details = el('div', null, 'stack')
    details.append(el('p', date.format(record.at), 'ssui-muted'))
    const best = record.attempts.findIndex(a => a.ms === bestTime(record))
    for (const [index, attempt] of record.attempts.entries()) {
      const block = el('div', null, 'attempt-detail')
      const star = record.attempts.length === 2 && best === index ? ' ★' : ''
      block.append(el('strong', `Попытка ${index + 1} · ${resultTime(attempt.ms)}${star}`))
      if (attempt.laps.length) {
        const intervals = el('ol', null, 'intervals')
        attempt.laps.forEach((ms, i) => intervals.append(el('li', `Интервал ${i + 1} · ${resultTime(ms)}`)))
        block.append(disclosure({ label: `Время каждого интервала (${LAP_COUNT})`, content: intervals }))
      }
      details.append(block)
    }
    return details
  }

  function trainingCard(record, title, history) {
    const info = resultInfo(record, history)
    const badge = info.initial ? 'Исходный результат' : info.record ? 'Рекорд' : ''
    const card = resultCard({
      title, value: resultTime(bestTime(record)),
      detail: [date.format(record.at), badge].filter(Boolean).join(' · '),
      details: attemptDetails(record),
    })
    if (info.improvement > 0) {
      const text = el('p', `★ Новый рекорд! Улучшение на ${resultTime(info.improvement)}`, 'record')
      card.insertBefore(text, card.querySelector('details'))
    }
    return card
  }

  function chart(records, average) {
    const best = records.reduce((min, record) => Math.min(min, bestTime(record)), Infinity)
    const index = records.findIndex(record => bestTime(record) === best)
    const reference = average && records.length ? {
      label: 'Среднее',
      value: records.reduce((total, record) => total + bestTime(record), 0) / records.length / 1000,
    } : undefined
    const format = value => `${chartNumber.format(value)} с`
    return progressChart({
      label: 'Мой прогресс',
      points: records.map((record, i) => ({
        label: shortDate.format(record.at), value: bestTime(record) / 1000, highlighted: i === index,
      })),
      reference, format, emptyLabel: 'Пока нет завершённых тренировок.',
    })
  }

  function historyView() {
    const { history } = training.snapshot()
    const latest = history.at(-1)
    const list = el('div', null, 'stack previous-list')
    list.id = 'previous-trainings'
    const previous = [...history.slice(0, -1)].reverse()
    let expanded = false
    const toggle = previous.length > 5 ? button({
      label: `Все тренировки (${history.length})`, variant: 'secondary',
      onClick() { expanded = !expanded; fillList() },
    }) : null

    function fillList() {
      const entries = (expanded ? previous : previous.slice(0, 5)).map(record => trainingCard(record, 'Тренировка', history))
      list.replaceChildren(...(entries.length ? entries : [el('p', 'Нет предыдущих тренировок', 'ssui-muted')]))
      if (toggle) {
        toggle.textContent = expanded ? '5 тренировок' : `Все тренировки (${history.length})`
        toggle.setAttribute('aria-expanded', String(expanded))
        toggle.setAttribute('aria-controls', list.id)
      }
    }

    fillList()
    return [
      panel({ content: [latest ? trainingCard(latest, 'Последняя тренировка', history) : el('p', 'Пока нет тренировок', 'ssui-muted')] }),
      panel({ content: [chart(history, true)] }),
      panel({ title: 'Тренировки', content: toggle ? [list, toggle] : [list] }),
    ]
  }

  function refreshBoard() {
    const state = training.snapshot()
    if (!board || !state.draft) return
    const running = state.draft.phase === 'active'
    const laps = state.draft.mode === 'laps'
    board.update({
      label: laps ? liveTime(state.elapsed) : 'СТАРТ–СТОП',
      value: laps ? state.lapCount : liveTime(state.elapsed),
      detail: laps ? `${state.lapCount} / ${LAP_COUNT} интервалов` : (running ? 'КОСНИСЬ ДЛЯ СТОПА' : 'КОСНИСЬ ДЛЯ СТАРТА'),
      actionLabel: running ? 'Отсечка или стоп' : 'Начать измерение',
    })
  }

  function trainingView() {
    const { draft } = training.snapshot()
    if (draft.phase === 'rest') {
      restValue = el('p', null, 'rest-time')
      const skip = button({ label: 'Начать раньше', onClick() { training.leaveRest(); show('training', true) } })
      const result = el('p', resultTime(draft.attempts[0].ms), 'rest-time')
      const label = panel({ title: 'Попытка 1' })
      const previousResult = panel({ content: [result] })
      const rest = panel({ title: 'Отдых', content: [restValue, skip] })
      label.classList.add('rest-label')
      previousResult.classList.add('rest-panel')
      rest.classList.add('rest-panel')
      return [label, previousResult, rest]
    }

    board = scoreboard({
      onAction() {
        const event = training.tap()
        if (!event.accepted) return
        if (event.phase === 'result') {
          completed = event.record
          show('result', true)
        } else if (event.phase === 'rest') {
          show('training', true)
        } else {
          refreshBoard()
          if (event.flash) board.flash()
          updateStatus()
        }
      },
    })
    board.root.classList.add(draft.mode === 'laps' ? 'lap-board' : 'stop-board')
    refreshBoard()
    const node = panel({ title: `Попытка ${draft.attempts.length + 1} из ${draft.total}`, content: [board.root] })
    node.classList.add('training-panel')
    return [node]
  }

  function resultView() {
    const { history } = training.snapshot()
    const home = button({
      label: 'На главную',
      onClick() { homeTab = 'history'; tabState = { attempts: '2', mode: 'laps' }; show('home', true) },
    })
    return panel({
      title: 'Тренировка завершена',
      content: [trainingCard(completed, 'Результат', history), chart(history.slice(-5), false), home],
    })
  }

  function exportFile() {
    const file = new Blob([training.exportHistory()], { type: 'application/json' })
    const link = el('a')
    link.href = URL.createObjectURL(file)
    link.download = 'sidesteps-history.json'
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }

  function settingsView() {
    const state = training.snapshot()
    soundButton = makeSoundButton()
    const soundLabel = el('p', state.sound ? 'Включён' : 'Выключен')
    soundLabel.dataset.soundStatus = ''
    const sections = [panel({ title: 'Звук', content: [soundLabel, soundButton] })]
    if (!state.draft) {
      const hasData = state.history.length > 0 || state.interrupted.length > 0
      const input = el('input')
      input.type = 'file'
      input.accept = 'application/json,.json'
      input.hidden = true
      input.addEventListener('change', async () => {
        const file = input.files?.[0]
        if (!file) return
        try {
          training.importHistory(await file.text())
          render()
          message = 'Данные загружены.'
        } catch {
          message = 'Не удалось загрузить историю. Проверьте файл.'
        }
        updateStatus()
        input.value = ''
      })
      const save = button({ label: 'Сохранить', onClick: exportFile })
      const load = button({ label: 'Загрузить', variant: 'secondary', onClick: () => input.click() })
      sections.push(panel({
        title: 'Мои данные',
        content: hasData ? [save, load, input, el('p', 'Данные хранятся на устройстве.', 'ssui-muted')] : [load, input],
      }))
      const interruptions = state.interrupted.length
        ? state.interrupted.map(event => el('p', `${date.format(event.at)} · Попытка ${event.attempt}`))
        : [el('p', 'Прерванных попыток нет', 'ssui-muted')]
      if (hasData) sections.push(panel({ title: 'Прерванные попытки', content: interruptions }))
    }
    sections.push(button({ label: 'Назад', variant: 'secondary', onClick: openSettings }))
    return sections
  }

  function login() {
    soundButton = makeSoundButton()
    headerControls.append(soundButton)
    const form = el('form', null, 'stack')
    const input = el('input')
    input.classList.add('pin')
    input.type = 'password'
    input.inputMode = 'numeric'
    input.placeholder = 'PIN'
    const label = el('label', null, 'stack')
    label.append(el('span', 'PIN-код'), input)
    const submit = button({ label: 'Войти' })
    submit.type = 'submit'
    pinMessage = el('p', '', 'ssui-muted')
    pinMessage.setAttribute('role', 'status')
    form.append(label, submit, pinMessage)
    form.addEventListener('submit', event => {
      event.preventDefault()
      pinMessage.textContent = 'Вход администратора в этой сборке недоступен.'
    })
    return panel({
      title: 'Вход администратора',
      content: [form, button({ label: 'Назад', variant: 'secondary', onClick: () => { homeTab = 'history'; show('home', true) } })],
    })
  }

  function updateStatus() {
    status.textContent = [message, training.snapshot().issue].filter(Boolean).join(' ')
    status.hidden = !status.textContent
  }

  function render() {
    board = null
    restValue = null
    soundButton?.remove()
    soundButton = null
    settings.hidden = screen === 'login'
    signIn.hidden = screen !== 'home'
    const view = screen === 'home' ? [home()]
      : screen === 'training' ? trainingView()
        : screen === 'result' ? [resultView()]
          : screen === 'settings' ? settingsView() : [login()]
    main.replaceChildren(...view, status)
    main.querySelectorAll('h2').forEach(heading => heading.tabIndex = -1)
    updateStatus()
    updateTime()
  }

  function updateTime() {
    if (training.tick() && screen === 'training') {
      render()
      return
    }
    if (board && training.snapshot().draft?.phase === 'active') refreshBoard()
    if (restValue) {
      const total = Math.ceil(training.snapshot().rest / 1000)
      restValue.textContent = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    }
  }

  render()
  const ticker = setInterval(updateTime, 32)
  document.addEventListener('visibilitychange', updateTime)
  window.addEventListener('pageshow', updateTime)
  return () => {
    clearInterval(ticker)
    document.removeEventListener('visibilitychange', updateTime)
    window.removeEventListener('pageshow', updateTime)
    root.remove()
  }
}

const target = document.querySelector('#app')
if (target) mountSideSteps(target)
