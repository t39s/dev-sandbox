# Release notes — 2x2 0.1.0-rc.1

`0.1.0-rc.1` — первый acceptance candidate после архитектурного прототипа 2x2 Templates v1.

## Что входит

- статическое приложение с точкой входа `index.htm`;
- 8 исторических уровней / 64 исходных выражения как regression-preserved stock set;
- отдельный демонстрационный генеративный набор;
- JSON import, schema artifact, semantic validation;
- AST parser/interpreter без исполнения JavaScript-строк;
- конечные пулы, constraints, derived, exact integer division, deduplication и выбор без возвращения;
- session/progress persistence, interrupted-session semantics;
- мобильная клавиатура и адаптивная портретная компоновка;
- acceptance/test комплект.

## Стабилизация относительно прототипа

Исправлены reload-during-feedback duplicate result, гонки preview/prepare, retry после отмены, диапазон исходных литералов, предупреждения cross-template duplicates и обработка недоступного storage. Усилены session validation, UTF-8 import и CSP.

## Статус

Internal automated checks: PASS. Physical Safari/iPhone acceptance: PENDING. Это RC, не финальный release.
