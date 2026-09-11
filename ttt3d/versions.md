# История версий ttt_3d

## 0.2.1

Практический quality-cycle Strategic 3D.

- randomized self-play harness;
- systematic tactical suite;
- opening symmetry-orbit probe;
- исправлен HIGH latency defect позднего Alpha–Beta;
- разделены root tactical ordering и cheap internal ordering;
- добавлен deterministic node budget;
- Chromium Strategic response smoke passed.

Финальное решение цикла: `STOP`.

## 0.2.0

Добавлен второй режим:

**Strategic 3D / Qubic — 4×4×4 / 4 подряд.**

Classic 3D `3×3×3 / 3` сохранён.

Архитектура обобщена:

- modes catalog;
- generic N×N×N / K game model;
- strategy router;
- dynamic layer UI;
- score per mode.

Статус: релиз. Финальное решение цикла — `STOP`.

Проверка: **20/20 tests**, Chromium mobile structural smoke passed.

## 0.1.0

Первая версия `3×3×3 / 3`.
