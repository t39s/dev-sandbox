# Owner acceptance checklist — ttScore 0.4.0 + ttscore_team 0.9.0 RC9

## Deployment over RC8

1. Keep the currently published RC8/RC6 Firebase Database Rules unchanged.
2. Replace:
   - `ttScore_0.4.0.html`
   - `team/assets/0.9.0/team-integration-contract.mjs`
   - `team/assets/0.9.0/ttscore-team-adapter.mjs`
3. `team/assets/0.9.0/firebase-source.mjs` does not change.
4. Hard reload the `ttScore` page used for acceptance.

## A. Normal finalization

1. Open the current Team assignment in `ttScore`.
2. Complete the individual match.
3. Confirm `Новая встреча → Начать новую встречу`.
4. Expected: Team score changes once, completed match becomes `finished`, next planned match becomes `current`.
5. No `Перечитать Team` should be needed when no external change occurred.

## B. External stale-conflict and explicit recovery — required RC9 scenario

1. Start current individual match `№1` in `ttScore`.
2. In `ttscore_team` editor, reorder only future `planned` matches, for example `№2 ↔ №3`, and publish.
3. Return to `ttScore` and finish `№1`.
4. Confirm `Новая встреча → Начать новую встречу`.
5. Expected first response: result remains local and Team write is blocked because assignment/revision changed.
6. Press `Перечитать Team` in `ttScore`.
7. Expected recovery without leaving `ttScore`:
   - pending result is applied exactly once;
   - `№1` becomes `finished`;
   - Team score changes;
   - the first match in the administrator's new planned order becomes `current`;
   - next assignment is prefilled in `ttScore`.

## C. External conflict remains fail-closed

Use two independent writers loaded from the same Team state. Publish from writer A, then attempt a stale write from writer B. Writer B must be rejected and must not overwrite A.

## D. Existing regressions

- create Team match still produces `_writeRevision: 1`;
- administrative reorder increments `_writeRevision`;
- realtime editor receives clean external changes without page reload;
- same-client Live-clear + finished transition does not produce a false conflict;
- autonomous `ttScore` scoring remains functional.

RC9 is not an accepted baseline until explicit owner acceptance.
