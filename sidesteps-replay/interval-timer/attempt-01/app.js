import { button, choice, panel, resultCard, scoreboard, shell } from './ui/components.js'

const title = 'Таймер интервалов'
const durations = [10, 20, 30]

function format(seconds) {
  return `00:${String(seconds).padStart(2, '0')}`
}

export function mountTimer(target, {
  now = () => Date.now(),
  schedule = (callback, delay) => window.setTimeout(callback, delay),
  unschedule = id => window.clearTimeout(id),
} = {}) {
  let duration = 20
  let deadline = null
  let updateId = null

  const { root, main } = shell({ title })
  const status = document.createElement('div')
  status.className = 'app-announcement'
  status.setAttribute('role', 'status')

  const selector = choice({
    label: 'Длительность',
    value: String(duration),
    options: durations.map(value => ({ value: String(value), label: `${value} секунд` })),
    onChange(value) {
      if (deadline !== null) return
      duration = Number(value)
      board.update({ value: format(duration) })
    },
  })

  const board = scoreboard({ onAction: start })
  const cancel = button({ label: 'Отменить', variant: 'secondary', onClick: () => setup(true) })
  const controls = panel({ content: [selector.root, board.root, cancel] })

  function stopUpdate() {
    if (updateId !== null) unschedule(updateId)
    updateId = null
  }

  function setup(focus = false) {
    stopUpdate()
    deadline = null
    selector.control.value = String(duration)
    selector.control.disabled = false
    cancel.hidden = true
    delete board.root.dataset.feedback
    status.textContent = ''
    board.update({ label: 'Длительность интервала', value: format(duration), detail: 'Коснись для старта', actionLabel: 'Начать отсчёт' })
    if (controls.parentNode !== main) main.replaceChildren(controls, status)
    if (focus) board.root.focus({ preventScroll: true })
  }

  function complete() {
    const focusWasInside = controls.contains(document.activeElement)
    deadline = null
    const next = button({ label: 'Новый интервал', onClick: () => setup(true) })
    main.replaceChildren(panel({
      content: [resultCard({ title: 'Интервал завершён', value: `${duration} секунд` }), next],
    }), status)
    status.textContent = `Интервал завершён, ${duration} секунд`
    if (focusWasInside) next.focus({ preventScroll: true })
  }

  function refresh() {
    stopUpdate()
    if (deadline === null) return
    const remaining = deadline - now()
    if (remaining <= 0) {
      complete()
      return
    }
    const seconds = Math.ceil(remaining / 1000)
    board.update({ value: format(seconds) })
    updateId = schedule(refresh, remaining - (seconds - 1) * 1000)
  }

  function start() {
    if (deadline !== null || controls.parentNode !== main) return
    deadline = now() + duration * 1000
    selector.control.disabled = true
    cancel.hidden = false
    board.update({ label: 'Осталось', detail: '', actionLabel: 'Осталось: активный отсчёт' })
    board.flash()
    refresh()
  }

  document.addEventListener('visibilitychange', refresh)
  window.addEventListener('pageshow', refresh)
  target.replaceChildren(root)
  setup()
  return () => {
    stopUpdate()
    document.removeEventListener('visibilitychange', refresh)
    window.removeEventListener('pageshow', refresh)
    root.remove()
  }
}

const target = document.querySelector('#app')
if (target) mountTimer(target)
