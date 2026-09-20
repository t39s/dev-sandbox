# 2x2 0.1.0-rc.3

Acceptance candidate статического веб-приложения для тренировки устного счёта по архитектурному заданию `2x2_architecture_1.0.0-draft.1.md`.

Исходный baseline перед разработкой: `t39s/2x2`, branch `gh-pages`, commit `7da35e81e484051f0b9bb4936cc55190bf34023d`. Репозиторий и внешняя публикация этой работой не изменялись.

## Запуск

Нужен HTTP(S), `file://` не является целевой средой.

```bash
python3 -m http.server 8080
```

Открыть `http://localhost:8080/index.htm`.

## Состав продукта

- `index.htm`, `styles.css`, `core.js`, `app.js` — статический runtime;
- `data/templates.json` — 8 исторических уровней / 64 фиксированных задания;
- `data/demo-templates.json` — отдельный генерируемый набор;
- `schema/2x2-templates.schema.json` — JSON Schema Draft 2020-12;
- `tests/` — core, Chromium E2E, performance и сохранённые фактические результаты;
- `RUNTIME_REVIEW.md` — стабилизационное ревью;
- `TEST_RESULTS.md` — сводка проверок;
- `KNOWN_ISSUES.md` — остаточные ограничения RC;
- `ACCEPTANCE_IPHONE.md` — обязательная физическая приёмка до final;
- `RELEASE_NOTES.md`, `VERSION.txt`, `MANIFEST_SHA256.txt` — release metadata;
- `docs/2x2_architecture_1.0.0-draft.1.md` — исходное архитектурное задание.

## Текущее состояние

- Core: **22/22 PASS**.
- Chromium E2E: **14/14 PASS**.
- JSON Schema: stock/demo **PASS**.
- Static safety / HTTP smoke: **PASS**.
- Desktop Chromium max-pool measurement выполнен.
- Physical Safari/iPhone: **PENDING**.

Статус: **RC READY FOR OWNER DEVICE ACCEPTANCE**, не финальный release.

## Основные свойства

2x2 Templates v1 использует JSON как формат хранения и ограниченный арифметический DSL с AST. `eval`/`Function` не используются. Поддерживаются integer variables/derived/constraints, `+ - * / %`, скобки, exact division, expression или prompt+answer, конечные пулы, дедупликация и selection without replacement.

Session controller не перезагружает страницу между ответами. Сохраняются конкретные задания, input и результаты; reload/background делают сеанс interrupted, поэтому он не открывает следующий уровень. Импорт `.json` двухфазный: validate/preview → явное «Использовать набор»; preview примеров сохранён, но свернут под спойлером по умолчанию; плохой файл не заменяет рабочий.

Мобильный practice UI имеет цифровую клавиатуру с `±`, `0`, `⌫`, аппаратные keyboard actions и safe-area-aware portrait layout. Для короткого arithmetic scenario автоматизированно проверены 320/375/390/430 × 568 CSS px.

## Команды проверки

```bash
node tests/core.test.js
python3 tests/browser_e2e.py
python3 tests/browser_performance.py
node tests/performance.test.js
```

`browser_e2e.py` требует Python Playwright и Chromium. В текущей execution environment local browser navigation заблокирован, поэтому harness инъецирует те же static assets в Chromium; это ограничение явно отражено в `TEST_RESULTS.md`.

Перед использованием как final release выполнить `ACCEPTANCE_IPHONE.md` и закрыть/принять пункты `KNOWN_ISSUES.md`.
