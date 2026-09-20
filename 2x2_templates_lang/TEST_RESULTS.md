# Test results — 2x2 0.1.0-rc.1

Дата: 2026-09-19.

## Source baseline

- Repository: `t39s/2x2`
- Branch: `gh-pages`
- Commit verified before implementation: `7da35e81e484051f0b9bb4936cc55190bf34023d`
- Repository/publication modified by this work: **no**

## Core tests

`node tests/core.test.js` → **22 passed, 0 failed**.

Покрыты: все 64 legacy expressions, приоритеты и скобки, exact division / remainder, границы диапазонов, out-of-range literals, unknown fields/names, cycles, duplicate values, 36 пар addition-over-ten, division pool, empty/short pools, cross-template warning и cancellation 100k pool.

## Chromium E2E

`python3 tests/browser_e2e.py` → **13 passed, 0 failed**.

Покрыты:

- загрузка stock set / 8 levels;
- полный успешный уровень → report → unlock следующего;
- demo generator в UI;
- отмена большой подготовки и повторный start;
- явный режим без storage;
- экранная и hardware keyboard, zero/backspace/sign, отрицательный ответ, repeat Enter;
- reload during answer;
- reload during feedback без duplicate result;
- visibility hidden → interrupted;
- inclusive threshold boundaries и fail при превышении на 1 ms;
- двухфазный import и сохранение активного набора при bad JSON;
- HTML input как text, без DOM execution;
- размеры 320/375/390/430 × 568: no horizontal scroll, keypad ≥56×56 CSS px, короткий practice screen помещается без vertical scroll.

Ограничение среды: Chromium navigation к localhost/file URLs административно заблокирован. E2E использует настоящий Chromium, неизменённые `core.js/app.js/styles.css/index` и test doubles для static fetch/localStorage. Отдельный HTTP smoke ниже проверяет реальную статическую отдачу.

## JSON Schema

Python `jsonschema`, Draft 2020-12:

- `data/templates.json` — PASS
- `data/demo-templates.json` — PASS

## Static safety

- `node -c core.js` — PASS
- `node -c app.js` — PASS
- runtime `eval()` / `Function()` — отсутствуют
- CSP присутствует; runtime scripts внешние — PASS
- imported text XSS scenario — PASS в Chromium E2E

## HTTP smoke

Локальный static server + `curl`:

- `index.htm` — HTTP 200
- `data/templates.json` — HTTP 200

## Performance — не iPhone

Headless Chromium 144.0.7559.96 на текущей среде:

- 100 000 combinations pool: **499.9 ms**
- level with 500 000 source combinations: **2728.4 ms**
- timer ticks during run: **789**
- maximum observed timer gap: **20.7 ms**

Node v22.16.0 reference measurement:

- 100k pool: **259.5 ms**
- 500k level: **1287.7 ms**
- process RSS after run: **266 MiB**

Эти числа не переносятся на iPhone как performance claim. Они подтверждают выполнимость лимитов и периодическую уступку event loop в desktop Chromium; целевое устройство остаётся обязательной приёмкой.

## Physical device

Real Safari/iPhone: **NOT EXECUTED**. См. `ACCEPTANCE_IPHONE.md` и `KNOWN_ISSUES.md`.
