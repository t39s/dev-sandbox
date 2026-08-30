# UI/UX review — ttt 0.2.0

## Scope

Reviewed the current single-screen game flow:

- entry state;
- score panel;
- player move;
- automatic algorithm response;
- game result;
- new game;
- score reset;
- keyboard/screen-reader feedback;
- narrow-screen behavior.

## Summary

The interface is structurally simple and readable, with large targets and a clear board. The main UX weakness is not layout but **state communication**: automatic moves happen too abruptly and the destructive score reset has no safety boundary.

## Findings

### HIGH — Algorithm turn is not perceptible

In `0.2.0`, a human move and the Minimax response are applied inside the same event handler before the UI is rendered. The code contains the status `Ход алгоритма (O)`, but users effectively never see or hear it.

Impact:

- the causal sequence “my move → algorithm move” is harder to follow;
- users must visually search the board to identify what changed;
- the `aria-live` region cannot communicate the algorithm turn;
- the interface feels instantaneous rather than interactive.

Fix in `0.2.1`:

- render immediately after the human move;
- show `Алгоритм думает…`;
- lock the board while the algorithm owns the turn;
- execute the algorithm response after a short 350 ms delay;
- cancel a pending algorithm move when `Новая игра` is pressed.

### HIGH — Score reset is destructive and immediate

`Сбросить счёт` is adjacent to the primary action and permanently removes the series result in one click/tap.

Impact:

- accidental taps lose data without recovery;
- the destructive action has the same interaction depth as normal navigation;
- the button remains actionable even at `0 / 0 / 0`.

Fix in `0.2.1`:

- add an inline two-step confirmation;
- move keyboard focus into the confirmation;
- support explicit cancel with focus restoration;
- disable reset when the score is already zero.

### MEDIUM — Algorithm response is visually hard to locate

`X` and `O` have the same visual treatment, and no cell identifies the most recent move. After an automatic response, the user has to compare the whole board.

Selected improvement in `0.2.1`:

**Move traceability**

- `X` and `O` receive distinct high-contrast text colors;
- the latest move receives an inset highlight;
- the accessible cell label includes `последний ход`.

This is intentionally not implemented using color alone: the symbols remain different and the last move has a non-color border treatment.

### LOW — Motion preference was not considered

Hover scaling is decorative and the new thinking indicator introduces animation.

Fix in `0.2.1`:

- add `prefers-reduced-motion: reduce`;
- remove hover transform and animated dots when reduced motion is requested.

## What remains acceptable

- 3×3 board targets are substantially larger than minimum touch-target guidance.
- Score hierarchy is compact and understandable.
- `Новая игра` remains the correct primary action.
- The layout already wraps actions on narrow screens.
- Winner highlighting is redundant with textual status, so it does not rely on color alone.

## Release decision

After the fixes above, no blocking UI/UX defects remain for the current product scope.

## Проверка после реализации

- Все JavaScript-файлы проходят синтаксическую проверку.
- Полный набор автоматических тестов: **27/27 успешно**.
- Отдельные интеграционные тесты подтверждают исправление обоих дефектов высокого приоритета.
- После реализации новых блокирующих или высокоприоритетных UI/UX-дефектов не обнаружено.
