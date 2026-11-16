export const version = '0.1.0'

let nextId = 0
const uniqueId = name => `ssui-${name}-${++nextId}`

function element(tag, className, content) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (content != null) node.append(content instanceof Node ? content : String(content))
  return node
}

export function shell({ title, actions = [], content }) {
  const root = element('div', 'ssui')
  const header = element('header', 'ssui-header')
  header.append(element('h1', 'ssui-title', title))
  if (actions.length) {
    const group = element('div', 'ssui-actions')
    group.append(...actions)
    header.append(group)
  }
  const main = element('main', 'ssui-main', content)
  root.append(header, main)
  return { root, main }
}

export function panel({ title, content = [] } = {}) {
  const root = element('section', 'ssui-panel')
  if (title) root.append(element('h2', 'ssui-panel-title', title))
  root.append(...content)
  return root
}

export function button({ label, variant = 'primary', onClick, disabled = false }) {
  const root = element('button', 'ssui-button', label)
  root.type = 'button'
  root.dataset.variant = variant
  root.disabled = disabled
  if (onClick) root.addEventListener('click', onClick)
  return root
}

export function choice({ label, options, value, onChange, disabled = false }) {
  const root = element('label', 'ssui-field', element('span', 'ssui-label', label))
  const control = element('select', 'ssui-select')
  for (const option of options) {
    const item = element('option', '', option.label)
    item.value = option.value
    item.disabled = Boolean(option.disabled)
    control.append(item)
  }
  if (value != null) control.value = value
  control.disabled = disabled
  if (onChange) control.addEventListener('change', () => onChange(control.value))
  root.append(control)
  return { root, control }
}

export function tabs({ label, items, selected = items[0]?.id, onChange }) {
  const root = element('div', 'ssui-tabs')
  const list = element('div', 'ssui-tab-list')
  list.setAttribute('role', 'tablist')
  list.setAttribute('aria-label', label)
  root.append(list)
  let current
  const entries = items.map(({ id, label, content }) => {
    const tab = element('button', 'ssui-tab', label)
    tab.type = 'button'
    tab.id = uniqueId('tab')
    tab.setAttribute('role', 'tab')
    const pane = element('div', 'ssui-tab-panel', content)
    pane.id = uniqueId('tabpanel')
    pane.tabIndex = 0
    pane.setAttribute('role', 'tabpanel')
    pane.setAttribute('aria-labelledby', tab.id)
    tab.setAttribute('aria-controls', pane.id)
    tab.addEventListener('click', () => select(id))
    list.append(tab)
    root.append(pane)
    return { id, tab, pane }
  })

  function select(id, { focus = false, notify = true } = {}) {
    const active = entries.find(entry => entry.id === id)
    if (!active) return false
    const changed = current !== id
    current = id
    for (const entry of entries) {
      const isActive = entry === active
      entry.tab.setAttribute('aria-selected', String(isActive))
      entry.tab.tabIndex = isActive ? 0 : -1
      entry.pane.hidden = !isActive
    }
    if (focus) active.tab.focus()
    if (changed && notify) onChange?.(id)
    return true
  }

  list.addEventListener('keydown', event => {
    const index = entries.findIndex(entry => entry.tab === event.target)
    if (index < 0) return
    const destinations = {
      ArrowLeft: (index + entries.length - 1) % entries.length,
      ArrowRight: (index + 1) % entries.length,
      Home: 0,
      End: entries.length - 1,
    }
    if (!(event.key in destinations)) return
    event.preventDefault()
    select(entries[destinations[event.key]].id, { focus: true })
  })
  if (!select(selected, { notify: false }) && entries.length) {
    select(entries[0].id, { notify: false })
  }
  return { root, select }
}

export function scoreboard(initial = {}) {
  const root = element('button', 'ssui-board')
  root.type = 'button'
  const label = element('span', 'ssui-board-label')
  const value = element('span', 'ssui-board-value')
  const detail = element('span', 'ssui-board-detail')
  root.append(label, value, detail)
  let flashTimer
  if (initial.onAction) root.addEventListener('click', initial.onAction)

  function update(state) {
    if ('value' in state) value.textContent = state.value ?? ''
    if ('label' in state) label.textContent = state.label ?? ''
    if ('detail' in state) detail.textContent = state.detail ?? ''
    if ('disabled' in state) root.disabled = Boolean(state.disabled)
    if ('actionLabel' in state) {
      if (state.actionLabel) root.setAttribute('aria-label', state.actionLabel)
      else root.removeAttribute('aria-label')
    }
    label.hidden = !label.textContent
    detail.hidden = !detail.textContent
  }

  function flash(duration = 190) {
    clearTimeout(flashTimer)
    root.dataset.feedback = 'accepted'
    flashTimer = setTimeout(() => { delete root.dataset.feedback }, duration)
  }

  update(initial)
  return { root, update, flash }
}

export function disclosure({ label, content, open = false }) {
  const root = element('details', 'ssui-disclosure')
  root.open = open
  root.append(
    element('summary', '', label),
    element('div', 'ssui-disclosure-content', content),
  )
  return root
}

export function resultCard({ title, value, detail, details, detailsLabel = 'Подробнее' }) {
  const root = element('article', 'ssui-card')
  root.append(element('h3', 'ssui-card-title', title))
  if (value != null) root.append(element('p', 'ssui-card-value', value))
  if (detail) root.append(element('p', 'ssui-muted', detail))
  if (details != null) root.append(disclosure({ label: detailsLabel, content: details }))
  return root
}

const defaultFormat = new Intl.NumberFormat('ru', { maximumFractionDigits: 2 })
const tickFormat = new Intl.NumberFormat('ru', { maximumSignificantDigits: 6 })

export function progressChart({
  label, points = [], reference, align = 'end',
  emptyLabel = 'Пока нет результатов', format = value => defaultFormat.format(value),
}) {
  const figure = element('figure', 'ssui-chart')
  figure.append(element('figcaption', 'ssui-chart-title', label))
  if (points.length === 0) {
    figure.append(element('p', 'ssui-muted', emptyLabel))
    return figure
  }

  const plot = element('div', 'ssui-chart-frame')
  const scale = element('div', 'ssui-chart-scale')
  scale.setAttribute('aria-hidden', 'true')
  const scroller = element('div', 'ssui-chart-scroll')
  scroller.tabIndex = 0
  scroller.setAttribute('role', 'region')
  scroller.setAttribute('aria-label', label)
  const bars = element('ol', 'ssui-chart-bars')
  const maximum = points.reduce((max, point) => Math.max(max, point.value), Math.max(0, reference?.value ?? 0)) || 1

  for (let index = 4; index >= 0; index -= 1) {
    scale.append(element('span', '', tickFormat.format(maximum * (index / 4))))
  }
  for (const point of points) {
    const entry = element('li', 'ssui-chart-point')
    const track = element('div', 'ssui-chart-track')
    const column = element('div', 'ssui-chart-column')
    const height = Math.max(0, point.value) / maximum
    column.dataset.highlighted = String(Boolean(point.highlighted))
    column.style.setProperty('--ssui-bar-height', `${height * 100}%`)
    track.append(column)
    const shownValue = point.highlighted ? `★ ${format(point.value)}` : format(point.value)
    const value = element('span', 'ssui-chart-value', shownValue)
    value.style.setProperty('--ssui-bar-remainder', String(1 - height))
    entry.append(track, value, element('span', 'ssui-chart-caption', point.label))
    bars.append(entry)
  }
  if (reference) {
    bars.classList.add('ssui-chart-has-reference')
    bars.style.setProperty('--ssui-reference-remainder', String(1 - Math.max(0, reference.value) / maximum))
  }
  scroller.append(bars)
  plot.append(scale, scroller)
  figure.append(plot)
  if (reference) figure.append(element('p', 'ssui-chart-reference', `${reference.label} · ${format(reference.value)}`))
  if (align === 'end') {
    const observer = new ResizeObserver(() => {
      if (!scroller.clientWidth) return
      scroller.scrollLeft = scroller.scrollWidth
      observer.disconnect()
    })
    observer.observe(scroller)
  }
  return figure
}
